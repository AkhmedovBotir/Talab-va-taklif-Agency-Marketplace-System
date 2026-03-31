/**
 * Backend barcha javoblarda umumiy tanada: { message, data, error }
 * @see Agent Auth API hujjati
 */

export function getApiErrorMessage(error: unknown, fallback = 'Xatolik yuz berdi'): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  const msg = err?.response?.data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  if (typeof err?.message === 'string' && err.message.trim()) return err.message.trim();
  return fallback;
}

/** Login 400: agent bor, parol bo‘sh — SMS oqimiga yo‘naltirish */
export function isLoginPasswordNotSetMessage(message: string): boolean {
  const n = message.trim().toLowerCase().replace(/[''`´]/g, "'");
  return n.includes("parol hali o'rnatilmagan");
}
