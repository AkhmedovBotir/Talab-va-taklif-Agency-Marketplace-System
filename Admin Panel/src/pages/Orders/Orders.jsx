import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminDataAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import OrderTable from '../../components/Orders/OrderTable';
import ViewOrderModal from '../../components/Orders/ViewOrderModal';
import UserSelect from '../../components/Orders/UserSelect';
import { Search, Clear } from '@mui/icons-material';

const Orders = ({ hideHeader = false }) => {
  const { showError } = useSnackbar();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    user: '',
    orderNumber: '',
    startDate: '',
    endDate: '',
    minTotalPrice: '',
    maxTotalPrice: '',
  });

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.user) params.user = filters.user;
      if (filters.orderNumber) params.orderNumber = filters.orderNumber;
      // Convert date to ISO format
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
      if (filters.minTotalPrice) params.minTotalPrice = filters.minTotalPrice;
      if (filters.maxTotalPrice) params.maxTotalPrice = filters.maxTotalPrice;

      const response = await adminDataAPI.getAllOrders(params);

      if (response.success) {
        setOrders(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Buyurtmalarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [
    pagination.page,
    pagination.limit,
    filters.search,
    filters.status,
    filters.paymentStatus,
    filters.paymentMethod,
    filters.user,
    filters.orderNumber,
    filters.startDate,
    filters.endDate,
    filters.minTotalPrice,
    filters.maxTotalPrice,
  ]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleView = async (order) => {
    try {
      // Fetch full order details
      const response = await adminDataAPI.getOrderById(order._id);
      if (response.success) {
        setSelectedOrder(response.data);
        setViewModalOpen(true);
      }
    } catch (err) {
      showError(err.message || 'Buyurtma ma\'lumotlarini yuklashda xatolik yuz berdi');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentStatus: '',
      paymentMethod: '',
      user: '',
      orderNumber: '',
      startDate: '',
      endDate: '',
      minTotalPrice: '',
      maxTotalPrice: '',
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Barcha Buyurtmalar</h1>
            <p className="text-gray-600">Barcha buyurtmalarni ko'rish va monitoring qilish</p>
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
        <div className="space-y-4">
          {/* First Row: Search, Status, Payment Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buyurtma raqami yoki telefon bo'yicha qidirish..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

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
              <option value="confirmed_by_punkt">Punkt tomonidan tasdiqlangan</option>
              <option value="requested_to_contragent">Contragentga so'rov yuborilgan</option>
              <option value="accepted_by_contragent">Contragent tomonidan qabul qilingan</option>
              <option value="delivered_to_punkt">Punktga yetkazilgan</option>
              <option value="assigned_to_agent">Agentga yuborilgan</option>
              <option value="confirmed_by_agent">Agent tomonidan tasdiqlangan</option>
              <option value="confirmed_by_customer">Mijoz tomonidan tasdiqlangan</option>
              <option value="cancelled">Bekor qilingan</option>
            </select>

            <select
              value={filters.paymentStatus}
              onChange={(e) => {
                setFilters({ ...filters, paymentStatus: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barcha to'lov statuslari</option>
              <option value="pending">Kutilmoqda</option>
              <option value="paid">To'langan</option>
              <option value="failed">Muvaffaqiyatsiz</option>
              <option value="refunded">Qaytarilgan</option>
            </select>
          </div>

          {/* Second Row: Payment Method, Order Number, User ID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <input
              type="text"
              placeholder="Buyurtma raqami..."
              value={filters.orderNumber}
              onChange={(e) => {
                setFilters({ ...filters, orderNumber: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div>
              <UserSelect
                name="user"
                value={filters.user}
                onChange={(e) => {
                  setFilters({ ...filters, user: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                label=""
              />
            </div>
          </div>

          {/* Third Row: Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Fourth Row: Price Range, Limit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="Minimal summa..."
              value={filters.minTotalPrice}
              onChange={(e) => {
                setFilters({ ...filters, minTotalPrice: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="number"
              placeholder="Maksimal summa..."
              value={filters.maxTotalPrice}
              onChange={(e) => {
                setFilters({ ...filters, maxTotalPrice: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={pagination.limit}
              onChange={(e) => {
                setPagination({ ...pagination, limit: Number(e.target.value), page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="25">25 ta</option>
              <option value="50">50 ta</option>
              <option value="100">100 ta</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <OrderTable
        orders={orders}
        loading={loading}
        onView={handleView}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      {selectedOrder && (
        <ViewOrderModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
        />
      )}
    </div>
  );
};

export default Orders;

