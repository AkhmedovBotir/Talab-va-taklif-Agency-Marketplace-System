import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { tumanOrdersAPI, maxallaOrdersAPI, adminDataAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import TumanOrders from './TumanOrders';
import MaxallaOrders from './MaxallaOrders';

const TUMAN_TABS = [
  { id: 'all', label: 'Barcha', apiMethod: 'getAllOrders' },
  { id: 'marketplace', label: 'Marketplace', apiMethod: 'getMarketplaceOrders' },
  { id: 'confirmed-by-punkt', label: 'Punkt Qabul Qilgan', apiMethod: 'getConfirmedByPunktOrders' },
  { id: 'requested-to-contragents', label: 'Kontragentlarga', apiMethod: 'getRequestedToContragentsOrders' },
  { id: 'delivered-to-punkt', label: 'Punktga Yetkazilgan', apiMethod: 'getDeliveredToPunktOrders' },
  { id: 'assigned-to-agents', label: 'Agentga', apiMethod: 'getAssignedToAgentsOrders' },
  { id: 'confirmed-by-agents', label: 'Agent Topshirgan', apiMethod: 'getConfirmedByAgentsOrders' },
  { id: 'confirmed-by-customers', label: 'Mijoz Qabul Qilgan', apiMethod: 'getConfirmedByCustomersOrders' },
  { id: 'cancelled', label: 'Qaytarilgan', apiMethod: 'getCancelledOrders' },
];

const MAXALLA_TABS = [
  { id: 'all', label: 'Barcha', apiMethod: 'getAllOrders' },
  { id: 'marketplace', label: 'Marketplace', apiMethod: 'getMarketplaceOrders' },
  { id: 'requested-to-contragents', label: 'Kontragentlarga', apiMethod: 'getRequestedToContragentsOrders' },
  { id: 'delivered-to-punkt', label: 'Punktga Yetkazilgan', apiMethod: 'getDeliveredToPunktOrders' },
  { id: 'assigned-to-agents', label: 'Agentga', apiMethod: 'getAssignedToAgentsOrders' },
  { id: 'confirmed-by-agents', label: 'Agent Topshirgan', apiMethod: 'getConfirmedByAgentsOrders' },
  { id: 'confirmed-by-customers', label: 'Mijoz Qabul Qilgan', apiMethod: 'getConfirmedByCustomersOrders' },
  { id: 'cancelled', label: 'Qaytarilgan', apiMethod: 'getCancelledOrders' },
];

const OrdersMain = () => {
  const { showError } = useSnackbar();
  const [orderType, setOrderType] = useState('tuman'); // 'tuman' or 'maxalla'
  const [activeTab, setActiveTab] = useState('all');
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const currentTabs = useMemo(() => {
    return orderType === 'tuman' ? TUMAN_TABS : MAXALLA_TABS;
  }, [orderType]);

  const currentAPI = useMemo(() => {
    return orderType === 'tuman' ? tumanOrdersAPI : maxallaOrdersAPI;
  }, [orderType]);

  const activeTabConfig = useMemo(() => {
    return currentTabs.find(tab => tab.id === activeTab);
  }, [activeTab, currentTabs]);

  // Reset active tab when order type changes
  useEffect(() => {
    setActiveTab('all');
    setStatistics(null);
  }, [orderType]);

  // Fetch statistics for active tab
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!activeTabConfig?.apiMethod) return;
      
      setLoadingStats(true);
      setStatistics(null);
      
      try {
        const apiMethod = currentAPI[activeTabConfig.apiMethod];
        if (apiMethod) {
          const response = await apiMethod({ page: 1, limit: 1 });
          if (response.success && response.statistics) {
            setStatistics(response.statistics);
          }
        }
      } catch (err) {
        console.error('Failed to load statistics:', err);
        setStatistics(null);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStatistics();
  }, [activeTab, orderType, activeTabConfig, currentAPI]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Buyurtmalar</h1>
            <p className="text-gray-600">Barcha buyurtmalarni boshqarish va monitoring qilish</p>
          </div>
          
          {/* Order Type Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setOrderType('tuman')}
              className={`px-6 py-3 text-sm font-medium rounded-lg transition-all ${
                orderType === 'tuman'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Tuman
            </button>
            <button
              onClick={() => setOrderType('maxalla')}
              className={`px-6 py-3 text-sm font-medium rounded-lg transition-all ${
                orderType === 'maxalla'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Maxalla
            </button>
          </div>
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
          {orderType === 'tuman' && (
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
          )}
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

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
      >
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide" aria-label="Tabs">
            <div className="flex min-w-max">
              {currentTabs.map((tab) => (
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
        key={`${orderType}-${activeTab}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {orderType === 'tuman' ? (
          <TumanOrders
            activeTab={activeTab}
            activeTabConfig={activeTabConfig}
            hideHeader={true}
          />
        ) : (
          <MaxallaOrders
            activeTab={activeTab}
            activeTabConfig={activeTabConfig}
            hideHeader={true}
          />
        )}
      </motion.div>
    </div>
  );
};

export default OrdersMain;
