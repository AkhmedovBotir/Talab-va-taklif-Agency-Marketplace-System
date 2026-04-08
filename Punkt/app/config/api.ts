/**
 * Backend manzili (.env emas — bitta joydan boshqarish).
 * REST va WebSocket `getApiBaseUrl()` orqali shu asosdan yig‘iladi.
 */
export const API_ORIGIN = 'https://api.ttsa.uz';

/** API versiya prefiksi (loyiha marshrutlari `/api/v1/...` ostida) */
export const API_VERSION_PREFIX = '/api/v1';

/** Trailing slashsiz, masalan: https://api.ttsa.uz/api/v1 */
export const API_BASE_URL = `${API_ORIGIN.replace(/\/$/, '')}${API_VERSION_PREFIX}`;
