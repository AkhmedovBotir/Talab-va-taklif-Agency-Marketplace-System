import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminDataAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import CategoryTable from '../../components/Categories/CategoryTable';
import ViewCategoryModal from '../../components/Categories/ViewCategoryModal';
import { Search, Clear } from '@mui/icons-material';

const Categories = () => {
  const { showError } = useSnackbar();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminDataAPI.getAllCategories({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status || undefined,
        includeSubcategories: true, // Always include subcategories
      });

      if (response.success) {
        setCategories(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Kategoriyalarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [pagination.page, pagination.limit, filters.status]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleView = (category) => {
    setSelectedCategory(category);
    setViewModalOpen(true);
  };

  // Filter by search (client-side)
  const filteredCategories = categories.filter((category) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      category.name?.toLowerCase().includes(search) ||
      category.slug?.toLowerCase().includes(search) ||
      category.subcategories?.some((sub) =>
        sub.name?.toLowerCase().includes(search) || sub.slug?.toLowerCase().includes(search)
      )
    );
  });

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      search: '',
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Kategoriyalar</h1>
          <p className="text-gray-600">Kategoriyalar va subkategoriyalarni ko'rish</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
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

          {/* Limit */}
          <select
            value={pagination.limit}
            onChange={(e) => {
              setPagination({ ...pagination, limit: Number(e.target.value), page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="50">50 ta</option>
            <option value="100">100 ta</option>
            <option value="200">200 ta</option>
          </select>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <CategoryTable
        categories={filteredCategories}
        loading={loading}
        onView={handleView}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      {selectedCategory && (
        <ViewCategoryModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedCategory(null);
          }}
          category={selectedCategory}
        />
      )}
    </div>
  );
};

export default Categories;







