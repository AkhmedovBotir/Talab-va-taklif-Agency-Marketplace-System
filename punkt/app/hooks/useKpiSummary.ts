import { useState, useEffect, useCallback } from 'react';
import { apiService, PunktKpiTodayResponse } from '../services/api';

export interface KpiSummary {
  totalTransactions: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  totalKpiPool?: number;
  dateUtc?: string;
}

/**
 * Profil va boshqa joylar uchun bugungi KPI (`GET /punkts/me/kpi/today`).
 * Eski `getKpiSummary` oralig‘i o‘rniga faqat serverdagi “bugun” hisobi.
 */
export function useKpiSummary(_params?: {
  startDate?: string;
  endDate?: string;
  isPaid?: boolean;
}) {
  const [summary, setSummary] = useState<KpiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PunktKpiTodayResponse = await apiService.getPunktKpiToday();
      const d = response.data;
      if (d) {
        setSummary({
          totalTransactions: d.delivered_orders,
          totalAmount: d.punkt_kpi_total,
          paidAmount: d.paid_total_today,
          unpaidAmount: d.unpaid_today,
          totalKpiPool: d.total_kpi_pool,
          dateUtc: d.date_utc,
        });
      } else {
        setSummary(null);
      }
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      const msg = e?.message || '';
      const missing =
        e?.status === 404 ||
        /topilmadi|not found|endpoint/i.test(msg);
      if (!missing) {
        console.error('Error fetching punkt KPI today (summary):', err);
      }
      setError(missing ? null : msg || 'KPI summary yuklashda xatolik');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const refresh = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refresh,
  };
}
