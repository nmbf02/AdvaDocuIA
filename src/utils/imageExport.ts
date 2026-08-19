export async function dataUrlToUint8Array(
  dataUrl: string
): Promise<{ data: Uint8Array; width: number; height: number }> {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve({ data: new Uint8Array(0), width: 100, height: 100 });
      return;
    }

    const timer = setTimeout(() => {
      resolve({ data: new Uint8Array(0), width: 100, height: 100 });
    }, 2000);

    const safeResolve = (result: { data: Uint8Array; width: number; height: number }) => {
      clearTimeout(timer);
      resolve(result);
    };

    if (dataUrl.startsWith('data:image/svg+xml') && typeof document !== 'undefined') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = img.width || 600;
          const height = img.height || 350;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
            const pngDataUrl = canvas.toDataURL('image/png');
            const base64 = pngDataUrl.split(',')[1];
            const binary = atob(base64.trim());
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const targetWidth = 520;
            const targetHeight = Math.round((height / width) * 520) || 300;
            safeResolve({ data: bytes, width: targetWidth, height: targetHeight });
            return;
          }
        } catch (e) {
          console.error('Error drawing SVG on canvas:', e);
        }
        safeResolve({ data: new Uint8Array(0), width: 100, height: 100 });
      };
      img.onerror = () => safeResolve({ data: new Uint8Array(0), width: 100, height: 100 });
      img.src = dataUrl;
      return;
    }

    try {
      const parts = dataUrl.split(',');
      const base64 = parts.length > 1 ? parts[1] : parts[0];
      const binary = atob(base64.replace(/\s/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      safeResolve({ data: bytes, width: 520, height: 300 });
    } catch (e) {
      console.error('Error parsing base64 data URL:', e);
      safeResolve({ data: new Uint8Array(0), width: 100, height: 100 });
    }
  });
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
