export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  useAgent: boolean;
  updatedAt: string;
  modelUsed?: string;
};

const STORAGE_KEY = 'advansys_chats_v1';

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyChatThread(): ChatThread {
  const now = new Date().toISOString();
  return {
    id: uid('chat'),
    title: 'Nueva conversación',
    messages: [],
    useAgent: false,
    updatedAt: now,
  };
}

export function inferredChatTitle(thread: ChatThread): string {
  const firstUser = thread.messages.find((m) => m.role === 'user')?.content.trim();
  if (firstUser) {
    const line = firstUser.split('\n')[0].trim();
    return line.length > 42 ? `${line.slice(0, 42)}…` : line;
  }
  return thread.title?.trim() || 'Nueva conversación';
}

export function loadChatState(): { threads: ChatThread[]; activeId: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { threads: [], activeId: null };
    const parsed = JSON.parse(raw);
    const threads = Array.isArray(parsed.threads) ? parsed.threads : [];
    return { threads, activeId: parsed.activeId || threads[0]?.id || null };
  } catch {
    return { threads: [], activeId: null };
  }
}

export function saveChatState(threads: ChatThread[], activeId: string | null): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ threads, activeId }));
  } catch (e) {
    console.error('No se pudieron guardar las conversaciones:', e);
  }
}
