import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, CheckCircle, Cancel, Phone, Business } from '@mui/icons-material';
import { partnershipRequestAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const ManagePartnershipRequestModal = ({ open, onClose, onSuccess, request }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    adminNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (request && open) {
      setFormData({
        adminNotes: request.adminNotes || '',
      });
      setError('');
    }
  }, [request, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Get available actions based on current status
  const getAvailableActions = () => {
    if (!request) return [];
    
    const status = request.status;
    const actions = [];

    switch (status) {
      case 'pending':
        // Can only go to reviewing (must follow the flow)
        actions.push(
          { id: 'reviewing', label: 'Ko\'rib chiqilmoqda deb belgilash', icon: CheckCircle, color: 'blue' }
        );
        break;
      case 'reviewing':
        // Can only go to contacted (must follow the flow)
        actions.push(
          { id: 'contacted', label: 'Aloqa qilingan deb belgilash', icon: Phone, color: 'indigo' }
        );
        break;
      case 'contacted':
        // Can only approve or reject (final decision)
        actions.push(
          { id: 'approve', label: 'Tasdiqlash', icon: CheckCircle, color: 'green' },
          { id: 'reject', label: 'Rad etish', icon: Cancel, color: 'red' }
        );
        break;
      case 'approved':
        // Can convert to contragent
        actions.push(
          { id: 'convert', label: 'Kontragentga aylantirish', icon: Business, color: 'emerald' }
        );
        break;
      default:
        break;
    }

    return actions;
  };

  const handleAction = async (actionId) => {
    setError('');
    setLoading(true);

    try {
      let response;

      switch (actionId) {
        case 'reviewing':
          response = await partnershipRequestAPI.updateStatusToReviewing(request._id);
          break;
        case 'contacted':
          response = await partnershipRequestAPI.updateStatusToContacted(
            request._id,
            formData.adminNotes
          );
          break;
        case 'approve':
          response = await partnershipRequestAPI.approvePartnershipRequest(
            request._id,
            formData.adminNotes
          );
          break;
        case 'reject':
          if (!formData.adminNotes || formData.adminNotes.trim() === '') {
            setError('Rad etish sababi (adminNotes) kiritilishi shart');
            setLoading(false);
            return;
          }
          response = await partnershipRequestAPI.rejectPartnershipRequest(
            request._id,
            formData.adminNotes
          );
          break;
        case 'convert':
          response = await partnershipRequestAPI.convertToContragent(request._id);
          break;
        default:
          setError('Noto\'g\'ri amal');
          setLoading(false);
          return;
      }

      if (response && response.success) {
        showSuccess(response.message || 'Amal muvaffaqiyatli bajarildi');
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMsg = err.message || 'Amalni bajarishda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setFormData({
      adminNotes: '',
    });
    onClose();
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Tasdiqlangan';
      case 'rejected':
        return 'Rad etilgan';
      case 'reviewing':
        return 'Ko\'rib chiqilmoqda';
      case 'contacted':
        return 'Aloqa qilingan';
      case 'pending':
      default:
        return 'Kutilmoqda';
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-600 hover:bg-blue-700 text-white',
      green: 'bg-green-600 hover:bg-green-700 text-white',
      red: 'bg-red-600 hover:bg-red-700 text-white',
      indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    };
    return colors[color] || colors.blue;
  };

  if (!request) return null;

  const availableActions = getAvailableActions();
  const requiresNotes = availableActions.some(a => a.id === 'reject');

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
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">So'rovni boshqarish</h2>
                  <p className="text-sm text-gray-500 mt-1">{request.companyName}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Request Info */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Joriy holat</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {getStatusLabel(request.status)}
                    </p>
                  </div>
                  {request.marketplaceUser && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {request.marketplaceUser.firstName} {request.marketplaceUser.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{request.marketplaceUser.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Status Flow Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-900 mb-2">Status ketma-ketligi:</p>
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <span className={request.status === 'pending' ? 'font-bold' : ''}>Kutilmoqda</span>
                    <span>→</span>
                    <span className={request.status === 'reviewing' ? 'font-bold' : ''}>Ko'rib chiqilmoqda</span>
                    <span>→</span>
                    <span className={request.status === 'contacted' ? 'font-bold' : ''}>Aloqa qilingan</span>
                    <span>→</span>
                    <span className={request.status === 'approved' ? 'font-bold text-green-700' : ''}>Tasdiqlangan</span>
                    <span>/</span>
                    <span className={request.status === 'rejected' ? 'font-bold text-red-700' : ''}>Rad etilgan</span>
                  </div>
                </div>

                {/* Available Actions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Mavjud amallar
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {availableActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleAction(action.id)}
                        disabled={loading}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 border-transparent hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${getColorClasses(action.color)}`}
                      >
                        <action.icon className="w-5 h-5" />
                        <span className="flex-1 text-left font-medium">{action.label}</span>
                        {loading && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin Notes */}
                {(availableActions.some(a => a.id === 'contacted' || a.id === 'approve' || a.id === 'reject')) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin izohi {requiresNotes && availableActions.some(a => a.id === 'reject') ? <span className="text-red-500">*</span> : '(ixtiyoriy)'}
                    </label>
                    <textarea
                      name="adminNotes"
                      value={formData.adminNotes}
                      onChange={handleChange}
                      rows={4}
                      maxLength={1000}
                      required={requiresNotes}
                      placeholder={
                        availableActions.some(a => a.id === 'reject')
                          ? 'Admin izohini kiriting. Rad etish uchun sabab kiritilishi shart (maksimum 1000 belgi)...'
                          : 'Admin izohini kiriting (maksimum 1000 belgi)...'
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.adminNotes.length}/1000 belgi
                      {availableActions.some(a => a.id === 'reject') && ' - Rad etish uchun sabab majburiy'}
                    </p>
                  </div>
                )}

                {/* Info for convert action */}
                {availableActions.some(a => a.id === 'convert') && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                    <p className="text-sm text-emerald-800">
                      Tasdiqlangan so'rovni kontragentga aylantirish. Bu amalni bajarishdan oldin barcha ma'lumotlarni tekshiring.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
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

export default ManagePartnershipRequestModal;

