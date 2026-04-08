import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { categoryAPI, subcategoryAPI } from '../../services/api';
import { formatTableDate } from '../../utils/dateFormatter';
import { useSnackbar } from '../../contexts/SnackbarContext';

const ViewCategoryModal = ({ open, onClose, item, isSubcategory = false, categories = [] }) => {
  const { showError } = useSnackbar();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const id = item.id ?? item._id;
        const res = isSubcategory ? await subcategoryAPI.getById(id) : await categoryAPI.getById(id);
        if (!cancelled && res.success) setData(res.data || item);
      } catch (e) {
        if (!cancelled) {
          showError(e.message || 'Yuklashda xatolik');
          setData(item);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, item, isSubcategory, showError]);

  const row = (label, value) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="sm:col-span-2 text-sm text-gray-900 font-medium break-words">{value ?? '-'}</span>
    </div>
  );

  const parentName = () => {
    const pid = data?.parent_id ?? data?.parent?.id ?? data?.parent?._id;
    if (!pid) return '-';
    return categories.find((c) => String(c.id ?? c._id) === String(pid))?.name || '-';
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-50" style={{ margin: '0' }} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">{isSubcategory ? 'Subkategoriya' : 'Kategoriya'}</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><Close /></button>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-indigo-600" />
                  </div>
                ) : (
                  <>
                    {data?.image && <img src={data.image} alt={data?.name || 'image'} className="mb-4 max-h-40 rounded border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                    {row('Nomi', data?.name)}
                    {row('Slug', data?.slug)}
                    {row('Status', data?.status === 'active' ? 'Faol' : 'Nofaol')}
                    {row('Censored', data?.censored ? 'Ha' : "Yo'q")}
                    {isSubcategory && row('Asosiy kategoriya', parentName())}
                    {row('Yaratilgan', formatTableDate(data?.createdAt || data?.created_at))}
                    {row('Yangilangan', formatTableDate(data?.updatedAt || data?.updated_at))}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ViewCategoryModal;
