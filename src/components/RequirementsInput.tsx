import React, { useState, useEffect, useRef } from 'react';
import { UploadedImage } from '../types';
import {
  FileText,
  Lightbulb,
  ClipboardPaste,
  Image as ImageIcon,
  Plus,
  Compass,
  AlertTriangle,
  HelpCircle,
  Workflow,
  Layers,
  Upload,
  LayoutGrid
} from 'lucide-react';

interface RequirementsInputProps {
  value: string;
  onChange: (val: string) => void;
  images?: UploadedImage[];
  onImagesChange?: (images: UploadedImage[]) => void;
}

interface StructuredSections {
  premisa: string;
  incidencia: string;
  cuestionantes: string;
  flujoActual: string;
}

const parseRawToSections = (raw: string): StructuredSections => {
  if (!raw || !raw.trim()) {
    return { premisa: '', incidencia: '', cuestionantes: '', flujoActual: '' };
  }

  const premisaMatch = raw.match(/(?:1[.\-]\s*PREMISA|PREMISA):?\s*([\s\S]*?)(?=(?:2[.\-]\s*INCIDENCIA|INCIDENCIA|3[.\-]\s*CUESTIONANTES|CUESTIONANTES|4[.\-]\s*FLUJO ACTUAL|FLUJO ACTUAL)|$)/i);
  const incidenciaMatch = raw.match(/(?:2[.\-]\s*INCIDENCIA|INCIDENCIA):?\s*([\s\S]*?)(?=(?:3[.\-]\s*CUESTIONANTES|CUESTIONANTES|4[.\-]\s*FLUJO ACTUAL|FLUJO ACTUAL)|$)/i);
  const cuestionantesMatch = raw.match(/(?:3[.\-]\s*CUESTIONANTES|CUESTIONANTES):?\s*([\s\S]*?)(?=(?:4[.\-]\s*FLUJO ACTUAL|FLUJO ACTUAL)|$)/i);
  const flujoMatch = raw.match(/(?:4[.\-]\s*FLUJO ACTUAL|FLUJO ACTUAL):?\s*([\s\S]*?)$/i);

  if (premisaMatch || incidenciaMatch || cuestionantesMatch || flujoMatch) {
    return {
      premisa: premisaMatch ? premisaMatch[1].trim() : '',
      incidencia: incidenciaMatch ? incidenciaMatch[1].trim() : '',
      cuestionantes: cuestionantesMatch ? cuestionantesMatch[1].trim() : '',
      flujoActual: flujoMatch ? flujoMatch[1].trim() : '',
    };
  }

  return {
    premisa: raw.trim(),
    incidencia: '',
    cuestionantes: '',
    flujoActual: '',
  };
};

const buildCombinedText = (s: StructuredSections): string => {
  const parts: string[] = [];
  if (s.premisa.trim()) parts.push(`1. PREMISA:\n${s.premisa.trim()}`);
  if (s.incidencia.trim()) parts.push(`2. INCIDENCIA:\n${s.incidencia.trim()}`);
  if (s.cuestionantes.trim()) parts.push(`3. CUESTIONANTES:\n${s.cuestionantes.trim()}`);
  if (s.flujoActual.trim()) parts.push(`4. FLUJO ACTUAL:\n${s.flujoActual.trim()}`);
  return parts.join('\n\n');
};

export const RequirementsInput: React.FC<RequirementsInputProps> = ({
  value,
  onChange,
  images = [],
  onImagesChange,
}) => {
  const [viewMode, setViewMode] = useState<'structured' | 'unified'>('structured');
  const [activeApartadoFilter, setActiveApartadoFilter] = useState<'all' | 'premisa' | 'incidencia' | 'cuestionantes' | 'flujo'>('all');
  const [sections, setSections] = useState<StructuredSections>(() => parseRawToSections(value));

  // File input refs for uploading image directly per section
  const premisaFileRef = useRef<HTMLInputElement>(null);
  const incidenciaFileRef = useRef<HTMLInputElement>(null);
  const cuestionantesFileRef = useRef<HTMLInputElement>(null);
  const flujoFileRef = useRef<HTMLInputElement>(null);

  // Keep sections in sync when value changes externally (e.g., presets or resets)
  useEffect(() => {
    const parsed = parseRawToSections(value);
    const currentCombined = buildCombinedText(sections);
    if (value !== currentCombined) {
      setSections(parsed);
    }
  }, [value]);

  const updateSectionField = (field: keyof StructuredSections, text: string) => {
    const updated = { ...sections, [field]: text };
    setSections(updated);
    onChange(buildCombinedText(updated));
  };

  const handlePasteSamplePrompt = () => {
    const sampleSections: StructuredSections = {
      premisa: `El cliente Banco Metropolitano opera con la plataforma Advansys Core Banking Integrator v4.2 para la gestión de transacciones diarias. Se requiere automatizar el proceso de conciliación bancaria diaria entre el core financiero y el servicio de facturación electrónica Sunat/Advansys.`,
      incidencia: `Actualmente, los analistas financieros deben descargar manualmente extractos bancarios en Excel a las 6:00 AM, filtrar inconsistencias celda por celda y registrar notas de crédito cuando surgen fallas de sincronización. Esto genera cuellos de botella operativos de hasta 4 horas diarias, errores humanos en el cuadre contable y retrasos en la notificación de giros rechazados. Se adjunta captura del tablero actual en [IMAGEN_2].`,
      cuestionantes: `- ¿Cómo garantizar el tiempo de respuesta menor a 2 segundos para lotes masivos de hasta 50,000 registros de extractos bancarios?
- ¿Qué algoritmo de priorización se utilizará para el matcheo automático de transacciones con código de 12 dígitos, fecha exacta y tolerancia de montos?
- ¿Cómo gestionar la seguridad RBAC y el registro auditable (Audit Trail) para aprobaciones manuales de discrepancias mayores a $1,000 USD?
- Ver esquema de comunicación propuesto en [IMAGEN_1].`,
      flujoActual: `1. Descarga manual del archivo de extracto bancario en formato TXT/CSV a las 06:00 AM.
2. Carga en hojas de cálculo locales sin validación previa contra la API de Sunat.
3. Revisión visual de diferencias por parte del analista financiero.
4. Generación manual de notas de ajuste en el core bancario.
5. Emisión del reporte diario firmado en papel.`,
    };

    setSections(sampleSections);
    onChange(buildCombinedText(sampleSections));
  };

  const handleFileUploadForSection = (
    files: FileList | null,
    sectionKey: keyof StructuredSections,
    sectionTitle: string
  ) => {
    if (!files || files.length === 0 || !onImagesChange) return;

    const newImages: UploadedImage[] = [];
    const filesArray = Array.from(files);

    let processed = 0;
    filesArray.forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const imgIndex = images.length + newImages.length + 1;
          const imgTag = `[IMAGEN_${imgIndex}]`;

          newImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: `Imagen ${imgIndex} (${sectionTitle})`,
            description: `Captura / Diagrama adjunto para la sección de ${sectionTitle}`,
            dataUrl: result,
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
          });

          // Insert reference tag automatically into section text
          const currentText = sections[sectionKey];
          const updatedText = currentText
            ? `${currentText}\n\n${imgTag}`
            : `${imgTag}`;

          updateSectionField(sectionKey, updatedText);
        }
        processed++;
        if (processed === filesArray.length) {
          onImagesChange([...images, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const insertImageTagAtText = (sectionKey: keyof StructuredSections, tag: string) => {
    const currentText = sections[sectionKey];
    const updatedText = currentText ? `${currentText} ${tag}` : tag;
    updateSectionField(sectionKey, updatedText);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A3D62] flex items-center justify-center font-bold text-sm border border-blue-200 shrink-0">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0A3D62]">
              Planteamiento a Analizar y Requerimientos
            </h2>
            <p className="text-xs text-slate-500">
              Estructura el caso técnico en los 4 apartados del método Advansys e integra imágenes
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          {/* Toggle View Mode */}
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex text-xs">
            <button
              type="button"
              onClick={() => setViewMode('structured')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center space-x-1 ${
                viewMode === 'structured'
                  ? 'bg-white text-[#0A3D62] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1" />
              <span>4 Apartados</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center space-x-1 ${
                viewMode === 'unified'
                  ? 'bg-white text-[#0A3D62] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              <span>Unificado</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePasteSamplePrompt}
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
            title="Cargar ejemplo con los 4 apartados e imágenes"
          >
            <ClipboardPaste className="w-3.5 h-3.5 mr-1" />
            <span>Ejemplo</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: STRUCTURED (4 APARTADOS) */}
      {viewMode === 'structured' && (
        <div className="space-y-3">

          {/* Sub-tab navigation pills for 4 apartados */}
          <div className="flex items-center space-x-1 text-xs overflow-x-auto pb-1 border-b border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 mr-0.5">Sección:</span>
            {[
              { id: 'all', label: 'Ver Todas' },
              { id: 'premisa', label: '1. Premisa' },
              { id: 'incidencia', label: '2. Incidencia' },
              { id: 'cuestionantes', label: '3. Cuestionantes' },
              { id: 'flujo', label: '4. Flujo' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveApartadoFilter(item.id as any)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 ${
                  activeApartadoFilter === item.id
                    ? 'bg-[#0A3D62] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          
          {/* APARTADO 1: PREMISA */}
          {(activeApartadoFilter === 'all' || activeApartadoFilter === 'premisa') && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-[#0A3D62] text-white flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  <Compass className="w-4 h-4 text-[#0A3D62]" />
                  <h3 className="text-xs font-bold text-[#0A3D62] uppercase tracking-wider">
                    Premisa (Antecedentes y Contexto de Negocio)
                  </h3>
                </div>

                {/* Image Upload Button for Premisa */}
                {onImagesChange && (
                  <div>
                    <input
                      type="file"
                      ref={premisaFileRef}
                      onChange={(e) => handleFileUploadForSection(e.target.files, 'premisa', 'Premisa')}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => premisaFileRef.current?.click()}
                      className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-white hover:bg-blue-50 border border-slate-300 rounded shadow-xs transition-colors"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      <span>+ Adjuntar Imagen</span>
                    </button>
                  </div>
                )}
              </div>

              <textarea
                value={sections.premisa}
                onChange={(e) => updateSectionField('premisa', e.target.value)}
                placeholder="Describe la premisa inicial, arquitectura actual o escenario de negocio del cliente..."
                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-800 font-mono leading-relaxed resize-y min-h-[75px]"
              />

              {/* Quick insert image tags */}
              {images.length > 0 && (
                <div className="flex items-center space-x-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Insertar Imagen:</span>
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => insertImageTagAtText('premisa', `[IMAGEN_${idx + 1}]`)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-[#0A3D62] text-white rounded hover:bg-blue-800 transition-colors shadow-xs"
                      title={`Insertar [IMAGEN_${idx + 1}] en Premisa: ${img.title}`}
                    >
                      +[IMAGEN_{idx + 1}]
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* APARTADO 2: INCIDENCIA */}
          {(activeApartadoFilter === 'all' || activeApartadoFilter === 'incidencia') && (
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </span>
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Incidencia (Problema, Falla u Oportunidad)
                  </h3>
                </div>

                {/* Image Upload Button for Incidencia */}
                {onImagesChange && (
                  <div>
                    <input
                      type="file"
                      ref={incidenciaFileRef}
                      onChange={(e) => handleFileUploadForSection(e.target.files, 'incidencia', 'Incidencia')}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => incidenciaFileRef.current?.click()}
                      className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded shadow-xs transition-colors"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      <span>+ Adjuntar Imagen</span>
                    </button>
                  </div>
                )}
              </div>

              <textarea
                value={sections.incidencia}
                onChange={(e) => updateSectionField('incidencia', e.target.value)}
                placeholder="Detalla el error, cuello de botella, brecha operativa o falla que motiva este análisis..."
                className="w-full p-2.5 text-xs bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-800 font-mono leading-relaxed resize-y min-h-[85px]"
              />

              {/* Quick insert image tags */}
              {images.length > 0 && (
                <div className="flex items-center space-x-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-amber-800 uppercase">Insertar Imagen:</span>
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => insertImageTagAtText('incidencia', `[IMAGEN_${idx + 1}]`)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-700 text-white rounded hover:bg-amber-800 transition-colors shadow-xs"
                      title={`Insertar [IMAGEN_${idx + 1}] en Incidencia: ${img.title}`}
                    >
                      +[IMAGEN_{idx + 1}]
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* APARTADO 3: CUESTIONANTES */}
          {(activeApartadoFilter === 'all' || activeApartadoFilter === 'cuestionantes') && (
            <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                    3
                  </span>
                  <HelpCircle className="w-4 h-4 text-purple-700" />
                  <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                    Cuestionantes (Preguntas Técnicas y Aspectos a Resolver)
                  </h3>
                </div>

                {/* Image Upload Button for Cuestionantes */}
                {onImagesChange && (
                  <div>
                    <input
                      type="file"
                      ref={cuestionantesFileRef}
                      onChange={(e) => handleFileUploadForSection(e.target.files, 'cuestionantes', 'Cuestionantes')}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => cuestionantesFileRef.current?.click()}
                      className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-purple-900 bg-white hover:bg-purple-100 border border-purple-300 rounded shadow-xs transition-colors"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      <span>+ Adjuntar Imagen</span>
                    </button>
                  </div>
                )}
              </div>

              <textarea
                value={sections.cuestionantes}
                onChange={(e) => updateSectionField('cuestionantes', e.target.value)}
                placeholder="Puntos a investigar, preguntas de arquitectura, volumetría o dudas técnicas del cliente..."
                className="w-full p-2.5 text-xs bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-800 font-mono leading-relaxed resize-y min-h-[85px]"
              />

              {/* Quick insert image tags */}
              {images.length > 0 && (
                <div className="flex items-center space-x-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-purple-800 uppercase">Insertar Imagen:</span>
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => insertImageTagAtText('cuestionantes', `[IMAGEN_${idx + 1}]`)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-700 text-white rounded hover:bg-purple-800 transition-colors shadow-xs"
                      title={`Insertar [IMAGEN_${idx + 1}] en Cuestionantes: ${img.title}`}
                    >
                      +[IMAGEN_{idx + 1}]
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* APARTADO 4: FLUJO ACTUAL */}
          {(activeApartadoFilter === 'all' || activeApartadoFilter === 'flujo') && (
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-[#2ECC71] h-6 w-6 rounded-full text-slate-900 flex items-center justify-center font-bold text-xs bg-[#2ECC71]">
                    4
                  </span>
                  <Workflow className="w-4 h-4 text-emerald-800" />
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Flujo Actual (Proceso Operativo Vigente)
                  </h3>
                </div>

                {/* Image Upload Button for Flujo Actual */}
                {onImagesChange && (
                  <div>
                    <input
                      type="file"
                      ref={flujoFileRef}
                      onChange={(e) => handleFileUploadForSection(e.target.files, 'flujoActual', 'Flujo Actual')}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => flujoFileRef.current?.click()}
                      className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 rounded shadow-xs transition-colors"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      <span>+ Adjuntar Imagen</span>
                    </button>
                  </div>
                )}
              </div>

              <textarea
                value={sections.flujoActual}
                onChange={(e) => updateSectionField('flujoActual', e.target.value)}
                placeholder="Enumera paso a paso cómo se ejecuta el proceso hoy en día (ej. 1. Descarga reportes, 2. Filtra Excel...)..."
                className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-[#2ECC71] text-slate-800 font-mono leading-relaxed resize-y min-h-[85px]"
              />

              {/* Quick insert image tags */}
              {images.length > 0 && (
                <div className="flex items-center space-x-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-emerald-900 uppercase">Insertar Imagen:</span>
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => insertImageTagAtText('flujoActual', `[IMAGEN_${idx + 1}]`)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-[#0A3D62] text-white rounded hover:bg-emerald-800 transition-colors shadow-xs"
                      title={`Insertar [IMAGEN_${idx + 1}] en Flujo Actual: ${img.title}`}
                    >
                      +[IMAGEN_{idx + 1}]
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* VIEW MODE 2: UNIFIED TEXTAREA */}
      {viewMode === 'unified' && (
        <div className="relative flex-1 min-h-[280px]">
          <textarea
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setSections(parseRawToSections(e.target.value));
            }}
            placeholder="Escribe o pega libremente el documento de planteamiento, notas o requerimientos..."
            className="w-full h-full min-h-[280px] p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800 resize-y font-mono leading-relaxed"
          />
        </div>
      )}

      {/* Embedded Images Strip if any uploaded */}
      {images.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#0A3D62] uppercase tracking-wider flex items-center">
              <ImageIcon className="w-3.5 h-3.5 mr-1 text-[#0A3D62]" />
              Imágenes vinculadas ({images.length}):
            </span>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-1 text-xs">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="shrink-0 flex items-center space-x-2 bg-slate-50 p-1.5 pr-3 border border-slate-200 rounded-lg text-slate-700"
              >
                <img
                  src={img.dataUrl}
                  alt={img.title}
                  className="w-8 h-8 rounded object-cover border border-slate-300 bg-slate-200 shrink-0"
                />
                <div className="truncate max-w-[140px]">
                  <span className="font-bold text-[#0A3D62] text-[10px] block">
                    [IMAGEN_{idx + 1}]
                  </span>
                  <span className="text-[10px] text-slate-600 truncate block">
                    {img.title || 'Sin título'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint Footer */}
      <div className="mt-3 flex items-start space-x-2 bg-blue-50/80 border border-blue-200/60 rounded-lg p-2.5 text-xs text-blue-900">
        <Lightbulb className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <p>
          <strong>Recomendación Advansys:</strong> Al completar los 4 apartados (Premisa, Incidencia, Cuestionantes y Flujo Actual) e insertar tags de imagen como <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 font-bold">[IMAGEN_1]</code>, la IA generará el Análisis Operativo con trazabilidad técnica perfecta.
        </p>
      </div>

    </div>
  );
};
