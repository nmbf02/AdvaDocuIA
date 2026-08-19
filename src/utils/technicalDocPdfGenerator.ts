import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MetadataHeader, TechnicalDoc, DocumentTable, UploadedImage } from '../types';
import { loadSvgOrImageToCanvasPng } from './imageExport';
import { fitImageSize, getImageAlign, pdfImageX } from './imageLayout';

const COLOR_PRIMARY: [number, number, number] = [10, 61, 98]; // #0A3D62
const COLOR_ACCENT: [number, number, number] = [46, 204, 113]; // #2ECC71
const COLOR_TEXT_DARK: [number, number, number] = [30, 41, 59]; // #1E293B
const COLOR_MUTED: [number, number, number] = [100, 116, 139]; // #64748B
const COLOR_BG_LIGHT: [number, number, number] = [248, 250, 252]; // #F8FAFC
const COLOR_BORDER: [number, number, number] = [203, 213, 225]; // #CBD5E1

export async function generateTechnicalDocPdf(
  metadata: MetadataHeader,
  techDoc: TechnicalDoc,
  images: UploadedImage[] = []
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

  const renderCustomTable = (table: DocumentTable): void => {
    if (!table || !table.headers || table.headers.length === 0) return;
    checkPageBreak(22);

    if (table.title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text(table.title, margin, cursorY + 2);
      cursorY += 4.5;
    }

    autoTable(doc, {
      startY: cursorY,
      tableWidth: contentWidth,
      margin: { left: margin, right: margin },
      head: [table.headers],
      body: table.rows || [],
      theme: 'grid',
      headStyles: {
        fillColor: COLOR_PRIMARY,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
        cellPadding: 1.8,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.6,
        textColor: COLOR_TEXT_DARK,
        lineColor: COLOR_BORDER,
        lineWidth: 0.15,
        font: 'helvetica',
      },
      alternateRowStyles: {
        fillColor: COLOR_BG_LIGHT,
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 4;
  };

  const renderEmbeddedImage = async (img: UploadedImage, index1: number): Promise<void> => {
    if (!img?.dataUrl) return;
    const loadedImg = await loadSvgOrImageToCanvasPng(img.dataUrl, 1200);
    if (!loadedImg) return;

    const maxW = Math.min(contentWidth - 12, 140);
    const maxH = 75;
    const size = fitImageSize(loadedImg.width, loadedImg.height, maxW, maxH, img.widthPercent);
    const dispW = size.width;
    const dispH = size.height;
    const hasDesc = Boolean(img.description);
    const cardHeight = dispH + 11 + (hasDesc ? 4.5 : 0);
    checkPageBreak(cardHeight + 6);

    const cardX = margin;
    const cardY = cursorY;
    doc.setFillColor(COLOR_BG_LIGHT[0], COLOR_BG_LIGHT[1], COLOR_BG_LIGHT[2]);
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(cardX, cardY, contentWidth, cardHeight, 1.5, 1.5, 'FD');

    const align = getImageAlign(img);
    const imgX = pdfImageX(cardX, contentWidth, dispW, align);
    const imgY = cardY + 2.5;
    doc.addImage(loadedImg.dataUrl, 'PNG', imgX, imgY, dispW, dispH);

    const captionY = imgY + dispH + 4;
    const captionAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
    const captionX = align === 'left' ? cardX + 4 : align === 'right' ? cardX + contentWidth - 4 : pageWidth / 2;
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`[IMAGEN_${index1}] ${img.title || 'Captura de referencia'}`, captionX, captionY, { align: captionAlign });
    if (hasDesc && img.description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      doc.text(img.description, captionX, captionY + 3.8, { align: captionAlign });
    }
    cursorY += cardHeight + 4;
  };

  const renderSection = async (title: string, sectionNumber: string, content: string, isCode = false) => {
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
      const tables = techDoc.tables || [];
      const parts = (content || '').split(/(\[TABLA_\d+\]|\[IMAGEN_\d+\])/gi);
      for (const part of parts) {
        const tableMatch = part.match(/^\[TABLA_(\d+)\]$/i);
        if (tableMatch) {
          const tbl = tables[parseInt(tableMatch[1], 10) - 1];
          if (tbl) renderCustomTable(tbl);
          continue;
        }
        const imageMatch = part.match(/^\[IMAGEN_(\d+)\]$/i);
        if (imageMatch) {
          const idx = parseInt(imageMatch[1], 10) - 1;
          const img = images[idx];
          if (img) await renderEmbeddedImage(img, idx + 1);
          continue;
        }
        if (part.trim()) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
          const lines = doc.splitTextToSize(part.trim(), contentWidth);
          checkPageBreak(lines.length * 4);
          doc.text(lines, margin, cursorY);
          cursorY += lines.length * 4 + 4;
        }
      }
      if (!content?.trim() && !parts.some((p) => /^\[(TABLA|IMAGEN)_\d+\]$/i.test(p))) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
        doc.text('Sin información especificada.', margin, cursorY);
        cursorY += 8;
      }
    }
  };

  await renderSection('Ruta de Acceso & Navegación en el Sistema', '1', techDoc.ruta);
  await renderSection('Flujo Operativo Interno', '2', techDoc.flujoOperativo);
  await renderSection('Diseño de Interfaz y Estructura de Datos', '3', techDoc.diseno);
  await renderSection('Consideraciones Técnicas y de Seguridad', '4', techDoc.consideracionesTecnicas);

  const usedTableIndexes = new Set<number>();
  const markUsed = (text?: string) => {
    const re = /\[TABLA_(\d+)\]/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text || '')) !== null) {
      usedTableIndexes.add(parseInt(m[1], 10) - 1);
    }
  };
  markUsed(techDoc.ruta);
  markUsed(techDoc.flujoOperativo);
  markUsed(techDoc.diseno);
  markUsed(techDoc.consideracionesTecnicas);
  const unusedTables = (techDoc.tables || []).filter((_, i) => !usedTableIndexes.has(i));
  if (unusedTables.length > 0) {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text('TABLAS ADICIONALES', margin, cursorY);
    doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, cursorY + 1.5, pageWidth - margin, cursorY + 1.5);
    cursorY += 6;
    unusedTables.forEach((table) => renderCustomTable(table));
  }

  const usedImageIndexes = new Set<number>();
  const markUsedImages = (text?: string) => {
    const re = /\[IMAGEN_(\d+)\]/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text || '')) !== null) {
      usedImageIndexes.add(parseInt(m[1], 10) - 1);
    }
  };
  markUsedImages(techDoc.ruta);
  markUsedImages(techDoc.flujoOperativo);
  markUsedImages(techDoc.diseno);
  markUsedImages(techDoc.consideracionesTecnicas);
  const unusedImages = images.filter((_, i) => !usedImageIndexes.has(i));
  if (unusedImages.length > 0) {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text('IMÁGENES ADICIONALES', margin, cursorY);
    doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, cursorY + 1.5, pageWidth - margin, cursorY + 1.5);
    cursorY += 6;
    for (let i = 0; i < images.length; i++) {
      if (!usedImageIndexes.has(i)) {
        await renderEmbeddedImage(images[i], i + 1);
      }
    }
  }

  await renderSection('Código de Ejemplo / Scripts', '5', techDoc.codigoEjemplo || '', true);

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
  filename?: string,
  images: UploadedImage[] = []
): Promise<void> {
  const blob = await generateTechnicalDocPdf(metadata, techDoc, images);
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
