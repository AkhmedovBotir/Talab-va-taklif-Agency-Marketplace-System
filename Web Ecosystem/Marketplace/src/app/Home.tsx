import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LocationSelector from '../components/LocationSelector';
import PartnershipBlock from '../components/PartnershipBlock';
import Icon from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLocation } from '../contexts/LocationContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import apiService, { FeaturedContragent, Product } from '../services/api';

const calculateAge = (birthDate: string | null | undefined): number | null => {
  if (!birthDate) return null;
  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  } catch {
    return null;
  }
};

const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedTuman, selectedViloyat, selectedMfy } = useLocation();
  const { addToCart, getCartItemQuantity } = useCart();
  const { showError, showSuccess } = useSnackbar();
  const { unreadCount } = useNotification();

  const [featured, setFeatured] = useState<FeaturedContragent[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [tumanProducts, setTumanProducts] = useState<Product[]>([]);
  const [maxallaProducts, setMaxallaProducts] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingTuman, setLoadingTuman] = useState(true);
  const [loadingMaxalla, setLoadingMaxalla] = useState(true);

  const loadFeatured = useCallback(async () => {
    try {
      setLoadingFeatured(true);
      const res = await apiService.getFeaturedContragents();
      setFeatured(Array.isArray(res.data) ? res.data : []);
    } catch {
      setFeatured([]);
    } finally {
      setLoadingFeatured(false);
    }
  }, []);

  const loadTuman = useCallback(async () => {
    try {
      setLoadingTuman(true);
      const res = await apiService.getProducts({ page: 1, limit: 4, status: 'active' });
      let list = res.data || [];
      if (selectedTuman) {
        list = list.filter((p) => {
          if (!p.deliveryRegions?.length)
            return p.contragent?.tuman?._id === selectedTuman._id;
          return p.deliveryRegions.some(
            (r) =>
              r.tuman?._id === selectedTuman._id ||
              (selectedViloyat && r.viloyat?._id === selectedViloyat._id)
          );
        });
      }
      const age = calculateAge(user?.birthDate);
      if (age !== null && age < 18) list = list.filter((p) => !p.censored);
      setTumanProducts(list.map((p) => ({ ...p, productType: 'tuman' as const })));
    } catch {
      setTumanProducts([]);
    } finally {
      setLoadingTuman(false);
    }
  }, [selectedTuman?._id, selectedViloyat?._id, user?.birthDate]);

  const loadMaxalla = useCallback(async () => {
    try {
      setLoadingMaxalla(true);
      const res = await apiService.getMaxallaProducts({ page: 1, limit: 4, status: 'active' });
      let list = res.data || [];
      if (selectedMfy) list = list.filter((p) => p.contragent?.mfy?._id === selectedMfy._id);
      else list = [];
      const age = calculateAge(user?.birthDate);
      if (age !== null && age < 18) list = list.filter((p) => !p.censored);
      setMaxallaProducts(list.map((p) => ({ ...p, productType: 'maxalla' as const })));
    } catch {
      setMaxallaProducts([]);
    } finally {
      setLoadingMaxalla(false);
    }
  }, [selectedMfy?._id, user?.birthDate]);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);
  useEffect(() => {
    loadTuman();
  }, [loadTuman]);
  useEffect(() => {
    loadMaxalla();
  }, [loadMaxalla]);

  useEffect(() => {
    if (featured.length <= 1) return;
    const id = setInterval(() => setFeaturedIndex((i) => (i + 1) % featured.length), 4000);
    return () => clearInterval(id);
  }, [featured.length]);

  const handleProduct = (p: Product) => navigate(`/product/${p._id}`);
  const handleAddToCart = async (p: Product) => {
    const type = p.productType || 'tuman';
    if (type === 'maxalla') {
      showError("Maxalla mahsulotini korzinkaga qo'shish uchun Mahsulotlar sahifasidan dokon tanlang");
      return;
    }
    try {
      await addToCart(p._id, 1, type);
      showSuccess(`${p.name} korzinkaga qo'shildi`);
    } catch (_) {}
  };
  const goSearch = (tab: 'tuman' | 'maxalla') => navigate('/search', { state: { initialTab: tab } });

  const currentFeatured = featured[featuredIndex] || featured[0];

  return (
    <>
      <Header
        title="Marketplace"
        unreadCount={unreadCount}
        onNotificationPress={() => navigate('/notifications')}
      />
      <LocationSelector />
      <div className="scroll-content">
        {/* TOP do'konlar – app/(tabs)/index.tsx renderTopContragents */}
        {loadingFeatured && featured.length === 0 ? (
          <div className="topContragentsLoading">
            <div className="loading-spinner" />
          </div>
        ) : featured.length > 0 && currentFeatured ? (
          <div className="topContragentsContainer">
            <div className="topContragentsHeader">
              <div>
                <div className="topContragentsTitle">TOP do'konlar</div>
                <div className="topContragentsSubtitle">Eng ishonchli hamkorlarimiz</div>
              </div>
              <div className="topContragentsControls">
                <button
                  type="button"
                  className="carouselControlButton"
                  onClick={() => setFeaturedIndex((i) => (i === 0 ? featured.length - 1 : i - 1))}
                >
                  <Icon name="chevron-back" size={18} color="#111827" />
                </button>
                <button
                  type="button"
                  className="carouselControlButton"
                  onClick={() => setFeaturedIndex((i) => (i + 1) % featured.length)}
                >
                  <Icon name="chevron-forward" size={18} color="#111827" />
                </button>
              </div>
            </div>
            <div
              className="topContragentCard"
              onClick={() => navigate('/search', { state: { contragentId: currentFeatured._id } })}
            >
              <div className="topContragentAvatar">
                {currentFeatured.logo ? (
                  <img src={currentFeatured.logo} alt="" className="topContragentLogo" />
                ) : (
                  <div className="topContragentInitials">
                    {currentFeatured.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="topContragentInfo">
                <div className="topContragentName">{currentFeatured.name}</div>
                <div className="topContragentActionText">Do'konni ko'rish</div>
              </div>
            </div>
            {featured.length > 1 && (
              <div className="carouselDotsContainer">
                {featured.map((_, index) => (
                  <div
                    key={index}
                    className={index === featuredIndex ? 'carouselDot carouselDotActive' : 'carouselDot'}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}

        <PartnershipBlock />

        {/* Tumandagi sotuv – index.tsx sectionBlock */}
        <div className="sectionBlock sectionBlockTuman">
          <div className="sectionBlockTitle">Tumandagi maxsulotlar</div>
          <div className="sectionBlockDesc">Tuman bo'ylab yetkazib beriladigan mahsulotlar</div>
          {loadingTuman ? (
            <div className="sectionProductsLoading">
              <div className="loading-spinner" />
            </div>
          ) : (
            <div className="sectionProductsRow">
              {tumanProducts.slice(0, 4).map((p) => {
                const inCart = getCartItemQuantity(p._id, 'tuman') > 0;
                return (
                  <div
                    key={p._id}
                    className="homeProductCard"
                    onClick={() => handleProduct(p)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="homeProductImageWrap">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="homeProductImage" />
                      ) : (
                        <div className="homeProductImagePlaceholder">
                          <Icon name="image-outline" size={24} color="#bbb" />
                        </div>
                      )}
                    </div>
                    <div className="homeProductName">{p.name}</div>
                    <div className="homeProductPrice">{formatPrice(p.price)}</div>
                    <button
                      type="button"
                      className={`homeProductCartBtn ${inCart ? 'homeProductCartBtnActive' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!inCart) handleAddToCart(p);
                      }}
                    >
                      {inCart ? (
                        <Icon name="checkmark-circle" size={14} color="#fff" />
                      ) : (
                        <Icon name="cart-outline" size={14} color="#fff" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <button type="button" className="sectionCta" onClick={() => goSearch('tuman')}>
            <span className="sectionCtaText">Bunga o'tish</span>
            <Icon name="arrow-forward" size={18} color="#007AFF" />
          </button>
        </div>

        {/* Maxalladagi sotuv */}
        <div className="sectionBlock sectionBlockMaxalla">
          <div className="sectionBlockTitle">Maxalladagi maxsulotlar</div>
          <div className="sectionBlockDesc">Maxalla do'konlaridagi mahsulotlar</div>
          {loadingMaxalla ? (
            <div className="sectionProductsLoading">
              <div className="loading-spinner" />
            </div>
          ) : (
            <div className="sectionProductsRow">
              {maxallaProducts.slice(0, 4).map((p) => (
                <div
                  key={p._id}
                  className="homeProductCard"
                  onClick={() => handleProduct(p)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="homeProductImageWrap">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="homeProductImage" />
                    ) : (
                      <div className="homeProductImagePlaceholder">
                        <Icon name="image-outline" size={24} color="#bbb" />
                      </div>
                    )}
                  </div>
                  <div className="homeProductName">{p.name}</div>
                  <div className="homeProductPrice" style={{ color: '#0A7B4A' }}>{formatPrice(p.price)}</div>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="sectionCta" onClick={() => goSearch('maxalla')}>
            <span className="sectionCtaTextMaxalla">Bunga o'tish</span>
            <Icon name="arrow-forward" size={18} color="#0A7B4A" />
          </button>
        </div>
      </div>
    </>
  );
}
