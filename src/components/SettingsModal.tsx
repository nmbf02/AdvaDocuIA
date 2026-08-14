import React, { useState, useRef } from 'react';
import { BrandingSettings, DocumentTitlesConfig, DEFAULT_DOCUMENT_TITLES, getEffectiveTitles } from '../types';
import { Settings, X, Image as ImageIcon, Upload, Trash2, Heading1, RotateCcw, Check, Sparkles, Sliders } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'titles' | 'branding'>('titles');
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!isOpen) return null;

  const currentTitles = branding.customTitles || {};
  const effectiveTitles = getEffectiveTitles(branding.customTitles);

  const handleTitleChange = (field: keyof DocumentTitlesConfig, value: string) => {
    const updatedTitles: DocumentTitlesConfig = {
      ...branding.customTitles,
      [field]: value,
    };
    onChange({
      ...branding,
      customTitles: updatedTitles,
    });
  };

  const handleResetTitles = () => {
    onChange({
      ...branding,
      customTitles: undefined,
    });
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

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
      ...branding,
      logoDataUrl: undefined,
      logoMimeType: undefined,
      logoFileName: undefined,
      logoWidth: undefined,
      logoHeight: undefined,
    });
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#0A3D62] text-white p-4 px-6 flex items-center justify-between border-b border-[#1E5F8A]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-white/10 rounded-xl">
              <Settings className="w-5 h-5 text-[#2ECC71]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white">Configuración y Ajustes</h2>
              <p className="text-[11px] text-blue-200">
                Personaliza títulos de secciones y branding institucional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('titles')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'titles'
                ? 'border-[#0A3D62] text-[#0A3D62] bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heading1 className="w-4 h-4 text-[#0A3D62]" />
            <span>Títulos del Proyecto</span>
            {branding.customTitles && Object.keys(branding.customTitles).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]" title="Personalizado" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'branding'
                ? 'border-[#0A3D62] text-[#0A3D62] bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#0A3D62]" />
            <span>Logo Corporativo</span>
            {branding.logoDataUrl && (
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]" title="Logo configurado" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'titles' ? (
            <div className="space-y-5">
              {/* Header explanation & Reset button */}
              <div className="flex items-start justify-between gap-4 bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
                <div className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-[#0A3D62] block mb-0.5">
                    Personalización de Encabezados y Secciones
                  </span>
                  Modifica los títulos estándar del documento. Estos cambios se aplicarán automáticamente a la vista previa, a Word (.docx) y a PDF.
                </div>
                <button
                  type="button"
                  onClick={handleResetTitles}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-red-700 text-[11px] font-semibold rounded-lg shadow-sm transition-all"
                  title="Restaurar a los títulos originales de Advansys"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Restablecer</span>
                </button>
              </div>

              {copiedNotification && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Títulos restablecidos a los valores estándar de Advansys.</span>
                </div>
              )}

              {/* Main Document Title */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <label className="block text-xs font-bold text-[#0A3D62] uppercase tracking-wide">
                  Título Principal del Documento (Carátula / Portada)
                </label>
                <input
                  type="text"
                  value={currentTitles.mainTitle ?? ''}
                  onChange={(e) => handleTitleChange('mainTitle', e.target.value)}
                  placeholder={DEFAULT_DOCUMENT_TITLES.mainTitle}
                  className="w-full bg-white border border-slate-300 focus:border-[#0A3D62] focus:ring-1 focus:ring-[#0A3D62] rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm"
                />
                <p className="text-[10px] text-slate-400">
                  Por defecto: <span className="font-mono">{DEFAULT_DOCUMENT_TITLES.mainTitle}</span>
                </p>
              </div>

              {/* Individual Section Titles Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#0A3D62] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#2ECC71]" />
                  Títulos de las 8 Secciones del Documento
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Section 1 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. Sección 1 (Resumen)
                    </label>
                    <input
                      type="text"
                      value={currentTitles.section1 ?? ''}
                      onChange={(e) => handleTitleChange('section1', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section1}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  {/* Section 2 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. Sección 2 (Beneficios)
                    </label>
                    <input
                      type="text"
                      value={currentTitles.section2 ?? ''}
                      onChange={(e) => handleTitleChange('section2', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section2}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  {/* Section 3 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      3. Sección 3 (Alcance y Entregables)
                    </label>
                    <input
                      type="text"
                      value={currentTitles.section3 ?? ''}
                      onChange={(e) => handleTitleChange('section3', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section3}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 mb-2"
                    />

                    {/* Sub-items for Section 3 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-medium text-slate-500 block mb-0.5">3.1 Alcance:</span>
                        <input
                          type="text"
                          value={currentTitles.section3_1 ?? ''}
                          onChange={(e) => handleTitleChange('section3_1', e.target.value)}
                          placeholder={DEFAULT_DOCUMENT_TITLES.section3_1}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-slate-500 block mb-0.5">3.2 Exclusiones:</span>
                        <input
                          type="text"
                          value={currentTitles.section3_2 ?? ''}
                          onChange={(e) => handleTitleChange('section3_2', e.target.value)}
                          placeholder={DEFAULT_DOCUMENT_TITLES.section3_2}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-slate-500 block mb-0.5">3.3 Entregables:</span>
                        <input
                          type="text"
                          value={currentTitles.section3_3 ?? ''}
                          onChange={(e) => handleTitleChange('section3_3', e.target.value)}
                          placeholder={DEFAULT_DOCUMENT_TITLES.section3_3}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      4. Sección 4 (Objetivos)
                    </label>
                    <input
                      type="text"
                      value={currentTitles.section4 ?? ''}
                      onChange={(e) => handleTitleChange('section4', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section4}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  {/* Section 5 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      5. Sección 5 (Descripción de Solución)
                    </label>
                    <input
                      type="text"
                      value={currentTitles.section5 ?? ''}
                      onChange={(e) => handleTitleChange('section5', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section5}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  {/* Section 6 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      6. Sección 6 (Índice Operativo)
                    </label>
                    <input
                      type="text"
                      value={currentTitles.section6 ?? ''}
                      onChange={(e) => handleTitleChange('section6', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section6}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  {/* Section 7 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      7. Sección 7 (Análisis Operativo Detallado)
                    </label>
                    <input
                      type="text"
                      value={currentTitles.section7 ?? ''}
                      onChange={(e) => handleTitleChange('section7', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section7}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  {/* Section 8 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      8. Sección 8 (Descargo y Cláusula Estándar)
                    </label>
                    <input
                      type="text"
                      value={currentTitles.section8 ?? ''}
                      onChange={(e) => handleTitleChange('section8', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section8}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-[#0A3D62]" />
                  <h3 className="text-xs font-bold text-[#0A3D62] uppercase tracking-wide">
                    Logo corporativo de la empresa
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Este logo aparece en la barra superior, la carátula de presentación y los encabezados en los documentos Word (.docx) y PDF que generes.
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
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 min-w-0">
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
                      <p className="text-[10px] text-slate-500">Se aplica a todos los proyectos y documentos</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
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
                    className="w-full border-2 border-dashed border-slate-300 hover:border-[#0A3D62] bg-slate-50 hover:bg-blue-50/40 rounded-xl p-6 text-center transition-all cursor-pointer group"
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-[#0A3D62] group-hover:scale-110 transition-transform" />
                    <span className="block text-xs font-semibold text-slate-700">Cargar logotipo institucional</span>
                    <span className="block text-[10px] text-slate-500 mt-1">PNG, JPG o SVG — arrastra o haz clic aquí</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Los cambios se guardan y aplican automáticamente
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-xl shadow-sm transition-all"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
