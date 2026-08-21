export type DocxRasterType = 'jpg' | 'png' | 'gif' | 'bmp';

export type PreparedDocxImage = {
  data: Uint8Array;
  width: number;
  height: number;
  type: DocxRasterType;
};

function bytesFromDataUrl(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',');
  const base64 = (parts.length > 1 ? parts[1] : parts[0]).replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function detectRasterType(data: Uint8Array, mimeType?: string): DocxRasterType | 'unsupported' {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'jpg';
  if (data.length >= 8 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return 'png';
  if (data.length >= 4 && data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) return 'gif';
  if (data.length >= 2 && data[0] === 0x42 && data[1] === 0x4d) return 'bmp';
  const mime = (mimeType || '').toLowerCase();
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('bmp')) return 'bmp';
  return 'unsupported';
}

function looksLikeSvg(dataUrl: string, mimeType?: string): boolean {
  return dataUrl.startsWith('data:image/svg+xml') || (mimeType || '').toLowerCase().includes('svg');
}

function looksLikeUnsupportedRaster(dataUrl: string, mimeType?: string): boolean {
  const hint = `${dataUrl.slice(0, 64)} ${mimeType || ''}`.toLowerCase();
  return /webp|avif|heic|heif|tiff/.test(hint);
}

function loadHtmlImage(src: string, timeoutMs = 12000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });
}

function canvasToPng(img: HTMLImageElement, fillWhite = false): PreparedDocxImage | null {
  if (typeof document === 'undefined') return null;
  const width = img.naturalWidth || img.width || 600;
  const height = img.naturalHeight || img.height || 350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (fillWhite) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0);
  try {
    const pngDataUrl = canvas.toDataURL('image/png');
    return { data: bytesFromDataUrl(pngDataUrl), width, height, type: 'png' };
  } catch {
    return null;
  }
}

/**
 * Prepares an image for Word: correct raster type, real dimensions, WebP/SVG converted to PNG.
 */
export async function prepareImageForDocx(dataUrl: string, mimeType?: string): Promise<PreparedDocxImage> {
  const empty: PreparedDocxImage = { data: new Uint8Array(0), width: 100, height: 100, type: 'png' };
  if (!dataUrl) return empty;

  if (looksLikeSvg(dataUrl, mimeType) || looksLikeUnsupportedRaster(dataUrl, mimeType)) {
    const img = await loadHtmlImage(dataUrl);
    if (!img) return empty;
    return canvasToPng(img, looksLikeSvg(dataUrl, mimeType)) || empty;
  }

  let data: Uint8Array;
  try {
    data = bytesFromDataUrl(dataUrl);
  } catch (e) {
    console.error('Error parsing base64 data URL:', e);
    return empty;
  }

  const img = await loadHtmlImage(dataUrl);
  const width = img?.naturalWidth || img?.width || 520;
  const height = img?.naturalHeight || img?.height || 300;
  const type = detectRasterType(data, mimeType);

  if (type === 'unsupported') {
    if (!img) return { data, width, height, type: 'png' };
    return canvasToPng(img, false) || empty;
  }

  return { data, width, height, type };
}

export async function dataUrlToUint8Array(
  dataUrl: string,
  mimeType?: string
): Promise<{ data: Uint8Array; width: number; height: number }> {
  const prepared = await prepareImageForDocx(dataUrl, mimeType);
  return { data: prepared.data, width: prepared.width, height: prepared.height };
}

export async function loadSvgOrImageToCanvasPng(
  src: string,
  targetWidth = 1600
): Promise<{ dataUrl: string; width: number; height: number } | null> {
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
        resolve({ dataUrl: canvas.toDataURL('image/png', 1.0), width: canvasW, height: canvasH });
      } catch {
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
