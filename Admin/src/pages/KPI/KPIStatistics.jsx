import { motion } from 'framer-motion';
import { BarChart } from '@mui/icons-material';
import KPIStatisticsSection from '../../components/KPI/KPIStatisticsSection';

const KPIStatistics = () => {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <BarChart className="text-indigo-600 w-8 h-8" />
          <h1 className="text-3xl font-bold text-gray-800">KPI Statistika</h1>
        </div>
        <p className="text-gray-600">Umumiy KPI bonus statistikasi</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <KPIStatisticsSection />
      </motion.div>
    </div>
  );
};

export default KPIStatistics;













