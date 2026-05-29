import { useState, useEffect } from 'react';
import {
  getManagerOrderPipelineAll,
  getManagerOrderPipelineOverview,
  getManagerOrderPipelineStage,
} from '../../services/api';
import OrderDetailsModal from './OrderDetailsModal';
import ViewDetailsButton from '../common/ViewDetailsButton';
import { useMarketplaceUserLookup } from '../../hooks/useMarketplaceUserLookup';
import { formatOrderStage } from '../../utils/entityDetails';

export default function OrdersTable({ selectedStage, filters, onPageChange }) {
  const { getUserName } = useMarketplaceUserLookup();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [overview, setOverview] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [selectedStage, filters.page, filters.limit]);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await getManagerOrderPipelineOverview();
      setOverview(response?.data || response || null);
    } catch {
      setOverview(null);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const response = selectedStage === 'all'
        ? await getManagerOrderPipelineAll(filters)
        : await getManagerOrderPipelineStage(selectedStage, filters);

      if (response.success) {
        setData(response.data || []);
        setPagination({
          page: response.page || 1,
          limit: response.limit || 10,
          total: response.total || 0,
          totalPages: response.totalPages || 1,
        });
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

  const filteredData = (data || []).filter((order) => {
    if (!filters.search?.trim()) return true;
    const q = filters.search.toLowerCase();
    const userLabel = getUserName(order.user_id, order);
    return [
      order.id,
      userLabel,
      order.assigned_punkt_name,
      order.assigned_agent_name,
      order.current_stage,
    ]
      .map((v) => String(v || '').toLowerCase())
      .some((v) => v.includes(q));
  });

  const stageBadge = (stage) => (
    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
      {formatOrderStage(stage)}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        userDisplayName={
          selectedOrder ? getUserName(selectedOrder.user_id, selectedOrder) : undefined
        }
      />
      {overview && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Jami</p>
              <p className="text-xl font-bold text-gray-900">{overview.total || overview.total_orders || 0}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Delivered</p>
              <p className="text-xl font-bold text-gray-900">
                {overview.delivered || 0}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">In progress</p>
              <p className="text-xl font-bold text-gray-900">{overview.in_progress || 0}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total amount</p>
              <p className="text-xl font-bold text-gray-900">{(overview.total_amount || 0).toLocaleString()} so'm</p>
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
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mijoz
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Punkt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Summa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Ma'lumot topilmadi
                  </td>
                </tr>
              ) : (
                filteredData.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getUserName(order.user_id, order)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.assigned_punkt_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.assigned_agent_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stageBadge(order.current_stage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {(order.total_amount || 0).toLocaleString()} so'm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <ViewDetailsButton onClick={() => handleViewDetails(order)} />
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
