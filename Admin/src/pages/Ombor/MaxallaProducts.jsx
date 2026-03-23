import { useState } from 'react';
import { motion } from 'framer-motion';
import { Description, ShoppingBag } from '@mui/icons-material';
import BaseProducts from './BaseProducts';
import MaxallaProductsList from './MaxallaProductsList';

const TABS = [
  {
    id: 'templates',
    label: 'Shablonlar',
    icon: Description,
    component: BaseProducts,
  },
  {
    id: 'products',
    label: 'Maxsulotlar',
    icon: ShoppingBag,
    component: MaxallaProductsList,
  },
];

const MaxallaProducts = ({ hideHeader = false }) => {
  const [activeTab, setActiveTab] = useState('templates');

  const activeTabConfig = TABS.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component;

  return (
    <div>
      {/* Header */}
      {!hideHeader && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Maxalla Productlarida</h1>
            <p className="text-gray-600">Shablonlar va maxalla productlarini boshqarish</p>
          </div>
        </motion.div>
      )}

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
              {TABS.map((tab) => {
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

export default MaxallaProducts;
