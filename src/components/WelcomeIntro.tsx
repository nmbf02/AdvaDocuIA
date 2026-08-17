import React from 'react';
import { SavedProposal, MetadataHeader } from '../types';
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
  Plus,
  Play,
  RotateCcw,
  Sun,
  Moon
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
  onContinueDraft: () => void;
  onLoadHistoryItem: (item: SavedProposal) => void;
  onLoadPreset: () => void;
  onOpenHistoryModal: () => void;
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
  onContinueDraft,
  onLoadHistoryItem,
  onLoadPreset,
  onOpenHistoryModal,
}) => {
  const recentHistory = history.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-900/95 flex flex-col justify-between relative overflow-hidden text-slate-100">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#021024] via-[#0A3D62]/40 to-[#02182B] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#1E5F8A]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Simple Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center">
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt="Logo"
                className="h-9 w-auto max-w-[150px] object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 font-black tracking-wider text-white text-base">
                <div className="p-1.5 rounded-lg bg-white/10 border border-white/15">
                  <FileText className="w-5 h-5 text-[#2ECC71]" />
                </div>
                <span>ADVANSYS</span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide uppercase">
              Generador de Documentos & Diapositivas
            </h2>
            <p className="text-[11px] text-blue-200/80">
              Propuestas Técnicas, Presentaciones PPTX y Análisis Operativo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-blue-100 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-blue-100 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ver Ejemplo Demo</span>
          </button>
        </div>
      </header>

      {/* Main Center Stage */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col justify-center">
        {/* Welcome Question & Subtitle */}
        <div className="text-center mb-6 sm:mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#2ECC71]" />
            <span>Workspace Inteligente de Documentación & Presentaciones</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            ¿Qué vamos a hacer hoy?
          </h1>
          <p className="text-slate-300 text-xs sm:text-base max-w-xl mx-auto font-medium">
            Elige el tipo de trabajo que deseas realizar con asistencia inteligente y exportaciones profesionales directas.
          </p>
        </div>

        {/* Three Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          
          {/* CARD 1: Crear Propuesta Técnica (Word / PDF) */}
          <div className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-400/60 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0A3D62] text-[#2ECC71] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-blue-400/20">
                <FilePlus2 className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-black text-[#2ECC71] uppercase tracking-wider block mb-1">
                  DOCUMENTO FORMAL
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 flex items-center gap-2">
                  Propuesta Técnica
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Inicia un nuevo análisis técnico y funcional. Ingresa requerimientos, cliente y genera las 8 secciones estándar con IA.
                </p>
              </div>

              <ul className="space-y-1.5 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Estructura formal de 8 secciones</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Generación con IA o redacción manual</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Descarga en Word (.docx) y PDF</span>
                </li>
              </ul>
            </div>

            <div className="pt-5 mt-3">
              <button
                type="button"
                onClick={onStartNew}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer group/btn"
              >
                <span>Nueva Propuesta</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* CARD 2: Crear Presentación de Diapositivas (PowerPoint / PDF) */}
          <div className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-400/60 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-emerald-500/30">
                <Layers className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block mb-1">
                  PRESENTACIÓN EJECUTIVA
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 flex items-center gap-2">
                  Diapositivas PPTX
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Crea presentaciones ejecutivas para clientes con diapositivas de arquitectura, flujo en pasos y notas de orador.
                </p>
              </div>

              <ul className="space-y-1.5 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Plantillas 16:9 con branding Advansys</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Visor interactivo y modo pantalla completa</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Descarga en Microsoft PowerPoint (.pptx)</span>
                </li>
              </ul>
            </div>

            <div className="pt-5 mt-3">
              <button
                type="button"
                onClick={onStartSlides}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer group/btn"
              >
                <span>Crear Diapositivas</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* CARD 3: Continuar editando / Historial */}
          <div className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 shadow-xl hover:shadow-2xl backdrop-blur-sm">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-blue-300 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-slate-700">
                <FolderOpen className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  HISTORIAL & BORRADORES
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 flex items-center gap-2">
                  Continuar Editando
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Retoma el trabajo que tenías en progreso o selecciona una versión anterior guardada en tu historial.
                </p>
              </div>

              {/* Status / Preview of current draft */}
              {hasActiveDraft ? (
                <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Borrador en curso
                    </span>
                    {draftInfo?.version && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[9px] font-bold border border-blue-500/30">
                        {draftInfo.version}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate">
                      {draftInfo?.nombreProyecto || 'Propuesta en desarrollo'}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
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
                      className="w-full text-left bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-slate-600 rounded-lg p-2 flex items-center justify-between text-xs transition-colors group/item cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-200 truncate group-hover/item:text-white text-[11px]">
                          {item.metadata.nombreProyecto || 'Propuesta sin nombre'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.metadata.cliente || 'Cliente'} • {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-emerald-400 shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 text-center text-xs text-slate-400">
                  No hay borradores previos almacenados en este navegador.
                </div>
              )}
            </div>

            <div className="pt-5 mt-3 space-y-2">
              {hasActiveDraft && (
                <button
                  type="button"
                  onClick={onContinueDraft}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Continuar Borrador Activo</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenHistoryModal}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Ver Todo el Historial ({history.length})</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 text-center text-[11px] text-slate-500 border-t border-slate-800">
        <span>Advansys SRL • Sistema de Propuestas Técnicas y Presentaciones Ejecutivas</span>
      </footer>
    </div>
  );
};

