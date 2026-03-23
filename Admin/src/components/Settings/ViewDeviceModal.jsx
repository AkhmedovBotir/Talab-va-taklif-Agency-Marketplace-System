import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Devices, Person, Phone, LocationOn, Computer, CheckCircle, Cancel } from '@mui/icons-material';
import { adminDeviceAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const ViewDeviceModal = ({ open, onClose, device }) => {
  const { showError } = useSnackbar();
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && device) {
      fetchDeviceDetails();
    }
  }, [open, device]);

  const fetchDeviceDetails = async () => {
    setLoading(true);
    try {
      const response = await adminDeviceAPI.getDeviceById(device._id);
      if (response.success) {
        setDeviceData(response.data);
      }
    } catch (error) {
      showError(error.message || 'Qurilma ma\'lumotlarini yuklashda xatolik');
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

  const getUserModelLabel = (model) => {
    const labels = {
      'Admin': 'Admin',
      'Contragent': 'Kontragent',
      'Punkt': 'Punkt',
      'Agent': 'Agent',
    };
    return labels[model] || model;
  };

  if (!open) return null;

  const displayData = deviceData || device;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <Close />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Devices style={{ fontSize: 28 }} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Qurilma Ma'lumotlari</h2>
                <p className="text-sm text-white/80">Batafsil ko'rish</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Person style={{ fontSize: 18 }} />
                    Foydalanuvchi Ma'lumotlari
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Ism</p>
                      <p className="text-sm font-medium text-gray-900">
                        {displayData.user?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Telefon</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Phone style={{ fontSize: 14 }} />
                        {displayData.user?.phone || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Foydalanuvchi turi</p>
                      <p className="text-sm font-medium text-gray-900">
                        {getUserModelLabel(displayData.userModel)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Device Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Computer style={{ fontSize: 18 }} />
                    Qurilma Ma'lumotlari
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Qurilma nomi</p>
                      <p className="text-sm font-medium text-gray-900">
                        {displayData.deviceName || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Qurilma ID</p>
                      <p className="text-sm font-medium text-gray-900 font-mono text-xs break-all">
                        {displayData.deviceId || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Qurilma turi</p>
                      <p className="text-sm font-medium text-gray-900">
                        {displayData.deviceType || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Platforma</p>
                      <p className="text-sm font-medium text-gray-900">
                        {displayData.platform || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Operatsion tizim</p>
                      <p className="text-sm font-medium text-gray-900">
                        {displayData.os || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Brauzer</p>
                      <p className="text-sm font-medium text-gray-900">
                        {displayData.browser || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">IP manzil</p>
                      <p className="text-sm font-medium text-gray-900">
                        {displayData.ipAddress || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        {displayData.isActive ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                            <CheckCircle style={{ fontSize: 14 }} />
                            Faol
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                            <Cancel style={{ fontSize: 14 }} />
                            Nofaol
                          </span>
                        )}
                        {displayData.isPrimary && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Asosiy
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                {displayData.location && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <LocationOn style={{ fontSize: 18 }} />
                      Joylashuv
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Mamlakat</p>
                        <p className="text-sm font-medium text-gray-900">
                          {displayData.location.country || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Shahar</p>
                        <p className="text-sm font-medium text-gray-900">
                          {displayData.location.city || '-'}
                        </p>
                      </div>
                      {displayData.location.latitude && displayData.location.longitude && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Kenglik</p>
                            <p className="text-sm font-medium text-gray-900">
                              {displayData.location.latitude}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Uzunlik</p>
                            <p className="text-sm font-medium text-gray-900">
                              {displayData.location.longitude}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Vaqt belgilari
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Oxirgi kirish</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(displayData.lastLoginAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Oxirgi faollik</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(displayData.lastActivityAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Yaratilgan</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(displayData.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Yangilangan</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(displayData.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ViewDeviceModal;





