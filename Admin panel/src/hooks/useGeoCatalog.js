import { useEffect, useState } from 'react';
import { districtAPI, mfyAPI, regionAPI } from '../services/api';
import { resolvePageError } from '../utils/apiError';
import usePermissions from './usePermissions';

/**
 * Hudud ma’lumotlari — faqat `hududlar` ruxsati bo‘lsa API chaqiriladi.
 */
const useGeoCatalog = () => {
  const { can } = usePermissions();
  const enabled = can('hududlar');

  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mfys, setMfys] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setRegions([]);
      setDistricts([]);
      setMfys([]);
      setGeoError(null);
      setGeoLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setGeoLoading(true);
      setGeoError(null);
      try {
        const [r, d, m] = await Promise.all([
          regionAPI.getAllRegions(),
          districtAPI.getAllDistricts(),
          mfyAPI.getAllMFYs(),
        ]);
        if (cancelled) return;
        if (r.success) setRegions(r.data || []);
        if (d.success) setDistricts(d.data || []);
        if (m.success) setMfys(m.data || []);
      } catch (e) {
        if (!cancelled) {
          const pe = resolvePageError(e);
          if (pe) setGeoError(pe);
        }
      } finally {
        if (!cancelled) setGeoLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    regions,
    districts,
    mfys,
    geoLoading,
    geoError,
    geoEnabled: enabled,
  };
};

export default useGeoCatalog;
