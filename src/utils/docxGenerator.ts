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
import { MetadataHeader, ProposalSection, UploadedImage } from '../types';
import { getAdvansysBannerSvg } from '../data/banner';

// Advansys Corporate Palette
const COLOR_PRIMARY_BLUE = '0A3D62'; // #0A3D62 Deep Corporate Blue
const COLOR_SECONDARY_BLUE = '1E5F8A'; // #1E5F8A Tech Blue Accent
const COLOR_ACCENT_GREEN = '2ECC71'; // #2ECC71 Advansys Emerald Green
const COLOR_TEXT_DARK = '1E293B'; // #1E293B Slate Dark
const COLOR_MUTED_GRAY = '64748B'; // #64748B Slate Muted
const COLOR_BORDER = 'CBD5E1'; // #CBD5E1 Soft Border

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

// Helper cell generator function
function CellWrapper({ label, value, widthPercent }: { label: string; value: string; widthPercent: number; isHeader?: boolean }): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: label + ': ',
            bold: true,
            color: COLOR_PRIMARY_BLUE,
            size: 18, // 9pt
            font: 'Calibri',
          }),
          new TextRun({
            text: value,
            color: COLOR_TEXT_DARK,
            size: 20, // 10pt
            font: 'Calibri',
          })
        ]
      })
    ]
  });
}

/**
 * Creates the metadata table block as specified in Advansys guidelines
 */
function createMetadataTable(metadata: MetadataHeader): Table {
  const createCell = (label: string, value: string, widthPercent: number, isHeader = false) => {
    return CellWrapper({
      label,
      value,
      widthPercent,
      isHeader
    });
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
    },
    rows: [
      new TableRow({
        children: [
          createCell('CLIENTE', metadata.cliente || 'N/A', 50, true),
          createCell('FECHA', metadata.fecha || new Date().toISOString().split('T')[0], 50, true),
        ]
      }),
      new TableRow({
        children: [
          createCell('TICKET NO.', metadata.ticketNo || 'N/A', 33),
          createCell('GUÍA NO.', metadata.guiaNo || 'N/A', 33),
          createCell('PROPUESTA Nº', metadata.propuestaNo || 'N/A', 34),
        ]
      }),
      new TableRow({
        children: [
          createCell('PROYECTO', metadata.nombreProyecto || 'N/A', 50),
          createCell('MÓDULO / APLICACIÓN', metadata.moduloAplicacion || 'N/A', 50),
        ]
      })
    ]
  });
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

  // Process banner SVG image and construct full-bleed Page 1 Header
  let firstPageHeader: Header | undefined = undefined;
  try {
    const bannerSvg = getAdvansysBannerSvg(
      metadata.headerBrandTag || 'ADVANSYS',
      metadata.headerSubtitle ?? ''
    );
    const bannerImgData = await dataUrlToUint8Array(bannerSvg);
    if (bannerImgData && bannerImgData.data && bannerImgData.data.length > 0) {
      firstPageHeader = new Header({
        children: [
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
        ],
      });
    }
  } catch (err) {
    console.error('Error rendering cover banner header:', err);
  }

  // Top Title Block (Positioned cleanly right below the cover header banner without empty gaps)
  docElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 200 },
      children: [
        new TextRun({
          text: 'ANÁLISIS DE CUMPLIMIENTO Y PROPUESTA DE DESARROLLO',
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
  docElements.push(createSectionHeader('Resumen Ejecutivo', '1'));
  docElements.push(
    new Paragraph({
      spacing: { before: 120, after: 180 },
      alignment: AlignmentType.BOTH,
      children: [
        new TextRun({
          text: proposal.resumenEjecutivo || 'Sin resumen provisto.',
          color: COLOR_TEXT_DARK,
          size: 22, // 11pt
          font: 'Calibri',
        }),
      ],
    })
  );

  // 2. Beneficios de la Propuesta
  docElements.push(createSectionHeader('Beneficios de la Propuesta', '2'));
  if (proposal.beneficios && proposal.beneficios.length > 0) {
    proposal.beneficios.forEach((b) => {
      docElements.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
          children: [
            new TextRun({
              text: b,
              color: COLOR_TEXT_DARK,
              size: 22,
              font: 'Calibri',
            }),
          ],
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

  // 3. Alcance, Exclusiones y Entregables
  docElements.push(createSectionHeader('Alcance, Exclusiones y Entregables', '3'));

  // Alcance
  docElements.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: '3.1 Alcance Técnico del Proyecto',
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
        children: [
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

  // Exclusiones
  docElements.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: '3.2 Exclusiones (Fuera de Alcance)',
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
        children: [
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

  // Entregables
  docElements.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: '3.3 Entregables Formales',
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
        children: [
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

  // 4. Objetivo (Starts on Page 2 after Section 3)
  docElements.push(createSectionHeader('Objetivo General y Específicos', '4', true));
  docElements.push(
    new Paragraph({
      spacing: { before: 120, after: 180 },
      alignment: AlignmentType.BOTH,
      children: [
        new TextRun({
          text: proposal.objetivo || '',
          color: COLOR_TEXT_DARK,
          size: 22,
          font: 'Calibri',
        }),
      ],
    })
  );

  // 5. Descripción
  docElements.push(createSectionHeader('Descripción Solución Propuesta', '5'));
  docElements.push(
    new Paragraph({
      spacing: { before: 120, after: 180 },
      alignment: AlignmentType.BOTH,
      children: [
        new TextRun({
          text: proposal.descripcion || '',
          color: COLOR_TEXT_DARK,
          size: 22,
          font: 'Calibri',
        }),
      ],
    })
  );

  // 6. Índice Análisis Operativo
  docElements.push(createSectionHeader('Índice de Análisis Operativo', '6'));
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

  // 7. Análisis Operativo con Imágenes e Ilustraciones
  docElements.push(createSectionHeader('Análisis Operativo Detallado', '7'));

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
      docElements.push(
        new Paragraph({
          spacing: { before: 80, after: 180 },
          alignment: AlignmentType.BOTH,
          children: [
            new TextRun({
              text: step.explicacion,
              color: COLOR_TEXT_DARK,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      );
    });
  } else {
    docElements.push(
      new Paragraph({
        text: 'Se desarrollarán los flujos operativos en la fase detallada.',
        spacing: { before: 100, after: 100 },
      })
    );
  }

  // 8. Descargo / Cláusula de Responsabilidad
  docElements.push(createSectionHeader('Descargo y Cláusula Estándar Advansys', '8'));
  docElements.push(
    new Paragraph({
      spacing: { before: 120, after: 240 },
      alignment: AlignmentType.BOTH,
      children: [
        new TextRun({
          text: proposal.descargo || 
            'La presente propuesta técnica y análisis operativo han sido elaborados exclusivamente por Advansys para uso confidencial del cliente indicado. Los requerimientos, diagramas y estimaciones contenidos están sujetos a validación formal tras la aprobación del acta de inicio de proyecto. Queda prohibida la reproducción parcial o total sin autorización expresa.',
          italics: true,
          color: COLOR_MUTED_GRAY,
          size: 20, // 10pt
          font: 'Calibri',
        }),
      ],
    })
  );

  // Build Advansys Header Banner
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
              new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                shading: { fill: COLOR_PRIMARY_BLUE, type: ShadingType.CLEAR },
                margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'ADVANSYS  |  ',
                        bold: true,
                        color: 'FFFFFF',
                        size: 22,
                        font: 'Calibri',
                      }),
                      new TextRun({
                        text: 'DOCUMENTACIÓN TÉCNICA Y ANÁLISIS DE CUMPLIMIENTO',
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
