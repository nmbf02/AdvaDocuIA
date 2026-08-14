import React, { useRef } from 'react';
import { BrandingSettings } from '../types';
import { Settings, X, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  branding: BrandingSettings;
  onChange: (updated: BrandingSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  branding,
  onChange,
  onClose,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const applyLogoFromFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        const maxW = 480;
        const maxH = 200;
        const scale = Math.min(1, maxW / (img.width || 1), maxH / (img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        onChange({
          ...branding,
          logoDataUrl: canvas.toDataURL('image/png'),
          logoMimeType: 'image/png',
          logoFileName: file.name,
          logoWidth: width,
          logoHeight: height,
        });
      };
      img.onerror = () => {
        onChange({
          ...branding,
          logoDataUrl: result,
          logoMimeType: file.type,
          logoFileName: file.name,
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    onChange({
      logoDataUrl: undefined,
      logoMimeType: undefined,
      logoFileName: undefined,
      logoWidth: undefined,
      logoHeight: undefined,
    });
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        <div className="bg-[#0A3D62] text-white p-4 px-5 flex items-center justify-between border-b border-[#1E5F8A]">
          <div className="flex items-center gap-2 min-w-0">
            <Settings className="w-5 h-5 text-[#2ECC71] shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base font-bold">Ajustes</h2>
              <p className="text-[11px] text-blue-200">
                El logo se usa en todos los documentos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-[#0A3D62]" />
              <h3 className="text-xs font-bold text-[#0A3D62] uppercase tracking-wide">
                Logo corporativo
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Este logo aparece en la barra de la app, la carátula y el encabezado de cada Word que generes.
            </p>

            <input
              type="file"
              ref={logoInputRef}
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) applyLogoFromFile(file);
              }}
            />

            {branding.logoDataUrl ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 min-w-0">
                <div className="h-16 w-28 shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-1">
                  <img
                    src={branding.logoDataUrl}
                    alt="Logo corporativo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#0A3D62] truncate">
                    {branding.logoFileName || 'Logo cargado'}
                  </p>
                  <p className="text-[10px] text-slate-500">Se usa en todos los documentos</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  title="Quitar logo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) applyLogoFromFile(file);
                }}
                className="w-full border-2 border-dashed border-slate-300 hover:border-[#0A3D62] bg-slate-50 hover:bg-blue-50/40 rounded-xl p-5 text-center transition-all"
              >
                <Upload className="w-5 h-5 mx-auto mb-1.5 text-[#0A3D62]" />
                <span className="block text-xs font-semibold text-slate-700">Cargar logo</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">PNG, JPG o SVG — arrastra o haz clic</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-lg shadow-sm"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
