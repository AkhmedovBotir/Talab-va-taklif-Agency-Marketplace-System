import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { kpiAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import {
  TrendingUp,
  AccountBalance,
  CheckCircle,
  PendingActions,
  Store,
  LocationCity,
  SwapHoriz,
} from '@mui/icons-material';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

const StatCard = ({ icon: Icon, label, value, color, subValue }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-lg border border-gray-200 p-4"
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
        {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
      </div>
    </div>
  </motion.div>
);

const KPIStatisticsSection = () => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await kpiAPI.getStatistics(params);
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      showError(error.message || 'Statistikani yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchStatistics();
  };

  const handleResetFilters = () => {
    setFilters({ startDate: '', endDate: '' });
    setTimeout(fetchStatistics, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boshlanish sanasi</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tugash sanasi</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
        >
          Qo'llash
        </button>
        <button
          onClick={handleResetFilters}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
        >
          Tozalash
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Jami transaksiyalar"
          value={formatNumber(statistics?.totalTransactions)}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={AccountBalance}
          label="Jami KPI summa"
          value={`${formatNumber(statistics?.totalKpiAmount)} so'm`}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={CheckCircle}
          label="To'langan"
          value={formatNumber(statistics?.paidTransactions)}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          icon={PendingActions}
          label="To'lanmagan"
          value={formatNumber(statistics?.unpaidTransactions)}
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Distribution Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Taqsimlash bo'yicha</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Store}
            label="Punktlar"
            value={`${formatNumber(statistics?.totalPunkt)} so'm`}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard
            icon={LocationCity}
            label="Agentlar"
            value={`${formatNumber(statistics?.totalAgent || statistics?.totalViloyatAgent || statistics?.totalTumanAgent || statistics?.totalMfyAgent)} so'm`}
            color="bg-indigo-100 text-indigo-600"
          />
          <StatCard
            icon={AccountBalance}
            label="Moliya"
            value={`${formatNumber(statistics?.totalFinance)} so'm`}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            icon={SwapHoriz}
            label="Punkt transfer"
            value={`${formatNumber(statistics?.totalPunktTransfer)} so'm`}
            color="bg-orange-100 text-orange-600"
          />
        </div>
      </div>
    </div>
  );
};

export default KPIStatisticsSection;













