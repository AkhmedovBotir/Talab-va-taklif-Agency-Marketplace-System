import { motion, AnimatePresence } from 'framer-motion';
import { 
  Close, 
  Receipt, 
  Person, 
  Phone, 
  AttachMoney, 
  CreditCard, 
  CalendarToday,
  LocationOn,
  CheckCircle,
  Cancel,
  Pending,
  ArrowForward
} from '@mui/icons-material';
import { formatDateTime } from '../../utils/dateFormatter';

const ViewTransactionModal = ({ open, onClose, transaction }) => {
  if (!transaction) return null;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'confirmed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'collected':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'submitted':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'received':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'collected':
        return 'Yig\'ilgan';
      case 'submitted':
        return 'Topshirilgan';
      case 'received':
        return 'Qabul qilingan';
      case 'confirmed':
        return 'Tasdiqlangan';
      case 'rejected':
        return 'Rad etilgan';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5" />;
      case 'rejected':
        return <Cancel className="w-5 h-5" />;
      case 'pending':
        return <Pending className="w-5 h-5" />;
      default:
        return <ArrowForward className="w-5 h-5" />;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash':
        return 'Naqd';
      case 'card':
        return 'Karta';
      default:
        return method;
    }
  };

  const getCurrentHolderLabel = (holder) => {
    switch (holder) {
      case 'user':
        return 'Foydalanuvchi';
      case 'mfy_agent':
        return 'MFY Agent';
      case 'district_agent':
        return 'Tuman Agent';
      case 'province_agent':
        return 'Viloyat Agent';
      case 'finance':
        return 'Moliya';
      default:
        return holder;
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
                <h2 className="text-2xl font-bold text-gray-800">Transaksiya Batafsil Ma'lumotlari</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Status Badge */}
                <div className="mb-6">
                  <div className={`inline-flex items-center gap-2 ${getStatusBadge(transaction.status)}`}>
                    {getStatusIcon(transaction.status)}
                    <span>{getStatusLabel(transaction.status)}</span>
                  </div>
                </div>

                {/* Order Information */}
                {transaction.order && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Receipt className="text-indigo-600" />
                      Buyurtma Ma'lumotlari
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-40">Buyurtma raqami:</span>
                        <span className="text-sm text-gray-900 flex-1 font-medium">
                          #{transaction.order.orderNumber || '-'}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-40">Buyurtma summasi:</span>
                        <span className="text-sm text-gray-900 flex-1">
                          {formatAmount(transaction.order.totalPrice || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Information */}
                {transaction.user && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Person className="text-indigo-600" />
                      Foydalanuvchi Ma'lumotlari
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-40">Ism:</span>
                        <span className="text-sm text-gray-900 flex-1">
                          {transaction.user.name || '-'}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-40">Telefon:</span>
                        <span className="text-sm text-gray-900 flex-1 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {transaction.user.phone || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction Details */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <AttachMoney className="text-indigo-600" />
                    Transaksiya Ma'lumotlari
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AttachMoney className="text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Summa</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatAmount(transaction.amount)}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {transaction.paymentMethod === 'cash' ? (
                          <AttachMoney className="text-green-600" />
                        ) : (
                          <CreditCard className="text-green-600" />
                        )}
                        <span className="text-sm font-medium text-gray-600">To'lov usuli</span>
                      </div>
                      <p className="text-xl font-bold text-green-900">
                        {getPaymentMethodLabel(transaction.paymentMethod)}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <LocationOn className="text-purple-600" />
                        <span className="text-sm font-medium text-gray-600">Hozirgi egasi</span>
                      </div>
                      <p className="text-lg font-bold text-purple-900">
                        {getCurrentHolderLabel(transaction.currentHolder)}
                      </p>
                    </div>
                    {transaction.collectedBy && (
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Person className="text-indigo-600" />
                          <span className="text-sm font-medium text-gray-600">Yig'ilgan agent</span>
                        </div>
                        <p className="text-lg font-bold text-indigo-900">
                          {transaction.collectedBy?.name || '-'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CalendarToday className="text-indigo-600" />
                    Sana Ma'lumotlari
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {transaction.createdAt && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-40">Yaratilgan:</span>
                        <span className="text-sm text-gray-900 flex-1">
                          {formatDateTime(transaction.createdAt)}
                        </span>
                      </div>
                    )}
                    {transaction.collectedAt && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-40">Yig'ilgan:</span>
                        <span className="text-sm text-gray-900 flex-1">
                          {formatDateTime(transaction.collectedAt)}
                        </span>
                      </div>
                    )}
                    {transaction.updatedAt && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-40">Yangilangan:</span>
                        <span className="text-sm text-gray-900 flex-1">
                          {formatDateTime(transaction.updatedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction Path */}
                {transaction.transactionPath && transaction.transactionPath.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaksiya Yo'li</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3">
                        {transaction.transactionPath.map((path, index) => (
                          <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
                            <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {getCurrentHolderLabel(path.holder)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDateTime(path.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{path.action}</p>
                              {path.note && (
                                <p className="text-xs text-gray-500 mt-1">{path.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
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

export default ViewTransactionModal;


