import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { financeAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import FinanceReportCard from '../../components/Finance/FinanceReportCard';
import { 
  AccountBalance, 
  TrendingUp, 
  TrendingDown, 
  AttachMoney, 
  Store, 
  LocationCity, 
  Business, 
  Home, 
  SwapHoriz,
  CalendarToday,
  Refresh
} from '@mui/icons-material';
import { formatDateRange } from '../../utils/dateFormatter';

const Balance = ({ hideHeader = false }) => {
  const { showError } = useSnackbar();
  const [balance, setBalance] = useState(null);
  const [totalReceived, setTotalReceived] = useState(null);
  const [totalDistributed, setTotalDistributed] = useState(null);
  const [financeKpi, setFinanceKpi] = useState(null);
  const [totalBalance, setTotalBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Barcha ma'lumotlarni parallel yuklash
      const [balanceRes, receivedRes, distributedRes, financeKpiRes, totalBalanceRes] = await Promise.all([
        financeAPI.getBalance(params),
        financeAPI.getTotalReceived(params),
        financeAPI.getTotalDistributed(params),
        financeAPI.getFinanceKpi(params),
        financeAPI.getTotalBalance(params),
      ]);

      if (balanceRes.success) setBalance(balanceRes.balance);
      if (receivedRes.success) setTotalReceived(receivedRes.data);
      if (distributedRes.success) setTotalDistributed(distributedRes.data);
      if (financeKpiRes.success) setFinanceKpi(financeKpiRes.data);
      if (totalBalanceRes.success) setTotalBalance(totalBalanceRes.data);
    } catch (err) {
      showError(err.message || 'Balans ma\'lumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [startDate, endDate]);

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  return (
    <div>
      {/* Header */}
      {!hideHeader && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <AccountBalance className="text-indigo-600" />
                Moliya Balansi
              </h1>
              <p className="text-gray-600">Moliya bo'limi balanslari va statistikasi</p>
            </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Boshlanish sanasi"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Tugash sanasi"
            />
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Refresh className="w-4 h-4" />
              Yangilash
            </button>
          </div>
        </div>
      </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      ) : balance ? (
        <>
          {/* Period Info */}
          {balance.period && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex items-center gap-2"
            >
              <CalendarToday className="text-indigo-600" />
              <span className="text-sm text-indigo-900">
                {formatDateRange(balance.period.startDate, balance.period.endDate)}
              </span>
            </motion.div>
          )}

          {/* Main Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <FinanceReportCard
              title="Umumiy Tushgan Summa"
              value={formatAmount(balance.totalReceived)}
              icon={TrendingUp}
              color="bg-green-500"
              subtitle={totalReceived ? `${totalReceived.totalOrders || 0} ta buyurtma` : ''}
            />
            <FinanceReportCard
              title="Tarqatilgan Summa"
              value={formatAmount(balance.totalDistributed)}
              icon={TrendingDown}
              color="bg-orange-500"
              subtitle={totalDistributed ? `${totalDistributed.transactionsCount || 0} ta transaksiya` : ''}
            />
            <FinanceReportCard
              title="Moliya Bo'limiga Ajratilgan"
              value={formatAmount(balance.totalFinanceKpi)}
              icon={AttachMoney}
              color="bg-blue-500"
              subtitle={financeKpi ? `${financeKpi.transactionsCount || 0} ta transaksiya` : ''}
            />
            <FinanceReportCard
              title="Umumiy Balans"
              value={formatAmount(balance.totalBalance)}
              icon={AccountBalance}
              color="bg-purple-500"
              subtitle="Tushgan - Tarqatilgan"
            />
            <FinanceReportCard
              title="Moliya Bo'limi Umumiy Balansi"
              value={formatAmount(balance.financeTotalBalance)}
              icon={AccountBalance}
              color="bg-indigo-500"
              subtitle="Tushgan + KPI Bonus"
            />
          </div>

          {/* Details Section */}
          {balance.details && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Tafsilotlar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Punkt</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatAmount(balance.details.punkt)}
                  </p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <LocationCity className="text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Viloyat Agent</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-900">
                    {formatAmount(balance.details.viloyatAgent)}
                  </p>
                </div>
                <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Business className="text-cyan-600" />
                    <span className="text-sm font-medium text-gray-700">Tuman Agent</span>
                  </div>
                  <p className="text-2xl font-bold text-cyan-900">
                    {formatAmount(balance.details.tumanAgent)}
                  </p>
                </div>
                <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="text-teal-600" />
                    <span className="text-sm font-medium text-gray-700">MFY Agent</span>
                  </div>
                  <p className="text-2xl font-bold text-teal-900">
                    {formatAmount(balance.details.mfyAgent)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AttachMoney className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Moliya Bo'limi</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {formatAmount(balance.details.finance)}
                  </p>
                </div>
                {balance.details.punktTransfer > 0 && (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <SwapHoriz className="text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Punkt Transfer</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      {formatAmount(balance.details.punktTransfer)}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Additional Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Balans Tushuntirishlari</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[200px]">Umumiy Tushgan Summa:</span>
                <span>Moliya bo'limiga tasdiqlangan to'lovlar jami summasi</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[200px]">Tarqatilgan Summa:</span>
                <span>KPI bonuslar bo'yicha tarqatilgan summa (punkt + agentlar)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[200px]">Moliya Bo'limiga Ajratilgan:</span>
                <span>KPI bonuslardan moliya bo'limiga ajratilgan qism</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[200px]">Umumiy Balans:</span>
                <span>Umumiy Tushgan Summa - Tarqatilgan Summa</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[200px]">Moliya Bo'limi Umumiy Balansi:</span>
                <span>Umumiy Tushgan Summa + Moliya Bo'limiga Ajratilgan Summa</span>
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-center text-gray-500">Ma'lumotlar topilmadi</p>
        </div>
      )}
    </div>
  );
};

export default Balance;


