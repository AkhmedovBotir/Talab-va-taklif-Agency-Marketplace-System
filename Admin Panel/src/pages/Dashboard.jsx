import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';
import { formatDate } from '../utils/dateFormatter';
import {
  Dashboard as DashboardIcon,
  ShoppingCart,
  AttachMoney,
  Inventory,
  People,
  TrendingUp,
  TrendingDown,
  Business,
  Store,
  AccountBalance,
  LocalShipping,
  Category,
  Star,
  Work,
  Payment,
  CheckCircle,
  Warning,
} from '@mui/icons-material';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

const formatCurrency = (num) => {
  return formatNumber(num) + ' so\'m';
};

const Dashboard = () => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [generalStats, setGeneralStats] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [ordersStats, setOrdersStats] = useState(null);
  const [financeStats, setFinanceStats] = useState(null);
  const [usersStats, setUsersStats] = useState(null);
  const [productsStats, setProductsStats] = useState(null);
  const [activeChart, setActiveChart] = useState('daily'); // 'daily', 'weekly', 'monthly'

  useEffect(() => {
    fetchAllStatistics();
  }, []);

  const fetchAllStatistics = async () => {
    setLoading(true);
    try {
      const [
        generalRes,
        dailyRes,
        weeklyRes,
        monthlyRes,
        ordersRes,
        financeRes,
        usersRes,
        productsRes,
      ] = await Promise.all([
        dashboardAPI.getStatistics(),
        dashboardAPI.getDailyStatistics(30),
        dashboardAPI.getWeeklyStatistics(12),
        dashboardAPI.getMonthlyStatistics(12),
        dashboardAPI.getOrdersStatistics(),
        dashboardAPI.getFinanceStatistics(),
        dashboardAPI.getUsersStatistics(),
        dashboardAPI.getProductsStatistics(),
      ]);

      if (generalRes.success) setGeneralStats(generalRes.data);
      if (dailyRes.success) setDailyStats(dailyRes.data || []);
      if (weeklyRes.success) setWeeklyStats(weeklyRes.data || []);
      if (monthlyRes.success) setMonthlyStats(monthlyRes.data || []);
      if (ordersRes.success) setOrdersStats(ordersRes.data);
      if (financeRes.success) setFinanceStats(financeRes.data);
      if (usersRes.success) setUsersStats(usersRes.data);
      if (productsRes.success) setProductsStats(productsRes.data);
    } catch (err) {
      showError(err.message || 'Statistikani yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-indigo-600"></div>
      </div>
    );
  }

  const getChartData = () => {
    if (activeChart === 'daily') {
      return dailyStats.map((item) => ({
        date: formatDate(item.date, { format: 'short', includeTime: false }),
        orders: item.orders,
        revenue: item.revenue,
      }));
    } else if (activeChart === 'weekly') {
      return weeklyStats.map((item) => ({
        label: item.weekLabel,
        orders: item.orders,
        revenue: item.revenue,
      }));
    } else {
      return monthlyStats.map((item) => ({
        label: item.monthLabel,
        orders: item.orders,
        revenue: item.revenue,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <DashboardIcon className="text-indigo-600" />
          Dashboard
        </h1>
        <p className="text-gray-600">Umumiy statistika va ko'rsatkichlar</p>
      </motion.div>

      {/* General Statistics Cards */}
      {generalStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Jami Buyurtmalar"
            value={formatNumber(generalStats.orders?.total || 0)}
            subtitle={`Bugun: ${formatNumber(generalStats.orders?.today || 0)}`}
            icon={ShoppingCart}
            color="bg-blue-500"
            trend={generalStats.orders?.today || 0}
          />
          <StatCard
            title="Jami Daromad"
            value={formatCurrency(generalStats.revenue?.total || 0)}
            subtitle={`Bugun: ${formatCurrency(generalStats.revenue?.today || 0)}`}
            icon={AttachMoney}
            color="bg-green-500"
            trend={generalStats.revenue?.today || 0}
          />
          <StatCard
            title="Jami Mahsulotlar"
            value={formatNumber(generalStats.products?.total || 0)}
            subtitle={`Faol: ${formatNumber(generalStats.products?.active || 0)}`}
            icon={Inventory}
            color="bg-purple-500"
            trend={generalStats.products?.active || 0}
          />
          <StatCard
            title="Jami Foydalanuvchilar"
            value={formatNumber(generalStats.marketplaceUsers?.total || 0)}
            subtitle={`Faol: ${formatNumber(generalStats.marketplaceUsers?.active || 0)}`}
            icon={People}
            color="bg-orange-500"
            trend={generalStats.marketplaceUsers?.active || 0}
          />
        </div>
      )}

      {/* Revenue and Orders Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Buyurtmalar va Daromad</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveChart('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeChart === 'daily'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Kunlik
            </button>
            <button
              onClick={() => setActiveChart('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeChart === 'weekly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Haftalik
            </button>
            <button
              onClick={() => setActiveChart('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeChart === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Oylik
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={getChartData()}>
            <defs>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={activeChart === 'daily' ? 'date' : 'label'} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'revenue') return formatCurrency(value);
                return value;
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="orders"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorOrders)"
              name="Buyurtmalar"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              name="Daromad"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders by Status */}
        {ordersStats?.byStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Buyurtmalar bo'yicha Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersStats.byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {ordersStats.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Finance Overview */}
        {financeStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Moliyaviy Ko'rsatkichlar</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Daromad</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(financeStats.income?.total || 0)}
                  </p>
                </div>
                <TrendingUp className="text-green-600 text-4xl" />
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Xarajatlar</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(financeStats.expenses?.total || 0)}
                  </p>
                </div>
                <TrendingDown className="text-red-600 text-4xl" />
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Sof Foyda</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(financeStats.netProfit?.total || 0)}
                  </p>
                </div>
                <AccountBalance className="text-blue-600 text-4xl" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Statistics */}
        {usersStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Foydalanuvchilar Statistikasi</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                {
                  name: 'Marketplace',
                  faol: usersStats.marketplaceUsers?.byStatus?.find(s => s.status === 'active')?.count || 0,
                  nofaol: usersStats.marketplaceUsers?.byStatus?.find(s => s.status === 'inactive')?.count || 0,
                },
                {
                  name: 'Contragentlar',
                  faol: usersStats.contragents?.byStatus?.find(s => s.status === 'active')?.count || 0,
                  nofaol: usersStats.contragents?.byStatus?.find(s => s.status === 'inactive')?.count || 0,
                },
                {
                  name: 'Punktlar',
                  faol: usersStats.punkts?.byStatus?.find(s => s.status === 'active')?.count || 0,
                  nofaol: usersStats.punkts?.byStatus?.find(s => s.status === 'inactive')?.count || 0,
                },
                {
                  name: 'Agentlar',
                  faol: usersStats.agents?.byStatus?.find(s => s.status === 'active')?.count || 0,
                  nofaol: usersStats.agents?.byStatus?.find(s => s.status === 'inactive')?.count || 0,
                },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="faol" fill="#10b981" name="Faol" />
                <Bar dataKey="nofaol" fill="#ef4444" name="Nofaol" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Products by Status */}
        {productsStats?.byStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Mahsulotlar bo'yicha Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productsStats.byStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {generalStats && (
          <>
            <StatCard
              title="Kontragentlar"
              value={formatNumber(generalStats.contragents?.total || 0)}
              subtitle={`Faol: ${formatNumber(generalStats.contragents?.active || 0)}`}
              icon={Business}
              color="bg-cyan-500"
            />
            <StatCard
              title="Punktlar"
              value={formatNumber(generalStats.punkts?.total || 0)}
              subtitle={`Faol: ${formatNumber(generalStats.punkts?.active || 0)}`}
              icon={Store}
              color="bg-teal-500"
            />
            <StatCard
              title="Agentlar"
              value={formatNumber(generalStats.agents?.total || 0)}
              subtitle={`Faol: ${formatNumber(generalStats.agents?.active || 0)}`}
              icon={People}
              color="bg-indigo-500"
            />
            <StatCard
              title="Kategoriyalar"
              value={formatNumber(generalStats.categories?.total || 0)}
              icon={Category}
              color="bg-pink-500"
            />
          </>
        )}
      </div>

      {/* Top Products */}
      {ordersStats?.topProducts && ordersStats.topProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Eng Ko'p Sotilgan Mahsulotlar</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahsulot</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sotilgan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Daromad</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordersStats.topProducts.slice(0, 10).map((product, index) => (
                  <tr key={product.productId || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(product.orderCount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(product.quantitySold)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className={`${color} rounded-lg p-6 text-white shadow-lg`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="text-4xl opacity-80" />
        {trend !== undefined && trend > 0 && (
          <TrendingUp className="text-white opacity-80" />
        )}
      </div>
      <h3 className="text-sm font-medium mb-2 opacity-90">{title}</h3>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-sm opacity-75">{subtitle}</p>}
    </motion.div>
  );
};

export default Dashboard;
