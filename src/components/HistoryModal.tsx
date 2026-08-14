import React, { useMemo, useState } from 'react';
import { SavedProposal } from '../types';
import { X, Calendar, Building2, FileText, Trash2, ArrowRight, Copy, GitBranch, Search, Check, Tag, Sparkles, Filter, RotateCcw } from 'lucide-react';

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
  const [filterCliente, setFilterCliente] = useState('all');
  const [filterTicket, setFilterTicket] = useState('all');
  const [filterVersion, setFilterVersion] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | '7d' | '30d' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'client' | 'project'>('newest');

  const uniqueClientes = useMemo(() => {
    const set = new Set<string>();
    proposals.forEach((p) => {
      const v = (p.metadata.cliente || '').trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [proposals]);

  const uniqueTickets = useMemo(() => {
    const set = new Set<string>();
    proposals.forEach((p) => {
      const v = (p.metadata.ticketNo || p.metadata.propuestaNo || '').trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [proposals]);

  const uniqueVersions = useMemo(() => {
    const set = new Set<string>();
    proposals.forEach((p) => {
      const v = (p.version || 'v1.0').trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [proposals]);

  const hasActiveFilters =
    filterCliente !== 'all' ||
    filterTicket !== 'all' ||
    filterVersion !== 'all' ||
    filterPeriod !== 'all' ||
    sortBy !== 'newest' ||
    searchQuery.trim() !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCliente('all');
    setFilterTicket('all');
    setFilterVersion('all');
    setFilterPeriod('all');
    setSortBy('newest');
  };

  if (!isOpen) return null;

  const matchesPeriod = (timestamp: string) => {
    if (filterPeriod === 'all') return true;
    const t = new Date(timestamp).getTime();
    if (Number.isNaN(t)) return false;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (filterPeriod === 'today') return t >= startOfToday;
    if (filterPeriod === '7d') return t >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
    if (filterPeriod === '30d') return t >= now.getTime() - 30 * 24 * 60 * 60 * 1000;
    if (filterPeriod === 'month') {
      return (
        new Date(timestamp).getFullYear() === now.getFullYear() &&
        new Date(timestamp).getMonth() === now.getMonth()
      );
    }
    return true;
  };

  const filteredProposals = proposals
    .filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const ticketKey = (p.metadata.ticketNo || p.metadata.propuestaNo || '').trim();
      const versionKey = (p.version || 'v1.0').trim();
      const clienteKey = (p.metadata.cliente || '').trim();

      if (filterCliente !== 'all' && clienteKey !== filterCliente) return false;
      if (filterTicket !== 'all' && ticketKey !== filterTicket) return false;
      if (filterVersion !== 'all' && versionKey !== filterVersion) return false;
      if (!matchesPeriod(p.timestamp)) return false;

      if (!q) return true;
      return (
        clienteKey.toLowerCase().includes(q) ||
        (p.metadata.nombreProyecto || '').toLowerCase().includes(q) ||
        (p.metadata.ticketNo || '').toLowerCase().includes(q) ||
        (p.metadata.propuestaNo || '').toLowerCase().includes(q) ||
        (p.metadata.moduloAplicacion || '').toLowerCase().includes(q) ||
        versionKey.toLowerCase().includes(q) ||
        (p.versionNote || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortBy === 'client') {
        return (a.metadata.cliente || '').localeCompare(b.metadata.cliente || '', 'es');
      }
      if (sortBy === 'project') {
        return (a.metadata.nombreProyecto || '').localeCompare(b.metadata.nombreProyecto || '', 'es');
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
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
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[88vh] max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="bg-[#0A3D62] text-white p-4 px-4 sm:px-6 flex items-center justify-between border-b border-[#1E5F8A] shrink-0">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-[#2ECC71]" />
            <div>
              <h2 className="text-base font-bold">Historial</h2>
              <p className="text-[11px] text-blue-200">
                Busca, filtra y vuelve a abrir documentos guardados
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

        {/* Search + Filters — always visible, never collapsed */}
        <div className="shrink-0 p-3 px-4 sm:px-6 bg-slate-100 border-b border-slate-300 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente, proyecto, versión o ticket..."
                className="w-full min-w-0 pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#0A3D62] bg-white hover:bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
              <span className="text-xs font-semibold text-slate-600">
                {filteredProposals.length} de {proposals.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0A3D62] uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5" />
            Filtros
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 min-w-0">
            <label className="min-w-0">
              <span className="block text-[10px] font-bold text-[#0A3D62] mb-1">Cliente</span>
              <select
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="w-full min-w-0 px-2 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
              >
                <option value="all">Todos</option>
                {uniqueClientes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="min-w-0">
              <span className="block text-[10px] font-bold text-[#0A3D62] mb-1">Ticket / Propuesta</span>
              <select
                value={filterTicket}
                onChange={(e) => setFilterTicket(e.target.value)}
                className="w-full min-w-0 px-2 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
              >
                <option value="all">Todos</option>
                {uniqueTickets.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <label className="min-w-0">
              <span className="block text-[10px] font-bold text-[#0A3D62] mb-1">Versión</span>
              <select
                value={filterVersion}
                onChange={(e) => setFilterVersion(e.target.value)}
                className="w-full min-w-0 px-2 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
              >
                <option value="all">Todas</option>
                {uniqueVersions.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>

            <label className="min-w-0">
              <span className="block text-[10px] font-bold text-[#0A3D62] mb-1">Periodo</span>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as typeof filterPeriod)}
                className="w-full min-w-0 px-2 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
              >
                <option value="all">Cualquier fecha</option>
                <option value="today">Hoy</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="month">Este mes</option>
              </select>
            </label>

            <label className="min-w-0 col-span-2 md:col-span-1">
              <span className="block text-[10px] font-bold text-[#0A3D62] mb-1">Ordenar</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full min-w-0 px-2 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
              >
                <option value="newest">Más reciente</option>
                <option value="oldest">Más antiguo</option>
                <option value="client">Cliente A-Z</option>
                <option value="project">Proyecto A-Z</option>
              </select>
            </label>
          </div>
        </div>

        {/* Modal Content List */}
        <div className="p-4 sm:p-6 overflow-y-auto min-h-0 flex-1 space-y-3">
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
              <p className="text-xs font-semibold text-slate-600">No hay versiones con esos filtros.</p>
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
                      <p className="text-xs text-slate-600 italic bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                        <span>Nota de versión: {item.versionNote}</span>
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
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-xs"
                        title="Duplicar y crear una versión nueva derivada de esta"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1 text-[#1E5F8A]" />
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
        <div className="shrink-0 bg-slate-50 p-3 sm:p-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 flex items-start gap-1.5 min-w-0">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 text-[#2ECC71] shrink-0" />
            <span>Puedes mantener múltiples versiones (ej. v1 para Vía API, v2 para Vía Webhook) de un mismo ticket.</span>
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

