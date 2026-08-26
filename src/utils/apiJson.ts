export async function readApiJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text.trim()) {
    if (response.status === 404) {
      throw new Error(
        'El servidor no tiene esta función cargada. Detén el proceso y vuelve a ejecutar npm run dev.'
      );
    }
    throw new Error(
      `El servidor respondió vacío (HTTP ${response.status}). Comprueba que npm run dev esté activo y que GEMINI_API_KEY esté en .env.`
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Respuesta inválida del servidor (HTTP ${response.status}).`);
  }
}
