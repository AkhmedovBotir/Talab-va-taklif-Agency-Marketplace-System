import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { formatTableDate, formatDate } from '../../utils/dateFormatter';

const ViewOrderModal = ({ open, onClose, order }) => {
  if (!order) return null;

  const formatPrice = (price) => {
    if (!price) return '0';
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'shipped':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'delivered':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'processing':
        return 'Jarayonda';
      case 'shipped':
        return 'Yuborilgan';
      case 'delivered':
        return 'Yetkazilgan';
      case 'cancelled':
        return 'Bekor qilingan';
      default:
        return status;
    }
  };

  const getPaymentStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'refunded':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'paid':
        return 'To\'langan';
      case 'failed':
        return 'Muvaffaqiyatsiz';
      case 'refunded':
        return 'Qaytarilgan';
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash':
        return 'Naqd';
      case 'card':
        return 'Karta';
      default:
        return method || '-';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-gray-800"
        >
          Buyurtma Ma'lumotlari
        </motion.div>
      </DialogTitle>
      <DialogContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Order Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buyurtma raqami</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-medium">
                {order.orderNumber || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <p className="text-sm">
                <span className={getStatusBadge(order.status)}>
                  {getStatusLabel(order.status)}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To'lov statusi</label>
              <p className="text-sm">
                <span className={getPaymentStatusBadge(order.paymentStatus)}>
                  {getPaymentStatusLabel(order.paymentStatus)}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To'lov usuli</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {getPaymentMethodLabel(order.paymentMethod)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jami summa</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-medium">
                {formatPrice(order.totalPrice)} so'm
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asl summa</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatPrice(order.totalOriginalPrice)} so'm
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KPI bonus</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatPrice(order.totalKpiPrice)} so'm
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mahsulotlar soni</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {order.itemCount || (order.items?.length || 0)} ta
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yaratilgan sana</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatTableDate(order.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yangilangan sana</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatDate(order.updatedAt)}
              </p>
            </div>
          </div>

          {/* User Information */}
          {order.user && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-md">
              <h4 className="text-sm font-medium text-indigo-900 mb-3">Foydalanuvchi ma'lumotlari</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-indigo-700 mb-1">Ism</label>
                  <p className="text-sm text-indigo-900">
                    {order.user.firstName || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-700 mb-1">Familiya</label>
                  <p className="text-sm text-indigo-900">
                    {order.user.lastName || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-700 mb-1">Telefon</label>
                  <p className="text-sm text-indigo-900">
                    {order.user.phone || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-700 mb-1">Status</label>
                  <p className="text-sm text-indigo-900">
                    {order.user.status || '-'}
                  </p>
                </div>
                {order.user.viloyat && (
                  <div>
                    <label className="block text-xs font-medium text-indigo-700 mb-1">Viloyat</label>
                    <p className="text-sm text-indigo-900">
                      {order.user.viloyat.name || '-'}
                    </p>
                  </div>
                )}
                {order.user.tuman && (
                  <div>
                    <label className="block text-xs font-medium text-indigo-700 mb-1">Tuman</label>
                    <p className="text-sm text-indigo-900">
                      {order.user.tuman.name || '-'}
                    </p>
                  </div>
                )}
                {order.user.mfy && (
                  <div>
                    <label className="block text-xs font-medium text-indigo-700 mb-1">MFY</label>
                    <p className="text-sm text-indigo-900">
                      {order.user.mfy.name || '-'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Information */}
          {(order.deliveryViloyat || order.deliveryTuman || order.deliveryMfy || order.deliveryNote || order.phoneNumber || order.deliveryAddress) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="text-sm font-medium text-green-900 mb-3">Yetkazib berish ma'lumotlari</h4>
              <div className="space-y-2">
                {order.deliveryViloyat && (
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">Viloyat</label>
                    <p className="text-sm text-green-900">
                      {order.deliveryViloyat.name || '-'}
                    </p>
                  </div>
                )}
                {order.deliveryTuman && (
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">Tuman</label>
                    <p className="text-sm text-green-900">
                      {order.deliveryTuman.name || '-'}
                    </p>
                  </div>
                )}
                {order.deliveryMfy && (
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">MFY</label>
                    <p className="text-sm text-green-900">
                      {order.deliveryMfy.name || '-'}
                    </p>
                  </div>
                )}
                {order.deliveryAddress && (
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">Manzil</label>
                    <p className="text-sm text-green-900">
                      {order.deliveryAddress}
                    </p>
                  </div>
                )}
                {order.deliveryNote && (
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">Eslatma</label>
                    <p className="text-sm text-green-900">
                      {order.deliveryNote}
                    </p>
                  </div>
                )}
                {order.phoneNumber && (
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">Telefon raqami</label>
                    <p className="text-sm text-green-900">
                      {order.phoneNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Workflow Information */}
          {(order.punktStatus || order.currentPunkt || order.confirmedByPunkt || order.assignedToAgent || order.assignedByPunkt || order.confirmedByAgent || order.customerConfirmed) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Buyurtma jarayoni</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {order.punktStatus && (
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Punkt statusi</label>
                    <p className="text-sm text-blue-900">
                      {order.punktStatus === 'pending' ? 'Kutilmoqda' : 
                       order.punktStatus === 'confirmed' ? 'Tasdiqlangan' : 
                       order.punktStatus === 'rejected' ? 'Rad etilgan' : order.punktStatus}
                    </p>
                  </div>
                )}
                {order.currentPunkt && (
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Joriy punkt</label>
                    <p className="text-sm text-blue-900">
                      {order.currentPunkt.name || '-'}
                      {order.currentPunkt.phone && ` (${order.currentPunkt.phone})`}
                    </p>
                  </div>
                )}
                {order.confirmedByPunkt && (
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Punkt tomonidan tasdiqlangan</label>
                    <p className="text-sm text-blue-900">
                      {order.confirmedByPunkt.name || '-'}
                    </p>
                  </div>
                )}
                {order.assignedToAgent && (
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Agentga yuborilgan</label>
                    <p className="text-sm text-blue-900">
                      {order.assignedToAgent.name || '-'}
                      {order.assignedToAgent.phone && ` (${order.assignedToAgent.phone})`}
                      {order.assignedToAgent.mfy?.name && ` - ${order.assignedToAgent.mfy.name}`}
                    </p>
                  </div>
                )}
                {order.assignedByPunkt && (
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Punkt tomonidan yuborilgan</label>
                    <p className="text-sm text-blue-900">
                      {order.assignedByPunkt.name || '-'}
                    </p>
                  </div>
                )}
                {order.assignedAt && (
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Yuborilgan sana</label>
                    <p className="text-sm text-blue-900">
                      {formatDate(order.assignedAt)}
                    </p>
                  </div>
                )}
                {order.confirmedByAgent && (
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Agent tomonidan tasdiqlangan</label>
                    <p className="text-sm text-blue-900">
                      {order.confirmedByAgent.name || '-'}
                      {order.confirmedByAgent.phone && ` (${order.confirmedByAgent.phone})`}
                    </p>
                  </div>
                )}
                {order.agentConfirmedAt && (
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Agent tasdiqlagan sana</label>
                    <p className="text-sm text-blue-900">
                      {formatDate(order.agentConfirmedAt)}
                    </p>
                  </div>
                )}
                {order.customerConfirmed !== undefined && (
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Mijoz tomonidan tasdiqlangan</label>
                    <p className="text-sm">
                      <span className={order.customerConfirmed ? 'px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800' : 'px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800'}>
                        {order.customerConfirmed ? 'Ha' : 'Yo\'q'}
                      </span>
                    </p>
                  </div>
                )}
                {order.customerConfirmedAt && (
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Mijoz tasdiqlagan sana</label>
                    <p className="text-sm text-blue-900">
                      {formatDate(order.customerConfirmedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Buyurtma mahsulotlari</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mahsulot</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kategoriya</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kontragent</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Miqdor</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Narx</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Jami</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {item.product?.name || '-'}
                          </div>
                          {item.product?.productCode && (
                            <div className="text-xs text-gray-500">
                              Kod: {item.product.productCode}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {item.product?.category?.name || '-'}
                          {item.product?.subcategory?.name && (
                            <div className="text-xs text-gray-400">
                              {item.product.subcategory.name}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {item.product?.contragent?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {item.quantity || 0} {item.product?.unit || ''}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {formatPrice(item.price)} so'm
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatPrice((item.price || 0) * (item.quantity || 0))} so'm
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-right font-medium text-gray-700">
                        Jami:
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatPrice(order.totalPrice)} so'm
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Yopish
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewOrderModal;


