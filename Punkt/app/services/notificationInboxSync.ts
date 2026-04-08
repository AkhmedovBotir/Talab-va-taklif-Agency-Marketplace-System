/** Profil/tab badge (`useUnreadNotifications`) ro‘yxat ekranidagi o‘qish bilan sinxronlansin */

type SyncFn = () => void;
const listeners = new Set<SyncFn>();

export function subscribeNotificationInboxSync(fn: SyncFn): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function requestNotificationInboxSync(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}
