import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { productModerationAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import ProductTable from '../../components/Products/ProductTable';
import ViewProductModal from '../../components/Products/ViewProductModal';
import RejectProductModal from '../../components/Products/RejectProductModal';
import { Search, Clear } from '@mui/icons-material';
import RegionSelect from '../../components/Regions/RegionSelect';

const Products = ({ hideHeader = false }) => {
  const { showError, showSuccess } = useSnackbar();
  const [products, setProducts] = useState([]);
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
    moderationStatus: '',
    status: '',
    category: '',
    contragent: '',
    search: '',
  });

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectingProduct, setRejectingProduct] = useState(null);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.moderationStatus) params.moderationStatus = filters.moderationStatus;
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.contragent) params.contragent = filters.contragent;

      let response;
      if (filters.moderationStatus === 'pending' && !filters.status && !filters.category && !filters.contragent) {
        // Use pending endpoint if only moderationStatus is pending
        response = await productModerationAPI.getPendingProducts(params);
      } else {
        // Use moderation endpoint with filters
        response = await productModerationAPI.getAllProductsWithModeration(params);
      }

      if (response.success) {
        setProducts(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Mahsulotlarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    pagination.page,
    pagination.limit,
    filters.moderationStatus,
    filters.status,
    filters.category,
    filters.contragent,
  ]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handleApprove = async (product) => {
    try {
      const response = await productModerationAPI.approveProduct(product._id);
      if (response.success) {
        showSuccess(response.message || 'Mahsulot muvaffaqiyatli tasdiqlandi');
        fetchProducts();
      }
    } catch (err) {
      const errorMsg = err.message || 'Mahsulotni tasdiqlashda xatolik yuz berdi';
      showError(errorMsg);
    }
  };

  const handleReject = (product) => {
    setRejectingProduct(product);
    setRejectModalOpen(true);
  };

  const handleRejectSuccess = () => {
    fetchProducts();
  };

  // Filter by search (client-side)
  const filteredProducts = products.filter((product) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      product.name?.toLowerCase().includes(search) ||
      product.productCode?.toLowerCase().includes(search) ||
      product.category?.name?.toLowerCase().includes(search) ||
      product.subcategory?.name?.toLowerCase().includes(search) ||
      product.contragent?.name?.toLowerCase().includes(search)
    );
  });

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      moderationStatus: '',
      status: '',
      category: '',
      contragent: '',
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
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Mahsulotlar</h1>
            <p className="text-gray-600">Mahsulotlarni ko'rish va qidirish</p>
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
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Clear className="w-4 h-4" />
            <span>Tozalash</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
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

          {/* Moderation Status */}
          <select
            value={filters.moderationStatus}
            onChange={(e) => {
              setFilters({ ...filters, moderationStatus: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha (Moderatsiya)</option>
            <option value="pending">Kutilmoqda</option>
            <option value="approved">Tasdiqlangan</option>
            <option value="rejected">Rad etilgan</option>
          </select>

          {/* Status */}
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
            <option value="archived">Arxivlangan</option>
          </select>

          {/* Limit */}
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
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <ProductTable
        products={filteredProducts}
        loading={loading}
        onView={handleView}
        onApprove={handleApprove}
        onReject={handleReject}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      {selectedProduct && (
        <ViewProductModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}

      {rejectingProduct && (
        <RejectProductModal
          open={rejectModalOpen}
          onClose={() => {
            setRejectModalOpen(false);
            setRejectingProduct(null);
          }}
          onSuccess={handleRejectSuccess}
          product={rejectingProduct}
        />
      )}
    </div>
  );
};

export default Products;







