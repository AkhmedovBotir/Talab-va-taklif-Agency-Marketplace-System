import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { kpiPaymentAPI } from '../../../services/api';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { formatDate, formatDateTime } from '../../../utils/dateFormatter';
import { 
  CheckBox, 
  CheckBoxOutlineBlank, 
  CheckCircle, 
  Visibility,
  Refresh
} from '@mui/icons-material';
import MarkAsPaidModal from './MarkAsPaidModal';
import ViewPaymentModal from './ViewPaymentModal';

const UnpaidPaymentsTab = () => {
  const { showError, showSuccess } = useSnackbar();
  const [payments, setPayments] = useState([]);
  const [groupedPayments, setGroupedPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'list'
  const [selectedPayments, setSelectedPayments] = useState(new Set());
  const [markAsPaidModalOpen, setMarkAsPaidModalOpen] = useState(false);
  const [viewPaymentModalOpen, setViewPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filters, setFilters] = useState({
    recipientType: '',
    agentType: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchUnpaidPayments = async () => {
    setLoading(true);
    try {
      if (viewMode === 'grouped') {
        const response = await kpiPaymentAPI.getUnpaidPaymentsGrouped(filters);
        if (response.success) {
          setGroupedPayments(response.data || []);
        }
      } else {
        const response = await kpiPaymentAPI.getUnpaidPayments({
          ...filters,
          page: pagination.page,
          limit: pagination.limit,
        });
        if (response.success) {
          setPayments(response.data || []);
          console.log("response.data", response.data);
          setPagination({
            page: response.page || 1,
            limit: response.limit || 50,
            total: response.total || 0,
            totalPages: response.totalPages || 0,
          });
        }
      }
    } catch (err) {
      showError(err.message || 'To\'lanmagan to\'lovlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaidPayments();
  }, [viewMode, filters, pagination.page, pagination.limit]);

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const handleSelectAll = () => {
    if (viewMode === 'grouped') {
      if (selectedPayments.size === groupedPayments.length) {
        setSelectedPayments(new Set());
      } else {
        setSelectedPayments(new Set(groupedPayments.map(p => p.recipient?._id)));
      }
    } else {
      if (selectedPayments.size === payments.length) {
        setSelectedPayments(new Set());
      } else {
        setSelectedPayments(new Set(payments.map(p => p._id)));
      }
    }
  };

  const handleSelectPayment = (id) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPayments(newSelected);
  };

  const handleMarkAsPaid = () => {
    if (selectedPayments.size === 0) {
      showError('Iltimos, kamida bitta to\'lovni tanlang');
      return;
    }
    setMarkAsPaidModalOpen(true);
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setViewPaymentModalOpen(true);
  };

  const handleMarkAsPaidSuccess = () => {
    setSelectedPayments(new Set());
    fetchUnpaidPayments();
  };

  const getPaymentIds = () => {
    if (viewMode === 'grouped') {
      // For grouped view, we need to get individual payment IDs
      // This would require fetching individual payments for selected recipients
      return Array.from(selectedPayments);
    } else {
      return Array.from(selectedPayments);
    }
  };

  const totalUnpaidAmount = viewMode === 'grouped' 
    ? groupedPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0)
    : payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      {/* Filters and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="manager">Menejer</option>
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
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grouped' ? 'list' : 'grouped')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              {viewMode === 'grouped' ? 'Ro\'yxat ko\'rinishi' : 'Guruhlangan ko\'rinish'}
            </button>
            <button
              onClick={fetchUnpaidPayments}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Refresh className="w-4 h-4" />
              Yangilash
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-600 font-medium">Jami to'lanmagan summa</p>
            <p className="text-2xl font-bold text-indigo-900">{formatAmount(totalUnpaidAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-indigo-600 font-medium">To'lovlar soni</p>
            <p className="text-2xl font-bold text-indigo-900">
              {viewMode === 'grouped' ? groupedPayments.length : pagination.total}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action Bar */}
      {selectedPayments.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-600 text-white rounded-lg p-4 mb-6 flex items-center justify-between"
        >
          <span className="font-medium">
            {selectedPayments.size} ta to'lov tanlangan
          </span>
          <button
            onClick={handleMarkAsPaid}
            className="px-4 py-2 bg-white text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors font-medium"
          >
            To'landi deb belgilash
          </button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center"
                    >
                      {selectedPayments.size === groupedPayments.length && groupedPayments.length > 0 ? (
                        <CheckBox className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <CheckBoxOutlineBlank className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qabul qiluvchi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hudud</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jami summa</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">To'lovlar soni</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {groupedPayments.map((payment, index) => {
                  const isSelected = selectedPayments.has(payment.recipient?._id);
                  return (
                    <tr key={payment.recipient?._id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSelectPayment(payment.recipient?._id)}
                          className="flex items-center"
                        >
                          {isSelected ? (
                            <CheckBox className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <CheckBoxOutlineBlank className="w-5 h-5 text-gray-400 hover:text-indigo-600" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{payment.recipient?.name || '-'}</div>
                          {payment.recipient?.phone && (
                            <div className="text-sm text-gray-500">{payment.recipient.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {payment.recipientType === 'agent' ? 'Agent' : payment.recipientType === 'manager' ? 'Menejer' : 'Punkt'}
                          {payment.agentType && ` (${payment.agentType})`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.recipient?.viloyat?.name || '-'}
                        {payment.recipient?.tuman?.name && `, ${payment.recipient.tuman.name}`}
                        {payment.recipient?.mfy?.name && `, ${payment.recipient.mfy.name}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatAmount(payment.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {payment.paymentsCount || 0}
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
                  );
                })}
              </tbody>
            </table>
          </div>
          {groupedPayments.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              To'lanmagan to'lovlar topilmadi
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <button onClick={handleSelectAll} className="flex items-center">
                        {selectedPayments.size === payments.length && payments.length > 0 ? (
                          <CheckBox className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <CheckBoxOutlineBlank className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qabul qiluvchi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turi</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yaratilgan</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment, index) => {
                    const isSelected = selectedPayments.has(payment._id);
                    return (
                      <tr key={payment._id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleSelectPayment(payment._id)}
                            className="flex items-center"
                          >
                            {isSelected ? (
                              <CheckBox className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <CheckBoxOutlineBlank className="w-5 h-5 text-gray-400 hover:text-indigo-600" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{payment.recipient?.name || '-'}</div>
                            {payment.recipient?.phone && (
                              <div className="text-sm text-gray-500">{payment.recipient.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {payment.recipientType === 'agent' ? 'Agent' : payment.recipientType === 'manager' ? 'Menejer' : 'Punkt'}
                            {payment.agentType && ` (${payment.agentType})`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {formatAmount(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.createdAt)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
            {payments.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                To'lanmagan to'lovlar topilmadi
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

      {/* Modals */}
      <MarkAsPaidModal
        open={markAsPaidModalOpen}
        onClose={() => setMarkAsPaidModalOpen(false)}
        paymentIds={getPaymentIds()}
        viewMode={viewMode}
        onSuccess={handleMarkAsPaidSuccess}
      />
      <ViewPaymentModal
        open={viewPaymentModalOpen}
        onClose={() => setViewPaymentModalOpen(false)}
        payment={selectedPayment}
        viewMode={viewMode}
      />
    </div>
  );
};

export default UnpaidPaymentsTab;


