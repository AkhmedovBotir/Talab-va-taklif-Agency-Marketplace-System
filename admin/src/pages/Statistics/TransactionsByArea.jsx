import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Analytics, LocationCity, ArrowForward } from '@mui/icons-material';
import TransactionsAreaTab from '../../components/Statistics/TransactionsAreaTab';

const TransactionsByArea = () => {
  const [navigationPath, setNavigationPath] = useState([]);

  const activeLevel = useMemo(() => {
    if (navigationPath.length >= 2) return 'mfy';
    if (navigationPath.length === 1) return 'district';
    return 'region';
  }, [navigationPath]);

  const selectedRegionId = navigationPath[0]?.type === 'region' ? navigationPath[0].id : undefined;
  const selectedDistrictId = navigationPath[1]?.type === 'district' ? navigationPath[1].id : undefined;

  const handleNavigate = (type, item) => {
    if (!item?.id) return;
    if (type === 'region') {
      setNavigationPath([{ type: 'region', id: item.id, name: item.name || `Viloyat #${item.id}` }]);
      return;
    }
    if (type === 'district' && selectedRegionId) {
      setNavigationPath((prev) => [
        prev[0],
        { type: 'district', id: item.id, name: item.name || `Tuman #${item.id}` },
      ]);
    }
  };

  const handleBreadcrumbClick = (index) => {
    if (index < 0) {
      setNavigationPath([]);
      return;
    }
    setNavigationPath((prev) => prev.slice(0, index + 1));
  };

  const handleBack = () => {
    setNavigationPath((prev) => prev.slice(0, -1));
  };

  const accent = activeLevel === 'district' ? 'cyan' : activeLevel === 'mfy' ? 'teal' : 'indigo';
  const levelLabel = activeLevel === 'district' ? 'Tumanlar' : activeLevel === 'mfy' ? 'MFYlar' : 'Viloyatlar';

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Analytics className="text-indigo-600 w-8 h-8" />
          <h1 className="text-3xl font-bold text-gray-800">Tranzaksiyalar statistikasi</h1>
        </div>
        <p className="text-gray-600">Hudud kesimida buyurtmalar soni va summa statistikasi</p>
      </motion.div>

      {navigationPath.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg shadow-sm border border-gray-200 p-3"
        >
          <button onClick={() => handleBreadcrumbClick(-1)} className="text-indigo-600 hover:text-indigo-800 font-medium">
            Viloyatlar
          </button>
          {navigationPath.map((item, index) => (
            <div key={`${item.type}-${item.id}`} className="flex items-center gap-2">
              <ArrowForward className="w-4 h-4 text-gray-400" />
              <button onClick={() => handleBreadcrumbClick(index)} className="text-indigo-600 hover:text-indigo-800 font-medium">
                {item.name}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleBack}
            className="ml-auto px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            ← Orqaga
          </button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
      >
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button className="flex items-center gap-2 px-6 py-4 font-medium text-indigo-600 border-b-2 border-indigo-600">
            <LocationCity className="w-5 h-5" />
            <span>{levelLabel}</span>
          </button>
        </div>
      </motion.div>

      <motion.div
        key={`${activeLevel}-${navigationPath.length}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <TransactionsAreaTab
          level={activeLevel}
          accent={accent}
          regionId={selectedRegionId}
          districtId={selectedDistrictId}
          onNavigate={handleNavigate}
        />
      </motion.div>
    </div>
  );
};

export default TransactionsByArea;
