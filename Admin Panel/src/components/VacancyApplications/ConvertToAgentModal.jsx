import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Close, Person } from '@mui/icons-material';
import { vacancyApplicationAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import RegionSelect from '../Regions/RegionSelect';

const ConvertToAgentModal = ({ open, onClose, onSuccess, application }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    viloyat: '',
    tuman: '',
    mfy: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'viloyat') {
      setFormData((prev) => ({ ...prev, viloyat: value, tuman: '', mfy: '' }));
    } else if (name === 'tuman') {
      setFormData((prev) => ({ ...prev, tuman: value, mfy: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.viloyat) {
      setError('Viloyat tanlanishi shart');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        viloyat: formData.viloyat,
      };

      if (formData.tuman) {
        payload.tuman = formData.tuman;
      }

      if (formData.mfy) {
        payload.mfy = formData.mfy;
      }

      const response = await vacancyApplicationAPI.convertToAgent(application._id, payload);

      if (response.success) {
        showSuccess(response.message || 'Topshirish muvaffaqiyatli agent ga aylantirildi');
        setFormData({ viloyat: '', tuman: '', mfy: '' });
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMsg = err.message || 'Agent ga aylantirishda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setFormData({ viloyat: '', tuman: '', mfy: '' });
      onClose();
    }
  };

  const getAgentType = () => {
    if (formData.mfy) return 'MFY Agent';
    if (formData.tuman) return 'Tuman Agent';
    if (formData.viloyat) return 'Viloyat Agent';
    return '';
  };

  if (!application) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Person className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Agent ga Aylantirish</h2>
                      <p className="text-xs text-indigo-100 mt-0.5">
                        Topshirishni agent ga aylantirish uchun viloyat, tuman va MFY tanlang
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all disabled:opacity-50"
                  >
                    <Close className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Applicant Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-800 mb-1">Arizachi:</p>
                    <p className="text-sm text-blue-900 font-semibold">
                      {application.applicant?.firstName} {application.applicant?.lastName}
                    </p>
                    <p className="text-xs text-blue-700">{application.applicant?.phone}</p>
                  </div>

                  {/* Agent Type Preview */}
                  {getAgentType() && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-indigo-800">
                        Agent turi: <span className="font-semibold">{getAgentType()}</span>
                      </p>
                    </div>
                  )}

                  {/* Region Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Viloyat <span className="text-red-500">*</span>
                      </label>
                      <RegionSelect
                        name="viloyat"
                        value={formData.viloyat}
                        onChange={handleChange}
                        type="region"
                        label="Viloyatni tanlang"
                        required
                      />
                    </div>

                    {formData.viloyat && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Tuman (ixtiyoriy)
                        </label>
                        <RegionSelect
                          name="tuman"
                          value={formData.tuman}
                          onChange={handleChange}
                          type="district"
                          parentId={formData.viloyat}
                          label="Tumanni tanlang"
                        />
                      </div>
                    )}

                    {formData.tuman && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          MFY (ixtiyoriy)
                        </label>
                        <RegionSelect
                          name="mfy"
                          value={formData.mfy}
                          onChange={handleChange}
                          type="mfy"
                          parentId={formData.tuman}
                          label="MFYni tanlang"
                        />
                      </div>
                    )}
                  </div>

                  {/* Info Message */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      <span className="font-semibold">Eslatma:</span> Agent yaratilgandan keyin, agent
                      telefon raqam orqali parol o'rnatishi kerak (3 bosqichli jarayon).
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-800 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md hover:shadow-lg"
                    >
                      <Person className="w-4 h-4" />
                      {loading ? 'Aylantirilmoqda...' : 'Agent ga Aylantirish'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConvertToAgentModal;

