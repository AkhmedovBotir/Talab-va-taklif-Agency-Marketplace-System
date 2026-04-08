import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Warning } from '@mui/icons-material';
import { regionAPI, districtAPI, mfyAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const DeleteRegionModal = ({ open, onClose, onSuccess, item }) => {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!item) return null;

  const label = item.type === 'region' ? 'Viloyat' : item.type === 'district' ? 'Tuman' : 'MFY';

  const handleDelete = async () => {
    setError('');
    setLoading(true);
    try {
      const id = item.id ?? item._id;
      let response;
      if (item.type === 'region') response = await regionAPI.deleteRegion(id);
      else if (item.type === 'district') response = await districtAPI.deleteDistrict(id);
      else response = await mfyAPI.deleteMFY(id);

      if (response.success) {
        showSuccess(response.message || "Muvaffaqiyatli o'chirildi");
        onSuccess();
      }
    } catch (err) {
      const msg = err.message || "O'chirishda xatolik yuz berdi";
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">{label}ni o'chirish</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Close /></button>
              </div>
              <div className="p-6">
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Warning className="text-red-600 text-2xl" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 mb-2">Bu {label.toLowerCase()}ni o'chirishni xohlaysizmi?</p>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.code}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Bekor qilish</button>
                  <button onClick={handleDelete} disabled={loading} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400">
                    {loading ? "O'chirilmoqda..." : "O'chirish"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteRegionModal;
