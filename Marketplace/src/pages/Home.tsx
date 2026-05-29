import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { api, hasMarketplaceSession } from '../services/api';
import { useWebNotifications } from '../hooks/useWebNotifications';
import {
  Region,
  District,
  MFY,
  Address,
  ContragentBanner,
  ContragentBrowseItem,
  ActivityType,
  PartnerRequestPayload,
} from '../types';
import { cn } from '../lib/utils';
import { writeWebDelivery } from '../lib/webDeliverySelection';
import { contragentDeliversTo, deliverySelectionFromIds } from '../lib/deliveryFilter';
import { useWebCart } from '../hooks/useWebCart';
import {
  digitsOnly,
  normalizePartnerRequestPayload,
  sanitizePhoneInput,
  validatePartnerRequestPayload,
  PARTNER_FORM_INPUT_CLASS,
  PARTNER_FORM_SELECT_CLASS,
} from '../lib/partnerRequestForm';
import { PARTNER_REQUEST_SUCCESS_MSG, showUserMessage } from '../lib/userMessage';
import { useLocalShopsHoursMap } from '../hooks/useLocalShopsHoursMap';
import { LocalShopHoursStatus } from '../components/LocalShopHoursStatus';

const PARTNER_REQUEST_FLAG_KEY = 'marketplace_partner_request_sent_v1';

export function HomePage() {
  const navigate = useNavigate();
  
  // Region Selection State
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [mfys, setMfys] = useState<MFY[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedMFY, setSelectedMFY] = useState<MFY | null>(null);
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState(false);
  const [regionSelectorStep, setRegionSelectorStep] = useState<'region' | 'district' | 'mfy'>('region');

  const {
    cart,
    localCart,
    removeFromCart,
    updateQuantity,
    removeLocalFromCart,
    updateLocalQuantity,
    cartTotal,
    cartCount,
    localCartTotal,
    localCartCount,
  } = useWebCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTab, setCartTab] = useState<'bozor' | 'mahalla'>('bozor');
  const [shopPickerOpen, setShopPickerOpen] = useState(false);
  const [shopSubmitting, setShopSubmitting] = useState(false);
  const [selectedLocalShopId, setSelectedLocalShopId] = useState<number | null>(null);
  const { notificationsCount, setNotificationsInboxOpen } = useWebNotifications();
  const [banners, setBanners] = useState<Array<ContragentBanner & { activityType?: string }>>([]);
  const [activeBanner, setActiveBanner] = useState(0);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [hasPartnerRequest, setHasPartnerRequest] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerSubmitting, setPartnerSubmitting] = useState(false);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [partnerForm, setPartnerForm] = useState<PartnerRequestPayload>({
    company_name: '',
    inn: '',
    mfo: '',
    account_number: '',
    activity_type_id: 0,
    region_id: 0,
    district_id: 0,
    mfy_id: 0,
    phone: '',
  });
  const [partnerDistricts, setPartnerDistricts] = useState<District[]>([]);
  const [partnerMfys, setPartnerMfys] = useState<MFY[]>([]);

  useEffect(() => {
    loadRegions();
    loadAddresses();
    void (async () => {
      const [types, requests] = await Promise.all([api.activityTypes.list(), api.partnerRequests.list()]);
      setActivityTypes(types);
      if (types[0]) {
        setPartnerForm((prev) => ({ ...prev, activity_type_id: prev.activity_type_id || types[0].id }));
      }
      const hasLocal = typeof localStorage !== 'undefined' && localStorage.getItem(PARTNER_REQUEST_FLAG_KEY) === '1';
      setHasPartnerRequest(hasLocal || requests.length > 0);
    })();
  }, []);

  useEffect(() => {
    const loadBanners = async () => {
      const [bannerRows, contragentsRes] = await Promise.all([
        api.contragents.banners(),
        api.contragents.list({ limit: 100, include: 'categories' }),
      ]);
      const details = new Map<number, ContragentBrowseItem>(
        contragentsRes.items.map((row) => [Number(row.id), row])
      );
      const filtered = bannerRows
        .map((row) => {
          const c = details.get(Number(row.contragent_id));
          const categoryName = c?.category_branches?.[0]?.category?.name;
          const activityType = c?.activity_type_name || categoryName;
          return { ...row, activityType, detail: c };
        })
        .filter((row) => {
          if (!row.detail) return false;
          const sel = deliverySelectionFromIds(selectedRegion?.id, selectedDistrict?.id, selectedMFY?.id);
          return contragentDeliversTo(row.detail, sel);
        })
        .map(({ detail, ...rest }) => rest);
      setBanners(filtered);
      setActiveBanner(0);
    };
    void loadBanners();
  }, [selectedRegion?.id, selectedDistrict?.id, selectedMFY?.id]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    writeWebDelivery({
      region_id: selectedRegion?.id ?? null,
      district_id: selectedDistrict?.id ?? null,
      mfy_id: selectedMFY?.id ?? null,
    });
  }, [selectedRegion?.id, selectedDistrict?.id, selectedMFY?.id]);

  const loadAddresses = async () => {
    const res = await api.addresses.list();
    setUserAddresses(res);
    // Set default region/district/mfy from default address if exists
    const def = res.find(a => a.is_default);
    if (def) {
      const regionList = regions.length ? regions : await api.regions.getRegions();
      if (!regions.length) setRegions(regionList);
      const r = regionList.find(reg => reg.id === def.region_id);
      const districtList = await api.regions.getDistricts(def.region_id);
      setDistricts(districtList);
      const d = districtList.find(dis => dis.id === def.district_id);
      const mfyList = await api.regions.getMFYs(def.district_id);
      setMfys(mfyList);
      const m = mfyList.find(mfy => mfy.id === def.mfy_id);
      if (r) setSelectedRegion(r);
      if (d) setSelectedDistrict(d);
      if (m) setSelectedMFY(m);
    }
  };

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

  const openPartnerModal = async () => {
    const regionId = selectedRegion?.id ?? regions[0]?.id ?? 0;
    const districtList = regionId ? await api.regions.getDistricts(regionId) : [];
    const districtId = selectedDistrict?.id ?? districtList[0]?.id ?? 0;
    const mfyList = districtId ? await api.regions.getMFYs(districtId) : [];
    const mfyId = selectedMFY?.id ?? mfyList[0]?.id ?? 0;
    setPartnerDistricts(districtList);
    setPartnerMfys(mfyList);
    setPartnerForm((prev) => ({
      ...prev,
      region_id: regionId,
      district_id: districtId,
      mfy_id: mfyId,
      activity_type_id: prev.activity_type_id || activityTypes[0]?.id || 0,
      phone: prev.phone || '+998',
    }));
    setIsPartnerModalOpen(true);
  };

  const submitPartnerRequest = async () => {
    const normalized = normalizePartnerRequestPayload(partnerForm);
    const validationError = validatePartnerRequestPayload(normalized);
    if (validationError) {
      showUserMessage({ type: 'error', message: validationError });
      return;
    }
    setPartnerSubmitting(true);
    try {
      await api.partnerRequests.create(normalized);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PARTNER_REQUEST_FLAG_KEY, '1');
      }
      setHasPartnerRequest(true);
      setIsPartnerModalOpen(false);
      showUserMessage({ type: 'success', message: PARTNER_REQUEST_SUCCESS_MSG });
    } catch (e) {
      showUserMessage({
        type: 'error',
        message: e instanceof Error ? e.message : "So'rov yuborilmadi",
      });
    } finally {
      setPartnerSubmitting(false);
    }
  };

  const localShopOptions = Array.from(
    new Map(
      localCart
        .filter((it) => it.local_shop?.id != null)
        .map((it) => [Number(it.local_shop!.id), it.local_shop?.name || `Do'kon #${it.local_shop?.id}`])
    )
  ).map(([id, name]) => ({ id, name }));
  const localItemsFiltered =
    selectedLocalShopId == null
      ? localCart
      : localCart.filter((it) => Number(it.local_shop?.id ?? 0) === selectedLocalShopId);
  const localShops = Array.from(
    localCart.reduce(
      (acc, it) => {
        const id = Number(it.local_shop?.id ?? 0);
        if (!id) return acc;
        const prev = acc.get(id) ?? {
          id,
          name: it.local_shop?.name || `Do'kon #${id}`,
          phone: it.local_shop?.phone,
          itemCount: 0,
          total: 0,
        };
        prev.itemCount += it.quantity;
        prev.total += it.price * it.quantity;
        acc.set(id, prev);
        return acc;
      },
      new Map<number, { id: number; name: string; phone?: string; itemCount: number; total: number }>()
    ).values()
  );
  const localShopIds = localShops.map((s) => s.id);
  const { hoursByShopId } = useLocalShopsHoursMap(localShopIds, shopPickerOpen);

  return (
    <div className="pb-24 bg-gray-50 min-h-screen font-['Plus_Jakarta_Sans']">
      {/* Header */}
      <header className="sticky top-0 z-40 overflow-x-clip border-b border-gray-100 bg-white px-3 pb-3 pt-3 shadow-sm sm:px-4 sm:pb-4 sm:pt-4 md:px-6 md:pb-6 md:pt-10">
        <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3 lg:max-w-[280px] lg:flex-none lg:shrink-0">
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
                className="group flex min-h-[52px] w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-black text-gray-900 transition-all hover:border-orange-500 hover:bg-white hover:shadow-lg hover:shadow-orange-500/10 sm:min-h-[60px] sm:rounded-2xl sm:px-4 sm:py-2.5 lg:min-h-[64px] lg:rounded-xl lg:px-3 lg:py-2.5"
              >
                <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3 lg:gap-2">
                  <div className="mt-0 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 transition-colors group-hover:bg-orange-500 group-hover:text-white sm:h-9 sm:w-9 sm:rounded-xl lg:h-9 lg:w-9 lg:rounded-lg">
                    <MapPin className="h-4 w-4 shrink-0 sm:h-5 sm:w-5 lg:h-[18px] lg:w-[18px]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    {selectedRegion && selectedDistrict && selectedMFY ? (
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
                        <span className="line-clamp-1 break-words text-xs font-black leading-snug text-gray-900 sm:text-sm lg:text-[13px]">
                          {selectedDistrict?.name || 'Tuman tanlanmagan'}
                        </span>
                        <span className="line-clamp-1 break-words text-[10px] font-bold leading-snug text-gray-500 sm:text-xs lg:text-[11px]">
                          {selectedMFY?.name || 'MFY tanlanmagan'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-black text-gray-400">Hududni tanlang</span>
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
              onClick={async () => {
                if (!(await hasMarketplaceSession())) {
                  navigate('/login');
                  return;
                }
                setNotificationsInboxOpen(true);
              }}
              className="group relative h-10 w-10 flex-shrink-0 rounded-xl border border-orange-200 bg-orange-50 text-orange-500 shadow-sm transition-all hover:bg-orange-100 sm:h-12 sm:w-12 sm:rounded-2xl lg:hidden"
            >
              <Bell className="h-[18px] w-[18px] transition-transform group-hover:rotate-12 sm:h-[22px] sm:w-[22px]" />
              {notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {notificationsCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:gap-3 lg:min-w-0 lg:flex-1 lg:flex-nowrap">
            <button
              type="button"
              onClick={() => navigate('/search', { state: { focusSearch: true } })}
              className="relative flex h-11 min-w-0 flex-1 items-center rounded-xl border border-gray-200 bg-gray-50 py-0 pl-10 pr-3 text-left shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 sm:h-12 sm:rounded-2xl sm:pl-11 sm:pr-4 md:h-[52px] lg:min-w-[12rem] lg:flex-1 lg:max-w-none"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:left-4 sm:h-[18px] sm:w-[18px]" />
              <span className="truncate text-xs font-bold text-gray-400 sm:text-sm">Mahsulot qidirish...</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!(await hasMarketplaceSession())) {
                  navigate('/login');
                  return;
                }
                setNotificationsInboxOpen(true);
              }}
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
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600 sm:h-12 sm:w-12 sm:rounded-2xl md:h-[52px] md:w-[52px]"
              aria-label="Filtr"
            >
              <Filter className="h-[18px] w-[18px] md:h-5 md:w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="group relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg shadow-gray-200 transition-all hover:bg-orange-500 active:scale-95 sm:h-12 sm:w-12 sm:rounded-2xl md:h-[52px] md:w-[52px]"
            >
              <ShoppingCart className="h-[18px] w-[18px] group-hover:rotate-12 transition-transform md:h-5 md:w-5" />
              {cartCount + localCartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-orange-500 text-[9px] font-bold text-white shadow-sm sm:h-6 sm:w-6 sm:text-[11px]">
                  {cartCount + localCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Products preview (max 6, random set) */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {banners.length > 0 ? (
          <section className="mb-7">
            <div className="overflow-hidden rounded-3xl">
              <motion.div
                className="flex"
                animate={{ x: `-${activeBanner * 100}%` }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
              >
                {banners.map((b) => (
                  <div
                    key={b.id}
                    className="w-full min-w-full rounded-3xl border border-orange-100 bg-orange-50/50 p-4 md:p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-2xl border border-orange-100 bg-white">
                        {b.contragent_logo ? (
                          <img src={b.contragent_logo} alt={b.contragent_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-black text-orange-500">
                            {b.contragent_name.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-black text-gray-900 md:text-lg">{b.contragent_name}</p>
                        <p className="mt-1 truncate text-[11px] font-black uppercase tracking-wider text-orange-600">
                          {b.activityType || 'Faol kontragent'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          navigate('/search', {
                            state: { contragentId: b.contragent_id },
                          })
                        }
                        className="rounded-xl bg-orange-500 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
                      >
                        O&apos;tish
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
            {banners.length > 1 ? (
              <div className="mt-3 flex justify-center gap-1.5">
                {banners.map((b, idx) => (
                  <button
                    key={`dot-${b.id}`}
                    type="button"
                    aria-label={`banner-${idx + 1}`}
                    onClick={() => setActiveBanner(idx)}
                    className={cn('h-2 rounded-full transition-all', idx === activeBanner ? 'w-6 bg-orange-500' : 'w-2 bg-orange-200')}
                  />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
        <section className={cn('grid grid-cols-1 gap-4', hasPartnerRequest ? 'md:grid-cols-2' : 'md:grid-cols-3')}>
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-orange-500">Bozorda</p>
            <p className="mt-2 text-xl font-black text-gray-900">Yirik kontragent mahsulotlari</p>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              Bozor bo&apos;limidagi mahsulotlarni ko&apos;ring va filtrlab xarid qiling.
            </p>
            <button
              type="button"
              onClick={() => navigate('/search', { state: { marketTab: 'bozor' } })}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500"
            >
              O&apos;tish
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="relative rounded-3xl border border-orange-200 bg-orange-50/60 p-5 shadow-sm">
            <span className="absolute right-4 top-4 rounded-md bg-orange-500 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white">
              Tezkor
            </span>
            <p className="text-[11px] font-black uppercase tracking-widest text-orange-600">Maxallada</p>
            <p className="mt-2 text-xl font-black text-gray-900">Yaqin do&apos;kon mahsulotlari</p>
            <p className="mt-2 text-sm font-semibold text-gray-600">
              Hududingizga mos do&apos;konlardan tezkor mahsulotlarni toping.
            </p>
            <button
              type="button"
              onClick={() => navigate('/search', { state: { marketTab: 'mahalla' } })}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
            >
              O&apos;tish
              <ChevronRight size={16} />
            </button>
          </div>
          {!hasPartnerRequest ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Hamkorlik</p>
              <p className="mt-2 text-xl font-black text-gray-900">Hamkor bo&apos;lish uchun so&apos;rov</p>
              <p className="mt-2 text-sm font-semibold text-gray-600">
                Kompaniya ma&apos;lumotlarini yuboring va hamkorlik jarayonini boshlang.
              </p>
              <button
                type="button"
                onClick={() => void openPartnerModal()}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-700"
              >
                So&apos;rov yuborish
                <ChevronRight size={16} />
              </button>
            </div>
          ) : null}
        </section>
      </main>

      <AnimatePresence>
        {isPartnerModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
            onClick={() => setIsPartnerModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">Hamkorlik so&apos;rovi</h3>
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input className={PARTNER_FORM_INPUT_CLASS} placeholder="Kompaniya nomi" value={partnerForm.company_name} onChange={(e) => setPartnerForm((p) => ({ ...p, company_name: e.target.value }))} />
                <input className={PARTNER_FORM_INPUT_CLASS} inputMode="numeric" maxLength={9} placeholder="INN (9 raqam)" value={partnerForm.inn} onChange={(e) => setPartnerForm((p) => ({ ...p, inn: digitsOnly(e.target.value, 9) }))} />
                <input className={PARTNER_FORM_INPUT_CLASS} inputMode="numeric" maxLength={5} placeholder="MFO (5 raqam)" value={partnerForm.mfo} onChange={(e) => setPartnerForm((p) => ({ ...p, mfo: digitsOnly(e.target.value, 5) }))} />
                <input className={PARTNER_FORM_INPUT_CLASS} inputMode="numeric" maxLength={20} placeholder="Hisob raqam (20 raqam)" value={partnerForm.account_number} onChange={(e) => setPartnerForm((p) => ({ ...p, account_number: digitsOnly(e.target.value, 20) }))} />
                <select className={cn(PARTNER_FORM_SELECT_CLASS, 'sm:col-span-2')} value={partnerForm.activity_type_id} onChange={(e) => setPartnerForm((p) => ({ ...p, activity_type_id: Number(e.target.value) }))}>
                  {activityTypes.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
                <select className={PARTNER_FORM_SELECT_CLASS} value={partnerForm.region_id} onChange={async (e) => {
                  const regionId = Number(e.target.value);
                  const ds = await api.regions.getDistricts(regionId);
                  const districtId = ds[0]?.id ?? 0;
                  const ms = districtId ? await api.regions.getMFYs(districtId) : [];
                  setPartnerDistricts(ds);
                  setPartnerMfys(ms);
                  setPartnerForm((p) => ({ ...p, region_id: regionId, district_id: districtId, mfy_id: ms[0]?.id ?? 0 }));
                }}>
                  {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select className={PARTNER_FORM_SELECT_CLASS} value={partnerForm.district_id} onChange={async (e) => {
                  const districtId = Number(e.target.value);
                  const ms = await api.regions.getMFYs(districtId);
                  setPartnerMfys(ms);
                  setPartnerForm((p) => ({ ...p, district_id: districtId, mfy_id: ms[0]?.id ?? 0 }));
                }}>
                  {partnerDistricts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select className={cn(PARTNER_FORM_SELECT_CLASS, 'sm:col-span-2')} value={partnerForm.mfy_id} onChange={(e) => setPartnerForm((p) => ({ ...p, mfy_id: Number(e.target.value) }))}>
                  {partnerMfys.map((mfy) => <option key={mfy.id} value={mfy.id}>{mfy.name}</option>)}
                </select>
                <input className={cn(PARTNER_FORM_INPUT_CLASS, 'sm:col-span-2')} inputMode="tel" maxLength={13} placeholder="+998901234567" value={partnerForm.phone} onChange={(e) => setPartnerForm((p) => ({ ...p, phone: sanitizePhoneInput(e.target.value) }))} />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsPartnerModalOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600">Bekor</button>
                <button type="button" onClick={() => void submitPartnerRequest()} disabled={partnerSubmitting} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                  {partnerSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
                      {regions.find((r) => r.id === addr.region_id)?.name || `Viloyat #${addr.region_id}`},{' '}
                      {districts.find((d) => d.id === addr.district_id)?.name || `Tuman #${addr.district_id}`}
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
              <div className="px-6 pt-4">
                <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setCartTab('bozor')}
                    className={cn('flex-1 rounded-lg py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5', cartTab === 'bozor' ? 'bg-white text-gray-900' : 'text-gray-500')}
                  >
                    Bozor
                    {cartCount > 0 ? (
                      <span className="min-w-[18px] rounded-full bg-orange-500 px-1 text-[9px] font-black text-white text-center">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCartTab('mahalla')}
                    className={cn('flex-1 rounded-lg py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5', cartTab === 'mahalla' ? 'bg-white text-gray-900' : 'text-gray-500')}
                  >
                    Maxalla
                    {localCartCount > 0 ? (
                      <span className="min-w-[18px] rounded-full bg-orange-500 px-1 text-[9px] font-black text-white text-center">
                        {localCartCount > 99 ? '99+' : localCartCount}
                      </span>
                    ) : null}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {(cartTab === 'bozor' ? cart : localItemsFiltered).length === 0 ? (
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
                  (cartTab === 'bozor' ? cart : localItemsFiltered).map((item) => (
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
                            onClick={() => (cartTab === 'bozor' ? removeFromCart(item.id) : removeLocalFromCart(item.id))}
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
                              onClick={() => (cartTab === 'bozor' ? updateQuantity(item.id, -1) : updateLocalQuantity(item.id, -1))}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="text-sm font-bold text-gray-900 w-4 text-center">{item.quantity}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                const max = item.availableStock ?? Infinity;
                                if (item.quantity < max) {
                                  if (cartTab === 'bozor') updateQuantity(item.id, 1);
                                  else updateLocalQuantity(item.id, 1);
                                }
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

              {(cartTab === 'bozor' ? cart : localItemsFiltered).length > 0 && (
                <div className="p-8 bg-gray-50 rounded-t-[48px] space-y-6 shadow-[0_-20px_60px_rgba(0,0,0,0.08)] border-t border-white">
                  {cartTab === 'mahalla' && localShopOptions.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {localShopOptions.map((shop) => (
                        <button
                          key={shop.id}
                          type="button"
                          onClick={() => setSelectedLocalShopId(shop.id)}
                          className={cn(
                            'rounded-xl border px-3 py-1.5 text-[11px] font-bold',
                            selectedLocalShopId === shop.id
                              ? 'border-orange-400 bg-orange-50 text-orange-700'
                              : 'border-gray-200 bg-white text-gray-600'
                          )}
                        >
                          {shop.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-400 text-sm font-bold uppercase tracking-wider">
                      <span>
                        Mahsulotlar (
                        {cartTab === 'bozor'
                          ? cartCount
                          : localItemsFiltered.reduce((sum, it) => sum + it.quantity, 0)}
                        )
                      </span>
                      <span>
                        {(cartTab === 'bozor'
                          ? cartTotal
                          : localItemsFiltered.reduce((sum, it) => sum + it.price * it.quantity, 0)
                        ).toLocaleString()}{' '}
                        so'm
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-900 text-2xl font-black">
                      <span>Jami</span>
                      <span>
                        {(cartTab === 'bozor'
                          ? cartTotal
                          : localItemsFiltered.reduce((sum, it) => sum + it.price * it.quantity, 0)
                        ).toLocaleString()}{' '}
                        so'm
                      </span>
                    </div>
                  </div>
                  {cartTab === 'bozor' ? (
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
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShopPickerOpen(true);
                      }}
                      className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-orange-500 transition-all shadow-2xl shadow-gray-200 active:scale-[0.98] border-2 border-transparent hover:border-white/20"
                    >
                      Maxalla buyurtma berish
                      <ChevronRight size={22} />
                    </button>
                  )}
                </div>
              )}

              <AnimatePresence>
                {shopPickerOpen ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4"
                  >
                    <motion.div
                      initial={{ scale: 0.96, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.96, y: 10 }}
                      className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-2xl"
                    >
                      <h3 className="text-center text-base font-black text-gray-900">Do'konni tanlang</h3>
                      <p className="mt-1 text-center text-xs text-gray-500">
                        Buyurtmaga faqat tanlangan do‘kondagi mahsulotlar kiradi
                      </p>
                      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                        {localShops.map((shop) => (
                          <button
                            key={shop.id}
                            type="button"
                            onClick={() => setSelectedLocalShopId(shop.id)}
                            className={cn(
                              'w-full rounded-2xl border px-3 py-2 text-left',
                              selectedLocalShopId === shop.id
                                ? 'border-orange-400 bg-orange-50'
                                : 'border-gray-200 bg-gray-50'
                            )}
                          >
                            <p className="text-sm font-black text-gray-900">{shop.name}</p>
                            {shop.phone ? <p className="mt-0.5 text-xs text-gray-500">{shop.phone}</p> : null}
                            <p className="mt-1 text-[11px] font-semibold text-gray-600">
                              {shop.itemCount} dona · {shop.total.toLocaleString()} so'm
                            </p>
                            <div className="mt-2">
                              <LocalShopHoursStatus workingHours={hoursByShopId.get(shop.id)} compact />
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShopPickerOpen(false)}
                          className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 py-2.5 text-sm font-bold text-gray-700"
                        >
                          Bekor
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const shopId = selectedLocalShopId ?? localShopOptions[0]?.id;
                            if (!shopId) return;
                            setShopSubmitting(true);
                            void (async () => {
                              try {
                                const order = await api.localShopOrders.create({
                                  local_shop_id: shopId,
                                  address: { type: 'default' },
                                });
                                setShopPickerOpen(false);
                                setIsCartOpen(false);
                                navigate(`/orders/${order.id}?market=mahalla`);
                              } catch (e) {
                                if (typeof window !== 'undefined') {
                                  window.alert(e instanceof Error ? e.message : 'Buyurtma yuborilmadi');
                                }
                              } finally {
                                setShopSubmitting(false);
                              }
                            })();
                          }}
                          disabled={shopSubmitting || localShops.length === 0}
                          className={cn(
                            'flex-1 rounded-2xl bg-gray-900 py-2.5 text-sm font-black text-white',
                            (shopSubmitting || localShops.length === 0) && 'opacity-50'
                          )}
                        >
                          {shopSubmitting ? 'Yuborilmoqda...' : 'Buyurtma berish'}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
