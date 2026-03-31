import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../types';
import { api, parsePositiveProductId } from '../services/api';

export interface WebCartItem extends Omit<Product, 'quantity'> {
  quantity: number;
  availableStock: number;
  cartLineId?: number;
}

type WebCartContextValue = {
  cart: WebCartItem[];
  setCart: (rows: WebCartItem[]) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
  refreshCart: () => Promise<void>;
};

const WebCartContext = createContext<WebCartContextValue | null>(null);

function notifyWeb(msg: string) {
  if (typeof window !== 'undefined') window.alert(msg);
}

export function WebCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<WebCartItem[]>([]);
  const cartRef = useRef<WebCartItem[]>([]);
  cartRef.current = cart;

  const refreshCart = useCallback(async () => {
    try {
      const rows = await api.cart.get();
      setCart(rows);
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback((product: Product) => {
    void (async () => {
      try {
        if ((Number(product.quantity) || 0) <= 0) {
          notifyWeb('Omborda bu mahsulot mavjud emas.');
          return;
        }
        const pid = parsePositiveProductId(product.id);
        if (pid == null) {
          notifyWeb("Mahsulot ID noto'g'ri — backend raqamli product_id kutadi.");
          return;
        }
        const next = await api.cart.addItem(pid, 1);
        setCart(next);
      } catch (e) {
        notifyWeb(e instanceof Error ? e.message : "Savatga qo'shib bo'lmadi");
      }
    })();
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    void (async () => {
      const line = cartRef.current.find((item) => String(item.id) === String(productId));
      if (line?.cartLineId == null) {
        notifyWeb("Savat qatori topilmadi — sahifani yangilab ko'ring.");
        return;
      }
      try {
        const next = await api.cart.removeLine(line.cartLineId);
        setCart(next);
      } catch (e) {
        notifyWeb(e instanceof Error ? e.message : "O'chirib bo'lmadi");
      }
    })();
  }, []);

  const clearCart = useCallback(async () => {
    try {
      const next = await api.cart.clear();
      setCart(next);
    } catch {
      setCart([]);
    }
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    void (async () => {
      const line = cartRef.current.find((item) => String(item.id) === String(productId));
      if (line?.cartLineId == null) {
        notifyWeb("Savat qatori topilmadi — sahifani yangilab ko'ring.");
        return;
      }
      const newQty = line.quantity + delta;
      try {
        if (newQty < 1) {
          const next = await api.cart.removeLine(line.cartLineId);
          setCart(next);
        } else {
          const next = await api.cart.setLineQuantity(line.cartLineId, newQty);
          setCart(next);
        }
      } catch (e) {
        notifyWeb(e instanceof Error ? e.message : 'Miqdorni yangilab bo‘lmadi');
      }
    })();
  }, []);

  const setCartFromApi = useCallback((rows: WebCartItem[]) => {
    setCart(rows);
  }, []);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const value = useMemo(
    () => ({
      cart,
      setCart: setCartFromApi,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      refreshCart,
    }),
    [cart, setCartFromApi, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, refreshCart]
  );

  return <WebCartContext.Provider value={value}>{children}</WebCartContext.Provider>;
}

export function useWebCart(): WebCartContextValue {
  const ctx = useContext(WebCartContext);
  if (!ctx) {
    throw new Error('useWebCart faqat WebCartProvider ichida ishlatilishi kerak');
  }
  return ctx;
}
