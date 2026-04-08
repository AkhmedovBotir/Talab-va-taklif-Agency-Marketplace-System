/**
 * Kontragent API manzili (production).
 * Lokal serverga qaytish uchun shu faylda `API_ORIGIN` ni o'zgartiring.
 */
const API_ORIGIN = 'https://api.ttsa.uz';

/** Qo'l dagi REST (`/api/contragent/...`, mahsulotlar, buyurtmalar va hokazo) */
export function getLegacyApiBaseUrl(): string {
  return API_ORIGIN;
}

/** Contragent auth va `me/*` — `/api/v1` */
export function getContragentV1BaseUrl(): string {
  return `${API_ORIGIN}/api/v1`;
}

/** Kontragent notification inbox WebSocket (`wss`, query: `token`). */
export function getContragentNotificationsWebSocketUrl(token: string): string {
  const wsOrigin = API_ORIGIN.replace(/^https:\/\//i, 'wss://');
  return `${wsOrigin}/api/v1/contragents/me/notifications/ws?token=${encodeURIComponent(token)}`;
}

/** Debug / xabarlar uchun host nomi */
export function getResolvedApiHost(): string {
  try {
    return new URL(API_ORIGIN).host;
  } catch {
    return 'api.ttsa.uz';
  }
}
