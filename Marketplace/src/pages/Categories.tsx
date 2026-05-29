import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Package } from 'lucide-react';
import { api } from '../services/api';
import { Category, Product, Subcategory } from '../types';
import { useWebCart } from '../hooks/useWebCart';
import { WebProductCard } from '../components/WebProductCard';
import { WebProductDetailOverlay } from '../components/WebProductDetailOverlay';

type BrowseStep = 'categories' | 'subcategories' | 'products';

const DESKTOP_MIN_PX = 1024;

function subscribeMedia(query: MediaQueryList, onChange: () => void) {
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function useIsDesktop() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN_PX}px)`);
      return subscribeMedia(mq, onStoreChange);
    },
    () => (typeof window !== 'undefined' ? window.matchMedia(`(min-width: ${DESKTOP_MIN_PX}px)`).matches : false),
    () => false
  );
}

export function CategoriesPage() {
  const isDesktop = useIsDesktop();
  const { cart, addToCart, updateQuantity } = useWebCart();
  const cartQtyByProductId = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of cart) m.set(String(it.id), it.quantity);
    return m;
  }, [cart]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [step, setStep] = useState<BrowseStep>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [categoryHasProducts, setCategoryHasProducts] = useState<Record<number, boolean>>({});
  const [categoryAvailDone, setCategoryAvailDone] = useState(false);
  const [subcategoryHasProducts, setSubcategoryHasProducts] = useState<Record<number, boolean>>({});
  const [subcategoryAvailDone, setSubcategoryAvailDone] = useState(false);

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
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const cats = await api.categories.list({ page: 1, limit: 10 });
        if (cancelled) return;
        setCategories(cats);
        const desktop =
          typeof window !== 'undefined' && window.matchMedia(`(min-width: ${DESKTOP_MIN_PX}px)`).matches;
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
  }, []);

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
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN_PX}px)`);
    const onChange = () => {
      const desktop = mq.matches;
      if (!desktop) {
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
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [categories, loadCategorySubs]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const selectedSubcategory = useMemo(
    () => subcategories.find((s) => s.id === selectedSubcategoryId) || null,
    [subcategories, selectedSubcategoryId]
  );

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

  const isCategoryDisabled = (id: number) => categoryAvailDone && categoryHasProducts[id] === false;
  const isSubcategoryDisabled = (id: number) => subcategoryAvailDone && subcategoryHasProducts[id] === false;

  const onSelectCategory = async (catId: number) => {
    if (categoryAvailDone && categoryHasProducts[catId] === false) return;
    setSelectedCategoryId(catId);
    setSelectedSubcategoryId(null);
    setProducts([]);
    await loadCategorySubs(catId);
    const desktopNow =
      typeof window !== 'undefined' && window.matchMedia(`(min-width: ${DESKTOP_MIN_PX}px)`).matches;
    if (!desktopNow) setStep('subcategories');
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
      setProducts(prods);
      const desktopNow =
        typeof window !== 'undefined' && window.matchMedia(`(min-width: ${DESKTOP_MIN_PX}px)`).matches;
      if (!desktopNow) setStep('products');
    } finally {
      setLoadingProducts(false);
    }
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen font-['Plus_Jakarta_Sans']">
      <header className="bg-white px-4 md:px-6 pt-10 pb-6 sticky top-0 z-40 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {!isDesktop && step !== 'categories' ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700 transition hover:bg-white"
                  aria-label="Orqaga"
                >
                  <ChevronLeft size={22} />
                </button>
              ) : null}
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50">
                  <Package size={18} className="text-orange-500" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-black text-gray-900 md:text-3xl">{headerTitle}</h1>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400 md:text-sm line-clamp-2">{headerSubtitle}</p>
                </div>
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 md:flex">
              <MapPin size={16} color="#fb7185" />
              <span className="text-xs font-bold text-gray-600">Yetkazib berish hududi</span>
              <ChevronRight size={16} color="#cbd5e1" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {isDesktop ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="rounded-[32px] border border-gray-100 bg-white/70 p-4 shadow-sm lg:block">
              <div className="mb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Kategoriyalar</h2>
                <p className="mt-1 text-xs font-bold text-gray-400">Birini tanlang</p>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((c) => {
                    const active = c.id === selectedCategoryId;
                    const disabled = isCategoryDisabled(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelectCategory(c.id)}
                        className={[
                          'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                          disabled ? 'cursor-not-allowed border-transparent bg-gray-50 opacity-45' : '',
                          !disabled && active ? 'border-orange-200 bg-orange-50' : '',
                          !disabled && !active ? 'border-transparent bg-white hover:border-gray-100 hover:bg-gray-50' : '',
                        ].join(' ')}
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                          {c.image ? <img src={c.image} alt={c.name} className="h-full w-full object-cover" /> : <Package size={16} className="text-orange-500" />}
                        </div>
                        <span className="min-w-0 flex-1 font-black text-sm text-gray-800">{c.name}</span>
                        <ChevronRight size={18} className={active ? 'flex-shrink-0 text-orange-500' : 'flex-shrink-0 text-gray-300'} />
                      </button>
                    );
                  })}
                </div>
              )}
              {!loading && categories.length === 0 ? (
                <div className="py-10 text-center text-sm font-bold text-gray-400">Kategoriya topilmadi</div>
              ) : null}
            </aside>

            <section className="flex flex-col gap-6">
              <div className="rounded-[32px] border border-gray-100 bg-white/70 p-4 shadow-sm md:p-6">
                <div className="mb-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Subkategoriyalar</h2>
                  <p className="mt-1 text-xs font-bold text-gray-400">
                    {selectedCategory ? `${selectedCategory.name} ostidagi bo‘limlar` : 'Tanlang'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subcategories.map((s) => {
                    const active = s.id === selectedSubcategoryId;
                    const disabled = isSubcategoryDisabled(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelectSubcategory(s.id)}
                        className={[
                          'rounded-2xl border px-4 py-2 text-xs font-black transition-all',
                          disabled ? 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400 opacity-70' : '',
                          !disabled && active ? 'border-orange-500 bg-orange-500 text-white' : '',
                          !disabled && !active ? 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-white' : '',
                        ].join(' ')}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                {subcategories.length === 0 && !loadingProducts && !loading ? (
                  <div className="py-6 text-sm font-bold text-gray-400">Hozircha subkategoriya yo‘q</div>
                ) : null}
                {loadingProducts && subcategories.length === 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-9 w-24 animate-pulse rounded-2xl bg-gray-100" />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[32px] border border-gray-100 bg-white/70 p-4 shadow-sm md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Mahsulotlar</h2>
                    <p className="mt-1 line-clamp-2 text-xs font-bold text-gray-400">
                      {selectedSubcategory ? selectedSubcategory.name : 'Subkategoriya tanlang'}
                    </p>
                  </div>
                  {loadingProducts ? <div className="shrink-0 text-xs font-bold text-gray-400">Yuklanmoqda...</div> : null}
                </div>
                {loadingProducts && products.length === 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                    {Array(9)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="h-72 animate-pulse rounded-[32px] border border-gray-100 bg-white" />
                      ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 xl:grid-cols-4">
                    {products.map((p) => (
                      <WebProductCard
                        key={p.id}
                        product={p}
                        onSelect={setSelectedProduct}
                        onAddToCart={addToCart}
                        onCartDelta={updateQuantity}
                        inCartQty={cartQtyByProductId.get(String(p.id)) ?? 0}
                      />
                    ))}
                  </div>
                )}
                {products.length === 0 && !loadingProducts ? (
                  <div className="py-10 text-center text-sm font-bold text-gray-400">Mahsulot topilmadi</div>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        {!isDesktop && step === 'categories' ? (
          <section className="rounded-[32px] border border-gray-100 bg-white/70 p-4 shadow-sm md:p-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((c) => {
                  const disabled = isCategoryDisabled(c.id);
                  return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectCategory(c.id)}
                    className={[
                      'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition',
                      disabled ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-45' : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/40',
                    ].join(' ')}
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                      {c.image ? <img src={c.image} alt={c.name} className="h-full w-full object-cover" /> : <Package size={18} className="text-orange-500" />}
                    </div>
                    <span className="min-w-0 flex-1 font-black text-sm text-gray-800">{c.name}</span>
                    <ChevronRight size={18} className="flex-shrink-0 text-gray-300" />
                  </button>
                );
                })}
              </div>
            )}
            {!loading && categories.length === 0 ? (
              <div className="py-10 text-center text-sm font-bold text-gray-400">Kategoriya topilmadi</div>
            ) : null}
          </section>
        ) : null}

        {!isDesktop && step === 'subcategories' ? (
          <section className="rounded-[32px] border border-gray-100 bg-white/70 p-4 shadow-sm md:p-6">
            {loadingProducts && subcategories.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {subcategories.map((s) => {
                  const disabled = isSubcategoryDisabled(s.id);
                  return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectSubcategory(s.id)}
                    className={[
                      'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition',
                      disabled ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-45' : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/40',
                    ].join(' ')}
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">
                      <Package size={18} className="text-orange-500" />
                    </div>
                    <span className="min-w-0 flex-1 font-black text-sm text-gray-800">{s.name}</span>
                    <ChevronRight size={18} className="flex-shrink-0 text-gray-300" />
                  </button>
                );
                })}
              </div>
            )}
            {subcategories.length === 0 && !loadingProducts ? (
              <div className="py-10 text-center text-sm font-bold text-gray-400">Hozircha subkategoriya yo‘q</div>
            ) : null}
          </section>
        ) : null}

        {!isDesktop && step === 'products' ? (
          <section className="rounded-[32px] border border-gray-100 bg-white/70 p-4 shadow-sm md:p-6">
            {loadingProducts ? (
              <div className="mb-3 flex justify-end">
                <span className="text-xs font-bold text-gray-400">Yuklanmoqda...</span>
              </div>
            ) : null}
            {loadingProducts && products.length === 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {Array(9)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-72 animate-pulse rounded-[32px] border border-gray-100 bg-white" />
                  ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
                {products.map((p) => (
                  <WebProductCard
                    key={p.id}
                    product={p}
                    onSelect={setSelectedProduct}
                    onAddToCart={addToCart}
                    onCartDelta={updateQuantity}
                    inCartQty={cartQtyByProductId.get(String(p.id)) ?? 0}
                  />
                ))}
              </div>
            )}
            {products.length === 0 && !loadingProducts ? (
              <div className="py-10 text-center text-sm font-bold text-gray-400">Mahsulot topilmadi</div>
            ) : null}
          </section>
        ) : null}
      </main>

      {selectedProduct ? (
        <WebProductDetailOverlay
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          onCartDelta={updateQuantity}
          inCartQty={cartQtyByProductId.get(String(selectedProduct.id)) ?? 0}
        />
      ) : null}
    </div>
  );
}

