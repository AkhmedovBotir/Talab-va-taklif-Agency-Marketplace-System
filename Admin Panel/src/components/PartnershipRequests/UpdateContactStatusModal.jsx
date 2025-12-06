import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { partnershipRequestAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const UpdateContactStatusModal = ({ open, onClose, onSuccess, request }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    contactStatus: 'not_contacted',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (request && open) {
      setFormData({
        contactStatus: request.contactStatus || 'not_contacted',
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
      const response = await partnershipRequestAPI.updateContactStatus(request._id, formData.contactStatus);
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
      contactStatus: 'not_contacted',
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
                <h2 className="text-2xl font-bold text-gray-800">Aloqa holatini yangilash</h2>
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

                {/* Contact Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aloqa holati <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="contactStatus"
                    value={formData.contactStatus}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="not_contacted">Aloqa qilinmagan</option>
                    <option value="contacted">Aloqa qilingan</option>
                    <option value="in_progress">Jarayonda</option>
                    <option value="completed">Tugallangan</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Aloqa holatini tanlang
                  </p>
                </div>

                {/* Current Status Display */}
                {request.contactStatus && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-600 mb-1">Joriy holat:</p>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {request.contactStatus === 'completed' ? 'Tugallangan' :
                       request.contactStatus === 'in_progress' ? 'Jarayonda' :
                       request.contactStatus === 'contacted' ? 'Aloqa qilingan' : 'Aloqa qilinmagan'}
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




