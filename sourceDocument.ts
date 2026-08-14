import path from "path";
import mammoth from "mammoth";
import JSZip from "jszip";

export interface ExtractedSourceImage {
  title: string;
  description: string;
  dataUrl: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
}

export interface ExtractedSourceDocument {
  text: string;
  images: ExtractedSourceImage[];
  kind: "docx" | "txt" | "md";
}

const MAX_IMAGES = 20;
const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
};

function extFromMime(mime: string): string {
  if (mime.includes("png")) return ".png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("gif")) return ".gif";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("svg")) return ".svg";
  if (mime.includes("bmp")) return ".bmp";
  return ".png";
}

function decodeBase64Payload(dataBase64: string): Buffer {
  const cleaned = dataBase64.includes(",")
    ? dataBase64.slice(dataBase64.indexOf(",") + 1)
    : dataBase64;
  return Buffer.from(cleaned, "base64");
}

function detectKind(fileName: string, mimeType?: string): ExtractedSourceDocument["kind"] | null {
  const lower = fileName.toLowerCase();
  const mime = (mimeType || "").toLowerCase();
  if (lower.endsWith(".docx") || mime.includes("wordprocessingml")) return "docx";
  if (lower.endsWith(".md") || lower.endsWith(".markdown") || mime === "text/markdown") return "md";
  if (lower.endsWith(".txt") || mime.startsWith("text/plain")) return "txt";
  return null;
}

async function extractDocxImages(buffer: Buffer): Promise<ExtractedSourceImage[]> {
  const zip = await JSZip.loadAsync(buffer);
  const mediaNames = Object.keys(zip.files)
    .filter((name) => /^word\/media\//i.test(name) && !zip.files[name].dir)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const images: ExtractedSourceImage[] = [];

  for (const name of mediaNames) {
    if (images.length >= MAX_IMAGES) break;
    const ext = path.extname(name).toLowerCase();
    const mimeType = MIME_BY_EXT[ext];
    if (!mimeType) continue;

    const bytes = await zip.files[name].async("nodebuffer");
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) continue;

    const index = images.length + 1;
    const fileName = path.basename(name);
    images.push({
      title: `Imagen ${index} del Word`,
      description: `Extraída de ${fileName}`,
      dataUrl: `data:${mimeType};base64,${bytes.toString("base64")}`,
      mimeType,
      fileName,
      fileSize: bytes.length,
    });
  }

  return images;
}

function extractMarkdownDataImages(markdown: string): ExtractedSourceImage[] {
  const images: ExtractedSourceImage[] = [];
  const re = /!\[[^\]]*\]\((data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) && images.length < MAX_IMAGES) {
    const dataUrl = match[1];
    const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    if (!mimeMatch) continue;
    const mimeType = mimeMatch[1];
    const index = images.length + 1;
    images.push({
      title: `Imagen ${index} del Markdown`,
      description: "Imagen embebida en el archivo .md",
      dataUrl,
      mimeType,
      fileName: `markdown-imagen-${index}${extFromMime(mimeType)}`,
      fileSize: Math.round((dataUrl.length * 3) / 4),
    });
  }
  return images;
}

export async function extractSourceDocument(
  fileName: string,
  dataBase64: string,
  mimeType?: string
): Promise<ExtractedSourceDocument> {
  const kind = detectKind(fileName, mimeType);
  if (!kind) {
    throw new Error("Formato no soportado. Usa Word (.docx), texto (.txt) o Markdown (.md).");
  }

  if (fileName.toLowerCase().endsWith(".doc") && !fileName.toLowerCase().endsWith(".docx")) {
    throw new Error("El formato .doc antiguo no está soportado. Guarda el archivo como .docx e inténtalo de nuevo.");
  }

  const buffer = decodeBase64Payload(dataBase64);

  if (kind === "docx") {
    const [textResult, images] = await Promise.all([
      mammoth.extractRawText({ buffer }),
      extractDocxImages(buffer),
    ]);
    const text = (textResult.value || "").replace(/\r\n/g, "\n").trim();
    if (!text && images.length === 0) {
      throw new Error("No se pudo leer texto ni imágenes en ese Word.");
    }
    return { text, images, kind };
  }

  const text = buffer.toString("utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  const images = kind === "md" ? extractMarkdownDataImages(text) : [];
  if (!text) {
    throw new Error("El archivo está vacío.");
  }
  return { text, images, kind };
}
