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
} from 'docx';
import { MetadataHeader, ProposalSection, UploadedImage, DocumentTable, getEffectiveTitles } from '../types';
import { getAdvansysBannerSvg } from '../data/banner';

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
 * Converts a Base64 or SVG Data URL to Uint8Array for docx ImageRun
 */
async function dataUrlToUint8Array(dataUrl: string): Promise<{ data: Uint8Array; width: number; height: number }> {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve({ data: new Uint8Array(0), width: 100, height: 100 });
      return;
    }

    // Safety timeout so docx generation never hangs
    const timer = setTimeout(() => {
      resolve({ data: new Uint8Array(0), width: 100, height: 100 });
    }, 2000);

    const safeResolve = (result: { data: Uint8Array; width: number; height: number }) => {
      clearTimeout(timer);
      resolve(result);
    };

    // If SVG
    if (dataUrl.startsWith('data:image/svg+xml')) {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const width = img.width || 600;
            const height = img.height || 350;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0);
              const pngDataUrl = canvas.toDataURL('image/png');
              const base64 = pngDataUrl.split(',')[1];
              const binary = atob(base64.trim());
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              const targetWidth = 520;
              const targetHeight = Math.round((height / width) * 520) || 300;
              safeResolve({ data: bytes, width: targetWidth, height: targetHeight });
              return;
            }
          } catch (e) {
            console.error('Error drawing SVG on canvas:', e);
          }
          safeResolve({ data: new Uint8Array(0), width: 100, height: 100 });
        };
        img.onerror = (e) => {
          console.error('Failed to load SVG into Image element:', e);
          safeResolve({ data: new Uint8Array(0), width: 100, height: 100 });
        };
        img.src = dataUrl;
        return;
      }
    }

    // Default base64 handler (PNG / JPEG)
    try {
      const parts = dataUrl.split(',');
      const base64 = parts.length > 1 ? parts[1] : parts[0];
      const cleanBase64 = base64.replace(/\s/g, '');
      const binary = atob(cleanBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      safeResolve({ data: bytes, width: 520, height: 300 });
    } catch (e) {
      console.error('Error parsing base64 data URL:', e);
      safeResolve({ data: new Uint8Array(0), width: 100, height: 100 });
    }
  });
}

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
  return runs.length > 0 ? runs : [new TextRun({ text: text, color: COLOR_TEXT_DARK, size: 22, font: 'Calibri' })];
}

function pushTextWithTables(
  docElements: (Paragraph | Table)[],
  text: string,
  tables: DocumentTable[],
  used: Set<number>
) {
  const source = text || '';
  const parts = source.split(/(\[TABLA_\d+\])/gi);
  let wroteSomething = false;

  for (const part of parts) {
    const match = part.match(/^\[TABLA_(\d+)\]$/i);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
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
      const imgData = await dataUrlToUint8Array(img.dataUrl);
      return {
        ...img,
        index: idx + 1,
        bytes: imgData.data,
        width: imgData.width,
        height: imgData.height,
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
  if (metadata.logoDataUrl) {
    try {
      const processedLogo = await dataUrlToUint8Array(metadata.logoDataUrl);
      if (processedLogo.data && processedLogo.data.length > 0) {
        logoBytes = processedLogo.data;
      }
    } catch (err) {
      console.error('Error processing corporate logo:', err);
    }
  }

  try {
    const bannerSvg = getAdvansysBannerSvg(
      metadata.headerBrandTag || 'ADVANSYS',
      metadata.headerSubtitle ?? '',
      metadata.logoDataUrl
    );
    const bannerImgData = await dataUrlToUint8Array(bannerSvg);
    if (bannerImgData && bannerImgData.data && bannerImgData.data.length > 0) {
      const firstPageChildren = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              data: bannerImgData.data,
              type: 'png',
              transformation: {
                width: 816, // 8.5 inches at 96 DPI (Full page width)
                height: 204, // Aspect ratio 4:1
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
      ];

      firstPageHeader = new Header({
        children: firstPageChildren,
      });
    }
  } catch (err) {
    console.error('Error rendering cover banner header:', err);
  }

  const titles = getEffectiveTitles(metadata.customTitles);

  // Top Title Block (Positioned cleanly right below the cover header banner without empty gaps)
  docElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 200 },
      children: [
        new TextRun({
          text: titles.mainTitle,
          bold: true,
          color: COLOR_PRIMARY_BLUE,
          size: 32, // 16pt
          font: 'Calibri',
        }),
      ],
    })
  );

  // Metadata Table
  docElements.push(createMetadataTable(metadata));
  docElements.push(new Paragraph({ text: '', spacing: { after: 240 } }));

  // 1. Resumen Ejecutivo
  if (!titles.hideSection1) {
    docElements.push(createSectionHeader(titles.section1, '1'));
    pushTextWithTables(docElements, proposal.resumenEjecutivo || 'Sin resumen provisto.', contentTables, usedTables);
  }

  // 2. Beneficios de la Propuesta
  if (!titles.hideSection2) {
    docElements.push(createSectionHeader(titles.section2, '2'));
    if (proposal.beneficios && proposal.beneficios.length > 0) {
      proposal.beneficios.forEach((b) => {
        docElements.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 60, after: 60 },
            children: parseBoldRuns(b),
          })
        );
      });
    } else {
      docElements.push(
        new Paragraph({
          text: 'No se han detallado beneficios específicos.',
          spacing: { before: 60, after: 60 },
        })
      );
    }
  }

  // 3. Alcance, Exclusiones y Entregables
  if (!titles.hideSection3) {
    docElements.push(createSectionHeader(titles.section3, '3'));

    // Alcance
    if (!titles.hideSection3_1) {
      docElements.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: titles.section3_1.startsWith('3.1') ? titles.section3_1 : `3.1 ${titles.section3_1}`,
              bold: true,
              color: COLOR_SECONDARY_BLUE,
              size: 24,
              font: 'Calibri',
            }),
          ],
        })
      );
      (proposal.alcanceExclusionesEntregables?.alcance || []).forEach((item) => {
        docElements.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 40, after: 40 },
            children: parseBoldRuns(item),
          })
        );
      });
    }

    // Exclusiones
    if (!titles.hideSection3_2) {
      docElements.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: titles.section3_2.startsWith('3.2') ? titles.section3_2 : `3.2 ${titles.section3_2}`,
              bold: true,
              color: COLOR_SECONDARY_BLUE,
              size: 24,
              font: 'Calibri',
            }),
          ],
        })
      );
      (proposal.alcanceExclusionesEntregables?.exclusiones || []).forEach((item) => {
        docElements.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 40, after: 40 },
            children: parseBoldRuns(item),
          })
        );
      });
    }

    // Entregables
    if (!titles.hideSection3_3) {
      docElements.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: titles.section3_3.startsWith('3.3') ? titles.section3_3 : `3.3 ${titles.section3_3}`,
              bold: true,
              color: COLOR_SECONDARY_BLUE,
              size: 24,
              font: 'Calibri',
            }),
          ],
        })
      );
      (proposal.alcanceExclusionesEntregables?.entregables || []).forEach((item) => {
        docElements.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 40, after: 40 },
            children: parseBoldRuns(item),
          })
        );
      });
    }
  }

  // 4. Objetivo (Starts on Page 2 after Section 3)
  if (!titles.hideSection4) {
    docElements.push(createSectionHeader(titles.section4, '4', true));
    pushTextWithTables(docElements, proposal.objetivo || '', contentTables, usedTables);
  }

  // 5. Descripción
  if (!titles.hideSection5) {
    docElements.push(createSectionHeader(titles.section5, '5'));
    pushTextWithTables(docElements, proposal.descripcion || '', contentTables, usedTables);
  }

  // 6. Índice Análisis Operativo
  if (!titles.hideSection6) {
    docElements.push(createSectionHeader(titles.section6, '6'));
    (proposal.indiceAnalisisOperativo || []).forEach((item, idx) => {
      docElements.push(
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
  }

  // 7. Análisis Operativo con Imágenes e Ilustraciones
  if (!titles.hideSection7) {
    docElements.push(createSectionHeader(titles.section7, '7'));

    if (proposal.analisisOperativo && proposal.analisisOperativo.length > 0) {
      proposal.analisisOperativo.forEach((step, idx) => {
        // Step Title
        docElements.push(
          new Paragraph({
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: `Paso 7.${idx + 1}: ${step.titulo}`,
                bold: true,
                color: COLOR_PRIMARY_BLUE,
                size: 24, // 12pt
                font: 'Calibri',
              }),
            ],
          })
        );

        // Check if image referenced or mapped to step index
        const linkedImg = imageMapByIndex.get(idx + 1) || processedImages[idx];

        if (linkedImg && linkedImg.bytes && linkedImg.bytes.length > 0) {
          try {
            docElements.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 60 },
                children: [
                  new ImageRun({
                    data: linkedImg.bytes,
                    type: 'png',
                    transformation: {
                      width: Math.min(linkedImg.width || 500, 500),
                      height: Math.min(linkedImg.height || 280, 320),
                    },
                  }),
                ],
              })
            );

            // Image Caption
            docElements.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 120 },
                children: [
                  new TextRun({
                    text: `[IMAGEN_${linkedImg.index}] ${linkedImg.title}`,
                    bold: true,
                    italics: true,
                    color: COLOR_MUTED_GRAY,
                    size: 18, // 9pt
                    font: 'Calibri',
                  }),
                  ...(linkedImg.description ? [
                    new TextRun({
                      text: ` - ${linkedImg.description}`,
                      italics: true,
                      color: COLOR_MUTED_GRAY,
                      size: 18,
                      font: 'Calibri',
                    })
                  ] : [])
                ],
              })
            );
          } catch (e) {
            console.error('Failed to append image to docx:', e);
          }
        }

        // Step Explanation Text
        pushTextWithTables(docElements, step.explicacion || '', contentTables, usedTables);
      });
    } else {
      docElements.push(
        new Paragraph({
          text: 'Se desarrollarán los flujos operativos en la fase detallada.',
          spacing: { before: 100, after: 100 },
        })
      );
    }
  }

  // Tablas no referenciadas con [TABLA_n] — se agregan antes del descargo
  const unusedTables = contentTables.filter((_, idx) => !usedTables.has(idx));
  if (unusedTables.length > 0) {
    docElements.push(createSectionHeader('Tablas de apoyo', ''));
    unusedTables.forEach((table) => {
      if (table.title?.trim()) {
        docElements.push(
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
      docElements.push(createContentTable(table));
      docElements.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    });
  }

  // 8. Descargo / Cláusula de Responsabilidad
  if (!titles.hideSection8) {
    docElements.push(createSectionHeader(titles.section8, '8'));
    pushTextWithTables(
      docElements,
      proposal.descargo ||
        'La presente propuesta técnica y análisis operativo han sido elaborados exclusivamente por Advansys para uso confidencial del cliente indicado. Los requerimientos, diagramas y estimaciones contenidos están sujetos a validación formal tras la aprobación del acta de inicio de proyecto. Queda prohibida la reproducción parcial o total sin autorización expresa.',
      contentTables,
      usedTables
    );
  }

  // Build Advansys Header Banner
  const headerLogo = logoBytes
    ? fitLogoSize(metadata.logoWidth, metadata.logoHeight, 78, 28)
    : null;

  const header = new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
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
              ...(logoBytes && headerLogo
                ? [
                    new TableCell({
                      width: { size: 18, type: WidthType.PERCENTAGE },
                      shading: { fill: COLOR_PRIMARY_BLUE, type: ShadingType.CLEAR },
                      margins: { top: 60, bottom: 60, left: 120, right: 80 },
                      verticalAlign: 'center' as any,
                      children: [
                        new Paragraph({
                          children: [
                            new ImageRun({
                              data: logoBytes,
                              type: 'png',
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
                width: { size: logoBytes ? 82 : 100, type: WidthType.PERCENTAGE },
                shading: { fill: COLOR_PRIMARY_BLUE, type: ShadingType.CLEAR },
                margins: { top: 100, bottom: 100, left: 160, right: 160 },
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

  // Create full Document instance
  const doc = new Document({
    sections: [
      {
        properties: {
          titlePage: true,
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
              header: 360,
              footer: 360,
            },
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
        children: docElements,
      },
    ],
  });

  // Generate buffer blob
  const buffer = await Packer.toBlob(doc);
  return buffer;
}
