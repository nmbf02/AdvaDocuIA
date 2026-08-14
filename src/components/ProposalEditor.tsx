import React, { useState } from 'react';
import { ProposalSection, MetadataHeader, UploadedImage } from '../types';
import { FileDown, Edit3, Eye, Plus, Trash2, Sparkles, Wand2, Loader2, Cpu, Save, Check, GitBranch, Tag, X, Layers, CheckCircle2 } from 'lucide-react';
import { generateAdvansysDocx } from '../utils/docxGenerator';
import { DocxPreview } from './DocxPreview';

interface ProposalEditorProps {
  proposal: ProposalSection;
  metadata: MetadataHeader;
  images: UploadedImage[];
  rawRequirements?: string;
  onChange: (updated: ProposalSection) => void;
  onSave?: () => void;
  onSaveNewVersion?: (versionTag: string, versionNote: string) => void;
  currentVersion?: string;
  lastSavedTime?: string | null;
  showSavedToast?: boolean;
}

export const ProposalEditor: React.FC<ProposalEditorProps> = ({
  proposal,
  metadata,
  images,
  rawRequirements = '',
  onChange,
  onSave,
  onSaveNewVersion,
  currentVersion = 'v1.0',
  lastSavedTime,
  showSavedToast
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refiningAction, setRefiningAction] = useState<string | null>(null);
  const [refiningSectionKey, setRefiningSectionKey] = useState<string | null>(null);

  // New Version Modal State
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState('v2.0');
  const [newVersionNote, setNewVersionNote] = useState('');

  // Field change helpers
  const handleStringChange = (field: keyof ProposalSection, value: string) => {
    onChange({
      ...proposal,
      [field]: value
    });
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

      onChange(data.proposal);
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
    const current = [...(proposal.alcanceExclusionesEntregables?.[subfield] || []), "Nuevo ítem..."];
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

  // Operative Step Helpers
  const handleStepChange = (index: number, field: 'titulo' | 'explicacion', val: string) => {
    const steps = [...(proposal.analisisOperativo || [])];
    steps[index] = { ...steps[index], [field]: val };
    const updatedIndex = steps.map(s => s.titulo);
    onChange({ ...proposal, analisisOperativo: steps, indiceAnalisisOperativo: updatedIndex });
  };

  const handleAddStep = () => {
    const currentSteps = proposal.analisisOperativo || [];
    const newStepNum = currentSteps.length + 1;
    const newStep = {
      paso: newStepNum,
      titulo: `Paso 7.${newStepNum}: Descripción del flujo`,
      explicacion: `Detalle técnico del paso ${newStepNum}...`,
      referenciaImagen: images[newStepNum - 1] ? `[IMAGEN_${newStepNum}]` : ''
    };
    const updatedSteps = [...currentSteps, newStep];
    const updatedIndex = updatedSteps.map(s => s.titulo);
    onChange({
      ...proposal,
      analisisOperativo: updatedSteps,
      indiceAnalisisOperativo: updatedIndex
    });
  };

  const handleRemoveStep = (index: number) => {
    const updatedSteps = (proposal.analisisOperativo || []).filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      paso: i + 1
    }));
    const updatedIndex = updatedSteps.map(s => s.titulo);
    onChange({
      ...proposal,
      analisisOperativo: updatedSteps,
      indiceAnalisisOperativo: updatedIndex
    });
  };

  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      const blob = await generateAdvansysDocx(metadata, proposal, images);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const cliente = (metadata.cliente || 'Cliente').trim();
      const ticketNo = (metadata.ticketNo || 'Ticket').trim();
      const nombreProyecto = (metadata.nombreProyecto || 'Proyecto').trim();

      // Format: Cliente - Ticket No. - Nombre del Proyecto
      let filename = `${cliente} - ${ticketNo} - ${nombreProyecto}`;
      // Sanitize forbidden file name characters for OS compatibility
      filename = filename.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ');

      a.download = `${filename}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al exportar documento .docx:", err);
      alert("Hubo un error generando el documento Word. Por favor intenta nuevamente.");
    } finally {
      setIsExporting(false);
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
            </h2>
            <p className="text-xs text-blue-100/80 truncate">Edita el texto, mira la previa o descarga el Word</p>
          </div>
        </div>

        {/* Action Controls & Export Button */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          
          {/* Save Changes Button */}
          {onSave && (
            <button
              onClick={onSave}
              type="button"
              className="inline-flex items-center justify-center p-2 sm:px-3.5 sm:py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all rounded-xl shadow-md border border-blue-400/50"
              title="Guardar borrador actual"
            >
              <Save className="w-3.5 h-3.5 sm:mr-1.5 text-blue-200" />
              <span className="hidden sm:inline">Guardar</span>
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
              <span className="hidden sm:inline">Nueva Versión</span>
            </button>
          )}

          {/* Saved Timestamp Badge */}
          {lastSavedTime && (
            <div className="hidden lg:flex items-center text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-medium">
              <Check className="w-3 h-3 mr-1 text-emerald-400" />
              <span>Guardado {lastSavedTime}</span>
            </div>
          )}

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
              <span className="hidden sm:inline">Editor</span>
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
              <span className="hidden sm:inline">Vista previa</span>
            </button>
          </div>

          <button
            onClick={handleExportDocx}
            disabled={isExporting}
            className="inline-flex items-center px-3 sm:px-4 py-2 text-xs font-bold text-slate-950 bg-[#2ECC71] hover:bg-[#27ae60] active:scale-95 transition-all rounded-xl shadow-md border border-emerald-400 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden xs:inline sm:inline">{isExporting ? 'Preparando Word...' : 'Descargar Word'}</span>
          </button>
        </div>
      </div>

      {/* AI Assistant Toolbar for Manual Editing */}
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

      {/* Section Quick Navigation Bar for Fast Editing without Infinite Scroll */}
      {activeTab === 'editor' && (
        <div className="relative bg-white/90 backdrop-blur-md p-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs min-w-0 sticky-bar">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-1.5 shrink-0 tracking-wider">Sección</span>
          {[
            { id: 'all', label: 'Ver Todo' },
            { id: 'resumen', label: '1. Resumen' },
            { id: 'beneficios', label: '2. Beneficios' },
            { id: 'alcance', label: '3. Alcance' },
            { id: 'objetivo', label: '4. Objetivo' },
            { id: 'descripcion', label: '5. Solución' },
            { id: 'operativo', label: '6-7. Pasos' },
            { id: 'descargo', label: '8. Descargo' }
          ].map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSectionFilter(sec.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all inline-flex items-center gap-1 ${
                activeSectionFilter === sec.id
                  ? 'bg-[#0A3D62] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sec.id === 'all' && <Layers className="w-3.5 h-3.5" />}
              {sec.label}
            </button>
          ))}
        </div>
      )}
      </div>

      {/* Main Container Content */}
      {activeTab === 'preview' ? (
        <div className="p-3 bg-slate-100/90 rounded-b-xl overflow-x-auto min-h-[400px] min-w-0">
          <DocxPreview metadata={metadata} proposal={proposal} images={images} />
        </div>
      ) : (
        <div className="p-3 space-y-6 min-h-[400px] min-w-0 max-w-full overflow-x-hidden">
          
          {/* Section 1: Resumen Ejecutivo */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'resumen') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-2 min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words">
                  1. Resumen Ejecutivo
                </label>
                <button
                  onClick={() => handleAIRefine('refine_section', 'resumenEjecutivo')}
                  disabled={isRefining}
                  className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 mr-1 text-[#2ECC71]" />
                  Mejorar con IA
                </button>
              </div>
              <textarea
                value={proposal.resumenEjecutivo}
                onChange={(e) => handleStringChange('resumenEjecutivo', e.target.value)}
                placeholder="Escribe el resumen ejecutivo de la propuesta..."
                rows={4}
                className="w-full min-w-0 max-w-full p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-800"
              />
            </div>
          )}

          {/* Section 2: Beneficios */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'beneficios') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-3 min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words">
                  2. Beneficios de la Propuesta
                </label>
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
                </div>
              </div>
              <div className="space-y-2">
                {(!proposal.beneficios || proposal.beneficios.length === 0) && (
                  <p className="text-xs text-slate-400 italic bg-white p-2.5 rounded border border-slate-200">
                    Sin beneficios agregados. Haz clic en "+ Añadir punto" para escribir un beneficio o usa "Sugerir Beneficios".
                  </p>
                )}
                {proposal.beneficios?.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-[#2ECC71] shrink-0">#{idx + 1}</span>
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => handleBeneficioChange(idx, e.target.value)}
                      className="flex-1 min-w-0 max-w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0A3D62] text-slate-800"
                    />
                    <button
                      onClick={() => handleRemoveBeneficio(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Alcance, Exclusiones y Entregables */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'alcance') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-4 min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words">
                  3. Alcance, Exclusiones y Entregables
                </label>
                <button
                  onClick={() => handleAIRefine('refine_section', 'alcanceExclusionesEntregables')}
                  disabled={isRefining}
                  className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 mr-1 text-[#2ECC71]" />
                  Refinar con IA
                </button>
              </div>

              {/* Sub-block Alcance */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 min-w-0">
                  <span className="text-xs font-bold text-[#1E5F8A]">3.1 Alcance Técnico:</span>
                  <button
                    onClick={() => handleAddScopeItem('alcance')}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    + Agregar punto
                  </button>
                </div>
                <div className="space-y-1.5">
                  {(!proposal.alcanceExclusionesEntregables?.alcance || proposal.alcanceExclusionesEntregables.alcance.length === 0) && (
                    <p className="text-[11px] text-slate-400 italic">Sin ítems de alcance. Presiona "+ Agregar punto" para redactar.</p>
                  )}
                  {proposal.alcanceExclusionesEntregables?.alcance?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 min-w-0">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleScopeListChange('alcance', idx, e.target.value)}
                        className="flex-1 min-w-0 max-w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800"
                      />
                      <button onClick={() => handleRemoveScopeItem('alcance', idx)} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-block Exclusiones */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 min-w-0">
                  <span className="text-xs font-bold text-slate-700">3.2 Exclusiones (Fuera de Alcance):</span>
                  <button
                    onClick={() => handleAddScopeItem('exclusiones')}
                    className="text-[11px] font-semibold text-[#0A3D62] hover:underline"
                  >
                    + Agregar exclusión
                  </button>
                </div>
                <div className="space-y-1.5">
                  {(!proposal.alcanceExclusionesEntregables?.exclusiones || proposal.alcanceExclusionesEntregables.exclusiones.length === 0) && (
                    <p className="text-[11px] text-slate-400 italic">Sin exclusiones registradas. Presiona "+ Agregar exclusión".</p>
                  )}
                  {proposal.alcanceExclusionesEntregables?.exclusiones?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 min-w-0">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleScopeListChange('exclusiones', idx, e.target.value)}
                        className="flex-1 min-w-0 max-w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800"
                      />
                      <button onClick={() => handleRemoveScopeItem('exclusiones', idx)} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-block Entregables */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 min-w-0">
                  <span className="text-xs font-bold text-emerald-700">3.3 Entregables Formales:</span>
                  <button
                    onClick={() => handleAddScopeItem('entregables')}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    + Agregar entregable
                  </button>
                </div>
                <div className="space-y-1.5">
                  {(!proposal.alcanceExclusionesEntregables?.entregables || proposal.alcanceExclusionesEntregables.entregables.length === 0) && (
                    <p className="text-[11px] text-slate-400 italic">Sin entregables registrados. Presiona "+ Agregar entregable".</p>
                  )}
                  {proposal.alcanceExclusionesEntregables?.entregables?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 min-w-0">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleScopeListChange('entregables', idx, e.target.value)}
                        className="flex-1 min-w-0 max-w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800"
                      />
                      <button onClick={() => handleRemoveScopeItem('entregables', idx)} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Section 4: Objetivo */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'objetivo') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-2 min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words">
                  4. Objetivo del Proyecto
                </label>
                <button
                  onClick={() => handleAIRefine('refine_section', 'objetivo')}
                  disabled={isRefining}
                  className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 mr-1 text-[#2ECC71]" />
                  Mejorar con IA
                </button>
              </div>
              <textarea
                value={proposal.objetivo}
                onChange={(e) => handleStringChange('objetivo', e.target.value)}
                placeholder="Describa el objetivo general y específico..."
                rows={3}
                className="w-full min-w-0 max-w-full p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-800"
              />
            </div>
          )}

          {/* Section 5: Descripción */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'descripcion') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-2 min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words">
                  5. Descripción de la Solución Propuesta
                </label>
                <button
                  onClick={() => handleAIRefine('refine_section', 'descripcion')}
                  disabled={isRefining}
                  className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 mr-1 text-[#2ECC71]" />
                  Mejorar con IA
                </button>
              </div>
              <textarea
                value={proposal.descripcion}
                onChange={(e) => handleStringChange('descripcion', e.target.value)}
                placeholder="Escriba el detalle de la solución arquitectónica propuesta..."
                rows={4}
                className="w-full min-w-0 max-w-full p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-800"
              />
            </div>
          )}

          {/* Section 6 & 7: Análisis Operativo */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'operativo') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-4 min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-col justify-between border-b border-slate-200 pb-2 gap-2 min-w-0">
                <div>
                  <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words">
                    6 & 7. Análisis Operativo y Flujo Paso a Paso
                  </label>
                  <p className="text-xs text-slate-500">
                    {proposal.analisisOperativo?.length || 0} Pasos registrados
                  </p>
                </div>

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
                    onClick={handleAddStep}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Añadir Paso Manual
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {proposal.analisisOperativo?.map((step, idx) => {
                  const linkedImg = images[idx];
                  return (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 relative group min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs font-bold text-[#0A3D62] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                            Paso 7.{idx + 1}
                          </span>
                          {linkedImg && (
                            <span className="text-[11px] text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center min-w-0 max-w-full">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                              <span className="truncate">[IMAGEN_{idx + 1}]: {linkedImg.title}</span>
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveStep(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar paso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Explicación Técnica Detallada:</label>
                        <textarea
                          value={step.explicacion}
                          onChange={(e) => handleStepChange(idx, 'explicacion', e.target.value)}
                          placeholder="Detalle los procedimientos, llamadas a API o reglas de negocio..."
                          rows={3}
                          className="w-full min-w-0 max-w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 8: Descargo */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'descargo') && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-2 min-w-0 max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                <label className="block text-sm font-bold text-[#0A3D62] uppercase tracking-wide min-w-0 break-words">
                  8. Descargo (Cláusula Estándar Advansys)
                </label>
                <button
                  onClick={() => handleAIRefine('refine_section', 'descargo')}
                  disabled={isRefining}
                  className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 mr-1 text-[#2ECC71]" />
                  Refinar Cláusula
                </button>
              </div>
              <textarea
                value={proposal.descargo}
                onChange={(e) => handleStringChange('descargo', e.target.value)}
                rows={3}
                className="w-full min-w-0 max-w-full p-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-700 italic"
              />
            </div>
          )}

        </div>
      )}

      {/* Floating Quick Save Bar */}
      {onSave && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700/80 transition-all hover:scale-105">
          <button
            type="button"
            onClick={onSave}
            className="flex items-center space-x-2 text-xs font-bold text-white hover:text-[#2ECC71] transition-colors"
          >
            <Save className="w-4 h-4 text-[#2ECC71]" />
            <span>Guardar Cambios</span>
          </button>
          {lastSavedTime && (
            <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">
              {lastSavedTime}
            </span>
          )}
        </div>
      )}

      {/* Toast Confirmation */}
      {showSavedToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#2ECC71] text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 border border-emerald-400 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>¡Cambios guardados con éxito!</span>
        </div>
      )}

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

