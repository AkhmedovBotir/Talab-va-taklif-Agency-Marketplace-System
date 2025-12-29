import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, CheckCircle } from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { ALL_PERMISSIONS } from '../../utils/permissions';

const ViewAdminModal = ({ open, onClose, admin }) => {
  const { showError } = useSnackbar();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && admin) {
      fetchAdminDetails();
    }
  }, [open, admin]);

  const fetchAdminDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAdminById(admin._id);
      if (response.success) {
        // API returns { success: true, data: {...} }
        setAdminData(response.data);
      }
    } catch (err) {
      const errorMsg = err.message || 'Admin ma\'lumotlarini yuklashda xatolik';
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

  const getRoleBadge = (role) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    if (role === 'admin') {
      return `${baseClasses} bg-purple-100 text-purple-800`;
    }
    return `${baseClasses} bg-blue-100 text-blue-800`;
  };

  if (!admin) return null;

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
                <h2 className="text-2xl font-bold text-gray-800">Admin batafsil ma'lumotlari</h2>
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
                ) : adminData ? (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Asosiy ma'lumotlar</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            To'liq ism
                          </label>
                          <p className="text-gray-900">{adminData.name || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Username
                          </label>
                          <p className="text-gray-900">{adminData.username}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Telefon raqami
                          </label>
                          <p className="text-gray-900">{adminData.telefonRaqam || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Role
                          </label>
                          <span className={getRoleBadge(adminData.role)}>
                            {adminData.role === 'admin' ? 'Admin' : 'General'}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Status
                          </label>
                          <span className={getStatusBadge(adminData.status)}>
                            {adminData.status === 'active' ? 'Faol' : 'Nofaol'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Permissions */}
                    {adminData.permissions && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ruhsatlar</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {ALL_PERMISSIONS.map((permission) => {
                            const hasPermission = adminData.permissions.includes(permission.value);
                            return (
                              <div
                                key={permission.value}
                                className={`flex items-center gap-2 p-3 rounded-md border ${
                                  hasPermission
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                {hasPermission && (
                                  <CheckCircle className="text-green-600 w-5 h-5" />
                                )}
                                <span
                                  className={`text-sm ${
                                    hasPermission ? 'text-green-800 font-medium' : 'text-gray-500'
                                  }`}
                                >
                                  {permission.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          Jami: {adminData.permissions.length} ta ruhsat
                        </p>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Vaqt ma'lumotlari</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Yaratilgan
                          </label>
                          <p className="text-gray-900">{formatDate(adminData.createdAt)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Yangilangan
                          </label>
                          <p className="text-gray-900">{formatDate(adminData.updatedAt)}</p>
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

export default ViewAdminModal;

