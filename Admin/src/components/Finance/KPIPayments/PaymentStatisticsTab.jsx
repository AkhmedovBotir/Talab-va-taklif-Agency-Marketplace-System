import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { kpiPaymentAPI } from '../../../services/api';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { formatDateRange } from '../../../utils/dateFormatter';
import { Refresh } from '@mui/icons-material';
import FinanceReportCard from '../../Finance/FinanceReportCard';
import { TrendingUp, TrendingDown, People, Store } from '@mui/icons-material';

const PaymentStatisticsTab = () => {
  const { showError } = useSnackbar();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await kpiPaymentAPI.getStatistics(params);
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      showError(err.message || 'Statistikani yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [startDate, endDate]);

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  return (
    <div>
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Boshlanish sanasi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tugash sanasi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button
            onClick={fetchStatistics}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Refresh className="w-4 h-4" />
            Yangilash
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      ) : statistics ? (
        <>
          {/* Period Info */}
          {statistics.period && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6"
            >
              <span className="text-sm text-indigo-900">
                {formatDateRange(statistics.period.startDate, statistics.period.endDate)}
              </span>
            </motion.div>
          )}

          {/* Main Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <FinanceReportCard
              title="To'lanmagan To'lovlar"
              value={formatAmount(statistics.unpaid?.totalAmount)}
              icon={TrendingDown}
              color="bg-orange-500"
              subtitle={`${statistics.unpaid?.count || 0} ta to'lov`}
            />
            <FinanceReportCard
              title="To'langan To'lovlar"
              value={formatAmount(statistics.paid?.totalAmount)}
              icon={TrendingUp}
              color="bg-green-500"
              subtitle={`${statistics.paid?.count || 0} ta to'lov`}
            />
          </div>

          {/* By Recipient Type */}
          {statistics.byRecipientType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Qabul qiluvchi turi bo'yicha</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <People className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Agentlar</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatAmount(statistics.byRecipientType.agent?.totalAmount)}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {statistics.byRecipientType.agent?.count || 0} ta to'lov
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Punktlar</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatAmount(statistics.byRecipientType.punkt?.totalAmount)}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    {statistics.byRecipientType.punkt?.count || 0} ta to'lov
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* By Agent Type */}
          {statistics.byAgentType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Agent turi bo'yicha</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statistics.byAgentType.viloyat && (
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Viloyat Agentlari</div>
                    <p className="text-xl font-bold text-indigo-900">
                      {formatAmount(statistics.byAgentType.viloyat.totalAmount)}
                    </p>
                    <p className="text-sm text-indigo-700 mt-1">
                      {statistics.byAgentType.viloyat.count || 0} ta to'lov
                    </p>
                  </div>
                )}
                {statistics.byAgentType.tuman && (
                  <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Tuman Agentlari</div>
                    <p className="text-xl font-bold text-cyan-900">
                      {formatAmount(statistics.byAgentType.tuman.totalAmount)}
                    </p>
                    <p className="text-sm text-cyan-700 mt-1">
                      {statistics.byAgentType.tuman.count || 0} ta to'lov
                    </p>
                  </div>
                )}
                {statistics.byAgentType.mfy && (
                  <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">MFY Agentlari</div>
                    <p className="text-xl font-bold text-teal-900">
                      {formatAmount(statistics.byAgentType.mfy.totalAmount)}
                    </p>
                    <p className="text-sm text-teal-700 mt-1">
                      {statistics.byAgentType.mfy.count || 0} ta to'lov
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-center text-gray-500">Ma'lumotlar topilmadi</p>
        </div>
      )}
    </div>
  );
};

export default PaymentStatisticsTab;

