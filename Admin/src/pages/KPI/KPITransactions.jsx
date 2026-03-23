import { motion } from 'framer-motion';
import { Receipt } from '@mui/icons-material';
import KPITransactionsSection from '../../components/KPI/KPITransactionsSection';

const KPITransactions = () => {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <Receipt className="text-indigo-600 w-8 h-8" />
          <h1 className="text-3xl font-bold text-gray-800">KPI Transaksiyalar</h1>
        </div>
        <p className="text-gray-600">Barcha KPI bonus transaksiyalarini ko'rish</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <KPITransactionsSection />
      </motion.div>
    </div>
  );
};

export default KPITransactions;













