import { useState, useEffect, useCallback, useRef } from 'react';
import { getNoAuthRegions, getTumans, getMfys } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const toId = (value) => (value == null || value === '' ? null : String(value));

export function useGeoLookup(items = []) {
  const { user } = useAuth();
  const managerRegionId =
    user?.viloyat_id || user?.region_id || user?.region?.id;

  const [regionMap, setRegionMap] = useState(() => new Map());
  const [districtMap, setDistrictMap] = useState(() => new Map());
  const [mfyMap, setMfyMap] = useState(() => new Map());
  const [ready, setReady] = useState(false);
  const loadedMfyDistrictsRef = useRef(new Set());

  useEffect(() => {
    let cancelled = false;

    const loadBase = async () => {
      try {
        const regionsRes = await getNoAuthRegions();
        const regions = regionsRes?.data || regionsRes?.regions || regionsRes || [];
        const rMap = new Map();
        if (Array.isArray(regions)) {
          regions.forEach((r) => {
            const id = toId(r?.id);
            if (id && r?.name) rMap.set(id, r.name);
          });
        }

        let dMap = new Map();
        if (managerRegionId) {
          const tumansRes = await getTumans({ region_id: managerRegionId });
          (tumansRes?.data || []).forEach((d) => {
            const id = toId(d?.id);
            if (id && d?.name) dMap.set(id, d.name);
          });
        }

        if (!cancelled) {
          setRegionMap(rMap);
          setDistrictMap(dMap);
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    };

    loadBase();
    return () => {
      cancelled = true;
    };
  }, [managerRegionId]);

  useEffect(() => {
    if (!ready) return;

    const districtIds = new Set();
    items.forEach((item) => {
      const did = toId(item?.tuman_id || item?.district_id);
      if (did) districtIds.add(did);
    });

    const toLoad = [...districtIds].filter((id) => !loadedMfyDistrictsRef.current.has(id));
    if (toLoad.length === 0) return;

    let cancelled = false;

    const loadMfys = async () => {
      const updates = new Map();
      await Promise.all(
        toLoad.map(async (districtId) => {
          try {
            const res = await getMfys({ district_id: districtId });
            (res?.data || []).forEach((m) => {
              const id = toId(m?.id);
              if (id && m?.name) updates.set(id, m.name);
            });
            loadedMfyDistrictsRef.current.add(districtId);
          } catch {
            loadedMfyDistrictsRef.current.add(districtId);
          }
        })
      );

      if (!cancelled && updates.size > 0) {
        setMfyMap((prev) => {
          const next = new Map(prev);
          updates.forEach((name, id) => next.set(id, name));
          return next;
        });
      }
    };

    loadMfys();
    return () => {
      cancelled = true;
    };
  }, [items, ready]);

  const regionName = useCallback(
    (id, item) => {
      if (item?.viloyat?.name || item?.region?.name) {
        return item.viloyat.name || item.region.name;
      }
      const key = toId(id ?? item?.viloyat_id ?? item?.region_id);
      if (!key) return '-';
      return regionMap.get(key) || '-';
    },
    [regionMap]
  );

  const districtName = useCallback(
    (id, item) => {
      if (item?.tuman?.name || item?.district?.name) {
        return item.tuman?.name || item.district?.name;
      }
      const key = toId(id ?? item?.tuman_id ?? item?.district_id);
      if (!key) return '-';
      return districtMap.get(key) || '-';
    },
    [districtMap]
  );

  const mfyName = useCallback(
    (id, item) => {
      if (item?.mfy?.name) return item.mfy.name;
      const key = toId(id ?? item?.mfy_id);
      if (!key) return '-';
      return mfyMap.get(key) || '-';
    },
    [mfyMap]
  );

  return { ready, regionName, districtName, mfyName };
}
