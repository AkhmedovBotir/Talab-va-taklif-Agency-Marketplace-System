import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { mfyAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const CreateMFYModal = ({ open, onClose, onSuccess, regions, districts }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    region_id: '',
    district_id: '',
    name: '',
    code: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const regionOptions = useMemo(() => regions || [], [regions]);
  const districtOptions = useMemo(
    () => (districts || []).filter((d) => String(d.region_id) === String(formData.region_id)),
    [districts, formData.region_id]
  );

  const reset = () => {
    setError('');
    setFormData({ region_id: '', district_id: '', name: '', code: '', status: 'active' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await mfyAPI.createMFY({
        district_id: Number(formData.district_id),
        name: formData.name,
        code: formData.code,
        status: formData.status,
      });
      if (response.success) {
        showSuccess(response.message || 'MFY muvaffaqiyatli yaratildi');
        reset();
        onSuccess();
      }
    } catch (err) {
      const msg = err.message || 'MFY yaratishda xatolik yuz berdi';
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              reset();
              onClose();
            }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Yangi MFY Qo'shish</h2>
                <button onClick={() => { reset(); onClose(); }} className="text-gray-400 hover:text-gray-600">
                  <Close />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Viloyat *</label>
                  <select
                    required
                    value={formData.region_id}
                    onChange={(e) => setFormData((p) => ({ ...p, region_id: e.target.value, district_id: '' }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Tanlang</option>
                    {regionOptions.map((region) => (
                      <option key={region.id ?? region._id} value={region.id ?? region._id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tuman *</label>
                  <select
                    required
                    disabled={!formData.region_id}
                    value={formData.district_id}
                    onChange={(e) => setFormData((p) => ({ ...p, district_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  >
                    <option value="">Tanlang</option>
                    {districtOptions.map((district) => (
                      <option key={district.id ?? district._id} value={district.id ?? district._id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MFY nomi *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MFY kodi *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => { reset(); onClose(); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                    Bekor qilish
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400">
                    {loading ? "Qo'shilmoqda..." : "Qo'shish"}
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

export default CreateMFYModal;
