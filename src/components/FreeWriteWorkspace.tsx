import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FreeNote } from '../types';
import {
  createEmptyFreeNote,
  formatRelativeTime,
  inferredNoteTitle,
  notePreview,
  noteWordCount,
  sortFreeNotes,
  getReminderState,
  toLocalDateTimeInput,
  fromLocalDateTimeInput,
  formatReminderWhen,
  REMINDER_PRESETS,
  reminderPresetDate,
  dueReminderNotes,
  stripNoteMarkup,
  requestReminderNotifications,
} from '../utils/freeNotesStorage';
import { NoteBodyEditor } from './NoteBodyEditor';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Check,
  Clock,
  Home,
  Sun,
  Moon,
  Bell,
  BellOff,
  BellRing,
  FileText,
  X,
} from 'lucide-react';

interface FreeWriteWorkspaceProps {
  notes: FreeNote[];
  activeNoteId: string | null;
  onChangeNotes: (notes: FreeNote[]) => void;
  onChangeActiveNoteId: (id: string | null) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onGoHome?: () => void;
  logoDataUrl?: string;
}

export const FreeWriteWorkspace: React.FC<FreeWriteWorkspaceProps> = ({
  notes,
  activeNoteId,
  onChangeNotes,
  onChangeActiveNoteId,
  theme = 'light',
  onToggleTheme,
  onGoHome,
  logoDataUrl,
}) => {
  const [query, setQuery] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const savedTimer = useRef<number | null>(null);
  const isDark = theme === 'dark';

  const ordered = useMemo(() => sortFreeNotes(notes), [notes]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter(
      (note) =>
        note.title.toLowerCase().includes(q) ||
        stripNoteMarkup(note.body).toLowerCase().includes(q)
    );
  }, [ordered, query]);

  const activeNote = notes.find((note) => note.id === activeNoteId) || null;

  useEffect(() => {
    if (activeNoteId && notes.some((note) => note.id === activeNoteId)) return;
    if (ordered.length > 0) {
      onChangeActiveNoteId(ordered[0].id);
      return;
    }
    const note = createEmptyFreeNote();
    onChangeNotes([note]);
    onChangeActiveNoteId(note.id);
  }, [activeNoteId, notes, ordered, onChangeActiveNoteId, onChangeNotes]);

  const flashSaved = () => {
    setSavedFlash(true);
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSavedFlash(false), 1200);
  };

  const patchActive = (patch: Partial<FreeNote>) => {
    if (!activeNote) return;
    const updatedAt = new Date().toISOString();
    onChangeNotes(
      notes.map((note) => (note.id === activeNote.id ? { ...note, ...patch, updatedAt } : note))
    );
    flashSaved();
  };

  const handleNewNote = () => {
    const note = createEmptyFreeNote();
    onChangeNotes([note, ...notes]);
    onChangeActiveNoteId(note.id);
    setPendingDeleteId(null);
    setShowReminder(false);
    window.setTimeout(() => titleRef.current?.focus(), 40);
  };

  const handleDelete = (id: string) => {
    const remaining = notes.filter((note) => note.id !== id);
    onChangeNotes(remaining);
    if (activeNoteId === id) {
      onChangeActiveNoteId(remaining[0]?.id ?? null);
    }
    setPendingDeleteId(null);
  };

  const setReminder = (iso: string | null) => {
    patchActive({
      reminderAt: iso,
      reminderDone: false,
      reminderFiredAt: null,
    });
    if (iso) requestReminderNotifications();
  };

  const words = noteWordCount(`${activeNote?.title || ''} ${activeNote?.body || ''}`);
  const chars = stripNoteMarkup(activeNote?.body || '').length;
  const dueNotes = dueReminderNotes(notes);
  const reminderState = activeNote ? getReminderState(activeNote) : 'none';

  return (
    <div className={`h-dvh max-md:h-auto max-md:min-h-dvh flex flex-col overflow-hidden max-md:overflow-visible ${
      isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#d9e2ec] text-slate-800'
    }`}>
      <header className="shrink-0 bg-[#0A3D62] text-white border-b border-white/10 shadow-md">
        <div className="px-3 sm:px-4 h-12 sm:h-13 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/15 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Inicio
            </button>
            <div className="hidden sm:flex items-center gap-2 min-w-0 pl-2 border-l border-white/15">
              {logoDataUrl ? (
                <img src={logoDataUrl} alt="Advansys" className="h-6 w-auto max-w-[96px] object-contain" />
              ) : (
                <FileText className="w-4 h-4 text-[#2ECC71]" />
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-200/80">Notas</p>
                <p className="text-xs font-bold truncate max-w-[280px]">
                  {activeNote ? inferredNoteTitle(activeNote) : 'Documento en blanco'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-white/10 text-blue-100">
              {savedFlash ? <Check className="w-3 h-3 text-[#2ECC71]" /> : <Clock className="w-3 h-3" />}
              {savedFlash ? 'Guardado' : 'Autoguardado'}
            </span>
            <button
              type="button"
              onClick={handleNewNote}
              className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold bg-[#2ECC71] hover:bg-[#27ae60] text-slate-950 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva nota
            </button>
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 cursor-pointer"
                title={isDark ? 'Modo claro' : 'Modo oscuro'}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-200" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {dueNotes.length > 0 && (
        <div className="shrink-0 px-3 py-2 bg-rose-50 border-b border-rose-200 dark:bg-rose-950/40 dark:border-rose-500/30 flex flex-wrap items-center gap-2">
          <BellRing className="w-4 h-4 text-rose-500" />
          <p className="text-xs font-bold text-rose-800 dark:text-rose-100">
            {dueNotes.length === 1 ? 'Hay un recordatorio ahora' : `Hay ${dueNotes.length} recordatorios ahora`}
          </p>
          {dueNotes.slice(0, 3).map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => onChangeActiveNoteId(note.id)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-rose-200 text-rose-800 cursor-pointer"
            >
              {inferredNoteTitle(note)}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 flex overflow-hidden max-md:flex-col max-md:overflow-visible">
        <aside className={`w-full md:w-64 lg:w-72 shrink-0 border-r flex flex-col ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f3f6f9] border-slate-300'
        }`}>
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Historial de notas</p>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar…"
                className={`w-full pl-8 pr-2 py-1.5 rounded-lg border text-xs ${
                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                }`}
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 space-y-1 max-md:max-h-40">
            {filtered.map((note) => {
              const isActive = note.id === activeNote?.id;
              const state = getReminderState(note);
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onChangeActiveNoteId(note.id)}
                  className={`w-full text-left rounded-lg px-2.5 py-2 cursor-pointer ${
                    isActive
                      ? 'bg-white shadow-sm ring-1 ring-[#0A3D62]/20 dark:bg-slate-800'
                      : 'hover:bg-white/80 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <p className="text-xs font-bold truncate flex items-center gap-1">
                    {note.pinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                    {state === 'due' && <BellRing className="w-3 h-3 text-rose-500 shrink-0" />}
                    {state === 'upcoming' && <Bell className="w-3 h-3 text-sky-500 shrink-0" />}
                    {inferredNoteTitle(note)}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{notePreview(note.body, 48)}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{formatRelativeTime(note.updatedAt)}</p>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-[11px] text-slate-500 px-2 py-3">No hay notas en esta búsqueda.</p>
            )}
          </div>
        </aside>

        <section className={`flex-1 min-h-0 overflow-y-auto ${isDark ? 'bg-slate-800' : 'bg-[#b8c5d3]'}`}>
          {activeNote && (
            <div className="max-w-[860px] mx-auto px-3 sm:px-6 py-4 sm:py-8">
              <article className="advansys-document-sheet word-note-sheet bg-white text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.18)] min-h-[min(92vh,1100px)] px-8 sm:px-14 py-10 sm:py-12 flex flex-col">
                <input
                  ref={titleRef}
                  value={activeNote.title}
                  onChange={(e) => patchActive({ title: e.target.value })}
                  placeholder="Título del documento"
                  className="w-full bg-transparent border-0 border-b border-transparent focus:border-slate-200 text-3xl sm:text-[34px] font-semibold text-slate-900 placeholder:text-slate-300 focus:ring-0 px-0 pb-3"
                />

                <div className="flex flex-wrap items-center gap-1.5 mt-3 mb-4">
                  <button
                    type="button"
                    onClick={() => patchActive({ pinned: !activeNote.pinned })}
                    className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    title={activeNote.pinned ? 'Quitar de fijas' : 'Fijar nota'}
                  >
                    {activeNote.pinned ? <Pin className="w-4 h-4 text-amber-500" /> : <PinOff className="w-4 h-4 text-slate-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReminder((open) => !open)}
                    className={`p-1.5 rounded-md border cursor-pointer ${
                      reminderState === 'due'
                        ? 'border-rose-300 bg-rose-50'
                        : reminderState === 'upcoming'
                          ? 'border-sky-300 bg-sky-50'
                          : 'border-slate-200 hover:bg-slate-50'
                    }`}
                    title="Recordatorio"
                  >
                    {reminderState === 'due' ? (
                      <BellRing className="w-4 h-4 text-rose-500" />
                    ) : reminderState === 'upcoming' ? (
                      <Bell className="w-4 h-4 text-sky-500" />
                    ) : (
                      <BellOff className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {reminderState === 'upcoming' && activeNote.reminderAt && (
                    <span className="text-[11px] text-sky-700 font-semibold">
                      Aviso {formatReminderWhen(activeNote.reminderAt)}
                    </span>
                  )}
                  {reminderState === 'due' && (
                    <span className="text-[11px] text-rose-700 font-semibold">Es ahora</span>
                  )}
                  {pendingDeleteId === activeNote.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDelete(activeNote.id)}
                        className="px-2 py-1 rounded-md bg-red-600 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Borrar nota
                      </button>
                      <button type="button" onClick={() => setPendingDeleteId(null)} className="p-1 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(activeNote.id)}
                      className="p-1.5 rounded-md border border-slate-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      title="Eliminar nota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {showReminder && (
                  <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-slate-700">Recordatorio de esta nota</p>
                      {activeNote.reminderAt && reminderState !== 'done' && (
                        <div className="flex gap-1">
                          {reminderState === 'due' && (
                            <button
                              type="button"
                              onClick={() => setReminder(new Date(Date.now() + 60 * 60 * 1000).toISOString())}
                              className="px-2 py-1 rounded-md text-[10px] font-bold bg-white border border-slate-200 cursor-pointer"
                            >
                              +1 h
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => patchActive({ reminderDone: true })}
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-600 text-white cursor-pointer"
                          >
                            Hecho
                          </button>
                          <button
                            type="button"
                            onClick={() => setReminder(null)}
                            className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 cursor-pointer"
                          >
                            Quitar
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {REMINDER_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setReminder(reminderPresetDate(preset.id).toISOString())}
                          className="px-2 py-1 rounded-full text-[10px] font-semibold border border-slate-200 bg-white cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                      <label className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border border-slate-200 bg-white cursor-pointer">
                        Fecha
                        <input
                          type="datetime-local"
                          value={toLocalDateTimeInput(activeNote.reminderAt)}
                          onChange={(e) => setReminder(fromLocalDateTimeInput(e.target.value))}
                          className="bg-transparent border-0 p-0 text-[10px] font-semibold focus:ring-0"
                        />
                      </label>
                    </div>
                  </div>
                )}

                <NoteBodyEditor
                  noteId={activeNote.id}
                  value={activeNote.body}
                  onChange={(next) => patchActive({ body: next })}
                  placeholder="Empieza a escribir… También puedes pegar o soltar una imagen."
                />

                <div className="pt-4 mt-auto flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                  <span>
                    {words} {words === 1 ? 'palabra' : 'palabras'} · {chars} caracteres
                  </span>
                  <span>Editada {formatRelativeTime(activeNote.updatedAt)}</span>
                </div>
              </article>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
