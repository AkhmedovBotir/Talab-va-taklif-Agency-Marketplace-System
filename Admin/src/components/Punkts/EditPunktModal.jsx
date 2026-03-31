import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Visibility, VisibilityOff } from '@mui/icons-material';
import { punktAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import GeoViloyatTumanFields from './GeoViloyatTumanFields';

const EditPunktModal = ({ open, onClose, onSuccess, punktId, regions, districts }) => {
  const { showSuccess, showError } = useSnackbar();
  const [form, setForm] = useState({
    name: '',
    region_id: '',
    district_id: '',
    phone: '',
    status: 'active',
    password_setup_allowed: true,
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const setGeo = (patch) => setForm((p) => ({ ...p, ...patch }));

  useEffect(() => {
    if (!open || !punktId) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      setError('');
      try {
        const res = await punktAPI.getById(punktId);
        if (!res.success || cancelled) return;
        const d = res.data || {};
        setForm({
          name: d.name || '',
          region_id:
            d.viloyat_id != null
              ? String(d.viloyat_id)
              : String(d.region_id ?? d.region?.id ?? d.region?._id ?? ''),
          district_id:
            d.tuman_id != null
              ? String(d.tuman_id)
              : String(d.district_id ?? d.district?.id ?? d.district?._id ?? ''),
          phone: d.phone || '',
          status: d.status || 'active',
          password_setup_allowed: d.password_setup_allowed !== false,
          password: '',
        });
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Yuklashda xatolik');
          showError(e.message || 'Yuklashda xatolik');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, punktId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const phone = String(form.phone || '').trim();
    if (!/^\+998[0-9]{9}$/.test(phone)) {
      setError('Telefon +998901234567 formatida bo‘lishi kerak');
      return;
    }
    if (!form.region_id || !form.district_id) {
      setError('Viloyat va tumanni tanlang');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        viloyat_id: Number(form.region_id),
        tuman_id: Number(form.district_id),
        phone,
        status: form.status,
        password_setup_allowed: Boolean(form.password_setup_allowed),
      };

      const pw = String(form.password || '').trim();
      if (pw) payload.password = pw;

      const res = await punktAPI.update(punktId, payload);
      if (res.success) {
        showSuccess(res.message || 'Yangilandi');
        onSuccess?.();
      }
    } catch (err) {
      const msg = err.message || 'Yangilashda xatolik';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && punktId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
            style={{ margin: '0' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Punktni tahrirlash</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <Close />
                </button>
              </div>

              {fetching ? (
                <div className="p-12 flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-indigo-600" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Punkt nomi *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <p className="block text-sm font-medium text-gray-700 mb-2">Hudud * (viloyat va tuman)</p>
                    <GeoViloyatTumanFields
                      regions={regions}
                      districts={districts}
                      values={form}
                      onChange={setGeo}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                      <input
                        required
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Yangi parol (ixtiyoriy)</label>
                      <div className="relative">
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                          minLength={6}
                          placeholder="Bo‘sh — parol o‘zgarmaydi"
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                          onClick={() => setShowPw((s) => !s)}
                        >
                          {showPw ? <VisibilityOff className="w-5 h-5" /> : <Visibility className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="active">Faol</option>
                        <option value="inactive">Nofaol</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 mt-6 md:mt-8 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.password_setup_allowed}
                        onChange={(e) => setForm((p) => ({ ...p, password_setup_allowed: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-700">Parol o‘rnatishga ruxsat</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2 border-t">
                    <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-md hover:bg-gray-50">
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditPunktModal;
