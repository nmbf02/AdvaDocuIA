import { formatFechaEs } from '../utils/dateFormat';

// Dynamic Cover Header Banner Generator for Advansys Technical Document (Page 1 Top)

function escapeSvgText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapWords(text: string, maxChars: number, maxLines = 3): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (trial.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = trial;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  else if (line && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1]}…`;
  return lines;
}

function svgMultilineText(
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  attrs: string
): string {
  if (!lines.length) return '';
  const tspans = lines
    .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${line}</tspan>`)
    .join('');
  return `<text x="${x}" y="${y}" ${attrs}>${tspans}</text>`;
}

export type CoverBannerOptions = {
  coverTitle?: string;
  cliente?: string;
  fecha?: string;
  ticketNo?: string;
  propuestaNo?: string;
  showInfoCard?: boolean;
  /** Leave the proposal number blank in the image so Word can overlay editable text. */
  omitPropuestaValue?: boolean;
  /** Page 2: card flush with content left/right (no extra SVG inset). */
  flushToPageMargin?: boolean;
};

export function getAdvansysBannerSvg(
  brandTag: string = 'ADVANSYS',
  subtitle: string = '',
  logoDataUrl?: string,
  options?: CoverBannerOptions
): string {
  const safeBrandTag = escapeSvgText(brandTag || 'ADVANSYS');
  const coverTitleRaw = options?.coverTitle?.trim() || 'PROPUESTA DE DESARROLLO';
  const titleLines = wrapWords(coverTitleRaw, 32, 3).map(escapeSvgText);
  const subtitleLines = subtitle.trim()
    ? wrapWords(subtitle.trim(), 48, 2).map(escapeSvgText)
    : [];

  const groupY = 20;
  const logoBlockH = 64;
  const titleY = logoBlockH + 28;
  const titleLineH = 34;
  const subtitleLineH = 20;
  const lastTitleY = titleY + Math.max(0, titleLines.length - 1) * titleLineH;
  const subtitleY = subtitleLines.length ? lastTitleY + 26 : lastTitleY;
  const lastSubtitleY = subtitleLines.length
    ? subtitleY + (subtitleLines.length - 1) * subtitleLineH
    : lastTitleY;
  const barY = lastSubtitleY + 18;
  const barBottomAbs = groupY + barY + 8;
  const showInfoCard = Boolean(options?.showInfoCard);
  const cardH = 136;
  const cardOverlap = 48;
  const gapAboveCard = 28;
  const darkH = showInfoCard
    ? barBottomAbs + gapAboveCard + cardOverlap
    : barBottomAbs + 28;
  const canvasH = showInfoCard ? darkH + (cardH - cardOverlap) + 18 : darkH;
  const cardY = darkH - cardOverlap;
  const fechaLabel = escapeSvgText(formatFechaEs(options?.fecha));

  const titleElement = svgMultilineText(
    titleLines,
    0,
    titleY,
    titleLineH,
    `font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" letter-spacing="0.2"`
  );
  const subtitleElement = subtitleLines.length
    ? svgMultilineText(
        subtitleLines,
        0,
        subtitleY,
        subtitleLineH,
        `font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="14" font-weight="600" fill="#D1FAE5" letter-spacing="0.2"`
      )
    : '';

  const brandingElement = logoDataUrl
    ? `<g transform="translate(0, 0)">
      <image href="${logoDataUrl}" xlink:href="${logoDataUrl}" x="0" y="0" width="240" height="60" preserveAspectRatio="xMinYMid meet" />
    </g>`
    : `<rect x="0" y="12" width="200" height="40" rx="20" fill="#2ECC71" opacity="0.25" stroke="#2ECC71" stroke-width="1.5" />
    <text x="100" y="38" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">${safeBrandTag}</text>`;

  const infoCard = showInfoCard
    ? `<g transform="translate(40, ${cardY})" filter="url(#cardShadow)">
      <rect width="1120" height="136" rx="20" fill="#FFFFFF" />
      <rect x="280" y="28" width="1" height="80" fill="#E2E8F0" />
      <rect x="560" y="28" width="1" height="80" fill="#E2E8F0" />
      <rect x="840" y="28" width="1" height="80" fill="#E2E8F0" />
      <text x="36" y="48" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#64748B" letter-spacing="1.2">CLIENTE</text>
      <text x="36" y="88" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#0A3D62">${escapeSvgText(options?.cliente || '—')}</text>
      <text x="316" y="48" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#64748B" letter-spacing="1.2">FECHA</text>
      <text x="316" y="88" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#0A3D62">${fechaLabel}</text>
      <text x="596" y="48" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#64748B" letter-spacing="1.2">TICKET NO.</text>
      <text x="596" y="88" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#0A3D62">${escapeSvgText(options?.ticketNo || '—')}</text>
      <text x="876" y="48" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#64748B" letter-spacing="1.2">PROPUESTA NO.</text>
      ${
        options?.omitPropuestaValue
          ? ''
          : `<text x="876" y="88" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#0A3D62">${escapeSvgText(options?.propuestaNo || '—')}</text>`
      }
    </g>`
    : '';

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 ${canvasH}" width="1200" height="${canvasH}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#021024" />
      <stop offset="45%" stop-color="#0A3D62" />
      <stop offset="85%" stop-color="#06263F" />
      <stop offset="100%" stop-color="#02182B" />
    </linearGradient>

    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1E5F8A" stroke-width="0.5" stroke-opacity="0.25"/>
    </pattern>

    <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#1E5F8A" stop-opacity="0.08" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="cardShadow" x="-4%" y="-18%" width="108%" height="150%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="blur" />
      <feOffset in="blur" dx="0" dy="8" result="off" />
      <feFlood flood-color="#021024" flood-opacity="0.28" result="color" />
      <feComposite in="color" in2="off" operator="in" result="shadow" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <clipPath id="darkClip">
      <rect width="1200" height="${darkH}" />
    </clipPath>
    <clipPath id="artClip">
      <rect x="640" y="0" width="560" height="${darkH}" />
    </clipPath>
  </defs>

  <rect y="${darkH}" width="1200" height="${canvasH - darkH}" fill="#FFFFFF" />

  <g clip-path="url(#darkClip)">
    <rect width="1200" height="${darkH}" fill="url(#bgGrad)" />
    <rect width="1200" height="${darkH}" fill="url(#grid)" />

    <g clip-path="url(#artClip)">
    <circle cx="1020" cy="130" r="220" fill="#2ECC71" opacity="0.07" filter="url(#glow)"/>
    <circle cx="900" cy="80" r="150" fill="#1E5F8A" opacity="0.22" filter="url(#glow)"/>

    <g transform="translate(700, 28)">
      <rect width="118" height="168" rx="12" fill="url(#glass)" stroke="#4FD1C5" stroke-width="1" stroke-opacity="0.45" />
      <text x="14" y="24" font-family="sans-serif" font-size="9" font-weight="bold" fill="#E2E8F0">METRICAS</text>
      <path d="M 14 128 Q 32 82 50 100 T 86 55 T 104 74" fill="none" stroke="#2ECC71" stroke-width="2.5" filter="url(#glow)"/>
      <path d="M 14 138 Q 32 110 50 120 T 86 84 T 104 102" fill="none" stroke="#ECC94B" stroke-width="1.5" opacity="0.8"/>
      <circle cx="86" cy="55" r="4" fill="#2ECC71"/>
    </g>

    <g transform="translate(838, 22)">
      <rect width="118" height="148" rx="12" fill="url(#glass)" stroke="#63B3ED" stroke-width="1" stroke-opacity="0.4" />
      <ellipse cx="59" cy="76" rx="38" ry="28" fill="none" stroke="#63B3ED" stroke-width="1.5" />
      <ellipse cx="59" cy="76" rx="24" ry="16" fill="none" stroke="#2ECC71" stroke-width="1.5" />
      <ellipse cx="59" cy="76" rx="10" ry="6" fill="none" stroke="#FFFFFF" stroke-width="1" />
    </g>

    <g transform="translate(976, 40)">
      <rect width="118" height="168" rx="12" fill="url(#glass)" stroke="#4FD1C5" stroke-width="1" stroke-opacity="0.35" />
      <rect x="22" y="92" width="12" height="52" fill="#3182CE" rx="2" />
      <rect x="42" y="64" width="12" height="80" fill="#2ECC71" rx="2" />
      <rect x="62" y="78" width="12" height="66" fill="#3182CE" rx="2" />
      <rect x="82" y="48" width="12" height="96" fill="#2ECC71" rx="2" />
      <path d="M 18 84 L 46 56 L 66 70 L 100 38" fill="none" stroke="#ECC94B" stroke-width="2"/>
    </g>

    <g transform="translate(760, 168)">
      <rect width="148" height="108" rx="12" fill="url(#glass)" stroke="#2ECC71" stroke-width="1.2" stroke-opacity="0.5" />
      <circle cx="32" cy="38" r="6" fill="#2ECC71" />
      <circle cx="74" cy="28" r="8" fill="#63B3ED" />
      <circle cx="116" cy="46" r="6" fill="#2ECC71" />
      <circle cx="56" cy="74" r="7" fill="#ECC94B" />
      <circle cx="102" cy="80" r="8" fill="#2ECC71" />
      <line x1="32" y1="38" x2="74" y2="28" stroke="#E2E8F0" stroke-width="1" opacity="0.6" />
      <line x1="74" y1="28" x2="116" y2="46" stroke="#E2E8F0" stroke-width="1" opacity="0.6" />
      <line x1="32" y1="38" x2="56" y2="74" stroke="#E2E8F0" stroke-width="1" opacity="0.6" />
      <line x1="74" y1="28" x2="56" y2="74" stroke="#E2E8F0" stroke-width="1" opacity="0.6" />
      <line x1="116" y1="46" x2="102" y2="80" stroke="#E2E8F0" stroke-width="1" opacity="0.6" />
    </g>
    </g>
  </g>

  <rect x="0" y="${darkH - 4}" width="1200" height="4" fill="#2ECC71" />

  <g transform="translate(48, ${groupY})">
    ${brandingElement}

    ${titleElement}
    ${subtitleElement}

    <rect x="0" y="${barY}" width="420" height="6" fill="#2ECC71" rx="3" />
  </g>

  ${infoCard}

  <rect x="0" y="0" width="1200" height="5" fill="#2ECC71" />
</svg>`;

  const encoded = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(svgContent)))
    : Buffer.from(svgContent).toString('base64');

  return `data:image/svg+xml;base64,${encoded}`;
}

export const ADVANSYS_COVER_BANNER_SVG = getAdvansysBannerSvg('ADVANSYS', '');

/** Same info card as page 1, standalone for page 2. */
export function getCoverInfoCardSvg(options?: CoverBannerOptions): string {
  const fechaLabel = escapeSvgText(formatFechaEs(options?.fecha));
  const flush = Boolean(options?.flushToPageMargin);
  const insetX = flush ? 0 : 40;
  const cardW = flush ? 1200 : 1120;
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 176" width="1200" height="176">
  <defs>
    <filter id="cardShadow" x="${flush ? '0%' : '-4%'}" y="-18%" width="${flush ? '100%' : '108%'}" height="150%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${flush ? 6 : 10}" result="blur" />
      <feOffset in="blur" dx="0" dy="${flush ? 4 : 8}" result="off" />
      <feFlood flood-color="#021024" flood-opacity="${flush ? '0.16' : '0.28'}" result="color" />
      <feComposite in="color" in2="off" operator="in" result="shadow" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <g transform="translate(${insetX}, 8)" filter="url(#cardShadow)">
    <rect width="${cardW}" height="136" rx="20" fill="#FFFFFF" />
    <rect x="${Math.round(cardW * 0.25)}" y="28" width="1" height="80" fill="#E2E8F0" />
    <rect x="${Math.round(cardW * 0.5)}" y="28" width="1" height="80" fill="#E2E8F0" />
    <rect x="${Math.round(cardW * 0.75)}" y="28" width="1" height="80" fill="#E2E8F0" />
    <text x="24" y="48" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#64748B" letter-spacing="1.2">CLIENTE</text>
    <text x="24" y="88" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#0A3D62">${escapeSvgText(options?.cliente || '—')}</text>
    <text x="${Math.round(cardW * 0.25) + 36}" y="48" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#64748B" letter-spacing="1.2">FECHA</text>
    <text x="${Math.round(cardW * 0.25) + 36}" y="88" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#0A3D62">${fechaLabel}</text>
    <text x="${Math.round(cardW * 0.5) + 36}" y="48" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#64748B" letter-spacing="1.2">TICKET NO.</text>
    <text x="${Math.round(cardW * 0.5) + 36}" y="88" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#0A3D62">${escapeSvgText(options?.ticketNo || '—')}</text>
    <text x="${Math.round(cardW * 0.75) + 36}" y="48" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#64748B" letter-spacing="1.2">PROPUESTA NO.</text>
    ${
      options?.omitPropuestaValue
        ? ''
        : `<text x="${Math.round(cardW * 0.75) + 36}" y="88" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#0A3D62">${escapeSvgText(options?.propuestaNo || '—')}</text>`
    }
  </g>
</svg>`;
  const encoded = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(svgContent)))
    : Buffer.from(svgContent).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

export function getPage2InfoCardSvg(options?: CoverBannerOptions): string {
  return getCoverInfoCardSvg({ ...options, flushToPageMargin: true });
}

export function getPage2HeaderSvg(
  logoDataUrl?: string,
  options?: CoverBannerOptions
): string {
  const fechaLabel = escapeSvgText(formatFechaEs(options?.fecha));
  const logo = logoDataUrl
    ? `<image href="${logoDataUrl}" xlink:href="${logoDataUrl}" x="40" y="12" width="360" height="96" preserveAspectRatio="xMinYMid meet" />`
    : `<text x="40" y="72" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="28" font-weight="800" fill="#0A3D62">ADVANSYS</text>`;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 268" width="1200" height="268">
  <defs>
    <filter id="p2shadow" x="-4%" y="-25%" width="108%" height="170%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur"/>
      <feOffset in="blur" dx="0" dy="4" result="off"/>
      <feFlood flood-color="#0A3D62" flood-opacity="0.14" result="color"/>
      <feComposite in="color" in2="off" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1200" height="268" fill="#FFFFFF"/>
  ${logo}
  <g transform="translate(40, 112)" filter="url(#p2shadow)">
    <rect width="1120" height="136" rx="20" fill="#FFFFFF"/>
    <rect x="280" y="28" width="1" height="80" fill="#E2E8F0"/>
    <rect x="560" y="28" width="1" height="80" fill="#E2E8F0"/>
    <rect x="840" y="28" width="1" height="80" fill="#E2E8F0"/>
    <text x="36" y="48" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#64748B" letter-spacing="1.2">CLIENTE</text>
    <text x="36" y="88" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#0A3D62">${escapeSvgText(options?.cliente || '—')}</text>
    <text x="316" y="48" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#64748B" letter-spacing="1.2">FECHA</text>
    <text x="316" y="88" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#0A3D62">${fechaLabel}</text>
    <text x="596" y="48" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#64748B" letter-spacing="1.2">TICKET NO.</text>
    <text x="596" y="88" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#0A3D62">${escapeSvgText(options?.ticketNo || '—')}</text>
    <text x="876" y="48" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#64748B" letter-spacing="1.2">PROPUESTA NO.</text>
    <text x="876" y="88" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#0A3D62">${escapeSvgText(options?.propuestaNo || '—')}</text>
  </g>
</svg>`;

  const encoded = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(svgContent)))
    : Buffer.from(svgContent).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}
