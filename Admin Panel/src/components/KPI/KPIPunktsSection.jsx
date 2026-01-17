import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { kpiAPI, regionAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import RegionSelect from '../Regions/RegionSelect';
import { Visibility } from '@mui/icons-material';
import KPIPunktDetailModal from './KPIPunktDetailModal';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

const KPIPunktsSection = () => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [punkts, setPunkts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    viloyatId: '',
    tumanId: '',
    punktId: '',
    isPaid: '',
    startDate: '',
    endDate: '',
  });
  const [selectedPunkt, setSelectedPunkt] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPunkts = async ({ page, limit } = {}) => {
    setLoading(true);
    try {
      const appliedPage = page ?? pagination.page;
      const appliedLimit = limit ?? pagination.limit;

      const params = {
        page: appliedPage,
        limit: appliedLimit,
      };

      if (filters.viloyatId) params.viloyatId = filters.viloyatId;
      if (filters.tumanId) params.tumanId = filters.tumanId;
      if (filters.punktId) params.punktId = filters.punktId;
      if (filters.isPaid !== '') params.isPaid = filters.isPaid === 'true';
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

      const response = await kpiAPI.getPunktsKPI(params);
      if (response.success) {
        setPunkts(response.data || []);
        setPagination({
          page: response.page || appliedPage,
          limit: response.limit || appliedLimit,
          total: response.total || response.count || 0,
          pages: response.totalPages || 0,
        });
      }
    } catch (error) {
      showError(error.message || 'Punktlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPunkts({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (filters.viloyatId) {
      setFilters(prev => ({ ...prev, tumanId: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.viloyatId]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchPunkts({ page: 1 });
  };

  const handleResetFilters = () => {
    setFilters({ viloyatId: '', tumanId: '', punktId: '', isPaid: '', startDate: '', endDate: '' });
    setTimeout(() => fetchPunkts({ page: 1 }), 0);
  };

  const handlePageChange = (page) => {
    if (page < 1 || (pagination.pages && page > pagination.pages)) return;
    fetchPunkts({ page });
  };

  const handleViewPunkt = (punkt) => {
    setSelectedPunkt(punkt.punkt);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg">
        <div>
          <RegionSelect
            name="viloyatId"
            value={filters.viloyatId}
            onChange={(e) => {
              handleFilterChange('viloyatId', e.target.value);
              handleFilterChange('tumanId', '');
            }}
            label="Viloyat"
            type="region"
          />
        </div>
        <div>
          <RegionSelect
            name="tumanId"
            value={filters.tumanId}
            onChange={(e) => handleFilterChange('tumanId', e.target.value)}
            label="Tuman"
            type="district"
            parentId={filters.viloyatId || undefined}
            disabled={!filters.viloyatId}
          />
        </div>
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
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      ) : punkts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Punktlar topilmadi</div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Punkt</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viloyat</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tuman</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaksiyalar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jami summa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To'langan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To'lanmagan</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {punkts.map((item, index) => (
                  <motion.tr
                    key={item.punkt?._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.punkt?.name || '-'}</div>
                      <div className="text-xs text-gray-500">{item.punkt?.phone || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.punkt?.viloyat?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.punkt?.tuman?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.totalTransactions || 0}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-purple-600">
                      {formatNumber(item.totalAmount)} so'm
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600">
                      {formatNumber(item.paidAmount)} so'm
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-600">
                      {formatNumber(item.unpaidAmount)} so'm
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewPunkt(item)}
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                Jami <span className="font-medium">{pagination.total}</span> ta punktdan{' '}
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
      <KPIPunktDetailModal
        punktId={selectedPunkt?._id}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPunkt(null);
        }}
      />
    </div>
  );
};

export default KPIPunktsSection;













