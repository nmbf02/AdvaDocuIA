import React from 'react';
import { MetadataHeader, TechnicalDoc, UploadedImage, getEffectiveTechnicalTitles, getEffectiveTechnicalHeaderFooter } from '../types';
import { FileText } from 'lucide-react';
import { getAdvansysBannerSvg } from '../data/banner';
import { formatInlineBold, PreviewTable, PreviewImage, RichTextBlock } from './DocumentPreviewBlocks';

interface TechnicalDocPreviewProps {
  metadata: MetadataHeader;
  technicalDoc: TechnicalDoc;
  images: UploadedImage[];
}

export const TechnicalDocPreview: React.FC<TechnicalDocPreviewProps> = ({
  metadata,
  technicalDoc,
  images,
}) => {
  const titles = getEffectiveTechnicalTitles(metadata.customTitles || technicalDoc.customTitles);
  const headerFooter = getEffectiveTechnicalHeaderFooter(technicalDoc, metadata);
  const mainTitle = technicalDoc.tituloDocumento?.trim() || titles.techMainTitle;

  const bannerSvg = getAdvansysBannerSvg(
    headerFooter.techHeaderBrandTag || 'ADVANSYS',
    headerFooter.techHeaderSubtitle || 'Documentación técnica interna',
    metadata.logoDataUrl
  );
  const tables = technicalDoc.tables || [];
  const bodyText = [
    !titles.hideTechSection1 && technicalDoc.ruta?.trim() ? technicalDoc.ruta : '',
    !titles.hideTechSection2 && technicalDoc.flujoOperativo?.trim() ? technicalDoc.flujoOperativo : '',
    !titles.hideTechSection3 && technicalDoc.diseno?.trim() ? technicalDoc.diseno : '',
    !titles.hideTechSection4 && technicalDoc.consideracionesTecnicas?.trim() ? technicalDoc.consideracionesTecnicas : '',
  ].join('\n');

  const unusedTables = tables.filter((_, idx) => {
    const tag = `[TABLA_${idx + 1}]`;
    return !bodyText.toUpperCase().includes(tag.toUpperCase());
  });
  const unusedImages = images.filter((_, idx) => {
    const tag = `[IMAGEN_${idx + 1}]`;
    return !bodyText.toUpperCase().includes(tag.toUpperCase());
  });

  const section = (title: string, text?: string) => {
    if (!text?.trim()) return null;
    return (
      <div>
        <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
          {title}
        </h2>
        <RichTextBlock text={text.trim()} tables={tables} images={images} />
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="advansys-document-sheet max-w-4xl min-w-0 w-full mx-auto bg-white shadow-2xl rounded-sm border border-slate-300 p-4 sm:p-8 md:p-10 text-slate-900 font-sans leading-relaxed text-sm relative overflow-x-hidden">
        {/* Banner o Encabezado Corporativo según la opción configurada */}
        {headerFooter.includeFirstPageHeaderImage ? (
          <div className="relative -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 md:-mx-10 md:-mt-10 mb-6 w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] md:w-[calc(100%+5rem)] overflow-hidden rounded-t-sm shadow-md bg-[#0A3D62]">
            <img 
              src={bannerSvg} 
              alt="Advansys Technical Cover Banner" 
              className="w-full h-auto object-cover object-center"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-slate-300 pb-2.5 mb-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0A3D62] tracking-wider text-[11px] uppercase">
                {headerFooter.techHeaderBrandTag || 'ADVANSYS'}
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-[#2ECC71] text-[11px] tracking-wide uppercase">
                {headerFooter.techHeaderSubtitle || 'ESPECIFICACIÓN TÉCNICA INTERNA DE DESARROLLO'}
              </span>
            </div>
            {(headerFooter.techHeaderRightText || metadata.ticketNo) && (
              <span className="font-mono text-slate-400 text-[10px] uppercase font-semibold">
                {headerFooter.techHeaderRightText || metadata.ticketNo}
              </span>
            )}
          </div>
        )}

        <div className="text-center mb-2">
          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-[#2ECC71] text-slate-950 uppercase tracking-wider">
            Uso interno Dev / QA
          </span>
        </div>
        
        {!titles.hideTechMainTitle && (
          <div className="text-center mb-6">
            <h1 className="text-lg font-bold text-[#0A3D62] uppercase tracking-tight">
              {mainTitle}
            </h1>
          </div>
        )}

        <div className="border border-slate-300 rounded-md overflow-hidden mb-8 text-xs bg-slate-50/50">
          <div className="grid grid-cols-2 border-b border-slate-200 divide-x divide-slate-200">
            <div className="p-2.5">
              <span className="font-bold text-[#0A3D62] uppercase">CLIENTE: </span>
              <span className="text-slate-800">
                {metadata.cliente ? formatInlineBold(metadata.cliente) : 'N/A'}
              </span>
            </div>
            <div className="p-2.5">
              <span className="font-bold text-[#0A3D62] uppercase">FECHA: </span>
              <span className="text-slate-800">{metadata.fecha || 'N/A'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-slate-200 divide-x divide-slate-200">
            <div className="p-2.5">
              <span className="font-bold text-[#0A3D62] uppercase">TICKET NO.: </span>
              <span className="text-slate-800">{metadata.ticketNo || 'N/A'}</span>
            </div>
            <div className="p-2.5">
              <span className="font-bold text-[#0A3D62] uppercase">MÓDULO: </span>
              <span className="text-slate-800">{metadata.moduloAplicacion || 'N/A'}</span>
            </div>
          </div>
          <div className="p-2.5">
            <span className="font-bold text-[#0A3D62] uppercase">PROYECTO: </span>
            <span className="text-slate-800">
              {metadata.nombreProyecto ? formatInlineBold(metadata.nombreProyecto) : 'N/A'}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {!titles.hideTechSection1 && Boolean(technicalDoc.ruta?.trim()) && section(titles.techSection1, technicalDoc.ruta)}
          {!titles.hideTechSection2 && Boolean(technicalDoc.flujoOperativo?.trim()) && section(titles.techSection2, technicalDoc.flujoOperativo)}
          {!titles.hideTechSection3 && Boolean(technicalDoc.diseno?.trim()) && section(titles.techSection3, technicalDoc.diseno)}
          {!titles.hideTechSection4 && Boolean(technicalDoc.consideracionesTecnicas?.trim()) && section(titles.techSection4, technicalDoc.consideracionesTecnicas)}

          {unusedTables.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
                Tablas adicionales
              </h2>
              {unusedTables.map((table) => (
                <PreviewTable key={table.id} table={table} />
              ))}
            </div>
          )}

          {unusedImages.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
                Imágenes adicionales
              </h2>
              {unusedImages.map((image) => {
                const originalIndex = images.findIndex((item) => item.id === image.id) + 1;
                return <PreviewImage key={image.id} image={image} index={originalIndex} />;
              })}
            </div>
          )}

          {!titles.hideTechSection5 && Boolean(technicalDoc.codigoEjemplo?.trim()) && (
            <div>
              <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
                {titles.techSection5}
              </h2>
              <pre className="text-[11px] leading-relaxed font-mono text-emerald-300 bg-slate-900 p-3.5 rounded-lg border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                {technicalDoc.codigoEjemplo.trim()}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <span className="font-medium text-slate-500 uppercase">{headerFooter.techFooterText || 'DOCUMENTO CONFIDENCIAL DE USO INTERNO ADVANSYS'}</span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <FileText className="w-3 h-3" />
            <span>Página 1 de 1</span>
          </span>
        </div>
      </div>
    </div>
  );
};
