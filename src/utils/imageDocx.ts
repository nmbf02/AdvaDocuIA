import {
  ImageRun,
  AlignmentType,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  TextWrappingType,
  TextWrappingSide,
} from 'docx';
import { UploadedImage } from '../types';
import {
  getImageAlign,
  getImageRotation,
  getImageVerticalAlign,
  getImageWrap,
  isFloatingWrap,
} from './imageLayout';

export type ImageLayoutConfig = Pick<
  UploadedImage,
  'align' | 'wrap' | 'verticalAlign' | 'rotation' | 'flipHorizontal' | 'flipVertical' | 'widthPercent'
>;

export function paragraphAlignOf(image: ImageLayoutConfig | null | undefined) {
  const align = getImageAlign(image);
  if (align === 'left') return AlignmentType.LEFT;
  if (align === 'right') return AlignmentType.RIGHT;
  return AlignmentType.CENTER;
}

export function createDocumentImageRun(
  data: Uint8Array,
  size: { width: number; height: number },
  image: ImageLayoutConfig
): ImageRun {
  const wrap = getImageWrap(image);
  const align = getImageAlign(image);
  const vAlign = getImageVerticalAlign(image);
  const rotation = getImageRotation(image);

  const transformation = {
    width: size.width,
    height: size.height,
    rotation,
    flip: {
      horizontal: Boolean(image.flipHorizontal),
      vertical: Boolean(image.flipVertical),
    },
  };

  if (!isFloatingWrap(wrap)) {
    return new ImageRun({
      data,
      type: 'png',
      transformation,
    });
  }

  const wrapType =
    wrap === 'square'
      ? TextWrappingType.SQUARE
      : wrap === 'tight'
        ? TextWrappingType.TIGHT
        : wrap === 'topAndBottom'
          ? TextWrappingType.TOP_AND_BOTTOM
          : TextWrappingType.NONE;

  const wrapSide =
    align === 'left' ? TextWrappingSide.RIGHT : align === 'right' ? TextWrappingSide.LEFT : TextWrappingSide.BOTH_SIDES;

  return new ImageRun({
    data,
    type: 'png',
    transformation,
    floating: {
      horizontalPosition: {
        relative: HorizontalPositionRelativeFrom.MARGIN,
        align:
          align === 'left'
            ? HorizontalPositionAlign.LEFT
            : align === 'right'
              ? HorizontalPositionAlign.RIGHT
              : HorizontalPositionAlign.CENTER,
      },
      verticalPosition: {
        relative: VerticalPositionRelativeFrom.PARAGRAPH,
        align:
          vAlign === 'top'
            ? VerticalPositionAlign.TOP
            : vAlign === 'bottom'
              ? VerticalPositionAlign.BOTTOM
              : VerticalPositionAlign.CENTER,
      },
      allowOverlap: wrap === 'behind' || wrap === 'inFront',
      behindDocument: wrap === 'behind',
      wrap: {
        type: wrapType,
        side: wrapSide,
        margins: {
          distT: 72000,
          distB: 72000,
          distL: wrap === 'tight' ? 36000 : 114300,
          distR: wrap === 'tight' ? 36000 : 114300,
        },
      },
      zIndex: wrap === 'inFront' ? 251660000 : wrap === 'behind' ? 0 : 251658240,
    },
  });
}
