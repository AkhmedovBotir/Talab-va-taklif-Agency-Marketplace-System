import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import apiService, { Cart, CartItem } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  totalItems: number;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setCart(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.getCart(token);
      setCart(response.data);
    } catch (error: any) {
      console.error('Error loading cart:', error);
      // Don't show error if cart doesn't exist (it will be created on first add)
      if (error.message && !error.message.includes('topilmadi')) {
        // Only show error if it's not a "not found" error
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && token) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated, token, refreshCart]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!token || !isAuthenticated) {
      Alert.alert('Kirish kerak', 'Korzinkaga qo\'shish uchun tizimga kiring');
      return;
    }

    try {
      const response = await apiService.addToCart(productId, quantity, token);
      setCart(response.data);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      Alert.alert('Xatolik', error.message || 'Korzinkaga qo\'shishda xatolik yuz berdi');
      throw error;
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    if (!token || !isAuthenticated) {
      return;
    }

    try {
      const response = await apiService.updateCartItem(productId, quantity, token);
      setCart(response.data);
    } catch (error: any) {
      console.error('Error updating cart item:', error);
      Alert.alert('Xatolik', error.message || 'Korzinka yangilashda xatolik yuz berdi');
      throw error;
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!token || !isAuthenticated) {
      return;
    }

    try {
      const response = await apiService.removeFromCart(productId, token);
      setCart(response.data);
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      Alert.alert('Xatolik', error.message || 'Korzinkadan olib tashlashda xatolik yuz berdi');
      throw error;
    }
  };

  const clearCart = async () => {
    if (!token || !isAuthenticated) {
      return;
    }

    try {
      const response = await apiService.clearCart(token);
      setCart(response.data);
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      Alert.alert('Xatolik', error.message || 'Korzinka tozalashda xatolik yuz berdi');
      throw error;
    }
  };

  const getCartItemQuantity = (productId: string): number => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find((item) => item.product._id === productId);
    return item ? item.quantity : 0;
  };

  const totalItems = cart?.totalItems || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        totalItems,
        refreshCart,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        getCartItemQuantity,
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






