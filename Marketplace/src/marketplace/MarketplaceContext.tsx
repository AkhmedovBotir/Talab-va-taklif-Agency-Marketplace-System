import React, { createContext, useContext, useCallback, useEffect, useRef, useState, ReactNode } from 'react';
import { Alert, AppState, AppStateStatus, Platform, Text, useWindowDimensions } from 'react-native';
import { Dimensions } from 'react-native';
import {
  api,
  parsePositiveProductId,
  requestAuthLogin,
  hasMarketplaceSession,
  getMarketplaceToken,
  buildMarketplaceNotificationsWsUrl,
  subscribeMarketplaceSession,
} from '../services/api';
import { takePendingCartProduct } from '../lib/pendingMarketplaceCart';
import { Product, Region, District, MFY, Address, LocalShopCartItem, MarketplaceNotification } from '../types';
import { deliverySelectionFromIds, filterProductsForDelivery } from '../lib/deliveryFilter';
import { writeWebDelivery } from '../lib/webDeliverySelection';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Yetkazish uchun viloyat → tuman → MFY zanjiri mos kelishi kerak. */
export function isValidDeliveryTriple(
  region: Region | null,
  district: District | null,
  mfy: MFY | null
): boolean {
  if (!region || !district || !mfy) return false;
  return district.region_id === region.id && mfy.district_id === district.id;
}

export interface CartItem extends Omit<Product, 'quantity'> {
  quantity: number;
  /** Ombordagi mavjud miqdor (GET cart `product.quantity`) */
  availableStock: number;
  /** Korzinka qatori id — `PUT/DELETE .../cart/items/{id}` */
  cartLineId?: number;
}

export type ListNav = 'home' | 'products';

export interface MarketplaceContextValue {
  listNav: ListNav;
  setListNav: (v: ListNav) => void;
  onLogout: () => void;
  windowWidth: number;
  windowHeight: number;
  products: Product[];
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  regions: Region[];
  districts: District[];
  mfys: MFY[];
  selectedRegion: Region | null;
  selectedDistrict: District | null;
  selectedMFY: MFY | null;
  /** Yetkazish uchun viloyat, tuman va MFY to'liq tanlangan. */
  hasCompleteDeliveryLocation: boolean;
  setSelectedRegion: (r: Region | null) => void;
  setSelectedDistrict: (d: District | null) => void;
  setSelectedMFY: (m: MFY | null) => void;
  isRegionSelectorOpen: boolean;
  setIsRegionSelectorOpen: (o: boolean) => void;
  regionSelectorStep: 'region' | 'district' | 'mfy';
  setRegionSelectorStep: (s: 'region' | 'district' | 'mfy') => void;
  cart: CartItem[];
  localCart: LocalShopCartItem[];
  notificationsCount: number;
  notificationsInboxOpen: boolean;
  setNotificationsInboxOpen: (open: boolean) => void;
  refreshNotificationsUnread: () => Promise<void>;
  activeImageIndex: number;
  setActiveImageIndex: (index: number) => void;
  userAddresses: Address[];
  loadAddresses: () => Promise<void>;
  addUserAddress: (payload: {
    name: string;
    region_id: number;
    district_id: number;
    mfy_id: number;
    is_default?: boolean;
  }) => Promise<void>;
  updateUserAddress: (
    id: string | number,
    payload: { name: string; region_id: number; district_id: number; mfy_id: number; is_default?: boolean }
  ) => Promise<void>;
  deleteUserAddress: (id: string | number) => Promise<void>;
  setDefaultUserAddress: (id: string | number) => Promise<void>;
  applyUserAddress: (address: Address) => Promise<boolean>;
  restoreDeliverySelection: (snapshot: {
    region: Region | null;
    district: District | null;
    mfy: MFY | null;
  }) => Promise<void>;
  clearDeliverySelection: () => void;
  loadProducts: (q?: string) => Promise<void>;
  /** Mobil: pastga tortib yangilash — mahsulotlar, savat, viloyatlar, manzillar */
  refreshHomeScreen: () => Promise<void>;
  /** Savatni serverdan qayta yuklash */
  refreshCart: () => Promise<void>;
  refreshLocalCart: () => Promise<void>;
  handleRegionSelect: (region: Region) => Promise<void>;
  handleDistrictSelect: (district: District) => Promise<void>;
  handleMFYSelect: (mfy: MFY) => void;
  goPrevImage: () => void;
  goNextImage: () => void;
  addToCart: (product: Product) => void;
  addLocalToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  removeLocalFromCart: (productId: string) => void;
  clearCart: () => void;
  clearLocalCart: () => void;
  updateQuantity: (productId: string, delta: number) => void;
  updateLocalQuantity: (productId: string, delta: number) => void;
  cartTotal: number;
  cartCount: number;
  localCartTotal: number;
  localCartCount: number;
  isTabletUpWeb: boolean;
  containerMaxWidth: number;
  contentWidth: number;
  columns: number;
  cardGap: number;
  cardWidth: number;
  isSmallWeb: boolean;
  resolvedCardWidth: number;
  productModalWidth: number;
  regionModalWidth: number;
  regionModalHeight: number;
  renderDescription: (description: string) => string;
  renderDescriptionDelta: (description: string) => React.ReactNode;
  SCREEN_HEIGHT: number;
  SCREEN_WIDTH: number;
}

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

export function MarketplaceProvider({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [listNav, setListNav] = useState<ListNav>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [mfys, setMfys] = useState<MFY[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedMFY, setSelectedMFY] = useState<MFY | null>(null);
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState(false);
  const [regionSelectorStep, setRegionSelectorStep] = useState<'region' | 'district' | 'mfy'>('region');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [localCart, setLocalCart] = useState<LocalShopCartItem[]>([]);
  const cartRef = useRef<CartItem[]>([]);
  const localCartRef = useRef<LocalShopCartItem[]>([]);
  cartRef.current = cart;
  localCartRef.current = localCart;
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notificationsInboxOpen, setNotificationsInboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const refreshNotificationsUnread = useCallback(async () => {
    if (!(await hasMarketplaceSession())) {
      setNotificationsCount(0);
      return;
    }
    try {
      const n = await api.notifications.unreadCount();
      setNotificationsCount(Number.isFinite(n) && n >= 0 ? n : 0);
    } catch {
      setNotificationsCount(0);
    }
  }, []);

  useEffect(() => {
    void refreshNotificationsUnread();
  }, [refreshNotificationsUnread]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void refreshNotificationsUnread();
    });
    return () => sub.remove();
  }, [refreshNotificationsUnread]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const attachHandlers = (socket: WebSocket) => {
      socket.onmessage = (ev) => {
        const raw = typeof ev.data === 'string' ? ev.data : '';
        let n: MarketplaceNotification | null = null;
        try {
          const msg = JSON.parse(raw) as Record<string, unknown>;
          const event = String(msg?.event ?? msg?.type ?? '');
          if (event !== 'integration_notification_created') return;
          const row = (msg?.data ?? msg?.payload ?? msg?.notification) as Record<string, unknown> | undefined;
          if (!row || typeof row !== 'object') return;
          const targetType = String((row as { target_type?: string }).target_type ?? '').toLowerCase();
          if (targetType !== 'all' && targetType !== 'marketplace') return;
          n = {
            id: (row as { id?: string | number }).id ?? '',
            title: String((row as { title?: string }).title ?? ''),
            message: String((row as { message?: string }).message ?? ''),
            type: String((row as { type?: string }).type ?? 'info'),
            target_type: String((row as { target_type?: string }).target_type ?? ''),
            is_read: !!(row as { is_read?: boolean }).is_read,
            read_at: (row as { read_at?: string | null }).read_at != null ? String((row as { read_at?: string }).read_at) : null,
            created_at: String((row as { created_at?: string }).created_at ?? ''),
            updated_at: String((row as { updated_at?: string }).updated_at ?? ''),
          };
        } catch {
          return;
        }
        if (!n) return;
        setNotificationsCount((c) => (n!.is_read ? c : c + 1));
      };
      socket.onclose = () => {
        ws = null;
        if (cancelled) return;
        retryTimer = setTimeout(() => void tryConnect(), 5000);
      };
      socket.onerror = () => {
        try {
          socket.close();
        } catch {
          /* ignore */
        }
      };
    };

    const tryConnect = async () => {
      if (cancelled) return;
      if (ws && ws.readyState === WebSocket.OPEN) return;
      if (ws) {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
        ws = null;
      }
      if (!(await hasMarketplaceSession())) return;
      const token = await getMarketplaceToken();
      if (!token || cancelled) return;
      try {
        const url = buildMarketplaceNotificationsWsUrl(token);
        const socket = new WebSocket(url);
        ws = socket;
        attachHandlers(socket);
      } catch {
        ws = null;
      }
    };

    void tryConnect();
    const poll = setInterval(() => {
      if (cancelled) return;
      if (ws && ws.readyState === WebSocket.OPEN) return;
      void tryConnect();
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      if (retryTimer) clearTimeout(retryTimer);
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const maybeTriggerAuth = (error: unknown) => {
    const msg = error instanceof Error ? error.message : '';
    if (/kirish kerak|token/i.test(msg)) requestAuthLogin();
  };

  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    void (async () => {
      await loadRegions();
      await loadAddresses();
      await loadProducts();
      await loadCart();
      await loadLocalCart();
    })();
  }, []);

  const deliveryLocationKey = `${selectedRegion?.id ?? ''}-${selectedDistrict?.id ?? ''}-${selectedMFY?.id ?? ''}`;
  useEffect(() => {
    void loadProducts(searchRef.current.trim() || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- manzil o‘zgarganda mahsulotlarni qayta filtrlash
  }, [deliveryLocationKey]);

  const clearGuestDeliverySelection = () => {
    setUserAddresses([]);
    setSelectedRegion(null);
    setSelectedDistrict(null);
    setSelectedMFY(null);
    setDistricts([]);
    setMfys([]);
    setIsRegionSelectorOpen(false);
    setRegionSelectorStep('region');
  };

  const loadCart = async () => {
    if (!(await hasMarketplaceSession())) {
      setCart([]);
      return;
    }
    try {
      const rows = await api.cart.get();
      setCart(rows);

      const pending = await takePendingCartProduct();
      const pid = pending ? parsePositiveProductId(pending.id) : null;
      if (pid != null) {
        const next =
          pending?.kind === 'local'
            ? await api.localShopCart.addItem(pid, 1)
            : await api.cart.addItem(pid, 1);
        if (pending?.kind === 'local') setLocalCart(next);
        else setCart(next);
      }
    } catch {
      setCart([]);
    }
  };

  const loadLocalCart = async () => {
    if (!(await hasMarketplaceSession())) {
      setLocalCart([]);
      return;
    }
    try {
      const rows = await api.localShopCart.get();
      setLocalCart(rows);
    } catch {
      setLocalCart([]);
    }
  };

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedProduct?.id]);

  useEffect(() => {
    if (!selectedProduct || selectedProduct.images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % selectedProduct.images.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [selectedProduct]);

  const loadAddresses = async () => {
    if (!(await hasMarketplaceSession())) {
      clearGuestDeliverySelection();
      return;
    }
    try {
      const res = await api.addresses.list();
      setUserAddresses(res);
      const def = res.find((a) => a.is_default);
      if (def) {
        await applyUserAddress(def);
      } else {
        clearDeliverySelection();
      }
    } catch {
      setUserAddresses([]);
      clearDeliverySelection();
    }
  };

  const applyUserAddress = async (address: Address): Promise<boolean> => {
    const regionList = regions.length ? regions : await api.regions.getRegions();
    if (!regions.length && regionList.length) setRegions(regionList);
    const region = regionList.find((r) => r.id === address.region_id) || null;

    const ds = await api.regions.getDistricts(address.region_id);
    const district = ds.find((d) => d.id === address.district_id) || null;

    const ms = await api.regions.getMFYs(address.district_id);
    const mfy = ms.find((mf) => mf.id === address.mfy_id) || null;

    if (!region || !district || !mfy || !isValidDeliveryTriple(region, district, mfy)) {
      clearDeliverySelection();
      return false;
    }

    setSelectedRegion(region);
    setDistricts(ds);
    setSelectedDistrict(district);
    setMfys(ms);
    setSelectedMFY(mfy);
    setRegionSelectorStep('region');
    if (Platform.OS === 'web') {
      writeWebDelivery({ region_id: region.id, district_id: district.id, mfy_id: mfy.id });
    }
    return true;
  };

  const addUserAddress: MarketplaceContextValue['addUserAddress'] = async (payload) => {
    await api.addresses.add(payload);
    await loadAddresses();
  };

  const updateUserAddress: MarketplaceContextValue['updateUserAddress'] = async (id, payload) => {
    await api.addresses.update(id, payload);
    await loadAddresses();
  };

  const deleteUserAddress: MarketplaceContextValue['deleteUserAddress'] = async (id) => {
    await api.addresses.delete(id);
    await loadAddresses();
  };

  const setDefaultUserAddress: MarketplaceContextValue['setDefaultUserAddress'] = async (id) => {
    await api.addresses.setDefault(id);
    await loadAddresses();
  };

  const loadProducts = async (q?: string) => {
    setLoading(true);
    try {
      const res = await api.products.list({ q, limit: q ? 50 : 100 });
      const sel = deliverySelectionFromIds(selectedRegion?.id, selectedDistrict?.id, selectedMFY?.id);
      setProducts(filterProductsForDelivery(res, sel));
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async () => {
    const res = await api.regions.getRegions();
    setRegions(res);
  };

  const refreshCart = useCallback(async () => {
    if (!(await hasMarketplaceSession())) {
      setCart([]);
      return;
    }
    try {
      const rows = await api.cart.get();
      setCart(rows);

      const pending = await takePendingCartProduct();
      const pid = pending ? parsePositiveProductId(pending.id) : null;
      if (pid != null) {
        const next =
          pending?.kind === 'local'
            ? await api.localShopCart.addItem(pid, 1)
            : await api.cart.addItem(pid, 1);
        if (pending?.kind === 'local') setLocalCart(next);
        else setCart(next);
      }
    } catch {
      setCart([]);
    }
  }, []);

  const refreshLocalCart = useCallback(async () => {
    if (!(await hasMarketplaceSession())) {
      setLocalCart([]);
      return;
    }
    try {
      const rows = await api.localShopCart.get();
      setLocalCart(rows);
    } catch {
      setLocalCart([]);
    }
  }, []);

  useEffect(() => {
    return subscribeMarketplaceSession(() => {
      void refreshCart();
      void refreshLocalCart();
    });
  }, [refreshCart, refreshLocalCart]);

  const loadAddressesRef = useRef(loadAddresses);
  const loadRegionsRef = useRef(loadRegions);
  loadAddressesRef.current = loadAddresses;
  loadRegionsRef.current = loadRegions;

  const refreshHomeScreen = useCallback(async () => {
    const q = searchRef.current.trim();
    setLoading(true);
    try {
      const res = await api.products.list({ q: q || undefined, limit: q ? 50 : 100 });
      const sel = deliverySelectionFromIds(selectedRegion?.id, selectedDistrict?.id, selectedMFY?.id);
      setProducts(filterProductsForDelivery(res, sel));
    } finally {
      setLoading(false);
    }
    await Promise.all([refreshCart(), refreshLocalCart(), loadRegionsRef.current()]);
    await loadAddressesRef.current();
    await refreshNotificationsUnread();
  }, [
    refreshCart,
    refreshLocalCart,
    refreshNotificationsUnread,
    selectedRegion?.id,
    selectedDistrict?.id,
    selectedMFY?.id,
  ]);

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
    setRegionSelectorStep('region');
    if (Platform.OS === 'web' && selectedDistrict && selectedRegion) {
      writeWebDelivery({
        region_id: selectedRegion.id,
        district_id: selectedDistrict.id,
        mfy_id: mfy.id,
      });
    }
  };

  const clearDeliverySelection = () => {
    setSelectedRegion(null);
    setSelectedDistrict(null);
    setSelectedMFY(null);
    setDistricts([]);
    setMfys([]);
    if (Platform.OS === 'web') {
      writeWebDelivery({ region_id: null, district_id: null, mfy_id: null });
    }
  };

  const restoreDeliverySelection: MarketplaceContextValue['restoreDeliverySelection'] = async (snapshot) => {
    if (!snapshot.region) {
      clearDeliverySelection();
      return;
    }
    const ds = await api.regions.getDistricts(snapshot.region.id);
    const district = snapshot.district ? ds.find((d) => d.id === snapshot.district!.id) ?? null : null;
    if (!district) {
      clearDeliverySelection();
      return;
    }
    const ms = await api.regions.getMFYs(district.id);
    const mfy = snapshot.mfy ? ms.find((mf) => mf.id === snapshot.mfy!.id) ?? null : null;
    if (!isValidDeliveryTriple(snapshot.region, district, mfy)) {
      clearDeliverySelection();
      return;
    }
    setSelectedRegion(snapshot.region);
    setDistricts(ds);
    setSelectedDistrict(district);
    setMfys(ms);
    setSelectedMFY(mfy);
  };

  const hasCompleteDeliveryLocation = isValidDeliveryTriple(selectedRegion, selectedDistrict, selectedMFY);

  const goPrevImage = () => {
    if (!selectedProduct || selectedProduct.images.length <= 1) return;
    setActiveImageIndex(
      (prev) => (prev - 1 + selectedProduct.images.length) % selectedProduct.images.length
    );
  };

  const goNextImage = () => {
    if (!selectedProduct || selectedProduct.images.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % selectedProduct.images.length);
  };

  const addToCart = (product: Product) => {
    void (async () => {
      try {
        if (!(await hasMarketplaceSession())) {
          requestAuthLogin();
          return;
        }
        if ((Number(product.quantity) || 0) <= 0) {
          Alert.alert('Mahsulot', 'Omborda mavjud emas.');
          return;
        }
        const pid = parsePositiveProductId(product.id);
        if (pid == null) {
          Alert.alert('Mahsulot', 'Mahsulot identifikatori noto‘g‘ri.');
          return;
        }
        const next = await api.cart.addItem(pid, 1);
        setCart(next);
      } catch (e) {
        maybeTriggerAuth(e);
        const msg = e instanceof Error ? e.message : "Savatga qo'shib bo'lmadi";
        Alert.alert('Savat', msg);
      }
    })();
  };

  const removeFromCart = (productId: string) => {
    void (async () => {
      try {
        const line = cartRef.current.find((item) => String(item.id) === String(productId));
        if (line?.cartLineId == null) {
          Alert.alert('Savat', "Qator topilmadi — sahifani yangilab ko'ring.");
          return;
        }
        const next = await api.cart.removeLine(line.cartLineId);
        setCart(next);
      } catch (e) {
        maybeTriggerAuth(e);
        Alert.alert('Savat', e instanceof Error ? e.message : "O'chirib bo'lmadi");
      }
    })();
  };

  const addLocalToCart = (product: Product) => {
    void (async () => {
      try {
        if (!(await hasMarketplaceSession())) {
          requestAuthLogin();
          return;
        }
        if ((Number(product.quantity) || 0) <= 0) {
          Alert.alert('Mahsulot', 'Omborda mavjud emas.');
          return;
        }
        const pid = parsePositiveProductId(product.id);
        if (pid == null) {
          Alert.alert('Mahsulot', 'Mahsulot identifikatori noto‘g‘ri.');
          return;
        }
        const next = await api.localShopCart.addItem(pid, 1);
        setLocalCart(next);
      } catch (e) {
        maybeTriggerAuth(e);
        const msg = e instanceof Error ? e.message : "Mahalla savatiga qo'shib bo'lmadi";
        Alert.alert('Savat', msg);
      }
    })();
  };

  const removeLocalFromCart = (productId: string) => {
    void (async () => {
      try {
        const line = localCartRef.current.find((item) => String(item.id) === String(productId));
        if (line?.cartLineId == null) {
          Alert.alert('Savat', "Mahalla savat qatori topilmadi.");
          return;
        }
        const next = await api.localShopCart.removeLine(line.cartLineId);
        setLocalCart(next);
      } catch (e) {
        maybeTriggerAuth(e);
        Alert.alert('Savat', e instanceof Error ? e.message : "O'chirib bo'lmadi");
      }
    })();
  };

  const clearCart = () => {
    void (async () => {
      try {
        const next = await api.cart.clear();
        setCart(next);
      } catch (e) {
        maybeTriggerAuth(e);
        setCart([]);
      }
    })();
  };

  const clearLocalCart = () => {
    void (async () => {
      try {
        const next = await api.localShopCart.clear();
        setLocalCart(next);
      } catch (e) {
        maybeTriggerAuth(e);
        setLocalCart([]);
      }
    })();
  };

  const updateQuantity = (productId: string, delta: number) => {
    void (async () => {
      try {
        const line = cartRef.current.find((item) => String(item.id) === String(productId));
        if (line?.cartLineId == null) {
          Alert.alert('Savat', "Qator topilmadi — sahifani yangilab ko'ring.");
          return;
        }
        const newQty = line.quantity + delta;
        if (newQty < 1) {
          const next = await api.cart.removeLine(line.cartLineId);
          setCart(next);
          return;
        }
        const next = await api.cart.setLineQuantity(line.cartLineId, newQty);
        setCart(next);
      } catch (e) {
        maybeTriggerAuth(e);
        Alert.alert('Savat', e instanceof Error ? e.message : 'Miqdorni yangilab bo‘lmadi');
      }
    })();
  };

  const updateLocalQuantity = (productId: string, delta: number) => {
    void (async () => {
      try {
        const line = localCartRef.current.find((item) => String(item.id) === String(productId));
        if (line?.cartLineId == null) {
          Alert.alert('Savat', "Mahalla savat qatori topilmadi.");
          return;
        }
        const newQty = line.quantity + delta;
        if (newQty < 1) {
          const next = await api.localShopCart.removeLine(line.cartLineId);
          setLocalCart(next);
          return;
        }
        const next = await api.localShopCart.setLineQuantity(line.cartLineId, newQty);
        setLocalCart(next);
      } catch (e) {
        maybeTriggerAuth(e);
        Alert.alert('Savat', e instanceof Error ? e.message : 'Miqdorni yangilab bo‘lmadi');
      }
    })();
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const localCartTotal = localCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const localCartCount = localCart.reduce((sum, item) => sum + item.quantity, 0);
  const isTabletUpWeb = Platform.OS === 'web' && windowWidth >= 768;
  const containerMaxWidth = 1280;
  const contentWidth = isTabletUpWeb ? Math.min(windowWidth, containerMaxWidth) : windowWidth;
  const columns = Platform.OS === 'web'
    ? windowWidth >= 1280
      ? 5
      : windowWidth >= 1024
        ? 4
        : windowWidth >= 768
          ? 3
          : 2
    : 2;
  const cardGap = Platform.OS === 'web' && windowWidth < 768 ? 12 : 16;
  const horizontalPadding = 16;
  const cardWidth = Math.floor((contentWidth - horizontalPadding * 2 - cardGap * (columns - 1)) / columns);
  const isSmallWeb = Platform.OS === 'web' && windowWidth < 768;
  const resolvedCardWidth = isSmallWeb
    ? Math.floor((contentWidth - horizontalPadding * 2 - 12) / 2)
    : cardWidth;
  const productModalWidth = Math.min(contentWidth - 24, 960);
  const regionModalWidth = isTabletUpWeb ? Math.min(contentWidth - 32, 840) : windowWidth;
  const regionModalHeight = Math.round(windowHeight * (isTabletUpWeb ? 0.82 : 0.8));

  const renderDescription = (description: string) => {
    try {
      const parsed = JSON.parse(description);
      if (!parsed?.ops || !Array.isArray(parsed.ops)) return description;
      return parsed.ops
        .map((op: { insert?: string }) => (typeof op?.insert === 'string' ? op.insert : ''))
        .join('')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } catch {
      return description;
    }
  };

  const renderDescriptionDelta = (description: string) => {
    try {
      const parsed = JSON.parse(description);
      if (!parsed?.ops || !Array.isArray(parsed.ops)) return description;
      const ops = parsed.ops as Array<{ insert?: string; attributes?: { bold?: boolean; italic?: boolean } }>;
      const nodes: React.ReactNode[] = [];
      let key = 0;
      for (const op of ops) {
        if (typeof op?.insert !== 'string') continue;
        const text = op.insert.replace(/\n{3,}/g, '\n\n');
        const bold = !!op.attributes?.bold;
        const italic = !!op.attributes?.italic;
        if (!bold && !italic) {
          nodes.push(text);
        } else {
          nodes.push(
            <Text key={`d_${key++}`} style={{ fontWeight: bold ? '800' : '400', fontStyle: italic ? 'italic' : 'normal' }}>
              {text}
            </Text>
          );
        }
      }
      return nodes;
    } catch {
      return description;
    }
  };

  const value: MarketplaceContextValue = {
    listNav,
    setListNav,
    onLogout,
    windowWidth,
    windowHeight,
    products,
    loading,
    search,
    setSearch,
    selectedProduct,
    setSelectedProduct,
    regions,
    districts,
    mfys,
    selectedRegion,
    selectedDistrict,
    selectedMFY,
    hasCompleteDeliveryLocation,
    setSelectedRegion,
    setSelectedDistrict,
    setSelectedMFY,
    isRegionSelectorOpen,
    setIsRegionSelectorOpen,
    regionSelectorStep,
    setRegionSelectorStep,
    cart,
    localCart,
    notificationsCount,
    notificationsInboxOpen,
    setNotificationsInboxOpen,
    refreshNotificationsUnread,
    activeImageIndex,
    setActiveImageIndex,
    userAddresses,
    loadAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultUserAddress,
    applyUserAddress,
    restoreDeliverySelection,
    clearDeliverySelection,
    loadProducts,
    refreshHomeScreen,
    refreshCart,
    refreshLocalCart,
    handleRegionSelect,
    handleDistrictSelect,
    handleMFYSelect,
    goPrevImage,
    goNextImage,
    addToCart,
    addLocalToCart,
    removeFromCart,
    removeLocalFromCart,
    clearCart,
    clearLocalCart,
    updateQuantity,
    updateLocalQuantity,
    cartTotal,
    cartCount,
    localCartTotal,
    localCartCount,
    isTabletUpWeb,
    containerMaxWidth,
    contentWidth,
    columns,
    cardGap,
    cardWidth,
    isSmallWeb,
    resolvedCardWidth,
    productModalWidth,
    regionModalWidth,
    regionModalHeight,
    renderDescription,
    renderDescriptionDelta,
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
  };

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error('useMarketplace must be used inside MarketplaceProvider');
  return ctx;
}
