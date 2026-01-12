import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Visibility, Search, Clear } from '@mui/icons-material';
import { maxallaProductsAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import ViewMaxallaProductModal from '../../components/MaxallaProducts/ViewMaxallaProductModal';
import CategorySelect from '../../components/Categories/CategorySelect';
import SubcategorySelect from '../../components/Categories/SubcategorySelect';

const MaxallaProductsList = ({ hideHeader = false }) => {
  const { showError } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    status: '',
    category: '',
    subcategory: '',
    contragent: '',
    search: '',
  });

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status || undefined,
        category: filters.category || undefined,
        subcategory: filters.subcategory || undefined,
        contragent: filters.contragent || undefined,
        search: filters.search || undefined,
      };

      const response = await maxallaProductsAPI.getAllMaxallaProducts(params);

      if (response.success) {
        setProducts(response.data || []);
        setPagination({
          page: response.pagination?.page || pagination.page,
          limit: response.pagination?.limit || pagination.limit,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.pages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Maxalla maxsulotlarini yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filters.status, filters.category, filters.subcategory, filters.contragent, filters.search]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      category: '',
      subcategory: '',
      contragent: '',
      search: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handleCategoriesLoad = (loadedCategories) => {
    setCategories(loadedCategories);
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Faol';
      case 'inactive':
        return 'Nofaol';
      default:
        return status;
    }
  };

  const getUnitLabel = (unit) => {
    switch (unit) {
      case 'dona':
        return 'dona';
      case 'litr':
        return 'litr';
      case 'kg':
        return 'kg';
      default:
        return unit || '-';
    }
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
            <h2 className="text-2xl font-bold text-gray-800">Maxalla Maxsulotlari</h2>
            <p className="text-gray-600 text-sm">Maxalla kontragentlar tomonidan yaratilgan maxsulotlar</p>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qidirish</label>
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
          </div>
          <CategorySelect
            name="category"
            value={filters.category}
            onChange={(e) => {
              setFilters({ ...filters, category: e.target.value, subcategory: '' });
              setPagination({ ...pagination, page: 1 });
            }}
            label="Kategoriya"
            status="active"
            onCategoriesLoad={handleCategoriesLoad}
          />
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
            value={pagination.limit}
            onChange={(e) => {
              setPagination({ ...pagination, limit: Number(e.target.value), page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="10">10 ta</option>
            <option value="20">20 ta</option>
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
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-center text-gray-500">Maxalla maxsulotlari topilmadi</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maxsulot</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategoriya</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Narx</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miqdor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontragent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product, index) => (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.baseProduct?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.baseProduct?.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatPrice(product.price)}</div>
                      {product.originalPrice && product.originalPrice !== product.price && (
                        <div className="text-xs text-gray-500 line-through">
                          {formatPrice(product.originalPrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.quantity !== undefined
                        ? `${product.quantity} ${getUnitLabel(product.baseProduct?.unit)}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.contragent?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(product.status)}>
                        {getStatusLabel(product.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(product)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Batafsil ko'rish"
                        >
                          <Visibility className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Jami <span className="font-medium">{pagination.total}</span> ta maxsulot
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Oldingi
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Keyingi
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      {selectedProduct && (
        <ViewMaxallaProductModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}
    </div>
  );
};

export default MaxallaProductsList;
