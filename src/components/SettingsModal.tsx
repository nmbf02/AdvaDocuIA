import React, { useState, useRef } from 'react';
import {
  BrandingSettings,
  DocumentTitlesConfig,
  DEFAULT_DOCUMENT_TITLES,
  DEFAULT_TECHNICAL_DOC_TITLES,
  getEffectiveTitles,
  getEffectiveTechnicalTitles,
} from '../types';
import {
  Settings,
  X,
  Image as ImageIcon,
  Upload,
  Trash2,
  Heading1,
  RotateCcw,
  Check,
  Sparkles,
  Sliders,
  Eye,
  EyeOff,
  Terminal,
  FileText,
  Database,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  branding: BrandingSettings;
  onChange: (updated: BrandingSettings) => void;
  onClose: () => void;
  onOpenBackup?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  branding,
  onChange,
  onClose,
  onOpenBackup,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'titles' | 'techTitles' | 'branding' | 'backup'>('titles');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTitles = branding.customTitles || {};
  const effectiveTitles = getEffectiveTitles(branding.customTitles);
  const effectiveTechTitles = getEffectiveTechnicalTitles(branding.customTitles);

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

  const handleToggleHide = (field: keyof DocumentTitlesConfig) => {
    const updatedTitles: DocumentTitlesConfig = {
      ...branding.customTitles,
      [field]: !branding.customTitles?.[field],
    };
    onChange({
      ...branding,
      customTitles: updatedTitles,
    });
  };

  const handleResetProposalTitles = () => {
    const nextTitles: DocumentTitlesConfig = {
      ...branding.customTitles,
      mainTitle: undefined,
      section1: undefined,
      section2: undefined,
      section3: undefined,
      section3_1: undefined,
      section3_2: undefined,
      section3_3: undefined,
      section4: undefined,
      section5: undefined,
      section6: undefined,
      section7: undefined,
      section8: undefined,
      hideSection1: false,
      hideSection2: false,
      hideSection3: false,
      hideSection3_1: false,
      hideSection3_2: false,
      hideSection3_3: false,
      hideSection4: false,
      hideSection5: false,
      hideSection6: false,
      hideSection7: false,
      hideSection8: false,
    };
    onChange({
      ...branding,
      customTitles: nextTitles,
    });
    setCopiedNotification('Títulos de la propuesta restablecidos a los valores estándar de Advansys.');
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const handleResetTechTitles = () => {
    const nextTitles: DocumentTitlesConfig = {
      ...branding.customTitles,
      techMainTitle: undefined,
      techSection1: undefined,
      techSection2: undefined,
      techSection3: undefined,
      techSection4: undefined,
      techSection5: undefined,
      hideTechMainTitle: false,
      hideTechSection1: false,
      hideTechSection2: false,
      hideTechSection3: false,
      hideTechSection4: false,
      hideTechSection5: false,
    };
    onChange({
      ...branding,
      customTitles: nextTitles,
    });
    setCopiedNotification('Títulos de documentación técnica restablecidos a los valores por defecto.');
    setTimeout(() => setCopiedNotification(null), 2500);
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
                Personaliza títulos de documentos, secciones y branding institucional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('titles')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'titles'
                ? 'border-[#0A3D62] text-[#0A3D62] bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-[#0A3D62]" />
            <span>Propuesta Técnica (8 Secc.)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('techTitles')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'techTitles'
                ? 'border-[#0A3D62] text-[#0A3D62] bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4 text-[#2ECC71]" />
            <span>Doc. Técnica (5 Secc.)</span>
            {(currentTitles.techMainTitle || currentTitles.techSection1 || currentTitles.techSection2 || currentTitles.techSection3 || currentTitles.techSection4 || currentTitles.techSection5 || currentTitles.hideTechMainTitle || currentTitles.hideTechSection1 || currentTitles.hideTechSection2 || currentTitles.hideTechSection3 || currentTitles.hideTechSection4 || currentTitles.hideTechSection5) && (
              <span className="w-2 h-2 rounded-full bg-[#2ECC71]" title="Personalizado" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
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

          {onOpenBackup && (
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'backup'
                  ? 'border-[#0A3D62] text-[#0A3D62] bg-white rounded-t-lg shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Database className="w-4 h-4 text-[#0A3D62]" />
              <span>Copia de Seguridad</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: PROPUESTA TÉCNICA TITLES */}
          {activeTab === 'titles' && (
            <div className="space-y-5">
              {/* Header explanation & Reset button */}
              <div className="flex items-start justify-between gap-4 bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
                <div className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-[#0A3D62] block mb-0.5">
                    Personalización de Títulos - Propuesta Técnica
                  </span>
                  Modifica los títulos de las 8 secciones y la portada. Estos cambios se aplicarán automáticamente a la vista previa, a Word (.docx) y a PDF.
                </div>
                <button
                  type="button"
                  onClick={handleResetProposalTitles}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-red-700 text-[11px] font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                  title="Restaurar a los títulos originales de Advansys"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Restablecer</span>
                </button>
              </div>

              {copiedNotification && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{copiedNotification}</span>
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
                  <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                    currentTitles.hideSection1 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 truncate">
                        1. Sección 1 (Resumen)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideSection1')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideSection1
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideSection1 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideSection1 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideSection1 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideSection1}
                      value={currentTitles.section1 ?? ''}
                      onChange={(e) => handleTitleChange('section1', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section1}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50"
                    />
                  </div>

                  {/* Section 2 */}
                  <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                    currentTitles.hideSection2 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 truncate">
                        2. Sección 2 (Beneficios)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideSection2')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideSection2
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideSection2 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideSection2 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideSection2 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideSection2}
                      value={currentTitles.section2 ?? ''}
                      onChange={(e) => handleTitleChange('section2', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section2}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50"
                    />
                  </div>

                  {/* Section 3 */}
                  <div className={`border rounded-xl p-3 shadow-xs sm:col-span-2 transition-colors ${
                    currentTitles.hideSection3 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        3. Sección 3 (Alcance, Exclusiones y Entregables)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideSection3')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideSection3
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideSection3 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideSection3 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideSection3 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideSection3}
                      value={currentTitles.section3 ?? ''}
                      onChange={(e) => handleTitleChange('section3', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section3}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50 mb-2"
                    />
                    
                    {/* Subsections of Section 3 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] font-bold text-slate-600">3.1 Alcance:</label>
                          <button
                            type="button"
                            onClick={() => handleToggleHide('hideSection3_1')}
                            className="text-[9px] text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            {currentTitles.hideSection3_1 ? 'Oculto' : 'Visible'}
                          </button>
                        </div>
                        <input
                          type="text"
                          disabled={currentTitles.hideSection3_1}
                          value={currentTitles.section3_1 ?? ''}
                          onChange={(e) => handleTitleChange('section3_1', e.target.value)}
                          placeholder={DEFAULT_DOCUMENT_TITLES.section3_1}
                          className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white rounded px-2 py-1 text-[11px] disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] font-bold text-slate-600">3.2 Exclusiones:</label>
                          <button
                            type="button"
                            onClick={() => handleToggleHide('hideSection3_2')}
                            className="text-[9px] text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            {currentTitles.hideSection3_2 ? 'Oculto' : 'Visible'}
                          </button>
                        </div>
                        <input
                          type="text"
                          disabled={currentTitles.hideSection3_2}
                          value={currentTitles.section3_2 ?? ''}
                          onChange={(e) => handleTitleChange('section3_2', e.target.value)}
                          placeholder={DEFAULT_DOCUMENT_TITLES.section3_2}
                          className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white rounded px-2 py-1 text-[11px] disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] font-bold text-slate-600">3.3 Entregables:</label>
                          <button
                            type="button"
                            onClick={() => handleToggleHide('hideSection3_3')}
                            className="text-[9px] text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            {currentTitles.hideSection3_3 ? 'Oculto' : 'Visible'}
                          </button>
                        </div>
                        <input
                          type="text"
                          disabled={currentTitles.hideSection3_3}
                          value={currentTitles.section3_3 ?? ''}
                          onChange={(e) => handleTitleChange('section3_3', e.target.value)}
                          placeholder={DEFAULT_DOCUMENT_TITLES.section3_3}
                          className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white rounded px-2 py-1 text-[11px] disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                    currentTitles.hideSection4 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 truncate">
                        4. Sección 4 (Objetivos)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideSection4')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideSection4
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideSection4 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideSection4 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideSection4 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideSection4}
                      value={currentTitles.section4 ?? ''}
                      onChange={(e) => handleTitleChange('section4', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section4}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50"
                    />
                  </div>

                  {/* Section 5 */}
                  <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                    currentTitles.hideSection5 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 truncate">
                        5. Sección 5 (Descripción)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideSection5')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideSection5
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideSection5 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideSection5 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideSection5 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideSection5}
                      value={currentTitles.section5 ?? ''}
                      onChange={(e) => handleTitleChange('section5', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section5}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50"
                    />
                  </div>

                  {/* Section 6 */}
                  <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                    currentTitles.hideSection6 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 truncate">
                        6. Sección 6 (Índice Operativo)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideSection6')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideSection6
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideSection6 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideSection6 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideSection6 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideSection6}
                      value={currentTitles.section6 ?? ''}
                      onChange={(e) => handleTitleChange('section6', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section6}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50"
                    />
                  </div>

                  {/* Section 7 */}
                  <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                    currentTitles.hideSection7 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 truncate">
                        7. Sección 7 (Análisis Operativo)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideSection7')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideSection7
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideSection7 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideSection7 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideSection7 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideSection7}
                      value={currentTitles.section7 ?? ''}
                      onChange={(e) => handleTitleChange('section7', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section7}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50"
                    />
                  </div>

                  {/* Section 8 */}
                  <div className={`border rounded-xl p-3 shadow-xs sm:col-span-2 transition-colors ${
                    currentTitles.hideSection8 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 truncate">
                        8. Sección 8 (Descargo y Cláusula Estándar)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideSection8')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideSection8
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideSection8 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideSection8 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideSection8 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideSection8}
                      value={currentTitles.section8 ?? ''}
                      onChange={(e) => handleTitleChange('section8', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.section8}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL DOCUMENTATION TITLES */}
          {activeTab === 'techTitles' && (
            <div className="space-y-5">
              {/* Header explanation & Reset button */}
              <div className="flex items-start justify-between gap-4 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
                <div className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-[#0A3D62] block mb-0.5 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-[#2ECC71]" />
                    Personalización de Títulos - Documentación Técnica Interna
                  </span>
                  Configura el título del proyecto/documento técnico y los títulos de las 5 secciones de desarrollo (Ruta, Flujo, Diseño, Consideraciones y Código). Puedes renombrarlos u ocultarlos para la exportación a Word y PDF.
                </div>
                <button
                  type="button"
                  onClick={handleResetTechTitles}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-red-700 text-[11px] font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                  title="Restaurar a los títulos por defecto de Documentación Técnica"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Restablecer</span>
                </button>
              </div>

              {copiedNotification && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{copiedNotification}</span>
                </div>
              )}

              {/* Main Technical Document Title */}
              <div className={`border rounded-xl p-4 space-y-2 transition-colors ${
                currentTitles.hideTechMainTitle ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0A3D62] uppercase tracking-wide">
                    Título Principal del Documento Técnico
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleHide('hideTechMainTitle')}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      currentTitles.hideTechMainTitle
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                    title={currentTitles.hideTechMainTitle ? 'Título principal oculto en exportación' : 'Título principal visible'}
                  >
                    {currentTitles.hideTechMainTitle ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                    <span>{currentTitles.hideTechMainTitle ? 'Oculto' : 'Visible'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  disabled={currentTitles.hideTechMainTitle}
                  value={currentTitles.techMainTitle ?? ''}
                  onChange={(e) => handleTitleChange('techMainTitle', e.target.value)}
                  placeholder={DEFAULT_TECHNICAL_DOC_TITLES.techMainTitle}
                  className="w-full bg-white border border-slate-300 focus:border-[#0A3D62] focus:ring-1 focus:ring-[#0A3D62] rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm disabled:opacity-50"
                />
                <p className="text-[10px] text-slate-400">
                  Por defecto: <span className="font-mono">{DEFAULT_TECHNICAL_DOC_TITLES.techMainTitle}</span>
                </p>
              </div>

              {/* Individual Technical Section Titles */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#0A3D62] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#2ECC71]" />
                  Títulos de las 5 Secciones Técnicas
                </h4>

                <div className="grid grid-cols-1 gap-3.5">
                  {/* Tech Section 1 */}
                  <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                    currentTitles.hideTechSection1 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        1. Ruta de Acceso & Navegación en el Sistema
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideTechSection1')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideTechSection1
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideTechSection1 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideTechSection1 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideTechSection1 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideTechSection1}
                      value={currentTitles.techSection1 ?? ''}
                      onChange={(e) => handleTitleChange('techSection1', e.target.value)}
                      placeholder={DEFAULT_TECHNICAL_DOC_TITLES.techSection1}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50"
                    />
                  </div>

                  {/* Tech Section 2 */}
                  <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                    currentTitles.hideTechSection2 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        2. Flujo Operativo Interno
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideTechSection2')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideTechSection2
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideTechSection2 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideTechSection2 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideTechSection2 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideTechSection2}
                      value={currentTitles.techSection2 ?? ''}
                      onChange={(e) => handleTitleChange('techSection2', e.target.value)}
                      placeholder={DEFAULT_TECHNICAL_DOC_TITLES.techSection2}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50"
                    />
                  </div>

                  {/* Tech Section 3 */}
                  <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                    currentTitles.hideTechSection3 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        3. Diseño de Interfaz y Estructura de Datos
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideTechSection3')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideTechSection3
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideTechSection3 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideTechSection3 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideTechSection3 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideTechSection3}
                      value={currentTitles.techSection3 ?? ''}
                      onChange={(e) => handleTitleChange('techSection3', e.target.value)}
                      placeholder={DEFAULT_TECHNICAL_DOC_TITLES.techSection3}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50"
                    />
                  </div>

                  {/* Tech Section 4 */}
                  <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                    currentTitles.hideTechSection4 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        4. Consideraciones Técnicas y de Seguridad
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideTechSection4')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideTechSection4
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideTechSection4 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideTechSection4 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideTechSection4 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideTechSection4}
                      value={currentTitles.techSection4 ?? ''}
                      onChange={(e) => handleTitleChange('techSection4', e.target.value)}
                      placeholder={DEFAULT_TECHNICAL_DOC_TITLES.techSection4}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50"
                    />
                  </div>

                  {/* Tech Section 5 */}
                  <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                    currentTitles.hideTechSection5 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        5. Código de Ejemplo / Scripts (si aplica)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleHide('hideTechSection5')}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          currentTitles.hideTechSection5
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={currentTitles.hideTechSection5 ? 'Sección oculta en el documento' : 'Sección visible en el documento'}
                      >
                        {currentTitles.hideTechSection5 ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                        <span>{currentTitles.hideTechSection5 ? 'Oculto' : 'Visible'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={currentTitles.hideTechSection5}
                      value={currentTitles.techSection5 ?? ''}
                      onChange={(e) => handleTitleChange('techSection5', e.target.value)}
                      placeholder={DEFAULT_TECHNICAL_DOC_TITLES.techSection5}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BRANDING LOGO */}
          {activeTab === 'branding' && (
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
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
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

          {/* TAB 4: BACKUP & DATA MANAGEMENT */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#0A3D62]" />
                  <h3 className="text-sm font-bold text-[#0A3D62]">Respaldo y Seguridad de Datos</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Toda tu información (historial de propuestas, documentos técnicos, personalizaciones y ajustes) se almacena localmente en este navegador. Para evitar perder datos al borrar el historial o cambiar de equipo, puedes exportar un archivo de respaldo completo (.JSON) y cargarlo cuando desees.
                </p>
              </div>

              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    Administrador de Copias de Seguridad
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Exporta un archivo .JSON con todos tus documentos o importa un respaldo previo para restaurarlos.
                  </p>
                </div>
                {onOpenBackup && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBackup();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#0A3D62] hover:bg-[#1E5F8A] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-[#2ECC71]" />
                    <span>Abrir Copia de Seguridad</span>
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
            className="px-5 py-2 text-xs font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
