import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
  Pressable,
  Modal,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  Search,
  ChevronRight,
  Building2,
  FolderTree,
  Layers,
  Filter,
  X,
  ChevronLeft,
  Check,
  ChevronDown,
  Store,
  MapPin,
  Zap,
} from 'lucide-react-native';
import { api } from '../services/api';
import { normalizeMarketplaceProduct } from '../services/normalizeProduct';
import type { Product, UnifiedSearchResponse } from '../types';
import type { LocalShopProduct } from '../types';
import { useMarketplace } from './MarketplaceContext';
import { ProductCard } from './ProductCard';
import { cn } from '../lib/utils';
import {
  EMPTY_PRODUCT_FILTERS,
  filtersActive,
  filtersActiveMahalla,
  filterProductsByFilters,
  type ProductFilters,
} from '../lib/searchFilters';
import { formatSomDigits, parseSomDigitsFromInput } from '../lib/formatSom';

const EMPTY: UnifiedSearchResponse = {
  query: '',
  limit_per_type: 10,
  products: [],
  categories: [],
  subcategories: [],
  contragents: [],
};
type SearchMarketTab = 'bozor' | 'mahalla';

type PickerKind = 'contragent' | 'category' | 'subcategory';

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <View className="mb-3 flex-row items-center gap-2 px-1">
      {icon}
      <Text className="text-xs font-black uppercase tracking-widest text-gray-900">{title}</Text>
    </View>
  );
}

function paramStr(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

type Opt = { value: number; label: string };

const MOBILE_REFRESH_TINT = '#f97316';

export function SearchMarketplaceView() {
  const m = useMarketplace();
  const params = useLocalSearchParams<{
    focus?: string | string[];
    openFilter?: string | string[];
    contragentId?: string | string[];
    marketTab?: string | string[];
  }>();
  const inputRef = useRef<TextInput>(null);
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UnifiedSearchResponse>(EMPTY);
  const [activeTab, setActiveTab] = useState<SearchMarketTab>('bozor');
  const [browseProducts, setBrowseProducts] = useState<Product[]>([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [localProducts, setLocalProducts] = useState<LocalShopProduct[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [selectedLocalProduct, setSelectedLocalProduct] = useState<LocalShopProduct | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [picker, setPicker] = useState<PickerKind | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(EMPTY_PRODUCT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<ProductFilters>(EMPTY_PRODUCT_FILTERS);
  const [categoryOptions, setCategoryOptions] = useState<Opt[]>([]);
  const [contragentOptions, setContragentOptions] = useState<Opt[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<Opt[]>([]);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const filterOpenRef = useRef(false);
  useEffect(() => {
    if (filterOpen && !filterOpenRef.current) {
      setDraftFilters({ ...appliedFilters });
    }
    filterOpenRef.current = filterOpen;
  }, [filterOpen, appliedFilters]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const filterTabActive =
    activeTab === 'mahalla' ? filtersActiveMahalla(appliedFilters) : filtersActive(appliedFilters);

  useEffect(() => {
    if (activeTab !== 'mahalla') return;
    setAppliedFilters((f) => (f.contragentId != null ? { ...f, contragentId: null } : f));
    setDraftFilters((f) => (f.contragentId != null ? { ...f, contragentId: null } : f));
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      const f = paramStr(params.focus);
      const of = paramStr(params.openFilter);
      const cidRaw = paramStr(params.contragentId);
      const marketTab = paramStr(params.marketTab);
      const cid = cidRaw != null ? Number(cidRaw) : NaN;
      if (f !== '1' && of !== '1' && !Number.isFinite(cid) && marketTab !== 'bozor' && marketTab !== 'mahalla') return;
      if (f === '1') {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (of === '1') {
        setFilterOpen(true);
      }
      if (Number.isFinite(cid)) {
        setActiveTab('bozor');
        setAppliedFilters((prev) => ({ ...prev, contragentId: Number(cid) }));
        setDraftFilters((prev) => ({ ...prev, contragentId: Number(cid) }));
      }
      if (marketTab === 'bozor' || marketTab === 'mahalla') {
        setActiveTab(marketTab);
      }
      router.setParams({ focus: undefined, openFilter: undefined, contragentId: undefined, marketTab: undefined });
    }, [params.focus, params.openFilter, params.contragentId, params.marketTab])
  );

  useEffect(() => {
    api.categories.list({}).then((cats) => {
      setCategoryOptions(cats.map((c) => ({ value: c.id, label: c.name })));
    });
  }, []);

  useEffect(() => {
    if (!filterOpen || activeTab !== 'bozor') return;
    let cancelled = false;
    (async () => {
      const res = await api.contragents.list({ page: 1, limit: 100 });
      if (!cancelled) {
        setContragentOptions(res.items.map((i) => ({ value: i.id, label: i.name })));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterOpen, activeTab]);

  useEffect(() => {
    if (!filterOpen || !draftFilters.categoryId) {
      setSubcategoryOptions([]);
      return;
    }
    let cancelled = false;
    api.subcategories.list({ parent_id: draftFilters.categoryId }).then((subs) => {
      if (!cancelled) {
        setSubcategoryOptions(subs.map((s) => ({ value: s.id, label: s.name })));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [filterOpen, draftFilters.categoryId]);

  useEffect(() => {
    if (debounced) return;
    let cancelled = false;
    setBrowseLoading(true);
    (async () => {
      try {
        const list = await api.products.list({
          page: 1,
          limit: 200,
          category_id: appliedFilters.subcategoryId ? undefined : appliedFilters.categoryId ?? undefined,
          subcategory_id: appliedFilters.subcategoryId ?? undefined,
        });
        if (!cancelled) {
          setBrowseProducts(list.map((row) => normalizeMarketplaceProduct(row)));
        }
      } catch {
        if (!cancelled) setBrowseProducts([]);
      } finally {
        if (!cancelled) setBrowseLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced, appliedFilters.categoryId, appliedFilters.subcategoryId]);

  useEffect(() => {
    let cancelled = false;
    setLocalLoading(true);
    (async () => {
      try {
        const list = await api.localShopProducts.list({
          page: 1,
          limit: 200,
          q: debounced || undefined,
          district_id: m.selectedDistrict?.id,
          mfy_id: m.selectedMFY?.id,
        });
        if (!cancelled) setLocalProducts(list);
      } catch {
        if (!cancelled) setLocalProducts([]);
      } finally {
        if (!cancelled) setLocalLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced, m.selectedDistrict?.id, m.selectedMFY?.id]);

  const runSearch = useCallback(async (query: string) => {
    if (!query) {
      setData(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.search.unified({
        q: query,
        limit_per_type: 24,
      });
      setData(res);
    } catch {
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runSearch(debounced);
  }, [debounced, runSearch]);

  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      const cats = await api.categories.list({});
      setCategoryOptions(cats.map((c) => ({ value: c.id, label: c.name })));
      if (debounced) {
        await runSearch(debounced);
      } else {
        setBrowseLoading(true);
        try {
          const list = await api.products.list({
            page: 1,
            limit: 200,
            category_id: appliedFilters.subcategoryId ? undefined : appliedFilters.categoryId ?? undefined,
            subcategory_id: appliedFilters.subcategoryId ?? undefined,
          });
          setBrowseProducts(list.map((row) => normalizeMarketplaceProduct(row)));
        } finally {
          setBrowseLoading(false);
        }
      }
      setLocalLoading(true);
      try {
        const localList = await api.localShopProducts.list({
          page: 1,
          limit: 200,
          q: debounced || undefined,
          district_id: m.selectedDistrict?.id,
          mfy_id: m.selectedMFY?.id,
        });
        setLocalProducts(localList);
      } catch {
        setLocalProducts([]);
      } finally {
        setLocalLoading(false);
      }
    } finally {
      setPullRefreshing(false);
    }
  }, [debounced, appliedFilters, runSearch, m.selectedDistrict?.id, m.selectedMFY?.id]);

  const displayedBrowse = useMemo(
    () => filterProductsByFilters(browseProducts, appliedFilters),
    [browseProducts, appliedFilters]
  );

  const displayedSearchProducts = useMemo(
    () => filterProductsByFilters(data.products, appliedFilters),
    [data.products, appliedFilters]
  );
  const displayedLocalProducts = useMemo(
    () =>
      filterProductsByFilters(localProducts, {
        ...appliedFilters,
        contragentId: null,
      }),
    [localProducts, appliedFilters]
  );

  const hasDeliveryForLocal =
    m.selectedDistrict?.id != null || m.selectedMFY?.id != null;

  const hasAny = useMemo(
    () =>
      data.products.length > 0 ||
      data.categories.length > 0 ||
      data.subcategories.length > 0 ||
      data.contragents.length > 0,
    [data]
  );

  const openCategories = () => {
    m.setListNav('products');
    router.replace('/');
  };

  const showSearchEmpty = debounced && !loading && !hasAny;
  const showFilteredProductsEmpty =
    debounced &&
    !loading &&
    hasAny &&
    data.products.length > 0 &&
    displayedSearchProducts.length === 0;
  const showBrowseFilteredEmpty =
    !debounced && !browseLoading && browseProducts.length > 0 && displayedBrowse.length === 0;

  const commitFilters = () => {
    let next = { ...draftFilters };
    if (next.minPrice != null && next.maxPrice != null && next.minPrice > next.maxPrice) {
      const t = next.minPrice;
      next.minPrice = next.maxPrice;
      next.maxPrice = t;
    }
    setAppliedFilters(next);
    setFilterOpen(false);
    setPicker(null);
  };

  const labelContragent =
    draftFilters.contragentId == null
      ? 'Barchasi'
      : contragentOptions.find((o) => o.value === draftFilters.contragentId)?.label ?? 'Tanlang';
  const labelCategory =
    draftFilters.categoryId == null
      ? 'Barchasi'
      : categoryOptions.find((o) => o.value === draftFilters.categoryId)?.label ?? 'Tanlang';
  const labelSub =
    draftFilters.subcategoryId == null
      ? 'Barchasi'
      : subcategoryOptions.find((o) => o.value === draftFilters.subcategoryId)?.label ?? 'Tanlang';

  const pickerOptions: Opt[] =
    picker === 'contragent'
      ? contragentOptions
      : picker === 'category'
        ? categoryOptions
        : subcategoryOptions;

  const pickerTitle =
    picker === 'contragent' ? 'Kontragent' : picker === 'category' ? 'Kategoriya' : 'Subkategoriya';

  const onPickValue = (v: number | null) => {
    if (picker === 'contragent') {
      setDraftFilters((d) => ({ ...d, contragentId: v }));
    } else if (picker === 'category') {
      setDraftFilters((d) => ({ ...d, categoryId: v, subcategoryId: null }));
    } else {
      setDraftFilters((d) => ({ ...d, subcategoryId: v }));
    }
    setPicker(null);
  };

  const placeholderColor = '#d1d5db';

  return (
    <View className={cn('flex-1', Platform.OS === 'web' ? 'bg-white' : 'bg-gray-50')}>
      <ScrollView
        className="flex-1"
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 100 }}
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
        <View className="border-b border-gray-100 bg-white px-4 pb-4 pt-12 shadow-sm">
          <View
            className="w-full gap-3"
            style={{
              maxWidth: m.isTabletUpWeb ? m.containerMaxWidth : undefined,
              width: '100%',
              alignSelf: m.isTabletUpWeb ? 'center' : undefined,
            }}
          >
            <Text className="text-2xl font-black text-gray-900">Qidiruv</Text>
            <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Bozor va maxalla mahsulotlari
            </Text>
            <View className="flex-row rounded-2xl border border-gray-200/80 bg-gray-100 p-1.5">
              <Pressable
                onPress={() => setActiveTab('bozor')}
                className={cn(
                  'flex-1 flex-row items-center justify-center gap-2 rounded-xl px-2 py-3',
                  activeTab === 'bozor' ? 'bg-white shadow-sm shadow-gray-200/90' : ''
                )}
              >
                <Store
                  size={18}
                  color={activeTab === 'bozor' ? '#f97316' : '#9ca3af'}
                  strokeWidth={2.25}
                />
                <Text
                  className={cn(
                    'text-[11px] font-black uppercase tracking-wider',
                    activeTab === 'bozor' ? 'text-gray-900' : 'text-gray-500'
                  )}
                >
                  Bozorda
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('mahalla')}
                className={cn(
                  'relative flex-1 flex-row items-center justify-center gap-2 rounded-xl px-2 py-3',
                  activeTab === 'mahalla' ? 'bg-white shadow-sm shadow-gray-200/90' : ''
                )}
              >
                <MapPin
                  size={18}
                  color={activeTab === 'mahalla' ? '#f97316' : '#9ca3af'}
                  strokeWidth={2.25}
                />
                <Text
                  className={cn(
                    'text-[11px] font-black uppercase tracking-wider',
                    activeTab === 'mahalla' ? 'text-gray-900' : 'text-gray-500'
                  )}
                >
                  Maxallada
                </Text>
                <View className="absolute -right-0.5 -top-1 flex-row items-center gap-0.5 rounded-md bg-orange-500 px-1.5 py-0.5">
                  <Zap size={10} color="#fff" fill="#fff" />
                  <Text className="text-[8px] font-black uppercase text-white">Tezkor</Text>
                </View>
              </Pressable>
            </View>
            <View className="w-full flex-row overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              <View className="relative min-w-0 flex-1">
                <View className="pointer-events-none absolute left-4 top-1/2 z-10 -mt-2.5">
                  <Search size={18} color="#9ca3af" />
                </View>
                <TextInput
                  ref={inputRef}
                  placeholder="Qidirish..."
                  placeholderTextColor={placeholderColor}
                  value={q}
                  onChangeText={setQ}
                  className="border-0 bg-transparent py-4 pl-11 pr-2 text-sm font-bold text-gray-900"
                  autoCorrect={false}
                />
              </View>
              <Pressable
                onPress={() => setFilterOpen(true)}
                className={cn(
                  'h-[52px] w-12 items-center justify-center border-l border-gray-200 bg-white/90',
                  filterTabActive ? 'bg-orange-50/80' : ''
                )}
              >
                <Filter size={20} color={filterTabActive ? '#f97316' : '#4b5563'} />
              </Pressable>
            </View>
          </View>
        </View>

        <View
          className="p-4"
          style={{
            maxWidth: m.isTabletUpWeb ? m.containerMaxWidth : undefined,
            width: '100%',
            alignSelf: m.isTabletUpWeb ? 'center' : undefined,
          }}
        >
          {activeTab === 'mahalla' ? (
            <View>
              <SectionHeader title="Maxalla mahsulotlari" icon={<Layers size={16} color="#f97316" />} />
              {localLoading ? (
                <View className="items-center py-16">
                  <ActivityIndicator size="large" color="#f97316" />
                </View>
              ) : !hasDeliveryForLocal ? (
                <View className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 px-4 py-8">
                  <View className="mb-3 items-center">
                    <MapPin size={32} color="#f97316" strokeWidth={2} />
                  </View>
                  <Text className="text-center text-sm font-bold text-gray-700">
                    Maxalla mahsulotlari yetkazib berish manzilingiz (tuman / MFY) bo&apos;yicha ko&apos;rsatiladi.
                  </Text>
                  <Text className="mt-2 text-center text-xs font-semibold text-gray-500">
                    Yuqoridagi hudud tanlovidan tuman va MFY ni tanlang.
                  </Text>
                  <Pressable
                    onPress={() => m.setIsRegionSelectorOpen(true)}
                    className="mt-5 items-center rounded-2xl bg-orange-500 py-3.5 active:bg-orange-600"
                  >
                    <Text className="text-xs font-black uppercase tracking-widest text-white">
                      Manzilni tanlash
                    </Text>
                  </Pressable>
                </View>
              ) : displayedLocalProducts.length === 0 ? (
                <Text className="py-8 text-center text-sm font-bold text-gray-400">
                  Mahalla mahsulotlari topilmadi
                </Text>
              ) : (
                <View
                  className="flex-row flex-wrap"
                  style={{
                    columnGap: m.isSmallWeb ? 0 : m.cardGap,
                    rowGap: 0,
                    justifyContent: 'space-around',
                  }}
                >
                  {displayedLocalProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={() => setSelectedLocalProduct(product)}
                      onAddToCart={m.addLocalToCart}
                      onCartDelta={m.updateLocalQuantity}
                      inCartQty={m.localCart.find((c) => String(c.id) === String(product.id))?.quantity ?? 0}
                      cardWidth={m.resolvedCardWidth}
                      isSmallWeb={m.isSmallWeb}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : !debounced ? (
            <View>
              <SectionHeader title="Barcha mahsulotlar" icon={<Layers size={16} color="#f97316" />} />
              {browseLoading ? (
                <View className="items-center py-16">
                  <ActivityIndicator size="large" color="#f97316" />
                </View>
              ) : showBrowseFilteredEmpty ? (
                <Text className="py-8 text-center text-sm font-bold text-gray-400">
                  Filtr bo&apos;yicha mahsulot topilmadi
                </Text>
              ) : displayedBrowse.length === 0 ? (
                <Text className="py-8 text-center text-sm font-bold text-gray-400">Mahsulotlar topilmadi</Text>
              ) : (
                <View
                  className="flex-row flex-wrap"
                  style={{
                    columnGap: m.isSmallWeb ? 0 : m.cardGap,
                    rowGap: 0,
                    justifyContent: 'space-around',
                  }}
                >
                  {displayedBrowse.map((product) => (
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
              )}
            </View>
          ) : loading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#f97316" />
            </View>
          ) : showSearchEmpty ? (
            <Text className="py-10 text-center text-sm font-bold text-gray-400">Natija topilmadi</Text>
          ) : showFilteredProductsEmpty ? (
            <View className="gap-6">
              <Text className="py-2 text-center text-sm font-bold text-gray-400">
                Filtr bo&apos;yicha mahsulot topilmadi
              </Text>
              {data.categories.length > 0 ? (
                <View>
                  <SectionHeader title="Kategoriyalar" icon={<FolderTree size={16} color="#f97316" />} />
                  <View className="gap-2">
                    {data.categories.map((c) => (
                      <Pressable
                        key={c.id}
                        onPress={openCategories}
                        className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:bg-orange-50/40"
                      >
                        {c.image ? (
                          <Image source={{ uri: c.image }} className="h-14 w-14 rounded-xl" resizeMode="cover" />
                        ) : (
                          <View className="h-14 w-14 items-center justify-center rounded-xl bg-gray-100">
                            <FolderTree size={22} color="#9ca3af" />
                          </View>
                        )}
                        <View className="min-w-0 flex-1">
                          <Text className="font-black text-gray-900" numberOfLines={2}>
                            {c.name}
                          </Text>
                        </View>
                        <ChevronRight size={18} color="#d1d5db" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ) : (
            <View className="gap-8">
              {displayedSearchProducts.length > 0 ? (
                <View>
                  <SectionHeader title="Mahsulotlar" icon={<Layers size={16} color="#f97316" />} />
                  <View
                    className="flex-row flex-wrap"
                    style={{
                      columnGap: m.isSmallWeb ? 0 : m.cardGap,
                      rowGap: 0,
                      justifyContent: 'space-around',
                    }}
                  >
                    {displayedSearchProducts.map((product) => (
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
                </View>
              ) : null}

              {data.categories.length > 0 ? (
                <View>
                  <SectionHeader title="Kategoriyalar" icon={<FolderTree size={16} color="#f97316" />} />
                  <View className="gap-2">
                    {data.categories.map((c) => (
                      <Pressable
                        key={c.id}
                        onPress={openCategories}
                        className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:bg-orange-50/40"
                      >
                        {c.image ? (
                          <Image source={{ uri: c.image }} className="h-14 w-14 rounded-xl" resizeMode="cover" />
                        ) : (
                          <View className="h-14 w-14 items-center justify-center rounded-xl bg-gray-100">
                            <FolderTree size={22} color="#9ca3af" />
                          </View>
                        )}
                        <View className="min-w-0 flex-1">
                          <Text className="font-black text-gray-900" numberOfLines={2}>
                            {c.name}
                          </Text>
                        </View>
                        <ChevronRight size={18} color="#d1d5db" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              {data.subcategories.length > 0 ? (
                <View>
                  <SectionHeader title="Subkategoriyalar" icon={<Layers size={16} color="#f97316" />} />
                  <View className="gap-2">
                    {data.subcategories.map((s) => (
                      <View
                        key={s.id}
                        className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                      >
                        {s.image ? (
                          <Image source={{ uri: s.image }} className="h-14 w-14 rounded-xl" resizeMode="cover" />
                        ) : (
                          <View className="h-14 w-14 items-center justify-center rounded-xl bg-gray-100">
                            <Layers size={22} color="#9ca3af" />
                          </View>
                        )}
                        <View className="min-w-0 flex-1">
                          <Text className="font-black text-gray-900" numberOfLines={2}>
                            {s.name}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {data.contragents.length > 0 ? (
                <View>
                  <SectionHeader title="Kontragentlar" icon={<Building2 size={16} color="#f97316" />} />
                  <View className="gap-2">
                    {data.contragents.map((c) => (
                      <View key={c.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <View className="flex-row items-start gap-3">
                          {c.logo ? (
                            <Image source={{ uri: c.logo }} className="h-14 w-14 rounded-xl" resizeMode="cover" />
                          ) : (
                            <View className="h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
                              <Building2 size={22} color="#94a3b8" />
                            </View>
                          )}
                          <View className="min-w-0 flex-1">
                            <Text className="font-black text-gray-900" numberOfLines={2}>
                              {c.name}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={filterOpen}
        transparent
        animationType={m.isTabletUpWeb ? 'fade' : 'slide'}
        onRequestClose={() => setFilterOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: m.isTabletUpWeb ? 'center' : 'flex-end',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.45)',
            paddingHorizontal: m.isTabletUpWeb ? 16 : 0,
            paddingBottom: m.isTabletUpWeb ? 16 : 0,
            paddingTop: m.isTabletUpWeb ? 16 : 0,
          }}
        >
          <Pressable
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            onPress={() => setFilterOpen(false)}
          />
          <View
            className="bg-white px-4 pb-6 pt-2"
            style={{
              width: '100%',
              maxWidth: 420,
              maxHeight: m.isTabletUpWeb ? '85%' : '88%',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomLeftRadius: m.isTabletUpWeb ? 24 : 0,
              borderBottomRightRadius: m.isTabletUpWeb ? 24 : 0,
              overflow: 'hidden',
            }}
          >
            {!m.isTabletUpWeb ? (
              <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-gray-300" />
            ) : null}
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-black text-gray-900">Filtr</Text>
              <Pressable
                onPress={() => {
                  setPicker(null);
                  setFilterOpen(false);
                }}
                className="h-10 w-10 items-center justify-center rounded-xl border border-gray-200"
              >
                <X size={20} color="#6b7280" />
              </Pressable>
            </View>

            <View className="relative" style={{ minHeight: 320 }}>
              {picker ? (
                <View className="absolute inset-0 z-20 bg-white">
                  <Pressable
                    onPress={() => setPicker(null)}
                    className="mb-3 flex-row items-center gap-2 py-2"
                  >
                    <ChevronLeft size={22} color="#374151" />
                    <Text className="text-base font-black text-gray-900">{pickerTitle}</Text>
                  </Pressable>
                  <ScrollView className="max-h-[55vh]" showsVerticalScrollIndicator={false}>
                    <Pressable
                      onPress={() => onPickValue(null)}
                      className="border-b border-gray-100 py-3.5"
                    >
                      <Text className="font-bold text-orange-600">Barchasi</Text>
                    </Pressable>
                    {pickerOptions.map((o) => {
                      const sel =
                        picker === 'contragent'
                          ? draftFilters.contragentId === o.value
                          : picker === 'category'
                            ? draftFilters.categoryId === o.value
                            : draftFilters.subcategoryId === o.value;
                      return (
                        <Pressable
                          key={o.value}
                          onPress={() => onPickValue(o.value)}
                          className="flex-row items-center justify-between border-b border-gray-100 py-3.5"
                        >
                          <Text className="flex-1 pr-2 font-semibold text-gray-800">{o.label}</Text>
                          {sel ? <Check size={18} color="#f97316" /> : null}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : (
                <ScrollView className="max-h-[62vh]" showsVerticalScrollIndicator={false}>
                  <View className="gap-4 pb-4">
                    {activeTab === 'bozor' ? (
                      <View>
                        <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                          Kontragent
                        </Text>
                        <Pressable
                          onPress={() => setPicker('contragent')}
                          className="flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5"
                        >
                          <Text
                            className={cn(
                              'flex-1 pr-2 text-sm font-bold',
                              draftFilters.contragentId == null ? 'text-gray-400' : 'text-gray-900'
                            )}
                            numberOfLines={1}
                          >
                            {labelContragent}
                          </Text>
                          <ChevronDown size={18} color="#9ca3af" />
                        </Pressable>
                      </View>
                    ) : null}

                    <View>
                      <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                        Kategoriya
                      </Text>
                      <Pressable
                        onPress={() => setPicker('category')}
                        className="flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5"
                      >
                        <Text
                          className={cn(
                            'flex-1 pr-2 text-sm font-bold',
                            draftFilters.categoryId == null ? 'text-gray-400' : 'text-gray-900'
                          )}
                          numberOfLines={1}
                        >
                          {labelCategory}
                        </Text>
                        <ChevronDown size={18} color="#9ca3af" />
                      </Pressable>
                    </View>

                    <View>
                      <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                        Subkategoriya
                      </Text>
                      <Pressable
                        disabled={!draftFilters.categoryId}
                        onPress={() => draftFilters.categoryId && setPicker('subcategory')}
                        className={cn(
                          'flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5',
                          !draftFilters.categoryId && 'opacity-50'
                        )}
                      >
                        <Text
                          className={cn(
                            'flex-1 pr-2 text-sm font-bold',
                            !draftFilters.categoryId || draftFilters.subcategoryId == null
                              ? 'text-gray-400'
                              : 'text-gray-900'
                          )}
                          numberOfLines={1}
                        >
                          {!draftFilters.categoryId ? 'Avval kategoriya' : labelSub}
                        </Text>
                        <ChevronDown size={18} color="#9ca3af" />
                      </Pressable>
                    </View>

                    <View>
                      <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                        Narx oralig&apos;i
                      </Text>
                      <Text className="mb-1 text-xs font-bold text-gray-500">Minimum</Text>
                      <View className="relative mb-2">
                        <TextInput
                          placeholder="Cheklanmagan"
                          placeholderTextColor={placeholderColor}
                          value={draftFilters.minPrice != null ? formatSomDigits(draftFilters.minPrice) : ''}
                          onChangeText={(t) => {
                            const p = parseSomDigitsFromInput(t);
                            setDraftFilters((d) => ({ ...d, minPrice: p }));
                          }}
                          keyboardType="number-pad"
                          className="rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-16 text-sm font-bold text-gray-900"
                        />
                        <Text className="pointer-events-none absolute right-4 top-3 text-xs font-bold text-gray-400">
                          so&apos;m
                        </Text>
                      </View>
                      <Text className="mb-1 text-xs font-bold text-gray-500">Maksimum</Text>
                      <View className="relative mb-1">
                        <TextInput
                          placeholder="Cheklanmagan"
                          placeholderTextColor={placeholderColor}
                          value={draftFilters.maxPrice != null ? formatSomDigits(draftFilters.maxPrice) : ''}
                          onChangeText={(t) => {
                            const p = parseSomDigitsFromInput(t);
                            setDraftFilters((d) => ({ ...d, maxPrice: p }));
                          }}
                          keyboardType="number-pad"
                          className="rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-16 text-sm font-bold text-gray-900"
                        />
                        <Text className="pointer-events-none absolute right-4 top-3 text-xs font-bold text-gray-400">
                          so&apos;m
                        </Text>
                      </View>
                      <Text className="mt-1 text-[10px] font-semibold text-gray-400">
                        Bo&apos;sh qoldiring — chegara qo&apos;llanmaydi (maks. ixtiyoriy)
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>

            {!picker ? (
              <View className="mt-2 gap-2 border-t border-gray-100 pt-3">
                <Pressable onPress={commitFilters} className="rounded-2xl bg-gray-900 py-4">
                  <Text className="text-center text-sm font-black uppercase tracking-widest text-white">
                    Qo&apos;llash
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setDraftFilters(EMPTY_PRODUCT_FILTERS);
                    setAppliedFilters(EMPTY_PRODUCT_FILTERS);
                    setPicker(null);
                    setFilterOpen(false);
                  }}
                  className="rounded-2xl border border-gray-200 py-3"
                >
                  <Text className="text-center text-sm font-bold text-gray-600">Filtrlarni tozalash</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedLocalProduct}
        transparent
        animationType={m.isTabletUpWeb ? 'fade' : 'slide'}
        onRequestClose={() => setSelectedLocalProduct(null)}
      >
        <View className="flex-1 bg-black/50" style={{ justifyContent: m.isTabletUpWeb ? 'center' : 'flex-end' }}>
          <Pressable className="absolute inset-0" onPress={() => setSelectedLocalProduct(null)} />
          {selectedLocalProduct ? (
            <View
              className="w-full overflow-hidden bg-white"
              style={{
                maxHeight: m.isTabletUpWeb ? '88%' : '90%',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                borderBottomLeftRadius: m.isTabletUpWeb ? 28 : 0,
                borderBottomRightRadius: m.isTabletUpWeb ? 28 : 0,
                maxWidth: m.isTabletUpWeb ? 760 : undefined,
                alignSelf: 'center',
              }}
            >
              <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
                <View className="relative bg-gray-50">
                  <Image source={{ uri: selectedLocalProduct.images[0] }} className="h-72 w-full" resizeMode="cover" />
                  <Pressable
                    onPress={() => setSelectedLocalProduct(null)}
                    className="absolute right-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-white/90"
                  >
                    <X size={20} color="#111827" />
                  </Pressable>
                </View>
                <View className="px-5 pt-5">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500">Maxalla mahsuloti</Text>
                  <Text className="mt-1 text-2xl font-black text-gray-900">{selectedLocalProduct.name}</Text>
                  <Text className="mt-3 text-2xl font-black text-orange-500">
                    {selectedLocalProduct.price.toLocaleString()} <Text className="text-xs font-bold">so&apos;m</Text>
                  </Text>
                  <Text className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-500">
                    {selectedLocalProduct.quantity} ta mavjud
                  </Text>

                  <Text className="mt-5 leading-relaxed text-gray-600">{m.renderDescriptionDelta(selectedLocalProduct.description)}</Text>

                  {(() => {
                    const localQty = m.localCart.find((c) => String(c.id) === String(selectedLocalProduct.id))?.quantity ?? 0;
                    const stock = Math.max(0, Math.floor(Number(selectedLocalProduct.quantity) || 0));
                    const atMax = localQty >= stock;
                    if (stock <= 0) {
                      return (
                        <View className="mt-6 rounded-2xl border border-gray-200 bg-gray-100 py-3">
                          <Text className="text-center text-[11px] font-black uppercase tracking-wider text-gray-500">
                            Omborda yo&apos;q
                          </Text>
                        </View>
                      );
                    }
                    if (localQty <= 0) {
                      return (
                        <Pressable
                          onPress={() => m.addLocalToCart(selectedLocalProduct)}
                          className="mt-6 rounded-2xl bg-gray-900 py-4 active:opacity-90"
                        >
                          <Text className="text-center text-sm font-black uppercase tracking-wider text-white">
                            Savatga qo&apos;shish
                          </Text>
                        </Pressable>
                      );
                    }
                    return (
                      <View className="mt-6 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-2 py-1">
                        <Pressable
                          onPress={() => m.updateLocalQuantity(selectedLocalProduct.id, -1)}
                          className="h-10 w-10 items-center justify-center rounded-xl bg-white"
                        >
                          <Text className="text-lg font-black text-gray-700">-</Text>
                        </Pressable>
                        <Text className="text-sm font-black text-gray-900">{localQty}</Text>
                        <Pressable
                          onPress={() => !atMax && m.updateLocalQuantity(selectedLocalProduct.id, 1)}
                          disabled={atMax}
                          className={cn('h-10 w-10 items-center justify-center rounded-xl bg-white', atMax && 'opacity-40')}
                        >
                          <Text className="text-lg font-black text-gray-700">+</Text>
                        </Pressable>
                      </View>
                    );
                  })()}
                </View>
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
