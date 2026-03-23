import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AccountBalance, 
  Assessment, 
  CreditCard, 
  History, 
  TrendingUp,
  Business,
  Payment
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getAllowedTabIdsForSection } from '../../utils/permissions';
import Balance from './Balance';
import Reports from './Reports';
import KPIPayments from './KPIPayments';
import Transactions from './Transactions';
import Statistics from './Statistics';
import ContragentPayments from './ContragentPayments';
import AdminPayments from './AdminPayments';

const TABS = [
  {
    id: 'admin-payments',
    label: 'Admin To\'lovlari',
    icon: Payment,
    component: AdminPayments,
  },
  {
    id: 'balance',
    label: 'Balans',
    icon: AccountBalance,
    component: Balance,
  },
  {
    id: 'reports',
    label: 'Hisobotlar',
    icon: Assessment,
    component: Reports,
  },
  {
    id: 'kpi-payments',
    label: 'KPI To\'lovlar',
    icon: CreditCard,
    component: KPIPayments,
  },
  {
    id: 'transactions',
    label: 'Transaksiyalar',
    icon: History,
    component: Transactions,
  },
  {
    id: 'statistics',
    label: 'Statistika',
    icon: TrendingUp,
    component: Statistics,
  },
  {
    id: 'contragent-payments',
    label: 'Contragent To\'lovlari',
    icon: Business,
    component: ContragentPayments,
  },
];

const BASE_PATH = '/dashboard/finance';

const FinanceMain = () => {
  const { admin } = useAuth();
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();

  const allowedTabIds = getAllowedTabIdsForSection(admin?.permissions || [], BASE_PATH);
  const allowedTabs = TABS.filter((t) => allowedTabIds.length === 0 || allowedTabIds.includes(t.id));
  const defaultTab = allowedTabs[0]?.id || 'balance';
  const activeTab = (allowedTabIds.length === 0 ? TABS.map((t) => t.id).includes(tabParam) : allowedTabIds.includes(tabParam))
    ? tabParam
    : defaultTab;

  useEffect(() => {
    if (allowedTabIds.length > 0 && tabParam && !allowedTabIds.includes(tabParam)) {
      navigate(`${BASE_PATH}/${defaultTab}`, { replace: true });
    }
  }, [allowedTabIds, tabParam, defaultTab, navigate]);

  const setActiveTab = (tabId) => {
    if (allowedTabIds.length === 0 || allowedTabIds.includes(tabId)) {
      navigate(`/dashboard/finance/${tabId}`);
    }
  };

  const activeTabConfig = TABS.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component;

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <AccountBalance className="text-indigo-600 w-8 h-8" />
          <h1 className="text-3xl font-bold text-gray-800">Moliya Boshqaruvi</h1>
        </div>
        <p className="text-gray-600">Moliya ma'lumotlari va hisobotlari</p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
      >
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide" aria-label="Tabs">
            <div className="flex min-w-max">
              {allowedTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 flex items-center gap-2
                      ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {ActiveComponent && <ActiveComponent hideHeader={true} />}
      </motion.div>
    </div>
  );
};

export default FinanceMain;

