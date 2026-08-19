import React, { useState } from 'react';
import {
  MetadataHeader,
  ProposalSection,
  TechnicalDoc,
  UploadedImage,
  SavedProposal,
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
} from 'lucide-react';
import { createDefaultTechnicalDoc } from '../utils/technicalDocTemplates';
import { generateTechnicalDocDocx } from '../utils/technicalDocDocxGenerator';
import { downloadTechnicalDocPdf } from '../utils/technicalDocPdfGenerator';
import { TextFormattingToolbar, handleAutoBulletKeyDown } from './TextFormattingToolbar';

interface TechnicalDocEditorProps {
  technicalDoc?: TechnicalDoc;
  metadata: MetadataHeader;
  proposal?: ProposalSection | null;
  images: UploadedImage[];
  rawRequirements?: string;
  history?: SavedProposal[];
  onChange: (updated: TechnicalDoc) => void;
  onSave?: () => void;
  onMetadataChange?: (updatedMetadata: MetadataHeader) => void;
  onLinkProposal?: (proposal: SavedProposal, syncContext: boolean) => void;
  onUnlinkProposal?: () => void;
}

export const TechnicalDocEditor: React.FC<TechnicalDocEditorProps> = ({
  technicalDoc,
  metadata,
  proposal,
  images,
  rawRequirements = '',
  history = [],
  onChange,
  onSave,
  onMetadataChange,
  onLinkProposal,
  onUnlinkProposal,
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

  const rutaRef = React.useRef<HTMLTextAreaElement>(null);
  const flujoRef = React.useRef<HTMLTextAreaElement>(null);
  const disenoRef = React.useRef<HTMLTextAreaElement>(null);
  const consRef = React.useRef<HTMLTextAreaElement>(null);

  const handleFieldChange = (field: keyof TechnicalDoc, value: any) => {
    onChange({
      ...docData,
      [field]: value,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleGenerateWithAI = async () => {
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
      if (data.success && data.technicalDoc) {
        onChange({
          ...data.technicalDoc,
          linkedProposalId: docData.linkedProposalId,
          linkedProposalName: docData.linkedProposalName,
        });
      } else {
        throw new Error(data.error || 'No se pudo generar la documentación técnica.');
      }
    } catch (err: any) {
      console.error('Error in AI Technical Doc generation:', err);
      alert('Error al generar la documentación técnica: ' + (err.message || 'Error de conexión'));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleExportDocx = async () => {
    setIsExporting('docx');
    try {
      const blob = await generateTechnicalDocDocx(metadata, docData);
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
      await downloadTechnicalDocPdf(metadata, docData);
    } catch (err) {
      console.error('Error generating pdf:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleCopyMarkdown = () => {
    const md = `# DOCUMENTACIÓN TÉCNICA INTERNA Y ESPECIFICACIÓN DE DESARROLLO
**Cliente:** ${metadata.cliente || 'N/A'}
**Fecha:** ${metadata.fecha || new Date().toISOString().split('T')[0]}
**Ticket:** ${metadata.ticketNo || 'N/A'}
**Módulo:** ${metadata.moduloAplicacion || 'N/A'}
**Proyecto:** ${metadata.nombreProyecto || 'N/A'}
${docData.linkedProposalName ? `**Propuesta Vinculada:** ${docData.linkedProposalName}\n` : ''}

---

## 1. RUTA DE ACCESO & NAVEGACIÓN EN EL SISTEMA
${docData.ruta}

---

## 2. FLUJO OPERATIVO INTERNO
${docData.flujoOperativo}

---

## 3. DISEÑO DE INTERFAZ Y ESTRUCTURA DE DATOS
${docData.diseno}

---

## 4. CONSIDERACIONES TÉCNICAS Y DE SEGURIDAD
${docData.consideracionesTecnicas}

---

## 5. CÓDIGO DE EJEMPLO / SCRIPTS
\`\`\`sql
${docData.codigoEjemplo || '-- Sin código especificado'}
\`\`\`
`;

    navigator.clipboard.writeText(md);
    setCopiedSection('all');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleSelectProposalToLink = (selectedItem: SavedProposal) => {
    if (onLinkProposal) {
      onLinkProposal(selectedItem, syncContextOnLink);
    } else {
      // Direct local update
      const updatedMeta: MetadataHeader = {
        ...metadata,
        cliente: selectedItem.metadata.cliente || metadata.cliente,
        ticketNo: selectedItem.metadata.ticketNo || metadata.ticketNo,
        nombreProyecto: selectedItem.metadata.nombreProyecto || metadata.nombreProyecto,
        moduloAplicacion: selectedItem.metadata.moduloAplicacion || metadata.moduloAplicacion,
      };
      if (onMetadataChange) {
        onMetadataChange(updatedMeta);
      }

      let updatedDoc: TechnicalDoc = {
        ...docData,
        linkedProposalId: selectedItem.id,
        linkedProposalName: `${selectedItem.metadata.ticketNo ? `[${selectedItem.metadata.ticketNo}] ` : ''}${selectedItem.metadata.nombreProyecto || 'Propuesta'} (${selectedItem.version || 'v1.0'})`,
        lastUpdated: new Date().toISOString(),
      };

      if (syncContextOnLink && selectedItem.content) {
        const defaultWithContext = createDefaultTechnicalDoc(updatedMeta, selectedItem.content);
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
    const q = proposalSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const cl = (p.metadata.cliente || '').toLowerCase();
    const pr = (p.metadata.nombreProyecto || '').toLowerCase();
    const tk = (p.metadata.ticketNo || '').toLowerCase();
    const md = (p.metadata.moduloAplicacion || '').toLowerCase();
    return cl.includes(q) || pr.includes(q) || tk.includes(q) || md.includes(q);
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Top Banner Toolbar */}
      <div className="bg-gradient-to-r from-[#0A3D62] via-[#0D4B75] to-[#1E5F8A] p-4 text-white flex flex-wrap items-center justify-between gap-3 border-b border-blue-900/40">
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
            <Terminal className="w-5 h-5 text-[#2ECC71]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
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
              Especificación desacoplada para arquitectura, rutas, flujos, diseño y código.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* AI Generator Button */}
          <button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={isGeneratingAI}
            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-slate-950 bg-[#2ECC71] hover:bg-[#27ae60] active:scale-95 transition-all rounded-xl shadow-md disabled:opacity-50"
            title="Generar o sincronizar la documentación técnica desde los requerimientos y la propuesta"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-slate-950" />
                <span>Generando con IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-slate-950" />
                <span>Sincronizar con IA</span>
              </>
            )}
          </button>

          {/* Copy Markdown */}
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl border border-white/20"
            title="Copiar especificación técnica en Markdown para Jira, GitHub o DevOps"
          >
            {copiedSection === 'all' ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-[#2ECC71]" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                <span>Copiar MD</span>
              </>
            )}
          </button>

          {/* Export Word */}
          <button
            type="button"
            onClick={handleExportDocx}
            disabled={isExporting !== null}
            className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 active:scale-95 transition-all rounded-xl border border-white/20 disabled:opacity-50"
            title="Descargar documento Word (.docx) técnico"
          >
            <FileDown className="w-3.5 h-3.5 mr-1 text-blue-200" />
            <span>Word</span>
          </button>

          {/* Export PDF */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting !== null}
            className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 active:scale-95 transition-all rounded-xl border border-white/20 disabled:opacity-50"
            title="Descargar documento PDF técnico"
          >
            <FileDown className="w-3.5 h-3.5 mr-1 text-blue-200" />
            <span>PDF</span>
          </button>

          {/* Save Button */}
          {onSave && (
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
      </div>

      {/* Linking & Project Context Pill Banner */}
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">

        {/* 1. RUTA */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A3D62]">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  1. Ruta de Acceso & Navegación en el Sistema
                </h3>
                <p className="text-[11px] text-slate-500">
                  Ruta de menú, pantallas/formularios, vistas, microservicios y endpoints API involucrados.
                </p>
              </div>
            </div>
          </div>

          <TextFormattingToolbar
            textareaRef={rutaRef}
            value={docData.ruta}
            onChange={(v) => handleFieldChange('ruta', v)}
            showTableButton={false}
          />
          <textarea
            id="techdoc-ruta"
            ref={rutaRef}
            rows={4}
            value={docData.ruta}
            onChange={(e) => handleFieldChange('ruta', e.target.value)}
            onKeyDown={(e) => handleAutoBulletKeyDown(e, docData.ruta, (v) => handleFieldChange('ruta', v))}
            placeholder="Ejemplo: Menú Principal > Operaciones > Facturación > frm_gestion_cobros.aspx"
            className="w-full text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:border-[#0A3D62] focus:ring-1 focus:ring-[#0A3D62] outline-none transition-all resize-y leading-relaxed font-mono"
          />
        </div>

        {/* 2. FLUJO OPERATIVO */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Workflow className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  2. Flujo Operativo Interno
                </h3>
                <p className="text-[11px] text-slate-500">
                  Secuencia técnica detallada (Eventos de UI, validaciones, servicios backend, persistencia y respuestas).
                </p>
              </div>
            </div>
          </div>

          <TextFormattingToolbar
            textareaRef={flujoRef}
            value={docData.flujoOperativo}
            onChange={(v) => handleFieldChange('flujoOperativo', v)}
            showTableButton={false}
          />
          <textarea
            id="techdoc-flujo"
            ref={flujoRef}
            rows={6}
            value={docData.flujoOperativo}
            onChange={(e) => handleFieldChange('flujoOperativo', e.target.value)}
            onKeyDown={(e) => handleAutoBulletKeyDown(e, docData.flujoOperativo, (v) => handleFieldChange('flujoOperativo', v))}
            placeholder="1. Evento Disparador: El usuario presiona el botón...\n2. Validación Frontend...\n3. Procesamiento Backend..."
            className="w-full text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:border-[#0A3D62] focus:ring-1 focus:ring-[#0A3D62] outline-none transition-all resize-y leading-relaxed"
          />
        </div>

        {/* 3. DISEÑO */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Layout className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  3. Diseño de Interfaz y Estructura de Datos
                </h3>
                <p className="text-[11px] text-slate-500">
                  Componentes visuales, diseño técnico y entidades/tablas de base de datos (cabeceras, detalles, llaves foráneas).
                </p>
              </div>
            </div>
          </div>

          <TextFormattingToolbar
            textareaRef={disenoRef}
            value={docData.diseno}
            onChange={(v) => handleFieldChange('diseno', v)}
            showTableButton={false}
          />
          <textarea
            id="techdoc-diseno"
            ref={disenoRef}
            rows={5}
            value={docData.diseno}
            onChange={(e) => handleFieldChange('diseno', e.target.value)}
            onKeyDown={(e) => handleAutoBulletKeyDown(e, docData.diseno, (v) => handleFieldChange('diseno', v))}
            placeholder="• Componentes Visuales: Formulario modal con grilla...\n• Tablas de BD: TBL_CLIENTE_CUENTAS (Id, ClienteId, Saldo, Estado)..."
            className="w-full text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:border-[#0A3D62] focus:ring-1 focus:ring-[#0A3D62] outline-none transition-all resize-y leading-relaxed"
          />
        </div>

        {/* 4. CONSIDERACIONES TÉCNICAS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  4. Consideraciones Técnicas y de Seguridad
                </h3>
                <p className="text-[11px] text-slate-500">
                  Transaccionalidad (ACID), concurrencia, permisos/roles de usuario, validaciones críticas, auditoría y rendimiento.
                </p>
              </div>
            </div>
          </div>

          <TextFormattingToolbar
            textareaRef={consRef}
            value={docData.consideracionesTecnicas}
            onChange={(v) => handleFieldChange('consideracionesTecnicas', v)}
            showTableButton={false}
          />
          <textarea
            id="techdoc-cons"
            ref={consRef}
            rows={5}
            value={docData.consideracionesTecnicas}
            onChange={(e) => handleFieldChange('consideracionesTecnicas', e.target.value)}
            onKeyDown={(e) => handleAutoBulletKeyDown(e, docData.consideracionesTecnicas, (v) => handleFieldChange('consideracionesTecnicas', v))}
            placeholder="• Seguridad: Requiere rol SUPERVISOR_OPERACIONES...\n• Transacciones: Ejecutar dentro de BEGIN TRANSACTION...\n• Auditoría: Registrar usuario e IP en TBL_LOG..."
            className="w-full text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:border-[#0A3D62] focus:ring-1 focus:ring-[#0A3D62] outline-none transition-all resize-y leading-relaxed"
          />
        </div>

        {/* 5. CÓDIGO DE EJEMPLO */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-md space-y-3 text-slate-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[#2ECC71]">
                <Code className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  5. Código de Ejemplo / Scripts (si aplica)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Scripts SQL (CREATE TABLE, SELECT), payloads JSON de endpoints o pseudocódigo para desarrollo.
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(docData.codigoEjemplo || '');
                setCopiedSection('code');
                setTimeout(() => setCopiedSection(null), 2000);
              }}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
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
                  <strong>Sincronizar contexto y pasos operativos:</strong> Generar sugerencias de flujos y tablas a partir del contenido de la propuesta seleccionada.
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
                  <label className="block font-bold text-slate-800 mb-1">Ticket No:</label>
                  <input
                    type="text"
                    value={tempMeta.ticketNo}
                    onChange={(e) => setTempMeta({ ...tempMeta, ticketNo: e.target.value })}
                    placeholder="ej. TK-2026-089"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-[#0A3D62] outline-none"
                  />
                </div>
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

    </div>
  );
};
