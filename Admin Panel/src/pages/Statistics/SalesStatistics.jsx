import { useState } from 'react';
import { motion } from 'framer-motion';
import { Analytics, TrendingUp, LocationCity, Business, Home } from '@mui/icons-material';
import SalesSummaryTab from '../../components/Statistics/SalesSummaryTab';
import SalesViloyatsTab from '../../components/Statistics/SalesViloyatsTab';
import SalesTumansTab from '../../components/Statistics/SalesTumansTab';
import SalesMfysTab from '../../components/Statistics/SalesMfysTab';

const tabs = [
  { id: 'summary', label: 'Umumiy', icon: TrendingUp },
  { id: 'viloyats', label: 'Viloyatlar', icon: LocationCity },
  { id: 'tumans', label: 'Tumanlar', icon: Business },
  { id: 'mfys', label: 'MFYlar', icon: Home },
];

const SalesStatistics = () => {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <Analytics className="text-indigo-600 w-8 h-8" />
          <h1 className="text-3xl font-bold text-gray-800">Sotuv Statistikasi</h1>
        </div>
        <p className="text-gray-600">Hududlar bo'yicha sotuv statistikasini ko'rish</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
      >
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        {activeTab === 'summary' && <SalesSummaryTab />}
        {activeTab === 'viloyats' && <SalesViloyatsTab />}
        {activeTab === 'tumans' && <SalesTumansTab />}
        {activeTab === 'mfys' && <SalesMfysTab />}
      </motion.div>
    </div>
  );
};

export default SalesStatistics;













