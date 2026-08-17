import React, { useState, useEffect } from 'react';
import { MetadataHeader, UploadedImage, ProposalSection, SavedProposal, BrandingSettings } from './types';
import { Header } from './components/Header';
import { MetadataForm } from './components/MetadataForm';
import { RequirementsInput } from './components/RequirementsInput';
import { ImageUploader } from './components/ImageUploader';
import { ProposalEditor } from './components/ProposalEditor';
import { HistoryModal } from './components/HistoryModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SettingsModal } from './components/SettingsModal';
import { WelcomeIntro } from './components/WelcomeIntro';
import { ADVANSYS_SAMPLE_METADATA, ADVANSYS_SAMPLE_REQUIREMENTS, ADVANSYS_SAMPLE_IMAGES, EMPTY_MANUAL_PROPOSAL } from './data/presets';
import { createDefaultSlideDeck, convertProposalToSlideDeck } from './utils/slideDeckTemplates';
import { Sparkles, Loader2, FileText, AlertCircle, Cpu, Columns2, ClipboardList, Maximize2, Image as ImageIcon, PenLine, NotebookPen, Layers, X, Check, Presentation } from 'lucide-react';

const STORAGE_KEY_HISTORY = 'advansys_docgen_history_v1';
const STORAGE_KEY_DRAFT = 'advansys_docgen_current_draft_v1';
const STORAGE_KEY_SETTINGS = 'advansys_docgen_settings_v1';
const STORAGE_KEY_THEME = 'advansys_docgen_theme_v1';

const extractBranding = (source?: Partial<BrandingSettings> | null): BrandingSettings => ({
  logoDataUrl: source?.logoDataUrl,
  logoMimeType: source?.logoMimeType,
  logoFileName: source?.logoFileName,
  logoWidth: source?.logoWidth,
  logoHeight: source?.logoHeight,
  customTitles: source?.customTitles,
});

const stripDocumentLogo = (meta: MetadataHeader): MetadataHeader => {
  const { logoDataUrl, logoMimeType, logoFileName, logoWidth, logoHeight, customTitles, ...rest } = meta;
  return rest;
};

export default function App() {
  // Form State
  const [metadata, setMetadata] = useState<MetadataHeader>({
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    ticketNo: '',
    guiaNo: '',
    propuestaNo: '',
    nombreProyecto: '',
    moduloAplicacion: '',
    headerBrandTag: 'ADVANSYS',
    headerSubtitle: '',
    footerText: 'Advansys SRL',
    technicalLevel: 7,
    detailLevel: 6,
    paraphraseLevel: 3,
  });

  const [rawRequirements, setRawRequirements] = useState<string>('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  
  // Output State
  const [proposal, setProposal] = useState<ProposalSection | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Save State
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  // Versioning State
  const [currentVersion, setCurrentVersion] = useState<string>('v1.0');
  const [currentVersionNote, setCurrentVersionNote] = useState<string>('');

  // History State
  const [history, setHistory] = useState<SavedProposal[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Branding / Settings (logo global para todos los documentos)
  const [branding, setBranding] = useState<BrandingSettings>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Confirm Reset Modal State
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState<boolean>(false);

  // Layout Mode & Tab State
  const [layoutMode, setLayoutMode] = useState<'split' | 'inputs' | 'editor'>('split');
  const [inputTab, setInputTab] = useState<'metadatos' | 'requerimientos' | 'imagenes' | 'all'>('requerimientos');
  const [editorTab, setEditorTab] = useState<'editor' | 'preview' | 'slides'>('editor');

  // Theme State ('light' | 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Welcome Intro Screen State (opens first by default)
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  // Load History, Draft, Settings and Theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as 'light' | 'dark' | null;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Optional dark preference detection
        setTheme('dark');
        document.documentElement.classList.add('dark');
      }

      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }

      const savedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
      let draftMetadata: MetadataHeader | undefined;
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.metadata) {
          draftMetadata = parsed.metadata;
          setMetadata(stripDocumentLogo(parsed.metadata));
        }
        if (parsed.rawRequirements !== undefined) setRawRequirements(parsed.rawRequirements);
        if (parsed.images) setImages(parsed.images);
        if (parsed.proposal) setProposal(parsed.proposal);
        if (parsed.version) setCurrentVersion(parsed.version);
        if (parsed.versionNote) setCurrentVersionNote(parsed.versionNote);
        if (parsed.timestamp) {
          const t = new Date(parsed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSavedTime(t);
        }
      }

      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        setBranding(JSON.parse(savedSettings));
      } else if (draftMetadata?.logoDataUrl) {
        const migrated = extractBranding(draftMetadata);
        setBranding(migrated);
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(migrated));
      }
    } catch (e) {
      console.error("Failed to load initial storage:", e);
    }
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY_THEME, nextTheme);
      } catch (e) {
        console.error("Failed to save theme:", e);
      }
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return nextTheme;
    });
  };

  const brandedMetadata: MetadataHeader = { ...metadata, ...branding };

  const handleBrandingChange = (updated: BrandingSettings) => {
    setBranding(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  // Save Changes Helper
  const handleSaveChanges = () => {
    if (!proposal) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSavedTime(timeStr);
    
    const draft = {
      metadata,
      rawRequirements,
      images,
      proposal,
      version: currentVersion,
      versionNote: currentVersionNote,
      timestamp: now.toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(draft));
      saveToHistory(proposal, currentVersion, currentVersionNote);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (e) {
      console.error("Failed to save draft:", e);
    }
  };

  // Save History to localStorage helper
  const saveToHistory = (newProposal: ProposalSection, customVersion?: string, customNote?: string) => {
    const versionLabel = customVersion || currentVersion || 'v1.0';
    const noteLabel = customNote !== undefined ? customNote : currentVersionNote;

    const newEntry: SavedProposal = {
      id: `prop-${Date.now()}`,
      version: versionLabel,
      versionNote: noteLabel,
      timestamp: new Date().toISOString(),
      metadata,
      content: newProposal,
      images,
      rawRequirements
    };

    const updatedHistory = [newEntry, ...history.filter(h => h.id !== newEntry.id).slice(0, 29)];
    setHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  };

  // Save as new version
  const handleSaveNewVersion = (versionTag: string, versionNote: string) => {
    if (!proposal) return;
    setCurrentVersion(versionTag);
    setCurrentVersionNote(versionNote);
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSavedTime(timeStr);

    saveToHistory(proposal, versionTag, versionNote);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Duplicate proposal version helper
  const handleDuplicateProposal = (item: SavedProposal) => {
    const srcVersion = item.version || 'v1.0';
    let newVersionLabel = `${srcVersion}-Copia`;
    
    // Auto-calculate version number if standard v1.0
    if (srcVersion.startsWith('v')) {
      const parts = srcVersion.replace('v', '').split('.');
      const major = parseInt(parts[0]) || 1;
      newVersionLabel = `v${major + 1}.0`;
    }

    const newEntry: SavedProposal = {
      id: `prop-${Date.now()}`,
      version: newVersionLabel,
      versionNote: `Duplicado derivado de ${srcVersion}`,
      timestamp: new Date().toISOString(),
      metadata: { ...item.metadata },
      content: JSON.parse(JSON.stringify(item.content)),
      images: [...(item.images || [])],
      rawRequirements: item.rawRequirements || ''
    };

    const updated = [newEntry, ...history];
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save duplicated version:", e);
    }

    // Load duplicated item into active workspace editor
    setMetadata(stripDocumentLogo(newEntry.metadata));
    setRawRequirements(newEntry.rawRequirements);
    setImages(newEntry.images);
    setProposal(newEntry.content);
    setCurrentVersion(newEntry.version);
    setCurrentVersionNote(newEntry.versionNote || '');
    setIsHistoryOpen(false);

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Preset Loader
  const handleLoadPreset = () => {
    setMetadata(ADVANSYS_SAMPLE_METADATA);
    setRawRequirements(ADVANSYS_SAMPLE_REQUIREMENTS);
    setImages(ADVANSYS_SAMPLE_IMAGES);
    setError(null);
  };

  // Reset Form
  const handleReset = () => {
    setIsConfirmResetOpen(true);
  };

  const handleConfirmReset = () => {
    setMetadata({
      cliente: '',
      fecha: new Date().toISOString().split('T')[0],
      ticketNo: '',
      guiaNo: '',
      propuestaNo: '',
      nombreProyecto: '',
      moduloAplicacion: '',
      headerBrandTag: 'ADVANSYS',
      headerSubtitle: '',
      footerText: 'Advansys SRL',
      technicalLevel: 7,
      detailLevel: 6,
      paraphraseLevel: 3,
    });
    setRawRequirements('');
    setImages([]);
    setProposal(null);
    setError(null);
    setIsConfirmResetOpen(false);
  };

  // Manual Proposal Initialization
  const handleStartManualDraft = () => {
    setProposal(EMPTY_MANUAL_PROPOSAL);
    setError(null);
  };

  // Generate Proposal API Handler
  const handleGenerateProposal = async () => {
    if (!rawRequirements.trim()) {
      setError("Por favor ingresa los requerimientos en bruto o notas del cliente antes de generar la propuesta.");
      return;
    }

    setError(null);
    setIsGenerating(true);
        setGenerationStep("Leyendo tus notas y datos del documento...");

    try {
      setGenerationStep("Armando el borrador de la propuesta...");
      
      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata,
          rawRequirements,
          images
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "No se pudo generar la propuesta. Revisa la clave GEMINI_API_KEY.");
      }

      setGenerationStep("Revisando secciones y referencias de imágenes...");
      setProposal({ ...data.proposal, tables: proposal?.tables || [] });
      saveToHistory(data.proposal);

    } catch (err: any) {
      console.error("Error generating proposal:", err);
      setError(err?.message || "Ocurrió un error inesperado al comunicarse con el servidor.");
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Welcome Screen Action Handlers
  const handleStartNewFromWelcome = () => {
    // Clear fields for a clean fresh document while keeping branding settings
    setMetadata({
      cliente: '',
      fecha: new Date().toISOString().split('T')[0],
      ticketNo: '',
      guiaNo: '',
      propuestaNo: '',
      nombreProyecto: '',
      moduloAplicacion: '',
      headerBrandTag: 'ADVANSYS',
      headerSubtitle: '',
      footerText: 'Advansys SRL',
      technicalLevel: 7,
      detailLevel: 6,
      paraphraseLevel: 3,
    });
    setRawRequirements('');
    setImages([]);
    setProposal(null);
    setCurrentVersion('v1.0');
    setCurrentVersionNote('');
    setEditorTab('editor');
    setError(null);
    setShowWelcome(false);
  };

  const handleStartSlidesFromWelcome = () => {
    setEditorTab('slides');
    if (!proposal) {
      const initialDeck = createDefaultSlideDeck(metadata, images);
      setProposal({
        ...EMPTY_MANUAL_PROPOSAL,
        slideDeck: initialDeck,
      });
    }
    setError(null);
    setShowWelcome(false);
  };

  const handleContinueDraftFromWelcome = () => {
    setShowWelcome(false);
  };

  const handleLoadHistoryFromWelcome = (saved: SavedProposal) => {
    setMetadata(stripDocumentLogo(saved.metadata));
    setRawRequirements(saved.rawRequirements || '');
    setImages(saved.images || []);
    setProposal(saved.content);
    setCurrentVersion(saved.version || 'v1.0');
    setCurrentVersionNote(saved.versionNote || '');
    setShowWelcome(false);
  };

  const handleLoadPresetFromWelcome = () => {
    handleLoadPreset();
    setShowWelcome(false);
  };

  const hasActiveDraft = Boolean(
    proposal !== null ||
    (metadata.nombreProyecto && metadata.nombreProyecto.trim().length > 0) ||
    rawRequirements.trim().length > 0
  );

  const hasDatos = Boolean(
    metadata.cliente.trim() || metadata.ticketNo.trim() || metadata.nombreProyecto.trim()
  );
  const hasNotas = Boolean(rawRequirements.trim());

  // Render Welcome Intro screen first if active
  if (showWelcome) {
    return (
      <>
        <WelcomeIntro
          hasActiveDraft={hasActiveDraft}
          draftInfo={{
            nombreProyecto: metadata.nombreProyecto || (proposal ? 'Propuesta en desarrollo' : undefined),
            cliente: metadata.cliente,
            moduloAplicacion: metadata.moduloAplicacion,
            version: currentVersion,
            lastSavedTime: lastSavedTime,
          }}
          history={history}
          logoDataUrl={branding.logoDataUrl}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onStartNew={handleStartNewFromWelcome}
          onStartSlides={handleStartSlidesFromWelcome}
          onContinueDraft={handleContinueDraftFromWelcome}
          onLoadHistoryItem={handleLoadHistoryFromWelcome}
          onLoadPreset={handleLoadPresetFromWelcome}
          onOpenHistoryModal={() => {
            setShowWelcome(false);
            setIsHistoryOpen(true);
          }}
        />

        {/* History Drawer Modal */}
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          proposals={history}
          onSelectProposal={(saved) => {
            handleLoadHistoryFromWelcome(saved);
          }}
          onDeleteProposal={(id) => {
            const updated = history.filter(h => h.id !== id);
            setHistory(updated);
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
          }}
          onDuplicateProposal={handleDuplicateProposal}
        />

        {/* Branding & Titles Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          branding={branding}
          onChange={handleBrandingChange}
          onClose={() => setIsSettingsOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="h-dvh max-md:h-auto max-md:min-h-dvh text-slate-800 flex flex-col font-sans overflow-hidden max-md:overflow-visible">
      
      {/* Top Header */}
      <Header
        onLoadPreset={handleLoadPreset}
        onReset={handleReset}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onGoHome={() => setShowWelcome(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        historyCount={history.length}
        logoDataUrl={branding.logoDataUrl}
        projectName={metadata.nombreProyecto}
      />

      {/* Main Container */}
      <main className="flex-1 min-h-0 max-w-[1800px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col gap-3 overflow-hidden max-md:overflow-visible">
        
        {/* Banner Alert if Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-2xl shadow-sm flex items-start gap-3 shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-red-800">
              <strong className="font-bold text-red-900">Atención: </strong>
              {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
              title="Descartar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Workspace Mode Bar Switcher */}
        <div className="relative sticky top-14 sm:top-16 lg:top-0 z-40 bg-white/90 backdrop-blur-md rounded-2xl p-1.5 sm:p-2 shadow-sm border border-white/80 sticky-bar flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs px-1.5 min-w-0">
            <span className="font-bold text-[#0A3D62]">Vista</span>
            <span className="text-slate-500 hidden md:inline">Elige si ves los datos, el documento o ambos</span>
          </div>

          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-0.5 border border-slate-200/80 text-xs w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setLayoutMode('split')}
              className={`px-3 py-2 font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                layoutMode === 'split'
                  ? 'bg-[#0A3D62] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Datos + documento</span>
            </button>

            <button
              onClick={() => setLayoutMode('inputs')}
              className={`px-3 py-2 font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                layoutMode === 'inputs'
                  ? 'bg-[#0A3D62] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Solo datos</span>
            </button>

            {proposal && (
              <button
                onClick={() => setLayoutMode('editor')}
                className={`px-3 py-2 font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  layoutMode === 'editor'
                    ? 'bg-[#0A3D62] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Solo documento</span>
              </button>
            )}
          </div>
        </div>

        {/* Workspace Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch min-w-0 flex-1 min-h-0 overflow-hidden max-md:overflow-x-hidden max-md:overflow-y-visible">
          
          {/* LEFT COLUMN: Input Panels */}
          {(layoutMode === 'split' || layoutMode === 'inputs') && (
            <div className={`${
              layoutMode === 'inputs'
                ? 'lg:col-span-12 max-w-4xl mx-auto w-full'
                : 'lg:col-span-5 xl:col-span-5 2xl:col-span-4'
            } @container space-y-3 min-w-0 max-w-full h-full overflow-x-hidden overflow-y-auto max-md:max-h-none max-md:overflow-x-hidden overscroll-contain pr-1`}>
              
              {/* Input Navigation Tabs to Prevent Endlessly Scrolling Down */}
              <div className="relative sticky top-14 sm:top-16 lg:top-0 z-20 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-sm sticky-bar text-xs">
                <p className="px-1.5 pb-1.5 text-[11px] text-slate-500">
                  Completa los pasos de izquierda a derecha. En Notas puedes subir un Word, TXT o Markdown.
                </p>
                <div className="grid grid-cols-4 gap-1 w-full min-w-0">
                  <button
                    type="button"
                    onClick={() => setInputTab('metadatos')}
                    title="Datos del documento"
                    className={`min-w-0 py-2 px-1 font-semibold rounded-xl transition-all inline-flex flex-col items-center justify-center gap-0.5 ${
                      inputTab === 'metadatos'
                        ? 'bg-[#0A3D62] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                      {hasDatos && <Check className="w-3 h-3 text-[#2ECC71]" />}
                    </span>
                    <span className="truncate w-full text-center text-[10px] sm:text-xs">1. Datos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab('requerimientos')}
                    title="Notas y requerimientos"
                    className={`min-w-0 py-2 px-1 font-semibold rounded-xl transition-all inline-flex flex-col items-center justify-center gap-0.5 ${
                      inputTab === 'requerimientos'
                        ? 'bg-[#0A3D62] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <NotebookPen className="w-3.5 h-3.5 shrink-0" />
                      {hasNotas && <Check className="w-3 h-3 text-[#2ECC71]" />}
                    </span>
                    <span className="truncate w-full text-center text-[10px] sm:text-xs">2. Notas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab('imagenes')}
                    title="Imágenes del documento"
                    className={`min-w-0 py-2 px-1 font-semibold rounded-xl transition-all inline-flex flex-col items-center justify-center gap-0.5 ${
                      inputTab === 'imagenes'
                        ? 'bg-[#0A3D62] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate w-full text-center text-[10px] sm:text-xs">
                      3. Imágenes{images.length > 0 ? ` (${images.length})` : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab('all')}
                    title="Ver todos los paneles"
                    className={`min-w-0 py-2 px-1 font-semibold rounded-xl transition-all inline-flex flex-col items-center justify-center gap-0.5 ${
                      inputTab === 'all' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate w-full text-center text-[10px] sm:text-xs">Todo</span>
                  </button>
                </div>
              </div>

              {/* Panel 1: Metadata */}
              {(inputTab === 'metadatos' || inputTab === 'all') && (
                <MetadataForm
                  metadata={metadata}
                  onChange={setMetadata}
                />
              )}

              {/* Panel 2: Requirements Text with 4 Structured Sections & Inline Image Tools */}
              {(inputTab === 'requerimientos' || inputTab === 'all') && (
                <RequirementsInput
                  value={rawRequirements}
                  onChange={setRawRequirements}
                  images={images}
                  onImagesChange={setImages}
                  metadata={metadata}
                />
              )}

              {/* Panel 3: Multimodal Images */}
              {(inputTab === 'imagenes' || inputTab === 'all') && (
                <ImageUploader
                  images={images}
                  onChange={setImages}
                />
              )}

              {/* Panel 4: Actions (Manual First + AI Assist) */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-sm space-y-2.5 min-w-0 max-w-full overflow-x-hidden">
                <div className="min-w-0 mb-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Crear documento
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Con las notas listas, genera un borrador o escribe tú el contenido.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await handleGenerateProposal();
                    if (layoutMode === 'inputs') setLayoutMode('split');
                  }}
                  disabled={isGenerating}
                  className="w-full py-3 px-3 rounded-xl font-bold text-sm text-white bg-[#0A3D62] hover:bg-[#1E5F8A] active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 border border-blue-400/30 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#2ECC71] shrink-0" />
                      <span>Generando borrador...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#2ECC71] shrink-0" />
                      <span className="text-center leading-tight">Generar con IA</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleStartManualDraft();
                    if (layoutMode === 'inputs') setLayoutMode('split');
                  }}
                  disabled={isGenerating}
                  className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs text-[#0A3D62] bg-white hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-slate-300 disabled:opacity-50"
                >
                  <PenLine className="w-4 h-4 shrink-0" />
                  <span className="text-center leading-tight">Escribir a mano</span>
                </button>

                {isGenerating && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center space-y-1 toast-in">
                    <div className="flex items-start justify-center gap-2 text-xs font-semibold text-[#0A3D62]">
                      <Cpu className="w-4 h-4 text-[#2ECC71] animate-pulse shrink-0 mt-0.5" />
                      <span className="min-w-0 break-words">{generationStep}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Esto puede tardar unos segundos. No cierres la ventana.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* RIGHT COLUMN: Proposal Output / Editor */}
          {(layoutMode === 'split' || layoutMode === 'editor') && (
            <div className={`${
              layoutMode === 'editor'
                ? 'lg:col-span-12 max-w-6xl mx-auto w-full'
                : 'lg:col-span-7 xl:col-span-7 2xl:col-span-8'
            } min-w-0 max-w-full h-full overflow-x-hidden overflow-y-auto max-md:overflow-x-hidden`}>
              {proposal ? (
                <ProposalEditor
                  proposal={proposal}
                  metadata={brandedMetadata}
                  images={images}
                  rawRequirements={rawRequirements}
                  onChange={setProposal}
                  onSave={handleSaveChanges}
                  onSaveNewVersion={handleSaveNewVersion}
                  currentVersion={currentVersion}
                  lastSavedTime={lastSavedTime}
                  showSavedToast={showSavedToast}
                  initialTab={editorTab}
                />
              ) : (
                /* Initial State Placeholder */
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-dashed border-slate-300/80 p-6 sm:p-10 text-center min-h-[420px] lg:min-h-full flex flex-col items-center justify-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-[#0A3D62]/6 border border-[#0A3D62]/10 flex items-center justify-center text-[#0A3D62]">
                    <FileText className="w-8 h-8 text-[#0A3D62]" />
                  </div>

                <div className="max-w-md space-y-2">
                  <h3 className="text-lg font-bold text-[#0A3D62]">
                    Tu documento o diapositivas aparecerán aquí
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Completa los datos y las notas a la izquierda. Luego genera un borrador con IA, o escríbelo tú.
                  </p>
                </div>

                <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-3 gap-2 text-left text-[11px] text-slate-500">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-lg bg-[#0A3D62] text-white text-xs font-bold inline-flex items-center justify-center mb-1.5">1</span>
                    <span className="block font-bold text-slate-800">Datos</span>
                    <span>Cliente, ticket y nombre del proyecto.</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-lg bg-[#0A3D62] text-white text-xs font-bold inline-flex items-center justify-center mb-1.5">2</span>
                    <span className="block font-bold text-slate-800">Notas</span>
                    <span>Qué pide el cliente y cómo funciona hoy.</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-lg bg-[#2ECC71] text-slate-950 text-xs font-bold inline-flex items-center justify-center mb-1.5">3</span>
                    <span className="block font-bold text-slate-800">Generar</span>
                    <span>Documento Word, PDF y Diapositivas PPTX.</span>
                  </div>
                </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={handleStartManualDraft}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-xl shadow transition-all"
                    >
                      <PenLine className="w-4 h-4 mr-1.5" />
                      <span>Empezar a escribir</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditorTab('slides');
                        const initialDeck = createDefaultSlideDeck(metadata, images);
                        setProposal({
                          ...EMPTY_MANUAL_PROPOSAL,
                          slideDeck: initialDeck,
                        });
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-slate-950 bg-[#2ECC71] hover:bg-[#27ae60] rounded-xl shadow transition-all"
                    >
                      <Presentation className="w-4 h-4 mr-1.5" />
                      <span>Crear Diapositivas</span>
                    </button>

                    <button
                      onClick={handleLoadPreset}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-[#0A3D62] bg-white hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5 text-emerald-600" />
                      <span>Probar ejemplo</span>
                    </button>
                  </div>
              </div>
            )}
          </div>
        )}

        </div>

      </main>

      {/* History Drawer Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        proposals={history}
        onSelectProposal={(saved) => {
          setMetadata(stripDocumentLogo(saved.metadata));
          setRawRequirements(saved.rawRequirements || '');
          setImages(saved.images || []);
          setProposal(saved.content);
          setCurrentVersion(saved.version || 'v1.0');
          setCurrentVersionNote(saved.versionNote || '');
        }}
        onDeleteProposal={(id) => {
          const updated = history.filter(h => h.id !== id);
          setHistory(updated);
          localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
        }}
        onDuplicateProposal={handleDuplicateProposal}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        branding={branding}
        onChange={handleBrandingChange}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Confirmation Modal for Reset/Clear */}
      <ConfirmModal
        isOpen={isConfirmResetOpen}
        title="¿Empezar de cero?"
        message="Se vaciarán los datos, las notas, las imágenes y el documento actual. El logo de Ajustes se mantiene."
        confirmText="Sí, vaciar"
        cancelText="Cancelar"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsConfirmResetOpen(false)}
      />

    </div>
  );
}
