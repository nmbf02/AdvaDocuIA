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
}

export const DEFAULT_DOCUMENT_TITLES: Required<Omit<DocumentTitlesConfig, 'hideSection1' | 'hideSection2' | 'hideSection3' | 'hideSection3_1' | 'hideSection3_2' | 'hideSection3_3' | 'hideSection4' | 'hideSection5' | 'hideSection6' | 'hideSection7' | 'hideSection8' | 'hiddenSections' | 'techMainTitle' | 'techSection1' | 'techSection2' | 'techSection3' | 'techSection4' | 'techSection5' | 'hideTechMainTitle' | 'hideTechSection1' | 'hideTechSection2' | 'hideTechSection3' | 'hideTechSection4' | 'hideTechSection5'>> = {
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

export function getEffectiveTitles(custom?: DocumentTitlesConfig): Required<Omit<DocumentTitlesConfig, 'hideSection1' | 'hideSection2' | 'hideSection3' | 'hideSection3_1' | 'hideSection3_2' | 'hideSection3_3' | 'hideSection4' | 'hideSection5' | 'hideSection6' | 'hideSection7' | 'hideSection8' | 'hiddenSections' | 'techMainTitle' | 'techSection1' | 'techSection2' | 'techSection3' | 'techSection4' | 'techSection5' | 'hideTechMainTitle' | 'hideTechSection1' | 'hideTechSection2' | 'hideTechSection3' | 'hideTechSection4' | 'hideTechSection5'>> & {
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
  };
}

export interface BrandingSettings {
  logoDataUrl?: string;
  logoMimeType?: string;
  logoFileName?: string;
  logoWidth?: number;
  logoHeight?: number;
  customTitles?: DocumentTitlesConfig;
}

export interface MetadataHeader {
  cliente: string;
  fecha: string;
  ticketNo: string;
  guiaNo: string;
  propuestaNo: string;
  nombreProyecto: string;
  moduloAplicacion: string;
  headerBrandTag?: string;
  headerSubtitle?: string;
  footerText?: string;
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

