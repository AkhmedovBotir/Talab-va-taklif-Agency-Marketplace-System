/**
 * Ilova konfiguratsiyasi – .env orqali o'zgartirish mumkin
 */

/** Brauzer tab sarlavhasi va login sahifasida ishlatiladi */
export const APP_NAME = typeof import.meta.env !== 'undefined' && import.meta.env.VITE_APP_NAME
  ? import.meta.env.VITE_APP_NAME
  : "Maxalla Do'konlari";

/** Login sahifasidagi qisqa nom (masalan: "Maxalla dokoni") */
export const APP_SHORT_NAME = typeof import.meta.env !== 'undefined' && import.meta.env.VITE_APP_SHORT_NAME
  ? import.meta.env.VITE_APP_SHORT_NAME
  : "Maxalla dokoni";

/** API base URL */
export const API_BASE_URL = typeof import.meta.env !== 'undefined' && import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:5000';
