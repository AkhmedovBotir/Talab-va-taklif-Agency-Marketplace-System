import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminDataAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import MarketplaceUserTable from '../../components/MarketplaceUsers/MarketplaceUserTable';
import ViewMarketplaceUserModal from '../../components/MarketplaceUsers/ViewMarketplaceUserModal';
import { Search, Clear } from '@mui/icons-material';

const MarketplaceUsers = () => {
  const { showError } = useSnackbar();
  const [marketplaceUsers, setMarketplaceUsers] = useState([]);
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
    search: '',
    status: '',
    viloyat: '',
    tuman: '',
    mfy: '',
    isPhoneVerified: '',
    gender: '',
  });

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch marketplace users
  const fetchMarketplaceUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.viloyat) params.viloyat = filters.viloyat;
      if (filters.tuman) params.tuman = filters.tuman;
      if (filters.mfy) params.mfy = filters.mfy;
      if (filters.isPhoneVerified !== '') params.isPhoneVerified = filters.isPhoneVerified === 'true';
      if (filters.gender) params.gender = filters.gender;

      const response = await adminDataAPI.getAllMarketplaceUsers(params);

      if (response.success) {
        setMarketplaceUsers(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Marketplace foydalanuvchilarini yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplaceUsers();
  }, [
    pagination.page,
    pagination.limit,
    filters.search,
    filters.status,
    filters.viloyat,
    filters.tuman,
    filters.mfy,
    filters.isPhoneVerified,
    filters.gender,
  ]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      viloyat: '',
      tuman: '',
      mfy: '',
      isPhoneVerified: '',
      gender: '',
    });
    setPagination({ ...pagination, page: 1 });
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Marketplace Foydalanuvchilari</h1>
          <p className="text-gray-600">Marketplace foydalanuvchilarini ko'rish va monitoring qilish</p>
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
          {/* First Row: Search, Status, Gender */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Ism, familiya yoki telefon bo'yicha qidirish..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barcha statuslar</option>
              <option value="active">Faol</option>
              <option value="inactive">Nofaol</option>
            </select>

            <select
              value={filters.gender}
              onChange={(e) => {
                setFilters({ ...filters, gender: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barcha jinslar</option>
              <option value="erkak">Erkak</option>
              <option value="ayol">Ayol</option>
            </select>
          </div>

          {/* Second Row: Phone Verified, Region Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.isPhoneVerified}
              onChange={(e) => {
                setFilters({ ...filters, isPhoneVerified: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barcha telefonlar</option>
              <option value="true">Tasdiqlangan</option>
              <option value="false">Tasdiqlanmagan</option>
            </select>

            <input
              type="text"
              placeholder="Viloyat ID..."
              value={filters.viloyat}
              onChange={(e) => {
                setFilters({ ...filters, viloyat: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              placeholder="Tuman ID..."
              value={filters.tuman}
              onChange={(e) => {
                setFilters({ ...filters, tuman: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Third Row: MFY, Limit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="MFY ID..."
              value={filters.mfy}
              onChange={(e) => {
                setFilters({ ...filters, mfy: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

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
      <MarketplaceUserTable
        marketplaceUsers={marketplaceUsers}
        loading={loading}
        onView={handleView}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      {selectedUser && (
        <ViewMarketplaceUserModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedUser(null);
          }}
          marketplaceUser={selectedUser}
        />
      )}
    </div>
  );
};

export default MarketplaceUsers;





