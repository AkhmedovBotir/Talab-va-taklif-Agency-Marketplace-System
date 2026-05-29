import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { Home, User, ShoppingBag, ShoppingCart, Search } from 'lucide-react-native';
import { cn } from '../lib/utils';
import { useMarketplace } from './MarketplaceContext';
import type { TabStackRoute } from './tabRoutes';

type BottomTabBarProps = {
  stackRoute: TabStackRoute;
};

/** Pastki tab bar (`absolute`) ustiga chiqmasligi uchun ekranlar pastki paddingiga qo‘shiladi — Cart / Checkout bilan bir xil. */
export const TAB_BAR_BOTTOM_CLEARANCE = 72;

export function BottomTabBar({ stackRoute }: BottomTabBarProps) {
  const m = useMarketplace();
  const totalCartCount = m.cartCount + m.localCartCount;
  const isProfile = stackRoute === 'profile';
  const isCart = stackRoute === 'cart';
  const isSearch = stackRoute === 'search';
  const isHomeShell = stackRoute === 'index';

  const onHome = () => {
    m.setListNav('home');
    router.replace('/');
  };

  const onProducts = () => {
    m.setListNav('products');
    router.replace('/');
  };

  const onSearch = () => {
    router.replace('/search');
  };

  const onCart = () => {
    router.replace('/cart');
  };

  const onProfile = () => {
    router.replace('/profile');
  };

  const isTabletUpWeb = Platform.OS === 'web' && m.windowWidth >= 768;
  const barWidth = isTabletUpWeb ? Math.min(420, m.windowWidth - 32) : undefined;

  const tabLabelClass = 'mt-0.5 max-w-[100%] text-center text-[8px] font-bold uppercase leading-tight text-gray-400';

  return (
    <View
      className="absolute bottom-0 left-0 right-0 z-50 px-3 pb-4"
      style={{ alignItems: isTabletUpWeb ? 'center' : undefined }}
      pointerEvents="box-none"
    >
      <View
        className="flex-row items-center justify-between gap-0.5 rounded-3xl border border-gray-100 shadow-2xl"
        style={{
          width: barWidth ?? '100%',
          maxWidth: isTabletUpWeb ? 420 : undefined,
          paddingHorizontal: isTabletUpWeb ? 10 : 6,
          paddingVertical: isTabletUpWeb ? 8 : 8,
          backgroundColor: '#ffffff',
          ...(Platform.OS === 'web'
            ? { boxShadow: '0 12px 40px rgba(15, 23, 42, 0.12)' as const }
            : { elevation: 12 }),
        }}
      >
        <Pressable
          android_ripple={{ color: '#f3f4f6' }}
          className="min-w-0 flex-1 items-center justify-center bg-transparent py-1.5"
          onPress={onHome}
        >
          <Home
            size={isHomeShell && m.listNav === 'home' ? 26 : 21}
            color={isHomeShell && m.listNav === 'home' ? '#f97316' : '#9ca3af'}
          />
          {!(isHomeShell && m.listNav === 'home') ? (
            <Text
              className={tabLabelClass}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              allowFontScaling
            >
              Asosiy
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          android_ripple={{ color: '#f3f4f6' }}
          className="min-w-0 flex-1 items-center justify-center bg-transparent py-1.5"
          onPress={onProducts}
        >
          <ShoppingBag
            size={isHomeShell && m.listNav === 'products' ? 26 : 21}
            color={isHomeShell && m.listNav === 'products' ? '#f97316' : '#9ca3af'}
          />
          {!(isHomeShell && m.listNav === 'products') ? (
            <Text
              className={tabLabelClass}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              allowFontScaling
            >
              Katalog
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          android_ripple={{ color: '#f3f4f6' }}
          className="min-w-0 flex-1 items-center justify-center bg-transparent py-1.5"
          onPress={onSearch}
        >
          <Search size={isSearch ? 26 : 21} color={isSearch ? '#f97316' : '#9ca3af'} />
          {!isSearch ? (
            <Text
              className={tabLabelClass}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              allowFontScaling
            >
              Qidiruv
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          android_ripple={{ color: '#f3f4f6' }}
          className="min-w-0 flex-1 items-center justify-center bg-transparent py-1.5"
          onPress={onCart}
        >
          <View className="relative">
            <ShoppingCart size={isCart ? 26 : 21} color={isCart ? '#f97316' : '#9ca3af'} />
            {totalCartCount > 0 ? (
              <View className="absolute -right-2 -top-1.5 min-w-[18px] items-center rounded-full bg-orange-500 px-1">
                <Text className="text-[9px] font-black text-white">
                  {totalCartCount > 99 ? '99+' : totalCartCount}
                </Text>
              </View>
            ) : null}
          </View>
          {!isCart ? (
            <Text
              className={tabLabelClass}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              allowFontScaling
            >
              Savat
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          android_ripple={{ color: '#f3f4f6' }}
          className="min-w-0 flex-1 items-center justify-center bg-transparent py-1.5"
          onPress={onProfile}
        >
          <User size={isProfile ? 26 : 21} color={isProfile ? '#f97316' : '#9ca3af'} />
          {!isProfile ? (
            <Text
              className={tabLabelClass}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              allowFontScaling
            >
              Profil
            </Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}
