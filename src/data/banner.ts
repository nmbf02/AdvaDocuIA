// Dynamic Cover Header Banner Generator for Advansys Technical Document (Page 1 Top)

function escapeSvgText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function getAdvansysBannerSvg(
  brandTag: string = 'ADVANSYS',
  subtitle: string = ''
): string {
  const safeBrandTag = escapeSvgText(brandTag || 'ADVANSYS');
  const safeSubtitle = subtitle ? escapeSvgText(subtitle) : '';

  const subtitleElement = safeSubtitle
    ? `<text x="0" y="102" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="15" font-weight="600" fill="#A0AEC0" letter-spacing="0.5">${safeSubtitle}</text>`
    : '';

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" width="1200" height="300">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#021024" />
      <stop offset="45%" stop-color="#0A3D62" />
      <stop offset="85%" stop-color="#06263F" />
      <stop offset="100%" stop-color="#02182B" />
    </linearGradient>

    <!-- Tech Grid Pattern -->
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1E5F8A" stroke-width="0.5" stroke-opacity="0.25"/>
    </pattern>

    <!-- Glassmorphism Panel Fill -->
    <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#1E5F8A" stop-opacity="0.08" />
    </linearGradient>

    <!-- Glow Effects -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Base Canvas -->
  <rect width="1200" height="300" fill="url(#bgGrad)" />
  <rect width="1200" height="300" fill="url(#grid)" />

  <!-- Ambient Light Rays / Flares -->
  <circle cx="950" cy="150" r="220" fill="#2ECC71" opacity="0.08" filter="url(#glow)"/>
  <circle cx="750" cy="120" r="180" fill="#1E5F8A" opacity="0.18" filter="url(#glow)"/>

  <!-- LEFT SIDE: Corporate Branding Title Overlay -->
  <g transform="translate(60, 80)">
    <!-- Label Badge: White text inside Advansys pill -->
    <rect x="0" y="0" width="150" height="28" rx="14" fill="#2ECC71" opacity="0.25" stroke="#2ECC71" stroke-width="1.5" />
    <text x="75" y="18" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">
      ${safeBrandTag}
    </text>

    <text x="0" y="70" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" letter-spacing="1">
      PROPUESTA TÉCNICA Y ARQUITECTURA
    </text>
    ${subtitleElement}

    <!-- Bottom Accent Ribbon -->
    <rect x="0" y="130" width="380" height="4" fill="#2ECC71" rx="2" />
  </g>

  <!-- RIGHT SIDE: Futuristic Glassmorphic UI Dashboard Elements -->

  <!-- Panel 1: Analytics Line Chart -->
  <g transform="translate(620, 45)">
    <rect width="130" height="180" rx="12" fill="url(#glass)" stroke="#4FD1C5" stroke-width="1" stroke-opacity="0.4" />
    <text x="15" y="25" font-family="sans-serif" font-size="9" font-weight="bold" fill="#E2E8F0">METRICAS</text>
    <!-- Chart lines -->
    <path d="M 15 140 Q 35 90 55 110 T 95 60 T 115 80" fill="none" stroke="#2ECC71" stroke-width="2.5" filter="url(#glow)"/>
    <path d="M 15 150 Q 35 120 55 130 T 95 90 T 115 110" fill="none" stroke="#ECC94B" stroke-width="1.5" opacity="0.8"/>
    <circle cx="95" cy="60" r="4" fill="#2ECC71"/>
  </g>

  <!-- Panel 2: Architectural Tunnel / Diagram -->
  <g transform="translate(765, 30)">
    <rect width="130" height="160" rx="12" fill="url(#glass)" stroke="#63B3ED" stroke-width="1" stroke-opacity="0.4" />
    <!-- Architectural Rings -->
    <ellipse cx="65" cy="80" rx="40" ry="30" fill="none" stroke="#63B3ED" stroke-width="1.5" />
    <ellipse cx="65" cy="80" rx="25" ry="18" fill="none" stroke="#2ECC71" stroke-width="1.5" />
    <ellipse cx="65" cy="80" rx="10" ry="7" fill="none" stroke="#FFFFFF" stroke-width="1" />
  </g>

  <!-- Panel 3: Bar & Trend Dashboard -->
  <g transform="translate(910, 55)">
    <rect width="130" height="190" rx="12" fill="url(#glass)" stroke="#4FD1C5" stroke-width="1" stroke-opacity="0.4" />
    <!-- Bars -->
    <rect x="25" y="100" width="12" height="60" fill="#3182CE" rx="2" />
    <rect x="45" y="70" width="12" height="90" fill="#2ECC71" rx="2" />
    <rect x="65" y="85" width="12" height="75" fill="#3182CE" rx="2" />
    <rect x="85" y="50" width="12" height="110" fill="#2ECC71" rx="2" />
    <!-- Trendline -->
    <path d="M 20 90 L 50 60 L 70 75 L 105 40" fill="none" stroke="#ECC94B" stroke-width="2"/>
  </g>

  <!-- Panel 4: Node Network Topology (Bottom Floating) -->
  <g transform="translate(720, 160)">
    <rect width="160" height="115" rx="12" fill="url(#glass)" stroke="#2ECC71" stroke-width="1.2" stroke-opacity="0.5" />
    <circle cx="35" cy="40" r="6" fill="#2ECC71" />
    <circle cx="80" cy="30" r="8" fill="#63B3ED" />
    <circle cx="125" cy="50" r="6" fill="#2ECC71" />
    <circle cx="60" cy="80" r="7" fill="#ECC94B" />
    <circle cx="110" cy="85" r="8" fill="#2ECC71" />

    <line x1="35" y1="40" x2="80" y2="30" stroke="#E2E8F0" stroke-width="1" opacity="0.6" />
    <line x1="80" y1="30" x2="125" y2="50" stroke="#E2E8F0" stroke-width="1" opacity="0.6" />
    <line x1="35" y1="40" x2="60" y2="80" stroke="#E2E8F0" stroke-width="1" opacity="0.6" />
    <line x1="80" y1="30" x2="60" y2="80" stroke="#E2E8F0" stroke-width="1" opacity="0.6" />
    <line x1="125" y1="50" x2="110" y2="85" stroke="#E2E8F0" stroke-width="1" opacity="0.6" />
  </g>

  <!-- Top Fixed Border Accent -->
  <rect x="0" y="0" width="1200" height="5" fill="#2ECC71" />
</svg>`;

  const encoded = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(svgContent)))
    : Buffer.from(svgContent).toString('base64');

  return `data:image/svg+xml;base64,${encoded}`;
}

export const ADVANSYS_COVER_BANNER_SVG = getAdvansysBannerSvg('ADVANSYS', '');
