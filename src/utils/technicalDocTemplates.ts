import { MetadataHeader, ProposalSection, TechnicalDoc } from '../types';

/**
 * Creates a baseline technical documentation template based on metadata and proposal context
 */
export function createDefaultTechnicalDoc(
  metadata: MetadataHeader,
  proposal?: ProposalSection | null
): TechnicalDoc {
  const modulo = metadata.moduloAplicacion || 'Módulo Principal';
  const proyecto = metadata.nombreProyecto || 'Desarrollo de Software';
  const ticket = metadata.ticketNo || 'TK-2026';

  let defaultRuta = `Ruta de Acceso en el Sistema:
• Menú Principal > Operaciones > ${modulo} > Gestión de ${proyecto}
• Formulario / Vista: frm_${modulo.replace(/\s+/g, '_').toLowerCase()}_gestion.aspx / .tsx
• Endpoint / API Base: /api/v1/${modulo.replace(/\s+/g, '-').toLowerCase()}`;

  let defaultFlujo = `Flujo Operativo Interno del Sistema:
1. Evento Disparador: El usuario con permisos accede a la pantalla e ingresa los parámetros requeridos.
2. Capa de Presentación (UI): Valida que los campos obligatorios no estén vacíos y cumplan con las expresiones regulares de formato.
3. Capa de Servicios / API: Recibe el payload JSON, valida la sesión JWT del usuario y abre una transacción en la base de datos.
4. Capa de Lógica de Negocio: Ejecuta las reglas de validación y cálculos técnicos.
5. Capa de Persistencia: Inserta o actualiza los registros en las tablas maestras y de detalle, registrando la auditoría del usuario.
6. Respuesta al Cliente: Retorna código HTTP 200/201 con el identificador generado y actualiza la grilla de datos.`;

  let defaultDiseno = `Diseño de Interfaz y Estructura de Datos:
• Componentes Visuales:
  - Barra superior de filtros y botones de acción (Nuevo, Guardar, Cancelar, Exportar).
  - Formulario modal con pestañas para datos generales y configuración avanzada.
  - Tabla de resultados con paginación en servidor y ordenamiento por columnas.

• Tablas y Entidades de Base de Datos:
  - TBL_${modulo.replace(/\s+/g, '_').toUpperCase()}_CABECERA (Id, Codigo, Fecha, Estado, UsuarioCrea, FechaCrea)
  - TBL_${modulo.replace(/\s+/g, '_').toUpperCase()}_DETALLE (Id, CabeceraId, ItemNo, Descripcion, Valor, Estado)
  - TBL_AUDITORIA_LOG (Id, Entidad, RegistroId, Accion, Usuario, Timestamp, DetalleJSON)`;

  let defaultConsideraciones = `Consideraciones Técnicas y de Seguridad:
• Seguridad y Roles: Requiere rol de operador o supervisor autorizado en el sistema de permisos.
• Transaccionalidad: Todas las operaciones de escritura deben ejecutarse dentro de un bloque de transacción (BEGIN TRAN ... COMMIT / ROLLBACK).
• Control de Concurrencia: Utilizar bloqueo optimista con campo RowVersion / VersionTimestamp para prevenir sobreescrituras simultáneas.
• Auditoría: Todo cambio de estado debe quedar registrado en la bitácora con IP, usuario y valores anteriores/nuevos.
• Rendimiento: Indexar las columnas de búsqueda frecuente (Fecha, Codigo, Estado) y limitar la carga inicial a 50 registros por página.`;

  let defaultCodigo = `-- Ejemplo de Estructura SQL / Script de Base de Datos
CREATE TABLE dbo.TBL_${modulo.replace(/\s+/g, '_').toUpperCase()}_CABECERA (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TicketNo VARCHAR(50) NOT NULL DEFAULT '${ticket}',
    ClienteId INT NOT NULL,
    FechaRegistro DATETIME NOT NULL DEFAULT GETDATE(),
    Estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    UsuarioCreacion VARCHAR(100) NOT NULL,
    FechaModificacion DATETIME NULL
);

-- Endpoint Payload JSON de Ejemplo
/*
POST /api/v1/${modulo.replace(/\s+/g, '-').toLowerCase()}/procesar
{
  "ticketNo": "${ticket}",
  "codigoOperacion": "OP-2026-001",
  "parametros": {
    "modoEjecucion": "ONLINE",
    "validarDuplicados": true
  }
}
*/`;

  // If proposal has operational steps, enrich the internal flow
  if (proposal && proposal.analisisOperativo && proposal.analisisOperativo.length > 0) {
    const stepsSummary = proposal.analisisOperativo
      .map((s, idx) => `${idx + 1}. ${s.titulo}: ${s.explicacion.slice(0, 140)}${s.explicacion.length > 140 ? '...' : ''}`)
      .join('\n');
    defaultFlujo = `Flujo Operativo Interno (derivado de la propuesta):\n${stepsSummary}`;
  }

  return {
    ruta: defaultRuta,
    flujoOperativo: defaultFlujo,
    diseno: defaultDiseno,
    consideracionesTecnicas: defaultConsideraciones,
    codigoEjemplo: defaultCodigo,
    modulosAfectados: [modulo],
    tablasBD: [`TBL_${modulo.replace(/\s+/g, '_').toUpperCase()}_CABECERA`, `TBL_${modulo.replace(/\s+/g, '_').toUpperCase()}_DETALLE`],
    lastUpdated: new Date().toISOString()
  };
}
