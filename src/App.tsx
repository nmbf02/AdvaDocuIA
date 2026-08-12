import React, { useState, useEffect } from 'react';
import { MetadataHeader, UploadedImage, ProposalSection, SavedProposal } from './types';
import { Header } from './components/Header';
import { MetadataForm } from './components/MetadataForm';
import { RequirementsInput } from './components/RequirementsInput';
import { ImageUploader } from './components/ImageUploader';
import { ProposalEditor } from './components/ProposalEditor';
import { HistoryModal } from './components/HistoryModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ADVANSYS_SAMPLE_METADATA, ADVANSYS_SAMPLE_REQUIREMENTS, ADVANSYS_SAMPLE_IMAGES, EMPTY_MANUAL_PROPOSAL } from './data/presets';
import { Sparkles, Loader2, FileText, CheckCircle2, AlertCircle, Cpu, ArrowRight, Edit3, Wand2, PlusCircle } from 'lucide-react';

const STORAGE_KEY_HISTORY = 'advansys_docgen_history_v1';
const STORAGE_KEY_DRAFT = 'advansys_docgen_current_draft_v1';

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

  // Confirm Reset Modal State
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState<boolean>(false);

  // Layout Mode & Tab State
  const [layoutMode, setLayoutMode] = useState<'split' | 'inputs' | 'editor'>('split');
  const [inputTab, setInputTab] = useState<'metadatos' | 'requerimientos' | 'imagenes' | 'all'>('requerimientos');

  // Load History and Draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }

      const savedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.metadata) setMetadata(parsed.metadata);
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
    } catch (e) {
      console.error("Failed to load initial storage:", e);
    }
  }, []);

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
    setMetadata(newEntry.metadata);
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
    setGenerationStep("Iniciando análisis arquitectónico de Advansys con Gemini 1.5 Pro / Flash...");

    try {
      setGenerationStep("Procesando metadatos e imágenes para estructurar el Análisis Operativo...");
      
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

      setGenerationStep("Sintetizando secciones técnicas corporativas y validando referencias...");
      setProposal(data.proposal);
      saveToHistory(data.proposal);

    } catch (err: any) {
      console.error("Error generating proposal:", err);
      setError(err?.message || "Ocurrió un error inesperado al comunicarse con el servidor.");
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        onLoadPreset={handleLoadPreset}
        onReset={handleReset}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Banner Alert if Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-red-800">
              <strong className="font-bold text-red-900">Atención: </strong>
              {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Descartar
            </button>
          </div>
        )}

        {/* Workspace Mode Bar Switcher */}
        <div className="bg-white rounded-xl p-2.5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <span className="bg-blue-50 text-[#0A3D62] px-2.5 py-1 rounded-lg border border-blue-200">
              Modo de Trabajo:
            </span>
            <span className="text-slate-500 hidden sm:inline">Ajusta la vista para mayor comodidad de edición</span>
          </div>

          <div className="bg-slate-100 p-1 rounded-lg flex items-center space-x-1 border border-slate-200 text-xs">
            <button
              onClick={() => setLayoutMode('split')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-all flex items-center space-x-1 ${
                layoutMode === 'split'
                  ? 'bg-[#0A3D62] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>🌓 Vista Dividida</span>
            </button>

            <button
              onClick={() => setLayoutMode('inputs')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-all flex items-center space-x-1 ${
                layoutMode === 'inputs'
                  ? 'bg-[#0A3D62] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>📋 Formulario Completo</span>
            </button>

            {proposal && (
              <button
                onClick={() => setLayoutMode('editor')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-all flex items-center space-x-1 ${
                  layoutMode === 'editor'
                    ? 'bg-[#0A3D62] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>📄 Editor / Vista Previa Expandida</span>
              </button>
            )}
          </div>
        </div>

        {/* Workspace Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0">
          
          {/* LEFT COLUMN: Input Panels */}
          {(layoutMode === 'split' || layoutMode === 'inputs') && (
            <div className={`${
              layoutMode === 'inputs'
                ? 'lg:col-span-12 max-w-4xl mx-auto w-full'
                : 'lg:col-span-5 xl:col-span-4 2xl:col-span-4'
            } space-y-4 min-w-0 max-h-[calc(100vh-140px)] overflow-y-auto pr-1`}>
              
              {/* Input Navigation Tabs to Prevent Endlessly Scrolling Down */}
              <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs overflow-x-auto">
                <div className="flex items-center space-x-1 w-full">
                  <button
                    type="button"
                    onClick={() => setInputTab('metadatos')}
                    className={`flex-1 min-w-[90px] py-1.5 px-2 font-bold rounded-lg transition-all text-center ${
                      inputTab === 'metadatos'
                        ? 'bg-[#0A3D62] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    📋 Metadatos
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab('requerimientos')}
                    className={`flex-1 min-w-[110px] py-1.5 px-2 font-bold rounded-lg transition-all text-center ${
                      inputTab === 'requerimientos'
                        ? 'bg-[#0A3D62] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    📝 Requerimientos
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab('imagenes')}
                    className={`flex-1 min-w-[90px] py-1.5 px-2 font-bold rounded-lg transition-all text-center ${
                      inputTab === 'imagenes'
                        ? 'bg-[#0A3D62] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🖼️ Adjuntos ({images.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab('all')}
                    className={`py-1.5 px-2 font-semibold rounded-lg transition-all text-slate-500 hover:bg-slate-100 ${
                      inputTab === 'all' ? 'bg-slate-200 text-slate-900 font-bold' : ''
                    }`}
                    title="Ver todos los paneles desplegados"
                  >
                    👁️ Ver Todo
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
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Acciones de Documentación
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                    Manual + IA
                  </span>
                </div>

                {/* Primary Action: Start Manual Creation */}
                <button
                  type="button"
                  onClick={() => {
                    handleStartManualDraft();
                    if (layoutMode === 'inputs') setLayoutMode('split');
                  }}
                  disabled={isGenerating}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-slate-900 bg-[#2ECC71] hover:bg-[#27ae60] active:scale-[0.99] transition-all shadow-md flex items-center justify-center space-x-2 border border-emerald-400 disabled:opacity-50"
                >
                  <Edit3 className="w-4 h-4 text-slate-950" />
                  <span>✍️ Redactar Documento Manualmente</span>
                </button>

                {/* Secondary Action: Full AI Generation */}
                <button
                  type="button"
                  onClick={async () => {
                    await handleGenerateProposal();
                    if (layoutMode === 'inputs') setLayoutMode('split');
                  }}
                  disabled={isGenerating}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-[#0A3D62] hover:bg-[#1E5F8A] active:scale-[0.99] transition-all shadow-md flex items-center justify-center space-x-2 border border-blue-400/30 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#2ECC71]" />
                      <span>Generando con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#2ECC71]" />
                      <span>Generar Borrador Completo con IA</span>
                    </>
                  )}
                </button>

                {isGenerating && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center space-y-1">
                    <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-[#0A3D62]">
                      <Cpu className="w-4 h-4 text-[#2ECC71] animate-pulse" />
                      <span>{generationStep}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Sintetizando estructura corporativa Advansys conforme al manual técnico...
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
                : 'lg:col-span-7 xl:col-span-8 2xl:col-span-8'
            } min-w-0`}>
              {proposal ? (
                <ProposalEditor
                  proposal={proposal}
                  metadata={metadata}
                  images={images}
                  rawRequirements={rawRequirements}
                  onChange={setProposal}
                  onSave={handleSaveChanges}
                  onSaveNewVersion={handleSaveNewVersion}
                  currentVersion={currentVersion}
                  lastSavedTime={lastSavedTime}
                  showSavedToast={showSavedToast}
                />
              ) : (
                /* Initial State Placeholder */
                <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-8 sm:p-12 text-center min-h-[500px] flex flex-col items-center justify-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A3D62] shadow-inner">
                    <FileText className="w-8 h-8 text-[#0A3D62]" />
                  </div>

                <div className="max-w-md space-y-3">
                  <h3 className="text-lg font-bold text-[#0A3D62]">
                    Generador & Editor de Propuestas Advansys
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Puedes redactar la propuesta <strong>100% manualmente</strong> usando nuestro editor estructurado o usar la <strong>IA de Gemini</strong> para generar borradores y perfeccionar secciones.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={handleStartManualDraft}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-slate-950 bg-[#2ECC71] hover:bg-[#27ae60] rounded-xl shadow transition-all border border-emerald-400"
                    >
                      <Edit3 className="w-4 h-4 mr-1.5" />
                      <span>Iniciar Redacción Manual</span>
                    </button>

                    <button
                      onClick={handleLoadPreset}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5 text-emerald-600" />
                      <span>Cargar Ejemplo Advansys</span>
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 w-full max-w-lg grid grid-cols-3 gap-2 text-[11px] text-slate-500 font-medium">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                    <span className="block font-bold text-slate-800">1. Redacción Manual</span>
                    <span>Control total del analista</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                    <span className="block font-bold text-slate-800">2. Potenciado por IA</span>
                    <span>Polido y corrección activa</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                    <span className="block font-bold text-slate-800">3. Formato Word</span>
                    <span>Exportación .docx 1:1</span>
                  </div>
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
          setMetadata(saved.metadata);
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

      {/* Confirmation Modal for Reset/Clear */}
      <ConfirmModal
        isOpen={isConfirmResetOpen}
        title="¿Limpiar Formulario y Propuesta?"
        message="Esta acción restablecerá los metadatos, borrará el texto de requerimientos, eliminará las imágenes adjuntas y cerrará la propuesta actual. ¿Deseas continuar?"
        confirmText="Sí, Limpiar Formulario"
        cancelText="Cancelar"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsConfirmResetOpen(false)}
      />

    </div>
  );
}
