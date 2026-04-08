import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { marketplaceUserAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { formatDate, formatTableDate } from '../../utils/dateFormatter';

const nameById = (list, id) => {
  if (id == null || id === '') return null;
  const s = String(id);
  const f = (list || []).find((x) => String(x.id ?? x._id) === s);
  return f?.name ?? null;
};

const ViewMarketplaceUserModal = ({ open, onClose, userId, regions = [], districts = [], mfys = [] }) => {
  const { showError } = useSnackbar();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await marketplaceUserAPI.getById(userId);
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
  }, [open, userId, showError]);

  useEffect(() => {
    if (!open) setData(null);
  }, [open]);

  const row = (label, value) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="sm:col-span-2 text-sm text-gray-900 font-medium break-words">{value ?? '-'}</span>
    </div>
  );

  const fullName = `${data?.first_name || ''} ${data?.last_name || ''}`.trim() || "Noma'lum foydalanuvchi";
  const statusActive = data?.status === 'active';
  const avatarSrc = data?.avatar || '';

  return (
    <AnimatePresence>
      {open && userId && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-50" style={{ margin: '0' }} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Marketplace foydalanuvchi</h2>
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
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-indigo-100 border border-indigo-200 shrink-0">
                          {avatarSrc ? (
                            <img src={avatarSrc} alt={fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-indigo-700">
                              {String(fullName).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-gray-900 truncate">{fullName}</p>
                          <p className="text-sm text-gray-500">{data.phone || '-'}</p>
                          <span
                            className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                              statusActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {statusActive ? 'Faol' : 'Nofaol'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-3">
                      {row('Ism', data.first_name)}
                      {row('Familiya', data.last_name)}
                      {row('Jinsi', data.gender)}
                      {row("Tug'ilgan sana", formatDate(data.birth_date, { format: 'short' }))}
                      {row('Viloyat', data.region?.name || nameById(regions, data.region_id))}
                      {row('Tuman', data.district?.name || nameById(districts, data.district_id))}
                      {row('MFY', data.mfy?.name || nameById(mfys, data.mfy_id))}
                      {row('Yaratilgan', formatTableDate(data.createdAt || data.created_at))}
                      {row('Yangilangan', formatTableDate(data.updatedAt || data.updated_at))}
                    </div>
                  </div>
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

export default ViewMarketplaceUserModal;
