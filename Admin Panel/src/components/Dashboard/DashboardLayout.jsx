import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import { useSidebar } from '../../contexts/SidebarContext';

const DashboardLayout = () => {
  const { isOpen } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <motion.main
        animate={{
          marginLeft: isOpen ? '280px' : '80px',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 overflow-y-auto p-8"
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
};

export default DashboardLayout;

