const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

/**
 * Displays a date as día-mes-año in Spanish, e.g. "18 de agosto del 2026".
 * Accepts ISO YYYY-MM-DD (typical metadata.fecha) and DD-MM-YYYY / DD/MM/YYYY.
 */
export function formatFechaEs(fecha?: string | null): string {
  const raw = (fecha || '').trim();
  if (!raw) return '—';

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const day = Number(iso[3]);
    const month = Number(iso[2]);
    const year = iso[1];
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${day} de ${MESES_ES[month - 1]} del ${year}`;
    }
  }

  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = dmy[3];
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${day} de ${MESES_ES[month - 1]} del ${year}`;
    }
  }

  if (/^\d{1,2}\s+de\s+\w+\s+del?\s+\d{4}/i.test(raw)) {
    return raw;
  }

  return raw;
}
