import React, { useRef } from 'react';
import { UploadedImage } from '../types';
import { UploadCloud, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, Info } from 'lucide-react';

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: UploadedImage[] = [];
    const ArrayFiles = Array.from(files);

    let processedCount = 0;
    ArrayFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const indexNum = images.length + newImages.length + 1;
          newImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
            description: `Captura / Diagrama correspondiente al flujo operativo #${indexNum}`,
            dataUrl: result,
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size
          });
        }
        processedCount++;
        if (processedCount === ArrayFiles.length) {
          onChange([...images, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleImageUpdate = (id: string, field: 'title' | 'description', value: string) => {
    onChange(images.map(img => img.id === id ? { ...img, [field]: value } : img));
  };

  const handleRemoveImage = (id: string) => {
    onChange(images.filter(img => img.id !== id));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === images.length - 1)) return;
    const updated = [...images];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A3D62] flex items-center justify-center font-bold text-sm border border-blue-200">
            3
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0A3D62]">Cargador Multimodal de Imágenes y Diagramas</h2>
            <p className="text-xs text-slate-500">Sube capturas de pantalla, flujos UI o diagramas de arquitectura para el Análisis Operativo</p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
          {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
        </span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 hover:border-[#0A3D62] bg-slate-50 hover:bg-blue-50/50 rounded-xl p-6 text-center cursor-pointer transition-all duration-200 group"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFilesSelected(e.target.files)}
          multiple
          accept="image/*"
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-blue-100/80 text-[#0A3D62] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6 text-[#0A3D62]" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Arrastra y suelta tus imágenes aquí, o <span className="text-[#0A3D62] underline">haz clic para explorar</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Soporta PNG, JPG, SVG, WEBP (Diagramas de arquitectura, bocetos UI, capturas de pantalla)
          </p>
        </div>
      </div>

      {/* List of uploaded images with metadata fields */}
      {images.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
            <Info className="w-3.5 h-3.5 mr-1 text-[#0A3D62]" />
            Configura el título y descripción de cada imagen (Se vincularán como [IMAGEN_1], [IMAGEN_2] en el documento):
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200"
              >
                {/* Image Thumbnail & Badge */}
                <div className="relative shrink-0 w-24 h-20 rounded-md overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center">
                  <img
                    src={img.dataUrl}
                    alt={img.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 bg-[#0A3D62] text-white font-bold text-[10px] px-1.5 py-0.5 rounded shadow">
                    [IMAGEN_{idx + 1}]
                  </div>
                </div>

                {/* Form fields */}
                <div className="flex-1 w-full space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Título de la Imagen / Diagrama:
                    </label>
                    <input
                      type="text"
                      value={img.title}
                      onChange={(e) => handleImageUpdate(img.id, 'title', e.target.value)}
                      placeholder="Ej: Diagrama de arquitectura del módulo de cobranzas"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:ring-1 focus:ring-[#0A3D62] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Descripción Contextual (para la IA):
                    </label>
                    <input
                      type="text"
                      value={img.description}
                      onChange={(e) => handleImageUpdate(img.id, 'description', e.target.value)}
                      placeholder="Ej: Muestra el paso 2 donde el analista aprueba el reembolso manual"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:ring-1 focus:ring-[#0A3D62] text-slate-800"
                    />
                  </div>
                </div>

                {/* Controls (Order & Delete) */}
                <div className="flex sm:flex-col items-center space-x-1 sm:space-x-0 sm:space-y-1 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                    title="Mover arriba"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === images.length - 1}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                    title="Mover abajo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
