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
import { MetadataHeader, TechnicalDoc } from '../types';

const COLOR_PRIMARY_BLUE = '0A3D62';
const COLOR_ACCENT_GREEN = '2ECC71';
const COLOR_MUTED_GRAY = '64748B';
const COLOR_BG_LIGHT = 'F8FAFC';
const COLOR_BORDER = 'CBD5E1';
const COLOR_CODE_BG = '1E293B';

function createSectionHeading(title: string, sectionNumber: string): Paragraph {
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
      new TextRun({
        text: `${sectionNumber}. `,
        bold: true,
        color: COLOR_ACCENT_GREEN,
        size: 24, // 12pt
        font: 'Calibri',
      }),
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
  techDoc: TechnicalDoc
): Promise<Blob> {
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

  // 1. Ruta
  docElements.push(createSectionHeading('Ruta de Acceso & Navegación en el Sistema', '1'));
  docElements.push(...createFormattedBlock(techDoc.ruta));

  // 2. Flujo Operativo
  docElements.push(createSectionHeading('Flujo Operativo Interno', '2'));
  docElements.push(...createFormattedBlock(techDoc.flujoOperativo));

  // 3. Diseño
  docElements.push(createSectionHeading('Diseño de Interfaz y Estructura de Datos', '3'));
  docElements.push(...createFormattedBlock(techDoc.diseno));

  // 4. Consideraciones Técnicas
  docElements.push(createSectionHeading('Consideraciones Técnicas y de Seguridad', '4'));
  docElements.push(...createFormattedBlock(techDoc.consideracionesTecnicas));

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
