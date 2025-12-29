import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Warning, Delete } from '@mui/icons-material';
import { adminDeviceAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const DeleteDeviceModal = ({ open, onClose, onSuccess, device }) => {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!device) return;
    
    setLoading(true);
    try {
      const response = await adminDeviceAPI.deleteDevice(device._id);
      if (response.success) {
        showSuccess('Qurilma muvaffaqiyatli o\'chirildi');
        onSuccess();
        onClose();
      }
    } catch (error) {
      showError(error.message || 'Qurilmani o\'chirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <Close />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Warning style={{ fontSize: 28 }} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Qurilmani O'chirish</h2>
                <p className="text-sm text-white/80">Tasdiqlash kerak</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Siz haqiqatan ham bu qurilmani o'chirmoqchimisiz?
              </p>
              {device && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {device.deviceName || 'Noma\'lum qurilma'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {device.user?.name || '-'} • {device.userModel || '-'}
                  </p>
                </div>
              )}
              <p className="text-sm text-red-600 mt-4">
                Bu amalni qaytarib bo'lmaydi!
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bekor qilish
              </button>
              <motion.button
                onClick={handleDelete}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    <span>O'chirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Delete style={{ fontSize: 18 }} />
                    <span>O'chirish</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteDeviceModal;



