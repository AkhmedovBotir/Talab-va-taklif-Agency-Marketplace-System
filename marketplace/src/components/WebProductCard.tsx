import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';

export type WebProductCardProps = {
  product: Product;
  onSelect: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onCartDelta: (productId: string, delta: number) => void;
  inCartQty: number;
  className?: string;
};

export function WebProductCard({
  product,
  onSelect,
  onAddToCart,
  onCartDelta,
  inCartQty,
  className,
}: WebProductCardProps) {
  const stock = Math.max(0, Math.floor(Number(product.quantity) || 0));
  const atMax = inCartQty >= stock;
  const outOfStock = stock <= 0;
  const [hoverIndex, setHoverIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || product.images.length <= 1) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const sectionWidth = width / product.images.length;
    const index = Math.floor(x / sectionWidth);
    if (index !== hoverIndex && index >= 0 && index < product.images.length) {
      setHoverIndex(index);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIndex(0)}
      className={cn(
        'group flex flex-col rounded-[32px] border border-gray-100 bg-white p-3 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/50',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="w-full cursor-pointer text-left active:opacity-90"
      >
        <div className="relative mb-4 aspect-square overflow-hidden rounded-[24px] bg-gray-50">
          <img
            src={product.images[hoverIndex] || product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          {product.images.length > 1 && (
            <div className="absolute inset-x-3 bottom-3 z-10 flex gap-1">
              {product.images.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all',
                    hoverIndex === i ? 'bg-white' : 'bg-white/30'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <h3 className="mb-1 min-h-[2.5rem] line-clamp-2 px-1 text-sm font-bold leading-snug text-gray-900">
          {product.name}
        </h3>

        <div className="mb-2 px-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {product.quantity} ta mavjud
          </span>
        </div>

        <div className="mb-3 px-1">
          <p className="text-xs font-black text-orange-500 md:text-sm">
            {product.price.toLocaleString()} <span className="text-[8px] font-bold md:text-[9px]">so'm</span>
          </p>
        </div>
      </button>

      <div className="mt-auto px-0">
        {outOfStock ? (
          <div className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400">
            Tugagan
          </div>
        ) : inCartQty <= 0 ? (
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-[10px] font-black uppercase tracking-wider text-white transition-all hover:bg-orange-500 active:scale-95"
          >
            <ShoppingCart size={14} />
            Savatga
          </button>
        ) : (
          <div className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 py-1 pl-1 pr-1">
            <button
              type="button"
              onClick={() => onCartDelta(product.id, -1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white transition-colors hover:bg-gray-100"
              aria-label="Kamaytirish"
            >
              <Minus size={16} className="text-slate-600" />
            </button>
            <span className="min-w-[28px] text-center text-sm font-black text-gray-900">{inCartQty}</span>
            <button
              type="button"
              onClick={() => !atMax && onCartDelta(product.id, 1)}
              disabled={atMax}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl bg-white transition-colors hover:bg-gray-100',
                atMax && 'cursor-not-allowed opacity-40'
              )}
              aria-label="Oshirish"
            >
              <Plus size={16} className="text-slate-600" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
