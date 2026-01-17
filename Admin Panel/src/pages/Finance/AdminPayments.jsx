import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { financeAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { AccountBalance, Send, History } from '@mui/icons-material';
import SendToPunktModal from '../../components/Finance/AdminPayments/SendToPunktModal';
import AdminTransactionsTable from '../../components/Finance/AdminPayments/AdminTransactionsTable';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

const AdminPayments = () => {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsSummary, setTransactionsSummary] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: '',
  });
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const fetchBalance = async () => {
    try {
      const response = await financeAPI.getAdminBalance();
      if (response.success) {
        setBalance(response.data);
      }
    } catch (error) {
      showError(error.message || 'Balansni yuklashda xatolik');
    }
  };

  const fetchTransactions = async ({ page, limit } = {}) => {
    setLoading(true);
    try {
      const appliedPage = page ?? pagination.page;
      const appliedLimit = limit ?? pagination.limit;

      const params = {
        page: appliedPage,
        limit: appliedLimit,
      };

      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        params.startDate = startDate.toISOString();
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        params.endDate = endDate.toISOString();
      }

      const response = await financeAPI.getAdminTransactions(params);
      if (response.success) {
        setTransactions(response.data || []);
        setTransactionsSummary(response.summary || null);
        setPagination({
          page: response.page || appliedPage,
          limit: response.limit || appliedLimit,
          total: response.total || response.count || 0,
          pages: response.totalPages || 0,
        });
      }
    } catch (error) {
      showError(error.message || 'Transaksiyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchTransactions({ page: 1 });
  };

  const handleResetFilters = () => {
    setFilters({ type: '', category: '', startDate: '', endDate: '' });
    setTimeout(() => fetchTransactions({ page: 1 }), 0);
  };

  const handlePageChange = (page) => {
    if (page < 1 || (pagination.pages && page > pagination.pages)) return;
    fetchTransactions({ page });
  };

  const handleLimitChange = (limit) => {
    fetchTransactions({ page: 1, limit });
  };

  const handleSendSuccess = () => {
    fetchBalance();
    fetchTransactions({ page: 1 });
    setSendModalOpen(false);
    showSuccess('Pul muvaffaqiyatli punktga yuborildi');
  };

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <AccountBalance className="w-8 h-8" />
            <span className="text-sm opacity-90">Balans</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatNumber(balance?.balance || transactionsSummary?.balance || 0)} so'm
          </div>
          <div className="text-sm opacity-75">
            Jami kirim - Jami chiqim
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <History className="w-8 h-8" />
            <span className="text-sm opacity-90">Jami Kirim</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatNumber(balance?.totalIncome || transactionsSummary?.totalIncome || 0)} so'm
          </div>
          <div className="text-sm opacity-75">
            Barcha kirimlar
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Send className="w-8 h-8" />
            <span className="text-sm opacity-90">Jami Chiqim</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatNumber(balance?.totalExpense || transactionsSummary?.totalExpense || 0)} so'm
          </div>
          <div className="text-sm opacity-75">
            Barcha chiqimlar
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <AccountBalance className="w-8 h-8" />
            <span className="text-sm opacity-90">Qarz</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatNumber(balance?.qarz || transactionsSummary?.qarz || 0)} so'm
          </div>
          <div className="text-sm opacity-75">
            Admin qarzda
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <AccountBalance className="w-8 h-8" />
            <span className="text-sm opacity-90">Haq</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatNumber(balance?.haq || transactionsSummary?.haq || 0)} so'm
          </div>
          <div className="text-sm opacity-75">
            Admin haqida
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={() => setSendModalOpen(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md"
        >
          <Send className="w-5 h-5" />
          Punktga Pul Yuborish
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tranzaksiya turi</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barchasi</option>
            <option value="income">Kirim</option>
            <option value="expense">Chiqim</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barchasi</option>
            <option value="admin_to_punkt">Punktga yuborilgan</option>
          </select>
        </div>
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
        <div className="ml-auto">
          <select
            value={pagination.limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>{size} tadan</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <AdminTransactionsTable
        transactions={transactions}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Send to Punkt Modal */}
      <SendToPunktModal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        onSuccess={handleSendSuccess}
      />
    </div>
  );
};

export default AdminPayments;
