import { motion } from 'framer-motion';
import { TrendingUp, Receipt, CheckCircle, Pending } from '@mui/icons-material';

const FinanceReportCard = ({ title, value, icon: Icon, color = 'bg-blue-500', subtitle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className={`${color} rounded-lg p-6 text-white shadow-lg`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium opacity-90">{title}</h3>
        {Icon && <Icon className="text-white opacity-80" />}
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
    </motion.div>
  );
};

export default FinanceReportCard;

