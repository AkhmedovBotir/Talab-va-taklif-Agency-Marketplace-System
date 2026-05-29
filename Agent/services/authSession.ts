/** 401 yoki yaroqsiz token — AuthContext va navigatsiya tinglovchilari */
type UnauthorizedListener = () => void;

const listeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitUnauthorized(): void {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('onUnauthorized listener error:', e);
    }
  });
}

export function isProtectedRoute(segments: readonly string[]): boolean {
  const root = segments[0];
  return root === '(tabs)' || root === 'kpi' || root === 'order';
}
