import React, { useState, useEffect, useRef } from 'react';
import { SlideDeck, SlideItem, UploadedImage, MetadataHeader } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  FileText, 
  Sparkles, 
  Layers, 
  MessageSquare, 
  CheckCircle2, 
  ArrowRight,
  Layout,
  Presentation
} from 'lucide-react';

interface SlideViewerProps {
  deck: SlideDeck;
  metadata?: MetadataHeader;
  images?: UploadedImage[];
  currentSlideIndex?: number;
  onSlideChange?: (index: number) => void;
  fullWidth?: boolean;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
  deck,
  metadata,
  images = [],
  currentSlideIndex: externalIndex,
  onSlideChange,
  fullWidth = false,
}) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = externalIndex !== undefined ? externalIndex : internalIndex;
  const currentSlide: SlideItem | undefined = deck.slides[activeIndex] || deck.slides[0];

  const setIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, deck.slides.length - 1));
    if (onSlideChange) {
      onSlideChange(clamped);
    } else {
      setInternalIndex(clamped);
    }
  };

  const nextSlide = () => setIndex(activeIndex + 1);
  const prevSlide = () => setIndex(activeIndex - 1);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, isFullscreen, deck.slides.length]);

  if (!currentSlide) {
    return (
      <div className="p-8 text-center bg-slate-900 text-slate-300 rounded-2xl">
        <Presentation className="w-12 h-12 mx-auto mb-2 opacity-40 text-blue-400" />
        <p className="font-semibold text-sm">No hay diapositivas en esta presentación.</p>
      </div>
    );
  }

  // Find image if referenced
  const slideImage = currentSlide.imageRef
    ? images.find((_, i) => `[IMAGEN_${i + 1}]` === currentSlide.imageRef) || images.find(img => img.id === currentSlide.imageRef)
    : images[0];

  const totalSlides = deck.slides.length;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col select-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-8 flex items-center justify-center'
          : 'w-full'
      }`}
    >
      {/* 16:9 Slide Canvas */}
      <div
        className={`relative w-full aspect-[16/9] max-w-full rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700/60 transition-all flex flex-col justify-between ${
          (currentSlide.layout === 'title' || activeIndex === 0)
            ? 'bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-[#0A3D62] dark:via-[#082b47] dark:to-[#041a2c] text-slate-900 dark:text-white'
            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
        }`}
      >
        {/* Top Decorative Green & Navy Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#2ECC71] via-[#0A3D62] to-[#1E5F8A] shrink-0" />

        {/* Slide Header (Except Title Slide) */}
        {currentSlide.layout !== 'title' && activeIndex !== 0 && (
          <div className="px-6 sm:px-10 pt-5 pb-2 flex items-start justify-between gap-4 shrink-0">
            <div className="min-w-0">
              {currentSlide.category && (
                <span className="inline-block text-[10px] sm:text-xs font-black tracking-widest text-[#0A3D62] dark:text-[#2ECC71] uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-white/10 border border-blue-200/60 dark:border-white/10 mb-1.5">
                  {currentSlide.category}
                </span>
              )}
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#0A3D62] dark:text-white tracking-tight leading-tight truncate">
                {currentSlide.title}
              </h2>
              {currentSlide.subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-blue-200/90 font-medium mt-0.5 truncate">
                  {currentSlide.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-black text-[#0A3D62] dark:text-white tracking-widest">
                ADVANSYS
              </div>
            </div>
          </div>
        )}

        {/* Slide Body Content */}
        <div className="flex-1 px-6 sm:px-10 py-3 overflow-y-auto flex flex-col justify-center min-h-0">
          {/* LAYOUT 1: TITLE SLIDE */}
          {(currentSlide.layout === 'title' || activeIndex === 0) && (
            <div className="space-y-4 my-auto max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0A3D62] text-white dark:bg-white/10 border border-[#0A3D62] dark:border-[#2ECC71]/40 dark:text-[#2ECC71] text-xs font-bold tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>{currentSlide.category || `TICKET ${deck.ticketNo || metadata?.ticketNo || 'PROPUESTA'}`}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#0A3D62] dark:text-white tracking-tight leading-tight">
                {currentSlide.title || deck.title}
              </h1>

              <p className="text-sm sm:text-lg text-slate-600 dark:text-blue-200/90 font-medium leading-relaxed">
                {currentSlide.subtitle || deck.subtitle || `Propuesta Técnica y Ejecutiva de Solución para ${deck.client || metadata?.cliente || 'el Cliente'}`}
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-white/10">
                <span className="font-semibold text-slate-800 dark:text-white">
                  Cliente: <span className="text-[#0A3D62] dark:text-blue-300 font-normal">{deck.client || metadata?.cliente || 'N/A'}</span>
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  Proyecto: <span className="text-[#0A3D62] dark:text-blue-300 font-normal">{deck.project || metadata?.nombreProyecto || 'N/A'}</span>
                </span>
                <span>•</span>
                <span className="text-slate-500 dark:text-slate-400">{deck.date || metadata?.fecha || new Date().toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          )}

          {/* LAYOUT 2: TWO COLUMN */}
          {currentSlide.layout === 'two-column' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-stretch py-2">
              <div className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 sm:p-5 flex flex-col justify-start shadow-sm">
                <h3 className="text-sm sm:text-base font-bold text-[#0A3D62] dark:text-[#60a5fa] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0A3D62] dark:bg-[#60a5fa]" />
                  {currentSlide.leftTitle || 'Puntos Clave'}
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  {currentSlide.leftBullets?.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#0A3D62] dark:text-blue-400 font-bold shrink-0">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 sm:p-5 flex flex-col justify-start shadow-sm">
                <h3 className="text-sm sm:text-base font-bold text-emerald-700 dark:text-[#2ECC71] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-[#2ECC71]" />
                  {currentSlide.rightTitle || 'Detalles & Entregables'}
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  {currentSlide.rightBullets?.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 dark:text-[#2ECC71] font-bold shrink-0">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* LAYOUT 3: CARDS / TILES */}
          {currentSlide.layout === 'cards' && currentSlide.cards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-2">
              {currentSlide.cards.map((card, i) => (
                <div
                  key={i}
                  className="bg-slate-50 hover:bg-blue-50/30 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-between hover:border-[#0A3D62]/40 dark:hover:border-blue-400/50 transition-colors shadow-sm"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-[#0A3D62] dark:bg-[#0A3D62] border border-blue-200 dark:border-blue-400/30 text-[#2ECC71] flex items-center justify-center font-bold text-xs mb-2.5 shadow-sm">
                      0{i + 1}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0A3D62] dark:text-white mb-1.5 leading-snug">
                      {card.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LAYOUT 4: PROCESS STEPS */}
          {currentSlide.layout === 'steps' && currentSlide.steps && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-2 items-stretch">
              {currentSlide.steps.map((step, i) => (
                <div
                  key={i}
                  className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-start relative group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-[#2ECC71] text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                      0{step.stepNumber || i + 1}
                    </span>
                    {i < currentSlide.steps!.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 hidden lg:block" />
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#0A3D62] dark:text-white mb-1 leading-snug">
                    {step.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* LAYOUT 5: IMAGE + TEXT */}
          {(currentSlide.layout === 'image-text' || currentSlide.imageRef) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center py-2 h-full">
              <div className="lg:col-span-6 space-y-3">
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  {currentSlide.bullets?.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#2ECC71] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-6 flex items-center justify-center bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 p-2 overflow-hidden max-h-[260px] sm:max-h-[320px]">
                {slideImage ? (
                  <img
                    src={slideImage.dataUrl}
                    alt={slideImage.title}
                    className="max-h-[240px] sm:max-h-[300px] w-auto max-w-full object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                    <Layout className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <span>Diagrama / Captura técnica</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LAYOUT 6: CONCLUSION */}
          {currentSlide.layout === 'conclusion' && (
            <div className="max-w-2xl mx-auto text-center space-y-4 py-2 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-[#2ECC71] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-[#0A3D62] dark:text-white">
                {currentSlide.title}
              </h3>
              <ul className="space-y-2.5 text-left text-xs sm:text-sm text-slate-700 dark:text-slate-200 max-w-xl mx-auto">
                {currentSlide.bullets?.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="w-5 h-5 rounded-full bg-[#0A3D62] dark:bg-[#2ECC71] text-white dark:text-slate-950 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* LAYOUT 7: DEFAULT BULLETS */}
          {currentSlide.layout === 'bullets' && (
            <div className="space-y-3 py-2 max-w-4xl">
              <ul className="space-y-3 text-xs sm:text-base text-slate-700 dark:text-slate-200">
                {currentSlide.bullets?.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] mt-2 shrink-0" />
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Slide Footer */}
        <div className="px-6 sm:px-10 py-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0 bg-slate-50/80 dark:bg-slate-950/40">
          <div className="truncate max-w-[70%]">
            {deck.client ? `Cliente: ${deck.client}` : ''} {deck.ticketNo ? `| Ticket: ${deck.ticketNo}` : ''} {deck.title ? `| ${deck.title}` : ''}
          </div>
          <div className="font-bold text-[#0A3D62] dark:text-slate-300">
            {activeIndex + 1} / {totalSlides}
          </div>
        </div>
      </div>

      {/* Control Bar Below Slide */}
      <div className="mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm">
        {/* Previous / Next Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevSlide}
            disabled={activeIndex === 0}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Diapositiva anterior (Flecha Izquierda)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-bold text-slate-800 dark:text-slate-200">
            {activeIndex + 1} de {totalSlides}
          </span>

          <button
            type="button"
            onClick={nextSlide}
            disabled={activeIndex === totalSlides - 1}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Siguiente diapositiva (Flecha Derecha o Espacio)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Carousel Selector Buttons */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto max-w-md px-2 py-0.5 no-scrollbar">
          {deck.slides.map((s, idx) => (
            <button
              key={s.id || idx}
              type="button"
              onClick={() => setIndex(idx)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeIndex === idx
                  ? 'bg-[#0A3D62] text-white dark:bg-[#2ECC71] dark:text-slate-950 scale-105 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent'
              }`}
              title={`Ir a diapositiva ${idx + 1}: ${s.title}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Actions (Speaker Notes & Fullscreen) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer border ${
              showNotes 
                ? 'bg-[#0A3D62] text-white border-[#0A3D62] dark:bg-blue-600 dark:border-blue-500' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
            title="Notas del orador"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#2ECC71]" />
            <span className="hidden sm:inline">Notas</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Ver en pantalla completa'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Speaker Notes Box */}
      {showNotes && (
        <div className="mt-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-150 shadow-sm">
          <div className="flex items-center gap-1.5 font-bold text-[#0A3D62] dark:text-emerald-400 uppercase tracking-wider text-[11px]">
            <MessageSquare className="w-3.5 h-3.5 text-[#2ECC71]" />
            <span>Guía para el Expositor (Diapositiva #{activeIndex + 1})</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {currentSlide.speakerNotes || 'Sin notas del orador redactadas para esta diapositiva.'}
          </p>
        </div>
      )}
    </div>
  );
};
