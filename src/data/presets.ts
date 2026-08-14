import { MetadataHeader, UploadedImage } from '../types';

export const ADVANSYS_SAMPLE_METADATA: MetadataHeader = {
  cliente: "Banco Metropolitano S.A.",
  fecha: new Date().toISOString().split('T')[0],
  ticketNo: "TK-2026-8894",
  guiaNo: "GUI-ADV-042",
  propuestaNo: "PROP-ADV-2026-0158",
  nombreProyecto: "Módulo Autónomo de Conciliación Bancaria y Facturación Electrónica",
  moduloAplicacion: "Advansys Core Banking Integrator v4.2",
  technicalLevel: 7,
  detailLevel: 7,
  paraphraseLevel: 4,
};

export const ADVANSYS_SAMPLE_REQUIREMENTS = `1. PREMISA:
El cliente Banco Metropolitano opera con la plataforma Advansys Core Banking Integrator v4.2 para la gestión de transacciones diarias. Se requiere automatizar el proceso de conciliación bancaria diaria entre el core financiero y el servicio de facturación electrónica Sunat/Advansys.

2. INCIDENCIA:
Actualmente, los analistas financieros deben descargar manualmente extractos bancarios en Excel a las 6:00 AM, filtrar inconsistencias celda por celda y registrar notas de crédito cuando surgen fallas de sincronización. Esto genera cuellos de botella operativos de hasta 4 horas diarias, errores humanos en el cuadre contable y retrasos en la notificación de giros rechazados. Se adjunta captura del tablero actual en [IMAGEN_2].

3. CUESTIONANTES:
- ¿Cómo garantizar el tiempo de respuesta menor a 2 segundos para lotes masivos de hasta 50,000 registros de extractos bancarios?
- ¿Qué algoritmo de priorización se utilizará para el matcheo automático de transacciones con código de 12 dígitos, fecha exacta y tolerancia de montos?
- ¿Cómo gestionar la seguridad RBAC y el registro auditable (Audit Trail) para aprobaciones manuales de discrepancias mayores a $1,000 USD?
- Ver esquema de comunicación propuesto en [IMAGEN_1].

4. FLUJO ACTUAL:
1. Descarga manual del archivo de extracto bancario en formato TXT/CSV a las 06:00 AM.
2. Carga en hojas de cálculo locales sin validación previa contra la API de Sunat.
3. Revisión visual de diferencias por parte del analista financiero.
4. Generación manual de notas de ajuste en el core bancario.
5. Emisión del reporte diario firmado en papel.`;

const createSvgDataUrl = (svgContent: string): string => {
  const encoded = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(svgContent)))
    : Buffer.from(svgContent).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
};

const SAMPLE_IMAGE_1_SVG = createSvgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350"><rect width="600" height="350" fill="#0a3d62"/><text x="300" y="160" font-family="Arial" font-size="22" fill="#ffffff" text-anchor="middle" font-weight="bold">DIAGRAMA DE ARQUITECTURA CORE ADVANSYS</text><text x="300" y="200" font-family="Arial" font-size="14" fill="#2ecc71" text-anchor="middle">Flujo de Conciliación Automática en Tiempo Real</text><rect x="50" y="240" width="140" height="60" rx="8" fill="#1e5f8a" stroke="#ffffff" stroke-width="2"/><text x="120" y="275" font-family="Arial" font-size="12" fill="#ffffff" text-anchor="middle">Core Bancario</text><rect x="230" y="240" width="140" height="60" rx="8" fill="#2ecc71" stroke="#ffffff" stroke-width="2"/><text x="300" y="275" font-family="Arial" font-size="12" fill="#ffffff" text-anchor="middle">Motor Advansys AI</text><rect x="410" y="240" width="140" height="60" rx="8" fill="#1e5f8a" stroke="#ffffff" stroke-width="2"/><text x="480" y="275" font-family="Arial" font-size="12" fill="#ffffff" text-anchor="middle">Sunat / ERP</text></svg>`);

const SAMPLE_IMAGE_2_SVG = createSvgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350"><rect width="600" height="350" fill="#f8fafc"/><rect x="20" y="20" width="560" height="50" fill="#0a3d62" rx="6"/><text x="40" y="50" font-family="Arial" font-size="16" fill="#ffffff" font-weight="bold">Advansys Dashboard - Módulo Conciliador</text><rect x="30" y="90" width="160" height="90" fill="#e2e8f0" rx="8"/><text x="110" y="130" font-family="Arial" font-size="20" fill="#0a3d62" font-weight="bold" text-anchor="middle">98.4%</text><text x="110" y="155" font-family="Arial" font-size="12" fill="#64748b" text-anchor="middle">Match Automático</text><rect x="210" y="90" width="160" height="90" fill="#e2e8f0" rx="8"/><text x="290" y="130" font-family="Arial" font-size="20" fill="#2ecc71" font-weight="bold" text-anchor="middle">45,210</text><text x="290" y="155" font-family="Arial" font-size="12" fill="#64748b" text-anchor="middle">Procesados</text><rect x="390" y="90" width="160" height="90" fill="#e2e8f0" rx="8"/><text x="470" y="130" font-family="Arial" font-size="20" fill="#e11d48" font-weight="bold" text-anchor="middle">12</text><text x="470" y="155" font-family="Arial" font-size="12" fill="#64748b" text-anchor="middle">Pendientes Revisión</text><rect x="30" y="200" width="520" height="120" fill="#ffffff" stroke="#cbd5e1" rx="6"/><text x="50" y="230" font-family="Arial" font-size="13" fill="#334155" font-weight="bold">Tabla de Discrepancias y Alertas</text></svg>`);

export const ADVANSYS_SAMPLE_IMAGES: UploadedImage[] = [
  {
    id: "img-preset-1",
    title: "Diagrama de Arquitectura de Integración Core-Advansys",
    description: "Esquema del flujo de datos entre la API del Core Bancario, el Motor de Reglas Advansys y el Servicio de Facturación.",
    dataUrl: SAMPLE_IMAGE_1_SVG,
    mimeType: "image/svg+xml",
    fileName: "arquitectura_conciliador_advansys.svg"
  },
  {
    id: "img-preset-2",
    title: "Prototipo UI - Tablero Principal de Conciliaciones",
    description: "Mockup de la interfaz web para analistas con indicadores clave, filtros por rango de fechas y tabla de discrepancias.",
    dataUrl: SAMPLE_IMAGE_2_SVG,
    mimeType: "image/svg+xml",
    fileName: "dashboard_ui_mockup.svg"
  }
];

export const EMPTY_MANUAL_PROPOSAL = {
  resumenEjecutivo: "",
  beneficios: [],
  alcanceExclusionesEntregables: {
    alcance: [],
    exclusiones: [],
    entregables: []
  },
  objetivo: "",
  descripcion: "",
  indiceAnalisisOperativo: [],
  analisisOperativo: [],
  descargo: "La presente propuesta técnica y análisis operativo han sido elaborados exclusivamente por Advansys para uso confidencial del cliente indicado. Los requerimientos, diagramas y estimaciones contenidos están sujetos a validación formal tras la aprobación del acta de inicio de proyecto."
};

