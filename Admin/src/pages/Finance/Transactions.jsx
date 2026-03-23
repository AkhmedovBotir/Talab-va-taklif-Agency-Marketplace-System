import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { financeAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import TransactionTable from '../../components/Finance/TransactionTable';
import ViewTransactionModal from '../../components/Finance/ViewTransactionModal';
import { History, Search, Clear } from '@mui/icons-material';

const Transactions = ({ hideHeader = false }) => {
  const { showError } = useSnackbar();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    currentHolder: '',
    startDate: '',
    endDate: '',
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.status) params.status = filters.status;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.currentHolder) params.currentHolder = filters.currentHolder;
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

      const response = await financeAPI.getAllTransactions(params);
      if (response.success) {
        setTransactions(response.transactions || []);
        setPagination({
          page: response.pagination?.page || pagination.page,
          limit: response.pagination?.limit || pagination.limit,
          total: response.pagination?.total || 0,
          pages: response.pagination?.pages || 0,
        });
      }
    } catch (err) {
      showError(err.message || 'Transaksiyalarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [
    pagination.page,
    pagination.limit,
    filters.status,
    filters.paymentMethod,
    filters.currentHolder,
    filters.startDate,
    filters.endDate,
  ]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleView = (transaction) => {
    setSelectedTransaction(transaction);
    setViewModalOpen(true);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      paymentMethod: '',
      currentHolder: '',
      startDate: '',
      endDate: '',
    });
    setPagination({ ...pagination, page: 1 });
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
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <History className="text-indigo-600" />
              Transaksiyalar
            </h1>
            <p className="text-gray-600">Barcha to'lov transaksiyalari</p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Clear className="w-4 h-4" />
            <span>Tozalash</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha statuslar</option>
            <option value="pending">Kutilmoqda</option>
            <option value="collected">Yig'ilgan</option>
            <option value="submitted">Topshirilgan</option>
            <option value="received">Qabul qilingan</option>
            <option value="confirmed">Tasdiqlangan</option>
            <option value="rejected">Rad etilgan</option>
          </select>

          <select
            value={filters.paymentMethod}
            onChange={(e) => {
              setFilters({ ...filters, paymentMethod: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha to'lov usullari</option>
            <option value="cash">Naqd</option>
            <option value="card">Karta</option>
          </select>

          <select
            value={filters.currentHolder}
            onChange={(e) => {
              setFilters({ ...filters, currentHolder: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha egasi</option>
            <option value="user">Foydalanuvchi</option>
            <option value="mfy_agent">MFY Agent</option>
            <option value="district_agent">Tuman Agent</option>
            <option value="province_agent">Viloyat Agent</option>
            <option value="finance">Moliya</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => {
              setFilters({ ...filters, startDate: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Boshlanish sanasi"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => {
              setFilters({ ...filters, endDate: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Tugash sanasi"
          />
        </div>
      </motion.div>

      {/* Table */}
      <TransactionTable
        transactions={transactions}
        loading={loading}
        onView={handleView}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* View Modal */}
      {selectedTransaction && (
        <ViewTransactionModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
};

export default Transactions;

