import { useCallback, useEffect, useState } from 'react';
import { apiService, PunktKpiTodayResponse } from '../services/api';

export interface KpiBalance {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  paidTransactions: number;
  unpaidTransactions: number;
  totalKpiPool?: number;
}

/**
 * Bugungi punkt KPI (`GET /punkts/me/kpi/today`).
 * `date` parametri API da yo‘q — har doim joriy UTC kun hisobi.
 */
export function useKpiBalance(_date?: string) {
  const [balance, setBalance] = useState<KpiBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PunktKpiTodayResponse = await apiService.getPunktKpiToday();
      const d = response.data;
      if (d) {
        setBalance({
          date: d.date_utc,
          totalTransactions: d.delivered_orders,
          totalAmount: d.punkt_kpi_total,
          paidAmount: d.paid_total_today,
          unpaidAmount: d.unpaid_today,
          paidTransactions: d.payout_entries_today,
          unpaidTransactions: 0,
          totalKpiPool: d.total_kpi_pool,
        });
      } else {
        setBalance(null);
      }
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      const msg = e?.message || '';
      const missing =
        e?.status === 404 ||
        /topilmadi|not found|endpoint/i.test(msg);
      if (!missing) {
        console.error('Error fetching punkt KPI today:', err);
      }
      setError(missing ? null : msg || 'KPI ma’lumotini yuklashda xatolik');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const refresh = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refresh,
  };
}
