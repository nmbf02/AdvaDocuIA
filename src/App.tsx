import React, { useState, useEffect, useRef } from 'react';
import { MetadataHeader, UploadedImage, ProposalSection, SavedProposal, BrandingSettings, DocumentStatus, TechnicalDoc, DEFAULT_DESCARGO_TEXT, FreeNote } from './types';
import { Header } from './components/Header';
import { MetadataForm } from './components/MetadataForm';
import { RequirementsInput } from './components/RequirementsInput';
import { ImageUploader } from './components/ImageUploader';
import { ProposalEditor } from './components/ProposalEditor';
import { TechnicalDocEditor } from './components/TechnicalDocEditor';
import { HistoryModal } from './components/HistoryModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SettingsModal } from './components/SettingsModal';
import { BackupModal } from './components/BackupModal';
import { NewDocumentModal, NewDocumentType } from './components/NewDocumentModal';
import { WelcomeIntro } from './components/WelcomeIntro';
import { FreeWriteWorkspace } from './components/FreeWriteWorkspace';
import { ScrollToTopBubble } from './components/ScrollToTopBubble';
import {
  inferredNoteTitle,
  loadFreeNotesState,
  mergeFreeNotes,
  saveFreeNotesState,
  fireReminderNotification,
} from './utils/freeNotesStorage';
import { ADVANSYS_SAMPLE_METADATA, ADVANSYS_SAMPLE_REQUIREMENTS, ADVANSYS_SAMPLE_IMAGES, EMPTY_MANUAL_PROPOSAL } from './data/presets';
import { createDefaultSlideDeck, convertProposalToSlideDeck } from './utils/slideDeckTemplates';
import { createDefaultTechnicalDoc, proposalHasSubstance, copyLinkedProposalMetadata } from './utils/technicalDocTemplates';
import { 
  AppBackupData, 
  loadBackupConfig, 
  saveBackupConfig, 
  createAndSaveSnapshot, 
  frequencyToMilliseconds,
  shouldRunDailyBackup,
  getTodayDateString,
  exportAppBackup,
  persistBackupToPc,
  fetchDefaultBackupFolder
} from './utils/backupManager';
import { AutoBackupConfig, DEFAULT_BACKUP_CONFIG, BackupSnapshot } from './types';
import { Sparkles, Loader2, FileText, AlertCircle, Cpu, Columns2, ClipboardList, Maximize2, Image as ImageIcon, PenLine, NotebookPen, Layers, X, Check, Database, BellRing } from 'lucide-react';

const STORAGE_KEY_HISTORY = 'advansys_docgen_history_v1';
const STORAGE_KEY_DRAFT = 'advansys_docgen_current_draft_v1';
const STORAGE_KEY_SETTINGS = 'advansys_docgen_settings_v1';
const STORAGE_KEY_THEME = 'advansys_docgen_theme_v1';

const extractBranding = (source?: Partial<BrandingSettings> | null): BrandingSettings => ({
  logoDataUrl: source?.logoDataUrl,
  logoMimeType: source?.logoMimeType,
  logoFileName: source?.logoFileName,
  logoWidth: source?.logoWidth,
  logoHeight: source?.logoHeight,
  page2LogoDataUrl: source?.page2LogoDataUrl,
  page2LogoMimeType: source?.page2LogoMimeType,
  page2LogoFileName: source?.page2LogoFileName,
  page2LogoWidth: source?.page2LogoWidth,
  page2LogoHeight: source?.page2LogoHeight,
  page2LogoMode: source?.page2LogoMode,
  customTitles: source?.customTitles,
});

const stripDocumentLogo = (meta: MetadataHeader): MetadataHeader => {
  const { logoDataUrl, logoMimeType, logoFileName, logoWidth, logoHeight, customTitles, ...rest } = meta;
  return rest;
};

const createEmptyMetadata = (): MetadataHeader => ({
  cliente: '',
  fecha: new Date().toISOString().split('T')[0],
  ticketNo: '',
  guiaNo: '',
  propuestaNo: '',
  nombreProyecto: '',
  moduloAplicacion: '',
  headerBrandTag: 'ADVANSYS',
  headerSubtitle: '',
  footerText: 'Advansys SRL',
  technicalLevel: 7,
  detailLevel: 6,
  paraphraseLevel: 3,
});

const inferSavedDocumentType = (saved: SavedProposal): 'proposal' | 'slides' | 'technical' => {
  if (saved.documentType) return saved.documentType;
  if (saved.content?.technicalDoc?.isStandalone) return 'technical';
  return 'proposal';
};

const linkedProposalLabel = (item: SavedProposal): string => {
  const ticket = item.metadata.ticketNo ? `[${item.metadata.ticketNo}] ` : '';
  const name = item.metadata.nombreProyecto || 'Propuesta';
  return `${ticket}${name} (${item.version || 'v1.0'})`;
};

export default function App() {
  // Form State
  const [metadata, setMetadata] = useState<MetadataHeader>({
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    ticketNo: '',
    guiaNo: '',
    propuestaNo: '',
    nombreProyecto: '',
    moduloAplicacion: '',
    headerBrandTag: 'ADVANSYS',
    headerSubtitle: '',
    footerText: 'Advansys SRL',
    technicalLevel: 7,
    detailLevel: 6,
    paraphraseLevel: 3,
  });

  const [rawRequirements, setRawRequirements] = useState<string>('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  
  // Output State
  const [proposal, setProposal] = useState<ProposalSection | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Save State
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<DocumentStatus>('borrador');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  // Versioning State
  const [currentVersion, setCurrentVersion] = useState<string>('v1.0');
  const [currentVersionNote, setCurrentVersionNote] = useState<string>('');

  // History State
  const [history, setHistory] = useState<SavedProposal[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Backup & Restore State
  const [isBackupOpen, setIsBackupOpen] = useState<boolean>(false);
  const [backupConfig, setBackupConfig] = useState<AutoBackupConfig>(() => loadBackupConfig());
  const [lastAutoBackupTime, setLastAutoBackupTime] = useState<string | null>(null);
  const [showBackupToast, setShowBackupToast] = useState<boolean>(false);
  const [backupToastMessage, setBackupToastMessage] = useState<string>('');

  // Branding / Settings (logo global para todos los documentos)
  const [branding, setBranding] = useState<BrandingSettings>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Confirm Reset Modal State
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState<boolean>(false);
  // Confirm Revert Modal State
  const [isConfirmRevertOpen, setIsConfirmRevertOpen] = useState<boolean>(false);
  // New Document Modal State
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState<boolean>(false);

  // Layout Mode & Tab State
  const [layoutMode, setLayoutMode] = useState<'split' | 'inputs' | 'editor'>('split');
  const [inputTab, setInputTab] = useState<'metadatos' | 'requerimientos' | 'imagenes' | 'all'>('requerimientos');
  const [editorTab, setEditorTab] = useState<'editor' | 'preview' | 'slides' | 'technical'>('editor');
  const [workspaceMode, setWorkspaceMode] = useState<'proposal' | 'technical' | 'notes'>('proposal');
  const [freeNotes, setFreeNotes] = useState<FreeNote[]>([]);
  const [activeFreeNoteId, setActiveFreeNoteId] = useState<string | null>(null);
  const [notesReady, setNotesReady] = useState(false);
  const [reminderAlert, setReminderAlert] = useState<{ id: string; title: string } | null>(null);

  // Theme State ('light' | 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Welcome Intro Screen State (opens first by default)
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  // Load History, Draft, Settings and Theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as 'light' | 'dark' | null;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Optional dark preference detection
        setTheme('dark');
        document.documentElement.classList.add('dark');
      }

      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }

      const savedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
      let draftMetadata: MetadataHeader | undefined;
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.currentDocumentId) setCurrentDocumentId(parsed.currentDocumentId);
        if (parsed.metadata) {
          draftMetadata = parsed.metadata;
          setMetadata(stripDocumentLogo(parsed.metadata));
        }
        if (parsed.rawRequirements !== undefined) setRawRequirements(parsed.rawRequirements);
        if (parsed.images) setImages(parsed.images);
        if (parsed.proposal) setProposal(parsed.proposal);
        if (parsed.version) setCurrentVersion(parsed.version);
        if (parsed.versionNote) setCurrentVersionNote(parsed.versionNote);
        if (parsed.status) setCurrentStatus(parsed.status);
        if (parsed.workspaceMode === 'technical' || parsed.proposal?.technicalDoc?.isStandalone) {
          setWorkspaceMode('technical');
          setEditorTab('technical');
        } else if (parsed.editorTab === 'slides' || parsed.editorTab === 'preview' || parsed.editorTab === 'technical') {
          setEditorTab(parsed.editorTab);
        }
        if (parsed.timestamp) {
          const t = new Date(parsed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSavedTime(t);
        }
      }

      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        setBranding(JSON.parse(savedSettings));
      } else if (draftMetadata?.logoDataUrl) {
        const migrated = extractBranding(draftMetadata);
        setBranding(migrated);
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(migrated));
      }
    } catch (e) {
      console.error("Failed to load initial storage:", e);
    }

    try {
      const loadedNotes = loadFreeNotesState();
      setFreeNotes(loadedNotes.notes);
      setActiveFreeNoteId(loadedNotes.activeId);
    } catch (e) {
      console.error("Failed to load free notes:", e);
    } finally {
      setNotesReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchDefaultBackupFolder().then((folder) => {
      if (cancelled || !folder) return;
      setBackupConfig((prev) => {
        if (prev.targetDirectoryPath) return prev;
        const next = {
          ...prev,
          targetDirectoryPath: folder,
          targetDirectoryName: prev.targetDirectoryName || folder,
        };
        saveBackupConfig(next);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notesReady) return;
    saveFreeNotesState(freeNotes, activeFreeNoteId);
  }, [freeNotes, activeFreeNoteId, notesReady]);

  useEffect(() => {
    if (!notesReady) return;

    const checkReminders = () => {
      setFreeNotes((prev) => {
        const now = Date.now();
        const due = prev.filter(
          (note) =>
            Boolean(note.reminderAt) &&
            !note.reminderDone &&
            !note.reminderFiredAt &&
            new Date(note.reminderAt as string).getTime() <= now
        );
        if (due.length === 0) return prev;
        const first = due[0];
        const firedAt = new Date().toISOString();
        window.setTimeout(() => {
          setReminderAlert({ id: first.id, title: inferredNoteTitle(first) });
          fireReminderNotification('Recordatorio · Libre escritura', inferredNoteTitle(first), first.id);
        }, 0);
        return prev.map((note) =>
          due.some((item) => item.id === note.id) ? { ...note, reminderFiredAt: firedAt } : note
        );
      });
    };

    checkReminders();
    const timer = window.setInterval(checkReminders, 15000);
    return () => window.clearInterval(timer);
  }, [notesReady]);

  const handleToggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY_THEME, nextTheme);
      } catch (e) {
        console.error("Failed to save theme:", e);
      }
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return nextTheme;
    });
  };

  const brandedMetadata: MetadataHeader = { ...metadata, ...branding };

  const handleBrandingChange = (updated: BrandingSettings) => {
    setBranding(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  const handleUpdateBackupConfig = (newConfig: AutoBackupConfig) => {
    setBackupConfig(newConfig);
    saveBackupConfig(newConfig);
  };

  // Keep latest snapshot of all reactive state in a ref to avoid resetting timer intervals on every keystroke
  const latestStateRef = useRef({
    history,
    proposal,
    rawRequirements,
    metadata,
    images,
    branding,
    currentDocumentId,
    currentVersion,
    currentVersionNote,
    currentStatus,
    workspaceMode,
    editorTab,
    theme,
    freeNotes,
    backupConfig,
  });

  useEffect(() => {
    latestStateRef.current = {
      history,
      proposal,
      rawRequirements,
      metadata,
      images,
      branding,
      currentDocumentId,
      currentVersion,
      currentVersionNote,
      currentStatus,
      workspaceMode,
      editorTab,
      theme,
      freeNotes,
      backupConfig,
    };
  });

  // Helper to compile current AppBackupData
  const getFullBackupPayload = (customState?: typeof latestStateRef.current): AppBackupData => {
    const s = customState || latestStateRef.current;
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      appName: 'ADVANSYS Document Generator',
      stats: {
        totalHistoryItems: s.history.length,
        hasDraft: Boolean(s.proposal),
        hasBranding: Boolean(s.branding && (s.branding.logoDataUrl || s.branding.customTitles)),
      },
      history: s.history,
      draft: s.proposal
        ? {
            currentDocumentId: s.currentDocumentId,
            metadata: s.metadata,
            rawRequirements: s.rawRequirements,
            images: s.images,
            proposal: s.proposal,
            version: s.currentVersion,
            versionNote: s.currentVersionNote,
            status: s.currentStatus,
            workspaceMode: s.workspaceMode,
            editorTab: s.editorTab,
            timestamp: new Date().toISOString(),
          }
        : null,
      settings: s.branding || null,
      theme: s.theme || 'light',
      freeNotes: s.freeNotes,
    };
  };

  // 1. Real-time Debounced Auto-Save for Active Document & Draft
  useEffect(() => {
    if (!proposal && !rawRequirements.trim()) return;

    const draftTimer = setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const targetDocId = currentDocumentId || `prop-${Date.now()}`;
      if (!currentDocumentId) {
        setCurrentDocumentId(targetDocId);
      }

      const draft = {
        currentDocumentId: targetDocId,
        metadata,
        rawRequirements,
        images,
        proposal,
        version: currentVersion,
        versionNote: currentVersionNote,
        status: currentStatus,
        workspaceMode,
        editorTab,
        timestamp: now.toISOString(),
      };

      try {
        localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(draft));
        setLastSavedTime(timeStr);
      } catch (e) {
        console.error("Failed to auto-save draft:", e);
      }
    }, 1000);

    return () => clearTimeout(draftTimer);
  }, [
    proposal,
    rawRequirements,
    metadata,
    images,
    currentDocumentId,
    currentVersion,
    currentVersionNote,
    currentStatus,
    workspaceMode,
    editorTab,
  ]);

  // 2. Automated Periodic Backup Scheduler (Interval-based Snapshots)
  useEffect(() => {
    if (!backupConfig.enabled || backupConfig.frequency === 'off') return;

    const intervalMs = frequencyToMilliseconds(backupConfig.frequency);
    if (intervalMs <= 0) return;

    const runIntervalBackup = async () => {
      const s = latestStateRef.current;
      if (s.history.length === 0 && !s.proposal && !s.rawRequirements.trim() && s.freeNotes.length === 0) return;

      const payload = getFullBackupPayload(s);
      const snap = createAndSaveSnapshot(
        payload,
        'interval',
        `Automático (${s.backupConfig.frequency})`,
        s.backupConfig.maxSnapshots
      );

      if (!snap) return;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastAutoBackupTime(timeStr);

      let diskNotice = '';
      const disk = await persistBackupToPc(
        payload,
        `Advansys_Backup_Auto_${s.backupConfig.frequency}`,
        {
          directoryPath: s.backupConfig.targetDirectoryPath || s.backupConfig.targetDirectoryName,
          allowBrowserDownload: false,
        }
      );
      if (disk.success) {
        diskNotice = disk.fullPath ? ` en ${disk.fullPath}` : ` en "${disk.folderName}"`;
      } else if (disk.error && s.backupConfig.showNotificationToast) {
        setBackupToastMessage(`Autoguardado en el navegador. Disco: ${disk.error}`);
        setShowBackupToast(true);
        setTimeout(() => setShowBackupToast(false), 4000);
        return;
      }

      if (s.backupConfig.showNotificationToast) {
        setBackupToastMessage(`Copia de seguridad automática${diskNotice} (${timeStr})`);
        setShowBackupToast(true);
        setTimeout(() => setShowBackupToast(false), 2500);
      }
    };

    const startupTimer = window.setTimeout(runIntervalBackup, 1500);
    const intervalTimer = window.setInterval(runIntervalBackup, intervalMs);

    return () => {
      window.clearTimeout(startupTimer);
      window.clearInterval(intervalTimer);
    };
  }, [backupConfig.enabled, backupConfig.frequency, backupConfig.maxSnapshots, backupConfig.targetDirectoryPath]);

  // 3. Automated Daily Scheduled Backup Runner
  useEffect(() => {
    if (!backupConfig.dailyScheduleEnabled || !backupConfig.dailyScheduleTime) return;

    const checkDailyBackup = async () => {
      const s = latestStateRef.current;
      const currentConfig = s.backupConfig;
      if (!currentConfig.dailyScheduleEnabled || !currentConfig.dailyScheduleTime) return;

      if (shouldRunDailyBackup(currentConfig)) {
        const todayStr = getTodayDateString();
        const payload = getFullBackupPayload(s);
        const snap = createAndSaveSnapshot(
          payload,
          'daily_schedule',
          `Copia diaria programada (${currentConfig.dailyScheduleTime})`,
          currentConfig.maxSnapshots
        );

        if (snap) {
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastAutoBackupTime(timeStr);

          let diskSavedNotice = '';
          let diskOk = true;
          try {
            const res = await persistBackupToPc(
              payload,
              `Advansys_Backup_Diario_${currentConfig.dailyScheduleTime.replace(':', '')}`,
              {
                directoryPath: currentConfig.targetDirectoryPath || currentConfig.targetDirectoryName,
                allowBrowserDownload: false,
              }
            );
            if (res.success) {
              diskSavedNotice = res.fullPath ? ` en ${res.fullPath}` : ` en "${res.folderName}"`;
            } else {
              diskOk = false;
            }
          } catch (err) {
            diskOk = false;
            console.warn('Error saving daily backup to disk folder:', err);
          }

          if (diskOk) {
            const updatedConfig = {
              ...currentConfig,
              lastDailyBackupDate: todayStr,
              lastDailyBackupClock: timeStr,
            };
            setBackupConfig(updatedConfig);
            saveBackupConfig(updatedConfig);
          }

          if (currentConfig.showNotificationToast) {
            setBackupToastMessage(
              diskOk
                ? `Copia diaria programada guardada${diskSavedNotice} (${currentConfig.dailyScheduleTime})`
                : 'Copia diaria lista en el navegador. Abre Copias / Backup para confirmar la carpeta del PC.'
            );
            setShowBackupToast(true);
            setTimeout(() => setShowBackupToast(false), 4000);
          }
        }
      }
    };

    // Run check immediately
    checkDailyBackup();

    // Check every 20 seconds
    const dailyTimer = setInterval(checkDailyBackup, 20000);

    return () => clearInterval(dailyTimer);
  }, [
    backupConfig.dailyScheduleEnabled,
    backupConfig.dailyScheduleTime,
    backupConfig.targetDirectoryPath,
    backupConfig.maxSnapshots,
    backupConfig.lastDailyBackupDate,
    backupConfig.dailyAutoDownloadJson,
    backupConfig.autoDownloadDailyToDisk,
  ]);

  // Save Changes Helper - Updates the current document in-place WITHOUT creating duplicate files
  const handleSaveChanges = () => {
    if (!proposal) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSavedTime(timeStr);
    
    // Use or create stable document ID
    const targetDocId = currentDocumentId || `prop-${Date.now()}`;
    if (!currentDocumentId) {
      setCurrentDocumentId(targetDocId);
    }

    const draft = {
      currentDocumentId: targetDocId,
      metadata,
      rawRequirements,
      images,
      proposal,
      version: currentVersion,
      versionNote: currentVersionNote,
      status: currentStatus,
      workspaceMode,
      editorTab,
      timestamp: now.toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(draft));
      saveToHistory(proposal, currentVersion, currentVersionNote, targetDocId, false);
      
      // Auto-trigger snapshot on save if configured
      if (backupConfig.enabled && backupConfig.backupOnSave) {
        const payload = getFullBackupPayload();
        createAndSaveSnapshot(
          payload,
          'on_save',
          `Al guardar: ${metadata.nombreProyecto || metadata.ticketNo || 'Documento'}`,
          backupConfig.maxSnapshots
        );
      }

      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (e) {
      console.error("Failed to save draft:", e);
    }
  };

  // Save History helper (handles in-place overwrite vs explicit new version)
  const saveToHistory = (
    newProposal: ProposalSection,
    customVersion?: string,
    customNote?: string,
    targetDocId?: string,
    isNewVersionExplicit = false
  ) => {
    const versionLabel = customVersion || currentVersion || 'v1.0';
    const noteLabel = customNote !== undefined ? customNote : currentVersionNote;
    const nowIso = new Date().toISOString();

    const documentType: SavedProposal['documentType'] =
      workspaceMode === 'technical' ? 'technical' : editorTab === 'slides' ? 'slides' : 'proposal';

    if (isNewVersionExplicit) {
      // Create a brand new document / version entry
      const newEntryId = `prop-${Date.now()}`;
      setCurrentDocumentId(newEntryId);
      const newEntry: SavedProposal = {
        id: newEntryId,
        version: versionLabel,
        versionNote: noteLabel,
        status: currentStatus || 'borrador',
        timestamp: nowIso,
        metadata,
        content: newProposal,
        images,
        rawRequirements,
        documentType,
        technicalDoc: newProposal.technicalDoc,
        linkedProposalId: newProposal.technicalDoc?.linkedProposalId,
        linkedProposalName: newProposal.technicalDoc?.linkedProposalName,
      };
      const updatedHistory = [newEntry, ...history.filter(h => h.id !== newEntryId).slice(0, 49)];
      setHistory(updatedHistory);
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("Failed to save history:", e);
      }
      return;
    }

    // Normal Save in-place:
    const docIdToUse = targetDocId || currentDocumentId || `prop-${Date.now()}`;
    if (!currentDocumentId) {
      setCurrentDocumentId(docIdToUse);
    }

    const existingIndex = history.findIndex(h => h.id === docIdToUse);
    let updatedHistory: SavedProposal[];

    if (existingIndex >= 0) {
      // Overwrite the existing document in place - KEEP same id and status
      const updatedItem: SavedProposal = {
        ...history[existingIndex],
        version: versionLabel,
        versionNote: noteLabel,
        status: history[existingIndex].status || currentStatus || 'borrador',
        statusChangedAt: history[existingIndex].statusChangedAt,
        timestamp: nowIso,
        metadata,
        content: newProposal,
        images,
        rawRequirements,
        documentType: history[existingIndex].documentType || documentType,
        technicalDoc: newProposal.technicalDoc,
        linkedProposalId: newProposal.technicalDoc?.linkedProposalId,
        linkedProposalName: newProposal.technicalDoc?.linkedProposalName,
      };
      updatedHistory = [...history];
      updatedHistory[existingIndex] = updatedItem;
    } else {
      // First save for this new document
      const newEntry: SavedProposal = {
        id: docIdToUse,
        version: versionLabel,
        versionNote: noteLabel,
        status: currentStatus || 'borrador',
        timestamp: nowIso,
        metadata,
        content: newProposal,
        images,
        rawRequirements,
        documentType,
        technicalDoc: newProposal.technicalDoc,
        linkedProposalId: newProposal.technicalDoc?.linkedProposalId,
        linkedProposalName: newProposal.technicalDoc?.linkedProposalName,
      };
      updatedHistory = [newEntry, ...history.slice(0, 49)];
    }

    setHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  };

  const persistCurrentDocumentIfNeeded = () => {
    if (!proposal) return;
    const hasMeta = Boolean(
      metadata.nombreProyecto.trim() || metadata.cliente.trim() || metadata.ticketNo.trim()
    );
    const hasBody = Boolean(
      proposal.resumenEjecutivo?.trim() ||
      proposal.objetivo?.trim() ||
      proposal.slideDeck ||
      rawRequirements.trim() ||
      (proposal.technicalDoc && (hasMeta || proposal.technicalDoc.linkedProposalId))
    );
    if (!hasMeta && !hasBody) return;
    const targetDocId = currentDocumentId || `prop-${Date.now()}`;
    saveToHistory(proposal, currentVersion, currentVersionNote, targetDocId, false);
  };

  const applySavedDocument = (saved: SavedProposal) => {
    // If switching documents and auto-backup on switch is enabled, take a snapshot of current draft
    if (backupConfig.enabled && backupConfig.backupOnDocumentSwitch && proposal && currentDocumentId !== saved.id) {
      const payload = getFullBackupPayload();
      createAndSaveSnapshot(
        payload,
        'on_switch',
        `Antes de cambiar a: ${saved.metadata?.nombreProyecto || saved.id}`,
        backupConfig.maxSnapshots
      );
    }

    setCurrentDocumentId(saved.id);
    setCurrentStatus(saved.status || 'borrador');
    setMetadata(stripDocumentLogo(saved.metadata));
    setRawRequirements(saved.rawRequirements || '');
    setImages(saved.images || []);
    setProposal(saved.content);
    setCurrentVersion(saved.version || 'v1.0');
    setCurrentVersionNote(saved.versionNote || '');
    const docType = inferSavedDocumentType(saved);
    if (docType === 'technical') {
      setWorkspaceMode('technical');
      setEditorTab('technical');
      setLayoutMode('editor');
    } else {
      setWorkspaceMode('proposal');
      setEditorTab(docType === 'slides' ? 'slides' : 'editor');
    }
    setShowWelcome(false);
    setIsHistoryOpen(false);
  };

  // Update proposal status handler (e.g. Borrador -> Finalizado / Culminado)
  const handleUpdateProposalStatus = (id: string, status: DocumentStatus) => {
    const nowIso = new Date().toISOString();
    const updated = history.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status,
          statusChangedAt: nowIso,
        };
      }
      return item;
    });
    setHistory(updated);
    if (currentDocumentId === id) {
      setCurrentStatus(status);
    }
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to update proposal status:", e);
    }
  };

  // Save as new version (when user explicitly creates a new version)
  const handleSaveNewVersion = (versionTag: string, versionNote: string) => {
    if (!proposal) return;
    setCurrentVersion(versionTag);
    setCurrentVersionNote(versionNote);
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSavedTime(timeStr);

    saveToHistory(proposal, versionTag, versionNote, undefined, true);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Duplicate proposal version helper
  const handleDuplicateProposal = (item: SavedProposal) => {
    const srcVersion = item.version || 'v1.0';
    let newVersionLabel = `${srcVersion}-Copia`;
    
    // Auto-calculate version number if standard v1.0
    if (srcVersion.startsWith('v')) {
      const parts = srcVersion.replace('v', '').split('.');
      const major = parseInt(parts[0]) || 1;
      newVersionLabel = `v${major + 1}.0`;
    }

    const newEntryId = `prop-${Date.now()}`;
    const newEntry: SavedProposal = {
      id: newEntryId,
      version: newVersionLabel,
      versionNote: `Duplicado derivado de ${srcVersion}`,
      timestamp: new Date().toISOString(),
      metadata: { ...item.metadata },
      content: JSON.parse(JSON.stringify(item.content)),
      images: [...(item.images || [])],
      rawRequirements: item.rawRequirements || '',
      documentType: inferSavedDocumentType(item),
      technicalDoc: item.technicalDoc || item.content?.technicalDoc,
      linkedProposalId: item.linkedProposalId,
      linkedProposalName: item.linkedProposalName,
    };

    const updated = [newEntry, ...history];
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save duplicated version:", e);
    }

    // Load duplicated item into active workspace editor
    applySavedDocument(newEntry);

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Restore Backup handler (Merge or Replace)
  const handleRestoreBackup = (backup: AppBackupData, mode: 'merge' | 'replace') => {
    let nextHistory: SavedProposal[] = [];

    if (mode === 'replace') {
      nextHistory = backup.history || [];
    } else {
      // Merge mode: add imported items, updating existing IDs or keeping newest
      const existingMap = new Map<string, SavedProposal>();
      // First put existing
      history.forEach((h) => existingMap.set(h.id, h));
      // Overwrite/add with backup items
      (backup.history || []).forEach((h) => existingMap.set(h.id, h));
      nextHistory = Array.from(existingMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    setHistory(nextHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(nextHistory));
    } catch (e) {
      console.error("Failed to save restored history:", e);
    }

    // Restore Branding / Settings if present
    if (backup.settings) {
      setBranding(backup.settings);
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(backup.settings));
      } catch (e) {
        console.error("Failed to save restored settings:", e);
      }
    }

    // Restore Theme if present
    if (backup.theme) {
      setTheme(backup.theme);
      try {
        localStorage.setItem(STORAGE_KEY_THEME, backup.theme);
      } catch (e) {
        console.error("Failed to save restored theme:", e);
      }
      if (backup.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // If replace mode and draft was provided, restore current draft or first history item
    if (backup.draft && mode === 'replace') {
      const d = backup.draft;
      if (d.currentDocumentId) setCurrentDocumentId(d.currentDocumentId);
      if (d.metadata) setMetadata(stripDocumentLogo(d.metadata));
      if (d.rawRequirements !== undefined) setRawRequirements(d.rawRequirements);
      if (d.images) setImages(d.images);
      if (d.proposal) setProposal(d.proposal);
      if (d.version) setCurrentVersion(d.version);
      if (d.versionNote) setCurrentVersionNote(d.versionNote);
      if (d.status) setCurrentStatus(d.status as DocumentStatus);
      if (d.workspaceMode === 'technical' || d.proposal?.technicalDoc?.isStandalone) {
        setWorkspaceMode('technical');
        setEditorTab('technical');
      } else if (d.editorTab === 'slides' || d.editorTab === 'preview' || d.editorTab === 'technical') {
        setEditorTab(d.editorTab as any);
      }
      try {
        localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(d));
      } catch (e) {
        console.error("Failed to save restored draft:", e);
      }
    } else if (mode === 'replace' && nextHistory.length > 0 && !proposal) {
      applySavedDocument(nextHistory[0]);
    }

    if (Array.isArray(backup.freeNotes)) {
      const nextNotes = mode === 'replace' ? backup.freeNotes : mergeFreeNotes(freeNotes, backup.freeNotes);
      setFreeNotes(nextNotes);
      setActiveFreeNoteId(nextNotes[0]?.id ?? null);
      saveFreeNotesState(nextNotes, nextNotes[0]?.id ?? null);
    }

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 4000);
  };

  // Preset Loader
  const handleLoadPreset = () => {
    setMetadata(ADVANSYS_SAMPLE_METADATA);
    setRawRequirements(ADVANSYS_SAMPLE_REQUIREMENTS);
    setImages(ADVANSYS_SAMPLE_IMAGES);
    setError(null);
  };

  // Reset Form
  const handleReset = () => {
    setIsConfirmResetOpen(true);
  };

  const handleConfirmReset = () => {
    setCurrentDocumentId(null);
    setMetadata(createEmptyMetadata());
    setRawRequirements('');
    setImages([]);
    setProposal(null);
    setError(null);
    setWorkspaceMode('proposal');
    setEditorTab('editor');
    setIsConfirmResetOpen(false);
  };

  // Target saved proposal to revert to
  const getLastSavedTarget = (): SavedProposal | null => {
    if (currentDocumentId) {
      const match = history.find(h => h.id === currentDocumentId);
      if (match) return match;
    }
    if (history.length > 0) {
      return history[0];
    }
    try {
      const draftStr = localStorage.getItem(STORAGE_KEY_DRAFT);
      if (draftStr) {
        const d = JSON.parse(draftStr);
        if (d.proposal) {
          return {
            id: d.currentDocumentId || `prop-${Date.now()}`,
            version: d.version || 'v1.0',
            versionNote: d.versionNote || '',
            status: d.status || 'borrador',
            timestamp: d.timestamp || new Date().toISOString(),
            metadata: d.metadata,
            content: d.proposal,
            images: d.images || [],
            rawRequirements: d.rawRequirements || ''
          };
        }
      }
    } catch (e) {
      console.error("Error reading last saved draft:", e);
    }
    return null;
  };

  const hasSavedVersionAvailable = Boolean(getLastSavedTarget());

  const handleRequestRevertToLastSaved = () => {
    const target = getLastSavedTarget();
    if (!target) return;
    setIsConfirmRevertOpen(true);
  };

  const handleConfirmRevert = () => {
    const target = getLastSavedTarget();
    if (!target) {
      setIsConfirmRevertOpen(false);
      return;
    }

    setCurrentDocumentId(target.id);
    setCurrentStatus(target.status || 'borrador');
    setMetadata(stripDocumentLogo(target.metadata));
    setRawRequirements(target.rawRequirements || '');
    setImages(target.images || []);
    setProposal(JSON.parse(JSON.stringify(target.content)));
    setCurrentVersion(target.version || 'v1.0');
    setCurrentVersionNote(target.versionNote || '');

    if (target.timestamp) {
      const d = new Date(target.timestamp);
      setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }

    setIsConfirmRevertOpen(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Manual Proposal Initialization
  const handleStartManualDraft = () => {
    const newDocId = `prop-${Date.now()}`;
    setCurrentDocumentId(newDocId);
    setWorkspaceMode('proposal');
    setEditorTab('editor');
    const configuredDescargo = branding.customTitles?.defaultDescargo?.trim() || DEFAULT_DESCARGO_TEXT;
    setProposal({
      ...EMPTY_MANUAL_PROPOSAL,
      descargo: configuredDescargo,
    });
    setError(null);
  };

  // Generate Proposal API Handler
  const handleGenerateProposal = async () => {
    if (!rawRequirements.trim()) {
      setError("Por favor ingresa los requerimientos en bruto o notas del cliente antes de generar la propuesta.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGenerationStep("Leyendo tus notas y datos del documento...");

    try {
      setGenerationStep("Armando el borrador de la propuesta...");
      
      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata,
          rawRequirements,
          images
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "No se pudo generar la propuesta. Revisa la clave GEMINI_API_KEY.");
      }

      setGenerationStep("Revisando secciones y referencias de imágenes...");
      const docIdToUse = currentDocumentId || `prop-${Date.now()}`;
      if (!currentDocumentId) {
        setCurrentDocumentId(docIdToUse);
      }
      setProposal({ ...data.proposal, tables: proposal?.tables || [] });
      saveToHistory(data.proposal, currentVersion, currentVersionNote, docIdToUse, false);

    } catch (err: any) {
      console.error("Error generating proposal:", err);
      setError(err?.message || "Ocurrió un error inesperado al comunicarse con el servidor.");
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Helper to check if the current active document has substantial content
  const currentDocumentHasSubstance = (): boolean => {
    const hasMeta = Boolean(
      metadata.nombreProyecto?.trim() ||
      metadata.cliente?.trim() ||
      metadata.ticketNo?.trim() ||
      metadata.moduloAplicacion?.trim() ||
      metadata.propuestaNo?.trim() ||
      metadata.guiaNo?.trim() ||
      rawRequirements?.trim() ||
      (images && images.length > 0)
    );
    const hasBody = Boolean(
      proposal && (
        proposal.resumenEjecutivo?.trim() ||
        proposal.objetivo?.trim() ||
        proposal.alcance?.trim() ||
        proposal.slideDeck ||
        (proposal.technicalDoc && (
          proposal.technicalDoc.flujoOperativo?.trim() ||
          proposal.technicalDoc.diseno?.trim() ||
          proposal.technicalDoc.ruta?.trim() ||
          proposal.technicalDoc.tablas?.trim() ||
          proposal.technicalDoc.programas?.trim() ||
          proposal.technicalDoc.linkedProposalId
        ))
      )
    );
    return hasMeta || hasBody;
  };

  const handleOpenNewDocumentModal = () => {
    setIsNewDocModalOpen(true);
  };

  const handleConfirmNewDocument = (docType: NewDocumentType, shouldSaveCurrent: boolean) => {
    if (shouldSaveCurrent && proposal) {
      handleSaveChanges();
    }

    if (docType === 'technical') {
      const emptyMeta = createEmptyMetadata();
      setMetadata(emptyMeta);
      setRawRequirements('');
      setImages([]);
      const defaultTech = {
        ...createDefaultTechnicalDoc(emptyMeta, null),
        isStandalone: true,
      };
      const docId = `tech_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setCurrentDocumentId(docId);
      setCurrentVersion('v1.0');
      setCurrentVersionNote('');
      setCurrentStatus('borrador');
      setProposal({
        ...EMPTY_MANUAL_PROPOSAL,
        technicalDoc: defaultTech,
      });
      setWorkspaceMode('technical');
      setEditorTab('technical');
      setLayoutMode('editor');
      setError(null);
      setShowWelcome(false);
    } else if (docType === 'slides') {
      const emptyMeta = createEmptyMetadata();
      setMetadata(emptyMeta);
      setRawRequirements('');
      setImages([]);
      setCurrentVersion('v1.0');
      setCurrentVersionNote('');
      setCurrentStatus('borrador');
      setWorkspaceMode('proposal');
      setEditorTab('slides');
      setLayoutMode('split');
      const initialDeck = createDefaultSlideDeck(emptyMeta, []);
      const docId = `prop-${Date.now()}`;
      setCurrentDocumentId(docId);
      setProposal({
        ...EMPTY_MANUAL_PROPOSAL,
        slideDeck: initialDeck,
      });
      setError(null);
      setShowWelcome(false);
    } else {
      // Standard proposal
      setCurrentDocumentId(null);
      setMetadata(createEmptyMetadata());
      setRawRequirements('');
      setImages([]);
      setProposal(null);
      setCurrentVersion('v1.0');
      setCurrentVersionNote('');
      setCurrentStatus('borrador');
      setWorkspaceMode('proposal');
      setEditorTab('editor');
      setLayoutMode('split');
      setError(null);
      setShowWelcome(false);
    }

    setIsNewDocModalOpen(false);
  };

  // Welcome Screen Action Handlers
  const handleStartNewFromWelcome = () => {
    persistCurrentDocumentIfNeeded();
    setCurrentDocumentId(null);
    setMetadata(createEmptyMetadata());
    setRawRequirements('');
    setImages([]);
    setProposal(null);
    setCurrentVersion('v1.0');
    setCurrentVersionNote('');
    setCurrentStatus('borrador');
    setWorkspaceMode('proposal');
    setEditorTab('editor');
    setLayoutMode('split');
    setError(null);
    setShowWelcome(false);
  };

  const handleStartSlidesFromWelcome = () => {
    persistCurrentDocumentIfNeeded();
    setMetadata(createEmptyMetadata());
    setRawRequirements('');
    setImages([]);
    setCurrentVersion('v1.0');
    setCurrentVersionNote('');
    setCurrentStatus('borrador');
    setWorkspaceMode('proposal');
    setEditorTab('slides');
    setLayoutMode('split');
    const initialDeck = createDefaultSlideDeck(createEmptyMetadata(), []);
    const docId = `prop-${Date.now()}`;
    setCurrentDocumentId(docId);
    setProposal({
      ...EMPTY_MANUAL_PROPOSAL,
      slideDeck: initialDeck,
    });
    setError(null);
    setShowWelcome(false);
  };

  const handleStartStandaloneTechnicalDoc = (options?: { resetFields?: boolean }) => {
    persistCurrentDocumentIfNeeded();
    const emptyMeta = createEmptyMetadata();
    const meta = options?.resetFields ? emptyMeta : metadata;
    if (options?.resetFields) {
      setMetadata(emptyMeta);
      setRawRequirements('');
      setImages([]);
    }
    const defaultTech = {
      ...createDefaultTechnicalDoc(meta, null),
      isStandalone: true,
    };
    const docId = `tech_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setCurrentDocumentId(docId);
    setCurrentVersion('v1.0');
    setCurrentVersionNote('');
    setCurrentStatus('borrador');
    setProposal({
      ...EMPTY_MANUAL_PROPOSAL,
      technicalDoc: defaultTech,
    });
    setWorkspaceMode('technical');
    setEditorTab('technical');
    setLayoutMode('editor');
    setError(null);
    setShowWelcome(false);
  };

  const handleStartTechnicalDocFromWelcome = () => {
    handleStartStandaloneTechnicalDoc({ resetFields: true });
  };

  const leaveNotesForDocuments = () => {
    setWorkspaceMode((mode) =>
      mode === 'notes'
        ? (proposal?.technicalDoc?.isStandalone ? 'technical' : 'proposal')
        : mode
    );
  };

  const handleContinueDraftFromWelcome = () => {
    leaveNotesForDocuments();
    setShowWelcome(false);
  };

  const handleOpenFreeWrite = (noteId?: string) => {
    setWorkspaceMode('notes');
    if (noteId) setActiveFreeNoteId(noteId);
    setShowWelcome(false);
  };

  const handleOpenReminderAlert = () => {
    if (!reminderAlert) return;
    setActiveFreeNoteId(reminderAlert.id);
    setWorkspaceMode('notes');
    setShowWelcome(false);
    setReminderAlert(null);
  };

  const handleLoadHistoryFromWelcome = (saved: SavedProposal) => {
    applySavedDocument(saved);
  };

  const handleLoadPresetFromWelcome = () => {
    persistCurrentDocumentIfNeeded();
    handleLoadPreset();
    setWorkspaceMode('proposal');
    setEditorTab('editor');
    setShowWelcome(false);
  };

  const handleLinkTechnicalToProposal = (selected: SavedProposal, syncContext: boolean) => {
    if (!proposal) return;
    const currentTech = proposal.technicalDoc || createDefaultTechnicalDoc(metadata, proposal);
    const linkedName = linkedProposalLabel(selected);
    const nextMeta = copyLinkedProposalMetadata(metadata, selected.metadata);
    setMetadata(stripDocumentLogo(nextMeta));

    let nextTech: TechnicalDoc = {
      ...currentTech,
      linkedProposalId: selected.id,
      linkedProposalName: linkedName,
      isStandalone: workspaceMode === 'technical',
      lastUpdated: new Date().toISOString(),
    };

    if (syncContext && selected.content) {
      const seeded = createDefaultTechnicalDoc(nextMeta, selected.content);
      nextTech = {
        ...nextTech,
        flujoOperativo: seeded.flujoOperativo,
        diseno: seeded.diseno,
      };
    }

    const nextProposal = { ...proposal, technicalDoc: nextTech };
    setProposal(nextProposal);

    const techDocId = currentDocumentId;
    let nextHistory = history.map((h) => {
      if (h.id === selected.id) {
        return {
          ...h,
          technicalDoc: nextTech,
          linkedTechnicalDocId: techDocId || undefined,
          content: { ...h.content, technicalDoc: nextTech },
        };
      }
      if (techDocId && h.id === techDocId) {
        return {
          ...h,
          documentType: workspaceMode === 'technical' ? 'technical' as const : h.documentType,
          linkedProposalId: selected.id,
          linkedProposalName: linkedName,
          technicalDoc: nextTech,
          content: { ...h.content, technicalDoc: nextTech },
          metadata: { ...h.metadata, ...stripDocumentLogo(nextMeta) },
        };
      }
      return h;
    });

    if (techDocId && !nextHistory.some((h) => h.id === techDocId)) {
      nextHistory = [
        {
          id: techDocId,
          version: currentVersion || 'v1.0',
          versionNote: currentVersionNote,
          status: currentStatus || 'borrador',
          timestamp: new Date().toISOString(),
          metadata: nextMeta,
          content: nextProposal,
          images,
          rawRequirements,
          documentType: workspaceMode === 'technical' ? 'technical' as const : 'proposal',
          technicalDoc: nextTech,
          linkedProposalId: selected.id,
          linkedProposalName: linkedName,
        },
        ...nextHistory,
      ];
    }

    setHistory(nextHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(nextHistory));
    } catch (e) {
      console.error('Failed to persist technical doc link:', e);
    }
  };

  const handleUnlinkTechnicalFromProposal = () => {
    if (!proposal?.technicalDoc) return;
    const linkedId = proposal.technicalDoc.linkedProposalId;
    const nextTech: TechnicalDoc = {
      ...proposal.technicalDoc,
      linkedProposalId: undefined,
      linkedProposalName: undefined,
      isStandalone: true,
      lastUpdated: new Date().toISOString(),
    };
    setProposal({ ...proposal, technicalDoc: nextTech });
    const techDocId = currentDocumentId;
    const updatedHistory = history.map((h) => {
      if (techDocId && h.id === techDocId) {
        return {
          ...h,
          linkedProposalId: undefined,
          linkedProposalName: undefined,
          technicalDoc: nextTech,
          content: { ...h.content, technicalDoc: nextTech },
        };
      }
      if (linkedId && h.id === linkedId) {
        return { ...h, linkedTechnicalDocId: undefined };
      }
      return h;
    });
    setHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to persist technical doc unlink:', e);
    }
  };

  const handleOpenLinkedProposal = () => {
    const linkedId = proposal?.technicalDoc?.linkedProposalId;
    if (!linkedId) return;
    const saved = history.find((h) => h.id === linkedId);
    if (saved) applySavedDocument(saved);
  };

  const hasActiveDraft = Boolean(
    proposal !== null ||
    (metadata.nombreProyecto && metadata.nombreProyecto.trim().length > 0) ||
    rawRequirements.trim().length > 0
  );

  const hasDatos = Boolean(
    metadata.cliente.trim() || metadata.ticketNo.trim() || metadata.nombreProyecto.trim()
  );
  const hasNotas = Boolean(rawRequirements.trim());

  const backupToastEl = showBackupToast ? (
    <div className="fixed bottom-4 right-4 z-[70] bg-[#0A3D62] text-white px-3.5 py-2 rounded-xl shadow-lg border border-emerald-400/40 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
      <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse"></span>
      <Database className="w-4 h-4 text-[#2ECC71]" />
      <span>{backupToastMessage || 'Copia de seguridad guardada'}</span>
    </div>
  ) : null;

  // Render Welcome Intro screen first if active
  if (showWelcome) {
    return (
      <>
        <WelcomeIntro
          hasActiveDraft={hasActiveDraft}
          draftInfo={{
            nombreProyecto: metadata.nombreProyecto || (
              proposal?.technicalDoc?.isStandalone
                ? 'Doc. técnica en desarrollo'
                : proposal
                  ? 'Propuesta en desarrollo'
                  : undefined
            ),
            cliente: metadata.cliente,
            moduloAplicacion: metadata.moduloAplicacion,
            version: currentVersion,
            lastSavedTime: lastSavedTime,
          }}
          history={history}
          logoDataUrl={branding.logoDataUrl}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onStartNew={handleStartNewFromWelcome}
          onStartSlides={handleStartSlidesFromWelcome}
          onStartTechnicalDoc={handleStartTechnicalDocFromWelcome}
          onContinueDraft={handleContinueDraftFromWelcome}
          onLoadHistoryItem={handleLoadHistoryFromWelcome}
          onLoadPreset={handleLoadPresetFromWelcome}
          onOpenHistoryModal={() => {
            leaveNotesForDocuments();
            setShowWelcome(false);
            setIsHistoryOpen(true);
          }}
          onOpenBackup={() => setIsBackupOpen(true)}
          freeNotes={freeNotes}
          onOpenFreeWrite={handleOpenFreeWrite}
        />

        {/* History Drawer Modal */}
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          proposals={history}
          onSelectProposal={(saved) => {
            handleLoadHistoryFromWelcome(saved);
          }}
          onDeleteProposal={(id) => {
            const updated = history.filter(h => h.id !== id);
            setHistory(updated);
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
          }}
          onDuplicateProposal={handleDuplicateProposal}
          onOpenBackup={() => setIsBackupOpen(true)}
        />

        {/* Branding & Titles Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          branding={branding}
          onChange={handleBrandingChange}
          onClose={() => setIsSettingsOpen(false)}
          onOpenBackup={() => setIsBackupOpen(true)}
        />

        {/* Backup & Restore Modal */}
        <BackupModal
          isOpen={isBackupOpen}
          onClose={() => setIsBackupOpen(false)}
          history={history}
          branding={branding}
          currentDraft={
            proposal
              ? {
                  currentDocumentId,
                  metadata,
                  rawRequirements,
                  images,
                  proposal,
                  version: currentVersion,
                  versionNote: currentVersionNote,
                  status: currentStatus,
                  workspaceMode,
                  editorTab,
                  timestamp: new Date().toISOString(),
                }
              : null
          }
          theme={theme}
          freeNotes={freeNotes}
          backupConfig={backupConfig}
          onUpdateBackupConfig={handleUpdateBackupConfig}
          onRestoreBackup={handleRestoreBackup}
          lastAutoBackupTime={lastAutoBackupTime}
        />

        {/* New Document Dialog with Save Prompt */}
        <NewDocumentModal
          isOpen={isNewDocModalOpen}
          onClose={() => setIsNewDocModalOpen(false)}
          onConfirmNew={handleConfirmNewDocument}
          hasSubstance={currentDocumentHasSubstance()}
          currentProjectName={metadata.nombreProyecto}
          currentClient={metadata.cliente}
          currentTicket={metadata.ticketNo}
          currentDocumentKind={workspaceMode === 'technical' ? 'technical' : editorTab === 'slides' ? 'slides' : 'proposal'}
          currentVersion={currentVersion}
        />

        {reminderAlert && (
          <div className="fixed bottom-4 right-4 z-[60] max-w-sm bg-amber-50 text-slate-900 px-3.5 py-3 rounded-2xl shadow-lg border border-amber-300 flex items-start gap-2.5">
            <BellRing className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Recordatorio</p>
              <p className="text-xs font-bold truncate">{reminderAlert.title}</p>
            </div>
            <button
              type="button"
              onClick={handleOpenReminderAlert}
              className="px-2.5 py-1 rounded-lg bg-[#0A3D62] text-white text-[10px] font-bold cursor-pointer"
            >
              Abrir
            </button>
            <button
              type="button"
              onClick={() => setReminderAlert(null)}
              className="p-1 rounded-lg hover:bg-amber-100 cursor-pointer"
              aria-label="Cerrar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <ScrollToTopBubble />
        {backupToastEl}
      </>
    );
  }

  if (workspaceMode === 'notes') {
    return (
      <>
        <FreeWriteWorkspace
          notes={freeNotes}
          activeNoteId={activeFreeNoteId}
          onChangeNotes={setFreeNotes}
          onChangeActiveNoteId={setActiveFreeNoteId}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onGoHome={() => setShowWelcome(true)}
          logoDataUrl={branding.logoDataUrl}
        />
        {reminderAlert && (
          <div className="fixed bottom-4 right-4 z-[60] max-w-sm bg-amber-50 text-slate-900 px-3.5 py-3 rounded-2xl shadow-lg border border-amber-300 flex items-start gap-2.5">
            <BellRing className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Recordatorio</p>
              <p className="text-xs font-bold truncate">{reminderAlert.title}</p>
            </div>
            <button
              type="button"
              onClick={handleOpenReminderAlert}
              className="px-2.5 py-1 rounded-lg bg-[#0A3D62] text-white text-[10px] font-bold cursor-pointer"
            >
              Abrir
            </button>
            <button
              type="button"
              onClick={() => setReminderAlert(null)}
              className="p-1 rounded-lg hover:bg-amber-100 cursor-pointer"
              aria-label="Cerrar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <ScrollToTopBubble />
        {backupToastEl}
      </>
    );
  }

  return (
    <div className="h-dvh max-md:h-auto max-md:min-h-dvh text-slate-800 flex flex-col font-sans overflow-hidden max-md:overflow-visible">
      
      {/* Top Header */}
      <Header
        onNewDocument={handleOpenNewDocumentModal}
        onLoadPreset={handleLoadPreset}
        onReset={handleReset}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onRevertToSaved={handleRequestRevertToLastSaved}
        hasSavedVersion={hasSavedVersionAvailable}
        onGoHome={() => setShowWelcome(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        historyCount={history.length}
        logoDataUrl={branding.logoDataUrl}
        projectName={metadata.nombreProyecto}
        documentKind={workspaceMode === 'technical' ? 'technical' : 'proposal'}
        autoBackupActive={backupConfig.enabled && backupConfig.frequency !== 'off'}
        autoBackupFrequency={backupConfig.frequency}
        dailyBackupActive={backupConfig.dailyScheduleEnabled}
        dailyBackupTime={backupConfig.dailyScheduleTime}
      />

      {/* Main Container */}
      <main className="flex-1 min-h-0 max-w-[1800px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col gap-3 overflow-hidden max-md:overflow-visible">
        
        {/* Banner Alert if Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-2xl shadow-sm flex items-start gap-3 shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-red-800">
              <strong className="font-bold text-red-900">Atención: </strong>
              {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
              title="Descartar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {workspaceMode === 'technical' && (
          <div className="min-w-0 flex-1 min-h-0 overflow-hidden max-md:overflow-visible">
            <TechnicalDocEditor
              technicalDoc={proposal?.technicalDoc}
              metadata={brandedMetadata}
              proposal={proposal}
              images={images}
              rawRequirements={rawRequirements}
              history={history}
              currentDocumentId={currentDocumentId}
              onChange={(updatedTechDoc) => {
                setProposal((prev) => ({
                  ...(prev || EMPTY_MANUAL_PROPOSAL),
                  technicalDoc: updatedTechDoc,
                }));
              }}
              onSave={handleSaveChanges}
              onMetadataChange={(updated) => setMetadata(stripDocumentLogo(updated))}
              onLinkProposal={handleLinkTechnicalToProposal}
              onUnlinkProposal={handleUnlinkTechnicalFromProposal}
              onOpenLinkedProposal={handleOpenLinkedProposal}
              onImagesChange={setImages}
              autoGenerateFromProposal={proposalHasSubstance(proposal)}
            />
          </div>
        )}

        {workspaceMode === 'proposal' && (
        <>
        {/* Workspace Mode Bar Switcher */}
        <div className="relative sticky top-14 sm:top-16 lg:top-0 z-40 bg-slate-900 text-white backdrop-blur-md rounded-2xl p-1.5 sm:p-2 shadow-md border border-slate-800 sticky-bar flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs px-2 min-w-0">
            <span className="font-bold text-[#2ECC71]">Vista</span>
          </div>

          <div className="bg-slate-800/90 p-1 rounded-xl flex items-center gap-0.5 border border-slate-700/80 text-xs w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setLayoutMode('split')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                layoutMode === 'split'
                  ? 'bg-[#0A3D62] text-white shadow-sm border border-blue-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Datos + documento</span>
            </button>

            <button
              onClick={() => setLayoutMode('inputs')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                layoutMode === 'inputs'
                  ? 'bg-[#0A3D62] text-white shadow-sm border border-blue-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Solo datos</span>
            </button>

            {proposal && (
              <button
                onClick={() => setLayoutMode('editor')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  layoutMode === 'editor'
                    ? 'bg-[#0A3D62] text-white shadow-sm border border-blue-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Solo documento</span>
              </button>
            )}
          </div>
        </div>

        {/* Workspace Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch min-w-0 flex-1 min-h-0 overflow-hidden max-md:overflow-x-hidden max-md:overflow-y-visible">
          
          {/* LEFT COLUMN: Input Panels */}
          {(layoutMode === 'split' || layoutMode === 'inputs') && (
            <div className={`${
              layoutMode === 'inputs'
                ? 'lg:col-span-12 max-w-4xl mx-auto w-full'
                : 'lg:col-span-5 xl:col-span-5 2xl:col-span-4'
            } @container space-y-3 min-w-0 max-w-full h-full overflow-x-hidden overflow-y-auto max-md:max-h-none max-md:overflow-x-hidden overscroll-contain pr-1`}>
              
              {/* Input Navigation Tabs to Prevent Endlessly Scrolling Down */}
              <div className="relative sticky top-14 sm:top-16 lg:top-0 z-20 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-sm sticky-bar text-xs">
                <p className="px-1.5 pb-1.5 text-[11px] text-slate-500">
                  1 Datos → 2 Notas → Generar. Las imágenes son opcionales.
                </p>
                <div className="grid grid-cols-4 gap-1 w-full min-w-0">
                  <button
                    type="button"
                    onClick={() => setInputTab('metadatos')}
                    title="Datos del documento"
                    className={`min-w-0 py-2 px-1 font-semibold rounded-xl transition-all inline-flex flex-col items-center justify-center gap-0.5 ${
                      inputTab === 'metadatos'
                        ? 'bg-[#0A3D62] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                      {hasDatos && <Check className="w-3 h-3 text-[#2ECC71]" />}
                    </span>
                    <span className="truncate w-full text-center text-[10px] sm:text-xs">1. Datos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab('requerimientos')}
                    title="Notas y requerimientos"
                    className={`min-w-0 py-2 px-1 font-semibold rounded-xl transition-all inline-flex flex-col items-center justify-center gap-0.5 ${
                      inputTab === 'requerimientos'
                        ? 'bg-[#0A3D62] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <NotebookPen className="w-3.5 h-3.5 shrink-0" />
                      {hasNotas && <Check className="w-3 h-3 text-[#2ECC71]" />}
                    </span>
                    <span className="truncate w-full text-center text-[10px] sm:text-xs">2. Notas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab('imagenes')}
                    title="Imágenes del documento"
                    className={`min-w-0 py-2 px-1 font-semibold rounded-xl transition-all inline-flex flex-col items-center justify-center gap-0.5 ${
                      inputTab === 'imagenes'
                        ? 'bg-[#0A3D62] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate w-full text-center text-[10px] sm:text-xs">
                      3. Imágenes{images.length > 0 ? ` (${images.length})` : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab('all')}
                    title="Ver todos los paneles"
                    className={`min-w-0 py-2 px-1 font-semibold rounded-xl transition-all inline-flex flex-col items-center justify-center gap-0.5 ${
                      inputTab === 'all' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate w-full text-center text-[10px] sm:text-xs">Todo</span>
                  </button>
                </div>
              </div>

              {/* Panel 1: Metadata */}
              {(inputTab === 'metadatos' || inputTab === 'all') && (
                <MetadataForm
                  metadata={metadata}
                  onChange={setMetadata}
                />
              )}

              {/* Panel 2: Requirements Text with 4 Structured Sections & Inline Image Tools */}
              {(inputTab === 'requerimientos' || inputTab === 'all') && (
                <RequirementsInput
                  value={rawRequirements}
                  onChange={setRawRequirements}
                  images={images}
                  onImagesChange={setImages}
                  metadata={metadata}
                />
              )}

              {/* Panel 3: Multimodal Images */}
              {(inputTab === 'imagenes' || inputTab === 'all') && (
                <ImageUploader
                  images={images}
                  onChange={setImages}
                />
              )}

              {/* Panel 4: Actions (Manual First + AI Assist) */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2.5 min-w-0 max-w-full overflow-x-hidden">
                <div className="min-w-0 mb-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {proposal ? 'Borrador' : 'Crear documento'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {proposal
                      ? 'Regenera el texto con IA si cambian las notas. Doc. Técnica y Diapositivas están en las pestañas del documento.'
                      : 'Con las notas listas, genera un borrador o escribe tú el contenido.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await handleGenerateProposal();
                    if (layoutMode === 'inputs') setLayoutMode('split');
                  }}
                  disabled={isGenerating}
                  className="w-full py-3 px-3 rounded-xl font-bold text-sm text-white bg-[#0A3D62] hover:bg-[#1E5F8A] active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 border border-blue-400/30 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#2ECC71] shrink-0" />
                      <span>Generando borrador...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#2ECC71] shrink-0" />
                      <span className="text-center leading-tight">
                        {proposal ? 'Regenerar con IA' : 'Generar con IA'}
                      </span>
                    </>
                  )}
                </button>

                {!proposal && (
                <button
                  type="button"
                  onClick={() => {
                    handleStartManualDraft();
                    if (layoutMode === 'inputs') setLayoutMode('split');
                  }}
                  disabled={isGenerating}
                  className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs text-[#0A3D62] bg-white hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-slate-300 disabled:opacity-50"
                >
                  <PenLine className="w-4 h-4 shrink-0" />
                  <span className="text-center leading-tight">Escribir a mano</span>
                </button>
                )}

                {isGenerating && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center space-y-1 toast-in">
                    <div className="flex items-start justify-center gap-2 text-xs font-semibold text-[#0A3D62]">
                      <Cpu className="w-4 h-4 text-[#2ECC71] animate-pulse shrink-0 mt-0.5" />
                      <span className="min-w-0 break-words">{generationStep}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Esto puede tardar unos segundos. No cierres la ventana.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* RIGHT COLUMN: Proposal Output / Editor */}
          {(layoutMode === 'split' || layoutMode === 'editor') && (
            <div className={`${
              layoutMode === 'editor'
                ? 'lg:col-span-12 max-w-6xl mx-auto w-full'
                : 'lg:col-span-7 xl:col-span-7 2xl:col-span-8'
            } min-w-0 max-w-full h-full overflow-x-hidden overflow-y-auto max-md:overflow-x-hidden`}>
              {proposal ? (
                <ProposalEditor
                  proposal={proposal}
                  metadata={brandedMetadata}
                  images={images}
                  rawRequirements={rawRequirements}
                  history={history}
                  currentDocumentId={currentDocumentId}
                  onChange={setProposal}
                  onSave={handleSaveChanges}
                  onSaveNewVersion={handleSaveNewVersion}
                  onRevertToSaved={handleRequestRevertToLastSaved}
                  hasSavedVersion={hasSavedVersionAvailable}
                  currentVersion={currentVersion}
                  status={currentStatus}
                  onStatusChange={(newStatus) => {
                    if (currentDocumentId) {
                      handleUpdateProposalStatus(currentDocumentId, newStatus);
                    } else {
                      setCurrentStatus(newStatus);
                    }
                  }}
                  lastSavedTime={lastSavedTime}
                  showSavedToast={showSavedToast}
                  initialTab={editorTab}
                  onMetadataChange={(updated) => setMetadata(stripDocumentLogo(updated))}
                  onLinkProposal={handleLinkTechnicalToProposal}
                  onUnlinkProposal={handleUnlinkTechnicalFromProposal}
                  onOpenLinkedProposal={handleOpenLinkedProposal}
                  onImagesChange={setImages}
                />
              ) : (
                /* Initial State Placeholder */
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-dashed border-slate-300/80 p-6 sm:p-10 text-center min-h-[420px] lg:min-h-full flex flex-col items-center justify-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-[#0A3D62]/6 border border-[#0A3D62]/10 flex items-center justify-center text-[#0A3D62]">
                    <FileText className="w-8 h-8 text-[#0A3D62]" />
                  </div>

                <div className="max-w-md space-y-2">
                  <h3 className="text-lg font-bold text-[#0A3D62]">
                    Aquí aparecerá tu propuesta
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Completa Datos y Notas a la izquierda. Luego genera con IA o empieza a escribir. Doc. Técnica y Diapositivas se abren en las pestañas del documento, no desde aquí.
                  </p>
                </div>

                <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-3 gap-2 text-left text-[11px] text-slate-500">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-lg bg-[#0A3D62] text-white text-xs font-bold inline-flex items-center justify-center mb-1.5">1</span>
                    <span className="block font-bold text-slate-800">Datos</span>
                    <span>Cliente, ticket y nombre del proyecto.</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-lg bg-[#0A3D62] text-white text-xs font-bold inline-flex items-center justify-center mb-1.5">2</span>
                    <span className="block font-bold text-slate-800">Notas</span>
                    <span>Qué pide el cliente y cómo funciona hoy.</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-lg bg-[#2ECC71] text-slate-950 text-xs font-bold inline-flex items-center justify-center mb-1.5">3</span>
                    <span className="block font-bold text-slate-800">Generar</span>
                    <span>Usa el botón de la izquierda. Luego exporta Word o PDF.</span>
                  </div>
                </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={handleStartManualDraft}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-[#0A3D62] hover:bg-[#1E5F8A] rounded-xl shadow transition-all"
                    >
                      <PenLine className="w-4 h-4 mr-1.5" />
                      <span>Empezar a escribir</span>
                    </button>

                    <button
                      onClick={handleLoadPreset}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-[#0A3D62] bg-white hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5 text-emerald-600" />
                      <span>Probar ejemplo</span>
                    </button>
                  </div>
              </div>
            )}
          </div>
        )}

        </div>
        </>
        )}

      </main>

      {/* History Drawer Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        proposals={history}
        onSelectProposal={(saved) => {
          applySavedDocument(saved);
        }}
        onDeleteProposal={(id) => {
          const updated = history.filter(h => h.id !== id);
          setHistory(updated);
          localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
        }}
        onDuplicateProposal={handleDuplicateProposal}
        onUpdateStatus={handleUpdateProposalStatus}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        branding={branding}
        onChange={handleBrandingChange}
        onClose={() => setIsSettingsOpen(false)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        history={history}
        branding={branding}
        currentDraft={
          proposal
            ? {
                currentDocumentId,
                metadata,
                rawRequirements,
                images,
                proposal,
                version: currentVersion,
                versionNote: currentVersionNote,
                status: currentStatus,
                workspaceMode,
                editorTab,
                timestamp: new Date().toISOString(),
              }
            : null
        }
        theme={theme}
        freeNotes={freeNotes}
        backupConfig={backupConfig}
        onUpdateBackupConfig={handleUpdateBackupConfig}
        onRestoreBackup={handleRestoreBackup}
        lastAutoBackupTime={lastAutoBackupTime}
      />

      {backupToastEl}

      {reminderAlert && (
        <div className="fixed bottom-4 right-4 z-[60] max-w-sm bg-amber-50 text-slate-900 px-3.5 py-3 rounded-2xl shadow-lg border border-amber-300 flex items-start gap-2.5">
          <BellRing className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Recordatorio</p>
            <p className="text-xs font-bold truncate">{reminderAlert.title}</p>
          </div>
          <button
            type="button"
            onClick={handleOpenReminderAlert}
            className="px-2.5 py-1 rounded-lg bg-[#0A3D62] text-white text-[10px] font-bold cursor-pointer"
          >
            Abrir
          </button>
          <button
            type="button"
            onClick={() => setReminderAlert(null)}
            className="p-1 rounded-lg hover:bg-amber-100 cursor-pointer"
            aria-label="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Confirmation Modal for Reset/Clear */}
      <ConfirmModal
        isOpen={isConfirmResetOpen}
        title="¿Empezar de cero?"
        message="Se vaciarán los datos, las notas, las imágenes y el documento actual. El logo de Ajustes se mantiene."
        confirmText="Sí, vaciar"
        cancelText="Cancelar"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsConfirmResetOpen(false)}
      />

      {/* Confirmation Modal for Revert to Last Saved */}
      <ConfirmModal
        isOpen={isConfirmRevertOpen}
        type="info"
        title="¿Volver al último archivo guardado?"
        message={`Se restaurará el documento al último estado guardado en el sistema${lastSavedTime ? ` (${lastSavedTime})` : ''}. Se descartarán los cambios no guardados hechos después de esa hora.`}
        confirmText="Sí, restaurar guardado"
        cancelText="Cancelar"
        onConfirm={handleConfirmRevert}
        onCancel={() => setIsConfirmRevertOpen(false)}
      />

      {/* New Document Dialog with Save Prompt */}
      <NewDocumentModal
        isOpen={isNewDocModalOpen}
        onClose={() => setIsNewDocModalOpen(false)}
        onConfirmNew={handleConfirmNewDocument}
        hasSubstance={currentDocumentHasSubstance()}
        currentProjectName={metadata.nombreProyecto}
        currentClient={metadata.cliente}
        currentTicket={metadata.ticketNo}
        currentDocumentKind={workspaceMode === 'technical' ? 'technical' : editorTab === 'slides' ? 'slides' : 'proposal'}
        currentVersion={currentVersion}
      />

      <ScrollToTopBubble />
    </div>
  );
}
