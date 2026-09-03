import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AgentConfig } from '../types';
import {
  ChatThread,
  createEmptyChatThread,
  inferredChatTitle,
  loadChatState,
  saveChatState,
} from '../utils/chatStorage';
import { readApiJson } from '../utils/apiJson';
import {
  Plus,
  Search,
  Trash2,
  Home,
  Sun,
  Moon,
  Send,
  Loader2,
  MessageCircle,
  Bot,
  User,
} from 'lucide-react';

interface ChatWorkspaceProps {
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onGoHome?: () => void;
  logoDataUrl?: string;
  agentConfig: AgentConfig;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  theme = 'light',
  onToggleTheme,
  onGoHome,
  logoDataUrl,
  agentConfig,
}) => {
  const loaded = useRef(loadChatState());
  const [threads, setThreads] = useState<ChatThread[]>(loaded.current.threads);
  const [activeId, setActiveId] = useState<string | null>(loaded.current.activeId);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isDark = theme === 'dark';

  const ordered = useMemo(
    () => [...threads].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [threads]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter(
      (t) =>
        inferredChatTitle(t).toLowerCase().includes(q) ||
        t.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [ordered, query]);

  const active = threads.find((t) => t.id === activeId) || null;

  useEffect(() => {
    if (activeId && threads.some((t) => t.id === activeId)) return;
    if (ordered.length > 0) {
      setActiveId(ordered[0].id);
      return;
    }
    const next = createEmptyChatThread();
    setThreads([next]);
    setActiveId(next.id);
  }, [activeId, threads, ordered]);

  useEffect(() => {
    saveChatState(threads, activeId);
  }, [threads, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages.length, sending]);

  const patchActive = (patch: Partial<ChatThread>) => {
    if (!active) return;
    const updatedAt = new Date().toISOString();
    setThreads((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, ...patch, updatedAt } : t))
    );
  };

  const handleNew = () => {
    const next = createEmptyChatThread();
    setThreads((prev) => [next, ...prev]);
    setActiveId(next.id);
    setDraft('');
    setError(null);
    inputRef.current?.focus();
  };

  const handleDelete = (id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !active || sending) return;
    const userMsg = {
      id: `m_${Date.now()}`,
      role: 'user' as const,
      content: text,
      createdAt: new Date().toISOString(),
    };
    const history = [...active.messages, userMsg];
    patchActive({
      messages: history,
      title: inferredChatTitle({ ...active, messages: history }),
    });
    setDraft('');
    setSending(true);
    setError(null);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          useAgent: active.useAgent,
          agentConfig,
        }),
      });
      const data = await readApiJson(response);
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo obtener respuesta.');
      }
      const reply = String(data.reply || '').trim() || '(sin contenido)';
      const assistantMsg = {
        id: `m_${Date.now()}_a`,
        role: 'assistant' as const,
        content: reply,
        createdAt: new Date().toISOString(),
      };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === active.id
            ? {
                ...t,
                messages: [...history, assistantMsg],
                modelUsed: data.modelUsed,
                updatedAt: new Date().toISOString(),
                title: inferredChatTitle({ ...t, messages: history }),
              }
            : t
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Error al hablar con el motor de IA.');
      setThreads((prev) =>
        prev.map((t) => (t.id === active.id ? { ...t, messages: history } : t))
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className={`h-dvh flex flex-col ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#f4f7fb] text-slate-800'}`}>
      <header className="shrink-0 bg-[#0A3D62] text-white border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-5 h-13 sm:h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
                title="Inicio"
              >
                <Home className="w-4 h-4" />
              </button>
            )}
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="Advansys" className="h-7 w-auto max-w-[120px] object-contain" />
            ) : (
              <MessageCircle className="w-5 h-5 text-[#2ECC71]" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Chat</p>
              <p className="text-[10px] text-blue-200 truncate">
                {active?.modelUsed || 'Usa el motor de Ajustes → Motores IA'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleNew}
              className="h-8 inline-flex items-center gap-1 px-2.5 rounded-lg text-xs font-bold bg-[#2ECC71] text-slate-950 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva
            </button>
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white/10 cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex max-md:flex-col">
        <aside
          className={`w-full md:w-64 lg:w-72 shrink-0 border-r flex flex-col ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f3f6f9] border-slate-300'
          }`}
        >
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Conversaciones</p>
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
          <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 space-y-1 max-md:max-h-36">
            {filtered.map((t) => {
              const isActive = t.id === active?.id;
              return (
                <div
                  key={t.id}
                  className={`rounded-lg px-2 py-2 flex items-start gap-1 ${
                    isActive ? 'bg-white shadow-sm ring-1 ring-[#0A3D62]/20 dark:bg-slate-800' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    className="min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <p className="text-xs font-bold truncate">{inferredChatTitle(t)}</p>
                    <p className="text-[10px] text-slate-500">
                      {t.messages.length} mensajes
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 min-w-0 min-h-0 flex flex-col">
          {active && (
            <div className={`px-4 py-2 border-b flex items-center justify-between gap-2 ${
              isDark ? 'border-slate-800' : 'border-slate-200 bg-white/70'
            }`}>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={active.useAgent}
                  onChange={(e) => patchActive({ useAgent: e.target.checked })}
                />
                <span>Usar rol del agente (Ajustes)</span>
              </label>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
            {active && active.messages.length === 0 && !sending && (
              <div className={`max-w-lg mx-auto text-center rounded-2xl border px-5 py-8 ${
                isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'
              }`}>
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-[#0A3D62]" />
                <p className="text-sm font-bold">Conversación libre</p>
                <p className="text-xs text-slate-500 mt-1">
                  Pregunta como lo harías en ChatGPT, Claude o Gemini. El motor es el de Ajustes → Motores IA.
                </p>
              </div>
            )}
            {active?.messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#0A3D62] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[min(42rem,85%)] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#0A3D62] text-white rounded-br-md'
                      : isDark
                        ? 'bg-slate-800 border border-slate-700 rounded-bl-md'
                        : 'bg-white border border-slate-200 rounded-bl-md'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Escribiendo…
              </div>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div ref={bottomRef} />
          </div>

          <div className={`p-3 border-t ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
            <div className="max-w-3xl mx-auto flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={2}
                placeholder="Escribe un mensaje… (Enter envía, Shift+Enter nueva línea)"
                className={`flex-1 resize-none rounded-xl border px-3 py-2 text-sm ${
                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <button
                type="button"
                disabled={sending || !draft.trim()}
                onClick={() => void sendMessage()}
                className="h-10 w-10 rounded-xl bg-[#0A3D62] text-white flex items-center justify-center disabled:opacity-40 cursor-pointer"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
