import React, { useMemo } from 'react';
import { FreeNote, SavedProposal } from '../types';
import {
  inferredNoteTitle,
  dueReminderNotes,
} from '../utils/freeNotesStorage';
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
  Database,
  NotebookPen,
  BellRing,
  MessageCircle,
  Settings,
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
  onOpenSettings?: () => void;
  onOpenBackup?: () => void;
  freeNotes?: FreeNote[];
  onOpenFreeWrite?: (noteId?: string) => void;
  onOpenChat?: () => void;
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
  onOpenSettings,
  onOpenBackup,
  freeNotes = [],
  onOpenFreeWrite,
  onOpenChat,
}) => {
  const isDark = theme === 'dark';
  const recentHistory = history.slice(0, 4);
  const dueNotes = useMemo(() => dueReminderNotes(freeNotes), [freeNotes]);

  const card = isDark
    ? 'bg-slate-800/90 border-slate-700 hover:border-[#2ECC71]/50'
    : 'bg-white border-slate-200 hover:border-[#0A3D62]/35 hover:shadow-lg';

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-hidden ${
        isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#f4f7fb] text-slate-800'
      }`}
    >
      <div
        className={`absolute inset-0 pointer-events-none ${
          isDark
            ? 'bg-gradient-to-br from-[#021024] via-[#0A3D62]/35 to-[#02182B]'
            : 'bg-gradient-to-br from-white via-[#f1f5f9] to-[#e4edf5]'
        }`}
      />
      <div className={`absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-[#1E5F8A]/25' : 'bg-[#0A3D62]/8'}`} />
      <div className={`absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-[#2ECC71]/12' : 'bg-[#2ECC71]/12'}`} />

      <header className="relative z-10 px-4 sm:px-6 lg:px-8 pt-5">
        <div className="max-w-6xl mx-auto bg-[#0A3D62] text-white rounded-2xl px-4 sm:px-5 h-14 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="Logo" className="h-7 w-auto max-w-[130px] object-contain" />
            ) : (
              <span className="flex items-center gap-1.5 font-black text-sm tracking-wider">
                <FileText className="w-4 h-4 text-[#2ECC71]" />
                <span className="hidden sm:inline">ADVANSYS</span>
              </span>
            )}
          </div>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {onOpenChat && (
              <button type="button" onClick={onOpenChat} className="h-9 px-2.5 rounded-lg text-xs font-semibold text-white/90 hover:bg-white/10 cursor-pointer inline-flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
              </button>
            )}
            {onOpenFreeWrite && (
              <button type="button" onClick={() => onOpenFreeWrite()} className="h-9 px-2.5 rounded-lg text-xs font-semibold text-white/90 hover:bg-white/10 cursor-pointer inline-flex items-center gap-1.5">
                <NotebookPen className="w-4 h-4" />
                <span className="hidden sm:inline">Notas</span>
              </button>
            )}
            <span className="hidden sm:block w-px h-5 bg-white/20 mx-1" />
            {onOpenSettings && (
              <button type="button" onClick={onOpenSettings} className="h-9 px-2.5 rounded-lg text-xs font-semibold text-white/90 hover:bg-white/10 cursor-pointer inline-flex items-center gap-1.5">
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Ajustes</span>
              </button>
            )}
            {onOpenBackup && (
              <button type="button" onClick={onOpenBackup} className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-white/90 hover:bg-white/10 cursor-pointer" title="Copias">
                <Database className="w-4 h-4" />
              </button>
            )}
            {onToggleTheme && (
              <button type="button" onClick={onToggleTheme} className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-white/90 hover:bg-white/10 cursor-pointer" title={isDark ? 'Modo claro' : 'Modo oscuro'}>
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button type="button" onClick={onLoadPreset} className="h-9 px-2.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 cursor-pointer hidden sm:inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Demo
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
        <div className="text-center mb-8 sm:mb-10 space-y-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold shadow-sm ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#2ECC71]" />
            Workspace de documentación Advansys
          </div>
          <h1 className={`text-3xl sm:text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0A3D62]'}`}>
            ¿Qué vamos a hacer hoy?
          </h1>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Prepara propuestas comerciales, especificaciones internas o presentaciones. También puedes chatear con la IA o escribir notas.
          </p>
        </div>

        {dueNotes.length > 0 && (
          <div className={`mb-6 rounded-2xl border px-4 py-3 flex flex-wrap items-center gap-2 ${isDark ? 'bg-rose-950/40 border-rose-500/30' : 'bg-rose-50 border-rose-200'}`}>
            <BellRing className="w-4 h-4 text-rose-500 shrink-0" />
            <p className={`text-xs font-bold ${isDark ? 'text-rose-100' : 'text-rose-800'}`}>
              {dueNotes.length === 1 ? 'Tienes un recordatorio ahora' : `Tienes ${dueNotes.length} recordatorios ahora`}
            </p>
            {dueNotes.slice(0, 4).map((note) => (
              <button key={note.id} type="button" onClick={() => onOpenFreeWrite?.(note.id)} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-rose-200 text-rose-800 cursor-pointer">
                {inferredNoteTitle(note)}
              </button>
            ))}
          </div>
        )}

        {hasActiveDraft && (
          <button
            type="button"
            onClick={onContinueDraft}
            className={`w-full mb-7 rounded-2xl border px-5 py-4 flex items-center gap-4 text-left cursor-pointer shadow-sm ${
              isDark ? 'bg-[#0A3D62]/80 border-[#1E5F8A] hover:border-[#2ECC71]/50' : 'bg-white border-[#0A3D62]/20 hover:border-[#0A3D62]/50'
            }`}
          >
            <div className="h-12 w-12 rounded-2xl bg-[#2ECC71] text-slate-950 flex items-center justify-center shrink-0">
              <Play className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#2ECC71] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Borrador en curso — continúa donde lo dejaste
              </p>
              <p className={`text-lg font-black truncate ${isDark ? 'text-white' : 'text-[#0A3D62]'}`}>
                {draftInfo?.nombreProyecto || 'Documento en desarrollo'}
              </p>
              <p className={`text-xs truncate ${isDark ? 'text-blue-200' : 'text-slate-500'}`}>
                Cliente: {draftInfo?.cliente || 'Sin cliente'}
                {draftInfo?.moduloAplicacion ? ` · ${draftInfo.moduloAplicacion}` : ''}
                {draftInfo?.version ? ` · ${draftInfo.version}` : ''}
                {draftInfo?.lastSavedTime ? ` · guardado ${draftInfo.lastSavedTime}` : ''}
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-[#2ECC71]">
              Abrir
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className={`rounded-2xl border p-6 flex flex-col shadow-md ${card}`}>
            <div className="h-14 w-14 rounded-2xl bg-[#2ECC71] text-slate-950 flex items-center justify-center mb-4 shadow-sm">
              <FilePlus2 className="w-7 h-7" />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? 'text-[#2ECC71]' : 'text-[#0A3D62]'}`}>Documento comercial</p>
            <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Propuesta técnica</h3>
            <p className={`text-sm leading-relaxed mb-4 flex-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Armas el documento para el cliente: datos, notas, generación con IA y descarga en Word o PDF. Luego puedes pasar a la spec interna.
            </p>
            <ul className={`space-y-1.5 text-xs mb-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" /> Ocho secciones y página comercial</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" /> Imágenes, tablas y calibración de tono</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" /> Exportación Word y PDF</li>
            </ul>
            <button type="button" onClick={onStartNew} className="w-full py-3 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-slate-950 font-bold text-sm cursor-pointer inline-flex items-center justify-center gap-2">
              Nueva propuesta
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className={`rounded-2xl border p-6 flex flex-col shadow-md ${card}`}>
            <div className="h-14 w-14 rounded-2xl bg-[#0A3D62] text-[#2ECC71] flex items-center justify-center mb-4 shadow-sm">
              <Terminal className="w-7 h-7" />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? 'text-[#2ECC71]' : 'text-emerald-700'}`}>Especificación interna</p>
            <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Doc. técnica</h3>
            <p className={`text-sm leading-relaxed mb-4 flex-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Spec para desarrollo y QA: rutas, flujo, diseño, consideraciones y código. Puede nacer sola o atarse después a una propuesta.
            </p>
            <ul className={`space-y-1.5 text-xs mb-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" /> Cinco bloques técnicos</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" /> Word, PDF y Markdown</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" /> Vínculo opcional a una propuesta</li>
            </ul>
            <button type="button" onClick={onStartTechnicalDoc} disabled={!onStartTechnicalDoc} className="w-full py-3 rounded-xl bg-[#0A3D62] hover:bg-[#1E5F8A] text-white font-bold text-sm cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50">
              Nueva doc. técnica
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className={`rounded-2xl border p-6 flex flex-col shadow-md ${card}`}>
            <div className="h-14 w-14 rounded-2xl bg-[#1E5F8A] text-white flex items-center justify-center mb-4 shadow-sm">
              <Layers className="w-7 h-7" />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? 'text-emerald-300' : 'text-[#1E5F8A]'}`}>Presentación ejecutiva</p>
            <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Diapositivas</h3>
            <p className={`text-sm leading-relaxed mb-4 flex-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Deck 16:9 para clientes: arquitectura, flujo y notas de orador, con branding Advansys y descarga PowerPoint.
            </p>
            <ul className={`space-y-1.5 text-xs mb-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" /> Plantillas institucionales</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" /> Visor y pantalla completa</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" /> Exportación PPTX</li>
            </ul>
            <button type="button" onClick={onStartSlides} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0A3D62] to-[#1E5F8A] text-white font-bold text-sm cursor-pointer inline-flex items-center justify-center gap-2">
              Crear diapositivas
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {onOpenChat && (
            <div className={`rounded-2xl border p-5 flex gap-4 shadow-md ${card}`}>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#0A3D62] dark:text-[#2ECC71] flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-800">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${isDark ? 'text-[#2ECC71]' : 'text-emerald-700'}`}>Conversación</p>
                <h3 className={`text-lg font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Chat con IA</h3>
                <p className={`text-sm mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Habla como en ChatGPT, Claude o Gemini. El motor es el de Ajustes. Puedes aplicar el rol del agente o dejarlo libre.
                </p>
                <button type="button" onClick={onOpenChat} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0A3D62] dark:text-[#2ECC71] cursor-pointer">
                  Abrir chat <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {onOpenFreeWrite && (
            <div className={`rounded-2xl border p-5 flex gap-4 shadow-md ${card}`}>
              <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0A3D62] dark:text-blue-200 flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-800">
                <NotebookPen className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${isDark ? 'text-blue-300' : 'text-[#1E5F8A]'}`}>Captura rápida</p>
                <h3 className={`text-lg font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Notas</h3>
                <p className={`text-sm mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Escritura libre, historial de notas y recordatorios. Sirve para ideas antes de armar el documento formal.
                </p>
                <button type="button" onClick={() => onOpenFreeWrite()} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0A3D62] dark:text-[#2ECC71] cursor-pointer">
                  Abrir notas <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`rounded-2xl border p-5 sm:p-6 shadow-md ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-[#0A3D62]'}`}>Continuar desde el historial</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Últimos documentos de este navegador</p>
            </div>
            <button type="button" onClick={onOpenHistoryModal} className={`text-xs font-bold cursor-pointer ${isDark ? 'text-[#2ECC71]' : 'text-[#1E5F8A]'}`}>
              Ver todo ({history.length})
            </button>
          </div>
          {recentHistory.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onLoadHistoryItem(item)}
                  className={`rounded-xl border p-3.5 text-left cursor-pointer flex items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-900/50 border-slate-700 hover:border-[#2ECC71]/40' : 'bg-slate-50 border-slate-200 hover:border-[#0A3D62]/30'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.metadata.nombreProyecto || 'Sin nombre'}
                    </p>
                    <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.metadata.cliente || 'Cliente'} · {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className={`rounded-xl border border-dashed p-6 text-center ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">Aún no hay documentos guardados</p>
              <p className="text-xs mt-1">Cuando crees una propuesta o spec, aparecerán aquí.</p>
            </div>
          )}
        </div>
      </main>

      <footer className={`relative z-10 w-full max-w-6xl mx-auto px-4 py-5 text-center text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
        Advansys SRL · Propuestas, documentación técnica interna y presentaciones ejecutivas
      </footer>
    </div>
  );
};
