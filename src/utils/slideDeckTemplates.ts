import { SlideDeck, SlideItem, MetadataHeader, ProposalSection, UploadedImage } from '../types';

export function createDefaultSlideDeck(metadata: MetadataHeader, images: UploadedImage[] = []): SlideDeck {
  const cliente = metadata.cliente || 'Cliente Corporativo';
  const proyecto = metadata.nombreProyecto || 'Propuesta Técnica y de Cumplimiento';
  const ticket = metadata.ticketNo || 'TK-2026-001';

  return {
    title: proyecto,
    subtitle: `Presentación Técnica y Ejecutiva de Desarrollo — ${cliente}`,
    client: cliente,
    project: proyecto,
    ticketNo: ticket,
    author: 'Advansys Development Team',
    date: metadata.fecha || new Date().toLocaleDateString('es-ES'),
    theme: 'advansys-navy',
    slides: [
      {
        id: 'slide-1',
        slideNumber: 1,
        layout: 'title',
        category: `TICKET ${ticket}`,
        title: proyecto,
        subtitle: `Análisis Técnico y Solución de Desarrollo para ${cliente}`,
        speakerNotes: `Buenos días a todos. Hoy presentaremos la propuesta técnica de solución para el requerimiento ${ticket} de ${cliente}.`,
      },
      {
        id: 'slide-2',
        slideNumber: 2,
        layout: 'bullets',
        category: '01. CONTEXTO & PROBLEMÁTICA',
        title: 'Antecedentes y Situación Actual',
        subtitle: 'Diagnóstico del escenario operativo y necesidad detectada',
        bullets: [
          'Escenario actual: Procesos operativos con pasos manuales o dependencias susceptibles a optimización.',
          'Incidencia detectada: Necesidad de automatizar la trazabilidad y reducir tiempos de respuesta.',
          'Objetivo de negocio: Garantizar cumplimiento normativo y robustecer la experiencia de usuario.',
        ],
        speakerNotes: 'Aquí exponemos el contexto inicial y la justificación de por qué es indispensable abordar este desarrollo.',
      },
      {
        id: 'slide-3',
        slideNumber: 3,
        layout: 'two-column',
        category: '02. ALCANCE & ENTREGABLES',
        title: 'Delimitación del Proyecto',
        leftTitle: 'Alcance Incluido',
        leftBullets: [
          'Diseño y desarrollo de los servicios y reglas de negocio.',
          'Integración con componentes centrales y base de datos.',
          'Validaciones de seguridad, logs de auditoría y pruebas.',
        ],
        rightTitle: 'Entregables Formales',
        rightBullets: [
          'Documento de Especificación Técnica aprobado.',
          'Paquete de despliegue y scripts de base de datos.',
          'Manual operativo y guía de contingencia.',
        ],
        speakerNotes: 'Definimos con claridad los límites del proyecto para asegurar total alineación entre los equipos.',
      },
      {
        id: 'slide-4',
        slideNumber: 4,
        layout: 'cards',
        category: '03. BENEFICIOS CLAVE',
        title: 'Impacto y Valor para el Negocio',
        cards: [
          {
            title: 'Eficiencia Operativa',
            description: 'Reducción drástica en tiempos de procesamiento y eliminación de re-procesos manuales.',
          },
          {
            title: 'Trazabilidad Total',
            description: 'Auditoría detallada por evento con identificación unívoca de transacciones.',
          },
          {
            title: 'Alta Disponibilidad',
            description: 'Arquitectura resiliente con manejo de excepciones y reintentos controlados.',
          },
          {
            title: 'Cumplimiento Normativo',
            description: 'Alineación con estándares de seguridad de datos y políticas de control interno.',
          },
        ],
        speakerNotes: 'Estos son los 4 pilares de beneficio tangibles que entregará la solución.',
      },
      {
        id: 'slide-5',
        slideNumber: 5,
        layout: images.length > 0 ? 'image-text' : 'steps',
        category: '04. SOLUCIÓN & ARQUITECTURA',
        title: 'Arquitectura y Flujo Técnico',
        subtitle: 'Diseño conceptual de la solución propuesta',
        imageRef: images.length > 0 ? '[IMAGEN_1]' : undefined,
        bullets: [
          'Recepción y validación de parámetros de entrada.',
          'Procesamiento en motor de reglas con aislamiento transaccional.',
          'Persistencia de estados y generación de respuesta estructurada.',
          'Notificación asíncrona a sistemas subscriptores.',
        ],
        steps: [
          { stepNumber: 1, title: 'Recepción', description: 'Consumo del evento y validación de cabeceras de seguridad.' },
          { stepNumber: 2, title: 'Procesamiento', description: 'Ejecución de la lógica transaccional y reglas de validación.' },
          { stepNumber: 3, title: 'Persistencia', description: 'Registro en base de datos con bitácora de auditoría.' },
          { stepNumber: 4, title: 'Respuesta', description: 'Emisión del acuse con firma digital y estado final.' },
        ],
        speakerNotes: 'Explicamos la interacción técnica entre capas y cómo se garantiza la integridad de los datos.',
      },
      {
        id: 'slide-6',
        slideNumber: 6,
        layout: 'conclusion',
        category: '05. CONCLUSIONES & SIGUIENTES PASOS',
        title: 'Plan de Aprobación y Despliegue',
        subtitle: 'Fases recomendadas para inicio inmediato',
        bullets: [
          'Paso 1: Validación y firma formal de esta propuesta técnica.',
          'Paso 2: Aprobación del cronograma y asignación del sprint de desarrollo.',
          'Paso 3: Ejecución de pruebas en ambiente de Calidad (QA) con datos de muestra.',
          'Paso 4: Pase a Producción con acompañamiento técnico de Advansys.',
        ],
        speakerNotes: 'Agradecemos su atención y quedamos atentos a comentarios o preguntas técnicas antes de la firma.',
      },
    ],
  };
}

export function convertProposalToSlideDeck(
  proposal: ProposalSection,
  metadata: MetadataHeader,
  images: UploadedImage[] = []
): SlideDeck {
  const cliente = metadata.cliente || 'Cliente';
  const ticket = metadata.ticketNo || metadata.propuestaNo || 'S/N';
  const proyecto = metadata.nombreProyecto || 'Propuesta de Desarrollo';

  const slides: SlideItem[] = [];

  // Slide 1: Portada
  slides.push({
    id: `slide-${Date.now()}-1`,
    slideNumber: 1,
    layout: 'title',
    category: `TICKET ${ticket}`,
    title: proyecto,
    subtitle: `Presentación Técnica y Ejecutiva de Solución para ${cliente}`,
    speakerNotes: `Presentación formal de la propuesta técnica ${ticket} elaborada por Advansys para ${cliente}.`,
  });

  // Slide 2: Resumen Ejecutivo
  if (proposal.resumenEjecutivo) {
    const sentences = proposal.resumenEjecutivo
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 5);

    slides.push({
      id: `slide-${Date.now()}-2`,
      slideNumber: slides.length + 1,
      layout: 'bullets',
      category: '01. RESUMEN EJECUTIVO',
      title: 'Resumen de la Propuesta',
      subtitle: 'Objetivo y visión general de la solución',
      bullets: sentences.length > 0 ? sentences.slice(0, 4) : [proposal.resumenEjecutivo.slice(0, 260)],
      speakerNotes: 'Resumen ejecutivo de la necesidad y el alcance estratégico del desarrollo.',
    });
  }

  // Slide 3: Beneficios
  if (proposal.beneficios && proposal.beneficios.length > 0) {
    const cards = proposal.beneficios.slice(0, 4).map((b, i) => {
      const parts = b.split(':');
      if (parts.length > 1) {
        return {
          title: parts[0].trim(),
          description: parts.slice(1).join(':').trim(),
        };
      }
      return {
        title: `Beneficio #${i + 1}`,
        description: b,
      };
    });

    slides.push({
      id: `slide-${Date.now()}-3`,
      slideNumber: slides.length + 1,
      layout: 'cards',
      category: '02. BENEFICIOS ESPERADOS',
      title: 'Valor Técnico y Operativo',
      cards,
      speakerNotes: 'Principales beneficios cuantitativos y cualitativos que percibirá la entidad con esta implementación.',
    });
  }

  // Slide 4: Alcance & Entregables
  const scope = proposal.alcanceExclusionesEntregables;
  if (scope) {
    slides.push({
      id: `slide-${Date.now()}-4`,
      slideNumber: slides.length + 1,
      layout: 'two-column',
      category: '03. ALCANCE DEL PROYECTO',
      title: 'Delimitación y Entregables',
      leftTitle: 'Alcance Técnico Incluido',
      leftBullets: scope.alcance?.length ? scope.alcance.slice(0, 4) : ['Desarrollo e integración integral'],
      rightTitle: 'Entregables Formales',
      rightBullets: scope.entregables?.length ? scope.entregables.slice(0, 4) : ['Documentación y paquete de software'],
      speakerNotes: 'Detalle de lo que cubre la presente propuesta técnica.',
    });
  }

  // Slide 5: Objetivo & Solución
  if (proposal.objetivo || proposal.descripcion) {
    slides.push({
      id: `slide-${Date.now()}-5`,
      slideNumber: slides.length + 1,
      layout: 'bullets',
      category: '04. SOLUCIÓN PROPUESTA',
      title: 'Objetivo y Arquitectura Técnica',
      subtitle: proposal.objetivo ? `Objetivo: ${proposal.objetivo.slice(0, 140)}...` : undefined,
      bullets: proposal.descripcion
        ? proposal.descripcion.split('\n').map(s => s.trim()).filter(s => s.length > 10).slice(0, 4)
        : ['Implementación de la arquitectura requerida.'],
      speakerNotes: 'Descripción detallada de la arquitectura de la solución propuesta.',
    });
  }

  // Slide 6: Análisis Operativo (Flujo paso a paso)
  if (proposal.analisisOperativo && proposal.analisisOperativo.length > 0) {
    const steps = proposal.analisisOperativo.slice(0, 4).map((s, i) => ({
      stepNumber: i + 1,
      title: s.titulo.replace(/^Paso\s*\d+[.:\-]?\s*/i, ''),
      description: s.explicacion.slice(0, 160) + (s.explicacion.length > 160 ? '...' : ''),
    }));

    slides.push({
      id: `slide-${Date.now()}-6`,
      slideNumber: slides.length + 1,
      layout: 'steps',
      category: '05. ANÁLISIS OPERATIVO',
      title: 'Flujo de Ejecución Paso a Paso',
      steps,
      speakerNotes: 'Secuencia operativa detallada del comportamiento del sistema.',
    });
  }

  // Slide 7: Imagen / Diagrama (si existe)
  if (images && images.length > 0) {
    slides.push({
      id: `slide-${Date.now()}-7`,
      slideNumber: slides.length + 1,
      layout: 'image-text',
      category: '06. DIAGRAMAS & CAPTURAS',
      title: images[0].title || 'Diagrama Conceptual',
      subtitle: images[0].description || 'Representación gráfica de la solución',
      imageRef: '[IMAGEN_1]',
      bullets: [
        'Diagrama de flujo del proceso operativo.',
        'Mapeo de interacción de componentes y servicios.',
        'Validación visual de la interfaz o mensaje transaccional.',
      ],
      speakerNotes: 'Diagrama ilustrativo para facilitar la comprensión del flujo técnico.',
    });
  }

  // Slide 8: Conclusiones
  slides.push({
    id: `slide-${Date.now()}-8`,
    slideNumber: slides.length + 1,
    layout: 'conclusion',
    category: '07. SIGUIENTES PASOS',
    title: 'Aprobación y Plan de Trabajo',
    subtitle: 'Conclusiones y ruta de implementación',
    bullets: [
      'Revisión y visto bueno de las áreas técnicas y de negocio.',
      'Planificación del pase a ambientes de prueba y homologación.',
      'Despliegue controlado y soporte post-lanzamiento por Advansys.',
    ],
    speakerNotes: 'Agradecemos su tiempo y quedamos atentos a sus preguntas y confirmación.',
  });

  return {
    title: proyecto,
    subtitle: `Presentación Técnica y Ejecutiva — ${cliente}`,
    client: cliente,
    project: proyecto,
    ticketNo: ticket,
    author: 'Advansys Development Team',
    date: metadata.fecha || new Date().toLocaleDateString('es-ES'),
    theme: 'advansys-navy',
    slides,
  };
}
