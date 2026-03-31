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

export function resolveOrderLineImageUri(
  productId: number,
  lineImageUrl: string | undefined,
  listMap: Map<string, string>,
  fetched: Record<number, string>
): string | undefined {
  if (lineImageUrl?.trim()) return lineImageUrl.trim();
  return listMap.get(String(productId)) ?? fetched[productId];
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
