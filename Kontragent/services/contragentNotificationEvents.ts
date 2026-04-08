/** Bitta WebSocket ulanishi orqali inboxni yangilash (tab badge + habarlar ro'yxati). */
const listeners = new Set<() => void>();

export function subscribeContragentNotificationInbox(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyContragentNotificationInbox() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // ignore subscriber errors
    }
  }
}
