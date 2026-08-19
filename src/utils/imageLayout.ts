import { UploadedImage } from '../types';

export type ImageAlign = 'left' | 'center' | 'right';
export type ImageVerticalAlign = 'top' | 'center' | 'bottom';
export type ImageWrap = 'inline' | 'square' | 'tight' | 'topAndBottom' | 'behind' | 'inFront';

export const IMAGE_SIZE_PRESETS: { label: string; value: number; title: string }[] = [
  { label: 'S', value: 40, title: 'Pequeña (40%)' },
  { label: 'M', value: 60, title: 'Mediana (60%)' },
  { label: 'L', value: 80, title: 'Grande (80%)' },
  { label: '100%', value: 100, title: 'Ancho completo' },
];

export const IMAGE_WRAP_OPTIONS: { value: ImageWrap; label: string; hint: string }[] = [
  { value: 'inline', label: 'En línea', hint: 'Con el texto, como un carácter' },
  { value: 'square', label: 'Cuadrado', hint: 'El texto rodea el recuadro' },
  { value: 'tight', label: 'Estrecho', hint: 'El texto se ajusta al contorno' },
  { value: 'topAndBottom', label: 'Arriba y abajo', hint: 'Texto solo encima y debajo' },
  { value: 'behind', label: 'Detrás', hint: 'Detrás del texto (marca de agua)' },
  { value: 'inFront', label: 'Delante', hint: 'Delante del texto' },
];

export const IMAGE_ROTATION_PRESETS = [0, 90, 180, 270] as const;

export function getImageWidthPercent(image?: Pick<UploadedImage, 'widthPercent'> | null): number {
  const n = Number(image?.widthPercent);
  if (!Number.isFinite(n)) return 100;
  return Math.min(100, Math.max(25, Math.round(n)));
}

export function getImageAlign(image?: Pick<UploadedImage, 'align'> | null): ImageAlign {
  if (image?.align === 'left' || image?.align === 'right') return image.align;
  return 'center';
}

export function getImageVerticalAlign(image?: Pick<UploadedImage, 'verticalAlign'> | null): ImageVerticalAlign {
  if (image?.verticalAlign === 'top' || image?.verticalAlign === 'bottom') return image.verticalAlign;
  return 'center';
}

export function getImageWrap(image?: Pick<UploadedImage, 'wrap'> | null): ImageWrap {
  const wrap = image?.wrap;
  if (
    wrap === 'square' ||
    wrap === 'tight' ||
    wrap === 'topAndBottom' ||
    wrap === 'behind' ||
    wrap === 'inFront'
  ) {
    return wrap;
  }
  return 'inline';
}

export function getImageRotation(image?: Pick<UploadedImage, 'rotation'> | null): number {
  const n = Number(image?.rotation);
  if (!Number.isFinite(n)) return 0;
  const normalized = ((Math.round(n) % 360) + 360) % 360;
  return normalized;
}

export function isFloatingWrap(wrap: ImageWrap): boolean {
  return wrap !== 'inline';
}

export function fitImageSize(
  naturalW: number,
  naturalH: number,
  maxW: number,
  maxH: number,
  widthPercent = 100
): { width: number; height: number } {
  const w = naturalW > 0 ? naturalW : maxW;
  const h = naturalH > 0 ? naturalH : Math.round(maxW * 0.56);
  const capW = maxW * (getImageWidthPercent({ widthPercent }) / 100);
  const scale = Math.min(capW / w, maxH / h, 1);
  return {
    width: Math.max(40, Math.round(w * scale)),
    height: Math.max(24, Math.round(h * scale)),
  };
}

export function pdfImageX(cardX: number, cardW: number, dispW: number, align: ImageAlign, pad = 4): number {
  if (align === 'left') return cardX + pad;
  if (align === 'right') return cardX + cardW - dispW - pad;
  return cardX + (cardW - dispW) / 2;
}

export function previewAlignClass(align: ImageAlign): string {
  if (align === 'left') return 'ml-0 mr-auto text-left';
  if (align === 'right') return 'ml-auto mr-0 text-right';
  return 'mx-auto text-center';
}

export function previewWrapClass(image: UploadedImage): string {
  const wrap = getImageWrap(image);
  const align = getImageAlign(image);
  if (wrap === 'square' || wrap === 'tight') {
    const gap = wrap === 'tight' ? 'mx-2 mb-1' : 'mx-3 mb-2';
    if (align === 'right') return `float-right ${gap}`;
    return `float-left ${gap}`;
  }
  if (wrap === 'behind') return 'relative z-0 opacity-40';
  if (wrap === 'inFront') return 'relative z-10';
  return previewAlignClass(align);
}
