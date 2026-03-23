import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Category, ShoppingBag, Store } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getAllowedTabIdsForSection } from '../../utils/permissions';
import Categories from '../Categories/Categories';
import Products from '../Products/Products';
import MaxallaProducts from './MaxallaProducts';

const TABS = [
  {
    id: 'categories',
    label: 'Kategoriyalar',
    icon: Category,
    component: Categories,
  },
  {
    id: 'products',
    label: 'Mahsulotlar',
    icon: ShoppingBag,
    component: Products,
  },
  {
    id: 'maxalla-products',
    label: 'Maxalla Productlarida',
    icon: Store,
    component: MaxallaProducts,
  },
];

const BASE_PATH = '/dashboard/ombor';

const OmborMain = () => {
  const { admin } = useAuth();
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();

  const allowedTabIds = getAllowedTabIdsForSection(admin?.permissions || [], BASE_PATH);
  const allowedTabs = TABS.filter((t) => allowedTabIds.length === 0 || allowedTabIds.includes(t.id));
  const defaultTab = allowedTabs[0]?.id || 'categories';
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
      navigate(`/dashboard/ombor/${tabId}`);
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
          <Category className="text-indigo-600 w-8 h-8" />
          <h1 className="text-3xl font-bold text-gray-800">Ombor Boshqaruvi</h1>
        </div>
        <p className="text-gray-600">Kategoriyalar va mahsulotlar boshqaruvi</p>
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
        className="min-h-[400px]"
      >
        {ActiveComponent && <ActiveComponent hideHeader={true} />}
      </motion.div>
    </div>
  );
};

export default OmborMain;





