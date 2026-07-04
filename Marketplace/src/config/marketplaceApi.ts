/**
 * Marketplace REST va WebSocket uchun API bazasi.
 * Boshqa muhitga o‘tkazishda shu fayldagi qiymatni o‘zgartiring (env talab qilinmaydi).
 */
export const MARKETPLACE_API_BASE = 'https://api.ttsa.uz/api/v1';

/** Rasm/fayl uchun host (`/api/v1` siz). Masalan: `https://api.ttsa.uz`. */
export const MARKETPLACE_MEDIA_BASE = (() => {
  try {
    return new URL(MARKETPLACE_API_BASE).origin;
  } catch {
    return 'https://api.ttsa.uz';
  }
})();

/** `GET .../notifications/ws` — HTTPS bo‘lsa `wss://`. */
export function buildMarketplaceNotificationsWsUrl(token: string): string {
  try {
    const url = new URL(MARKETPLACE_API_BASE);
    const wsProto = url.protocol === 'http:' ? 'wss:' : 'ws:';
    const basePath = url.pathname.replace(/\/$/, '');
    const wsPath = `${basePath}/marketplace/me/notifications/ws`;
    return `${wsProto}//${url.host}${wsPath}?token=${encodeURIComponent(token)}`;
  } catch {
    return `wss://192.168.1.6:8081/api/v1/marketplace/me/notifications/ws?token=${encodeURIComponent(token)}`;
  }
}
