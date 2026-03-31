import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { productAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const RejectProductModal = ({ open, onClose, onSuccess, productId, productName }) => {
  const { showSuccess, showError } = useSnackbar();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const r = String(reason || '').trim();
    if (!r) {
      setError('Rad etish sababini yozing');
      return;
    }
    if (!productId) return;
    setLoading(true);
    try {
      const res = await productAPI.reject(productId, r);
      if (res.success) {
        showSuccess(res.message || 'Mahsulot rad etildi');
        setReason('');
        onSuccess?.();
      }
    } catch (err) {
      const msg = err.message || 'Rad etishda xatolik';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setReason('');
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && productId && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="fixed inset-0 bg-black/50 z-50" style={{ margin: '0' }} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={(ev) => ev.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Mahsulotni rad etish</h2>
                <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                  <Close />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {productName && <p className="text-sm text-gray-600">Mahsulot: <span className="font-medium text-gray-900">{productName}</span></p>}
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sabab *</label>
                  <textarea
                    required
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Masalan: Noto‘g‘ri rasm va tavsif"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleClose} className="flex-1 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                    Bekor qilish
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
                    {loading ? 'Yuborilmoqda...' : 'Rad etish'}
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

export default RejectProductModal;
