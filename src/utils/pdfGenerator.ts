import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MetadataHeader, ProposalSection, UploadedImage, DocumentTable, getEffectiveTitles, getEffectiveProposalHeaderFooter, COVER_SCOPE_MAX_ITEMS, getEffectiveCommercialPage, getSubsections, subsectionHasContent, sectionHasBodyOrSubs, NestedSectionField } from '../types';
import { getAdvansysBannerSvg } from '../data/banner';
import { formatFechaEs } from './dateFormat';
import { fitImageSize, getImageAlign, pdfImageX } from './imageLayout';
import { renderCommercialPagePng } from './commercialPageRender';

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
    const timer = setTimeout(() => resolve(null), 20000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const naturalW = img.naturalWidth || img.width || 800;
        const naturalH = img.naturalHeight || img.height || 400;
        const aspect = naturalH / Math.max(naturalW, 1);
        const canvasW = Math.min(2000, Math.max(targetWidth, naturalW));
        const canvasH = Math.max(1, Math.round(canvasW * aspect));

        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasW, canvasH);
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

  const titles = getEffectiveTitles(metadata.customTitles);
  const effectiveHF = getEffectiveProposalHeaderFooter(metadata);

  // =========================================================================
  // 1. PAGE 1 INSTITUTIONAL FULL-BLEED BANNER (Full width 0 to pageWidth, top: 0)
  // =========================================================================
  const bannerSvg = getAdvansysBannerSvg(
    effectiveHF.headerBrandTag,
    titles.coverSubtitle,
    metadata.logoDataUrl,
    {
      coverTitle: titles.mainTitle,
      cliente: metadata.cliente,
      fecha: formatFechaEs(metadata.fecha),
      ticketNo: metadata.ticketNo,
      propuestaNo: metadata.propuestaNo,
      showInfoCard: true,
    }
  );

  const bannerPng = await loadSvgOrImageToCanvasPng(bannerSvg, 2400);
  let bannerHeight = 36;

  if (bannerPng) {
    bannerHeight = (pageWidth * bannerPng.height) / bannerPng.width;
    // Render full bleed banner from edge to edge (x: 0, y: 0, w: pageWidth)
    doc.addImage(bannerPng.dataUrl, 'PNG', 0, 0, pageWidth, bannerHeight);
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

  // Cover SVG already includes the hanging info card; keep a short gap to the project title
  cursorY = bannerHeight + 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.text('PROYECTO', margin, cursorY);
  cursorY += 7;
  doc.setFontSize(16);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  const projectLines = doc.splitTextToSize(metadata.nombreProyecto || 'Nombre del análisis', contentWidth - 10);
  doc.text(projectLines, margin, cursorY);
  cursorY += projectLines.length * 6.5 + 2;
  doc.setFontSize(11);
  doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.text(metadata.moduloAplicacion || 'Aplicación o módulo', margin, cursorY);
  cursorY += 8;

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

  const renderNestedSubs = async (field: NestedSectionField, sectionNum: string): Promise<void> => {
    const items = getSubsections(proposal, field).filter(subsectionHasContent);
    for (let i = 0; i < items.length; i++) {
      const sub = items[i];
      checkPageBreak(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text(`${sectionNum}.${i + 1}  ${sub.title.trim() || 'Subsección'}`, margin, cursorY + 3);
      cursorY += 7;
      if (sub.body?.trim()) await renderRichTextWithTables(sub.body.trim(), docTables);
    }
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
        const indentExtra = 0;
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
        const indentExtra = 0;
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

  const renderedImageKeys = new Set<string>();

  const renderEmbeddedImage = async (img: UploadedImage, index1: number): Promise<void> => {
    if (!img?.dataUrl) return;
    const key = img.id || `idx-${index1}`;
    if (renderedImageKeys.has(key)) return;
    renderedImageKeys.add(key);
    const loadedImg = await loadSvgOrImageToCanvasPng(img.dataUrl, 1200);
    const raster = loadedImg?.dataUrl || img.dataUrl;
    const rasterFmt = loadedImg ? 'PNG' : img.mimeType?.includes('jpeg') || img.mimeType?.includes('jpg') ? 'JPEG' : 'PNG';
    const srcW = loadedImg?.width || img.width || 800;
    const srcH = loadedImg?.height || img.height || 400;

    const maxW = Math.min(contentWidth - 8, 160);
    const maxH = 90;
    const size = fitImageSize(srcW, srcH, maxW, maxH, img.widthPercent);
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
    try {
      doc.addImage(raster, rasterFmt, imgX, imgY, dispW, dispH);
    } catch (err) {
      console.warn('PDF addImage failed:', err);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      doc.text(`[IMAGEN_${index1}] no se pudo incrustar`, imgX, imgY + 8);
    }

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

  const renderRichTextWithTables = async (text?: string, tables: DocumentTable[] = []): Promise<void> => {
    if (!text) return;
    const parts = text.split(/(\[TABLA_\d+\]|\[IMAGEN_\d+\])/gi);
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
  };

  const docTables = proposal.tables || [];

  // Track page 2 break so first section after sections 1-3 starts on new page
  let page2BreakEmitted = false;
  const getPageBreakForLaterSection = () => {
    if (!page2BreakEmitted) {
      page2BreakEmitted = true;
      return true;
    }
    return false;
  };

  // ==========================================
  // SECTION 1. RESUMEN EJECUTIVO
  // ==========================================
  const hasSection1 =
    !titles.hideSection1 && sectionHasBodyOrSubs(proposal.resumenEjecutivo, getSubsections(proposal, 'resumenEjecutivo'));
  const validBeneficios = (proposal.beneficios || []).filter((b) => b && b.trim().length > 0).slice(0, COVER_SCOPE_MAX_ITEMS);
  const hasSection2 = !titles.hideSection2 && validBeneficios.length > 0;
  if (hasSection1 || hasSection2) {
    checkPageBreak(40);
    autoTable(doc, {
      startY: cursorY,
      tableWidth: contentWidth,
      margin: { left: margin, right: margin },
      theme: 'plain',
      styles: { fontSize: 9, textColor: COLOR_TEXT_DARK, font: 'helvetica', overflow: 'linebreak', cellPadding: 2.4, lineColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: contentWidth / 2 },
        1: { cellWidth: contentWidth / 2 },
      },
      body: [
        [
          hasSection1
            ? `${titles.section1.toUpperCase()}\n\n${[
                (proposal.resumenEjecutivo?.trim() || '').replace(/\[IMAGEN_\d+\]/gi, '').trim(),
                ...getSubsections(proposal, 'resumenEjecutivo')
                  .filter(subsectionHasContent)
                  .map((sub, i) =>
                    `${i + 1}. ${sub.title.trim() || 'Subsección'}\n${sub.body.replace(/\[IMAGEN_\d+\]/gi, '').trim()}`
                  ),
              ]
                .filter(Boolean)
                .join('\n\n')}`
            : '',
          hasSection2
            ? `${titles.section2.toUpperCase()}\n\n${validBeneficios.map((b) => `• ${b}`).join('\n')}`
            : '',
        ],
      ],
    });
    cursorY = (doc as any).lastAutoTable.finalY + 5;
    if (hasSection1) {
      const resumenWithImages = [
        proposal.resumenEjecutivo || '',
        ...getSubsections(proposal, 'resumenEjecutivo').map((sub) => sub.body || ''),
      ].join('\n');
      const resumenImgTags = [...resumenWithImages.matchAll(/\[IMAGEN_(\d+)\]/gi)];
      const seenResumenImgs = new Set<number>();
      for (const m of resumenImgTags) {
        const n = parseInt(m[1], 10);
        if (seenResumenImgs.has(n)) continue;
        seenResumenImgs.add(n);
        const img = images[n - 1];
        if (img) await renderEmbeddedImage(img, n);
      }
    }
  }

  const scope = proposal.alcanceExclusionesEntregables;
  const validAlcance = (scope?.alcance || []).filter((i) => i && i.trim().length > 0).slice(0, COVER_SCOPE_MAX_ITEMS);
  const validExclusiones = (scope?.exclusiones || []).filter((i) => i && i.trim().length > 0).slice(0, COVER_SCOPE_MAX_ITEMS);
  const validEntregables = (scope?.entregables || []).filter((i) => i && i.trim().length > 0).slice(0, COVER_SCOPE_MAX_ITEMS);
  const hasSection3_1 = !titles.hideSection3_1 && validAlcance.length > 0;
  const hasSection3_2 = !titles.hideSection3_2 && validExclusiones.length > 0;
  const hasSection3_3 = !titles.hideSection3_3 && validEntregables.length > 0;
  const hasSection3 = !titles.hideSection3 && (hasSection3_1 || hasSection3_2 || hasSection3_3);

  if (hasSection3) {
    renderSectionHeader(titles.section3, '3');
    const gap = 4;
    const colW = (contentWidth - gap * 2) / 3;
    const pad = 3.2;
    const cards = [
      {
        title: titles.section3_1.replace(/^3\.1\s*/, '').toUpperCase(),
        items: validAlcance,
        titleRgb: COLOR_SECONDARY,
      },
      {
        title: titles.section3_2.replace(/^3\.2\s*/, '').toUpperCase(),
        items: validExclusiones,
        titleRgb: COLOR_PRIMARY,
      },
      {
        title: titles.section3_3.replace(/^3\.3\s*/, '').toUpperCase(),
        items: validEntregables,
        titleRgb: [4, 120, 87] as [number, number, number],
      },
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const innerW = colW - pad * 2;
    const bulletIndent = 3.6;
    const prepared = cards.map((card) => {
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(card.title, innerW);
      doc.setFont('helvetica', 'normal');
      const bodyBlocks = card.items.map((item) =>
        doc.splitTextToSize(item.replace(/^[•\-\*]\s+/, ''), innerW - bulletIndent)
      );
      const bodyH = bodyBlocks.reduce((sum, lines) => sum + lines.length * 4.2 + 2.2, 0);
      const h = 6 + titleLines.length * 4.8 + 3 + bodyH + pad;
      return { ...card, titleLines, bodyBlocks, h };
    });
    const boxH = Math.max(...prepared.map((c) => c.h), 28);
    checkPageBreak(boxH + 4);

    prepared.forEach((card, i) => {
      const x = margin + i * (colW + gap);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.35);
      doc.roundedRect(x, cursorY, colW, boxH, 3.2, 3.2, 'FD');

      let ty = cursorY + pad + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(card.titleRgb[0], card.titleRgb[1], card.titleRgb[2]);
      doc.text(card.titleLines, x + pad, ty);
      ty += card.titleLines.length * 4.8 + 2;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
      card.bodyBlocks.forEach((lines) => {
        doc.text('•', x + pad, ty);
        doc.text(lines, x + pad + bulletIndent, ty);
        ty += lines.length * 4.2 + 2.2;
      });
    });
    cursorY += boxH + 6;
  }

  if (!titles.hideConfidentiality) {
    checkPageBreak(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.text(titles.confidentialityTitle.toUpperCase(), margin, cursorY + 2);
    cursorY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    const confLines = doc.splitTextToSize(titles.confidentialityText, contentWidth);
    doc.text(confLines, margin, cursorY);
    cursorY += confLines.length * 3.6 + 4;
  }

  const commercial = getEffectiveCommercialPage(proposal);
  let commercialPageNumber = 0;
  if (!commercial.hide) {
    doc.addPage();
    commercialPageNumber = doc.getNumberOfPages();
    const pageArt = await renderCommercialPagePng(metadata, proposal);
    if (pageArt?.dataUrl) {
      doc.addImage(pageArt.dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);
    }
  }
  // ==========================================
  // SECTION 4. OBJETIVO (Página 3 si hay página comercial)
  // ==========================================
  const hasSection4 =
    !titles.hideSection4 && sectionHasBodyOrSubs(proposal.objetivo, getSubsections(proposal, 'objetivo'));
  if (hasSection4) {
    renderSectionHeader(titles.section4, '4', getPageBreakForLaterSection());
    if (proposal.objetivo?.trim()) await renderRichTextWithTables(proposal.objetivo.trim(), docTables);
    await renderNestedSubs('objetivo', '4');
  }

  // ==========================================
  // SECTION 5. DESCRIPCIÓN DE LA SOLUCIÓN PROPUESTA
  // ==========================================
  const hasSection5 =
    !titles.hideSection5 && sectionHasBodyOrSubs(proposal.descripcion, getSubsections(proposal, 'descripcion'));
  if (hasSection5) {
    renderSectionHeader(titles.section5, '5', getPageBreakForLaterSection());
    if (proposal.descripcion?.trim()) await renderRichTextWithTables(proposal.descripcion.trim(), docTables);
    await renderNestedSubs('descripcion', '5');
  }
  // ==========================================
  // SECTION 6. ÍNDICE DE ANÁLISIS OPERATIVO
  // ==========================================
  const validIndice = (proposal.indiceAnalisisOperativo || []).filter((item) => item && item.trim().length > 0);
  const hasSection6 = !titles.hideSection6 && validIndice.length > 0;
  if (hasSection6) {
    renderSectionHeader(titles.section6, '6', getPageBreakForLaterSection());
    for (let i = 0; i < validIndice.length; i++) {
      const item = validIndice[i];

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
  const validSteps = (proposal.analisisOperativo || []).filter(
    (step, idx) =>
      (step.titulo && step.titulo.trim().length > 0) ||
      (step.explicacion && step.explicacion.trim().length > 0) ||
      images[idx] ||
      (step.imagenId && images.some((img) => img.id === step.imagenId))
  );
  const hasSection7 = !titles.hideSection7 && validSteps.length > 0;

  if (hasSection7) {
    renderSectionHeader(titles.section7, '7', getPageBreakForLaterSection());

    for (let idx = 0; idx < validSteps.length; idx++) {
      const step = validSteps[idx];
      checkPageBreak(16);

      // Step Header Box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      const stepTitle = `Paso 7.${idx + 1}: ${step.titulo?.trim() || `Paso ${idx + 1}`}`;
      doc.text(stepTitle, margin, cursorY + 2);
      cursorY += 5.5;

      // Check for associated image strictly
      const isExplicitNone = step.imagenId === 'none' || step.referenciaImagen === 'none';
      const matchingImg = isExplicitNone
        ? undefined
        : (step.imagenId && step.imagenId !== 'none' ? images.find(img => img.id === step.imagenId) : undefined) ||
          (step.referenciaImagen && step.referenciaImagen !== 'none' ? (() => {
            const m = step.referenciaImagen.match(/\[IMAGEN_(\d+)\]/i);
            if (m) {
              const targetIndex = parseInt(m[1], 10) - 1;
              return images[targetIndex];
            }
            return images.find(img => img.id === step.referenciaImagen);
          })() : undefined) ||
          (step.explicacion ? (() => {
            const m = step.explicacion.match(/\[IMAGEN_(\d+)\]/i);
            if (m) {
              const targetIndex = parseInt(m[1], 10) - 1;
              return images[targetIndex];
            }
            return undefined;
          })() : undefined) ||
          images[idx];
      if (matchingImg && matchingImg.dataUrl) {
        await renderEmbeddedImage(matchingImg, images.indexOf(matchingImg) + 1 || idx + 1);
      }

      if (step.explicacion && step.explicacion.trim()) {
        const cleaned = matchingImg
          ? step.explicacion.replace(/\[IMAGEN_\d+\]/gi, '').trim()
          : step.explicacion.trim();
        if (cleaned) await renderRichTextWithTables(cleaned, docTables);
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
    ...(proposal.analisisOperativo || []).map((s) => `${s.explicacion || ''} ${s.referenciaImagen || ''} ${s.imagenId || ''}`),
    ...(['resumenEjecutivo', 'objetivo', 'descripcion', 'descargo'] as NestedSectionField[]).flatMap((field) =>
      getSubsections(proposal, field).map((sub) => `${sub.title || ''} ${sub.body || ''}`)
    ),
  ].join('\n').toUpperCase();

  const unusedTables = docTables.filter((_, idx) => {
    const tag = `[TABLA_${idx + 1}]`.toUpperCase();
    return !allTextBlob.includes(tag);
  });

  if (unusedTables.length > 0) {
    renderSectionHeader('Tablas de Apoyo', '', getPageBreakForLaterSection());
    for (const tbl of unusedTables) {
      renderCustomTable(tbl);
    }
  }

  const unusedImages = images.filter((img, idx) => {
    if (!img?.dataUrl) return false;
    const key = img.id || `idx-${idx + 1}`;
    return !renderedImageKeys.has(key);
  });
  if (unusedImages.length > 0) {
    renderSectionHeader('Imágenes de Apoyo', '', getPageBreakForLaterSection());
    for (const img of unusedImages) {
      await renderEmbeddedImage(img, images.indexOf(img) + 1);
    }
  }

  // ==========================================
  // SECTION 8. DESCARGO Y CLÁUSULA ESTÁNDAR (Only if user provided descargo text)
  // ==========================================
  const hasSection8 =
    !titles.hideSection8 && sectionHasBodyOrSubs(proposal.descargo, getSubsections(proposal, 'descargo'));
  if (hasSection8) {
    renderSectionHeader(titles.section8, '8', getPageBreakForLaterSection());
    const descargoText = proposal.descargo?.trim() || '';
    if (descargoText) {
      await renderRichTextWithTables(descargoText, docTables);
    }
    await renderNestedSubs('descargo', '8');
  }

  // ==========================================
  // 5. RUNNING HEADERS & FOOTERS ON ALL PAGES
  // ==========================================
  const totalPages = doc.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Running Header on pages 2+
    if (p > 1 && p !== commercialPageNumber) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      const headerSubtitleText = effectiveHF.headerSubtitle || metadata.nombreProyecto?.trim() || 'Propuesta de Desarrollo';
      doc.text(
        `${effectiveHF.headerBrandTag} • ${headerSubtitleText}`,
        margin,
        10
      );

      doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, 12, pageWidth - margin, 12);
    }

    if (p === commercialPageNumber) continue;
    const footerY = pageHeight - 8;
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 2.5, pageWidth - margin, footerY - 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(
      effectiveHF.footerText,
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
