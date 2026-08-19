import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  Packer,
} from 'docx';
import { MetadataHeader, TechnicalDoc, DocumentTable, UploadedImage } from '../types';
import { dataUrlToUint8Array } from './imageExport';
import { fitImageSize, ImageAlign } from './imageLayout';
import { createDocumentImageRun, paragraphAlignOf } from './imageDocx';

const COLOR_PRIMARY_BLUE = '0A3D62';
const COLOR_ACCENT_GREEN = '2ECC71';
const COLOR_MUTED_GRAY = '64748B';
const COLOR_BG_LIGHT = 'F8FAFC';
const COLOR_BORDER = 'CBD5E1';
const COLOR_CODE_BG = '1E293B';
const COLOR_TEXT_DARK = '1E293B';

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

type ProcessedImage = {
  index: number;
  bytes: Uint8Array;
  width: number;
  height: number;
  title: string;
  description?: string;
  widthPercent?: number;
  align?: ImageAlign;
  wrap?: UploadedImage['wrap'];
  verticalAlign?: UploadedImage['verticalAlign'];
  rotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
};

function createImageBlock(img: ProcessedImage): (Paragraph | Table)[] {
  if (!img.bytes || img.bytes.length === 0) return [];
  const size = fitImageSize(img.width, img.height, 500, 320, img.widthPercent);
  const alignment = paragraphAlignOf(img);

  return [
    new Paragraph({
      alignment,
      spacing: { before: 120, after: 60 },
      children: [createDocumentImageRun(img.bytes, size, img)],
    }),
    new Paragraph({
      alignment,
      spacing: { before: 40, after: 120 },
      children: [
        new TextRun({
          text: `[IMAGEN_${img.index}] ${img.title || 'Captura de referencia'}`,
          bold: true,
          italics: true,
          color: COLOR_MUTED_GRAY,
          size: 18,
          font: 'Calibri',
        }),
        ...(img.description
          ? [
              new TextRun({
                text: ` — ${img.description}`,
                italics: true,
                color: COLOR_MUTED_GRAY,
                size: 18,
                font: 'Calibri',
              }),
            ]
          : []),
      ],
    }),
  ];
}

function createFormattedBlockWithTables(
  text: string,
  tables: DocumentTable[],
  used: Set<number>,
  images: ProcessedImage[] = [],
  usedImages: Set<number> = new Set()
): (Paragraph | Table)[] {
  const source = text || '';
  const parts = source.split(/(\[TABLA_\d+\]|\[IMAGEN_\d+\])/gi);
  const out: (Paragraph | Table)[] = [];
  let wrote = false;

  for (const part of parts) {
    const tableMatch = part.match(/^\[TABLA_(\d+)\]$/i);
    if (tableMatch) {
      const idx = parseInt(tableMatch[1], 10) - 1;
      const table = tables[idx];
      if (!table) continue;
      used.add(idx);
      if (table.title?.trim()) {
        out.push(
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
      out.push(createContentTable(table));
      out.push(new Paragraph({ text: '', spacing: { after: 80 } }));
      wrote = true;
      continue;
    }

    const imageMatch = part.match(/^\[IMAGEN_(\d+)\]$/i);
    if (imageMatch) {
      const idx = parseInt(imageMatch[1], 10) - 1;
      const img = images[idx];
      if (!img) continue;
      usedImages.add(idx);
      out.push(...createImageBlock(img));
      wrote = true;
      continue;
    }

    if (part.trim()) {
      out.push(...createFormattedBlock(part));
      wrote = true;
    }
  }

  if (!wrote) out.push(...createFormattedBlock(''));
  return out;
}

function createSectionHeading(title: string, sectionNumber?: string): Paragraph {
  return new Paragraph({
    text: '',
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    border: {
      bottom: {
        color: COLOR_ACCENT_GREEN,
        space: 4,
        style: BorderStyle.SINGLE,
        size: 12,
      },
    },
    children: [
      ...(sectionNumber
        ? [
            new TextRun({
              text: `${sectionNumber}. `,
              bold: true,
              color: COLOR_ACCENT_GREEN,
              size: 24, // 12pt
              font: 'Calibri',
            }),
          ]
        : []),
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        color: COLOR_PRIMARY_BLUE,
        size: 24, // 12pt
        font: 'Calibri',
      }),
    ],
  });
}

function createFormattedBlock(text: string): Paragraph[] {
  if (!text || !text.trim()) {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Sin información especificada.',
            italics: true,
            color: COLOR_MUTED_GRAY,
            size: 20,
            font: 'Calibri',
          }),
        ],
      }),
    ];
  }

  const lines = text.split('\n');
  return lines.map((line) => {
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
    const cleanLine = isBullet ? line.trim().replace(/^[•\-]\s*/, '') : line;

    return new Paragraph({
      spacing: { before: 60, after: 60 },
      bullet: isBullet ? { level: 0 } : undefined,
      children: [
        new TextRun({
          text: cleanLine,
          size: 21,
          font: 'Calibri',
          color: '1E293B',
        }),
      ],
    });
  });
}

function createCodeBlockParagraphs(code: string): Paragraph[] {
  if (!code || !code.trim()) {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: 'No aplica código o scripts para este requerimiento.',
            italics: true,
            color: COLOR_MUTED_GRAY,
            size: 20,
            font: 'Calibri',
          }),
        ],
      }),
    ];
  }

  const lines = code.split('\n');
  return lines.map(
    (line) =>
      new Paragraph({
        spacing: { before: 20, after: 20 },
        children: [
          new TextRun({
            text: line || ' ',
            font: 'Consolas',
            size: 18, // 9pt
            color: '0F172A',
          }),
        ],
      })
  );
}

export async function generateTechnicalDocDocx(
  metadata: MetadataHeader,
  techDoc: TechnicalDoc,
  images: UploadedImage[] = []
): Promise<Blob> {
  const processedImages: ProcessedImage[] = (
    await Promise.all(
      images.map(async (img, idx) => {
        const imgData = await dataUrlToUint8Array(img.dataUrl);
        return {
          index: idx + 1,
          bytes: imgData.data,
          width: imgData.width,
          height: imgData.height,
          title: img.title,
          description: img.description,
          widthPercent: img.widthPercent,
          align: img.align,
          wrap: img.wrap,
          verticalAlign: img.verticalAlign,
          rotation: img.rotation,
          flipHorizontal: img.flipHorizontal,
          flipVertical: img.flipVertical,
        };
      })
    )
  ).filter((img) => img.bytes.length > 0);

  const docElements: (Paragraph | Table)[] = [];

  // Title
  docElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 200 },
      children: [
        new TextRun({
          text: 'DOCUMENTACIÓN TÉCNICA INTERNA Y ESPECIFICACIÓN DE DESARROLLO',
          bold: true,
          color: COLOR_PRIMARY_BLUE,
          size: 26,
          font: 'Calibri',
        }),
      ],
    })
  );

  // Metadata Table
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'CLIENTE: ', bold: true, size: 18, color: COLOR_PRIMARY_BLUE, font: 'Calibri' }),
                  new TextRun({ text: metadata.cliente || 'N/A', size: 18, font: 'Calibri' }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'FECHA: ', bold: true, size: 18, color: COLOR_PRIMARY_BLUE, font: 'Calibri' }),
                  new TextRun({ text: metadata.fecha || new Date().toISOString().split('T')[0], size: 18, font: 'Calibri' }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'TICKET NO: ', bold: true, size: 18, color: COLOR_PRIMARY_BLUE, font: 'Calibri' }),
                  new TextRun({ text: metadata.ticketNo || 'N/A', size: 18, font: 'Calibri' }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'MÓDULO: ', bold: true, size: 18, color: COLOR_PRIMARY_BLUE, font: 'Calibri' }),
                  new TextRun({ text: metadata.moduloAplicacion || 'N/A', size: 18, font: 'Calibri' }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'PROYECTO: ', bold: true, size: 18, color: COLOR_PRIMARY_BLUE, font: 'Calibri' }),
                  new TextRun({ text: metadata.nombreProyecto || 'N/A', size: 18, bold: true, font: 'Calibri' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  docElements.push(metaTable);
  docElements.push(new Paragraph({ text: '', spacing: { after: 120 } }));

  const tables = techDoc.tables || [];
  const usedTableIndexes = new Set<number>();
  const usedImageIndexes = new Set<number>();

  // 1. Ruta
  docElements.push(createSectionHeading('Ruta de Acceso & Navegación en el Sistema', '1'));
  docElements.push(...createFormattedBlockWithTables(techDoc.ruta, tables, usedTableIndexes, processedImages, usedImageIndexes));

  // 2. Flujo Operativo
  docElements.push(createSectionHeading('Flujo Operativo Interno', '2'));
  docElements.push(...createFormattedBlockWithTables(techDoc.flujoOperativo, tables, usedTableIndexes, processedImages, usedImageIndexes));

  // 3. Diseño
  docElements.push(createSectionHeading('Diseño de Interfaz y Estructura de Datos', '3'));
  docElements.push(...createFormattedBlockWithTables(techDoc.diseno, tables, usedTableIndexes, processedImages, usedImageIndexes));

  // 4. Consideraciones Técnicas
  docElements.push(createSectionHeading('Consideraciones Técnicas y de Seguridad', '4'));
  docElements.push(...createFormattedBlockWithTables(techDoc.consideracionesTecnicas, tables, usedTableIndexes, processedImages, usedImageIndexes));

  const unusedTables = tables.filter((_, i) => !usedTableIndexes.has(i));
  if (unusedTables.length > 0) {
    docElements.push(createSectionHeading('Tablas adicionales'));
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
      docElements.push(new Paragraph({ text: '', spacing: { after: 80 } }));
    });
  }

  const unusedImages = processedImages.filter((_, i) => !usedImageIndexes.has(i));
  if (unusedImages.length > 0) {
    docElements.push(createSectionHeading('Imágenes adicionales'));
    unusedImages.forEach((img) => {
      docElements.push(...createImageBlock(img));
    });
  }

  // 5. Código de Ejemplo
  docElements.push(createSectionHeading('Código de Ejemplo / Scripts', '5'));
  docElements.push(...createCodeBlockParagraphs(techDoc.codigoEjemplo || ''));

  // Header and Footer
  const header = new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'ADVANSYS  |  ',
            bold: true,
            color: COLOR_PRIMARY_BLUE,
            size: 18,
            font: 'Calibri',
          }),
          new TextRun({
            text: 'ESPECIFICACIÓN TÉCNICA INTERNA DE DESARROLLO',
            bold: true,
            color: COLOR_ACCENT_GREEN,
            size: 16,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });

  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
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
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
            },
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children: docElements,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
