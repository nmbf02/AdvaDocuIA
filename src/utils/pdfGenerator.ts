import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MetadataHeader, ProposalSection, UploadedImage, DocumentTable, getEffectiveTitles } from '../types';
import { getAdvansysBannerSvg } from '../data/banner';

// Advansys Corporate Color Palette (RGB tuples for vector jsPDF)
const COLOR_PRIMARY: [number, number, number] = [10, 61, 98]; // #0A3D62 Deep Corporate Blue
const COLOR_SECONDARY: [number, number, number] = [30, 95, 138]; // #1E5F8A Tech Blue
const COLOR_ACCENT: [number, number, number] = [46, 204, 113]; // #2ECC71 Advansys Emerald Green
const COLOR_TEXT_DARK: [number, number, number] = [30, 41, 59]; // #1E293B Slate Dark
const COLOR_MUTED: [number, number, number] = [100, 116, 139]; // #64748B Slate Muted
const COLOR_BG_LIGHT: [number, number, number] = [248, 250, 252]; // #F8FAFC
const COLOR_BORDER: [number, number, number] = [203, 213, 225]; // #CBD5E1

interface LoadedImageInfo {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Robustly converts any SVG or image data URL (PNG, JPEG, WebP)
 * to a high-resolution PNG dataUrl via an offscreen HTML Canvas.
 * This guarantees 100% compatibility with jsPDF without format decoding errors.
 */
async function loadSvgOrImageToCanvasPng(
  src: string,
  targetWidth = 1600
): Promise<LoadedImageInfo | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 4000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const naturalW = img.naturalWidth || img.width || 800;
        const naturalH = img.naturalHeight || img.height || 400;
        const aspect = naturalH / naturalW;
        const canvasW = Math.max(targetWidth, naturalW);
        const canvasH = Math.round(canvasW * aspect);

        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvasW, canvasH);

        const pngData = canvas.toDataURL('image/png', 1.0);
        resolve({ dataUrl: pngData, width: canvasW, height: canvasH });
      } catch (err) {
        console.warn('Canvas conversion failed for image:', err);
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = src;
  });
}

/**
 * Generates a 100% true vector PDF document with selectable, searchable text,
 * crisp vector graphics, institutional Advansys headers/footers, and full-width cover banner.
 */
export async function generateAdvansysPdf(
  metadata: MetadataHeader,
  proposal: ProposalSection,
  images: UploadedImage[] = []
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter', // 215.9 x 279.4 mm
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 0;

  const checkPageBreak = (neededHeight: number): void => {
    if (cursorY + neededHeight > pageHeight - 16) {
      doc.addPage();
      cursorY = 20; // Leave space for running header on subsequent pages
    }
  };

  // =========================================================================
  // 1. PAGE 1 INSTITUTIONAL FULL-BLEED BANNER (Full width 0 to pageWidth, top: 0)
  // =========================================================================
  const bannerSvg = getAdvansysBannerSvg(
    metadata.headerBrandTag || 'ADVANSYS',
    metadata.headerSubtitle ?? '',
    metadata.logoDataUrl
  );

  const bannerPng = await loadSvgOrImageToCanvasPng(bannerSvg, 2400);
  let bannerHeight = 36;

  if (bannerPng) {
    bannerHeight = (pageWidth * bannerPng.height) / bannerPng.width;
    // Render full bleed banner from edge to edge (x: 0, y: 0, w: pageWidth)
    doc.addImage(bannerPng.dataUrl, 'PNG', 0, 0, pageWidth, bannerHeight);

    // Bottom Emerald border stripe under banner
    doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.rect(0, bannerHeight - 1.6, pageWidth, 1.6, 'F');
  } else {
    // Fallback full-bleed banner
    bannerHeight = 32;
    doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.rect(0, 0, pageWidth, bannerHeight, 'F');
    doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.rect(0, bannerHeight - 1.6, pageWidth, 1.6, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(metadata.headerBrandTag || 'ADVANSYS', 12, 14);
  }

  // Start content right below the full-width banner with comfortable padding
  cursorY = bannerHeight + 7;

  const titles = getEffectiveTitles(metadata.customTitles);

  // ==========================================
  // 2. MAIN DOCUMENT TITLE
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text(titles.mainTitle, pageWidth / 2, cursorY + 2, {
    align: 'center',
  });
  cursorY += 7.5;

  // ==========================================
  // 3. METADATA SUMMARY VECTOR TABLE (Matches Word layout 100% without overflow)
  // ==========================================
  const colW6 = contentWidth / 6;

  const metaRows = [
    // Row 1: CLIENTE (50%) | FECHA (50%)
    [
      { content: `CLIENTE:  ${metadata.cliente || 'N/A'}`, colSpan: 3 },
      { content: `FECHA:  ${metadata.fecha || new Date().toISOString().split('T')[0]}`, colSpan: 3 },
    ],
    // Row 2: TICKET NO. (33.3%) | GUÍA NO. (33.3%) | PROPUESTA Nº (33.3%)
    [
      { content: `TICKET NO.:  ${metadata.ticketNo || 'N/A'}`, colSpan: 2 },
      { content: `GUÍA NO.:  ${metadata.guiaNo || 'N/A'}`, colSpan: 2 },
      { content: `PROPUESTA Nº:  ${metadata.propuestaNo || 'N/A'}`, colSpan: 2 },
    ],
    // Row 3: PROYECTO (50%) | MÓDULO / APLICACIÓN (50%)
    [
      { content: `PROYECTO:  ${metadata.nombreProyecto || 'N/A'}`, colSpan: 3 },
      { content: `MÓDULO / APLICACIÓN:  ${metadata.moduloAplicacion || 'N/A'}`, colSpan: 3 },
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

  // ==========================================
  // HELPER FUNCTIONS FOR VECTOR SECTIONS
  // ==========================================
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
        const numStr = `${numberMatch[2]}.`;
        const contentStr = numberMatch[3].replace(/\*\*/g, '');
        const numberIndent = 5.5 + indentExtra;
        const textWidth = contentWidth - numberIndent;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        
        const lines = doc.splitTextToSize(contentStr, textWidth);
        const needed = lines.length * 3.8 + 1.2;
        checkPageBreak(needed);

        doc.text(numStr, margin + indentExtra, cursorY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
        doc.text(lines, margin + numberIndent, cursorY);
        cursorY += needed;
      } else {
        const contentStr = trimmedLine.replace(/\*\*/g, '');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);

        const lines = doc.splitTextToSize(contentStr, contentWidth);
        const needed = lines.length * 3.8 + 1.8;
        checkPageBreak(needed);

        doc.text(lines, margin, cursorY);
        cursorY += needed;
      }
    }
  };

  const renderBulletList = (items?: string[], prefixColor: [number, number, number] = COLOR_ACCENT): void => {
    if (!items || items.length === 0) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);

    for (const item of items) {
      if (!item || !item.trim()) continue;
      const cleanItem = item.trim();
      const bulletIndent = 4.2;
      const textWidth = contentWidth - bulletIndent;
      const lines = doc.splitTextToSize(cleanItem, textWidth);
      const needed = lines.length * 3.8 + 1.2;
      checkPageBreak(needed);

      // Bullet dot
      doc.setFillColor(prefixColor[0], prefixColor[1], prefixColor[2]);
      doc.circle(margin + 1.6, cursorY - 1, 0.7, 'F');

      doc.text(lines, margin + bulletIndent, cursorY);
      cursorY += needed;
    }
    cursorY += 1.5;
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

  const renderRichTextWithTables = (text?: string, tables: DocumentTable[] = []): void => {
    if (!text) return;
    const parts = text.split(/(\[TABLA_\d+\])/gi);
    for (const part of parts) {
      const match = part.match(/^\[TABLA_(\d+)\]$/i);
      if (match) {
        const tableIndex = parseInt(match[1], 10) - 1;
        const tbl = tables[tableIndex];
        if (tbl) {
          renderCustomTable(tbl);
        }
      } else if (part.trim()) {
        renderParagraph(part.trim());
      }
    }
  };

  const docTables = proposal.tables || [];

  // ==========================================
  // SECTION 1. RESUMEN EJECUTIVO
  // ==========================================
  if (!titles.hideSection1) {
    renderSectionHeader(titles.section1, '1');
    renderRichTextWithTables(proposal.resumenEjecutivo, docTables);
  }

  // ==========================================
  // SECTION 2. BENEFICIOS DE LA PROPUESTA
  // ==========================================
  if (!titles.hideSection2 && proposal.beneficios && proposal.beneficios.length > 0) {
    renderSectionHeader(titles.section2, '2');
    renderBulletList(proposal.beneficios);
  }

  // ==========================================
  // SECTION 3. ALCANCE, EXCLUSIONES Y ENTREGABLES
  // ==========================================
  if (!titles.hideSection3) {
    const scope = proposal.alcanceExclusionesEntregables;
    if (scope) {
      renderSectionHeader(titles.section3, '3');

      if (!titles.hideSection3_1 && scope.alcance && scope.alcance.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
        checkPageBreak(8);
        const s31 = titles.section3_1.startsWith('3.1') ? titles.section3_1 : `3.1 ${titles.section3_1}`;
        doc.text(s31, margin, cursorY + 2);
        cursorY += 5;
        renderBulletList(scope.alcance, COLOR_SECONDARY);
      }

      if (!titles.hideSection3_2 && scope.exclusiones && scope.exclusiones.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        checkPageBreak(8);
        const s32 = titles.section3_2.startsWith('3.2') ? titles.section3_2 : `3.2 ${titles.section3_2}`;
        doc.text(s32, margin, cursorY + 2);
        cursorY += 5;
        renderBulletList(scope.exclusiones, COLOR_PRIMARY);
      }

      if (!titles.hideSection3_3 && scope.entregables && scope.entregables.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
        checkPageBreak(8);
        const s33 = titles.section3_3.startsWith('3.3') ? titles.section3_3 : `3.3 ${titles.section3_3}`;
        doc.text(s33, margin, cursorY + 2);
        cursorY += 5;
        renderBulletList(scope.entregables, COLOR_ACCENT);
      }
    }
  }

  // ==========================================
  // SECTION 4. OBJETIVO GENERAL Y ESPECÍFICOS (Página 2)
  // ==========================================
  if (!titles.hideSection4) {
    renderSectionHeader(titles.section4, '4', true);
    renderRichTextWithTables(proposal.objetivo, docTables);
  }

  // ==========================================
  // SECTION 5. DESCRIPCIÓN DE LA SOLUCIÓN PROPUESTA
  // ==========================================
  if (!titles.hideSection5) {
    renderSectionHeader(titles.section5, '5');
    renderRichTextWithTables(proposal.descripcion, docTables);
  }

  // ==========================================
  // SECTION 6. ÍNDICE DE ANÁLISIS OPERATIVO
  // ==========================================
  if (!titles.hideSection6 && proposal.indiceAnalisisOperativo && proposal.indiceAnalisisOperativo.length > 0) {
    renderSectionHeader(titles.section6, '6');
    for (let i = 0; i < proposal.indiceAnalisisOperativo.length; i++) {
      const item = proposal.indiceAnalisisOperativo[i];
      if (!item) continue;
      const numPrefix = `${i + 1}. `;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);

      const lines = doc.splitTextToSize(`${numPrefix}${item}`, contentWidth - 4);
      const needed = lines.length * 3.8 + 1.2;
      checkPageBreak(needed);
      doc.text(lines, margin + 2, cursorY);
      cursorY += needed;
    }
    cursorY += 2;
  }

  // ==========================================
  // SECTION 7. ANÁLISIS OPERATIVO DETALLADO (Paso a Paso con Imágenes)
  // ==========================================
  if (!titles.hideSection7 && proposal.analisisOperativo && proposal.analisisOperativo.length > 0) {
    renderSectionHeader(titles.section7, '7');

    for (let idx = 0; idx < proposal.analisisOperativo.length; idx++) {
      const step = proposal.analisisOperativo[idx];
      checkPageBreak(16);

      // Step Header Box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      const stepTitle = `Paso 7.${idx + 1}: ${step.titulo}`;
      doc.text(stepTitle, margin, cursorY + 2);
      cursorY += 5.5;

      // Check for associated image
      const matchingImg = images[idx] || (step.imagenId ? images.find(img => img.id === step.imagenId) : undefined);
      if (matchingImg && matchingImg.dataUrl) {
        const loadedImg = await loadSvgOrImageToCanvasPng(matchingImg.dataUrl, 1200);
        if (loadedImg) {
          const maxW = Math.min(contentWidth - 12, 140);
          const maxH = 75;
          const scale = Math.min(maxW / loadedImg.width, maxH / loadedImg.height, 1);
          const dispW = Math.max(50, Math.round(loadedImg.width * scale));
          const dispH = Math.max(30, Math.round(loadedImg.height * scale));

          const hasDesc = Boolean(matchingImg.description);
          const cardHeight = dispH + 11 + (hasDesc ? 4.5 : 0);

          // Ensure entire image block fits on current page cleanly
          checkPageBreak(cardHeight + 6);

          const cardX = margin;
          const cardW = contentWidth;
          const cardY = cursorY;

          // Card Background
          doc.setFillColor(COLOR_BG_LIGHT[0], COLOR_BG_LIGHT[1], COLOR_BG_LIGHT[2]);
          doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
          doc.setLineWidth(0.2);
          doc.roundedRect(cardX, cardY, cardW, cardHeight, 1.5, 1.5, 'FD');

          const imgX = cardX + (cardW - dispW) / 2;
          const imgY = cardY + 2.5;

          // Render Image
          doc.addImage(loadedImg.dataUrl, 'PNG', imgX, imgY, dispW, dispH);

          // Image Caption
          const captionY = imgY + dispH + 4;
          doc.setFont('helvetica', 'bolditalic');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          const captionText = `[IMAGEN_${idx + 1}] ${matchingImg.title || 'Captura de referencia'}`;
          doc.text(captionText, pageWidth / 2, captionY, { align: 'center' });

          if (hasDesc && matchingImg.description) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
            doc.text(matchingImg.description, pageWidth / 2, captionY + 3.8, { align: 'center' });
          }

          // Advance cursor cleanly past image card
          cursorY += cardHeight + 4;
        }
      }

      // Step Explanation Text (always rendered below image)
      if (step.explicacion) {
        renderRichTextWithTables(step.explicacion, docTables);
      }
      cursorY += 3;
    }
  }

  // ==========================================
  // TABLAS DE APOYO NO INSERTADAS EN TEXTO
  // ==========================================
  const allTextBlob = [
    proposal.resumenEjecutivo || '',
    proposal.objetivo || '',
    proposal.descripcion || '',
    proposal.descargo || '',
    ...(proposal.analisisOperativo || []).map((s) => s.explicacion || ''),
  ].join('\n').toUpperCase();

  const unusedTables = docTables.filter((_, idx) => {
    const tag = `[TABLA_${idx + 1}]`.toUpperCase();
    return !allTextBlob.includes(tag);
  });

  if (unusedTables.length > 0) {
    renderSectionHeader('Tablas de Apoyo', '');
    for (const tbl of unusedTables) {
      renderCustomTable(tbl);
    }
  }

  // ==========================================
  // SECTION 8. DESCARGO Y CLÁUSULA ESTÁNDAR
  // ==========================================
  if (!titles.hideSection8) {
    const descargoText = (proposal.descargo && proposal.descargo.trim())
      ? proposal.descargo.trim()
      : 'La presente propuesta técnica y análisis operativo han sido elaborados exclusivamente por Advansys para uso confidencial del cliente indicado. Los requerimientos, diagramas y estimaciones contenidos están sujetos a validación formal tras la aprobación del acta de inicio de proyecto. Queda prohibida la reproducción parcial o total sin autorización expresa.';

    renderSectionHeader(titles.section8, '8');

    // Render descargo card with exact same styling as Web Preview and Word:
    // Background: slate-50 (COLOR_BG_LIGHT), border: slate-200 (COLOR_BORDER), font: italic slate-500 (COLOR_MUTED)
    const paddingX = 4.5;
    const paddingY = 3.5;
    const innerWidth = contentWidth - paddingX * 2;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);

    const descargoLines = doc.splitTextToSize(descargoText, innerWidth);
    const textBlockHeight = descargoLines.length * 3.8;
    const cardHeight = textBlockHeight + paddingY * 2 + 1;

    checkPageBreak(cardHeight + 4);

    // Background card box
    doc.setFillColor(COLOR_BG_LIGHT[0], COLOR_BG_LIGHT[1], COLOR_BG_LIGHT[2]);
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, cursorY, contentWidth, cardHeight, 1.5, 1.5, 'FD');

    // Text inside card
    doc.text(descargoLines, margin + paddingX, cursorY + paddingY + 3.2);

    cursorY += cardHeight + 6;
  }

  // ==========================================
  // 5. RUNNING HEADERS & FOOTERS ON ALL PAGES
  // ==========================================
  const totalPages = doc.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Running Header on pages 2+
    if (p > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      const headerSubtitleText = metadata.headerSubtitle?.trim() || metadata.nombreProyecto?.trim() || 'Propuesta de Desarrollo';
      doc.text(
        `${(metadata.headerBrandTag || 'ADVANSYS').trim()} • ${headerSubtitleText}`,
        margin,
        10
      );

      doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, 12, pageWidth - margin, 12);
    }

    // Running Footer on all pages
    const footerY = pageHeight - 8;
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 2.5, pageWidth - margin, footerY - 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(
      (metadata.footerText || 'Advansys SRL').trim(),
      margin,
      footerY
    );

    const pageStr = `Página ${p} de ${totalPages}`;
    doc.text(pageStr, pageWidth - margin, footerY, { align: 'right' });
  }

  return doc.output('blob');
}

/**
 * Triggers browser download of the vector PDF
 */
export async function downloadAdvansysPdf(
  metadata: MetadataHeader,
  proposal: ProposalSection,
  images: UploadedImage[] = [],
  filename?: string
): Promise<void> {
  const blob = await generateAdvansysPdf(metadata, proposal, images);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const baseName = filename || metadata.nombreProyecto || 'Propuesta_Desarrollo_Advansys';
  const safeName = baseName.toLowerCase().endsWith('.pdf') ? baseName : `${baseName}.pdf`;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
