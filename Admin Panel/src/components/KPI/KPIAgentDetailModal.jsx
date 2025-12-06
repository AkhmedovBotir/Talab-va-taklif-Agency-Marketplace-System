import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { kpiAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Close, CheckCircle, Cancel } from '@mui/icons-material';

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

const KPIAgentDetailModal = ({ agentId, role, open, onClose }) => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const fetchDetails = async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const response = await kpiAPI.getAgentKPIDetails(agentId, {
        role,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      showError(error.message || 'Agent ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && agentId) {
      fetchDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, agentId, pagination.page]);

  if (!open) return null;

  const roleLabels = {
    viloyat: 'Viloyat',
    tuman: 'Tuman',
    mfy: 'MFY',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-[99]"
        style={{ marginTop: 0 }}
        onClick={onClose}
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
              <h2 className="text-xl font-bold text-gray-800">
                {roleLabels[data?.role] || ''} Agent KPI Tafsilotlari
              </h2>
              <p className="text-sm text-gray-500">{data?.agent?.name || 'Yuklanmoqda...'}</p>
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
              {/* Agent Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Agent ma'lumotlari</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ism:</span>
                      <span className="font-medium">{data?.agent?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Telefon:</span>
                      <span className="font-medium">{data?.agent?.phone || '-'}</span>
                    </div>
                    {data?.agent?.viloyat && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Viloyat:</span>
                        <span className="font-medium">{data.agent.viloyat.name}</span>
                      </div>
                    )}
                    {data?.agent?.tuman && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tuman:</span>
                        <span className="font-medium">{data.agent.tuman.name}</span>
                      </div>
                    )}
                    {data?.agent?.mfy && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">MFY:</span>
                        <span className="font-medium">{data.agent.mfy.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-indigo-600 uppercase mb-3">KPI Xulosasi</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jami transaksiyalar:</span>
                      <span className="font-bold text-indigo-600">{data?.summary?.totalTransactions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jami summa:</span>
                      <span className="font-bold text-indigo-600">{formatNumber(data?.summary?.totalAmount)} so'm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To'langan:</span>
                      <span className="font-medium text-green-600">{formatNumber(data?.summary?.paidAmount)} so'm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To'lanmagan:</span>
                      <span className="font-medium text-amber-600">{formatNumber(data?.summary?.unpaidAmount)} so'm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Transaksiyalar</h3>
                {data?.transactions?.data?.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Buyurtma</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mahsulot</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Agent summasi</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Holat</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Sana</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.transactions.data.map((tx, index) => (
                          <tr key={tx._id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">#{tx.order?.orderNumber || '-'}</td>
                            <td className="px-4 py-2 text-sm">{tx.orderItem?.product?.name || '-'}</td>
                            <td className="px-4 py-2 text-sm font-medium text-indigo-600">
                              {formatNumber(tx.agentAmount)} so'm
                            </td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                tx.isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {tx.isPaid ? <CheckCircle className="w-3 h-3" /> : <Cancel className="w-3 h-3" />}
                                {tx.isPaid ? 'To\'langan' : 'Kutilmoqda'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">{formatDate(tx.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    Transaksiyalar topilmadi
                  </div>
                )}

                {/* Pagination */}
                {data?.transactions?.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-500">
                      {data.transactions.total} ta transaksiyadan {data.transactions.count} ta ko'rsatilmoqda
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Oldingi
                      </button>
                      <button
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        disabled={pagination.page >= data.transactions.totalPages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Keyingi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default KPIAgentDetailModal;













