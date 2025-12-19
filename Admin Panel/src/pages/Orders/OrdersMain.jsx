import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { adminDataAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import Orders from './Orders';
import MarketplaceOrders from './MarketplaceOrders';
import ConfirmedByPunktOrders from './ConfirmedByPunktOrders';
import RequestedToContragentsOrders from './RequestedToContragentsOrders';
import DeliveredToPunktOrders from './DeliveredToPunktOrders';
import AssignedToAgentsOrders from './AssignedToAgentsOrders';
import ConfirmedByAgentsOrders from './ConfirmedByAgentsOrders';
import ConfirmedByCustomersOrders from './ConfirmedByCustomersOrders';
import CancelledOrders from './CancelledOrders';

const TABS = [
  { id: 'all', label: 'Barcha', apiMethod: 'getAllOrders' },
  { id: 'marketplace', label: 'Marketplace', apiMethod: 'getMarketplaceOrders' },
  { id: 'confirmed-by-punkt', label: 'Punkt Qabul Qilgan', apiMethod: 'getOrdersConfirmedByPunkt' },
  { id: 'requested-to-contragents', label: 'Kontragentlarga', apiMethod: 'getOrdersRequestedToContragents' },
  { id: 'delivered-to-punkt', label: 'Punktga Yetkazilgan', apiMethod: 'getOrdersDeliveredToPunkt' },
  { id: 'assigned-to-agents', label: 'Agentga', apiMethod: 'getOrdersAssignedToAgents' },
  { id: 'confirmed-by-agents', label: 'Agent Topshirgan', apiMethod: 'getOrdersConfirmedByAgents' },
  { id: 'confirmed-by-customers', label: 'Mijoz Qabul Qilgan', apiMethod: 'getOrdersConfirmedByCustomers' },
  { id: 'cancelled', label: 'Qaytarilgan', apiMethod: 'getCancelledOrders' },
];

const COMPONENTS = {
  'all': Orders,
  'marketplace': MarketplaceOrders,
  'confirmed-by-punkt': ConfirmedByPunktOrders,
  'requested-to-contragents': RequestedToContragentsOrders,
  'delivered-to-punkt': DeliveredToPunktOrders,
  'assigned-to-agents': AssignedToAgentsOrders,
  'confirmed-by-agents': ConfirmedByAgentsOrders,
  'confirmed-by-customers': ConfirmedByCustomersOrders,
  'cancelled': CancelledOrders,
};

const OrdersMain = () => {
  const { showError } = useSnackbar();
  const [activeTab, setActiveTab] = useState('all');
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const activeTabConfig = useMemo(() => {
    return TABS.find(tab => tab.id === activeTab);
  }, [activeTab]);

  const ActiveComponent = useMemo(() => {
    return COMPONENTS[activeTab] || Orders;
  }, [activeTab]);

  // Fetch statistics for active tab
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!activeTabConfig?.apiMethod) return;
      
      setLoadingStats(true);
      setStatistics(null); // Clear previous statistics to show loading
      
      try {
        const apiMethod = adminDataAPI[activeTabConfig.apiMethod];
        if (apiMethod) {
          const response = await apiMethod({ page: 1, limit: 1 });
          if (response.success && response.statistics) {
            setStatistics(response.statistics);
          }
        }
      } catch (err) {
        // Silently fail for statistics
        console.error('Failed to load statistics:', err);
        setStatistics(null);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStatistics();
  }, [activeTab]); // Only depend on activeTab, not activeTabConfig

  const formatPrice = (price) => {
    if (!price) return '0';
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Buyurtmalar</h1>
          <p className="text-gray-600">Barcha buyurtmalarni boshqarish va monitoring qilish</p>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Jami Buyurtmalar</div>
            <div className="text-2xl font-bold text-gray-900">
              {loadingStats ? (
                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                formatPrice(statistics.totalOrders || 0)
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Jami Summa</div>
            <div className="text-2xl font-bold text-indigo-600">
              {loadingStats ? (
                <div className="h-7 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                `${formatPrice(statistics.totalPrice || 0)} so'm`
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Original Summa</div>
            <div className="text-2xl font-bold text-blue-600">
              {loadingStats ? (
                <div className="h-7 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                `${formatPrice(statistics.totalOriginalPrice || 0)} so'm`
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">KPI Summa</div>
            <div className="text-2xl font-bold text-green-600">
              {loadingStats ? (
                <div className="h-7 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                `${formatPrice(statistics.totalKpiPrice || 0)} so'm`
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Jami Mahsulotlar</div>
            <div className="text-2xl font-bold text-purple-600">
              {loadingStats ? (
                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                formatPrice(statistics.totalItems || 0)
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">O'rtacha Summa</div>
            <div className="text-2xl font-bold text-orange-600">
              {loadingStats ? (
                <div className="h-7 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                `${formatPrice(statistics.avgOrderValue || 0)} so'm`
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
      >
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide" aria-label="Tabs">
            <div className="flex min-w-max">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-all duration-200
                    ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <ActiveComponent hideHeader={true} />
      </motion.div>
    </div>
  );
};

export default OrdersMain;

