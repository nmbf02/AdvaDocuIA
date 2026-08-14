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
}

export const DEFAULT_DOCUMENT_TITLES: Required<DocumentTitlesConfig> = {
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

export function getEffectiveTitles(custom?: DocumentTitlesConfig): Required<DocumentTitlesConfig> {
  return {
    mainTitle: custom?.mainTitle?.trim() || DEFAULT_DOCUMENT_TITLES.mainTitle,
    section1: custom?.section1?.trim() || DEFAULT_DOCUMENT_TITLES.section1,
    section2: custom?.section2?.trim() || DEFAULT_DOCUMENT_TITLES.section2,
    section3: custom?.section3?.trim() || DEFAULT_DOCUMENT_TITLES.section3,
    section3_1: custom?.section3_1?.trim() || DEFAULT_DOCUMENT_TITLES.section3_1,
    section3_2: custom?.section3_2?.trim() || DEFAULT_DOCUMENT_TITLES.section3_2,
    section3_3: custom?.section3_3?.trim() || DEFAULT_DOCUMENT_TITLES.section3_3,
    section4: custom?.section4?.trim() || DEFAULT_DOCUMENT_TITLES.section4,
    section5: custom?.section5?.trim() || DEFAULT_DOCUMENT_TITLES.section5,
    section6: custom?.section6?.trim() || DEFAULT_DOCUMENT_TITLES.section6,
    section7: custom?.section7?.trim() || DEFAULT_DOCUMENT_TITLES.section7,
    section8: custom?.section8?.trim() || DEFAULT_DOCUMENT_TITLES.section8,
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

export interface DocumentTable {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
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
}

export interface SavedProposal {
  id: string;
  version?: string; // e.g. "v1.0", "v2.0", "v1.1 - Enfoque B"
  versionNote?: string; // e.g. "Primera propuesta con integración por API"
  timestamp: string;
  metadata: MetadataHeader;
  content: ProposalSection;
  images: UploadedImage[];
  rawRequirements: string;
}
