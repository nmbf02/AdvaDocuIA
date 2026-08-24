import React, { useState } from 'react';
import { 
  FilePlus, 
  Save, 
  Trash2, 
  X, 
  FileText, 
  Terminal, 
  Presentation, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { MetadataHeader, ProposalSection, UploadedImage } from '../types';

export type NewDocumentType = 'proposal' | 'technical' | 'slides';

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmNew: (documentType: NewDocumentType, shouldSaveCurrent: boolean) => void;
  hasSubstance: boolean;
  currentProjectName?: string;
  currentClient?: string;
  currentTicket?: string;
  currentDocumentKind: 'proposal' | 'technical' | 'slides';
  currentVersion?: string;
}

export const NewDocumentModal: React.FC<NewDocumentModalProps> = ({
  isOpen,
  onClose,
  onConfirmNew,
  hasSubstance,
  currentProjectName,
  currentClient,
  currentTicket,
  currentDocumentKind,
  currentVersion = 'v1.0',
}) => {
  const [selectedType, setSelectedType] = useState<NewDocumentType>('proposal');

  if (!isOpen) return null;

  const currentDocLabel = 
    currentDocumentKind === 'technical' 
      ? 'Especificación Técnica Interna' 
      : currentDocumentKind === 'slides' 
        ? 'Presentación de Diapositivas' 
        : 'Propuesta Técnica';

  const projectNameDisplay = currentProjectName?.trim() || currentTicket?.trim() || 'Documento sin título';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0A3D62] text-white p-4 px-6 flex items-center justify-between border-b border-[#1E5F8A]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <FilePlus className="w-4 h-4 text-[#2ECC71]" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Crear Nuevo Documento</h2>
              <p className="text-xs text-blue-200/80">Inicia un nuevo espacio de trabajo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Warning / Prompt if current document has unsaved or active work */}
          {hasSubstance ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-amber-950">
                    ¿Deseas guardar el documento actual antes de empezar uno nuevo?
                  </h3>
                  <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                    Tienes un documento activo en edición. Puedes guardarlo en el historial para conservar tu trabajo o descartarlo y empezar con un lienzo limpio.
                  </p>
                </div>
              </div>

              {/* Current Document Summary Card */}
              <div className="bg-white/80 border border-amber-200/80 rounded-lg p-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900 block truncate">{projectNameDisplay}</span>
                  <span className="text-[11px] text-slate-500">
                    {currentDocLabel} • {currentClient ? `Cliente: ${currentClient}` : 'Sin cliente'} • {currentVersion}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/70 text-amber-900 shrink-0">
                  En edición
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
              <Info className="w-5 h-5 text-[#0A3D62] shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900 leading-relaxed">
                Selecciona el tipo de documento institucional que deseas comenzar a redactar:
              </p>
            </div>
          )}

          {/* Type of Document Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Selecciona el Tipo de Nuevo Documento
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Option A: Propuesta Técnica */}
              <button
                type="button"
                onClick={() => setSelectedType('proposal')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  selectedType === 'proposal'
                    ? 'border-[#0A3D62] bg-blue-50/70 ring-2 ring-[#0A3D62]/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-[#0A3D62]">
                    <FileText className="w-4 h-4" />
                  </div>
                  {selectedType === 'proposal' && (
                    <span className="w-2 h-2 rounded-full bg-[#0A3D62]" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Propuesta Técnica</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    8 Secciones completas para clientes comerciales
                  </p>
                </div>
              </button>

              {/* Option B: Doc. Técnica */}
              <button
                type="button"
                onClick={() => setSelectedType('technical')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  selectedType === 'technical'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <Terminal className="w-4 h-4" />
                  </div>
                  {selectedType === 'technical' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Doc. Técnica</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    5 Secciones internas para desarrolladores
                  </p>
                </div>
              </button>

              {/* Option C: Diapositivas */}
              <button
                type="button"
                onClick={() => setSelectedType('slides')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  selectedType === 'slides'
                    ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-600/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                    <Presentation className="w-4 h-4" />
                  </div>
                  {selectedType === 'slides' && (
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Presentación</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Diapositivas y pitch deck para reuniones
                  </p>
                </div>
              </button>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {hasSubstance ? (
              <>
                <button
                  type="button"
                  onClick={() => onConfirmNew(selectedType, false)}
                  className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Descarta los cambios del documento actual y crea uno nuevo en blanco"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Descartar y Crear</span>
                </button>

                <button
                  type="button"
                  onClick={() => onConfirmNew(selectedType, true)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-950 bg-[#2ECC71] hover:bg-[#27ae60] hover:text-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title="Guarda el documento actual en el historial y comienza el nuevo documento"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar y Crear Nuevo</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onConfirmNew(selectedType, false)}
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Crear Documento</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
