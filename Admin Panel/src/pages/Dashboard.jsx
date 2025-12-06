import { motion } from 'framer-motion';
import { Dashboard as DashboardIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { admin } = useAuth();

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <DashboardIcon className="text-indigo-600" />
          Dashboard
        </h1>
        <p className="text-gray-600">Xush kelibsiz, {admin?.fullname || admin?.username}!</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Jami Foydalanuvchilar', value: '0', color: 'bg-blue-500' },
          { title: 'Faol Foydalanuvchilar', value: '0', color: 'bg-green-500' },
          { title: 'Jami Mahsulotlar', value: '0', color: 'bg-purple-500' },
          { title: 'Bugungi Buyurtmalar', value: '0', color: 'bg-orange-500' },
        ].map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`${card.color} rounded-lg p-6 text-white shadow-lg`}
          >
            <h3 className="text-sm font-medium mb-2 opacity-90">{card.title}</h3>
            <p className="text-3xl font-bold">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">So'nggi Faoliyat</h2>
        <p className="text-gray-600">Bu yerda so'nggi faoliyatlar ko'rsatiladi...</p>
      </motion.div>
    </div>
  );
};

export default Dashboard;



