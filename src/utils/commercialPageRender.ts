import { MetadataHeader, ProposalSection, getEffectiveCommercialPage, parseCommercialNumber, formatUsd, resolvePage2LogoDataUrl } from '../types';
import { formatFechaEs } from './dateFormat';

const NAVY = '#0A3D62';
const BLUE = '#1E5F8A';
const GREEN = '#22C55E';
const RED = '#DC2626';
const MUTED = '#64748B';
const TEXT = '#1E3A5F';
const GRAY = '#F1F5F9';
const ROW = '#F8FAFC';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width <= maxW) cur = test;
    else {
      if (cur) lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function drawIcon(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'person') {
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 10, 8, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (kind === 'calendar') {
    roundRect(ctx, -7, -5, 14, 13, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, -1);
    ctx.lineTo(7, -1);
    ctx.stroke();
    ctx.fillRect(-3, 3, 2.5, 2.5);
    ctx.fillRect(1, 3, 2.5, 2.5);
  } else if (kind === 'ticket') {
    roundRect(ctx, -8, -6, 16, 12, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'doc') {
    ctx.beginPath();
    ctx.moveTo(-5, -8);
    ctx.lineTo(2, -8);
    ctx.lineTo(6, -3);
    ctx.lineTo(6, 8);
    ctx.lineTo(-5, 8);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === 'clock') {
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -4);
    ctx.moveTo(0, 0);
    ctx.lineTo(4, 2);
    ctx.stroke();
  } else if (kind === 'dollar') {
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = 'bold 11px Calibri, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0.5);
  } else if (kind === 'globe') {
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.5, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src || typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function canvasPng(canvas: HTMLCanvasElement): { data: Uint8Array; dataUrl: string } {
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = (dataUrl.split(',')[1] || '').replace(/\s/g, '');
  const binary = atob(base64);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
  return { data, dataUrl };
}

export async function renderCommercialPagePng(
  metadata: MetadataHeader,
  proposal: ProposalSection | null | undefined
): Promise<{ data: Uint8Array; dataUrl: string; width: number; height: number } | null> {
  if (typeof document === 'undefined') return null;
  const commercial = getEffectiveCommercialPage(proposal);
  const logoUrl = resolvePage2LogoDataUrl(metadata, proposal?.commercial);
  const logoImg = logoUrl ? await loadImage(logoUrl) : null;

  const W = 768;
  const H = 1008;
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'top';

  const pad = 18;
  let y = 18;

  if (logoImg) {
    const maxW = 210;
    const maxH = 52;
    const s = Math.min(maxW / logoImg.width, maxH / logoImg.height, 1);
    ctx.drawImage(logoImg, pad, y, logoImg.width * s, logoImg.height * s);
  } else {
    ctx.fillStyle = NAVY;
    ctx.font = '800 22px Calibri, Segoe UI, sans-serif';
    ctx.fillText('ADVANSYS', pad, y + 14);
  }
  y += 64;

  const barH = 110;
  const barW = W - pad * 2;
  ctx.save();
  ctx.shadowColor = 'rgba(10,61,98,0.12)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, pad, y, barW, barH, 14);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  roundRect(ctx, pad, y, barW, barH, 14);
  ctx.stroke();

  const cols = [
    { label: 'CLIENTE', value: metadata.cliente || '—' },
    { label: 'FECHA', value: formatFechaEs(metadata.fecha) },
    { label: 'TICKET NO.', value: metadata.ticketNo || '—' },
    { label: 'PROPUESTA NO.', value: metadata.propuestaNo || '—' },
  ];
  const colW = barW / 4;
  cols.forEach((c, i) => {
    const x = pad + colW * i;
    if (i > 0) {
      ctx.strokeStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(x, y + 14);
      ctx.lineTo(x, y + barH - 14);
      ctx.stroke();
    }
    ctx.font = '700 10px Calibri, Segoe UI, sans-serif';
    ctx.fillStyle = MUTED;
    ctx.fillText(c.label, x + 22, y + 32);
    ctx.font = '800 16px Calibri, Segoe UI, sans-serif';
    ctx.fillStyle = NAVY;
    const vLines = wrap(ctx, c.value, colW - 36);
    if (i === 3) {
      ctx.textAlign = 'right';
      ctx.fillText(vLines[0], x + colW - 16, y + 62);
      ctx.textAlign = 'left';
    } else {
      ctx.fillText(vLines[0], x + 22, y + 62);
    }
  });
  y += barH + 22;

  const rows = commercial.lineItems.map((item) => {
    const hours = parseCommercialNumber(item.hours);
    const unit = parseCommercialNumber(item.unitValue);
    return {
      desc: item.description || '—',
      hours: hours ? String(hours) : '—',
      unit: unit ? formatUsd(unit) : '—',
      sub: hours && unit ? formatUsd(hours * unit) : '—',
      amount: hours * unit,
    };
  });
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const tableH = 32 + rows.length * 34;
  ctx.save();
  roundRect(ctx, pad, y, barW, tableH, 12);
  ctx.clip();
  ctx.fillStyle = NAVY;
  ctx.fillRect(pad, y, barW, 32);
  ctx.fillStyle = ROW;
  ctx.fillRect(pad, y + 32, barW, tableH - 32);
  ctx.restore();
  ctx.strokeStyle = '#E2E8F0';
  roundRect(ctx, pad, y, barW, tableH, 12);
  ctx.stroke();

  const c0 = pad + 14;
  const c1 = pad + barW * 0.42;
  const c2 = pad + barW * 0.62;
  const c3 = pad + barW - 14;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 9px Calibri, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HORAS', (c1 + c2) / 2, y + 11);
  ctx.fillText('VALOR UNITARIO (USD)', (c2 + c3) / 2, y + 11);
  ctx.textAlign = 'right';
  ctx.fillText('SUBTOTAL (USD)', c3, y + 11);
  ctx.textAlign = 'left';

  rows.forEach((r, i) => {
    const ry = y + 32 + i * 34 + 10;
    ctx.font = '700 12px Calibri, Segoe UI, sans-serif';
    ctx.fillStyle = NAVY;
    ctx.fillText(r.desc, c0, ry);
    ctx.textAlign = 'center';
    ctx.fillText(r.hours, (c1 + c2) / 2, ry);
    ctx.fillStyle = BLUE;
    ctx.font = '600 12px Calibri, Segoe UI, sans-serif';
    ctx.fillText(r.unit, (c2 + c3) / 2, ry);
    ctx.textAlign = 'right';
    ctx.fillStyle = NAVY;
    ctx.font = '800 12px Calibri, Segoe UI, sans-serif';
    ctx.fillText(r.sub, c3, ry);
    ctx.textAlign = 'left';
  });
  y += tableH + 36;

  ctx.strokeStyle = '#E2E8F0';
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, pad, y, 78, 28, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = NAVY;
  ctx.font = '800 12px Calibri, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TOTAL', pad + 39, y + 8);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.font = '800 18px Calibri, Segoe UI, sans-serif';
  ctx.fillText(formatUsd(total).replace('USD$', 'US$'), pad + barW, y + 6);
  ctx.textAlign = 'left';
  y += 36;
  if (commercial.itbisExempt) {
    ctx.fillStyle = RED;
    ctx.font = '700 10px Calibri, Segoe UI, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(commercial.itbisLabel, pad + barW, y);
    ctx.textAlign = 'left';
    y += 18;
  }
  y += 8;

  const midY = y;
  const leftW = barW * 0.52;
  const rightX = pad + leftW + 18;
  const rightW = barW - leftW - 18;
  ctx.fillStyle = NAVY;
  ctx.font = '800 12px Calibri, Segoe UI, sans-serif';
  ctx.fillText(commercial.conditionsTitle, pad, midY);
  ctx.fillStyle = GREEN;
  ctx.fillText(commercial.nextStepsTitle, rightX, midY);
  y += 20;

  const condIcons = ['clock', 'calendar', 'dollar', 'globe'];
  let condY = y + 10;
  const condStart = condY;
  ctx.font = '600 10.5px Calibri, Segoe UI, sans-serif';
  commercial.conditions.forEach((cond, i) => {
    condY += 4;
    const lines = wrap(ctx, `${cond.title} ${cond.text}`, leftW - 44);
    condY += lines.length * 14 + 10;
  });
  const condBoxH = Math.max(condY - condStart + 8, commercial.nextSteps.length * 20 + 20);
  ctx.fillStyle = GRAY;
  roundRect(ctx, pad, y, leftW, condBoxH, 14);
  ctx.fill();

  let iy = y + 16;
  commercial.conditions.forEach((cond, i) => {
    ctx.beginPath();
    ctx.fillStyle = NAVY;
    ctx.arc(pad + 20, iy + 6, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.fillStyle = '#FFFFFF';
    drawIcon(ctx, condIcons[i] || 'clock', pad + 20, iy + 6, '#FFFFFF');
    ctx.font = '700 10.5px Calibri, Segoe UI, sans-serif';
    ctx.fillStyle = NAVY;
    const titleW = ctx.measureText(cond.title + ' ').width;
    ctx.fillText(cond.title, pad + 38, iy);
    ctx.font = '500 10.5px Calibri, Segoe UI, sans-serif';
    ctx.fillStyle = TEXT;
    const rest = wrap(ctx, cond.text, leftW - 48 - Math.min(titleW, 80));
    rest.forEach((line, li) => {
      ctx.fillText(line, pad + 38 + (li === 0 ? titleW : 0), iy + li * 13);
    });
    iy += Math.max(26, rest.length * 13 + 10);
  });

  let sy = y + 4;
  commercial.nextSteps.forEach((step) => {
    ctx.fillStyle = NAVY;
    ctx.font = '700 16px Calibri, Segoe UI, sans-serif';
    ctx.fillText('•', rightX, sy - 2);
    ctx.font = '600 11px Calibri, Segoe UI, sans-serif';
    const lines = wrap(ctx, step.replace(/\*\*/g, ''), rightW - 16);
    lines.forEach((line, li) => ctx.fillText(line, rightX + 14, sy + li * 14));
    sy += Math.max(22, lines.length * 14 + 8);
  });
  y = Math.max(y + condBoxH, sy) + 18;

  ctx.fillStyle = NAVY;
  ctx.font = '800 12px Calibri, Segoe UI, sans-serif';
  ctx.fillText(commercial.notesTitle, pad, y);
  y += 18;
  ctx.font = '500 11px Calibri, Segoe UI, sans-serif';
  const notePlain = commercial.notes.replace(/\*\*/g, '');
  const noteLines = wrap(ctx, notePlain, barW - 28);
  const notesH = noteLines.length * 15 + 20;
  ctx.fillStyle = GRAY;
  roundRect(ctx, pad, y, barW, notesH, 12);
  ctx.fill();
  ctx.fillStyle = TEXT;
  noteLines.forEach((line, i) => ctx.fillText(line, pad + 14, y + 10 + i * 15));

  const footH = 36;
  const sigBlockH = 90;
  let sySig = H - footH - sigBlockH;
  ctx.fillStyle = NAVY;
  ctx.font = '800 12px Calibri, Segoe UI, sans-serif';
  ctx.fillText(commercial.reviewedByTitle, pad, sySig);
  sySig += 40;
  const sigW = (barW - 40) / 2;
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, sySig);
  ctx.lineTo(pad + sigW, sySig);
  ctx.moveTo(pad + sigW + 40, sySig);
  ctx.lineTo(pad + barW, sySig);
  ctx.stroke();
  sySig += 16;
  ctx.textAlign = 'center';
  ctx.font = '700 11px Calibri, Segoe UI, sans-serif';
  ctx.fillText(commercial.reviewedLeftRole, pad + sigW / 2, sySig);
  ctx.fillText(commercial.reviewedRightRole, pad + sigW + 40 + sigW / 2, sySig);
  sySig += 16;
  ctx.font = '500 11px Calibri, Segoe UI, sans-serif';
  ctx.fillStyle = BLUE;
  ctx.fillText(commercial.reviewedBy.trim() || commercial.reviewedLeftOrg, pad + sigW / 2, sySig);
  ctx.fillText(commercial.reviewedRightOrg, pad + sigW + 40 + sigW / 2, sySig);
  ctx.textAlign = 'left';

  ctx.fillStyle = NAVY;
  ctx.fillRect(0, H - footH, W, footH);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 10px Calibri, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const parts = [commercial.footerPhone, commercial.footerEmail, commercial.footerWeb, commercial.footerCity];
  parts.forEach((t, i) => ctx.fillText(t, (W / 4) * i + W / 8, H - footH / 2));

  const png = canvasPng(canvas);
  return { ...png, width: W, height: H };
}
