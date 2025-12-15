import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { kpiAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Visibility, Close, CheckCircle, Cancel } from '@mui/icons-material';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

const orderStatusLabels = {
  pending: 'Kutilmoqda',
  marketplace: 'Marketplace',
  delivered_to_punkt: 'Punktga yetkazildi',
  assigned_to_agent: 'Agentga biriktirildi',
  confirmed_by_agent: 'Agent tasdiqladi',
  confirmed_by_customer: 'Mijoz qabul qildi',
  cancelled: 'Bekor qilingan',
  returned: 'Qaytarilgan',
};

const getOrderStatusLabel = (status) => {
  return orderStatusLabels[status] || status || '-';
};

// Transaction Detail Modal
const TransactionDetailModal = ({ transaction, open, onClose }) => {
  if (!open || !transaction) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-[99]"
        onClick={onClose}
        style={{ marginTop: 0 }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ marginTop: 0 }}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Transaksiya tafsilotlari</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Close />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Buyurtma</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyurtma raqami:</span>
                  <span className="font-medium">{transaction.order?.orderNumber || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{getOrderStatusLabel(transaction.orderStatus)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jami narx:</span>
                  <span className="font-medium">{formatNumber(transaction.order?.totalPrice)} so'm</span>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Mahsulot</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nomi:</span>
                  <span className="font-medium">{transaction.orderItem?.product?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Miqdor:</span>
                  <span className="font-medium">{transaction.orderItem?.quantity || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sotish narxi:</span>
                  <span className="font-medium">{formatNumber(transaction.orderItem?.price)} so'm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Asl narxi:</span>
                  <span className="font-medium">{formatNumber(transaction.orderItem?.originalPrice)} so'm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">KPI bonus %:</span>
                  <span className="font-medium">{transaction.orderItem?.kpiBonusPercent || 0}%</span>
                </div>
              </div>
            </div>

            {/* KPI Amounts */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">KPI summalar</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-800">Jami KPI:</span>
                  <span className="text-indigo-600">{formatNumber(transaction.totalKpiAmount)} so'm</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Punkt:</span>
                  <span className="font-medium">{formatNumber(transaction.amounts?.punkt)} so'm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Viloyat agent:</span>
                  <span className="font-medium">{formatNumber(transaction.amounts?.viloyatAgent)} so'm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tuman agent:</span>
                  <span className="font-medium">{formatNumber(transaction.amounts?.tumanAgent)} so'm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MFY agent:</span>
                  <span className="font-medium">{formatNumber(transaction.amounts?.mfyAgent)} so'm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Moliya:</span>
                  <span className="font-medium">{formatNumber(transaction.amounts?.finance)} so'm</span>
                </div>
                {transaction.amounts?.punktTransfer > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Punkt transfer:</span>
                    <span className="font-medium">{formatNumber(transaction.amounts?.punktTransfer)} so'm</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recipients */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Qabul qiluvchilar</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {transaction.recipients?.punkt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Punkt:</span>
                    <span className="font-medium">{transaction.recipients.punkt.name || '-'}</span>
                  </div>
                )}
                {transaction.recipients?.viloyatAgent && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Viloyat agent:</span>
                    <span className="font-medium">{transaction.recipients.viloyatAgent.name || '-'}</span>
                  </div>
                )}
                {transaction.recipients?.tumanAgent && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tuman agent:</span>
                    <span className="font-medium">{transaction.recipients.tumanAgent.name || '-'}</span>
                  </div>
                )}
                {transaction.recipients?.mfyAgent && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">MFY agent:</span>
                    <span className="font-medium">{transaction.recipients.mfyAgent.name || '-'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">To'lov holati:</span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                transaction.isPaid 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {transaction.isPaid ? <CheckCircle className="w-4 h-4" /> : <Cancel className="w-4 h-4" />}
                {transaction.isPaid ? 'To\'langan' : 'To\'lanmagan'}
              </span>
            </div>

            <div className="text-sm text-gray-500">
              Yaratilgan: {formatDate(transaction.createdAt)}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const KPITransactionsSection = () => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    isPaid: '',
    orderStatus: '',
    startDate: '',
    endDate: '',
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchTransactions = async ({ page, limit } = {}) => {
    setLoading(true);
    try {
      const appliedPage = page ?? pagination.page;
      const appliedLimit = limit ?? pagination.limit;

      const params = {
        page: appliedPage,
        limit: appliedLimit,
      };

      if (filters.isPaid !== '') params.isPaid = filters.isPaid === 'true';
      if (filters.orderStatus) params.orderStatus = filters.orderStatus;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await kpiAPI.getAllTransactions(params);
      if (response.success) {
        setTransactions(response.data || []);
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
    setFilters({ isPaid: '', orderStatus: '', startDate: '', endDate: '' });
    setTimeout(() => fetchTransactions({ page: 1 }), 0);
  };

  const handlePageChange = (page) => {
    if (page < 1 || (pagination.pages && page > pagination.pages)) return;
    fetchTransactions({ page });
  };

  const handleLimitChange = (limit) => {
    fetchTransactions({ page: 1, limit });
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To'lov holati</label>
          <select
            value={filters.isPaid}
            onChange={(e) => handleFilterChange('isPaid', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barchasi</option>
            <option value="true">To'langan</option>
            <option value="false">To'lanmagan</option>
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

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Transaksiyalar topilmadi</div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyurtma</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahsulot</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jami KPI</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taqsimlash</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holat</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">#{transaction.order?.orderNumber || '-'}</div>
                      <div className="text-xs text-gray-500">{getOrderStatusLabel(transaction.orderStatus)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{transaction.orderItem?.product?.name || '-'}</div>
                      <div className="text-xs text-gray-500">x{transaction.orderItem?.quantity || 0}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-indigo-600">{formatNumber(transaction.totalKpiAmount)} so'm</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {transaction.amounts?.punkt > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            P: {formatNumber(transaction.amounts.punkt)}
                          </span>
                        )}
                        {transaction.amounts?.viloyatAgent > 0 && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                            V: {formatNumber(transaction.amounts.viloyatAgent)}
                          </span>
                        )}
                        {transaction.amounts?.tumanAgent > 0 && (
                          <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded">
                            T: {formatNumber(transaction.amounts.tumanAgent)}
                          </span>
                        )}
                        {transaction.amounts?.mfyAgent > 0 && (
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
                            M: {formatNumber(transaction.amounts.mfyAgent)}
                          </span>
                        )}
                        {transaction.amounts?.finance > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            F: {formatNumber(transaction.amounts.finance)}
                          </span>
                        )}
                        {transaction.amounts?.punktTransfer > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            TR: {formatNumber(transaction.amounts.punktTransfer)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.isPaid 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {transaction.isPaid ? 'To\'langan' : 'Kutilmoqda'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewTransaction(transaction)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="Ko'rish"
                      >
                        <Visibility className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                Jami <span className="font-medium">{pagination.total}</span> ta transaksiyadan{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                ko'rsatilmoqda
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                >
                  Oldingi
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                >
                  Keyingi
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTransaction(null);
        }}
      />
    </div>
  );
};

export default KPITransactionsSection;

