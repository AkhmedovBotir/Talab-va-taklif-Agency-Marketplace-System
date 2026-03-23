import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Icon from '../components/ui/Icon';
import ImageCarousel from '../components/ui/ImageCarousel';
import { useCart } from '../contexts/CartContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import apiService, { Product as ProductType } from '../services/api';

const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity } = useCart();
  const { showError, showSuccess } = useSnackbar();
  const { user } = useAuth();
  const { showAlert } = useModal();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    let cancelled = false;
    const load = async () => {
      try {
        let res;
        try {
          res = await apiService.getProductById(id);
        } catch (e) {
          res = await apiService.getMaxallaProductById(id);
          if (res.data) (res.data as ProductType).productType = 'maxalla';
        }
        if (!res?.data || cancelled) return;

        const loaded: ProductType = res.data;

        // Age restriction: block censored products for users under 18
        if (loaded.censored && user?.birthDate) {
          try {
            const birth = new Date(user.birthDate);
            if (!Number.isNaN(birth.getTime())) {
              const today = new Date();
              let age = today.getFullYear() - birth.getFullYear();
              const m = today.getMonth() - birth.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
              if (age < 18) {
                await showAlert(
                  "Bu mahsulot 18 yoshdan kichik foydalanuvchilar uchun taqiqlangan.",
                  { title: 'Kirish taqiqlangan' }
                );
                navigate(-1);
                return;
              }
            }
          } catch {
            // ignore age parse errors
          }
        }

        setProduct(loaded);
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    const type = product.productType || 'tuman';
    if (type === 'maxalla') {
      showError("Maxalla mahsulotini korzinkaga qo'shish uchun do'kondan tanlang");
      return;
    }
    try {
      await addToCart(product._id, 1, type);
      showSuccess(`${product.name} korzinkaga qo'shildi`);
    } catch (_) {}
  };

  if (loading) {
    return (
      <>
        <Header showBackButton onBackPress={() => navigate(-1)} title="Mahsulot" />
        <div className="loading-wrap"><div className="loading-spinner" /></div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header showBackButton onBackPress={() => navigate(-1)} title="Mahsulot" />
        <div className="page"><p>Mahsulot topilmadi.</p></div>
      </>
    );
  }

  const images = product.images?.length ? product.images : [];
  const desc = product.description;
  const hasDesc = desc && (typeof desc === 'object' ? (desc as { ops?: unknown[] }).ops?.length : false);
  const productType = product.productType || 'tuman';
  const inCart = getCartItemQuantity(product._id, productType) > 0;

  return (
    <>
      <Header showBackButton onBackPress={() => navigate(-1)} title={product.name} />
      <div className="page">
        <ImageCarousel images={images} height={400} />
        <div className="card">
          <h1 style={{ margin: '0 0 8px' }}>{product.name}</h1>
          <p
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--primary)',
            }}
          >
            {formatPrice(product.price)}
          </p>
          {product.originalPrice && product.originalPrice > product.price && (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 14,
                color: '#9CA3AF',
                textDecoration: 'line-through',
              }}
            >
              {formatPrice(product.originalPrice)}
            </p>
          )}
          {productType !== 'maxalla' && (
            <button
              type="button"
              className="btn-primary"
              style={{
                marginTop: 16,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onClick={handleAddToCart}
              disabled={inCart}
            >
              <Icon
                name={inCart ? 'checkmark-circle' : 'cart-outline'}
                size={20}
                color="#fff"
              />
              <span>{inCart ? 'Korzinkada' : "Korzinkaga qo'shish"}</span>
            </button>
          )}
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>Mahsulot ma'lumotlari</h3>
          <div style={{ fontSize: 14, color: '#4B5563' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Narxi</span>
              <span style={{ fontWeight: 600 }}>{formatPrice(product.price)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Miqdori</span>
              <span>
                {product.quantity || 0} {product.unit || 'dona'}
              </span>
            </div>
            {product.unitSize && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>O'lchami</span>
                <span>
                  {product.unitSize} {product.unit || 'dona'}
                </span>
              </div>
            )}
            {product.category && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 0 }}>
                <span>Kategoriya</span>
                <span style={{ textAlign: 'right' }}>
                  {product.category?.name}
                  {product.subcategory?.name
                    ? ` → ${product.subcategory.name}`
                    : ''}
                </span>
              </div>
            )}
          </div>
        </div>
        {hasDesc && (
          <div className="card">
            <h3 style={{ margin: '0 0 8px' }}>Tavsif</h3>
            <div style={{ lineHeight: 1.6 }}>
              {typeof desc === 'object' && (desc as { ops?: { insert?: string }[] }).ops?.map((op: { insert?: string }, i: number) => (
                <p key={i} style={{ margin: '0 0 8px' }}>{op.insert}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
