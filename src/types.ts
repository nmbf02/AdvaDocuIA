export interface DocumentTitlesConfig {
  mainTitle?: string;
  section1?: string;
  section2?: string;
  section3?: string;
  section3_1?: string;
  section3_2?: string;
  section3_3?: string;
  sectionPage2?: string;
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
  coverSubtitle?: string;
  confidentialityTitle?: string;
  confidentialityText?: string;
  hideConfidentiality?: boolean;
}

export const DEFAULT_DESCARGO_TEXT = 
  "El contenido de este análisis refleja con precisión los resultados que serán entregados, sin adiciones ni omisiones. Cualquier observación o inquietud que el cliente pueda tener deberá ser expresada y documentada debidamente para ser considerada y, en su caso, incorporada al análisis. No se realizarán ajustes adicionales a menos que se notifiquen y documenten de acuerdo con este procedimiento.";

export const DEFAULT_CONFIDENTIALITY_TITLE = 'CONFIDENCIALIDAD';
export const DEFAULT_CONFIDENTIALITY_TEXT =
  'Este documento es propiedad de Advansys, SRL. La información contenida es confidencial y está destinada exclusivamente al destinatario. Queda prohibida su copia, reproducción o divulgación total o parcial sin autorización previa y por escrito de Advansys, SRL.';
export const COVER_SCOPE_MAX_ITEMS = 3;

export const DEFAULT_DOCUMENT_TITLES: Required<Omit<DocumentTitlesConfig, 'hideSection1' | 'hideSection2' | 'hideSection3' | 'hideSection3_1' | 'hideSection3_2' | 'hideSection3_3' | 'hideSection4' | 'hideSection5' | 'hideSection6' | 'hideSection7' | 'hideSection8' | 'hiddenSections' | 'techMainTitle' | 'techSection1' | 'techSection2' | 'techSection3' | 'techSection4' | 'techSection5' | 'hideTechMainTitle' | 'hideTechSection1' | 'hideTechSection2' | 'hideTechSection3' | 'hideTechSection4' | 'hideTechSection5' | 'defaultDescargo' | 'hideConfidentiality'>> = {
  mainTitle: 'PROPUESTA DE DESARROLLO',
  section1: 'Resumen Ejecutivo',
  section2: 'Beneficios de la Propuesta',
  section3: 'Alcance, Exclusiones y Entregables',
  section3_1: 'Alcance Técnico del Proyecto:',
  section3_2: 'Exclusiones (Fuera de Alcance):',
  section3_3: 'Entregables Formales:',
  sectionPage2: 'Página 2 · Comercial',
  section4: 'Objetivo General y Específicos',
  section5: 'Descripción de la Solución Propuesta',
  section6: 'Índice de Análisis Operativo',
  section7: 'Análisis Operativo Detallado',
  section8: 'Descargo y Cláusula Estándar',
  coverSubtitle: 'Soluciones tecnológicas a la medida de su operación',
  confidentialityTitle: 'CONFIDENCIALIDAD',
  confidentialityText:
    'Este documento es propiedad de Advansys, SRL. La información contenida es confidencial y está destinada exclusivamente al destinatario. Queda prohibida su copia, reproducción o divulgación total o parcial sin autorización previa y por escrito de Advansys, SRL.',
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

export function getEffectiveTitles(custom?: DocumentTitlesConfig): Required<Omit<DocumentTitlesConfig, 'hideSection1' | 'hideSection2' | 'hideSection3' | 'hideSection3_1' | 'hideSection3_2' | 'hideSection3_3' | 'hideSection4' | 'hideSection5' | 'hideSection6' | 'hideSection7' | 'hideSection8' | 'hiddenSections' | 'techMainTitle' | 'techSection1' | 'techSection2' | 'techSection3' | 'techSection4' | 'techSection5' | 'hideTechMainTitle' | 'hideTechSection1' | 'hideTechSection2' | 'hideTechSection3' | 'hideTechSection4' | 'hideTechSection5' | 'defaultDescargo' | 'hideConfidentiality'>> & {
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
  hideConfidentiality: boolean;
} {
  return {
    mainTitle: custom?.mainTitle?.trim() || DEFAULT_DOCUMENT_TITLES.mainTitle,
    section1: custom?.section1?.trim() || DEFAULT_DOCUMENT_TITLES.section1,
    section2: custom?.section2?.trim() || DEFAULT_DOCUMENT_TITLES.section2,
    section3: custom?.section3?.trim() || DEFAULT_DOCUMENT_TITLES.section3,
    section3_1: custom?.section3_1 !== undefined && custom.section3_1.trim() !== '' ? custom.section3_1.trim() : DEFAULT_DOCUMENT_TITLES.section3_1,
    section3_2: custom?.section3_2 !== undefined && custom.section3_2.trim() !== '' ? custom.section3_2.trim() : DEFAULT_DOCUMENT_TITLES.section3_2,
    section3_3: custom?.section3_3 !== undefined && custom.section3_3.trim() !== '' ? custom.section3_3.trim() : DEFAULT_DOCUMENT_TITLES.section3_3,
    sectionPage2: custom?.sectionPage2?.trim() || DEFAULT_DOCUMENT_TITLES.sectionPage2,
    section4: custom?.section4?.trim() || DEFAULT_DOCUMENT_TITLES.section4,
    section5: custom?.section5?.trim() || DEFAULT_DOCUMENT_TITLES.section5,
    section6: custom?.section6?.trim() || DEFAULT_DOCUMENT_TITLES.section6,
    section7: custom?.section7?.trim() || DEFAULT_DOCUMENT_TITLES.section7,
    section8: custom?.section8?.trim() || DEFAULT_DOCUMENT_TITLES.section8,
    coverSubtitle: custom?.coverSubtitle?.trim() || DEFAULT_DOCUMENT_TITLES.coverSubtitle,
    confidentialityTitle: custom?.confidentialityTitle?.trim() || DEFAULT_DOCUMENT_TITLES.confidentialityTitle,
    confidentialityText: custom?.confidentialityText?.trim() || DEFAULT_DOCUMENT_TITLES.confidentialityText,
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
    hideConfidentiality: !!custom?.hideConfidentiality,
    defaultDescargo: custom?.defaultDescargo?.trim() || DEFAULT_DESCARGO_TEXT,
  };
}

export type Page2LogoMode = 'off' | 'main' | 'page2';

export interface BrandingSettings {
  logoDataUrl?: string;
  logoMimeType?: string;
  logoFileName?: string;
  logoWidth?: number;
  logoHeight?: number;
  page2LogoDataUrl?: string;
  page2LogoMimeType?: string;
  page2LogoFileName?: string;
  page2LogoWidth?: number;
  page2LogoHeight?: number;
  page2LogoMode?: Page2LogoMode;
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
  page2LogoDataUrl?: string;
  page2LogoMimeType?: string;
  page2LogoFileName?: string;
  page2LogoWidth?: number;
  page2LogoHeight?: number;
  page2LogoMode?: Page2LogoMode;
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

export interface CommercialLineItem {
  description: string;
  hours: number | string;
  unitValue: number | string;
}

export interface CommercialCondition {
  title: string;
  text: string;
}

export interface CommercialPage {
  hide?: boolean;
  logoMode?: Page2LogoMode;
  lineItems?: CommercialLineItem[];
  itbisExempt?: boolean;
  itbisLabel?: string;
  conditionsTitle?: string;
  conditions?: CommercialCondition[];
  nextStepsTitle?: string;
  nextSteps?: string[];
  notesTitle?: string;
  notes?: string;
  reviewedByTitle?: string;
  reviewedBy?: string;
  reviewedLeftRole?: string;
  reviewedLeftOrg?: string;
  reviewedRightRole?: string;
  reviewedRightOrg?: string;
  footerPhone?: string;
  footerEmail?: string;
  footerWeb?: string;
  footerCity?: string;
}

export const DEFAULT_COMMERCIAL_PAGE: Required<Omit<CommercialPage, 'hide' | 'logoMode'>> & { hide: boolean; logoMode: Page2LogoMode } = {
  hide: false,
  logoMode: 'main',
  lineItems: [{ description: '', hours: '', unitValue: '' }],
  itbisExempt: true,
  itbisLabel: 'EXENTO DE ITBIS',
  conditionsTitle: 'CONDICIONES COMERCIALES',
  conditions: [
    { title: 'Tiempo estimado:', text: 'Fecha de entrega sujeta a aprobación y disponibilidad.' },
    { title: 'Validez de la propuesta:', text: '30 días calendario.' },
    { title: 'Forma de pago:', text: '50% con la aprobación, 40% con la entrega y 10% con el cierre definitivo.' },
    { title: 'Moneda:', text: 'Dólares Americanos (USD).' },
  ],
  nextStepsTitle: 'PRÓXIMOS PASOS',
  nextSteps: [
    'Pre aprobación de la propuesta en plataforma',
    'Firma y sello del acuerdo',
    'Pago inicial del 50%',
    'Planificación e inicio del proyecto',
  ],
  notesTitle: 'NOTAS IMPORTANTES',
  notes:
    '**Inicio del desarrollo:** El proyecto se planificará de acuerdo a la disponibilidad de recursos y a la prioridad de los clientes con contrato de SLA. La programación de la semana se realiza desde los viernes.',
  reviewedByTitle: 'REVISADO POR',
  reviewedBy: '',
  reviewedLeftRole: 'Gerente Financiera',
  reviewedLeftOrg: 'Advansys',
  reviewedRightRole: 'Aprobado por el Cliente',
  reviewedRightOrg: 'Nombre y Firma',
  footerPhone: '809-000-0000',
  footerEmail: 'info@advansys.com.do',
  footerWeb: 'www.advansys.com.do',
  footerCity: 'Santiago de los Caballeros, R.D.',
};

export function parseCommercialNumber(value: number | string | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value ?? '').replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

export function formatUsd(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `USD$ ${formatted}`;
}

export function getEffectiveCommercialPage(proposal?: ProposalSection | null): typeof DEFAULT_COMMERCIAL_PAGE {
  const c = proposal?.commercial;
  const defaults = DEFAULT_COMMERCIAL_PAGE;
  const conditions = (c?.conditions || []).filter((x) => x && (x.title?.trim() || x.text?.trim()));
  const nextSteps = (c?.nextSteps || []).filter((x) => x && x.trim());
  const lineItems = (c?.lineItems || []).filter(
    (x) => x && (String(x.description || '').trim() || parseCommercialNumber(x.hours) || parseCommercialNumber(x.unitValue))
  );
  return {
    hide: !!c?.hide,
    logoMode: c?.logoMode ?? defaults.logoMode,
    lineItems: lineItems.length ? lineItems : defaults.lineItems,
    itbisExempt: c?.itbisExempt !== false,
    itbisLabel: c?.itbisLabel?.trim() || defaults.itbisLabel,
    conditionsTitle: c?.conditionsTitle?.trim() || defaults.conditionsTitle,
    conditions: conditions.length ? conditions : defaults.conditions,
    nextStepsTitle: c?.nextStepsTitle?.trim() || defaults.nextStepsTitle,
    nextSteps: nextSteps.length ? nextSteps : defaults.nextSteps,
    notesTitle: c?.notesTitle?.trim() || defaults.notesTitle,
    notes: c?.notes !== undefined ? c.notes : defaults.notes,
    reviewedByTitle: c?.reviewedByTitle?.trim() || defaults.reviewedByTitle,
    reviewedBy: c?.reviewedBy ?? defaults.reviewedBy,
    reviewedLeftRole: c?.reviewedLeftRole?.trim() || defaults.reviewedLeftRole,
    reviewedLeftOrg: c?.reviewedLeftOrg?.trim() || defaults.reviewedLeftOrg,
    reviewedRightRole: c?.reviewedRightRole?.trim() || defaults.reviewedRightRole,
    reviewedRightOrg: c?.reviewedRightOrg?.trim() || defaults.reviewedRightOrg,
    footerPhone: c?.footerPhone?.trim() || defaults.footerPhone,
    footerEmail: c?.footerEmail?.trim() || defaults.footerEmail,
    footerWeb: c?.footerWeb?.trim() || defaults.footerWeb,
    footerCity: c?.footerCity?.trim() || defaults.footerCity,
  };
}

export function getPage2LogoMode(
  meta?: Partial<MetadataHeader> | null,
  commercial?: CommercialPage | null
): Page2LogoMode {
  if (commercial?.logoMode) return commercial.logoMode;
  if (meta?.page2LogoMode) return meta.page2LogoMode;
  return meta?.page2LogoDataUrl ? 'page2' : 'main';
}

export function resolvePage2LogoDataUrl(
  meta?: Partial<MetadataHeader> | null,
  commercial?: CommercialPage | null
): string | undefined {
  const mode = getPage2LogoMode(meta, commercial);
  if (mode === 'off') return undefined;
  if (mode === 'main') return meta?.logoDataUrl || undefined;
  return meta?.page2LogoDataUrl || undefined;
}

export type NestedSectionField = 'resumenEjecutivo' | 'objetivo' | 'descripcion' | 'descargo';

export interface ProposalSubsection {
  id: string;
  title: string;
  body: string;
}

export function createEmptySubsection(): ProposalSubsection {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return { id, title: '', body: '' };
}

export function getSubsections(
  proposal: ProposalSection | null | undefined,
  field: NestedSectionField
): ProposalSubsection[] {
  return proposal?.subsections?.[field] || [];
}

export function subsectionHasContent(sub: ProposalSubsection): boolean {
  return Boolean(sub?.title?.trim() || sub?.body?.trim());
}

export function sectionHasBodyOrSubs(text: string | undefined, fieldSubs: ProposalSubsection[]): boolean {
  return Boolean(text?.trim()) || fieldSubs.some(subsectionHasContent);
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
  subsections?: Partial<Record<NestedSectionField, ProposalSubsection[]>>;
  tables?: DocumentTable[];
  slideDeck?: SlideDeck;
  technicalDoc?: TechnicalDoc;
  commercial?: CommercialPage;
}

export type FreeNoteColor = 'amber' | 'sky' | 'emerald' | 'rose' | 'violet' | 'slate';

export interface FreeNote {
  id: string;
  title: string;
  body: string;
  color: FreeNoteColor;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  reminderAt?: string | null;
  reminderDone?: boolean;
  reminderFiredAt?: string | null;
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
  lastDailyBackupClock?: string | null;
  // Local PC Folder destination settings (File System Access API)
  targetDirectoryName?: string | null;
  targetDirectoryPath?: string | null;
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
  lastDailyBackupClock: null,
  targetDirectoryName: null,
  targetDirectoryPath: null,
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

