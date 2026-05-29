import { Platform, Alert } from 'react-native';

export type UserMessageType = 'success' | 'error' | 'info';

export type UserMessageOptions = {
  type?: UserMessageType;
  title?: string;
  message: string;
};

type WebToastItem = UserMessageOptions & { id: string };

const WEB_TOAST_TTL_MS = 4500;
let webToasts: WebToastItem[] = [];
const webToastListeners = new Set<() => void>();
const webToastTimers = new Map<string, ReturnType<typeof setTimeout>>();

function defaultTitle(type: UserMessageType): string {
  if (type === 'error') return 'Xatolik';
  if (type === 'success') return 'Muvaffaqiyat';
  return 'Xabar';
}

function notifyWebToastListeners() {
  webToastListeners.forEach((fn) => fn());
}

function removeWebToast(id: string) {
  const timer = webToastTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    webToastTimers.delete(id);
  }
  webToasts = webToasts.filter((t) => t.id !== id);
  notifyWebToastListeners();
}

function enqueueWebToast(opts: UserMessageOptions) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const item: WebToastItem = {
    id,
    type: opts.type ?? 'info',
    title: opts.title,
    message: opts.message,
  };
  webToasts = [...webToasts, item].slice(-4);
  notifyWebToastListeners();
  webToastTimers.set(
    id,
    setTimeout(() => removeWebToast(id), WEB_TOAST_TTL_MS)
  );
}

export function subscribeWebToasts(listener: () => void): () => void {
  webToastListeners.add(listener);
  return () => webToastListeners.delete(listener);
}

export function getWebToasts(): readonly WebToastItem[] {
  return webToasts;
}

export function dismissWebToast(id: string) {
  removeWebToast(id);
}

/** Native: Alert; Web: toast banner (Expo web va React Router). */
export function showUserMessage(opts: UserMessageOptions) {
  const type = opts.type ?? 'info';
  const title = opts.title ?? defaultTitle(type);
  const message = opts.message;

  if (Platform.OS === 'web') {
    enqueueWebToast({ type, title, message });
    return;
  }
  Alert.alert(title, message);
}

export const PARTNER_REQUEST_SUCCESS_MSG =
  "Hamkorlik so'rovi muvaffaqiyatli yuborildi. Tez orada siz bilan bog'lanamiz.";
