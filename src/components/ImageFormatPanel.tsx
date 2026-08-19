import React from 'react';
import { UploadedImage } from '../types';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  FlipHorizontal2,
  FlipVertical2,
  RotateCw,
} from 'lucide-react';
import {
  IMAGE_SIZE_PRESETS,
  IMAGE_WRAP_OPTIONS,
  IMAGE_ROTATION_PRESETS,
  ImageAlign,
  ImageVerticalAlign,
  getImageAlign,
  getImageRotation,
  getImageVerticalAlign,
  getImageWidthPercent,
  getImageWrap,
  isFloatingWrap,
} from '../utils/imageLayout';

interface ImageFormatPanelProps {
  image: UploadedImage;
  onChange: (patch: Partial<UploadedImage>) => void;
}

const iconBtn = (active: boolean) =>
  `p-1.5 rounded-md transition-colors ${
    active ? 'bg-[#0A3D62] text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

export const ImageFormatPanel: React.FC<ImageFormatPanelProps> = ({ image, onChange }) => {
  const wrap = getImageWrap(image);
  const floating = isFloatingWrap(wrap);

  return (
    <div className="space-y-2.5 pt-1">
      <div>
        <span className="block text-[11px] font-semibold text-slate-600 mb-1">
          Ajuste de texto (como en Word)
        </span>
        <div className="grid grid-cols-3 gap-1">
          {IMAGE_WRAP_OPTIONS.map((opt) => {
            const active = wrap === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                title={opt.hint}
                onClick={() => onChange({ wrap: opt.value })}
                className={`px-1.5 py-1.5 text-[10px] font-bold rounded-lg border transition-colors leading-tight ${
                  active
                    ? 'bg-[#0A3D62] text-white border-[#0A3D62]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#0A3D62]/40'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <div>
          <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Horizontal</span>
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            {([
              { value: 'left' as ImageAlign, icon: AlignLeft, title: 'Izquierda' },
              { value: 'center' as ImageAlign, icon: AlignCenter, title: 'Centro' },
              { value: 'right' as ImageAlign, icon: AlignRight, title: 'Derecha' },
            ]).map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.title}
                  onClick={() => onChange({ align: opt.value })}
                  className={iconBtn(getImageAlign(image) === opt.value)}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>

        {floating && (
          <div>
            <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Vertical</span>
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
              {([
                { value: 'top' as ImageVerticalAlign, icon: AlignVerticalJustifyStart, title: 'Arriba' },
                { value: 'center' as ImageVerticalAlign, icon: AlignVerticalJustifyCenter, title: 'Medio' },
                { value: 'bottom' as ImageVerticalAlign, icon: AlignVerticalJustifyEnd, title: 'Abajo' },
              ]).map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.title}
                    onClick={() => onChange({ verticalAlign: opt.value })}
                    className={iconBtn(getImageVerticalAlign(image) === opt.value)}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tamaño</span>
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            {IMAGE_SIZE_PRESETS.map((preset) => {
              const active = getImageWidthPercent(image) === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.title}
                  onClick={() => onChange({ widthPercent: preset.value })}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                    active ? 'bg-[#0A3D62] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <div>
          <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Rotación</span>
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            {IMAGE_ROTATION_PRESETS.map((deg) => (
              <button
                key={deg}
                type="button"
                title={`Girar ${deg}°`}
                onClick={() => onChange({ rotation: deg })}
                className={`px-2 py-1 text-[10px] font-bold rounded-md inline-flex items-center gap-0.5 ${
                  getImageRotation(image) === deg
                    ? 'bg-[#0A3D62] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {deg === 0 ? '0°' : (
                  <>
                    <RotateCw className="w-3 h-3" />
                    {deg}°
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Voltear</span>
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              type="button"
              title="Voltear horizontal"
              onClick={() => onChange({ flipHorizontal: !image.flipHorizontal })}
              className={iconBtn(Boolean(image.flipHorizontal))}
            >
              <FlipHorizontal2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Voltear vertical"
              onClick={() => onChange({ flipVertical: !image.flipVertical })}
              className={iconBtn(Boolean(image.flipVertical))}
            >
              <FlipVertical2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
