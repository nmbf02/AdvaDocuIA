import fs from "fs/promises";
import path from "path";
import { GoogleGenAI } from "@google/genai";

export type AiProviderId = "gemini" | "claude" | "openai" | "groq" | "openrouter";

export const AI_PROVIDER_META: {
  id: AiProviderId;
  label: string;
  envKey: string;
  modelEnv: string;
  defaultModel: string;
  hint: string;
}[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    envKey: "GEMINI_API_KEY",
    modelEnv: "GEMINI_MODEL",
    defaultModel: "gemini-3.6-flash",
    hint: "Google AI Studio",
  },
  {
    id: "claude",
    label: "Anthropic Claude",
    envKey: "ANTHROPIC_API_KEY",
    modelEnv: "ANTHROPIC_MODEL",
    defaultModel: "claude-sonnet-4-5",
    hint: "console.anthropic.com — API, no el chat de claude.ai",
  },
  {
    id: "openai",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    modelEnv: "OPENAI_MODEL",
    defaultModel: "gpt-4.1-mini",
    hint: "platform.openai.com",
  },
  {
    id: "groq",
    label: "Groq",
    envKey: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: "llama-3.3-70b-versatile",
    hint: "console.groq.com",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    modelEnv: "OPENROUTER_MODEL",
    defaultModel: "anthropic/claude-sonnet-4",
    hint: "openrouter.ai — unifica varios modelos",
  },
];

const SECRETS_FILE = path.join(process.cwd(), ".ai-secrets.json");
const GEMINI_FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];

type SecretsFile = {
  provider?: string;
  fallbacks?: string[];
  keys?: Partial<Record<AiProviderId, string>>;
  models?: Partial<Record<AiProviderId, string>>;
};

let secretsCache: SecretsFile = {};
let secretsLoaded = false;
let geminiClient: GoogleGenAI | null = null;

function isProviderId(value: string): value is AiProviderId {
  return AI_PROVIDER_META.some((p) => p.id === value);
}

export async function loadAiSecrets(): Promise<void> {
  try {
    const raw = await fs.readFile(SECRETS_FILE, "utf8");
    secretsCache = JSON.parse(raw) as SecretsFile;
  } catch {
    secretsCache = {};
  }
  secretsLoaded = true;
  geminiClient = null;
}

async function ensureSecrets(): Promise<void> {
  if (!secretsLoaded) await loadAiSecrets();
}

function envOrSecretKey(id: AiProviderId): string {
  const meta = AI_PROVIDER_META.find((p) => p.id === id)!;
  const fromFile = secretsCache.keys?.[id]?.trim() || "";
  const fromEnv = process.env[meta.envKey]?.trim() || "";
  return fromFile || fromEnv;
}

function envOrSecretModel(id: AiProviderId): string {
  const meta = AI_PROVIDER_META.find((p) => p.id === id)!;
  const fromFile = secretsCache.models?.[id]?.trim() || "";
  const fromEnv = process.env[meta.modelEnv]?.trim() || "";
  return fromFile || fromEnv || meta.defaultModel;
}

export function providerHasKey(id: AiProviderId): boolean {
  return Boolean(envOrSecretKey(id));
}

export function getActiveProvider(): AiProviderId | "auto" {
  const fromFile = secretsCache.provider?.trim();
  const fromEnv = process.env.AI_PROVIDER?.trim();
  const raw = fromFile || fromEnv || "auto";
  if (raw === "auto" || isProviderId(raw)) return raw as AiProviderId | "auto";
  return "auto";
}

export function getFallbackProviders(): AiProviderId[] {
  const fromFile = secretsCache.fallbacks;
  const fromEnv = (process.env.AI_FALLBACK_PROVIDERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const list = (fromFile && fromFile.length ? fromFile : fromEnv).filter(isProviderId);
  return list;
}

function resolveProviderChain(preferred?: string): AiProviderId[] {
  const ordered: AiProviderId[] = [];
  const push = (id?: string) => {
    if (!id || !isProviderId(id) || ordered.includes(id)) return;
    if (providerHasKey(id)) ordered.push(id);
  };
  if (preferred && preferred !== "auto") push(preferred);
  const active = getActiveProvider();
  if (active !== "auto") push(active);
  getFallbackProviders().forEach(push);
  AI_PROVIDER_META.forEach((p) => push(p.id));
  return ordered;
}

export async function getAiStatus() {
  await ensureSecrets();
  return {
    provider: getActiveProvider(),
    fallbacks: getFallbackProviders(),
    keys: Object.fromEntries(AI_PROVIDER_META.map((p) => [p.id, providerHasKey(p.id)])) as Record<AiProviderId, boolean>,
    models: Object.fromEntries(AI_PROVIDER_META.map((p) => [p.id, envOrSecretModel(p.id)])) as Record<AiProviderId, string>,
    providers: AI_PROVIDER_META.map((p) => ({
      id: p.id,
      label: p.label,
      envKey: p.envKey,
      hint: p.hint,
      defaultModel: p.defaultModel,
    })),
  };
}

export async function saveAiConfig(body: {
  provider?: string;
  fallbacks?: string[];
  models?: Partial<Record<AiProviderId, string>>;
  keys?: Partial<Record<AiProviderId, string>>;
  clearKeys?: AiProviderId[];
}): Promise<ReturnType<typeof getAiStatus>> {
  await ensureSecrets();
  const next: SecretsFile = {
    provider: body.provider !== undefined ? body.provider : secretsCache.provider,
    fallbacks: body.fallbacks !== undefined ? body.fallbacks.filter(isProviderId) : secretsCache.fallbacks,
    models: { ...(secretsCache.models || {}) },
    keys: { ...(secretsCache.keys || {}) },
  };
  if (body.models) {
    for (const [id, model] of Object.entries(body.models)) {
      if (isProviderId(id) && typeof model === "string") {
        const trimmed = model.trim();
        if (trimmed) next.models![id] = trimmed;
        else delete next.models![id];
      }
    }
  }
  if (body.keys) {
    for (const [id, key] of Object.entries(body.keys)) {
      if (!isProviderId(id) || typeof key !== "string") continue;
      const trimmed = key.trim();
      if (trimmed) next.keys![id] = trimmed;
    }
  }
  (body.clearKeys || []).forEach((id) => {
    if (isProviderId(id)) delete next.keys![id];
  });
  await fs.writeFile(SECRETS_FILE, JSON.stringify(next, null, 2), "utf8");
  secretsCache = next;
  geminiClient = null;
  return getAiStatus();
}

function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: envOrSecretKey("gemini") || "",
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return geminiClient;
}

type ImagePart = { mimeType: string; data: string };

function parseContents(contents: any): { text: string; images: ImagePart[] } {
  if (typeof contents === "string") return { text: contents, images: [] };
  const parts = contents?.parts || contents || [];
  if (!Array.isArray(parts)) {
    return { text: String(contents ?? ""), images: [] };
  }
  const texts: string[] = [];
  const images: ImagePart[] = [];
  for (const part of parts) {
    if (typeof part === "string") texts.push(part);
    else if (part?.text) texts.push(String(part.text));
    else if (part?.inlineData?.data) {
      images.push({
        mimeType: part.inlineData.mimeType || "image/png",
        data: part.inlineData.data,
      });
    }
  }
  return { text: texts.join("\n"), images };
}

function schemaHint(schema: any): string {
  if (!schema) return "";
  try {
    return `\n\nResponde ÚNICAMENTE un JSON válido (sin markdown) que cumpla este esquema:\n${JSON.stringify(schema)}`;
  } catch {
    return "\n\nResponde ÚNICAMENTE un JSON válido, sin markdown.";
  }
}

export function extractJsonText(text: string): string {
  const t = (text || "").trim();
  if (!t) return t;
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) return t.slice(start, end + 1);
  return t;
}

async function callGemini(params: {
  contents: any;
  config?: any;
  models?: string[];
}): Promise<{ text: string | undefined; modelUsed: string }> {
  const ai = getGemini();
  const modelsToTry =
    params.models && params.models.length > 0
      ? params.models
      : [envOrSecretModel("gemini"), ...GEMINI_FALLBACK_MODELS.filter((m) => m !== envOrSecretModel("gemini"))];
  let lastError: any = null;
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return { text: response.text, modelUsed: `gemini:${model}` };
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        console.warn(`[Gemini] ${model} intento ${attempt}:`, msg);
        const isTransient =
          msg.includes("503") ||
          msg.includes("429") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("overloaded") ||
          msg.includes("fetch failed");
        if (isTransient && attempt < 2) await new Promise((r) => setTimeout(r, 1200));
        else break;
      }
    }
  }
  throw lastError || new Error("Gemini no respondió.");
}

async function callClaude(params: {
  text: string;
  images: ImagePart[];
  system?: string;
  temperature?: number;
  json?: boolean;
}): Promise<{ text: string; modelUsed: string }> {
  const model = envOrSecretModel("claude");
  const content: any[] = [];
  params.images.slice(0, 8).forEach((img) => {
    content.push({
      type: "image",
      source: { type: "base64", media_type: img.mimeType, data: img.data },
    });
  });
  content.push({ type: "text", text: params.text });
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": envOrSecretKey("claude"),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      temperature: params.temperature ?? 0.2,
      system: params.system || undefined,
      messages: [{ role: "user", content }],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Claude HTTP ${res.status}`);
  }
  const text = (data.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
  return { text, modelUsed: `claude:${model}` };
}

async function callOpenAiCompat(params: {
  provider: "openai" | "groq" | "openrouter";
  url: string;
  text: string;
  images: ImagePart[];
  system?: string;
  temperature?: number;
}): Promise<{ text: string; modelUsed: string }> {
  const model = envOrSecretModel(params.provider);
  const userContent: any =
    params.images.length === 0
      ? params.text
      : [
          { type: "text", text: params.text },
          ...params.images.slice(0, 8).map((img) => ({
            type: "image_url",
            image_url: { url: `data:${img.mimeType};base64,${img.data}` },
          })),
        ];
  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${envOrSecretKey(params.provider)}`,
  };
  if (params.provider === "openrouter") {
    headers["HTTP-Referer"] = "http://localhost:3000";
    headers["X-Title"] = "AdvaDocuIA";
  }
  const res = await fetch(params.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: params.temperature ?? 0.2,
      messages: [
        ...(params.system ? [{ role: "system", content: params.system }] : []),
        { role: "user", content: userContent },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `${params.provider} HTTP ${res.status}`);
  }
  const text = data.choices?.[0]?.message?.content || "";
  return { text, modelUsed: `${params.provider}:${model}` };
}

export async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  models?: string[];
  preferredProvider?: string;
}): Promise<{ text: string | undefined; modelUsed: string }> {
  await ensureSecrets();
  const chain = resolveProviderChain(params.preferredProvider);
  if (chain.length === 0) {
    throw new Error(
      "No hay claves de IA. Configura GEMINI_API_KEY, ANTHROPIC_API_KEY u otra en Ajustes → Motores IA o en el archivo .env."
    );
  }

  const { text, images } = parseContents(params.contents);
  const wantsJson = params.config?.responseMimeType === "application/json";
  const systemBase = params.config?.systemInstruction || "";
  const userText = wantsJson ? `${text}${schemaHint(params.config?.responseSchema)}` : text;
  const temperature = params.config?.temperature;
  let lastError: any = null;

  for (const provider of chain) {
    try {
      let result: { text: string | undefined; modelUsed: string };
      if (provider === "gemini") {
        result = await callGemini(params);
      } else if (provider === "claude") {
        result = await callClaude({
          text: userText,
          images,
          system: systemBase,
          temperature,
          json: wantsJson,
        });
      } else if (provider === "openai") {
        result = await callOpenAiCompat({
          provider: "openai",
          url: "https://api.openai.com/v1/chat/completions",
          text: userText,
          images,
          system: systemBase,
          temperature,
        });
      } else if (provider === "groq") {
        result = await callOpenAiCompat({
          provider: "groq",
          url: "https://api.groq.com/openai/v1/chat/completions",
          text: userText,
          images,
          system: systemBase,
          temperature,
        });
      } else {
        result = await callOpenAiCompat({
          provider: "openrouter",
          url: "https://openrouter.ai/api/v1/chat/completions",
          text: userText,
          images,
          system: systemBase,
          temperature,
        });
      }
      const out = wantsJson ? extractJsonText(result.text || "") : result.text;
      return { text: out, modelUsed: result.modelUsed };
    } catch (err: any) {
      lastError = err;
      console.warn(`[IA] Falló ${provider}:`, err?.message || err);
    }
  }

  throw lastError || new Error("Ningún motor de IA respondió.");
}

export type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

function normalizeChat(messages: ChatTurn[]): { system: string; turns: ChatTurn[] } {
  const system = messages
    .filter((m) => m.role === "system" && m.content.trim())
    .map((m) => m.content.trim())
    .join("\n\n");
  const turns: ChatTurn[] = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    const content = String(m.content || "").trim();
    if (!content) continue;
    const role = m.role === "assistant" ? "assistant" : "user";
    const last = turns[turns.length - 1];
    if (last && last.role === role) last.content += `\n\n${content}`;
    else turns.push({ role, content });
  }
  if (turns.length === 0) throw new Error("Escribe un mensaje para continuar.");
  if (turns[0].role !== "user") turns.unshift({ role: "user", content: "Hola." });
  if (turns[turns.length - 1].role !== "user") {
    throw new Error("El último mensaje debe ser del usuario.");
  }
  return { system, turns };
}

async function callClaudeChat(
  turns: ChatTurn[],
  system: string,
  temperature: number
): Promise<{ text: string; modelUsed: string }> {
  const model = envOrSecretModel("claude");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": envOrSecretKey("claude"),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      temperature,
      system: system || undefined,
      messages: turns.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Claude HTTP ${res.status}`);
  const text = (data.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
  return { text, modelUsed: `claude:${model}` };
}

async function callOpenAiChat(
  provider: "openai" | "groq" | "openrouter",
  url: string,
  turns: ChatTurn[],
  system: string,
  temperature: number
): Promise<{ text: string; modelUsed: string }> {
  const model = envOrSecretModel(provider);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${envOrSecretKey(provider)}`,
  };
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "http://localhost:3000";
    headers["X-Title"] = "AdvaDocuIA";
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        ...turns.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `${provider} HTTP ${res.status}`);
  return { text: data.choices?.[0]?.message?.content || "", modelUsed: `${provider}:${model}` };
}

export async function generateChat(params: {
  messages: ChatTurn[];
  preferredProvider?: string;
  temperature?: number;
}): Promise<{ text: string; modelUsed: string }> {
  await ensureSecrets();
  const chain = resolveProviderChain(params.preferredProvider);
  if (chain.length === 0) {
    throw new Error(
      "No hay claves de IA. Configura un motor en Ajustes → Motores IA."
    );
  }
  const { system, turns } = normalizeChat(params.messages);
  const temperature = params.temperature ?? 0.7;
  const geminiContents = turns.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  let lastError: any = null;
  for (const provider of chain) {
    try {
      if (provider === "gemini") {
        const result = await callGemini({
          contents: geminiContents,
          config: { systemInstruction: system || undefined, temperature },
        });
        return { text: result.text || "", modelUsed: result.modelUsed };
      }
      if (provider === "claude") {
        return await callClaudeChat(turns, system, temperature);
      }
      if (provider === "openai") {
        return await callOpenAiChat("openai", "https://api.openai.com/v1/chat/completions", turns, system, temperature);
      }
      if (provider === "groq") {
        return await callOpenAiChat("groq", "https://api.groq.com/openai/v1/chat/completions", turns, system, temperature);
      }
      return await callOpenAiChat(
        "openrouter",
        "https://openrouter.ai/api/v1/chat/completions",
        turns,
        system,
        temperature
      );
    } catch (err: any) {
      lastError = err;
      console.warn(`[Chat] Falló ${provider}:`, err?.message || err);
    }
  }
  throw lastError || new Error("Ningún motor de IA respondió.");
}
