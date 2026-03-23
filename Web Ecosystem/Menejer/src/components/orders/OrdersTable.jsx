import { useState, useEffect } from 'react';
import { getTumanOrders, getMaxallaOrders } from '../../services/api';
import OrderDetailsModal from './OrderDetailsModal';

export default function OrdersTable({ mainTab, subTab, filters, onPageChange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [statistics, setStatistics] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [mainTab, subTab, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = mainTab === 'tuman'
        ? await getTumanOrders(subTab, filters)
        : await getMaxallaOrders(subTab, filters);
      
      if (response.success) {
        setData(response.data || []);
        setPagination({
          page: response.page || 1,
          limit: response.limit || 50,
          total: response.total || 0,
          totalPages: response.totalPages || 1,
        });
        setStatistics(response.statistics || null);
      }
    } catch (err) {
      setError(err.message || 'Buyurtmalarni yuklashda xatolik yuz berdi');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
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

    const statusInfo = statusMap[status] || { text: status || '-', color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      {/* Statistics */}
      {statistics && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistika</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Jami buyurtmalar</p>
              <p className="text-xl font-bold text-gray-900">{statistics.totalOrders || 0}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Jami summa</p>
              <p className="text-xl font-bold text-gray-900">
                {statistics.totalPrice ? statistics.totalPrice.toLocaleString() : 0} so'm
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Asl narx</p>
              <p className="text-xl font-bold text-gray-900">
                {statistics.totalOriginalPrice ? statistics.totalOriginalPrice.toLocaleString() : 0} so'm
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">KPI narx</p>
              <p className="text-xl font-bold text-gray-900">
                {statistics.totalKpiPrice ? statistics.totalKpiPrice.toLocaleString() : 0} so'm
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Mahsulotlar</p>
              <p className="text-xl font-bold text-gray-900">{statistics.totalItems || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyurtma raqami
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mijoz
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Summa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To'lov holati
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sana
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Ma'lumot topilmadi
                  </td>
                </tr>
              ) : (
                data.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.orderNumber || order._id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.user?.name || order.user?.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {order.totalPrice ? order.totalPrice.toLocaleString() : 0} so'm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : order.paymentStatus === 'refunded'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.paymentStatus === 'paid' && 'To\'langan'}
                        {order.paymentStatus === 'pending' && 'To\'lanmagan'}
                        {order.paymentStatus === 'refunded' && 'Qaytarilgan'}
                        {!['paid', 'pending', 'refunded'].includes(order.paymentStatus) && (order.paymentStatus || 'To\'lanmagan')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('uz-UZ', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                        title="Batafsil"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Jami <span className="font-medium">{pagination.total}</span> ta buyurtmadan{' '}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              tasi ko'rsatilmoqda
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Oldingi
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keyingi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
