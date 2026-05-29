/** Faqat shu yo‘llar / tablar ochilganda login talab qilinadi. */
export const AUTH_PROTECTED_ROUTE_NAMES = ['profile', 'cart', 'checkout'] as const;

export function isAuthProtectedPathname(pathname: string): boolean {
  return /(^|\/)(profile|cart|checkout)(\/?|$)/.test(pathname);
}

export function isAuthProtectedSegment(segments: string[]): boolean {
  const meaningful = segments.filter((s) => typeof s === 'string' && !s.startsWith('('));
  const last = meaningful[meaningful.length - 1] ?? '';
  return (AUTH_PROTECTED_ROUTE_NAMES as readonly string[]).includes(last);
}

export function requiresAuthForRoute(pathname: string, segments: string[] = []): boolean {
  return isAuthProtectedPathname(pathname) || isAuthProtectedSegment(segments);
}
