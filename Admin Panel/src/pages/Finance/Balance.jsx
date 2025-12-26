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
  Refresh,
  LocalShipping
} from '@mui/icons-material';
import { formatDateRange } from '../../utils/dateFormatter';

const Balance = ({ hideHeader = false }) => {
  const { showError } = useSnackbar();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await financeAPI.getBalance(params);

      if (response.success) {
        setBalance(response.balance);
      } else {
        showError(response.message || 'Balans ma\'lumotlarini yuklashda xatolik yuz berdi');
      }
    } catch (err) {
      showError(err.message || 'Balans ma\'lumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [startDate, endDate]);

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const handleRefresh = () => {
    fetchBalance();
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
            {/* Daromadlar */}
            <FinanceReportCard
              title="Umumiy Tushgan Summa"
              value={formatAmount(balance.totalReceived)}
              icon={TrendingUp}
              color="bg-green-500"
              subtitle="Mijozlardan olingan to'lovlar"
            />
            <FinanceReportCard
              title="Moliya Bo'limiga Ajratilgan (KPI)"
              value={formatAmount(balance.totalFinanceKpi)}
              icon={AttachMoney}
              color="bg-blue-500"
              subtitle="KPI bonuslardan moliya bo'limiga"
            />
            <FinanceReportCard
              title="Umumiy Daromad"
              value={formatAmount(balance.totalIncome)}
              icon={TrendingUp}
              color="bg-emerald-500"
              subtitle="Tushgan + KPI Bonus"
            />
            
            {/* Xarajatlar */}
            <FinanceReportCard
              title="Tarqatilgan Summa (KPI)"
              value={formatAmount(balance.totalDistributed)}
              icon={TrendingDown}
              color="bg-orange-500"
              subtitle="KPI bonuslar (punkt + agentlar)"
            />
            <FinanceReportCard
              title="Contragent To'lovlari"
              value={formatAmount(balance.totalContragentPayments)}
              icon={Business}
              color="bg-red-500"
              subtitle={balance.details?.contragentPayments ? `${balance.details.contragentPayments.count || 0} ta to'lov` : ''}
            />
            <FinanceReportCard
              title="Umumiy Xarajatlar"
              value={formatAmount(balance.totalExpenses)}
              icon={TrendingDown}
              color="bg-rose-500"
              subtitle="Tarqatilgan + Contragent to'lovlari"
            />
            
            {/* Balanslar */}
            <FinanceReportCard
              title="Umumiy Balans"
              value={formatAmount(balance.totalBalance)}
              icon={AccountBalance}
              color="bg-purple-500"
              subtitle="Tushgan - Xarajatlar"
            />
            <FinanceReportCard
              title="Moliya Bo'limi Umumiy Balansi"
              value={formatAmount(balance.financeTotalBalance)}
              icon={AccountBalance}
              color="bg-indigo-500"
              subtitle="Tushgan + KPI - Contragent to'lovlari"
            />
            <FinanceReportCard
              title="Moliya Bo'limi Sof Daromadi"
              value={formatAmount(balance.financeNetIncome)}
              icon={TrendingUp}
              color="bg-teal-500"
              subtitle="Tushgan - Xarajatlar + KPI bonus"
            />
          </div>

          {/* Details Section */}
          {balance.details && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">KPI Bonuslar Taqsimoti</h2>
              {balance.details.kpiDistribution && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Punkt</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatAmount(balance.details.kpiDistribution.punkt)}
                    </p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center gap-2 mb-2">
                      <LocationCity className="text-indigo-600" />
                      <span className="text-sm font-medium text-gray-700">Viloyat Agent</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-900">
                      {formatAmount(balance.details.kpiDistribution.viloyatAgent)}
                    </p>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Business className="text-cyan-600" />
                      <span className="text-sm font-medium text-gray-700">Tuman Agent</span>
                    </div>
                    <p className="text-2xl font-bold text-cyan-900">
                      {formatAmount(balance.details.kpiDistribution.tumanAgent)}
                    </p>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="text-teal-600" />
                      <span className="text-sm font-medium text-gray-700">MFY Agent</span>
                    </div>
                    <p className="text-2xl font-bold text-teal-900">
                      {formatAmount(balance.details.kpiDistribution.mfyAgent)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AttachMoney className="text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Moliya Bo'limi</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {formatAmount(balance.details.kpiDistribution.finance)}
                    </p>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                    <div className="flex items-center gap-2 mb-2">
                      <LocalShipping className="text-cyan-600" />
                      <span className="text-sm font-medium text-gray-700">Yetkazib Berish Xizmati</span>
                    </div>
                    <p className="text-2xl font-bold text-cyan-900">
                      {formatAmount(balance.details.kpiDistribution.deliveryService || 0)}
                    </p>
                  </div>
                  {balance.details.kpiDistribution.punktTransfer > 0 && (
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <SwapHoriz className="text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">Punkt Transfer</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-900">
                        {formatAmount(balance.details.kpiDistribution.punktTransfer)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Additional Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Balans Tushuntirishlari</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[250px]">Umumiy Tushgan Summa:</span>
                <span>Moliya bo'limiga tasdiqlangan to'lovlar jami summasi (mijozlardan olingan)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[250px]">Moliya Bo'limiga Ajratilgan (KPI):</span>
                <span>KPI bonuslardan moliya bo'limiga ajratilgan qism</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[250px]">Umumiy Daromad:</span>
                <span>Tushgan Summa + KPI Bonus</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[250px]">Tarqatilgan Summa (KPI):</span>
                <span>KPI bonuslar bo'yicha tarqatilgan summa (punkt + agentlar + deliveryService)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[250px]">Contragent To'lovlari:</span>
                <span>Contragentlarga to'langan to'lovlar jami summasi</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[250px]">Umumiy Xarajatlar:</span>
                <span>Tarqatilgan Summa + Contragent To'lovlari</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[250px]">Umumiy Balans:</span>
                <span>Tushgan Summa - Umumiy Xarajatlar</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[250px]">Moliya Bo'limi Umumiy Balansi:</span>
                <span>Tushgan Summa + KPI Bonus - Contragent To'lovlari</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[250px]">Moliya Bo'limi Sof Daromadi:</span>
                <span>Tushgan Summa - Xarajatlar + KPI Bonus</span>
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



