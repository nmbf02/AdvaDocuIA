import React, { useState } from 'react';
import { SavedProposal } from '../types';
import { X, Calendar, Building2, FileText, Trash2, ArrowRight, Copy, GitBranch, Search, Check, Tag } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: SavedProposal[];
  onSelectProposal: (proposal: SavedProposal) => void;
  onDeleteProposal: (id: string) => void;
  onDuplicateProposal?: (proposal: SavedProposal) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  proposals,
  onSelectProposal,
  onDeleteProposal,
  onDuplicateProposal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter proposals
  const filteredProposals = proposals.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.metadata.cliente || '').toLowerCase().includes(q) ||
      (p.metadata.nombreProyecto || '').toLowerCase().includes(q) ||
      (p.metadata.ticketNo || '').toLowerCase().includes(q) ||
      (p.version || '').toLowerCase().includes(q) ||
      (p.versionNote || '').toLowerCase().includes(q)
    );
  });

  // Copy proposal contents to clipboard
  const handleCopyTextToClipboard = (item: SavedProposal) => {
    const c = item.content;
    const textToCopy = `=== ${item.metadata.nombreProyecto || 'Propuesta'} [${item.version || 'v1.0'}] ===
Cliente: ${item.metadata.cliente || 'N/A'}
Ticket: ${item.metadata.ticketNo || 'N/A'} | Fecha: ${item.metadata.fecha || ''}

1. RESUMEN EJECUTIVO:
${c.resumenEjecutivo || 'N/A'}

2. BENEFICIOS CLAVE:
${c.beneficios?.map((b) => `- ${b}`).join('\n') || 'N/A'}

3. ALCANCE TÉCNICO:
${c.alcanceExclusionesEntregables?.alcance?.map((a) => `- ${a}`).join('\n') || 'N/A'}

EXCLUSIONES:
${c.alcanceExclusionesEntregables?.exclusiones?.map((e) => `- ${e}`).join('\n') || 'N/A'}

ENTREGABLES:
${c.alcanceExclusionesEntregables?.entregables?.map((e) => `- ${e}`).join('\n') || 'N/A'}

4. OBJETIVO:
${c.objetivo || 'N/A'}

5. DESCRIPCIÓN:
${c.descripcion || 'N/A'}

6. ANÁLISIS OPERATIVO:
${c.analisisOperativo?.map((s, i) => `Paso ${i + 1}: ${s.titulo}\n${s.explicacion}`).join('\n\n') || 'N/A'}
`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="bg-[#0A3D62] text-white p-4 px-6 flex items-center justify-between border-b border-[#1E5F8A]">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-[#2ECC71]" />
            <div>
              <h2 className="text-base font-bold">Historial de Versiones y Propuestas</h2>
              <p className="text-[11px] text-blue-200">
                Gestiona versiones (v1, v2...), duplica análisis alternativos y copia contenidos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        {proposals.length > 0 && (
          <div className="p-3 px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente, proyecto, versión o ticket..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-800"
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 shrink-0">
              {filteredProposals.length} de {proposals.length} versión(es)
            </span>
          </div>
        )}

        {/* Modal Content List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {proposals.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#0A3D62]" />
              <p className="text-sm font-semibold text-slate-600">No hay documentos guardados en el historial local.</p>
              <p className="text-xs text-slate-400 mt-1">
                Genera o guarda tu primera propuesta técnica para respaldarla automáticamente.
              </p>
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold text-slate-600">No se encontraron versiones que coincidan con la búsqueda.</p>
            </div>
          ) : (
            filteredProposals.map((item) => {
              const versionLabel = item.version || 'v1.0';
              return (
                <div
                  key={item.id}
                  className="bg-slate-50 hover:bg-blue-50/50 p-4 rounded-xl border border-slate-200 hover:border-[#0A3D62] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      {/* Version Badge */}
                      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-bold bg-[#2ECC71] text-slate-950 rounded-full border border-emerald-500/40 shadow-xs">
                        <Tag className="w-3 h-3 mr-1 text-slate-900" />
                        {versionLabel}
                      </span>

                      {/* Ticket Badge */}
                      <span className="text-xs font-bold px-2 py-0.5 bg-[#0A3D62] text-white rounded">
                        {item.metadata.ticketNo || item.metadata.propuestaNo || 'S/N'}
                      </span>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0A3D62] truncate">
                        {item.metadata.nombreProyecto || 'Proyecto sin título'}
                      </h3>
                    </div>

                    {/* Version Note if exists */}
                    {item.versionNote && (
                      <p className="text-xs text-slate-600 italic bg-white px-2.5 py-1 rounded border border-slate-200">
                        💬 Nota de versión: {item.versionNote}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center text-xs text-slate-500 gap-x-4 gap-y-1">
                      <span className="flex items-center">
                        <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {item.metadata.cliente || 'Sin Cliente'}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {new Date(item.timestamp).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                    
                    {/* Load into Editor */}
                    <button
                      onClick={() => {
                        onSelectProposal(item);
                        onClose();
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-lg transition-colors shadow-xs"
                      title="Cargar esta versión en el editor"
                    >
                      <span>Cargar</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>

                    {/* Duplicate / Copy Version */}
                    {onDuplicateProposal && (
                      <button
                        onClick={() => {
                          onDuplicateProposal(item);
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded-lg transition-colors shadow-xs"
                        title="Duplicar y crear una versión nueva derivada de esta"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1 text-purple-700" />
                        <span>Duplicar Versión</span>
                      </button>
                    )}

                    {/* Copy Text to Clipboard */}
                    <button
                      onClick={() => handleCopyTextToClipboard(item)}
                      className={`inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-xs ${
                        copiedId === item.id
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                      }`}
                      title="Copiar texto formateado de esta versión al portapapeles"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          <span>Copiar Texto</span>
                        </>
                      )}
                    </button>

                    {/* Delete item */}
                    <button
                      onClick={() => onDeleteProposal(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar esta versión"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            💡 Puedes mantener múltiples versiones (ej. v1 para Vía API, v2 para Vía Webhook) de un mismo ticket.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-sm"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

