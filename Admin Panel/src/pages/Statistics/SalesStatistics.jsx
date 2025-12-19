import { useState } from 'react';
import { motion } from 'framer-motion';
import { Analytics, TrendingUp, LocationCity, ArrowForward } from '@mui/icons-material';
import SalesSummaryTab from '../../components/Statistics/SalesSummaryTab';
import SalesViloyatsTab from '../../components/Statistics/SalesViloyatsTab';
import SalesTumansTab from '../../components/Statistics/SalesTumansTab';
import SalesMfysTab from '../../components/Statistics/SalesMfysTab';

const tabs = [
  { id: 'summary', label: 'Umumiy', icon: TrendingUp },
  { id: 'viloyats', label: 'Viloyatlar', icon: LocationCity },
];

const SalesStatistics = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [navigationPath, setNavigationPath] = useState([]); // [{ type: 'viloyat', id, name }, ...]

  const handleNavigate = (type, item) => {
    const newPath = [...navigationPath, { type, id: item._id, name: item.name }];
    setNavigationPath(newPath);
    
    if (type === 'viloyat') {
      // Stay on viloyats tab but show tumans for this viloyat
    } else if (type === 'tuman') {
      // Stay on current tab but show MFYs for this tuman
    }
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      setNavigationPath([]);
      setActiveTab('viloyats');
      return;
    }
    
    const newPath = navigationPath.slice(0, index + 1);
    setNavigationPath(newPath);
    
    if (newPath.length === 0) {
      setActiveTab('viloyats');
    } else if (newPath[newPath.length - 1]?.type === 'viloyat') {
      setActiveTab('viloyats');
    } else if (newPath[newPath.length - 1]?.type === 'tuman') {
      setActiveTab('viloyats');
    }
  };

  const handleBack = () => {
    if (navigationPath.length === 0) {
      setActiveTab('viloyats');
      return;
    }
    
    const newPath = navigationPath.slice(0, -1);
    setNavigationPath(newPath);
    
    if (newPath.length === 0) {
      setActiveTab('viloyats');
    }
  };

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

      {/* Breadcrumb Navigation */}
      {navigationPath.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg shadow-sm border border-gray-200 p-3"
        >
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Viloyatlar
          </button>
          {navigationPath.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <ArrowForward className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {item.name}
              </button>
            </div>
          ))}
          {navigationPath.length > 0 && (
            <button
              onClick={handleBack}
              className="ml-auto px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            >
              ← Orqaga
            </button>
          )}
        </motion.div>
      )}

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
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'summary') {
                    setNavigationPath([]);
                  } else if (tab.id === 'viloyats') {
                    // Reset to viloyats list if clicking viloyats tab
                    if (navigationPath.length > 0) {
                      setNavigationPath([]);
                    }
                  }
                }}
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
        key={`${activeTab}-${navigationPath.length}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        {activeTab === 'summary' && <SalesSummaryTab />}
        {activeTab === 'viloyats' && navigationPath.length === 0 && (
          <SalesViloyatsTab
            onViloyatClick={(viloyat) => handleNavigate('viloyat', viloyat)}
          />
        )}
        {activeTab === 'viloyats' && navigationPath.length === 1 && navigationPath[0]?.type === 'viloyat' && (
          <SalesTumansTab
            viloyatId={navigationPath[0]?.id}
            onTumanClick={(tuman) => handleNavigate('tuman', tuman)}
          />
        )}
        {activeTab === 'viloyats' && navigationPath.length === 2 && navigationPath[1]?.type === 'tuman' && (
          <SalesMfysTab
            viloyatId={navigationPath[0]?.id}
            tumanId={navigationPath[1]?.id}
            onMfyClick={(mfy) => {
              // MFY detail modal will show daily breakdown
              console.log('View MFY daily breakdown:', mfy);
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default SalesStatistics;













