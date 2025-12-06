import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminDataAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import ProductTable from '../../components/Products/ProductTable';
import ViewProductModal from '../../components/Products/ViewProductModal';
import { Search, Clear } from '@mui/icons-material';
import RegionSelect from '../../components/Regions/RegionSelect';

const Products = () => {
  const { showError } = useSnackbar();
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
    status: '',
    category: '',
    subcategory: '',
    contragent: '',
    viloyat: '',
    tuman: '',
    minPrice: '',
    maxPrice: '',
    minQuantity: '',
    maxQuantity: '',
    unit: '',
    search: '',
  });

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.subcategory) params.subcategory = filters.subcategory;
      if (filters.contragent) params.contragent = filters.contragent;
      if (filters.viloyat) params.viloyat = filters.viloyat;
      if (filters.tuman) params.tuman = filters.tuman;
      if (filters.minPrice) params.minPrice = Number(filters.minPrice);
      if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);
      if (filters.minQuantity) params.minQuantity = Number(filters.minQuantity);
      if (filters.maxQuantity) params.maxQuantity = Number(filters.maxQuantity);
      if (filters.unit) params.unit = filters.unit;
      if (filters.search) params.search = filters.search;

      const response = await adminDataAPI.getAllProducts(params);

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
    filters.status,
    filters.category,
    filters.subcategory,
    filters.contragent,
    filters.viloyat,
    filters.tuman,
    filters.minPrice,
    filters.maxPrice,
    filters.minQuantity,
    filters.maxQuantity,
    filters.unit,
    filters.search,
  ]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      category: '',
      subcategory: '',
      contragent: '',
      viloyat: '',
      tuman: '',
      minPrice: '',
      maxPrice: '',
      minQuantity: '',
      maxQuantity: '',
      unit: '',
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mahsulotlar</h1>
          <p className="text-gray-600">Mahsulotlarni ko'rish va qidirish</p>
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
          {/* First Row: Search, Status, Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Qidirish (nomi yoki kod bo'yicha)..."
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
              <option value="archived">Arxivlangan</option>
            </select>

            <select
              value={filters.unit}
              onChange={(e) => {
                setFilters({ ...filters, unit: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barcha o'lchov birliklari</option>
              <option value="dona">dona</option>
              <option value="litr">litr</option>
              <option value="kg">kg</option>
            </select>
          </div>

          {/* Second Row: Price Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min narx</label>
              <input
                type="number"
                placeholder="Min narx"
                value={filters.minPrice}
                onChange={(e) => {
                  setFilters({ ...filters, minPrice: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max narx</label>
              <input
                type="number"
                placeholder="Max narx"
                value={filters.maxPrice}
                onChange={(e) => {
                  setFilters({ ...filters, maxPrice: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Third Row: Quantity Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min miqdor</label>
              <input
                type="number"
                placeholder="Min miqdor"
                value={filters.minQuantity}
                onChange={(e) => {
                  setFilters({ ...filters, minQuantity: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max miqdor</label>
              <input
                type="number"
                placeholder="Max miqdor"
                value={filters.maxQuantity}
                onChange={(e) => {
                  setFilters({ ...filters, maxQuantity: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Fourth Row: Region Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RegionSelect
              name="viloyat"
              value={filters.viloyat}
              onChange={(e) => {
                setFilters({ ...filters, viloyat: e.target.value, tuman: '' });
                setPagination({ ...pagination, page: 1 });
              }}
              label="Viloyat bo'yicha filter"
              type="region"
              isFilter={true}
            />
            {filters.viloyat && (
              <RegionSelect
                name="tuman"
                value={filters.tuman}
                onChange={(e) => {
                  setFilters({ ...filters, tuman: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                label="Tuman bo'yicha filter"
                type="district"
                parent={filters.viloyat}
                isFilter={true}
              />
            )}
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
      <ProductTable
        products={products}
        loading={loading}
        onView={handleView}
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
    </div>
  );
};

export default Products;







