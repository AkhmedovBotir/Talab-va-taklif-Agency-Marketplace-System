import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { archiveAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import RegionSelect from '../../components/Regions/RegionSelect';
import ArchivedPunktTable from '../../components/Archive/ArchivedPunktTable';
import { Search, Clear, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ArchivedPunkts = () => {
  const { showError } = useSnackbar();
  const navigate = useNavigate();
  const [punkts, setPunkts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    search: '',
    viloyat: '',
    tuman: '',
  });

  const fetchPunkts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.viloyat) params.viloyat = filters.viloyat;
      if (filters.tuman) params.tuman = filters.tuman;

      const response = await archiveAPI.getArchivedPunkts(params);

      if (response.success) {
        setPunkts(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Arxivlangan punktlarni yuklashda xatolik yuz berdi';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.search, filters.viloyat, filters.tuman, showError]);

  useEffect(() => {
    fetchPunkts();
  }, [fetchPunkts]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleViewWorkHistory = (punktId) => {
    navigate(`/dashboard/archive/punkts/${punktId}/work`);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      viloyat: '',
      tuman: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 p-4 rounded-lg space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
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
          </div>

          {/* Viloyat Filter */}
          <div>
            <RegionSelect
              name="viloyat"
              value={filters.viloyat}
              onChange={(e) => {
                setFilters({ ...filters, viloyat: e.target.value, tuman: '' });
                setPagination({ ...pagination, page: 1 });
              }}
              label="Viloyat"
              type="region"
            />
          </div>

          {/* Tuman Filter */}
          <div>
            <RegionSelect
              name="tuman"
              value={filters.tuman}
              onChange={(e) => {
                setFilters({ ...filters, tuman: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              label="Tuman"
              type="district"
              parentId={filters.viloyat || undefined}
              disabled={!filters.viloyat}
            />
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <Clear />
              <span>Tozalash</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <ArchivedPunktTable
          punkts={punkts}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onViewWorkHistory={handleViewWorkHistory}
        />
      </motion.div>
    </div>
  );
};

export default ArchivedPunkts;

