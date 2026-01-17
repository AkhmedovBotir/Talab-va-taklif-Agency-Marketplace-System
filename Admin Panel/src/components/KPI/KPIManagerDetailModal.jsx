import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { kpiAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Close } from '@mui/icons-material';
import { formatTableDate } from '../../utils/dateFormatter';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

const KPIManagerDetailModal = ({ managerId, open, onClose }) => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const fetchDetails = async () => {
    if (!managerId) return;
    setLoading(true);
    try {
      const response = await kpiAPI.getManagerKPIDetails(managerId, {
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      showError(error.message || 'Menejer ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && managerId) {
      fetchDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, managerId, pagination.page]);

  const handlePageChange = (page) => {
    setPagination({ ...pagination, page });
  };

  if (!open) return null;

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
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Menejer KPI Tafsilotlari</h2>
              <p className="text-sm text-gray-500">{data?.manager?.name || 'Yuklanmoqda...'}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Close />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Manager Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Menejer ma'lumotlari</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nomi:</span>
                      <span className="font-medium">{data?.manager?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Telefon:</span>
                      <span className="font-medium">{data?.manager?.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Viloyat:</span>
                      <span className="font-medium">{data?.manager?.viloyat?.name || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">KPI Statistikasi</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jami transaksiyalar:</span>
                      <span className="font-bold text-indigo-700">{data?.summary?.totalTransactions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jami summa:</span>
                      <span className="font-bold text-indigo-700">{formatNumber(data?.summary?.totalAmount)} so'm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To'langan:</span>
                      <span className="font-bold text-green-600">{formatNumber(data?.summary?.paidAmount)} so'm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To'lanmagan:</span>
                      <span className="font-bold text-amber-600">{formatNumber(data?.summary?.unpaidAmount)} so'm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              {data?.transactions?.data && data.transactions.data.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">KPI Transaksiyalar</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyurtma</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maxsulot</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">KPI miqdori</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Menejer qismi</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holat</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.transactions.data.map((transaction, index) => (
                          <tr key={transaction._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {(pagination.page - 1) * pagination.limit + index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-gray-900">
                                {transaction.order?.orderNumber || '-'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatNumber(transaction.order?.totalPrice)} so'm
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-gray-900">
                                {transaction.orderItem?.product?.name || '-'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {transaction.orderItem?.quantity || 0} ta
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-purple-600">
                              {formatNumber(transaction.totalKpiAmount)} so'm
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-indigo-600">
                              {formatNumber(transaction.managerAmount || transaction.amounts?.manager)} so'm
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  transaction.isPaid
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {transaction.isPaid ? 'To\'langan' : 'To\'lanmagan'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {formatTableDate(transaction.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {data.transactions.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Jami <span className="font-medium">{data.transactions.total || 0}</span> ta transaksiyadan{' '}
                        <span className="font-medium">
                          {(pagination.page - 1) * pagination.limit + 1}-
                          {Math.min(pagination.page * pagination.limit, data.transactions.total || 0)}
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
                          disabled={pagination.page >= (data.transactions.totalPages || 1)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                        >
                          Keyingi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Transaksiyalar topilmadi
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Yopish
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default KPIManagerDetailModal;
