import React from 'react';
import { X } from 'lucide-react';
import type { LocalShopProduct } from '../types';
import { renderProductDescriptionWeb } from '../lib/renderProductDescriptionWeb';

type Props = {
  product: LocalShopProduct | null;
  onClose: () => void;
  onAddToCart: (p: LocalShopProduct) => void;
  onCartDelta: (productId: string, delta: number) => void;
  inCartQty: number;
};

export function WebLocalProductDetailOverlay({ product, onClose, onAddToCart, onCartDelta, inCartQty }: Props) {
  if (!product) return null;
  const stock = Math.max(0, Math.floor(Number(product.quantity) || 0));
  const atMax = inCartQty >= stock;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute left-1/2 top-1/2 max-h-[90vh] w-[min(980px,95vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
          aria-label="Yopish"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
          <div className="bg-gray-50">
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full min-h-[320px] w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="p-6 md:p-8">
            <p className="text-[11px] font-black uppercase tracking-widest text-orange-500">Maxalla mahsuloti</p>
            <h2 className="mt-2 text-2xl font-black text-gray-900">{product.name}</h2>

            <div className="mt-4 flex items-end justify-between">
              <p className="text-3xl font-black text-orange-500">
                {product.price.toLocaleString()} <span className="text-sm font-bold">so&apos;m</span>
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{product.quantity} ta mavjud</p>
            </div>

            <div className="prose prose-sm mt-5 max-w-none text-gray-600">
              {renderProductDescriptionWeb(product.description)}
            </div>

            <div className="mt-7">
              {stock <= 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">
                  Omborda yo&apos;q
                </div>
              ) : inCartQty <= 0 ? (
                <button
                  type="button"
                  onClick={() => onAddToCart(product)}
                  className="w-full rounded-2xl bg-gray-900 px-4 py-3 text-center text-[11px] font-black uppercase tracking-wider text-white transition hover:bg-orange-500"
                >
                  Savatga qo&apos;shish
                </button>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => onCartDelta(product.id, -1)}
                    className="h-10 w-10 rounded-xl bg-white text-xl font-black text-gray-700"
                  >
                    -
                  </button>
                  <span className="text-sm font-black text-gray-900">{inCartQty}</span>
                  <button
                    type="button"
                    onClick={() => !atMax && onCartDelta(product.id, 1)}
                    disabled={atMax}
                    className="h-10 w-10 rounded-xl bg-white text-xl font-black text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
