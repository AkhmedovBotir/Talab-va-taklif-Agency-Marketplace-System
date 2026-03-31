import { Product } from '../types';

const PLACEHOLDER_IMG = 'https://placehold.co/400x400/f3f4f6/94a3b8?text=No+image';

/** API / qidiruvdan kelgan mahsulotni ichki `Product` ko‘rinishiga keltiradi. */
export function normalizeMarketplaceProduct(row: any): Product {
  const imgs = Array.isArray(row?.images)
    ? row.images.map((u: unknown) => String(u)).filter(Boolean)
    : row?.image
      ? [String(row.image)]
      : [];
  const images = imgs.length ? imgs : [PLACEHOLDER_IMG];
  return {
    id: String(row?.id ?? row?.product_id ?? ''),
    product_code: Number(row?.product_code ?? 0),
    contragent_id: Number(row?.contragent_id ?? 0),
    name: String(row?.name ?? ''),
    description: typeof row?.description === 'string' ? row.description : JSON.stringify(row?.description ?? ''),
    price: Number(row?.price ?? 0),
    original_price: Number(row?.original_price ?? row?.price ?? 0),
    images,
    category_id: Number(row?.category_id ?? 0),
    subcategory_id: Number(row?.subcategory_id ?? 0),
    quantity: Number(row?.quantity ?? 0),
    unit: String(row?.unit ?? 'dona'),
    unit_size: String(row?.unit_size ?? '1'),
    status: row?.status === 'inactive' ? 'inactive' : 'active',
    kpi_bonus_percent: Number(row?.kpi_bonus_percent ?? 0),
    kpi_bonus_amount: Number(row?.kpi_bonus_amount ?? 0),
    moderation_status: (row?.moderation_status as Product['moderation_status']) ?? 'approved',
    rejection_reason: String(row?.rejection_reason ?? ''),
    delivery_areas: row?.delivery_areas ?? { region_ids: [], district_ids: [] },
    created_at: String(row?.created_at ?? ''),
    updated_at: String(row?.updated_at ?? ''),
  };
}
