import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search as SearchIcon,
  ChevronRight,
  Building2,
  FolderTree,
  Layers,
  ArrowLeft,
  Filter,
  X,
  Store,
  MapPin,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { normalizeMarketplaceProduct } from '../services/normalizeProduct';
import type { Product, UnifiedSearchResponse } from '../types';
import type { LocalShopProduct } from '../types';
import { useWebCart } from '../hooks/useWebCart';
import { WebProductCard } from '../components/WebProductCard';
import { WebProductDetailOverlay } from '../components/WebProductDetailOverlay';
import { WebLocalProductDetailOverlay } from '../components/WebLocalProductDetailOverlay';
import { WebCustomSelect, type WebSelectOption } from '../components/WebCustomSelect';
import { formatSomDigits, parseSomDigitsFromInput } from '../lib/formatSom';
import {
  EMPTY_PRODUCT_FILTERS,
  filtersActive,
  filtersActiveMahalla,
  filterProductsByFilters,
  type ProductFilters,
} from '../lib/searchFilters';
import { readWebDelivery } from '../lib/webDeliverySelection';
import {
  deliverySelectionFromIds,
  filterLocalProductsForDelivery,
  filterProductsForDelivery,
  hasDeliverySelection,
} from '../lib/deliveryFilter';
import { cn } from '../lib/utils';

const EMPTY: UnifiedSearchResponse = {
  query: '',
  limit_per_type: 10,
  products: [],
  categories: [],
  subcategories: [],
  contragents: [],
};
type SearchMarketTab = 'bozor' | 'mahalla';

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-orange-500">{icon}</span>
      <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">{title}</h2>
    </div>
  );
}

type DraftPriceBlockProps = {
  draft: ProductFilters;
  setDraft: React.Dispatch<React.SetStateAction<ProductFilters>>;
  sliderMax: number;
};

function DraftPriceBlock({ draft, setDraft, sliderMax }: DraftPriceBlockProps) {
  const step = Math.max(1000, Math.floor(sliderMax / 400));
  const capMax = draft.maxPrice ?? sliderMax;
  const floorMin = draft.minPrice ?? 0;
  const minSliderValue = Math.min(draft.minPrice ?? 0, capMax);
  const maxSliderValue = draft.maxPrice ?? sliderMax;

  return (
    <div className="space-y-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Narx oralig&apos;i</p>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-gray-500">Minimum</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Cheklanmagan"
            value={draft.minPrice != null ? formatSomDigits(draft.minPrice) : ''}
            onChange={(e) => {
              const p = parseSomDigitsFromInput(e.target.value);
              setDraft((d) => ({ ...d, minPrice: p }));
            }}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-14 text-sm font-bold text-gray-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
            so&apos;m
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={capMax}
          step={step}
          value={minSliderValue}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDraft((d) => ({ ...d, minPrice: v <= 0 ? null : v }));
          }}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-orange-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-gray-500">Maksimum</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Cheklanmagan"
            value={draft.maxPrice != null ? formatSomDigits(draft.maxPrice) : ''}
            onChange={(e) => {
              const p = parseSomDigitsFromInput(e.target.value);
              setDraft((d) => ({ ...d, maxPrice: p }));
            }}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-14 text-sm font-bold text-gray-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
            so&apos;m
          </span>
        </div>
        <input
          type="range"
          min={Math.min(floorMin, sliderMax - step)}
          max={sliderMax}
          step={step}
          value={Math.min(sliderMax, Math.max(maxSliderValue, Math.min(floorMin, sliderMax - step)))}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDraft((d) => ({ ...d, maxPrice: v >= sliderMax ? null : v }));
          }}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-orange-500"
        />
        <p className="mt-1.5 text-[10px] font-semibold text-gray-400">
          Slayderni eng o&apos;ng chetkaga — yuqori chegara cheklanmagan
        </p>
      </div>
    </div>
  );
}

export function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToCart, updateQuantity, cart, localCart, addLocalToCart, updateLocalQuantity } = useWebCart();
  const cartQtyByProductId = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of cart) m.set(String(it.id), it.quantity);
    return m;
  }, [cart]);
  const localCartQtyByProductId = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of localCart) m.set(String(it.id), it.quantity);
    return m;
  }, [localCart]);
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UnifiedSearchResponse>(EMPTY);
  const [browseProducts, setBrowseProducts] = useState<Product[]>([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLocalProduct, setSelectedLocalProduct] = useState<LocalShopProduct | null>(null);
  const [activeTab, setActiveTab] = useState<SearchMarketTab>('bozor');
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(EMPTY_PRODUCT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<ProductFilters>(EMPTY_PRODUCT_FILTERS);
  const [categoryOptions, setCategoryOptions] = useState<WebSelectOption<number>[]>([]);
  const [contragentOptions, setContragentOptions] = useState<WebSelectOption<number>[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<WebSelectOption<number>[]>([]);
  const [localProducts, setLocalProducts] = useState<LocalShopProduct[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [deliveryRev, setDeliveryRev] = useState(0);
  const [deliverySnap, setDeliverySnap] = useState(() => readWebDelivery());
  const [filterModalDesktop, setFilterModalDesktop] = useState(false);

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

  useEffect(() => {
    const h = () => {
      setDeliveryRev((r) => r + 1);
      setDeliverySnap(readWebDelivery());
    };
    window.addEventListener('marketplace-delivery', h);
    return () => window.removeEventListener('marketplace-delivery', h);
  }, []);

  useEffect(() => {
    setDeliverySnap(readWebDelivery());
  }, [location.key]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setFilterModalDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const s = location.state as {
      focusSearch?: boolean;
      openFilter?: boolean;
      contragentId?: number;
      marketTab?: SearchMarketTab;
    } | null;
    if (!s?.focusSearch && !s?.openFilter && s?.contragentId == null && !s?.marketTab) return;
    if (s.focusSearch) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    if (s.openFilter) {
      setFilterOpen(true);
    }
    if (s.contragentId != null) {
      setActiveTab('bozor');
      setAppliedFilters((prev) => ({ ...prev, contragentId: Number(s.contragentId) }));
      setDraftFilters((prev) => ({ ...prev, contragentId: Number(s.contragentId) }));
    }
    if (s.marketTab === 'bozor' || s.marketTab === 'mahalla') {
      setActiveTab(s.marketTab);
    }
    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.state, navigate]);

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
        const snap = readWebDelivery();
        const list = await api.localShopProducts.list({
          page: 1,
          limit: 200,
          q: debounced || undefined,
          district_id: snap.district_id ?? undefined,
          mfy_id: snap.mfy_id ?? undefined,
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
  }, [debounced, deliveryRev]);

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

  const priceSliderMax = useMemo(() => {
    let m = 2_000_000;
    for (const p of browseProducts) m = Math.max(m, p.price);
    for (const p of data.products) m = Math.max(m, p.price);
    const step = 100_000;
    return Math.max(Math.ceil(m / step) * step, 1_000_000);
  }, [browseProducts, data.products]);

  const deliverySel = useMemo(
    () =>
      deliverySelectionFromIds(deliverySnap.region_id, deliverySnap.district_id, deliverySnap.mfy_id),
    [deliverySnap]
  );

  const displayedBrowse = useMemo(() => {
    const byFilters = filterProductsByFilters(browseProducts, appliedFilters);
    return filterProductsForDelivery(byFilters, deliverySel);
  }, [browseProducts, appliedFilters, deliverySel]);

  const displayedSearchProducts = useMemo(() => {
    const byFilters = filterProductsByFilters(data.products, appliedFilters);
    return filterProductsForDelivery(byFilters, deliverySel);
  }, [data.products, appliedFilters, deliverySel]);

  const displayedLocalProducts = useMemo(() => {
    const byFilters = filterProductsByFilters(localProducts, {
      ...appliedFilters,
      contragentId: null,
    });
    return filterLocalProductsForDelivery(byFilters, deliverySel);
  }, [localProducts, appliedFilters, deliverySel]);

  const hasAny = useMemo(
    () =>
      data.products.length > 0 ||
      data.categories.length > 0 ||
      data.subcategories.length > 0 ||
      data.contragents.length > 0,
    [data]
  );

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
  };

  const resetDraft = () => {
    setDraftFilters(EMPTY_PRODUCT_FILTERS);
  };
  const compactWebHeader = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 font-['Plus_Jakarta_Sans']">
      <header className={cn('sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm md:px-6', compactWebHeader ? 'px-3 pt-3' : 'px-4 pt-8 md:pt-10')}>
        <div className={cn('mx-auto flex max-w-7xl flex-col pb-4', compactWebHeader ? 'gap-2 pb-3' : 'gap-4')}>
          <div className={cn('flex items-center', compactWebHeader ? 'gap-2' : 'gap-3')}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={cn(
                'flex flex-shrink-0 items-center justify-center border border-gray-200 bg-gray-50 text-gray-700 transition hover:bg-white md:hidden',
                compactWebHeader ? 'h-10 w-10 rounded-xl' : 'h-11 w-11 rounded-2xl'
              )}
              aria-label="Orqaga"
            >
              <ArrowLeft size={compactWebHeader ? 20 : 22} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className={cn('font-black text-gray-900 md:text-3xl', compactWebHeader ? 'text-xl' : 'text-2xl')}>Qidiruv</h1>
              <p className={cn('mt-1 font-bold uppercase tracking-widest text-gray-400', compactWebHeader ? 'text-[10px]' : 'text-xs')}>
                Bozor va maxalla mahsulotlari
              </p>
            </div>
          </div>
          <div className={cn('flex border border-gray-200/80 bg-gradient-to-b from-gray-100 to-gray-100/90 shadow-inner', compactWebHeader ? 'rounded-xl p-1' : 'rounded-2xl p-1.5')}>
            <button
              type="button"
              onClick={() => setActiveTab('bozor')}
              className={cn(
                'flex flex-1 items-center justify-center rounded-xl font-black uppercase transition md:py-2.5',
                compactWebHeader ? 'gap-1.5 px-2 py-2 text-[11px] tracking-wide' : 'gap-2 px-3 py-3 text-xs tracking-wider',
                activeTab === 'bozor'
                  ? 'bg-white text-gray-900 shadow-md shadow-gray-200/80 ring-1 ring-gray-100'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Store
                size={compactWebHeader ? 16 : 18}
                strokeWidth={2.25}
                className={activeTab === 'bozor' ? 'text-orange-500' : 'text-gray-400'}
              />
              Bozorda
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mahalla')}
              className={cn(
                'relative flex flex-1 items-center justify-center rounded-xl font-black uppercase transition md:py-2.5',
                compactWebHeader ? 'gap-1.5 px-2 py-2 text-[11px] tracking-wide' : 'gap-2 px-3 py-3 text-xs tracking-wider',
                activeTab === 'mahalla'
                  ? 'bg-white text-gray-900 shadow-md shadow-gray-200/80 ring-1 ring-gray-100'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <MapPin
                size={compactWebHeader ? 16 : 18}
                strokeWidth={2.25}
                className={activeTab === 'mahalla' ? 'text-orange-500' : 'text-gray-400'}
              />
              Maxallada
              <span className="pointer-events-none absolute -right-0.5 -top-1 flex items-center gap-0.5 rounded-md bg-orange-500 px-1.5 py-0.5 shadow-sm">
                <Zap size={10} className="text-white" fill="currentColor" />
                <span className="text-[8px] font-black uppercase leading-none text-white">Tezkor</span>
              </span>
            </button>
          </div>
          <div className={cn('flex w-full items-stretch overflow-hidden border border-gray-200 bg-gray-50 shadow-sm transition focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500', compactWebHeader ? 'rounded-xl' : 'rounded-2xl')}>
            <div className="relative min-w-0 flex-1">
              <SearchIcon className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400', compactWebHeader ? 'left-3 h-4 w-4' : 'left-4 h-[18px] w-[18px]')} />
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Qidirish..."
                className={cn(
                  'w-full border-0 bg-transparent pr-3 font-bold text-gray-900 outline-none ring-0 placeholder:font-semibold placeholder:text-gray-300',
                  compactWebHeader ? 'py-3 pl-9 text-xs' : 'py-4 pl-11 text-sm'
                )}
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className={cn(
                'relative flex w-12 flex-shrink-0 items-center justify-center border-l border-gray-200 bg-white/90 text-gray-600 transition hover:bg-white',
                compactWebHeader ? 'h-[44px]' : 'h-[52px]',
                filterTabActive && 'text-orange-500'
              )}
              aria-label="Filtr"
            >
              <Filter size={compactWebHeader ? 18 : 20} />
              {filterTabActive ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500" />
              ) : null}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {activeTab === 'mahalla' ? (
          <section>
            <SectionTitle icon={<Layers size={18} />} title="Maxalla mahsulotlari" />
            {localLoading ? (
              <div className="flex flex-wrap justify-around gap-x-4 gap-y-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-80 w-[240px] flex-shrink-0 animate-pulse rounded-[32px] border border-gray-100 bg-white sm:w-[260px] md:w-[280px]"
                  />
                ))}
              </div>
            ) : !hasDeliverySelection(deliverySel) ? (
              <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/40 px-5 py-10 text-center">
                <MapPin className="mx-auto mb-3 text-orange-500" size={36} strokeWidth={2} />
                <p className="text-sm font-bold text-gray-700">
                  Maxalla mahsulotlari yetkazib berish manzilingiz (tuman / MFY) bo&apos;yicha ko&apos;rsatiladi.
                </p>
                <p className="mt-2 text-xs font-semibold text-gray-500">
                  Bosh sahifada hududni tanlang, keyin bu yerga qayting.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="mt-5 rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600"
                >
                  Manzilni tanlash
                </button>
              </div>
            ) : displayedLocalProducts.length === 0 ? (
              <p className="py-8 text-center text-sm font-bold text-gray-400">Mahalla mahsulotlari topilmadi</p>
            ) : (
              <div className="flex flex-wrap justify-around gap-x-4 gap-y-6">
                {displayedLocalProducts.map((product) => (
                  <div key={product.id} className="w-[240px] flex-shrink-0 sm:w-[260px] md:w-[280px]">
                    <WebProductCard
                      product={product}
                      onSelect={() => setSelectedLocalProduct(product)}
                      onAddToCart={addLocalToCart}
                      onCartDelta={updateLocalQuantity}
                      inCartQty={localCartQtyByProductId.get(String(product.id)) ?? 0}
                      pendingCartKind="local"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : !debounced ? (
          <section>
            <SectionTitle icon={<Layers size={18} />} title="Barcha mahsulotlar" />
            {browseLoading ? (
              <div className="flex flex-wrap justify-around gap-x-4 gap-y-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-80 w-[240px] flex-shrink-0 animate-pulse rounded-[32px] border border-gray-100 bg-white sm:w-[260px] md:w-[280px]"
                  />
                ))}
              </div>
            ) : showBrowseFilteredEmpty ? (
              <p className="py-8 text-center text-sm font-bold text-gray-400">
                Filtr bo&apos;yicha mahsulot topilmadi
              </p>
            ) : displayedBrowse.length === 0 ? (
              <p className="py-8 text-center text-sm font-bold text-gray-400">Mahsulotlar topilmadi</p>
            ) : (
              <div className="flex flex-wrap justify-around gap-x-4 gap-y-6">
                {displayedBrowse.map((product) => (
                  <div key={product.id} className="w-[240px] flex-shrink-0 sm:w-[260px] md:w-[280px]">
                    <WebProductCard
                      product={product}
                      onSelect={setSelectedProduct}
                      onAddToCart={addToCart}
                      onCartDelta={updateQuantity}
                      inCartQty={cartQtyByProductId.get(String(product.id)) ?? 0}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : loading ? (
          <div className="space-y-6 py-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl bg-white" />
            ))}
          </div>
        ) : showSearchEmpty ? (
          <p className="py-12 text-center text-sm font-bold text-gray-400">Natija topilmadi</p>
        ) : showFilteredProductsEmpty ? (
          <div className="space-y-10">
            <p className="py-4 text-center text-sm font-bold text-gray-400">
              Filtr bo&apos;yicha mahsulot topilmadi
            </p>
            {data.categories.length > 0 ? (
              <section>
                <SectionTitle icon={<FolderTree size={18} />} title="Kategoriyalar" />
                <div className="flex flex-col gap-2">
                  {data.categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => navigate('/products')}
                      className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-orange-200 hover:bg-orange-50/30"
                    >
                      {c.image ? (
                        <img
                          src={c.image}
                          alt=""
                          className="h-14 w-14 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                          <FolderTree size={22} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-gray-900">{c.name}</p>
                        {c.slug ? <p className="text-xs text-gray-400">{c.slug}</p> : null}
                      </div>
                      <ChevronRight size={18} className="text-gray-300" />
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="space-y-10">
            {displayedSearchProducts.length > 0 ? (
              <section>
                <SectionTitle icon={<Layers size={18} />} title="Mahsulotlar" />
                <div className="flex flex-wrap justify-around gap-x-4 gap-y-6">
                  {displayedSearchProducts.map((product) => (
                    <div key={product.id} className="w-[240px] flex-shrink-0 sm:w-[260px] md:w-[280px]">
                      <WebProductCard
                        product={product}
                        onSelect={setSelectedProduct}
                        onAddToCart={addToCart}
                        onCartDelta={updateQuantity}
                        inCartQty={cartQtyByProductId.get(String(product.id)) ?? 0}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {data.categories.length > 0 ? (
              <section>
                <SectionTitle icon={<FolderTree size={18} />} title="Kategoriyalar" />
                <div className="flex flex-col gap-2">
                  {data.categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => navigate('/products')}
                      className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-orange-200 hover:bg-orange-50/30"
                    >
                      {c.image ? (
                        <img
                          src={c.image}
                          alt=""
                          className="h-14 w-14 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                          <FolderTree size={22} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-gray-900">{c.name}</p>
                        {c.slug ? <p className="text-xs text-gray-400">{c.slug}</p> : null}
                      </div>
                      <ChevronRight size={18} className="text-gray-300" />
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {data.subcategories.length > 0 ? (
              <section>
                <SectionTitle icon={<Layers size={18} />} title="Subkategoriyalar" />
                <div className="flex flex-col gap-2">
                  {data.subcategories.map((s) => (
                    <div
                      key={s.id}
                      className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      {s.image ? (
                        <img
                          src={s.image}
                          alt=""
                          className="h-14 w-14 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                          <Layers size={22} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400">ID: {s.parent_id ?? '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {data.contragents.length > 0 ? (
              <section>
                <SectionTitle icon={<Building2 size={18} />} title="Kontragentlar" />
                <div className="flex flex-col gap-2">
                  {data.contragents.map((c) => (
                    <div key={c.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        {c.logo ? (
                          <img
                            src={c.logo}
                            alt=""
                            className="h-14 w-14 rounded-xl object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
                            <Building2 size={22} className="text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-gray-900">{c.name}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {c.phone ? <span>{c.phone}</span> : null}
                            {c.inn ? <span className="ml-2">STIR: {c.inn}</span> : null}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </main>

      <AnimatePresence>
        {filterOpen ? (
          <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-4">
            <motion.button
              type="button"
              aria-label="Yopish"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="search-filter-title"
              initial={
                filterModalDesktop
                  ? { opacity: 0, scale: 0.96, y: 0 }
                  : { opacity: 1, y: '100%', scale: 1 }
              }
              animate={
                filterModalDesktop
                  ? { opacity: 1, scale: 1, y: 0 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              exit={
                filterModalDesktop
                  ? { opacity: 0, scale: 0.96, y: 0 }
                  : { opacity: 1, y: '100%', scale: 1 }
              }
              transition={
                filterModalDesktop
                  ? { type: 'spring', damping: 28, stiffness: 320 }
                  : { type: 'spring', damping: 30, stiffness: 320 }
              }
              className="relative z-[90] flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col bg-white shadow-2xl md:max-h-[min(85vh,680px)] md:rounded-[28px] rounded-t-[28px] border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex max-h-[min(88vh,720px)] flex-col md:max-h-[min(85vh,680px)]">
                <div className="flex-shrink-0 pt-3 md:hidden">
                  <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-gray-200" />
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-4 pt-1">
                  <h2 id="search-filter-title" className="text-lg font-black text-gray-900">
                    Filtr
                  </h2>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50"
                    aria-label="Yopish"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                  <div className="flex flex-col gap-5">
                    {activeTab === 'bozor' ? (
                      <WebCustomSelect<number>
                        label="Kontragent"
                        value={draftFilters.contragentId}
                        options={contragentOptions}
                        onChange={(v) => setDraftFilters((d) => ({ ...d, contragentId: v }))}
                        placeholder="Tanlang"
                      />
                    ) : null}
                    <WebCustomSelect<number>
                      label="Kategoriya"
                      value={draftFilters.categoryId}
                      options={categoryOptions}
                      onChange={(v) =>
                        setDraftFilters((d) => ({
                          ...d,
                          categoryId: v,
                          subcategoryId: null,
                        }))
                      }
                      placeholder="Tanlang"
                    />
                    <WebCustomSelect<number>
                      label="Subkategoriya"
                      value={draftFilters.subcategoryId}
                      options={subcategoryOptions}
                      disabled={!draftFilters.categoryId}
                      onChange={(v) => setDraftFilters((d) => ({ ...d, subcategoryId: v }))}
                      placeholder={draftFilters.categoryId ? 'Tanlang' : 'Avval kategoriya'}
                      nullLabel="Barchasi"
                    />
                    <DraftPriceBlock draft={draftFilters} setDraft={setDraftFilters} sliderMax={priceSliderMax} />
                  </div>
                </div>
                <div className="flex-shrink-0 space-y-2 border-t border-gray-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <button
                    type="button"
                    onClick={commitFilters}
                    className="w-full rounded-2xl bg-gray-900 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-orange-500"
                  >
                    Qo&apos;llash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetDraft();
                      setAppliedFilters(EMPTY_PRODUCT_FILTERS);
                      setFilterOpen(false);
                    }}
                    className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                  >
                    Filtrlarni tozalash
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {selectedProduct ? (
        <WebProductDetailOverlay
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={activeTab === 'mahalla' ? () => {} : addToCart}
          onCartDelta={activeTab === 'mahalla' ? () => {} : updateQuantity}
          inCartQty={activeTab === 'mahalla' ? 0 : (cartQtyByProductId.get(String(selectedProduct.id)) ?? 0)}
        />
      ) : null}
      {selectedLocalProduct ? (
        <WebLocalProductDetailOverlay
          product={selectedLocalProduct}
          onClose={() => setSelectedLocalProduct(null)}
          onAddToCart={addLocalToCart}
          onCartDelta={updateLocalQuantity}
          inCartQty={localCartQtyByProductId.get(String(selectedLocalProduct.id)) ?? 0}
        />
      ) : null}
    </div>
  );
}
