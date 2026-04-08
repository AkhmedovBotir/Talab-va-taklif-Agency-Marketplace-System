import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Add, Close, ContentCopy, Delete, Edit, Visibility } from '@mui/icons-material';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { categoryAPI, localShopProductTemplateAPI, subcategoryAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import GeoSearchableSelect from '../../components/DistrictContragents/GeoSearchableSelect';

const tabBase = 'px-4 py-2 rounded-md text-sm font-medium transition-colors';

const units = ['dona', 'litr', 'kg'];
const statuses = ['active', 'inactive'];

const defaultForm = {
  name: '',
  description: '{"ops":[{"insert":"Mahsulot tavsifi"}]}',
  images: [],
  category_id: '',
  subcategory_id: '',
  unit: 'dona',
  unit_size: '',
  status: 'active',
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
    reader.readAsDataURL(file);
  });

const normalizeDescPreview = (raw) => {
  try {
    const parsed = JSON.parse(raw || '{}');
    if (!Array.isArray(parsed.ops)) return '—';
    return parsed.ops.map((x) => x.insert || '').join('').trim() || '—';
  } catch {
    return 'JSON xato';
  }
};

const parseDescriptionDelta = (raw) => {
  const input = String(raw ?? '');
  try {
    const parsed = JSON.parse(input || '{}');
    if (parsed && Array.isArray(parsed.ops)) return parsed;
  } catch {
    // ignore
  }
  if (input.trim()) return { ops: [{ insert: input }, { insert: '\n' }] };
  return { ops: [{ insert: '\n' }] };
};

const NeighborhoodProducts = () => {
  const { showError, showSuccess } = useSnackbar();
  const [activeTab, setActiveTab] = useState('templates');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const quillHostRef = useRef(null);
  const quillRef = useRef(null);
  const initialDescriptionRef = useRef(defaultForm.description);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await localShopProductTemplateAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
      });
      const payload = res.data || {};
      const items = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
      setRows(items);
      setPagination((prev) => ({
        ...prev,
        page: Number(payload.page) || prev.page,
        limit: Number(payload.limit) || prev.limit,
        total: Number(payload.total) || items.length,
        pages: Number(payload.total_pages) || Math.max(1, Math.ceil((Number(payload.total) || items.length) / (Number(payload.limit) || prev.limit || 1))),
      }));
    } catch (e) {
      showError(e.message || "Shablonlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, showError]);

  const fetchCategories = useCallback(async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        categoryAPI.getAll({ page: 1, limit: 100 }),
        subcategoryAPI.getAll({ page: 1, limit: 100 }),
      ]);
      const catPayload = catRes.data || {};
      const subPayload = subRes.data || {};
      const catItems = Array.isArray(catPayload.items) ? catPayload.items : Array.isArray(catPayload) ? catPayload : [];
      const subItems = Array.isArray(subPayload.items) ? subPayload.items : Array.isArray(subPayload) ? subPayload : [];
      setCategories(catItems);
      setSubcategories(subItems);
    } catch (e) {
      showError(e.message || 'Kategoriyalarni yuklab bo‘lmadi');
    }
  }, [showError]);

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates();
  }, [activeTab, fetchTemplates]);

  useEffect(() => {
    if (activeTab === 'templates') fetchCategories();
  }, [activeTab, fetchCategories]);

  const visibleSubcategories = useMemo(
    () =>
      subcategories.filter((s) => String(s.parent_id ?? s.category_id ?? '') === String(form.category_id || '')),
    [subcategories, form.category_id]
  );
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, title: c.name, subtitle: c.code })),
    [categories]
  );
  const subcategoryOptions = useMemo(
    () => visibleSubcategories.map((s) => ({ id: s.id, title: s.name, subtitle: s.code })),
    [visibleSubcategories]
  );

  const openCreate = () => {
    setEditingRow(null);
    setForm(defaultForm);
    initialDescriptionRef.current = defaultForm.description;
    setModalOpen(true);
  };

  const openEdit = async (row) => {
    try {
      const res = await localShopProductTemplateAPI.getById(row.id);
      const item = res.data || row;
      setEditingRow(item);
      setForm({
        name: item.name || '',
        description: item.description || defaultForm.description,
        images: Array.isArray(item.images) ? item.images : [],
        category_id: item.category_id ?? '',
        subcategory_id: item.subcategory_id ?? '',
        unit: item.unit || 'dona',
        unit_size: item.unit_size || '',
        status: item.status || 'active',
      });
      initialDescriptionRef.current = item.description || defaultForm.description;
      setModalOpen(true);
    } catch (e) {
      showError(e.message || "Shablonni ochib bo'lmadi");
    }
  };

  const openView = async (row) => {
    try {
      const res = await localShopProductTemplateAPI.getById(row.id);
      setViewRow(res.data || row);
      setViewOpen(true);
    } catch (e) {
      showError(e.message || "Shablonni ko'rib bo'lmadi");
    }
  };

  useEffect(() => {
    if (!modalOpen) return;
    if (!quillRef.current && quillHostRef.current) {
      const editor = new Quill(quillHostRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean'],
          ],
        },
      });
      editor.on('text-change', () => {
        setForm((prev) => ({ ...prev, description: JSON.stringify(editor.getContents()) }));
      });
      quillRef.current = editor;
    }
    if (quillRef.current) {
      quillRef.current.setContents(parseDescriptionDelta(initialDescriptionRef.current), 'silent');
    }
  }, [modalOpen]);

  const handlePickImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remain = 5 - form.images.length;
    if (remain <= 0) {
      showError('Maksimum 5 ta rasm');
      return;
    }
    const chosen = files.slice(0, remain);
    try {
      const converted = await Promise.all(chosen.map(fileToBase64));
      setForm((prev) => ({ ...prev, images: [...prev.images, ...converted] }));
    } catch (err) {
      showError(err.message || "Rasmni o'qishda xatolik");
    } finally {
      e.target.value = '';
    }
  };

  const removeImage = (idx) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Nom bo'sh bo'lmasin";
    if (!form.category_id || !form.subcategory_id) return 'Kategoriya va subkategoriya tanlang';
    if (!units.includes(form.unit)) return "Unit noto'g'ri";
    if (!statuses.includes(form.status)) return "Status noto'g'ri";
    if (form.images.length < 1 || form.images.length > 5) return 'Rasmlar soni 1..5 bo‘lishi kerak';
    try {
      JSON.parse(form.description || '{}');
    } catch {
      return 'Description JSON yaroqsiz';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      showError(error);
      return;
    }
    setSubmitting(true);
    const payload = {
      ...form,
      category_id: Number(form.category_id),
      subcategory_id: Number(form.subcategory_id),
    };
    try {
      if (editingRow?.id) {
        await localShopProductTemplateAPI.update(editingRow.id, payload);
        showSuccess('Shablon yangilandi');
      } else {
        await localShopProductTemplateAPI.create(payload);
        showSuccess('Shablon yaratildi');
      }
      setModalOpen(false);
      setEditingRow(null);
      setForm(defaultForm);
      fetchTemplates();
    } catch (err) {
      showError(err.message || "Saqlashda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`"${row.name}" shablonni o'chirasizmi?`)) return;
    try {
      await localShopProductTemplateAPI.delete(row.id);
      showSuccess("O'chirildi");
      fetchTemplates();
    } catch (e) {
      showError(e.message || "O'chirishda xatolik");
    }
  };

  const handleToggleStatus = async (row) => {
    const next = row.status === 'active' ? 'inactive' : 'active';
    try {
      await localShopProductTemplateAPI.updateStatus(row.id, next);
      showSuccess('Status yangilandi');
      fetchTemplates();
    } catch (e) {
      showError(e.message || 'Status yangilashda xatolik');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`${tabBase} ${activeTab === 'templates' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Shablonlar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`${tabBase} ${activeTab === 'products' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Mahsulotlar
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Maxalla mahsulotlari sahifasi ishlab chiqilmoqda.
        </div>
      )}

      {activeTab === 'templates' && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">Maxalla do'konlari mahsulot shablonlari</h3>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              <Add />
              Yangi shablon
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 min-w-[180px]">Nom</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 min-w-[150px]">Kategoriya</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 min-w-[150px]">Subkategoriya</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 min-w-[120px]">Birlik</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Rasm</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 min-w-[140px]">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      Yuklanmoqda...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      Hozircha shablonlar mavjud emas.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const categoryName =
                      categories.find((c) => String(c.id) === String(row.category_id))?.name || row.category?.name || '—';
                    const subcategoryName =
                      subcategories.find((s) => String(s.id) === String(row.subcategory_id))?.name ||
                      row.subcategory?.name ||
                      '—';
                    return (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/70 align-top">
                        <td className="px-4 py-3 text-gray-900 font-medium">{row.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{categoryName}</td>
                        <td className="px-4 py-3 text-gray-700">{subcategoryName}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.unit || '—'} {row.unit_size ? `(${row.unit_size})` : ''}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{Array.isArray(row.images) ? row.images.length : 0} ta</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(row)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {row.status === 'active' ? 'Faol' : 'Nofaol'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openView(row)}
                            className="inline-flex items-center justify-center p-2 text-sky-600 hover:bg-sky-50 rounded-md mr-1"
                            title="Ko'rish"
                          >
                            <Visibility fontSize="small" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-md mr-1"
                            title="Tahrirlash"
                          >
                            <Edit fontSize="small" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-md"
                            title="O'chirish"
                          >
                            <Delete fontSize="small" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Jami: <span className="font-semibold">{pagination.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pagination.limit}
                onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="10">10 ta</option>
                <option value="20">20 ta</option>
                <option value="50">50 ta</option>
              </select>
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
              >
                Oldingi
              </button>
              <span className="text-sm text-gray-600">
                {pagination.page} / {Math.max(1, pagination.pages)}
              </span>
              <button
                type="button"
                disabled={pagination.page >= Math.max(1, pagination.pages)}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
              >
                Keyingi
              </button>
            </div>
          </div>
        </>
      )}

      {modalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ margin: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => !submitting && setModalOpen(false)} />
            <div className="relative bg-white shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg">
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">{editingRow ? 'Shablonni tahrirlash' : 'Yangi shablon'}</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <Close />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                  </select>
                </div>
                <GeoSearchableSelect
                  label="Kategoriya"
                  required
                  value={form.category_id}
                  onChange={(id) => setForm((f) => ({ ...f, category_id: id, subcategory_id: '' }))}
                  options={categoryOptions}
                  disabled={false}
                  emptyMessage="Kategoriyalar topilmadi"
                  lockedHint="Kategoriyalar yuklanmoqda..."
                />
                <GeoSearchableSelect
                  label="Subkategoriya"
                  required
                  value={form.subcategory_id}
                  onChange={(id) => setForm((f) => ({ ...f, subcategory_id: id }))}
                  options={subcategoryOptions}
                  disabled={!form.category_id}
                  emptyMessage="Subkategoriyalar topilmadi"
                  lockedHint="Avval kategoriyani tanlang"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birlik</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit size</label>
                  <input
                    value={form.unit_size}
                    onChange={(e) => setForm((f) => ({ ...f, unit_size: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Masalan: 1 litr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (delta)</label>
                <div className="border border-gray-300 rounded-md overflow-hidden">
                  <div ref={quillHostRef} className="min-h-[180px]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Rasmlar (1..5)</label>
                  <label className="inline-flex items-center gap-2 text-sm text-indigo-600 cursor-pointer hover:text-indigo-700">
                    <ContentCopy fontSize="small" />
                    <span>Rasm tanlash</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePickImages}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {form.images.map((img, idx) => (
                    <div key={`${idx}-${img.slice(0, 20)}`} className="relative border border-gray-200 rounded-md p-1">
                      <img src={img} alt={`img-${idx}`} className="w-full h-24 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md"
                  >
                    Bekor
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          ,
          document.body
        )}

      {viewOpen &&
        viewRow &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" style={{ margin: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => { setViewOpen(false); setPreviewImage(''); }} />
            <div className="relative bg-white shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto rounded-lg">
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Shablonni ko'rish</h3>
                <button type="button" onClick={() => setViewOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <Close />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Nom:</span> <span className="font-medium text-gray-900">{viewRow.name || '—'}</span></div>
                  <div><span className="text-gray-500">Status:</span> <span className="font-medium text-gray-900">{viewRow.status || '—'}</span></div>
                  <div><span className="text-gray-500">Kategoriya:</span> <span className="font-medium text-gray-900">{categories.find((c) => String(c.id) === String(viewRow.category_id))?.name || viewRow.category?.name || '—'}</span></div>
                  <div><span className="text-gray-500">Subkategoriya:</span> <span className="font-medium text-gray-900">{subcategories.find((s) => String(s.id) === String(viewRow.subcategory_id))?.name || viewRow.subcategory?.name || '—'}</span></div>
                  <div><span className="text-gray-500">Birlik:</span> <span className="font-medium text-gray-900">{viewRow.unit || '—'}</span></div>
                  <div><span className="text-gray-500">Unit size:</span> <span className="font-medium text-gray-900">{viewRow.unit_size || '—'}</span></div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tavsif</p>
                  <div className="border border-gray-200 rounded-md p-3 text-sm text-gray-800 bg-gray-50 whitespace-pre-wrap">
                    {normalizeDescPreview(viewRow.description)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Rasmlar</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Array.isArray(viewRow.images) ? viewRow.images : []).map((img, idx) => (
                      <button
                        key={`${idx}-${String(img).slice(0, 20)}`}
                        type="button"
                        onClick={() => setPreviewImage(String(img))}
                        className="block w-full"
                      >
                        <img src={img} alt={`img-${idx}`} className="w-full h-28 object-cover rounded border border-gray-200 hover:opacity-90 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {previewImage &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[102] flex items-center justify-center p-4" style={{ margin: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={() => setPreviewImage('')} />
            <div className="relative max-w-5xl w-full max-h-[90vh]">
              <button
                type="button"
                onClick={() => setPreviewImage('')}
                className="absolute -top-10 right-0 text-white/90 hover:text-white"
              >
                <Close />
              </button>
              <img
                src={previewImage}
                alt="preview"
                className="w-full max-h-[90vh] object-contain rounded-lg border border-white/20 bg-black/40"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default NeighborhoodProducts;
