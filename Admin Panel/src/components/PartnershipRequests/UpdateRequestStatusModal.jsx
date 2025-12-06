import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { partnershipRequestAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const UpdateRequestStatusModal = ({ open, onClose, onSuccess, request }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    status: 'pending',
    adminNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (request && open) {
      setFormData({
        status: request.status || 'pending',
        adminNotes: request.adminNotes || '',
      });
      setError('');
    }
  }, [request, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare data
      const updateData = {
        status: formData.status,
      };
      
      // Only include adminNotes if it's provided
      if (formData.adminNotes && formData.adminNotes.trim() !== '') {
        updateData.adminNotes = formData.adminNotes.trim();
      }

      const response = await partnershipRequestAPI.updateRequestStatus(request._id, updateData);
      if (response.success) {
        showSuccess(response.message || 'So\'rov holati muvaffaqiyatli yangilandi');
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMsg = err.message || 'So\'rov holatini yangilashda xatolik yuz berdi';
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

  if (!request) return null;

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
                <h2 className="text-2xl font-bold text-gray-800">So'rov holatini yangilash</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Request Info */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-2">So'rov ma'lumotlari</h3>
                <p className="text-gray-900 mb-1">{request.companyName}</p>
                {request.marketplaceUser && (
                  <p className="text-sm text-gray-600">
                    {request.marketplaceUser.firstName} {request.marketplaceUser.lastName} -{' '}
                    {request.marketplaceUser.phone}
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
                    So'rov holati <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">Ko'rib chiqilmoqda</option>
                    <option value="approved">Tasdiqlangan</option>
                    <option value="rejected">Rad etilgan</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    So'rov holatini tanlang
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
                    maxLength={1000}
                    placeholder="Admin izohini kiriting (maksimum 1000 belgi)..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.adminNotes.length}/1000 belgi. So'rov haqida qo'shimcha ma'lumot yozishingiz mumkin
                  </p>
                </div>

                {/* Current Status Display */}
                {request.status && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-600 mb-1">Joriy holat:</p>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {request.status === 'approved' ? 'Tasdiqlangan' :
                       request.status === 'rejected' ? 'Rad etilgan' : 'Ko\'rib chiqilmoqda'}
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

export default UpdateRequestStatusModal;




