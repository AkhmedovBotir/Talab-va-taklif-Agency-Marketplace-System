import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Close, Cancel } from '@mui/icons-material';
import { productModerationAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const RejectProductModal = ({ open, onClose, onSuccess, product }) => {
  const { showSuccess, showError } = useSnackbar();
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rejectionReason || rejectionReason.trim().length < 1) {
      setError('Rad etish sababi kiritilishi shart');
      return;
    }

    if (rejectionReason.trim().length > 1000) {
      setError('Rad etish sababi 1000 ta belgidan oshmasligi kerak');
      return;
    }

    setLoading(true);
    try {
      const response = await productModerationAPI.rejectProduct(product._id, rejectionReason.trim());

      if (response.success) {
        showSuccess(response.message || 'Mahsulot muvaffaqiyatli rad etildi');
        setRejectionReason('');
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMsg = err.message || 'Mahsulotni rad etishda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setRejectionReason('');
      onClose();
    }
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Cancel className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Mahsulotni rad etish</h2>
                      <p className="text-xs text-red-100 mt-0.5">
                        Rad etish sababini kiriting
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all disabled:opacity-50"
                  >
                    <Close className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Product Info */}
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-1">Mahsulot:</p>
                  <p className="text-sm text-gray-700">{product.name}</p>
                  {product.productCode && (
                    <p className="text-xs text-gray-500 mt-1">Kod: {product.productCode}</p>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800 font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Rad etish sababi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Masalan: Rasm sifatida yoki kategoriya noto'g'ri"
                      required
                      minLength={1}
                      maxLength={1000}
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {rejectionReason.length}/1000 belgi
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-md hover:from-red-700 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md hover:shadow-lg"
                    >
                      <Cancel className="w-4 h-4" />
                      {loading ? 'Rad etilmoqda...' : 'Rad etish'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RejectProductModal;

