import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { partnershipRequestAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const ViewPartnershipRequestModal = ({ open, onClose, request }) => {
  const { showError } = useSnackbar();
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && request) {
      fetchRequestDetails();
    }
  }, [open, request]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await partnershipRequestAPI.getPartnershipRequestById(request._id);
      if (response.success) {
        setRequestData(response.data);
      }
    } catch (err) {
      const errorMsg = err.message || 'So\'rovni yuklashda xatolik';
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
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  const getContactStatusBadge = (contactStatus) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (contactStatus) {
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'in_progress':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      case 'contacted':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'not_contacted':
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const displayData = requestData || request;
  if (!displayData) return null;

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
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Hamkorlik so'rovi batafsil ma'lumotlari</h2>
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
                ) : displayData ? (
                  <div className="space-y-6">
                    {/* Status Badges */}
                    <div className="flex gap-3">
                      <span className={getStatusBadge(displayData.status)}>
                        {displayData.status === 'approved' ? 'Tasdiqlangan' : 
                         displayData.status === 'rejected' ? 'Rad etilgan' : 'Ko\'rib chiqilmoqda'}
                      </span>
                      <span className={getContactStatusBadge(displayData.contactStatus)}>
                        {displayData.contactStatus === 'completed' ? 'Tugallangan' :
                         displayData.contactStatus === 'in_progress' ? 'Jarayonda' :
                         displayData.contactStatus === 'contacted' ? 'Aloqa qilingan' : 'Aloqa qilinmagan'}
                      </span>
                    </div>

                    {/* Marketplace User Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Foydalanuvchi ma'lumotlari</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Ism</label>
                          <p className="text-gray-900">
                            {displayData.marketplaceUser?.firstName} {displayData.marketplaceUser?.lastName}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Telefon</label>
                          <p className="text-gray-900">{displayData.marketplaceUser?.phone || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Company Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Kompaniya ma'lumotlari</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Kompaniya nomi</label>
                          <p className="text-gray-900">{displayData.companyName || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">INN</label>
                          <p className="text-gray-900">{displayData.inn || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">MFO</label>
                          <p className="text-gray-900">{displayData.mfo || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Hisob raqami</label>
                          <p className="text-gray-900">{displayData.accountNumber || '-'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-500 mb-1">Faoliyat turi</label>
                          <p className="text-gray-900">{displayData.activity || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Location Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Joylashuv</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Viloyat</label>
                          <p className="text-gray-900">{displayData.viloyat?.name || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Tuman</label>
                          <p className="text-gray-900">{displayData.tuman?.name || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">MFY</label>
                          <p className="text-gray-900">{displayData.mfy?.name || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Manager Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Menejer ma'lumotlari</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Ism</label>
                          <p className="text-gray-900">
                            {displayData.managerFirstName} {displayData.managerLastName}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Telefon</label>
                          <p className="text-gray-900">{displayData.managerPhone || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    {displayData.adminNotes && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin izohi</h3>
                        <div className="bg-gray-50 p-4 rounded">
                          <p className="text-gray-900">{displayData.adminNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Vaqt belgilari</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Yaratilgan sana</label>
                          <p className="text-gray-900">{formatDate(displayData.createdAt)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Yangilangan sana</label>
                          <p className="text-gray-900">{formatDate(displayData.updatedAt)}</p>
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

export default ViewPartnershipRequestModal;




