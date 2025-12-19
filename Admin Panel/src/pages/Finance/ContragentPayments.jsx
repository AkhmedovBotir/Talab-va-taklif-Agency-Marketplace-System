import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { contragentPaymentAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import RegionSelect from '../../components/Regions/RegionSelect';
import ContragentPaymentTable from '../../components/Finance/ContragentPaymentTable';
import { 
  Search, 
  Clear, 
  Sync, 
  CheckCircle, 
  AccountBalance,
  TrendingUp,
  Warning
} from '@mui/icons-material';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

const ContragentPayments = ({ hideHeader = false }) => {
  const { showError, showSuccess } = useSnackbar();
  const [activeView, setActiveView] = useState('unpaid'); // 'unpaid', 'paid', 'statistics'
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    search: '',
    contragentId: '',
    viloyatId: '',
    tumanId: '',
    mfyId: '',
    isOverdue: '',
    startDate: '',
    endDate: '',
  });

  const [statistics, setStatistics] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [markAsPaidModalOpen, setMarkAsPaidModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [dueDateDays, setDueDateDays] = useState(7);

  // Fetch unpaid payments
  const fetchUnpaidPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.contragentId) params.contragentId = filters.contragentId;
      if (filters.viloyatId) params.viloyatId = filters.viloyatId;
      if (filters.tumanId) params.tumanId = filters.tumanId;
      if (filters.mfyId) params.mfyId = filters.mfyId;
      if (filters.isOverdue !== '') params.isOverdue = filters.isOverdue === 'true';

      const response = await contragentPaymentAPI.getUnpaidPayments(params);

      if (response.success) {
        setPayments(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'To\'lanmagan to\'lovlarni yuklashda xatolik yuz berdi';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filters.contragentId,
    filters.viloyatId,
    filters.tumanId,
    filters.mfyId,
    filters.isOverdue,
    showError,
  ]);

  // Fetch paid payments
  const fetchPaidPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.contragentId) params.contragentId = filters.contragentId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await contragentPaymentAPI.getPaidPayments(params);

      if (response.success) {
        setPayments(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'To\'langan to\'lovlarni yuklashda xatolik yuz berdi';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filters.contragentId,
    filters.startDate,
    filters.endDate,
    showError,
  ]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await contragentPaymentAPI.getStatistics(params);

      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      const errorMsg = err.message || 'Statistikani yuklashda xatolik yuz berdi';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, showError]);

  useEffect(() => {
    if (activeView === 'unpaid') {
      fetchUnpaidPayments();
    } else if (activeView === 'paid') {
      fetchPaidPayments();
    } else if (activeView === 'statistics') {
      fetchStatistics();
    }
  }, [activeView, fetchUnpaidPayments, fetchPaidPayments, fetchStatistics]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleMarkAsPaid = async () => {
    if (selectedPayments.length === 0) {
      showError('To\'lovlarni tanlang');
      return;
    }

    try {
      const response = await contragentPaymentAPI.markAsPaid(selectedPayments, notes);
      if (response.success) {
        showSuccess(response.message || 'To\'lovlar muvaffaqiyatli to\'landi deb belgilandi');
        setMarkAsPaidModalOpen(false);
        setSelectedPayments([]);
        setNotes('');
        if (activeView === 'unpaid') {
          fetchUnpaidPayments();
        }
      }
    } catch (err) {
      showError(err.message || 'To\'lovlarni belgilashda xatolik yuz berdi');
    }
  };

  const handleSync = async () => {
    try {
      const response = await contragentPaymentAPI.syncPayments(dueDateDays);
      if (response.success) {
        showSuccess(response.message || 'To\'lovlar muvaffaqiyatli sinxronlashtirildi');
        setSyncModalOpen(false);
        setDueDateDays(7);
        if (activeView === 'unpaid') {
          fetchUnpaidPayments();
        }
      }
    } catch (err) {
      showError(err.message || 'Sinxronlashtirishda xatolik yuz berdi');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      contragentId: '',
      viloyatId: '',
      tumanId: '',
      mfyId: '',
      isOverdue: '',
      startDate: '',
      endDate: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  // Filter payments by search
  const filteredPayments = payments.filter((payment) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      payment.contragent?.name?.toLowerCase().includes(search) ||
      payment.contragent?.inn?.includes(search) ||
      payment.contragent?.phone?.includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideHeader && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Contragent To'lovlari</h1>
            <p className="text-gray-600">Contragentlarga to'lovlarni tarqatish va boshqarish</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSyncModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Sync />
              <span>Sinxronlashtirish</span>
            </button>
            {activeView === 'unpaid' && selectedPayments.length > 0 && (
              <button
                onClick={() => setMarkAsPaidModalOpen(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <CheckCircle />
                <span>To'landi deb belgilash ({selectedPayments.length})</span>
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* View Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max">
              <button
                onClick={() => setActiveView('unpaid')}
                className={`
                  px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                  ${
                    activeView === 'unpaid'
                      ? 'border-red-500 text-red-600 bg-red-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                To'lanmagan To'lovlar
              </button>
              <button
                onClick={() => setActiveView('paid')}
                className={`
                  px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                  ${
                    activeView === 'paid'
                      ? 'border-green-500 text-green-600 bg-green-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                To'langan To'lovlar
              </button>
              <button
                onClick={() => setActiveView('statistics')}
                className={`
                  px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                  ${
                    activeView === 'statistics'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Statistika
              </button>
            </div>
          </nav>
        </div>

        <div className="p-6">
          {/* Filters */}
          {(activeView === 'unpaid' || activeView === 'paid') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <Clear className="w-4 h-4" />
                  <span>Tozalash</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Qidirish..."
                    value={filters.search}
                    onChange={(e) => {
                      setFilters({ ...filters, search: e.target.value });
                      setPagination({ ...pagination, page: 1 });
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {activeView === 'unpaid' && (
                  <>
                    <RegionSelect
                      name="viloyatId"
                      value={filters.viloyatId}
                      onChange={(e) => {
                        setFilters({ ...filters, viloyatId: e.target.value, tumanId: '', mfyId: '' });
                        setPagination({ ...pagination, page: 1 });
                      }}
                      label="Viloyat"
                      type="region"
                    />
                    <RegionSelect
                      name="tumanId"
                      value={filters.tumanId}
                      onChange={(e) => {
                        setFilters({ ...filters, tumanId: e.target.value, mfyId: '' });
                        setPagination({ ...pagination, page: 1 });
                      }}
                      label="Tuman"
                      type="district"
                      parentId={filters.viloyatId || undefined}
                      disabled={!filters.viloyatId}
                    />
                    <RegionSelect
                      name="mfyId"
                      value={filters.mfyId}
                      onChange={(e) => {
                        setFilters({ ...filters, mfyId: e.target.value });
                        setPagination({ ...pagination, page: 1 });
                      }}
                      label="MFY"
                      type="mfy"
                      parentId={filters.tumanId || undefined}
                      disabled={!filters.tumanId}
                    />
                    <select
                      value={filters.isOverdue}
                      onChange={(e) => {
                        setFilters({ ...filters, isOverdue: e.target.value });
                        setPagination({ ...pagination, page: 1 });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Barcha to'lovlar</option>
                      <option value="true">Muddat o'tgan</option>
                      <option value="false">Muddat o'tmagan</option>
                    </select>
                  </>
                )}

                {activeView === 'paid' && (
                  <>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => {
                        setFilters({ ...filters, startDate: e.target.value });
                        setPagination({ ...pagination, page: 1 });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Boshlanish sanasi"
                    />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => {
                        setFilters({ ...filters, endDate: e.target.value });
                        setPagination({ ...pagination, page: 1 });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Tugash sanasi"
                    />
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Statistics View */}
          {activeView === 'statistics' && statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">To'lanmagan</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatNumber(statistics.unpaid?.totalAmount)} so'm
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatNumber(statistics.unpaid?.count)} ta to'lov
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Warning className="text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">To'langan</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatNumber(statistics.paid?.totalAmount)} so'm
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatNumber(statistics.paid?.count)} ta to'lov
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Muddat o'tgan</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatNumber(statistics.overdue?.totalAmount)} so'm
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatNumber(statistics.overdue?.count)} ta to'lov
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Warning className="text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {(activeView === 'unpaid' || activeView === 'paid') && (
            <ContragentPaymentTable
              payments={filteredPayments}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              activeView={activeView}
              selectedPayments={selectedPayments}
              onSelectPayment={(paymentId) => {
                if (selectedPayments.includes(paymentId)) {
                  setSelectedPayments(selectedPayments.filter((id) => id !== paymentId));
                } else {
                  setSelectedPayments([...selectedPayments, paymentId]);
                }
              }}
              onSelectAll={(selectAll) => {
                if (selectAll) {
                  setSelectedPayments(filteredPayments.map((p) => p._id));
                } else {
                  setSelectedPayments([]);
                }
              }}
            />
          )}
        </div>
      </motion.div>

      {/* Mark as Paid Modal */}
      {markAsPaidModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">To'lovlarni to'landi deb belgilash</h2>
            <p className="text-sm text-gray-600 mb-4">
              {selectedPayments.length} ta to'lov to'landi deb belgilanmoqda
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qo'shimcha ma'lumotlar (ixtiyoriy)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Masalan: Naqd pul orqali to'landi"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setMarkAsPaidModalOpen(false);
                  setNotes('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleMarkAsPaid}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Tasdiqlash
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sync Modal */}
      {syncModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">To'lovlarni sinxronlashtirish</h2>
            <p className="text-sm text-gray-600 mb-4">
              Buyurtmalardan Contragent to'lovlarini yaratish/yangilash
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To'lov muddati (kunlar soni)
              </label>
              <input
                type="number"
                value={dueDateDays}
                onChange={(e) => setDueDateDays(Number(e.target.value))}
                min={1}
                max={30}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                To'lov muddati = Hozirgi sana + {dueDateDays} kun
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setSyncModalOpen(false);
                  setDueDateDays(7);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSync}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Sinxronlashtirish
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ContragentPayments;

