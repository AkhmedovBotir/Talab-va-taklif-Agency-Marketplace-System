import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Package,
  ShoppingCart,
  Maximize2,
  Minus,
  Plus,
  Star,
} from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { renderProductDescriptionWeb } from '../lib/renderProductDescriptionWeb';
import { api } from '../services/api';

type Props = {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
  onCartDelta: (productId: string, delta: number) => void;
  /** Savatdagi dona (shu mahsulot uchun) */
  inCartQty: number;
};

export function WebProductDetailCartPanel({
  product,
  inCartQty,
  stock,
  atMax,
  outOfStock,
  onAddToCart,
  onCartDelta,
}: {
  product: Product;
  inCartQty: number;
  stock: number;
  atMax: boolean;
  outOfStock: boolean;
  onAddToCart: (p: Product) => void;
  onCartDelta: (productId: string, delta: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Narxi</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-black text-orange-500 md:text-4xl">
              {product.price.toLocaleString()} <span className="text-sm font-bold">so&apos;m</span>
            </p>
            {product.original_price > product.price ? (
              <p className="text-lg font-bold text-gray-300 line-through">
                {product.original_price.toLocaleString()}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {outOfStock ? (
        <div className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 py-4 text-sm font-black uppercase tracking-wider text-gray-400 md:py-5">
          Omborda yo&apos;q
        </div>
      ) : inCartQty <= 0 ? (
        <button
          type="button"
          onClick={() => onAddToCart(product)}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-transparent bg-gray-900 py-4 font-bold text-white shadow-2xl shadow-gray-200 transition-all hover:border-white/20 hover:bg-orange-500 active:scale-[0.98] md:py-5"
        >
          <ShoppingCart size={22} />
          Savatga qo&apos;shish
        </button>
      ) : (
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 py-2 pl-2 pr-2">
            <button
              type="button"
              onClick={() => onCartDelta(product.id, -1)}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white transition-colors hover:bg-gray-100"
              aria-label="Kamaytirish"
            >
              <Minus size={20} className="text-slate-600" />
            </button>
            <span className="min-w-[40px] text-center text-lg font-black text-gray-900">{inCartQty}</span>
            <button
              type="button"
              onClick={() => !atMax && onCartDelta(product.id, 1)}
              disabled={atMax}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl bg-white transition-colors hover:bg-gray-100',
                atMax && 'cursor-not-allowed opacity-40'
              )}
              aria-label="Oshirish"
            >
              <Plus size={20} className="text-slate-600" />
            </button>
          </div>
          <p className="text-center text-[11px] font-semibold text-gray-400">
            Savatdagi miqdor · omborda {stock} ta
          </p>
        </div>
      )}
    </div>
  );
}

export function WebProductDetailOverlay({ product, onClose, onAddToCart, onCartDelta, inCartQty }: Props) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<{ average: number; total: number; items: Array<{ id: number; score: number; note?: string; comment_template?: string }> }>({
    average: 0,
    total: 0,
    items: [],
  });

  useEffect(() => {
    setActiveImageIndex(0);
    setIsLightboxOpen(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product || product.images.length <= 1 || isLightboxOpen) return;
    const t = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % product.images.length);
    }, 3000);
    return () => clearInterval(t);
  }, [product, isLightboxOpen]);

  useEffect(() => {
    if (!product) return;
    const pid = Number(product.id);
    if (!Number.isFinite(pid) || pid < 1) return;
    let cancelled = false;
    void api.productRatings.get(pid, { limit: 10 }).then((res) => {
      if (cancelled) return;
      setRatingSummary({
        average: res.average_score || 0,
        total: res.total_ratings || 0,
        items: res.items || [],
      });
    }).catch(() => {
      if (cancelled) return;
      setRatingSummary({ average: 0, total: 0, items: [] });
    });
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  if (!product) return null;

  const stock = Math.max(0, Math.floor(Number(product.quantity) || 0));
  const atMax = inCartQty >= stock;
  const outOfStock = stock <= 0;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex max-md:items-stretch max-md:justify-start max-md:bg-white md:items-center md:justify-center md:bg-black/70 md:backdrop-blur-xl md:p-4 xl:p-10"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative flex h-full min-h-0 w-full flex-col bg-white shadow-2xl max-md:min-h-[100dvh] max-md:rounded-none max-md:shadow-none md:mb-0 md:max-h-[90vh] md:max-w-5xl lg:h-auto lg:flex-row lg:overflow-hidden lg:rounded-[48px] lg:safe-area-inset-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white/90 text-gray-900 shadow-xl backdrop-blur-sm transition-all hover:bg-white active:scale-90"
            >
              <X size={24} />
            </button>

            <div className="group relative aspect-square bg-gray-50 lg:aspect-auto lg:w-1/2">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImageIndex}
                  src={product.images[activeImageIndex]}
                  alt={product.name}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="h-full w-full cursor-zoom-in object-cover"
                  onClick={() => setIsLightboxOpen(true)}
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {product.images.length > 1 && (
                <>
                  <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                    {product.images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImageIndex(i)}
                        className={cn(
                          'h-1.5 rounded-full transition-all duration-300',
                          activeImageIndex === i ? 'w-8 bg-orange-500' : 'w-2 bg-white/50'
                        )}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex(
                        (prev) => (prev - 1 + product.images.length) % product.images.length
                      )
                    }
                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev + 1) % product.images.length)}
                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
              >
                <Maximize2 size={20} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col bg-white lg:w-1/2">
              <div className="flex-1 overflow-y-auto p-8 pb-6 lg:p-12 lg:pb-12">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
                    <Info size={14} />
                    Mahsulot haqida
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-600">
                    <Package size={12} />
                    {product.quantity} ta mavjud
                  </div>
                </div>

                <h2 className="mb-4 text-3xl font-black leading-tight text-gray-900 md:text-4xl">{product.name}</h2>

                <div className="prose prose-sm mb-8 max-w-none leading-relaxed text-gray-500">
                  {renderProductDescriptionWeb(product.description)}
                </div>

                <div className="mb-8 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Kod</p>
                    <p className="font-bold text-gray-900">#{product.product_code}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Birlik</p>
                    <p className="font-bold text-gray-900">
                      {product.unit_size} {product.unit}
                    </p>
                  </div>
                </div>

                <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="fill-amber-500 text-amber-500" />
                    <span className="text-sm font-black text-slate-800">
                      {ratingSummary.average > 0 ? ratingSummary.average.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">({ratingSummary.total} baho)</span>
                  </div>
                  {ratingSummary.items.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {ratingSummary.items.slice(0, 4).map((r) => (
                        <div key={r.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} size={12} className={i <= r.score ? 'fill-amber-500 text-amber-500' : 'text-slate-300'} />
                            ))}
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-600">{r.note || r.comment_template || 'Izoh qoldirilmagan'}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="hidden flex-col gap-6 border-t border-gray-100 pt-8 lg:flex">
                  <WebProductDetailCartPanel
                    product={product}
                    inCartQty={inCartQty}
                    stock={stock}
                    atMax={atMax}
                    outOfStock={outOfStock}
                    onAddToCart={onAddToCart}
                    onCartDelta={onCartDelta}
                  />
                </div>
              </div>

              <div className="sticky bottom-0 z-20 shrink-0 border-t border-gray-100 bg-white/95 p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
                <WebProductDetailCartPanel
                  product={product}
                  inCartQty={inCartQty}
                  stock={stock}
                  atMax={atMax}
                  outOfStock={outOfStock}
                  onAddToCart={onAddToCart}
                  onCartDelta={onCartDelta}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute right-6 top-6 z-10 rounded-full p-2 text-white transition-colors hover:bg-white/10"
            >
              <X size={32} />
            </button>
            {product.images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
                  }}
                  className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
                  aria-label="Oldingi rasm"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev + 1) % product.images.length);
                  }}
                  className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
                  aria-label="Keyingi rasm"
                >
                  <ChevronRight size={28} />
                </button>
                <p className="absolute left-0 right-0 top-8 z-10 text-center text-sm font-bold text-white/80">
                  {activeImageIndex + 1} / {product.images.length}
                </p>
              </>
            ) : null}
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImageIndex}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={product.images[activeImageIndex]}
                className="max-h-[78vh] max-w-full rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>
            {product.images.length > 1 && (
              <div className="absolute bottom-10 left-1/2 flex max-w-full -translate-x-1/2 gap-4 overflow-x-auto p-4">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(i);
                    }}
                    className={cn(
                      'h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                      activeImageIndex === i ? 'scale-110 border-orange-500' : 'border-transparent opacity-50'
                    )}
                  >
                    <img src={img} className="h-full w-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
