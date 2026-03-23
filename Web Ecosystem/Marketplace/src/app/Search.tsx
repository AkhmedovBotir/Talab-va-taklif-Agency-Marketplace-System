import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProductCard from '../components/ui/ProductCard';
import Icon from '../components/ui/Icon';
import MaxallaStoreSelectionModal from '../components/MaxallaStoreSelectionModal';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLocation as useLocationContext } from '../contexts/LocationContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import apiService, { MaxallaStore, Product } from '../services/api';

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

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as {
    initialTab?: 'tuman' | 'maxalla';
    contragentId?: string;
    subcategoryId?: string;
  };
  const { user } = useAuth();
  const { selectedTuman, selectedMfy } = useLocationContext();
  const { addToCart, getCartItemQuantity } = useCart();
  const { showError, showSuccess } = useSnackbar();
  const { unreadCount } = useNotification();

  const [activeTab, setActiveTab] = useState<'tuman' | 'maxalla'>(
    state.initialTab || 'tuman'
  );
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [selectedProductForStore, setSelectedProductForStore] = useState<Product | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(t);
  }, [query]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      let list: Product[] = [];
      if (activeTab === 'maxalla') {
        const res = await apiService.getMaxallaProducts({
          page: 1,
          limit: 50,
          status: 'active',
          ...(debouncedQuery.trim() ? { search: debouncedQuery.trim() } : {}),
        });
        list = res.data || [];
        if (selectedMfy)
          list = list.filter((p) => p.contragent?.mfy?._id === selectedMfy._id);
        else list = [];
      } else {
        const res = debouncedQuery.trim()
          ? await apiService.search({
              q: debouncedQuery.trim(),
              page: 1,
              limit: 50,
            })
          : await apiService.getProducts({
              page: 1,
              limit: 50,
              status: 'active',
            });
        if (debouncedQuery.trim())
          list = (res as { results?: { products?: { data?: Product[] } } })
            ?.results?.products?.data ?? [];
        else list = (res as { data?: Product[] })?.data ?? [];
        if (selectedTuman)
          list = list.filter(
            (p) =>
              p.deliveryRegions?.some(
                (r) => r.tuman?._id === selectedTuman._id
              ) || p.contragent?.tuman?._id === selectedTuman._id
          );
      }
      const age = calculateAge(user?.birthDate);
      if (age !== null && age < 18) list = list.filter((p) => !p.censored);
      setProducts(list.map((p) => ({ ...p, productType: activeTab })));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    debouncedQuery,
    selectedTuman?._id,
    selectedMfy?._id,
    user?.birthDate,
  ]);

  useEffect(() => {
    setProducts([]);
    loadProducts();
  }, [activeTab]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleProductPress = (p: Product) => navigate(`/product/${p._id}`);

  const handleAddToCart = async (p: Product) => {
    const type = p.productType || 'tuman';
    if (type === 'maxalla') {
      if (!selectedMfy) {
        showError("Maxalla mahsulotlarini qo'shish uchun MFY tanlang");
        return;
      }
      setSelectedProductForStore(p);
      setStoreModalOpen(true);
      return;
    }
    try {
      await addToCart(p._id, 1, type);
      showSuccess(`${p.name} korzinkaga qo'shildi`);
    } catch (_) {}
  };

  const showTabs = !debouncedQuery;

  return (
    <div style={{ flex: 1, backgroundColor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <Header
        title="Mahsulotlar"
        unreadCount={unreadCount}
        onNotificationPress={() => navigate('/notifications')}
      />

      <div className="searchContainer">
        <div className="searchInputGroup">
          <div className="searchBar">
            <Icon name="search" size={20} color="#666" className="searchIcon" />
            <input
              type="search"
              className="searchInput"
              placeholder="Mahsulot qidirish..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.length > 0 && (
              <button
                type="button"
                className="clearButton"
                onClick={() => {
                  setQuery('');
                  setDebouncedQuery('');
                }}
              >
                <Icon name="close-circle" size={20} color="#999" />
              </button>
            )}
          </div>
        </div>

        {showTabs && (
          <>
            <div className="tabsWrapper">
              <button
                type="button"
                className={`tab ${activeTab === 'tuman' ? 'tabActive' : ''}`}
                onClick={() => setActiveTab('tuman')}
              >
                <Icon name="storefront" size={20} color={activeTab === 'tuman' ? '#007AFF' : '#666'} />
                <span className={activeTab === 'tuman' ? 'tabTextActive' : 'tabText'}>
                  Tumandagi sotuv
                </span>
              </button>
              <button
                type="button"
                className={`tab ${activeTab === 'maxalla' ? 'tabActive' : ''}`}
                onClick={() => setActiveTab('maxalla')}
              >
                <Icon name="home" size={20} color={activeTab === 'maxalla' ? '#007AFF' : '#666'} />
                <span className={activeTab === 'maxalla' ? 'tabTextActive' : 'tabText'}>
                  Maxalladagi sotuv
                </span>
              </button>
            </div>
            {activeTab === 'maxalla' && !selectedMfy && (
              <div className="tabWarning">
                <Icon name="information-circle" size={16} color="#FF9500" />
                <span className="tabWarningText">
                  Maxalla mahsulotlarini ko'rish uchun MFY tanlang
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {loading && products.length === 0 ? (
        <div className="loadingContainer">
          <div className="loading-spinner" />
        </div>
      ) : (
        <div className="listContent" style={{ paddingBottom: 100 }}>
          {products.length === 0 ? (
            <div className="emptyContainer">
              <Icon name="search-outline" size={64} color="#ccc" />
              <span className="emptyText">Mahsulotlar topilmadi</span>
            </div>
          ) : (
            <div className="productsRow" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {products.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onPress={handleProductPress}
                  onAddToCart={handleAddToCart}
                  isInCart={getCartItemQuantity(p._id, p.productType || 'tuman') > 0}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {selectedProductForStore && (
        <MaxallaStoreSelectionModal
          open={storeModalOpen}
          productId={selectedProductForStore._id}
          productName={selectedProductForStore.name}
          onClose={() => {
            setStoreModalOpen(false);
            setSelectedProductForStore(null);
          }}
          onSelectStore={async (store: MaxallaStore) => {
            try {
              await addToCart(store.product._id, 1, 'maxalla');
              showSuccess(
                `${selectedProductForStore.name} ${store.contragent.name} dokonidan korzinkaga qo'shildi`
              );
              setStoreModalOpen(false);
              setSelectedProductForStore(null);
            } catch {
              // error already handled in CartContext
            }
          }}
        />
      )}
    </div>
  );
}
