import React, { useState, useRef } from 'react';
import {
  BrandingSettings,
  DocumentTitlesConfig,
  DEFAULT_AGENT_CONFIG,
  DEFAULT_AGENT_ROLE,
  getEffectiveAgentConfig,
  DEFAULT_DOCUMENT_TITLES,
  DEFAULT_TECHNICAL_DOC_TITLES,
  DEFAULT_DESCARGO_TEXT,
  DEFAULT_PROPOSAL_HEADER_FOOTER,
  DEFAULT_TECHNICAL_HEADER_FOOTER,
  getEffectiveTitles,
  getEffectiveTechnicalTitles,
  getEffectiveProposalHeaderFooter,
  getEffectiveTechnicalHeaderFooter,
  Page2LogoMode,
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
  Laptop,
  Copy,
  ExternalLink,
  AlignJustify,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Bot,
  ArrowUpDown,
} from 'lucide-react';

type SettingsTab = 'titles' | 'techTitles' | 'headersFooters' | 'branding' | 'agent' | 'backup' | 'local';

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
  const page2LogoInputRef = useRef<HTMLInputElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('titles');
  const [headerFooterSubTab, setHeaderFooterSubTab] = useState<'proposal' | 'technical'>('proposal');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 220;
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (tabsContainerRef.current && e.deltaY !== 0) {
      tabsContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleTabClick = (tabKey: SettingsTab, e?: React.MouseEvent<HTMLButtonElement>) => {
    setActiveTab(tabKey);
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const currentTitles = branding.customTitles || {};
  const effectiveTitles = getEffectiveTitles(branding.customTitles);
  const effectiveTechTitles = getEffectiveTechnicalTitles(branding.customTitles);
  const effectiveProposalHF = getEffectiveProposalHeaderFooter(null, branding);
  const effectiveTechHF = getEffectiveTechnicalHeaderFooter(null, null, branding);

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
      coverSubtitle: undefined,
      confidentialityTitle: undefined,
      confidentialityText: undefined,
      hideConfidentiality: false,
      section1: undefined,
      section2: undefined,
      section3: undefined,
      section3_1: undefined,
      section3_2: undefined,
      section3_3: undefined,
      sectionPage2: undefined,
      section4: undefined,
      section5: undefined,
      section6: undefined,
      section7: undefined,
      section8: undefined,
      defaultDescargo: undefined,
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
      swapSection6And7: false,
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

  const handleProposalHeaderFooterChange = (
    field: 'proposalHeaderBrandTag' | 'proposalHeaderSubtitle' | 'proposalFooterText',
    value: string
  ) => {
    onChange({
      ...branding,
      [field]: value,
    });
  };

  const handleTechHeaderFooterChange = (
    field: 'techHeaderBrandTag' | 'techHeaderSubtitle' | 'techHeaderRightText' | 'techFooterText' | 'techIncludeHeaderBanner',
    value: string | boolean | undefined
  ) => {
    onChange({
      ...branding,
      [field]: value,
    });
  };

  const handleResetProposalHeaderFooter = () => {
    onChange({
      ...branding,
      proposalHeaderBrandTag: undefined,
      proposalHeaderSubtitle: undefined,
      proposalFooterText: undefined,
    });
    setCopiedNotification('Encabezados y pie de página de la Propuesta restablecidos.');
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const handleResetTechHeaderFooter = () => {
    onChange({
      ...branding,
      techHeaderBrandTag: undefined,
      techHeaderSubtitle: undefined,
      techHeaderRightText: undefined,
      techFooterText: undefined,
      techIncludeHeaderBanner: false,
    });
    setCopiedNotification('Encabezados y pie de página de la Doc. Técnica restablecidos.');
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const applyLogoFromFile = (file: File, target: 'main' | 'page2' = 'main') => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      const apply = (dataUrl: string, mime: string, width?: number, height?: number) => {
        if (target === 'page2') {
          onChange({
            ...branding,
            page2LogoDataUrl: dataUrl,
            page2LogoMimeType: mime,
            page2LogoFileName: file.name,
            page2LogoWidth: width,
            page2LogoHeight: height,
            page2LogoMode: branding.page2LogoMode || 'page2',
          });
          return;
        }
        onChange({
          ...branding,
          logoDataUrl: dataUrl,
          logoMimeType: mime,
          logoFileName: file.name,
          logoWidth: width,
          logoHeight: height,
        });
      };

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
        if (ctx) ctx.drawImage(img, 0, 0, width, height);
        apply(canvas.toDataURL('image/png'), 'image/png', width, height);
      };
      img.onerror = () => apply(result, file.type);
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

  const handleRemovePage2Logo = () => {
    onChange({
      ...branding,
      page2LogoDataUrl: undefined,
      page2LogoMimeType: undefined,
      page2LogoFileName: undefined,
      page2LogoWidth: undefined,
      page2LogoHeight: undefined,
    });
    if (page2LogoInputRef.current) page2LogoInputRef.current.value = '';
  };

  const page2LogoMode: Page2LogoMode = branding.page2LogoMode || (branding.page2LogoDataUrl ? 'page2' : 'main');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#0A3D62] text-white p-3 sm:p-4 px-4 sm:px-6 flex items-center justify-between gap-2 border-b border-[#1E5F8A] min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-white/10 rounded-xl">
              <Settings className="w-5 h-5 text-[#2ECC71]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white">Configuración y Ajustes</h2>
              <p className="text-[11px] text-blue-200 hidden sm:block">
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

        {/* Tab Navigation with Left/Right Scroll Chevrons & Wheel Support */}
        <div className="relative flex items-center border-b border-slate-200 bg-slate-100/90 px-2 sm:px-3">
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            aria-label="Desplazar a la izquierda"
            title="Desplazar opciones a la izquierda"
            className="flex items-center justify-center p-1.5 rounded-lg text-slate-600 hover:text-[#0A3D62] hover:bg-white/80 active:bg-white shadow-2xs border border-transparent hover:border-slate-200 transition-all mr-1 shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={tabsContainerRef}
            onWheel={handleTabsWheel}
            className="flex items-center gap-1.5 pt-2 pb-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent scroll-smooth flex-1 select-none"
          >
            <button
              type="button"
              onClick={(e) => handleTabClick('titles', e)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'titles'
                  ? 'border-[#0A3D62] text-[#0A3D62] bg-white rounded-t-lg shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-t-lg'
              }`}
            >
              <FileText className="w-4 h-4 text-[#0A3D62]" />
              <span>Propuesta Técnica (8 Secc.)</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleTabClick('techTitles', e)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'techTitles'
                  ? 'border-[#0A3D62] text-[#0A3D62] bg-white rounded-t-lg shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-t-lg'
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
              onClick={(e) => handleTabClick('headersFooters', e)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'headersFooters'
                  ? 'border-[#0A3D62] text-[#0A3D62] bg-white rounded-t-lg shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-t-lg'
              }`}
            >
              <Sliders className="w-4 h-4 text-[#0A3D62]" />
              <span>Encabezados y Pies</span>
              {(branding.proposalHeaderBrandTag || branding.proposalHeaderSubtitle || branding.proposalFooterText || branding.techHeaderBrandTag || branding.techHeaderSubtitle || branding.techHeaderRightText || branding.techFooterText || branding.techIncludeHeaderBanner) && (
                <span className="w-2 h-2 rounded-full bg-[#2ECC71]" title="Personalizado" />
              )}
            </button>

            <button
              type="button"
              onClick={(e) => handleTabClick('branding', e)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'branding'
                  ? 'border-[#0A3D62] text-[#0A3D62] bg-white rounded-t-lg shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-t-lg'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[#0A3D62]" />
              <span>Logo Corporativo</span>
              {branding.logoDataUrl && (
                <span className="w-2 h-2 rounded-full bg-[#2ECC71]" title="Logo configurado" />
              )}
            </button>

            <button
              type="button"
              onClick={(e) => handleTabClick('agent', e)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'agent'
                  ? 'border-[#0A3D62] text-[#0A3D62] bg-white rounded-t-lg shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-t-lg'
              }`}
            >
              <Bot className="w-4 h-4 text-[#0A3D62]" />
              <span>Agente IA</span>
              {branding.agent && (
                <span className="w-2 h-2 rounded-full bg-[#2ECC71]" title="Rol personalizado" />
              )}
            </button>

            {onOpenBackup && (
              <button
                type="button"
                onClick={(e) => handleTabClick('backup', e)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'backup'
                    ? 'border-[#0A3D62] text-[#0A3D62] bg-white rounded-t-lg shadow-sm'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-t-lg'
                }`}
              >
                <Database className="w-4 h-4 text-[#0A3D62]" />
                <span>Copia de Seguridad</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => handleTabClick('local', e)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'local'
                  ? 'border-[#0A3D62] text-[#0A3D62] bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-t-lg'
              }`}
            >
              <Laptop className="w-4 h-4 text-[#0A3D62]" />
              <span>Guía de Uso Local</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => scrollTabs('right')}
            aria-label="Desplazar a la derecha"
            title="Desplazar opciones a la derecha"
            className="flex items-center justify-center p-1.5 rounded-lg text-slate-600 hover:text-[#0A3D62] hover:bg-white/80 active:bg-white shadow-2xs border border-transparent hover:border-slate-200 transition-all ml-1 shrink-0 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
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

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <label className="block text-xs font-bold text-[#0A3D62] uppercase tracking-wide">
                  Subtítulo de la portada (debajo del título)
                </label>
                <input
                  type="text"
                  value={currentTitles.coverSubtitle ?? ''}
                  onChange={(e) => handleTitleChange('coverSubtitle', e.target.value)}
                  placeholder={DEFAULT_DOCUMENT_TITLES.coverSubtitle}
                  className="w-full bg-white border border-slate-300 focus:border-[#0A3D62] focus:ring-1 focus:ring-[#0A3D62] rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm"
                />
                <p className="text-[10px] text-slate-400">
                  Por defecto: <span className="font-mono">{DEFAULT_DOCUMENT_TITLES.coverSubtitle}</span>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <label className="block text-xs font-bold text-[#0A3D62] uppercase tracking-wide">
                  Sección Confidencialidad (página 1)
                </label>
                <input
                  type="text"
                  value={currentTitles.confidentialityTitle ?? ''}
                  onChange={(e) => handleTitleChange('confidentialityTitle', e.target.value)}
                  placeholder={DEFAULT_DOCUMENT_TITLES.confidentialityTitle}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm"
                />
                <textarea
                  value={currentTitles.confidentialityText ?? ''}
                  onChange={(e) => handleTitleChange('confidentialityText', e.target.value)}
                  placeholder={DEFAULT_DOCUMENT_TITLES.confidentialityText}
                  rows={3}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 shadow-sm"
                />
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

                  {/* Página 2 Comercial */}
                  <div className="border rounded-xl p-3 shadow-xs bg-white border-slate-200 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                      Página 2 · Comercial
                    </label>
                    <input
                      type="text"
                      value={currentTitles.sectionPage2 ?? ''}
                      onChange={(e) => handleTitleChange('sectionPage2', e.target.value)}
                      placeholder={DEFAULT_DOCUMENT_TITLES.sectionPage2}
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#0A3D62] rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Nombre de la sección comercial en el editor y en la vista previa. Por defecto: {DEFAULT_DOCUMENT_TITLES.sectionPage2}
                    </p>
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

                  {/* Sections 6 & 7: orden intercambiable */}
                  {(() => {
                    const analysisFirst = !!currentTitles.swapSection6And7;
                    const indiceNum = analysisFirst ? '7' : '6';
                    const analisisNum = analysisFirst ? '6' : '7';
                    const indiceCard = (
                      <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                        currentTitles.hideSection6 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 truncate">
                            {indiceNum}. Índice de Análisis Operativo
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
                    );
                    const analisisCard = (
                      <div className={`border rounded-xl p-3 shadow-xs transition-colors ${
                        currentTitles.hideSection7 ? 'bg-slate-100/80 border-slate-300 opacity-80' : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 truncate">
                            {analisisNum}. Análisis Operativo
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
                    );
                    return (
                      <div className="sm:col-span-2 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] text-slate-500">
                            Orden en el documento: {analysisFirst ? 'Análisis Operativo → Índice' : 'Índice → Análisis Operativo'}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleToggleHide('swapSection6And7')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-white border border-slate-300 text-[#0A3D62] hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                            title="Intercambiar el orden de las secciones 6 y 7 sin ocultar ninguna"
                          >
                            <ArrowUpDown className="w-3 h-3" />
                            Intercambiar orden
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {analysisFirst ? (
                            <>
                              {analisisCard}
                              {indiceCard}
                            </>
                          ) : (
                            <>
                              {indiceCard}
                              {analisisCard}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}

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

              {/* Cláusula de Descargo por Defecto Configurable */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#0A3D62] text-white">
                      <FileText className="w-3.5 h-3.5 text-[#2ECC71]" />
                    </span>
                    <div>
                      <label className="block text-xs font-bold text-[#0A3D62] uppercase tracking-wide">
                        Texto / Cláusula de Descargo por Defecto (Sección 8)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Este texto aparecerá siempre automáticamente por defecto en la sección 8 de toda nueva propuesta o borrador creado.
                      </p>
                    </div>
                  </div>

                  {currentTitles.defaultDescargo && (
                    <button
                      type="button"
                      onClick={() => handleTitleChange('defaultDescargo', '')}
                      className="shrink-0 flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-600 hover:text-red-700 text-[10px] font-semibold rounded shadow-2xs transition-all cursor-pointer"
                      title="Restablecer cláusula estándar institucional"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>Restablecer</span>
                    </button>
                  )}
                </div>

                <textarea
                  rows={4}
                  value={currentTitles.defaultDescargo ?? ''}
                  onChange={(e) => handleTitleChange('defaultDescargo', e.target.value)}
                  placeholder={DEFAULT_DESCARGO_TEXT}
                  className="w-full bg-white border border-slate-300 focus:border-[#0A3D62] focus:ring-1 focus:ring-[#0A3D62] rounded-lg p-3 text-xs font-sans text-slate-800 shadow-sm leading-relaxed"
                />

                <div className="flex items-center justify-between text-[10px] text-slate-500 bg-white/70 p-2 rounded border border-slate-200">
                  <span>
                    Estado: <strong className="text-[#0A3D62]">{currentTitles.defaultDescargo?.trim() ? 'Personalizado' : 'Texto estándar por defecto de Advansys'}</strong>
                  </span>
                  <span>{(currentTitles.defaultDescargo || DEFAULT_DESCARGO_TEXT).length} caracteres</span>
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

          {/* TAB: ENCABEZADOS Y PIES DE PÁGINA (INDEPENDIENTES) */}
          {activeTab === 'headersFooters' && (
            <div className="space-y-5">
              {/* Header explanation */}
              <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-emerald-50/80 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#0A3D62]" />
                    <span className="font-bold text-xs text-[#0A3D62] uppercase tracking-wide">
                      Gestión Independiente de Encabezados y Pies de Página
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Ajuste Global / Predeterminado
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Configura por separado los textos del <strong>encabezado superior (Header)</strong> y del <strong>pie de página (Footer)</strong> para la <em>Propuesta Técnica/Comercial</em> y para la <em>Documentación Técnica Interna</em>. Cada tipo de documento mantiene su propia identidad visual en Word y PDF.
                </p>
              </div>

              {copiedNotification && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{copiedNotification}</span>
                </div>
              )}

              {/* Sub-navigation selector for Document Type */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setHeaderFooterSubTab('proposal')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    headerFooterSubTab === 'proposal'
                      ? 'bg-white text-[#0A3D62] shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#0A3D62]" />
                  <span>📘 Propuesta Técnica (8 Secc.)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeaderFooterSubTab('technical')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    headerFooterSubTab === 'technical'
                      ? 'bg-white text-[#0A3D62] shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Terminal className="w-4 h-4 text-[#2ECC71]" />
                  <span>📗 Doc. Técnica (5 Secc.)</span>
                </button>
              </div>

              {/* PANEL 1: PROPUESTA TÉCNICA / COMERCIAL */}
              {headerFooterSubTab === 'proposal' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#0A3D62]" />
                      <span className="text-xs font-bold text-[#0A3D62]">
                        Encabezados & Pies: Propuesta Técnica / Comercial
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetProposalHeaderFooter}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-red-700 text-[11px] font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                      title="Restablecer encabezados y pie de propuesta a valores por defecto"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>Restablecer</span>
                    </button>
                  </div>

                  {/* Input 1: Marca Header */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-xs">
                    <label className="block text-xs font-bold text-slate-800">
                      Marca o Etiqueta del Encabezado (Header Brand Tag)
                    </label>
                    <input
                      type="text"
                      value={branding.proposalHeaderBrandTag ?? ''}
                      onChange={(e) => handleProposalHeaderFooterChange('proposalHeaderBrandTag', e.target.value)}
                      placeholder={DEFAULT_PROPOSAL_HEADER_FOOTER.headerBrandTag}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-900 bg-slate-50/50 focus:bg-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      Se muestra en el banner superior de la carátula y en el encabezado izquierdo de las páginas 2 en adelante. Por defecto: <span className="font-semibold text-slate-700">{DEFAULT_PROPOSAL_HEADER_FOOTER.headerBrandTag}</span>
                    </p>
                  </div>

                  {/* Input 2: Subtítulo Header */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-xs">
                    <label className="block text-xs font-bold text-slate-800">
                      Subtítulo del Encabezado Superior (Header Páginas 2+)
                    </label>
                    <input
                      type="text"
                      value={branding.proposalHeaderSubtitle ?? ''}
                      onChange={(e) => handleProposalHeaderFooterChange('proposalHeaderSubtitle', e.target.value)}
                      placeholder={DEFAULT_PROPOSAL_HEADER_FOOTER.headerSubtitle}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-900 bg-slate-50/50 focus:bg-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      Texto que acompaña a la marca en el encabezado de las páginas siguientes. Por defecto: <span className="font-semibold text-slate-700">{DEFAULT_PROPOSAL_HEADER_FOOTER.headerSubtitle}</span>
                    </p>
                  </div>

                  {/* Input 3: Pie de Página */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-xs">
                    <label className="block text-xs font-bold text-slate-800">
                      Texto del Pie de Página (Footer de todas las páginas)
                    </label>
                    <input
                      type="text"
                      value={branding.proposalFooterText ?? ''}
                      onChange={(e) => handleProposalHeaderFooterChange('proposalFooterText', e.target.value)}
                      placeholder={DEFAULT_PROPOSAL_HEADER_FOOTER.footerText}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-900 bg-slate-50/50 focus:bg-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      Aparece en la parte inferior izquierda de todas las páginas junto a la numeración <em>(Página X de Y)</em>. Por defecto: <span className="font-semibold text-slate-700">{DEFAULT_PROPOSAL_HEADER_FOOTER.footerText}</span>
                    </p>
                  </div>

                  {/* Live Mini Preview for Proposal */}
                  <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Simulación Visual en Documento (Propuesta)
                    </span>
                    
                    {/* Simulated Header */}
                    <div className="bg-white text-slate-900 p-2.5 rounded-lg border border-slate-300 text-[11px] shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[10px] text-slate-500">
                        <span>
                          <strong className="text-[#0A3D62]">{effectiveProposalHF.headerBrandTag || 'ADVANSYS'}</strong> • {effectiveProposalHF.headerSubtitle || 'DOCUMENTACIÓN TÉCNICA Y ANÁLISIS DE CUMPLIMIENTO'}
                        </span>
                        <span className="text-slate-400">Pág. 2</span>
                      </div>
                      <div className="py-2 text-slate-400 text-[9px] italic text-center">
                        — Contenido de la sección de la propuesta —
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-[10px] text-slate-500">
                        <span>{effectiveProposalHF.footerText || 'Advansys SRL'}</span>
                        <span>Página 2 de 4</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PANEL 2: DOCUMENTACIÓN TÉCNICA INTERNA */}
              {headerFooterSubTab === 'technical' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#2ECC71]" />
                      <span className="text-xs font-bold text-[#0A3D62]">
                        Encabezados & Pies: Documentación Técnica Interna
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetTechHeaderFooter}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-red-700 text-[11px] font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                      title="Restablecer encabezados y pie técnico a valores por defecto"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>Restablecer</span>
                    </button>
                  </div>

                  {/* Toggle Banner Portada Primera Página */}
                  <div className="p-3.5 bg-gradient-to-r from-blue-50/70 to-emerald-50/70 border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#0A3D62]" />
                        <span className="text-xs font-bold text-slate-800">
                          Imagen / Banner de Encabezado en Primera Página
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Determina si se incluye la portada gráfica institucional superior en la primera página de las exportaciones técnicas (Word y PDF).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTechHeaderFooterChange('techIncludeHeaderBanner', !branding.techIncludeHeaderBanner)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                        branding.techIncludeHeaderBanner
                          ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {branding.techIncludeHeaderBanner ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Incluir Banner</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                          <span>Sin Banner</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Input 1: Marca Header Técnico */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-xs">
                    <label className="block text-xs font-bold text-slate-800">
                      Marca o Etiqueta del Encabezado Técnico
                    </label>
                    <input
                      type="text"
                      value={branding.techHeaderBrandTag ?? ''}
                      onChange={(e) => handleTechHeaderFooterChange('techHeaderBrandTag', e.target.value)}
                      placeholder={DEFAULT_TECHNICAL_HEADER_FOOTER.techHeaderBrandTag}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-900 bg-slate-50/50 focus:bg-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      Etiqueta izquierda en la barra superior de la especificación técnica. Por defecto: <span className="font-semibold text-slate-700">{DEFAULT_TECHNICAL_HEADER_FOOTER.techHeaderBrandTag}</span>
                    </p>
                  </div>

                  {/* Input 2: Subtítulo Header Técnico */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-xs">
                    <label className="block text-xs font-bold text-slate-800">
                      Subtítulo del Encabezado Técnico
                    </label>
                    <input
                      type="text"
                      value={branding.techHeaderSubtitle ?? ''}
                      onChange={(e) => handleTechHeaderFooterChange('techHeaderSubtitle', e.target.value)}
                      placeholder={DEFAULT_TECHNICAL_HEADER_FOOTER.techHeaderSubtitle}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-900 bg-slate-50/50 focus:bg-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      Subtítulo distintivo en verde esmeralda. Por defecto: <span className="font-semibold text-slate-700">{DEFAULT_TECHNICAL_HEADER_FOOTER.techHeaderSubtitle}</span>
                    </p>
                  </div>

                  {/* Input 3: Texto Derecho Header Técnico */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-xs">
                    <label className="block text-xs font-bold text-slate-800">
                      Texto Derecho del Encabezado (Opcional - Reemplazo de Ticket)
                    </label>
                    <input
                      type="text"
                      value={branding.techHeaderRightText ?? ''}
                      onChange={(e) => handleTechHeaderFooterChange('techHeaderRightText', e.target.value)}
                      placeholder="ej. CONFIDENCIAL / USO DEV & QA (si está vacío, usa el Ticket No)"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-900 bg-slate-50/50 focus:bg-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      Si se deja en blanco, tomará automáticamente el <em>Ticket No.</em> del documento actual.
                    </p>
                  </div>

                  {/* Input 4: Pie de Página Técnico */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-xs">
                    <label className="block text-xs font-bold text-slate-800">
                      Texto del Pie de Página Técnico (Footer)
                    </label>
                    <input
                      type="text"
                      value={branding.techFooterText ?? ''}
                      onChange={(e) => handleTechHeaderFooterChange('techFooterText', e.target.value)}
                      placeholder={DEFAULT_TECHNICAL_HEADER_FOOTER.techFooterText}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-900 bg-slate-50/50 focus:bg-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      Texto de confidencialidad o autor en la parte inferior de la documentación técnica. Por defecto: <span className="font-semibold text-slate-700">{DEFAULT_TECHNICAL_HEADER_FOOTER.techFooterText}</span>
                    </p>
                  </div>

                  {/* Live Mini Preview for Technical Doc */}
                  <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Simulación Visual en Documento (Doc. Técnica)
                    </span>
                    
                    {/* Simulated Header */}
                    <div className="bg-white text-slate-900 p-2.5 rounded-lg border border-slate-300 text-[11px] shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#0A3D62]">{effectiveTechHF.techHeaderBrandTag || 'ADVANSYS'}</span>
                          <span className="text-slate-300">|</span>
                          <span className="font-bold text-[#2ECC71]">{effectiveTechHF.techHeaderSubtitle || 'ESPECIFICACIÓN TÉCNICA INTERNA DE DESARROLLO'}</span>
                        </div>
                        <span className="font-mono text-slate-400 text-[9px] font-bold uppercase">
                          {effectiveTechHF.techHeaderRightText || 'TK-2026-089'}
                        </span>
                      </div>
                      <div className="py-2 text-slate-400 text-[9px] italic text-center">
                        — Secciones técnicas: Ruta, Flujo, Diseño, Consideraciones y Código —
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-[10px] text-slate-500">
                        <span className="uppercase text-[9px] font-semibold text-slate-600">
                          {effectiveTechHF.techFooterText || 'DOCUMENTO CONFIDENCIAL DE USO INTERNO ADVANSYS'}
                        </span>
                        <span>Página 1 de 2</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  Este logo aparece en la barra superior, la carátula (página 1) y los encabezados de las páginas siguientes. La página comercial tiene su propio logo.
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

              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#1E5F8A]" />
                  <h3 className="text-xs font-bold text-[#0A3D62] uppercase tracking-wide">
                    Logo de la página 2 (comercial)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Independiente del logo de carátula y encabezados. Puedes ocultarlo, usar el logo general o uno exclusivo de esta página.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'off' as const, label: 'Ocultar' },
                      { id: 'main' as const, label: 'Logo general' },
                      { id: 'page2' as const, label: 'Logo página 2' },
                    ]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChange({ ...branding, page2LogoMode: opt.id })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        page2LogoMode === opt.id
                          ? 'bg-[#0A3D62] text-white border-[#0A3D62]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-[#1E5F8A]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <input
                  type="file"
                  ref={page2LogoInputRef}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) applyLogoFromFile(file, 'page2');
                  }}
                />
                {branding.page2LogoDataUrl ? (
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 min-w-0">
                    <div className="h-16 w-28 shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-1">
                      <img src={branding.page2LogoDataUrl} alt="Logo página 2" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#0A3D62] truncate">{branding.page2LogoFileName || 'Logo página 2'}</p>
                      <p className="text-[10px] text-slate-500">Solo se usa en la hoja comercial si eliges “Logo página 2”</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePage2Logo}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                      title="Quitar logo de página 2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => page2LogoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-300 hover:border-[#1E5F8A] bg-slate-50 hover:bg-blue-50/40 rounded-xl p-5 text-center transition-all"
                  >
                    <Upload className="w-5 h-5 mx-auto mb-1.5 text-[#1E5F8A]" />
                    <span className="block text-xs font-semibold text-slate-700">Cargar logo exclusivo de página 2</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'agent' && (() => {
            const agent = getEffectiveAgentConfig(branding.agent);
            return (
              <div className="space-y-5">
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-[#0A3D62] block mb-0.5">Instrucciones del agente</span>
                  Define cómo debe redactar la IA. La entrevista (una pregunta a la vez) aparece al crear una propuesta, doc. técnica o diapositivas; después se cargan las notas del documento.
                </div>

                {copiedNotification && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{copiedNotification}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">Idioma</label>
                    <select
                      value={agent.idioma}
                      onChange={(e) =>
                        onChange({
                          ...branding,
                          agent: { ...agent, idioma: e.target.value === 'en' ? 'en' : 'es' },
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="es">Español formal</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Entrevista al crear documento</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Al pulsar Nueva propuesta, técnica o diapositivas</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...branding,
                          agent: { ...agent, interviewEnabled: !agent.interviewEnabled },
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold shrink-0 ${
                        agent.interviewEnabled
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {agent.interviewEnabled ? 'Activada' : 'Apagada'}
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-[#0A3D62] uppercase tracking-wide">Rol / instrucciones</label>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ ...branding, agent: { ...DEFAULT_AGENT_CONFIG } });
                        setCopiedNotification('Rol restablecido al Analista Funcional Senior.');
                        setTimeout(() => setCopiedNotification(null), 2500);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 text-slate-600 text-[10px] font-semibold rounded"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restablecer
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={branding.agent?.rol ?? DEFAULT_AGENT_ROLE}
                    onChange={(e) =>
                      onChange({
                        ...branding,
                        agent: { ...agent, rol: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 leading-relaxed"
                  />
                </div>
              </div>
            );
          })()}

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

          {/* TAB 5: LOCAL EXECUTION & OFFLINE/DESKTOP GUIDE */}
          {activeTab === 'local' && (
            <div className="space-y-5 text-xs text-slate-700">
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-[#2ECC71]" />
                  <h3 className="text-sm font-bold text-white">Ejecución en tu Computadora (Local)</h3>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Esta aplicación ya está lista para correr como una aplicación web local en tu computadora, manteniendo todos los botones con IA de Gemini activos mediante tu propia clave de API.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0A3D62] text-white text-[11px] flex items-center justify-center font-bold">1</span>
                    Instala las dependencias en tu terminal
                  </h4>
                  <div className="bg-slate-950 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] flex items-center justify-between">
                    <code>npm install</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('npm install');
                        setCopiedNotification('Comando copiado');
                        setTimeout(() => setCopiedNotification(null), 2000);
                      }}
                      className="text-slate-400 hover:text-white text-[10px] px-2 py-0.5 rounded bg-white/10"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0A3D62] text-white text-[11px] flex items-center justify-center font-bold">2</span>
                    Crea tu archivo .env con tu clave de Gemini
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Crea un archivo llamado <code>.env</code> en la carpeta raíz con tu clave obtenida en Google AI Studio:
                  </p>
                  <div className="bg-slate-950 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] flex items-center justify-between">
                    <code>GEMINI_API_KEY=tu_clave_de_gemini_aqui</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('GEMINI_API_KEY=tu_clave_de_gemini_aqui\nPORT=3000');
                        setCopiedNotification('Configuración copiada');
                        setTimeout(() => setCopiedNotification(null), 2000);
                      }}
                      className="text-slate-400 hover:text-white text-[10px] px-2 py-0.5 rounded bg-white/10"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0A3D62] text-white text-[11px] flex items-center justify-center font-bold">3</span>
                    Inicia el servidor local y abre en tu navegador
                  </h4>
                  <div className="bg-slate-950 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] flex items-center justify-between">
                    <code>npm run dev</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('npm run dev');
                        setCopiedNotification('Comando copiado');
                        setTimeout(() => setCopiedNotification(null), 2000);
                      }}
                      className="text-slate-400 hover:text-white text-[10px] px-2 py-0.5 rounded bg-white/10"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Abre <strong>http://localhost:3000</strong> en tu navegador. Todos los botones de IA (generar propuesta, calibrar tecnicismo, diapositivas y doc. técnica) funcionarán al 100%.
                  </p>
                </div>
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
