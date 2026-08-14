import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function downloadElementAsPdf(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: Math.max(element.scrollWidth, 794),
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const pxPerMm = canvas.width / usableWidth;
  const pageHeightPx = Math.floor(usableHeight * pxPerMm);

  const sliceCanvas = document.createElement('canvas');
  const ctx = sliceCanvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el lienzo del PDF.');

  let offsetY = 0;
  let page = 0;

  while (offsetY < canvas.height) {
    const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const img = sliceCanvas.toDataURL('image/jpeg', 0.93);
    if (page > 0) pdf.addPage();
    const sliceMm = sliceHeight / pxPerMm;
    pdf.addImage(img, 'JPEG', margin, margin, usableWidth, sliceMm);

    offsetY += sliceHeight;
    page += 1;
    if (page > 40) break;
  }

  const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(safeName);
}
