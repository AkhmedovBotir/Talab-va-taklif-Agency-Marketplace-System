import type { MarketplaceOrderItemLine, Product } from '../types';
import { api } from '../services/api';
import { normalizeMarketplaceProduct } from '../services/normalizeProduct';

/** Kontekstdagi mahsulotlar ro‘yxatidan id → birinchi “haqiqiy” rasm. */
export function productImageMapFromList(products: Product[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of products) {
    const id = String(p.id);
    if (map.has(id)) continue;
    for (const u of p.images ?? []) {
      if (u && typeof u === 'string' && !u.includes('placehold.co')) {
        map.set(id, u);
        break;
      }
    }
  }
  return map;
}

/** Buyurtma qatorida rasm bo‘lmasa — mahsulot kartasidan olish. */
export async function fetchProductImageById(productId: number): Promise<string | undefined> {
  if (!productId) return undefined;
  try {
    const raw = await api.products.get(String(productId));
    if (!raw || typeof raw !== 'object') return undefined;
    const p = normalizeMarketplaceProduct(raw);
    for (const u of p.images ?? []) {
      if (u && !u.includes('placehold.co')) return u;
    }
    return p.images?.[0];
  } catch {
    return undefined;
  }
}

/** Maxalla order qatori uchun rasm olish (`local_shop_product_id` orqali). */
export async function fetchLocalShopProductImageById(
  localShopProductId: number,
  localShopId?: number
): Promise<string | undefined> {
  if (!localShopProductId) return undefined;
  try {
    const list = await api.localShopProducts.list({
      page: 1,
      limit: 100,
      local_shop_id: localShopId,
    });
    const item = list.find((p) => Number(p.id) === Number(localShopProductId));
    if (!item) return undefined;
    for (const u of item.images ?? []) {
      if (u && typeof u === 'string' && !u.includes('placehold.co')) return u;
    }
    return item.images?.[0];
  } catch {
    return undefined;
  }
}

export function resolveOrderLineImageUri(
  productId: number,
  lineImageUrl: string | undefined,
  listMap: Map<string, string>,
  fetched: Record<number, string>,
  lookupId?: number
): string | undefined {
  if (lineImageUrl?.trim()) return lineImageUrl.trim();
  const key = lookupId ?? productId;
  return listMap.get(String(productId)) ?? fetched[key];
}

export function formatOrderLineQtyLabel(line: MarketplaceOrderItemLine): string {
  const u = (line.unit?.trim() || 'dona').trim();
  const us = line.unit_size?.trim();
  if (us) return `${line.quantity} × ${us} ${u}`;
  return `${line.quantity} ${u}`;
}

/** Masalan: "1 litr narxi", "1 dona narxi" */
export function formatOrderLineUnitPriceLabel(line: MarketplaceOrderItemLine): string {
  const u = line.unit?.trim() || 'dona';
  return `1 ${u} narxi`;
}
