import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@mui/material';
import { Close, Send } from '@mui/icons-material';
import { financeAPI } from '../../../services/api';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import PunktSelect from '../../Punkts/PunktSelect';

const SendToPunktModal = ({ open, onClose, onSuccess }) => {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    punktId: '',
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormData({ punktId: '', amount: '', description: '' });
      setErrors({});
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.punktId) {
      newErrors.punktId = 'Punktni tanlang';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Summani kiriting';
    } else if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Summa 0 dan katta bo\'lishi kerak';
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Tavsif maksimal 1000 belgi bo\'lishi kerak';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await financeAPI.sendToPunkt({
        punktId: formData.punktId,
        amount: Number(formData.amount),
        description: formData.description || undefined,
      });

      if (response.success) {
        showSuccess('Pul muvaffaqiyatli punktga yuborildi');
        onSuccess();
      }
    } catch (error) {
      showError(error.message || 'Pul yuborishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            className: 'rounded-lg',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Send className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Punktga Pul Yuborish</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Close className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <PunktSelect
                  name="punktId"
                  value={formData.punktId}
                  onChange={handleChange}
                  label="Punkt"
                  required
                  disabled={loading}
                  className={errors.punktId ? 'border-red-500' : ''}
                />
                {errors.punktId && (
                  <p className="mt-1 text-sm text-red-500">{errors.punktId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summa <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Masalan: 1000000"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                  min="1"
                  step="1"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tavsif
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tavsif (ixtiyoriy, maksimal 1000 belgi)"
                  rows={4}
                  maxLength={1000}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {formData.description.length}/1000
                </div>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Yuborilmoqda...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Yuborish
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default SendToPunktModal;
