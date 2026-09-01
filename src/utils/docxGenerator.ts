import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ImageRun,
  WidthType,
  ShadingType,
  Header,
  Footer,
  Packer,
  PageNumber,
  NumberFormat,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType,
  FrameAnchorType,
  FrameWrap,
  LineRuleType,
  VerticalAlign,
  TableAnchorType,
  RelativeVerticalPosition,
  OverlapType,
} from 'docx';
import { MetadataHeader, ProposalSection, UploadedImage, DocumentTable, getEffectiveTitles, getOperativoSectionOrder, COVER_SCOPE_MAX_ITEMS, getEffectiveCommercialPage, formatUsd, parseCommercialNumber, resolvePage2LogoDataUrl, getSubsections, subsectionHasContent, sectionHasBodyOrSubs, NestedSectionField, getOperativeStepLevel, getOperativeStepLabels } from '../types';
import { getAdvansysBannerSvg, getCoverInfoCardSvg } from '../data/banner';
import { formatFechaEs } from './dateFormat';
import { fitImageSize } from './imageLayout';
import { createDocxImageBlock } from './imageDocx';
import { prepareImageForDocx, DocxRasterType } from './imageExport';

type ProcessedImage = UploadedImage & {
  index: number;
  bytes: Uint8Array;
  width: number;
  height: number;
  docxType: DocxRasterType;
};

// Advansys Corporate Palette
const COLOR_PRIMARY_BLUE = '0A3D62'; // #0A3D62 Deep Corporate Blue
const COLOR_SECONDARY_BLUE = '1E5F8A'; // #1E5F8A Tech Blue Accent
const COLOR_ACCENT_GREEN = '2ECC71'; // #2ECC71 Advansys Emerald Green
const COLOR_TEXT_DARK = '1E293B'; // #1E293B Slate Dark
const COLOR_MUTED_GRAY = '64748B'; // #64748B Slate Muted
const COLOR_BORDER = 'CBD5E1';
function fitLogoSize(srcW: number | undefined, srcH: number | undefined, maxW: number, maxH: number) {
  const w = srcW && srcW > 0 ? srcW : maxW;
  const h = srcH && srcH > 0 ? srcH : maxH;
  const scale = Math.min(maxW / w, maxH / h, 1);
  return {
    width: Math.max(16, Math.round(w * scale)),
    height: Math.max(12, Math.round(h * scale)),
  };
}

/**
 * Builds a styled section heading paragraph for Advansys document
 */
function createSectionHeader(title: string, sectionNumber?: string, pageBreakBefore = false): Paragraph {
  return new Paragraph({
    text: '',
    heading: HeadingLevel.HEADING_2,
    pageBreakBefore,
    spacing: { before: 360, after: 180, line: 360, lineRule: LineRuleType.AUTO },
    border: {
      bottom: {
        color: COLOR_ACCENT_GREEN,
        space: 6,
        style: BorderStyle.SINGLE,
        size: 16, // Thick green accent line under heading
      }
    },
    children: [
      ...(sectionNumber ? [
        new TextRun({
          text: `${sectionNumber}. `,
          bold: true,
          color: COLOR_ACCENT_GREEN,
          size: 28, // 14pt
          font: 'Calibri',
        })
      ] : []),
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        color: COLOR_PRIMARY_BLUE,
        size: 28, // 14pt
        font: 'Calibri',
      })
    ]
  });
}

function createSubsectionHeader(sectionNumber: string, index: number, title: string): Paragraph {
  const label = title.trim() || `Subsección ${index}`;
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 220, after: 80 },
    children: [
      new TextRun({
        text: `${sectionNumber}.${index}  `,
        bold: true,
        color: COLOR_ACCENT_GREEN,
        size: 22,
        font: 'Calibri',
      }),
      new TextRun({
        text: label,
        bold: true,
        color: COLOR_PRIMARY_BLUE,
        size: 22,
        font: 'Calibri',
      }),
    ],
  });
}

// Helper cell generator function with precise width in dxa (twips)
function CellWrapper({
  label,
  value,
  widthDxa,
  colSpan = 1,
}: {
  label: string;
  value: string;
  widthDxa: number;
  colSpan?: number;
}): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    columnSpan: colSpan,
    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0, line: 240 },
        children: [
          new TextRun({
            text: label + ': ',
            bold: true,
            color: COLOR_PRIMARY_BLUE,
            size: 18, // 9pt
            font: 'Calibri',
          }),
          new TextRun({
            text: value || 'N/A',
            color: COLOR_TEXT_DARK,
            size: 19, // 9.5pt
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates the metadata table block matching the exact 6-column modular grid
 * Total available width on standard Letter/A4 is ~9520 dxa (11920 total - 2400 margins).
 */
function createMetadataTable(metadata: MetadataHeader): Table {
  const TOTAL_TABLE_DXA = 9520; // 9520 dxa = ~6.61 inches = full content width between 1200 dxa margins
  const UNIT_6 = Math.floor(TOTAL_TABLE_DXA / 6); // 1586 dxa per 1/6 column
  const COL_HALF = UNIT_6 * 3; // 4760 dxa (50%)
  const COL_THIRD = Math.floor(TOTAL_TABLE_DXA / 3); // 3173 dxa (33.3%)
  const COL_THIRD_LAST = TOTAL_TABLE_DXA - COL_THIRD * 2; // Exact remainder to prevent 1px gap

  return new Table({
    width: { size: TOTAL_TABLE_DXA, type: WidthType.DXA },
    columnWidths: [UNIT_6, UNIT_6, UNIT_6, UNIT_6, UNIT_6, TOTAL_TABLE_DXA - UNIT_6 * 5],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    },
    rows: [
      // Fila 1: CLIENTE (50%) | FECHA (50%)
      new TableRow({
        children: [
          CellWrapper({
            label: 'CLIENTE',
            value: metadata.cliente || 'N/A',
            widthDxa: COL_HALF,
            colSpan: 3,
          }),
          CellWrapper({
            label: 'FECHA',
            value: metadata.fecha || new Date().toISOString().split('T')[0],
            widthDxa: TOTAL_TABLE_DXA - COL_HALF,
            colSpan: 3,
          }),
        ],
      }),
      // Fila 2: TICKET NO. (33.3%) | GUÍA NO. (33.3%) | PROPUESTA Nº (33.3%)
      new TableRow({
        children: [
          CellWrapper({
            label: 'TICKET NO.',
            value: metadata.ticketNo || 'N/A',
            widthDxa: COL_THIRD,
            colSpan: 2,
          }),
          CellWrapper({
            label: 'GUÍA NO.',
            value: metadata.guiaNo || 'N/A',
            widthDxa: COL_THIRD,
            colSpan: 2,
          }),
          CellWrapper({
            label: 'PROPUESTA Nº',
            value: metadata.propuestaNo || 'N/A',
            widthDxa: COL_THIRD_LAST,
            colSpan: 2,
          }),
        ],
      }),
      // Fila 3: PROYECTO (50%) | MÓDULO / APLICACIÓN (50%)
      new TableRow({
        children: [
          CellWrapper({
            label: 'PROYECTO',
            value: metadata.nombreProyecto || 'N/A',
            widthDxa: COL_HALF,
            colSpan: 3,
          }),
          CellWrapper({
            label: 'MÓDULO / APLICACIÓN',
            value: metadata.moduloAplicacion || 'N/A',
            widthDxa: TOTAL_TABLE_DXA - COL_HALF,
            colSpan: 3,
          }),
        ],
      }),
    ],
  });
}

function createContentTable(table: DocumentTable): Table {
  const colCount = Math.max(table.headers.length, 1, ...table.rows.map((r) => r.length));
  const headers = Array.from({ length: colCount }, (_, i) => table.headers[i] || `Columna ${i + 1}`);
  const colPct = Math.floor(100 / colCount);

  const headerRow = new TableRow({
    children: headers.map((h) =>
      new TableCell({
        width: { size: colPct, type: WidthType.PERCENTAGE },
        shading: { fill: COLOR_PRIMARY_BLUE, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: h,
                bold: true,
                color: 'FFFFFF',
                size: 18,
                font: 'Calibri',
              }),
            ],
          }),
        ],
      })
    ),
  });

  const bodyRows = table.rows.map((row, ri) =>
    new TableRow({
      children: headers.map((_, ci) =>
        new TableCell({
          width: { size: colPct, type: WidthType.PERCENTAGE },
          shading: { fill: ri % 2 === 0 ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: row[ci] || '',
                  color: COLOR_TEXT_DARK,
                  size: 18,
                  font: 'Calibri',
                }),
              ],
            }),
          ],
        })
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    },
    rows: [headerRow, ...bodyRows],
  });
}

function parseBoldRuns(text: string, size = 22): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          color: COLOR_TEXT_DARK,
          size,
          font: 'Calibri',
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part,
          color: COLOR_TEXT_DARK,
          size,
          font: 'Calibri',
        })
      );
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text: text, color: COLOR_TEXT_DARK, size, font: 'Calibri' })];
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const CARD_BORDER = { style: BorderStyle.SINGLE, size: 8, color: 'E2E8F0' };

function emptyPara() {
  return new Paragraph({ children: [new TextRun({ text: '', size: 2 })] });
}

function appendSubsections(
  target: (Paragraph | Table)[],
  proposal: ProposalSection,
  field: NestedSectionField,
  sectionNumber: string,
  tables: DocumentTable[],
  used: Set<number>,
  imageMapByIndex?: Map<number, ProcessedImage>
) {
  getSubsections(proposal, field)
    .filter(subsectionHasContent)
    .forEach((sub, i) => {
      target.push(createSubsectionHeader(sectionNumber, i + 1, sub.title));
      if (sub.body?.trim()) {
        pushTextWithTables(target, sub.body.trim(), tables, used, imageMapByIndex);
      }
    });
}

function pushTextWithTables(
  docElements: (Paragraph | Table)[],
  text: string,
  tables: DocumentTable[],
  used: Set<number>,
  imageMapByIndex?: Map<number, ProcessedImage>
) {
  const source = text || '';
  const parts = source.split(/(\[TABLA_\d+\]|\[IMAGEN_\d+\])/gi);
  let wroteSomething = false;

  for (const part of parts) {
    const tableMatch = part.match(/^\[TABLA_(\d+)\]$/i);
    if (tableMatch) {
      const idx = parseInt(tableMatch[1], 10) - 1;
      const table = tables[idx];
      if (!table) continue;
      used.add(idx);
      if (table.title?.trim()) {
        docElements.push(
          new Paragraph({
            spacing: { before: 140, after: 80 },
            children: [
              new TextRun({
                text: table.title.trim(),
                bold: true,
                color: COLOR_PRIMARY_BLUE,
                size: 20,
                font: 'Calibri',
              }),
            ],
          })
        );
      }
      docElements.push(createContentTable(table));
      docElements.push(new Paragraph({ text: '', spacing: { after: 120 } }));
      wroteSomething = true;
      continue;
    }

    const imgMatch = part.match(/^\[IMAGEN_(\d+)\]$/i);
    if (imgMatch && imageMapByIndex) {
      const imgIdx = parseInt(imgMatch[1], 10);
      const linkedImg = imageMapByIndex.get(imgIdx);
      if (linkedImg && linkedImg.bytes && linkedImg.bytes.length > 0) {
        try {
          const size = fitImageSize(linkedImg.width, linkedImg.height, 500, 320, linkedImg.widthPercent);
          docElements.push(...createDocxImageBlock(linkedImg.bytes, size, linkedImg, linkedImg.docxType));
          wroteSomething = true;
          continue;
        } catch (err) {
          console.warn(`Could not render inline image tag ${part}:`, err);
        }
      }
    }

    const rawBlock = part.trim();
    if (!rawBlock) continue;

    // Split paragraphs and lines to detect bulleted lists or numbered lists
    const lines = rawBlock.split('\n');
    let currentParagraphLines: string[] = [];

    const flushCurrentParagraph = () => {
      if (currentParagraphLines.length === 0) return;
      const pText = currentParagraphLines.join(' ').trim();
      if (pText) {
        docElements.push(
          new Paragraph({
            spacing: { before: 60, after: 100 },
            alignment: AlignmentType.BOTH,
            children: parseBoldRuns(pText),
          })
        );
        wroteSomething = true;
      }
      currentParagraphLines = [];
    };

    for (const rawLine of lines) {
      const trimmedLine = rawLine.trim();
      if (!trimmedLine) {
        flushCurrentParagraph();
        continue;
      }

      // Check for bullet point: • or - or *
      const bulletMatch = rawLine.match(/^(\s*)([•\-\*])\s+(.*)$/);
      // Check for numbered item: 1. or 2. etc.
      const numberMatch = rawLine.match(/^(\s*)(\d+)[\.\)]\s+(.*)$/);

      if (bulletMatch) {
        flushCurrentParagraph();
        const indentLevel = 0;
        docElements.push(
          new Paragraph({
            bullet: { level: indentLevel },
            spacing: { before: 40, after: 40 },
            children: parseBoldRuns(bulletMatch[3]),
          })
        );
        wroteSomething = true;
      } else if (numberMatch) {
        flushCurrentParagraph();
        const num = numberMatch[2];
        docElements.push(
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: `${num}. `,
                bold: true,
                color: COLOR_PRIMARY_BLUE,
                size: 22,
                font: 'Calibri',
              }),
              ...parseBoldRuns(numberMatch[3]),
            ],
          })
        );
        wroteSomething = true;
      } else {
        currentParagraphLines.push(trimmedLine);
      }
    }

    flushCurrentParagraph();
  }

  if (!wroteSomething && source.trim()) {
    docElements.push(
      new Paragraph({
        spacing: { before: 80, after: 120 },
        alignment: AlignmentType.BOTH,
        children: parseBoldRuns(source),
      })
    );
  }
}

/**
 * Primary function to generate the complete Word Document (.docx)
 */
export async function generateAdvansysDocx(
  metadata: MetadataHeader,
  proposal: ProposalSection,
  images: UploadedImage[]
): Promise<Blob> {

  // Process image bytes asynchronously
  const processedImages = await Promise.all(
    images.map(async (img, idx) => {
      const imgData = await prepareImageForDocx(img.dataUrl, img.mimeType);
      return {
        ...img,
        index: idx + 1,
        bytes: imgData.data,
        width: imgData.width,
        height: imgData.height,
        docxType: imgData.type,
      };
    })
  );

  // Map image lookups by index
  const imageMapByIndex = new Map<number, typeof processedImages[0]>();
  processedImages.forEach((img) => {
    imageMapByIndex.set(img.index, img);
  });

  // Build document elements list
  const docElements: (Paragraph | Table)[] = [];
  const contentTables = proposal.tables || [];
  const usedTables = new Set<number>();

  // Process banner SVG image and construct full-bleed Page 1 Header
  let firstPageHeader: Header | undefined = undefined;
  let logoBytes: Uint8Array | null = null;
  let logoType: DocxRasterType = 'png';
  if (metadata.logoDataUrl) {
    try {
      const processedLogo = await prepareImageForDocx(metadata.logoDataUrl, metadata.logoMimeType);
      if (processedLogo.data && processedLogo.data.length > 0) {
        logoBytes = processedLogo.data;
        logoType = processedLogo.type;
      }
    } catch (err) {
      console.error('Error processing corporate logo:', err);
    }
  }

  try {
    const titlesForBanner = getEffectiveTitles(metadata.customTitles);
    const bannerSvg = getAdvansysBannerSvg(
      metadata.headerBrandTag || 'ADVANSYS',
      titlesForBanner.coverSubtitle,
      metadata.logoDataUrl,
      {
        coverTitle: titlesForBanner.mainTitle,
        cliente: metadata.cliente,
        fecha: formatFechaEs(metadata.fecha),
        ticketNo: metadata.ticketNo,
        propuestaNo: metadata.propuestaNo,
        showInfoCard: true,
        omitPropuestaValue: true,
      }
    );
    const bannerImgData = await prepareImageForDocx(bannerSvg, 'image/svg+xml');
    if (bannerImgData && bannerImgData.data && bannerImgData.data.length > 0) {
      const firstPageChildren = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              data: bannerImgData.data,
              type: bannerImgData.type,
              transformation: {
                width: 816,
                height: 270,
              },
              floating: {
                horizontalPosition: {
                  relative: HorizontalPositionRelativeFrom.PAGE,
                  offset: 0,
                },
                verticalPosition: {
                  relative: VerticalPositionRelativeFrom.PAGE,
                  offset: 0,
                },
                allowOverlap: true,
                behindDocument: true,
                wrap: {
                  type: TextWrappingType.TOP_AND_BOTTOM,
                },
              },
            }),
          ],
        }),
      ];

      firstPageHeader = new Header({
        children: firstPageChildren,
      });
    }
  } catch (err) {
    console.error('Error rendering cover banner header:', err);
  }

  const titles = getEffectiveTitles(metadata.customTitles);

  // Real Word text (not part of the banner image) so Propuesta No. can be edited in the document
  docElements.push(
    new Paragraph({
      frame: {
        type: 'absolute',
        width: 2900,
        height: 480,
        anchor: {
          horizontal: FrameAnchorType.PAGE,
          vertical: FrameAnchorType.PAGE,
        },
        position: {
          x: 9320,
          y: 2960,
        },
      },
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({
          text: metadata.propuestaNo?.trim() || '—',
          bold: true,
          color: COLOR_PRIMARY_BLUE,
          size: 28,
          font: 'Calibri',
        }),
      ],
    })
  );

  docElements.push(
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [
        new TextRun({
          text: 'PROYECTO',
          bold: true,
          color: COLOR_ACCENT_GREEN,
          size: 18,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: metadata.nombreProyecto || 'Nombre del análisis',
          bold: true,
          color: COLOR_PRIMARY_BLUE,
          size: 36,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 240 },
      children: [
        new TextRun({
          text: metadata.moduloAplicacion || 'Aplicación o módulo',
          bold: true,
          color: COLOR_SECONDARY_BLUE,
          size: 22,
          font: 'Calibri',
        }),
      ],
    })
  );

  // Track page 2 break so first section after sections 1-3 triggers page break
  let page2BreakEmitted = false;
  const getPageBreakForLaterSection = () => {
    if (!page2BreakEmitted) {
      page2BreakEmitted = true;
      return true;
    }
    return false;
  };

  // 1-2. Resumen + Beneficios (two columns)
  const resumenSubs = getSubsections(proposal, 'resumenEjecutivo');
  const hasSection1 =
    !titles.hideSection1 && sectionHasBodyOrSubs(proposal.resumenEjecutivo, resumenSubs);
  const validBeneficios = (proposal.beneficios || []).filter((b) => b && b.trim().length > 0).slice(0, COVER_SCOPE_MAX_ITEMS);
  const hasSection2 = !titles.hideSection2 && validBeneficios.length > 0;

  if (hasSection1 || hasSection2) {
    const leftChildren = hasSection1
      ? [
          new Paragraph({
            spacing: { before: 0, after: 80, line: 360, lineRule: LineRuleType.AUTO },
            border: { bottom: { color: COLOR_ACCENT_GREEN, space: 4, style: BorderStyle.SINGLE, size: 12 } },
            children: [
              new TextRun({
                text: titles.section1.toUpperCase(),
                bold: true,
                color: COLOR_PRIMARY_BLUE,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...(proposal.resumenEjecutivo?.trim()
            ? [
                new Paragraph({
                  spacing: { before: 80, after: 80, line: 276, lineRule: LineRuleType.AUTO },
                  children: parseBoldRuns(proposal.resumenEjecutivo.trim(), 18),
                }),
              ]
            : []),
          ...(() => {
            const extra: (Paragraph | Table)[] = [];
            appendSubsections(extra, proposal, 'resumenEjecutivo', '1', contentTables, usedTables, imageMapByIndex);
            return extra;
          })(),
        ]
      : [new Paragraph({ children: [] })];

    const rightChildren = hasSection2
      ? [
          new Paragraph({
            spacing: { before: 0, after: 80, line: 360, lineRule: LineRuleType.AUTO },
            border: { bottom: { color: COLOR_ACCENT_GREEN, space: 4, style: BorderStyle.SINGLE, size: 12 } },
            children: [
              new TextRun({
                text: titles.section2.toUpperCase(),
                bold: true,
                color: COLOR_PRIMARY_BLUE,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...validBeneficios.map(
            (b) =>
              new Paragraph({
                spacing: { before: 60, after: 40, line: 276, lineRule: LineRuleType.AUTO },
                children: [
                  new TextRun({ text: '✓  ', bold: true, color: COLOR_ACCENT_GREEN, size: 18, font: 'Calibri' }),
                  ...parseBoldRuns(b, 18),
                ],
              })
          ),
        ]
      : [new Paragraph({ children: [] })];

    docElements.push(
      new Table({
        width: { size: 9520, type: WidthType.DXA },
        columnWidths: [4760, 4760],
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 4760, type: WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 0, right: 140 },
                children: leftChildren,
              }),
              new TableCell({
                width: { size: 4760, type: WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 140, right: 0 },
                children: rightChildren,
              }),
            ],
          }),
        ],
      })
    );
  }

  // 3. Alcance, Exclusiones y Entregables — 3-column grid, max 3 items
  const validAlcance = (proposal.alcanceExclusionesEntregables?.alcance || [])
    .filter((i) => i && i.trim().length > 0)
    .slice(0, COVER_SCOPE_MAX_ITEMS);
  const validExclusiones = (proposal.alcanceExclusionesEntregables?.exclusiones || [])
    .filter((i) => i && i.trim().length > 0)
    .slice(0, COVER_SCOPE_MAX_ITEMS);
  const validEntregables = (proposal.alcanceExclusionesEntregables?.entregables || [])
    .filter((i) => i && i.trim().length > 0)
    .slice(0, COVER_SCOPE_MAX_ITEMS);
  const hasSection3_1 = !titles.hideSection3_1 && validAlcance.length > 0;
  const hasSection3_2 = !titles.hideSection3_2 && validExclusiones.length > 0;
  const hasSection3_3 = !titles.hideSection3_3 && validEntregables.length > 0;
  const hasSection3 = !titles.hideSection3 && (hasSection3_1 || hasSection3_2 || hasSection3_3);

  const TOTAL_W = 9520;
  const GAP = 160;

  const spacerCell = () =>
    new TableCell({
      width: { size: GAP, type: WidthType.DXA },
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
      children: [emptyPara()],
    });

  const gridCell = (heading: string, items: string[], color: string, width: number) =>
    new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
      margins: { top: 160, bottom: 160, left: 160, right: 160 },
      borders: {
        top: CARD_BORDER,
        bottom: CARD_BORDER,
        left: CARD_BORDER,
        right: CARD_BORDER,
      },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 120, line: 360, lineRule: LineRuleType.AUTO },
          children: [
            new TextRun({
              text: heading.replace(/^3\.\d\s*/, '').toUpperCase(),
              bold: true,
              color,
              size: 18,
              font: 'Calibri',
            }),
          ],
        }),
        ...(items.length
          ? items.map(
              (item) =>
                new Paragraph({
                  spacing: { before: 60, after: 60, line: 276, lineRule: LineRuleType.AUTO },
                  children: [
                    new TextRun({ text: '•  ', color: COLOR_TEXT_DARK, size: 18, font: 'Calibri' }),
                    ...parseBoldRuns(item.replace(/^[•\-\*]\s+/, ''), 18),
                  ],
                })
            )
          : [emptyPara()]),
      ],
    });

  if (hasSection3) {
    const scopeCards = [
      hasSection3_1 && { heading: titles.section3_1, items: validAlcance, color: COLOR_SECONDARY_BLUE },
      hasSection3_2 && { heading: titles.section3_2, items: validExclusiones, color: COLOR_PRIMARY_BLUE },
      hasSection3_3 && { heading: titles.section3_3, items: validEntregables, color: '047857' },
    ].filter(Boolean) as { heading: string; items: string[]; color: string }[];
    const n = scopeCards.length;
    const cardW = n === 1 ? TOTAL_W : Math.floor((TOTAL_W - GAP * (n - 1)) / n);
    const lastW = n === 1 ? TOTAL_W : TOTAL_W - cardW * (n - 1) - GAP * (n - 1);
    const columnWidths: number[] = [];
    const rowCells: TableCell[] = [];
    scopeCards.forEach((card, i) => {
      if (i > 0) {
        columnWidths.push(GAP);
        rowCells.push(spacerCell());
      }
      const w = i === n - 1 ? lastW : cardW;
      columnWidths.push(w);
      rowCells.push(gridCell(card.heading, card.items, card.color, w));
    });
    docElements.push(createSectionHeader(titles.section3));
    docElements.push(
      new Table({
        width: { size: TOTAL_W, type: WidthType.DXA },
        columnWidths,
        borders: {
          top: NO_BORDER,
          bottom: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
          insideHorizontal: NO_BORDER,
          insideVertical: NO_BORDER,
        },
        rows: [new TableRow({ children: rowCells })],
      })
    );
  }

  if (!titles.hideConfidentiality) {
    docElements.push(
      new Paragraph({
        spacing: { before: 280, after: 80, line: 360, lineRule: LineRuleType.AUTO },
        children: [
          new TextRun({
            text: titles.confidentialityTitle.toUpperCase(),
            bold: true,
            color: COLOR_ACCENT_GREEN,
            size: 22,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 120, line: 276, lineRule: LineRuleType.AUTO },
        children: [
          new TextRun({
            text: titles.confidentialityText,
            color: COLOR_MUTED_GRAY,
            size: 18,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  const commercial = getEffectiveCommercialPage(proposal);
  const commercialElements: (Paragraph | Table)[] = [];
  if (!commercial.hide) {
    const page2LogoUrl = resolvePage2LogoDataUrl(metadata, proposal.commercial);
    let page2LogoBytes: Uint8Array | null = null;
    let page2LogoType: DocxRasterType = 'png';
    let page2LogoSize = { width: 160, height: 44 };
    if (page2LogoUrl) {
      try {
        const prepared = await prepareImageForDocx(page2LogoUrl);
        if (prepared.data?.length) {
          page2LogoBytes = prepared.data;
          page2LogoType = prepared.type;
          page2LogoSize = fitLogoSize(prepared.width, prepared.height, 180, 48);
        }
      } catch (err) {
        console.error('Error processing page 2 logo:', err);
      }
    }

    let page2CardBytes: Uint8Array | null = null;
    let page2CardType: DocxRasterType = 'png';
    const page2CardWidth = 740;
    let page2CardSize = { width: page2CardWidth, height: 109 };
    try {
      const cardSvg = getCoverInfoCardSvg({
        cliente: metadata.cliente,
        fecha: formatFechaEs(metadata.fecha),
        ticketNo: metadata.ticketNo,
        propuestaNo: metadata.propuestaNo,
        omitPropuestaValue: true,
        flushToPageMargin: true,
      });
      const preparedCard = await prepareImageForDocx(cardSvg, 'image/svg+xml');
      if (preparedCard.data?.length) {
        page2CardBytes = preparedCard.data;
        page2CardType = preparedCard.type;
        page2CardSize = {
          width: page2CardWidth,
          height: Math.max(100, Math.round((page2CardWidth * preparedCard.height) / preparedCard.width)),
        };
      }
    } catch (err) {
      console.error('Error processing page 2 info card:', err);
    }

    commercialElements.push(
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: page2LogoBytes
          ? [
              new ImageRun({
                data: page2LogoBytes,
                type: page2LogoType,
                transformation: page2LogoSize,
                altText: { name: 'Logo', title: '', description: '' },
              }),
            ]
          : [new TextRun({ text: metadata.headerBrandTag || 'ADVANSYS', bold: true, color: COLOR_PRIMARY_BLUE, size: 32, font: 'Calibri' })],
      })
    );
    if (page2CardBytes) {
      commercialElements.push(
        new Paragraph({
          spacing: { before: 40, after: 0 },
          children: [
            new ImageRun({
              data: page2CardBytes,
              type: page2CardType,
              transformation: page2CardSize,
              altText: { name: 'Ficha', title: '', description: '' },
            }),
          ],
        }),
        new Paragraph({
          frame: {
            type: 'absolute',
            width: 2400,
            height: 400,
            wrap: FrameWrap.NONE,
            anchor: {
              horizontal: FrameAnchorType.MARGIN,
              vertical: FrameAnchorType.TEXT,
            },
            position: {
              x: 8617, // 15.20 cm from the left margin
              y: -980,
            },
          },
          spacing: { before: 0, after: 200 },
          children: [
            new TextRun({
              text: metadata.propuestaNo?.trim() || '—',
              bold: true,
              color: COLOR_PRIMARY_BLUE,
              size: 28,
              font: 'Calibri',
            }),
          ],
        })
      );
    }

    const moneyRows = commercial.lineItems.map((item) => {
      const hours = parseCommercialNumber(item.hours);
      const unit = parseCommercialNumber(item.unitValue);
      return { item, hours, unit, sub: hours * unit };
    });
    const total = moneyRows.reduce((s, r) => s + r.sub, 0);
    const colDesc = 4200;
    const colH = 1700;
    const colU = 2400;
    const colS = 2700;
    const commercialTableW = colDesc + colH + colU + colS;
    const priceCell = (
      text: string,
      width: number,
      opts?: { bold?: boolean; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; fill?: string }
    ) =>
      new TableCell({
        width: { size: width, type: WidthType.DXA },
        shading: { fill: opts?.fill || 'FFFFFF', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: opts?.align || AlignmentType.LEFT,
            children: [
              new TextRun({
                text,
                bold: opts?.bold,
                color: opts?.color || COLOR_TEXT_DARK,
                size: 18,
                font: 'Calibri',
              }),
            ],
          }),
        ],
      });

    commercialElements.push(
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun({ text: '', size: 2 })] }),
      new Table({
        width: { size: commercialTableW, type: WidthType.DXA },
        columnWidths: [colDesc, colH, colU, colS],
        rows: [
          new TableRow({
            children: [
              priceCell('', colDesc, { fill: COLOR_PRIMARY_BLUE, color: 'FFFFFF', bold: true }),
              priceCell('HORAS', colH, { fill: COLOR_PRIMARY_BLUE, color: 'FFFFFF', bold: true, align: AlignmentType.CENTER }),
              priceCell('VALOR UNITARIO (USD)', colU, { fill: COLOR_PRIMARY_BLUE, color: 'FFFFFF', bold: true, align: AlignmentType.CENTER }),
              priceCell('SUBTOTAL (USD)', colS, { fill: COLOR_PRIMARY_BLUE, color: 'FFFFFF', bold: true, align: AlignmentType.RIGHT }),
            ],
          }),
          ...moneyRows.map((r) =>
            new TableRow({
              children: [
                priceCell(r.item.description || '—', colDesc, { bold: true, color: COLOR_PRIMARY_BLUE, fill: 'F8FAFC' }),
                priceCell(r.hours ? String(r.hours) : '—', colH, { bold: true, color: COLOR_SECONDARY_BLUE, align: AlignmentType.CENTER, fill: 'F8FAFC' }),
                priceCell(r.unit ? formatUsd(r.unit) : '—', colU, { align: AlignmentType.CENTER, fill: 'F8FAFC' }),
                priceCell(r.hours && r.unit ? formatUsd(r.sub) : '—', colS, { bold: true, color: COLOR_PRIMARY_BLUE, align: AlignmentType.RIGHT, fill: 'F8FAFC' }),
              ],
            })
          ),
        ],
      }),
      new Paragraph({ spacing: { before: 360, after: 80 }, children: [new TextRun({ text: '', size: 2 })] }),
      new Table({
        width: { size: commercialTableW, type: WidthType.DXA },
        columnWidths: [3000, commercialTableW - 3000],
        borders: {
          top: NO_BORDER,
          bottom: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
          insideHorizontal: NO_BORDER,
          insideVertical: NO_BORDER,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 3000, type: WidthType.DXA },
                borders: { top: CARD_BORDER, bottom: CARD_BORDER, left: CARD_BORDER, right: CARD_BORDER },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'TOTAL', bold: true, color: COLOR_PRIMARY_BLUE, size: 22, font: 'Calibri' })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: commercialTableW - 3000, type: WidthType.DXA },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: formatUsd(total).replace('USD$', 'US$'),
                        bold: true,
                        color: COLOR_TEXT_DARK,
                        size: 32,
                        font: 'Calibri',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
    if (commercial.itbisExempt) {
      commercialElements.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 60, after: 200 },
          children: [new TextRun({ text: commercial.itbisLabel, bold: true, color: 'DC2626', size: 18, font: 'Calibri' })],
        })
      );
    }

    const condW = Math.round(commercialTableW * 0.58);
    const condGap = 240;
    const stepsW = commercialTableW - condW - condGap;
    const sigColW = Math.round((commercialTableW - condGap) / 2);
    const sigLineW = Math.min(4200, sigColW - 120);
    const makeSignatureBlock = (role: string, org: string) =>
      new Table({
        width: { size: sigLineW, type: WidthType.DXA },
        alignment: AlignmentType.CENTER,
        columnWidths: [sigLineW],
        borders: {
          top: NO_BORDER,
          bottom: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
          insideHorizontal: NO_BORDER,
          insideVertical: NO_BORDER,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: sigLineW, type: WidthType.DXA },
                borders: {
                  top: NO_BORDER,
                  bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY_BLUE },
                  left: NO_BORDER,
                  right: NO_BORDER,
                },
                children: [new Paragraph({ spacing: { before: 40, after: 60 }, children: [new TextRun({ text: '', size: 2 })] })],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: sigLineW, type: WidthType.DXA },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 80, after: 0 },
                    children: [new TextRun({ text: role, bold: true, color: COLOR_PRIMARY_BLUE, size: 18, font: 'Calibri' })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: org, color: COLOR_SECONDARY_BLUE, size: 18, font: 'Calibri' })],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    const condChildren = [
      ...commercial.conditions.map(
        (cond) =>
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: `${cond.title} `, bold: true, color: COLOR_PRIMARY_BLUE, size: 18, font: 'Calibri' }),
              new TextRun({ text: cond.text, color: COLOR_TEXT_DARK, size: 18, font: 'Calibri' }),
            ],
          })
      ),
    ];
    const stepsChildren = commercial.nextSteps.map(
      (step) =>
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '•  ', color: COLOR_PRIMARY_BLUE, size: 18, font: 'Calibri' }),
            ...parseBoldRuns(step, 18),
          ],
        })
    );
    commercialElements.push(
      new Table({
        width: { size: commercialTableW, type: WidthType.DXA },
        columnWidths: [condW, condGap, stepsW],
        borders: {
          top: NO_BORDER,
          bottom: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
          insideHorizontal: NO_BORDER,
          insideVertical: NO_BORDER,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: condW, type: WidthType.DXA },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                children: [
                  new Paragraph({
                    spacing: { after: 120 },
                    children: [new TextRun({ text: commercial.conditionsTitle, bold: true, color: COLOR_PRIMARY_BLUE, size: 20, font: 'Calibri' })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: condGap, type: WidthType.DXA },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                children: [emptyPara()],
              }),
              new TableCell({
                width: { size: stepsW, type: WidthType.DXA },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                children: [
                  new Paragraph({
                    spacing: { after: 120 },
                    children: [new TextRun({ text: commercial.nextStepsTitle, bold: true, color: COLOR_ACCENT_GREEN, size: 20, font: 'Calibri' })],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: condW, type: WidthType.DXA },
                shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                margins: { top: 140, bottom: 140, left: 160, right: 160 },
                children: condChildren,
              }),
              new TableCell({
                width: { size: condGap, type: WidthType.DXA },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                children: [emptyPara()],
              }),
              new TableCell({
                width: { size: stepsW, type: WidthType.DXA },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                children: stepsChildren,
              }),
            ],
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 280, after: 80 },
        children: [new TextRun({ text: commercial.notesTitle, bold: true, color: COLOR_PRIMARY_BLUE, size: 20, font: 'Calibri' })],
      }),
      new Table({
        width: { size: commercialTableW, type: WidthType.DXA },
        borders: {
          top: NO_BORDER,
          bottom: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
          insideHorizontal: NO_BORDER,
          insideVertical: NO_BORDER,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                margins: { top: 120, bottom: 120, left: 160, right: 160 },
                children: [new Paragraph({ children: parseBoldRuns(commercial.notes, 18) })],
              }),
            ],
          }),
        ],
      }),
      new Table({
        width: { size: commercialTableW, type: WidthType.DXA },
        columnWidths: [sigColW, condGap, commercialTableW - sigColW - condGap],
        float: {
          horizontalAnchor: TableAnchorType.MARGIN,
          verticalAnchor: TableAnchorType.MARGIN,
          relativeVerticalPosition: RelativeVerticalPosition.BOTTOM,
          overlap: OverlapType.NEVER,
        },
        borders: {
          top: NO_BORDER,
          bottom: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
          insideHorizontal: NO_BORDER,
          insideVertical: NO_BORDER,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 3,
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                children: [
                  new Paragraph({
                    spacing: { after: 900 },
                    children: [new TextRun({ text: commercial.reviewedByTitle, bold: true, color: COLOR_PRIMARY_BLUE, size: 20, font: 'Calibri' })],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: sigColW, type: WidthType.DXA },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                children: [makeSignatureBlock(commercial.reviewedLeftRole, commercial.reviewedBy.trim() || commercial.reviewedLeftOrg)],
              }),
              new TableCell({
                width: { size: condGap, type: WidthType.DXA },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                children: [emptyPara()],
              }),
              new TableCell({
                width: { size: commercialTableW - sigColW - condGap, type: WidthType.DXA },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                children: [makeSignatureBlock(commercial.reviewedRightRole, commercial.reviewedRightOrg)],
              }),
            ],
          }),
        ],
      })
    );
  }

  if (!commercial.hide) {
    page2BreakEmitted = true;
  }

  const laterElements: (Paragraph | Table)[] = [];

  // 4. Objetivo (Página 3 si existe la página comercial)
  const hasSection4 =
    !titles.hideSection4 && sectionHasBodyOrSubs(proposal.objetivo, getSubsections(proposal, 'objetivo'));
  if (hasSection4) {
    laterElements.push(createSectionHeader(titles.section4, '4', getPageBreakForLaterSection()));
    if (proposal.objetivo?.trim()) {
      pushTextWithTables(laterElements, proposal.objetivo.trim(), contentTables, usedTables, imageMapByIndex);
    }
    appendSubsections(laterElements, proposal, 'objetivo', '4', contentTables, usedTables, imageMapByIndex);
  }

  // 5. Descripción
  const hasSection5 =
    !titles.hideSection5 && sectionHasBodyOrSubs(proposal.descripcion, getSubsections(proposal, 'descripcion'));
  if (hasSection5) {
    laterElements.push(createSectionHeader(titles.section5, '5', getPageBreakForLaterSection()));
    if (proposal.descripcion?.trim()) {
      pushTextWithTables(laterElements, proposal.descripcion.trim(), contentTables, usedTables, imageMapByIndex);
    }
    appendSubsections(laterElements, proposal, 'descripcion', '5', contentTables, usedTables, imageMapByIndex);
  }

  const { analysisFirst, indiceNumber, analisisNumber } = getOperativoSectionOrder(titles);

  const validIndice = (proposal.indiceAnalisisOperativo || []).filter((item) => item && item.trim().length > 0);
  const hasSection6 = !titles.hideSection6 && validIndice.length > 0;
  const pushIndiceSection = () => {
    if (!hasSection6) return;
    laterElements.push(createSectionHeader(titles.section6, indiceNumber, getPageBreakForLaterSection()));
    validIndice.forEach((item, idx) => {
      laterElements.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [
            new TextRun({
              text: `${idx + 1}. `,
              bold: true,
              color: COLOR_PRIMARY_BLUE,
              size: 22,
              font: 'Calibri',
            }),
            new TextRun({
              text: item,
              color: COLOR_TEXT_DARK,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      );
    });
  };

  const validSteps = (proposal.analisisOperativo || []).filter((step, idx) => {
    const hasText =
      (step.titulo && step.titulo.trim().length > 0) ||
      (step.explicacion && step.explicacion.trim().length > 0);
    const hasLinkedImage =
      Boolean(processedImages[idx]?.bytes?.length) ||
      Boolean(step.imagenId && step.imagenId !== 'none' && processedImages.some((img) => img.id === step.imagenId)) ||
      Boolean(step.referenciaImagen && step.referenciaImagen !== 'none');
    return hasText || hasLinkedImage;
  });
  const hasSection7 = !titles.hideSection7 && validSteps.length > 0;

  const pushAnalisisSection = () => {
    if (!hasSection7) return;
    laterElements.push(createSectionHeader(titles.section7, analisisNumber, getPageBreakForLaterSection()));

    const stepLabels = getOperativeStepLabels(validSteps, analisisNumber);
    validSteps.forEach((step, originalIdx) => {
      const stepLabel = stepLabels[originalIdx];
      const stepTitle = step.titulo?.trim() || `Paso ${stepLabel}`;
      const stepLevel = getOperativeStepLevel(step);

      laterElements.push(
        new Paragraph({
          spacing: { before: 180, after: 80 },
          indent: stepLevel > 0 ? { left: 360 * stepLevel } : undefined,
          children: [
            new TextRun({
              text: `Paso ${stepLabel}: ${stepTitle}`,
              bold: true,
              color: COLOR_PRIMARY_BLUE,
              size: 24, // 12pt
              font: 'Calibri',
            }),
          ],
        })
      );

      // Check if image referenced or mapped to step index or explicit imagenId
      let linkedImg: ProcessedImage | null = null;
      const isExplicitNone = step.imagenId === 'none' || step.referenciaImagen === 'none';

      if (!isExplicitNone) {
        if (step.imagenId && step.imagenId !== 'none') {
          linkedImg = processedImages.find(img => img.id === step.imagenId) || null;
        }
        if (!linkedImg && step.referenciaImagen && step.referenciaImagen !== 'none') {
          const m = step.referenciaImagen.match(/\[IMAGEN_(\d+)\]/i);
          if (m) {
            linkedImg = imageMapByIndex.get(parseInt(m[1], 10)) || null;
          } else {
            linkedImg = processedImages.find(img => img.id === step.referenciaImagen) || null;
          }
        }
        if (!linkedImg && step.explicacion) {
          const m = step.explicacion.match(/\[IMAGEN_(\d+)\]/i);
          if (m) {
            linkedImg = imageMapByIndex.get(parseInt(m[1], 10)) || null;
          }
        }
      }

      const explicacionHasSameImage = Boolean(
        linkedImg && step.explicacion && new RegExp(`\\[IMAGEN_${linkedImg.index}\\]`, 'i').test(step.explicacion)
      );

      if (linkedImg && linkedImg.bytes && linkedImg.bytes.length > 0 && !explicacionHasSameImage) {
        try {
          const size = fitImageSize(linkedImg.width, linkedImg.height, 500, 320, linkedImg.widthPercent);
          laterElements.push(...createDocxImageBlock(linkedImg.bytes, size, linkedImg, linkedImg.docxType));
        } catch (e) {
          console.error('Failed to append image to docx:', e);
        }
      }

      // Step Explanation Text
      if (step.explicacion?.trim()) {
        pushTextWithTables(laterElements, step.explicacion.trim(), contentTables, usedTables, imageMapByIndex);
      }
    });
  };

  if (analysisFirst) {
    pushAnalisisSection();
    pushIndiceSection();
  } else {
    pushIndiceSection();
    pushAnalisisSection();
  }

  // Tablas no referenciadas con [TABLA_n] — se agregan antes del descargo
  const unusedTables = contentTables.filter((_, idx) => !usedTables.has(idx));
  if (unusedTables.length > 0) {
    laterElements.push(createSectionHeader('Tablas de apoyo', '', getPageBreakForLaterSection()));
    unusedTables.forEach((table) => {
      if (table.title?.trim()) {
        laterElements.push(
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: table.title.trim(),
                bold: true,
                color: COLOR_PRIMARY_BLUE,
                size: 20,
                font: 'Calibri',
              }),
            ],
          })
        );
      }
      laterElements.push(createContentTable(table));
      laterElements.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    });
  }

  // 8. Descargo / Cláusula de Responsabilidad (Only rendered if user provided descargo text)
  const hasSection8 =
    !titles.hideSection8 && sectionHasBodyOrSubs(proposal.descargo, getSubsections(proposal, 'descargo'));
  if (hasSection8) {
    laterElements.push(createSectionHeader(titles.section8, '8', getPageBreakForLaterSection()));
    if (proposal.descargo?.trim()) {
      pushTextWithTables(laterElements, proposal.descargo.trim(), contentTables, usedTables, imageMapByIndex);
    }
    appendSubsections(laterElements, proposal, 'descargo', '8', contentTables, usedTables, imageMapByIndex);
  }

  laterElements.push(
    new Paragraph({
      spacing: { after: 0 },
      children: [new TextRun({ text: '\u200B' })],
    })
  );

  const PAGE_WIDTH_DXA = 12240;
  const pageMargins = {
    top: 1000,
    bottom: 1000,
    left: 1200,
    right: 1200,
    header: 0,
    footer: 360,
  };

  // Build Advansys Header Banner (full page width, edge to edge)
  const headerLogo = logoBytes
    ? fitLogoSize(metadata.logoWidth, metadata.logoHeight, 64, 22)
    : null;
  const headerLeftInset = pageMargins.left;
  const headerLogoCol = logoBytes && headerLogo ? 1680 : 0;
  const headerTextCol = PAGE_WIDTH_DXA - headerLeftInset - headerLogoCol;

  const headerBarFill = { fill: COLOR_PRIMARY_BLUE, type: ShadingType.CLEAR };

  const header = new Header({
    children: [
      new Table({
        width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
        indent: { size: -pageMargins.left, type: WidthType.DXA },
        columnWidths: headerLogoCol
          ? [headerLeftInset, headerLogoCol, headerTextCol]
          : [headerLeftInset, PAGE_WIDTH_DXA - headerLeftInset],
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_ACCENT_GREEN },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: headerLeftInset, type: WidthType.DXA },
                shading: headerBarFill,
                margins: { top: 60, bottom: 60, left: 0, right: 0 },
                children: [new Paragraph({ children: [] })],
              }),
              ...(logoBytes && headerLogo
                ? [
                    new TableCell({
                      width: { size: headerLogoCol, type: WidthType.DXA },
                      shading: headerBarFill,
                      margins: { top: 60, bottom: 60, left: 0, right: 80 },
                      verticalAlign: 'center' as any,
                      children: [
                        new Paragraph({
                          children: [
                            new ImageRun({
                              data: logoBytes,
                              type: logoType,
                              transformation: {
                                width: headerLogo.width,
                                height: headerLogo.height,
                              },
                            }),
                          ],
                        }),
                      ],
                    }),
                  ]
                : []),
              new TableCell({
                width: { size: headerTextCol, type: WidthType.DXA },
                shading: headerBarFill,
                margins: { top: 100, bottom: 100, left: 80, right: 200 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${(metadata.headerBrandTag || 'ADVANSYS').trim()}  |  `,
                        bold: true,
                        color: 'FFFFFF',
                        size: 22,
                        font: 'Calibri',
                      }),
                      new TextRun({
                        text: (metadata.headerSubtitle || 'DOCUMENTACIÓN TÉCNICA Y ANÁLISIS DE CUMPLIMIENTO').trim(),
                        bold: true,
                        color: COLOR_ACCENT_GREEN,
                        size: 18,
                        font: 'Calibri',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Build Footer
  const footerText = metadata.footerText || 'Advansys SRL';
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `${footerText}  |  Página `,
            color: COLOR_MUTED_GRAY,
            size: 18,
            font: 'Calibri',
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            color: COLOR_PRIMARY_BLUE,
            bold: true,
            size: 18,
            font: 'Calibri',
          }),
          new TextRun({
            text: ' de ',
            color: COLOR_MUTED_GRAY,
            size: 18,
            font: 'Calibri',
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            color: COLOR_PRIMARY_BLUE,
            bold: true,
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });

  const commercialFooter = new Footer({
    children: [
      new Table({
        width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
        indent: { size: -400, type: WidthType.DXA },
        columnWidths: [PAGE_WIDTH_DXA / 4, PAGE_WIDTH_DXA / 4, PAGE_WIDTH_DXA / 4, PAGE_WIDTH_DXA / 4],
        borders: {
          top: NO_BORDER,
          bottom: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
          insideHorizontal: NO_BORDER,
          insideVertical: NO_BORDER,
        },
        rows: [
          new TableRow({
            children: [commercial.footerPhone, commercial.footerEmail, commercial.footerWeb, commercial.footerCity].map(
              (text) =>
                new TableCell({
                  width: { size: PAGE_WIDTH_DXA / 4, type: WidthType.DXA },
                  shading: { fill: COLOR_PRIMARY_BLUE, type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 40, right: 40 },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text, color: 'FFFFFF', size: 16, font: 'Calibri' })],
                    }),
                  ],
                })
            ),
          }),
        ],
      }),
    ],
  });

  const sections: Array<{
    properties: object;
    headers: { first?: Header; default?: Header };
    footers: { default: Footer };
    children: (Paragraph | Table)[];
  }> = [
    {
      properties: {
        titlePage: true,
        page: {
          size: { width: PAGE_WIDTH_DXA, height: 15840 },
          margin: pageMargins,
          pageNumbers: {
            start: 1,
            formatType: NumberFormat.DECIMAL,
          },
        },
      },
      headers: {
        first: firstPageHeader || new Header({ children: [] }),
        default: header,
      },
      footers: {
        default: footer,
      },
      children: commercial.hide ? [...docElements, ...laterElements] : docElements,
    },
  ];

  if (!commercial.hide) {
    sections.push({
      properties: {
        page: {
          size: { width: PAGE_WIDTH_DXA, height: 15840 },
          margin: { ...pageMargins, top: 560, bottom: 1600, left: 400, right: 400, header: 200, footer: 0 },
        },
      },
      headers: {
        default: new Header({ children: [] }),
      },
      footers: {
        default: commercialFooter,
      },
      children: commercialElements.length ? commercialElements : [emptyPara()],
    });
    sections.push({
      properties: {
        page: { size: { width: PAGE_WIDTH_DXA, height: 15840 }, margin: pageMargins },
      },
      headers: { default: header },
      footers: { default: footer },
      children: laterElements,
    });
  }

  const doc = new Document({
    sections,
  });

  // Generate buffer blob
  const buffer = await Packer.toBlob(doc);
  return buffer;
}
