import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { financeAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import FinanceReportCard from '../../components/Finance/FinanceReportCard';
import { formatDate, formatDateRange, getMonthName } from '../../utils/dateFormatter';
import { 
  Assessment, 
  TrendingUp, 
  Receipt, 
  CheckCircle, 
  Pending,
  CalendarToday,
  CalendarMonth,
  Event,
  DateRange
} from '@mui/icons-material';

const tabs = [
  { id: 'daily', label: 'Kunlik', icon: CalendarToday },
  { id: 'weekly', label: 'Haftalik', icon: CalendarToday },
  { id: 'monthly', label: 'Oylik', icon: CalendarMonth },
  { id: 'yearly', label: 'Yillik', icon: Event },
  { id: 'custom', label: 'Belgilangan muddat', icon: DateRange },
];

const Reports = ({ hideHeader = false }) => {
  const { showError } = useSnackbar();
  const [activeTab, setActiveTab] = useState('daily');
  
  // Daily Report State
  const [dailyReport, setDailyReport] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);

  // Weekly Report State
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  // Monthly Report State
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);

  // Yearly Report State
  const [yearlyReport, setYearlyReport] = useState(null);
  const [yearlyLoading, setYearlyLoading] = useState(false);
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear());

  // Custom Report State
  const [customReport, setCustomReport] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Daily Report
  const fetchDailyReport = async () => {
    setDailyLoading(true);
    try {
      const response = await financeAPI.getDailyReport({ date: dailyDate });
      if (response.success) {
        setDailyReport(response.report);
      }
    } catch (err) {
      showError(err.message || 'Kunlik hisobotni yuklashda xatolik yuz berdi');
    } finally {
      setDailyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyReport();
    }
  }, [dailyDate, activeTab]);

  // Weekly Report
  const fetchWeeklyReport = async () => {
    setWeeklyLoading(true);
    try {
      const response = await financeAPI.getWeeklyReport();
      if (response.success) {
        setWeeklyReport(response.report);
      }
    } catch (err) {
      showError(err.message || 'Haftalik hisobotni yuklashda xatolik yuz berdi');
    } finally {
      setWeeklyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'weekly') {
      fetchWeeklyReport();
    }
  }, [activeTab]);

  // Monthly Report
  const fetchMonthlyReport = async () => {
    setMonthlyLoading(true);
    try {
      const response = await financeAPI.getMonthlyReport({ year: monthlyYear, month: monthlyMonth });
      if (response.success) {
        setMonthlyReport(response.report);
      }
    } catch (err) {
      showError(err.message || 'Oylik hisobotni yuklashda xatolik yuz berdi');
    } finally {
      setMonthlyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyReport();
    }
  }, [monthlyYear, monthlyMonth, activeTab]);

  // Yearly Report
  const fetchYearlyReport = async () => {
    setYearlyLoading(true);
    try {
      const response = await financeAPI.getYearlyReport({ year: yearlyYear });
      if (response.success) {
        setYearlyReport(response.report);
      }
    } catch (err) {
      showError(err.message || 'Yillik hisobotni yuklashda xatolik yuz berdi');
    } finally {
      setYearlyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'yearly') {
      fetchYearlyReport();
    }
  }, [yearlyYear, activeTab]);

  // Custom Report
  const fetchCustomReport = async () => {
    if (!startDate || !endDate) {
      return;
    }
    setCustomLoading(true);
    try {
      const response = await financeAPI.getCustomReport({ startDate, endDate });
      if (response.success) {
        setCustomReport(response.report);
      }
    } catch (err) {
      showError(err.message || 'Belgilangan muddat hisobotini yuklashda xatolik yuz berdi');
    } finally {
      setCustomLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const renderDailyReport = () => {
    if (dailyLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      );
    }

    if (!dailyReport) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-center text-gray-500">Ma'lumotlar topilmadi</p>
        </div>
      );
    }

    return (
      <>
        <div className="mb-6">
          <input
            type="date"
            value={dailyDate}
            onChange={(e) => setDailyDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <FinanceReportCard
            title="Jami Qabul Qilingan"
            value={formatAmount(dailyReport.totalReceived)}
            icon={TrendingUp}
            color="bg-blue-500"
            subtitle={dailyReport.date ? formatDate(dailyReport.date, { format: 'full' }) : ''}
          />
          <FinanceReportCard
            title="Jami Buyurtmalar"
            value={dailyReport.totalOrders}
            icon={Receipt}
            color="bg-green-500"
          />
          <FinanceReportCard
            title="Tasdiqlangan"
            value={dailyReport.confirmedCount || 0}
            icon={CheckCircle}
            color="bg-purple-500"
          />
          <FinanceReportCard
            title="Kutilayotgan"
            value={dailyReport.pendingCount || 0}
            icon={Pending}
            color="bg-orange-500"
          />
        </div>
        {dailyReport.byRegion && dailyReport.byRegion.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                  {dailyReport.byRegion.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.region?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(item.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </>
    );
  };

  const renderWeeklyReport = () => {
    if (weeklyLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      );
    }

    if (!weeklyReport) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-center text-gray-500">Ma'lumotlar topilmadi</p>
        </div>
      );
    }

    return (
      <>
        {weeklyReport.period && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <span className="text-sm text-indigo-900">
              {formatDateRange(weeklyReport.period.startDate, weeklyReport.period.endDate)}
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FinanceReportCard
            title="Jami Qabul Qilingan"
            value={formatAmount(weeklyReport.totalReceived)}
            icon={TrendingUp}
            color="bg-blue-500"
          />
          <FinanceReportCard
            title="Jami Buyurtmalar"
            value={weeklyReport.totalOrders}
            icon={Receipt}
            color="bg-green-500"
          />
        </div>
        {weeklyReport.byRegion && weeklyReport.byRegion.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                  {weeklyReport.byRegion.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.region?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(item.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {weeklyReport.dailyBreakdown && weeklyReport.dailyBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                  {weeklyReport.dailyBreakdown.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatDate(item.date)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(item.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </>
    );
  };

  const renderMonthlyReport = () => {
    if (monthlyLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      );
    }

    if (!monthlyReport) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-center text-gray-500">Ma'lumotlar topilmadi</p>
        </div>
      );
    }

    return (
      <>
        <div className="mb-6 flex gap-2">
          <select
            value={monthlyYear}
            onChange={(e) => setMonthlyYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={monthlyMonth}
            onChange={(e) => setMonthlyMonth(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{getMonthName(m - 1)}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FinanceReportCard
            title="Jami Qabul Qilingan"
            value={formatAmount(monthlyReport.totalReceived)}
            icon={TrendingUp}
            color="bg-blue-500"
          />
          <FinanceReportCard
            title="Jami Buyurtmalar"
            value={monthlyReport.totalOrders}
            icon={Receipt}
            color="bg-green-500"
          />
        </div>
        {monthlyReport.byRegion && monthlyReport.byRegion.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                  {monthlyReport.byRegion.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.region?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(item.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {monthlyReport.byDistrict && monthlyReport.byDistrict.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tumanlar Bo'yicha</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tuman</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viloyat</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monthlyReport.byDistrict.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.district?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.region?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(item.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {monthlyReport.dailyBreakdown && monthlyReport.dailyBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                  {monthlyReport.dailyBreakdown.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatDate(item.date)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(item.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </>
    );
  };

  const renderYearlyReport = () => {
    if (yearlyLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      );
    }

    if (!yearlyReport) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-center text-gray-500">Ma'lumotlar topilmadi</p>
        </div>
      );
    }

    return (
      <>
        <div className="mb-6">
          <select
            value={yearlyYear}
            onChange={(e) => setYearlyYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FinanceReportCard
            title="Jami Qabul Qilingan"
            value={formatAmount(yearlyReport.totalReceived)}
            icon={TrendingUp}
            color="bg-blue-500"
          />
          <FinanceReportCard
            title="Jami Buyurtmalar"
            value={yearlyReport.totalOrders}
            icon={Receipt}
            color="bg-green-500"
          />
        </div>
        {yearlyReport.byRegion && yearlyReport.byRegion.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                  {yearlyReport.byRegion.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.region?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(item.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {yearlyReport.monthlyBreakdown && yearlyReport.monthlyBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Oylik Tafsilot</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oy</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {yearlyReport.monthlyBreakdown.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{getMonthName(item.month - 1)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(item.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </>
    );
  };

  const renderCustomReport = () => {
    if (customLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      );
    }

    if (!startDate || !endDate) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-center text-gray-500 mb-4">Hisobotni ko'rish uchun sanalarni tanlang</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Boshlanish sanasi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tugash sanasi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchCustomReport}
                disabled={!startDate || !endDate}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
              >
                Ko'rish
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!customReport) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-center text-gray-500 mb-4">Ma'lumotlar topilmadi</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Boshlanish sanasi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tugash sanasi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchCustomReport}
                disabled={!startDate || !endDate || customLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
              >
                {customLoading ? 'Yuklanmoqda...' : 'Ko\'rish'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Boshlanish sanasi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tugash sanasi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={fetchCustomReport}
              disabled={!startDate || !endDate || customLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
            >
              {customLoading ? 'Yuklanmoqda...' : 'Hisobotni ko\'rish'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FinanceReportCard
            title="Jami Qabul Qilingan"
            value={formatAmount(customReport.totalReceived)}
            icon={TrendingUp}
            color="bg-blue-500"
          />
          <FinanceReportCard
            title="Jami Buyurtmalar"
            value={customReport.totalOrders}
            icon={Receipt}
            color="bg-green-500"
          />
        </div>
        {customReport.byRegion && customReport.byRegion.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                  {customReport.byRegion.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.region?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(item.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {customReport.byDistrict && customReport.byDistrict.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tumanlar Bo'yicha</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tuman</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viloyat</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customReport.byDistrict.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.district?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.region?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(item.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </>
    );
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
          <div className="flex items-center gap-3 mb-2">
            <Assessment className="text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Hisobotlar</h1>
          </div>
          <p className="text-gray-600">Moliya bo'limi hisobotlari</p>
        </motion.div>
      )}

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
      >
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {activeTab === 'daily' && renderDailyReport()}
        {activeTab === 'weekly' && renderWeeklyReport()}
        {activeTab === 'monthly' && renderMonthlyReport()}
        {activeTab === 'yearly' && renderYearlyReport()}
        {activeTab === 'custom' && renderCustomReport()}
      </motion.div>
    </div>
  );
};

export default Reports;

