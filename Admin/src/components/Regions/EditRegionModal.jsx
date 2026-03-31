import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { regionAPI, districtAPI, mfyAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const EditRegionModal = ({ open, onClose, onSuccess, item, regions, districts }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item && open) {
      if (item.type === 'region') {
        setFormData({ name: item.name || '', code: item.code || '', status: item.status || 'active' });
      } else if (item.type === 'district') {
        setFormData({
          region_id: String(item.region_id || ''),
          name: item.name || '',
          code: item.code || '',
          status: item.status || 'active',
        });
      } else {
        const district = districts.find((d) => String(d.id ?? d._id) === String(item.district_id));
        setFormData({
          region_id: district ? String(district.region_id) : '',
          district_id: String(item.district_id || ''),
          name: item.name || '',
          code: item.code || '',
          status: item.status || 'active',
        });
      }
    }
  }, [item, open, districts]);

  const districtOptions = useMemo(
    () => (districts || []).filter((d) => String(d.region_id) === String(formData.region_id)),
    [districts, formData.region_id]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item) return;
    setError('');
    setLoading(true);
    try {
      const id = item.id ?? item._id;
      let response;
      if (item.type === 'region') {
        response = await regionAPI.updateRegion(id, formData);
      } else if (item.type === 'district') {
        response = await districtAPI.updateDistrict(id, {
          region_id: Number(formData.region_id),
          name: formData.name,
          code: formData.code,
          status: formData.status,
        });
      } else {
        response = await mfyAPI.updateMFY(id, {
          district_id: Number(formData.district_id),
          name: formData.name,
          code: formData.code,
          status: formData.status,
        });
      }

      if (response.success) {
        showSuccess(response.message || 'Muvaffaqiyatli yangilandi');
        onSuccess();
      }
    } catch (err) {
      const msg = err.message || 'Yangilashda xatolik yuz berdi';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  const title = item.type === 'region' ? "Viloyatni Tahrirlash" : item.type === 'district' ? "Tumanni Tahrirlash" : "MFYni Tahrirlash";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Close /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}

                {item.type !== 'region' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Viloyat *</label>
                    <select
                      required
                      value={formData.region_id || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          region_id: e.target.value,
                          ...(item.type === 'mfy' ? { district_id: '' } : {}),
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Tanlang</option>
                      {regions.map((r) => (
                        <option key={r.id ?? r._id} value={r.id ?? r._id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {item.type === 'mfy' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tuman *</label>
                    <select
                      required
                      value={formData.district_id || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, district_id: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Tanlang</option>
                      {districtOptions.map((d) => (
                        <option key={d.id ?? d._id} value={d.id ?? d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomi *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kodi *</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Bekor qilish</button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                    {loading ? 'Yangilanmoqda...' : 'Yangilash'}
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

export default EditRegionModal;
