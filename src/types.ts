export interface BrandingSettings {
  logoDataUrl?: string;
  logoMimeType?: string;
  logoFileName?: string;
  logoWidth?: number;
  logoHeight?: number;
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

export interface ProposalSection {
  resumenEjecutivo: string;
  beneficios: string[];
  alcanceExclusionesEntregables: ScopeSection;
  objetivo: string;
  descripcion: string;
  indiceAnalisisOperativo: string[];
  analisisOperativo: OperativeStep[];
  descargo: string;
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
