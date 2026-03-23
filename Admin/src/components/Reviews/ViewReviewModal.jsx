import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Star } from '@mui/icons-material';
import { reviewAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const ViewReviewModal = ({ open, onClose, review }) => {
  const { showError } = useSnackbar();
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && review) {
      fetchReviewDetails();
    }
  }, [open, review]);

  const fetchReviewDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await reviewAPI.getReviewById(review._id);
      if (response.success) {
        setReviewData(response.data);
      }
    } catch (err) {
      const errorMsg = err.message || 'Bahoni yuklashda xatolik';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const displayData = reviewData || review;
  if (!displayData) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Baho batafsil ma'lumotlari</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
                  </div>
                ) : displayData ? (
                  <div className="space-y-6">
                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        Baho
                      </label>
                      <div className="flex items-center gap-2">
                        {renderStars(displayData.rating || 0)}
                        <span className="text-lg font-semibold text-gray-900">
                          {displayData.rating || 0} / 5
                        </span>
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Kommentariya
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded">
                        {displayData.commentTemplate?.text || displayData.customComment || 'Kommentariya yo\'q'}
                      </p>
                    </div>

                    {/* User Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Foydalanuvchi ma'lumotlari</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Ism
                          </label>
                          <p className="text-gray-900">
                            {displayData.user?.firstName} {displayData.user?.lastName}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Telefon
                          </label>
                          <p className="text-gray-900">{displayData.user?.phone || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Buyurtma ma'lumotlari</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Buyurtma raqami
                          </label>
                          <p className="text-gray-900">{displayData.order?.orderNumber || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    {displayData.product && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Mahsulot ma'lumotlari</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              Nomi
                            </label>
                            <p className="text-gray-900">{displayData.product?.name || '-'}</p>
                          </div>
                          {displayData.product?.images && displayData.product.images.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-2">
                                Rasm
                              </label>
                              <img
                                src={displayData.product.images[0]}
                                alt={displayData.product.name}
                                className="w-32 h-32 object-cover rounded border border-gray-300"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    {displayData.contact && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Aloqa ma'lumotlari</h3>
                        <div className="bg-gray-50 p-4 rounded">
                          <p className="text-gray-900">{displayData.contact.message || '-'}</p>
                          <div className="mt-2 flex gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                displayData.contact.isPositive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {displayData.contact.isPositive ? 'Ijobiy' : 'Salbiy'}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                displayData.contact.status === 'resolved'
                                  ? 'bg-blue-100 text-blue-800'
                                  : displayData.contact.status === 'in_progress'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {displayData.contact.status === 'resolved'
                                ? 'Hal qilindi'
                                : displayData.contact.status === 'in_progress'
                                ? 'Jarayonda'
                                : 'Kutilmoqda'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Yaratilgan sana
                      </label>
                      <p className="text-gray-900">{formatDate(displayData.createdAt)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Ma'lumotlar yuklanmoqda...</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ViewReviewModal;





