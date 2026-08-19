import React from 'react';
import { ProposalSection, MetadataHeader, UploadedImage, getEffectiveTitles } from '../types';
import { FileText } from 'lucide-react';
import { getAdvansysBannerSvg } from '../data/banner';
import { formatInlineBold, PreviewTable, PreviewImage, RichTextBlock } from './DocumentPreviewBlocks';

interface DocxPreviewProps {
  metadata: MetadataHeader;
  proposal: ProposalSection;
  images: UploadedImage[];
}

export const DocxPreview: React.FC<DocxPreviewProps> = ({ metadata, proposal, images }) => {
  const titles = getEffectiveTitles(metadata.customTitles);
  const bannerSvg = getAdvansysBannerSvg(
    metadata.headerBrandTag || 'ADVANSYS',
    metadata.headerSubtitle ?? '',
    metadata.logoDataUrl
  );
  const tables = proposal.tables || [];

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="advansys-document-sheet max-w-4xl min-w-0 w-full mx-auto bg-white shadow-2xl rounded-sm border border-slate-300 p-4 sm:p-8 md:p-10 text-slate-900 font-sans leading-relaxed text-sm relative overflow-x-hidden">
      
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
          {titles.mainTitle}
        </h1>
      </div>

      {/* Metadata Table Block */}
      <div className="border border-slate-300 rounded-md overflow-hidden mb-8 text-xs bg-slate-50/50">
        <div className="grid grid-cols-2 border-b border-slate-200 divide-x divide-slate-200">
          <div className="p-2.5">
            <span className="font-bold text-[#0A3D62] uppercase">CLIENTE: </span>
            <span className="text-slate-800">{metadata.cliente ? formatInlineBold(metadata.cliente) : 'N/A'}</span>
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
            <span className="text-slate-800">{metadata.nombreProyecto ? formatInlineBold(metadata.nombreProyecto) : 'N/A'}</span>
          </div>
          <div className="p-2.5">
            <span className="font-bold text-[#0A3D62] uppercase">MÓDULO / APLICACIÓN: </span>
            <span className="text-slate-800">{metadata.moduloAplicacion ? formatInlineBold(metadata.moduloAplicacion) : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Document Sections */}
      <div className="space-y-6">

        {/* 1. Resumen Ejecutivo */}
        {!titles.hideSection1 && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              1. {titles.section1.toUpperCase()}
            </h2>
            <RichTextBlock text={proposal.resumenEjecutivo} tables={tables} />
          </div>
        )}

        {/* 2. Beneficios */}
        {!titles.hideSection2 && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              2. {titles.section2.toUpperCase()}
            </h2>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
              {proposal.beneficios?.map((b, idx) => (
                <li key={idx} className="leading-relaxed">{formatInlineBold(b)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Alcance, Exclusiones y Entregables */}
        {!titles.hideSection3 && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              3. {titles.section3.toUpperCase()}
            </h2>

            <div className="space-y-3 text-xs">
              {!titles.hideSection3_1 && (
                <div>
                  <h3 className="font-bold text-[#1E5F8A] mb-1">
                    {titles.section3_1.startsWith('3.1') ? titles.section3_1 : `3.1 ${titles.section3_1}`}
                  </h3>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-2">
                    {proposal.alcanceExclusionesEntregables?.alcance?.map((item, idx) => (
                      <li key={idx}>{formatInlineBold(item)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!titles.hideSection3_2 && (
                <div>
                  <h3 className="font-bold text-[#0A3D62] mb-1">
                    {titles.section3_2.startsWith('3.2') ? titles.section3_2 : `3.2 ${titles.section3_2}`}
                  </h3>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-2">
                    {proposal.alcanceExclusionesEntregables?.exclusiones?.map((item, idx) => (
                      <li key={idx}>{formatInlineBold(item)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!titles.hideSection3_3 && (
                <div>
                  <h3 className="font-bold text-emerald-800 mb-1">
                    {titles.section3_3.startsWith('3.3') ? titles.section3_3 : `3.3 ${titles.section3_3}`}
                  </h3>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-2">
                    {proposal.alcanceExclusionesEntregables?.entregables?.map((item, idx) => (
                      <li key={idx}>{formatInlineBold(item)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visual Page Break Indicator (Secciones 1-3 en Página 1, Sección 4 en adelante en Página 2) */}
        <div className="my-8 py-3 border-y-2 border-dashed border-slate-300 bg-slate-100/70 -mx-6 sm:-mx-10 md:-mx-12 px-6 flex items-center justify-between text-xs text-slate-500 font-semibold select-none">
          <span className="flex items-center space-x-1.5 text-[#0A3D62]">
            <FileText className="w-3.5 h-3.5 text-[#0A3D62]" />
            <span>FIN DE PÁGINA 1 (Secciones 1, 2 y 3)</span>
          </span>
          <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-slate-300 uppercase tracking-wider">
            Salto de Página (.docx)
          </span>
          <span className="flex items-center space-x-1.5 text-[#0A3D62]">
            <span>INICIO DE PÁGINA 2</span>
            <FileText className="w-3.5 h-3.5 text-[#0A3D62]" />
          </span>
        </div>

        {/* 4. Objetivo */}
        {!titles.hideSection4 && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              4. {titles.section4.toUpperCase()}
            </h2>
            <RichTextBlock text={proposal.objetivo} tables={tables} />
          </div>
        )}

        {/* 5. Descripción */}
        {!titles.hideSection5 && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              5. {titles.section5.toUpperCase()}
            </h2>
            <RichTextBlock text={proposal.descripcion} tables={tables} />
          </div>
        )}

        {/* 6. Índice Análisis Operativo */}
        {!titles.hideSection6 && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              6. {titles.section6.toUpperCase()}
            </h2>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 pl-2">
              {proposal.indiceAnalisisOperativo?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ol>
          </div>
        )}

        {/* 7. Análisis Operativo */}
        {!titles.hideSection7 && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-3">
              7. {titles.section7.toUpperCase()}
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
                      <PreviewImage image={img} index={idx + 1} />
                    )}

                    <RichTextBlock text={step.explicacion} tables={tables} images={images} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tablas no insertadas con etiqueta */}
        {tables.filter((_, idx) => {
          const tag = `[TABLA_${idx + 1}]`;
          const blob = [
            proposal.resumenEjecutivo,
            proposal.objetivo,
            proposal.descripcion,
            proposal.descargo,
            ...(proposal.analisisOperativo || []).map((s) => s.explicacion),
          ].join('\n');
          return !blob.toUpperCase().includes(tag.toUpperCase());
        }).length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              TABLAS DE APOYO
            </h2>
            {tables.map((table, idx) => {
              const tag = `[TABLA_${idx + 1}]`;
              const blob = [
                proposal.resumenEjecutivo,
                proposal.objetivo,
                proposal.descripcion,
                proposal.descargo,
                ...(proposal.analisisOperativo || []).map((s) => s.explicacion),
              ].join('\n');
              if (blob.toUpperCase().includes(tag.toUpperCase())) return null;
              return <PreviewTable key={table.id} table={table} />;
            })}
          </div>
        )}

        {/* 8. Descargo */}
        {!titles.hideSection8 && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              8. {titles.section8.toUpperCase()}
            </h2>
            <div className="text-slate-500 italic text-[11px] leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
              <RichTextBlock text={proposal.descargo} tables={tables} className="text-slate-500 italic text-[11px] leading-relaxed text-justify" />
            </div>
          </div>
        )}
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
