import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import apiService, { Cart, CartItem } from '../services/api';
import { useAuth } from './AuthContext';

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

  const refreshCart = useCallback(async (productType: 'tuman' | 'maxalla' = 'tuman') => {
    if (!token || !isAuthenticated) {
      if (productType === 'tuman') {
        setTumanCart(null);
      } else {
        setMaxallaCart(null);
      }
      return;
    }

    setIsLoading(true);
    try {
      if (productType === 'maxalla') {
        const response = await apiService.getMaxallaCart(token);
        setMaxallaCart(response.data);
      } else {
        const response = await apiService.getCart(token);
        setTumanCart(response.data);
      }
    } catch (error: any) {
      // Don't show error if cart doesn't exist (it will be created on first add)
      if (error.message && !error.message.includes('topilmadi')) {
        // Only show error if it's not a "not found" error
      }
      if (productType === 'maxalla') {
        setMaxallaCart(null);
      } else {
        setTumanCart(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && token) {
      refreshCart('tuman');
      refreshCart('maxalla');
    } else {
      setTumanCart(null);
      setMaxallaCart(null);
    }
  }, [isAuthenticated, token, refreshCart]);

  const addToCart = async (productId: string, quantity: number = 1, productType: 'tuman' | 'maxalla' = 'tuman') => {
    if (!token || !isAuthenticated) {
      Alert.alert('Kirish kerak', 'Korzinkaga qo\'shish uchun tizimga kiring');
      return;
    }

    try {
      const response = await apiService.addToCart(productId, quantity, token, productType);
      if (productType === 'maxalla') {
        setMaxallaCart(response.data);
      } else {
        setTumanCart(response.data);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Korzinkaga qo\'shishda xatolik yuz berdi');
      throw error;
    }
  };

  const updateCartItem = async (productId: string, quantity: number, productType: 'tuman' | 'maxalla' = 'tuman') => {
    if (!token || !isAuthenticated) {
      return;
    }

    try {
      const response = await apiService.updateCartItem(productId, quantity, token, productType);
      if (productType === 'maxalla') {
        setMaxallaCart(response.data);
      } else {
        setTumanCart(response.data);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Korzinka yangilashda xatolik yuz berdi');
      throw error;
    }
  };

  const removeFromCart = async (productId: string, productType: 'tuman' | 'maxalla' = 'tuman') => {
    if (!token || !isAuthenticated) {
      return;
    }

    try {
      const response = await apiService.removeFromCart(productId, token, productType);
      if (productType === 'maxalla') {
        setMaxallaCart(response.data);
      } else {
        setTumanCart(response.data);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Korzinkadan olib tashlashda xatolik yuz berdi');
      throw error;
    }
  };

  const clearCart = async (productType: 'tuman' | 'maxalla' = 'tuman') => {
    if (!token || !isAuthenticated) {
      return;
    }

    try {
      const response = await apiService.clearCart(token, productType);
      if (productType === 'maxalla') {
        setMaxallaCart(response.data);
      } else {
        setTumanCart(response.data);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Korzinka tozalashda xatolik yuz berdi');
      throw error;
    }
  };

  const getCartItemQuantity = (productId: string, productType: 'tuman' | 'maxalla' = 'tuman'): number => {
    const cart = productType === 'maxalla' ? maxallaCart : tumanCart;
    if (!cart || !cart.items) return 0;
    const item = cart.items.find((item) => item.product._id === productId);
    return item ? item.quantity : 0;
  };

  const getCart = (productType: 'tuman' | 'maxalla' = 'tuman'): Cart | null => {
    return productType === 'maxalla' ? maxallaCart : tumanCart;
  };

  const totalItems = (tumanCart?.totalItems || 0) + (maxallaCart?.totalItems || 0);

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
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}






