import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getMarketplaceToken, subscribeMarketplaceSession } from '../services/api';

function readInitialSession(): boolean {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return !!localStorage.getItem('token');
  }
  return false;
}

/** Reaktiv kirish holati — mahsulot kartalarida mehmon / foydalanuvchi tugmalarini ajratish uchun. */
export function useMarketplaceSession(): boolean {
  const [hasSession, setHasSession] = useState(readInitialSession);

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const token = await getMarketplaceToken();
      if (!cancelled) setHasSession(!!token);
    };
    void sync();
    return subscribeMarketplaceSession(() => {
      void sync();
    });
  }, []);

  return hasSession;
}
