import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Close, Category, CalendarToday } from '@mui/icons-material';
import * as Icons from '@mui/icons-material';
import { contragentTypeAPI } from '../../services/api';

const ViewContragentTypeModal = ({ open, onClose, contragentType }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (open && contragentType) {
      // If we have full data, use it, otherwise fetch
      if (contragentType.name && contragentType.icon) {
        setData(contragentType);
      } else {
        fetchContragentType();
      }
    }
  }, [open, contragentType]);

  const fetchContragentType = async () => {
    if (!contragentType?._id) return;
    setLoading(true);
    try {
      const response = await contragentTypeAPI.getContragentTypeById(contragentType._id);
      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Error fetching contragent type:', err);
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
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-semibold';
    return status === 'active'
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-gray-100 text-gray-800`;
  };

  if (!contragentType) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
            onClick={onClose}
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
                      <Category className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Kontragent Turi Ma'lumotlari</h2>
                      <p className="text-xs text-indigo-100 mt-0.5">
                        Batafsil ma'lumot
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
                  >
                    <Close className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
                  </div>
                ) : data ? (
                  <div className="space-y-4">
                    {/* Name */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                        Nomi
                      </label>
                      <p className="text-base font-semibold text-gray-900">{data.name}</p>
                    </div>

                    {/* Icon */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                        Icon
                      </label>
                      {data.icon && Icons[data.icon] ? (
                        <div className="flex items-center gap-3">
                          {(() => {
                            const IconComponent = Icons[data.icon];
                            return <IconComponent className="w-8 h-8 text-indigo-600" />;
                          })()}
                          <span className="text-sm text-gray-600 font-mono">{data.icon}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Icon topilmadi</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                        Status
                      </label>
                      <span className={getStatusBadge(data.status)}>
                        {data.status === 'active' ? 'Faol' : 'Nofaol'}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                          <CalendarToday className="w-3 h-3" />
                          Yaratilgan sana
                        </label>
                        <p className="text-sm text-gray-900">{formatDate(data.createdAt)}</p>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                          <CalendarToday className="w-3 h-3" />
                          Yangilangan sana
                        </label>
                        <p className="text-sm text-gray-900">{formatDate(data.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Ma'lumotlar topilmadi</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ViewContragentTypeModal;


