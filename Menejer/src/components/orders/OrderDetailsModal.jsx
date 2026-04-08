export default function OrderDetailsModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

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
              Buyurtma № {order.id}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Asosiy ma'lumotlar</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Status:</span> {order.status || '-'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">User ID:</span> {order.user_id || '-'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Current stage:</span> {order.current_stage || '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Taqsimot</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Punkt:</span> {order.assigned_punkt_name || '-'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Agent:</span> {order.assigned_agent_name || '-'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Jami summa:</span> <span className="font-semibold">{(order.total_amount || 0).toLocaleString()} so'm</span>
                    </p>
                  </div>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Buyurtma mahsulotlari</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahsulot</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontragent</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Miqdor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Narx</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jami</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.product_name || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {item.contragent_name || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {item.quantity || 0} {item.unit || ''}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {(item.unit_price || 0).toLocaleString()} so'm
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {(item.line_total || 0).toLocaleString()} so'm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
