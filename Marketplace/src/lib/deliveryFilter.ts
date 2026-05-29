import type { ContragentBrowseItem, LocalShopProduct, Product, Region, District, MFY } from '../types';

export type DeliverySelection = {
  regionId: number | null;
  districtId: number | null;
  mfyId: number | null;
};

function normalizeIdList(raw: unknown[] | undefined): number[] {
  if (!raw?.length) return [];
  return raw
    .map((id) => Number(id))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function deliverySelectionFromIds(
  regionId?: number | null,
  districtId?: number | null,
  mfyId?: number | null
): DeliverySelection {
  return {
    regionId: regionId ?? null,
    districtId: districtId ?? null,
    mfyId: mfyId ?? null,
  };
}

export function deliverySelectionFromMarketplace(m: {
  selectedRegion: Region | null;
  selectedDistrict: District | null;
  selectedMFY: MFY | null;
  hasCompleteDeliveryLocation?: boolean;
}): DeliverySelection {
  if (m.hasCompleteDeliveryLocation === false) {
    return { regionId: null, districtId: null, mfyId: null };
  }
  return deliverySelectionFromIds(m.selectedRegion?.id, m.selectedDistrict?.id, m.selectedMFY?.id);
}

/** Asosiy yetkazish manzili to‘liq tanlangan (viloyat + tuman + MFY). */
export function hasDeliverySelection(sel: DeliverySelection): boolean {
  return sel.regionId != null && sel.districtId != null && sel.mfyId != null;
}

/**
 * Bozor mahsuloti tanlangan manzilga yetkaziladimi.
 * `delivery_areas.district_ids` bo‘lsa — faqat shu tuman(lar); viloyat bilan “yumshoq” moslash yo‘q.
 */
export function productDeliversTo(product: Product, sel: DeliverySelection): boolean {
  if (!hasDeliverySelection(sel)) return false;

  const regionIds = normalizeIdList(product.delivery_areas?.region_ids);
  const districtIds = normalizeIdList(product.delivery_areas?.district_ids);

  if (regionIds.length === 0 && districtIds.length === 0) return true;

  if (districtIds.length > 0) {
    return sel.districtId != null && districtIds.includes(sel.districtId);
  }

  return sel.regionId != null && regionIds.includes(sel.regionId);
}

export function filterProductsForDelivery(products: Product[], sel: DeliverySelection): Product[] {
  if (!hasDeliverySelection(sel)) return [];
  return products.filter((p) => productDeliversTo(p, sel));
}

/** Kontragent (banner) tanlangan manzilga xizmat ko‘rsatadimi. */
export function contragentDeliversTo(
  item: Pick<ContragentBrowseItem, 'region_id' | 'district_id' | 'mfy_id' | 'delivery_areas'>,
  sel: DeliverySelection
): boolean {
  if (!hasDeliverySelection(sel)) return false;

  if (sel.mfyId != null && item.mfy_id != null && Number(item.mfy_id) === sel.mfyId) return true;
  if (sel.districtId != null && item.district_id != null && Number(item.district_id) === sel.districtId) {
    return true;
  }

  const districtIds = normalizeIdList(item.delivery_areas?.district_ids);
  const regionIds = normalizeIdList(item.delivery_areas?.region_ids);

  if (districtIds.length > 0) {
    return sel.districtId != null && districtIds.includes(sel.districtId);
  }

  if (regionIds.length > 0) {
    return sel.regionId != null && regionIds.includes(sel.regionId);
  }

  if (sel.regionId != null && item.region_id != null && Number(item.region_id) === sel.regionId) return true;

  return false;
}

/** Maxalla mahsuloti — MFY ro‘yxati yoki do‘kon manzili bo‘yicha. */
export function localProductDeliversTo(product: LocalShopProduct, sel: DeliverySelection): boolean {
  if (!hasDeliverySelection(sel)) return false;

  const areas = product.local_delivery_areas;
  if (areas && areas.length > 0) {
    return areas.some((a) => Number(a.mfy_id) === sel.mfyId);
  }

  const shop = product.local_shop;
  if (shop?.mfy_id != null && sel.mfyId != null) return Number(shop.mfy_id) === sel.mfyId;
  if (shop?.district_id != null && sel.districtId != null) return Number(shop.district_id) === sel.districtId;

  return true;
}

export function filterLocalProductsForDelivery(products: LocalShopProduct[], sel: DeliverySelection): LocalShopProduct[] {
  if (!hasDeliverySelection(sel)) return [];
  return products.filter((p) => localProductDeliversTo(p, sel));
}
