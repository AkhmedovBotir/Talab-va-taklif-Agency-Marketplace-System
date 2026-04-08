import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Warning } from '@mui/icons-material';
import { productAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const DeleteProductModal = ({ open, onClose, onSuccess, row }) => {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const id = row?.id ?? row?._id;
  const name = row?.name || "Noma'lum";

  const handleDelete = async () => {
    if (!id) return;
    setError('');
    setLoading(true);
    try {
      const res = await productAPI.delete(id);
      showSuccess(res?.message || "O'chirildi");
      onSuccess?.();
    } catch (e) {
      const msg = e.message || "O'chirishda xatolik";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && id && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-50" style={{ margin: '0' }} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-bold text-gray-800">Mahsulotni o‘chirish</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <Close />
                </button>
              </div>
              <div className="p-6">
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">{error}</div>}
                <div className="flex gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Warning className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-gray-700 mb-2">Bu mahsulotni o‘chirishni tasdiqlaysizmi?</p>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p className="font-medium text-gray-900">{name}</p>
                      {row?.product_code && <p className="text-gray-500">Kod: {row.product_code}</p>}
                    </div>
                    <p className="text-sm text-red-600 mt-2">Bu amalni qaytarib bo‘lmaydi.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-md hover:bg-gray-50">
                    Bekor qilish
                  </button>
                  <button type="button" onClick={handleDelete} disabled={loading} className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
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

export default DeleteProductModal;
