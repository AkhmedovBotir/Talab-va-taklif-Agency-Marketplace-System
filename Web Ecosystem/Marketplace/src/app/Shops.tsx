import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProductCard from '../components/ui/ProductCard';
import Icon from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLocation } from '../contexts/LocationContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import apiService, { Category, Product } from '../services/api';

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

export default function Shops() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedTuman } = useLocation();
  const { addToCart, getCartItemQuantity } = useCart();
  const { showError, showSuccess } = useSnackbar();
  const { unreadCount } = useNotification();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getCategories({
        status: 'active',
        includeSubcategories: false,
      });
      const parents = (res.data || []).filter((c) => !c.parent);
      setCategories(parents);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      return;
    }
    let cancelled = false;
    setSubLoading(true);
    apiService
      .getCategoryById(selectedCategory._id, true)
      .then((res) => {
        if (!cancelled && res.success && res.data?.subcategories)
          setSubcategories(res.data.subcategories);
        else if (!cancelled) setSubcategories([]);
      })
      .catch(() => {
        if (!cancelled) setSubcategories([]);
      })
      .finally(() => {
        if (!cancelled) setSubLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory?._id]);

  useEffect(() => {
    if (!selectedSubcategory) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setProductsLoading(true);
    apiService
      .getProducts({
        page: 1,
        limit: 50,
        status: 'active',
        subcategory: selectedSubcategory._id,
      })
      .then((res) => {
        if (cancelled) return;
        let list = res.data || [];
        if (selectedTuman)
          list = list.filter(
            (p) =>
              p.deliveryRegions?.some((r) => r.tuman?._id === selectedTuman._id) ||
              p.contragent?.tuman?._id === selectedTuman._id
          );
        const age = calculateAge(user?.birthDate);
        if (age !== null && age < 18) list = list.filter((p) => !p.censored);
        setProducts(list);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSubcategory?._id, selectedTuman?._id, user?.birthDate]);

  const filteredProducts = searchQuery.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : products;

  const handleBack = () => {
    if (selectedSubcategory) {
      setSelectedSubcategory(null);
      setProducts([]);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setSubcategories([]);
      setSelectedSubcategory(null);
    }
  };

  const handleCategoryPress = (c: Category) => setSelectedCategory(c);
  const handleSubcategoryPress = (s: Category) => setSelectedSubcategory(s);
  const handleProductPress = (p: Product) => navigate(`/product/${p._id}`);

  const handleAddToCart = async (p: Product) => {
    const type = p.productType || 'tuman';
    if (type === 'maxalla') {
      showError('Maxalla mahsulotlarini qo\'shish uchun MFY tanlang');
      return;
    }
    try {
      await addToCart(p._id, 1, type);
      showSuccess(`${p.name} korzinkaga qo'shildi`);
    } catch (_) {}
  };

  if (!selectedCategory) {
    return (
      <div style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <Header
          title="Kategoriyalar"
          unreadCount={unreadCount}
          onNotificationPress={() => navigate('/notifications')}
        />
        {loading && categories.length === 0 ? (
          <div className="loadingContainer">
            <div className="loading-spinner" />
          </div>
        ) : (
          <div className="shopsListContent" style={{ paddingBottom: 100 }}>
            {categories.length === 0 ? (
              <div className="emptyContainer">
                <Icon name="grid-outline" size={64} color="#ccc" />
                <span className="emptyText">Kategoriyalar topilmadi</span>
              </div>
            ) : (
              categories.map((c) => (
                <div
                  key={c._id}
                  className="categoryCard"
                  onClick={() => handleCategoryPress(c)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="categoryIconContainer">
                    {c.image ? (
                      <img src={c.image} alt="" />
                    ) : (
                      <Icon name="grid-outline" size={32} color="#007AFF" />
                    )}
                  </div>
                  <div className="categoryInfo">
                    <div className="categoryName">{c.name}</div>
                  </div>
                  <Icon name="chevron-forward" size={24} color="#ccc" />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  if (!selectedSubcategory) {
    return (
      <div style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <Header
          title={selectedCategory.name}
          showBackButton
          onBackPress={handleBack}
          unreadCount={unreadCount}
          onNotificationPress={() => navigate('/notifications')}
        />
        {subLoading && subcategories.length === 0 ? (
          <div className="loadingContainer">
            <div className="loading-spinner" />
          </div>
        ) : (
          <div className="shopsListContent" style={{ paddingBottom: 100 }}>
            {subcategories.length === 0 ? (
              <div className="emptyContainer">
                <Icon name="folder-outline" size={64} color="#ccc" />
                <span className="emptyText">Kichik kategoriyalar topilmadi</span>
              </div>
            ) : (
              subcategories.map((s) => (
                <div
                  key={s._id}
                  className="subcategoryCard"
                  onClick={() => handleSubcategoryPress(s)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="subcategoryIconContainer">
                    {s.image ? (
                      <img src={s.image} alt="" />
                    ) : (
                      <Icon name="folder-outline" size={28} color="#007AFF" />
                    )}
                  </div>
                  <div className="subcategoryInfo">
                    <div className="subcategoryName">{s.name}</div>
                  </div>
                  <Icon name="chevron-forward" size={24} color="#ccc" />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <Header
        title={selectedSubcategory.name}
        showBackButton
        onBackPress={handleBack}
        unreadCount={unreadCount}
        onNotificationPress={() => navigate('/notifications')}
      />
      <div className="shopsSearchContainer">
        <div className="shopsSearchInputWrapper">
          <Icon name="search" size={20} color="#666" className="searchIcon" />
          <input
            type="search"
            className="searchInput"
            placeholder="Mahsulot qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              className="clearButton"
              onClick={() => setSearchQuery('')}
            >
              <Icon name="close-circle" size={20} color="#666" />
            </button>
          )}
        </div>
      </div>
      {productsLoading && products.length === 0 ? (
        <div className="loadingContainer">
          <div className="loading-spinner" />
        </div>
      ) : (
        <div className="listContent" style={{ paddingBottom: 100 }}>
            {filteredProducts.length === 0 ? (
              <div className="emptyContainer">
                <Icon name="cube-outline" size={64} color="#ccc" />
                <span className="emptyText">Mahsulotlar topilmadi</span>
              </div>
            ) : (
            <div className="productsRow" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {filteredProducts.map((p) => (
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
    </div>
  );
}
