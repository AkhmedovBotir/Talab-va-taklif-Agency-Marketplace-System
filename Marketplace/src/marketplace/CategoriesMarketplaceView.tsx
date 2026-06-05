import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform, Image, RefreshControl } from 'react-native';
import { ChevronRight, Package, ChevronLeft } from 'lucide-react-native';
import { api } from '../services/api';
import { Category, Product, Subcategory } from '../types';
import { useMarketplace } from './MarketplaceContext';
import { ProductCard } from './ProductCard';
import { cn } from '../lib/utils';
import { deliverySelectionFromMarketplace, filterProductsForDelivery } from '../lib/deliveryFilter';
import { useTabBarLayout } from '../lib/tabBarLayout';

type BrowseStep = 'categories' | 'subcategories' | 'products';

const DESKTOP_MIN_PX = 1024;
const MOBILE_REFRESH_TINT = '#f97316';

export function CategoriesMarketplaceView() {
  const m = useMarketplace();
  const { clearance: tabBarClearance } = useTabBarLayout();
  const isDesktop = m.windowWidth >= DESKTOP_MIN_PX;

  const webContainerStyle =
    Platform.OS === 'web'
      ? {
          maxWidth: m.containerMaxWidth,
          width: '100%' as const,
          alignSelf: 'center' as const,
        }
      : undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [step, setStep] = useState<BrowseStep>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const [categoryHasProducts, setCategoryHasProducts] = useState<Record<number, boolean>>({});
  const [categoryAvailDone, setCategoryAvailDone] = useState(false);
  const [subcategoryHasProducts, setSubcategoryHasProducts] = useState<Record<number, boolean>>({});
  const [subcategoryAvailDone, setSubcategoryAvailDone] = useState(false);

  const selectedCategory = useMemo(
    () => (selectedCategoryId ? categories.find((c) => c.id === selectedCategoryId) ?? null : null),
    [categories, selectedCategoryId]
  );

  const selectedSubcategory = useMemo(
    () => (selectedSubcategoryId ? subcategories.find((s) => s.id === selectedSubcategoryId) ?? null : null),
    [subcategories, selectedSubcategoryId]
  );

  const deliverySel = useMemo(() => deliverySelectionFromMarketplace(m), [m]);

  const applyDeliveryFilter = useCallback(
    (list: Product[]) => filterProductsForDelivery(list, deliverySel),
    [deliverySel]
  );

  useEffect(() => {
    setProducts((prev) => (prev.length > 0 ? applyDeliveryFilter(prev) : prev));
  }, [deliverySel, applyDeliveryFilter]);

  const navRef = useRef({
    selectedCategoryId: null as number | null,
    selectedSubcategoryId: null as number | null,
    productsLen: 0,
  });
  navRef.current = {
    selectedCategoryId,
    selectedSubcategoryId,
    productsLen: products.length,
  };

  const loadCategorySubs = useCallback(async (catId: number) => {
    setLoadingProducts(true);
    setSubcategories([]);
    try {
      const subs = await api.subcategories.list({ page: 1, limit: 20, parent_id: catId });
      setSubcategories(subs);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (categories.length === 0) {
      setCategoryHasProducts({});
      setCategoryAvailDone(true);
      return;
    }
    let cancelled = false;
    setCategoryAvailDone(false);
    (async () => {
      try {
        const entries = await Promise.all(
          categories.map(async (c) => {
            const n = await api.products.count({ category_id: c.id });
            return [c.id, n > 0] as const;
          })
        );
        if (!cancelled) {
          setCategoryHasProducts(Object.fromEntries(entries));
          setCategoryAvailDone(true);
        }
      } catch {
        if (!cancelled) {
          setCategoryHasProducts({});
          setCategoryAvailDone(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categories]);

  useEffect(() => {
    if (subcategories.length === 0 || selectedCategoryId == null) {
      setSubcategoryHasProducts({});
      setSubcategoryAvailDone(true);
      return;
    }
    let cancelled = false;
    setSubcategoryAvailDone(false);
    const cid = selectedCategoryId;
    (async () => {
      try {
        const entries = await Promise.all(
          subcategories.map(async (s) => {
            const n = await api.products.count({ category_id: cid, subcategory_id: s.id });
            return [s.id, n > 0] as const;
          })
        );
        if (!cancelled) {
          setSubcategoryHasProducts(Object.fromEntries(entries));
          setSubcategoryAvailDone(true);
        }
      } catch {
        if (!cancelled) {
          setSubcategoryHasProducts({});
          setSubcategoryAvailDone(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subcategories, selectedCategoryId]);

  useEffect(() => {
    if (!subcategoryAvailDone || selectedSubcategoryId == null) return;
    if (subcategoryHasProducts[selectedSubcategoryId] === false) {
      setSelectedSubcategoryId(null);
      setProducts([]);
    }
  }, [subcategoryAvailDone, selectedSubcategoryId, subcategoryHasProducts]);

  useEffect(() => {
    if (!isDesktop || !categoryAvailDone || categories.length === 0) return;
    const ok = (id: number) => categoryHasProducts[id] === true;
    if (selectedCategoryId != null && !ok(selectedCategoryId)) {
      const next = categories.find((c) => ok(c.id));
      if (next) {
        setSelectedCategoryId(next.id);
        setSelectedSubcategoryId(null);
        setProducts([]);
        void loadCategorySubs(next.id);
      } else {
        setSelectedCategoryId(null);
        setSubcategories([]);
        setSelectedSubcategoryId(null);
        setProducts([]);
      }
      return;
    }
    if (selectedCategoryId == null) {
      const next = categories.find((c) => ok(c.id));
      if (next) {
        setSelectedCategoryId(next.id);
        setSelectedSubcategoryId(null);
        setProducts([]);
        void loadCategorySubs(next.id);
      }
    }
  }, [isDesktop, categoryAvailDone, categories, categoryHasProducts, selectedCategoryId, loadCategorySubs]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const cats = await api.categories.list({ page: 1, limit: 10 });
        if (cancelled) return;
        setCategories(cats);
        const desktop = m.windowWidth >= DESKTOP_MIN_PX;
        if (desktop && cats[0]) {
          const first = cats[0];
          setSelectedCategoryId(first.id);
          setSelectedSubcategoryId(null);
          setProducts([]);
          setSubcategories([]);
          const subs = await api.subcategories.list({ page: 1, limit: 20, parent_id: first.id });
          if (cancelled) return;
          setSubcategories(subs);
          setStep('categories');
        } else {
          setStep('categories');
          setSelectedCategoryId(null);
          setSubcategories([]);
          setSelectedSubcategoryId(null);
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial mount only; width handled by separate effect
  }, []);

  const prevDesktopRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevDesktopRef.current === null) {
      prevDesktopRef.current = isDesktop;
      return;
    }
    if (prevDesktopRef.current === isDesktop) return;
    prevDesktopRef.current = isDesktop;

    if (!isDesktop) {
      const { selectedCategoryId: sc, selectedSubcategoryId: ss, productsLen } = navRef.current;
      if (productsLen > 0 && ss != null) setStep('products');
      else if (sc != null) setStep('subcategories');
      else setStep('categories');
    } else {
      setStep('categories');
      const { selectedCategoryId: sc } = navRef.current;
      const firstId = categories[0]?.id ?? null;
      if (sc == null && firstId != null) {
        setSelectedCategoryId(firstId);
        setSelectedSubcategoryId(null);
        setProducts([]);
        void loadCategorySubs(firstId);
      }
    }
  }, [isDesktop, categories, loadCategorySubs]);

  const headerTitle = isDesktop
    ? 'Kategoriyalar'
    : step === 'categories'
      ? 'Kategoriyalar'
      : step === 'subcategories'
        ? 'Subkategoriyalar'
        : 'Mahsulotlar';

  const headerSubtitle = isDesktop
    ? selectedCategory
      ? `${selectedCategory.name}${selectedSubcategory ? ` • ${selectedSubcategory.name}` : ''}`
      : 'Bo‘limni tanlang'
    : step === 'categories'
      ? 'Bo‘limni tanlang'
      : step === 'subcategories'
        ? selectedCategory?.name ?? ''
        : `${selectedCategory?.name ?? ''}${selectedSubcategory ? ` • ${selectedSubcategory.name}` : ''}`;

  const isCategoryDisabled = (id: number) => categoryAvailDone && categoryHasProducts[id] === false;
  const isSubcategoryDisabled = (id: number) => subcategoryAvailDone && subcategoryHasProducts[id] === false;

  const onBack = () => {
    if (step === 'products') {
      setStep('subcategories');
      setSelectedSubcategoryId(null);
      setProducts([]);
    } else if (step === 'subcategories') {
      setStep('categories');
      setSelectedCategoryId(null);
      setSubcategories([]);
      setSelectedSubcategoryId(null);
      setProducts([]);
    }
  };

  const onSelectCategory = async (catId: number) => {
    if (categoryAvailDone && categoryHasProducts[catId] === false) return;
    setSelectedCategoryId(catId);
    setSelectedSubcategoryId(null);
    setProducts([]);
    await loadCategorySubs(catId);
    if (m.windowWidth < DESKTOP_MIN_PX) setStep('subcategories');
  };

  const onSelectSubcategory = async (subId: number) => {
    if (!selectedCategoryId) return;
    if (subcategoryAvailDone && subcategoryHasProducts[subId] === false) return;
    setSelectedSubcategoryId(subId);
    setLoadingProducts(true);
    try {
      const prods = await api.products.list({
        page: 1,
        limit: 50,
        category_id: selectedCategoryId,
        subcategory_id: subId,
      });
      setProducts(applyDeliveryFilter(prods));
      if (m.windowWidth < DESKTOP_MIN_PX) setStep('products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      const cats = await api.categories.list({ page: 1, limit: 10 });
      setCategories(cats);
      const catId = selectedCategoryId;
      const subId = selectedSubcategoryId;
      if (catId != null) {
        await loadCategorySubs(catId);
      }
      if (catId != null && subId != null) {
        setLoadingProducts(true);
        try {
          const prods = await api.products.list({
            page: 1,
            limit: 50,
            category_id: catId,
            subcategory_id: subId,
          });
          setProducts(applyDeliveryFilter(prods));
        } finally {
          setLoadingProducts(false);
        }
      }
    } finally {
      setPullRefreshing(false);
    }
  }, [selectedCategoryId, selectedSubcategoryId, loadCategorySubs]);

  return (
    <View className={cn('flex-1', Platform.OS === 'web' ? 'bg-slate-100' : 'bg-gray-50')}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: tabBarClearance + 24 }}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={pullRefreshing}
              onRefresh={onPullRefresh}
              tintColor={MOBILE_REFRESH_TINT}
              colors={[MOBILE_REFRESH_TINT]}
            />
          ) : undefined
        }
      >
        <View className="border-b border-gray-100 bg-white px-4 pb-6 pt-12">
          <View className="flex-row items-start gap-3" style={webContainerStyle}>
            {!isDesktop && step !== 'categories' ? (
              <Pressable
                onPress={onBack}
                className="h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50"
                accessibilityRole="button"
                accessibilityLabel="Orqaga"
              >
                <ChevronLeft size={22} color="#334155" />
              </Pressable>
            ) : null}
            <View className="min-w-0 flex-1 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50">
                <Package size={18} color="#f97316" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-2xl font-black text-gray-900">{headerTitle}</Text>
                <Text className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400" numberOfLines={2}>
                  {headerSubtitle}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="p-4" style={webContainerStyle}>
          {isDesktop ? (
            <View
              className="rounded-[36px] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-300/30"
              style={{ flexDirection: 'row' }}
            >
              <ScrollView horizontal={false} style={{ flex: 1, maxHeight: 520 }} contentContainerStyle={{ paddingRight: 6 }}>
                <View className="mb-3">
                  <Text className="text-sm font-black uppercase tracking-widest text-gray-900">Kategoriyalar</Text>
                  <Text className="mt-1 text-xs font-bold text-gray-400">Birini tanlang</Text>
                </View>
                <View className="gap-2">
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <View key={i} className="h-12 rounded-2xl border border-gray-100 bg-gray-50 opacity-60" />
                      ))
                    : categories.map((c) => {
                        const active = c.id === selectedCategoryId;
                        const disabled = isCategoryDisabled(c.id);
                        return (
                          <Pressable
                            key={c.id}
                            disabled={disabled}
                            onPress={() => void onSelectCategory(c.id)}
                            className={cn(
                              'flex-row items-center justify-between rounded-2xl border px-4 py-3',
                              disabled && 'border-gray-100 bg-gray-50 opacity-45',
                              !disabled && active && 'border-orange-200 bg-orange-50',
                              !disabled && !active && 'border-transparent bg-white'
                            )}
                          >
                            <View className="min-w-0 flex-1 flex-row items-center gap-3 pr-2">
                              <View className="h-10 w-10 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 items-center justify-center">
                                {c.image ? (
                                  <Image source={{ uri: c.image }} className="h-full w-full" resizeMode="cover" />
                                ) : (
                                  <Package size={16} color="#f97316" />
                                )}
                              </View>
                              <Text
                                className={cn(
                                  'text-sm font-black',
                                  disabled && 'text-gray-400',
                                  !disabled && active && 'text-orange-600',
                                  !disabled && !active && 'text-gray-800'
                                )}
                                numberOfLines={2}
                              >
                                {c.name}
                              </Text>
                            </View>
                            <ChevronRight size={18} color={disabled ? '#e2e8f0' : active ? '#f97316' : '#cbd5e1'} />
                          </Pressable>
                        );
                      })}
                </View>
              </ScrollView>
              <View style={{ flex: 2, marginLeft: 16 }}>
                <View className="mb-4 rounded-[32px] border border-gray-100 bg-slate-50 p-4">
                  <Text className="text-sm font-black uppercase tracking-widest text-gray-900">Subkategoriyalar</Text>
                  <Text className="mt-1 text-xs font-bold text-gray-400">
                    {selectedCategory ? `${selectedCategory.name} ostidagi bo‘limlar` : 'Tanlang'}
                  </Text>
                  <View className="mt-3 flex-row flex-wrap" style={{ rowGap: 10, columnGap: 10 }}>
                    {subcategories.map((s) => {
                      const active = s.id === selectedSubcategoryId;
                      const disabled = isSubcategoryDisabled(s.id);
                      return (
                        <Pressable
                          key={s.id}
                          disabled={disabled}
                          onPress={() => void onSelectSubcategory(s.id)}
                          className={cn(
                            'rounded-2xl border px-4 py-2',
                            disabled && 'border-gray-100 bg-gray-100 opacity-70',
                            !disabled && active && 'border-orange-500 bg-orange-500',
                            !disabled && !active && 'border-gray-200 bg-gray-50'
                          )}
                        >
                          <Text
                            className={cn('text-[11px] font-black', disabled && 'text-gray-400', !disabled && active && 'text-white', !disabled && !active && 'text-gray-700')}
                          >
                            {s.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {subcategories.length === 0 && !loadingProducts && !loading ? (
                    <Text className="py-6 text-sm font-bold text-gray-400">Subkategoriya yo‘q</Text>
                  ) : null}
                  {loadingProducts && subcategories.length === 0 ? (
                    <View className="mt-2 flex-row flex-wrap gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <View key={i} className="h-8 w-20 rounded-2xl bg-gray-200/80" />
                      ))}
                    </View>
                  ) : null}
                </View>

                <View className="rounded-[32px] border border-gray-100 bg-slate-50 p-4">
                  <View className="mb-3 flex-row items-center justify-between gap-2">
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-black uppercase tracking-widest text-gray-900">Mahsulotlar</Text>
                      <Text className="mt-1 text-xs font-bold text-gray-400" numberOfLines={2}>
                        {selectedSubcategory ? selectedSubcategory.name : 'Subkategoriya tanlang'}
                      </Text>
                    </View>
                    {loadingProducts ? <ActivityIndicator size="small" color="#f97316" /> : null}
                  </View>
                  <View className="flex-row flex-wrap" style={{ columnGap: m.isSmallWeb ? 0 : m.cardGap, rowGap: 16 }}>
                    {products.length === 0 && loadingProducts
                      ? Array.from({ length: 8 }).map((_, i) => (
                          <View
                            key={i}
                            className="h-72 rounded-[32px] border border-gray-100 bg-white opacity-50"
                            style={{ width: m.resolvedCardWidth }}
                          />
                        ))
                      : null}
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={m.setSelectedProduct}
                        onAddToCart={m.addToCart}
                        onCartDelta={m.updateQuantity}
                        inCartQty={m.cart.find((c) => String(c.id) === String(product.id))?.quantity ?? 0}
                        cardWidth={m.resolvedCardWidth}
                        isSmallWeb={m.isSmallWeb}
                      />
                    ))}
                  </View>
                  {products.length === 0 && !loadingProducts && !loading ? (
                    <Text className="py-10 text-center text-sm font-bold text-gray-400">
                      {!m.hasCompleteDeliveryLocation
                        ? 'Mahsulotlarni ko‘rish uchun bosh sahifadan asosiy yetkazish manzilini tanlang'
                        : 'Ushbu manzil uchun mahsulot topilmadi'}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}

          {!isDesktop && step === 'categories' ? (
            <View className="rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm">
              <View className="gap-2">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <View key={i} className="h-16 rounded-2xl border border-gray-100 bg-gray-50 opacity-60" />
                    ))
                  : categories.map((c) => {
                      const disabled = isCategoryDisabled(c.id);
                      return (
                        <Pressable
                          key={c.id}
                          disabled={disabled}
                          onPress={() => void onSelectCategory(c.id)}
                          className={cn(
                            'flex-row items-center gap-3 rounded-2xl border px-4 py-3',
                            disabled ? 'border-gray-100 bg-gray-50 opacity-45' : 'border-gray-100 bg-white active:bg-orange-50/50'
                          )}
                        >
                          <View className="h-11 w-11 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 items-center justify-center">
                            {c.image ? (
                              <Image source={{ uri: c.image }} className="h-full w-full" resizeMode="cover" />
                            ) : (
                              <Package size={18} color="#f97316" />
                            )}
                          </View>
                          <Text className={cn('min-w-0 flex-1 text-sm font-black', disabled ? 'text-gray-400' : 'text-gray-800')} numberOfLines={2}>
                            {c.name}
                          </Text>
                          <ChevronRight size={18} color="#cbd5e1" />
                        </Pressable>
                      );
                    })}
              </View>
              {!loading && categories.length === 0 ? (
                <Text className="py-10 text-center text-sm font-bold text-gray-400">Kategoriya topilmadi</Text>
              ) : null}
            </View>
          ) : null}

          {!isDesktop && step === 'subcategories' ? (
            <View className="rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm">
              <View className="gap-2">
                {loadingProducts && subcategories.length === 0
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <View key={i} className="h-14 rounded-2xl border border-gray-100 bg-gray-50 opacity-60" />
                    ))
                  : subcategories.map((s) => {
                      const disabled = isSubcategoryDisabled(s.id);
                      return (
                        <Pressable
                          key={s.id}
                          disabled={disabled}
                          onPress={() => void onSelectSubcategory(s.id)}
                          className={cn(
                            'flex-row items-center gap-3 rounded-2xl border px-4 py-3',
                            disabled ? 'border-gray-100 bg-gray-50 opacity-45' : 'border-gray-100 bg-white active:bg-orange-50/50'
                          )}
                        >
                          <View className="h-11 w-11 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">
                            <Package size={18} color="#f97316" />
                          </View>
                          <Text className={cn('min-w-0 flex-1 text-sm font-black', disabled ? 'text-gray-400' : 'text-gray-800')} numberOfLines={2}>
                            {s.name}
                          </Text>
                          <ChevronRight size={18} color="#cbd5e1" />
                        </Pressable>
                      );
                    })}
              </View>
              {subcategories.length === 0 && !loadingProducts ? (
                <Text className="py-10 text-center text-sm font-bold text-gray-400">Hozircha subkategoriya yo‘q</Text>
              ) : null}
            </View>
          ) : null}

          {!isDesktop && step === 'products' ? (
            <View className="rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm">
              {loadingProducts ? (
                <View className="mb-2 flex-row justify-end">
                  <ActivityIndicator size="small" color="#f97316" />
                </View>
              ) : null}
              <View className="flex-row flex-wrap" style={{ columnGap: m.isSmallWeb ? 0 : m.cardGap, rowGap: 16 }}>
                {products.length === 0 && loadingProducts
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <View
                        key={i}
                        className="h-72 rounded-[32px] border border-gray-100 bg-white opacity-50"
                        style={{ width: m.resolvedCardWidth }}
                      />
                    ))
                  : null}
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={m.setSelectedProduct}
                    onAddToCart={m.addToCart}
                    onCartDelta={m.updateQuantity}
                    inCartQty={m.cart.find((c) => String(c.id) === String(product.id))?.quantity ?? 0}
                    cardWidth={m.resolvedCardWidth}
                    isSmallWeb={m.isSmallWeb}
                  />
                ))}
              </View>
              {products.length === 0 && !loadingProducts ? (
                <Text className="py-10 text-center text-sm font-bold text-gray-400">
                  {!m.hasCompleteDeliveryLocation
                    ? 'Mahsulotlarni ko‘rish uchun bosh sahifadan asosiy yetkazish manzilini tanlang'
                    : 'Ushbu manzil uchun mahsulot topilmadi'}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
