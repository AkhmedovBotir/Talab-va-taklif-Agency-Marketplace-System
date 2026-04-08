import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Visibility, VisibilityOff } from '@mui/icons-material';
import { neighborhoodShopAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import GeoCascadeSearchableFields from '../DistrictContragents/GeoCascadeSearchableFields';

const EditNeighborhoodShopModal = ({ open, onClose, onSuccess, shopId, regions, districts, mfys }) => {
  const { showSuccess, showError } = useSnackbar();
  const [form, setForm] = useState({
    name: '',
    inn: '',
    region_id: '',
    district_id: '',
    mfy_id: '',
    phone: '',
    logo: '',
    status: 'active',
    password_setup_allowed: true,
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const originalLogoRef = useRef('');

  const setGeo = (patch) => setForm((p) => ({ ...p, ...patch }));

  useEffect(() => {
    if (!open || !shopId) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      setError('');
      try {
        const res = await neighborhoodShopAPI.getById(shopId);
        if (!res.success || cancelled) return;
        const d = res.data || {};
        const logo = d.logo || '';
        originalLogoRef.current = logo;
        setForm({
          name: d.name || '',
          inn: d.inn || '',
          region_id: d.region_id != null ? String(d.region_id) : String(d.region?.id ?? d.region?._id ?? ''),
          district_id: d.district_id != null ? String(d.district_id) : String(d.district?.id ?? d.district?._id ?? ''),
          mfy_id: d.mfy_id != null ? String(d.mfy_id) : String(d.mfy?.id ?? d.mfy?._id ?? ''),
          phone: d.phone || '',
          logo,
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
  }, [open, shopId]);

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Faqat rasm fayli');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setForm((p) => ({ ...p, logo: reader.result || '' }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const innRaw = String(form.inn || '').trim();
    if (innRaw && !/^\d{9}$|^\d{12}$/.test(innRaw)) {
      setError('INN faqat 9 yoki 12 ta raqam bo‘lishi kerak (yoki bo‘sh qoldiring)');
      return;
    }
    const phone = String(form.phone || '').trim();
    if (!/^\+998[0-9]{9}$/.test(phone)) {
      setError('Telefon +998901234567 formatida bo‘lishi kerak');
      return;
    }
    if (!form.region_id || !form.district_id || !form.mfy_id) {
      setError('Viloyat, tuman va MFY ni tanlang');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        inn: innRaw,
        region_id: Number(form.region_id),
        district_id: Number(form.district_id),
        mfy_id: Number(form.mfy_id),
        phone,
        status: form.status,
        password_setup_allowed: Boolean(form.password_setup_allowed),
      };

      if (form.logo === '') {
        payload.logo = '';
      } else if (form.logo && form.logo !== originalLogoRef.current) {
        payload.logo = form.logo;
      }

      const pw = String(form.password || '').trim();
      if (pw) payload.password = pw;

      const res = await neighborhoodShopAPI.update(shopId, payload);
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
      {open && shopId && (
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
                <h2 className="text-xl font-bold text-gray-800">Maxalla do‘konini tahrirlash</h2>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nomi *</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">INN (ixtiyoriy)</label>
                      <input
                        value={form.inn}
                        onChange={(e) => setForm((p) => ({ ...p, inn: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                        placeholder="Bo‘sh yoki 9/12 raqam"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="block text-sm font-medium text-gray-700 mb-2">Manzil *</p>
                    <GeoCascadeSearchableFields
                      regions={regions}
                      districts={districts}
                      mfys={mfys}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                    {form.logo ? (
                      <img src={form.logo} alt="" className="max-h-24 max-w-24 object-contain border rounded mb-2" />
                    ) : null}
                    <input type="file" accept="image/*" onChange={handleLogo} className="w-full text-sm" />
                    <button
                      type="button"
                      className="mt-1 text-sm text-red-600"
                      onClick={() => setForm((p) => ({ ...p, logo: '' }))}
                    >
                      Logoni olib tashlash (saqlashda bo‘sh qilinadi)
                    </button>
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

export default EditNeighborhoodShopModal;
