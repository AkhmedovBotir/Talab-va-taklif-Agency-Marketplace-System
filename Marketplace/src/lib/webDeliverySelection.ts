/** Brauzer: bosh sahifada tanlangan yetkazib berish → Qidiruv / maxalla API uchun */

const KEY = 'marketplace_web_delivery_v1';

export type WebDeliverySnap = {
  district_id: number | null;
  mfy_id: number | null;
};

export function readWebDelivery(): WebDeliverySnap {
  if (typeof window === 'undefined') return { district_id: null, mfy_id: null };
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { district_id: null, mfy_id: null };
    const j = JSON.parse(raw) as Record<string, unknown>;
    return {
      district_id: typeof j.district_id === 'number' ? j.district_id : null,
      mfy_id: typeof j.mfy_id === 'number' ? j.mfy_id : null,
    };
  } catch {
    return { district_id: null, mfy_id: null };
  }
}

export function writeWebDelivery(d: WebDeliverySnap): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(d));
  window.dispatchEvent(new CustomEvent('marketplace-delivery'));
}
