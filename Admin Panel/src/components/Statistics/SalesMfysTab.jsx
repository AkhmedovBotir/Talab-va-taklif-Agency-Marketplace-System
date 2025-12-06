import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { salesStatsAPI, regionAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Visibility, Close } from '@mui/icons-material';
import HorizontalBarChart from './HorizontalBarChart';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const orderStatusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'delivered_to_punkt', label: 'Punktga yetkazildi' },
  { value: 'assigned_to_agent', label: 'Agentga biriktirildi' },
  { value: 'confirmed_by_agent', label: 'Agent tasdiqladi' },
  { value: 'confirmed_by_customer', label: 'Mijoz qabul qildi' },
  { value: 'cancelled', label: 'Bekor qilingan' },
  { value: 'returned', label: 'Qaytarilgan' },
];

// Detail Modal
const MfyDetailModal = ({ mfyId, mfyName, filters, open, onClose }) => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    if (!mfyId) return;
    setLoading(true);
    try {
      const response = await salesStatsAPI.getMfyStats(mfyId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
      });
      if (response.success) {
        setData(response);
      }
    } catch (error) {
      showError(error.message || 'Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && mfyId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mfyId]);

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
              <h2 className="text-xl font-bold text-gray-800">{mfyName}</h2>
              <p className="text-sm text-gray-500">Kunlik statistika</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Close />
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* MFY Info */}
                {data?.mfy?.parent && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Joylashuv</p>
                    <p className="font-medium">
                      {data.mfy.parent?.parent?.name || ''} → {data.mfy.parent?.name || ''} → {data.mfy.name}
                    </p>
                  </div>
                )}

                {/* Totals */}
                <div className="grid grid-cols-3 gap-4 bg-teal-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Jami buyurtmalar</p>
                    <p className="text-xl font-bold text-teal-600">{formatNumber(data?.totals?.totalOrders)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Jami daromad</p>
                    <p className="text-xl font-bold text-green-600">{formatNumber(data?.totals?.totalRevenue)} so'm</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Jami mahsulotlar</p>
                    <p className="text-xl font-bold text-purple-600">{formatNumber(data?.totals?.totalItems)}</p>
                  </div>
                </div>

                {/* Daily Data Table */}
                {data?.data?.length > 0 && (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-96">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Daromad</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mahsulotlar</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">O'rtacha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.data.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{formatDate(item.date)}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{formatNumber(item.totalOrders)}</td>
                            <td className="px-4 py-2 text-sm font-semibold text-green-600">{formatNumber(item.totalRevenue)} so'm</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{formatNumber(item.totalItems)}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{formatNumber(item.avgOrderValue)} so'm</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const SalesMfysTab = () => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [viloyatlar, setViloyatlar] = useState([]);
  const [tumanlar, setTumanlar] = useState([]);
  const [filters, setFilters] = useState({
    viloyatId: '',
    tumanId: '',
    startDate: '',
    endDate: '',
    status: 'confirmed_by_customer',
  });
  const [selectedMfy, setSelectedMfy] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchViloyatlar = async () => {
    try {
      const response = await regionAPI.getRegionsByType('viloyat', { status: 'active' });
      if (response.success) setViloyatlar(response.data || []);
    } catch (error) {
      console.error('Viloyatlarni yuklashda xatolik:', error);
    }
  };

  const fetchTumanlar = async (viloyatId) => {
    if (!viloyatId) {
      setTumanlar([]);
      return;
    }
    try {
      const response = await regionAPI.getRegionChildren(viloyatId, { status: 'active' });
      if (response.success) setTumanlar(response.data || []);
    } catch (error) {
      console.error('Tumanlarni yuklashda xatolik:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.viloyatId) params.viloyatId = filters.viloyatId;
      if (filters.tumanId) params.tumanId = filters.tumanId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      const response = await salesStatsAPI.getByMfys(params);
      if (response.success) {
        setData(response);
      }
    } catch (error) {
      showError(error.message || 'Statistikani yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViloyatlar();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTumanlar(filters.viloyatId);
    setFilters(prev => ({ ...prev, tumanId: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.viloyatId]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchData();
  };

  const handleResetFilters = () => {
    setFilters({ viloyatId: '', tumanId: '', startDate: '', endDate: '', status: 'confirmed_by_customer' });
    setTumanlar([]);
    setTimeout(fetchData, 0);
  };

  const handleViewMfy = (mfy) => {
    setSelectedMfy(mfy);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Viloyat</label>
          <select
            value={filters.viloyatId}
            onChange={(e) => handleFilterChange('viloyatId', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barchasi</option>
            {viloyatlar.map((v) => (
              <option key={v._id} value={v._id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tuman</label>
          <select
            value={filters.tumanId}
            onChange={(e) => handleFilterChange('tumanId', e.target.value)}
            disabled={!filters.viloyatId}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
          >
            <option value="">Barchasi</option>
            {tumanlar.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {orderStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4 bg-teal-50 p-4 rounded-lg">
        <div>
          <p className="text-sm text-gray-500">Jami buyurtmalar</p>
          <p className="text-2xl font-bold text-teal-600">{formatNumber(data?.totals?.totalOrders)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Jami daromad</p>
          <p className="text-2xl font-bold text-green-600">{formatNumber(data?.totals?.totalRevenue)} so'm</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Jami mahsulotlar</p>
          <p className="text-2xl font-bold text-purple-600">{formatNumber(data?.totals?.totalItems)}</p>
        </div>
      </div>

      {/* Bar Chart */}
      {data?.data?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">MFYlar bo'yicha daromad (Top 20)</h3>
          <div className="max-h-[500px] overflow-y-auto">
            <HorizontalBarChart
              data={data.data.slice(0, 20)}
              labelKey={(item) => item.mfy?.name || '-'}
              valueKey="totalRevenue"
              color="bg-teal-500"
              formatValue={(v) => `${formatNumber(v)} so'm`}
            />
          </div>
        </div>
      )}

      {/* Table */}
      {data?.data?.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viloyat</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tuman</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MFY</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Daromad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahsulotlar</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((item, index) => (
                <motion.tr
                  key={item.mfy?._id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-600">{item.viloyat?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.tuman?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.mfy?.name || '-'}</div>
                    <div className="text-xs text-gray-500">{item.mfy?.code || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatNumber(item.totalOrders)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatNumber(item.totalRevenue)} so'm</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(item.totalItems)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleViewMfy(item.mfy)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                      title="Batafsil"
                    >
                      <Visibility className="w-5 h-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">Ma'lumotlar topilmadi</div>
      )}

      {/* Detail Modal */}
      <MfyDetailModal
        mfyId={selectedMfy?._id}
        mfyName={selectedMfy?.name}
        filters={filters}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedMfy(null);
        }}
      />
    </div>
  );
};

export default SalesMfysTab;

