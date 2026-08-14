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
              Generador de Documentos
            </h2>
            <p className="text-[11px] text-blue-200/80">
              Propuestas Técnicas y Análisis Operativo
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
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        {/* Welcome Question & Subtitle */}
        <div className="text-center mb-8 sm:mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#2ECC71]" />
            <span>Workspace Inteligente de Documentación</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            ¿Qué vamos a hacer hoy?
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto font-medium">
            Elige si deseas comenzar una nueva propuesta técnica desde cero o continuar trabajando en un documento previo.
          </p>
        </div>

        {/* Two Big Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          
          {/* CARD 1: Crear uno nuevo */}
          <div className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-400/60 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0A3D62] text-[#2ECC71] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <FilePlus2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
                  Crear una Nueva Propuesta
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Inicia un nuevo análisis técnico y funcional. Podrás ingresar los datos del cliente, los requerimientos y generar la estructura completa con IA.
                </p>
              </div>

              <ul className="space-y-2 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Estructura formal de 8 secciones estándar</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Generación con IA o redacción manual asistida</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Exportación directa a Word (.docx) y PDF</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-4">
              <button
                type="button"
                onClick={onStartNew}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer group/btn"
              >
                <span>Empezar Documento Nuevo</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* CARD 2: Continuar editando uno que estábamos haciendo */}
          <div className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-400/60 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-emerald-500/20">
                <FolderOpen className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
                  Continuar Editando
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Retoma el trabajo que tenías en progreso o selecciona una versión anterior guardada en tu historial.
                </p>
              </div>

              {/* Status / Preview of current draft */}
              {hasActiveDraft ? (
                <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Borrador en curso
                    </span>
                    {draftInfo?.version && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold border border-blue-500/30">
                        {draftInfo.version}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate">
                      {draftInfo?.nombreProyecto || 'Propuesta en desarrollo (Sin título)'}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      Cliente: {draftInfo?.cliente || 'No especificado'} {draftInfo?.moduloAplicacion ? `• ${draftInfo.moduloAplicacion}` : ''}
                    </p>
                  </div>
                  {draftInfo?.lastSavedTime && (
                    <p className="text-[10px] text-slate-500">
                      Última modificación: hoy a las {draftInfo.lastSavedTime}
                    </p>
                  )}
                </div>
              ) : recentHistory.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Proyectos recientes en historial:
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {recentHistory.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onLoadHistoryItem(item)}
                        className="w-full text-left bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-slate-600 rounded-lg p-2 flex items-center justify-between text-xs transition-colors group/item"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-200 truncate group-hover/item:text-white">
                            {item.metadata.nombreProyecto || 'Propuesta sin nombre'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.metadata.cliente || 'Cliente'} • {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover/item:text-emerald-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400">
                  No hay borradores previos almacenados en este navegador.
                </div>
              )}
            </div>

            <div className="pt-6 mt-4 space-y-2">
              {hasActiveDraft ? (
                <button
                  type="button"
                  onClick={onContinueDraft}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#0A3D62] hover:bg-[#1E5F8A] text-white font-bold text-sm shadow-lg border border-blue-400/30 transition-all cursor-pointer group/btn"
                >
                  <span>Continuar con el Borrador Actual</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              ) : history.length > 0 ? (
                <button
                  type="button"
                  onClick={() => onLoadHistoryItem(history[0])}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#0A3D62] hover:bg-[#1E5F8A] text-white font-bold text-sm shadow-lg border border-blue-400/30 transition-all cursor-pointer group/btn"
                >
                  <span>Abrir Último Proyecto Guardado</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStartNew}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-all"
                >
                  <span>Iniciar Primer Proyecto</span>
                </button>
              )}

              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onOpenHistoryModal}
                  className="w-full text-center text-xs text-slate-400 hover:text-emerald-300 font-semibold py-1 transition-colors"
                >
                  Ver todos los proyectos guardados ({history.length})
                </button>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 text-center text-[11px] text-slate-500 border-t border-slate-800">
        <span>Advansys SRL • Sistema de Propuestas Técnicas y Análisis Operativo</span>
      </footer>
    </div>
  );
};
