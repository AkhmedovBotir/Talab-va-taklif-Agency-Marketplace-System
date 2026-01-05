import { useCallback, useEffect, useState } from 'react';
import { apiService, KpiBalanceResponse } from '../services/api';

interface KpiBalance {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  paidTransactions: number;
  unpaidTransactions: number;
}

export function useKpiBalance(date?: string) {
  const [balance, setBalance] = useState<KpiBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (targetDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response: KpiBalanceResponse = await apiService.getKpiBalance(targetDate);
      if (response.success && response.data) {
        setBalance({
          date: response.data.date,
          ...response.data.totals,
        });
      }
    } catch (err: any) {
      console.error('Error fetching KPI balance:', err);
      setError(err.message || 'Balansni yuklashda xatolik');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance(date);
  }, [date, fetchBalance]);

  const refresh = useCallback(() => {
    fetchBalance(date);
  }, [date, fetchBalance]);

  return {
    balance,
    loading,
    error,
    refresh,
  };
}

