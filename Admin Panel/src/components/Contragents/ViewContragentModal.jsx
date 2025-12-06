import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { contragentAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const ViewContragentModal = ({ open, onClose, contragent }) => {
  const { showError } = useSnackbar();
  const [contragentData, setContragentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && contragent) {
      fetchContragentDetails();
    }
  }, [open, contragent]);

  const fetchContragentDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await contragentAPI.getContragentById(contragent._id);
      if (response.success) {
        // API returns { success: true, data: {...} }
        setContragentData(response.data);
      }
    } catch (err) {
      const errorMsg = err.message || 'Kontragent ma\'lumotlarini yuklashda xatolik';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    if (status === 'active') {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-red-100 text-red-800`;
  };

  if (!contragent) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Kontragent batafsil ma'lumotlari</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
                  </div>
                ) : contragentData ? (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Asosiy ma'lumotlar</h3>
                      
                      {/* Logo */}
                      {contragentData.logo && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Logo
                          </label>
                          <img
                            src={contragentData.logo}
                            alt="Contragent logo"
                            className="max-w-48 max-h-48 object-contain border border-gray-300 rounded"
                          />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Nomi
                          </label>
                          <p className="text-gray-900">{contragentData.name || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            INN
                          </label>
                          <p className="text-gray-900">{contragentData.inn || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Telefon raqami
                          </label>
                          <p className="text-gray-900">{contragentData.phone || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Viloyat
                          </label>
                          <p className="text-gray-900">
                            {contragentData.viloyat?.name || '-'}
                            {contragentData.viloyat?.code && ` (${contragentData.viloyat.code})`}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Tuman
                          </label>
                          <p className="text-gray-900">
                            {contragentData.tuman?.name || '-'}
                            {contragentData.tuman?.code && ` (${contragentData.tuman.code})`}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            MFY
                          </label>
                          <p className="text-gray-900">
                            {contragentData.mfy?.name || '-'}
                            {contragentData.mfy?.code && ` (${contragentData.mfy.code})`}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Status
                          </label>
                          <span className={getStatusBadge(contragentData.status)}>
                            {contragentData.status === 'active' ? 'Faol' : 'Nofaol'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Vaqt ma'lumotlari</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Yaratilgan
                          </label>
                          <p className="text-gray-900">{formatDate(contragentData.createdAt)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Yangilangan
                          </label>
                          <p className="text-gray-900">{formatDate(contragentData.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Ma'lumotlar yuklanmoqda...</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ViewContragentModal;

