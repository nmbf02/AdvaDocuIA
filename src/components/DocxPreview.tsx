import React from 'react';
import { ProposalSection, MetadataHeader, UploadedImage } from '../types';
import { FileText, CheckCircle, ShieldAlert } from 'lucide-react';
import { getAdvansysBannerSvg } from '../data/banner';

interface DocxPreviewProps {
  metadata: MetadataHeader;
  proposal: ProposalSection;
  images: UploadedImage[];
}

export const DocxPreview: React.FC<DocxPreviewProps> = ({ metadata, proposal, images }) => {
  const bannerSvg = getAdvansysBannerSvg(
    metadata.headerBrandTag || 'ADVANSYS',
    metadata.headerSubtitle ?? ''
  );

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="max-w-4xl min-w-[320px] w-full mx-auto bg-white shadow-2xl rounded-sm border border-slate-300 p-4 sm:p-8 md:p-10 text-slate-900 font-sans leading-relaxed text-sm relative">
      
      {/* Header Banner Fixed at top of Page 1 */}
      <div className="-mx-4 sm:-mx-8 md:-mx-10 -mt-4 sm:-mt-8 md:-mt-10 mb-6 border-b-4 border-[#2ECC71] shadow-md overflow-hidden rounded-t-sm relative bg-[#021024]">
        <img 
          src={bannerSvg} 
          alt="Advansys Header Cover Banner" 
          className="w-full h-auto object-cover object-center"
        />
      </div>

      {/* Main Document Title */}
      <div className="text-center mb-6">
        <h1 className="text-lg font-bold text-[#0A3D62] uppercase tracking-tight">
          ANÁLISIS DE CUMPLIMIENTO Y PROPUESTA DE DESARROLLO
        </h1>
      </div>

      {/* Metadata Table Block */}
      <div className="border border-slate-300 rounded-md overflow-hidden mb-8 text-xs bg-slate-50/50">
        <div className="grid grid-cols-2 border-b border-slate-200 divide-x divide-slate-200">
          <div className="p-2.5">
            <span className="font-bold text-[#0A3D62] uppercase">CLIENTE: </span>
            <span className="text-slate-800">{metadata.cliente || 'N/A'}</span>
          </div>
          <div className="p-2.5">
            <span className="font-bold text-[#0A3D62] uppercase">FECHA: </span>
            <span className="text-slate-800">{metadata.fecha || 'N/A'}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 border-b border-slate-200 divide-x divide-slate-200">
          <div className="p-2.5">
            <span className="font-bold text-[#0A3D62] uppercase">TICKET NO.: </span>
            <span className="text-slate-800">{metadata.ticketNo || 'N/A'}</span>
          </div>
          <div className="p-2.5">
            <span className="font-bold text-[#0A3D62] uppercase">GUÍA NO.: </span>
            <span className="text-slate-800">{metadata.guiaNo || 'N/A'}</span>
          </div>
          <div className="p-2.5">
            <span className="font-bold text-[#0A3D62] uppercase">PROPUESTA Nº: </span>
            <span className="text-slate-800">{metadata.propuestaNo || 'N/A'}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <div className="p-2.5">
            <span className="font-bold text-[#0A3D62] uppercase">PROYECTO: </span>
            <span className="text-slate-800">{metadata.nombreProyecto || 'N/A'}</span>
          </div>
          <div className="p-2.5">
            <span className="font-bold text-[#0A3D62] uppercase">MÓDULO / APLICACIÓN: </span>
            <span className="text-slate-800">{metadata.moduloAplicacion || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Document Sections */}
      <div className="space-y-6">

        {/* 1. Resumen Ejecutivo */}
        <div>
          <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
            1. RESUMEN EJECUTIVO
          </h2>
          <p className="text-slate-700 leading-relaxed text-xs text-justify">
            {proposal.resumenEjecutivo}
          </p>
        </div>

        {/* 2. Beneficios */}
        <div>
          <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
            2. BENEFICIOS DE LA PROPUESTA
          </h2>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
            {proposal.beneficios?.map((b, idx) => (
              <li key={idx} className="leading-relaxed">{b}</li>
            ))}
          </ul>
        </div>

        {/* 3. Alcance, Exclusiones y Entregables */}
        <div>
          <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
            3. ALCANCE, EXCLUSIONES Y ENTREGABLES
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <h3 className="font-bold text-[#1E5F8A] mb-1">3.1 Alcance Técnico del Proyecto:</h3>
              <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-2">
                {proposal.alcanceExclusionesEntregables?.alcance?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-amber-800 mb-1">3.2 Exclusiones (Fuera de Alcance):</h3>
              <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-2">
                {proposal.alcanceExclusionesEntregables?.exclusiones?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-emerald-800 mb-1">3.3 Entregables Formales:</h3>
              <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-2">
                {proposal.alcanceExclusionesEntregables?.entregables?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Visual Page Break Indicator (Secciones 1-3 en Página 1, Sección 4 en adelante en Página 2) */}
        <div className="my-8 py-3 border-y-2 border-dashed border-slate-300 bg-slate-100/70 -mx-6 sm:-mx-10 md:-mx-12 px-6 flex items-center justify-between text-xs text-slate-500 font-semibold select-none">
          <span className="flex items-center space-x-1.5 text-[#0A3D62]">
            <span>📄</span>
            <span>FIN DE PÁGINA 1 (Secciones 1, 2 y 3)</span>
          </span>
          <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-slate-300 uppercase tracking-wider">
            Salto de Página (.docx)
          </span>
          <span className="flex items-center space-x-1.5 text-[#0A3D62]">
            <span>INICIO DE PÁGINA 2</span>
            <span>📄</span>
          </span>
        </div>

        {/* 4. Objetivo */}
        <div>
          <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
            4. OBJETIVO GENERAL Y ESPECÍFICOS
          </h2>
          <p className="text-slate-700 leading-relaxed text-xs text-justify">
            {proposal.objetivo}
          </p>
        </div>

        {/* 5. Descripción */}
        <div>
          <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
            5. DESCRIPCIÓN DE LA SOLUCIÓN PROPUESTA
          </h2>
          <p className="text-slate-700 leading-relaxed text-xs text-justify">
            {proposal.descripcion}
          </p>
        </div>

        {/* 6. Índice Análisis Operativo */}
        <div>
          <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
            6. ÍNDICE DE ANÁLISIS OPERATIVO
          </h2>
          <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 pl-2">
            {proposal.indiceAnalisisOperativo?.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ol>
        </div>

        {/* 7. Análisis Operativo */}
        <div>
          <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-3">
            7. ANÁLISIS OPERATIVO DETALLADO
          </h2>

          <div className="space-y-6 text-xs">
            {proposal.analisisOperativo?.map((step, idx) => {
              const img = images[idx];
              return (
                <div key={idx} className="border-l-2 border-[#0A3D62] pl-3 py-1 space-y-2">
                  <h3 className="font-bold text-[#0A3D62] text-xs">
                    Paso 7.{idx + 1}: {step.titulo}
                  </h3>

                  {img && (
                    <div className="my-2 text-center bg-slate-50 p-3 rounded border border-slate-200">
                      <img
                        src={img.dataUrl}
                        alt={img.title}
                        className="max-h-64 max-w-full mx-auto rounded shadow-sm border border-slate-300 mb-1.5"
                      />
                      <p className="text-[11px] font-bold text-slate-600 italic">
                        [IMAGEN_{idx + 1}] {img.title}
                      </p>
                      {img.description && (
                        <p className="text-[10px] text-slate-500 italic">
                          {img.description}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-slate-700 leading-relaxed text-justify">
                    {step.explicacion}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 8. Descargo */}
        <div>
          <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
            8. DESCARGO Y CLÁUSULA ESTÁNDAR
          </h2>
          <p className="text-slate-500 italic text-[11px] leading-relaxed text-justify bg-slate-50 p-3 rounded border border-slate-200">
            {proposal.descargo}
          </p>
        </div>

      </div>

      {/* Footer Page Bar Simulation */}
      <div className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
        <span>{metadata.footerText || 'Advansys SRL'}</span>
        <span>Página 1 de 1</span>
      </div>

      </div>
    </div>
  );
};
