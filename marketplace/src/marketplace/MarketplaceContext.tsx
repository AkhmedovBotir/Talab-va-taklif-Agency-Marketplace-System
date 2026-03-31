import React, { createContext, useContext, useCallback, useEffect, useRef, useState, ReactNode } from 'react';
import { Alert, Platform, Text, useWindowDimensions } from 'react-native';
import { Dimensions } from 'react-native';
import { api, MOCK_REGIONS, MOCK_DISTRICTS, MOCK_MFYS, parsePositiveProductId } from '../services/api';
import { Product, Region, District, MFY, Address } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  setSelectedRegion: (r: Region | null) => void;
  setSelectedDistrict: (d: District | null) => void;
  setSelectedMFY: (m: MFY | null) => void;
  isRegionSelectorOpen: boolean;
  setIsRegionSelectorOpen: (o: boolean) => void;
  regionSelectorStep: 'region' | 'district' | 'mfy';
  setRegionSelectorStep: (s: 'region' | 'district' | 'mfy') => void;
  cart: CartItem[];
  notificationsCount: number;
  activeImageIndex: number;
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
  applyUserAddress: (address: Address) => Promise<void>;
  loadProducts: (q?: string) => Promise<void>;
  /** Mobil: pastga tortib yangilash — mahsulotlar, savat, viloyatlar, manzillar */
  refreshHomeScreen: () => Promise<void>;
  /** Savatni serverdan qayta yuklash */
  refreshCart: () => Promise<void>;
  handleRegionSelect: (region: Region) => Promise<void>;
  handleDistrictSelect: (district: District) => Promise<void>;
  handleMFYSelect: (mfy: MFY) => void;
  goPrevImage: () => void;
  goNextImage: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  updateQuantity: (productId: string, delta: number) => void;
  cartTotal: number;
  cartCount: number;
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
  const cartRef = useRef<CartItem[]>([]);
  cartRef.current = cart;
  const [notificationsCount] = useState(3);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [userAddresses, setUserAddresses] = useState<Address[]>([]);

  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    loadProducts();
    loadRegions();
    loadAddresses();
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const rows = await api.cart.get();
      setCart(rows);
    } catch {
      setCart([]);
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
    const res = await api.addresses.list();
    setUserAddresses(res);
    const def = res.find((a) => a.is_default);
    if (def) {
      await applyUserAddress(def);
    }
  };

  const applyUserAddress = async (address: Address) => {
    const regionList = regions.length ? regions : await api.regions.getRegions();
    if (!regions.length && regionList.length) setRegions(regionList);
    const region =
      regionList.find((r) => r.id === address.region_id) || MOCK_REGIONS.find((r) => r.id === address.region_id) || null;
    setSelectedRegion(region);

    const ds = await api.regions.getDistricts(address.region_id);
    setDistricts(ds);
    const district =
      ds.find((d) => d.id === address.district_id) || MOCK_DISTRICTS.find((d) => d.id === address.district_id) || null;
    setSelectedDistrict(district);

    const ms = await api.regions.getMFYs(address.district_id);
    setMfys(ms);
    const mfy = ms.find((m) => m.id === address.mfy_id) || MOCK_MFYS.find((m) => m.id === address.mfy_id) || null;
    setSelectedMFY(mfy);
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
    const res = await api.products.list({ q, limit: q ? 50 : 100 });
    setProducts(res);
    setLoading(false);
  };

  const loadRegions = async () => {
    const res = await api.regions.getRegions();
    setRegions(res);
  };

  const refreshCart = useCallback(async () => {
    try {
      const rows = await api.cart.get();
      setCart(rows);
    } catch {
      setCart([]);
    }
  }, []);

  const loadAddressesRef = useRef(loadAddresses);
  const loadRegionsRef = useRef(loadRegions);
  loadAddressesRef.current = loadAddresses;
  loadRegionsRef.current = loadRegions;

  const refreshHomeScreen = useCallback(async () => {
    const q = searchRef.current.trim();
    setLoading(true);
    try {
      const res = await api.products.list({ q: q || undefined, limit: q ? 50 : 100 });
      setProducts(res);
    } finally {
      setLoading(false);
    }
    await Promise.all([refreshCart(), loadRegionsRef.current()]);
    await loadAddressesRef.current();
  }, [refreshCart]);

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
  };

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
        Alert.alert('Savat', e instanceof Error ? e.message : "O'chirib bo'lmadi");
      }
    })();
  };

  const clearCart = () => {
    void (async () => {
      try {
        const next = await api.cart.clear();
        setCart(next);
      } catch {
        setCart([]);
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
        Alert.alert('Savat', e instanceof Error ? e.message : 'Miqdorni yangilab bo‘lmadi');
      }
    })();
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
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
    setSelectedRegion,
    setSelectedDistrict,
    setSelectedMFY,
    isRegionSelectorOpen,
    setIsRegionSelectorOpen,
    regionSelectorStep,
    setRegionSelectorStep,
    cart,
    notificationsCount,
    activeImageIndex,
    userAddresses,
    loadAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultUserAddress,
    applyUserAddress,
    loadProducts,
    refreshHomeScreen,
    refreshCart,
    handleRegionSelect,
    handleDistrictSelect,
    handleMFYSelect,
    goPrevImage,
    goNextImage,
    addToCart,
    removeFromCart,
    clearCart,
    updateQuantity,
    cartTotal,
    cartCount,
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
