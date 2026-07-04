import { MARKETPLACE_MEDIA_BASE } from '../config/marketplaceApi';

/**
 * Backend rasm manzilini `<img src>` uchun to‘liq URL’ga keltiradi.
 *
 * Oddiy mahsulotlar backenddan to‘liq URL bilan keladi, lekin mahalla
 * (local-shop) mahsulot rasmlari `templates/...` nisbiy yo‘l sifatida keladi —
 * ularni media hostiga bog‘lamasak, brauzer joriy sahifaga nisbatan qidiradi
 * va rasm ko‘rinmaydi. Bu yordamchi backenddagi `productmedia.publicOne` bilan
 * bir xil mantiqni takrorlaydi.
 */
export function resolveImageUrl(raw: unknown): string {
  const v = String(raw ?? '').trim();
  if (!v) return '';
  // base64 / data URL — o‘zgartirilmaydi
  if (v.startsWith('data:')) return v;
  if (!v.includes('/') && v.length > 256) return v;
  // allaqachon to‘liq URL
  if (v.startsWith('http://') || v.startsWith('https://')) return v;

  let rel = v.replace(/^\//, '');
  rel = rel.replace(/^uploads\//, '');
  return `${MARKETPLACE_MEDIA_BASE}/uploads/${rel}`;
}
