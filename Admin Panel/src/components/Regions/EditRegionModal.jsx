import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { regionAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import RegionSelect from './RegionSelect';

const EditRegionModal = ({ open, onClose, onSuccess, region }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'region',
    parent: null,
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (region && open) {
      setFormData({
        name: region.name || '',
        code: region.code || '',
        type: region.type || 'region',
        parent: region.parent?._id || region.parent || null,
        status: region.status || 'active',
      });
    }
  }, [region, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        type: formData.type,
        code: formData.code,
        parent: formData.parent || null,
        status: formData.status,
      };
      const response = await regionAPI.updateRegion(region._id, updateData);
      if (response.success) {
        showSuccess(response.message || 'Region muvaffaqiyatli yangilandi');
        onSuccess();
      }
    } catch (err) {
      const errorMsg = err.message || 'Region yangilashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!region) return null;

  const getTypeLabel = (type) => {
    switch (type) {
      case 'region':
        return 'Viloyat';
      case 'district':
        return 'Tuman';
      case 'mfy':
        return 'MFY';
      default:
        return type;
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
            onClick={handleClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">
                  {getTypeLabel(region.type)}ni Tahrirlash
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getTypeLabel(formData.type)} nomi *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getTypeLabel(formData.type)} kodi *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>

                {/* Parent (if not region) */}
                {formData.type !== 'region' && (
                  <div>
                    <RegionSelect
                      name="parent"
                      value={formData.parent || ''}
                      onChange={handleChange}
                      label={formData.type === 'district' ? 'Viloyat' : 'Tuman'}
                      required
                      type={formData.type === 'district' ? 'region' : 'district'}
                    />
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                  >
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

