import type { ServiceAccessData } from './api';

type Listener = (access: ServiceAccessData) => void;

const listeners = new Set<Listener>();

export function subscribeServiceAccessUpdate(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyServiceAccessUpdate(access: ServiceAccessData): void {
  listeners.forEach((listener) => listener(access));
}
