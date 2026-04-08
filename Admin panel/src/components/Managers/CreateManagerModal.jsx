import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { managerAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const emptyForm = () => ({
  name: '',
  viloyat_id: '',
  phone: '',
  status: 'active',
  password_setup_allowed: true,
});

const CreateManagerModal = ({ open, onClose, onSuccess, regions = [] }) => {
  const { showSuccess, showError } = useSnackbar();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const phone = String(form.phone || '').trim();
    if (!/^\+998[0-9]{9}$/.test(phone)) {
      setError('Telefon +998901234567 formatida bo`lishi kerak');
      return;
    }
    if (!form.viloyat_id) {
      setError('Viloyatni tanlang');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone,
        viloyat_id: Number(form.viloyat_id),
        status: form.status,
        password_setup_allowed: Boolean(form.password_setup_allowed),
      };
      const res = await managerAPI.create(payload);
      if (res.success) {
        showSuccess(res.message || 'Menejer yaratildi');
        setForm(emptyForm());
        onSuccess?.();
      }
    } catch (err) {
      const msg = err.message || 'Yaratishda xatolik';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setForm(emptyForm());
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="fixed inset-0 bg-black/50 z-50" style={{ margin: '0' }} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Yangi menejer</h2>
                <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                  <Close />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Menejer nomi *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+998901234567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Viloyat *</label>
                    <select
                      required
                      value={form.viloyat_id}
                      onChange={(e) => setForm((p) => ({ ...p, viloyat_id: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Viloyat tanlang</option>
                      {regions.map((r) => (
                        <option key={r.id ?? r._id} value={String(r.id ?? r._id)}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                      <option value="active">Faol</option>
                      <option value="inactive">Nofaol</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 mt-7 cursor-pointer">
                    <input type="checkbox" checked={form.password_setup_allowed} onChange={(e) => setForm((p) => ({ ...p, password_setup_allowed: e.target.checked }))} />
                    <span className="text-sm text-gray-700">Keyinroq parol qo`yishga ruxsat</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2 border-t">
                  <button type="button" onClick={handleClose} className="flex-1 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                    Bekor qilish
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? 'Yaratilmoqda...' : 'Yaratish'}
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

export default CreateManagerModal;
