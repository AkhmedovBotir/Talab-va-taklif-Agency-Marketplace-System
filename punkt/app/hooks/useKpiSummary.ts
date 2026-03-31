import { useState, useEffect, useCallback } from 'react';
import { apiService, KpiSummaryResponse } from '../services/api';

interface KpiSummary {
  totalTransactions: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

export function useKpiSummary(params?: {
  startDate?: string;
  endDate?: string;
  isPaid?: boolean;
}) {
  const [summary, setSummary] = useState<KpiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (queryParams?: typeof params) => {
    try {
      setLoading(true);
      setError(null);
      const response: KpiSummaryResponse = await apiService.getKpiSummary(queryParams || params);
      if (response.success && response.data) {
        setSummary(response.data.summary);
      }
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      const msg = e?.message || '';
      const missing =
        e?.status === 404 ||
        /topilmadi|not found|endpoint/i.test(msg);
      if (!missing) {
        console.error('Error fetching KPI summary:', err);
      }
      setError(missing ? null : msg || 'Summaryni yuklashda xatolik');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [params]);

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

