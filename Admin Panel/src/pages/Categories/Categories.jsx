import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { categoryManagementAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import CategoryTable from '../../components/Categories/CategoryTable';
import ViewCategoryModal from '../../components/Categories/ViewCategoryModal';
import CreateCategoryModal from '../../components/Categories/CreateCategoryModal';
import EditCategoryModal from '../../components/Categories/EditCategoryModal';
import DeleteCategoryModal from '../../components/Categories/DeleteCategoryModal';
import { Search, Clear, Add } from '@mui/icons-material';

const Categories = ({ hideHeader = false }) => {
  const { showError, showSuccess } = useSnackbar();
  const [categories, setCategories] = useState([]);
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
    status: '',
    censored: '',
    search: '',
  });

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isEditingSubcategory, setIsEditingSubcategory] = useState(false);
  const [isDeletingSubcategory, setIsDeletingSubcategory] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (filters.status) params.status = filters.status;
      if (filters.censored !== '') params.censored = filters.censored === 'true';

      const response = await categoryManagementAPI.getAllCategories(params);

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
  }, [pagination.page, pagination.limit, filters.status, filters.censored]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleView = (category) => {
    setSelectedCategory(category);
    setViewModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setCreateModalOpen(true);
  };

  const handleCreateSubcategory = (parentCategory) => {
    setSelectedCategory(parentCategory);
    setCreateModalOpen(true);
  };

  const handleEdit = (category, isSubcategory = false) => {
    setEditingCategory(category);
    setIsEditingSubcategory(isSubcategory);
    setEditModalOpen(true);
  };

  const handleDelete = (category, isSubcategory = false) => {
    setDeletingCategory(category);
    setIsDeletingSubcategory(isSubcategory);
    setDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchCategories();
  };

  const handleCreateSuccess = () => {
    fetchCategories();
  };

  const handleEditSuccess = () => {
    fetchCategories();
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
      censored: '',
      search: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div>
      {/* Header */}
      {!hideHeader && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Kategoriyalar</h1>
              <p className="text-gray-600">Kategoriyalar va subkategoriyalarni boshqarish</p>
            </div>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              <Add className="w-5 h-5" />
              Yangi Kategoriya
            </button>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
          <div className="flex items-center gap-3">
            {hideHeader && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl text-sm"
              >
                <Add className="w-4 h-4" />
                Yangi Kategoriya
              </button>
            )}
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Clear className="w-4 h-4" />
            <span>Tozalash</span>
          </button>
        </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Censored Filter */}
          <select
            value={filters.censored}
            onChange={(e) => {
              setFilters({ ...filters, censored: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha (Censored)</option>
            <option value="true">Censored</option>
            <option value="false">Not Censored</option>
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
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateSubcategory={handleCreateSubcategory}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      <CreateCategoryModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setSelectedCategory(null);
        }}
        onSuccess={handleCreateSuccess}
        isSubcategory={!!selectedCategory}
        parentCategory={selectedCategory}
      />

      {editingCategory && (
        <EditCategoryModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingCategory(null);
            setIsEditingSubcategory(false);
          }}
          onSuccess={handleEditSuccess}
          category={editingCategory}
          isSubcategory={isEditingSubcategory}
          allCategories={categories}
        />
      )}

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

      {deletingCategory && (
        <DeleteCategoryModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeletingCategory(null);
            setIsDeletingSubcategory(false);
          }}
          onSuccess={handleDeleteSuccess}
          category={deletingCategory}
          isSubcategory={isDeletingSubcategory}
        />
      )}
    </div>
  );
};

export default Categories;







