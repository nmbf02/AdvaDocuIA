import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MetadataHeader, TechnicalDoc, DocumentTable, UploadedImage, getEffectiveTechnicalTitles, getEffectiveTechnicalHeaderFooter } from '../types';
import { getAdvansysBannerSvg } from '../data/banner';
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
  const headerFooter = getEffectiveTechnicalHeaderFooter(techDoc, metadata);
  const titles = getEffectiveTechnicalTitles(metadata.customTitles || techDoc.customTitles);
  const mainTitle = techDoc.tituloDocumento?.trim() || titles.techMainTitle;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 0;

  const checkPageBreak = (neededHeight: number): void => {
    if (cursorY + neededHeight > pageHeight - 16) {
      doc.addPage();
      cursorY = 20;
    }
  };

  // 1. PAGE 1 INSTITUTIONAL FULL-BLEED BANNER (If enabled)
  if (headerFooter.includeFirstPageHeaderImage) {
    const bannerSvg = getAdvansysBannerSvg(
      headerFooter.techHeaderBrandTag || 'ADVANSYS',
      headerFooter.techHeaderSubtitle || 'ESPECIFICACIÓN TÉCNICA INTERNA DE DESARROLLO',
      metadata.logoDataUrl
    );
    const bannerPng = await loadSvgOrImageToCanvasPng(bannerSvg, 2400);
    let bannerHeight = 36;
    if (bannerPng) {
      bannerHeight = (pageWidth * bannerPng.height) / bannerPng.width;
      doc.addImage(bannerPng.dataUrl, 'PNG', 0, 0, pageWidth, bannerHeight);
      doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
      doc.rect(0, bannerHeight - 1.6, pageWidth, 1.6, 'F');
    } else {
      bannerHeight = 32;
      doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.rect(0, 0, pageWidth, bannerHeight, 'F');
      doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
      doc.rect(0, bannerHeight - 1.6, pageWidth, 1.6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(headerFooter.techHeaderBrandTag || 'ADVANSYS', 12, 14);
    }
    cursorY = bannerHeight + 7;
  } else {
    // Margen superior inicial sin header gráfico en primera página
    cursorY = 20;
  }

  // 2. Main Title
  if (!titles.hideTechMainTitle) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    const titleLines = doc.splitTextToSize(mainTitle.toUpperCase(), contentWidth);
    doc.text(titleLines, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += titleLines.length * 4.5 + 3;
  }

  // 3. Metadata Table (6-column modular grid)
  const colW6 = contentWidth / 6;
  const metaRows = [
    // Row 1: CLIENTE (50%) | FECHA (50%)
    [
      { content: `CLIENTE:  ${metadata.cliente || 'N/A'}`, colSpan: 3 },
      { content: `FECHA:  ${metadata.fecha || new Date().toISOString().split('T')[0]}`, colSpan: 3 },
    ],
    // Row 2: TICKET NO. (33.3%) | GUÍA NO. (33.3%) | MÓDULO (33.3%)
    [
      { content: `TICKET NO.:  ${metadata.ticketNo || 'N/A'}`, colSpan: 2 },
      { content: `GUÍA NO.:  ${metadata.guiaNo || 'N/A'}`, colSpan: 2 },
      { content: `MÓDULO:  ${metadata.moduloAplicacion || 'N/A'}`, colSpan: 2 },
    ],
    // Row 3: PROYECTO (100%)
    [
      { content: `PROYECTO:  ${metadata.nombreProyecto || 'N/A'}`, colSpan: 6, styles: { fontStyle: 'bold' } },
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    tableWidth: contentWidth,
    margin: { left: margin, right: margin },
    body: metaRows as any,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: COLOR_TEXT_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2,
      font: 'helvetica',
      fillColor: COLOR_BG_LIGHT,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: colW6 },
      1: { cellWidth: colW6 },
      2: { cellWidth: colW6 },
      3: { cellWidth: colW6 },
      4: { cellWidth: colW6 },
      5: { cellWidth: colW6 },
    },
  });

  cursorY = (doc as any).lastAutoTable.finalY + 6;

  // Helpers
  const renderSectionHeader = (title: string, sectionNumber: string, pageBreak = false): void => {
    if (pageBreak) {
      doc.addPage();
      cursorY = 20;
    } else {
      checkPageBreak(16);
      cursorY += 2;
    }

    const fullTitle = `${sectionNumber}. ${title.toUpperCase()}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text(fullTitle, margin, cursorY + 3.5);

    // Accent line under title
    doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.rect(margin, cursorY + 5.5, contentWidth, 0.7, 'F');
    cursorY += 8.5;
  };

  const renderParagraph = (text?: string): void => {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    const rawLines = cleanText.split('\n');

    for (const rawLine of rawLines) {
      const trimmedLine = rawLine.trim();
      if (!trimmedLine) continue;

      const bulletMatch = rawLine.match(/^(\s*)([•\-\*])\s+(.*)$/);
      const numberMatch = rawLine.match(/^(\s*)(\d+)[\.\)]\s+(.*)$/);

      if (bulletMatch) {
        const indentExtra = bulletMatch[1].length >= 4 ? 4.0 : 0;
        const bulletIndent = 4.5 + indentExtra;
        const contentStr = bulletMatch[3].replace(/\*\*/g, '');
        const textWidth = contentWidth - bulletIndent;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
        const lines = doc.splitTextToSize(contentStr, textWidth);
        const needed = lines.length * 3.8 + 1.2;
        checkPageBreak(needed);

        doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
        doc.circle(margin + indentExtra + 1.6, cursorY - 1, 0.7, 'F');
        doc.text(lines, margin + bulletIndent, cursorY);
        cursorY += needed;
      } else if (numberMatch) {
        const indentExtra = numberMatch[1].length >= 4 ? 4.0 : 0;
        const numIndent = 5.5 + indentExtra;
        const numStr = `${numberMatch[2]}. `;
        const contentStr = numberMatch[3].replace(/\*\*/g, '');
        const textWidth = contentWidth - numIndent;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        doc.text(numStr, margin + indentExtra, cursorY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
        const lines = doc.splitTextToSize(contentStr, textWidth);
        const needed = lines.length * 3.8 + 1.2;
        checkPageBreak(needed);
        doc.text(lines, margin + numIndent, cursorY);
        cursorY += needed;
      } else {
        const contentStr = trimmedLine.replace(/\*\*/g, '');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
        const lines = doc.splitTextToSize(contentStr, contentWidth);
        const needed = lines.length * 3.8 + 2.0;
        checkPageBreak(needed);
        doc.text(lines, margin, cursorY);
        cursorY += needed;
      }
    }
  };

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
    renderSectionHeader(title, sectionNumber);

    if (isCode) {
      const codeLines = doc.splitTextToSize(content || 'No aplica código.', contentWidth - 6);
      const codeHeight = codeLines.length * 3.4 + 6;
      checkPageBreak(codeHeight);

      doc.setFillColor(30, 41, 59); // Dark background for code
      doc.roundedRect(margin, cursorY, contentWidth, codeHeight, 1, 1, 'F');

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(226, 232, 240);
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
          renderParagraph(part.trim());
        }
      }
    }
  };

  if (!titles.hideTechSection1 && Boolean(techDoc.ruta?.trim())) {
    await renderSection(titles.techSection1, '1', techDoc.ruta.trim());
  }
  if (!titles.hideTechSection2 && Boolean(techDoc.flujoOperativo?.trim())) {
    await renderSection(titles.techSection2, '2', techDoc.flujoOperativo.trim());
  }
  if (!titles.hideTechSection3 && Boolean(techDoc.diseno?.trim())) {
    await renderSection(titles.techSection3, '3', techDoc.diseno.trim());
  }
  if (!titles.hideTechSection4 && Boolean(techDoc.consideracionesTecnicas?.trim())) {
    await renderSection(titles.techSection4, '4', techDoc.consideracionesTecnicas.trim());
  }

  const usedTableIndexes = new Set<number>();
  const markUsed = (text?: string) => {
    const re = /\[TABLA_(\d+)\]/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text || '')) !== null) {
      usedTableIndexes.add(parseInt(m[1], 10) - 1);
    }
  };
  if (!titles.hideTechSection1 && Boolean(techDoc.ruta?.trim())) markUsed(techDoc.ruta);
  if (!titles.hideTechSection2 && Boolean(techDoc.flujoOperativo?.trim())) markUsed(techDoc.flujoOperativo);
  if (!titles.hideTechSection3 && Boolean(techDoc.diseno?.trim())) markUsed(techDoc.diseno);
  if (!titles.hideTechSection4 && Boolean(techDoc.consideracionesTecnicas?.trim())) markUsed(techDoc.consideracionesTecnicas);
  const unusedTables = (techDoc.tables || []).filter((_, i) => !usedTableIndexes.has(i));
  if (unusedTables.length > 0) {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text('TABLAS ADICIONALES', margin, cursorY + 3.5);
    doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.rect(margin, cursorY + 5.5, contentWidth, 0.7, 'F');
    cursorY += 8.5;
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
  if (!titles.hideTechSection1 && Boolean(techDoc.ruta?.trim())) markUsedImages(techDoc.ruta);
  if (!titles.hideTechSection2 && Boolean(techDoc.flujoOperativo?.trim())) markUsedImages(techDoc.flujoOperativo);
  if (!titles.hideTechSection3 && Boolean(techDoc.diseno?.trim())) markUsedImages(techDoc.diseno);
  if (!titles.hideTechSection4 && Boolean(techDoc.consideracionesTecnicas?.trim())) markUsedImages(techDoc.consideracionesTecnicas);
  const unusedImages = images.filter((_, i) => !usedImageIndexes.has(i));
  if (unusedImages.length > 0) {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text('IMÁGENES ADICIONALES', margin, cursorY + 3.5);
    doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.rect(margin, cursorY + 5.5, contentWidth, 0.7, 'F');
    cursorY += 8.5;
    for (let i = 0; i < images.length; i++) {
      if (!usedImageIndexes.has(i)) {
        await renderEmbeddedImage(images[i], i + 1);
      }
    }
  }

  if (!titles.hideTechSection5 && Boolean(techDoc.codigoEjemplo?.trim())) {
    await renderSection(titles.techSection5, '5', techDoc.codigoEjemplo.trim(), true);
  }

  // Footers and Page Numbers with dynamic technical header and footer configuration
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Header line on pages (skip on page 1 if full banner image is displayed)
    if (p > 1 || !headerFooter.includeFirstPageHeaderImage) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      const brandTag = headerFooter.techHeaderBrandTag || 'ADVANSYS';
      doc.text(brandTag, margin, 10);

      const brandWidth = doc.getTextWidth(brandTag);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      doc.text('  |  ', margin + brandWidth + 1, 10);

      const sepWidth = doc.getTextWidth('  |  ');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
      const subTitle = headerFooter.techHeaderSubtitle || 'ESPECIFICACIÓN TÉCNICA INTERNA DE DESARROLLO';
      doc.text(subTitle, margin + brandWidth + sepWidth + 1, 10);

      const rightText = headerFooter.techHeaderRightText || metadata.ticketNo;
      if (rightText) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
        doc.text(rightText, pageWidth - margin, 10, { align: 'right' });
      }

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
    doc.text(headerFooter.techFooterText || 'DOCUMENTO CONFIDENCIAL DE USO INTERNO ADVANSYS', margin, footerY);

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
