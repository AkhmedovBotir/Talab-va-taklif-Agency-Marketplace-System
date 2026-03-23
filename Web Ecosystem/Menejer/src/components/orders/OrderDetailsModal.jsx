export default function OrderDetailsModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

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

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { text: 'Kutilmoqda', color: 'bg-yellow-100 text-yellow-800' },
      'confirmed': { text: 'Tasdiqlangan', color: 'bg-blue-100 text-blue-800' },
      'processing': { text: 'Jarayonda', color: 'bg-purple-100 text-purple-800' },
      'delivered': { text: 'Yetkazilgan', color: 'bg-indigo-100 text-indigo-800' },
      'completed': { text: 'Yakunlangan', color: 'bg-green-100 text-green-800' },
      'cancelled': { text: 'Bekor qilingan', color: 'bg-red-100 text-red-800' },
      'confirmed_by_customer': { text: 'Mijoz tasdiqladi', color: 'bg-green-100 text-green-800' },
      'confirmed_by_punkt': { text: 'Punkt tasdiqladi', color: 'bg-blue-100 text-blue-800' },
      'confirmed_by_agent': { text: 'Agent tasdiqladi', color: 'bg-purple-100 text-purple-800' },
    };

    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity h-[100vh]"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 h-[100vh]">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Buyurtma № {order.orderNumber || order._id.slice(-8)}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 px-6 py-4">
            <div className="space-y-6">
              {/* Order Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Mijoz ma'lumotlari</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Ism:</span> {order.user?.name || '-'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Telefon:</span> {order.user?.phone || '-'}
                    </p>
                    {order.deliveryAddress && (
                      <p className="text-sm">
                        <span className="font-medium">Manzil:</span> {order.deliveryAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">To'lov ma'lumotlari</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">To'lov holati:</span>{' '}
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : order.paymentStatus === 'refunded'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.paymentStatus === 'paid' && "To'langan"}
                        {order.paymentStatus === 'pending' && "To'lanmagan"}
                        {order.paymentStatus === 'refunded' && 'Qaytarilgan'}
                        {!['paid', 'pending', 'refunded'].includes(order.paymentStatus) && (order.paymentStatus || "To'lanmagan")}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">To'lov usuli:</span> {order.paymentMethod || '-'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Jami summa:</span>{' '}
                      <span className="font-semibold">{order.totalPrice ? order.totalPrice.toLocaleString() : 0} so'm</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Buyurtma mahsulotlari</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahsulot</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Miqdor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Narx</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jami</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.product?.name || item.name || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.quantity || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {item.price ? item.price.toLocaleString() : 0} so'm
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {item.totalPrice ? item.totalPrice.toLocaleString() : 0} so'm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Buyurtma sanalari</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Yaratilgan:</span> {formatDate(order.createdAt)}
                    </p>
                    {order.confirmedByPunkt && (
                      <p className="text-sm">
                        <span className="font-medium">Punkt tasdiqladi:</span> {formatDate(order.confirmedByPunkt.confirmedAt)}
                      </p>
                    )}
                    {order.confirmedByAgent && (
                      <p className="text-sm">
                        <span className="font-medium">Agent tasdiqladi:</span> {formatDate(order.confirmedByAgent.confirmedAt)}
                      </p>
                    )}
                    {order.customerConfirmed && order.customerConfirmedAt && (
                      <p className="text-sm">
                        <span className="font-medium">Mijoz tasdiqladi:</span> {formatDate(order.customerConfirmedAt)}
                      </p>
                    )}
                    {order.updatedAt && (
                      <p className="text-sm">
                        <span className="font-medium">Yangilangan:</span> {formatDate(order.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Qo'shimcha ma'lumotlar</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {order.viloyat && (
                      <p className="text-sm">
                        <span className="font-medium">Viloyat:</span> {order.viloyat.name || '-'}
                      </p>
                    )}
                    {order.tuman && (
                      <p className="text-sm">
                        <span className="font-medium">Tuman:</span> {order.tuman.name || '-'}
                      </p>
                    )}
                    {order.punkt && (
                      <p className="text-sm">
                        <span className="font-medium">Punkt:</span> {order.punkt.name || '-'}
                      </p>
                    )}
                    {order.agent && (
                      <p className="text-sm">
                        <span className="font-medium">Agent:</span> {order.agent.name || '-'}
                      </p>
                    )}
                    {order.orderType && (
                      <p className="text-sm">
                        <span className="font-medium">Buyurtma turi:</span> {order.orderType}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contragent Requests */}
              {order.contragentRequests && order.contragentRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Kontragent so'rovlari</h3>
                  <div className="space-y-2">
                    {order.contragentRequests.map((request, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">{request.contragent?.name || 'Kontragent'}</p>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'delivered_to_punkt'
                                ? 'bg-blue-100 text-blue-800'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {request.status === 'accepted' && 'Qabul qilindi'}
                            {request.status === 'pending' && 'Kutilmoqda'}
                            {request.status === 'delivered_to_punkt' && "Punktga yetkazildi"}
                            {request.status === 'rejected' && 'Rad etildi'}
                            {!['accepted', 'pending', 'delivered_to_punkt', 'rejected'].includes(request.status) && request.status}
                          </span>
                        </div>
                        {request.price && (
                          <p className="text-sm text-gray-600">Narx: {request.price.toLocaleString()} so'm</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
