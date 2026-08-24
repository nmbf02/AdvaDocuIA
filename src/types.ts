export interface DocumentTitlesConfig {
  mainTitle?: string;
  section1?: string;
  section2?: string;
  section3?: string;
  section3_1?: string;
  section3_2?: string;
  section3_3?: string;
  section4?: string;
  section5?: string;
  section6?: string;
  section7?: string;
  section8?: string;
  // Visibility toggles for sections and subsections
  hideSection1?: boolean;
  hideSection2?: boolean;
  hideSection3?: boolean;
  hideSection3_1?: boolean;
  hideSection3_2?: boolean;
  hideSection3_3?: boolean;
  hideSection4?: boolean;
  hideSection5?: boolean;
  hideSection6?: boolean;
  hideSection7?: boolean;
  hideSection8?: boolean;
  hiddenSections?: string[];

  // Technical Document Titles and Visibility
  techMainTitle?: string;
  techSection1?: string;
  techSection2?: string;
  techSection3?: string;
  techSection4?: string;
  techSection5?: string;
  hideTechMainTitle?: boolean;
  hideTechSection1?: boolean;
  hideTechSection2?: boolean;
  hideTechSection3?: boolean;
  hideTechSection4?: boolean;
  hideTechSection5?: boolean;

  // Cláusula / Texto de Descargo por defecto (Sección 8)
  defaultDescargo?: string;
}

export const DEFAULT_DESCARGO_TEXT = 
  "El contenido de este análisis refleja con precisión los resultados que serán entregados, sin adiciones ni omisiones. Cualquier observación o inquietud que el cliente pueda tener deberá ser expresada y documentada debidamente para ser considerada y, en su caso, incorporada al análisis. No se realizarán ajustes adicionales a menos que se notifiquen y documenten de acuerdo con este procedimiento.";

export const DEFAULT_DOCUMENT_TITLES: Required<Omit<DocumentTitlesConfig, 'hideSection1' | 'hideSection2' | 'hideSection3' | 'hideSection3_1' | 'hideSection3_2' | 'hideSection3_3' | 'hideSection4' | 'hideSection5' | 'hideSection6' | 'hideSection7' | 'hideSection8' | 'hiddenSections' | 'techMainTitle' | 'techSection1' | 'techSection2' | 'techSection3' | 'techSection4' | 'techSection5' | 'hideTechMainTitle' | 'hideTechSection1' | 'hideTechSection2' | 'hideTechSection3' | 'hideTechSection4' | 'hideTechSection5' | 'defaultDescargo'>> = {
  mainTitle: 'ANÁLISIS DE CUMPLIMIENTO Y PROPUESTA DE DESARROLLO',
  section1: 'Resumen Ejecutivo',
  section2: 'Beneficios de la Propuesta',
  section3: 'Alcance, Exclusiones y Entregables',
  section3_1: 'Alcance Técnico del Proyecto:',
  section3_2: 'Exclusiones (Fuera de Alcance):',
  section3_3: 'Entregables Formales:',
  section4: 'Objetivo General y Específicos',
  section5: 'Descripción de la Solución Propuesta',
  section6: 'Índice de Análisis Operativo',
  section7: 'Análisis Operativo Detallado',
  section8: 'Descargo y Cláusula Estándar',
};

export const DEFAULT_TECHNICAL_DOC_TITLES = {
  techMainTitle: 'DOCUMENTACIÓN TÉCNICA INTERNA Y ESPECIFICACIÓN DE DESARROLLO',
  techSection1: 'Ruta de Acceso & Navegación en el Sistema',
  techSection2: 'Flujo Operativo Interno',
  techSection3: 'Diseño de Interfaz y Estructura de Datos',
  techSection4: 'Consideraciones Técnicas y de Seguridad',
  techSection5: 'Código de Ejemplo / Scripts (si aplica)',
};

export function getEffectiveTechnicalTitles(custom?: DocumentTitlesConfig): {
  techMainTitle: string;
  techSection1: string;
  techSection2: string;
  techSection3: string;
  techSection4: string;
  techSection5: string;
  hideTechMainTitle: boolean;
  hideTechSection1: boolean;
  hideTechSection2: boolean;
  hideTechSection3: boolean;
  hideTechSection4: boolean;
  hideTechSection5: boolean;
} {
  return {
    techMainTitle: custom?.techMainTitle?.trim() || DEFAULT_TECHNICAL_DOC_TITLES.techMainTitle,
    techSection1: custom?.techSection1?.trim() || DEFAULT_TECHNICAL_DOC_TITLES.techSection1,
    techSection2: custom?.techSection2?.trim() || DEFAULT_TECHNICAL_DOC_TITLES.techSection2,
    techSection3: custom?.techSection3?.trim() || DEFAULT_TECHNICAL_DOC_TITLES.techSection3,
    techSection4: custom?.techSection4?.trim() || DEFAULT_TECHNICAL_DOC_TITLES.techSection4,
    techSection5: custom?.techSection5?.trim() || DEFAULT_TECHNICAL_DOC_TITLES.techSection5,
    hideTechMainTitle: !!custom?.hideTechMainTitle,
    hideTechSection1: !!custom?.hideTechSection1,
    hideTechSection2: !!custom?.hideTechSection2,
    hideTechSection3: !!custom?.hideTechSection3,
    hideTechSection4: !!custom?.hideTechSection4,
    hideTechSection5: !!custom?.hideTechSection5,
  };
}

export function getEffectiveTitles(custom?: DocumentTitlesConfig): Required<Omit<DocumentTitlesConfig, 'hideSection1' | 'hideSection2' | 'hideSection3' | 'hideSection3_1' | 'hideSection3_2' | 'hideSection3_3' | 'hideSection4' | 'hideSection5' | 'hideSection6' | 'hideSection7' | 'hideSection8' | 'hiddenSections' | 'techMainTitle' | 'techSection1' | 'techSection2' | 'techSection3' | 'techSection4' | 'techSection5' | 'hideTechMainTitle' | 'hideTechSection1' | 'hideTechSection2' | 'hideTechSection3' | 'hideTechSection4' | 'hideTechSection5' | 'defaultDescargo'>> & {
  hideSection1: boolean;
  hideSection2: boolean;
  hideSection3: boolean;
  hideSection3_1: boolean;
  hideSection3_2: boolean;
  hideSection3_3: boolean;
  hideSection4: boolean;
  hideSection5: boolean;
  hideSection6: boolean;
  hideSection7: boolean;
  hideSection8: boolean;
  defaultDescargo: string;
} {
  return {
    mainTitle: custom?.mainTitle?.trim() || DEFAULT_DOCUMENT_TITLES.mainTitle,
    section1: custom?.section1?.trim() || DEFAULT_DOCUMENT_TITLES.section1,
    section2: custom?.section2?.trim() || DEFAULT_DOCUMENT_TITLES.section2,
    section3: custom?.section3?.trim() || DEFAULT_DOCUMENT_TITLES.section3,
    section3_1: custom?.section3_1 !== undefined && custom.section3_1.trim() !== '' ? custom.section3_1.trim() : DEFAULT_DOCUMENT_TITLES.section3_1,
    section3_2: custom?.section3_2 !== undefined && custom.section3_2.trim() !== '' ? custom.section3_2.trim() : DEFAULT_DOCUMENT_TITLES.section3_2,
    section3_3: custom?.section3_3 !== undefined && custom.section3_3.trim() !== '' ? custom.section3_3.trim() : DEFAULT_DOCUMENT_TITLES.section3_3,
    section4: custom?.section4?.trim() || DEFAULT_DOCUMENT_TITLES.section4,
    section5: custom?.section5?.trim() || DEFAULT_DOCUMENT_TITLES.section5,
    section6: custom?.section6?.trim() || DEFAULT_DOCUMENT_TITLES.section6,
    section7: custom?.section7?.trim() || DEFAULT_DOCUMENT_TITLES.section7,
    section8: custom?.section8?.trim() || DEFAULT_DOCUMENT_TITLES.section8,
    hideSection1: !!custom?.hideSection1,
    hideSection2: !!custom?.hideSection2,
    hideSection3: !!custom?.hideSection3,
    hideSection3_1: !!custom?.hideSection3_1,
    hideSection3_2: !!custom?.hideSection3_2,
    hideSection3_3: !!custom?.hideSection3_3,
    hideSection4: !!custom?.hideSection4,
    hideSection5: !!custom?.hideSection5,
    hideSection6: !!custom?.hideSection6,
    hideSection7: !!custom?.hideSection7,
    hideSection8: !!custom?.hideSection8,
    defaultDescargo: custom?.defaultDescargo?.trim() || DEFAULT_DESCARGO_TEXT,
  };
}

export interface BrandingSettings {
  logoDataUrl?: string;
  logoMimeType?: string;
  logoFileName?: string;
  logoWidth?: number;
  logoHeight?: number;
  customTitles?: DocumentTitlesConfig;
  // Independent Header & Footer presets
  proposalHeaderBrandTag?: string;
  proposalHeaderSubtitle?: string;
  proposalFooterText?: string;
  techHeaderBrandTag?: string;
  techHeaderSubtitle?: string;
  techHeaderRightText?: string;
  techFooterText?: string;
  techIncludeHeaderBanner?: boolean;
}

export const DEFAULT_PROPOSAL_HEADER_FOOTER = {
  headerBrandTag: 'ADVANSYS',
  headerSubtitle: 'DOCUMENTACIÓN TÉCNICA Y ANÁLISIS DE CUMPLIMIENTO',
  footerText: 'Advansys SRL',
};

export const DEFAULT_TECHNICAL_HEADER_FOOTER = {
  techHeaderBrandTag: 'ADVANSYS',
  techHeaderSubtitle: 'ESPECIFICACIÓN TÉCNICA INTERNA DE DESARROLLO',
  techHeaderRightText: '',
  techFooterText: 'DOCUMENTO CONFIDENCIAL DE USO INTERNO ADVANSYS',
  includeFirstPageHeaderImage: false,
};

export function getEffectiveProposalHeaderFooter(
  metadata?: Partial<MetadataHeader> | null,
  branding?: Partial<BrandingSettings> | null
): {
  headerBrandTag: string;
  headerSubtitle: string;
  footerText: string;
} {
  const brand = metadata?.headerBrandTag?.trim() || branding?.proposalHeaderBrandTag?.trim() || DEFAULT_PROPOSAL_HEADER_FOOTER.headerBrandTag;
  const subtitle = metadata?.headerSubtitle !== undefined && metadata?.headerSubtitle !== null
    ? metadata.headerSubtitle
    : (branding?.proposalHeaderSubtitle !== undefined ? branding.proposalHeaderSubtitle : DEFAULT_PROPOSAL_HEADER_FOOTER.headerSubtitle);
  const footer = metadata?.footerText?.trim() || branding?.proposalFooterText?.trim() || DEFAULT_PROPOSAL_HEADER_FOOTER.footerText;

  return {
    headerBrandTag: brand,
    headerSubtitle: subtitle,
    footerText: footer,
  };
}

export function getEffectiveTechnicalHeaderFooter(
  techDoc?: Partial<TechnicalDoc> | null,
  metadata?: Partial<MetadataHeader> | null,
  branding?: Partial<BrandingSettings> | null
): {
  techHeaderBrandTag: string;
  techHeaderSubtitle: string;
  techHeaderRightText: string;
  techFooterText: string;
  includeFirstPageHeaderImage: boolean;
} {
  const brand = techDoc?.headerBrandTag?.trim() || metadata?.techHeaderBrandTag?.trim() || branding?.techHeaderBrandTag?.trim() || DEFAULT_TECHNICAL_HEADER_FOOTER.techHeaderBrandTag;
  const subtitle = techDoc?.headerSubtitle !== undefined && techDoc?.headerSubtitle !== null
    ? techDoc.headerSubtitle
    : (metadata?.techHeaderSubtitle !== undefined && metadata?.techHeaderSubtitle !== null
      ? metadata.techHeaderSubtitle
      : (branding?.techHeaderSubtitle !== undefined ? branding.techHeaderSubtitle : DEFAULT_TECHNICAL_HEADER_FOOTER.techHeaderSubtitle));
  const rightText = techDoc?.headerRightText !== undefined && techDoc?.headerRightText !== null
    ? techDoc.headerRightText
    : (metadata?.techHeaderRightText !== undefined && metadata?.techHeaderRightText !== null
      ? metadata.techHeaderRightText
      : (branding?.techHeaderRightText !== undefined ? branding.techHeaderRightText : (metadata?.ticketNo || '')));
  const footer = techDoc?.footerText?.trim() || metadata?.techFooterText?.trim() || branding?.techFooterText?.trim() || DEFAULT_TECHNICAL_HEADER_FOOTER.techFooterText;

  const includeFirstPageHeaderImage = techDoc?.includeFirstPageHeaderImage !== undefined
    ? !!techDoc.includeFirstPageHeaderImage
    : (metadata?.techIncludeHeaderBanner !== undefined
      ? !!metadata.techIncludeHeaderBanner
      : (branding?.techIncludeHeaderBanner !== undefined ? !!branding.techIncludeHeaderBanner : false));

  return {
    techHeaderBrandTag: brand,
    techHeaderSubtitle: subtitle,
    techHeaderRightText: rightText,
    techFooterText: footer,
    includeFirstPageHeaderImage,
  };
}

export interface MetadataHeader {
  cliente: string;
  fecha: string;
  ticketNo: string;
  guiaNo: string;
  propuestaNo: string;
  nombreProyecto: string;
  moduloAplicacion: string;
  // Proposal Header & Footer
  headerBrandTag?: string;
  headerSubtitle?: string;
  footerText?: string;
  // Technical Doc independent Header & Footer
  techHeaderBrandTag?: string;
  techHeaderSubtitle?: string;
  techHeaderRightText?: string;
  techFooterText?: string;
  techIncludeHeaderBanner?: boolean;
  logoDataUrl?: string;
  logoMimeType?: string;
  logoFileName?: string;
  logoWidth?: number;
  logoHeight?: number;
  technicalLevel?: number; // 1 to 10 scale (1 = Alta Gerencia, 10 = TI & Desarrollo)
  detailLevel?: number; // 1 to 10 scale (1 = conciso, 10 = exhaustivo)
  paraphraseLevel?: number; // 1 to 10 scale (1 = conservar texto original, 10 = reescritura libre)
  customTitles?: DocumentTitlesConfig;
}

export interface UploadedImage {
  id: string;
  title: string;
  description: string;
  dataUrl: string; // Base64 data URL
  mimeType: string;
  fileName?: string;
  fileSize?: number;
  /** Display width in the document, 25–100. Default 100. */
  widthPercent?: number;
  /** Horizontal placement. Default center. */
  align?: 'left' | 'center' | 'right';
  /** Word-like text wrapping. Default inline. */
  wrap?: 'inline' | 'square' | 'tight' | 'topAndBottom' | 'behind' | 'inFront';
  /** Vertical placement when the image is floating. Default center. */
  verticalAlign?: 'top' | 'center' | 'bottom';
  /** Rotation in degrees. Default 0. */
  rotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

export interface ScopeSection {
  alcance: string[];
  exclusiones: string[];
  entregables: string[];
}

export interface OperativeStep {
  paso: number;
  titulo: string;
  explicacion: string;
  referenciaImagen?: string; // e.g. "[IMAGEN_1]"
  imagenId?: string;
}

export type SlideLayout = 
  | 'title' 
  | 'bullets' 
  | 'two-column' 
  | 'image-text' 
  | 'steps' 
  | 'cards' 
  | 'quote' 
  | 'conclusion';

export interface SlideCardItem {
  title: string;
  description: string;
  highlight?: string;
}

export interface SlideStepItem {
  stepNumber: number;
  title: string;
  description: string;
}

export interface SlideItem {
  id: string;
  slideNumber: number;
  layout: SlideLayout;
  category?: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  leftTitle?: string;
  leftBullets?: string[];
  rightTitle?: string;
  rightBullets?: string[];
  cards?: SlideCardItem[];
  steps?: SlideStepItem[];
  imageRef?: string; // e.g. "[IMAGEN_1]"
  speakerNotes?: string;
  highlight?: string;
}

export type SlideTheme = 'advansys-navy' | 'dark-executive' | 'emerald-clean' | 'slate-minimal';

export interface SlideDeck {
  title: string;
  subtitle?: string;
  client?: string;
  project?: string;
  ticketNo?: string;
  author?: string;
  date?: string;
  theme?: SlideTheme;
  slides: SlideItem[];
}

export interface DocumentTable {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
}

export interface TechnicalDoc {
  tituloDocumento?: string;
  customTitles?: DocumentTitlesConfig;
  // Independent Header & Footer for this technical document
  headerBrandTag?: string;
  headerSubtitle?: string;
  headerRightText?: string;
  footerText?: string;
  includeFirstPageHeaderImage?: boolean;
  ruta: string;
  flujoOperativo: string;
  diseno: string;
  consideracionesTecnicas: string;
  codigoEjemplo?: string;
  modulosAfectados?: string[];
  tablasBD?: string[];
  tables?: DocumentTable[];
  lastUpdated?: string;
  linkedProposalId?: string;
  linkedProposalName?: string;
  isStandalone?: boolean;
}

export interface ProposalSection {
  resumenEjecutivo: string;
  beneficios: string[];
  alcanceExclusionesEntregables: ScopeSection;
  objetivo: string;
  descripcion: string;
  indiceAnalisisOperativo: string[];
  analisisOperativo: OperativeStep[];
  descargo: string;
  tables?: DocumentTable[];
  slideDeck?: SlideDeck;
  technicalDoc?: TechnicalDoc;
}

export type DocumentStatus = 'borrador' | 'en_revision' | 'finalizado' | 'culminado';

export type BackupFrequency = 'off' | '1m' | '2m' | '5m' | '10m' | '15m' | '30m' | '60m';

export type BackupTrigger = 'interval' | 'daily_schedule' | 'manual' | 'on_save' | 'on_switch' | 'on_import' | 'initial';

export type BackupMode = 'interval' | 'daily' | 'both';

export interface AutoBackupConfig {
  enabled: boolean;
  frequency: BackupFrequency;
  maxSnapshots: number;
  backupOnSave: boolean;
  backupOnDocumentSwitch: boolean;
  showNotificationToast: boolean;
  includeDraft: boolean;
  includeBranding: boolean;
  // Daily schedule settings
  dailyScheduleEnabled: boolean;
  dailyScheduleTime: string; // e.g. "18:00"
  dailyAutoDownloadJson: boolean;
  lastDailyBackupDate?: string | null;
  // Local PC Folder destination settings (File System Access API)
  targetDirectoryName?: string | null;
  autoDownloadDailyToDisk: boolean;
}

export const DEFAULT_BACKUP_CONFIG: AutoBackupConfig = {
  enabled: true,
  frequency: '5m',
  maxSnapshots: 15,
  backupOnSave: true,
  backupOnDocumentSwitch: true,
  showNotificationToast: true,
  includeDraft: true,
  includeBranding: true,
  dailyScheduleEnabled: true,
  dailyScheduleTime: '18:00',
  dailyAutoDownloadJson: true,
  lastDailyBackupDate: null,
  targetDirectoryName: null,
  autoDownloadDailyToDisk: true,
};

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  trigger: BackupTrigger;
  triggerLabel: string;
  note?: string;
  isManual?: boolean;
  stats: {
    totalHistoryItems: number;
    hasDraft: boolean;
    hasBranding: boolean;
    sizeBytes: number;
    projectTitles: string[];
  };
  data: {
    version: '1.0';
    exportDate: string;
    appName: string;
    stats: {
      totalHistoryItems: number;
      hasDraft: boolean;
      hasBranding: boolean;
    };
    history: SavedProposal[];
    draft?: any | null;
    settings?: BrandingSettings | null;
    theme?: 'light' | 'dark' | null;
  };
}

export interface SavedProposal {
  id: string;
  version?: string; // e.g. "v1.0", "v2.0", "v1.1 - Enfoque B"
  versionNote?: string; // e.g. "Primera propuesta con integración por API"
  status?: DocumentStatus; // "borrador" | "en_revision" | "finalizado" | "culminado"
  statusChangedAt?: string;
  timestamp: string;
  metadata: MetadataHeader;
  content: ProposalSection;
  slideDeck?: SlideDeck;
  technicalDoc?: TechnicalDoc;
  images: UploadedImage[];
  rawRequirements: string;
  documentType?: 'proposal' | 'slides' | 'technical';
  linkedProposalId?: string;
  linkedProposalName?: string;
  linkedTechnicalDocId?: string;
}

