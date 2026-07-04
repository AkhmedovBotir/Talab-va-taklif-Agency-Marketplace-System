import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import type { LocalShopProduct } from '../types';
import { renderProductDescriptionWeb } from '../lib/renderProductDescriptionWeb';
import { cn } from '../lib/utils';
import { WebProductDetailCartPanel } from './WebProductDetailOverlay';

type Props = {
  product: LocalShopProduct | null;
  onClose: () => void;
  onAddToCart: (p: LocalShopProduct) => void;
  onCartDelta: (productId: string, delta: number) => void;
  inCartQty: number;
};

export function WebLocalProductDetailOverlay({ product, onClose, onAddToCart, onCartDelta, inCartQty }: Props) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setIsLightboxOpen(false);
  }, [product?.id]);

  if (!product) return null;
  const stock = Math.max(0, Math.floor(Number(product.quantity) || 0));
  const atMax = inCartQty >= stock;
  const images = product.images?.length ? product.images : [];

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex max-md:items-stretch max-md:justify-start max-md:bg-white md:items-center md:justify-center md:bg-black/70 md:backdrop-blur-xl md:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative flex h-full min-h-0 w-full flex-col bg-white shadow-2xl max-md:min-h-[100dvh] max-md:rounded-none md:max-h-[90vh] md:max-w-5xl lg:h-auto lg:flex-row lg:overflow-hidden lg:rounded-[48px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white/90 text-gray-900 shadow-xl backdrop-blur-sm"
              aria-label="Yopish"
            >
              <X size={24} />
            </button>

            <div className="group relative aspect-square bg-gray-50 lg:aspect-auto lg:w-1/2">
              <button type="button" onClick={() => setIsLightboxOpen(true)} className="block h-full w-full cursor-zoom-in">
                <img
                  src={images[activeImageIndex]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
              {images.length > 1 ? (
                <>
                  <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                    {images.map((_, i) => (
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
                    onClick={() => setActiveImageIndex((p) => (p - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white opacity-100 backdrop-blur-md md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((p) => (p + 1) % images.length)}
                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white opacity-100 backdrop-blur-md md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col bg-white lg:w-1/2">
              <div className="flex-1 overflow-y-auto p-8 pb-6 lg:p-12 lg:pb-12">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
                    <Info size={14} />
                    Maxalla mahsuloti
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-600">
                    {product.quantity} ta mavjud
                  </div>
                </div>

                <h2 className="mb-4 text-3xl font-black leading-tight text-gray-900 md:text-4xl">{product.name}</h2>

                <div className="prose prose-sm mb-8 max-w-none leading-relaxed text-gray-500">
                  {renderProductDescriptionWeb(product.description)}
                </div>

                <div className="hidden flex-col gap-6 border-t border-gray-100 pt-8 lg:flex">
                  <WebProductDetailCartPanel
                    product={product}
                    inCartQty={inCartQty}
                    stock={stock}
                    atMax={atMax}
                    outOfStock={stock <= 0}
                    onAddToCart={onAddToCart}
                    onCartDelta={onCartDelta}
                    pendingCartKind="local"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 z-20 shrink-0 border-t border-gray-100 bg-white/95 p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
                <WebProductDetailCartPanel
                  product={product}
                  inCartQty={inCartQty}
                  stock={stock}
                  atMax={atMax}
                  outOfStock={stock <= 0}
                  onAddToCart={onAddToCart}
                  onCartDelta={onCartDelta}
                  pendingCartKind="local"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isLightboxOpen && images.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute right-6 top-6 z-10 rounded-full p-2 text-white hover:bg-white/10"
            >
              <X size={32} />
            </button>
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((p) => (p - 1 + images.length) % images.length);
                  }}
                  className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((p) => (p + 1) % images.length);
                  }}
                  className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white"
                >
                  <ChevronRight size={28} />
                </button>
                <p className="absolute left-0 right-0 top-8 text-center text-sm font-bold text-white/80">
                  {activeImageIndex + 1} / {images.length}
                </p>
              </>
            ) : null}
            <motion.img
              key={activeImageIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              src={images[activeImageIndex]}
              className="max-h-[78vh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
