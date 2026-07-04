import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { ShoppingCart, Minus, Plus, Star, LogIn } from 'lucide-react-native';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { api, requestAuthLogin } from '../services/api';
import { useMarketplaceSession } from '../hooks/useMarketplaceSession';
import { setPendingCartProduct, type PendingCartKind } from '../lib/pendingMarketplaceCart';

type ProductCardProps = {
  product: Product;
  onSelect: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onCartDelta: (productId: string, delta: number) => void;
  /** Savatdagi soni; 0 bo'lsa faqat "Savatga" */
  inCartQty: number;
  cartDisabled?: boolean;
  pendingCartKind?: PendingCartKind;
  cardWidth: number;
  isSmallWeb: boolean;
};

export function ProductCard({
  product,
  onSelect,
  onAddToCart,
  onCartDelta,
  inCartQty,
  cartDisabled = false,
  pendingCartKind = 'marketplace',
  cardWidth,
  isSmallWeb,
}: ProductCardProps) {
  const isLoggedIn = useMarketplaceSession();
  const [avgScore, setAvgScore] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  useEffect(() => {
    const pid = Number(product.id);
    if (!Number.isFinite(pid) || pid < 1) return;
    let cancelled = false;
    void api.productRatings.get(pid, { limit: 1 }).then((res) => {
      if (cancelled) return;
      setAvgScore(res.average_score || 0);
      setTotalRatings(res.total_ratings || 0);
    }).catch(() => {
      if (cancelled) return;
      setAvgScore(0);
      setTotalRatings(0);
    });
    return () => {
      cancelled = true;
    };
  }, [product.id]);
  const stock = Math.max(0, Math.floor(Number(product.quantity) || 0));
  const atMax = inCartQty >= stock;
  const outOfStock = stock <= 0;

  return (
    <View
      className="mb-4 rounded-[32px] border border-gray-100 bg-white p-3 shadow-sm"
      style={{ width: isSmallWeb ? '48.5%' : cardWidth }}
    >
      <Pressable onPress={() => onSelect(product)} className="active:opacity-90">
        <View className="mb-4 aspect-square w-full overflow-hidden rounded-[24px] bg-gray-50">
          <Image source={{ uri: product.images[0] }} className="h-full w-full" resizeMode="cover" />
        </View>

        <Text
          className="mb-1 min-h-[2.5rem] text-sm font-bold text-gray-900"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {product.name}
        </Text>

        <View className="mb-2">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {product.quantity} ta mavjud
          </Text>
        </View>

        <Text className="text-sm font-black text-orange-500">
          {product.price.toLocaleString()} <Text className="text-[9px] font-bold">so'm</Text>
        </Text>
        <View className="mt-2 flex-row items-center gap-1">
          <Star size={13} color="#f59e0b" fill="#f59e0b" />
          <Text className="text-[11px] font-black text-slate-700">
            {avgScore > 0 ? avgScore.toFixed(1) : '0.0'}
          </Text>
          <Text className="text-[10px] font-semibold text-slate-400">({totalRatings})</Text>
        </View>
      </Pressable>

      <View className="mt-3">
        {outOfStock ? (
          <View className="items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 py-3">
            <Text className="text-[10px] font-black uppercase tracking-wider text-gray-400">Tugagan</Text>
          </View>
        ) : cartDisabled ? (
          <View className="items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 py-3">
            <Text className="text-[10px] font-black uppercase tracking-wider text-gray-400">Savat tez kunda</Text>
          </View>
        ) : !isLoggedIn ? (
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => requestAuthLogin()}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white py-3"
            >
              <LogIn size={13} color="#374151" />
              <Text className="text-[10px] font-black uppercase tracking-wider text-gray-700">Kirish</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void setPendingCartProduct(String(product.id), pendingCartKind);
                requestAuthLogin();
              }}
              className="flex-1 items-center justify-center rounded-2xl bg-orange-500 py-3"
            >
              <Text className="text-[10px] font-black uppercase tracking-wider text-white">Sotib olish</Text>
            </Pressable>
          </View>
        ) : inCartQty <= 0 ? (
          <Pressable
            onPress={() => onAddToCart(product)}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3"
          >
            <ShoppingCart size={14} color="white" />
            <Text className="text-[10px] font-black uppercase tracking-wider text-white">Savatga</Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 py-1 pl-1 pr-1">
            <Pressable
              onPress={() => onCartDelta(product.id, -1)}
              className="h-9 w-9 items-center justify-center rounded-xl bg-white active:bg-gray-100"
              hitSlop={6}
            >
              <Minus size={16} color="#475569" />
            </Pressable>
            <Text className="min-w-[28px] text-center text-sm font-black text-gray-900">{inCartQty}</Text>
            <Pressable
              onPress={() => !atMax && onCartDelta(product.id, 1)}
              disabled={atMax}
              className={cn(
                'h-9 w-9 items-center justify-center rounded-xl bg-white active:bg-gray-100',
                atMax && 'opacity-40'
              )}
              hitSlop={6}
            >
              <Plus size={16} color="#475569" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
