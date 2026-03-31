import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { ShoppingCart, Minus, Plus } from 'lucide-react-native';
import { Product } from '../types';
import { cn } from '../lib/utils';

type ProductCardProps = {
  product: Product;
  onSelect: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onCartDelta: (productId: string, delta: number) => void;
  /** Savatdagi soni; 0 bo'lsa faqat "Savatga" */
  inCartQty: number;
  cardWidth: number;
  isSmallWeb: boolean;
};

export function ProductCard({
  product,
  onSelect,
  onAddToCart,
  onCartDelta,
  inCartQty,
  cardWidth,
  isSmallWeb,
}: ProductCardProps) {
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
      </Pressable>

      <View className="mt-3">
        {outOfStock ? (
          <View className="items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 py-3">
            <Text className="text-[10px] font-black uppercase tracking-wider text-gray-400">Tugagan</Text>
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
