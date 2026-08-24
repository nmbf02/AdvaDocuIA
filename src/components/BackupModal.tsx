import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  ShieldCheck, 
  FileJson, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Database, 
  HardDrive, 
  RefreshCw, 
  X,
  Clock,
  Sliders,
  Sparkles,
  Trash2,
  PlusCircle,
  Eye,
  FileText,
  HelpCircle,
  Radio,
  Check,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Search,
  Folder,
  FolderCheck,
  FolderOpen,
  FolderPlus,
  FolderSync
} from 'lucide-react';
import { 
  SavedProposal, 
  BrandingSettings, 
  AutoBackupConfig, 
  BackupSnapshot,
  BackupFrequency,
  FreeNote,
} from '../types';
import { 
  exportAppBackup, 
  parseAndValidateBackup, 
  AppBackupData,
  loadSnapshots,
  createAndSaveSnapshot,
  deleteSnapshot,
  clearSnapshots,
  downloadSnapshotAsFile,
  getStorageHealthInfo,
  saveBackupConfig,
  formatBytes,
  frequencyToLabel,
  getNextDailyBackupInfo,
  getTodayDateString,
  isFileSystemAccessSupported,
  requestTargetDirectory,
  getStoredDirectoryHandle,
  removeStoredDirectoryHandle,
  saveBackupToDiskFolderOrDownload
} from '../utils/backupManager';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SavedProposal[];
  branding?: BrandingSettings | null;
  currentDraft?: any | null;
  theme?: 'light' | 'dark';
  backupConfig: AutoBackupConfig;
  onUpdateBackupConfig: (newConfig: AutoBackupConfig) => void;
  onRestoreBackup: (backup: AppBackupData, mode: 'merge' | 'replace') => void;
  onManualSnapshotCreated?: (snapshot: BackupSnapshot) => void;
  lastAutoBackupTime?: string | null;
  freeNotes?: FreeNote[];
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  history,
  branding,
  currentDraft,
  theme,
  backupConfig,
  onUpdateBackupConfig,
  onRestoreBackup,
  onManualSnapshotCreated,
  lastAutoBackupTime,
  freeNotes = [],
}) => {
  // Tabs: 'snapshots' | 'config' | 'files'
  const [activeTab, setActiveTab] = useState<'snapshots' | 'config' | 'files'>('snapshots');

  // Snapshots State
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<BackupSnapshot | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [manualNote, setManualNote] = useState('');

  // Import / File State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<AppBackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Storage Health State
  const [storageInfo, setStorageInfo] = useState(getStorageHealthInfo());
  const isFsSupported = isFileSystemAccessSupported();

  // Reload snapshots on open or tab change
  const refreshSnapshots = () => {
    const list = loadSnapshots();
    setSnapshots(list);
    setStorageInfo(getStorageHealthInfo());
  };

  useEffect(() => {
    if (isOpen) {
      refreshSnapshots();
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsCreatingManual(false);
      setManualNote('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format relative time in Spanish
  const getRelativeTimeString = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Hace unos segundos';
    if (diffMin === 1) return 'Hace 1 minuto';
    if (diffMin < 60) return `Hace ${diffMin} minutos`;
    if (diffHours === 1) return 'Hace 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  };

  // Handle Manual Snapshot creation
  const handleCreateManualSnapshot = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const backupData: AppBackupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appName: 'ADVANSYS Document Generator',
        stats: {
          totalHistoryItems: history.length,
          hasDraft: Boolean(currentDraft),
          hasBranding: Boolean(branding && (branding.logoDataUrl || branding.customTitles)),
        },
        history,
        draft: currentDraft || null,
        settings: branding || null,
        theme: theme || 'light',
        freeNotes: freeNotes || [],
      };

      const newSnap = createAndSaveSnapshot(
        backupData, 
        'manual', 
        manualNote.trim() || 'Punto de control manual',
        backupConfig.maxSnapshots
      );

      if (newSnap) {
        refreshSnapshots();
        setManualNote('');
        setIsCreatingManual(false);
        setSuccessMessage('¡Punto de restauración manual guardado con éxito en el navegador!');
        if (onManualSnapshotCreated) {
          onManualSnapshotCreated(newSnap);
        }
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setErrorMessage(`Error al crear punto de restauración: ${err.message}`);
    }
  };

  // Handle Daily Scheduled Backup Test Run
  const handleTriggerDailyTest = async () => {
    try {
      const backupData: AppBackupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appName: 'ADVANSYS Document Generator',
        stats: {
          totalHistoryItems: history.length,
          hasDraft: Boolean(currentDraft),
          hasBranding: Boolean(branding && (branding.logoDataUrl || branding.customTitles)),
        },
        history,
        draft: currentDraft || null,
        settings: branding || null,
        theme: theme || 'light',
        freeNotes: freeNotes || [],
      };

      const newSnap = createAndSaveSnapshot(
        backupData,
        'daily_schedule',
        `Copia diaria programada (${backupConfig.dailyScheduleTime || '18:00'})`,
        backupConfig.maxSnapshots
      );

      if (newSnap) {
        const todayStr = getTodayDateString();
        const updatedConfig = { ...backupConfig, lastDailyBackupDate: todayStr };
        onUpdateBackupConfig(updatedConfig);
        saveBackupConfig(updatedConfig);
        refreshSnapshots();
        
        let saveResultInfo = '';
        if (backupConfig.dailyAutoDownloadJson || backupConfig.autoDownloadDailyToDisk) {
          const res = await saveBackupToDiskFolderOrDownload(
            backupData,
            `Advansys_Backup_Diario_${backupConfig.dailyScheduleTime.replace(':', '')}`
          );
          if (res.success) {
            saveResultInfo = res.method === 'direct_folder'
              ? ` y guardado en carpeta "${res.folderName}"`
              : ' y descargado en tu equipo';
          }
        }

        setSuccessMessage(`¡Copia diaria registrada con éxito (${backupConfig.dailyScheduleTime})${saveResultInfo}!`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setErrorMessage(`Error al ejecutar copia diaria: ${err.message}`);
    }
  };

  // Select Target Directory on PC Disk
  const handleSelectTargetDirectory = async () => {
    try {
      const res = await requestTargetDirectory();
      if (res.success && res.dirName) {
        const next: AutoBackupConfig = {
          ...backupConfig,
          targetDirectoryName: res.dirName,
          autoDownloadDailyToDisk: true,
          dailyAutoDownloadJson: true,
        };
        onUpdateBackupConfig(next);
        saveBackupConfig(next);
        setSuccessMessage(`¡Carpeta vinculada: "${res.dirName}"! Las copias se guardarán directamente en ella.`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else if (res.error) {
        setErrorMessage(res.error);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (e: any) {
      setErrorMessage(`Error al vincular carpeta: ${e.message}`);
    }
  };

  // Remove Target Directory Link
  const handleRemoveTargetDirectory = async () => {
    await removeStoredDirectoryHandle();
    const next: AutoBackupConfig = {
      ...backupConfig,
      targetDirectoryName: null,
    };
    onUpdateBackupConfig(next);
    saveBackupConfig(next);
    setSuccessMessage('Carpeta desvinculada. Las copias volverán a descargarse mediante el navegador.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Test write a backup to the folder / disk
  const handleTestDiskSave = async () => {
    setIsExporting(true);
    try {
      const backupData: AppBackupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appName: 'ADVANSYS Document Generator',
        stats: {
          totalHistoryItems: history.length,
          hasDraft: Boolean(currentDraft),
          hasBranding: Boolean(branding && (branding.logoDataUrl || branding.customTitles)),
        },
        history,
        draft: currentDraft || null,
        settings: branding || null,
        theme: theme || 'light',
        freeNotes: freeNotes || [],
      };

      const res = await saveBackupToDiskFolderOrDownload(backupData, 'Advansys_Backup_Test');
      if (res.success) {
        if (res.method === 'direct_folder') {
          setSuccessMessage(`¡Archivo guardado directamente en la carpeta "${res.folderName}": ${res.filename}!`);
        } else {
          setSuccessMessage(`¡Archivo descargado a tu equipo con éxito: ${res.filename}!`);
        }
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(`Error al guardar en disco: ${res.error}`);
      }
    } catch (e: any) {
      setErrorMessage(`Error: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Snapshot Delete
  const handleDeleteSnapshot = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = deleteSnapshot(id);
    setSnapshots(updated);
    if (selectedSnapshot?.id === id) {
      setSelectedSnapshot(null);
    }
    setStorageInfo(getStorageHealthInfo());
    setSuccessMessage('Punto de restauración eliminado.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle Clear all automated snapshots
  const handleClearAutoSnapshots = () => {
    if (window.confirm('¿Deseas limpiar todos los puntos automáticos antiguos? Los puntos manuales se conservarán.')) {
      const updated = clearSnapshots(true);
      setSnapshots(updated);
      setSelectedSnapshot(null);
      setStorageInfo(getStorageHealthInfo());
      setSuccessMessage('Copias automáticas antiguas limpiadas.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Handle Snapshot Restore
  const handleRestoreFromSnapshot = (snapshot: BackupSnapshot, mode: 'merge' | 'replace') => {
    try {
      onRestoreBackup(snapshot.data, mode);
      setSuccessMessage(
        mode === 'replace'
          ? `¡Restauración completa aplicada! Se recuperaron ${snapshot.data.history.length} documentos.`
          : `¡Restauración combinada exitosa! Se fusionaron ${snapshot.data.history.length} documentos.`
      );
      setSelectedSnapshot(null);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(`Error al restaurar copia: ${err.message}`);
    }
  };

  // Handle Export to JSON File
  const handleExportFile = () => {
    setIsExporting(true);
    try {
      exportAppBackup(history, branding, currentDraft, theme, undefined, freeNotes);
      setSuccessMessage('¡Copia de seguridad descargada exitosamente en formato JSON!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(`No se pudo generar la copia de seguridad: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Input Select for JSON import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setErrorMessage('Por favor selecciona un archivo con formato .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseAndValidateBackup(content);
      if (result.success && result.data) {
        setImportPreview(result.data);
      } else {
        setErrorMessage(result.error || 'Archivo de respaldo no válido.');
        setImportPreview(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer el archivo desde tu equipo.');
      setImportPreview(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Confirm File Restore
  const handleConfirmFileRestore = () => {
    if (!importPreview) return;
    try {
      onRestoreBackup(importPreview, restoreMode);
      setSuccessMessage(
        restoreMode === 'replace'
          ? `¡Se han restaurado ${importPreview.history.length} documentos reemplazando el historial anterior!`
          : `¡Se han combinado ${importPreview.history.length} documentos con tu historial actual!`
      );
      setImportPreview(null);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(`Error al restaurar: ${err.message}`);
    }
  };

  // Filtered Snapshots list
  const filteredSnapshots = snapshots.filter((snap) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const matchNote = snap.note?.toLowerCase().includes(q);
    const matchTrigger = snap.triggerLabel.toLowerCase().includes(q);
    const matchDate = new Date(snap.timestamp).toLocaleString('es-DO').toLowerCase().includes(q);
    const matchProjects = snap.stats.projectTitles.some((p) => p.toLowerCase().includes(q));
    return matchNote || matchTrigger || matchDate || matchProjects;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-[#0A3D62] text-white p-4 sm:px-6 flex items-center justify-between border-b border-[#1E5F8A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/15">
              <Database className="w-5 h-5 text-[#2ECC71]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-white">Centro de Copias de Seguridad (Backup)</h2>
                {backupConfig.enabled ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] animate-pulse"></span>
                    Auto: {backupConfig.frequency}
                  </span>
                ) : (
                  <span className="bg-slate-700/60 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Intervalo Pausado
                  </span>
                )}

                {backupConfig.dailyScheduleEnabled ? (
                  <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-400/30">
                    <Calendar className="w-3 h-3 text-purple-300" />
                    Diario: {backupConfig.dailyScheduleTime || '18:00'}
                  </span>
                ) : (
                  <span className="bg-slate-700/60 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Diario Inactivo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-200">
                Puntos de restauración periódicos, diarios programados a una hora y exportación JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1 sm:gap-2 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('snapshots')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'snapshots'
                  ? 'bg-white dark:bg-slate-900 text-[#0A3D62] dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Puntos de Restauración</span>
              <span className="bg-[#0A3D62]/10 dark:bg-blue-400/20 text-[#0A3D62] dark:text-blue-300 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {snapshots.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-white dark:bg-slate-900 text-[#0A3D62] dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configuración del Autoguardado</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-white dark:bg-slate-900 text-[#0A3D62] dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Exportar / Importar Archivo JSON</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Memoria: {storageInfo.usedFormatted} ({storageInfo.estimatedPercentage}%)</span>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2.5 text-red-800 dark:text-red-300 text-xs animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-2.5 text-emerald-900 dark:text-emerald-300 text-xs animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{successMessage}</p>
            </div>
          </div>
        )}

        {/* TAB 1: SNAPSHOTS & RESTORE POINTS */}
        {activeTab === 'snapshots' && (
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            
            {/* Quick Action Bar & Manual Creator */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-100 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0A3D62] dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Copia de Seguridad Instantánea
                  </h3>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Crea un punto de restauración con un solo clic antes de realizar cambios importantes.
                </p>
              </div>

              {!isCreatingManual ? (
                <button
                  type="button"
                  onClick={() => setIsCreatingManual(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#0A3D62] hover:bg-[#1E5F8A] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-4 h-4 text-[#2ECC71]" />
                  <span>Crear Punto Manual Ahora</span>
                </button>
              ) : (
                <form onSubmit={handleCreateManualSnapshot} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    placeholder="Nota (ej. Antes de cambiar alcance)..."
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0A3D62] w-full sm:w-64"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#2ECC71] hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingManual(false);
                      setManualNote('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Filter and Clear Tools */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar en puntos de respaldo..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A3D62]"
                />
              </div>

              {snapshots.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearAutoSnapshots}
                    className="text-[11px] font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Borra las copias automáticas antiguas manteniendo las manuales"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Limpiar automáticas</span>
                  </button>
                </div>
              )}
            </div>

            {/* SNAPSHOTS LIST */}
            {filteredSnapshots.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <Database className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {searchFilter ? 'No se encontraron puntos con ese criterio' : 'Aún no hay puntos de respaldo registrados'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  {searchFilter
                    ? 'Prueba con otra palabra clave o limpia el filtro.'
                    : 'Crea tu primera copia manual arriba o activa el autoguardado periódico para que se generen automáticamente.'}
                </p>
                {!searchFilter && (
                  <button
                    type="button"
                    onClick={() => handleCreateManualSnapshot()}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#0A3D62] text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4 text-[#2ECC71]" />
                    <span>Crear primer punto de respaldo</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredSnapshots.map((snap) => {
                  const dateObj = new Date(snap.timestamp);
                  const isSelected = selectedSnapshot?.id === snap.id;
                  const isManual = snap.isManual || snap.trigger === 'manual';

                  return (
                    <div
                      key={snap.id}
                      className={`border rounded-xl p-3.5 transition-all ${
                        isSelected
                          ? 'border-[#0A3D62] dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-md ring-1 ring-[#0A3D62]'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                isManual
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  : snap.trigger === 'daily_schedule'
                                  ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                                  : snap.trigger === 'on_save'
                                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                              }`}
                            >
                              {isManual ? 'MANUAL' : snap.trigger === 'daily_schedule' ? 'DIARIO' : snap.trigger === 'on_save' ? 'AL GUARDAR' : 'AUTO'}
                            </span>

                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {snap.note || snap.triggerLabel}
                            </span>

                            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              • {getRelativeTimeString(snap.timestamp)}
                            </span>
                          </div>

                          {/* Projects & Items Summary */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md font-medium">
                              <FileText className="w-3 h-3 text-[#0A3D62] dark:text-blue-400" />
                              {snap.stats.totalHistoryItems} documentos
                            </span>

                            {snap.stats.hasDraft && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md font-medium text-emerald-700 dark:text-emerald-400">
                                <Check className="w-3 h-3" /> Borrador activo
                              </span>
                            )}

                            <span className="text-slate-400 text-[10px]">
                              {formatBytes(snap.stats.sizeBytes)} • {dateObj.toLocaleDateString('es-DO')} {dateObj.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Project Names preview */}
                          {snap.stats.projectTitles.length > 0 && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate pt-0.5">
                              Proyectos: <span className="text-slate-700 dark:text-slate-300 italic">{snap.stats.projectTitles.join(', ')}</span>
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => downloadSnapshotAsFile(snap)}
                            className="p-1.5 text-slate-500 hover:text-[#0A3D62] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Descargar este punto como archivo .JSON"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedSnapshot(isSelected ? null : snap)}
                            className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-[#0A3D62] text-white border-[#0A3D62]'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#2ECC71]" />
                            <span>Restaurar</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar este punto de respaldo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Restore Options for Selected Snapshot */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl space-y-3 animate-in fade-in">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                            <RotateCcw className="w-4 h-4 text-[#0A3D62] dark:text-blue-400" />
                            <span>Selecciona el método de restauración para este punto:</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => handleRestoreFromSnapshot(snap, 'merge')}
                              className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#0A3D62] dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer group"
                            >
                              <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#0A3D62] dark:group-hover:text-blue-400">
                                🔄 Combinar con actual (Merge)
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                Añade los documentos de este punto sin borrar los que tengas ahora. Recomendado.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('¿Confirmas reemplazar todo el historial actual por este punto exacto?')) {
                                  handleRestoreFromSnapshot(snap, 'replace');
                                }
                              }}
                              className="p-3 text-left rounded-xl border border-amber-200 dark:border-amber-900/60 hover:border-amber-400 bg-amber-50/30 dark:bg-amber-950/20 transition-all cursor-pointer group"
                            >
                              <p className="font-bold text-amber-900 dark:text-amber-300">
                                ⚠️ Reemplazar todo (Replace)
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                Sobrescribe el historial dejando exactamente el estado de esta fecha y hora.
                              </p>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AUTO-BACKUP CONFIGURATION */}
        {activeTab === 'config' && (
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            
            {/* Section 1: Daily Scheduled Backup Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-950/20 dark:to-slate-800/80 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Copia de Seguridad Diaria a una Hora Programada
                    </h3>
                    <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-800">
                      Diario
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Programa una copia automática diaria a la hora exacta que elijas (ej. 18:00 al finalizar la jornada).
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={backupConfig.dailyScheduleEnabled}
                    onChange={(e) => {
                      const next = { ...backupConfig, dailyScheduleEnabled: e.target.checked };
                      onUpdateBackupConfig(next);
                      saveBackupConfig(next);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {backupConfig.dailyScheduleEnabled && (
                <div className="pt-2 border-t border-purple-200/70 dark:border-purple-800/40 space-y-4">
                  {/* Time Picker & Input */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-purple-100 dark:border-purple-900/50">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Hora exacta de ejecución diaria:
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Selecciona la hora o haz clic en uno de los accesos rápidos.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={backupConfig.dailyScheduleTime || '18:00'}
                        onChange={(e) => {
                          const val = e.target.value || '18:00';
                          const next = { ...backupConfig, dailyScheduleTime: val };
                          onUpdateBackupConfig(next);
                          saveBackupConfig(next);
                        }}
                        className="px-3 py-1.5 text-sm font-bold text-[#0A3D62] dark:text-blue-300 rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/40 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Quick Time Presets */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Horarios predeterminados rápidos:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { time: '08:00', label: '8:00 AM', desc: 'Inicio de jornada' },
                        { time: '13:00', label: '1:00 PM', desc: 'Mediodía' },
                        { time: '18:00', label: '6:00 PM', desc: 'Fin de jornada' },
                        { time: '21:00', label: '9:00 PM', desc: 'Noche' },
                        { time: '23:59', label: '11:59 PM', desc: 'Cierre del día' },
                      ].map((preset) => {
                        const isSelected = backupConfig.dailyScheduleTime === preset.time;
                        return (
                          <button
                            key={preset.time}
                            type="button"
                            onClick={() => {
                              const next = { ...backupConfig, dailyScheduleTime: preset.time };
                              onUpdateBackupConfig(next);
                              saveBackupConfig(next);
                            }}
                            className={`px-2.5 py-2 rounded-xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm font-bold'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-purple-100 dark:border-slate-700 hover:border-purple-300'
                            }`}
                          >
                            <div className="text-xs font-extrabold">{preset.label}</div>
                            <div className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                              {preset.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Local PC Target Folder Section */}
                  <div className="bg-purple-50/70 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Folder className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Carpeta de Destino en el Disco de tu PC
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {backupConfig.targetDirectoryName
                            ? `Los archivos diarios se escribirán directamente en tu carpeta "${backupConfig.targetDirectoryName}".`
                            : 'Selecciona una carpeta en tu disco local (ej. C:\\Backups) para guardar sin confirmación manual.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {backupConfig.targetDirectoryName ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 text-xs font-bold text-purple-900 dark:text-purple-300">
                              <FolderCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              {backupConfig.targetDirectoryName}
                            </span>
                            <button
                              type="button"
                              onClick={handleSelectTargetDirectory}
                              className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                              title="Cambiar carpeta"
                            >
                              Cambiar
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveTargetDirectory}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                              title="Desvincular carpeta"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSelectTargetDirectory}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                            <span>Seleccionar Carpeta en mi PC</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Checkbox auto-save to disk */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-purple-200/60 dark:border-purple-800/40">
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Guardar archivo físico .JSON en el disco cada vez que se ejecute la copia diaria
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {backupConfig.targetDirectoryName
                            ? `Se guardará directo en la carpeta "${backupConfig.targetDirectoryName}".`
                            : 'Se descargará automáticamente a tu carpeta de Descargas.'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={backupConfig.dailyAutoDownloadJson || backupConfig.autoDownloadDailyToDisk}
                        onChange={(e) => {
                          const next = { 
                            ...backupConfig, 
                            dailyAutoDownloadJson: e.target.checked,
                            autoDownloadDailyToDisk: e.target.checked
                          };
                          onUpdateBackupConfig(next);
                          saveBackupConfig(next);
                        }}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Status banner and Test execution button */}
                  <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div>
                        <span className="font-bold">
                          {getNextDailyBackupInfo(backupConfig).nextRunLabel}
                        </span>
                        {backupConfig.lastDailyBackupDate && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            Última copia diaria completada: {backupConfig.lastDailyBackupDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTriggerDailyTest}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                        title="Prueba la ejecución diaria creando una copia ahora"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ejecutar copia diaria ahora (Prueba)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Main Interval Toggle */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#0A3D62] dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Copias de Seguridad Automáticas Periódicas (Intervalo)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Guarda instantáneas del estado de tus propuestas cada pocos minutos en segundo plano.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={backupConfig.enabled}
                  onChange={(e) => {
                    const next = { ...backupConfig, enabled: e.target.checked };
                    onUpdateBackupConfig(next);
                    saveBackupConfig(next);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#2ECC71]"></div>
              </label>
            </div>

            {/* Section 3: Frequency Selector */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#0A3D62] dark:text-blue-400" />
                  Frecuencia de Guardado Automático
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Intervalo de tiempo con el que se registrará un nuevo punto si hubo actividad o cambios.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {(['1m', '2m', '5m', '10m', '15m', '30m', '60m'] as BackupFrequency[]).map((freq) => {
                  const isSelected = backupConfig.frequency === freq;
                  return (
                    <button
                      key={freq}
                      type="button"
                      disabled={!backupConfig.enabled}
                      onClick={() => {
                        const next = { ...backupConfig, frequency: freq };
                        onUpdateBackupConfig(next);
                        saveBackupConfig(next);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isSelected
                          ? 'border-[#0A3D62] dark:border-blue-500 bg-[#0A3D62] text-white shadow-md'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{freq === '1m' ? '1 Minuto' : freq === '5m' ? '5 Minutos (Rec.)' : frequencyToLabel(freq).split(' ')[1] + ' ' + frequencyToLabel(freq).split(' ')[2]}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#2ECC71]" />}
                      </div>
                      <p className={`text-[10px] mt-1 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                        {freq === '5m' ? 'Recomendado' : freq === '1m' ? 'Tiempo Real' : 'Estándar'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Smart Triggers and Retention */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Disparadores y Retención Inteligente
              </h4>

              <div className="space-y-3">
                {/* Trigger: On Save */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Crear punto al hacer clic en "Guardar Cambios"
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Registra una copia de seguridad cada vez que guardas manualmente en el editor.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupConfig.backupOnSave}
                    onChange={(e) => {
                      const next = { ...backupConfig, backupOnSave: e.target.checked };
                      onUpdateBackupConfig(next);
                      saveBackupConfig(next);
                    }}
                    className="w-4 h-4 text-[#0A3D62] rounded border-slate-300 focus:ring-[#0A3D62] cursor-pointer"
                  />
                </div>

                {/* Trigger: On Document Switch */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Crear punto al cambiar de documento en el historial
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Asegura que el estado del documento anterior no se pierda al abrir otro.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupConfig.backupOnDocumentSwitch}
                    onChange={(e) => {
                      const next = { ...backupConfig, backupOnDocumentSwitch: e.target.checked };
                      onUpdateBackupConfig(next);
                      saveBackupConfig(next);
                    }}
                    className="w-4 h-4 text-[#0A3D62] rounded border-slate-300 focus:ring-[#0A3D62] cursor-pointer"
                  />
                </div>

                {/* Trigger: Toast Notifications */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Notificación discreta en pantalla
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Muestra un pequeño aviso de confirmación cuando se realiza un respaldo automático.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupConfig.showNotificationToast}
                    onChange={(e) => {
                      const next = { ...backupConfig, showNotificationToast: e.target.checked };
                      onUpdateBackupConfig(next);
                      saveBackupConfig(next);
                    }}
                    className="w-4 h-4 text-[#0A3D62] rounded border-slate-300 focus:ring-[#0A3D62] cursor-pointer"
                  />
                </div>

                {/* Retention count */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Máximo de puntos de respaldo a conservar
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Rotación automática FIFO: siempre conserva los puntos manuales.
                    </p>
                  </div>
                  <select
                    value={backupConfig.maxSnapshots}
                    onChange={(e) => {
                      const next = { ...backupConfig, maxSnapshots: parseInt(e.target.value) || 15 };
                      onUpdateBackupConfig(next);
                      saveBackupConfig(next);
                    }}
                    className="text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="5">5 puntos</option>
                    <option value="10">10 puntos</option>
                    <option value="15">15 puntos (Recomendado)</option>
                    <option value="25">25 puntos</option>
                    <option value="50">50 puntos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Storage Health meter */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Estado del Almacenamiento Local
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {storageInfo.usedFormatted} usados ({storageInfo.estimatedPercentage}%)
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    storageInfo.status === 'critical'
                      ? 'bg-red-500'
                      : storageInfo.status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-[#2ECC71]'
                  }`}
                  style={{ width: `${Math.max(5, storageInfo.estimatedPercentage)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tus datos residen 100% de manera privada y segura en tu navegador.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: EXPORT & IMPORT JSON FILES */}
        {activeTab === 'files' && (
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            
            {/* EXPORT SECTION */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#0A3D62] dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      1. Descargar Archivo de Copia de Seguridad (.JSON)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Guarda un archivo <strong>.JSON</strong> en tu disco local con todo tu historial ({history.length} documentos), logos de marca, títulos y borrador activo. Ideal para respaldar o transferir a otra computadora.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 font-medium bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                      <HardDrive className="w-3.5 h-3.5 text-[#0A3D62] dark:text-blue-400" />
                      {history.length} documentos en historial
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2ECC71]" />
                      Ajustes de marca incluidos
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  {backupConfig.targetDirectoryName && (
                    <button
                      type="button"
                      onClick={handleTestDiskSave}
                      disabled={isExporting}
                      className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      title={`Guardar directo en ${backupConfig.targetDirectoryName}`}
                    >
                      <FolderCheck className="w-4 h-4 text-amber-300" />
                      <span>Guardar en "{backupConfig.targetDirectoryName}"</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExportFile}
                    disabled={isExporting}
                    className="px-4 py-2.5 rounded-xl bg-[#0A3D62] hover:bg-[#1E5F8A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-[#2ECC71]" />
                    <span>Descargar Archivo JSON</span>
                  </button>
                </div>
              </div>
            </div>

            {/* IMPORT SECTION */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    2. Restaurar desde un Archivo de Copia (.JSON)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Selecciona un archivo <strong>.JSON</strong> previamente descargado para recuperar tus propuestas en caso de formateo o cambio de equipo.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".json,application/json"
                className="hidden"
              />

              {!importPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#0A3D62] dark:hover:border-blue-400 bg-white dark:bg-slate-800/80 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-blue-50/20 group"
                >
                  <FileJson className="w-8 h-8 mx-auto text-slate-400 group-hover:text-[#0A3D62] dark:group-hover:text-blue-400 transition-colors mb-2" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#0A3D62] dark:group-hover:text-blue-400">
                    Haz clic aquí para seleccionar tu archivo de respaldo (.json)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Compatible con backups de ADVANSYS Document Generator
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl p-4 space-y-4 animate-in fade-in">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#2ECC71]" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Archivo de respaldo reconocido
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Exportado el: {new Date(importPreview.exportDate).toLocaleString('es-DO')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImportPreview(null)}
                      className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Cambiar archivo
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-700/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                        Documentos en archivo
                      </span>
                      <span className="text-sm font-bold text-[#0A3D62] dark:text-blue-400">
                        {importPreview.history.length}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                        Borrador actual
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {importPreview.draft ? 'Sí incluido' : 'No'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                        Logo y Marca
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {importPreview.settings ? 'Sí incluidos' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Mode selector */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Método de restauración:
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label
                        className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          restoreMode === 'merge'
                            ? 'border-[#0A3D62] dark:border-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="restoreMode"
                          value="merge"
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                          className="mt-0.5 text-[#0A3D62] focus:ring-[#0A3D62]"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">🔄 Combinar (Merge)</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Suma los documentos del archivo a tu historial actual sin borrar nada existente.
                          </p>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          restoreMode === 'replace'
                            ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="restoreMode"
                          value="replace"
                          checked={restoreMode === 'replace'}
                          onChange={() => setRestoreMode('replace')}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <p className="font-bold text-amber-900 dark:text-amber-300">⚠️ Reemplazar todo</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Sobrescribe completamente el historial con los documentos de este archivo.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setImportPreview(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmFileRestore}
                      className="px-4 py-2 text-xs font-bold bg-[#0A3D62] hover:bg-[#1E5F8A] text-white rounded-xl shadow-sm flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#2ECC71]" />
                      <span>Proceder y Restaurar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2ECC71]" />
            <span>Almacenamiento 100% privado en navegador</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
