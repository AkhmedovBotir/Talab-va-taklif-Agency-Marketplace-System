import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Warning } from '@mui/icons-material';
import { notificationAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const DeleteNotificationModal = ({ open, onClose, onSuccess, notification }) => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await notificationAPI.deleteNotification(notification._id);
      onSuccess();
    } catch (err) {
      showError(err.message || "Xabarni o'chirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && notification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !loading && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Xabarni o'chirish</h2>
              <button
                onClick={onClose}
                disabled={loading}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Close className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Warning className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-900">
                    <strong>"{notification.title}"</strong> xabarini o'chirmoqchimisiz?
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Bu amalni qaytarib bo'lmaydi.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteNotificationModal;






