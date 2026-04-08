import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { productAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import GeoSearchableSelect from '../DistrictContragents/GeoSearchableSelect';
import { buildProductPayload, readFileAsDataUrl } from './productFormUtils';

const emptyForm = () => ({
  contragent_id: '',
  name: '',
  description_text: '',
  price: '',
  original_price: '',
  category_id: '',
  subcategory_id: '',
  quantity: '',
  unit: 'dona',
  unit_size: '',
  status: 'active',
  kpi_bonus_percent: 0,
});

const CreateProductModal = ({ open, onClose, onSuccess, contragents = [], categories = [], subcategories = [] }) => {
  const { showSuccess, showError } = useSnackbar();
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subsForCategory = subcategories.filter((s) => {
    const pid = s.parent_id ?? s.parent?.id ?? s.parent?._id;
    return pid != null && String(pid) === String(form.category_id);
  });

  const onPickImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const next = [...imageFiles];
    for (const f of files) {
      if (next.length >= 5) break;
      next.push(f);
    }
    setImageFiles(next);
  };

  const removeImageAt = (idx) => {
    setImageFiles((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.contragent_id || !form.category_id || !form.subcategory_id) {
      setError('Kontragent, kategoriya va subkategoriyani tanlang');
      return;
    }
    if (imageFiles.length < 1 || imageFiles.length > 5) {
      setError('Rasmlar: kamida 1, ko‘pi bilan 5 ta');
      return;
    }
    const price = Number(form.price);
    const orig = Number(form.original_price);
    const qty = Number(form.quantity);
    const kpi = Number(form.kpi_bonus_percent);
    if (Number.isNaN(price) || price < 0) {
      setError('Narx noto‘g‘ri');
      return;
    }
    if (Number.isNaN(orig) || orig < 0) {
      setError('Asl narx noto‘g‘ri');
      return;
    }
    if (Number.isNaN(qty) || qty < 0) {
      setError('Miqdor noto‘g‘ri');
      return;
    }
    if (Number.isNaN(kpi) || kpi < 0 || kpi > 100) {
      setError('KPI bonus 0–100 oralig‘ida bo‘lishi kerak');
      return;
    }

    setLoading(true);
    try {
      const images = [];
      for (const f of imageFiles) {
        images.push(await readFileAsDataUrl(f));
      }
      const payload = buildProductPayload(form, images);
      const res = await productAPI.create(payload);
      if (res.success) {
        showSuccess(res.message || 'Mahsulot yaratildi');
        setForm(emptyForm());
        setImageFiles([]);
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
    setImageFiles([]);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="fixed inset-0 bg-black/50 z-50" style={{ margin: '0' }} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-800">Yangi mahsulot</h2>
                <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                  <Close />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kontragent *</label>
                    <select required value={form.contragent_id} onChange={(e) => setForm((p) => ({ ...p, contragent_id: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                      <option value="">Tanlang</option>
                      {contragents.map((c) => (
                        <option key={c.id ?? c._id} value={String(c.id ?? c._id)}>
                          {c.name || c.company_name || `#${c.id ?? c._id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomi *</label>
                    <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif (matn)</label>
                    <textarea rows={3} value={form.description_text} onChange={(e) => setForm((p) => ({ ...p, description_text: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Narx *</label>
                    <input required type="number" min="0" step="1" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asl narx *</label>
                    <input required type="number" min="0" step="1" value={form.original_price} onChange={(e) => setForm((p) => ({ ...p, original_price: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <GeoSearchableSelect
                    label="Kategoriya"
                    required
                    value={form.category_id}
                    onChange={(val) => setForm((p) => ({ ...p, category_id: val, subcategory_id: '' }))}
                    options={categories.map((c) => ({
                      id: String(c.id ?? c._id),
                      title: c.name || `#${c.id ?? c._id}`,
                      subtitle: c.slug || '',
                    }))}
                    emptyMessage="Kategoriyalar topilmadi"
                    optionalPlaceholder="Kategoriya tanlang"
                  />
                  <GeoSearchableSelect
                    label="Subkategoriya"
                    required
                    value={form.subcategory_id}
                    onChange={(val) => setForm((p) => ({ ...p, subcategory_id: val }))}
                    options={subsForCategory.map((s) => ({
                      id: String(s.id ?? s._id),
                      title: s.name || `#${s.id ?? s._id}`,
                      subtitle: s.slug || '',
                    }))}
                    disabled={!form.category_id}
                    emptyMessage="Subkategoriyalar topilmadi"
                    lockedHint="Avval kategoriya tanlang"
                    optionalPlaceholder="Subkategoriya tanlang"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Miqdor *</label>
                    <input required type="number" min="0" step="1" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">O‘lchov birligi *</label>
                    <select value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                      <option value="dona">dona</option>
                      <option value="litr">litr</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">O‘lcham / tavsif (masalan: 1 litr) *</label>
                    <input required value={form.unit_size} onChange={(e) => setForm((p) => ({ ...p, unit_size: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Holat</label>
                    <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                      <option value="active">Faol</option>
                      <option value="inactive">Nofaol</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KPI bonus %</label>
                    <input type="number" min="0" max="100" step="1" value={form.kpi_bonus_percent} onChange={(e) => setForm((p) => ({ ...p, kpi_bonus_percent: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rasmlar (1–5, base64) *</label>
                    <input type="file" accept="image/*" multiple onChange={onPickImages} className="w-full text-sm text-gray-600" />
                    <p className="text-xs text-gray-500 mt-1">Tanlangan: {imageFiles.length} / 5</p>
                    <ul className="mt-2 space-y-1">
                      {imageFiles.map((f, idx) => (
                        <li key={`${f.name}-${idx}`} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-1.5 rounded">
                          <span className="truncate">{f.name}</span>
                          <button type="button" onClick={() => removeImageAt(idx)} className="text-red-600 hover:underline shrink-0">
                            Olib tashlash
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
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

export default CreateProductModal;
