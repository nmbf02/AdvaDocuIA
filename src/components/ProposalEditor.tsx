import React, { useState, useRef, useEffect } from 'react';
import { ProposalSection, MetadataHeader, UploadedImage, DocumentTable, getEffectiveTitles, getOperativoSectionOrder, SlideDeck, DocumentStatus, SavedProposal, DEFAULT_DESCARGO_TEXT, COVER_SCOPE_MAX_ITEMS, getEffectiveCommercialPage, getPage2LogoMode, Page2LogoMode, DEFAULT_COMMERCIAL_PAGE, NestedSectionField, getSubsections, createEmptySubsection, getOperativeStepLevel, getOperativeStepLabels, getOperativeSubtreeEnd, canIndentOperativeStep, canOutdentOperativeStep, indentOperativeStep, outdentOperativeStep, canMoveOperativeSubtreeUp, canMoveOperativeSubtreeDown, moveOperativeSubtree, swapOperativeSubtreeUp, swapOperativeSubtreeDown, normalizeOperativeStepLevels, MAX_OPERATIVE_STEP_LEVEL } from '../types';
import { FileDown, FileText, Edit3, Eye, Plus, Trash2, Sparkles, Wand2, Loader2, Cpu, Save, Check, GitBranch, Tag, X, Layers, CheckCircle2, CheckCheck, Presentation, Bold, ArrowRight, ArrowRightLeft, RotateCcw, Terminal, ChevronDown, ChevronUp, ChevronsUpDown, ChevronsDownUp, Table2, Image as ImageIcon, Upload, Paperclip, ExternalLink, IndentIncrease, IndentDecrease } from 'lucide-react';
import { generateAdvansysDocx } from '../utils/docxGenerator';
import { downloadAdvansysPdf } from '../utils/pdfGenerator';
import { DocxPreview } from './DocxPreview';
import { DocumentTablesEditor, InsertTableButton, createEmptyDocumentTable, tableTag } from './DocumentTablesEditor';
import { ImageUploader } from './ImageUploader';
import { SlideDeckEditor } from './SlideDeckEditor';
import { TechnicalDocEditor } from './TechnicalDocEditor';
import { convertProposalToSlideDeck, createDefaultSlideDeck } from '../utils/slideDeckTemplates';
import { createDefaultTechnicalDoc, proposalHasSubstance } from '../utils/technicalDocTemplates';
import { TextFormattingToolbar, handleAutoBulletKeyDown, toggleBoldAtTarget, readTextareaCaret, insertSnippetAtCaret, TextCaret } from './TextFormattingToolbar';
import { RichTextBlock } from './DocumentPreviewBlocks';

type ProposalTextField = 'resumenEjecutivo' | 'objetivo' | 'descripcion' | 'descargo';

interface ProposalEditorProps {
  proposal: ProposalSection;
  metadata: MetadataHeader;
  images: UploadedImage[];
  rawRequirements?: string;
  history?: SavedProposal[];
  currentDocumentId?: string | null;
  onChange: (updated: ProposalSection) => void;
  onSave?: () => void;
  onSaveNewVersion?: (versionTag: string, versionNote: string) => void;
  onRevertToSaved?: () => void;
  hasSavedVersion?: boolean;
  currentVersion?: string;
  status?: DocumentStatus;
  onStatusChange?: (newStatus: DocumentStatus) => void;
  lastSavedTime?: string | null;
  showSavedToast?: boolean;
  initialTab?: 'editor' | 'preview' | 'slides' | 'technical';
  onMetadataChange?: (updatedMetadata: MetadataHeader) => void;
  onLinkProposal?: (proposal: SavedProposal, syncContext: boolean) => void;
  onUnlinkProposal?: () => void;
  onOpenLinkedProposal?: () => void;
  onImagesChange?: (images: UploadedImage[]) => void;
}

export const ProposalEditor: React.FC<ProposalEditorProps> = ({
  proposal,
  metadata,
  images,
  rawRequirements = '',
  history = [],
  currentDocumentId = null,
  onChange,
  onSave,
  onSaveNewVersion,
  onRevertToSaved,
  hasSavedVersion = true,
  currentVersion = 'v1.0',
  status = 'borrador',
  onStatusChange,
  lastSavedTime,
  showSavedToast,
  initialTab = 'editor',
  onMetadataChange,
  onLinkProposal,
  onUnlinkProposal,
  onOpenLinkedProposal,
  onImagesChange,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'slides' | 'technical'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({ comercial: true });
  const [isExporting, setIsExporting] = useState<'docx' | 'pdf' | 'pptx' | null>(null);

  const toggleSectionCollapse = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const allProposalSectionKeys = ['resumen', 'beneficios', 'alcance', 'comercial', 'objetivo', 'descripcion', 'operativo', 'tablas', 'imagenes', 'descargo'];
  const areAllSectionsCollapsed = allProposalSectionKeys.every((k) => !!collapsedSections[k]);

  const handleToggleAllSections = () => {
    const newState = !areAllSectionsCollapsed;
    const nextMap: Record<string, boolean> = {};
    allProposalSectionKeys.forEach((k) => {
      nextMap[k] = newState;
    });
    setCollapsedSections(nextMap);
  };
  const [isRefining, setIsRefining] = useState(false);
  const [refiningAction, setRefiningAction] = useState<string | null>(null);
  const [refiningSectionKey, setRefiningSectionKey] = useState<string | null>(null);

  // New Version Modal State
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState('v2.0');
  const [newVersionNote, setNewVersionNote] = useState('');

  // Refs for text formatting and auto-bullets
  const resumenRef = useRef<HTMLTextAreaElement>(null);
  const objetivoRef = useRef<HTMLTextAreaElement>(null);
  const descripcionRef = useRef<HTMLTextAreaElement>(null);
  const descargoRef = useRef<HTMLTextAreaElement>(null);
  const stepRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const caretByKeyRef = useRef<Record<string, TextCaret>>({});

  const rememberCaret = (key: string, el: HTMLTextAreaElement | null) => {
    const caret = readTextareaCaret(el);
    if (caret) caretByKeyRef.current[key] = caret;
  };

  const caretHandlers = (key: string) => ({
    onSelect: (e: React.SyntheticEvent<HTMLTextAreaElement>) => rememberCaret(key, e.currentTarget),
    onClick: (e: React.MouseEvent<HTMLTextAreaElement>) => rememberCaret(key, e.currentTarget),
    onKeyUp: (e: React.KeyboardEvent<HTMLTextAreaElement>) => rememberCaret(key, e.currentTarget),
    onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => rememberCaret(key, e.currentTarget),
  });

  // Helper to get textarea ref for field
  const getTextareaRefForField = (field: ProposalTextField): React.RefObject<HTMLTextAreaElement | null> => {
    switch (field) {
      case 'resumenEjecutivo':
        return resumenRef;
      case 'objetivo':
        return objetivoRef;
      case 'descripcion':
        return descripcionRef;
      case 'descargo':
        return descargoRef;
      default:
        return { current: null };
    }
  };

  const insertTextAtCursor = (
    textarea: HTMLTextAreaElement | null,
    currentValue: string,
    textToInsert: string,
    caretKey?: string
  ): string => {
    const live = textarea && document.activeElement === textarea ? readTextareaCaret(textarea) : null;
    const saved = caretKey ? caretByKeyRef.current[caretKey] : null;
    const caret = live || saved || readTextareaCaret(textarea);
    const { newText, cursor } = insertSnippetAtCaret(currentValue, textToInsert, caret);
    if (caretKey) caretByKeyRef.current[caretKey] = { start: cursor, end: cursor };
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      }
    }, 10);
    return newText;
  };

  // Refs for Image picking & upload
  const pendingImageTargetRef = useRef<{ field?: ProposalTextField; stepIndex?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageTag = (index: number) => `[IMAGEN_${index}]`;

  const handlePickImageForField = (field: ProposalTextField) => {
    const fieldRef = getTextareaRefForField(field);
    rememberCaret(field, fieldRef.current);
    pendingImageTargetRef.current = { field };
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleStepImagePick = (stepIndex: number) => {
    rememberCaret(`step:${stepIndex}`, stepRefs.current[stepIndex]);
    pendingImageTargetRef.current = { stepIndex };
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !onImagesChange) return;

    const fileArr: File[] = Array.from(files);
    const newImages: UploadedImage[] = [];
    let processed = 0;

    fileArr.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          newImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            description: 'Captura de referencia para la propuesta',
            dataUrl: result,
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
          });
        }
        processed += 1;
        if (processed === fileArr.length) {
          const nextImages = [...images, ...newImages];
          onImagesChange(nextImages);

          const target = pendingImageTargetRef.current;
          if (target?.field && newImages.length) {
            const start = images.length + 1;
            const tags = newImages.map((_, i) => imageTag(start + i)).join('\n\n');
            const fieldRef = getTextareaRefForField(target.field);
            const currentVal = String(proposal[target.field] || '');
            const nextVal = insertTextAtCursor(fieldRef.current, currentVal, tags, target.field);
            handleStringChange(target.field, nextVal);
          } else if (target?.stepIndex !== undefined && newImages.length) {
            const sIdx = target.stepIndex;
            const newImg = newImages[0];
            const newImgIndex = images.length + 1;
            const steps = [...(proposal.analisisOperativo || [])];
            if (steps[sIdx]) {
              steps[sIdx] = {
                ...steps[sIdx],
                imagenId: newImg.id,
                referenciaImagen: imageTag(newImgIndex),
              };
              onChange({ ...proposal, analisisOperativo: steps });
            }
          }
          pendingImageTargetRef.current = null;
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleInsertExistingImage = (field: ProposalTextField, imageIndex: number) => {
    const tag = imageTag(imageIndex);
    const fieldRef = getTextareaRefForField(field);
    const currentVal = String(proposal[field] || '');
    const nextVal = insertTextAtCursor(fieldRef.current, currentVal, tag, field);
    handleStringChange(field, nextVal);
  };

  const handleStepImageSelect = (stepIndex: number, imageIdOrTag: string) => {
    const steps = [...(proposal.analisisOperativo || [])];
    if (!steps[stepIndex]) return;

    if (!imageIdOrTag || imageIdOrTag === 'none') {
      steps[stepIndex] = {
        ...steps[stepIndex],
        imagenId: 'none',
        referenciaImagen: 'none',
      };
    } else {
      const foundIdx = images.findIndex((img) => img.id === imageIdOrTag);
      if (foundIdx >= 0) {
        steps[stepIndex] = {
          ...steps[stepIndex],
          imagenId: imageIdOrTag,
          referenciaImagen: imageTag(foundIdx + 1),
        };
      } else {
        steps[stepIndex] = {
          ...steps[stepIndex],
          imagenId: imageIdOrTag,
          referenciaImagen: imageIdOrTag,
        };
      }
    }
    onChange({ ...proposal, analisisOperativo: steps });
  };

  const handleInsertImageTagInStep = (stepIndex: number, imageIndex: number) => {
    const steps = [...(proposal.analisisOperativo || [])];
    if (!steps[stepIndex]) return;
    const tag = imageTag(imageIndex);
    const stepEl = stepRefs.current[stepIndex];
    const currentExp = steps[stepIndex].explicacion || '';
    const nextExp = insertTextAtCursor(stepEl, currentExp, tag, `step:${stepIndex}`);
    steps[stepIndex] = {
      ...steps[stepIndex],
      explicacion: nextExp,
    };
    onChange({ ...proposal, analisisOperativo: steps });
  };

  const renderImageInsertBar = (field: ProposalTextField) => (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handlePickImageForField(field)}
        disabled={!onImagesChange}
        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-white hover:bg-blue-50 border border-slate-300 rounded transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
        title="Subir una imagen desde tu equipo e insertarla en este apartado"
      >
        <ImageIcon className="w-3.5 h-3.5 text-[#2ECC71]" />
        <span>Subir e insertar imagen</span>
      </button>
      {images.map((img, idx) => (
        <button
          key={img.id || idx}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleInsertExistingImage(field, idx + 1)}
          className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
          title={`Insertar ${imageTag(idx + 1)}: ${img.title || img.fileName || 'Imagen'}`}
        >
          +{imageTag(idx + 1)}
        </button>
      ))}
      {images.length > 0 && (
        <span className="text-[10px] text-slate-400 font-mono">
          ({images.length} disponible{images.length === 1 ? '' : 's'})
        </span>
      )}
    </div>
  );

  const renderInlineImages = (text: string) => {
    const matches = [...(text || '').matchAll(/\[IMAGEN_(\d+)\]/gi)];
    const indexes = [...new Set(matches.map((m) => parseInt(m[1], 10) - 1))].filter((i) => images[i]);
    if (!indexes.length) return null;
    return (
      <div className="space-y-2 mt-2">
        {indexes.map((i) => {
          const img = images[i];
          const widthPercent = Math.min(100, Math.max(25, img.widthPercent ?? 100));
          const align = img.align === 'left' || img.align === 'right' ? img.align : 'center';
          const alignClass = align === 'left' ? 'mr-auto' : align === 'right' ? 'ml-auto' : 'mx-auto';
          return (
            <figure
              key={img.id || i}
              className={`rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-2xs ${alignClass}`}
              style={{ width: `${widthPercent}%`, maxWidth: '100%' }}
            >
              <img
                src={img.dataUrl}
                alt={img.title}
                className="w-full max-h-48 object-contain bg-white"
              />
              <figcaption className="px-2.5 py-1.5 text-[11px] text-slate-600 flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-100/60">
                <span className="truncate">
                  <strong className="text-[#0A3D62]">{imageTag(i + 1)}</strong>
                  {img.title ? ` · ${img.title}` : ''}
                </span>
                {img.description && (
                  <span className="text-[10px] text-slate-400 italic truncate max-w-[200px]">
                    {img.description}
                  </span>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>
    );
  };

  const renderFieldLivePreview = (text: string) => {
    if (!(text || '').includes('```')) return null;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Vista del código</p>
        <RichTextBlock text={text} tables={proposal.tables || []} images={images} />
      </div>
    );
  };

  const titles = getEffectiveTitles(metadata.customTitles);
  const { analysisFirst, indiceNumber, analisisNumber } = getOperativoSectionOrder(titles);
  const operativeSteps = proposal.analisisOperativo || [];
  const operativeStepLabels = getOperativeStepLabels(operativeSteps, analisisNumber);

  const activeSlideDeck: SlideDeck = proposal.slideDeck || convertProposalToSlideDeck(proposal, metadata, images);

  const handleSlideDeckChange = (updatedDeck: SlideDeck) => {
    onChange({
      ...proposal,
      slideDeck: updatedDeck,
    });
  };

  // Field change helpers
  const handleStringChange = (field: keyof ProposalSection, value: string) => {
    onChange({
      ...proposal,
      [field]: value
    });
  };

  const updateSubsections = (field: NestedSectionField, next: ReturnType<typeof getSubsections>) => {
    onChange({
      ...proposal,
      subsections: { ...proposal.subsections, [field]: next },
    });
  };

  const renderSubsectionEditor = (field: NestedSectionField, sectionNum: string) => {
    const items = getSubsections(proposal, field);
    return (
      <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Subsecciones</p>
          <button
            type="button"
            className="text-[11px] font-semibold text-[#1E5F8A]"
            onClick={() => updateSubsections(field, [...items, createEmptySubsection()])}
          >
            + Agregar subsección
          </button>
        </div>
        {items.map((sub, idx) => (
          <div key={sub.id} className="bg-white rounded-lg border border-slate-200 p-2.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-[#0A3D62] shrink-0">{sectionNum}.{idx + 1}</span>
              <input
                className="flex-1 min-w-0 px-2 py-1 text-sm font-semibold border border-slate-200 rounded-md"
                placeholder="Título de la subsección"
                value={sub.title}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...sub, title: e.target.value };
                  updateSubsections(field, next);
                }}
              />
              <button
                type="button"
                className="text-slate-400 hover:text-rose-600 p-1"
                title="Quitar subsección"
                onClick={() => updateSubsections(field, items.filter((s) => s.id !== sub.id))}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md min-h-[64px]"
              placeholder="Contenido de la subsección"
              value={sub.body}
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...sub, body: e.target.value };
                updateSubsections(field, next);
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  // AI Refine Handler
  const handleAIRefine = async (action: 'polish_all' | 'complete_missing' | 'refine_section', sectionKey?: string) => {
    try {
      setIsRefining(true);
      setRefiningAction(
        action === 'polish_all' 
          ? 'Perfeccionando estilo y ortografía...' 
          : action === 'complete_missing' 
          ? 'Completando secciones vacías...' 
          : `Mejorando sección "${sectionKey}"...`
      );
      setRefiningSectionKey(sectionKey || null);

      const res = await fetch('/api/refine-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal,
          metadata,
          rawRequirements,
          images,
          action,
          sectionKey
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo refinar la propuesta con IA.");
      }

      onChange({ ...data.proposal, tables: proposal.tables || [] });
    } catch (err: any) {
      console.error("Error refining with AI:", err);
      alert(err.message || "Error al conectar con la IA de Advansys para perfeccionar el borrador.");
    } finally {
      setIsRefining(false);
      setRefiningAction(null);
      setRefiningSectionKey(null);
    }
  };

  // List item helpers for Beneficios
  const handleBeneficioChange = (index: number, val: string) => {
    const list = [...proposal.beneficios];
    list[index] = val;
    onChange({ ...proposal, beneficios: list });
  };

  const handleAddBeneficio = () => {
    onChange({ ...proposal, beneficios: [...proposal.beneficios, "Nuevo beneficio técnico..."] });
  };

  const handleRemoveBeneficio = (index: number) => {
    onChange({ ...proposal, beneficios: proposal.beneficios.filter((_, i) => i !== index) });
  };

  const insertTableIntoText = (current: string, textarea: HTMLTextAreaElement | null, caretKey: string) => {
    const tables = [...(proposal.tables || [])];
    tables.push(createEmptyDocumentTable(tables.length + 1));
    const tag = tableTag(tables.length);
    rememberCaret(caretKey, textarea);
    const nextText = insertTextAtCursor(textarea, current, tag, caretKey);
    return { tables, nextText };
  };

  const handleInsertTableInField = (field: 'resumenEjecutivo' | 'objetivo' | 'descripcion' | 'descargo') => {
    const fieldRef = getTextareaRefForField(field);
    const { tables, nextText } = insertTableIntoText(String(proposal[field] || ''), fieldRef.current, field);
    onChange({ ...proposal, [field]: nextText, tables });
    setActiveSectionFilter(field === 'resumenEjecutivo' ? 'resumen' : field === 'descripcion' ? 'descripcion' : field);
  };

  const handleInsertTableInStep = (index: number) => {
    const steps = [...(proposal.analisisOperativo || [])];
    const { tables, nextText } = insertTableIntoText(
      steps[index]?.explicacion || '',
      stepRefs.current[index],
      `step:${index}`
    );
    steps[index] = { ...steps[index], explicacion: nextText };
    onChange({ ...proposal, analisisOperativo: steps, tables });
  };

  const renderInlineTables = (text: string) => {
    const all = proposal.tables || [];
    const indexes = all
      .map((_, i) => i)
      .filter((i) => new RegExp(`\\[TABLA_${i + 1}\\]`, 'i').test(text || ''));
    if (!indexes.length) return null;
    const shownIds = new Set(indexes.map((i) => all[i].id));
    return (
      <DocumentTablesEditor
        compact
        tables={indexes.map((i) => all[i])}
        getTagIndex={(i) => indexes[i] + 1}
        onChange={(updated) => {
          const next = all
            .map((t) => {
              if (!shownIds.has(t.id)) return t;
              return updated.find((u) => u.id === t.id) || null;
            })
            .filter((t): t is DocumentTable => t !== null);
          onChange({ ...proposal, tables: next });
        }}
      />
    );
  };

  // Scope lists helpers
  const handleScopeListChange = (subfield: 'alcance' | 'exclusiones' | 'entregables', index: number, val: string) => {
    const current = [...(proposal.alcanceExclusionesEntregables?.[subfield] || [])];
    current[index] = val;
    onChange({
      ...proposal,
      alcanceExclusionesEntregables: {
        alcance: proposal.alcanceExclusionesEntregables?.alcance || [],
        exclusiones: proposal.alcanceExclusionesEntregables?.exclusiones || [],
        entregables: proposal.alcanceExclusionesEntregables?.entregables || [],
        [subfield]: current
      }
    });
  };

  const handleAddScopeItem = (subfield: 'alcance' | 'exclusiones' | 'entregables') => {
    const existing = proposal.alcanceExclusionesEntregables?.[subfield] || [];
    if (existing.length >= COVER_SCOPE_MAX_ITEMS) return;
    const current = [...existing, 'Nuevo ítem...'];
    onChange({
      ...proposal,
      alcanceExclusionesEntregables: {
        alcance: proposal.alcanceExclusionesEntregables?.alcance || [],
        exclusiones: proposal.alcanceExclusionesEntregables?.exclusiones || [],
        entregables: proposal.alcanceExclusionesEntregables?.entregables || [],
        [subfield]: current
      }
    });
  };

  const handleRemoveScopeItem = (subfield: 'alcance' | 'exclusiones' | 'entregables', index: number) => {
    const current = (proposal.alcanceExclusionesEntregables?.[subfield] || []).filter((_, i) => i !== index);
    onChange({
      ...proposal,
      alcanceExclusionesEntregables: {
        alcance: proposal.alcanceExclusionesEntregables?.alcance || [],
        exclusiones: proposal.alcanceExclusionesEntregables?.exclusiones || [],
        entregables: proposal.alcanceExclusionesEntregables?.entregables || [],
        [subfield]: current
      }
    });
  };

  const handleMoveScopeItem = (
    from: 'alcance' | 'exclusiones' | 'entregables',
    to: 'alcance' | 'exclusiones' | 'entregables',
    index: number
  ) => {
    const fromList = [...(proposal.alcanceExclusionesEntregables?.[from] || [])];
    if (index < 0 || index >= fromList.length) return;
    const [itemToMove] = fromList.splice(index, 1);
    const toList = [...(proposal.alcanceExclusionesEntregables?.[to] || []), itemToMove];

    onChange({
      ...proposal,
      alcanceExclusionesEntregables: {
        alcance: proposal.alcanceExclusionesEntregables?.alcance || [],
        exclusiones: proposal.alcanceExclusionesEntregables?.exclusiones || [],
        entregables: proposal.alcanceExclusionesEntregables?.entregables || [],
        [from]: fromList,
        [to]: toList
      }
    });
  };

  // Operative Step Helpers
  const commitOperativeSteps = (steps: typeof proposal.analisisOperativo) => {
    const updatedSteps = normalizeOperativeStepLevels(steps || []);
    onChange({
      ...proposal,
      analisisOperativo: updatedSteps,
      indiceAnalisisOperativo: updatedSteps.map((s) => s.titulo),
    });
  };

  const handleStepChange = (index: number, field: 'titulo' | 'explicacion', val: string) => {
    const steps = [...(proposal.analisisOperativo || [])];
    steps[index] = { ...steps[index], [field]: val };
    commitOperativeSteps(steps);
  };

  const handleAddStep = (afterIndex?: number, asChild = false) => {
    const currentSteps = proposal.analisisOperativo || [];
    const parentIndex = afterIndex ?? currentSteps.length - 1;
    const parentLevel = parentIndex >= 0 ? getOperativeStepLevel(currentSteps[parentIndex]) : -1;
    const nivel = asChild
      ? Math.min(MAX_OPERATIVE_STEP_LEVEL, parentLevel + 1)
      : 0;
    const insertAt = asChild && parentIndex >= 0
      ? getOperativeSubtreeEnd(currentSteps, parentIndex) + 1
      : currentSteps.length;
    const newStep = {
      paso: insertAt + 1,
      nivel,
      titulo: 'Descripción del flujo',
      explicacion: 'Detalle técnico del paso...',
      referenciaImagen: images[insertAt] ? `[IMAGEN_${insertAt + 1}]` : ''
    };
    const updatedSteps = [...currentSteps.slice(0, insertAt), newStep, ...currentSteps.slice(insertAt)];
    commitOperativeSteps(updatedSteps);
  };

  const handleRemoveStep = (index: number) => {
    const steps = proposal.analisisOperativo || [];
    const removedLevel = getOperativeStepLevel(steps[index]);
    const updatedSteps = steps
      .filter((_, i) => i !== index)
      .map((s, i) => {
        if (i >= index && getOperativeStepLevel(s) > removedLevel) {
          return { ...s, nivel: getOperativeStepLevel(s) - 1 };
        }
        return s;
      });
    commitOperativeSteps(updatedSteps);
  };

  const handleMoveStep = (fromIndex: number, toIndex: number) => {
    commitOperativeSteps(moveOperativeSubtree(proposal.analisisOperativo || [], fromIndex, toIndex));
  };

  const handleMoveStepUp = (index: number) => {
    commitOperativeSteps(swapOperativeSubtreeUp(proposal.analisisOperativo || [], index));
  };

  const handleMoveStepDown = (index: number) => {
    commitOperativeSteps(swapOperativeSubtreeDown(proposal.analisisOperativo || [], index));
  };

  const buildExportBasename = () => {
    const cliente = (metadata.cliente || 'Cliente').trim();
    const ticketNo = (metadata.ticketNo || 'Ticket').trim();
    const nombreProyecto = (metadata.nombreProyecto || 'Proyecto').trim();
    return `${cliente} - ${ticketNo} - ${nombreProyecto}`
      .replace(/[\/\\:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ');
  };

  const handleExportDocx = async () => {
    try {
      setIsExporting('docx');
      const blob = await generateAdvansysDocx(metadata, proposal, images);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${buildExportBasename()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al exportar documento .docx:", err);
      alert("Hubo un error generando el documento Word. Por favor intenta nuevamente.");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting('pdf');
      await downloadAdvansysPdf(metadata, proposal, images, buildExportBasename());
    } catch (err) {
      console.error("Error al exportar documento PDF:", err);
      alert("Hubo un error generando el PDF. Por favor intenta nuevamente.");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="@container bg-white/95 rounded-2xl shadow-lg border border-slate-200/80 overflow-x-hidden overflow-y-visible flex flex-col min-h-full min-w-0 max-w-full">
      
      <div className="relative sticky top-0 z-30 min-w-0 max-w-full overflow-x-hidden">
      {/* Editor Header Bar & Export Action */}
      <div className="bg-[#0A3D62] text-white p-3 flex flex-col gap-3 border-b border-[#1E5F8A] min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 text-[#2ECC71] flex items-center justify-center shrink-0">
            <Edit3 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
              <span className="break-words">Documento</span>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-[#2ECC71] text-slate-950 rounded-full border border-emerald-400/50 inline-flex items-center">
                <Tag className="w-3 h-3 mr-1 text-slate-950" />
                {currentVersion}
              </span>
              {status === 'finalizado' && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-400 text-slate-950 rounded-full border border-emerald-300 inline-flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Finalizado
                </span>
              )}
              {status === 'culminado' && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-teal-300 text-slate-950 rounded-full border border-teal-200 inline-flex items-center">
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Culminado
                </span>
              )}
              {status === 'en_revision' && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-300 text-slate-950 rounded-full border border-sky-200 inline-flex items-center">
                  En Revisión
                </span>
              )}
              {status === 'borrador' && (
                <span className="px-2 py-0.5 text-xs font-medium bg-white/20 text-blue-100 rounded-full inline-flex items-center">
                  Borrador
                </span>
              )}
            </h2>
            <p className="text-xs text-blue-100/80 truncate">
              {activeTab === 'technical'
                ? 'Spec interna Dev/QA. Usa Editar o Previa en esta pestaña; Inicio abre una Doc. Técnica independiente.'
                : activeTab === 'slides'
                  ? 'Presentación para el cliente. Genera o descarga PowerPoint desde este panel.'
                  : activeTab === 'preview'
                    ? 'Así se verá el documento al exportar a Word o PDF.'
                    : 'Redacta las secciones. Luego abre Doc. Técnica o Diapositivas en las pestañas.'}
            </p>
          </div>
        </div>

        {/* Tabs first (how you move), then save/export for the current view */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">

          <div className="bg-black/20 p-1 rounded-xl flex gap-0.5 border border-white/10">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-[#0A3D62] shadow'
                  : 'text-blue-100/80 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Propuesta</span>
            </button>
            <button
              onClick={() => {
                if (!proposal.technicalDoc) {
                  onChange({
                    ...proposal,
                    technicalDoc: {
                      ...createDefaultTechnicalDoc(metadata, proposal),
                      isStandalone: false,
                    },
                  });
                }
                setActiveTab('technical');
              }}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center transition-all ${
                activeTab === 'technical'
                  ? 'bg-white text-[#0A3D62] shadow font-bold'
                  : 'text-blue-100/80 hover:text-white'
              }`}
              title="Spec interna de esta propuesta. Si quieres una Doc. Técnica sin propuesta, ábrela desde Inicio."
            >
              <Terminal className="w-3.5 h-3.5 sm:mr-1 text-[#2ECC71]" />
              <span className="hidden sm:inline">Doc. Técnica</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-[#0A3D62] shadow'
                  : 'text-blue-100/80 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Previa</span>
            </button>
            <button
              onClick={() => setActiveTab('slides')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center transition-all ${
                activeTab === 'slides'
                  ? 'bg-[#2ECC71] text-slate-950 shadow font-bold'
                  : 'text-blue-100/80 hover:text-white'
              }`}
              title="Presentación PPTX de esta propuesta"
            >
              <Presentation className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Diapositivas</span>
            </button>
          </div>

          <div className="flex-1 min-w-[8px]" />
          
          {/* Save Changes Button */}
          {onSave && (
            <button
              onClick={onSave}
              type="button"
              className="inline-flex items-center justify-center px-3 py-2 text-xs font-bold text-[#0A3D62] bg-white hover:bg-slate-100 active:scale-95 transition-all rounded-xl shadow-md border border-white/80"
              title="Guardar el borrador y el historial"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              <span>Guardar</span>
            </button>
          )}

          {/* Volver al guardado Button */}
          {onRevertToSaved && (
            <button
              onClick={onRevertToSaved}
              type="button"
              disabled={!hasSavedVersion}
              className="inline-flex items-center justify-center p-2 sm:px-2.5 sm:py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl border border-white/20 disabled:opacity-40 disabled:pointer-events-none"
              title={lastSavedTime ? `Volver a la versión guardada (${lastSavedTime})` : "Volver al último archivo guardado"}
            >
              <RotateCcw className="w-3.5 h-3.5 sm:mr-1.5 text-blue-200" />
              <span className="hidden lg:inline">Volver</span>
            </button>
          )}

          {/* Save as New Version Button */}
          {onSaveNewVersion && (
            <button
              onClick={() => {
                const parts = currentVersion.split('.');
                if (parts.length > 0 && !isNaN(parseInt(parts[0].replace('v', '')))) {
                  const majorNum = parseInt(parts[0].replace('v', '')) + 1;
                  setNewVersionTag(`v${majorNum}.0`);
                } else {
                  setNewVersionTag('v2.0');
                }
                setNewVersionNote('');
                setIsNewVersionModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 text-xs font-bold text-white bg-[#1E5F8A] hover:bg-[#0A3D62] active:scale-95 transition-all rounded-xl shadow-md border border-blue-400/40"
              title="Guardar como una nueva versión independiente (ej. v2.0 para un enfoque alternativo)"
            >
              <GitBranch className="w-3.5 h-3.5 sm:mr-1 text-[#2ECC71]" />
              <span className="hidden lg:inline">Nueva Versión</span>
            </button>
          )}

          {/* Saved Timestamp Badge */}
          {showSavedToast ? (
            <div className="inline-flex items-center text-[11px] text-slate-950 bg-[#2ECC71] border border-emerald-400 px-2.5 py-1 rounded-lg font-bold toast-in">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>Guardado</span>
            </div>
          ) : lastSavedTime ? (
            <div className="hidden xl:flex items-center text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-medium">
              <Check className="w-3 h-3 mr-1 text-emerald-400" />
              <span>Guardado {lastSavedTime}</span>
            </div>
          ) : null}

          {(activeTab === 'editor' || activeTab === 'preview') && (
            <>
              <button
                onClick={handleExportDocx}
                disabled={!!isExporting}
                className="inline-flex items-center px-3 sm:px-4 py-2 text-xs font-bold text-slate-950 bg-[#2ECC71] hover:bg-[#27ae60] active:scale-95 transition-all rounded-xl shadow-md border border-emerald-400 disabled:opacity-50"
                title="Descargar el documento en formato Microsoft Word (.docx)"
              >
                {isExporting === 'docx' ? <Loader2 className="w-4 h-4 sm:mr-1.5 animate-spin" /> : <FileDown className="w-4 h-4 sm:mr-1.5" />}
                <span className="hidden xs:inline sm:inline">{isExporting === 'docx' ? 'Word...' : 'Word'}</span>
              </button>

              <button
                onClick={handleExportPdf}
                disabled={!!isExporting}
                className="inline-flex items-center px-3 sm:px-4 py-2 text-xs font-bold text-white bg-[#1E5F8A] hover:bg-[#0A3D62] active:scale-95 transition-all rounded-xl shadow-md border border-blue-400/40 disabled:opacity-50"
                title="Descargar el documento en PDF"
              >
                {isExporting === 'pdf' ? <Loader2 className="w-4 h-4 sm:mr-1.5 animate-spin" /> : <FileText className="w-4 h-4 sm:mr-1.5" />}
                <span className="hidden xs:inline sm:inline">{isExporting === 'pdf' ? 'PDF...' : 'PDF'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Assistant Toolbar for Manual Editing */}
      {activeTab === 'editor' && (
      <div className="bg-[#072a44] text-slate-200 px-3 py-2 border-b border-[#1E5F8A]/60 flex flex-wrap items-center gap-2 text-xs min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Wand2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
          <span className="font-semibold text-slate-200 hidden sm:inline">Ayuda de IA</span>
          {isRefining && (
            <span className="text-emerald-400 font-medium flex items-center gap-1 animate-pulse truncate">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span className="truncate">{refiningAction}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleAIRefine('polish_all')}
            disabled={isRefining}
            className="px-2.5 py-1 text-xs font-semibold bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg border border-blue-500/40 transition-all flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
            title="Pule la redacción, ortografía y estilo corporativo de todo el documento"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Pulir redacción</span>
          </button>

          <button
            onClick={() => handleAIRefine('complete_missing')}
            disabled={isRefining}
            className="px-2.5 py-1 text-xs font-semibold bg-emerald-700/80 hover:bg-emerald-700 text-white rounded-lg border border-emerald-500/40 transition-all flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
            title="Llena únicamente los campos vacíos basándose en las notas e imágenes"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-300" />
            <span>Completar vacíos</span>
          </button>
        </div>
      </div>
      )}

      {/* Section Quick Navigation Bar for Fast Editing without Infinite Scroll */}
      {activeTab === 'editor' && (
        <div className="relative bg-white/90 backdrop-blur-md p-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-1.5 text-xs min-w-0 sticky-bar">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-1.5 shrink-0 tracking-wider">Sección</span>
            {[
              { id: 'all', label: 'Ver Todo' },
              { id: 'resumen', label: '1. Resumen' },
              { id: 'beneficios', label: '2. Beneficios' },
              { id: 'alcance', label: '3. Alcance' },
              { id: 'comercial', label: titles.sectionPage2 },
              { id: 'objetivo', label: '4. Objetivo' },
              { id: 'descripcion', label: '5. Solución' },
              { id: 'operativo', label: '6-7. Pasos' },
              { id: 'tablas', label: 'Tablas' },
              { id: 'imagenes', label: `Imágenes (${images.length})` },
              { id: 'descargo', label: '8. Descargo' }
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSectionFilter(sec.id)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all inline-flex items-center gap-1 shrink-0 ${
                  activeSectionFilter === sec.id
                    ? 'bg-[#0A3D62] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sec.id === 'all' && <Layers className="w-3.5 h-3.5" />}
                {sec.id === 'imagenes' && <ImageIcon className="w-3.5 h-3.5 text-[#2ECC71]" />}
                {sec.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <button
              type="button"
              onClick={handleToggleAllSections}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 inline-flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
              title={areAllSectionsCollapsed ? "Descomprimir / Expandir todas las secciones" : "Comprimir / Plegar todas las secciones"}
            >
              {areAllSectionsCollapsed ? (
                <>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-[#2ECC71]" />
                  <span>Descomprimir Todo</span>
                </>
              ) : (
                <>
                  <ChevronsDownUp className="w-3.5 h-3.5 text-[#0A3D62]" />
                  <span>Comprimir Todo</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Main Container Content */}
      {activeTab === 'technical' ? (
        <div className="p-2 sm:p-4 bg-slate-100/70 dark:bg-slate-950 rounded-b-xl overflow-x-hidden min-h-[520px] min-w-0">
          <TechnicalDocEditor
            technicalDoc={proposal.technicalDoc}
            metadata={metadata}
            proposal={proposal}
            images={images}
            rawRequirements={rawRequirements}
            history={history}
            currentDocumentId={currentDocumentId}
            onChange={(updatedTechDoc) => {
              onChange({
                ...proposal,
                technicalDoc: updatedTechDoc,
              });
            }}
            onSave={onSave}
            onMetadataChange={onMetadataChange}
            onLinkProposal={onLinkProposal}
            onUnlinkProposal={onUnlinkProposal}
            onOpenLinkedProposal={onOpenLinkedProposal}
            onImagesChange={onImagesChange}
            autoGenerateFromProposal={proposalHasSubstance(proposal)}
            embedded
          />
        </div>
      ) : activeTab === 'slides' ? (
        <div className="p-2 sm:p-4 bg-slate-100/70 dark:bg-slate-950 rounded-b-xl overflow-x-hidden min-h-[520px] min-w-0">
          <SlideDeckEditor
            deck={activeSlideDeck}
            metadata={metadata}
            images={images}
            proposal={proposal}
            onChange={handleSlideDeckChange}
            onSave={onSave}
            onSaveNewVersion={onSaveNewVersion}
          />
        </div>
      ) : activeTab === 'preview' ? (
        <div className="p-3 bg-slate-100/90 dark:bg-slate-950 rounded-b-xl overflow-x-auto min-h-[400px] min-w-0">
          <DocxPreview metadata={metadata} proposal={proposal} images={images} />
        </div>
      ) : (
        <div className="p-3 space-y-4 min-h-[400px] min-w-0 max-w-full overflow-x-hidden">
          
          {/* Section 1: Resumen Ejecutivo */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'resumen') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 transition-all min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 pb-1">
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse('resumen')}
                  className="flex items-center gap-2 text-left group cursor-pointer"
                  title={collapsedSections['resumen'] ? "Descomprimir sección" : "Comprimir sección"}
                >
                  <span className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 group-hover:text-[#0A3D62] group-hover:border-blue-300 transition-colors">
                    {collapsedSections['resumen'] ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words cursor-pointer">
                    1. {titles.section1}
                  </label>
                  {proposal.resumenEjecutivo?.trim() ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {proposal.resumenEjecutivo.trim().length} car.
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                      Vacía
                    </span>
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAIRefine('refine_section', 'resumenEjecutivo')}
                    disabled={isRefining}
                    className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 mr-1 text-[#2ECC71]" />
                    Mejorar con IA
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse('resumen')}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  >
                    {collapsedSections['resumen'] ? 'Descomprimir' : 'Comprimir'}
                  </button>
                </div>
              </div>

              {collapsedSections['resumen'] ? (
                <div 
                  onClick={() => toggleSectionCollapse('resumen')}
                  className="mt-2 p-2.5 bg-white rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2"
                >
                  <p className="truncate italic text-slate-500 flex-1">
                    {proposal.resumenEjecutivo?.trim() || 'Sección comprimida (sin contenido aún). Haz clic para expandir.'}
                  </p>
                  <span className="text-[10px] font-bold text-[#0A3D62] shrink-0">Expandir</span>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {/* Formatting Toolbar for Bullets, Numbers, Bold, Tables */}
                  <TextFormattingToolbar
                    textareaRef={resumenRef}
                    value={proposal.resumenEjecutivo || ''}
                    onChange={(v) => handleStringChange('resumenEjecutivo', v)}
                    onInsertTable={() => handleInsertTableInField('resumenEjecutivo')}
                  />
                  {renderImageInsertBar('resumenEjecutivo')}

                  <textarea
                    ref={resumenRef}
                    value={proposal.resumenEjecutivo}
                    onChange={(e) => handleStringChange('resumenEjecutivo', e.target.value)}
                    onKeyDown={(e) => handleAutoBulletKeyDown(e, proposal.resumenEjecutivo, (v) => handleStringChange('resumenEjecutivo', v))}
                    {...caretHandlers('resumenEjecutivo')}
                    placeholder="Escribe el resumen ejecutivo de la propuesta... (usa los botones de arriba o escribe '• ' o '1. ' para viñetas automáticas)"
                    rows={4}
                    className="w-full min-w-0 max-w-full p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-800 font-sans leading-relaxed"
                  />
                  {renderInlineTables(proposal.resumenEjecutivo)}
                  {renderInlineImages(proposal.resumenEjecutivo)}
                  {renderFieldLivePreview(proposal.resumenEjecutivo)}
                  {renderSubsectionEditor('resumenEjecutivo', '1')}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Beneficios */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'beneficios') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 transition-all min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 pb-1">
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse('beneficios')}
                  className="flex items-center gap-2 text-left group cursor-pointer"
                  title={collapsedSections['beneficios'] ? "Descomprimir sección" : "Comprimir sección"}
                >
                  <span className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 group-hover:text-[#0A3D62] group-hover:border-blue-300 transition-colors">
                    {collapsedSections['beneficios'] ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words cursor-pointer">
                    2. {titles.section2}
                  </label>
                  {(proposal.beneficios || []).length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {proposal.beneficios.length} punto{proposal.beneficios.length === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                      Vacía
                    </span>
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <button
                    onClick={() => handleAIRefine('refine_section', 'beneficios')}
                    disabled={isRefining}
                    className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 mr-1 text-[#2ECC71]" />
                    Sugerir Beneficios
                  </button>
                  <button
                    onClick={handleAddBeneficio}
                    className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Añadir punto
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse('beneficios')}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  >
                    {collapsedSections['beneficios'] ? 'Descomprimir' : 'Comprimir'}
                  </button>
                </div>
              </div>

              {collapsedSections['beneficios'] ? (
                <div 
                  onClick={() => toggleSectionCollapse('beneficios')}
                  className="mt-2 p-2.5 bg-white rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2"
                >
                  <p className="truncate italic text-slate-500 flex-1">
                    {proposal.beneficios && proposal.beneficios.length > 0
                      ? `Puntos (${proposal.beneficios.length}): ${proposal.beneficios.join(' • ')}`
                      : 'Sección comprimida (sin beneficios). Haz clic para expandir.'}
                  </p>
                  <span className="text-[10px] font-bold text-[#0A3D62] shrink-0">Expandir</span>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {(!proposal.beneficios || proposal.beneficios.length === 0) && (
                    <p className="text-xs text-slate-400 italic bg-white p-2.5 rounded border border-slate-200">
                      Sin beneficios agregados. Haz clic en "+ Añadir punto" para escribir un beneficio o usa "Sugerir Beneficios".
                    </p>
                  )}
                  {proposal.beneficios?.map((b, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-[#2ECC71] shrink-0">#{idx + 1}</span>
                      <input
                        type="text"
                        value={b}
                        onChange={(e) => handleBeneficioChange(idx, e.target.value)}
                        onKeyDown={(e) => handleAutoBulletKeyDown(e, b, (v) => handleBeneficioChange(idx, v))}
                        placeholder="Escribe el beneficio... (selecciona y pulsa B o Ctrl+B para negrita)"
                        className="flex-1 min-w-0 max-w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0A3D62] text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement | null;
                          const result = toggleBoldAtTarget(input, b);
                          handleBeneficioChange(idx, result.newText);
                          setTimeout(() => {
                            if (input) {
                              input.focus();
                              input.setSelectionRange(result.selStart, result.selEnd);
                            }
                          }, 10);
                        }}
                        title="Poner en negrita (Ctrl+B)"
                        className="p-1.5 text-slate-500 hover:text-[#0A3D62] hover:bg-slate-200 rounded text-xs font-bold border border-slate-200 bg-white shrink-0"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveBeneficio(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Alcance, Exclusiones y Entregables */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'alcance') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 transition-all min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 pb-1">
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse('alcance')}
                  className="flex items-center gap-2 text-left group cursor-pointer"
                  title={collapsedSections['alcance'] ? "Descomprimir sección" : "Comprimir sección"}
                >
                  <span className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 group-hover:text-[#0A3D62] group-hover:border-blue-300 transition-colors">
                    {collapsedSections['alcance'] ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words cursor-pointer">
                    3. {titles.section3}
                  </label>
                  {((proposal.alcanceExclusionesEntregables?.alcance?.length || 0) + 
                    (proposal.alcanceExclusionesEntregables?.exclusiones?.length || 0) + 
                    (proposal.alcanceExclusionesEntregables?.entregables?.length || 0)) > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {(proposal.alcanceExclusionesEntregables?.alcance?.length || 0) + 
                       (proposal.alcanceExclusionesEntregables?.exclusiones?.length || 0) + 
                       (proposal.alcanceExclusionesEntregables?.entregables?.length || 0)} ítems
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                      Vacía
                    </span>
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAIRefine('refine_section', 'alcanceExclusionesEntregables')}
                    disabled={isRefining}
                    className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 mr-1 text-[#2ECC71]" />
                    Refinar con IA
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse('alcance')}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  >
                    {collapsedSections['alcance'] ? 'Descomprimir' : 'Comprimir'}
                  </button>
                </div>
              </div>

              {collapsedSections['alcance'] ? (
                <div 
                  onClick={() => toggleSectionCollapse('alcance')}
                  className="mt-2 p-2.5 bg-white rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2"
                >
                  <p className="truncate italic text-slate-500 flex-1">
                    {`Alcance: ${proposal.alcanceExclusionesEntregables?.alcance?.length || 0} | Exclusiones: ${proposal.alcanceExclusionesEntregables?.exclusiones?.length || 0} | Entregables: ${proposal.alcanceExclusionesEntregables?.entregables?.length || 0}`}
                  </p>
                  <span className="text-[10px] font-bold text-[#0A3D62] shrink-0">Expandir</span>
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  {/* Sub-block Alcance */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 min-w-0">
                      <span className="text-xs font-bold text-[#1E5F8A]">
                        {titles.section3_1.startsWith('3.1') ? titles.section3_1 : `3.1 ${titles.section3_1}`}:
                      </span>
                      <button
                        onClick={() => handleAddScopeItem('alcance')}
                        disabled={(proposal.alcanceExclusionesEntregables?.alcance?.length || 0) >= COVER_SCOPE_MAX_ITEMS}
                        className="text-[11px] font-semibold text-blue-600 hover:underline disabled:opacity-40 disabled:no-underline"
                      >
                        {(proposal.alcanceExclusionesEntregables?.alcance?.length || 0) >= COVER_SCOPE_MAX_ITEMS ? 'Máximo 3' : '+ Agregar punto'}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {(!proposal.alcanceExclusionesEntregables?.alcance || proposal.alcanceExclusionesEntregables.alcance.length === 0) && (
                        <p className="text-[11px] text-slate-400 italic">Sin ítems de alcance. Presiona "+ Agregar punto" para redactar.</p>
                      )}
                      {proposal.alcanceExclusionesEntregables?.alcance?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 min-w-0">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleScopeListChange('alcance', idx, e.target.value)}
                            onKeyDown={(e) => handleAutoBulletKeyDown(e, item, (v) => handleScopeListChange('alcance', idx, v))}
                            placeholder="Descripción del alcance... (Ctrl+B para negrita)"
                            className="flex-1 min-w-0 max-w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement | null;
                              const result = toggleBoldAtTarget(input, item);
                              handleScopeListChange('alcance', idx, result.newText);
                              setTimeout(() => {
                                if (input) {
                                  input.focus();
                                  input.setSelectionRange(result.selStart, result.selEnd);
                                }
                              }, 10);
                            }}
                            title="Poner en negrita (Ctrl+B)"
                            className="p-1 text-slate-500 hover:text-[#0A3D62] hover:bg-slate-200 rounded text-xs font-bold border border-slate-200 bg-white shrink-0"
                          >
                            <Bold className="w-3 h-3" />
                          </button>

                          {/* Move to 3.2 or 3.3 */}
                          <div className="inline-flex items-center gap-0.5 shrink-0 bg-slate-100 p-0.5 rounded border border-slate-200">
                            <span className="text-[9px] text-slate-400 font-semibold px-1 hidden sm:inline">Mover a:</span>
                            <button
                              type="button"
                              onClick={() => handleMoveScopeItem('alcance', 'exclusiones', idx)}
                              title="Mover texto a 3.2 Exclusiones sin tener que reescribirlo"
                              className="px-1.5 py-0.5 text-[10px] font-bold text-slate-700 hover:text-[#0A3D62] hover:bg-white rounded transition-colors"
                            >
                              → 3.2
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveScopeItem('alcance', 'entregables', idx)}
                              title="Mover texto a 3.3 Entregables sin tener que reescribirlo"
                              className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 hover:text-emerald-950 hover:bg-white rounded transition-colors"
                            >
                              → 3.3
                            </button>
                          </div>

                          <button onClick={() => handleRemoveScopeItem('alcance', idx)} title="Eliminar ítem" className="text-slate-400 hover:text-red-600 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-block Exclusiones */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 min-w-0">
                      <span className="text-xs font-bold text-slate-700">
                        {titles.section3_2.startsWith('3.2') ? titles.section3_2 : `3.2 ${titles.section3_2}`}:
                      </span>
                      <button
                        onClick={() => handleAddScopeItem('exclusiones')}
                        disabled={(proposal.alcanceExclusionesEntregables?.exclusiones?.length || 0) >= COVER_SCOPE_MAX_ITEMS}
                        className="text-[11px] font-semibold text-[#0A3D62] hover:underline disabled:opacity-40 disabled:no-underline"
                      >
                        {(proposal.alcanceExclusionesEntregables?.exclusiones?.length || 0) >= COVER_SCOPE_MAX_ITEMS ? 'Máximo 3' : '+ Agregar exclusión'}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {(!proposal.alcanceExclusionesEntregables?.exclusiones || proposal.alcanceExclusionesEntregables.exclusiones.length === 0) && (
                        <p className="text-[11px] text-slate-400 italic">Sin exclusiones registradas. Presiona "+ Agregar exclusión".</p>
                      )}
                      {proposal.alcanceExclusionesEntregables?.exclusiones?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 min-w-0">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleScopeListChange('exclusiones', idx, e.target.value)}
                            onKeyDown={(e) => handleAutoBulletKeyDown(e, item, (v) => handleScopeListChange('exclusiones', idx, v))}
                            placeholder="Exclusión o elemento fuera de alcance... (Ctrl+B para negrita)"
                            className="flex-1 min-w-0 max-w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement | null;
                              const result = toggleBoldAtTarget(input, item);
                              handleScopeListChange('exclusiones', idx, result.newText);
                              setTimeout(() => {
                                if (input) {
                                  input.focus();
                                  input.setSelectionRange(result.selStart, result.selEnd);
                                }
                              }, 10);
                            }}
                            title="Poner en negrita (Ctrl+B)"
                            className="p-1 text-slate-500 hover:text-[#0A3D62] hover:bg-slate-200 rounded text-xs font-bold border border-slate-200 bg-white shrink-0"
                          >
                            <Bold className="w-3 h-3" />
                          </button>

                          {/* Move to 3.1 or 3.3 */}
                          <div className="inline-flex items-center gap-0.5 shrink-0 bg-slate-100 p-0.5 rounded border border-slate-200">
                            <span className="text-[9px] text-slate-400 font-semibold px-1 hidden sm:inline">Mover a:</span>
                            <button
                              type="button"
                              onClick={() => handleMoveScopeItem('exclusiones', 'alcance', idx)}
                              title="Mover texto a 3.1 Alcance sin tener que reescribirlo"
                              className="px-1.5 py-0.5 text-[10px] font-bold text-blue-700 hover:text-blue-900 hover:bg-white rounded transition-colors"
                            >
                              → 3.1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveScopeItem('exclusiones', 'entregables', idx)}
                              title="Mover texto a 3.3 Entregables sin tener que reescribirlo"
                              className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 hover:text-emerald-950 hover:bg-white rounded transition-colors"
                            >
                              → 3.3
                            </button>
                          </div>

                          <button onClick={() => handleRemoveScopeItem('exclusiones', idx)} title="Eliminar ítem" className="text-slate-400 hover:text-red-600 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-block Entregables */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 min-w-0">
                      <span className="text-xs font-bold text-emerald-700">
                        {titles.section3_3.startsWith('3.3') ? titles.section3_3 : `3.3 ${titles.section3_3}`}:
                      </span>
                      <button
                        onClick={() => handleAddScopeItem('entregables')}
                        disabled={(proposal.alcanceExclusionesEntregables?.entregables?.length || 0) >= COVER_SCOPE_MAX_ITEMS}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline disabled:opacity-40 disabled:no-underline"
                      >
                        {(proposal.alcanceExclusionesEntregables?.entregables?.length || 0) >= COVER_SCOPE_MAX_ITEMS ? 'Máximo 3' : '+ Agregar entregable'}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {(!proposal.alcanceExclusionesEntregables?.entregables || proposal.alcanceExclusionesEntregables.entregables.length === 0) && (
                        <p className="text-[11px] text-slate-400 italic">Sin entregables registrados. Presiona "+ Agregar entregable".</p>
                      )}
                      {proposal.alcanceExclusionesEntregables?.entregables?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 min-w-0">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleScopeListChange('entregables', idx, e.target.value)}
                            onKeyDown={(e) => handleAutoBulletKeyDown(e, item, (v) => handleScopeListChange('entregables', idx, v))}
                            placeholder="Entregable del proyecto... (Ctrl+B para negrita)"
                            className="flex-1 min-w-0 max-w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement | null;
                              const result = toggleBoldAtTarget(input, item);
                              handleScopeListChange('entregables', idx, result.newText);
                              setTimeout(() => {
                                if (input) {
                                  input.focus();
                                  input.setSelectionRange(result.selStart, result.selEnd);
                                }
                              }, 10);
                            }}
                            title="Poner en negrita (Ctrl+B)"
                            className="p-1 text-slate-500 hover:text-[#0A3D62] hover:bg-slate-200 rounded text-xs font-bold border border-slate-200 bg-white shrink-0"
                          >
                            <Bold className="w-3 h-3" />
                          </button>

                          {/* Move to 3.1 or 3.2 */}
                          <div className="inline-flex items-center gap-0.5 shrink-0 bg-slate-100 p-0.5 rounded border border-slate-200">
                            <span className="text-[9px] text-slate-400 font-semibold px-1 hidden sm:inline">Mover a:</span>
                            <button
                              type="button"
                              onClick={() => handleMoveScopeItem('entregables', 'alcance', idx)}
                              title="Mover texto a 3.1 Alcance sin tener que reescribirlo"
                              className="px-1.5 py-0.5 text-[10px] font-bold text-blue-700 hover:text-blue-900 hover:bg-white rounded transition-colors"
                            >
                              → 3.1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveScopeItem('entregables', 'exclusiones', idx)}
                              title="Mover texto a 3.2 Exclusiones sin tener que reescribirlo"
                              className="px-1.5 py-0.5 text-[10px] font-bold text-slate-700 hover:text-[#0A3D62] hover:bg-white rounded transition-colors"
                            >
                              → 3.2
                            </button>
                          </div>

                          <button onClick={() => handleRemoveScopeItem('entregables', idx)} title="Eliminar ítem" className="text-slate-400 hover:text-red-600 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(activeSectionFilter === 'all' || activeSectionFilter === 'comercial') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                <button type="button" onClick={() => toggleSectionCollapse('comercial')} className="flex items-center gap-2 text-left">
                  <span className="p-1 rounded-md bg-white border border-slate-200">
                    {collapsedSections['comercial'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  </span>
                  <label className="text-sm font-bold text-[#0A3D62] uppercase tracking-wide cursor-pointer">{titles.sectionPage2}</label>
                </button>
                <label className="text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={!proposal.commercial?.hide}
                    onChange={(e) => onChange({ ...proposal, commercial: { ...proposal.commercial, hide: !e.target.checked } })}
                  />
                  Incluir en el documento
                </label>
              </div>
              {!collapsedSections['comercial'] && (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Logo de esta página</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: 'off' as Page2LogoMode, label: 'Ocultar' },
                          { id: 'main' as Page2LogoMode, label: 'Logo general' },
                          { id: 'page2' as Page2LogoMode, label: 'Logo página 2' },
                        ]
                      ).map((opt) => {
                        const current = getPage2LogoMode(metadata, proposal.commercial);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => onChange({ ...proposal, commercial: { ...proposal.commercial, logoMode: opt.id } })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                              current === opt.id
                                ? 'bg-[#0A3D62] text-white border-[#0A3D62]'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">El archivo de “Logo página 2” se carga en Ajustes → Marca. No cambia el logo de la carátula.</p>
                  </div>
                  {(getEffectiveCommercialPage(proposal).lineItems).map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        className="sm:col-span-2 px-2 py-1.5 text-sm border border-slate-200 rounded-lg"
                        placeholder="Descripción / partida"
                        value={item.description}
                        onChange={(e) => {
                          const lineItems = [...getEffectiveCommercialPage(proposal).lineItems];
                          lineItems[idx] = { ...lineItems[idx], description: e.target.value };
                          onChange({ ...proposal, commercial: { ...proposal.commercial, lineItems } });
                        }}
                      />
                      <input
                        className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg"
                        placeholder="Horas"
                        value={item.hours}
                        onChange={(e) => {
                          const lineItems = [...getEffectiveCommercialPage(proposal).lineItems];
                          lineItems[idx] = { ...lineItems[idx], hours: e.target.value };
                          onChange({ ...proposal, commercial: { ...proposal.commercial, lineItems } });
                        }}
                      />
                      <input
                        className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg"
                        placeholder="Valor unitario USD"
                        value={item.unitValue}
                        onChange={(e) => {
                          const lineItems = [...getEffectiveCommercialPage(proposal).lineItems];
                          lineItems[idx] = { ...lineItems[idx], unitValue: e.target.value };
                          onChange({ ...proposal, commercial: { ...proposal.commercial, lineItems } });
                        }}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#1E5F8A]"
                    onClick={() => {
                      const lineItems = [...getEffectiveCommercialPage(proposal).lineItems, { description: '', hours: '', unitValue: '' }];
                      onChange({ ...proposal, commercial: { ...proposal.commercial, lineItems } });
                    }}
                  >
                    + Agregar partida
                  </button>
                  <input
                    className="w-full px-2 py-1.5 text-sm font-bold border border-slate-200 rounded-lg uppercase tracking-wide"
                    placeholder={DEFAULT_COMMERCIAL_PAGE.conditionsTitle}
                    value={getEffectiveCommercialPage(proposal).conditionsTitle}
                    onChange={(e) => onChange({ ...proposal, commercial: { ...proposal.commercial, conditionsTitle: e.target.value } })}
                  />
                  {getEffectiveCommercialPage(proposal).conditions.map((cond, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg font-semibold"
                        placeholder="Título"
                        value={cond.title}
                        onChange={(e) => {
                          const conditions = [...getEffectiveCommercialPage(proposal).conditions];
                          conditions[idx] = { ...conditions[idx], title: e.target.value };
                          onChange({ ...proposal, commercial: { ...proposal.commercial, conditions } });
                        }}
                      />
                      <input
                        className="sm:col-span-2 px-2 py-1.5 text-sm border border-slate-200 rounded-lg"
                        placeholder="Texto"
                        value={cond.text}
                        onChange={(e) => {
                          const conditions = [...getEffectiveCommercialPage(proposal).conditions];
                          conditions[idx] = { ...conditions[idx], text: e.target.value };
                          onChange({ ...proposal, commercial: { ...proposal.commercial, conditions } });
                        }}
                      />
                    </div>
                  ))}
                  <input
                    className="w-full px-2 py-1.5 text-sm font-bold border border-slate-200 rounded-lg uppercase tracking-wide"
                    placeholder={DEFAULT_COMMERCIAL_PAGE.nextStepsTitle}
                    value={getEffectiveCommercialPage(proposal).nextStepsTitle}
                    onChange={(e) => onChange({ ...proposal, commercial: { ...proposal.commercial, nextStepsTitle: e.target.value } })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getEffectiveCommercialPage(proposal).nextSteps.map((step, idx) => (
                      <input
                        key={idx}
                        className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg"
                        value={step}
                        onChange={(e) => {
                          const nextSteps = [...getEffectiveCommercialPage(proposal).nextSteps];
                          nextSteps[idx] = e.target.value;
                          onChange({ ...proposal, commercial: { ...proposal.commercial, nextSteps } });
                        }}
                      />
                    ))}
                  </div>
                  <input
                    className="w-full px-2 py-1.5 text-sm font-bold border border-slate-200 rounded-lg uppercase tracking-wide"
                    placeholder={DEFAULT_COMMERCIAL_PAGE.notesTitle}
                    value={getEffectiveCommercialPage(proposal).notesTitle}
                    onChange={(e) => onChange({ ...proposal, commercial: { ...proposal.commercial, notesTitle: e.target.value } })}
                  />
                  <textarea
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg min-h-[70px]"
                    placeholder="Notas importantes"
                    value={proposal.commercial?.notes ?? getEffectiveCommercialPage(proposal).notes}
                    onChange={(e) => onChange({ ...proposal, commercial: { ...proposal.commercial, notes: e.target.value } })}
                  />
                  <input
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg"
                    placeholder="Revisado por"
                    value={proposal.commercial?.reviewedBy ?? ''}
                    onChange={(e) => onChange({ ...proposal, commercial: { ...proposal.commercial, reviewedBy: e.target.value } })}
                  />
                </div>
              )}
            </div>
          )}

          {/* Section 4: Objetivo */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'objetivo') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 transition-all min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 pb-1">
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse('objetivo')}
                  className="flex items-center gap-2 text-left group cursor-pointer"
                  title={collapsedSections['objetivo'] ? "Descomprimir sección" : "Comprimir sección"}
                >
                  <span className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 group-hover:text-[#0A3D62] group-hover:border-blue-300 transition-colors">
                    {collapsedSections['objetivo'] ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words cursor-pointer">
                    4. {titles.section4}
                  </label>
                  {proposal.objetivo?.trim() ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {proposal.objetivo.trim().length} car.
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                      Vacía
                    </span>
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAIRefine('refine_section', 'objetivo')}
                    disabled={isRefining}
                    className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 mr-1 text-[#2ECC71]" />
                    Mejorar con IA
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse('objetivo')}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  >
                    {collapsedSections['objetivo'] ? 'Descomprimir' : 'Comprimir'}
                  </button>
                </div>
              </div>

              {collapsedSections['objetivo'] ? (
                <div 
                  onClick={() => toggleSectionCollapse('objetivo')}
                  className="mt-2 p-2.5 bg-white rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2"
                >
                  <p className="truncate italic text-slate-500 flex-1">
                    {proposal.objetivo?.trim() || 'Sección comprimida (sin objetivo redactado aún). Haz clic para expandir.'}
                  </p>
                  <span className="text-[10px] font-bold text-[#0A3D62] shrink-0">Expandir</span>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  <TextFormattingToolbar
                    textareaRef={objetivoRef}
                    value={proposal.objetivo || ''}
                    onChange={(v) => handleStringChange('objetivo', v)}
                    onInsertTable={() => handleInsertTableInField('objetivo')}
                  />
                  {renderImageInsertBar('objetivo')}

                  <textarea
                    ref={objetivoRef}
                    value={proposal.objetivo}
                    onChange={(e) => handleStringChange('objetivo', e.target.value)}
                    onKeyDown={(e) => handleAutoBulletKeyDown(e, proposal.objetivo, (v) => handleStringChange('objetivo', v))}
                    {...caretHandlers('objetivo')}
                    placeholder="Describa el objetivo general y específico... (usa • Viñeta o escribe '• ' o '1. ' para listas automáticas)"
                    rows={3}
                    className="w-full min-w-0 max-w-full p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-800 font-sans leading-relaxed"
                  />
                  {renderInlineTables(proposal.objetivo)}
                  {renderInlineImages(proposal.objetivo)}
                  {renderFieldLivePreview(proposal.objetivo)}
                  {renderSubsectionEditor('objetivo', '4')}
                </div>
              )}
            </div>
          )}

          {/* Section 5: Descripción */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'descripcion') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 transition-all min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 pb-1">
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse('descripcion')}
                  className="flex items-center gap-2 text-left group cursor-pointer"
                  title={collapsedSections['descripcion'] ? "Descomprimir sección" : "Comprimir sección"}
                >
                  <span className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 group-hover:text-[#0A3D62] group-hover:border-blue-300 transition-colors">
                    {collapsedSections['descripcion'] ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words cursor-pointer">
                    5. {titles.section5}
                  </label>
                  {proposal.descripcion?.trim() ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {proposal.descripcion.trim().length} car.
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                      Vacía
                    </span>
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAIRefine('refine_section', 'descripcion')}
                    disabled={isRefining}
                    className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 mr-1 text-[#2ECC71]" />
                    Mejorar con IA
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse('descripcion')}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  >
                    {collapsedSections['descripcion'] ? 'Descomprimir' : 'Comprimir'}
                  </button>
                </div>
              </div>

              {collapsedSections['descripcion'] ? (
                <div 
                  onClick={() => toggleSectionCollapse('descripcion')}
                  className="mt-2 p-2.5 bg-white rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2"
                >
                  <p className="truncate italic text-slate-500 flex-1">
                    {proposal.descripcion?.trim() || 'Sección comprimida (sin descripción redactada aún). Haz clic para expandir.'}
                  </p>
                  <span className="text-[10px] font-bold text-[#0A3D62] shrink-0">Expandir</span>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  <TextFormattingToolbar
                    textareaRef={descripcionRef}
                    value={proposal.descripcion || ''}
                    onChange={(v) => handleStringChange('descripcion', v)}
                    onInsertTable={() => handleInsertTableInField('descripcion')}
                  />
                  {renderImageInsertBar('descripcion')}

                  <textarea
                    ref={descripcionRef}
                    value={proposal.descripcion}
                    onChange={(e) => handleStringChange('descripcion', e.target.value)}
                    onKeyDown={(e) => handleAutoBulletKeyDown(e, proposal.descripcion, (v) => handleStringChange('descripcion', v))}
                    {...caretHandlers('descripcion')}
                    placeholder="Escriba el detalle de la solución arquitectónica propuesta... (usa • Viñeta o escribe '• ' o '1. ' para listas automáticas)"
                    rows={4}
                    className="w-full min-w-0 max-w-full p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-800 font-sans leading-relaxed"
                  />
                  {renderInlineTables(proposal.descripcion)}
                  {renderInlineImages(proposal.descripcion)}
                  {renderFieldLivePreview(proposal.descripcion)}
                  {renderSubsectionEditor('descripcion', '5')}
                </div>
              )}
            </div>
          )}

          {/* Section 6 & 7: Análisis Operativo */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'operativo') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 transition-all min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse('operativo')}
                  className="flex items-center gap-2 text-left group cursor-pointer"
                  title={collapsedSections['operativo'] ? "Descomprimir sección" : "Comprimir sección"}
                >
                  <span className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 group-hover:text-[#0A3D62] group-hover:border-blue-300 transition-colors">
                    {collapsedSections['operativo'] ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <div>
                    <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words cursor-pointer">
                      {analysisFirst ? `${analisisNumber} & ${indiceNumber}. ${titles.section7} & ${titles.section6}` : `${indiceNumber} & ${analisisNumber}. ${titles.section6} & ${titles.section7}`}
                    </label>
                    <span className="text-xs text-slate-500">
                      {proposal.analisisOperativo?.length || 0} Pasos registrados
                    </span>
                  </div>
                </button>

                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <button
                    onClick={() => handleAIRefine('refine_section', 'analisisOperativo')}
                    disabled={isRefining}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-[#2ECC71]" />
                    Redactar Pasos con IA
                  </button>
                  <button
                    onClick={() => handleAddStep()}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Añadir Paso Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse('operativo')}
                    className="px-2 py-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  >
                    {collapsedSections['operativo'] ? 'Descomprimir' : 'Comprimir'}
                  </button>
                </div>
              </div>

              {collapsedSections['operativo'] ? (
                <div 
                  onClick={() => toggleSectionCollapse('operativo')}
                  className="mt-3 p-2.5 bg-white rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2"
                >
                  <p className="truncate italic text-slate-500 flex-1">
                    {operativeSteps.length > 0
                      ? operativeSteps.map((s, i) => `${operativeStepLabels[i]}: ${s.titulo || 'Sin título'}`).join(' | ')
                      : 'Sección comprimida (0 pasos). Haz clic para expandir.'}
                  </p>
                  <span className="text-[10px] font-bold text-[#0A3D62] shrink-0">Expandir</span>
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  {(!proposal.analisisOperativo || proposal.analisisOperativo.length === 0) && (
                    <p className="text-xs text-slate-400 italic bg-white p-3 rounded-lg border border-slate-200 text-center">
                      No hay pasos operativos agregados. Haz clic en "Añadir Paso Manual" o "Redactar Pasos con IA".
                    </p>
                  )}
                  {operativeSteps.map((step, idx) => {
                    const stepLevel = getOperativeStepLevel(step);
                    const stepLabel = operativeStepLabels[idx];
                    const isExplicitNone = step.imagenId === 'none' || step.referenciaImagen === 'none';
                    const stepLinkedImg = isExplicitNone
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
                    
                    const linkedImgIndex = stepLinkedImg ? images.indexOf(stepLinkedImg) + 1 : null;
                    const currentValueForSelect = isExplicitNone ? 'none' : (stepLinkedImg ? stepLinkedImg.id : 'none');

                    return (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-lg border border-slate-200 space-y-3 relative group min-w-0"
                        style={{ marginLeft: stepLevel * 20 }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs font-bold text-[#0A3D62] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                              Paso {stepLabel}
                            </span>
                            {stepLinkedImg && linkedImgIndex && (
                              <span className="text-[11px] text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center min-w-0 max-w-full">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                                <span className="truncate">{imageTag(linkedImgIndex)}: {stepLinkedImg.title}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <div className="inline-flex items-center rounded border border-slate-200 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => commitOperativeSteps(outdentOperativeStep(operativeSteps, idx))}
                                disabled={!canOutdentOperativeStep(operativeSteps, idx)}
                                className="p-1 text-slate-500 hover:text-[#0A3D62] hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                                title="Subir de nivel (quitar sangría)"
                              >
                                <IndentDecrease className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => commitOperativeSteps(indentOperativeStep(operativeSteps, idx))}
                                disabled={!canIndentOperativeStep(operativeSteps, idx)}
                                className="p-1 text-slate-500 hover:text-[#0A3D62] hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors border-l border-slate-200"
                                title="Convertir en subpaso (sangrar)"
                              >
                                <IndentIncrease className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="inline-flex items-center rounded border border-slate-200 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleMoveStepUp(idx)}
                                disabled={!canMoveOperativeSubtreeUp(operativeSteps, idx)}
                                className="p-1 text-slate-500 hover:text-[#0A3D62] hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                                title="Subir (junto con sus subpasos)"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveStepDown(idx)}
                                disabled={!canMoveOperativeSubtreeDown(operativeSteps, idx)}
                                className="p-1 text-slate-500 hover:text-[#0A3D62] hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors border-l border-slate-200"
                                title="Bajar (junto con sus subpasos)"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                            {operativeSteps.length > 1 && (
                              <select
                                value={idx}
                                onChange={(e) => handleMoveStep(idx, parseInt(e.target.value, 10))}
                                className="text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 rounded px-1 py-1 max-w-[8.5rem] cursor-pointer"
                                title="Mover este paso a otra posición"
                              >
                                {operativeSteps.map((_, pos) => (
                                  <option key={pos} value={pos}>
                                    {pos === idx ? `Posición ${operativeStepLabels[pos]}` : `Mover a ${operativeStepLabels[pos]}`}
                                  </option>
                                ))}
                              </select>
                            )}
                            {stepLevel < MAX_OPERATIVE_STEP_LEVEL && (
                              <button
                                type="button"
                                onClick={() => handleAddStep(idx, true)}
                                className="inline-flex items-center gap-0.5 px-1.5 py-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                                title="Añadir un subpaso dentro de este paso"
                              >
                                <Plus className="w-3 h-3" />
                                Subpaso
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar paso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Título del Paso:</label>
                          <input
                            type="text"
                            value={step.titulo}
                            onChange={(e) => handleStepChange(idx, 'titulo', e.target.value)}
                            placeholder="Título descriptivo del paso..."
                            className="w-full min-w-0 max-w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800"
                          />
                        </div>

                        {/* Image selection and direct upload for this step */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/90 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                              <ImageIcon className="w-3.5 h-3.5 text-[#2ECC71]" />
                              <span>Captura / Imagen Vinculada a este Paso</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleStepImagePick(idx)}
                              disabled={!onImagesChange}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-white hover:bg-blue-50 border border-slate-300 rounded transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                              title="Subir una captura desde tu equipo para este paso"
                            >
                              <Plus className="w-3 h-3 text-[#2ECC71]" />
                              <span>Subir captura para este paso</span>
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={currentValueForSelect}
                              onChange={(e) => handleStepImageSelect(idx, e.target.value)}
                              className="flex-1 min-w-0 w-full text-xs bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-[#0A3D62]"
                            >
                              <option value="none">Sin imagen vinculada</option>
                              {images.map((img, i) => (
                                <option key={img.id || i} value={img.id}>
                                  {imageTag(i + 1)} — {img.title || `Captura ${i + 1}`} ({img.fileName || 'Imagen'})
                                </option>
                              ))}
                            </select>

                            {stepLinkedImg && (
                              <button
                                type="button"
                                onClick={() => handleStepImageSelect(idx, 'none')}
                                className="px-2 py-1 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors cursor-pointer"
                                title="Desvincular imagen de este paso"
                              >
                                Desvincular
                              </button>
                            )}
                          </div>

                          {/* Thumbnail preview if image is attached */}
                          {stepLinkedImg && (
                            <div className="flex items-center gap-3 p-2 bg-white rounded border border-emerald-200/80 shadow-2xs">
                              <img
                                src={stepLinkedImg.dataUrl}
                                alt={stepLinkedImg.title}
                                className="w-16 h-12 object-contain bg-slate-100 rounded border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0 flex-1 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#0A3D62] text-[11px]">
                                    {linkedImgIndex ? imageTag(linkedImgIndex) : '[IMAGEN]'}
                                  </span>
                                  <span className="font-semibold text-slate-800 truncate">{stepLinkedImg.title}</span>
                                </div>
                                {stepLinkedImg.description && (
                                  <p className="text-[10px] text-slate-500 italic truncate mt-0.5">{stepLinkedImg.description}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Explicación Técnica Detallada:</label>
                          <TextFormattingToolbar
                            textareaRef={{ current: stepRefs.current[idx] }}
                            value={step.explicacion || ''}
                            onChange={(v) => handleStepChange(idx, 'explicacion', v)}
                            onInsertTable={() => handleInsertTableInStep(idx)}
                          />
                          {images.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 text-[10px]">
                              <span className="text-slate-400 font-semibold">Insertar tag en texto:</span>
                              {images.map((img, i) => (
                                <button
                                  key={img.id || i}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleInsertImageTagInStep(idx, i + 1)}
                                  className="px-1.5 py-0.5 font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded cursor-pointer"
                                  title={`Insertar ${imageTag(i + 1)} en la posición del cursor`}
                                >
                                  +{imageTag(i + 1)}
                                </button>
                              ))}
                            </div>
                          )}
                          <textarea
                            ref={(el) => {
                              stepRefs.current[idx] = el;
                            }}
                            value={step.explicacion}
                            onChange={(e) => handleStepChange(idx, 'explicacion', e.target.value)}
                            onKeyDown={(e) => handleAutoBulletKeyDown(e, step.explicacion, (v) => handleStepChange(idx, 'explicacion', v))}
                            {...caretHandlers(`step:${idx}`)}
                            placeholder="Detalle los procedimientos, llamadas a API o reglas de negocio... (usa • Viñeta o escribe '• ' o '1. ')"
                            rows={3}
                            className="w-full min-w-0 max-w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 font-sans leading-relaxed"
                          />
                          {renderInlineTables(step.explicacion)}
                          {renderInlineImages(step.explicacion)}
                          {renderFieldLivePreview(step.explicacion)}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handleAddStep()}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-300 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir otro paso
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tablas del documento */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'tablas') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 transition-all min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 pb-1">
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse('tablas')}
                  className="flex items-center gap-2 text-left group cursor-pointer"
                  title={collapsedSections['tablas'] ? "Descomprimir sección" : "Comprimir sección"}
                >
                  <span className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 group-hover:text-[#0A3D62] group-hover:border-blue-300 transition-colors">
                    {collapsedSections['tablas'] ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <div>
                    <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide cursor-pointer">
                      Tablas del documento
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Edítalas aquí. En el texto aparecen como [TABLA_1], [TABLA_2]…
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {proposal.tables?.length || 0} tabla{(proposal.tables?.length || 0) === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse('tablas')}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  >
                    {collapsedSections['tablas'] ? 'Descomprimir' : 'Comprimir'}
                  </button>
                </div>
              </div>

              {collapsedSections['tablas'] ? (
                <div 
                  onClick={() => toggleSectionCollapse('tablas')}
                  className="mt-2 p-2.5 bg-white rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2"
                >
                  <p className="truncate italic text-slate-500 flex-1">
                    {proposal.tables && proposal.tables.length > 0
                      ? proposal.tables.map((t, i) => `[TABLA_${i+1}]: ${t.caption || 'Sin título'}`).join(' | ')
                      : 'Sección comprimida (sin tablas creadas). Haz clic para expandir.'}
                  </p>
                  <span className="text-[10px] font-bold text-[#0A3D62] shrink-0">Expandir</span>
                </div>
              ) : (
                <div className="mt-2">
                  <DocumentTablesEditor
                    tables={proposal.tables || []}
                    onChange={(tables) => onChange({ ...proposal, tables })}
                  />
                </div>
              )}
            </div>
          )}

          {/* Imágenes y Capturas de la Propuesta */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'imagenes') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 transition-all min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 pb-1">
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse('imagenes')}
                  className="flex items-center gap-2 text-left group cursor-pointer"
                  title={collapsedSections['imagenes'] ? "Descomprimir sección" : "Comprimir sección"}
                >
                  <span className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 group-hover:text-[#0A3D62] group-hover:border-blue-300 transition-colors">
                    {collapsedSections['imagenes'] ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <div>
                    <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide cursor-pointer flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#2ECC71]" />
                      <span>Galería e Imágenes de la Propuesta</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sube, pega o gestiona capturas de pantalla y diagramas. Úsalas en los pasos o con [IMAGEN_1], [IMAGEN_2]…
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {images.length} imágen{images.length === 1 ? '' : 'es'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse('imagenes')}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  >
                    {collapsedSections['imagenes'] ? 'Descomprimir' : 'Comprimir'}
                  </button>
                </div>
              </div>

              {collapsedSections['imagenes'] ? (
                <div 
                  onClick={() => toggleSectionCollapse('imagenes')}
                  className="mt-2 p-2.5 bg-white rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2"
                >
                  <p className="truncate italic text-slate-500 flex-1">
                    {images.length > 0
                      ? images.map((img, i) => `[IMAGEN_${i+1}]: ${img.title}`).join(' | ')
                      : 'Sin imágenes agregadas aún. Haz clic para expandir y subir.'}
                  </p>
                  <span className="text-[10px] font-bold text-[#0A3D62] shrink-0">Expandir</span>
                </div>
              ) : (
                <div className="mt-3">
                  <ImageUploader
                    images={images}
                    onChange={onImagesChange || (() => {})}
                  />
                </div>
              )}
            </div>
          )}

          {/* Section 8: Descargo */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'descargo') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 transition-all min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 pb-1">
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse('descargo')}
                  className="flex items-center gap-2 text-left group cursor-pointer"
                  title={collapsedSections['descargo'] ? "Descomprimir sección" : "Comprimir sección"}
                >
                  <span className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 group-hover:text-[#0A3D62] group-hover:border-blue-300 transition-colors">
                    {collapsedSections['descargo'] ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words cursor-pointer">
                    8. {titles.section8}
                  </label>
                  {proposal.descargo?.trim() ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {proposal.descargo.trim().length} car.
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                      Vacía
                    </span>
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const defaultVal = metadata.customTitles?.defaultDescargo?.trim() || DEFAULT_DESCARGO_TEXT;
                      handleStringChange('descargo', defaultVal);
                    }}
                    className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
                    title="Restaurar al texto/cláusula de descargo configurada por defecto"
                  >
                    <RotateCcw className="w-3 h-3 mr-1 text-slate-500" />
                    Texto por Defecto
                  </button>
                  <button
                    onClick={() => handleAIRefine('refine_section', 'descargo')}
                    disabled={isRefining}
                    className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 mr-1 text-[#2ECC71]" />
                    Refinar Cláusula
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse('descargo')}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  >
                    {collapsedSections['descargo'] ? 'Descomprimir' : 'Comprimir'}
                  </button>
                </div>
              </div>

              {collapsedSections['descargo'] ? (
                <div 
                  onClick={() => toggleSectionCollapse('descargo')}
                  className="mt-2 p-2.5 bg-white rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2"
                >
                  <p className="truncate italic text-slate-500 flex-1">
                    {proposal.descargo?.trim() || 'Sección comprimida (sin descargo). Haz clic para expandir.'}
                  </p>
                  <span className="text-[10px] font-bold text-[#0A3D62] shrink-0">Expandir</span>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  <TextFormattingToolbar
                    textareaRef={descargoRef}
                    value={proposal.descargo || ''}
                    onChange={(v) => handleStringChange('descargo', v)}
                    onInsertTable={() => handleInsertTableInField('descargo')}
                  />
                  {renderImageInsertBar('descargo')}

                  <textarea
                    ref={descargoRef}
                    value={proposal.descargo}
                    onChange={(e) => handleStringChange('descargo', e.target.value)}
                    onKeyDown={(e) => handleAutoBulletKeyDown(e, proposal.descargo, (v) => handleStringChange('descargo', v))}
                    {...caretHandlers('descargo')}
                    rows={3}
                    className="w-full min-w-0 max-w-full p-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-700 italic font-sans leading-relaxed"
                  />
                  {renderInlineTables(proposal.descargo)}
                  {renderInlineImages(proposal.descargo)}
                  {renderFieldLivePreview(proposal.descargo)}
                  {renderSubsectionEditor('descargo', '8')}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Hidden File Input for Image Pickers */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Modal to Save as New Version */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0A3D62] text-white p-4 px-5 flex items-center justify-between border-b border-[#1E5F8A]">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-5 h-5 text-[#2ECC71]" />
                <h3 className="text-sm font-bold">Crear Nueva Versión del Análisis</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-bold mb-1.5 text-slate-800">
                  Etiqueta de la Versión (ej. v2.0, v1.1 - Opción Webhook):
                </label>
                <input
                  type="text"
                  value={newVersionTag}
                  onChange={(e) => setNewVersionTag(e.target.value)}
                  placeholder="v2.0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0A3D62]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-800">
                  Nota explicativa de esta versión (opcional):
                </label>
                <textarea
                  value={newVersionNote}
                  onChange={(e) => setNewVersionNote(e.target.value)}
                  placeholder="ej. Enfoque alternativo sin requerir modificaciones en la base de datos..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewVersionModalOpen(false)}
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSaveNewVersion) {
                      onSaveNewVersion(newVersionTag.trim() || 'v2.0', newVersionNote.trim());
                    }
                    setIsNewVersionModalOpen(false);
                  }}
                  className="px-4 py-2 font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-lg shadow-sm"
                >
                  Guardar como Nueva Versión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

