import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { reviewAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const UpdateContactStatusModal = ({ open, onClose, onSuccess, contact }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    status: 'pending',
    adminNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contact && open) {
      setFormData({
        status: contact.status || 'pending',
        adminNotes: contact.adminNotes || '',
      });
      setError('');
    }
  }, [contact, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare data - only include fields that are provided
      const updateData = {
        status: formData.status,
      };
      
      // Only include adminNotes if it's provided
      if (formData.adminNotes && formData.adminNotes.trim() !== '') {
        updateData.adminNotes = formData.adminNotes.trim();
      }

      const response = await reviewAPI.updateContactStatus(contact._id, updateData);
      if (response.success) {
        showSuccess(response.message || 'Aloqa holati muvaffaqiyatli yangilandi');
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMsg = err.message || 'Aloqa holatini yangilashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setFormData({
      status: 'pending',
      adminNotes: '',
    });
    onClose();
  };

  if (!contact) return null;

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
                <h2 className="text-2xl font-bold text-gray-800">Aloqa holatini yangilash</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Contact Info */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Aloqa ma'lumotlari</h3>
                <p className="text-gray-900 mb-2">{contact.message}</p>
                {contact.review?.user && (
                  <p className="text-sm text-gray-600">
                    {contact.review.user.firstName} {contact.review.user.lastName} -{' '}
                    {contact.review.user.phone}
                  </p>
                )}
                {contact.review?.order?.orderNumber && (
                  <p className="text-xs text-gray-500 mt-1">
                    Buyurtma: {contact.review.order.orderNumber}
                  </p>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Holat <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">Kutilmoqda</option>
                    <option value="in_progress">Jarayonda</option>
                    <option value="resolved">Hal qilindi</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Aloqa holatini tanlang
                  </p>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin izohi (ixtiyoriy)
                  </label>
                  <textarea
                    name="adminNotes"
                    value={formData.adminNotes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Admin izohini kiriting..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Aloqa haqida qo'shimcha ma'lumot yozishingiz mumkin
                  </p>
                </div>

                {/* Current Status Display */}
                {contact.status && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-600 mb-1">Joriy holat:</p>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        contact.status === 'resolved'
                          ? 'bg-blue-100 text-blue-800'
                          : contact.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {contact.status === 'resolved'
                        ? 'Hal qilindi'
                        : contact.status === 'in_progress'
                        ? 'Jarayonda'
                        : 'Kutilmoqda'}
                    </span>
                  </div>
                )}

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
                    {loading ? 'Yangilanmoqda...' : 'Yangilash'}
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

export default UpdateContactStatusModal;




