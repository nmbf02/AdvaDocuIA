import React, { useState, useEffect, useRef } from 'react';
import {
  MetadataHeader,
  ProposalSection,
  TechnicalDoc,
  UploadedImage,
  SavedProposal,
  DocumentTable,
  DocumentTitlesConfig,
  getEffectiveTechnicalTitles,
  DEFAULT_TECHNICAL_DOC_TITLES,
  getEffectiveTechnicalHeaderFooter,
  DEFAULT_TECHNICAL_HEADER_FOOTER,
} from '../types';
import {
  FileText,
  Sparkles,
  Loader2,
  FileDown,
  Copy,
  Check,
  Compass,
  Workflow,
  Layout,
  ShieldCheck,
  Code,
  Terminal,
  Database,
  Layers,
  Save,
  RotateCcw,
  Link,
  Unlink,
  ExternalLink,
  Search,
  X,
  Edit3,
  Building2,
  Calendar,
  Layers as LayersIcon,
  HelpCircle,
  FilePlus,
  CheckCircle2,
  Table2,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Sliders,
  Heading1,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronsDownUp,
} from 'lucide-react';
import { createDefaultTechnicalDoc, isTechnicalDocUnfilled, proposalHasSubstance, copyLinkedProposalMetadata } from '../utils/technicalDocTemplates';
import { generateTechnicalDocDocx } from '../utils/technicalDocDocxGenerator';
import { downloadTechnicalDocPdf } from '../utils/technicalDocPdfGenerator';
import { TextFormattingToolbar, handleAutoBulletKeyDown, readTextareaCaret, insertSnippetAtCaret, TextCaret } from './TextFormattingToolbar';
import { RichTextBlock } from './DocumentPreviewBlocks';
import { DocumentTablesEditor, createEmptyDocumentTable, tableTag } from './DocumentTablesEditor';
import { ImageUploader } from './ImageUploader';
import { TechnicalDocPreview } from './TechnicalDocPreview';

interface TechnicalDocEditorProps {
  technicalDoc?: TechnicalDoc;
  metadata: MetadataHeader;
  proposal?: ProposalSection | null;
  images: UploadedImage[];
  rawRequirements?: string;
  history?: SavedProposal[];
  currentDocumentId?: string | null;
  onChange: (updated: TechnicalDoc) => void;
  onSave?: () => void;
  onMetadataChange?: (updatedMetadata: MetadataHeader) => void;
  onLinkProposal?: (proposal: SavedProposal, syncContext: boolean) => void;
  onUnlinkProposal?: () => void;
  onOpenLinkedProposal?: () => void;
  onImagesChange?: (images: UploadedImage[]) => void;
  autoGenerateFromProposal?: boolean;
  /** When true, this editor sits inside a proposal: no second header, no “atar”, no Guardar duplicado. */
  embedded?: boolean;
}

export const TechnicalDocEditor: React.FC<TechnicalDocEditorProps> = ({
  technicalDoc,
  metadata,
  proposal,
  images,
  rawRequirements = '',
  history = [],
  currentDocumentId = null,
  onChange,
  onSave,
  onMetadataChange,
  onLinkProposal,
  onUnlinkProposal,
  onOpenLinkedProposal,
  onImagesChange,
  autoGenerateFromProposal = false,
  embedded = false,
}) => {
  const docData = technicalDoc || createDefaultTechnicalDoc(metadata, proposal);

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isExporting, setIsExporting] = useState<'docx' | 'pdf' | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Link to proposal modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [proposalSearchQuery, setProposalSearchQuery] = useState('');
  const [syncContextOnLink, setSyncContextOnLink] = useState(true);

  // Edit metadata modal / drawer state
  const [isEditMetaOpen, setIsEditMetaOpen] = useState(false);
  const [tempMeta, setTempMeta] = useState<MetadataHeader>({ ...metadata });

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSectionCollapse = (secKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secKey]: !prev[secKey],
    }));
  };

  const allTechSectionKeys = ['techSection1', 'techSection2', 'techSection3', 'techSection4', 'techTables', 'techSection5'];
  const areAllTechSectionsCollapsed = allTechSectionKeys.every((k) => !!collapsedSections[k]);

  const handleToggleAllTechSections = () => {
    const newState = !areAllTechSectionsCollapsed;
    const nextMap: Record<string, boolean> = {};
    allTechSectionKeys.forEach((k) => {
      nextMap[k] = newState;
    });
    setCollapsedSections(nextMap);
  };

  // Custom Titles configuration state & inline editing
  const [isTitlesModalOpen, setIsTitlesModalOpen] = useState(false);
  const [isEditingMainTitleInline, setIsEditingMainTitleInline] = useState(false);
  const [tempMainTitle, setTempMainTitle] = useState('');
  const [editingSectionKey, setEditingSectionKey] = useState<keyof DocumentTitlesConfig | null>(null);
  const [tempSectionTitle, setTempSectionTitle] = useState('');

  const effectiveTitles = getEffectiveTechnicalTitles(metadata.customTitles || docData.customTitles);
  const currentDocMainTitle = docData.tituloDocumento || effectiveTitles.techMainTitle;
  const effectiveHF = getEffectiveTechnicalHeaderFooter(docData, metadata);

  const handleToggleFirstPageBanner = () => {
    const nextVal = !effectiveHF.includeFirstPageHeaderImage;
    if (onMetadataChange) {
      onMetadataChange({
        ...metadata,
        techIncludeHeaderBanner: nextVal,
      });
    }
    onChange({
      ...docData,
      includeFirstPageHeaderImage: nextVal,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleUpdateTechHF = (
    field: 'techHeaderBrandTag' | 'techHeaderSubtitle' | 'techHeaderRightText' | 'techFooterText',
    value: string
  ) => {
    if (onMetadataChange) {
      onMetadataChange({
        ...metadata,
        [field]: value,
      });
    }
    onChange({
      ...docData,
      [field]: value,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleUpdateTechTitle = (field: keyof DocumentTitlesConfig, value: string) => {
    const nextTitles: DocumentTitlesConfig = {
      ...(metadata.customTitles || docData.customTitles || {}),
      [field]: value,
    };
    if (onMetadataChange) {
      onMetadataChange({
        ...metadata,
        customTitles: nextTitles,
      });
    }
    onChange({
      ...docData,
      customTitles: nextTitles,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleToggleTechHide = (field: keyof DocumentTitlesConfig) => {
    const currentVal = (metadata.customTitles || docData.customTitles || {})[field];
    const nextTitles: DocumentTitlesConfig = {
      ...(metadata.customTitles || docData.customTitles || {}),
      [field]: !currentVal,
    };
    if (onMetadataChange) {
      onMetadataChange({
        ...metadata,
        customTitles: nextTitles,
      });
    }
    onChange({
      ...docData,
      customTitles: nextTitles,
      lastUpdated: new Date().toISOString(),
    });
  };

  useEffect(() => {
    if (!isEditMetaOpen) {
      setTempMeta({ ...metadata });
    }
  }, [
    isEditMetaOpen,
    metadata.cliente,
    metadata.fecha,
    metadata.ticketNo,
    metadata.guiaNo,
    metadata.propuestaNo,
    metadata.nombreProyecto,
    metadata.moduloAplicacion,
  ]);

  type TechTextField = 'ruta' | 'flujoOperativo' | 'diseno' | 'consideracionesTecnicas';

  const rutaRef = React.useRef<HTMLTextAreaElement>(null);
  const flujoRef = React.useRef<HTMLTextAreaElement>(null);
  const disenoRef = React.useRef<HTMLTextAreaElement>(null);
  const consRef = React.useRef<HTMLTextAreaElement>(null);
  const caretByKeyRef = React.useRef<Record<string, TextCaret>>({});
  const imageFileInputRef = React.useRef<HTMLInputElement>(null);
  const pendingImageFieldRef = React.useRef<TechTextField | null>(null);
  const didAutoGenerate = useRef(false);
  const generateToken = useRef(0);
  const [preferManual, setPreferManual] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

  const handleFieldChange = (field: keyof TechnicalDoc, value: any) => {
    onChange({
      ...docData,
      [field]: value,
      lastUpdated: new Date().toISOString(),
    });
  };

  const imageTag = (index1: number) => `[IMAGEN_${index1}]`;

  const getFieldRef = (field: TechTextField) => {
    switch (field) {
      case 'ruta':
        return rutaRef;
      case 'flujoOperativo':
        return flujoRef;
      case 'diseno':
        return disenoRef;
      default:
        return consRef;
    }
  };

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

  const insertTagIntoField = (field: TechTextField, tag: string) => {
    const el = getFieldRef(field).current;
    const current = String(docData[field] || '');
    const live = el && document.activeElement === el ? readTextareaCaret(el) : null;
    const caret = live || caretByKeyRef.current[field] || readTextareaCaret(el);
    const { newText, cursor } = insertSnippetAtCaret(current, tag, caret);
    caretByKeyRef.current[field] = { start: cursor, end: cursor };
    onChange({
      ...docData,
      [field]: newText,
      lastUpdated: new Date().toISOString(),
    });
    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(cursor, cursor);
      }
    }, 10);
  };

  const handleInsertExistingImage = (field: TechTextField, index1: number) => {
    insertTagIntoField(field, imageTag(index1));
  };

  const handlePickImageForField = (field: TechTextField) => {
    rememberCaret(field, getFieldRef(field).current);
    pendingImageFieldRef.current = field;
    imageFileInputRef.current?.click();
  };

  const handleImageFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0 || !onImagesChange) return;
    const field = pendingImageFieldRef.current;
    pendingImageFieldRef.current = null;
    const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!fileArr.length) return;

    const newImages: UploadedImage[] = [];
    let processed = 0;
    fileArr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          newImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            description: `Captura / diagrama de la documentación técnica`,
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
          if (field && newImages.length) {
            const start = images.length + 1;
            const tags = newImages.map((_, i) => imageTag(start + i)).join('\n\n');
            insertTagIntoField(field, tags);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const renderImageInsertBar = (field: TechTextField) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handlePickImageForField(field)}
        disabled={!onImagesChange}
        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-white hover:bg-blue-50 border border-slate-300 rounded transition-colors disabled:opacity-50"
        title="Subir una imagen e insertarla en este apartado"
      >
        <ImageIcon className="w-3 h-3 text-[#2ECC71]" />
        Insertar imagen
      </button>
      {images.map((img, idx) => (
        <button
          key={img.id}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleInsertExistingImage(field, idx + 1)}
          className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
          title={`Insertar ${imageTag(idx + 1)}: ${img.title}`}
        >
          +{imageTag(idx + 1)}
        </button>
      ))}
    </div>
  );

  const renderInlineImages = (text: string) => {
    const matches = [...(text || '').matchAll(/\[IMAGEN_(\d+)\]/gi)];
    const indexes = [...new Set(matches.map((m) => parseInt(m[1], 10) - 1))].filter((i) => images[i]);
    if (!indexes.length) return null;
    return (
      <div className="space-y-2">
        {indexes.map((i) => {
          const img = images[i];
          const widthPercent = Math.min(100, Math.max(25, img.widthPercent ?? 100));
          const align = img.align === 'left' || img.align === 'right' ? img.align : 'center';
          const alignClass = align === 'left' ? 'mr-auto' : align === 'right' ? 'ml-auto' : 'mx-auto';
          return (
            <figure
              key={img.id}
              className={`rounded-xl border border-slate-200 bg-slate-50 overflow-hidden ${alignClass}`}
              style={{ width: `${widthPercent}%`, maxWidth: '100%' }}
            >
              <img
                src={img.dataUrl}
                alt={img.title}
                className="w-full max-h-48 object-contain bg-white"
              />
              <figcaption className="px-2.5 py-1.5 text-[11px] text-slate-600">
                <span className="font-bold text-[#0A3D62]">{imageTag(i + 1)}</span>
                {img.title ? ` · ${img.title}` : ''}
              </figcaption>
            </figure>
          );
        })}
      </div>
    );
  };

  const textWithImagesMarkdown = (text: string): string => {
    return (text || '').replace(/\[IMAGEN_(\d+)\]/gi, (match, n) => {
      const img = images[parseInt(n, 10) - 1];
      if (!img) return match;
      return `\n*[${imageTag(parseInt(n, 10))}: ${img.title}${img.description ? ` — ${img.description}` : ''}]*\n`;
    });
  };

  const insertTableIntoText = (field: TechTextField, current: string) => {
    const tables = [...(docData.tables || [])];
    tables.push(createEmptyDocumentTable(tables.length + 1));
    const tag = tableTag(tables.length);
    const el = getFieldRef(field).current;
    rememberCaret(field, el);
    const live = el && document.activeElement === el ? readTextareaCaret(el) : null;
    const caret = live || caretByKeyRef.current[field] || readTextareaCaret(el);
    const { newText, cursor } = insertSnippetAtCaret(current, tag, caret);
    caretByKeyRef.current[field] = { start: cursor, end: cursor };
    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(cursor, cursor);
      }
    }, 10);
    return { tables, nextText: newText };
  };

  const handleInsertTableInField = (field: TechTextField) => {
    const { tables, nextText } = insertTableIntoText(field, String(docData[field] || ''));
    onChange({
      ...docData,
      [field]: nextText,
      tables,
      lastUpdated: new Date().toISOString(),
    });
  };

  const renderInlineTables = (text: string) => {
    const all = docData.tables || [];
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
          onChange({
            ...docData,
            tables: next,
            lastUpdated: new Date().toISOString(),
          });
        }}
      />
    );
  };

  const tableToMarkdown = (table: DocumentTable): string => {
    const headers = table.headers?.length ? table.headers : ['Columna'];
    const headerLine = `| ${headers.join(' | ')} |`;
    const sepLine = `| ${headers.map(() => '---').join(' | ')} |`;
    const rows = (table.rows || [])
      .map((row) => `| ${headers.map((_, i) => row[i] || '').join(' | ')} |`)
      .join('\n');
    const title = table.title?.trim() ? `**${table.title.trim()}**\n\n` : '';
    return `${title}${headerLine}\n${sepLine}\n${rows}`;
  };

  const textWithTablesMarkdown = (text: string): string => {
    const tables = docData.tables || [];
    return (text || '').replace(/\[TABLA_(\d+)\]/gi, (match, n) => {
      const table = tables[parseInt(n, 10) - 1];
      return table ? `\n${tableToMarkdown(table)}\n` : match;
    });
  };

  const handleGenerateWithAI = async () => {
    const token = ++generateToken.current;
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/generate-technical-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata,
          rawRequirements,
          proposal,
          images,
        }),
      });

      const data = await response.json();
      if (token !== generateToken.current) return;
      if (data.success && data.technicalDoc) {
        const aiTables = Array.isArray(data.technicalDoc.tables) ? data.technicalDoc.tables : [];
        onChange({
          ...data.technicalDoc,
          linkedProposalId: docData.linkedProposalId,
          linkedProposalName: docData.linkedProposalName,
          isStandalone: docData.isStandalone,
          tables: aiTables.length > 0 ? aiTables : (docData.tables || []),
        });
      } else {
        throw new Error(data.error || 'No se pudo generar la documentación técnica.');
      }
    } catch (err: any) {
      if (token !== generateToken.current) return;
      console.error('Error in AI Technical Doc generation:', err);
      alert('Error al generar la documentación técnica: ' + (err.message || 'Error de conexión'));
    } finally {
      if (token === generateToken.current) {
        setIsGeneratingAI(false);
      }
    }
  };

  const handleWriteManually = () => {
    generateToken.current += 1;
    didAutoGenerate.current = true;
    setPreferManual(true);
    setIsGeneratingAI(false);
    if (!technicalDoc) {
      onChange({
        ...createDefaultTechnicalDoc(metadata, proposal),
        isStandalone: docData.isStandalone,
        linkedProposalId: docData.linkedProposalId,
        linkedProposalName: docData.linkedProposalName,
        tables: docData.tables || [],
      });
    }
  };

  useEffect(() => {
    if (!autoGenerateFromProposal || preferManual || didAutoGenerate.current || isGeneratingAI) return;
    const hasSource = proposalHasSubstance(proposal) || Boolean(rawRequirements.trim());
    if (!hasSource) return;
    if (!isTechnicalDocUnfilled(technicalDoc || docData)) return;
    didAutoGenerate.current = true;
    void handleGenerateWithAI();
  }, [autoGenerateFromProposal, preferManual, proposal, technicalDoc, rawRequirements]);

  const handleExportDocx = async () => {
    setIsExporting('docx');
    try {
      const blob = await generateTechnicalDocDocx(metadata, docData, images);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = `Doc_Tecnica_${metadata.ticketNo || 'ADV'}_${metadata.nombreProyecto || 'Dev'}`;
      a.download = `${baseName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating docx:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting('pdf');
    try {
      await downloadTechnicalDocPdf(metadata, docData, undefined, images);
    } catch (err) {
      console.error('Error generating pdf:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleCopyMarkdown = () => {
    const allTables = docData.tables || [];
    const usedIndexes = new Set<number>();
    const markUsed = (text: string) => {
      const re = /\[TABLA_(\d+)\]/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text || '')) !== null) {
        usedIndexes.add(parseInt(m[1], 10) - 1);
      }
      return textWithImagesMarkdown(textWithTablesMarkdown(text));
    };
    const unused = allTables.filter((_, i) => !usedIndexes.has(i));
    const unusedMd = unused.length
      ? `\n---\n\n## TABLAS ADICIONALES\n\n${unused.map((t) => tableToMarkdown(t)).join('\n\n')}\n`
      : '';

    let md = '';
    if (!effectiveTitles.hideTechMainTitle) {
      md += `# ${currentDocMainTitle}\n`;
    }
    md += `**Cliente:** ${metadata.cliente || 'N/A'}\n`;
    md += `**Fecha:** ${metadata.fecha || new Date().toISOString().split('T')[0]}\n`;
    md += `**Ticket:** ${metadata.ticketNo || 'N/A'}\n`;
    md += `**Módulo:** ${metadata.moduloAplicacion || 'N/A'}\n`;
    md += `**Proyecto:** ${metadata.nombreProyecto || 'N/A'}\n`;
    if (docData.linkedProposalName) {
      md += `**Propuesta Vinculada:** ${docData.linkedProposalName}\n`;
    }

    if (!effectiveTitles.hideTechSection1 && Boolean(docData.ruta?.trim())) {
      md += `\n---\n\n## ${effectiveTitles.techSection1}\n${markUsed(docData.ruta.trim())}\n`;
    }
    if (!effectiveTitles.hideTechSection2 && Boolean(docData.flujoOperativo?.trim())) {
      md += `\n---\n\n## ${effectiveTitles.techSection2}\n${markUsed(docData.flujoOperativo.trim())}\n`;
    }
    if (!effectiveTitles.hideTechSection3 && Boolean(docData.diseno?.trim())) {
      md += `\n---\n\n## ${effectiveTitles.techSection3}\n${markUsed(docData.diseno.trim())}\n`;
    }
    if (!effectiveTitles.hideTechSection4 && Boolean(docData.consideracionesTecnicas?.trim())) {
      md += `\n---\n\n## ${effectiveTitles.techSection4}\n${markUsed(docData.consideracionesTecnicas.trim())}\n`;
    }
    if (unusedMd) {
      md += unusedMd;
    }
    if (!effectiveTitles.hideTechSection5 && Boolean(docData.codigoEjemplo?.trim())) {
      md += `\n---\n\n## ${effectiveTitles.techSection5}\n\`\`\`sql\n${docData.codigoEjemplo.trim()}\n\`\`\`\n`;
    }

    navigator.clipboard.writeText(md);
    setCopiedSection('all');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleSelectProposalToLink = (selectedItem: SavedProposal) => {
    const nextMeta = copyLinkedProposalMetadata(metadata, selectedItem.metadata);
    setTempMeta(nextMeta);

    if (onLinkProposal) {
      onLinkProposal(selectedItem, syncContextOnLink);
    } else {
      if (onMetadataChange) {
        onMetadataChange(nextMeta);
      }

      let updatedDoc: TechnicalDoc = {
        ...docData,
        linkedProposalId: selectedItem.id,
        linkedProposalName: `${selectedItem.metadata.ticketNo ? `[${selectedItem.metadata.ticketNo}] ` : ''}${selectedItem.metadata.nombreProyecto || 'Propuesta'} (${selectedItem.version || 'v1.0'})`,
        lastUpdated: new Date().toISOString(),
      };

      if (syncContextOnLink && selectedItem.content) {
        const defaultWithContext = createDefaultTechnicalDoc(nextMeta, selectedItem.content);
        updatedDoc.flujoOperativo = defaultWithContext.flujoOperativo;
        updatedDoc.diseno = defaultWithContext.diseno;
      }

      onChange(updatedDoc);
    }
    setIsLinkModalOpen(false);
  };

  const handleUnlink = () => {
    if (onUnlinkProposal) {
      onUnlinkProposal();
    } else {
      onChange({
        ...docData,
        linkedProposalId: undefined,
        linkedProposalName: undefined,
        isStandalone: true,
        lastUpdated: new Date().toISOString(),
      });
    }
  };

  const filteredHistory = history.filter((p) => {
    if (p.documentType === 'technical') return false;
    if (currentDocumentId && p.id === currentDocumentId) return false;
    const q = proposalSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const cl = (p.metadata.cliente || '').toLowerCase();
    const pr = (p.metadata.nombreProyecto || '').toLowerCase();
    const tk = (p.metadata.ticketNo || '').toLowerCase();
    const md = (p.metadata.moduloAplicacion || '').toLowerCase();
    return cl.includes(q) || pr.includes(q) || tk.includes(q) || md.includes(q);
  });

  const viewSwitcher = (
    <div className={`p-1 rounded-xl flex gap-0.5 border text-xs ${
      embedded ? 'bg-slate-100 border-slate-200' : 'bg-black/20 border-white/10'
    }`}>
      <button
        type="button"
        onClick={() => setViewMode('editor')}
        className={`px-2.5 py-1.5 font-semibold rounded-lg flex items-center gap-1 transition-all ${
          viewMode === 'editor'
            ? 'bg-white text-[#0A3D62] shadow'
            : embedded
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-blue-100/80 hover:text-white'
        }`}
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Editar</span>
      </button>
      <button
        type="button"
        onClick={() => setViewMode('preview')}
        className={`px-2.5 py-1.5 font-semibold rounded-lg flex items-center gap-1 transition-all ${
          viewMode === 'preview'
            ? 'bg-white text-[#0A3D62] shadow'
            : embedded
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-blue-100/80 hover:text-white'
        }`}
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Previa</span>
      </button>
    </div>
  );

  const aiAndExportActions = (
    <div className="flex items-center flex-wrap gap-2">
      <button
        type="button"
        onClick={handleGenerateWithAI}
        disabled={isGeneratingAI}
        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-slate-950 bg-[#2ECC71] hover:bg-[#27ae60] active:scale-95 transition-all rounded-xl shadow-md disabled:opacity-50"
        title="Generar o regenerar la documentación técnica con IA a partir de la propuesta y las notas"
      >
        {isGeneratingAI ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-slate-950" />
            <span>Generando con IA...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-slate-950" />
            <span>{isTechnicalDocUnfilled(docData) ? 'Generar con IA' : 'Regenerar con IA'}</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleCopyMarkdown}
        className={`inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
          embedded
            ? 'text-[#0A3D62] bg-white hover:bg-slate-50 border-slate-300'
            : 'text-white bg-white/10 hover:bg-white/20 border-white/20'
        }`}
        title="Copiar especificación técnica en Markdown para Jira, GitHub o DevOps"
      >
        {copiedSection === 'all' ? (
          <>
            <Check className={`w-3.5 h-3.5 mr-1 ${embedded ? 'text-emerald-600' : 'text-[#2ECC71]'}`} />
            <span>Copiado</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 mr-1" />
            <span>Copiar MD</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleExportDocx}
        disabled={isExporting !== null}
        className={`inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all disabled:opacity-50 ${
          embedded
            ? 'text-[#0A3D62] bg-white hover:bg-slate-50 border-slate-300'
            : 'text-white bg-white/15 hover:bg-white/25 border-white/20'
        }`}
        title="Descargar documento Word (.docx) técnico"
      >
        <FileDown className={`w-3.5 h-3.5 mr-1 ${embedded ? 'text-slate-500' : 'text-blue-200'}`} />
        <span>Word</span>
      </button>

      <button
        type="button"
        onClick={handleExportPdf}
        disabled={isExporting !== null}
        className={`inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all disabled:opacity-50 ${
          embedded
            ? 'text-[#0A3D62] bg-white hover:bg-slate-50 border-slate-300'
            : 'text-white bg-white/15 hover:bg-white/25 border-white/20'
        }`}
        title="Descargar documento PDF técnico"
      >
        <FileDown className={`w-3.5 h-3.5 mr-1 ${embedded ? 'text-slate-500' : 'text-blue-200'}`} />
        <span>PDF</span>
      </button>

      {!embedded && onSave && (
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-[#0A3D62] bg-white hover:bg-slate-100 active:scale-95 transition-all rounded-xl shadow-md"
          title="Guardar cambios en el proyecto e historial"
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          <span>Guardar</span>
        </button>
      )}
    </div>
  );

  return (
    <div className={embedded
      ? 'flex flex-col h-full min-w-0 animate-in fade-in duration-300'
      : 'bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-300'
    }>
      
      {embedded ? (
        <div className="bg-white border-b border-slate-200 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {viewSwitcher}
            <p className="text-[11px] text-slate-600 max-w-xl leading-snug hidden sm:block">
              {viewMode === 'preview'
                ? 'Así se verá el documento técnico al exportar Word o PDF.'
                : 'Spec interna para Dev/QA. Si hay propuesta, la IA la completa; después editas las secciones a mano.'}
            </p>
          </div>
          {aiAndExportActions}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#0A3D62] via-[#0D4B75] to-[#1E5F8A] p-4 text-white flex flex-wrap items-center justify-between gap-3 border-b border-blue-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Terminal className="w-5 h-5 text-[#2ECC71]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2ECC71] text-slate-950 uppercase tracking-wider">
                  Uso Interno Dev / QA
                </span>
                <span className="text-xs text-blue-200">
                  Ticket: {metadata.ticketNo || 'N/A'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold leading-tight text-white">
                Documentación Técnica Interna
              </h2>
              <p className="text-[11px] text-blue-100 hidden sm:block">
                Documento independiente. Luego puedes atarlo a una propuesta del historial.
              </p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {viewSwitcher}
            {aiAndExportActions}
          </div>
        </div>
      )}

      {/* Linking & Project Context — standalone only; inside a proposal this is redundant */}
      {!embedded && (
      <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Metadata and Edit Button */}
        <div className="flex items-center flex-wrap gap-3 text-slate-700 min-w-0">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <strong className="text-slate-900 font-semibold">Cliente:</strong> 
            <span className="text-slate-800">{metadata.cliente || 'Sin asignar'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <strong className="text-slate-900 font-semibold">Proyecto:</strong> 
            <span className="text-slate-800">{metadata.nombreProyecto || 'Sin asignar'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <strong className="text-slate-900 font-semibold">Módulo:</strong> 
            <span className="text-slate-800">{metadata.moduloAplicacion || 'Sin asignar'}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setTempMeta({ ...metadata });
              setIsEditMetaOpen(true);
            }}
            className="text-[11px] font-semibold text-[#0A3D62] hover:text-blue-800 bg-white hover:bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
            title="Editar datos del proyecto (cliente, ticket, proyecto, módulo)"
          >
            <Edit3 className="w-3 h-3 text-[#0A3D62]" />
            <span>Editar Datos</span>
          </button>
        </div>

        {/* Right: Link to Proposal Status Pill */}
        <div className="flex items-center gap-2">
          {docData.linkedProposalId ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300/80 text-emerald-900 px-2.5 py-1 rounded-lg">
              <Link className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-[11px] truncate max-w-[200px] sm:max-w-[280px]" title={docData.linkedProposalName}>
                Atada a: {docData.linkedProposalName || 'Propuesta Técnica'}
              </span>
              <button
                type="button"
                onClick={handleUnlink}
                className="text-emerald-700 hover:text-red-600 p-0.5 rounded transition-colors ml-1"
                title="Desacoplar / Desvincular de la propuesta técnica"
              >
                <Unlink className="w-3 h-3" />
              </button>
              {onOpenLinkedProposal && (
                <button
                  type="button"
                  onClick={onOpenLinkedProposal}
                  className="text-emerald-800 hover:text-[#0A3D62] p-0.5 rounded transition-colors"
                  title="Abrir la propuesta atada"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Modo Desacoplado
              </span>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[#0A3D62] bg-white hover:bg-blue-50 border border-blue-300 shadow-2xs transition-all cursor-pointer"
                title="Vincular esta documentación técnica a una propuesta técnica existente del historial"
              >
                <Link className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>Atar a Propuesta Técnica</span>
              </button>
            </div>
          )}
        </div>

      </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 overflow-y-auto relative ${
        viewMode === 'preview' ? 'p-3 sm:p-4 bg-slate-100/90' : 'p-4 sm:p-6 space-y-6 bg-slate-50/50'
      }`}>
        {isGeneratingAI && (
          <div className="absolute inset-0 z-20 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#2ECC71]" />
            <p className="text-sm font-bold text-[#0A3D62]">
              Completando la documentación técnica con IA
            </p>
            <p className="text-xs text-slate-600 max-w-md">
              Se está estructurando ruta, flujo, diseño, consideraciones y código a partir de la propuesta. Luego podrás editar todo a mano.
            </p>
            <button
              type="button"
              onClick={handleWriteManually}
              className="mt-1 inline-flex items-center px-3 py-1.5 text-xs font-semibold text-[#0A3D62] bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Cancelar y escribir a mano
            </button>
          </div>
        )}
        <input
          ref={imageFileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleImageFilesSelected(e.target.files);
            e.target.value = '';
          }}
        />

        {viewMode === 'preview' ? (
          <TechnicalDocPreview metadata={metadata} technicalDoc={docData} images={images} />
        ) : (
        <>
        {/* Document Title and Section Visibility Quick Settings Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A3D62] shrink-0">
                <Heading1 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Título del Documento Técnico
                  </span>
                  {effectiveTitles.hideTechMainTitle && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Oculto en exportación
                    </span>
                  )}
                </div>

                {isEditingMainTitleInline ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={tempMainTitle}
                      onChange={(e) => setTempMainTitle(e.target.value)}
                      placeholder="DOCUMENTACIÓN TÉCNICA INTERNA Y ESPECIFICACIÓN DE DESARROLLO"
                      className="text-xs sm:text-sm font-bold text-[#0A3D62] border border-[#0A3D62] rounded-lg px-2.5 py-1 w-full max-w-lg bg-blue-50/40 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange('tituloDocumento', tempMainTitle);
                        handleUpdateTechTitle('techMainTitle', tempMainTitle);
                        setIsEditingMainTitleInline(false);
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-[#0A3D62] hover:bg-blue-900 rounded-lg shrink-0 cursor-pointer"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingMainTitleInline(false)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-0.5 group">
                    <h2
                      className={`text-sm sm:text-base font-bold truncate ${
                        effectiveTitles.hideTechMainTitle ? 'text-slate-400 line-through' : 'text-[#0A3D62]'
                      }`}
                      title={currentDocMainTitle}
                    >
                      {currentDocMainTitle}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setTempMainTitle(currentDocMainTitle);
                        setIsEditingMainTitleInline(true);
                      }}
                      className="text-slate-400 hover:text-[#0A3D62] p-1 rounded transition-colors"
                      title="Editar título principal del documento"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons for Titles and Collapse All */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleToggleAllTechSections}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#0A3D62] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title={areAllTechSectionsCollapsed ? "Descomprimir / Expandir todas las secciones" : "Comprimir / Plegar todas las secciones"}
              >
                {areAllTechSectionsCollapsed ? (
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

              <button
                type="button"
                onClick={() => handleToggleTechHide('hideTechMainTitle')}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  effectiveTitles.hideTechMainTitle
                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title={effectiveTitles.hideTechMainTitle ? 'Hacer visible el título principal en Word/PDF' : 'Ocultar título principal en Word/PDF'}
              >
                {effectiveTitles.hideTechMainTitle ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>Título Oculto</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>Título Visible</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleFirstPageBanner}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  effectiveHF.includeFirstPageHeaderImage
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title={
                  effectiveHF.includeFirstPageHeaderImage
                    ? 'Banner institucional de portada activado en Word y PDF (haz clic para desactivar)'
                    : 'Banner institucional de portada desactivado (haz clic para activar)'
                }
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span>{effectiveHF.includeFirstPageHeaderImage ? 'Banner Portada: Activo' : 'Banner Portada: Desactivado'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTitlesModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0A3D62] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Configurar y renombrar los títulos u ocultar secciones de la documentación técnica"
              >
                <Sliders className="w-3.5 h-3.5 text-[#0A3D62]" />
                <span>Configurar Títulos (5 Secc.)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. RUTA */}
        <div className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm transition-all ${
          effectiveTitles.hideTechSection1 ? 'border-amber-200/80 bg-amber-50/15' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => toggleSectionCollapse('techSection1')}
                className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A3D62] hover:bg-blue-100 transition-colors shrink-0 cursor-pointer"
                title={collapsedSections['techSection1'] ? "Descomprimir sección" : "Comprimir sección"}
              >
                {collapsedSections['techSection1'] ? (
                  <ChevronDown className="w-4 h-4 text-[#0A3D62]" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-[#0A3D62]" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 
                    onClick={() => toggleSectionCollapse('techSection1')}
                    className={`text-sm font-bold truncate cursor-pointer hover:text-blue-900 ${effectiveTitles.hideTechSection1 ? 'text-slate-500 line-through' : 'text-slate-900'}`}
                  >
                    1. {effectiveTitles.techSection1}
                  </h3>
                  {docData.ruta?.trim() ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {docData.ruta.trim().length} car.
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                      Vacía
                    </span>
                  )}
                  {effectiveTitles.hideTechSection1 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Oculta en exportación
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSectionKey('techSection1');
                      setTempSectionTitle(effectiveTitles.techSection1);
                    }}
                    className="text-slate-400 hover:text-[#0A3D62] p-0.5 rounded transition-colors"
                    title="Renombrar título de esta sección"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  Ruta de menú, pantallas/formularios, vistas, microservicios y endpoints API involucrados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => toggleSectionCollapse('techSection1')}
                className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {collapsedSections['techSection1'] ? 'Descomprimir' : 'Comprimir'}
              </button>
              <button
                type="button"
                onClick={() => handleToggleTechHide('hideTechSection1')}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  effectiveTitles.hideTechSection1
                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title={effectiveTitles.hideTechSection1 ? 'Mostrar sección en exportación' : 'Ocultar sección en exportación'}
              >
                {effectiveTitles.hideTechSection1 ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline text-[11px]">Oculta</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline text-[11px]">Visible</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {collapsedSections['techSection1'] ? (
            <div 
              onClick={() => toggleSectionCollapse('techSection1')}
              className="mt-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2"
            >
              <p className="truncate italic text-slate-500 font-mono flex-1">
                {docData.ruta?.trim() || 'Sección comprimida (sin ruta especificada aún). Haz clic para expandir.'}
              </p>
              <span className="text-[10px] font-bold text-[#0A3D62] shrink-0">Expandir</span>
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              <TextFormattingToolbar
                textareaRef={rutaRef}
                value={docData.ruta}
                onChange={(v) => handleFieldChange('ruta', v)}
                onInsertTable={() => handleInsertTableInField('ruta')}
              />
              {renderImageInsertBar('ruta')}
              <textarea
                id="techdoc-ruta"
                ref={rutaRef}
                rows={4}
                value={docData.ruta}
                onChange={(e) => handleFieldChange('ruta', e.target.value)}
                onKeyDown={(e) => handleAutoBulletKeyDown(e, docData.ruta, (v) => handleFieldChange('ruta', v))}
                {...caretHandlers('ruta')}
                placeholder="Ejemplo: Menú Principal > Operaciones > Facturación > frm_gestion_cobros.aspx"
                className="w-full text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:border-[#0A3D62] focus:ring-1 focus:ring-[#0A3D62] outline-none transition-all resize-y leading-relaxed font-mono"
              />
              {renderInlineTables(docData.ruta)}
              {renderInlineImages(docData.ruta)}
              {(docData.ruta || '').includes('```') && (
                <RichTextBlock text={docData.ruta} tables={docData.tables || []} images={images} />
              )}
            </div>
          )}
        </div>

        {/* 2. FLUJO OPERATIVO */}
        <div className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm transition-all ${
          effectiveTitles.hideTechSection2 ? 'border-amber-200/80 bg-amber-50/15' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => toggleSectionCollapse('techSection2')}
                className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors shrink-0 cursor-pointer"
                title={collapsedSections['techSection2'] ? "Descomprimir sección" : "Comprimir sección"}
              >
                {collapsedSections['techSection2'] ? (
                  <ChevronDown className="w-4 h-4 text-emerald-700" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-emerald-700" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 
                    onClick={() => toggleSectionCollapse('techSection2')}
                    className={`text-sm font-bold truncate cursor-pointer hover:text-emerald-900 ${effectiveTitles.hideTechSection2 ? 'text-slate-500 line-through' : 'text-slate-900'}`}
                  >
                    2. {effectiveTitles.techSection2}
                  </h3>
                  {docData.flujoOperativo?.trim() ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {docData.flujoOperativo.trim().length} car.
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                      Vacía
                    </span>
                  )}
                  {effectiveTitles.hideTechSection2 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Oculta en exportación
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSectionKey('techSection2');
                      setTempSectionTitle(effectiveTitles.techSection2);
                    }}
                    className="text-slate-400 hover:text-[#0A3D62] p-0.5 rounded transition-colors"
                    title="Renombrar título de esta sección"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  Secuencia técnica detallada (Eventos de UI, validaciones, servicios backend, persistencia y respuestas).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => toggleSectionCollapse('techSection2')}
                className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {collapsedSections['techSection2'] ? 'Descomprimir' : 'Comprimir'}
              </button>
              <button
                type="button"
                onClick={() => handleToggleTechHide('hideTechSection2')}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  effectiveTitles.hideTechSection2
                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title={effectiveTitles.hideTechSection2 ? 'Mostrar sección en exportación' : 'Ocultar sección en exportación'}
              >
                {effectiveTitles.hideTechSection2 ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline text-[11px]">Oculta</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline text-[11px]">Visible</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {collapsedSections['techSection2'] ? (
            <div 
              onClick={() => toggleSectionCollapse('techSection2')}
              className="mt-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-center justify-between gap-2"
            >
              <p className="truncate italic text-slate-500 flex-1">
                {docData.flujoOperativo?.trim() || 'Sección comprimida (sin flujo operativo). Haz clic para expandir.'}
              </p>
              <span className="text-[10px] font-bold text-emerald-800 shrink-0">Expandir</span>
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              <TextFormattingToolbar
                textareaRef={flujoRef}
                value={docData.flujoOperativo}
                onChange={(v) => handleFieldChange('flujoOperativo', v)}
                onInsertTable={() => handleInsertTableInField('flujoOperativo')}
              />
              {renderImageInsertBar('flujoOperativo')}
              <textarea
                id="techdoc-flujo"
                ref={flujoRef}
                rows={6}
                value={docData.flujoOperativo}
                onChange={(e) => handleFieldChange('flujoOperativo', e.target.value)}
                onKeyDown={(e) => handleAutoBulletKeyDown(e, docData.flujoOperativo, (v) => handleFieldChange('flujoOperativo', v))}
                {...caretHandlers('flujoOperativo')}
                placeholder="1. Evento Disparador: El usuario presiona el botón...\n2. Validación Frontend...\n3. Procesamiento Backend..."
                className="w-full text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:border-[#0A3D62] focus:ring-1 focus:ring-[#0A3D62] outline-none transition-all resize-y leading-relaxed"
              />
              {renderInlineTables(docData.flujoOperativo)}
              {renderInlineImages(docData.flujoOperativo)}
              {(docData.flujoOperativo || '').includes('```') && (
                <RichTextBlock text={docData.flujoOperativo} tables={docData.tables || []} images={images} />
              )}
            </div>
          )}
        </div>

        {/* 3. DISEÑO */}
        <div className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm transition-all ${
          effectiveTitles.hideTechSection3 ? 'border-amber-200/80 bg-amber-50/15' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => toggleSectionCollapse('techSection3')}
                className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors shrink-0 cursor-pointer"
                title={collapsedSections['techSection3'] ? "Descomprimir sección" : "Comprimir sección"}
              >
                {collapsedSections['techSection3'] ? (
                  <ChevronDown className="w-4 h-4 text-indigo-700" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-indigo-700" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 
                    onClick={() => toggleSectionCollapse('techSection3')}
                    className={`text-sm font-bold truncate cursor-pointer hover:text-indigo-900 ${effectiveTitles.hideTechSection3 ? 'text-slate-500 line-through' : 'text-slate-900'}`}
                  >
                    3. {effectiveTitles.techSection3}
                  </h3>
                  {docData.diseno?.trim() ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {docData.diseno.trim().length} car.
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                      Vacía
                    </span>
                  )}
                  {effectiveTitles.hideTechSection3 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Oculta en exportación
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSectionKey('techSection3');
                      setTempSectionTitle(effectiveTitles.techSection3);
                    }}
                    className="text-slate-400 hover:text-[#0A3D62] p-0.5 rounded transition-colors"
                    title="Renombrar título de esta sección"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  Componentes visuales, diseño técnico y entidades/tablas de base de datos (cabeceras, detalles, llaves foráneas).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => toggleSectionCollapse('techSection3')}
                className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {collapsedSections['techSection3'] ? 'Descomprimir' : 'Comprimir'}
              </button>
              <button
                type="button"
                onClick={() => handleToggleTechHide('hideTechSection3')}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  effectiveTitles.hideTechSection3
                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title={effectiveTitles.hideTechSection3 ? 'Mostrar sección en exportación' : 'Ocultar sección en exportación'}
              >
                {effectiveTitles.hideTechSection3 ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline text-[11px]">Oculta</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline text-[11px]">Visible</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {collapsedSections['techSection3'] ? (
            <div 
              onClick={() => toggleSectionCollapse('techSection3')}
              className="mt-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between gap-2"
            >
              <p className="truncate italic text-slate-500 flex-1">
                {docData.diseno?.trim() || 'Sección comprimida (sin diseño de interfaz o tablas). Haz clic para expandir.'}
              </p>
              <span className="text-[10px] font-bold text-indigo-800 shrink-0">Expandir</span>
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              <TextFormattingToolbar
                textareaRef={disenoRef}
                value={docData.diseno}
                onChange={(v) => handleFieldChange('diseno', v)}
                onInsertTable={() => handleInsertTableInField('diseno')}
              />
              {renderImageInsertBar('diseno')}
              <textarea
                id="techdoc-diseno"
                ref={disenoRef}
                rows={5}
                value={docData.diseno}
                onChange={(e) => handleFieldChange('diseno', e.target.value)}
                onKeyDown={(e) => handleAutoBulletKeyDown(e, docData.diseno, (v) => handleFieldChange('diseno', v))}
                {...caretHandlers('diseno')}
                placeholder="• Componentes Visuales: Formulario modal con grilla...\n• Tablas de BD: TBL_CLIENTE_CUENTAS (Id, ClienteId, Saldo, Estado)..."
                className="w-full text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:border-[#0A3D62] focus:ring-1 focus:ring-[#0A3D62] outline-none transition-all resize-y leading-relaxed"
              />
              {renderInlineTables(docData.diseno)}
              {renderInlineImages(docData.diseno)}
              {(docData.diseno || '').includes('```') && (
                <RichTextBlock text={docData.diseno} tables={docData.tables || []} images={images} />
              )}
            </div>
          )}
        </div>

        {/* 4. CONSIDERACIONES TÉCNICAS */}
        <div className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm transition-all ${
          effectiveTitles.hideTechSection4 ? 'border-amber-200/80 bg-amber-50/15' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => toggleSectionCollapse('techSection4')}
                className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 hover:bg-amber-100 transition-colors shrink-0 cursor-pointer"
                title={collapsedSections['techSection4'] ? "Descomprimir sección" : "Comprimir sección"}
              >
                {collapsedSections['techSection4'] ? (
                  <ChevronDown className="w-4 h-4 text-amber-700" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-amber-700" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 
                    onClick={() => toggleSectionCollapse('techSection4')}
                    className={`text-sm font-bold truncate cursor-pointer hover:text-amber-900 ${effectiveTitles.hideTechSection4 ? 'text-slate-500 line-through' : 'text-slate-900'}`}
                  >
                    4. {effectiveTitles.techSection4}
                  </h3>
                  {docData.consideracionesTecnicas?.trim() ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {docData.consideracionesTecnicas.trim().length} car.
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                      Vacía
                    </span>
                  )}
                  {effectiveTitles.hideTechSection4 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Oculta en exportación
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSectionKey('techSection4');
                      setTempSectionTitle(effectiveTitles.techSection4);
                    }}
                    className="text-slate-400 hover:text-[#0A3D62] p-0.5 rounded transition-colors"
                    title="Renombrar título de esta sección"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  Transaccionalidad (ACID), concurrencia, permisos/roles de usuario, validaciones críticas, auditoría y rendimiento.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => toggleSectionCollapse('techSection4')}
                className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {collapsedSections['techSection4'] ? 'Descomprimir' : 'Comprimir'}
              </button>
              <button
                type="button"
                onClick={() => handleToggleTechHide('hideTechSection4')}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  effectiveTitles.hideTechSection4
                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title={effectiveTitles.hideTechSection4 ? 'Mostrar sección en exportación' : 'Ocultar sección en exportación'}
              >
                {effectiveTitles.hideTechSection4 ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline text-[11px]">Oculta</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline text-[11px]">Visible</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {collapsedSections['techSection4'] ? (
            <div 
              onClick={() => toggleSectionCollapse('techSection4')}
              className="mt-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-all flex items-center justify-between gap-2"
            >
              <p className="truncate italic text-slate-500 flex-1">
                {docData.consideracionesTecnicas?.trim() || 'Sección comprimida (sin consideraciones técnicas). Haz clic para expandir.'}
              </p>
              <span className="text-[10px] font-bold text-amber-800 shrink-0">Expandir</span>
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              <TextFormattingToolbar
                textareaRef={consRef}
                value={docData.consideracionesTecnicas}
                onChange={(v) => handleFieldChange('consideracionesTecnicas', v)}
                onInsertTable={() => handleInsertTableInField('consideracionesTecnicas')}
              />
              {renderImageInsertBar('consideracionesTecnicas')}
              <textarea
                id="techdoc-cons"
                ref={consRef}
                rows={5}
                value={docData.consideracionesTecnicas}
                onChange={(e) => handleFieldChange('consideracionesTecnicas', e.target.value)}
                onKeyDown={(e) => handleAutoBulletKeyDown(e, docData.consideracionesTecnicas, (v) => handleFieldChange('consideracionesTecnicas', v))}
                {...caretHandlers('consideracionesTecnicas')}
                placeholder="• Seguridad: Requiere rol SUPERVISOR_OPERACIONES...\n• Transacciones: Ejecutar dentro de BEGIN TRANSACTION...\n• Auditoría: Registrar usuario e IP en TBL_LOG..."
                className="w-full text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:border-[#0A3D62] focus:ring-1 focus:ring-[#0A3D62] outline-none transition-all resize-y leading-relaxed"
              />
              {renderInlineTables(docData.consideracionesTecnicas)}
              {renderInlineImages(docData.consideracionesTecnicas)}
              {(docData.consideracionesTecnicas || '').includes('```') && (
                <RichTextBlock text={docData.consideracionesTecnicas} tables={docData.tables || []} images={images} />
              )}
            </div>
          )}
        </div>

        {onImagesChange && (
          <ImageUploader compact images={images} onChange={onImagesChange} />
        )}

        {/* Tablas del documento */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => toggleSectionCollapse('techTables')}
                className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0A3D62] hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
                title={collapsedSections['techTables'] ? "Descomprimir sección" : "Comprimir sección"}
              >
                {collapsedSections['techTables'] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <h3 
                  onClick={() => toggleSectionCollapse('techTables')}
                  className="text-sm font-bold text-slate-900 cursor-pointer hover:text-blue-900 truncate"
                >
                  Tablas del documento
                </h3>
                <p className="text-[11px] text-slate-500 truncate">
                  Inserta una tabla en Ruta, Flujo, Diseño o Consideraciones. En el texto aparecen como [TABLA_1], [TABLA_2]…
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                {docData.tables?.length || 0} tabla{(docData.tables?.length || 0) === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() => toggleSectionCollapse('techTables')}
                className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {collapsedSections['techTables'] ? 'Descomprimir' : 'Comprimir'}
              </button>
            </div>
          </div>

          {collapsedSections['techTables'] ? (
            <div 
              onClick={() => toggleSectionCollapse('techTables')}
              className="mt-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2"
            >
              <p className="truncate italic text-slate-500 flex-1">
                {docData.tables && docData.tables.length > 0
                  ? docData.tables.map((t, i) => `[TABLA_${i+1}]: ${t.caption || 'Sin título'}`).join(' | ')
                  : 'Sección comprimida (sin tablas creadas). Haz clic para expandir.'}
              </p>
              <span className="text-[10px] font-bold text-[#0A3D62] shrink-0">Expandir</span>
            </div>
          ) : (
            <div className="mt-3">
              <DocumentTablesEditor
                tables={docData.tables || []}
                onChange={(tables) => handleFieldChange('tables', tables)}
              />
            </div>
          )}
        </div>

        {/* 5. CÓDIGO DE EJEMPLO */}
        <div className={`rounded-2xl p-4 sm:p-5 border shadow-md transition-all ${
          effectiveTitles.hideTechSection5 ? 'bg-slate-900/80 border-amber-500/40 text-slate-300' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-2">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => toggleSectionCollapse('techSection5')}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[#2ECC71] hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                title={collapsedSections['techSection5'] ? "Descomprimir sección" : "Comprimir sección"}
              >
                {collapsedSections['techSection5'] ? (
                  <ChevronDown className="w-4 h-4 text-[#2ECC71]" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-[#2ECC71]" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 
                    onClick={() => toggleSectionCollapse('techSection5')}
                    className={`text-sm font-bold truncate cursor-pointer hover:text-emerald-300 ${effectiveTitles.hideTechSection5 ? 'text-slate-400 line-through' : 'text-white'}`}
                  >
                    5. {effectiveTitles.techSection5}
                  </h3>
                  {docData.codigoEjemplo?.trim() ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
                      {docData.codigoEjemplo.trim().split('\n').length} líneas
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                      Vacía
                    </span>
                  )}
                  {effectiveTitles.hideTechSection5 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-200 border border-amber-600/50">
                      Oculta en exportación
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSectionKey('techSection5');
                      setTempSectionTitle(effectiveTitles.techSection5);
                    }}
                    className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                    title="Renombrar título de esta sección"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Scripts SQL (CREATE TABLE, SELECT), payloads JSON de endpoints o pseudocódigo para desarrollo.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => toggleSectionCollapse('techSection5')}
                className="px-2 py-1 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                {collapsedSections['techSection5'] ? 'Descomprimir' : 'Comprimir'}
              </button>

              <button
                type="button"
                onClick={() => handleToggleTechHide('hideTechSection5')}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  effectiveTitles.hideTechSection5
                    ? 'bg-amber-950/60 text-amber-200 border-amber-700/60 hover:bg-amber-900/60'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title={effectiveTitles.hideTechSection5 ? 'Mostrar sección en exportación' : 'Ocultar sección en exportación'}
              >
                {effectiveTitles.hideTechSection5 ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline text-[11px]">Oculta</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline text-[11px]">Visible</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(docData.codigoEjemplo || '');
                  setCopiedSection('code');
                  setTimeout(() => setCopiedSection(null), 2000);
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedSection === 'code' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#2ECC71]" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {collapsedSections['techSection5'] ? (
            <div 
              onClick={() => toggleSectionCollapse('techSection5')}
              className="mt-2 p-3 bg-slate-950/80 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400 cursor-pointer hover:border-emerald-500/50 hover:bg-slate-950 transition-all flex items-center justify-between gap-2"
            >
              <p className="truncate italic font-mono text-emerald-400/80 flex-1">
                {docData.codigoEjemplo?.trim() || 'Sección comprimida (sin código o scripts). Haz clic para expandir.'}
              </p>
              <span className="text-[10px] font-bold text-[#2ECC71] shrink-0">Expandir</span>
            </div>
          ) : (
            <div className="mt-3">
              <textarea
                id="techdoc-code"
                rows={8}
                value={docData.codigoEjemplo || ''}
                onChange={(e) => handleFieldChange('codigoEjemplo', e.target.value)}
                placeholder="-- Script SQL o Payload de ejemplo&#10;CREATE TABLE dbo.TBL_EJEMPLO (&#10;    Id INT PRIMARY KEY,&#10;    Nombre VARCHAR(100)&#10;);"
                className="w-full text-xs text-emerald-400 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 focus:border-[#2ECC71] focus:ring-1 focus:ring-[#2ECC71] outline-none font-mono transition-all resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}
        </div>
        </>
        )}

      </div>

      {/* Modal: Link to Existing Proposal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0A3D62] text-white p-4 px-5 flex items-center justify-between border-b border-[#1E5F8A]">
              <div className="flex items-center space-x-2">
                <Link className="w-5 h-5 text-[#2ECC71]" />
                <h3 className="text-sm font-bold">Vincular a Propuesta Técnica Existente</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              <p className="text-slate-600">
                Selecciona una propuesta técnica guardada en tu historial para atar esta especificación interna al mismo cliente y ticket:
              </p>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={proposalSearchQuery}
                  onChange={(e) => setProposalSearchQuery(e.target.value)}
                  placeholder="Buscar por cliente, proyecto, ticket o módulo..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#0A3D62] outline-none"
                />
              </div>

              {/* Sync Option Checkbox */}
              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncContextOnLink}
                  onChange={(e) => setSyncContextOnLink(e.target.checked)}
                  className="mt-0.5 text-[#0A3D62] focus:ring-[#0A3D62] rounded"
                />
                <span className="text-[11px] text-blue-900 leading-tight">
                  <strong>Sincronizar flujos de la propuesta:</strong> sugiere flujo y diseño a partir del contenido. Los datos del proyecto (cliente, ticket, módulo) se copian siempre al atar.
                </span>
              </label>

              {/* Proposals List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectProposalToLink(item)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#0A3D62] hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {item.metadata.nombreProyecto || 'Propuesta sin nombre'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-[#0A3D62] font-semibold">
                            {item.version || 'v1.0'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>{item.metadata.cliente || 'Cliente'}</span>
                          {item.metadata.ticketNo && <span>• Ticket: {item.metadata.ticketNo}</span>}
                          {item.metadata.moduloAplicacion && <span>• {item.metadata.moduloAplicacion}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#0A3D62] group-hover:text-emerald-600 shrink-0">
                        Vincular
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No se encontraron propuestas guardadas en el historial.
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Edit Metadata in Decoupled Mode */}
      {isEditMetaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0A3D62] text-white p-4 px-5 flex items-center justify-between border-b border-[#1E5F8A]">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#2ECC71]" />
                <h3 className="text-sm font-bold">Datos del Proyecto y Requerimiento</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditMetaOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Nombre del Proyecto:</label>
                <input
                  type="text"
                  value={tempMeta.nombreProyecto}
                  onChange={(e) => setTempMeta({ ...tempMeta, nombreProyecto: e.target.value })}
                  placeholder="ej. Módulo de Aprobación de Créditos"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#0A3D62] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Cliente:</label>
                  <input
                    type="text"
                    value={tempMeta.cliente}
                    onChange={(e) => setTempMeta({ ...tempMeta, cliente: e.target.value })}
                    placeholder="ej. Banco BHD"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#0A3D62] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Fecha:</label>
                  <input
                    type="date"
                    value={tempMeta.fecha}
                    onChange={(e) => setTempMeta({ ...tempMeta, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#0A3D62] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Ticket No:</label>
                  <input
                    type="text"
                    value={tempMeta.ticketNo}
                    onChange={(e) => setTempMeta({ ...tempMeta, ticketNo: e.target.value })}
                    placeholder="ej. TK-2026-089"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-[#0A3D62] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Guía No:</label>
                  <input
                    type="text"
                    value={tempMeta.guiaNo}
                    onChange={(e) => setTempMeta({ ...tempMeta, guiaNo: e.target.value })}
                    placeholder="ej. G-2026-014"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-[#0A3D62] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Propuesta Nº:</label>
                  <input
                    type="text"
                    value={tempMeta.propuestaNo}
                    onChange={(e) => setTempMeta({ ...tempMeta, propuestaNo: e.target.value })}
                    placeholder="ej. PT-2026-042"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-[#0A3D62] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Módulo / Sistema:</label>
                  <input
                    type="text"
                    value={tempMeta.moduloAplicacion}
                    onChange={(e) => setTempMeta({ ...tempMeta, moduloAplicacion: e.target.value })}
                    placeholder="ej. Cobros y Facturación"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#0A3D62] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditMetaOpen(false)}
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onMetadataChange) {
                      onMetadataChange(tempMeta);
                    }
                    setIsEditMetaOpen(false);
                  }}
                  className="px-4 py-2 font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Guardar Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Full Titles & Visibility Configuration for Technical Documentation */}
      {isTitlesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0A3D62] text-white p-4 px-5 flex items-center justify-between border-b border-[#1E5F8A]">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#2ECC71]" />
                <div>
                  <h3 className="text-sm font-bold">Personalizar Títulos y Visibilidad</h3>
                  <p className="text-[11px] text-blue-100">
                    Ajusta los encabezados o activa/oculta secciones para las exportaciones Word y PDF.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTitlesModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              {/* Título Principal */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Heading1 className="w-3.5 h-3.5 text-[#0A3D62]" />
                    Título Principal del Documento:
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleTechHide('hideTechMainTitle')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold border flex items-center gap-1 transition-colors cursor-pointer ${
                      effectiveTitles.hideTechMainTitle
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {effectiveTitles.hideTechMainTitle ? (
                      <>
                        <EyeOff className="w-3 h-3 text-amber-600" />
                        <span>Oculto en exportación</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 text-slate-600" />
                        <span>Visible en exportación</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={effectiveTitles.techMainTitle}
                  onChange={(e) => {
                    handleUpdateTechTitle('techMainTitle', e.target.value);
                    handleFieldChange('tituloDocumento', e.target.value);
                  }}
                  placeholder="DOCUMENTACIÓN TÉCNICA INTERNA Y ESPECIFICACIÓN DE DESARROLLO"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#0A3D62] bg-white outline-none"
                />
              </div>

              {/* Secciones 1 a 5 */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Títulos de Secciones Técnicas:
                </h4>

                {/* Sección 1 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Sección 1 (Ruta & Navegación):
                    </label>
                    <input
                      type="text"
                      value={effectiveTitles.techSection1}
                      onChange={(e) => handleUpdateTechTitle('techSection1', e.target.value)}
                      placeholder="1. RUTA DE ACCESO & NAVEGACIÓN EN EL SISTEMA"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:ring-2 focus:ring-[#0A3D62] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleTechHide('hideTechSection1')}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                      effectiveTitles.hideTechSection1
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                    title={effectiveTitles.hideTechSection1 ? 'Mostrar sección en exportación' : 'Ocultar sección en exportación'}
                  >
                    {effectiveTitles.hideTechSection1 ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                        <span>Oculta</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Visible</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sección 2 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Sección 2 (Flujo Operativo):
                    </label>
                    <input
                      type="text"
                      value={effectiveTitles.techSection2}
                      onChange={(e) => handleUpdateTechTitle('techSection2', e.target.value)}
                      placeholder="2. FLUJO OPERATIVO INTERNO"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:ring-2 focus:ring-[#0A3D62] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleTechHide('hideTechSection2')}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                      effectiveTitles.hideTechSection2
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                    title={effectiveTitles.hideTechSection2 ? 'Mostrar sección en exportación' : 'Ocultar sección en exportación'}
                  >
                    {effectiveTitles.hideTechSection2 ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                        <span>Oculta</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Visible</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sección 3 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Sección 3 (Diseño & Estructura de Datos):
                    </label>
                    <input
                      type="text"
                      value={effectiveTitles.techSection3}
                      onChange={(e) => handleUpdateTechTitle('techSection3', e.target.value)}
                      placeholder="3. DISEÑO DE INTERFAZ Y ESTRUCTURA DE DATOS"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:ring-2 focus:ring-[#0A3D62] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleTechHide('hideTechSection3')}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                      effectiveTitles.hideTechSection3
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                    title={effectiveTitles.hideTechSection3 ? 'Mostrar sección en exportación' : 'Ocultar sección en exportación'}
                  >
                    {effectiveTitles.hideTechSection3 ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                        <span>Oculta</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Visible</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sección 4 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Sección 4 (Consideraciones & Seguridad):
                    </label>
                    <input
                      type="text"
                      value={effectiveTitles.techSection4}
                      onChange={(e) => handleUpdateTechTitle('techSection4', e.target.value)}
                      placeholder="4. CONSIDERACIONES TÉCNICAS Y DE SEGURIDAD"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:ring-2 focus:ring-[#0A3D62] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleTechHide('hideTechSection4')}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                      effectiveTitles.hideTechSection4
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                    title={effectiveTitles.hideTechSection4 ? 'Mostrar sección en exportación' : 'Ocultar sección en exportación'}
                  >
                    {effectiveTitles.hideTechSection4 ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                        <span>Oculta</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Visible</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sección 5 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Sección 5 (Código de Ejemplo / Scripts):
                    </label>
                    <input
                      type="text"
                      value={effectiveTitles.techSection5}
                      onChange={(e) => handleUpdateTechTitle('techSection5', e.target.value)}
                      placeholder="5. CÓDIGO DE EJEMPLO / SCRIPTS"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:ring-2 focus:ring-[#0A3D62] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleTechHide('hideTechSection5')}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                      effectiveTitles.hideTechSection5
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                    title={effectiveTitles.hideTechSection5 ? 'Mostrar sección en exportación' : 'Ocultar sección en exportación'}
                  >
                    {effectiveTitles.hideTechSection5 ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                        <span>Oculta</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Visible</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Personalización de Encabezados y Pie de Página Técnico */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#0A3D62]" />
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Encabezado (Header) y Pie de Página (Footer) Técnico:
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  Personaliza de manera independiente los textos mostrados en la barra superior y pie de página de esta especificación técnica (PDF y Word).
                </p>

                {/* Opción de Banner de Primera Página */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50/70 to-emerald-50/70 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#0A3D62]" />
                      <span className="text-xs font-bold text-slate-800">
                        Imagen / Banner de Encabezado en Primera Página
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Determina si se incluye la portada gráfica institucional superior en la primera página de la documentación técnica (Word y PDF).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleFirstPageBanner}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                      effectiveHF.includeFirstPageHeaderImage
                        ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {effectiveHF.includeFirstPageHeaderImage ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Incluir Banner</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sin Banner</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Marca / Etiqueta Header:
                    </label>
                    <input
                      type="text"
                      value={docData.techHeaderBrandTag ?? metadata.techHeaderBrandTag ?? ''}
                      onChange={(e) => handleUpdateTechHF('techHeaderBrandTag', e.target.value)}
                      placeholder={DEFAULT_TECHNICAL_HEADER_FOOTER.techHeaderBrandTag}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-[#0A3D62] outline-none"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Subtítulo Header:
                    </label>
                    <input
                      type="text"
                      value={docData.techHeaderSubtitle ?? metadata.techHeaderSubtitle ?? ''}
                      onChange={(e) => handleUpdateTechHF('techHeaderSubtitle', e.target.value)}
                      placeholder={DEFAULT_TECHNICAL_HEADER_FOOTER.techHeaderSubtitle}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-[#0A3D62] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Texto Derecho Header (ej. Ticket o Confidencial):
                    </label>
                    <input
                      type="text"
                      value={docData.techHeaderRightText ?? metadata.techHeaderRightText ?? ''}
                      onChange={(e) => handleUpdateTechHF('techHeaderRightText', e.target.value)}
                      placeholder="ej. TK-2026-089 (si está vacío, usa el Ticket No)"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-[#0A3D62] outline-none"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Pie de Página (Footer):
                    </label>
                    <input
                      type="text"
                      value={docData.techFooterText ?? metadata.techFooterText ?? ''}
                      onChange={(e) => handleUpdateTechHF('techFooterText', e.target.value)}
                      placeholder={DEFAULT_TECHNICAL_HEADER_FOOTER.techFooterText}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-[#0A3D62] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    const resetTitles: DocumentTitlesConfig = {
                      ...(metadata.customTitles || docData.customTitles || {}),
                      techMainTitle: DEFAULT_TECHNICAL_DOC_TITLES.techMainTitle,
                      techSection1: DEFAULT_TECHNICAL_DOC_TITLES.techSection1,
                      techSection2: DEFAULT_TECHNICAL_DOC_TITLES.techSection2,
                      techSection3: DEFAULT_TECHNICAL_DOC_TITLES.techSection3,
                      techSection4: DEFAULT_TECHNICAL_DOC_TITLES.techSection4,
                      techSection5: DEFAULT_TECHNICAL_DOC_TITLES.techSection5,
                      hideTechMainTitle: false,
                      hideTechSection1: false,
                      hideTechSection2: false,
                      hideTechSection3: false,
                      hideTechSection4: false,
                      hideTechSection5: false,
                    };
                    if (onMetadataChange) {
                      onMetadataChange({ ...metadata, customTitles: resetTitles });
                    }
                    onChange({
                      ...docData,
                      customTitles: resetTitles,
                      tituloDocumento: DEFAULT_TECHNICAL_DOC_TITLES.techMainTitle,
                      lastUpdated: new Date().toISOString(),
                    });
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Restablecer Predeterminados
                </button>

                <button
                  type="button"
                  onClick={() => setIsTitlesModalOpen(false)}
                  className="px-4 py-2 font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Rename Section Title */}
      {editingSectionKey && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0A3D62] text-white p-4 px-5 flex items-center justify-between border-b border-[#1E5F8A]">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#2ECC71]" />
                <h3 className="text-sm font-bold">Editar Título de Sección</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSectionKey(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Nuevo título para la sección:
                </label>
                <input
                  type="text"
                  value={tempSectionTitle}
                  onChange={(e) => setTempSectionTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#0A3D62] outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingSectionKey(null)}
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingSectionKey) {
                      handleUpdateTechTitle(editingSectionKey, tempSectionTitle);
                    }
                    setEditingSectionKey(null);
                  }}
                  className="px-4 py-2 font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Guardar Título
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
