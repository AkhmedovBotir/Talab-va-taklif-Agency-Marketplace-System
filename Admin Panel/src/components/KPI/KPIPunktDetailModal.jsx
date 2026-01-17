import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { kpiAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Close, CheckCircle, Cancel } from '@mui/icons-material';
import { formatTableDate } from '../../utils/dateFormatter';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

const bonusTypeLabels = {
  regular: 'Oddiy',
  from_punkt: 'Transfer (jo\'natuvchi)',
  to_punkt: 'Transfer (qabul qiluvchi)',
  mixed: 'Aralash',
};

const KPIPunktDetailModal = ({ punktId, open, onClose }) => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const fetchDetails = async () => {
    if (!punktId) return;
    setLoading(true);
    try {
      const response = await kpiAPI.getPunktKPIDetails(punktId, {
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      showError(error.message || 'Punkt ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && punktId) {
      fetchDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, punktId, pagination.page]);

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
              <h2 className="text-xl font-bold text-gray-800">Punkt KPI Tafsilotlari</h2>
              <p className="text-sm text-gray-500">{data?.punkt?.name || 'Yuklanmoqda...'}</p>
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
              {/* Punkt Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Punkt ma'lumotlari</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nomi:</span>
                      <span className="font-medium">{data?.punkt?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Telefon:</span>
                      <span className="font-medium">{data?.punkt?.phone || '-'}</span>
                    </div>
                    {data?.punkt?.viloyat && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Viloyat:</span>
                        <span className="font-medium">{data.punkt.viloyat.name}</span>
                      </div>
                    )}
                    {data?.punkt?.tuman && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tuman:</span>
                        <span className="font-medium">{data.punkt.tuman.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-600 uppercase mb-3">KPI Xulosasi</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jami transaksiyalar:</span>
                      <span className="font-bold text-purple-600">{data?.summary?.totalTransactions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jami summa:</span>
                      <span className="font-bold text-purple-600">{formatNumber(data?.summary?.totalAmount)} so'm</span>
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
                {data?.data && data.data.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Buyurtma</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mahsulot</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Punkt summasi</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Holat</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Sana</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.data.map((tx, index) => (
                          <tr key={tx._id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">#{tx.order?.orderNumber || '-'}</td>
                            <td className="px-4 py-2 text-sm">{tx.orderItem?.product?.name || '-'}</td>
                            <td className="px-4 py-2 text-sm font-medium text-purple-600">
                              {formatNumber(tx.punktAmount)} so'm
                            </td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                tx.isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {tx.isPaid ? <CheckCircle className="w-3 h-3" /> : <Cancel className="w-3 h-3" />}
                                {tx.isPaid ? 'To\'langan' : 'Kutilmoqda'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">{formatTableDate(tx.createdAt)}</td>
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
                {data?.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-500">
                      {data.total || 0} ta transaksiyadan {data.count || 0} ta ko'rsatilmoqda
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
                        disabled={pagination.page >= (data.totalPages || 1)}
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

export default KPIPunktDetailModal;













