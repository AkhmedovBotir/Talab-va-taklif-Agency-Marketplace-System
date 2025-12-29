import { motion } from 'framer-motion';
import { 
  Close, 
  CheckCircle, 
  Warning, 
  CalendarToday, 
  Payment,
  Person,
  Phone,
  LocationOn,
  Description,
  Receipt,
  AttachMoney
} from '@mui/icons-material';

const ViewPaymentModal = ({ payment, isOpen, onClose }) => {
  if (!isOpen || !payment) return null;

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

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('uz-UZ').format(num);
  };

  const getStatusBadge = () => {
    if (payment.status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4" />
          To'langan
        </span>
      );
    } else if (payment.status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          <Warning className="w-4 h-4" />
          Bekor qilingan
        </span>
      );
    } else {
      return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          payment.isOverdue 
            ? 'bg-red-100 text-red-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          <Warning className="w-4 h-4" />
          {payment.isOverdue ? 'Muddat o\'tgan' : 'To\'lanmagan'}
        </span>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ marginTop: '0' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Receipt className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">To'lov ma'lumotlari</h2>
              <p className="text-sm text-gray-500 mt-1">To'lov ID: {payment._id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Close className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Status and Amount */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">To'lov summasi</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(payment.amount)} so'm
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-2">Holati</p>
                  {getStatusBadge()}
                </div>
              </div>
            </div>

            {/* Contragent Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Person className="text-indigo-600" />
                Contragent ma'lumotlari
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nomi</p>
                  <p className="text-base font-medium text-gray-900">
                    {payment.contragent?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">INN</p>
                  <p className="text-base font-medium text-gray-900">
                    {payment.contragent?.inn || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Telefon
                  </p>
                  <p className="text-base font-medium text-gray-900">
                    {payment.contragent?.phone || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <LocationOn className="w-4 h-4" />
                    Manzil
                  </p>
                  <p className="text-base font-medium text-gray-900">
                    {[
                      payment.contragent?.viloyat?.name,
                      payment.contragent?.tuman?.name,
                      payment.contragent?.mfy?.name,
                    ]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Payment className="text-indigo-600" />
                To'lov ma'lumotlari
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <CalendarToday className="w-4 h-4" />
                    To'lov muddati
                  </p>
                  <p className="text-base font-medium text-gray-900">
                    {formatDate(payment.dueDate)}
                  </p>
                </div>
                {payment.paidAt && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      To'landi
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {formatDate(payment.paidAt)}
                    </p>
                  </div>
                )}
                {payment.paidBy && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <Person className="w-4 h-4" />
                      To'lovchi
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {payment.paidBy.name || '-'}
                    </p>
                    {payment.paidBy.phone && (
                      <p className="text-sm text-gray-500 mt-1">
                        {payment.paidBy.phone}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Yaratilgan</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Orders */}
            {payment.orders && payment.orders.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt className="text-indigo-600" />
                  Buyurtmalar ({payment.orders.length} ta)
                </h3>
                <div className="space-y-3">
                  {payment.orders.map((order, index) => (
                    <div
                      key={order._id || index}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-medium text-gray-900">
                              Buyurtma #{order.orderNumber || order._id}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Jami summa</p>
                              <p className="font-medium text-gray-900">
                                {formatNumber(order.totalPrice)} so'm
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">KPI summa</p>
                              <p className="font-medium text-gray-900">
                                {formatNumber(order.totalKpiPrice)} so'm
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {payment.notes && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Description className="text-indigo-600" />
                  Qo'shimcha ma'lumotlar
                </h3>
                <p className="text-base text-gray-700 whitespace-pre-wrap">
                  {payment.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            Yopish
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ViewPaymentModal;


