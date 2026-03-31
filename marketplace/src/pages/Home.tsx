import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  ShoppingCart,
  MapPin,
  X,
  ChevronRight,
  Trash2,
  Plus,
  Minus,
  Bell,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Region, District, MFY, Address } from '../types';
import { cn, pickRandomSlice } from '../lib/utils';
import { MOCK_REGIONS, MOCK_DISTRICTS, MOCK_MFYS } from '../services/api';
import { useWebCart } from '../hooks/useWebCart';
import { WebProductCard } from '../components/WebProductCard';
import { WebProductDetailOverlay } from '../components/WebProductDetailOverlay';

const HOME_PREVIEW_COUNT = 6;

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [homePreviewSeed, setHomePreviewSeed] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Region Selection State
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [mfys, setMfys] = useState<MFY[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedMFY, setSelectedMFY] = useState<MFY | null>(null);
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState(false);
  const [regionSelectorStep, setRegionSelectorStep] = useState<'region' | 'district' | 'mfy'>('region');

  const { cart, addToCart, removeFromCart, updateQuantity, cartTotal, cartCount } = useWebCart();
  const cartQtyByProductId = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of cart) m.set(String(it.id), it.quantity);
    return m;
  }, [cart]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(3);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    loadProducts();
    loadRegions();
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    const res = await api.addresses.list();
    setUserAddresses(res);
    // Set default region/district/mfy from default address if exists
    const def = res.find(a => a.is_default);
    if (def) {
      const r = MOCK_REGIONS.find(reg => reg.id === def.region_id);
      const d = MOCK_DISTRICTS.find(dis => dis.id === def.district_id);
      const m = MOCK_MFYS.find(mfy => mfy.id === def.mfy_id);
      if (r) setSelectedRegion(r);
      if (d) setSelectedDistrict(d);
      if (m) setSelectedMFY(m);
    }
  };

  const loadProducts = async (q?: string) => {
    setLoading(true);
    const res = await api.products.list({ q, limit: q ? 50 : 100 });
    setProducts(res);
    setLoading(false);
  };

  useEffect(() => {
    setHomePreviewSeed((s) => s + 1);
  }, [location.pathname, location.key]);

  const homePreviewProducts = useMemo(
    () => pickRandomSlice(products, HOME_PREVIEW_COUNT),
    [products, homePreviewSeed]
  );

  const loadRegions = async () => {
    const res = await api.regions.getRegions();
    setRegions(res);
  };

  const handleRegionSelect = async (region: Region) => {
    setSelectedRegion(region);
    setSelectedDistrict(null);
    setSelectedMFY(null);
    const res = await api.regions.getDistricts(region.id);
    setDistricts(res);
    setRegionSelectorStep('district');
  };

  const handleDistrictSelect = async (district: District) => {
    setSelectedDistrict(district);
    setSelectedMFY(null);
    const res = await api.regions.getMFYs(district.id);
    setMfys(res);
    setRegionSelectorStep('mfy');
  };

  const handleMFYSelect = (mfy: MFY) => {
    setSelectedMFY(mfy);
    setIsRegionSelectorOpen(false);
  };

  const toggleDefaultAddress = async (id: string | number) => {
    await api.addresses.setDefault(id);
    loadAddresses();
  };

  const deleteAddress = async (id: string | number) => {
    await api.addresses.delete(id);
    loadAddresses();
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen font-['Plus_Jakarta_Sans']">
      {/* Header */}
      <header className="sticky top-0 z-40 overflow-x-clip border-b border-gray-100 bg-white px-4 pb-6 pt-10 shadow-sm md:px-6">
        <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex w-full min-w-0 items-center gap-3 lg:max-w-[280px] lg:flex-none lg:shrink-0">
            {/* Custom Region Selector */}
            <div className="relative min-w-0 flex-1">
              <button 
                onClick={() => {
                  setIsRegionSelectorOpen(!isRegionSelectorOpen);
                  setRegionSelectorStep('region');
                }}
                title={
                  selectedRegion
                    ? [
                        selectedRegion.name,
                        selectedDistrict?.name || 'Tuman tanlanmagan',
                        selectedMFY?.name || 'MFY tanlanmagan',
                      ].join(' · ')
                    : undefined
                }
                className="group flex min-h-[72px] w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-black text-gray-900 transition-all hover:border-orange-500 hover:bg-white hover:shadow-lg hover:shadow-orange-500/10 sm:px-5 lg:min-h-[64px] lg:rounded-xl lg:px-3 lg:py-2.5"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3 lg:gap-2">
                  <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition-colors group-hover:bg-orange-500 group-hover:text-white lg:mt-0 lg:h-9 lg:w-9 lg:rounded-lg">
                    <MapPin className="h-5 w-5 shrink-0 lg:h-[18px] lg:w-[18px]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    {selectedRegion ? (
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex min-w-0 flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                            {selectedRegion.name}
                          </span>
                          {userAddresses.some((a) => a.is_default && a.mfy_id === selectedMFY?.id) ? (
                            <span className="shrink-0 rounded bg-orange-500 px-1.5 py-0.5 text-[7px] font-black uppercase text-white">
                              Asosiy
                            </span>
                          ) : null}
                        </div>
                        <span className="break-words text-sm font-black leading-snug text-gray-900 lg:text-[13px]">
                          {selectedDistrict?.name || 'Tuman tanlanmagan'}
                        </span>
                        <span className="break-words text-xs font-bold leading-snug text-gray-500 lg:text-[11px]">
                          {selectedMFY?.name || 'MFY tanlanmagan'}
                        </span>
                      </div>
                    ) : (
                      <span className="font-black text-gray-400">Hududni tanlang</span>
                    )}
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    'ml-2 flex-shrink-0 text-gray-400 transition-transform group-hover:text-orange-500',
                    isRegionSelectorOpen ? 'rotate-90' : ''
                  )}
                  size={20}
                />
              </button>

              <AnimatePresence>
                {isRegionSelectorOpen && (
                  <>
                    {/* Backdrop for mobile */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsRegionSelectorOpen(false)}
                      className="fixed inset-0 bg-black/40 z-50 md:hidden"
                    />
                    {/* Selector Dropdown / Modal */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={cn(
                        "fixed inset-x-0 bottom-0 top-0 md:absolute md:inset-auto md:top-full md:left-0 md:right-0 md:mt-3 bg-white z-[60] overflow-hidden flex flex-col shadow-2xl border border-gray-100",
                        "md:rounded-[32px] md:max-h-[480px] md:w-[400px]",
                        "rounded-t-[40px]"
                      )}
                    >
                      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                          {regionSelectorStep !== 'region' && (
                            <button 
                              onClick={() => setRegionSelectorStep(regionSelectorStep === 'mfy' ? 'district' : 'region')}
                              className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all"
                            >
                              <ChevronLeft size={20} />
                            </button>
                          )}
                          <div>
                            <h3 className="font-black text-gray-900">
                              {regionSelectorStep === 'region' ? 'Viloyat' : 
                               regionSelectorStep === 'district' ? 'Tuman' : 'MFY'}
                            </h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tanlash kutilmoqda</p>
                          </div>
                        </div>
                        <button onClick={() => setIsRegionSelectorOpen(false)} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all">
                          <X size={20} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {regionSelectorStep === 'region' && regions.map(r => (
                          <button 
                            key={r.id} 
                            onClick={() => handleRegionSelect(r)}
                            className={cn(
                              "w-full text-left p-4 rounded-2xl font-bold transition-all flex items-center justify-between group border",
                              selectedRegion?.id === r.id ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-white border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-100"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {r.name}
                              {selectedRegion?.id === r.id && <span className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Asosiy</span>}
                            </div>
                            <ChevronRight size={18} className={cn("transition-all", selectedRegion?.id === r.id ? "text-orange-500" : "text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1")} />
                          </button>
                        ))}
                        {regionSelectorStep === 'district' && districts.map(d => (
                          <button 
                            key={d.id} 
                            onClick={() => handleDistrictSelect(d)}
                            className={cn(
                              "w-full text-left p-4 rounded-2xl font-bold transition-all flex items-center justify-between group border",
                              selectedDistrict?.id === d.id ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-white border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-100"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {d.name}
                              {selectedDistrict?.id === d.id && <span className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Asosiy</span>}
                            </div>
                            <ChevronRight size={18} className={cn("transition-all", selectedDistrict?.id === d.id ? "text-orange-500" : "text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1")} />
                          </button>
                        ))}
                        {regionSelectorStep === 'mfy' && mfys.map(m => (
                          <button 
                            key={m.id} 
                            onClick={() => handleMFYSelect(m)}
                            className={cn(
                              "w-full text-left p-4 rounded-2xl font-bold transition-all flex items-center justify-between group border",
                              selectedMFY?.id === m.id ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-white border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-100"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {m.name}
                              {selectedMFY?.id === m.id && <span className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Asosiy</span>}
                            </div>
                            <CheckCircle2 size={18} className={cn("transition-all", selectedMFY?.id === m.id ? "text-orange-500" : "text-gray-300 group-hover:text-orange-500")} />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              className="group relative h-12 w-12 flex-shrink-0 rounded-2xl border border-orange-200 bg-orange-50 text-orange-500 shadow-sm transition-all hover:bg-orange-100 lg:hidden"
            >
              <Bell size={22} className="group-hover:rotate-12 transition-transform" />
              {notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {notificationsCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex w-full min-w-0 flex-wrap items-center gap-3 lg:min-w-0 lg:flex-1 lg:flex-nowrap">
            <button
              type="button"
              onClick={() => navigate('/search', { state: { focusSearch: true } })}
              className="relative flex h-[52px] min-w-0 flex-1 items-center rounded-2xl border border-gray-200 bg-gray-50 py-0 pl-11 pr-4 text-left shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 lg:min-w-[12rem] lg:flex-1 lg:max-w-none"
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
              <span className="truncate text-sm font-bold text-gray-400">Mahsulot qidirish...</span>
            </button>
            <button
              type="button"
              className="group relative hidden h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-500 shadow-sm transition-all hover:bg-orange-100 lg:flex"
            >
              <Bell size={22} className="group-hover:rotate-12 transition-transform" />
              {notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white shadow-sm">
                  {notificationsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/search', { state: { openFilter: true } })}
              className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600"
              aria-label="Filtr"
            >
              <Filter size={20} />
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="group relative flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-lg shadow-gray-200 transition-all hover:bg-orange-500 active:scale-95"
            >
              <ShoppingCart size={20} className="group-hover:rotate-12 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Products preview (max 6, random set) */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-wrap justify-around gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-8">
          {loading
            ? Array(HOME_PREVIEW_COUNT)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="w-[240px] sm:w-[260px] md:w-[300px] flex-shrink-0">
                    <div className="h-80 animate-pulse rounded-[32px] border border-gray-100 bg-white" />
                  </div>
                ))
            : homePreviewProducts.map((product) => (
                <div key={product.id} className="w-[240px] sm:w-[260px] md:w-[300px] flex-shrink-0">
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
        {!loading && products.length > 0 ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-gray-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
            >
              Barchasini ko&apos;rish
              <ChevronRight size={18} />
            </button>
          </div>
        ) : null}
      </main>

      {/* Address Management Modal */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={() => setIsAddressModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Mening manzillarim</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Yetkazib berish uchun</p>
                </div>
                <button 
                  onClick={() => setIsAddressModalOpen(false)}
                  className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {userAddresses.map((addr) => (
                  <div 
                    key={addr.id}
                    className={cn(
                      "p-6 rounded-3xl border-2 transition-all cursor-pointer relative group",
                      addr.is_default ? "border-orange-500 bg-orange-50/30" : "border-gray-100 bg-white hover:border-gray-200"
                    )}
                    onClick={() => toggleDefaultAddress(addr.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          addr.is_default ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"
                        )}>
                          <MapPin size={20} />
                        </div>
                        {addr.is_default && (
                          <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Asosiy</span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="font-bold text-gray-900 text-lg mb-1">{addr.description}</p>
                    <p className="text-sm text-gray-500 font-medium">
                      {MOCK_REGIONS.find(r => r.id === addr.region_id)?.name}, {MOCK_DISTRICTS.find(d => d.id === addr.district_id)?.name}
                    </p>
                  </div>
                ))}

                <button className="w-full py-6 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-all group">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <Plus size={24} />
                  </div>
                  <span className="font-black text-sm uppercase tracking-widest">Yangi manzil qo'shish</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedProduct ? (
        <WebProductDetailOverlay
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          onCartDelta={updateQuantity}
          inCartQty={cartQtyByProductId.get(String(selectedProduct.id)) ?? 0}
        />
      ) : null}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-end"
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Savat</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                      <ShoppingCart size={48} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Savatingiz bo'sh</h3>
                      <p className="text-gray-400 text-sm mt-1">Hali hech narsa qo'shmadingiz</p>
                    </div>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.cartLineId != null ? `line-${item.cartLineId}` : item.id}
                      className="flex gap-4 group"
                    >
                      <div className="w-24 h-24 bg-gray-50 rounded-[24px] overflow-hidden flex-shrink-0 border border-gray-100">
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-gray-900 line-clamp-1 text-base">{item.name}</h4>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-orange-500 font-black text-base">
                            {(item.price * item.quantity).toLocaleString()} <span className="text-[10px]">so'm</span>
                          </p>
                          <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-3 border border-gray-100">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="text-sm font-bold text-gray-900 w-4 text-center">{item.quantity}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                const max = item.availableStock ?? Infinity;
                                if (item.quantity < max) updateQuantity(item.id, 1);
                              }}
                              disabled={item.quantity >= (item.availableStock ?? Infinity)}
                              className={cn(
                                'w-8 h-8 flex items-center justify-center rounded-lg transition-all',
                                item.quantity >= (item.availableStock ?? Infinity)
                                  ? 'cursor-not-allowed text-gray-200'
                                  : 'text-gray-400 hover:bg-white hover:text-gray-900'
                              )}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 bg-gray-50 rounded-t-[48px] space-y-6 shadow-[0_-20px_60px_rgba(0,0,0,0.08)] border-t border-white">
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-400 text-sm font-bold uppercase tracking-wider">
                      <span>Mahsulotlar ({cartCount})</span>
                      <span>{cartTotal.toLocaleString()} so'm</span>
                    </div>
                    <div className="flex justify-between text-gray-900 text-2xl font-black">
                      <span>Jami</span>
                      <span>{cartTotal.toLocaleString()} so'm</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (cart.length === 0) return;
                      setIsCartOpen(false);
                      navigate('/checkout');
                    }}
                    className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-orange-500 transition-all shadow-2xl shadow-gray-200 active:scale-[0.98] border-2 border-transparent hover:border-white/20"
                  >
                    Buyurtma berish
                    <ChevronRight size={22} />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
