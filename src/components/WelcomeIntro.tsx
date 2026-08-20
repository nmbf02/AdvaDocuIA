import React from 'react';
import { SavedProposal } from '../types';
import { 
  Sparkles, 
  FilePlus2, 
  Clock, 
  FolderOpen, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  FileText, 
  ChevronRight,
  Play,
  Sun,
  Moon,
  Terminal,
  Code,
  Database
} from 'lucide-react';

interface WelcomeIntroProps {
  hasActiveDraft: boolean;
  draftInfo?: {
    nombreProyecto?: string;
    cliente?: string;
    moduloAplicacion?: string;
    version?: string;
    lastSavedTime?: string | null;
  };
  history: SavedProposal[];
  logoDataUrl?: string;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onStartNew: () => void;
  onStartSlides: () => void;
  onStartTechnicalDoc?: () => void;
  onContinueDraft: () => void;
  onLoadHistoryItem: (item: SavedProposal) => void;
  onLoadPreset: () => void;
  onOpenHistoryModal: () => void;
  onOpenBackup?: () => void;
}

export const WelcomeIntro: React.FC<WelcomeIntroProps> = ({
  hasActiveDraft,
  draftInfo,
  history,
  logoDataUrl,
  theme = 'light',
  onToggleTheme,
  onStartNew,
  onStartSlides,
  onStartTechnicalDoc,
  onContinueDraft,
  onLoadHistoryItem,
  onLoadPreset,
  onOpenHistoryModal,
  onOpenBackup,
}) => {
  const isDark = theme === 'dark';
  const recentHistory = history.slice(0, 3);

  return (
    <div className={`min-h-screen flex flex-col justify-between relative overflow-hidden transition-colors ${
      isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#f4f7fb] text-slate-800'
    }`}>
      {/* Background Ambience Elements */}
      <div className={`absolute inset-0 pointer-events-none ${
        isDark 
          ? 'bg-gradient-to-br from-[#021024] via-[#0A3D62]/40 to-[#02182B]' 
          : 'bg-gradient-to-br from-[#ffffff] via-[#f1f5f9] to-[#e8eef5]'
      }`} />
      <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
        isDark ? 'bg-[#1E5F8A]/30' : 'bg-[#0A3D62]/8'
      }`} />
      <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
        isDark ? 'bg-[#2ECC71]/15' : 'bg-[#2ECC71]/10'
      }`} />

      {/* Top Header Navbar with Dark Background */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2">
        <div className="bg-[#0A3D62] text-white rounded-2xl p-3.5 sm:px-6 sm:py-3.5 shadow-md border border-[#1E5F8A] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 flex items-center">
              {logoDataUrl ? (
                <img
                  src={logoDataUrl}
                  alt="Logo"
                  className="h-8 sm:h-9 w-auto max-w-[150px] object-contain"
                />
              ) : (
                <div className="flex items-center gap-2 font-black tracking-wider text-white text-base">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/15">
                    <FileText className="w-4 sm:w-5 h-4 sm:h-5 text-[#2ECC71]" />
                  </div>
                  <span className="tracking-wider">ADVANSYS</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-xs font-bold text-white tracking-wide uppercase truncate">
                Generador de Documentos & Diapositivas
              </h2>
              <p className="text-[10px] sm:text-[11px] text-blue-200/90 truncate">
                Propuesta comercial, spec interna Dev/QA o diapositivas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenBackup && (
              <button
                type="button"
                onClick={onOpenBackup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors shadow-sm cursor-pointer"
                title="Descargar o restaurar copia de seguridad"
              >
                <Database className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span className="hidden sm:inline">Copia de Seguridad</span>
              </button>
            )}

            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white border border-white/15 transition-colors shadow-sm cursor-pointer"
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-blue-200" />
                    <span className="hidden sm:inline">Modo Oscuro</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onLoadPreset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2ECC71]" />
              <span className="hidden sm:inline">Ver Ejemplo Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Center Stage */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col justify-center">
        {/* Welcome Question & Subtitle */}
        <div className="text-center mb-6 sm:mb-8 space-y-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold mb-1 shadow-sm ${
            isDark 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#2ECC71]" />
            <span>Workspace Inteligente de Documentación & Presentaciones</span>
          </div>
          <h1 className={`text-2xl sm:text-4xl md:text-5xl font-black tracking-tight ${
            isDark ? 'text-white' : 'text-[#0A3D62]'
          }`}>
            ¿Qué vamos a hacer hoy?
          </h1>
          <p className={`text-xs sm:text-base max-w-xl mx-auto font-medium ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Elige un tipo de documento. Cada uno tiene un flujo propio; no hace falta usar todos.
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6 items-stretch">
          
          {/* CARD 1: Crear Propuesta Técnica (Word / PDF) */}
          <div className={`group relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 backdrop-blur-sm border shadow-lg hover:shadow-xl ${
            isDark 
              ? 'bg-slate-800/90 border-slate-700 hover:border-blue-400/60' 
              : 'bg-white border-slate-200 hover:border-[#0A3D62]/50 hover:shadow-blue-500/10'
          }`}>
            <div className="space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border ${
                isDark 
                  ? 'bg-[#0A3D62] text-[#2ECC71] border-blue-400/20' 
                  : 'bg-blue-50 text-[#0A3D62] border-blue-200'
              }`}>
                <FilePlus2 className="w-6 h-6" />
              </div>

              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${
                  isDark ? 'text-[#2ECC71]' : 'text-[#0A3D62]'
                }`}>
                  DOCUMENTO FORMAL
                </span>
                <h3 className={`text-lg sm:text-xl font-bold mb-1.5 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Propuesta Técnica
                </h3>
                <p className={`text-xs leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Inicia la propuesta comercial: datos y notas a la izquierda, luego genera con IA o escribe. Cuando el borrador esté listo, abre la pestaña Doc. Técnica.
                </p>
              </div>

              <ul className={`space-y-1.5 pt-2 border-t text-xs ${
                isDark ? 'border-slate-700/60 text-slate-300' : 'border-slate-100 text-slate-700'
              }`}>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
                  <span>Datos y notas, luego Generar o escribir</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
                  <span>Pestaña Doc. Técnica cuando ya hay propuesta</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
                  <span>Descarga en Word y PDF</span>
                </li>
              </ul>
            </div>

            <div className="pt-5 mt-3">
              <button
                type="button"
                onClick={onStartNew}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer group/btn"
              >
                <span>Nueva Propuesta</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* CARD: Documentación Técnica Interna (workspace independiente) */}
          <div className={`group relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 backdrop-blur-sm border shadow-lg hover:shadow-xl ${
            isDark
              ? 'bg-slate-800/90 border-slate-700 hover:border-emerald-400/50'
              : 'bg-white border-slate-200 hover:border-[#2ECC71]/60 hover:shadow-emerald-500/10'
          }`}>
            <div className="space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border ${
                isDark
                  ? 'bg-emerald-950/80 text-[#2ECC71] border-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <Terminal className="w-6 h-6" />
              </div>

              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${
                  isDark ? 'text-[#2ECC71]' : 'text-emerald-700'
                }`}>
                  ESPECIFICACIÓN INTERNA
                </span>
                <h3 className={`text-lg sm:text-xl font-bold mb-1.5 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Doc. Técnica Interna
                </h3>
                <p className={`text-xs leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Spec para Dev/QA sin armar primero la propuesta comercial. Luego puedes atarla a una propuesta del historial.
                </p>
              </div>

              <ul className={`space-y-1.5 pt-2 border-t text-xs ${
                isDark ? 'border-slate-700/60 text-slate-300' : 'border-slate-100 text-slate-700'
              }`}>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
                  <span>Documento desacoplado de la propuesta</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
                  <span>Exportar Word, PDF y Markdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
                  <span>Atar a una propuesta cuando quieras</span>
                </li>
              </ul>
            </div>

            <div className="pt-5 mt-3">
              <button
                type="button"
                onClick={onStartTechnicalDoc}
                disabled={!onStartTechnicalDoc}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0A3D62] hover:bg-[#1E5F8A] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-900/20 hover:shadow-blue-900/30 transition-all cursor-pointer group/btn disabled:opacity-50"
              >
                <span>Nueva Doc. Técnica</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* CARD 2: Crear Presentación de Diapositivas (PowerPoint / PDF) */}
          <div className={`group relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 backdrop-blur-sm border shadow-lg hover:shadow-xl ${
            isDark 
              ? 'bg-slate-800/90 border-slate-700 hover:border-emerald-400/60' 
              : 'bg-white border-slate-200 hover:border-emerald-500/50 hover:shadow-emerald-500/10'
          }`}>
            <div className="space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border ${
                isDark 
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <Layers className="w-6 h-6" />
              </div>

              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}>
                  PRESENTACIÓN EJECUTIVA
                </span>
                <h3 className={`text-lg sm:text-xl font-bold mb-1.5 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Diapositivas PPTX
                </h3>
                <p className={`text-xs leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Crea presentaciones ejecutivas para clientes con diapositivas de arquitectura, flujo en pasos y notas de orador.
                </p>
              </div>

              <ul className={`space-y-1.5 pt-2 border-t text-xs ${
                isDark ? 'border-slate-700/60 text-slate-300' : 'border-slate-100 text-slate-700'
              }`}>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
                  <span>Plantillas 16:9 con branding Advansys</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
                  <span>Visor interactivo y modo pantalla completa</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
                  <span>Descarga en Microsoft PowerPoint (.pptx)</span>
                </li>
              </ul>
            </div>

            <div className="pt-5 mt-3">
              <button
                type="button"
                onClick={onStartSlides}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#0A3D62] to-[#1E5F8A] hover:from-[#082a44] hover:to-[#0A3D62] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer group/btn"
              >
                <span>Crear Diapositivas</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* CARD 3: Continuar editando / Historial */}
          <div className={`group relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 backdrop-blur-sm border shadow-lg hover:shadow-xl ${
            isDark 
              ? 'bg-slate-800/90 border-slate-700 hover:border-slate-500' 
              : 'bg-white border-slate-200 hover:border-slate-400'
          }`}>
            <div className="space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border ${
                isDark 
                  ? 'bg-slate-900 text-blue-300 border-slate-700' 
                  : 'bg-slate-100 text-[#0A3D62] border-slate-200'
              }`}>
                <FolderOpen className="w-6 h-6" />
              </div>

              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  HISTORIAL & BORRADORES
                </span>
                <h3 className={`text-lg sm:text-xl font-bold mb-1.5 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Continuar Editando
                </h3>
                <p className={`text-xs leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Retoma el borrador actual o abre un archivo del historial.
                </p>
              </div>

              {/* Status / Preview of current draft */}
              {hasActiveDraft ? (
                <div className={`border rounded-xl p-3 space-y-1.5 shadow-sm ${
                  isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#2ECC71]" />
                      Borrador en curso
                    </span>
                    {draftInfo?.version && (
                      <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border ${
                        isDark 
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                          : 'bg-blue-50 text-[#0A3D62] border-blue-200'
                      }`}>
                        {draftInfo.version}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold truncate ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {draftInfo?.nombreProyecto || 'Propuesta en desarrollo'}
                    </h4>
                    <p className={`text-[11px] truncate ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Cliente: {draftInfo?.cliente || 'Sin cliente'}
                    </p>
                  </div>
                </div>
              ) : recentHistory.length > 0 ? (
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {recentHistory.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onLoadHistoryItem(item)}
                      className={`w-full text-left border rounded-lg p-2 flex items-center justify-between text-xs transition-colors group/item cursor-pointer shadow-sm ${
                        isDark 
                          ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-700/60 hover:border-slate-600 text-slate-200' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className={`font-bold truncate text-[11px] ${
                          isDark ? 'group-hover/item:text-white' : 'group-hover/item:text-[#0A3D62]'
                        }`}>
                          {item.metadata.nombreProyecto || 'Propuesta sin nombre'}
                        </p>
                        <p className={`text-[10px] truncate ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {item.metadata.cliente || 'Cliente'} • {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-[#2ECC71] shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className={`border rounded-xl p-3 text-center text-xs ${
                  isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  No hay borradores previos almacenados en este navegador.
                </div>
              )}
            </div>

            <div className="pt-5 mt-3 space-y-2">
              {hasActiveDraft && (
                <button
                  type="button"
                  onClick={onContinueDraft}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm ${
                    isDark 
                      ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                      : 'bg-[#0A3D62] hover:bg-[#1E5F8A] text-white'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 text-[#2ECC71]" />
                  <span>Continuar Borrador Activo</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenHistoryModal}
                className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                  isDark 
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
                }`}
              >
                <span>Ver Todo el Historial ({history.length})</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer info */}
      <footer className={`relative z-10 w-full max-w-7xl mx-auto px-4 py-4 text-center text-[11px] border-t ${
        isDark ? 'text-slate-500 border-slate-800' : 'text-slate-500 border-slate-200'
      }`}>
        <span>Advansys SRL • Propuestas, documentación técnica interna y presentaciones ejecutivas</span>
      </footer>
    </div>
  );
};
