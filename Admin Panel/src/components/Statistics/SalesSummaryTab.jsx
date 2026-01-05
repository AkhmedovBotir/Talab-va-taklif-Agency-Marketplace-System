import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { salesStatsAPI, regionAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import RegionSelect from '../Regions/RegionSelect';
import {
  TrendingUp,
  ShoppingCart,
  AttachMoney,
  Inventory,
  Assessment,
} from '@mui/icons-material';
import HorizontalBarChart from './HorizontalBarChart';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

import { formatDate } from '../../utils/dateFormatter';

const orderStatusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'confirmed_by_punkt', label: 'Punkt tasdiqlagan' },
  { value: 'requested_to_contragent', label: 'Contragentga so\'rov yuborilgan' },
  { value: 'accepted_by_contragent', label: 'Contragent tomonidan qabul qilingan' },
  { value: 'delivered_to_punkt', label: 'Punktga yetkazilgan' },
  { value: 'assigned_to_agent', label: 'Agentga yuborilgan' },
  { value: 'confirmed_by_agent', label: 'Agent tomonidan tasdiqlangan' },
  { value: 'confirmed_by_customer', label: 'Mijoz tomonidan tasdiqlangan' },
  { value: 'cancelled', label: 'Bekor qilingan' },
];

const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-lg border border-gray-200 p-4"
  >
    <div className="flex items-center gap-3">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
        {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
      </div>
    </div>
  </motion.div>
);

const SalesSummaryTab = () => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    viloyatId: '',
    tumanId: '',
    mfyId: '',
    status: 'confirmed_by_customer',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.viloyatId) params.viloyatId = filters.viloyatId;
      if (filters.tumanId) params.tumanId = filters.tumanId;
      if (filters.mfyId) params.mfyId = filters.mfyId;
      if (filters.status) params.status = filters.status;

      const response = await salesStatsAPI.getSummary(params);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      showError(error.message || 'Statistikani yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (filters.viloyatId) {
      setFilters(prev => ({ ...prev, tumanId: '', mfyId: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.viloyatId]);

  useEffect(() => {
    if (filters.tumanId) {
      setFilters(prev => ({ ...prev, mfyId: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.tumanId]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchData();
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      viloyatId: '',
      tumanId: '',
      mfyId: '',
      status: 'confirmed_by_customer',
    });
    setTimeout(fetchData, 0);
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
      <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boshlanish</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tugash</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <RegionSelect
            name="viloyatId"
            value={filters.viloyatId}
            onChange={(e) => {
              handleFilterChange('viloyatId', e.target.value);
              handleFilterChange('tumanId', '');
              handleFilterChange('mfyId', '');
            }}
            label="Viloyat"
            type="region"
          />
        </div>
        <div>
          <RegionSelect
            name="tumanId"
            value={filters.tumanId}
            onChange={(e) => {
              handleFilterChange('tumanId', e.target.value);
              handleFilterChange('mfyId', '');
            }}
            label="Tuman"
            type="district"
            parentId={filters.viloyatId || undefined}
            disabled={!filters.viloyatId}
          />
        </div>
        <div>
          <RegionSelect
            name="mfyId"
            value={filters.mfyId}
            onChange={(e) => handleFilterChange('mfyId', e.target.value)}
            label="MFY"
            type="mfy"
            parentId={filters.tumanId || undefined}
            disabled={!filters.tumanId}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {orderStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={ShoppingCart}
          label="Jami buyurtmalar"
          value={formatNumber(data?.summary?.totalOrders)}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={AttachMoney}
          label="Jami daromad"
          value={`${formatNumber(data?.summary?.totalRevenue)} so'm`}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={Inventory}
          label="Jami mahsulotlar"
          value={formatNumber(data?.summary?.totalItems)}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="O'rtacha buyurtma"
          value={`${formatNumber(data?.summary?.avgOrderValue)} so'm`}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          icon={Assessment}
          label="Min buyurtma"
          value={`${formatNumber(data?.summary?.minOrderValue)} so'm`}
          color="bg-cyan-100 text-cyan-600"
        />
        <StatCard
          icon={Assessment}
          label="Max buyurtma"
          value={`${formatNumber(data?.summary?.maxOrderValue)} so'm`}
          color="bg-rose-100 text-rose-600"
        />
      </div>

      {/* Status Breakdown Chart */}
      {data?.statusBreakdown?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status bo'yicha daromad</h3>
          <HorizontalBarChart
            data={data.statusBreakdown}
            labelKey={(item) => orderStatusOptions.find(o => o.value === item.status)?.label || item.status}
            valueKey="revenue"
            color="bg-green-500"
            formatValue={(v) => `${formatNumber(v)} so'm`}
          />
        </div>
      )}

      {/* Daily Stats Chart */}
      {data?.dailyStats?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Kunlik daromad</h3>
          <div className="max-h-[500px] overflow-y-auto">
            <HorizontalBarChart
              data={data.dailyStats.slice(0, 30)}
              labelKey={(item) => formatDate(item.date)}
              valueKey="totalRevenue"
              color="bg-indigo-500"
              formatValue={(v) => `${formatNumber(v)} so'm`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesSummaryTab;

