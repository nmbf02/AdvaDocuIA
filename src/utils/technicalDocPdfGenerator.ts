import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MetadataHeader, TechnicalDoc } from '../types';

const COLOR_PRIMARY: [number, number, number] = [10, 61, 98]; // #0A3D62
const COLOR_ACCENT: [number, number, number] = [46, 204, 113]; // #2ECC71
const COLOR_TEXT_DARK: [number, number, number] = [30, 41, 59]; // #1E293B
const COLOR_MUTED: [number, number, number] = [100, 116, 139]; // #64748B
const COLOR_BG_LIGHT: [number, number, number] = [248, 250, 252]; // #F8FAFC
const COLOR_BORDER: [number, number, number] = [203, 213, 225]; // #CBD5E1

export async function generateTechnicalDocPdf(
  metadata: MetadataHeader,
  techDoc: TechnicalDoc
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 16;

  const checkPageBreak = (neededHeight: number): void => {
    if (cursorY + neededHeight > pageHeight - 16) {
      doc.addPage();
      cursorY = 20;
    }
  };

  // Top header title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text('DOCUMENTACIÓN TÉCNICA INTERNA Y ESPECIFICACIÓN DE DESARROLLO', pageWidth / 2, cursorY, {
    align: 'center',
  });
  cursorY += 6;

  // Metadata Table
  const metaRows = [
    [
      { content: 'CLIENTE', styles: { fontStyle: 'bold', fillColor: COLOR_BG_LIGHT, textColor: COLOR_PRIMARY } },
      { content: metadata.cliente || 'N/A' },
      { content: 'FECHA', styles: { fontStyle: 'bold', fillColor: COLOR_BG_LIGHT, textColor: COLOR_PRIMARY } },
      { content: metadata.fecha || new Date().toISOString().split('T')[0] },
    ],
    [
      { content: 'TICKET NO', styles: { fontStyle: 'bold', fillColor: COLOR_BG_LIGHT, textColor: COLOR_PRIMARY } },
      { content: metadata.ticketNo || 'N/A' },
      { content: 'MÓDULO', styles: { fontStyle: 'bold', fillColor: COLOR_BG_LIGHT, textColor: COLOR_PRIMARY } },
      { content: metadata.moduloAplicacion || 'N/A' },
    ],
    [
      { content: 'PROYECTO', styles: { fontStyle: 'bold', fillColor: COLOR_BG_LIGHT, textColor: COLOR_PRIMARY } },
      { content: metadata.nombreProyecto || 'N/A', colSpan: 3, styles: { fontStyle: 'bold' } },
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: COLOR_TEXT_DARK, lineColor: COLOR_BORDER, lineWidth: 0.15 },
    body: metaRows as any,
  });

  cursorY = (doc as any).lastAutoTable.finalY + 6;

  const renderSection = (title: string, sectionNumber: string, content: string, isCode = false) => {
    checkPageBreak(16);

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.text(`${sectionNumber}. `, margin, cursorY);
    const numWidth = doc.getTextWidth(`${sectionNumber}. `);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text(title.toUpperCase(), margin + numWidth, cursorY);

    // Bottom accent line
    doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, cursorY + 1.5, pageWidth - margin, cursorY + 1.5);
    cursorY += 5.5;

    if (isCode) {
      const codeLines = doc.splitTextToSize(content || 'No aplica código.', contentWidth - 6);
      const codeHeight = codeLines.length * 3.4 + 4;
      checkPageBreak(codeHeight);

      doc.setFillColor(30, 41, 59); // Dark background for code
      doc.roundedRect(margin, cursorY, contentWidth, codeHeight, 1, 1, 'F');

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(248, 250, 252);
      doc.text(codeLines, margin + 3, cursorY + 4);
      cursorY += codeHeight + 5;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
      const lines = doc.splitTextToSize(content || 'Sin información especificada.', contentWidth);
      checkPageBreak(lines.length * 4);
      doc.text(lines, margin, cursorY);
      cursorY += lines.length * 4 + 4;
    }
  };

  // 1. Ruta
  renderSection('Ruta de Acceso & Navegación en el Sistema', '1', techDoc.ruta);

  // 2. Flujo Operativo
  renderSection('Flujo Operativo Interno', '2', techDoc.flujoOperativo);

  // 3. Diseño
  renderSection('Diseño de Interfaz y Estructura de Datos', '3', techDoc.diseno);

  // 4. Consideraciones Técnicas
  renderSection('Consideraciones Técnicas y de Seguridad', '4', techDoc.consideracionesTecnicas);

  // 5. Código de Ejemplo
  renderSection('Código de Ejemplo / Scripts', '5', techDoc.codigoEjemplo || '', true);

  // Footers and Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Header line on subsequent pages
    if (p > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      doc.text(`ADVANSYS • ESPECIFICACIÓN TÉCNICA INTERNA • ${metadata.ticketNo || ''}`, margin, 10);
      doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, 12, pageWidth - margin, 12);
    }

    // Footer on all pages
    const footerY = pageHeight - 8;
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 2.5, pageWidth - margin, footerY - 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text('DOCUMENTO CONFIDENCIAL DE USO INTERNO ADVANSYS', margin, footerY);

    const pageStr = `Página ${p} de ${totalPages}`;
    doc.text(pageStr, pageWidth - margin, footerY, { align: 'right' });
  }

  return doc.output('blob');
}

export async function downloadTechnicalDocPdf(
  metadata: MetadataHeader,
  techDoc: TechnicalDoc,
  filename?: string
): Promise<void> {
  const blob = await generateTechnicalDocPdf(metadata, techDoc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const baseName = filename || `Doc_Tecnica_${metadata.ticketNo || 'ADV'}_${metadata.nombreProyecto || 'Dev'}`;
  const safeName = baseName.toLowerCase().endsWith('.pdf') ? baseName : `${baseName}.pdf`;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
