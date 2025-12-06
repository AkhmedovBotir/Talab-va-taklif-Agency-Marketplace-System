import { motion } from 'framer-motion';
import { Home } from '@mui/icons-material';
import KPIMfyAgentsSection from '../../components/KPI/KPIMfyAgentsSection';

const KPIMfyAgents = () => {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <Home className="text-indigo-600 w-8 h-8" />
          <h1 className="text-3xl font-bold text-gray-800">MFY Agentlari KPI</h1>
        </div>
        <p className="text-gray-600">MFY agentlarining KPI bonus ma'lumotlari</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <KPIMfyAgentsSection />
      </motion.div>
    </div>
  );
};

export default KPIMfyAgents;













