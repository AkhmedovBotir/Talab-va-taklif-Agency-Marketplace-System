import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { productAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { formatTableDate } from '../../utils/dateFormatter';
import { descriptionToPlainText } from './productFormUtils';

const nameById = (list, id) => {
  if (id == null || id === '') return null;
  const s = String(id);
  const f = (list || []).find((x) => String(x.id ?? x._id) === s);
  return f?.name ?? null;
};

const modLabel = (s) => {
  if (s === 'pending') return 'Kutilmoqda';
  if (s === 'approved') return 'Tasdiqlangan';
  if (s === 'rejected') return 'Rad etilgan';
  return s || '-';
};

const ViewProductModal = ({ open, onClose, productId, contragents = [], categories = [], subcategories = [] }) => {
  const { showError } = useSnackbar();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!open || !productId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await productAPI.getById(productId);
        if (!cancelled && res.success) setData(res.data || null);
      } catch (e) {
        if (!cancelled) showError(e.message || 'Yuklashda xatolik');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, productId, showError]);

  useEffect(() => {
    if (!open) {
      setData(null);
      setImageViewerOpen(false);
      setActiveImageIndex(0);
    }
  }, [open]);

  const row = (label, value) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="sm:col-span-2 text-sm text-gray-900 font-medium break-words">{value ?? '-'}</span>
    </div>
  );

  const cid = data?.contragent_id ?? data?.contragent?.id;
  const catId = data?.category_id ?? data?.category?.id;
  const subId = data?.subcategory_id ?? data?.subcategory?.id;
  const images = Array.isArray(data?.images) ? data.images.filter(Boolean).slice(0, 5) : [];

  const openViewer = (idx) => {
    setActiveImageIndex(idx);
    setImageViewerOpen(true);
  };

  const nextImage = () => {
    if (!images.length) return;
    setActiveImageIndex((p) => (p + 1) % images.length);
  };

  const prevImage = () => {
    if (!images.length) return;
    setActiveImageIndex((p) => (p - 1 + images.length) % images.length);
  };

  return (
    <AnimatePresence>
      {open && productId && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-50" style={{ margin: '0' }} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-gray-800">Mahsulot</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <Close />
                </button>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-indigo-600" />
                  </div>
                ) : data ? (
                  <>
                    {row('Mahsulot kodi', data.product_code)}
                    {row('Nomi', data.name)}
                    {row('Tavsif', descriptionToPlainText(data.description))}
                    {row('Kontragent', data.contragent?.name || data.contragent_name || nameById(contragents, cid))}
                    {row('Kategoriya', data.category?.name || nameById(categories, catId))}
                    {row('Subkategoriya', data.subcategory?.name || nameById(subcategories, subId))}
                    {row('Narx', data.price != null ? String(data.price) : null)}
                    {row('Asl narx', data.original_price != null ? String(data.original_price) : null)}
                    {row('Miqdor', data.quantity != null ? String(data.quantity) : null)}
                    {row('Birlik', data.unit)}
                    {row('Birlik o‘lchami', data.unit_size)}
                    {row('Holat', data.status === 'active' ? 'Faol' : data.status === 'inactive' ? 'Nofaol' : data.status)}
                    {row('Moderatsiya', modLabel(data.moderation_status))}
                    {data.rejection_reason ? row('Rad sababi', data.rejection_reason) : null}
                    {row('KPI bonus %', data.kpi_bonus_percent != null ? String(data.kpi_bonus_percent) : null)}
                    {row('Yaratilgan', formatTableDate(data.createdAt || data.created_at))}
                    {images.length > 0 && (
                      <div className="pt-4">
                        <p className="text-sm text-gray-500 mb-2">Rasmlar</p>
                        <div className="grid grid-cols-2 gap-2">
                          {images.map((src, i) => (
                            <button key={i} type="button" onClick={() => openViewer(i)} className="block aspect-square rounded border border-gray-200 overflow-hidden bg-gray-50 hover:opacity-90 transition-opacity">
                              <img src={src} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-8">Ma'lumot yo'q</p>
                )}
              </div>
            </div>
          </motion.div>
          <AnimatePresence>
            {imageViewerOpen && images.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/85 z-[60]"
                  style={{ margin: '0' }}
                  onClick={() => setImageViewerOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="fixed inset-0 z-[61] flex items-center justify-center p-4"
                >
                  <div className="relative w-full max-w-5xl h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setImageViewerOpen(false)}
                      className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
                    >
                      <Close />
                    </button>
                    {images.length > 1 && (
                      <button
                        type="button"
                        onClick={prevImage}
                        className="absolute left-3 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
                      >
                        <NavigateBefore />
                      </button>
                    )}
                    <img src={images[activeImageIndex]} alt="" className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" />
                    {images.length > 1 && (
                      <button
                        type="button"
                        onClick={nextImage}
                        className="absolute right-3 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
                      >
                        <NavigateNext />
                      </button>
                    )}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                        {activeImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default ViewProductModal;
