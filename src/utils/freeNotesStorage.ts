import { FreeNote, FreeNoteColor } from '../types';

export const STORAGE_KEY_FREE_NOTES = 'advansys_docgen_free_notes_v1';

export const FREE_NOTE_COLORS: { id: FreeNoteColor; label: string }[] = [
  { id: 'amber', label: 'Ámbar' },
  { id: 'sky', label: 'Cielo' },
  { id: 'emerald', label: 'Esmeralda' },
  { id: 'rose', label: 'Rosa' },
  { id: 'violet', label: 'Violeta' },
  { id: 'slate', label: 'Pizarra' },
];

export const FREE_NOTE_COLOR_STYLES: Record<
  FreeNoteColor,
  { swatch: string; bar: string; chip: string; panel: string; ring: string }
> = {
  amber: {
    swatch: 'bg-amber-400',
    bar: 'bg-amber-400',
    chip: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/50 dark:border-amber-500/30 dark:text-amber-100',
    panel: 'from-amber-50/90 via-white to-orange-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900',
    ring: 'ring-amber-400/60 border-amber-300',
  },
  sky: {
    swatch: 'bg-sky-400',
    bar: 'bg-sky-400',
    chip: 'bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/50 dark:border-sky-500/30 dark:text-sky-100',
    panel: 'from-sky-50/90 via-white to-blue-50/40 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900',
    ring: 'ring-sky-400/60 border-sky-300',
  },
  emerald: {
    swatch: 'bg-emerald-400',
    bar: 'bg-emerald-400',
    chip: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-500/30 dark:text-emerald-100',
    panel: 'from-emerald-50/90 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900',
    ring: 'ring-emerald-400/60 border-emerald-300',
  },
  rose: {
    swatch: 'bg-rose-400',
    bar: 'bg-rose-400',
    chip: 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/50 dark:border-rose-500/30 dark:text-rose-100',
    panel: 'from-rose-50/90 via-white to-pink-50/40 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900',
    ring: 'ring-rose-400/60 border-rose-300',
  },
  violet: {
    swatch: 'bg-violet-400',
    bar: 'bg-violet-400',
    chip: 'bg-violet-50 border-violet-200 text-violet-900 dark:bg-violet-950/50 dark:border-violet-500/30 dark:text-violet-100',
    panel: 'from-violet-50/90 via-white to-fuchsia-50/40 dark:from-violet-950/40 dark:via-slate-900 dark:to-slate-900',
    ring: 'ring-violet-400/60 border-violet-300',
  },
  slate: {
    swatch: 'bg-slate-400',
    bar: 'bg-slate-500',
    chip: 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800/80 dark:border-slate-600 dark:text-slate-100',
    panel: 'from-slate-50 via-white to-slate-100/60 dark:from-slate-800/60 dark:via-slate-900 dark:to-slate-900',
    ring: 'ring-slate-400/60 border-slate-300',
  },
};

export function createEmptyFreeNote(partial?: Partial<FreeNote>): FreeNote {
  const now = new Date().toISOString();
  return {
    id: `idea_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    body: '',
    color: 'amber',
    pinned: false,
    createdAt: now,
    updatedAt: now,
    reminderAt: null,
    reminderDone: false,
    reminderFiredAt: null,
    ...partial,
  };
}

export function loadFreeNotesState(): { notes: FreeNote[]; activeId: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FREE_NOTES);
    if (!raw) return { notes: [], activeId: null };
    const parsed = JSON.parse(raw);
    const notes: FreeNote[] = Array.isArray(parsed?.notes) ? parsed.notes : Array.isArray(parsed) ? parsed : [];
    const activeId = typeof parsed?.activeId === 'string' ? parsed.activeId : notes[0]?.id ?? null;
    return { notes, activeId };
  } catch {
    return { notes: [], activeId: null };
  }
}

export function saveFreeNotesState(notes: FreeNote[], activeId: string | null): void {
  try {
    localStorage.setItem(STORAGE_KEY_FREE_NOTES, JSON.stringify({ notes, activeId }));
  } catch (err) {
    console.error('No se pudieron guardar las ideas de libre escritura:', err);
  }
}

export function stripNoteMarkup(body: string): string {
  if (!body) return '';
  return body
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

export function inferredNoteTitle(note: Pick<FreeNote, 'title' | 'body'>): string {
  const titled = note.title.trim();
  if (titled) return titled;
  const firstLine = stripNoteMarkup(note.body)
    .split('\n')
    .map((line) => line.replace(/^[#>*\-\d.\s]+/, '').trim())
    .find((line) => line.length > 0);
  if (firstLine) return firstLine.length > 48 ? `${firstLine.slice(0, 48).trim()}…` : firstLine;
  if (/<img/i.test(note.body)) return 'Nota con imagen';
  return 'Idea sin título';
}

export function notePreview(body: string, max = 110): string {
  const clean = stripNoteMarkup(body).replace(/\s+/g, ' ').trim();
  if (!clean) return /<img/i.test(body) ? 'Imagen' : 'Todavía no hay texto…';
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
}

export function noteWordCount(text: string): number {
  const clean = stripNoteMarkup(text);
  return clean.trim() ? clean.trim().split(/\s+/).length : 0;
}

export async function compressNoteImage(file: Blob, maxEdge = 1400, quality = 0.72): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo leer la imagen');
    ctx.drawImage(bitmap, 0, 0, width, height);
    const keepPng = file.type === 'image/png' && width * height < 700 * 700;
    let dataUrl = keepPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length > 1_800_000) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.55);
    }
    if (dataUrl.length > 1_800_000) {
      const smaller = document.createElement('canvas');
      const nextScale = 900 / Math.max(width, height);
      smaller.width = Math.max(1, Math.round(width * nextScale));
      smaller.height = Math.max(1, Math.round(height * nextScale));
      const sctx = smaller.getContext('2d');
      if (sctx) {
        sctx.drawImage(canvas, 0, 0, smaller.width, smaller.height);
        dataUrl = smaller.toDataURL('image/jpeg', 0.5);
      }
    }
    return dataUrl;
  } finally {
    bitmap.close();
  }
}

export function formatRelativeTime(iso: string): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';
  const diffSec = Math.round((Date.now() - time) / 1000);
  if (diffSec < 20) return 'ahora';
  if (diffSec < 60) return `hace ${diffSec} s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin === 1) return 'hace 1 min';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours === 1) return 'hace 1 h';
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'ayer';
  if (diffDays < 14) return `hace ${diffDays} días`;
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

export function mergeFreeNotes(existing: FreeNote[], incoming: FreeNote[]): FreeNote[] {
  const map = new Map<string, FreeNote>();
  existing.forEach((note) => map.set(note.id, note));
  incoming.forEach((note) => {
    const prev = map.get(note.id);
    if (!prev) {
      map.set(note.id, note);
      return;
    }
    const newer = new Date(note.updatedAt).getTime() >= new Date(prev.updatedAt).getTime() ? note : prev;
    map.set(note.id, newer);
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function sortFreeNotes(notes: FreeNote[]): FreeNote[] {
  return [...notes].sort((a, b) => {
    const rank = (note: FreeNote) => {
      const state = getReminderState(note);
      if (state === 'due') return 0;
      if (note.pinned) return 1;
      if (state === 'upcoming') return 2;
      return 3;
    };
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    if (getReminderState(a) === 'upcoming' && getReminderState(b) === 'upcoming') {
      return new Date(a.reminderAt || 0).getTime() - new Date(b.reminderAt || 0).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export type ReminderState = 'none' | 'upcoming' | 'due' | 'done';

export function getReminderState(note: Pick<FreeNote, 'reminderAt' | 'reminderDone'>, now = Date.now()): ReminderState {
  if (!note.reminderAt) return 'none';
  if (note.reminderDone) return 'done';
  if (new Date(note.reminderAt).getTime() <= now) return 'due';
  return 'upcoming';
}

export function toLocalDateTimeInput(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalDateTimeInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function formatReminderWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const time = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (date.toDateString() === now.toDateString()) return `hoy ${time}`;
  if (date.toDateString() === tomorrow.toDateString()) return `mañana ${time}`;
  return `${date.toLocaleDateString('es', { day: 'numeric', month: 'short' })} ${time}`;
}

export type ReminderPreset = '1h' | 'today17' | 'tomorrow9' | '3d' | 'week';

export const REMINDER_PRESETS: { id: ReminderPreset; label: string }[] = [
  { id: '1h', label: 'En 1 h' },
  { id: 'today17', label: 'Hoy 5:00 p. m.' },
  { id: 'tomorrow9', label: 'Mañana 9:00 a. m.' },
  { id: '3d', label: 'En 3 días' },
  { id: 'week', label: 'En 1 semana' },
];

export function reminderPresetDate(kind: ReminderPreset): Date {
  const now = new Date();
  if (kind === '1h') return new Date(now.getTime() + 60 * 60 * 1000);
  if (kind === 'today17') {
    const date = new Date(now);
    date.setHours(17, 0, 0, 0);
    if (date.getTime() <= now.getTime()) date.setDate(date.getDate() + 1);
    return date;
  }
  if (kind === 'tomorrow9') {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
    return date;
  }
  if (kind === '3d') {
    const date = new Date(now);
    date.setDate(date.getDate() + 3);
    date.setHours(9, 0, 0, 0);
    return date;
  }
  const date = new Date(now);
  date.setDate(date.getDate() + 7);
  date.setHours(9, 0, 0, 0);
  return date;
}

export function dueReminderNotes(notes: FreeNote[], now = Date.now()): FreeNote[] {
  return notes.filter((note) => getReminderState(note, now) === 'due');
}

export function upcomingReminderNotes(notes: FreeNote[], now = Date.now()): FreeNote[] {
  return notes
    .filter((note) => getReminderState(note, now) === 'upcoming')
    .sort((a, b) => new Date(a.reminderAt || 0).getTime() - new Date(b.reminderAt || 0).getTime());
}

export function requestReminderNotifications(): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    void Notification.requestPermission();
  }
}

export function fireReminderNotification(title: string, body: string, tag: string): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag });
  } catch (err) {
    console.warn('No se pudo mostrar el aviso del navegador:', err);
  }
}
