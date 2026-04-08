import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LocalShopCartItem, Product } from '../types';
import { api, parsePositiveProductId, requestAuthLogin, hasMarketplaceSession } from '../services/api';

export interface WebCartItem extends Omit<Product, 'quantity'> {
  quantity: number;
  availableStock: number;
  cartLineId?: number;
}

type WebCartContextValue = {
  cart: WebCartItem[];
  localCart: LocalShopCartItem[];
  setCart: (rows: WebCartItem[]) => void;
  addToCart: (product: Product) => void;
  addLocalToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  removeLocalFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  updateLocalQuantity: (productId: string, delta: number) => void;
  clearCart: () => Promise<void>;
  clearLocalCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
  localCartTotal: number;
  localCartCount: number;
  refreshCart: () => Promise<void>;
};

const WebCartContext = createContext<WebCartContextValue | null>(null);

function notifyWeb(msg: string) {
  if (typeof window !== 'undefined') window.alert(msg);
}

function maybeTriggerAuth(error: unknown) {
  const msg = error instanceof Error ? error.message : '';
  if (/kirish kerak|token/i.test(msg)) requestAuthLogin();
}

export function WebCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<WebCartItem[]>([]);
  const [localCart, setLocalCart] = useState<LocalShopCartItem[]>([]);
  const cartRef = useRef<WebCartItem[]>([]);
  const localCartRef = useRef<LocalShopCartItem[]>([]);
  cartRef.current = cart;
  localCartRef.current = localCart;

  const refreshCart = useCallback(async () => {
    if (!(await hasMarketplaceSession())) {
      setCart([]);
      setLocalCart([]);
      return;
    }
    try {
      const [rows, localRows] = await Promise.all([api.cart.get(), api.localShopCart.get()]);
      setCart(rows);
      setLocalCart(localRows);
    } catch {
      setCart([]);
      setLocalCart([]);
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
        maybeTriggerAuth(e);
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
        maybeTriggerAuth(e);
        notifyWeb(e instanceof Error ? e.message : "O'chirib bo'lmadi");
      }
    })();
  }, []);

  const addLocalToCart = useCallback((product: Product) => {
    void (async () => {
      try {
        if ((Number(product.quantity) || 0) <= 0) {
          notifyWeb('Omborda bu mahsulot mavjud emas.');
          return;
        }
        const pid = parsePositiveProductId(product.id);
        if (pid == null) {
          notifyWeb("Mahsulot ID noto'g'ri.");
          return;
        }
        const next = await api.localShopCart.addItem(pid, 1);
        setLocalCart(next);
      } catch (e) {
        maybeTriggerAuth(e);
        notifyWeb(e instanceof Error ? e.message : "Mahalla savatiga qo'shib bo'lmadi");
      }
    })();
  }, []);

  const removeLocalFromCart = useCallback((productId: string) => {
    void (async () => {
      const line = localCartRef.current.find((item) => String(item.id) === String(productId));
      if (line?.cartLineId == null) {
        notifyWeb("Mahalla savat qatori topilmadi.");
        return;
      }
      try {
        const next = await api.localShopCart.removeLine(line.cartLineId);
        setLocalCart(next);
      } catch (e) {
        maybeTriggerAuth(e);
        notifyWeb(e instanceof Error ? e.message : "O'chirib bo'lmadi");
      }
    })();
  }, []);

  const clearCart = useCallback(async () => {
    try {
      const next = await api.cart.clear();
      setCart(next);
    } catch (e) {
      maybeTriggerAuth(e);
      setCart([]);
    }
  }, []);

  const clearLocalCart = useCallback(async () => {
    try {
      const next = await api.localShopCart.clear();
      setLocalCart(next);
    } catch (e) {
      maybeTriggerAuth(e);
      setLocalCart([]);
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
        maybeTriggerAuth(e);
        notifyWeb(e instanceof Error ? e.message : 'Miqdorni yangilab bo‘lmadi');
      }
    })();
  }, []);

  const updateLocalQuantity = useCallback((productId: string, delta: number) => {
    void (async () => {
      const line = localCartRef.current.find((item) => String(item.id) === String(productId));
      if (line?.cartLineId == null) {
        notifyWeb("Mahalla savat qatori topilmadi.");
        return;
      }
      const newQty = line.quantity + delta;
      try {
        if (newQty < 1) {
          const next = await api.localShopCart.removeLine(line.cartLineId);
          setLocalCart(next);
        } else {
          const next = await api.localShopCart.setLineQuantity(line.cartLineId, newQty);
          setLocalCart(next);
        }
      } catch (e) {
        maybeTriggerAuth(e);
        notifyWeb(e instanceof Error ? e.message : 'Miqdorni yangilab bo‘lmadi');
      }
    })();
  }, []);

  const setCartFromApi = useCallback((rows: WebCartItem[]) => {
    setCart(rows);
  }, []);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const localCartTotal = useMemo(() => localCart.reduce((sum, item) => sum + item.price * item.quantity, 0), [localCart]);
  const localCartCount = useMemo(() => localCart.reduce((sum, item) => sum + item.quantity, 0), [localCart]);

  const value = useMemo(
    () => ({
      cart,
      localCart,
      setCart: setCartFromApi,
      addToCart,
      addLocalToCart,
      removeFromCart,
      removeLocalFromCart,
      updateQuantity,
      updateLocalQuantity,
      clearCart,
      clearLocalCart,
      cartTotal,
      cartCount,
      localCartTotal,
      localCartCount,
      refreshCart,
    }),
    [
      cart,
      localCart,
      setCartFromApi,
      addToCart,
      addLocalToCart,
      removeFromCart,
      removeLocalFromCart,
      updateQuantity,
      updateLocalQuantity,
      clearCart,
      clearLocalCart,
      cartTotal,
      cartCount,
      localCartTotal,
      localCartCount,
      refreshCart,
    ]
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
