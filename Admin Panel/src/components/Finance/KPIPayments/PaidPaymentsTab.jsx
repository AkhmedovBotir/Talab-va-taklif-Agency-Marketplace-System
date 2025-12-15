import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { kpiPaymentAPI } from '../../../services/api';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { formatDate, formatDateTime } from '../../../utils/dateFormatter';
import { Visibility, Refresh } from '@mui/icons-material';
import ViewPaymentModal from './ViewPaymentModal';

const PaidPaymentsTab = () => {
  const { showError } = useSnackbar();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewPaymentModalOpen, setViewPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filters, setFilters] = useState({
    recipientType: '',
    agentType: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchPaidPayments = async () => {
    setLoading(true);
    try {
      const response = await kpiPaymentAPI.getPaidPayments({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.success) {
        setPayments(response.data || []);
        setPagination({
          page: response.page || 1,
          limit: response.limit || 50,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
      }
    } catch (err) {
      showError(err.message || 'To\'langan to\'lovlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaidPayments();
  }, [filters, pagination.page, pagination.limit]);

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setViewPaymentModalOpen(true);
  };

  const totalPaidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Qabul qiluvchi turi</label>
            <select
              value={filters.recipientType}
              onChange={(e) => setFilters({ ...filters, recipientType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barchasi</option>
              <option value="agent">Agent</option>
              <option value="punkt">Punkt</option>
            </select>
          </div>
          {filters.recipientType === 'agent' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agent turi</label>
              <select
                value={filters.agentType}
                onChange={(e) => setFilters({ ...filters, agentType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Barchasi</option>
                <option value="viloyat">Viloyat</option>
                <option value="tuman">Tuman</option>
                <option value="mfy">MFY</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Boshlanish sanasi</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tugash sanasi</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={fetchPaidPayments}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Refresh className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 font-medium">Jami to'langan summa</p>
            <p className="text-2xl font-bold text-green-900">{formatAmount(totalPaidAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-600 font-medium">To'lovlar soni</p>
            <p className="text-2xl font-bold text-green-900">{pagination.total}</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qabul qiluvchi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turi</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To'landi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To'lovchi</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment, index) => (
                    <tr key={payment._id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{payment.recipient?.name || '-'}</div>
                          {payment.recipient?.phone && (
                            <div className="text-sm text-gray-500">{payment.recipient.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {payment.recipientType === 'agent' ? 'Agent' : 'Punkt'}
                          {payment.agentType && ` (${payment.agentType})`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatAmount(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paidAt ? formatDateTime(payment.paidAt) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paidBy?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewPayment(payment)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                        >
                          <Visibility className="w-4 h-4" />
                          Ko'rish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {payments.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                To'langan to'lovlar topilmadi
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {pagination.page * pagination.limit - pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dan {pagination.total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Oldingi
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Keyingi
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ViewPaymentModal
        open={viewPaymentModalOpen}
        onClose={() => setViewPaymentModalOpen(false)}
        payment={selectedPayment}
        viewMode="list"
      />
    </div>
  );
};

export default PaidPaymentsTab;


