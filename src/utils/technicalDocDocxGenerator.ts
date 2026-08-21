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
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType,
} from 'docx';
import {
  MetadataHeader,
  TechnicalDoc,
  DocumentTable,
  UploadedImage,
  getEffectiveTechnicalTitles,
} from '../types';
import { getAdvansysBannerSvg } from '../data/banner';
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
const COLOR_BORDER = 'CBD5E1'; // #CBD5E1 Slate Border
const COLOR_CODE_BG = '1E293B'; // #1E293B Slate 900 for code box

/**
 * Builds a styled section heading paragraph for Advansys document
 */
function createSectionHeader(title: string, sectionNumber?: string, pageBreakBefore = false): Paragraph {
  return new Paragraph({
    text: '',
    heading: HeadingLevel.HEADING_2,
    pageBreakBefore,
    spacing: { before: 360, after: 180 },
    border: {
      bottom: {
        color: COLOR_ACCENT_GREEN,
        space: 6,
        style: BorderStyle.SINGLE,
        size: 16,
      },
    },
    children: [
      ...(sectionNumber
        ? [
            new TextRun({
              text: `${sectionNumber}. `,
              bold: true,
              color: COLOR_ACCENT_GREEN,
              size: 28, // 14pt
              font: 'Calibri',
            }),
          ]
        : []),
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        color: COLOR_PRIMARY_BLUE,
        size: 28, // 14pt
        font: 'Calibri',
      }),
    ],
  });
}

// Helper cell generator for metadata table
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
 */
function createMetadataTable(metadata: MetadataHeader): Table {
  const TOTAL_TABLE_DXA = 9520;
  const UNIT_6 = Math.floor(TOTAL_TABLE_DXA / 6);
  const COL_HALF = UNIT_6 * 3;
  const COL_THIRD = Math.floor(TOTAL_TABLE_DXA / 3);
  const COL_THIRD_LAST = TOTAL_TABLE_DXA - COL_THIRD * 2;

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
      // Fila 2: TICKET NO. (33.3%) | GUÍA NO. (33.3%) | MÓDULO (33.3%)
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
            label: 'MÓDULO',
            value: metadata.moduloAplicacion || 'N/A',
            widthDxa: COL_THIRD_LAST,
            colSpan: 2,
          }),
        ],
      }),
      // Fila 3: PROYECTO (100%)
      new TableRow({
        children: [
          CellWrapper({
            label: 'PROYECTO',
            value: metadata.nombreProyecto || 'N/A',
            widthDxa: TOTAL_TABLE_DXA,
            colSpan: 6,
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

function parseBoldRuns(text: string): TextRun[] {
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
          size: 22,
          font: 'Calibri',
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part,
          color: COLOR_TEXT_DARK,
          size: 22,
          font: 'Calibri',
        })
      );
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text, color: COLOR_TEXT_DARK, size: 22, font: 'Calibri' })];
}

function createImageBlock(img: ProcessedImage): (Paragraph | Table)[] {
  if (!img.bytes || img.bytes.length === 0) return [];
  const size = fitImageSize(img.width, img.height, 500, 320, img.widthPercent);
  return createDocxImageBlock(img.bytes, size, img, img.docxType);
}

function pushTextWithTablesAndImages(
  docElements: (Paragraph | Table)[],
  text: string,
  tables: DocumentTable[],
  usedTables: Set<number>,
  imageMapByIndex: Map<number, ProcessedImage>,
  usedImages: Set<number>
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
      usedTables.add(idx);
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
    if (imgMatch) {
      const imgIdx = parseInt(imgMatch[1], 10);
      const linkedImg = imageMapByIndex.get(imgIdx);
      if (linkedImg && linkedImg.bytes && linkedImg.bytes.length > 0) {
        usedImages.add(imgIdx - 1);
        docElements.push(...createImageBlock(linkedImg));
        wroteSomething = true;
        continue;
      }
    }

    const rawBlock = part.trim();
    if (!rawBlock) continue;

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

      // Detect bullet: •, -, *
      const bulletMatch = rawLine.match(/^(\s*)([•\-\*])\s+(.*)$/);
      // Detect numbered item: 1. or 2.
      const numberMatch = rawLine.match(/^(\s*)(\d+)[\.\)]\s+(.*)$/);

      if (bulletMatch) {
        flushCurrentParagraph();
        const indentLevel = bulletMatch[1].length >= 4 ? 1 : 0;
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

  if (!wroteSomething && (!source || !source.trim())) {
    docElements.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text: 'Sin información especificada para esta sección.',
            italics: true,
            color: COLOR_MUTED_GRAY,
            size: 20,
            font: 'Calibri',
          }),
        ],
      })
    );
  }
}

/**
 * Creates a code block styled inside a shaded container table for DOCX
 */
function createCodeBlockTable(code: string): Table {
  const lines = (code || '').split('\n');
  const paragraphs = lines.map(
    (line) =>
      new Paragraph({
        spacing: { before: 20, after: 20, line: 240 },
        children: [
          new TextRun({
            text: line || ' ',
            font: 'Consolas',
            size: 18, // 9pt
            color: 'E2E8F0', // light slate text on dark background
          }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '334155' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '334155' },
      left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_ACCENT_GREEN },
      right: { style: BorderStyle.SINGLE, size: 6, color: '334155' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_CODE_BG, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: '' })],
          }),
        ],
      }),
    ],
  });
}

/**
 * Generates the complete Word Document (.docx) for Technical Documentation
 */
export async function generateTechnicalDocDocx(
  metadata: MetadataHeader,
  techDoc: TechnicalDoc,
  images: UploadedImage[] = []
): Promise<Blob> {
  // Process images asynchronously
  const processedImages: ProcessedImage[] = (
    await Promise.all(
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
    )
  ).filter((img) => img.bytes.length > 0);

  const imageMapByIndex = new Map<number, ProcessedImage>();
  processedImages.forEach((img) => {
    imageMapByIndex.set(img.index, img);
  });

  const titles = getEffectiveTechnicalTitles(metadata.customTitles || techDoc.customTitles);
  const mainTitle = techDoc.tituloDocumento?.trim() || titles.techMainTitle;
  const docElements: (Paragraph | Table)[] = [];

  // 1. Full-bleed Header Banner
  let firstPageHeader: Header | undefined = undefined;
  try {
    const bannerSvg = getAdvansysBannerSvg(
      metadata.headerBrandTag || 'ADVANSYS',
      metadata.headerSubtitle ?? 'Especificación técnica interna de desarrollo',
      metadata.logoDataUrl
    );
    const bannerImgData = await prepareImageForDocx(bannerSvg, 'image/svg+xml');
    if (bannerImgData && bannerImgData.data && bannerImgData.data.length > 0) {
      firstPageHeader = new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              new ImageRun({
                data: bannerImgData.data,
                type: bannerImgData.type,
                transformation: {
                  width: 816, // 8.5 inches at 96 DPI
                  height: 204, // 4:1 aspect ratio
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
                  wrap: {
                    type: TextWrappingType.TOP_AND_BOTTOM,
                  },
                },
              }),
            ],
          }),
        ],
      });
    }
  } catch (err) {
    console.error('Error rendering Technical Doc cover banner:', err);
  }

  // 2. Main Title
  if (!titles.hideTechMainTitle) {
    docElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 180, after: 200 },
        children: [
          new TextRun({
            text: mainTitle.toUpperCase(),
            bold: true,
            color: COLOR_PRIMARY_BLUE,
            size: 30, // 15pt
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // 3. Metadata Table
  docElements.push(createMetadataTable(metadata));
  docElements.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  const tables = techDoc.tables || [];
  const usedTables = new Set<number>();
  const usedImages = new Set<number>();

  // Section 1: Ruta
  const hasSection1 = !titles.hideTechSection1 && Boolean(techDoc.ruta && techDoc.ruta.trim());
  if (hasSection1) {
    docElements.push(createSectionHeader(titles.techSection1, '1'));
    pushTextWithTablesAndImages(docElements, techDoc.ruta.trim(), tables, usedTables, imageMapByIndex, usedImages);
  }

  // Section 2: Flujo Operativo
  const hasSection2 = !titles.hideTechSection2 && Boolean(techDoc.flujoOperativo && techDoc.flujoOperativo.trim());
  if (hasSection2) {
    docElements.push(createSectionHeader(titles.techSection2, '2'));
    pushTextWithTablesAndImages(docElements, techDoc.flujoOperativo.trim(), tables, usedTables, imageMapByIndex, usedImages);
  }

  // Section 3: Diseño
  const hasSection3 = !titles.hideTechSection3 && Boolean(techDoc.diseno && techDoc.diseno.trim());
  if (hasSection3) {
    docElements.push(createSectionHeader(titles.techSection3, '3'));
    pushTextWithTablesAndImages(docElements, techDoc.diseno.trim(), tables, usedTables, imageMapByIndex, usedImages);
  }

  // Section 4: Consideraciones Técnicas
  const hasSection4 = !titles.hideTechSection4 && Boolean(techDoc.consideracionesTecnicas && techDoc.consideracionesTecnicas.trim());
  if (hasSection4) {
    docElements.push(createSectionHeader(titles.techSection4, '4'));
    pushTextWithTablesAndImages(docElements, techDoc.consideracionesTecnicas.trim(), tables, usedTables, imageMapByIndex, usedImages);
  }

  // Additional Tables if not placed inline
  const unusedTables = tables.filter((_, i) => !usedTables.has(i));
  if (unusedTables.length > 0) {
    docElements.push(createSectionHeader('Tablas adicionales'));
    unusedTables.forEach((table) => {
      if (table.title?.trim()) {
        docElements.push(
          new Paragraph({
            spacing: { before: 120, after: 60 },
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
    });
  }

  // Additional Images if not placed inline
  const unusedImages = processedImages.filter((_, i) => !usedImages.has(i));
  if (unusedImages.length > 0) {
    docElements.push(createSectionHeader('Imágenes adicionales'));
    unusedImages.forEach((img) => {
      docElements.push(...createImageBlock(img));
    });
  }

  // Section 5: Código de Ejemplo / Scripts
  const hasSection5 = !titles.hideTechSection5 && Boolean(techDoc.codigoEjemplo && techDoc.codigoEjemplo.trim());
  if (hasSection5) {
    docElements.push(createSectionHeader(titles.techSection5, '5'));
    docElements.push(createCodeBlockTable(techDoc.codigoEjemplo.trim()));
    docElements.push(new Paragraph({ text: '', spacing: { after: 120 } }));
  }

  docElements.push(
    new Paragraph({
      spacing: { after: 0 },
      children: [new TextRun({ text: '\u200B' })],
    })
  );

  // Subsequent Pages Header
  const subsequentHeader = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, after: 100 },
        border: {
          bottom: {
            color: COLOR_BORDER,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 4,
          },
        },
        children: [
          new TextRun({
            text: 'ADVANSYS  |  ',
            bold: true,
            color: COLOR_PRIMARY_BLUE,
            size: 16, // 8pt
            font: 'Calibri',
          }),
          new TextRun({
            text: 'ESPECIFICACIÓN TÉCNICA INTERNA DE DESARROLLO',
            bold: true,
            color: COLOR_ACCENT_GREEN,
            size: 16, // 8pt
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });

  // Footer for all pages
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: {
          top: {
            color: COLOR_BORDER,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 4,
          },
        },
        spacing: { before: 80, after: 0 },
        children: [
          new TextRun({
            text: 'USO INTERNO EXCLUSIVO ADVANSYS  |  Página ',
            color: COLOR_MUTED_GRAY,
            size: 16,
            font: 'Calibri',
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            color: COLOR_PRIMARY_BLUE,
            bold: true,
            size: 16,
            font: 'Calibri',
          }),
          new TextRun({
            text: ' de ',
            color: COLOR_MUTED_GRAY,
            size: 16,
            font: 'Calibri',
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            color: COLOR_PRIMARY_BLUE,
            bold: true,
            size: 16,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1200,
              bottom: 1200,
              left: 1200,
              right: 1200,
            },
          },
          titlePage: true,
        },
        headers: {
          first: firstPageHeader || subsequentHeader,
          default: subsequentHeader,
        },
        footers: {
          default: footer,
        },
        children: docElements,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
