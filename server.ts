import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

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

// API Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Route: Generate Technical Proposal with Gemini 1.5 Pro / 3.6 Flash
app.post("/api/generate-proposal", async (req, res) => {
  try {
    const { metadata, rawRequirements, images } = req.body;

    if (!rawRequirements || typeof rawRequirements !== 'string') {
      return res.status(400).json({ error: "Las notas o requerimientos son obligatorios." });
    }

    const ai = getGeminiClient();

    const techLevel = metadata?.technicalLevel || 7;

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

ESTRUCTURA DEL DOCUMENTO:
1. Resumen Ejecutivo
2. Beneficios de la Propuesta (puntos clave)
3. Alcance, Exclusiones y Entregables
4. Objetivo
5. Descripción
6. Índice Análisis Operativo
7. Análisis Operativo (Paso a paso según el nivel de tecnicismo. Para cada imagen adjunta, genera una explicación profunda y referencia explícitamente a [IMAGEN_1], [IMAGEN_2], etc.)
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

    const techLevel = metadata?.technicalLevel || 7;

    let actionInstruction = "";
    if (action === "polish_all") {
      actionInstruction = `TAREA DE IA: Refinar, corregir ortografía y calibrar el lenguaje técnico de TODO el documento redactado por el analista al Nivel de Tecnicismo ${techLevel}/10 (1-3: Alta Gerencia, 4-7: Operativo/Funcional Advansys, 8-10: TI/Arquitectura).
Asegúrate de conservar las ideas, requisitos, puntos de alcance y pasos originales, elevando la redacción al estilo corporativo formal de Advansys.`;
    } else if (action === "complete_missing") {
      actionInstruction = `TAREA DE IA: El analista ha redactado manualmente la propuesta. Revisa todas las secciones: conserva ÍNTEGRAMENTE cualquier texto que el analista ya haya escrito, y completa ÚNICAMENTE los campos vacíos utilizando las notas e imágenes adjuntas, respetando el Nivel de Tecnicismo ${techLevel}/10.`;
    } else if (action === "refine_section" && sectionKey) {
      actionInstruction = `TAREA DE IA: Enfócate específicamente en mejorar, corregir y pulir la sección: "${sectionKey}" según el Nivel de Tecnicismo ${techLevel}/10.
Conserva intactas las demás secciones del documento, retornando el JSON completo con la sección "${sectionKey}" perfeccionada profesionalmente.`;
    } else {
      actionInstruction = `TAREA DE IA: Revisa el borrador actual, perfecciona la redacción técnica para el Nivel de Tecnicismo ${techLevel}/10, valida la coherencia entre el texto y las imágenes, y entrega la propuesta mejorada.`;
    }

    let promptText = `
${actionInstruction}

METADATOS DEL PROYECTO:
- Cliente: ${metadata?.cliente || 'N/A'}
- Proyecto: ${metadata?.nombreProyecto || 'N/A'}
- Módulo: ${metadata?.moduloAplicacion || 'N/A'}
- Nivel de Tecnicismo Requerido: ${techLevel} / 10

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
