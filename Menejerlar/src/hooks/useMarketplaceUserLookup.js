import { useState, useEffect, useCallback } from 'react';
import { getMarketplaceUsers } from '../services/api';

export function formatMarketplaceUserName(user) {
  if (!user) return null;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return name || null;
}

export function useMarketplaceUserLookup() {
  const [userMap, setUserMap] = useState(() => new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        const map = new Map();
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages && page <= 50) {
          const response = await getMarketplaceUsers({ page, limit: 100 });
          (response.data || []).forEach((u) => {
            const name = formatMarketplaceUserName(u);
            if (u?.id != null) {
              map.set(String(u.id), name || `#${u.id}`);
            }
          });
          totalPages = response.totalPages || 1;
          page += 1;
          if ((response.data || []).length === 0) break;
        }

        if (!cancelled) {
          setUserMap(map);
        }
      } catch {
        /* lookup ixtiyoriy */
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const getUserName = useCallback(
    (userId, fallbackFields) => {
      if (fallbackFields?.user_name) return fallbackFields.user_name;
      if (fallbackFields?.user_first_name || fallbackFields?.user_last_name) {
        const n = [fallbackFields.user_first_name, fallbackFields.user_last_name]
          .filter(Boolean)
          .join(' ')
          .trim();
        if (n) return n;
      }
      if (userId == null || userId === '') return '-';
      return userMap.get(String(userId)) || '-';
    },
    [userMap]
  );

  return { ready, getUserName };
}
