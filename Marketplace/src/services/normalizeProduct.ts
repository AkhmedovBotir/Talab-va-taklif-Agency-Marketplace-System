import { LocalShopProduct, Product } from '../types';
import { normalizeLocalShopWorkingHours } from '../lib/localShopWorkingHours';

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
    delivery_areas: {
      region_ids: Array.isArray(row?.delivery_areas?.region_ids)
        ? row.delivery_areas.region_ids.map((id: unknown) => Number(id)).filter((n: number) => Number.isFinite(n) && n > 0)
        : [],
      district_ids: Array.isArray(row?.delivery_areas?.district_ids)
        ? row.delivery_areas.district_ids.map((id: unknown) => Number(id)).filter((n: number) => Number.isFinite(n) && n > 0)
        : [],
    },
    created_at: String(row?.created_at ?? ''),
    updated_at: String(row?.updated_at ?? ''),
  };
}

/** NoAuth local shop product endpointidan kelgan itemni `Product`ga moslaydi. */
export function normalizeLocalShopProduct(row: any): LocalShopProduct {
  const template = row?.template ?? {};
  const templateImages = Array.isArray(template?.images)
    ? template.images.map((u: unknown) => String(u)).filter(Boolean)
    : [];
  const rowImages = Array.isArray(row?.images) ? row.images.map((u: unknown) => String(u)).filter(Boolean) : [];
  const imgs = templateImages.length
    ? templateImages
    : rowImages.length
      ? rowImages
      : row?.image
        ? [String(row.image)]
        : [];
  const images = imgs.length ? imgs : [PLACEHOLDER_IMG];

  return {
    id: String(row?.id ?? ''),
    product_code: Number(row?.template_id ?? template?.id ?? 0),
    contragent_id: Number(row?.local_shop_id ?? row?.shop?.id ?? 0),
    name: String(template?.name ?? row?.name ?? row?.product_name ?? ''),
    description:
      typeof template?.description === 'string'
        ? template.description
        : typeof row?.description === 'string'
          ? row.description
        : JSON.stringify(template?.description ?? ''),
    price: Number(row?.price ?? 0),
    original_price: Number(row?.original_price ?? row?.price ?? 0),
    images,
    category_id: Number(template?.category_id ?? row?.category_id ?? 0),
    subcategory_id: Number(template?.subcategory_id ?? row?.subcategory_id ?? 0),
    quantity: Number(row?.quantity ?? 0),
    unit: String(template?.unit ?? row?.unit ?? 'dona'),
    unit_size: String(template?.unit_size ?? row?.unit_size ?? '1'),
    status: 'active',
    kpi_bonus_percent: 0,
    kpi_bonus_amount: 0,
    moderation_status: 'approved',
    rejection_reason: '',
    delivery_areas: {
      region_ids: [],
      district_ids: [],
    },
    local_shop: row?.shop || row?.local_shop
      ? (() => {
          const shop = row.shop ?? row.local_shop;
          return {
            id: Number(shop.id ?? 0),
            name: String(shop.name ?? ''),
            region_id: shop.region_id != null ? Number(shop.region_id) : undefined,
            district_id: shop.district_id != null ? Number(shop.district_id) : undefined,
            mfy_id: shop.mfy_id != null ? Number(shop.mfy_id) : undefined,
            phone: shop.phone != null ? String(shop.phone) : undefined,
            working_hours: normalizeLocalShopWorkingHours(shop.working_hours),
          };
        })()
      : undefined,
    local_delivery_areas: Array.isArray(row?.delivery_areas)
      ? row.delivery_areas.map((a: any) => ({
          mfy_id: Number(a?.mfy_id ?? 0),
          mfy_name: String(a?.mfy_name ?? ''),
        }))
      : [],
    created_at: '',
    updated_at: '',
  };
}
