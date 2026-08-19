import React, { useState } from 'react';
import { 
  SlideDeck, 
  SlideItem, 
  SlideLayout, 
  MetadataHeader, 
  UploadedImage, 
  ProposalSection 
} from '../types';
import { 
  FileDown, 
  Play, 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Layers, 
  Eye, 
  Edit3, 
  Save, 
  Check, 
  Loader2, 
  Presentation, 
  Layout,
  MessageSquare,
  FileText,
  RotateCcw
} from 'lucide-react';
import { SlideViewer } from './SlideViewer';
import { generateAdvansysPptx } from '../utils/pptxGenerator';
import { convertProposalToSlideDeck } from '../utils/slideDeckTemplates';

interface SlideDeckEditorProps {
  deck: SlideDeck;
  metadata: MetadataHeader;
  images: UploadedImage[];
  proposal?: ProposalSection | null;
  onChange: (updated: SlideDeck) => void;
  onSave?: () => void;
  onSaveNewVersion?: (versionTag: string, versionNote: string) => void;
}

export const SlideDeckEditor: React.FC<SlideDeckEditorProps> = ({
  deck,
  metadata,
  images = [],
  proposal,
  onChange,
  onSave,
  onSaveNewVersion,
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview');
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const currentSlide: SlideItem = deck.slides[activeSlideIndex] || deck.slides[0];

  const updateCurrentSlide = (patch: Partial<SlideItem>) => {
    const updated = deck.slides.map((s, idx) =>
      idx === activeSlideIndex ? { ...s, ...patch } : s
    );
    onChange({ ...deck, slides: updated });
  };

  const handleAddSlide = (layout: SlideLayout = 'bullets') => {
    const newSlideNum = deck.slides.length + 1;
    const newSlide: SlideItem = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      slideNumber: newSlideNum,
      layout,
      category: `0${newSlideNum}. SECCIÓN TÉCNICA`,
      title: `Título de la Diapositiva ${newSlideNum}`,
      subtitle: 'Subtítulo o descripción breve',
      bullets: [
        'Primer punto clave a destacar.',
        'Segundo aspecto técnico relevante.',
        'Conclusión o impacto para el negocio.',
      ],
      speakerNotes: 'Notas del orador para guiar la exposición de este punto.',
    };

    const nextSlides = [...deck.slides, newSlide].map((s, i) => ({
      ...s,
      slideNumber: i + 1,
    }));
    onChange({ ...deck, slides: nextSlides });
    setActiveSlideIndex(nextSlides.length - 1);
  };

  const handleDuplicateSlide = (index: number) => {
    const target = deck.slides[index];
    if (!target) return;
    const duplicated: SlideItem = {
      ...target,
      id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title: `${target.title} (Copia)`,
    };
    const nextSlides = [
      ...deck.slides.slice(0, index + 1),
      duplicated,
      ...deck.slides.slice(index + 1),
    ].map((s, i) => ({ ...s, slideNumber: i + 1 }));

    onChange({ ...deck, slides: nextSlides });
    setActiveSlideIndex(index + 1);
  };

  const handleDeleteSlide = (index: number) => {
    if (deck.slides.length <= 1) {
      alert('La presentación debe contener al menos una diapositiva.');
      return;
    }
    const nextSlides = deck.slides
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, slideNumber: i + 1 }));

    onChange({ ...deck, slides: nextSlides });
    setActiveSlideIndex(Math.max(0, index - 1));
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === deck.slides.length - 1)) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const nextSlides = [...deck.slides];
    const temp = nextSlides[index];
    nextSlides[index] = nextSlides[targetIdx];
    nextSlides[targetIdx] = temp;

    const renumbered = nextSlides.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    onChange({ ...deck, slides: renumbered });
    setActiveSlideIndex(targetIdx);
  };

  const handleExportPPTX = async () => {
    try {
      setIsExporting(true);
      const blob = await generateAdvansysPptx(deck, metadata, images);
      const client = (metadata.cliente || deck.client || 'Cliente').trim();
      const ticket = (metadata.ticketNo || deck.ticketNo || 'Presentacion').trim();
      const proj = (metadata.nombreProyecto || deck.title || 'Propuesta').trim();
      const filename = `${client} - ${ticket} - ${proj} (Presentacion).pptx`
        .replace(/[\/\\:*?"<>|]/g, '-')
        .replace(/\s+/g, ' ');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error generating PPTX:', err);
      alert('Hubo un problema al exportar el archivo PowerPoint (.pptx).');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSyncFromProposal = () => {
    if (!proposal) return;
    if (confirm('¿Deseas regenerar las diapositivas a partir del documento actual? Se actualizarán los textos y secciones.')) {
      const converted = convertProposalToSlideDeck(proposal, metadata, images);
      onChange(converted);
      setActiveSlideIndex(0);
    }
  };

  const handleGenerateWithAI = async () => {
    try {
      setIsGeneratingAI(true);
      const res = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata,
          rawRequirements: '',
          images,
          proposal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.deck) {
        throw new Error(data.error || 'No se pudo generar la presentación con IA.');
      }

      onChange(data.deck);
      setActiveSlideIndex(0);
      setActiveTab('preview');
    } catch (err: any) {
      console.error('Error generating AI slides:', err);
      alert(`Error al generar diapositivas con IA: ${err.message || 'Intenta nuevamente.'}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl overflow-hidden flex flex-col min-w-0 transition-colors">
      
      {/* Top Banner Toolbar */}
      <div className="bg-[#0A3D62] text-white p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#1E5F8A]">
        
        {/* Left: Deck Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-white/10 border border-white/10 text-[#2ECC71] shrink-0">
            <Presentation className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black truncate text-white">
              {deck.title || metadata.nombreProyecto || 'Presentación de Diapositivas'}
            </h2>
            <p className="text-[11px] text-blue-200 truncate">
              {deck.slides.length} diapositivas listas • {metadata.cliente || 'Cliente'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* AI Generator Button */}
          <button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={isGeneratingAI}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Generar o reestructurar diapositivas ejecutivas con Inteligencia Artificial"
          >
            {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isGeneratingAI ? 'Generando con IA...' : 'Generar con IA'}</span>
          </button>

          {/* Sync from proposal button if exists */}
          {proposal && (
            <button
              type="button"
              onClick={handleSyncFromProposal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-blue-100 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              title="Sincronizar y mapear el contenido exacto de tu documento Word a Diapositivas"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Sincronizar con Doc</span>
            </button>
          )}

          {/* View Tab Switcher (Preview vs Visual Form Editor) */}
          <div className="bg-black/20 p-1 rounded-xl flex gap-0.5 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-[#0A3D62] shadow'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-[#0A3D62] shadow'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          </div>

          {/* Download PowerPoint .pptx */}
          <button
            type="button"
            onClick={handleExportPPTX}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Descargar presentación en formato Microsoft PowerPoint (.pptx)"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            <span>{isExporting ? 'Generando...' : 'Descargar PPTX'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Slides Navigator Sidebar + Active Slide Canvas / Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px] divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        
        {/* LEFT COLUMN: Slide Carousel / List (4 cols on lg) */}
        <div className="lg:col-span-4 xl:col-span-3 p-3 bg-slate-50/80 dark:bg-slate-950/60 overflow-y-auto max-h-[620px] space-y-2">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-600 dark:text-slate-400">Diapositivas ({deck.slides.length})</span>
            <button
              type="button"
              onClick={() => handleAddSlide('bullets')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0A3D62] dark:text-[#2ECC71] hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#2ECC71]" />
              <span>Agregar</span>
            </button>
          </div>

          <div className="space-y-2">
            {deck.slides.map((slide, idx) => (
              <div
                key={slide.id || idx}
                onClick={() => setActiveSlideIndex(idx)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left relative group ${
                  activeSlideIndex === idx
                    ? 'bg-blue-50/90 dark:bg-slate-800 border-[#0A3D62] dark:border-[#2ECC71] shadow-sm'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                      activeSlideIndex === idx 
                        ? 'bg-[#0A3D62] text-white dark:bg-[#2ECC71] dark:text-slate-950' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className={`text-xs font-bold truncate ${
                      activeSlideIndex === idx
                        ? 'text-[#0A3D62] dark:text-white'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {slide.title || `Diapositiva ${idx + 1}`}
                    </span>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSlide(idx, 'up');
                      }}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSlide(idx, 'down');
                      }}
                      disabled={idx === deck.slides.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSlide(idx);
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                      title="Eliminar diapositiva"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pl-7">
                  <span className="truncate">{slide.category || slide.layout}</span>
                  <span className="capitalize text-slate-400 dark:text-slate-500">{slide.layout}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleAddSlide('bullets')}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#2ECC71]" />
              <span>Nueva Diapositiva</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Active Slide Viewer / Editor (8-9 cols on lg) */}
        <div className="lg:col-span-8 xl:col-span-9 p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-950 flex flex-col justify-start">
          
          {activeTab === 'preview' ? (
            <SlideViewer
              deck={deck}
              metadata={metadata}
              images={images}
              currentSlideIndex={activeSlideIndex}
              onSlideChange={setActiveSlideIndex}
            />
          ) : (
            /* FORM EDITOR FOR ACTIVE SLIDE */
            <div className="space-y-4 max-w-3xl w-full mx-auto bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#2ECC71] text-slate-950 text-xs font-black">
                      Slide #{activeSlideIndex + 1}
                    </span>
                    <span>Editar Contenido de Diapositiva</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDuplicateSlide(activeSlideIndex)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Copy className="w-3 h-3 text-[#0A3D62] dark:text-blue-400" />
                    <span>Duplicar</span>
                  </button>
                </div>
              </div>

              {/* Layout Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Diseño / Plantilla de la Diapositiva
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'title', label: 'Portada' },
                    { id: 'bullets', label: 'Viñetas Clave' },
                    { id: 'two-column', label: '2 Columnas' },
                    { id: 'cards', label: 'Tarjetas' },
                    { id: 'steps', label: 'Pasos en Flujo' },
                    { id: 'image-text', label: 'Imagen + Texto' },
                    { id: 'conclusion', label: 'Conclusión' },
                  ].map((lay) => (
                    <button
                      key={lay.id}
                      type="button"
                      onClick={() => updateCurrentSlide({ layout: lay.id as SlideLayout })}
                      className={`p-2 rounded-xl text-left border font-semibold transition-all cursor-pointer ${
                        currentSlide.layout === lay.id
                          ? 'bg-[#0A3D62] text-white border-[#2ECC71] shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {lay.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category / Super-Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoría / Etiqueta Superior (ej. 01. LO EXPUESTO)
                </label>
                <input
                  type="text"
                  value={currentSlide.category || ''}
                  onChange={(e) => updateCurrentSlide({ category: e.target.value })}
                  placeholder="01. LO EXPUESTO"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0A3D62]/20 focus:border-[#0A3D62]"
                />
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Título Principal
                  </label>
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-[#0A3D62]/20 focus:border-[#0A3D62]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subtítulo / Bajada
                  </label>
                  <input
                    type="text"
                    value={currentSlide.subtitle || ''}
                    onChange={(e) => updateCurrentSlide({ subtitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0A3D62]/20 focus:border-[#0A3D62]"
                  />
                </div>
              </div>

              {/* Bullet Points */}
              {(currentSlide.layout === 'bullets' || currentSlide.layout === 'image-text' || currentSlide.layout === 'conclusion' || currentSlide.layout === 'title') && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Puntos Clave (Viñetas)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const bullets = [...(currentSlide.bullets || []), 'Nuevo punto clave...'];
                        updateCurrentSlide({ bullets });
                      }}
                      className="text-xs text-[#0A3D62] dark:text-emerald-400 font-semibold hover:underline"
                    >
                      + Añadir viñeta
                    </button>
                  </div>
                  <div className="space-y-2">
                    {currentSlide.bullets?.map((b, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => {
                            const bullets = [...(currentSlide.bullets || [])];
                            bullets[i] = e.target.value;
                            updateCurrentSlide({ bullets });
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#0A3D62]/20 focus:border-[#0A3D62]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const bullets = currentSlide.bullets?.filter((_, idx) => idx !== i);
                            updateCurrentSlide({ bullets });
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2-Column Fields */}
              {currentSlide.layout === 'two-column' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      value={currentSlide.leftTitle || ''}
                      onChange={(e) => updateCurrentSlide({ leftTitle: e.target.value })}
                      placeholder="Título Columna Izquierda"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-[#0A3D62] dark:text-blue-400 font-bold"
                    />
                    <textarea
                      rows={4}
                      value={currentSlide.leftBullets?.join('\n') || ''}
                      onChange={(e) => updateCurrentSlide({ leftBullets: e.target.value.split('\n') })}
                      placeholder="Una viñeta por línea..."
                      className="w-full p-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      value={currentSlide.rightTitle || ''}
                      onChange={(e) => updateCurrentSlide({ rightTitle: e.target.value })}
                      placeholder="Título Columna Derecha"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-emerald-700 dark:text-emerald-400 font-bold"
                    />
                    <textarea
                      rows={4}
                      value={currentSlide.rightBullets?.join('\n') || ''}
                      onChange={(e) => updateCurrentSlide({ rightBullets: e.target.value.split('\n') })}
                      placeholder="Una viñeta por línea..."
                      className="w-full p-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* Speaker Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Notas del Orador (Guía para la exposición)</span>
                </label>
                <textarea
                  rows={3}
                  value={currentSlide.speakerNotes || ''}
                  onChange={(e) => updateCurrentSlide({ speakerNotes: e.target.value })}
                  placeholder="Redacta lo que el presentador dirá en esta diapositiva..."
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 leading-relaxed focus:ring-2 focus:ring-[#0A3D62]/20 focus:border-[#0A3D62]"
                />
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
