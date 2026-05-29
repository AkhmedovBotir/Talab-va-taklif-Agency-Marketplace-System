import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { productAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import GeoSearchableSelect from '../DistrictContragents/GeoSearchableSelect';
import { buildProductPayload, DEFAULT_DESCRIPTION_JSON } from './productFormUtils';
import QuillDescriptionEditor from './QuillDescriptionEditor';
import ImageUploaderGrid from './ImageUploaderGrid';

const EditProductModal = ({ open, onClose, onSuccess, productId, contragents = [], categories = [], subcategories = [] }) => {
  const { showSuccess, showError } = useSnackbar();
  const [form, setForm] = useState({
    contragent_id: '',
    name: '',
    description: DEFAULT_DESCRIPTION_JSON,
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
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  const subsForCategory = subcategories.filter((s) => {
    const pid = s.parent_id ?? s.parent?.id ?? s.parent?._id;
    return pid != null && String(pid) === String(form.category_id);
  });

  useEffect(() => {
    if (!open || !productId) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      setError('');
      try {
        const res = await productAPI.getById(productId);
        if (!res.success || cancelled) return;
        const d = res.data || {};
        const imgs = Array.isArray(d.images) ? d.images.filter(Boolean) : [];
        setImages(imgs);
        setForm({
          contragent_id: String(d.contragent_id ?? d.contragent?.id ?? d.contragent?._id ?? ''),
          name: d.name || '',
          description:
            typeof d.description === 'string'
              ? d.description
              : d.description
                ? JSON.stringify(d.description)
                : DEFAULT_DESCRIPTION_JSON,
          price: d.price != null ? String(d.price) : '',
          original_price: d.original_price != null ? String(d.original_price) : '',
          category_id: String(d.category_id ?? d.category?.id ?? d.category?._id ?? ''),
          subcategory_id: String(d.subcategory_id ?? d.subcategory?.id ?? d.subcategory?._id ?? ''),
          quantity: d.quantity != null ? String(d.quantity) : '',
          unit: d.unit || 'dona',
          unit_size: d.unit_size || '',
          status: d.status || 'active',
          kpi_bonus_percent: d.kpi_bonus_percent != null ? Number(d.kpi_bonus_percent) : 0,
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
  }, [open, productId, showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.contragent_id || !form.category_id || !form.subcategory_id) {
      setError('Kontragent, kategoriya va subkategoriyani tanlang');
      return;
    }
    if (images.length < 1 || images.length > 5) {
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
      const payload = buildProductPayload(form, images);
      const res = await productAPI.update(productId, payload);
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
      {open && productId && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-50" style={{ margin: '0' }} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-800">Mahsulotni tahrirlash</h2>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif</label>
                      <QuillDescriptionEditor
                        active={open && !fetching}
                        value={form.description}
                        onChange={(description) => setForm((p) => ({ ...p, description }))}
                        resetKey={productId}
                      />
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
                      <ImageUploaderGrid
                        required
                        images={images}
                        onChange={setImages}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 border-t">
                    <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-md hover:bg-gray-50">
                      Bekor qilish
                    </button>
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

export default EditProductModal;
