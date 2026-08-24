import { 
  SavedProposal, 
  BrandingSettings, 
  MetadataHeader, 
  UploadedImage, 
  ProposalSection,
  AutoBackupConfig,
  DEFAULT_BACKUP_CONFIG,
  BackupSnapshot,
  BackupTrigger,
  BackupFrequency
} from '../types';

export const STORAGE_KEY_BACKUP_CONFIG = 'advansys_docgen_backup_config_v1';
export const STORAGE_KEY_SNAPSHOTS = 'advansys_docgen_snapshots_v1';

export interface AppBackupData {
  version: '1.0';
  exportDate: string;
  appName: string;
  stats: {
    totalHistoryItems: number;
    hasDraft: boolean;
    hasBranding: boolean;
  };
  history: SavedProposal[];
  draft?: {
    currentDocumentId?: string | null;
    metadata?: MetadataHeader;
    rawRequirements?: string;
    images?: UploadedImage[];
    proposal?: ProposalSection | null;
    version?: string;
    versionNote?: string;
    status?: string;
    workspaceMode?: string;
    editorTab?: string;
    timestamp?: string;
  } | null;
  settings?: BrandingSettings | null;
  theme?: 'light' | 'dark' | null;
}

/**
 * Converts frequency code (e.g. '5m') into milliseconds
 */
export function frequencyToMilliseconds(freq: BackupFrequency): number {
  switch (freq) {
    case '1m': return 1 * 60 * 1000;
    case '2m': return 2 * 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case '10m': return 10 * 60 * 1000;
    case '15m': return 15 * 60 * 1000;
    case '30m': return 30 * 60 * 1000;
    case '60m': return 60 * 60 * 1000;
    case 'off':
    default:
      return 0;
  }
}

/**
 * Converts frequency code to user-friendly label
 */
export function frequencyToLabel(freq: BackupFrequency): string {
  switch (freq) {
    case '1m': return 'Cada 1 minuto (Alta frecuencia)';
    case '2m': return 'Cada 2 minutos';
    case '5m': return 'Cada 5 minutos (Recomendado)';
    case '10m': return 'Cada 10 minutos';
    case '15m': return 'Cada 15 minutos';
    case '30m': return 'Cada 30 minutos';
    case '60m': return 'Cada 1 hora';
    case 'off': return 'Desactivado (Solo manual)';
    default: return freq;
  }
}

/**
 * Converts trigger into human-readable Spanish text
 */
export function getTriggerFriendlyLabel(trigger: BackupTrigger): string {
  switch (trigger) {
    case 'daily_schedule': return 'Copia diaria programada';
    case 'interval': return 'Automático periódico';
    case 'manual': return 'Copia manual instantánea';
    case 'on_save': return 'Al guardar cambios';
    case 'on_switch': return 'Al cambiar de documento';
    case 'on_import': return 'Punto previo a importación';
    case 'initial': return 'Inicio de sesión';
    default: return 'Automático';
  }
}

/**
 * Gets today's local date string in YYYY-MM-DD format
 */
export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if the daily scheduled backup should run right now
 */
export function shouldRunDailyBackup(config: AutoBackupConfig, now: Date = new Date()): boolean {
  if (!config.dailyScheduleEnabled) return false;
  if (!config.dailyScheduleTime) return false;

  const todayStr = getTodayDateString(now);
  // Already backed up today?
  if (config.lastDailyBackupDate === todayStr) {
    return false;
  }

  // Check if current local time is at or past the scheduled time
  const [targetHours, targetMinutes] = config.dailyScheduleTime.split(':').map(Number);
  if (isNaN(targetHours) || isNaN(targetMinutes)) return false;

  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  const currentTimeInMinutes = currentHours * 60 + currentMinutes;
  const targetTimeInMinutes = targetHours * 60 + targetMinutes;

  // Runs once the target time is reached for today
  return currentTimeInMinutes >= targetTimeInMinutes;
}

/**
 * Formats time remaining until next daily backup
 */
export function getNextDailyBackupInfo(config: AutoBackupConfig): {
  nextRunLabel: string;
  isToday: boolean;
  timeString: string;
} {
  if (!config.dailyScheduleEnabled || !config.dailyScheduleTime) {
    return {
      nextRunLabel: 'Desactivado',
      isToday: false,
      timeString: '--:--',
    };
  }

  const now = new Date();
  const [targetH, targetM] = config.dailyScheduleTime.split(':').map(Number);
  const todayStr = getTodayDateString(now);

  const targetDate = new Date();
  targetDate.setHours(targetH, targetM, 0, 0);

  const alreadyRunToday = config.lastDailyBackupDate === todayStr;

  if (alreadyRunToday || now.getTime() >= targetDate.getTime()) {
    return {
      nextRunLabel: `Mañana a las ${config.dailyScheduleTime}`,
      isToday: false,
      timeString: config.dailyScheduleTime,
    };
  }

  return {
    nextRunLabel: `Hoy a las ${config.dailyScheduleTime}`,
    isToday: true,
    timeString: config.dailyScheduleTime,
  };
}

// -------------------------------------------------------------
// LOCAL PC FOLDER & FILE SYSTEM ACCESS API INTEGRATION
// -------------------------------------------------------------

const IDB_NAME = 'advansys_docgen_idb_v1';
const IDB_VERSION = 1;
const IDB_STORE_HANDLES = 'fs_handles';
const IDB_KEY_BACKUP_DIR = 'backup_directory_handle';

/**
 * Checks if the browser supports the modern File System Access API (showDirectoryPicker)
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).showDirectoryPicker === 'function';
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE_HANDLES)) {
        db.createObjectStore(IDB_STORE_HANDLES);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Stores the chosen directory handle in IndexedDB
 */
export async function storeDirectoryHandle(handle: any): Promise<void> {
  try {
    const db = await openIdb();
    const tx = db.transaction(IDB_STORE_HANDLES, 'readwrite');
    tx.objectStore(IDB_STORE_HANDLES).put(handle, IDB_KEY_BACKUP_DIR);
    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = rej;
    });
  } catch (e) {
    console.warn('Could not store directory handle in IndexedDB:', e);
  }
}

/**
 * Retrieves the stored directory handle from IndexedDB
 */
export async function getStoredDirectoryHandle(): Promise<any | null> {
  try {
    const db = await openIdb();
    const tx = db.transaction(IDB_STORE_HANDLES, 'readonly');
    const req = tx.objectStore(IDB_STORE_HANDLES).get(IDB_KEY_BACKUP_DIR);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Removes the stored directory handle from IndexedDB
 */
export async function removeStoredDirectoryHandle(): Promise<void> {
  try {
    const db = await openIdb();
    const tx = db.transaction(IDB_STORE_HANDLES, 'readwrite');
    tx.objectStore(IDB_STORE_HANDLES).delete(IDB_KEY_BACKUP_DIR);
  } catch (e) {
    console.warn('Could not remove directory handle:', e);
  }
}

/**
 * Verifies or requests permission for a directory handle
 */
export async function verifyDirectoryPermission(handle: any, readWrite = true): Promise<boolean> {
  try {
    const options: any = { mode: readWrite ? 'readwrite' : 'read' };
    if ((await handle.queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await handle.requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Opens system folder picker dialog so the user can pick a folder on their PC disk
 */
export async function requestTargetDirectory(): Promise<{
  success: boolean;
  dirName?: string;
  handle?: any;
  error?: string;
}> {
  if (!isFileSystemAccessSupported()) {
    return {
      success: false,
      error: 'Tu navegador actual no soporta selección directa de carpetas en disco con File System Access API. Los respaldos se descargarán automáticamente a tu carpeta de Descargas.',
    };
  }

  try {
    const handle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });

    if (handle) {
      const hasPerm = await verifyDirectoryPermission(handle, true);
      if (!hasPerm) {
        return { success: false, error: 'Permiso de lectura/escritura denegado en la carpeta seleccionada.' };
      }
      await storeDirectoryHandle(handle);
      return {
        success: true,
        dirName: handle.name,
        handle,
      };
    }
    return { success: false, error: 'No se seleccionó ninguna carpeta.' };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Selección de carpeta cancelada por el usuario.' };
    }
    return { success: false, error: err.message || 'Error al seleccionar carpeta.' };
  }
}

/**
 * Saves a backup directly into the user's PC folder (if selected), or falls back to automatic browser download
 */
export async function saveBackupToDiskFolderOrDownload(
  backupData: AppBackupData,
  prefix = 'Advansys_Backup_Diario'
): Promise<{
  success: boolean;
  method: 'direct_folder' | 'browser_download';
  filename: string;
  folderName?: string;
  error?: string;
}> {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `${prefix}_${dateStr}.json`;
  const jsonString = JSON.stringify(backupData, null, 2);

  // 1. Try direct write into local PC directory via File System Access API
  if (isFileSystemAccessSupported()) {
    try {
      const handle = await getStoredDirectoryHandle();
      if (handle) {
        const hasPerm = await verifyDirectoryPermission(handle, true);
        if (hasPerm) {
          const fileHandle = await handle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(jsonString);
          await writable.close();
          return {
            success: true,
            method: 'direct_folder',
            filename,
            folderName: handle.name,
          };
        }
      }
    } catch (e: any) {
      console.warn('Direct disk folder write failed, falling back to browser download:', e);
    }
  }

  // 2. Fallback: Standard browser automatic download into Downloads folder
  try {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return {
      success: true,
      method: 'browser_download',
      filename,
    };
  } catch (err: any) {
    return {
      success: false,
      method: 'browser_download',
      filename,
      error: err.message || 'No se pudo generar el archivo de descarga.',
    };
  }
}

/**
 * Loads the auto-backup configuration from localStorage
 */
export function loadBackupConfig(): AutoBackupConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BACKUP_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_BACKUP_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Error reading backup config from localStorage:', e);
  }
  return DEFAULT_BACKUP_CONFIG;
}

/**
 * Saves auto-backup configuration to localStorage
 */
export function saveBackupConfig(config: AutoBackupConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_BACKUP_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving backup config:', e);
  }
}

/**
 * Formats byte numbers to KB / MB string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Estimates total localStorage usage and health
 */
export function getStorageHealthInfo(): {
  usedBytes: number;
  usedFormatted: string;
  snapshotsCount: number;
  historyCount: number;
  estimatedPercentage: number;
  status: 'healthy' | 'warning' | 'critical';
} {
  let totalBytes = 0;
  let snapshotsCount = 0;
  let historyCount = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2; // UTF-16 approximate bytes
      }
    }
    
    const snapshotsRaw = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
    if (snapshotsRaw) {
      const parsed = JSON.parse(snapshotsRaw);
      if (Array.isArray(parsed)) snapshotsCount = parsed.length;
    }

    const historyRaw = localStorage.getItem('advansys_docgen_history_v1');
    if (historyRaw) {
      const parsed = JSON.parse(historyRaw);
      if (Array.isArray(parsed)) historyCount = parsed.length;
    }
  } catch (e) {
    console.warn('Error calculating storage health:', e);
  }

  // Typically browser localStorage is ~5MB to ~10MB
  const maxQuota = 5 * 1024 * 1024; // 5 MB baseline
  const percentage = Math.min(100, Math.round((totalBytes / maxQuota) * 100));
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (percentage > 85) status = 'critical';
  else if (percentage > 60) status = 'warning';

  return {
    usedBytes: totalBytes,
    usedFormatted: formatBytes(totalBytes),
    snapshotsCount,
    historyCount,
    estimatedPercentage: percentage,
    status,
  };
}

/**
 * Loads all stored snapshots from localStorage
 */
export function loadSnapshots(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    }
  } catch (e) {
    console.error('Error loading snapshots from localStorage:', e);
  }
  return [];
}

/**
 * Saves a new Snapshot into local snapshot storage with smart pruning
 */
export function createAndSaveSnapshot(
  data: AppBackupData,
  trigger: BackupTrigger,
  note?: string,
  maxSnapshots = 15
): BackupSnapshot | null {
  try {
    const nowIso = new Date().toISOString();
    const jsonStr = JSON.stringify(data);
    const sizeBytes = jsonStr.length * 2; // Approximate byte size

    // Extract project titles for quick overview
    const titles = Array.from(
      new Set(
        (data.history || [])
          .map((h) => h.metadata?.nombreProyecto || h.metadata?.ticketNo || '')
          .filter(Boolean)
      )
    ).slice(0, 6);

    if (data.draft?.metadata?.nombreProyecto && !titles.includes(data.draft.metadata.nombreProyecto)) {
      titles.unshift(data.draft.metadata.nombreProyecto);
    }

    const newSnapshot: BackupSnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowIso,
      trigger,
      triggerLabel: getTriggerFriendlyLabel(trigger),
      note: note || undefined,
      isManual: trigger === 'manual',
      stats: {
        totalHistoryItems: data.history?.length || 0,
        hasDraft: Boolean(data.draft),
        hasBranding: Boolean(data.settings),
        sizeBytes,
        projectTitles: titles,
      },
      data,
    };

    const existingSnapshots = loadSnapshots();

    // Prevent duplicate snapshots if exact same data created within last 45 seconds on interval
    if (trigger === 'interval' && existingSnapshots.length > 0) {
      const latest = existingSnapshots[0];
      const diffMs = Date.now() - new Date(latest.timestamp).getTime();
      if (diffMs < 45 * 1000) {
        return null;
      }
    }

    // Combine and smart prune:
    // We retain manual snapshots and prune the oldest automated ones first
    const updated = [newSnapshot, ...existingSnapshots];
    
    // If exceeds maxSnapshots, prune automated snapshots first
    if (updated.length > maxSnapshots) {
      const manualSnapshots = updated.filter((s) => s.isManual);
      const autoSnapshots = updated.filter((s) => !s.isManual);
      
      const allowedAutos = Math.max(2, maxSnapshots - manualSnapshots.length);
      const prunedAutos = autoSnapshots.slice(0, allowedAutos);

      const finalSnapshots = [...manualSnapshots, ...prunedAutos].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(finalSnapshots.slice(0, maxSnapshots)));
    } else {
      localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
    }

    return newSnapshot;
  } catch (err) {
    console.error('Failed to create and save snapshot:', err);
    return null;
  }
}

/**
 * Deletes a single snapshot by ID
 */
export function deleteSnapshot(id: string): BackupSnapshot[] {
  const current = loadSnapshots();
  const filtered = current.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error saving snapshots after deletion:', e);
  }
  return filtered;
}

/**
 * Clears only automated snapshots (keeps manual snapshots unless specified)
 */
export function clearSnapshots(keepManual = true): BackupSnapshot[] {
  const current = loadSnapshots();
  const next = keepManual ? current.filter((s) => s.isManual) : [];
  try {
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(next));
  } catch (e) {
    console.error('Error clearing snapshots:', e);
  }
  return next;
}

/**
 * Downloads a specific snapshot as a JSON file to disk
 */
export function downloadSnapshotAsFile(snapshot: BackupSnapshot): void {
  const dateObj = new Date(snapshot.timestamp);
  const dateStr = `${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getDate()).padStart(2, '0')}_${String(dateObj.getHours()).padStart(2, '0')}${String(dateObj.getMinutes()).padStart(2, '0')}`;
  const tag = snapshot.isManual ? 'Manual' : 'Auto';
  const filename = `Advansys_Snapshot_${tag}_${dateStr}.json`;

  const jsonString = JSON.stringify(snapshot.data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates and triggers a download of a complete JSON backup of the user's data
 */
export function exportAppBackup(
  history: SavedProposal[],
  branding?: BrandingSettings | null,
  draft?: any | null,
  theme?: 'light' | 'dark' | null,
  customPrefix?: string
): void {
  const backup: AppBackupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    appName: 'ADVANSYS Document Generator',
    stats: {
      totalHistoryItems: history.length,
      hasDraft: Boolean(draft),
      hasBranding: Boolean(branding && (branding.logoDataUrl || branding.customTitles)),
    },
    history,
    draft: draft || null,
    settings: branding || null,
    theme: theme || 'light',
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const prefix = customPrefix || 'Advansys_Backup_Historial';
  const filename = `${prefix}_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates and parses a backup JSON string or object
 */
export function parseAndValidateBackup(jsonText: string): {
  success: boolean;
  data?: AppBackupData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonText);
    
    // Direct array of SavedProposal
    if (Array.isArray(parsed)) {
      return {
        success: true,
        data: {
          version: '1.0',
          exportDate: new Date().toISOString(),
          appName: 'ADVANSYS Document Generator',
          stats: {
            totalHistoryItems: parsed.length,
            hasDraft: false,
            hasBranding: false,
          },
          history: parsed,
          draft: null,
          settings: null,
          theme: 'light',
        },
      };
    }

    // Object with history array or nested snapshot
    if (parsed && typeof parsed === 'object') {
      const historyList = Array.isArray(parsed.history) 
        ? parsed.history 
        : Array.isArray(parsed.data?.history) 
          ? parsed.data.history 
          : null;

      if (historyList) {
        const sourceObj = Array.isArray(parsed.history) ? parsed : parsed.data;
        return {
          success: true,
          data: {
            version: '1.0',
            exportDate: sourceObj.exportDate || new Date().toISOString(),
            appName: sourceObj.appName || 'ADVANSYS Document Generator',
            stats: sourceObj.stats || {
              totalHistoryItems: historyList.length,
              hasDraft: Boolean(sourceObj.draft),
              hasBranding: Boolean(sourceObj.settings),
            },
            history: historyList,
            draft: sourceObj.draft || null,
            settings: sourceObj.settings || null,
            theme: sourceObj.theme || 'light',
          },
        };
      }
    }

    return {
      success: false,
      error: 'El archivo no tiene una estructura válida de respaldo de ADVANSYS ni un historial reconocido.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Error al leer el archivo JSON: ${err.message || 'Formato no válido'}`,
    };
  }
}
