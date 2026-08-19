import React from 'react';
import { DocumentTable, UploadedImage } from '../types';
import { getImageRotation, getImageWidthPercent, previewWrapClass } from '../utils/imageLayout';

export const PreviewTable: React.FC<{ table: DocumentTable }> = ({ table }) => (
  <div className="my-3 overflow-x-auto">
    {table.title ? (
      <p className="text-[11px] font-bold text-[#0A3D62] mb-1">{table.title}</p>
    ) : null}
    <table className="w-full text-[11px] border-collapse">
      <thead>
        <tr>
          {table.headers.map((h, i) => (
            <th key={i} className="border border-slate-300 bg-[#0A3D62] text-white font-semibold px-2 py-1.5 text-left">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, ri) => (
          <tr key={ri} className={ri % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
            {table.headers.map((_, ci) => (
              <td key={ci} className="border border-slate-300 px-2 py-1.5 text-slate-700">
                {row[ci] || ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const formatInlineBold = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

const FormattedParagraphs: React.FC<{ text: string; className: string }> = ({ text, className }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentListItems: { type: 'bullet' | 'number'; num?: string; text: string; indent: boolean }[] = [];

  const flushList = (keyPrefix: number) => {
    if (currentListItems.length === 0) return;
    const listType = currentListItems[0].type;

    if (listType === 'bullet') {
      elements.push(
        <ul key={`list-${keyPrefix}`} className="my-2 space-y-1 pl-1">
          {currentListItems.map((item, liIdx) => (
            <li
              key={liIdx}
              className={`flex items-start gap-2 text-xs text-slate-700 leading-relaxed ${
                item.indent ? 'ml-4' : ''
              }`}
            >
              <span className="text-[#2ECC71] font-bold text-sm leading-4 select-none shrink-0">•</span>
              <span className="flex-1">{formatInlineBold(item.text)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`list-${keyPrefix}`} className="my-2 space-y-1 pl-1">
          {currentListItems.map((item, liIdx) => (
            <li
              key={liIdx}
              className={`flex items-start gap-2 text-xs text-slate-700 leading-relaxed ${
                item.indent ? 'ml-4' : ''
              }`}
            >
              <span className="text-[#0A3D62] font-bold font-mono text-[11px] select-none shrink-0 min-w-[1.2rem]">
                {item.num}.
              </span>
              <span className="flex-1">{formatInlineBold(item.text)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentListItems = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(idx);
      return;
    }

    const bulletMatch = line.match(/^(\s*)([•\-\*])\s+(.*)$/);
    const numberMatch = line.match(/^(\s*)(\d+)[\.\)]\s+(.*)$/);

    if (bulletMatch) {
      if (currentListItems.length > 0 && currentListItems[0].type !== 'bullet') {
        flushList(idx);
      }
      currentListItems.push({
        type: 'bullet',
        text: bulletMatch[3],
        indent: bulletMatch[1].length >= 4,
      });
    } else if (numberMatch) {
      if (currentListItems.length > 0 && currentListItems[0].type !== 'number') {
        flushList(idx);
      }
      currentListItems.push({
        type: 'number',
        num: numberMatch[2],
        text: numberMatch[3],
        indent: numberMatch[1].length >= 4,
      });
    } else {
      flushList(idx);
      elements.push(
        <p key={`p-${idx}`} className={className}>
          {formatInlineBold(trimmed)}
        </p>
      );
    }
  });

  flushList(lines.length);

  return <>{elements}</>;
};

export const PreviewImage: React.FC<{ image: UploadedImage; index: number }> = ({ image, index }) => {
  const widthPercent = getImageWidthPercent(image);
  const rotation = getImageRotation(image);
  const scaleX = image.flipHorizontal ? -1 : 1;
  const scaleY = image.flipVertical ? -1 : 1;
  return (
    <div className="my-3 w-full">
      <div
        className={`bg-slate-50 p-3 rounded border border-slate-200 ${previewWrapClass(image)}`}
        style={{ width: `${widthPercent}%`, maxWidth: '100%' }}
      >
        <img
          src={image.dataUrl}
          alt={image.title || `Imagen ${index}`}
          className="max-h-64 w-full object-contain rounded shadow-sm border border-slate-300 mb-1.5"
          style={{ transform: `rotate(${rotation}deg) scale(${scaleX}, ${scaleY})` }}
        />
        <p className="text-[11px] font-bold text-slate-600 italic">
          [IMAGEN_{index}] {image.title || 'Captura de referencia'}
        </p>
        {image.description && (
          <p className="text-[10px] text-slate-500 italic">{image.description}</p>
        )}
      </div>
    </div>
  );
};

export const RichTextBlock: React.FC<{
  text?: string;
  tables?: DocumentTable[];
  images?: UploadedImage[];
  className?: string;
}> = ({
  text,
  tables = [],
  images = [],
  className = 'text-slate-700 leading-relaxed text-xs text-justify',
}) => {
  const source = text || '';
  const parts = source.split(/(\[TABLA_\d+\]|\[IMAGEN_\d+\])/gi);
  return (
    <div className="space-y-2 overflow-hidden">
      {parts.map((part, i) => {
        const tableMatch = part.match(/^\[TABLA_(\d+)\]$/i);
        if (tableMatch) {
          const table = tables[parseInt(tableMatch[1], 10) - 1];
          return table ? <PreviewTable key={i} table={table} /> : <span key={i}>{part}</span>;
        }
        const imageMatch = part.match(/^\[IMAGEN_(\d+)\]$/i);
        if (imageMatch) {
          const idx = parseInt(imageMatch[1], 10) - 1;
          const image = images[idx];
          return image ? <PreviewImage key={i} image={image} index={idx + 1} /> : <span key={i}>{part}</span>;
        }
        if (!part.trim()) return null;
        return <FormattedParagraphs key={i} text={part.trim()} className={className} />;
      })}
    </div>
  );
};
