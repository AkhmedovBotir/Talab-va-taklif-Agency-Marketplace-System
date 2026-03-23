import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Icon from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import { useModal } from '../contexts/ModalContext';
import type { CartItem } from '../services/api';

const formatPrice = (n: number) =>
  new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

export default function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotification();
  const {
    tumanCart,
    maxallaCart,
    isLoading,
    activeCartType,
    setActiveCartType,
    refreshCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCart,
  } = useCart();

  const cart = getCart(activeCartType);
  const [removing, setRemoving] = useState<string | null>(null);
  const { showAlert, showConfirm } = useModal();

  useEffect(() => {
    refreshCart('tuman');
    refreshCart('maxalla');
  }, [refreshCart]);

  const handleQuantity = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    if (newQty > item.product.quantity) {
      await showAlert(`Mavjud miqdor: ${item.product.quantity}`);
      return;
    }
    try {
      await updateCartItem(item.product._id, newQty, activeCartType);
    } catch (_) {}
  };

  const handleRemove = async (item: CartItem) => {
    const confirmed = await showConfirm(
      `${item.product.name} korzinkadan o'chirilsinmi?`,
      { title: 'Tasdiqlash' }
    );
    if (!confirmed) return;
    setRemoving(item.product._id);
    try {
      await removeFromCart(item.product._id, activeCartType);
    } finally {
      setRemoving(null);
    }
  };

  const handleClearCart = async () => {
    if (!cart?.items?.length) return;
    const confirmed = await showConfirm(
      "Barcha mahsulotlar korzinkadan o'chirilsinmi?",
      { title: 'Tasdiqlash' }
    );
    if (!confirmed) return;
    try {
      await clearCart(activeCartType);
    } catch (_) {}
  };

  const items = cart?.items || [];

  const renderTabs = () => (
    <div className="cartTabsContainer">
      <button
        type="button"
        className={`cartTab ${activeCartType === 'tuman' ? 'cartTabActive' : ''}`}
        onClick={() => setActiveCartType('tuman')}
      >
        <Icon name="storefront" size={20} color={activeCartType === 'tuman' ? '#007AFF' : '#666'} />
        <span>Tuman Korzinkasi</span>
        {tumanCart?.items?.length ? (
          <span className="cartTabBadge">{tumanCart.totalItems}</span>
        ) : null}
      </button>
      <button
        type="button"
        className={`cartTab ${activeCartType === 'maxalla' ? 'cartTabActive' : ''}`}
        onClick={() => setActiveCartType('maxalla')}
      >
        <Icon name="home" size={20} color={activeCartType === 'maxalla' ? '#007AFF' : '#666'} />
        <span>Maxalla Korzinkasi</span>
        {maxallaCart?.items?.length ? (
          <span className="cartTabBadge">{maxallaCart.totalItems}</span>
        ) : null}
      </button>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <Header
          title="Korzinka"
          unreadCount={unreadCount}
          onNotificationPress={() => navigate('/notifications')}
        />
        {renderTabs()}
        <div className="emptyContainer" style={{ padding: 24 }}>
          <Icon name="cart-outline" size={64} color="#ccc" />
          <span className="emptyText">Korzinkaga qo'shish uchun tizimga kiring</span>
          <button
            type="button"
            className="loginButton"
            onClick={() => navigate('/login')}
          >
            <span className="loginButtonText">Kirish</span>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !cart) {
    return (
      <div style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <Header
          title="Korzinka"
          unreadCount={unreadCount}
          onNotificationPress={() => navigate('/notifications')}
        />
        {renderTabs()}
        <div className="loadingContainer">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <Header
          title="Korzinka"
          unreadCount={unreadCount}
          onNotificationPress={() => navigate('/notifications')}
        />
        {renderTabs()}
        <div className="emptyContainer" style={{ padding: 24 }}>
          <Icon name="cart-outline" size={64} color="#ccc" />
          <span className="emptyText">
            {activeCartType === 'tuman'
              ? "Tuman korzinkasi bo'sh"
              : "Maxalla korzinkasi bo'sh"}
          </span>
          <button
            type="button"
            className="shopButton"
            onClick={() => navigate('/')}
          >
            <span className="shopButtonText">Xarid qilishni boshlash</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <Header
        title="Korzinka"
        unreadCount={unreadCount}
        onNotificationPress={() => navigate('/notifications')}
        rightButton={
          <button
            type="button"
            className="headerClearButton"
            onClick={handleClearCart}
            aria-label="Tozalash"
          >
            <Icon name="trash-outline" size={24} color="#FF3B30" />
          </button>
        }
      />
      {renderTabs()}

      <div className="cartListContent">
        {items.map((item) => (
          <div key={item.product._id} className="cartItem">
            <div
              className="cartItemImageContainer"
              onClick={() => navigate(`/product/${item.product._id}`)}
              role="button"
              tabIndex={0}
            >
              {item.product.images?.[0] ? (
                <img
                  src={item.product.images[0]}
                  alt=""
                  className="cartItemImage"
                />
              ) : (
                <div className="cartItemImagePlaceholder">
                  <Icon name="image-outline" size={32} color="#ccc" />
                </div>
              )}
            </div>
            <div className="cartItemContent">
              <div className="cartItemHeader">
                <div
                  className="cartItemName"
                  onClick={() => navigate(`/product/${item.product._id}`)}
                  role="button"
                  tabIndex={0}
                >
                  {item.product.name}
                </div>
                <button
                  type="button"
                  className="cartItemRemoveBtn"
                  onClick={() => handleRemove(item)}
                  disabled={removing === item.product._id}
                >
                  <Icon name="close-circle" size={24} color="#999" />
                </button>
              </div>
              <div className="cartItemPriceContainer">
                <span className="cartItemPrice">
                  {formatPrice(item.product.price)}
                </span>
                {item.product.originalPrice > item.product.price && (
                  <span className="cartItemOriginalPrice">
                    {formatPrice(item.product.originalPrice)}
                  </span>
                )}
              </div>
              <div className="cartItemAvailable">
                Mavjud: {item.product.quantity}
              </div>
              <div className="cartItemQuantityContainer">
                <span className="cartItemQuantityLabel">Miqdor:</span>
                <div className="cartItemQuantityControls">
                  <button
                    type="button"
                    className="cartItemQuantityBtn"
                    onClick={() => handleQuantity(item, -1)}
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <span className="cartItemQuantityText">{item.quantity}</span>
                  <button
                    type="button"
                    className="cartItemQuantityBtn"
                    onClick={() => handleQuantity(item, 1)}
                    disabled={item.quantity >= item.product.quantity}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="summaryBar">
        <div className="summaryContent">
          <div className="summaryRow">
            <span className="summaryLabel">Jami mahsulotlar:</span>
            <span className="summaryValue">{cart?.totalItems ?? 0} ta</span>
          </div>
          {cart && cart.totalDiscount > 0 && (
            <div className="summaryRow">
              <span className="summaryLabel">Chegirma:</span>
              <span className="discountValue">
                -{formatPrice(cart.totalDiscount)}
              </span>
            </div>
          )}
          <div className="summaryRow">
            <span className="totalLabel">Umumiy:</span>
            <span className="totalValue">
              {formatPrice(cart?.totalPrice ?? 0)}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="checkoutButton"
          onClick={() => navigate('/checkout', { state: { productType: activeCartType } })}
        >
          <span className="checkoutButtonText">Buyurtma berish</span>
        </button>
      </div>
    </div>
  );
}
