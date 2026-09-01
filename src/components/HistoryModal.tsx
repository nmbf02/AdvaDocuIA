import React, { useMemo, useState } from 'react';
import { SavedProposal, DocumentStatus, getOperativeStepLabels } from '../types';
import { X, Calendar, Building2, FileText, Trash2, ArrowRight, Copy, GitBranch, Search, Check, Tag, Sparkles, Filter, RotateCcw, CheckCircle2, CheckCheck, Clock, ShieldCheck, Award, Terminal, Layers, Link, Database, Download, ChevronDown } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: SavedProposal[];
  onSelectProposal: (proposal: SavedProposal) => void;
  onDeleteProposal: (id: string) => void;
  onDuplicateProposal?: (proposal: SavedProposal) => void;
  onUpdateStatus?: (id: string, status: DocumentStatus) => void;
  onOpenBackup?: () => void;
}

const isTechnicalHistoryItem = (p: SavedProposal): boolean =>
  p.documentType === 'technical' || Boolean(p.content?.technicalDoc?.isStandalone);

const linkedProposalIdOf = (p: SavedProposal): string | undefined =>
  p.linkedProposalId || p.content?.technicalDoc?.linkedProposalId || undefined;

const linkedProposalNameOf = (p: SavedProposal): string | undefined =>
  p.linkedProposalName || p.content?.technicalDoc?.linkedProposalName || undefined;

const embeddedTechnicalDocOf = (p: SavedProposal) =>
  p.technicalDoc || p.content?.technicalDoc || undefined;

/** Doc. Técnica ya va dentro de la misma ficha de propuesta (pestaña Doc. Técnica), no como documento suelto. */
const hasEmbeddedTechnicalDoc = (p: SavedProposal): boolean => {
  if (isTechnicalHistoryItem(p)) return false;
  const tech = embeddedTechnicalDocOf(p);
  if (!tech || tech.isStandalone) return false;
  return true;
};

const isTiedToProposal = (p: SavedProposal): boolean =>
  Boolean(linkedProposalIdOf(p)) || Boolean(p.linkedTechnicalDocId && !isTechnicalHistoryItem(p)) || hasEmbeddedTechnicalDoc(p);

const proposalHistoryLabel = (p: SavedProposal): string => {
  const ticket = p.metadata.ticketNo ? `[${p.metadata.ticketNo}] ` : '';
  const name = p.metadata.nombreProyecto || 'Propuesta sin nombre';
  return `${ticket}${name} (${p.version || 'v1.0'})`;
};

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  proposals,
  onSelectProposal,
  onDeleteProposal,
  onDuplicateProposal,
  onUpdateStatus,
  onOpenBackup
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCliente, setFilterCliente] = useState('all');
  const [filterTicket, setFilterTicket] = useState('all');
  const [filterVersion, setFilterVersion] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | '7d' | '30d' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'client' | 'project'>('newest');
  const [filterDocType, setFilterDocType] = useState<'all' | 'proposal' | 'slides' | 'technical'>('all');
  const [filterLinkedProposalId, setFilterLinkedProposalId] = useState<'all' | 'any' | string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const counts = useMemo(() => {
    const total = proposals.length;
    const completed = proposals.filter((p) => p.status === 'finalizado' || p.status === 'culminado').length;
    const inProgress = total - completed;
    return { total, completed, inProgress };
  }, [proposals]);

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

  const uniqueLinkedProposals = useMemo(() => {
    const map = new Map<string, string>();
    proposals.forEach((p) => {
      const linkedId = linkedProposalIdOf(p);
      if (linkedId) {
        const target = proposals.find((x) => x.id === linkedId);
        map.set(linkedId, target ? proposalHistoryLabel(target) : (linkedProposalNameOf(p) || linkedId));
      }
      if (p.linkedTechnicalDocId && !isTechnicalHistoryItem(p)) {
        map.set(p.id, proposalHistoryLabel(p));
      }
      if (hasEmbeddedTechnicalDoc(p)) {
        map.set(p.id, proposalHistoryLabel(p));
      }
    });
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [proposals]);

  const hasExtraFilters =
    filterStatus !== 'all' ||
    filterCliente !== 'all' ||
    filterTicket !== 'all' ||
    filterVersion !== 'all' ||
    filterPeriod !== 'all' ||
    filterDocType !== 'all' ||
    filterLinkedProposalId !== 'all' ||
    sortBy !== 'newest';

  const hasActiveFilters = hasExtraFilters || statusTab !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusTab('all');
    setFilterStatus('all');
    setFilterCliente('all');
    setFilterTicket('all');
    setFilterVersion('all');
    setFilterPeriod('all');
    setFilterDocType('all');
    setFilterLinkedProposalId('all');
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
      const currentStatus = p.status || 'borrador';
      const isCompleted = currentStatus === 'finalizado' || currentStatus === 'culminado';

      // Status Tab filter
      if (statusTab === 'completed' && !isCompleted) return false;
      if (statusTab === 'in_progress' && isCompleted) return false;

      // Status Dropdown filter
      if (filterStatus !== 'all' && currentStatus !== filterStatus) return false;

      const q = searchQuery.toLowerCase().trim();
      const ticketKey = (p.metadata.ticketNo || p.metadata.propuestaNo || '').trim();
      const versionKey = (p.version || 'v1.0').trim();
      const clienteKey = (p.metadata.cliente || '').trim();

      if (filterCliente !== 'all' && clienteKey !== filterCliente) return false;
      if (filterTicket !== 'all' && ticketKey !== filterTicket) return false;
      if (filterVersion !== 'all' && versionKey !== filterVersion) return false;
      if (filterDocType !== 'all') {
        const itemType = p.documentType || (p.content?.technicalDoc?.isStandalone ? 'technical' : 'proposal');
        if (itemType !== filterDocType) return false;
      }

      const linkedId = linkedProposalIdOf(p);
      if (filterLinkedProposalId === 'any') {
        if (!isTiedToProposal(p)) return false;
      } else if (filterLinkedProposalId !== 'all') {
        const matchesAsProposal =
          p.id === filterLinkedProposalId &&
          (isTiedToProposal(p) || proposals.some((x) => linkedProposalIdOf(x) === p.id));
        const matchesAsTechDoc = linkedId === filterLinkedProposalId;
        if (!matchesAsProposal && !matchesAsTechDoc) return false;
      }

      if (!matchesPeriod(p.timestamp)) return false;

      if (!q) return true;
      return (
        clienteKey.toLowerCase().includes(q) ||
        (p.metadata.nombreProyecto || '').toLowerCase().includes(q) ||
        (p.metadata.ticketNo || '').toLowerCase().includes(q) ||
        (p.metadata.propuestaNo || '').toLowerCase().includes(q) ||
        (p.metadata.moduloAplicacion || '').toLowerCase().includes(q) ||
        versionKey.toLowerCase().includes(q) ||
        (p.versionNote || '').toLowerCase().includes(q) ||
        currentStatus.toLowerCase().includes(q) ||
        (linkedProposalNameOf(p) || '').toLowerCase().includes(q)
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
    const textToCopy = `=== ${item.metadata.nombreProyecto || 'Propuesta'} [${item.version || 'v1.0'}] [${(item.status || 'Borrador').toUpperCase()}] ===
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
${c.analisisOperativo?.length ? getOperativeStepLabels(c.analisisOperativo, 7).map((label, i) => `Paso ${label}: ${c.analisisOperativo[i].titulo}\n${c.analisisOperativo[i].explicacion}`).join('\n\n') : 'N/A'}
`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getStatusBadge = (status?: DocumentStatus) => {
    switch (status) {
      case 'finalizado':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Finalizado
          </span>
        );
      case 'culminado':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300 rounded-md">
            <CheckCheck className="w-3.5 h-3.5 mr-1 text-teal-600" />
            Culminado
          </span>
        );
      case 'en_revision':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300 rounded-md">
            <Clock className="w-3.5 h-3.5 mr-1 text-sky-600" />
            En Revisión
          </span>
        );
      case 'borrador':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-slate-200 text-slate-800 border border-slate-300 rounded-md">
            <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Borrador
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="history-modal bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[min(86dvh,800px)] min-w-0">
        
        {/* Modal Header */}
        <div className="bg-[#0A3D62] text-white p-3 sm:p-4 px-3 sm:px-6 flex items-center justify-between gap-2 border-b border-[#1E5F8A] shrink-0 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="w-5 h-5 text-[#2ECC71] shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold truncate">Historial de Documentos</h2>
              <p className="text-[11px] text-blue-200 hidden sm:block">
                Gestiona tus propuestas, revisa versiones y marca documentos como finalizados o culminados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenBackup && (
              <button
                type="button"
                onClick={onOpenBackup}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Descargar o restaurar copia de seguridad"
              >
                <Database className="w-3.5 h-3.5 text-[#2ECC71]" />
                <span className="hidden sm:inline">Copia de Seguridad</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Tabs: Todos / En Progreso / Finalizados & Culminados */}
        <div className="bg-white px-3 sm:px-6 pt-3 pb-0 border-b border-slate-200 flex items-center gap-1 sm:gap-2 overflow-x-auto overscroll-x-contain shrink-0 min-w-0 max-w-full no-scrollbar">
          <button
            onClick={() => setStatusTab('all')}
            className={`pb-2.5 px-2 sm:px-3 text-xs font-bold flex items-center gap-1 sm:gap-1.5 border-b-2 transition-all shrink-0 ${
              statusTab === 'all'
                ? 'border-[#0A3D62] text-[#0A3D62]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Todos</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-100 text-slate-700 font-semibold">
              {counts.total}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('in_progress')}
            className={`pb-2.5 px-2 sm:px-3 text-xs font-bold flex items-center gap-1 sm:gap-1.5 border-b-2 transition-all shrink-0 ${
              statusTab === 'in_progress'
                ? 'border-amber-500 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">En Proceso / Borradores</span>
            <span className="sm:hidden">En proceso</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-800 font-semibold">
              {counts.inProgress}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('completed')}
            className={`pb-2.5 px-2 sm:px-3 text-xs font-bold flex items-center gap-1 sm:gap-1.5 border-b-2 transition-all shrink-0 ${
              statusTab === 'completed'
                ? 'border-[#2ECC71] text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71]" />
            <span className="hidden sm:inline">Finalizados / Culminados</span>
            <span className="sm:hidden">Cerrados</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-100 text-emerald-900 font-bold">
              {counts.completed}
            </span>
          </button>
        </div>

        {/* Search always visible; extra filters stay collapsed */}
        <div className="shrink-0 p-3 px-3 sm:px-6 bg-slate-50 border-b border-slate-200 space-y-2 min-w-0 max-w-full overflow-x-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente, proyecto o ticket..."
                className="w-full min-w-0 pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A3D62] text-slate-800"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((open) => !open)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border shrink-0 ${
                showFilters || hasExtraFilters
                  ? 'bg-[#0A3D62] text-white border-[#0A3D62]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filtros</span>
              {hasExtraFilters && (
                <span className="min-w-[1rem] h-4 px-1 rounded-full bg-[#2ECC71] text-slate-950 text-[10px] font-black leading-4">
                  !
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <span className="text-[11px] font-semibold text-slate-600 shrink-0 hidden sm:inline">
              {filteredProposals.length}/{proposals.length}
            </span>
          </div>

          {showFilters && (
          <div className="history-filters space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-600">
              {filteredProposals.length} de {proposals.length}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#0A3D62] bg-white hover:bg-slate-50 border border-slate-300 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 min-w-0">
            <label className="min-w-0">
              <span className="block text-[10px] font-bold text-[#0A3D62] mb-1">Tipo</span>
              <select
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value as typeof filterDocType)}
                className="w-full min-w-0 max-w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
              >
                <option value="all">Todos</option>
                <option value="proposal">Propuesta</option>
                <option value="technical">Doc. Técnica</option>
                <option value="slides">Diapositivas</option>
              </select>
            </label>

            <label className="min-w-0">
              <span className="block text-[10px] font-bold text-[#0A3D62] mb-1">Estado</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full min-w-0 max-w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
              >
                <option value="all">Todos</option>
                <option value="borrador">Borrador</option>
                <option value="en_revision">En Revisión</option>
                <option value="finalizado">Finalizado</option>
                <option value="culminado">Culminado</option>
              </select>
            </label>

            <label className="min-w-0">
              <span className="block text-[10px] font-bold text-[#0A3D62] mb-1">Cliente</span>
              <select
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="w-full min-w-0 max-w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
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
                className="w-full min-w-0 max-w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
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
                className="w-full min-w-0 max-w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
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
                className="w-full min-w-0 max-w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
              >
                <option value="all">Cualquier fecha</option>
                <option value="today">Hoy</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="month">Este mes</option>
              </select>
            </label>

            <label className="min-w-0">
              <span className="block text-[10px] font-bold text-[#0A3D62] mb-1">Ordenar</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full min-w-0 max-w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#0A3D62]"
              >
                <option value="newest">Más reciente</option>
                <option value="oldest">Más antiguo</option>
                <option value="client">Cliente A-Z</option>
                <option value="project">Proyecto A-Z</option>
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="text-[11px] font-bold text-emerald-900 min-w-0 break-words">
                  Propuestas vinculadas a Doc. Técnica
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200">
                  {uniqueLinkedProposals.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterLinkedProposalId(filterLinkedProposalId === 'any' ? 'all' : 'any')}
                  className={`inline-flex items-center px-2 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                    filterLinkedProposalId === 'any'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  Solo vinculadas
                </button>
              </div>
            </div>

            <label className="block min-w-0">
              <span className="sr-only">Filtrar por propuesta técnica vinculada</span>
              <select
                value={filterLinkedProposalId === 'any' ? 'any' : filterLinkedProposalId}
                onChange={(e) => setFilterLinkedProposalId(e.target.value as typeof filterLinkedProposalId)}
                className="w-full max-w-full min-w-0 px-2 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-600"
              >
                <option value="all">Todas (con o sin vínculo)</option>
                <option value="any">Solo con vínculo Doc. Técnica</option>
                {uniqueLinkedProposals.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label.length > 52 ? `${item.label.slice(0, 51)}…` : item.label}
                  </option>
                ))}
              </select>
            </label>

            {uniqueLinkedProposals.length === 0 && (
              <p className="text-[11px] text-emerald-800/80">
                Aún no hay propuestas atadas. La Doc. Técnica dentro de una propuesta ya cuenta como vínculo.
              </p>
            )}
          </div>
          </div>
          )}
        </div>

        {/* Section Banner if viewing Completed items */}
        {statusTab === 'completed' && (
          <div className="bg-emerald-50 px-3 sm:px-6 py-2 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 shrink-0 min-w-0">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sección de Documentos Finalizados y Culminados</span>
            </div>
            <span className="text-[11px] text-emerald-700 hidden sm:inline">
              Documentos listos para entrega o cierre formal
            </span>
          </div>
        )}

        {/* Modal Content List */}
        <div className="p-3 sm:p-6 overflow-y-auto overflow-x-hidden min-h-0 flex-1 space-y-3">
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
              <p className="text-xs font-semibold text-slate-600">No hay documentos con los filtros seleccionados.</p>
              {statusTab === 'completed' && (
                <p className="text-xs text-slate-400 mt-1">
                  Puedes marcar cualquier documento del historial como "Finalizado" o "Culminado" usando su selector de estado.
                </p>
              )}
            </div>
          ) : (
            filteredProposals.map((item) => {
              const versionLabel = item.version || 'v1.0';
              const currentStatus = item.status || 'borrador';
              const isFinished = currentStatus === 'finalizado' || currentStatus === 'culminado';

              return (
                <div
                  key={item.id}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col gap-2 min-w-0 ${
                    isFinished
                      ? 'bg-emerald-50/40 hover:bg-emerald-50/80 border-emerald-200 hover:border-emerald-400 shadow-2xs'
                      : 'bg-slate-50 hover:bg-blue-50/50 border-slate-200 hover:border-[#0A3D62]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 min-w-0">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-[#2ECC71] text-slate-950 rounded-full border border-emerald-500/40">
                          <Tag className="w-3 h-3 mr-1 text-slate-900" />
                          {versionLabel}
                        </span>
                        {getStatusBadge(item.status)}
                        {(item.documentType === 'technical' || item.content?.technicalDoc?.isStandalone) && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                            <Terminal className="w-3 h-3 mr-1" />
                            Doc. Técnica
                          </span>
                        )}
                        {item.documentType === 'slides' && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-[#0A3D62] rounded-full border border-blue-200">
                            <Layers className="w-3 h-3 mr-1" />
                            Diapositivas
                          </span>
                        )}
                        {item.linkedProposalName && (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[180px]" title={item.linkedProposalName}>
                            Atada: {item.linkedProposalName}
                          </span>
                        )}
                        {((item.linkedTechnicalDocId && !isTechnicalHistoryItem(item)) || hasEmbeddedTechnicalDoc(item)) && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-white text-emerald-800 rounded border border-emerald-200">
                            <Link className="w-3 h-3 mr-1" />
                            Con Doc. Técnica
                          </span>
                        )}
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-[#0A3D62] text-white rounded">
                          {item.metadata.ticketNo || item.metadata.propuestaNo || 'S/N'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0A3D62] leading-snug break-words">
                        {item.metadata.nombreProyecto || 'Proyecto sin título'}
                      </h3>

                      {item.versionNote && (
                        <p className="text-xs text-slate-600 italic bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                          <span>Nota de versión: {item.versionNote}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center text-xs text-slate-500 gap-x-3 gap-y-0.5">
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
                        {isFinished && item.statusChangedAt && (
                          <span className="flex items-center text-emerald-700 font-medium">
                            <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Marcado {currentStatus} el {new Date(item.statusChangedAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 sm:justify-end">
                    
                    {/* Status Changer Selector */}
                    {onUpdateStatus && (
                      <div className="flex flex-nowrap items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 px-1 hidden sm:inline">Estado:</span>
                        <select
                          value={currentStatus}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value as DocumentStatus)}
                          className={`text-xs font-bold rounded-md px-2 py-1 border w-auto max-w-[8.5rem] shrink-0 transition-colors focus:ring-2 focus:ring-[#0A3D62] ${
                            isFinished
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : currentStatus === 'en_revision'
                              ? 'bg-sky-50 text-sky-900 border-sky-300'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                          title="Cambiar el estado de este documento"
                        >
                          <option value="borrador">Borrador</option>
                          <option value="en_revision">En Revisión</option>
                          <option value="finalizado">Finalizado</option>
                          <option value="culminado">Culminado</option>
                        </select>

                        {/* Quick toggle button */}
                        {!isFinished ? (
                          <button
                            onClick={() => onUpdateStatus(item.id, 'finalizado')}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded transition-colors"
                            title="Marcar rápidamente como Finalizado"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Finalizar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateStatus(item.id, 'borrador')}
                            className="inline-flex items-center gap-1 px-1.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Reabrir y pasar a Borrador"
                          >
                            <RotateCcw className="w-3 h-3 text-slate-500" />
                            <span>Reabrir</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Load into Editor */}
                    <button
                      onClick={() => {
                        onSelectProposal(item);
                        onClose();
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-lg transition-colors shadow-2xs"
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
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-[#0A3D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs"
                        title="Duplicar y crear una versión nueva derivada de esta"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1 text-[#1E5F8A]" />
                        <span className="hidden sm:inline">Duplicar</span>
                      </button>
                    )}

                    {/* Copy Text to Clipboard */}
                    <button
                      onClick={() => handleCopyTextToClipboard(item)}
                      className={`inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-2xs ${
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
                          <span className="hidden sm:inline">Copiar</span>
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
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 bg-slate-50 p-3 sm:p-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs min-w-0 max-w-full">
          <span className="text-slate-500 flex items-start gap-1.5 min-w-0">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 text-[#2ECC71] shrink-0" />
            <span>Los documentos marcados como <strong>Finalizado</strong> o <strong>Culminado</strong> quedan archivados formalmente en su propia sección.</span>
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onOpenBackup && (
              <button
                type="button"
                onClick={onOpenBackup}
                className="px-3.5 py-2 text-xs font-bold text-[#0A3D62] hover:bg-blue-50 bg-white border border-blue-200 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-[#0A3D62]" />
                <span className="hidden sm:inline">Exportar / Importar Backup</span>
                <span className="sm:hidden">Backup</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-sm cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

