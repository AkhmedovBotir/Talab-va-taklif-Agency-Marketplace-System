export const TOKEN_KEY = '@maxalla:token';
export const USER_KEY = '@maxalla:user';

export function clearAuthStorage() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

export const FORCE_LOGOUT_EVENT = 'maxalla:force-logout';

export function emitForceLogout(reason?: string) {
  try {
    window.dispatchEvent(new CustomEvent(FORCE_LOGOUT_EVENT, { detail: { reason } }));
  } catch {}
}

