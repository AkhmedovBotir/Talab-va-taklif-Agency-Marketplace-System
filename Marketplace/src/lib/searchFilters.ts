import type { Product } from '../types';

export type ProductFilters = {
  contragentId: number | null;
  categoryId: number | null;
  subcategoryId: number | null;
  minPrice: number | null;
  maxPrice: number | null;
};

export const EMPTY_PRODUCT_FILTERS: ProductFilters = {
  contragentId: null,
  categoryId: null,
  subcategoryId: null,
  minPrice: null,
  maxPrice: null,
};

export function filtersActive(f: ProductFilters): boolean {
  return (
    f.contragentId != null ||
    f.categoryId != null ||
    f.subcategoryId != null ||
    f.minPrice != null ||
    f.maxPrice != null
  );
}

/** Maxalla mahsulotlarida kontragent filtri ishlatilmaydi */
export function filtersActiveMahalla(f: ProductFilters): boolean {
  return (
    f.categoryId != null ||
    f.subcategoryId != null ||
    f.minPrice != null ||
    f.maxPrice != null
  );
}

export function filterProductsByFilters(products: Product[], f: ProductFilters): Product[] {
  return products.filter((p) => {
    if (f.contragentId != null && Number(p.contragent_id) !== f.contragentId) return false;
    if (f.subcategoryId != null) {
      if (Number(p.subcategory_id) !== f.subcategoryId) return false;
    } else if (f.categoryId != null && Number(p.category_id) !== f.categoryId) return false;
    if (f.minPrice != null && p.price < f.minPrice) return false;
    if (f.maxPrice != null && p.price > f.maxPrice) return false;
    return true;
  });
}
