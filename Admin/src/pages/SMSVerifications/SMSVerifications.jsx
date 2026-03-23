import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminDataAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import SMSVerificationTable from '../../components/SMSVerifications/SMSVerificationTable';
import ViewSMSVerificationModal from '../../components/SMSVerifications/ViewSMSVerificationModal';
import { Search, Clear } from '@mui/icons-material';

const SMSVerifications = () => {
  const { showError } = useSnackbar();
  const [smsVerifications, setSmsVerifications] = useState([]);
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
    phone: '',
    type: '',
    isUsed: '',
    startDate: '',
    endDate: '',
  });

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSMS, setSelectedSMS] = useState(null);

  // Fetch SMS verifications
  const fetchSMSVerifications = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.phone) params.phone = filters.phone;
      if (filters.type) params.type = filters.type;
      if (filters.isUsed !== '') params.isUsed = filters.isUsed === 'true';
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await adminDataAPI.getAllSMSVerifications(params);

      if (response.success) {
        setSmsVerifications(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'SMS verifikatsiyalarini yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSMSVerifications();
  }, [
    pagination.page,
    pagination.limit,
    filters.phone,
    filters.type,
    filters.isUsed,
    filters.startDate,
    filters.endDate,
  ]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleView = (sms) => {
    setSelectedSMS(sms);
    setViewModalOpen(true);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      phone: '',
      type: '',
      isUsed: '',
      startDate: '',
      endDate: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  // Format date for input (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convert local datetime to ISO string
  const convertToISO = (dateTimeString) => {
    if (!dateTimeString) return '';
    return new Date(dateTimeString).toISOString();
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">SMS Verifikatsiyalari</h1>
          <p className="text-gray-600">SMS kodlarini ko'rish va monitoring qilish</p>
        </div>
      </motion.div>

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
          {/* First Row: Phone, Type, IsUsed */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Telefon raqami..."
                value={filters.phone}
                onChange={(e) => {
                  setFilters({ ...filters, phone: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={filters.type}
              onChange={(e) => {
                setFilters({ ...filters, type: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barcha turlar</option>
              <option value="login">Kirish</option>
              <option value="register">Ro'yxatdan o'tish</option>
              <option value="forgot_password">Parolni tiklash</option>
            </select>

            <select
              value={filters.isUsed}
              onChange={(e) => {
                setFilters({ ...filters, isUsed: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barcha statuslar</option>
              <option value="false">Ishlatilmagan</option>
              <option value="true">Ishlatilgan</option>
            </select>
          </div>

          {/* Second Row: Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Boshlanish sanasi</label>
              <input
                type="datetime-local"
                value={filters.startDate ? formatDateForInput(filters.startDate) : ''}
                onChange={(e) => {
                  const isoDate = e.target.value ? convertToISO(e.target.value) : '';
                  setFilters({ ...filters, startDate: isoDate });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tugash sanasi</label>
              <input
                type="datetime-local"
                value={filters.endDate ? formatDateForInput(filters.endDate) : ''}
                onChange={(e) => {
                  const isoDate = e.target.value ? convertToISO(e.target.value) : '';
                  setFilters({ ...filters, endDate: isoDate });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Limit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <SMSVerificationTable
        smsVerifications={smsVerifications}
        loading={loading}
        onView={handleView}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      {selectedSMS && (
        <ViewSMSVerificationModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedSMS(null);
          }}
          smsVerification={selectedSMS}
        />
      )}
    </div>
  );
};

export default SMSVerifications;







