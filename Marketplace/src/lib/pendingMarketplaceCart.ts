import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ID_KEY = 'marketplace_pending_cart_product_id';
const KIND_KEY = 'marketplace_pending_cart_kind';

export type PendingCartKind = 'marketplace' | 'local';

export async function setPendingCartProduct(id: string, kind: PendingCartKind = 'marketplace'): Promise<void> {
  const value = String(id).trim();
  if (!value) return;
  await AsyncStorage.setItem(ID_KEY, value);
  await AsyncStorage.setItem(KIND_KEY, kind);
  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(ID_KEY, value);
    sessionStorage.setItem(KIND_KEY, kind);
  }
}

export async function takePendingCartProduct(): Promise<{ id: string; kind: PendingCartKind } | null> {
  let id: string | null = null;
  let kind: PendingCartKind = 'marketplace';

  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
    id = sessionStorage.getItem(ID_KEY);
    kind = (sessionStorage.getItem(KIND_KEY) as PendingCartKind | null) ?? 'marketplace';
    if (id) {
      sessionStorage.removeItem(ID_KEY);
      sessionStorage.removeItem(KIND_KEY);
    }
  }

  if (!id) {
    id = await AsyncStorage.getItem(ID_KEY);
    kind = ((await AsyncStorage.getItem(KIND_KEY)) as PendingCartKind | null) ?? 'marketplace';
    if (id) {
      await AsyncStorage.removeItem(ID_KEY);
      await AsyncStorage.removeItem(KIND_KEY);
    }
  }

  if (!id) return null;
  return { id, kind: kind === 'local' ? 'local' : 'marketplace' };
}

/** @deprecated — `setPendingCartProduct` ishlating */
export async function setPendingCartProductId(id: string): Promise<void> {
  await setPendingCartProduct(id, 'marketplace');
}

/** @deprecated — `takePendingCartProduct` ishlating */
export async function takePendingCartProductId(): Promise<string | null> {
  const pending = await takePendingCartProduct();
  return pending?.id ?? null;
}
