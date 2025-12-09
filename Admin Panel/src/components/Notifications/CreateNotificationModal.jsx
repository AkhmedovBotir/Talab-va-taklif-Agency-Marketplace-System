import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Send } from '@mui/icons-material';
import { notificationAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const targetTypes = [
  { value: 'all', label: 'Barchaga' },
  { value: 'punkts', label: 'Punktlar' },
  { value: 'viloyat_agents', label: 'Viloyat agentlari' },
  { value: 'tuman_agents', label: 'Tuman agentlari' },
  { value: 'mfy_agents', label: 'MFY agentlari' },
  { value: 'marketplace_users', label: 'Marketplace foydalanuvchilari' },
  { value: 'contragents', label: 'Kontragentlar' },
  { value: 'vacancy_applicants', label: 'Vakansiya nomzodlari' },
];

const notificationTypes = [
  { value: 'info', label: "Ma'lumot", color: 'bg-blue-500' },
  { value: 'warning', label: 'Ogohlantirish', color: 'bg-yellow-500' },
  { value: 'success', label: 'Muvaffaqiyat', color: 'bg-green-500' },
  { value: 'error', label: 'Xatolik', color: 'bg-red-500' },
  { value: 'announcement', label: "E'lon", color: 'bg-purple-500' },
  { value: 'promotion', label: 'Aksiya', color: 'bg-orange-500' },
  { value: 'update', label: 'Yangilanish', color: 'bg-cyan-500' },
];

const CreateNotificationModal = ({ open, onClose, onSuccess }) => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showError('Sarlavha kiritilishi shart');
      return;
    }

    if (!formData.message.trim()) {
      showError('Xabar matni kiritilishi shart');
      return;
    }

    setLoading(true);
    try {
      await notificationAPI.createNotification({
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        targetType: formData.targetType,
        targetIds: [],
      });

      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
      });
      onSuccess();
    } catch (err) {
      showError(err.message || 'Xabar yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Yangi xabar yuborish</h2>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Close className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sarlavha <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={200}
                  placeholder="Xabar sarlavhasi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">{formData.title.length}/200</p>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xabar matni <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  maxLength={2000}
                  rows={4}
                  placeholder="Xabar matnini kiriting..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{formData.message.length}/2000</p>
              </div>

              {/* Notification Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Xabar turi</label>
                <div className="flex flex-wrap gap-2">
                  {notificationTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        formData.type === type.value
                          ? `${type.color} text-white`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qabul qiluvchilar
                </label>
                <select
                  value={formData.targetType}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {targetTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Yuborish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateNotificationModal;

