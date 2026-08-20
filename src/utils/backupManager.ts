import { SavedProposal, BrandingSettings, MetadataHeader, UploadedImage, ProposalSection } from '../types';

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
 * Creates and triggers a download of a complete JSON backup of the user's data
 */
export function exportAppBackup(
  history: SavedProposal[],
  branding?: BrandingSettings | null,
  draft?: any | null,
  theme?: 'light' | 'dark' | null
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
  const filename = `Advansys_Backup_Historial_${dateStr}.json`;

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
    
    // Check if it's our structured format or a direct array of proposals
    if (Array.isArray(parsed)) {
      // Direct array of SavedProposal
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

    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.history)) {
        return {
          success: true,
          data: {
            version: '1.0',
            exportDate: parsed.exportDate || new Date().toISOString(),
            appName: parsed.appName || 'ADVANSYS Document Generator',
            stats: parsed.stats || {
              totalHistoryItems: parsed.history.length,
              hasDraft: Boolean(parsed.draft),
              hasBranding: Boolean(parsed.settings),
            },
            history: parsed.history,
            draft: parsed.draft || null,
            settings: parsed.settings || null,
            theme: parsed.theme || 'light',
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
