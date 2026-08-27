import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { extractSourceDocument } from "./sourceDocument";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware to parse large JSON payloads (including base64 images)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initializer for Gemini client to prevent crashes if GEMINI_API_KEY is not set at boot
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY is not defined in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const FALLBACK_MODELS = [
  "gemini-3.7-flash",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];

function formatCleanErrorMessage(rawError: any): string {
  if (!rawError) return "Error al procesar la solicitud con IA.";
  const rawMsg = typeof rawError === "string" ? rawError : rawError?.message || String(rawError);

  try {
    const jsonMatch = rawMsg.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.code === 503 || parsed?.error?.status === "UNAVAILABLE") {
        return "El servicio de IA está experimentando alta demanda temporal en sus servidores. Por favor, reintenta en unos instantes.";
      }
      if (parsed?.error?.code === 429 || parsed?.error?.status === "RESOURCE_EXHAUSTED") {
        return "Límite temporal de peticiones alcanzado. Espera unos segundos y reintenta.";
      }
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    }
  } catch {
    // Ignore JSON parse error and use pattern matching below
  }

  if (rawMsg.includes("503") || rawMsg.includes("high demand") || rawMsg.includes("UNAVAILABLE") || rawMsg.includes("overloaded")) {
    return "El servicio de IA está experimentando alta demanda temporal en sus servidores. Por favor, reintenta en unos instantes.";
  }
  if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED") || rawMsg.includes("quota")) {
    return "Límite de solicitudes de IA alcanzado momentáneamente. Por favor espera unos segundos y reintenta.";
  }

  return rawMsg;
}

async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  models?: string[];
}): Promise<{ text: string | undefined; modelUsed: string }> {
  const ai = getGeminiClient();
  const modelsToTry = params.models && params.models.length > 0 ? params.models : FALLBACK_MODELS;
  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return { text: response.text, modelUsed: model };
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        console.warn(`[Gemini API] Error en modelo ${model} (intento ${attempt}):`, msg);
        const isTransient =
          msg.includes("503") ||
          msg.includes("429") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("overloaded") ||
          msg.includes("fetch failed");

        if (isTransient && attempt < 2) {
          // Breve pausa para superar picos de concurrencia
          await new Promise((res) => setTimeout(res, 1200));
        } else {
          break; // Pasar al siguiente modelo de respaldo
        }
      }
    }
  }

  throw new Error(formatCleanErrorMessage(lastError));
}

function agentPersonaBlock(agent: any): string {
  const rol = typeof agent?.rol === 'string' ? agent.rol.trim() : '';
  if (!rol) return '';
  const idioma = agent?.idioma === 'en' ? 'English' : 'español formal';
  return `\n\nACTITUD E INSTRUCCIONES CONFIGURADAS EN LA APLICACIÓN (prioridad de tono y enfoque de negocio):\nIdioma de salida: ${idioma}.\n${rol}\nLa estructura JSON y las secciones del documento de Advansys se mantienen. El estilo de redacción sigue estas instrucciones.\n`;
}

function clampLevel(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(10, Math.max(1, Math.round(n)));
}

function getDetailLevelGuidance(level: number): string {
  if (level <= 3) {
    return `FILTRO DE NIVEL DE DETALLE (Nivel ${level} de 10) — CONCISO / SINTÉTICO:
- Extensión breve. Evita repeticiones, relleno y supuestos no solicitados.
- Resumen ejecutivo: 1 párrafo corto (4 a 6 líneas).
- Beneficios: 3 a 4 puntos, una frase cada uno.
- Alcance, exclusiones y entregables: 3 a 5 ítems por lista, redactados de forma directa.
- Análisis operativo: 3 a 5 pasos de un solo nivel (7.1, 7.2…). Sin subpasos. Cada explicación: 2 a 4 oraciones.
- Describe solo lo esencial para entender y aprobar el cambio.`;
  }
  if (level <= 7) {
    return `FILTRO DE NIVEL DE DETALLE (Nivel ${level} de 10) — ESTÁNDAR:
- Cobertura completa y operativa, sin ser exhaustivo.
- Resumen ejecutivo: 1 a 2 párrafos.
- Beneficios: 5 a 7 puntos con justificación breve.
- Alcance, exclusiones y entregables: 5 a 8 ítems por lista.
- Análisis operativo: 6 a 10 pasos de un solo nivel (7.1, 7.2…). Sin subpasos 7.1.1. Cada paso con un párrafo claro (ubicación, componente y comportamiento).
- Incluye el contexto suficiente para ejecutar el cambio.`;
  }
  return `FILTRO DE NIVEL DE DETALLE (Nivel ${level} de 10) — EXHAUSTIVO / PROFUNDO:
- Máxima granularidad. Documenta decisiones, excepciones, precondiciones, postcondiciones y casos borde.
- Resumen ejecutivo: 2 a 3 párrafos densos.
- Beneficios: 8 a 12 puntos con justificación.
- Alcance, exclusiones y entregables: 8 a 12 ítems detallados por lista.
- Análisis operativo: 10 a 16 pasos de un solo nivel. Sin subpasos ni subpasos de subpasos. Cada paso con 2 a 4 párrafos (ubicación, componente, etiqueta, comportamiento, validaciones, excepciones y riesgos).
- Cruza cada imagen adjunta con explicación profunda y referencias explícitas [IMAGEN_n].
- No omitas trazabilidad ni riesgos residuales relevantes.`;
}

function getParaphraseLevelGuidance(level: number): string {
  if (level <= 3) {
    return `FILTRO DE NIVEL DE PARAFRASEO (Nivel ${level} de 10) — FIDELIDAD / MÍNIMO:
- El analista ya trajo el contenido redactado o el planteamiento "como va cada cosa".
- Conserva al máximo la redacción original: términos, orden, nombres de campos, rutas y frases del analista.
- Solo corrige ortografía, puntuación y formato de secciones. No inventes contenido ni cambies el sentido.
- No sustituyas vocabulario corporativo si el original ya es claro.
- Si hay que estructurar (listas, pasos), usa el texto original casi literal.`;
  }
  if (level <= 7) {
    return `FILTRO DE NIVEL DE PARAFRASEO (Nivel ${level} de 10) — EQUILIBRIO:
- Mantén ideas, requisitos, orden y datos del original.
- Permite un pulido ligero de estilo corporativo Advansys sin reescribir de cero.
- Puedes unificar tono y claridad, pero no elimines matices ni pasos que el analista ya definió.`;
  }
  return `FILTRO DE NIVEL DE PARAFRASEO (Nivel ${level} de 10) — REESCRITURA LIBRE:
- Reescribe con estilo corporativo formal de Advansys, más fluido y profesional.
- Conserva el significado, alcance y hechos; puedes reorganizar frases para mayor claridad.
- No cambies cifras, nombres propios, tickets ni decisiones de negocio.`;
}

const proposalResponseSchema = {
  type: Type.OBJECT,
  properties: {
    resumenEjecutivo: { type: Type.STRING },
    beneficios: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    alcanceExclusionesEntregables: {
      type: Type.OBJECT,
      properties: {
        alcance: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        exclusiones: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        entregables: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["alcance", "exclusiones", "entregables"],
    },
    objetivo: { type: Type.STRING },
    descripcion: { type: Type.STRING },
    indiceAnalisisOperativo: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    analisisOperativo: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          paso: { type: Type.INTEGER },
          titulo: { type: Type.STRING },
          explicacion: { type: Type.STRING },
          referenciaImagen: { type: Type.STRING },
        },
        required: ["paso", "titulo", "explicacion"],
      },
    },
    descargo: { type: Type.STRING },
  },
  required: [
    "resumenEjecutivo",
    "beneficios",
    "alcanceExclusionesEntregables",
    "objetivo",
    "descripcion",
    "indiceAnalisisOperativo",
    "analisisOperativo",
    "descargo",
  ],
};

const sourceAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    premisa: { type: Type.STRING },
    incidencia: { type: Type.STRING },
    cuestionantes: { type: Type.STRING },
    flujoActual: { type: Type.STRING },
    imageNotes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["index", "title", "description"],
      },
    },
  },
  required: ["premisa", "incidencia", "cuestionantes", "flujoActual"],
};

function buildStructuredRequirements(parts: {
  premisa?: string;
  incidencia?: string;
  cuestionantes?: string;
  flujoActual?: string;
}): string {
  const blocks: string[] = [];
  if (parts.premisa?.trim()) blocks.push(`1. PREMISA:\n${parts.premisa.trim()}`);
  if (parts.incidencia?.trim()) blocks.push(`2. INCIDENCIA:\n${parts.incidencia.trim()}`);
  if (parts.cuestionantes?.trim()) blocks.push(`3. CUESTIONANTES:\n${parts.cuestionantes.trim()}`);
  if (parts.flujoActual?.trim()) blocks.push(`4. FLUJO ACTUAL:\n${parts.flujoActual.trim()}`);
  return blocks.join("\n\n");
}

function fallbackStructuredRequirements(sourceText: string, fileName: string): string {
  return buildStructuredRequirements({
    premisa: `Documento de origen: ${fileName}\n\n${sourceText.slice(0, 12000)}`,
  });
}

// API Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

function defaultBackupDirectory(): string {
  return path.join(process.cwd(), "backups");
}

app.get("/api/backup-folder", async (_req, res) => {
  const directory = defaultBackupDirectory();
  try {
    await fs.mkdir(directory, { recursive: true });
    res.json({ success: true, path: directory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "No se pudo crear la carpeta de copias." });
  }
});

app.post("/api/save-backup", async (req, res) => {
  try {
    const { directory, filename, content } = req.body || {};
    if (!directory || !filename || content == null) {
      return res.status(400).json({
        success: false,
        error: "Indica la carpeta, el nombre del archivo y el contenido.",
      });
    }

    const safeName = String(filename).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_");
    if (!safeName.toLowerCase().endsWith(".json")) {
      return res.status(400).json({ success: false, error: "Solo se permiten archivos .json." });
    }

    const dir = path.resolve(String(directory));
    if (!path.isAbsolute(dir)) {
      return res.status(400).json({ success: false, error: "La ruta de la carpeta debe ser absoluta (ej. C:\\\\AdvaDocuIA\\\\backups)." });
    }

    await fs.mkdir(dir, { recursive: true });
    const fullPath = path.resolve(dir, safeName);
    const relative = path.relative(dir, fullPath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return res.status(400).json({ success: false, error: "Nombre de archivo inválido." });
    }

    const json = typeof content === "string" ? content : JSON.stringify(content, null, 2);
    await fs.writeFile(fullPath, json, "utf8");
    return res.json({
      success: true,
      path: fullPath,
      folder: dir,
      filename: safeName,
    });
  } catch (error: any) {
    console.error("Error saving backup to disk:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "No se pudo escribir el archivo en disco.",
    });
  }
});

app.post("/api/analyze-source-document", async (req, res) => {
  try {
    const { fileName, mimeType, dataBase64, metadata } = req.body || {};
    if (!fileName || !dataBase64 || typeof dataBase64 !== "string") {
      return res.status(400).json({
        success: false,
        error: "Sube un archivo Word (.docx), texto (.txt) o Markdown (.md).",
      });
    }

    const extracted = await extractSourceDocument(String(fileName), dataBase64, mimeType);
    const truncatedText = extracted.text.slice(0, 24000);

    let rawRequirements = fallbackStructuredRequirements(truncatedText, String(fileName));
    let analyzed = false;
    let images = extracted.images.map((img, idx) => ({
      ...img,
      title: img.title || `Imagen ${idx + 1} de ${fileName}`,
      description: img.description || `Imagen extraída de ${fileName}`,
    }));

    try {
      const ai = getGeminiClient();
      const promptParts: any[] = [
        {
          text: `Analiza el documento de origen y conviértelo en el planteamiento de un requerimiento Advansys.

REGLA DE FORMATO ESTRICTA: NO utilices emojis ni emoticonos en ningún campo. Mantén un tono formal corporativo.

ARCHIVO: ${fileName}
TIPO: ${extracted.kind}
CLIENTE (si se conoce): ${metadata?.cliente || "N/A"}
PROYECTO (si se conoce): ${metadata?.nombreProyecto || "N/A"}
MÓDULO (si se conoce): ${metadata?.moduloAplicacion || "N/A"}

TEXTO EXTRAÍDO:
${truncatedText || "(sin texto; interpreta a partir de las imágenes)"}

${images.length ? `HAY ${images.length} IMÁGENES EXTRAÍDAS DEL ARCHIVO. Descríbelas en imageNotes con index 1..n, un título corto y qué muestran. Si una imagen ilustra un paso, menciónala en el texto como [IMAGEN_n].` : "No hay imágenes extraídas."}

Devuelve:
- premisa: contexto, sistema actual y qué se necesita.
- incidencia: problema u oportunidad actual.
- cuestionantes: dudas, riesgos o puntos a resolver (viñetas).
- flujoActual: cómo se hace hoy, en pasos numerados.
- imageNotes: título y descripción de cada imagen extraída.

No inventes tickets, cifras ni nombres que no estén en el documento. Si falta una sección, déjala breve y honesta con lo que sí se puede inferir.`,
        },
      ];

      images.slice(0, 8).forEach((img) => {
        const matches = img.dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (!matches) return;
        promptParts.push({
          inlineData: { mimeType: matches[1], data: matches[2] },
        });
      });

      const { text: textOutput } = await generateContentWithFallback({
        contents: { parts: promptParts },
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: sourceAnalysisSchema,
        },
      });
      if (textOutput) {
        const parsed = JSON.parse(textOutput);
        const structured = buildStructuredRequirements(parsed);
        if (structured.trim()) {
          rawRequirements = structured;
          analyzed = true;
        }
        if (Array.isArray(parsed.imageNotes)) {
          images = images.map((img, idx) => {
            const note = parsed.imageNotes.find((n: any) => Number(n?.index) === idx + 1);
            if (!note) return img;
            return {
              ...img,
              title: String(note.title || img.title).slice(0, 120),
              description: String(note.description || img.description).slice(0, 400),
            };
          });
        }
      }
    } catch (aiError: any) {
      console.warn("Source document AI analysis fallback:", aiError?.message || aiError);
    }

    res.json({
      success: true,
      analyzed,
      kind: extracted.kind,
      fileName,
      rawRequirements,
      images,
      imageCount: images.length,
      textChars: extracted.text.length,
    });
  } catch (error: any) {
    console.error("Error analyzing source document:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "No se pudo leer o analizar el archivo.",
    });
  }
});

async function handleAgentInterview(req: express.Request, res: express.Response) {
  try {
    const { stage, rawRequirements, metadata, agentConfig, answers } = req.body;
    if (!rawRequirements || typeof rawRequirements !== "string") {
      return res.status(400).json({ success: false, error: "Las notas o requerimientos son obligatorios." });
    }

    const ai = getGeminiClient();
    const persona = agentPersonaBlock(agentConfig);
    const idioma = agentConfig?.idioma === "en" ? "English" : "español formal";
    const metaLine = `Cliente: ${metadata?.cliente || "N/A"}. Proyecto: ${metadata?.nombreProyecto || "N/A"}. Ticket: ${metadata?.ticketNo || "N/A"}.`;

    if (stage === "understand") {
      const qa = Array.isArray(answers)
        ? answers.map((a: any) => `P: ${a?.question || ""}\nR: ${a?.answer || ""}`).join("\n\n")
        : "";
      const { text: textOutput } = await generateContentWithFallback({
        contents: `${metaLine}\n\nREQUERIMIENTOS:\n${rawRequirements}\n\nRESPUESTAS DE LA ENTREVISTA:\n${qa}`,
        config: {
          systemInstruction: `Resume lo entendido para que el analista lo confirme antes de redactar el documento. Idioma: ${idioma}.${persona}
No inventes alcance. Si falta dato, ponlo en pendientes.`,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              objetivo: { type: Type.STRING },
              alcance: { type: Type.STRING },
              reglas: { type: Type.STRING },
              supuestos: { type: Type.STRING },
              pendientes: { type: Type.STRING },
            },
            required: ["objetivo", "alcance", "reglas", "supuestos", "pendientes"],
          },
        },
      });
      if (!textOutput) throw new Error("No se obtuvo el resumen.");
      let understanding;
      try {
        understanding = JSON.parse(textOutput);
      } catch {
        throw new Error("Gemini devolvió un resumen inválido. Reintenta.");
      }
      return res.json({ success: true, understanding });
    }

    const { text: textOutput } = await generateContentWithFallback({
      contents: `${metaLine}\n\nREQUERIMIENTOS:\n${rawRequirements}`,
      config: {
        systemInstruction: `Eres un analista que entrevista al usuario ANTES de redactar. Idioma: ${idioma}.${persona}
Haz 5 a 8 preguntas concretas sobre alcance, excepciones, reglas de negocio, validaciones, impactos y criterios de aceptación.
No propongas la solución ni redactes el documento.`,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["questions"],
        },
      },
    });
    if (!textOutput) throw new Error("No se obtuvieron preguntas.");
    let parsed: { questions?: string[] };
    try {
      parsed = JSON.parse(textOutput);
    } catch {
      throw new Error("Gemini devolvió preguntas inválidas. Reintenta.");
    }
    return res.json({ success: true, questions: parsed.questions || [] });
  } catch (error: any) {
    console.error("Error in agent interview:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Error al ejecutar la entrevista.",
    });
  }
}

// API Route: Generate Technical Proposal with Gemini 1.5 Pro / 3.6 Flash
app.post("/api/generate-proposal", async (req, res) => {
  if (req.body?.stage === "questions" || req.body?.stage === "understand") {
    return handleAgentInterview(req, res);
  }

  try {
    const { metadata, rawRequirements, images, agentConfig, clarifications } = req.body;

    if (!rawRequirements || typeof rawRequirements !== 'string') {
      return res.status(400).json({ error: "Las notas o requerimientos son obligatorios." });
    }

    const ai = getGeminiClient();

    const techLevel = clampLevel(metadata?.technicalLevel, 7);
    const detailLevel = clampLevel(metadata?.detailLevel, 6);
    const paraphraseLevel = clampLevel(metadata?.paraphraseLevel, 3);
    const detailGuidance = getDetailLevelGuidance(detailLevel);
    const paraphraseGuidance = getParaphraseLevelGuidance(paraphraseLevel);

    // Prepare text prompt parts
    let promptText = `
METADATOS DEL PROYECTO ADVANSYS:
- Cliente: ${metadata?.cliente || 'N/A'}
- Fecha: ${metadata?.fecha || 'N/A'}
- Ticket No.: ${metadata?.ticketNo || 'N/A'}
- Guía No.: ${metadata?.guiaNo || 'N/A'}
- Propuesta No.: ${metadata?.propuestaNo || 'N/A'}
- Nombre del Proyecto: ${metadata?.nombreProyecto || 'N/A'}
- Módulo/Aplicación: ${metadata?.moduloAplicacion || 'N/A'}
- Nivel de Tecnicismo Solicitado: ${techLevel} / 10
- Nivel de Detalle Solicitado: ${detailLevel} / 10
- Nivel de Parafraseo Solicitado: ${paraphraseLevel} / 10

PLANTEAMIENTO Y REQUERIMIENTOS DEL CLIENTE (PREMISA, INCIDENCIA, CUESTIONANTES, FLUJO ACTUAL):
${rawRequirements}
${typeof clarifications === 'string' && clarifications.trim() ? `\n${clarifications.trim()}\n` : ''}
`;

    if (images && Array.isArray(images) && images.length > 0) {
      promptText += `\nIMÁGENES Y DIAGRAMAS ADJUNTOS POR EL ANALISTA (${images.length} imágenes):\n`;
      images.forEach((img: any, idx: number) => {
        promptText += `\n[IMAGEN_${idx + 1}]:
- Título: ${img.title || `Diagrama ${idx + 1}`}
- Descripción Contextual: ${img.description || 'Sin descripción'}
`;
      });
    }

    // Prepare multimodal image parts for Gemini
    const contentsParts: any[] = [{ text: promptText }];

    if (images && Array.isArray(images)) {
      images.forEach((img: any) => {
        if (img.dataUrl && typeof img.dataUrl === 'string') {
          // Extract MIME type and base64 string
          const matches = img.dataUrl.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            contentsParts.push({
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            });
          }
        }
      });
    }

    const customDescargo = metadata?.customTitles?.defaultDescargo?.trim();
    const descargoInstruction = customDescargo
      ? `8. Descargo (Usa exactamente la siguiente cláusula corporativa configurada: "${customDescargo}")`
      : `8. Descargo (Usa la cláusula oficial: "El contenido de este análisis refleja con precisión los resultados que serán entregados, sin adiciones ni omisiones. Cualquier observación o inquietud que el cliente pueda tener deberá ser expresada y documentada debidamente para ser considerada y, en su caso, incorporada al análisis. No se realizarán ajustes adicionales a menos que se notifiquen y documenten de acuerdo con este procedimiento.")`;

    const systemInstruction = `Eres un Arquitecto de Software Senior y Líder del Departamento de Análisis & Riesgo de Advansys.
Tu trabajo es redactar análisis técnicos formales, guías operativas y propuestas de desarrollo profesionales siguiendo el formato y estilo corporativo de Advansys (referencia Guía Ticket 0000039443).
${agentPersonaBlock(agentConfig)}

PROHIBICIÓN ESTRICTA DE EMOJIS:
NO utilices emojis, emoticonos ni caracteres gráficos informales en ninguna parte de la propuesta (ni en títulos, ni en viñetas, ni en descripciones, ni en descargos). El formato debe ser estrictamente corporativo, sobrio y profesional.

FILTRO DE NIVEL DE TECNICISMO Y AUDIENCIA OBJETIVO (Nivel ${techLevel} de 10):
- Nivel 1 a 3 (Alta Gerencia / Directiva / Ejecutivo):
  • Audiencia: Presidentes, Directores de Riesgo y Finanzas de Entidades Financieras.
  • Estilo: Valor estratégico, mitigación de riesgos operativos, continuidad de negocio y gobernanza sin jerga técnica de código ni BD.
- Nivel 4 a 7 (Operativo / Analistas Funcionales - Estándar Advansys):
  • Audiencia: Gerentes de Operaciones, Analistas de Procesos y Usuarios Clave de Sistemas.
  • Estilo: Guías de Análisis & Riesgo con rutas de navegación en formularios, lógica de negocio y parámetros globales.
  • Formato de Análisis Operativo: Subsecciones estructuradas (ej: 4.1 Ajuste de formularios, 4.2 Controles y alcance) indicando Ubicación, Componente, Etiqueta oficial y Comportamiento.
- Nivel 8 a 10 (TI, Arquitectura de Software & Desarrollo):
  • Audiencia: Arquitectos de TI, Desarrolladores Senior y Administradores de Base de Datos.
  • Estilo: Especificación técnica exhaustiva con esquemas de BD, nombres de campos, firmas de eventos UI, validaciones de código, APIs REST/SOAP y Audit Trail.

${detailGuidance}

${paraphraseGuidance}

IMPORTANTE: El tecnicismo define el LENGUAJE y la audiencia. El detalle define la EXTENSIÓN. El parafraseo define cuánto se REESCRIBE el texto del analista. Aplica los tres de forma independiente. Si el parafraseo es bajo, prioriza fidelidad al planteamiento original sobre el estilo.

ESTRUCTURA DEL DOCUMENTO:
1. Resumen Ejecutivo
2. Beneficios de la Propuesta (puntos clave)
3. Alcance, Exclusiones y Entregables
4. Objetivo
5. Descripción
6. Índice Análisis Operativo
7. Análisis Operativo (Solo pasos de un nivel: 7.1, 7.2, 7.3. NO uses subpasos 7.1.1 ni subpasos de subpasos 7.1.1.1. Cada ítem es un paso independiente en analisisOperativo. Ajusta cantidad de pasos y profundidad de cada explicación al nivel de detalle. Para cada imagen adjunta, genera una explicación acorde al detalle solicitado y referencia explícitamente a [IMAGEN_1], [IMAGEN_2], etc.)
${descargoInstruction}

Retorna la información estrictamente en formato JSON según el schema especificado.`;

    const { text: textOutput } = await generateContentWithFallback({
      contents: { parts: contentsParts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: proposalResponseSchema,
      },
    });
    if (!textOutput) {
      throw new Error("No se obtuvo respuesta de la API de Gemini.");
    }

    const proposalData = JSON.parse(textOutput);
    res.json({ success: true, proposal: proposalData });

  } catch (error: any) {
    console.error("Error generating proposal with Gemini:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Error al procesar la propuesta técnica con IA.",
    });
  }
});

app.post("/api/agent-interview", handleAgentInterview);

// API Route: Refine / Enhance Manual Proposal Draft with Gemini
app.post("/api/refine-proposal", async (req, res) => {
  try {
    const { proposal, metadata, rawRequirements, images, action, sectionKey } = req.body;

    if (!proposal) {
      return res.status(400).json({ error: "No se proporcionó el borrador de propuesta a mejorar." });
    }

    const ai = getGeminiClient();

    const techLevel = clampLevel(metadata?.technicalLevel, 7);
    const detailLevel = clampLevel(metadata?.detailLevel, 6);
    const paraphraseLevel = clampLevel(metadata?.paraphraseLevel, 3);
    const detailGuidance = getDetailLevelGuidance(detailLevel);
    const paraphraseGuidance = getParaphraseLevelGuidance(paraphraseLevel);

    let actionInstruction = "";
    if (action === "polish_all") {
      actionInstruction = `TAREA DE IA: Calibrar TODO el documento al Nivel de Tecnicismo ${techLevel}/10, Detalle ${detailLevel}/10 y Parafraseo ${paraphraseLevel}/10.
Si el parafraseo es bajo, NO reescribas: conserva la redacción del analista y limita los cambios a ortografía, formato y estructura.
Si el parafraseo es alto, puedes reescribir con estilo corporativo conservando hechos y alcance.`;
    } else if (action === "complete_missing") {
      actionInstruction = `TAREA DE IA: Conserva ÍNTEGRAMENTE cualquier texto que el analista ya haya escrito (respeta el parafraseo ${paraphraseLevel}/10 sobre ese texto). Completa ÚNICAMENTE los campos vacíos con Tecnicismo ${techLevel}/10 y Detalle ${detailLevel}/10.`;
    } else if (action === "refine_section" && sectionKey) {
      actionInstruction = `TAREA DE IA: Trabaja la sección "${sectionKey}" con Tecnicismo ${techLevel}/10, Detalle ${detailLevel}/10 y Parafraseo ${paraphraseLevel}/10.
Conserva intactas las demás secciones y retorna el JSON completo.`;
    } else {
      actionInstruction = `TAREA DE IA: Revisa el borrador con tecnicismo ${techLevel}/10, detalle ${detailLevel}/10 y parafraseo ${paraphraseLevel}/10.`;
    }

    let promptText = `
${actionInstruction}

${detailGuidance}

${paraphraseGuidance}

METADATOS DEL PROYECTO:
- Cliente: ${metadata?.cliente || 'N/A'}
- Proyecto: ${metadata?.nombreProyecto || 'N/A'}
- Módulo: ${metadata?.moduloAplicacion || 'N/A'}
- Nivel de Tecnicismo Requerido: ${techLevel} / 10
- Nivel de Detalle Requerido: ${detailLevel} / 10
- Nivel de Parafraseo Requerido: ${paraphraseLevel} / 10

BORRADOR ACTUAL REDACTADO POR EL ANALISTA (JSON):
${JSON.stringify(proposal, null, 2)}

NOTAS / REQUERIMIENTOS EN BRUTO DE RESPALDO:
${rawRequirements || 'Sin notas adicionales'}
`;

    if (images && Array.isArray(images) && images.length > 0) {
      promptText += `\nIMÁGENES ADJUNTAS DE REFERENCIA (${images.length}):\n`;
      images.forEach((img: any, idx: number) => {
        promptText += `\n[IMAGEN_${idx + 1}]: Título: ${img.title || 'Diagrama'} | Descripción: ${img.description || ''}`;
      });
    }

    const contentsParts: any[] = [{ text: promptText }];

    if (images && Array.isArray(images)) {
      images.forEach((img: any) => {
        if (img.dataUrl && typeof img.dataUrl === 'string') {
          const matches = img.dataUrl.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            contentsParts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2],
              },
            });
          }
        }
      });
    }

    const { text: textOutput } = await generateContentWithFallback({
      contents: { parts: contentsParts },
      config: {
        systemInstruction: "Eres un Editor Técnico Senior de Software en Advansys. Tu labor es actuar como co-piloto de IA asistiendo al analista humano en la redacción manual de su propuesta técnica.\n\nREGLA OBLIGATORIA: NO uses emojis ni emoticonos en ningún texto bajo ninguna circunstancia.",
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: proposalResponseSchema,
      },
    });
    if (!textOutput) {
      throw new Error("No se obtuvo respuesta de la API de Gemini.");
    }

    const updatedProposal = JSON.parse(textOutput);
    res.json({ success: true, proposal: updatedProposal });

  } catch (error: any) {
    console.error("Error refining proposal with Gemini:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Error al perfeccionar la propuesta con IA.",
    });
  }
});

// Endpoint to generate professional Slide Decks (.pptx data) using Gemini AI
app.post("/api/generate-slides", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { metadata = {}, rawRequirements = '', images = [], proposal = null } = req.body;

    const cliente = metadata.cliente || 'Cliente Corporativo';
    const proyecto = metadata.nombreProyecto || 'Propuesta Técnica';
    const ticketNo = metadata.ticketNo || 'TK-2026';

    let contextText = `Genera una presentación ejecutiva de diapositivas (Slide Deck) de alta calidad para Advansys Technology.
Cliente: ${cliente}
Proyecto: ${proyecto}
Ticket: ${ticketNo}
Fecha: ${metadata.fecha || new Date().toLocaleDateString()}

REQUERIMIENTOS Y NOTAS:
${rawRequirements || (proposal ? JSON.stringify(proposal) : 'Sin notas adicionales')}
`;

    if (proposal) {
      contextText += `\nDOCUMENTO BASE:
Resumen: ${proposal.resumenEjecutivo || ''}
Objetivo: ${proposal.objetivo || ''}
Descripción: ${proposal.descripcion || ''}
Beneficios: ${JSON.stringify(proposal.beneficios || [])}
Alcance: ${JSON.stringify(proposal.alcanceExclusionesEntregables || {})}
Pasos operativos: ${JSON.stringify(proposal.analisisOperativo || [])}
`;
    }

    const slideDeckSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        subtitle: { type: Type.STRING },
        client: { type: Type.STRING },
        project: { type: Type.STRING },
        ticketNo: { type: Type.STRING },
        author: { type: Type.STRING },
        date: { type: Type.STRING },
        slides: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              slideNumber: { type: Type.INTEGER },
              layout: { 
                type: Type.STRING,
                enum: ['title', 'bullets', 'two-column', 'image-text', 'steps', 'cards', 'conclusion']
              },
              category: { type: Type.STRING },
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              bullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              leftTitle: { type: Type.STRING },
              leftBullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              rightTitle: { type: Type.STRING },
              rightBullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              cards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ['title', 'description']
                }
              },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ['stepNumber', 'title', 'description']
                }
              },
              speakerNotes: { type: Type.STRING },
              imageRef: { type: Type.STRING }
            },
            required: ['id', 'slideNumber', 'layout', 'title']
          }
        }
      },
      required: ['title', 'client', 'project', 'slides']
    };

    const { text: textOutput } = await generateContentWithFallback({
      contents: contextText,
      config: {
        systemInstruction: `Eres un Diseñador y Consultor de Presentaciones Ejecutivas Senior en Advansys.
Tu objetivo es estructurar una presentación de 6 a 8 diapositivas profesionales, dinámicas y concisas para la gerencia y equipos técnicos.

PROHIBICIÓN ESTRICTA DE EMOJIS:
NO utilices emojis, emoticonos ni pictogramas informales en ningún título, viñeta, tarjeta, paso o nota de orador. Toda la presentación debe ser 100% formal y corporativa.

Estructura recomendada:
1. Portada (layout: 'title')
2. Lo Expuesto / Situación Actual (layout: 'bullets', category: '01. LO EXPUESTO', título: 'Lo Expuesto', presenta fielmente el requerimiento/resumen expuesto)
3. Beneficios Clave para el Negocio (layout: 'cards', 4 tarjetas)
4. Alcance & Entregables (layout: 'two-column', izquierda alcance, derecha entregables)
5. Solución & Arquitectura Técnica (layout: 'image-text' o 'bullets')
6. Flujo Operativo en Pasos (layout: 'steps', 4 pasos claros)
7. Plan de Aprobación & Siguientes Pasos (layout: 'conclusion')
Para cada diapositiva, incluye notas del orador útiles ('speakerNotes') que guíen al expositor durante la reunión.`,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: slideDeckSchema,
      }
    });
    if (!textOutput) {
      throw new Error("No se pudo generar la presentación.");
    }

    const deck = JSON.parse(textOutput);
    res.json({ success: true, deck });
  } catch (error: any) {
    console.error("Error generating slides with Gemini:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Error al generar la presentación con IA.",
    });
  }
});

// Endpoint to generate internal technical documentation linked to proposal
app.post("/api/generate-technical-doc", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { metadata = {}, rawRequirements = '', images = [], proposal = null } = req.body;

    const cliente = metadata.cliente || 'Cliente Corporativo';
    const proyecto = metadata.nombreProyecto || 'Desarrollo de Software';
    const ticketNo = metadata.ticketNo || 'TK-2026';
    const modulo = metadata.moduloAplicacion || 'Módulo Principal';

    const imageList = Array.isArray(images) ? images : [];
    const imageHints = imageList
      .map((img: any, i: number) => `- [IMAGEN_${i + 1}]: ${img?.title || 'Captura'} ${img?.description ? `— ${img.description}` : ''}`)
      .join('\n');

    let promptContext = `Genera la DOCUMENTACIÓN TÉCNICA INTERNA Y ESPECIFICACIÓN DE DESARROLLO para Ingeniería de Software y QA en Advansys.
Este documento es de USO INTERNO. No copies el tono comercial de la propuesta: traduce el alcance a arquitectura, navegación, datos, seguridad y código.

DATOS DEL PROYECTO:
- Cliente: ${cliente}
- Nombre del Proyecto: ${proyecto}
- Ticket No: ${ticketNo}
- Módulo / Aplicación: ${modulo}

REQUERIMIENTOS Y NOTAS DEL ANALISTA:
${rawRequirements || 'No se adjuntaron notas directas.'}
`;

    if (proposal) {
      promptContext += `\nPROPUESTA TÉCNICA YA REDACTADA (fuente principal — deriva de aquí la spec interna):
Resumen: ${proposal.resumenEjecutivo || ''}
Objetivo: ${proposal.objetivo || ''}
Descripción: ${proposal.descripcion || ''}
Beneficios: ${JSON.stringify(proposal.beneficios || [])}
Alcance: ${JSON.stringify(proposal.alcanceExclusionesEntregables?.alcance || [])}
Exclusiones: ${JSON.stringify(proposal.alcanceExclusionesEntregables?.exclusiones || [])}
Entregables: ${JSON.stringify(proposal.alcanceExclusionesEntregables?.entregables || [])}
Índice operativo: ${JSON.stringify(proposal.indiceAnalisisOperativo || [])}
Pasos operativos: ${JSON.stringify(proposal.analisisOperativo || [])}
`;
    }

    if (imageHints) {
      promptContext += `\nIMÁGENES DISPONIBLES (inserta las etiquetas exactas en Flujo o Diseño donde aporten):\n${imageHints}\n`;
    }

    promptContext += `
FORMATO OBLIGATORIO DE CADA CAMPO DE TEXTO (se mostrará en un editor y se exportará a Word/PDF):
- Usa saltos de línea reales.
- Viñetas con el carácter "• " (no uses guiones sueltos como única viñeta).
- Sub-viñetas con "  - ".
- Listas numeradas "1. 2. 3." en el flujo operativo.
- Encabeza cada bloque con una línea de título seguida de dos puntos, por ejemplo: "Ruta de menú:" / "Endpoints:" / "Validaciones:".
- NO uses markdown (#, **, \`\`\`) ni emojis.
- En Flujo y Diseño, si hay tablas, incluye las etiquetas [TABLA_1], [TABLA_2] en el lugar donde deben aparecer.
- Si hay imágenes, incluye [IMAGEN_1], [IMAGEN_2] en contexto.

TABLAS ESTRUCTURADAS:
Devuelve 1 a 3 tablas útiles (catálogo de endpoints, entidades de BD o matriz de roles). Cada fila en "rows" es un objeto { "cells": ["...", "..."] } alineado con headers.`;

    const technicalDocSchema = {
      type: Type.OBJECT,
      properties: {
        ruta: {
          type: Type.STRING,
          description: "Ruta de navegación exacta en el sistema, menú, pantallas/formularios, endpoints y URLs REST de backend involucradas."
        },
        flujoOperativo: {
          type: Type.STRING,
          description: "Flujo operativo interno detallado paso a paso: disparador de interfaz, validaciones en frontend, capa de servicios, lógica de negocio y persistencia."
        },
        diseno: {
          type: Type.STRING,
          description: "Diseño técnico de la interfaz y estructura de datos: controles/grillas visuales, entidades de base de datos, tablas maestras y detalles, campos y tipos de datos."
        },
        consideracionesTecnicas: {
          type: Type.STRING,
          description: "Consideraciones técnicas y de seguridad: control de concurrencia, transacciones ACID, validaciones de integridad, roles/permisos RBAC, auditoría y rendimiento."
        },
        codigoEjemplo: {
          type: Type.STRING,
          description: "Script SQL de creación o consulta de tablas, scripts DDL/DML, payload JSON de endpoint o snippet de código de ejemplo para desarrollo."
        },
        modulosAfectados: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        tablasBD: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        tables: {
          type: Type.ARRAY,
          description: "Tablas estructuradas (endpoints, BD o roles) para insertar en el documento.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              headers: { type: Type.ARRAY, items: { type: Type.STRING } },
              rows: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    cells: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["cells"],
                },
              },
            },
            required: ["title", "headers", "rows"],
          },
        },
      },
      required: ["ruta", "flujoOperativo", "diseno", "consideracionesTecnicas", "codigoEjemplo"]
    };

    const { text: textOutput } = await generateContentWithFallback({
      contents: promptContext,
      config: {
        systemInstruction: `Eres el Arquitecto de Software y Líder Técnico Senior en Advansys.
Redactas la Especificación Técnica Interna para desarrolladores y QA. NO repitas el lenguaje comercial de la propuesta: conviértela en spec ejecutable.

Estructura de contenido:
1. Ruta: breadcrumbs de menú, nombre de pantalla/formulario, microservicios y endpoints REST (método + path).
2. Flujo operativo: secuencia numerada UI -> validación -> API -> reglas -> persistencia -> respuesta/auditoría.
3. Diseño: componentes visuales y modelo de datos (entidades, PK/FK, campos).
4. Consideraciones: RBAC, transacciones ACID, concurrencia, errores, rendimiento, auditoría.
5. Código: SQL DDL/DML o payload JSON realista, listo para copiar.

Formato: texto plano corporativo con "• " y listas "1. 2. 3.", títulos de bloque con dos puntos, sin emojis y sin markdown.
Si la propuesta ya existe, deriva nombres de módulos, pantallas y reglas desde ella. Completa huecos técnicos de forma coherente.`,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: technicalDocSchema,
      }
    });
    if (!textOutput) {
      throw new Error("No se pudo generar la documentación técnica.");
    }

    const techDoc = JSON.parse(textOutput);
    techDoc.lastUpdated = new Date().toISOString();

    const rawTables = Array.isArray(techDoc.tables) ? techDoc.tables : [];
    techDoc.tables = rawTables.slice(0, 4).map((t: any, i: number) => ({
      id: `tbl-ai-${Date.now()}-${i + 1}`,
      title: String(t?.title || `Tabla ${i + 1}`),
      headers: Array.isArray(t?.headers) ? t.headers.map((h: any) => String(h || '')) : [],
      rows: Array.isArray(t?.rows)
        ? t.rows.map((row: any) =>
            Array.isArray(row?.cells)
              ? row.cells.map((c: any) => String(c || ''))
              : Array.isArray(row)
                ? row.map((c: any) => String(c || ''))
                : []
          )
        : [],
    }));

    if (techDoc.tables.length > 0) {
      const tags = techDoc.tables.map((_: any, i: number) => `[TABLA_${i + 1}]`).join('\n');
      const diseno = String(techDoc.diseno || '');
      if (!/\[TABLA_\d+\]/i.test(diseno)) {
        techDoc.diseno = diseno.trim() ? `${diseno.trim()}\n\n${tags}` : tags;
      }
    }

    res.json({ success: true, technicalDoc: techDoc });
  } catch (error: any) {
    console.error("Error generating technical doc with Gemini:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Error al generar la documentación técnica con IA.",
    });
  }
});

// Vite or Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor Advansys DocGen escuchando en http://localhost:${PORT}`);
  });
}

startServer();
