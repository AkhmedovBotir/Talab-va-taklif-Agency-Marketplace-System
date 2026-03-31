import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { marketplaceUserAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import GeoCascadeSearchableFields from '../DistrictContragents/GeoCascadeSearchableFields';

const EditMarketplaceUserModal = ({
  open,
  onClose,
  onSuccess,
  userId,
  regions = [],
  districts = [],
  mfys = [],
}) => {
  const { showSuccess, showError } = useSnackbar();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    gender: 'erkak',
    phone: '',
    region_id: '',
    district_id: '',
    mfy_id: '',
    birth_date: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  const setGeo = (patch) => setForm((p) => ({ ...p, ...patch }));

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      setError('');
      try {
        const res = await marketplaceUserAPI.getById(userId);
        if (!res.success || cancelled) return;
        const d = res.data || {};
        setForm({
          first_name: d.first_name || '',
          last_name: d.last_name || '',
          gender: d.gender || 'erkak',
          phone: d.phone || '',
          region_id: String(d.region_id ?? d.region?.id ?? d.region?._id ?? ''),
          district_id: String(d.district_id ?? d.district?.id ?? d.district?._id ?? ''),
          mfy_id: String(d.mfy_id ?? d.mfy?.id ?? d.mfy?._id ?? ''),
          birth_date: d.birth_date ? String(d.birth_date).slice(0, 10) : '',
          status: d.status || 'active',
        });
      } catch (e) {
        if (!cancelled) {
          const msg = e.message || 'Yuklashda xatolik';
          setError(msg);
          showError(msg);
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId, showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const phone = String(form.phone || '').trim();
    if (!/^\+998[0-9]{9}$/.test(phone)) {
      setError('Telefon +998901234567 formatida bo\'lishi kerak');
      return;
    }
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Ism va familiyani kiriting');
      return;
    }
    if (!form.region_id || !form.district_id || !form.mfy_id) {
      setError('Viloyat, tuman va MFY ni tanlang');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        gender: form.gender,
        phone,
        region_id: Number(form.region_id),
        district_id: Number(form.district_id),
        mfy_id: Number(form.mfy_id),
        birth_date: form.birth_date || null,
        status: form.status,
      };
      const res = await marketplaceUserAPI.update(userId, payload);
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
      {open && userId && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-50" style={{ margin: '0' }} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Foydalanuvchini tahrirlash</h2>
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
                  {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ism *</label>
                      <input required value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Familiya *</label>
                      <input required value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                      <input required value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jinsi *</label>
                      <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                        <option value="erkak">Erkak</option>
                        <option value="ayol">Ayol</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tug'ilgan sana</label>
                      <input type="date" value={form.birth_date || ''} onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                        <option value="active">Faol</option>
                        <option value="inactive">Nofaol</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <p className="block text-sm font-medium text-gray-700 mb-2">Hudud *</p>
                    <GeoCascadeSearchableFields
                      required
                      allowClear={false}
                      regions={regions}
                      districts={districts}
                      mfys={mfys}
                      values={form}
                      onChange={setGeo}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex gap-3 pt-2 border-t">
                    <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-md hover:bg-gray-50">Bekor qilish</button>
                    <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
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

export default EditMarketplaceUserModal;
