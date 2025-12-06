import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { reviewAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const CreateCommentTemplateModal = ({ open, onClose, onSuccess }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    text: '',
    order: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'order' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.text.trim()) {
      setError('Matn kiritilishi shart');
      showError('Matn kiritilishi shart');
      return;
    }

    setLoading(true);

    try {
      const response = await reviewAPI.createCommentTemplate(formData);
      if (response.success) {
        showSuccess(response.message || 'Kommentariya shabloni muvaffaqiyatli yaratildi');
        setFormData({
          text: '',
          order: 1,
        });
        onSuccess();
      }
    } catch (err) {
      const errorMsg = err.message || 'Kommentariya shablonini yaratishda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setFormData({
      text: '',
      order: 1,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Yangi Kommentariya Shablonini Yaratish</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matn *
                    </label>
                    <textarea
                      name="text"
                      value={formData.text}
                      onChange={handleChange}
                      required
                      rows={4}
                      maxLength={500}
                      placeholder="Kommentariya shablonini kiriting..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.text.length}/500</p>
                  </div>

                  {/* Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tartib raqami *
                    </label>
                    <input
                      type="number"
                      name="order"
                      value={formData.order}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Shablonlar tartib raqamiga qarab tartiblanadi</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Yaratilmoqda...' : 'Yaratish'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateCommentTemplateModal;





