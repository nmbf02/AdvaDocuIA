import React, { useRef, useState } from 'react';
import { UploadedImage } from '../types';
import { FileUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SourceDocumentUploaderProps {
  existingNotes: string;
  existingImages: UploadedImage[];
  metadata?: {
    cliente?: string;
    nombreProyecto?: string;
    moduloAplicacion?: string;
  };
  onNotesChange: (notes: string) => void;
  onImagesChange?: (images: UploadedImage[]) => void;
}

const ACCEPTED = '.docx,.txt,.md,.markdown,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_BYTES = 15 * 1024 * 1024;

function remapImageTags(text: string, offset: number): string {
  if (!offset) return text;
  return text.replace(/\[IMAGEN_(\d+)\]/gi, (_, n) => `[IMAGEN_${Number(n) + offset}]`);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export const SourceDocumentUploader: React.FC<SourceDocumentUploaderProps> = ({
  existingNotes,
  existingImages,
  metadata,
  onNotesChange,
  onImagesChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const analyzeFile = async (file: File) => {
    const name = file.name.toLowerCase();
    const ok =
      name.endsWith('.docx') ||
      name.endsWith('.txt') ||
      name.endsWith('.md') ||
      name.endsWith('.markdown');

    if (!ok) {
      setStatus('error');
      setMessage('Usa un archivo .docx, .txt o .md');
      return;
    }
    if (name.endsWith('.doc') && !name.endsWith('.docx')) {
      setStatus('error');
      setMessage('El .doc antiguo no se admite. Guárdalo como .docx.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus('error');
      setMessage('El archivo supera 15 MB.');
      return;
    }

    setStatus('working');
    setMessage(name.endsWith('.docx') ? 'Leyendo Word e imágenes...' : 'Leyendo el archivo...');

    try {
      const dataBase64 = await fileToBase64(file);
      setMessage('Analizando el contenido...');

      const response = await fetch('/api/analyze-source-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          dataBase64,
          metadata,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo analizar el archivo.');
      }

      const extractedImages: UploadedImage[] = Array.isArray(data.images)
        ? data.images.map((img: any, idx: number) => ({
            id: `img-src-${Date.now()}-${idx}`,
            title: img.title || `Imagen ${existingImages.length + idx + 1} (${file.name})`,
            description: img.description || `Extraída de ${file.name}`,
            dataUrl: img.dataUrl,
            mimeType: img.mimeType || 'image/png',
            fileName: img.fileName || `${file.name}-img-${idx + 1}`,
            fileSize: img.fileSize,
          }))
        : [];

      const remappedNotes = remapImageTags(String(data.rawRequirements || ''), existingImages.length);
      const header = `--- Análisis de ${file.name} ---`;
      const nextNotes = existingNotes.trim()
        ? `${existingNotes.trim()}\n\n${header}\n${remappedNotes}`
        : remappedNotes;

      onNotesChange(nextNotes);
      if (onImagesChange && extractedImages.length) {
        onImagesChange([...existingImages, ...extractedImages]);
      }

      const imageMsg = extractedImages.length
        ? ` y se adjuntaron ${extractedImages.length} imagen${extractedImages.length === 1 ? '' : 'es'}`
        : '';
      const aiMsg = data.analyzed ? 'Se armó el planteamiento' : 'Se cargó el texto (sin IA)';
      setStatus('done');
      setMessage(`${aiMsg}${imageMsg}.`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'No se pudo analizar el archivo.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void analyzeFile(file);
        }}
      />
      <button
        type="button"
        disabled={status === 'working'}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files?.[0];
          if (file) void analyzeFile(file);
        }}
        className="w-full text-left disabled:opacity-60"
      >
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
            {status === 'working' ? (
              <Loader2 className="w-4 h-4 text-[#0A3D62] animate-spin" />
            ) : status === 'done' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : status === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <FileUp className="w-4 h-4 text-[#0A3D62]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#0A3D62]">
              Subir Word, TXT o Markdown
            </p>
            <p className="text-[11px] text-slate-500 leading-snug">
              Analiza el archivo y, si es Word, extrae y adjunta sus imágenes.
            </p>
            {message && (
              <p className={`text-[11px] mt-1 font-medium ${
                status === 'error' ? 'text-red-600' : status === 'done' ? 'text-emerald-700' : 'text-slate-600'
              }`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </button>
    </div>
  );
};
