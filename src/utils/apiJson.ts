export function cleanErrorMessage(raw: string | any): string {
  if (!raw) return 'Ocurrió un error inesperado al procesar la solicitud.';
  const str = typeof raw === 'string' ? raw : raw?.message || JSON.stringify(raw);

  // Try extracting nested JSON error object if stringified
  try {
    const jsonMatch = str.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.code === 503 || parsed?.error?.status === 'UNAVAILABLE') {
        return 'El servicio de IA de Google está experimentando alta demanda temporal en sus servidores. Por favor, reintenta en unos momentos.';
      }
      if (parsed?.error?.code === 429 || parsed?.error?.status === 'RESOURCE_EXHAUSTED') {
        return 'Límite de solicitudes de IA alcanzado momentáneamente. Espera unos segundos y vuelve a presionar Generar.';
      }
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    }
  } catch {
    // Ignore and proceed
  }

  if (str.includes('503') || str.includes('high demand') || str.includes('UNAVAILABLE')) {
    return 'El servicio de IA está experimentando alta demanda temporal en sus servidores. Por favor, reintenta en unos instantes.';
  }
  if (str.includes('429') || str.includes('RESOURCE_EXHAUSTED')) {
    return 'Límite temporal de peticiones alcanzado. Espera unos segundos y reintenta.';
  }

  return str;
}

export async function readApiJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text.trim()) {
    if (response.status === 404) {
      throw new Error(
        'El servidor no tiene esta función cargada. Comprueba que el servidor esté activo.'
      );
    }
    throw new Error(
      `El servidor respondió vacío (HTTP ${response.status}). Comprueba que el servidor esté activo y que GEMINI_API_KEY esté configurada.`
    );
  }
  try {
    const data = JSON.parse(text);
    if (data && data.error) {
      data.error = cleanErrorMessage(data.error);
    }
    return data;
  } catch {
    throw new Error(`Respuesta inválida del servidor (HTTP ${response.status}).`);
  }
}

