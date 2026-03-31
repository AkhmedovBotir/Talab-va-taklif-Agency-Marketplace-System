import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { categoryAPI, subcategoryAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const empty = {
  name: '',
  slug: '',
  image: '',
  censored: false,
  status: 'active',
  parent_id: '',
};

const CreateCategoryModal = ({ open, onClose, onSuccess, isSubcategory = false, parentCategory = null, categories = [] }) => {
  const { showSuccess, showError } = useSnackbar();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setFileName('');
    setForm({
      ...empty,
      parent_id: isSubcategory ? String(parentCategory?.id ?? parentCategory?._id ?? '') : '',
    });
  }, [open, isSubcategory, parentCategory]);

  const onImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Faqat rasm fayli tanlang');
      return;
    }
    setFileName(file.name || '');
    const reader = new FileReader();
    reader.onloadend = () => setForm((p) => ({ ...p, image: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name va slug majburiy');
      return;
    }
    if (isSubcategory && !form.parent_id) {
      setError('Asosiy kategoriya tanlang');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        image: form.image || '',
        censored: Boolean(form.censored),
        status: form.status,
      };
      if (isSubcategory) payload.parent_id = Number(form.parent_id);
      const res = isSubcategory ? await subcategoryAPI.create(payload) : await categoryAPI.create(payload);
      if (res.success) {
        showSuccess(res.message || (isSubcategory ? 'Subkategoriya yaratildi' : 'Kategoriya yaratildi'));
        onSuccess?.();
      }
    } catch (err) {
      const msg = err.message || 'Saqlashda xatolik';
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-50" style={{ margin: '0' }} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">{isSubcategory ? 'Yangi subkategoriya' : 'Yangi kategoriya'}</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><Close /></button>
              </div>
              <form onSubmit={submit} className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}
                {isSubcategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asosiy kategoriya *</label>
                    <select value={form.parent_id} onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                      <option value="">Tanlang</option>
                      {categories.map((c) => (
                        <option key={c.id ?? c._id} value={String(c.id ?? c._id)}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomi *</label>
                    <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                    <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rasm (base64)</label>
                  <label className="w-full flex items-center gap-3 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <span className="px-3 py-1 text-sm bg-gray-100 rounded border border-gray-300">Fayl tanlash</span>
                    <span className="text-sm text-gray-600 truncate">{fileName || "Fayl tanlanmagan"}</span>
                    <input type="file" accept="image/*" onChange={(e) => onImage(e.target.files?.[0])} className="hidden" />
                  </label>
                  {form.image && (
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-xs text-green-600">Rasm tanlandi</p>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, image: '' }));
                          setFileName('');
                        }}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Olib tashlash
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                      <option value="active">Faol</option>
                      <option value="inactive">Nofaol</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 mt-7">
                    <input type="checkbox" checked={form.censored} onChange={(e) => setForm((p) => ({ ...p, censored: e.target.checked }))} />
                    <span className="text-sm text-gray-700">Censored</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-2 border-t">
                  <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-md hover:bg-gray-50">Bekor qilish</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? 'Saqlanmoqda...' : 'Saqlash'}
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

export default CreateCategoryModal;
