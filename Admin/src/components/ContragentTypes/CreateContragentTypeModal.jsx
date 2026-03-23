import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Close, Save, Category } from '@mui/icons-material';
import { contragentTypeAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import IconSelector from '../Common/IconSelector';

const CreateContragentTypeModal = ({ open, onClose, onSuccess }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        icon: '',
        status: 'active',
      });
      setError('');
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || formData.name.trim().length < 2) {
      setError('Nomi kamida 2 ta belgi bo\'lishi kerak');
      return;
    }

    if (!formData.icon || formData.icon.trim().length === 0) {
      setError('Icon kiritilishi shart');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        icon: formData.icon.trim(),
        status: formData.status,
      };
      
      const response = await contragentTypeAPI.createContragentType(payload);

      if (response.success) {
        showSuccess(response.message || 'Kontragent turi muvaffaqiyatli yaratildi');
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMsg = err.message || 'Kontragent turi yaratishda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
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
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Category className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Yangi Kontragent Turi</h2>
                      <p className="text-xs text-indigo-100 mt-0.5">
                        Kontragent turi ma'lumotlarini kiriting
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

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nomi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Masalan: Savdo, Xizmat ko'rsatish..."
                      required
                      minLength={2}
                      maxLength={200}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  {/* Icon */}
                  <div>
                    <IconSelector
                      value={formData.icon}
                      onChange={handleChange}
                      label="Icon"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Iconni tanlash uchun tugmani bosing
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="active">Faol</option>
                      <option value="inactive">Nofaol</option>
                    </select>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-800 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md hover:shadow-lg"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Yaratilmoqda...' : 'Yaratish'}
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

export default CreateContragentTypeModal;

