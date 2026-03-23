import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { reviewAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import ReviewTable from '../../components/Reviews/ReviewTable';
import ViewReviewModal from '../../components/Reviews/ViewReviewModal';
import { Search, Clear } from '@mui/icons-material';

const Reviews = ({ hideHeader = false }) => {
  const { showError } = useSnackbar();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  
  // Filters
  const [filters, setFilters] = useState({
    rating: '',
    productId: '',
    orderId: '',
    isPositive: '',
    search: '',
  });

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Fetch reviews
  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (filters.rating) params.rating = filters.rating;
      if (filters.productId) params.productId = filters.productId;
      if (filters.orderId) params.orderId = filters.orderId;
      if (filters.isPositive !== '') {
        params.isPositive = filters.isPositive === 'true' ? true : filters.isPositive === 'false' ? false : null;
      }

      const response = await reviewAPI.getAllReviews(params);

      if (response.success) {
        setReviews(response.data || []);
        setPagination({
          page: response.pagination?.page || pagination.page,
          limit: response.pagination?.limit || pagination.limit,
          total: response.pagination?.total || 0,
          pages: response.pagination?.pages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Baholarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [pagination.page, pagination.limit, filters.rating, filters.productId, filters.orderId, filters.isPositive]);

  const handleView = (review) => {
    setSelectedReview(review);
    setViewModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  // Filter by search (client-side)
  const filteredReviews = reviews.filter((review) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      review.user?.firstName?.toLowerCase().includes(search) ||
      review.user?.lastName?.toLowerCase().includes(search) ||
      review.user?.phone?.includes(search) ||
      review.order?.orderNumber?.toLowerCase().includes(search) ||
      review.product?.name?.toLowerCase().includes(search)
    );
  });

  const handleClearFilters = () => {
    setFilters({
      rating: '',
      productId: '',
      orderId: '',
      isPositive: '',
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Baholar</h1>
            <p className="text-gray-600">Barcha baholarni ko'rish va boshqarish</p>
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
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Rating Filter */}
          <select
            value={filters.rating}
            onChange={(e) => {
              setFilters({ ...filters, rating: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha baholar</option>
            <option value="1">1 yulduz</option>
            <option value="2">2 yulduz</option>
            <option value="3">3 yulduz</option>
            <option value="4">4 yulduz</option>
            <option value="5">5 yulduz</option>
          </select>

          {/* IsPositive Filter */}
          <select
            value={filters.isPositive}
            onChange={(e) => {
              setFilters({ ...filters, isPositive: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha</option>
            <option value="true">Ijobiy</option>
            <option value="false">Salbiy</option>
          </select>

          {/* Limit */}
          <select
            value={pagination.limit}
            onChange={(e) => {
              setPagination({ ...pagination, limit: Number(e.target.value), page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
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
      <ReviewTable
        reviews={filteredReviews}
        loading={loading}
        onView={handleView}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      {selectedReview && (
        <ViewReviewModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedReview(null);
          }}
          review={selectedReview}
        />
      )}
    </div>
  );
};

export default Reviews;


