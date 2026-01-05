import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';

const targetTypeLabels = {
  all: 'Barchaga',
  punkts: 'Punktlar',
  viloyat_agents: 'Viloyat agentlari',
  tuman_agents: 'Tuman agentlari',
  mfy_agents: 'MFY agentlari',
  marketplace_users: 'Marketplace foydalanuvchilari',
  contragents: 'Kontragentlar',
};

const notificationTypeConfig = {
  info: { label: "Ma'lumot", color: 'bg-blue-100 text-blue-800' },
  warning: { label: 'Ogohlantirish', color: 'bg-yellow-100 text-yellow-800' },
  success: { label: 'Muvaffaqiyat', color: 'bg-green-100 text-green-800' },
  error: { label: 'Xatolik', color: 'bg-red-100 text-red-800' },
  announcement: { label: "E'lon", color: 'bg-purple-100 text-purple-800' },
  promotion: { label: 'Aksiya', color: 'bg-orange-100 text-orange-800' },
  update: { label: 'Yangilanish', color: 'bg-cyan-100 text-cyan-800' },
};

const ViewNotificationModal = ({ open, onClose, notification }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const typeConfig = notificationTypeConfig[notification?.type] || notificationTypeConfig.info;

  return (
    <AnimatePresence>
      {open && notification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Xabar tafsilotlari</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Close className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Sarlavha</label>
                <p className="text-gray-900 font-medium">{notification.title}</p>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Xabar matni</label>
                <p className="text-gray-900 whitespace-pre-wrap">{notification.message}</p>
              </div>

              {/* Type & Target */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Xabar turi</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${typeConfig.color}`}>
                    {typeConfig.label}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Qabul qiluvchi</label>
                  <p className="text-gray-900">
                    {targetTypeLabels[notification.targetType] || notification.targetType}
                  </p>
                </div>
              </div>

              {/* Status & Sent By */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      notification.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {notification.isActive ? 'Faol' : 'Nofaol'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Yuboruvchi</label>
                  <p className="text-gray-900">
                    {notification.sentBy?.name || notification.sentBy?.username || '-'}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Yaratilgan</label>
                  <p className="text-gray-900 text-sm">{formatDate(notification.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">O'qilganlar</label>
                  <p className="text-gray-900">{notification.readBy?.length || 0} ta</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Yopish
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ViewNotificationModal;

