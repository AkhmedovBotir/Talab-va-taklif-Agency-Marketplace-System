import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { managerAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { formatTableDate } from '../../utils/dateFormatter';

const nameById = (list, id) => {
  if (id == null || id === '') return null;
  const s = String(id);
  const f = (list || []).find((x) => String(x.id ?? x._id) === s);
  return f?.name ?? null;
};

const ViewManagerModal = ({ open, onClose, managerId, regions = [] }) => {
  const { showError } = useSnackbar();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !managerId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await managerAPI.getById(managerId);
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
  }, [open, managerId, showError]);

  useEffect(() => {
    if (!open) setData(null);
  }, [open]);

  const row = (label, value) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="sm:col-span-2 text-sm text-gray-900 font-medium break-words">{value ?? '-'}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {open && managerId && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-50" style={{ margin: '0' }} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Menejer</h2>
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
                    {row('Nomi', data.name)}
                    {row('Telefon', data.phone)}
                    {row('Viloyat', data.region?.name || data.region_name || nameById(regions, data.viloyat_id ?? data.region_id))}
                    {row('Status', data.status === 'active' ? 'Faol' : 'Nofaol')}
                    {row('Parol mavjud', data.has_password ? 'Ha' : "Yo'q")}
                    {row('Parol o`rnatishga ruxsat', data.password_setup_allowed === false ? "Yo'q" : 'Ha')}
                    {row('Yaratilgan', formatTableDate(data.createdAt || data.created_at))}
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-8">Ma'lumot yo'q</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ViewManagerModal;
