/**
 * Marketplace REST va WebSocket uchun API bazasi.
 * Boshqa muhitga o‘tkazishda shu fayldagi qiymatni o‘zgartiring (env talab qilinmaydi).
 */
export const MARKETPLACE_API_BASE = 'https://api.ttsa.uz/api/v1';

/** `GET .../notifications/ws` — HTTPS bo‘lsa `wss://`. */
export function buildMarketplaceNotificationsWsUrl(token: string): string {
  try {
    const url = new URL(MARKETPLACE_API_BASE);
    const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const basePath = url.pathname.replace(/\/$/, '');
    const wsPath = `${basePath}/marketplace/me/notifications/ws`;
    return `${wsProto}//${url.host}${wsPath}?token=${encodeURIComponent(token)}`;
  } catch {
    return `wss://api.ttsa.uz/api/v1/marketplace/me/notifications/ws?token=${encodeURIComponent(token)}`;
  }
}
