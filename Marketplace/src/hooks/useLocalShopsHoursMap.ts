import { useEffect, useState } from 'react';
import type { LocalShopWorkingHour } from '../types';
import { api } from '../services/api';

export function useLocalShopsHoursMap(shopIds: number[], enabled: boolean) {
  const [hoursByShopId, setHoursByShopId] = useState<Map<number, LocalShopWorkingHour[]>>(new Map());
  const [loading, setLoading] = useState(false);

  const idsKey = shopIds.filter((id) => id > 0).sort((a, b) => a - b).join(',');

  useEffect(() => {
    if (!enabled || !idsKey) {
      setHoursByShopId(new Map());
      setLoading(false);
      return;
    }

    const ids = idsKey.split(',').map((s) => Number(s));
    let cancelled = false;
    setLoading(true);

    void api.localShops
      .getWorkingHoursMap(ids)
      .then((map) => {
        if (!cancelled) setHoursByShopId(map);
      })
      .catch(() => {
        if (!cancelled) setHoursByShopId(new Map());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, idsKey]);

  return { hoursByShopId, loading };
}
