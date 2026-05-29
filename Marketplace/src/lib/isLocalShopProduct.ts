import type { LocalShopProduct, Product } from '../types';

export function isLocalShopProduct(p: Product | null | undefined): p is LocalShopProduct {
  return !!(p && p.local_shop && Number(p.local_shop.id) > 0);
}
