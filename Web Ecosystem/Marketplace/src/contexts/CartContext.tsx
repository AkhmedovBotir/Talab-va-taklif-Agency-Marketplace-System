import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import apiService, { Cart } from '../services/api';
import { useAuth } from './AuthContext';
import { useModal } from './ModalContext';

interface CartContextType {
  tumanCart: Cart | null;
  maxallaCart: Cart | null;
  isLoading: boolean;
  totalItems: number;
  activeCartType: 'tuman' | 'maxalla';
  setActiveCartType: (type: 'tuman' | 'maxalla') => void;
  refreshCart: (productType?: 'tuman' | 'maxalla') => Promise<void>;
  addToCart: (productId: string, quantity?: number, productType?: 'tuman' | 'maxalla') => Promise<void>;
  updateCartItem: (productId: string, quantity: number, productType?: 'tuman' | 'maxalla') => Promise<void>;
  removeFromCart: (productId: string, productType?: 'tuman' | 'maxalla') => Promise<void>;
  clearCart: (productType?: 'tuman' | 'maxalla') => Promise<void>;
  getCartItemQuantity: (productId: string, productType?: 'tuman' | 'maxalla') => number;
  getCart: (productType?: 'tuman' | 'maxalla') => Cart | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [tumanCart, setTumanCart] = useState<Cart | null>(null);
  const [maxallaCart, setMaxallaCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCartType, setActiveCartType] = useState<'tuman' | 'maxalla'>('tuman');
  const { showAlert } = useModal();

  const refreshCart = useCallback(
    async (productType: 'tuman' | 'maxalla' = 'tuman') => {
      if (!token || !isAuthenticated) {
        if (productType === 'tuman') setTumanCart(null);
        else setMaxallaCart(null);
        return;
      }
      setIsLoading(true);
      try {
        if (productType === 'maxalla') {
        const res = await apiService.getMaxallaCart(token);
          setMaxallaCart(res.data ?? null);
      } else {
          const res = await apiService.getCart(token);
        setTumanCart(res.data ?? null);
      }
      } catch (err: unknown) {
        if (productType === 'maxalla') setMaxallaCart(null);
        else setTumanCart(null);
      } finally {
        setIsLoading(false);
      }
    },
    [token, isAuthenticated]
  );

  useEffect(() => {
    if (isAuthenticated && token) {
      refreshCart('tuman');
      refreshCart('maxalla');
    } else {
      setTumanCart(null);
      setMaxallaCart(null);
    }
  }, [isAuthenticated, token, refreshCart]);

  const addToCart = async (
    productId: string,
    quantity: number = 1,
    productType: 'tuman' | 'maxalla' = 'tuman'
  ) => {
    if (!token || !isAuthenticated) {
      await showAlert("Korzinkaga qo'shish uchun tizimga kiring", {
        title: 'Korzinka',
      });
      return;
    }
    try {
      const res = await apiService.addToCart(productId, quantity, token, productType);
      if (productType === 'maxalla') setMaxallaCart(res.data ?? null);
      else setTumanCart(res.data ?? null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Korzinkaga qo'shishda xatolik";
      await showAlert(msg, { title: 'Xatolik' });
      throw err;
    }
  };

  const updateCartItem = async (
    productId: string,
    quantity: number,
    productType: 'tuman' | 'maxalla' = 'tuman'
  ) => {
    if (!token || !isAuthenticated) return;
    try {
      const res = await apiService.updateCartItem(productId, quantity, token, productType);
      if (productType === 'maxalla') setMaxallaCart(res.data ?? null);
      else setTumanCart(res.data ?? null);
    } catch (err) {
      throw err;
    }
  };

  const removeFromCart = async (
    productId: string,
    productType: 'tuman' | 'maxalla' = 'tuman'
  ) => {
    if (!token || !isAuthenticated) return;
    try {
      const res = await apiService.removeFromCart(productId, token, productType);
      if (productType === 'maxalla') setMaxallaCart(res.data ?? null);
      else setTumanCart(res.data ?? null);
    } catch (err) {
      throw err;
    }
  };

  const clearCart = async (productType: 'tuman' | 'maxalla' = 'tuman') => {
    if (!token || !isAuthenticated) return;
    try {
      const res = await apiService.clearCart(token, productType);
      if (productType === 'maxalla') setMaxallaCart(res.data ?? null);
      else setTumanCart(res.data ?? null);
    } catch (err) {
      throw err;
    }
  };

  const getCartItemQuantity = (
    productId: string,
    productType: 'tuman' | 'maxalla' = 'tuman'
  ): number => {
    const cart = productType === 'maxalla' ? maxallaCart : tumanCart;
    if (!cart?.items) return 0;
    const item = cart.items.find((i) => i.product._id === productId);
    return item ? item.quantity : 0;
  };

  const getCart = (productType?: 'tuman' | 'maxalla'): Cart | null =>
    productType === 'maxalla' ? maxallaCart : tumanCart;

  const totalItems = (tumanCart?.totalItems ?? 0) + (maxallaCart?.totalItems ?? 0);

  return (
    <CartContext.Provider
      value={{
        tumanCart,
        maxallaCart,
        isLoading,
        totalItems,
        activeCartType,
        setActiveCartType,
        refreshCart,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        getCartItemQuantity,
        getCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (ctx === undefined) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
