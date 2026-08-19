import React from 'react';
import { MetadataHeader, TechnicalDoc, UploadedImage } from '../types';
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
  const bannerSvg = getAdvansysBannerSvg(
    metadata.headerBrandTag || 'ADVANSYS',
    metadata.headerSubtitle ?? 'Documentación técnica interna',
    metadata.logoDataUrl
  );
  const tables = technicalDoc.tables || [];
  const bodyText = [
    technicalDoc.ruta,
    technicalDoc.flujoOperativo,
    technicalDoc.diseno,
    technicalDoc.consideracionesTecnicas,
  ].join('\n');

  const unusedTables = tables.filter((_, idx) => {
    const tag = `[TABLA_${idx + 1}]`;
    return !bodyText.toUpperCase().includes(tag.toUpperCase());
  });
  const unusedImages = images.filter((_, idx) => {
    const tag = `[IMAGEN_${idx + 1}]`;
    return !bodyText.toUpperCase().includes(tag.toUpperCase());
  });

  const section = (number: string, title: string, text?: string) => (
    <div>
      <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
        {number}. {title}
      </h2>
      {text?.trim() ? (
        <RichTextBlock text={text} tables={tables} images={images} />
      ) : (
        <p className="text-xs text-slate-400 italic">Sin información especificada.</p>
      )}
    </div>
  );

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="advansys-document-sheet max-w-4xl min-w-0 w-full mx-auto bg-white shadow-2xl rounded-sm border border-slate-300 p-4 sm:p-8 md:p-10 text-slate-900 font-sans leading-relaxed text-sm relative overflow-x-hidden">
        <div className="-mx-4 sm:-mx-8 md:-mx-10 -mt-4 sm:-mt-8 md:-mt-10 mb-6 border-b-4 border-[#2ECC71] shadow-md overflow-hidden rounded-t-sm relative bg-[#021024]">
          <img
            src={bannerSvg}
            alt="Advansys Header Cover Banner"
            className="w-full h-auto object-cover object-center"
          />
        </div>

        <div className="text-center mb-2">
          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-[#2ECC71] text-slate-950 uppercase tracking-wider">
            Uso interno Dev / QA
          </span>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-[#0A3D62] uppercase tracking-tight">
            Documentación Técnica Interna y Especificación de Desarrollo
          </h1>
        </div>

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
          {section('1', 'Ruta de Acceso & Navegación en el Sistema', technicalDoc.ruta)}
          {section('2', 'Flujo Operativo Interno', technicalDoc.flujoOperativo)}
          {section('3', 'Diseño de Interfaz y Estructura de Datos', technicalDoc.diseno)}
          {section('4', 'Consideraciones Técnicas y de Seguridad', technicalDoc.consideracionesTecnicas)}

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

          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              5. Código de Ejemplo / Scripts
            </h2>
            {technicalDoc.codigoEjemplo?.trim() ? (
              <pre className="text-[11px] leading-relaxed font-mono text-emerald-300 bg-slate-900 p-3.5 rounded-lg border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                {technicalDoc.codigoEjemplo}
              </pre>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No aplica código o scripts para este requerimiento.
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <span>USO INTERNO EXCLUSIVO ADVANSYS</span>
          <span className="inline-flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {metadata.footerText || 'Advansys SRL'}
          </span>
        </div>
      </div>
    </div>
  );
};
