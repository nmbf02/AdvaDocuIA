import {
  ImageRun,
  AlignmentType,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  TextWrappingType,
  TextWrappingSide,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import { UploadedImage } from '../types';
import {
  getImageAlign,
  getImageRotation,
  getImageVerticalAlign,
  getImageWrap,
  isFloatingWrap,
} from './imageLayout';
import { DocxRasterType } from './imageExport';

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
  image: ImageLayoutConfig,
  type: DocxRasterType = 'png'
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

  const altText = {
    name: 'Imagen',
    title: 'Imagen',
    description: '',
  };

  if (!isFloatingWrap(wrap)) {
    return new ImageRun({
      data,
      type,
      transformation,
      altText,
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
    type,
    transformation,
    altText,
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
        // Top avoids covering the step title above the photo
        align:
          vAlign === 'bottom'
            ? VerticalPositionAlign.BOTTOM
            : vAlign === 'center'
              ? VerticalPositionAlign.CENTER
              : VerticalPositionAlign.TOP,
      },
      allowOverlap: wrap === 'behind' || wrap === 'inFront',
      behindDocument: wrap === 'behind',
      layoutInCell: true,
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

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

/**
 * Image + caption as an in-flow Word block.
 * A trailing paragraph is required: Word often drops the last drawing in the body,
 * which is why the last operational step (the one with photos) disappeared on download.
 */
export function createDocxImageBlock(
  data: Uint8Array,
  size: { width: number; height: number },
  image: ImageLayoutConfig & { index: number; title?: string; description?: string },
  type: DocxRasterType = 'png'
): (Paragraph | Table)[] {
  if (!data || data.length === 0) return [];

  const alignment = paragraphAlignOf(image);
  const wrap = getImageWrap(image);
  const imageRun = createDocumentImageRun(data, size, image, type);

  const imageParagraph = new Paragraph({
    alignment,
    spacing: { before: 80, after: 40 },
    children: [imageRun],
  });

  const captionParagraph = new Paragraph({
    alignment,
    spacing: { before: 40, after: 80 },
    children: [
      new TextRun({
        text: `[IMAGEN_${image.index}] ${image.title || 'Captura de referencia'}`,
        bold: true,
        italics: true,
        color: '64748B',
        size: 18,
        font: 'Calibri',
      }),
      ...(image.description
        ? [
            new TextRun({
              text: ` - ${image.description}`,
              italics: true,
              color: '64748B',
              size: 18,
              font: 'Calibri',
            }),
          ]
        : []),
    ],
  });

  const cellChildren: Paragraph[] = [imageParagraph, captionParagraph];
  if (isFloatingWrap(wrap)) {
    cellChildren.push(
      new Paragraph({
        spacing: { after: Math.max(200, Math.round(size.height * 15)) },
        children: [new TextRun({ text: '\u00A0' })],
      })
    );
  }

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      insideHorizontal: NO_BORDER,
      insideVertical: NO_BORDER,
    },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: NO_BORDER,
              bottom: NO_BORDER,
              left: NO_BORDER,
              right: NO_BORDER,
            },
            children: cellChildren,
          }),
        ],
      }),
    ],
  });

  return [
    table,
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: '\u200B' })],
    }),
  ];
}
