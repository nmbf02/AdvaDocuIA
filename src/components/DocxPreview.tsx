import React from 'react';
import { ProposalSection, MetadataHeader, UploadedImage, getEffectiveTitles, getOperativoSectionOrder, getEffectiveProposalHeaderFooter, COVER_SCOPE_MAX_ITEMS, getEffectiveCommercialPage, formatUsd, parseCommercialNumber, resolvePage2LogoDataUrl, getSubsections, subsectionHasContent, sectionHasBodyOrSubs, NestedSectionField, getOperativeStepLevel, getOperativeStepLabels } from '../types';
import { FileText, Clock, Calendar, DollarSign, Globe } from 'lucide-react';
import { getAdvansysBannerSvg, getCoverInfoCardSvg } from '../data/banner';
import { formatFechaEs } from '../utils/dateFormat';
import { formatInlineBold, PreviewTable, PreviewImage, RichTextBlock } from './DocumentPreviewBlocks';

interface DocxPreviewProps {
  metadata: MetadataHeader;
  proposal: ProposalSection;
  images: UploadedImage[];
}

export const DocxPreview: React.FC<DocxPreviewProps> = ({ metadata, proposal, images }) => {
  const titles = getEffectiveTitles(metadata.customTitles);
  const { analysisFirst, indiceNumber, analisisNumber } = getOperativoSectionOrder(titles);
  const headerFooter = getEffectiveProposalHeaderFooter(metadata);
  const bannerSvg = getAdvansysBannerSvg(
    headerFooter.headerBrandTag || 'ADVANSYS',
    titles.coverSubtitle,
    metadata.logoDataUrl,
    {
      coverTitle: titles.mainTitle,
      cliente: metadata.cliente,
      fecha: formatFechaEs(metadata.fecha),
      ticketNo: metadata.ticketNo,
      propuestaNo: metadata.propuestaNo,
      showInfoCard: true,
    }
  );
  const tables = proposal.tables || [];
  const commercial = getEffectiveCommercialPage(proposal);
  const page2LogoUrl = resolvePage2LogoDataUrl(metadata, proposal.commercial);
  const page2InfoCardSvg = getCoverInfoCardSvg({
    cliente: metadata.cliente,
    fecha: formatFechaEs(metadata.fecha),
    ticketNo: metadata.ticketNo,
    propuestaNo: metadata.propuestaNo,
    omitPropuestaValue: true,
    flushToPageMargin: true,
  });
  const commercialTotal = commercial.lineItems.reduce((sum, item) => {
    const hours = parseCommercialNumber(item.hours);
    const unit = parseCommercialNumber(item.unitValue);
    return sum + hours * unit;
  }, 0);
  const conditionIcons = [Clock, Calendar, DollarSign, Globe];
  const previewSubs = (field: NestedSectionField, sectionNum: string) =>
    getSubsections(proposal, field)
      .filter(subsectionHasContent)
      .map((sub, i) => (
        <div key={sub.id} className="mt-3">
          <h3 className="text-xs font-bold text-[#0A3D62] mb-1">
            {sectionNum}.{i + 1} {sub.title.trim() || 'Subsección'}
          </h3>
          {sub.body.trim() ? <RichTextBlock text={sub.body.trim()} tables={tables} images={images} /> : null}
        </div>
      ));
  const hasScopeAlcance = !titles.hideSection3_1 && (proposal.alcanceExclusionesEntregables?.alcance || []).some(i => i && i.trim().length > 0);
  const hasScopeExclusiones = !titles.hideSection3_2 && (proposal.alcanceExclusionesEntregables?.exclusiones || []).some(i => i && i.trim().length > 0);
  const hasScopeEntregables = !titles.hideSection3_3 && (proposal.alcanceExclusionesEntregables?.entregables || []).some(i => i && i.trim().length > 0);
  const scopeCardCount = [hasScopeAlcance, hasScopeExclusiones, hasScopeEntregables].filter(Boolean).length;
  const scopeGridClass =
    scopeCardCount <= 1 ? 'grid grid-cols-1 gap-4' : scopeCardCount === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-4';
  const hasLaterSections =
    (!titles.hideSection4 && sectionHasBodyOrSubs(proposal.objetivo, getSubsections(proposal, 'objetivo'))) ||
    (!titles.hideSection5 && sectionHasBodyOrSubs(proposal.descripcion, getSubsections(proposal, 'descripcion'))) ||
    (!titles.hideSection6 && (proposal.indiceAnalisisOperativo || []).filter((i) => i && i.trim().length > 0).length > 0) ||
    (!titles.hideSection7 &&
      (proposal.analisisOperativo || []).filter((s) => (s.titulo && s.titulo.trim().length > 0) || (s.explicacion && s.explicacion.trim().length > 0)).length > 0) ||
    (!titles.hideSection8 && sectionHasBodyOrSubs(proposal.descargo, getSubsections(proposal, 'descargo')));

  const indicePreview = !titles.hideSection6 && (proposal.indiceAnalisisOperativo || []).filter(i => i && i.trim().length > 0).length > 0 ? (
          <div key="indice-operativo">
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              {indiceNumber}. {titles.section6.toUpperCase()}
            </h2>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 pl-2">
              {proposal.indiceAnalisisOperativo
                ?.filter(item => item && item.trim().length > 0)
                .map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
            </ol>
          </div>
        ) : null;

  const analisisPreview = !titles.hideSection7 && (proposal.analisisOperativo || []).filter(s => (s.titulo && s.titulo.trim().length > 0) || (s.explicacion && s.explicacion.trim().length > 0)).length > 0 ? (
          <div key="analisis-operativo">
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-3">
              {analisisNumber}. {titles.section7.toUpperCase()}
            </h2>

            <div className="space-y-6 text-xs">
              {(() => {
                const steps = (proposal.analisisOperativo || []).filter(step => (step.titulo && step.titulo.trim().length > 0) || (step.explicacion && step.explicacion.trim().length > 0));
                const labels = getOperativeStepLabels(steps, analisisNumber);
                return steps.map((step, idx) => {
                  const isExplicitNone = step.imagenId === 'none' || step.referenciaImagen === 'none';
                  const linkedImg = isExplicitNone
                    ? null
                    : (step.imagenId ? images.find(img => img.id === step.imagenId) : null) ||
                      (step.referenciaImagen ? (() => {
                        const m = step.referenciaImagen.match(/\[IMAGEN_(\d+)\]/i);
                        if (m) {
                          const targetIndex = parseInt(m[1], 10) - 1;
                          return images[targetIndex] || null;
                        }
                        return images.find(img => img.id === step.referenciaImagen) || null;
                      })() : null) ||
                      (step.explicacion ? (() => {
                        const m = step.explicacion.match(/\[IMAGEN_(\d+)\]/i);
                        if (m) {
                          const targetIndex = parseInt(m[1], 10) - 1;
                          return images[targetIndex] || null;
                        }
                        return null;
                      })() : null);
                  const imgIdx = linkedImg ? images.indexOf(linkedImg) + 1 : null;
                  const explicacionHasSameImageTag = Boolean(
                    linkedImg && imgIdx && step.explicacion && new RegExp(`\\[IMAGEN_${imgIdx}\\]`, 'i').test(step.explicacion)
                  );

                  return (
                    <div key={idx} className="border-l-2 border-[#0A3D62] pl-3 py-1 space-y-2" style={{ marginLeft: getOperativeStepLevel(step) * 16 }}>
                      <h3 className="font-bold text-[#0A3D62] text-xs">
                        Paso {labels[idx]}: {step.titulo?.trim() || `Paso ${labels[idx]}`}
                      </h3>

                      {linkedImg && imgIdx && !explicacionHasSameImageTag && (
                        <PreviewImage image={linkedImg} index={imgIdx} />
                      )}

                      {step.explicacion?.trim() && (
                        <RichTextBlock text={step.explicacion.trim()} tables={tables} images={images} />
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : null;

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="advansys-document-sheet max-w-4xl min-w-0 w-full mx-auto bg-white shadow-2xl rounded-sm border border-slate-300 p-4 sm:p-8 md:p-10 text-slate-900 font-sans leading-relaxed text-sm relative overflow-x-hidden">
      
      {/* Header Banner with superimposed info card */}
      <div className="-mx-4 sm:-mx-8 md:-mx-10 -mt-4 sm:-mt-8 md:-mt-10 mb-3 relative bg-white">
        <img 
          src={bannerSvg} 
          alt="Advansys Header Cover Banner" 
          className="w-full h-auto block"
        />
      </div>

      {/* Project / analysis name */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black tracking-[0.18em] text-[#2ECC71] uppercase mb-1">Proyecto</p>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0A3D62] leading-tight">
            {metadata.nombreProyecto ? formatInlineBold(metadata.nombreProyecto) : 'Nombre del análisis'}
          </h1>
          <p className="text-sm font-semibold text-[#1E5F8A] mt-1">
            {metadata.moduloAplicacion ? formatInlineBold(metadata.moduloAplicacion) : 'Aplicación o módulo'}
          </p>
        </div>
        <div className="hidden sm:flex w-12 h-12 rounded-full border-2 border-[#0A3D62]/30 items-center justify-center shrink-0 mt-2">
          <span className="w-5 h-5 rounded-full border-2 border-[#0A3D62]" />
        </div>
      </div>

      {/* Document Sections */}
      <div className="space-y-6">

        {/* 1-2. Resumen Ejecutivo + Beneficios (two columns) */}
        {(!titles.hideSection1 && sectionHasBodyOrSubs(proposal.resumenEjecutivo, getSubsections(proposal, 'resumenEjecutivo'))) ||
        (!titles.hideSection2 && (proposal.beneficios || []).filter(b => b && b.trim().length > 0).length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {!titles.hideSection1 && sectionHasBodyOrSubs(proposal.resumenEjecutivo, getSubsections(proposal, 'resumenEjecutivo')) && (
              <div>
                <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2 leading-[1.5]">
                  {titles.section1}
                </h2>
                {proposal.resumenEjecutivo?.trim() ? (
                  <RichTextBlock text={proposal.resumenEjecutivo.trim()} tables={tables} className="text-slate-700 leading-relaxed text-[9pt] text-justify" />
                ) : null}
                {previewSubs('resumenEjecutivo', '1')}
              </div>
            )}
            {!titles.hideSection2 && (proposal.beneficios || []).filter(b => b && b.trim().length > 0).length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2 leading-[1.5]">
                  {titles.section2}
                </h2>
                <ul className="space-y-2 text-[9pt] text-slate-700">
                  {proposal.beneficios
                    ?.filter(b => b && b.trim().length > 0)
                    .slice(0, COVER_SCOPE_MAX_ITEMS)
                    .map((b, idx) => (
                      <li key={idx} className="flex gap-2 leading-relaxed">
                        <span className="mt-0.5 w-4 h-4 rounded-full bg-[#2ECC71] text-white text-[10px] font-black flex items-center justify-center shrink-0">✓</span>
                        <span>{formatInlineBold(b)}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* 3. Alcance, Exclusiones y Entregables — grid of 3 */}
        {!titles.hideSection3 && scopeCardCount > 0 && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-3 leading-[1.5]">
              {titles.section3}
            </h2>
            <div className={scopeGridClass}>
              {hasScopeAlcance && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="font-bold text-[#1E5F8A] mb-3 text-[9pt] uppercase tracking-wide leading-[1.5]">
                    {titles.section3_1.replace(/^3\.1\s*/, '')}
                  </h3>
                  <ul className="space-y-2 text-[9pt] text-slate-700">
                    {proposal.alcanceExclusionesEntregables?.alcance
                      ?.filter(i => i && i.trim().length > 0)
                      .slice(0, COVER_SCOPE_MAX_ITEMS)
                      .map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="shrink-0 text-[#0A3D62]">•</span>
                          <span>{formatInlineBold(item.replace(/^[•\-\*]\s+/, ''))}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {hasScopeExclusiones && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="font-bold text-[#0A3D62] mb-3 text-[9pt] uppercase tracking-wide leading-[1.5]">
                    {titles.section3_2.replace(/^3\.2\s*/, '')}
                  </h3>
                  <ul className="space-y-2 text-[9pt] text-slate-700">
                    {proposal.alcanceExclusionesEntregables?.exclusiones
                      ?.filter(i => i && i.trim().length > 0)
                      .slice(0, COVER_SCOPE_MAX_ITEMS)
                      .map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="shrink-0 text-[#0A3D62]">•</span>
                          <span>{formatInlineBold(item.replace(/^[•\-\*]\s+/, ''))}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {hasScopeEntregables && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="font-bold text-emerald-800 mb-3 text-[9pt] uppercase tracking-wide leading-[1.5]">
                    {titles.section3_3.replace(/^3\.3\s*/, '')}
                  </h3>
                  <ul className="space-y-2 text-[9pt] text-slate-700">
                    {proposal.alcanceExclusionesEntregables?.entregables
                      ?.filter(i => i && i.trim().length > 0)
                      .slice(0, COVER_SCOPE_MAX_ITEMS)
                      .map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="shrink-0 text-[#0A3D62]">•</span>
                          <span>{formatInlineBold(item.replace(/^[•\-\*]\s+/, ''))}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {!titles.hideConfidentiality && (
          <div className="pt-2">
            <h2 className="text-sm font-bold text-[#2ECC71] uppercase tracking-wide mb-1 leading-[1.5]">
              {titles.confidentialityTitle}
            </h2>
            <p className="text-[9pt] text-slate-600 leading-relaxed">
              {titles.confidentialityText}
            </p>
          </div>
        )}

        {!commercial.hide && (
          <>
            <div className="my-8 py-3 border-y-2 border-dashed border-slate-300 bg-slate-100/70 -mx-6 sm:-mx-10 md:-mx-12 px-6 flex items-center justify-between text-xs text-slate-500 font-semibold select-none">
              <span className="flex items-center space-x-1.5 text-[#0A3D62]">
                <FileText className="w-3.5 h-3.5" />
                <span>FIN DE PÁGINA 1</span>
              </span>
              <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-slate-300 uppercase tracking-wider">
                Salto de Página
              </span>
              <span className="flex items-center space-x-1.5 text-[#0A3D62]">
                <span>{titles.sectionPage2}</span>
                <FileText className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="min-h-[11in] flex flex-col">
            <div className="mb-2">
              {page2LogoUrl ? (
                <img src={page2LogoUrl} alt="Logo" className="h-14 w-auto max-w-[240px] object-contain mb-5" />
              ) : (
                <p className="text-2xl font-extrabold text-[#0A3D62] mb-5">{headerFooter.headerBrandTag || 'ADVANSYS'}</p>
              )}
              <div className="relative">
                <img src={page2InfoCardSvg} alt="" className="w-full h-auto block" />
                <div className="absolute left-[82%] top-[48%] right-0 text-right pr-3 text-[17px] sm:text-[20px] font-extrabold text-[#0A3D62] leading-tight">
                  {metadata.propuestaNo?.trim() || '—'}
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-4 bg-[#0A3D62] text-white text-[10px] font-bold tracking-wider uppercase px-3 py-2.5">
                <span />
                <span className="text-center">Horas</span>
                <span className="text-center">Valor unitario (USD)</span>
                <span className="text-right">Subtotal (USD)</span>
              </div>
              {commercial.lineItems.map((item, idx) => {
                const hours = parseCommercialNumber(item.hours);
                const unit = parseCommercialNumber(item.unitValue);
                return (
                  <div key={idx} className="grid grid-cols-4 items-center px-3 py-3 text-[11px] border-t border-slate-100">
                    <span className="font-semibold text-[#0A3D62]">{item.description || '—'}</span>
                    <span className="text-center text-[#1E5F8A] font-bold">{hours || '—'}</span>
                    <span className="text-center text-slate-700">{unit ? formatUsd(unit) : '—'}</span>
                    <span className="text-right font-extrabold text-[#0A3D62]">{hours && unit ? formatUsd(hours * unit) : '—'}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="rounded-xl border border-slate-200 px-5 py-2.5">
                <span className="text-sm font-black text-[#0A3D62] tracking-wide">TOTAL</span>
              </div>
              <div className="text-xl font-black text-slate-900">{formatUsd(commercialTotal).replace('USD$', 'US$')}</div>
            </div>
            {commercial.itbisExempt && (
              <p className="text-right text-[11px] font-bold text-red-600 mt-1">{commercial.itbisLabel}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-8 mt-8">
              <div>
                <h3 className="text-sm font-bold text-[#0A3D62] uppercase mb-3">{commercial.conditionsTitle}</h3>
                <div className="rounded-2xl bg-slate-100/80 p-4 space-y-3">
                  {commercial.conditions.map((cond, idx) => {
                    const Icon = conditionIcons[idx] || Clock;
                    return (
                      <div key={idx} className="flex gap-3 items-start">
                        <span className="w-8 h-8 rounded-full bg-[#0A3D62] text-white flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <p className="text-[11px] text-slate-700 leading-snug">
                          <span className="font-bold text-[#0A3D62]">{cond.title} </span>
                          {cond.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2ECC71] uppercase mb-3">{commercial.nextStepsTitle}</h3>
                <ul className="space-y-2 text-[11px] text-slate-700">
                  {commercial.nextSteps.map((step, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-[#0A3D62]">•</span>
                      <span>{formatInlineBold(step)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-bold text-[#0A3D62] uppercase mb-2">{commercial.notesTitle}</h3>
              <div className="rounded-2xl bg-slate-100 px-4 py-3">
                <p className="text-[11px] text-[#1E3A5F] leading-relaxed">{formatInlineBold(commercial.notes)}</p>
              </div>
            </div>
            <div className="flex-1 min-h-[3rem]" />
            <div className="pt-6">
              <h3 className="text-sm font-bold text-[#0A3D62] uppercase mb-16">{commercial.reviewedByTitle}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="flex flex-col items-center">
                  <div className="w-[88%] border-t border-[#0A3D62] mb-3" />
                  <p className="text-[11px] font-bold text-[#0A3D62] text-center">{commercial.reviewedLeftRole}</p>
                  <p className="text-[11px] text-[#1E5F8A] text-center">{commercial.reviewedBy.trim() || commercial.reviewedLeftOrg}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-[88%] border-t border-[#0A3D62] mb-3" />
                  <p className="text-[11px] font-bold text-[#0A3D62] text-center">{commercial.reviewedRightRole}</p>
                  <p className="text-[11px] text-[#1E5F8A] text-center">{commercial.reviewedRightOrg}</p>
                </div>
              </div>
            </div>
            <div className="-mx-4 sm:-mx-8 md:-mx-10 mt-8 bg-[#0A3D62] text-white text-[10px] sm:text-xs font-semibold px-4 sm:px-8 py-3 flex flex-wrap justify-between gap-2">
              <span>{commercial.footerPhone}</span>
              <span>{commercial.footerEmail}</span>
              <span>{commercial.footerWeb}</span>
              <span>{commercial.footerCity}</span>
            </div>
            </div>
          </>
        )}

        {hasLaterSections && (
          <div className="my-8 py-3 border-y-2 border-dashed border-slate-300 bg-slate-100/70 -mx-6 sm:-mx-10 md:-mx-12 px-6 flex items-center justify-between text-xs text-slate-500 font-semibold select-none">
            <span className="flex items-center space-x-1.5 text-[#0A3D62]">
              <FileText className="w-3.5 h-3.5 text-[#0A3D62]" />
              <span>{commercial.hide ? 'FIN DE PÁGINA 1' : 'FIN DE PÁGINA 2'}</span>
            </span>
            <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-slate-300 uppercase tracking-wider">
              Salto de Página (.docx)
            </span>
            <span className="flex items-center space-x-1.5 text-[#0A3D62]">
              <span>{commercial.hide ? 'INICIO DE PÁGINA 2' : 'INICIO DE PÁGINA 3'}</span>
              <FileText className="w-3.5 h-3.5 text-[#0A3D62]" />
            </span>
          </div>
        )}

        {/* 4. Objetivo */}
        {!titles.hideSection4 && sectionHasBodyOrSubs(proposal.objetivo, getSubsections(proposal, 'objetivo')) && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              4. {titles.section4.toUpperCase()}
            </h2>
            {proposal.objetivo?.trim() ? (
              <RichTextBlock text={proposal.objetivo.trim()} tables={tables} images={images} />
            ) : null}
            {previewSubs('objetivo', '4')}
          </div>
        )}

        {/* 5. Descripción */}
        {!titles.hideSection5 && sectionHasBodyOrSubs(proposal.descripcion, getSubsections(proposal, 'descripcion')) && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              5. {titles.section5.toUpperCase()}
            </h2>
            {proposal.descripcion?.trim() ? (
              <RichTextBlock text={proposal.descripcion.trim()} tables={tables} images={images} />
            ) : null}
            {previewSubs('descripcion', '5')}
          </div>
        )}

        {analysisFirst ? (
          <>
            {analisisPreview}
            {indicePreview}
          </>
        ) : (
          <>
            {indicePreview}
            {analisisPreview}
          </>
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

        {/* 8. Descargo (Only shown if user entered descargo text) */}
        {!titles.hideSection8 && sectionHasBodyOrSubs(proposal.descargo, getSubsections(proposal, 'descargo')) && (
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62] uppercase border-b-2 border-[#2ECC71] pb-1 mb-2">
              8. {titles.section8.toUpperCase()}
            </h2>
            {proposal.descargo?.trim() ? (
              <div className="text-slate-500 italic text-[11px] leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                <RichTextBlock text={proposal.descargo.trim()} tables={tables} images={images} className="text-slate-500 italic text-[11px] leading-relaxed text-justify" />
              </div>
            ) : null}
            {previewSubs('descargo', '8')}
          </div>
        )}
      </div>

      {/* Footer Page Bar Simulation */}
      <div className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
        <span>{headerFooter.footerText || 'Advansys SRL'}</span>
        <span>Página 1 de 1</span>
      </div>

      </div>
    </div>
  );
};
