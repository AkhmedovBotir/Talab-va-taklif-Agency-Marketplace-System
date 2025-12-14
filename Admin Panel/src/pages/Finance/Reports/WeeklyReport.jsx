import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { financeAPI } from '../../../services/api';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import FinanceReportCard from '../../../components/Finance/FinanceReportCard';
import { formatDate, formatDateRange } from '../../../utils/dateFormatter';
import { Assessment, TrendingUp, Receipt } from '@mui/icons-material';

const WeeklyReport = () => {
  const { showError } = useSnackbar();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await financeAPI.getWeeklyReport();
      if (response.success) {
        setReport(response.report);
      }
    } catch (err) {
      showError(err.message || 'Hisobotni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Assessment className="text-indigo-600" />
            Haftalik Hisobot
          </h1>
          <p className="text-gray-600">
            {report?.period && formatDateRange(report.period.startDate, report.period.endDate)}
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <FinanceReportCard
              title="Jami Qabul Qilingan"
              value={formatAmount(report.totalReceived)}
              icon={TrendingUp}
              color="bg-blue-500"
            />
            <FinanceReportCard
              title="Jami Buyurtmalar"
              value={report.totalOrders}
              icon={Receipt}
              color="bg-green-500"
            />
          </div>

          {/* By Region */}
          {report.byRegion && report.byRegion.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Viloyatlar Bo'yicha</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viloyat</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {report.byRegion.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.region?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatAmount(item.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">
                          {item.ordersCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Daily Breakdown */}
          {report.dailyBreakdown && report.dailyBreakdown.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Kunlik Tafsilot</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {report.dailyBreakdown.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatAmount(item.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">
                          {item.ordersCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

export default WeeklyReport;

