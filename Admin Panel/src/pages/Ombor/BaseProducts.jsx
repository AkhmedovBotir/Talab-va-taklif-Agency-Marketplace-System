import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Add, Search, Clear, Visibility, Edit, Delete } from '@mui/icons-material';
import { baseProductAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import CreateBaseProductModal from '../../components/BaseProducts/CreateBaseProductModal';
import EditBaseProductModal from '../../components/BaseProducts/EditBaseProductModal';
import ViewBaseProductModal from '../../components/BaseProducts/ViewBaseProductModal';
import DeleteBaseProductModal from '../../components/BaseProducts/DeleteBaseProductModal';

const BaseProducts = ({ hideHeader = false }) => {
  const { showError, showSuccess } = useSnackbar();
  const [baseProducts, setBaseProducts] = useState([]);
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
    search: '',
  });

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBaseProduct, setSelectedBaseProduct] = useState(null);

  // Fetch base products
  const fetchBaseProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status || undefined,
        category: filters.category || undefined,
        subcategory: filters.subcategory || undefined,
        search: filters.search || undefined,
      };

      const response = await baseProductAPI.getAllBaseProducts(params);

      if (response.success) {
        setBaseProducts(response.data || []);
        setPagination({
          page: response.pagination?.page || pagination.page,
          limit: response.pagination?.limit || pagination.limit,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.pages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Shablonlarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaseProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filters.status, filters.category, filters.subcategory, filters.search]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      category: '',
      subcategory: '',
      search: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  const handleCreateSuccess = () => {
    fetchBaseProducts();
  };

  const handleEditSuccess = () => {
    fetchBaseProducts();
  };

  const handleDeleteSuccess = () => {
    fetchBaseProducts();
  };

  const handleView = (baseProduct) => {
    setSelectedBaseProduct(baseProduct);
    setViewModalOpen(true);
  };

  const handleEdit = (baseProduct) => {
    setSelectedBaseProduct(baseProduct);
    setEditModalOpen(true);
  };

  const handleDelete = (baseProduct) => {
    setSelectedBaseProduct(baseProduct);
    setDeleteModalOpen(true);
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Shablonlar</h2>
              <p className="text-gray-600 text-sm">Asosiy maxsulot shablonlarini boshqarish</p>
            </div>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              <Add />
              <span>Yangi Shablon</span>
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
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm"
              >
                <Add className="w-4 h-4" />
                Yangi Shablon
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
      ) : baseProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-center text-gray-500">Shablonlar topilmadi</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategoriya</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birlik</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {baseProducts.map((product, index) => (
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
                      <div className="text-sm font-medium text-gray-900">{product.name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.unit || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status === 'active' ? 'Faol' : 'Nofaol'}
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
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="O'chirish"
                        >
                          <Delete className="w-4 h-4" />
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
                  Jami <span className="font-medium">{pagination.total}</span> ta shablon
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

      {/* Modals */}
      <CreateBaseProductModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <EditBaseProductModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedBaseProduct(null);
        }}
        onSuccess={handleEditSuccess}
        baseProduct={selectedBaseProduct}
      />
      <ViewBaseProductModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedBaseProduct(null);
        }}
        baseProduct={selectedBaseProduct}
      />
      <DeleteBaseProductModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedBaseProduct(null);
        }}
        onSuccess={handleDeleteSuccess}
        baseProduct={selectedBaseProduct}
      />
    </div>
  );
};

export default BaseProducts;
