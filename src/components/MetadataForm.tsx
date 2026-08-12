import React from 'react';
import { MetadataHeader } from '../types';
import { Building2, Calendar, FileCode, Hash, Bookmark, Tag, Layers, Sliders, Cpu, Gauge } from 'lucide-react';

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
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        desc: 'Profundidad técnica de TI: especificaciones de BD/tablas, firmas de eventos UI, validaciones de código, APIs y trazabilidad de auditoría.'
      };
    }
  };

  const techInfo = getTechLevelInfo(currentTechLevel);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A3D62] flex items-center justify-center font-bold text-sm border border-blue-200">
          1
        </div>
        <div>
          <h2 className="text-base font-bold text-[#0A3D62]">Metadatos del Encabezado Corporativo</h2>
          <p className="text-xs text-slate-500">Información del cliente, ticket, versión y nivel de profundidad técnica</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Cliente */}
        <div className="sm:col-span-2 min-w-0">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center truncate">
            <Building2 className="w-3.5 h-3.5 mr-1 text-[#0A3D62] shrink-0" />
            <span>Cliente / Empresa</span>
          </label>
          <input
            type="text"
            value={metadata.cliente}
            onChange={(e) => handleChange('cliente', e.target.value)}
            placeholder="Ej: Banco Metropolitano S.A."
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
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
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
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
            placeholder="Ej: TK-2026-8894"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
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
            placeholder="Ej: GUI-ADV-042"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
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
            placeholder="Ej: PROP-ADV-2026-0158"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Nombre del Proyecto */}
        <div className="sm:col-span-2 min-w-0">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center truncate">
            <FileCode className="w-3.5 h-3.5 mr-1 text-[#0A3D62] shrink-0" />
            <span>Nombre del Proyecto</span>
          </label>
          <input
            type="text"
            value={metadata.nombreProyecto}
            onChange={(e) => handleChange('nombreProyecto', e.target.value)}
            placeholder="Ej: Módulo Autónomo de Conciliación Bancaria"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Módulo / Aplicación */}
        <div className="sm:col-span-2 min-w-0">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center truncate">
            <Layers className="w-3.5 h-3.5 mr-1 text-[#0A3D62] shrink-0" />
            <span>Módulo / Aplicación</span>
          </label>
          <input
            type="text"
            value={metadata.moduloAplicacion}
            onChange={(e) => handleChange('moduloAplicacion', e.target.value)}
            placeholder="Ej: Advansys Core Banking Integrator v4.2"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
          />
        </div>

      </div>

      {/* FILTER: LEVEL OF TECHNICALITY (Nivel de Tecnicismo 1 - 10) */}
      <div className="mt-5 pt-4 border-t border-slate-200 bg-slate-50/70 p-4 rounded-xl border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-[#0A3D62]" />
            <h3 className="text-xs font-bold text-[#0A3D62] uppercase tracking-wider">
              Filtro: Nivel de Tecnicismo del Análisis (1 al 10)
            </h3>
          </div>
          
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${techInfo.color}`}>
            <Cpu className="w-3.5 h-3.5 mr-1" />
            <span>Nivel {currentTechLevel}/10 — {techInfo.badge}</span>
          </div>
        </div>

        {/* Range Slider & Quick Number Selector */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-500 w-12 text-center shrink-0">
              1 (Ejecutivo)
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={currentTechLevel}
              onChange={(e) => handleChange('technicalLevel', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A3D62]"
            />
            <span className="text-xs font-bold text-slate-500 w-12 text-center shrink-0">
              10 (TI/Arq)
            </span>
          </div>

          {/* Quick Number Buttons (1..10) */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => handleChange('technicalLevel', lvl)}
                className={`flex-1 py-1 text-xs font-bold rounded transition-all border ${
                  currentTechLevel === lvl
                    ? 'bg-[#0A3D62] text-white border-[#0A3D62] shadow-sm scale-105'
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

      {/* Header Banner & Footer Customization */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-2 mb-3">
          <Sliders className="w-4 h-4 text-[#0A3D62]" />
          <h3 className="text-xs font-bold text-[#0A3D62] uppercase tracking-wider">
            Personalización de Carátula (Banner & Pie)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Header Tag */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Etiqueta Banner (Header Tag)
            </label>
            <input
              type="text"
              value={metadata.headerBrandTag ?? 'ADVANSYS'}
              onChange={(e) => handleChange('headerBrandTag', e.target.value)}
              placeholder="ADVANSYS"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
            />
          </div>

          {/* Subtítulo Banner */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Subtítulo / Eslogan Banner
            </label>
            <input
              type="text"
              value={metadata.headerSubtitle ?? ''}
              onChange={(e) => handleChange('headerSubtitle', e.target.value)}
              placeholder="Opcional (Ej: ADVANSYS TECHNICAL ARCHITECTURE & SOLUTIONS)"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
            />
          </div>

          {/* Pie de Página */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Pie de Página (Footer)
            </label>
            <input
              type="text"
              value={metadata.footerText ?? 'Advansys SRL'}
              onChange={(e) => handleChange('footerText', e.target.value)}
              placeholder="Advansys SRL"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] focus:bg-white transition-all text-slate-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
