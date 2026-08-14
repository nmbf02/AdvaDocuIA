import express from "express";
import path from "path";
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
- Análisis operativo: 3 a 5 pasos. Cada explicación: 2 a 4 oraciones.
- Describe solo lo esencial para entender y aprobar el cambio.`;
  }
  if (level <= 7) {
    return `FILTRO DE NIVEL DE DETALLE (Nivel ${level} de 10) — ESTÁNDAR:
- Cobertura completa y operativa, sin ser exhaustivo.
- Resumen ejecutivo: 1 a 2 párrafos.
- Beneficios: 5 a 7 puntos con justificación breve.
- Alcance, exclusiones y entregables: 5 a 8 ítems por lista.
- Análisis operativo: 6 a 10 pasos. Cada paso con un párrafo claro (ubicación, componente y comportamiento).
- Incluye el contexto suficiente para ejecutar el cambio.`;
  }
  return `FILTRO DE NIVEL DE DETALLE (Nivel ${level} de 10) — EXHAUSTIVO / PROFUNDO:
- Máxima granularidad. Documenta decisiones, excepciones, precondiciones, postcondiciones y casos borde.
- Resumen ejecutivo: 2 a 3 párrafos densos.
- Beneficios: 8 a 12 puntos con justificación.
- Alcance, exclusiones y entregables: 8 a 12 ítems detallados por lista.
- Análisis operativo: 10 a 16 pasos. Cada paso con 2 a 4 párrafos (ubicación, componente, etiqueta, comportamiento, validaciones, excepciones y riesgos).
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

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: { parts: promptParts },
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: sourceAnalysisSchema,
        },
      });

      const textOutput = response.text;
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

// API Route: Generate Technical Proposal with Gemini 1.5 Pro / 3.6 Flash
app.post("/api/generate-proposal", async (req, res) => {
  try {
    const { metadata, rawRequirements, images } = req.body;

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

    const systemInstruction = `Eres un Arquitecto de Software Senior y Líder del Departamento de Análisis & Riesgo de Advansys.
Tu trabajo es redactar análisis técnicos formales, guías operativas y propuestas de desarrollo profesionales siguiendo el formato y estilo corporativo de Advansys (referencia Guía Ticket 0000039443).

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
7. Análisis Operativo (Paso a paso. Ajusta cantidad de pasos y profundidad de cada explicación al nivel de detalle. Para cada imagen adjunta, genera una explicación acorde al detalle solicitado y referencia explícitamente a [IMAGEN_1], [IMAGEN_2], etc.)
8. Descargo (Usa la cláusula oficial: "El contenido de este análisis refleja con precisión los resultados que serán entregados, sin adiciones ni omisiones. Cualquier observación o inquietud que el cliente pueda tener deberá ser expresada y documentada debidamente para ser considerada y, en su caso, incorporada al análisis. No se realizarán ajustes adicionales a menos que se notifiquen y documenten de acuerdo con este procedimiento.")

Retorna la información estrictamente en formato JSON según el schema especificado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts: contentsParts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: proposalResponseSchema,
      },
    });

    const textOutput = response.text;
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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts: contentsParts },
      config: {
        systemInstruction: "Eres un Editor Técnico Senior de Software en Advansys. Tu labor es actuar como co-piloto de IA asistiendo al analista humano en la redacción manual de su propuesta técnica.",
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: proposalResponseSchema,
      },
    });

    const textOutput = response.text;
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
