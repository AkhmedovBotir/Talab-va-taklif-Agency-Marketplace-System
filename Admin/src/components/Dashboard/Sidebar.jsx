import { motion, AnimatePresence } from 'framer-motion';
import {
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  ChevronLeft,
  ExpandLess,
  ExpandMore,
  Logout,
  People,
  AccountTree,
  BusinessCenter,
  SupportAgent,
  Badge,
  Store,
  Apartment,
  Inventory2,
  Timeline,
  BarChart,
} from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const { isOpen, setIsOpen } = useSidebar();
  const { logout, admin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isStructureOpen, setIsStructureOpen] = useState(false);

  const structureItems = useMemo(
    () => [
      { icon: People, label: 'Adminlar', path: '/dashboard/admins' },
      { icon: SupportAgent, label: 'Agentlar', path: '/dashboard/agents' },
      { icon: Badge, label: 'Menejerlar', path: '/dashboard/managers' },
      { icon: Store, label: 'Punktlar', path: '/dashboard/punkts' },
      { icon: AccountTree, label: 'Hududlar', path: '/dashboard/regions' },
      { icon: BusinessCenter, label: 'Kontragent va do\'konlar', path: '/dashboard/contragents/types' },
    ],
    []
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPathActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isDashboardActive = location.pathname === '/dashboard';
  const isStructureActive = structureItems.some((item) => isPathActive(item.path));

  useEffect(() => {
    if (isStructureActive) {
      setIsStructureOpen(true);
    }
  }, [isStructureActive]);

  return (
    <motion.div
      initial={false}
      animate={{
        width: isOpen ? '320px' : '80px',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-indigo-900 text-white h-screen fixed left-0 top-0 shadow-2xl z-50"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={`p-4 border-b border-indigo-700 flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.h2
                key="title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-xl font-bold whitespace-nowrap"
              >
                Admin Panel
              </motion.h2>
            ) : null}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-indigo-800 transition-colors"
          >
            {isOpen ? <ChevronLeft /> : <MenuIcon />}
          </motion.button>
        </div>

        {/* User Info */}
        {isOpen && admin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-b border-indigo-700"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-700 rounded-full flex items-center justify-center font-semibold">
                {admin.fullname?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{admin.fullname || admin.username}</p>
                <p className="text-xs text-indigo-300 truncate">{admin.role}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="mx-2 mb-1">
              <motion.div whileHover={{ backgroundColor: 'rgba(129, 140, 248, 0.2)', x: isOpen ? 5 : 0 }} className="rounded-lg">
                <div
                  onClick={() => navigate('/dashboard')}
                  className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'} p-3 cursor-pointer rounded-lg transition-colors ${
                    isDashboardActive ? 'bg-indigo-800' : 'hover:bg-indigo-800/70'
                  }`}
                >
                  <DashboardIcon className="text-white flex-shrink-0" />
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium truncate"
                      >
                        Dashboard
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
            <div className="mx-2 mb-1">
              <motion.div whileHover={{ backgroundColor: 'rgba(129, 140, 248, 0.2)', x: isOpen ? 5 : 0 }} className="rounded-lg">
                <div
                  onClick={() => {
                    if (!isOpen) setIsOpen(true);
                    setIsStructureOpen((prev) => !prev);
                  }}
                  className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} p-3 cursor-pointer rounded-lg transition-colors ${
                    isStructureActive || isStructureOpen ? 'bg-indigo-800' : 'hover:bg-indigo-800/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Apartment className="text-white flex-shrink-0" />
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="font-medium truncate"
                        >
                          Tuzilmalar
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {isOpen && (isStructureOpen ? <ExpandLess /> : <ExpandMore />)}
                </div>
              </motion.div>
            </div>

            <AnimatePresence initial={false}>
              {isOpen && isStructureOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mx-4 mb-1 p-2 rounded-xl bg-indigo-800/60">
                    {structureItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = isPathActive(item.path);
                      return (
                        <div key={item.path} className="mb-1 last:mb-0">
                          <div
                            onClick={() => navigate(item.path)}
                            className={`flex items-center space-x-3 p-3 cursor-pointer rounded-lg transition-colors ${
                              isActive ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:bg-indigo-700/70 hover:text-white'
                            }`}
                          >
                            <Icon className="flex-shrink-0" fontSize="small" />
                            <span className="font-medium whitespace-nowrap overflow-hidden text-sm">{item.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
            <div className="mx-2 mb-1">
              <motion.div whileHover={{ backgroundColor: 'rgba(129, 140, 248, 0.2)', x: isOpen ? 5 : 0 }} className="rounded-lg">
                <div
                  onClick={() => navigate('/dashboard/warehouse/categories')}
                  className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'} p-3 cursor-pointer rounded-lg transition-colors ${
                    isPathActive('/dashboard/warehouse') ? 'bg-indigo-800' : 'hover:bg-indigo-800/70'
                  }`}
                >
                  <Inventory2 className="text-white flex-shrink-0" />
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium truncate"
                      >
                        Ombor
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="mx-2 mb-1">
              <motion.div whileHover={{ backgroundColor: 'rgba(129, 140, 248, 0.2)', x: isOpen ? 5 : 0 }} className="rounded-lg">
                <div
                  onClick={() => navigate('/dashboard/marketplace-users')}
                  className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'} p-3 cursor-pointer rounded-lg transition-colors ${
                    isPathActive('/dashboard/marketplace-users') ? 'bg-indigo-800' : 'hover:bg-indigo-800/70'
                  }`}
                >
                  <People className="text-white flex-shrink-0" />
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium truncate"
                      >
                        Marketplace foydalanuvchilari
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
            <div className="mx-2 mb-1">
              <motion.div whileHover={{ backgroundColor: 'rgba(129, 140, 248, 0.2)', x: isOpen ? 5 : 0 }} className="rounded-lg">
                <div
                  onClick={() => navigate('/dashboard/order-pipeline-monitor')}
                  className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'} p-3 cursor-pointer rounded-lg transition-colors ${
                    isPathActive('/dashboard/order-pipeline-monitor') ? 'bg-indigo-800' : 'hover:bg-indigo-800/70'
                  }`}
                >
                  <Timeline className="text-white flex-shrink-0" />
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium truncate"
                      >
                        Marketplace buyurtmalar
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 }}>
            <div className="mx-2 mb-1">
              <motion.div whileHover={{ backgroundColor: 'rgba(129, 140, 248, 0.2)', x: isOpen ? 5 : 0 }} className="rounded-lg">
                <div
                  onClick={() => navigate('/dashboard/statistics/transactions-by-area')}
                  className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'} p-3 cursor-pointer rounded-lg transition-colors ${
                    isPathActive('/dashboard/statistics/transactions-by-area') ? 'bg-indigo-800' : 'hover:bg-indigo-800/70'
                  }`}
                >
                  <BarChart className="text-white flex-shrink-0" />
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium truncate"
                      >
                        Tranzaksiyalar statistikasi
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-indigo-700">
          <motion.div
            whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', x: isOpen ? 5 : 0 }}
            className="rounded-lg"
          >
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${isOpen ? 'space-x-3 justify-start' : 'justify-center'} p-3 rounded-lg transition-colors group`}
            >
              <Logout className="text-white flex-shrink-0" />
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-medium whitespace-nowrap overflow-hidden text-white"
                  >
                    Chiqish
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;

