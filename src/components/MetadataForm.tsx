import React from 'react';
import { MetadataHeader } from '../types';
import { Building2, Calendar, FileCode, Hash, Bookmark, Tag, Layers, Sliders, Cpu, Gauge, AlignJustify, Quote, Bold } from 'lucide-react';
import { handleAutoBulletKeyDown } from './TextFormattingToolbar';

interface MetadataFormProps {
  metadata: MetadataHeader;
  onChange: (updated: MetadataHeader) => void;
}

export const MetadataForm: React.FC<MetadataFormProps> = ({ metadata, onChange }) => {
  const handleChange = (field: keyof MetadataHeader, value: any) => {
    onChange({
      ...metadata,
      [field]: value
    });
  };

  const currentTechLevel = metadata.technicalLevel ?? 7;
  const currentDetailLevel = metadata.detailLevel ?? 6;
  const currentParaphraseLevel = metadata.paraphraseLevel ?? 3;

  const getTechLevelInfo = (level: number) => {
    if (level <= 3) {
      return {
        badge: 'Alta Gerencia / Directiva (1-3)',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        desc: 'Enfoque ejecutivo: impacto operativo, gobernanza, objetivos de negocio y mitigación de riesgos sin jerga técnica profunda de código/BD.'
      };
    } else if (level <= 7) {
      return {
        badge: 'Operativo / Analistas Funcionales (4-7)',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        desc: 'Estándar Guías Advansys: rutas de navegación en formularios, lógica de negocio, parámetros globales e interactividad de la app.'
      };
    } else {
      return {
        badge: 'TI & Arquitectura de Software (8-10)',
        color: 'bg-slate-100 text-[#0A3D62] border-slate-300',
        desc: 'Profundidad técnica de TI: especificaciones de BD/tablas, firmas de eventos UI, validaciones de código, APIs y trazabilidad de auditoría.'
      };
    }
  };

  const getDetailLevelInfo = (level: number) => {
    if (level <= 3) {
      return {
        badge: 'Conciso / Sintético (1-3)',
        color: 'bg-slate-100 text-slate-800 border-slate-300',
        desc: 'Análisis breve: pocos pasos, párrafos cortos y solo lo esencial para aprobar el cambio.'
      };
    } else if (level <= 7) {
      return {
        badge: 'Estándar (4-7)',
        color: 'bg-sky-100 text-sky-800 border-sky-300',
        desc: 'Cobertura operativa completa: pasos claros con contexto suficiente para ejecutar, sin extender de más.'
      };
    } else {
      return {
        badge: 'Exhaustivo / Profundo (8-10)',
        color: 'bg-blue-50 text-[#0A3D62] border-blue-200',
        desc: 'Máxima granularidad: más pasos, excepciones, validaciones, casos borde y explicación amplia por imagen.'
      };
    }
  };

  const getParaphraseLevelInfo = (level: number) => {
    if (level <= 3) {
      return {
        badge: 'Fidelidad / Mínimo (1-3)',
        color: 'bg-slate-100 text-[#0A3D62] border-slate-300',
        desc: 'Conserva la redacción original. Ideal cuando ya trajeron escrito cómo va cada sección: solo se corrige ortografía y formato.'
      };
    } else if (level <= 7) {
      return {
        badge: 'Equilibrio (4-7)',
        color: 'bg-blue-50 text-[#0A3D62] border-blue-200',
        desc: 'Mantiene ideas y orden, con un pulido ligero de estilo corporativo sin reescribir de cero.'
      };
    } else {
      return {
        badge: 'Reescritura libre (8-10)',
        color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        desc: 'Reescribe con estilo Advansys más fluido, conservando hechos, cifras y decisiones de negocio.'
      };
    }
  };

  const techInfo = getTechLevelInfo(currentTechLevel);
  const detailInfo = getDetailLevelInfo(currentDetailLevel);
  const paraphraseInfo = getParaphraseLevelInfo(currentParaphraseLevel);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/90 p-3 sm:p-4 min-w-0 max-w-full overflow-x-hidden">
      <div className="flex items-start gap-2 border-b border-slate-100 pb-3 mb-4 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0A3D62] flex items-center justify-center font-bold text-sm border border-blue-200 shrink-0">
          1
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#0A3D62] leading-snug break-words">Datos del documento</h2>
          <p className="text-xs text-slate-500 leading-snug">Cliente, ticket y cómo debe sonar el texto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 @md:grid-cols-2 gap-3 min-w-0">
        {/* Cliente */}
        <div className="@md:col-span-2 min-w-0">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between truncate">
            <span className="flex items-center">
              <Building2 className="w-3.5 h-3.5 mr-1 text-[#0A3D62] shrink-0" />
              <span>Cliente / Empresa</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Ctrl+B para negrita</span>
          </label>
          <input
            type="text"
            value={metadata.cliente}
            onChange={(e) => handleChange('cliente', e.target.value)}
            onKeyDown={(e) => handleAutoBulletKeyDown(e, metadata.cliente, (v) => handleChange('cliente', v))}
            placeholder="Ej: Banco Metropolitano S.A."
            className="w-full min-w-0 max-w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Fecha */}
        <div className="min-w-0">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center truncate">
            <Calendar className="w-3.5 h-3.5 mr-1 text-[#0A3D62] shrink-0" />
            <span>Fecha de Documento</span>
          </label>
          <input
            type="date"
            value={metadata.fecha}
            onChange={(e) => handleChange('fecha', e.target.value)}
            className="w-full min-w-0 max-w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Ticket No. */}
        <div className="min-w-0">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center truncate">
            <Hash className="w-3.5 h-3.5 mr-1 text-[#0A3D62] shrink-0" />
            <span>Ticket No.</span>
          </label>
          <input
            type="text"
            value={metadata.ticketNo}
            onChange={(e) => handleChange('ticketNo', e.target.value)}
            onKeyDown={(e) => handleAutoBulletKeyDown(e, metadata.ticketNo || '', (v) => handleChange('ticketNo', v))}
            placeholder="Ej: TK-2026-8894"
            className="w-full min-w-0 max-w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Guía No. */}
        <div className="min-w-0">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center truncate">
            <Tag className="w-3.5 h-3.5 mr-1 text-[#0A3D62] shrink-0" />
            <span>Guía No.</span>
          </label>
          <input
            type="text"
            value={metadata.guiaNo}
            onChange={(e) => handleChange('guiaNo', e.target.value)}
            onKeyDown={(e) => handleAutoBulletKeyDown(e, metadata.guiaNo || '', (v) => handleChange('guiaNo', v))}
            placeholder="Ej: GUI-ADV-042"
            className="w-full min-w-0 max-w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Propuesta No. */}
        <div className="min-w-0">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center truncate">
            <Bookmark className="w-3.5 h-3.5 mr-1 text-[#0A3D62] shrink-0" />
            <span>Propuesta Nº</span>
          </label>
          <input
            type="text"
            value={metadata.propuestaNo}
            onChange={(e) => handleChange('propuestaNo', e.target.value)}
            onKeyDown={(e) => handleAutoBulletKeyDown(e, metadata.propuestaNo || '', (v) => handleChange('propuestaNo', v))}
            placeholder="Ej: PROP-ADV-2026-0158"
            className="w-full min-w-0 max-w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Nombre del Proyecto */}
        <div className="@md:col-span-2 min-w-0">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between truncate">
            <span className="flex items-center">
              <FileCode className="w-3.5 h-3.5 mr-1 text-[#0A3D62] shrink-0" />
              <span>Nombre del Proyecto</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Ctrl+B para negrita</span>
          </label>
          <input
            type="text"
            value={metadata.nombreProyecto}
            onChange={(e) => handleChange('nombreProyecto', e.target.value)}
            onKeyDown={(e) => handleAutoBulletKeyDown(e, metadata.nombreProyecto || '', (v) => handleChange('nombreProyecto', v))}
            placeholder="Ej: Módulo Autónomo de Conciliación Bancaria"
            className="w-full min-w-0 max-w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Módulo / Aplicación */}
        <div className="@md:col-span-2 min-w-0">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between truncate">
            <span className="flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1 text-[#0A3D62] shrink-0" />
              <span>Módulo / Aplicación</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Ctrl+B para negrita</span>
          </label>
          <input
            type="text"
            value={metadata.moduloAplicacion}
            onChange={(e) => handleChange('moduloAplicacion', e.target.value)}
            onKeyDown={(e) => handleAutoBulletKeyDown(e, metadata.moduloAplicacion || '', (v) => handleChange('moduloAplicacion', v))}
            placeholder="Ej: Advansys Core Banking Integrator v4.2"
            className="w-full min-w-0 max-w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
          />
        </div>

      </div>

      {/* FILTER: LEVEL OF TECHNICALITY (Nivel de Tecnicismo 1 - 10) */}
      <div className="mt-5 pt-4 border-t border-slate-200 bg-slate-50/70 p-3 rounded-xl border min-w-0">
        <div className="flex flex-col gap-2 mb-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Gauge className="w-4 h-4 text-[#0A3D62] shrink-0" />
            <h3 className="text-xs font-bold text-[#0A3D62] uppercase tracking-wide leading-snug break-words">
              Nivel de tecnicismo (1–10)
            </h3>
          </div>
          
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border max-w-full min-w-0 ${techInfo.color}`}>
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span className="min-w-0 break-words leading-snug">Nivel {currentTechLevel}/10 — {techInfo.badge}</span>
          </div>
        </div>

        {/* Range Slider & Quick Number Selector */}
        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold text-slate-500 shrink-0 w-4 text-center">
              1
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={currentTechLevel}
              onChange={(e) => handleChange('technicalLevel', parseInt(e.target.value, 10))}
              className="min-w-0 flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A3D62]"
            />
            <span className="text-[10px] font-bold text-slate-500 shrink-0 w-4 text-center">
              10
            </span>
          </div>

          {/* Quick Number Buttons (1..10) */}
          <div className="grid grid-cols-10 gap-0.5 min-w-0">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => handleChange('technicalLevel', lvl)}
                className={`min-w-0 py-1 text-[11px] font-bold rounded transition-all border ${
                  currentTechLevel === lvl
                    ? 'bg-[#0A3D62] text-white border-[#0A3D62] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Dynamic description of current level */}
          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
            {techInfo.desc}
          </p>
        </div>
      </div>

      {/* FILTER: LEVEL OF DETAIL (Nivel de Detalle 1 - 10) */}
      <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/70 p-3 rounded-xl border min-w-0">
        <div className="flex flex-col gap-2 mb-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <AlignJustify className="w-4 h-4 text-[#0A3D62] shrink-0" />
            <h3 className="text-xs font-bold text-[#0A3D62] uppercase tracking-wide leading-snug break-words">
              Nivel de detalle (1–10)
            </h3>
          </div>
          
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border max-w-full min-w-0 ${detailInfo.color}`}>
            <AlignJustify className="w-3.5 h-3.5 shrink-0" />
            <span className="min-w-0 break-words leading-snug">Nivel {currentDetailLevel}/10 — {detailInfo.badge}</span>
          </div>
        </div>

        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold text-slate-500 shrink-0 w-4 text-center">
              1
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={currentDetailLevel}
              onChange={(e) => handleChange('detailLevel', parseInt(e.target.value, 10))}
              className="min-w-0 flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2ECC71]"
            />
            <span className="text-[10px] font-bold text-slate-500 shrink-0 w-4 text-center">
              10
            </span>
          </div>

          <div className="grid grid-cols-10 gap-0.5 min-w-0">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => handleChange('detailLevel', lvl)}
                className={`min-w-0 py-1 text-[11px] font-bold rounded transition-all border ${
                  currentDetailLevel === lvl
                    ? 'bg-[#2ECC71] text-slate-950 border-emerald-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
            {detailInfo.desc}
          </p>
        </div>
      </div>

      {/* FILTER: LEVEL OF PARAPHRASE (Nivel de Parafraseo 1 - 10) */}
      <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/70 p-3 rounded-xl border min-w-0">
        <div className="flex flex-col gap-2 mb-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Quote className="w-4 h-4 text-[#0A3D62] shrink-0" />
            <h3 className="text-xs font-bold text-[#0A3D62] uppercase tracking-wide leading-snug break-words">
              Nivel de parafraseo (1–10)
            </h3>
          </div>
          
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border max-w-full min-w-0 ${paraphraseInfo.color}`}>
            <Quote className="w-3.5 h-3.5 shrink-0" />
            <span className="min-w-0 break-words leading-snug">Nivel {currentParaphraseLevel}/10 — {paraphraseInfo.badge}</span>
          </div>
        </div>

        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold text-slate-500 shrink-0 w-4 text-center">
              1
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={currentParaphraseLevel}
              onChange={(e) => handleChange('paraphraseLevel', parseInt(e.target.value, 10))}
              className="min-w-0 flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A3D62]"
            />
            <span className="text-[10px] font-bold text-slate-500 shrink-0 w-4 text-center">
              10
            </span>
          </div>

          <div className="grid grid-cols-10 gap-0.5 min-w-0">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => handleChange('paraphraseLevel', lvl)}
                className={`min-w-0 py-1 text-[11px] font-bold rounded transition-all border ${
                  currentParaphraseLevel === lvl
                    ? 'bg-[#0A3D62] text-white border-[#0A3D62] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
            {paraphraseInfo.desc}
          </p>
          <p className="text-[11px] text-slate-500 leading-snug">
            El tecnicismo es el lenguaje, el detalle la extensión y el parafraseo cuánto se reescribe lo que ya trajeron escrito.
          </p>
        </div>
      </div>

      {/* Header Banner & Footer Customization */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2 min-w-0">
          <Sliders className="w-4 h-4 text-[#0A3D62] shrink-0" />
          <h3 className="text-xs font-bold text-[#0A3D62] uppercase tracking-wide leading-snug break-words">
            Personalización de Encabezados (Header) y Pie de Página (Footer)
          </h3>
        </div>
        <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
          Edita los textos que se muestran en el <strong>encabezado superior</strong> y en el <strong>pie de página</strong> de las páginas siguientes (páginas 2 en adelante) tanto en Word (.docx) como en PDF. El logo se configura en <span className="font-semibold text-[#0A3D62]">Ajustes</span> (arriba a la derecha).
        </p>

        <div className="grid grid-cols-1 gap-3.5 min-w-0">
          {/* Header Brand Tag */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Marca o Etiqueta del Encabezado (Header)
            </label>
            <input
              type="text"
              value={metadata.headerBrandTag ?? 'ADVANSYS'}
              onChange={(e) => handleChange('headerBrandTag', e.target.value)}
              placeholder="ADVANSYS"
              className="w-full min-w-0 max-w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Se muestra en el banner de la primera página y en la esquina superior izquierda del Header en las páginas 2+.
            </p>
          </div>

          {/* Subtítulo Header */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Subtítulo del Encabezado (Header de páginas siguientes)
            </label>
            <input
              type="text"
              value={metadata.headerSubtitle ?? ''}
              onChange={(e) => handleChange('headerSubtitle', e.target.value)}
              placeholder="Ej: DOCUMENTACIÓN TÉCNICA Y ANÁLISIS DE CUMPLIMIENTO"
              className="w-full min-w-0 max-w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Texto que acompaña a la marca en el Header superior de las páginas siguientes.
            </p>
          </div>

          {/* Pie de Página */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Texto del Pie de Página (Footer de todas las páginas)
            </label>
            <input
              type="text"
              value={metadata.footerText ?? 'Advansys SRL'}
              onChange={(e) => handleChange('footerText', e.target.value)}
              placeholder="Advansys SRL"
              className="w-full min-w-0 max-w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Aparece en la parte inferior de las páginas junto a la numeración automática <em>(Página X de Y)</em>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
