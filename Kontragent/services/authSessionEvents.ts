/** Token bilan so‘rov 401/403 qaytarganda — sessiyani tozalash va UI xabari */
const listeners = new Set<(message?: string) => void>();
let notifying = false;

export function subscribeAuthUnauthorized(listener: (message?: string) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyAuthUnauthorized(message?: string) {
  if (notifying) return;
  notifying = true;
  for (const fn of listeners) {
    try {
      fn(message);
    } catch {
      // ignore
    }
  }
  setTimeout(() => {
    notifying = false;
  }, 2500);
}
