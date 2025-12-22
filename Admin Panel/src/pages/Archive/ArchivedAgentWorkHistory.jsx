import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { archiveAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import OrderTable from '../../components/Orders/OrderTable';
import ViewOrderModal from '../../components/Orders/ViewOrderModal';
import { ArrowBack, AssignmentInd, Assessment, ShoppingCart } from '@mui/icons-material';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

const ArchivedAgentWorkHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersPagination, setOrdersPagination] = useState({
    total: 0,
    count: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    const fetchWorkHistory = async () => {
      setLoading(true);
      try {
        const response = await archiveAPI.getArchivedAgentWorkHistory(id);
        if (response.success) {
          setAgent(response.agent);
          setStatistics(response.statistics);
          setOrders(response.orders?.data || []);
          setOrdersPagination({
            total: response.orders?.total || 0,
            count: response.orders?.count || 0,
          });
        }
      } catch (err) {
        const errorMsg = err.message || 'Ish tarixini yuklashda xatolik yuz berdi';
        showError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWorkHistory();
    }
  }, [id, showError]);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setSelectedOrder(null);
  };

  const getAgentTypeLabel = (agentType) => {
    switch (agentType) {
      case 'viloyat':
        return 'Viloyat agenti';
      case 'tuman':
        return 'Tuman agenti';
      case 'mfy':
        return 'MFY agenti';
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Agent topilmadi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/archive')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowBack />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <AssignmentInd className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
              <p className="text-sm text-gray-500">Ish tarixi</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Agent Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent ma'lumotlari</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Telefon</p>
            <p className="text-base font-medium text-gray-900">{agent.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Agent turi</p>
            <p className="text-base font-medium text-gray-900">
              {getAgentTypeLabel(agent.agentType)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Viloyat</p>
            <p className="text-base font-medium text-gray-900">{agent.viloyat?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tuman</p>
            <p className="text-base font-medium text-gray-900">{agent.tuman?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">MFY</p>
            <p className="text-base font-medium text-gray-900">{agent.mfy?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Holati</p>
            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
              Arxivlangan
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">O'chirilgan sana</p>
            <p className="text-base font-medium text-gray-900">
              {agent.deletedAt
                ? new Date(agent.deletedAt).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '-'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Statistics */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Jami buyurtmalar</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(statistics.totalOrders)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Jami summa</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(statistics.totalPrice)} so'm
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Assessment className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">O'rtacha buyurtma</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(statistics.avgOrderValue)} so'm
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Assessment className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Jami mahsulotlar</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(statistics.totalItems)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <ShoppingCart className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Jami original narx</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(statistics.totalOriginalPrice)} so'm
                </p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Assessment className="text-cyan-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Jami KPI narxi</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(statistics.totalKpiPrice)} so'm
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Assessment className="text-indigo-600" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Buyurtmalar ({formatNumber(ordersPagination.total)})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Eng so'nggi {formatNumber(ordersPagination.count)} ta buyurtma ko'rsatilmoqda
          </p>
        </div>
        <div className="p-6">
          {orders.length > 0 ? (
            <OrderTable
              orders={orders}
              loading={false}
              onView={handleViewOrder}
              pagination={null}
              onPageChange={null}
            />
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto text-gray-400 text-5xl mb-4" />
              <p className="text-gray-500 text-lg">Buyurtmalar topilmadi</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Order Modal */}
      <ViewOrderModal
        open={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        order={selectedOrder}
      />
    </div>
  );
};

export default ArchivedAgentWorkHistory;




