import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { regionAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const CreateRegionModal = ({ open, onClose, onSuccess }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({ name: '', code: '', status: 'active' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setError('');
    setFormData({ name: '', code: '', status: 'active' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await regionAPI.createRegion(formData);
      if (response.success) {
        showSuccess(response.message || "Viloyat muvaffaqiyatli yaratildi");
        reset();
        onSuccess();
      }
    } catch (err) {
      const msg = err.message || "Viloyat yaratishda xatolik yuz berdi";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              reset();
              onClose();
            }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Yangi Viloyat Qo'shish</h2>
                <button onClick={() => { reset(); onClose(); }} className="text-gray-400 hover:text-gray-600">
                  <Close />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Viloyat nomi *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Viloyat kodi *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => { reset(); onClose(); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                    Bekor qilish
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                    {loading ? "Qo'shilmoqda..." : "Qo'shish"}
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

export default CreateRegionModal;
