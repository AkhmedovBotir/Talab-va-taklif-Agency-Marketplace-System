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
  VpnKey,
  Comment,
  Archive,
  QrCode2,
  Payments,
} from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';
import usePermissions from '../../hooks/usePermissions';
import {
  canSeeCommentarySection,
  canSeeContragentsSection,
  canSeeOrdersSection,
  canSeeWarehouseSection,
  getFirstContragentPath,
  getFirstWarehousePath,
  hasAnyPermission,
} from '../../utils/permissions';

const Sidebar = () => {
  const { isOpen, setIsOpen } = useSidebar();
  const { logout, admin } = useAuth();
  const { can, permissions } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isStructureOpen, setIsStructureOpen] = useState(false);

  const firstContragentPath = useMemo(
    () => getFirstContragentPath(permissions),
    [permissions]
  );

  const firstWarehousePath = useMemo(
    () => getFirstWarehousePath(permissions),
    [permissions]
  );

  const showWarehouse = canSeeWarehouseSection(permissions);
  const showContragentsInStructure = canSeeContragentsSection(permissions);
  const showOrders = canSeeOrdersSection(permissions);
  const showCommentary = canSeeCommentarySection(permissions);

  const structureItems = useMemo(() => {
    const items = [
      { icon: People, label: 'Adminlar', path: '/dashboard/admins', permission: 'adminlar' },
      { icon: SupportAgent, label: 'Agentlar', path: '/dashboard/agents', permission: 'agentlar' },
      { icon: Badge, label: 'Menejerlar', path: '/dashboard/managers', permission: 'menejerlar' },
      { icon: Store, label: 'Punktlar', path: '/dashboard/punkts', permission: 'punktlar' },
      { icon: AccountTree, label: 'Hududlar', path: '/dashboard/regions', permission: 'hududlar' },
      ...(showContragentsInStructure && firstContragentPath
        ? [
            {
              icon: BusinessCenter,
              label: "Kontragent va do'konlar",
              path: firstContragentPath,
            },
          ]
        : []),
    ];
    return items.filter((item) => (item.permission ? can(item.permission) : true));
  }, [can, showContragentsInStructure, firstContragentPath]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPathActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isDashboardActive = location.pathname === '/dashboard';
  const isStructureActive = structureItems.some((item) => isPathActive(item.path));

  useEffect(() => {
    if (isStructureActive) setIsStructureOpen(true);
  }, [isStructureActive]);

  const navItem = (icon, label, path, active) => (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mx-2 mb-1">
      <motion.div whileHover={{ backgroundColor: 'rgba(129, 140, 248, 0.2)', x: isOpen ? 5 : 0 }} className="rounded-lg">
        <div
          onClick={() => navigate(path)}
          className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'} p-3 cursor-pointer rounded-lg transition-colors ${
            active ? 'bg-indigo-800' : 'hover:bg-indigo-800/70'
          }`}
        >
          {icon}
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-medium truncate"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? '320px' : '80px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-indigo-900 text-white h-screen fixed left-0 top-0 shadow-2xl z-50"
    >
      <div className="flex flex-col h-full">
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

        {isOpen && admin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 border-b border-indigo-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-700 rounded-full flex items-center justify-center font-semibold">
                {(admin.fullname || admin.name || admin.username)?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{admin.fullname || admin.name || admin.username}</p>
                <p className="text-xs text-indigo-300 truncate">{admin.role}</p>
              </div>
            </div>
          </motion.div>
        )}

        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {can('dashboard') &&
            navItem(<DashboardIcon className="text-white flex-shrink-0" />, 'Dashboard', '/dashboard', isDashboardActive)}

          {structureItems.length > 0 && (
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
                      {isOpen && <span className="font-medium truncate">Tuzilmalar</span>}
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
                    className="overflow-hidden"
                  >
                    <div className="mx-4 mb-1 p-2 rounded-xl bg-indigo-800/60">
                      {structureItems.map((item) => {
                        const Icon = item.icon;
                        const targetPath = item.path;
                        const isActive =
                          item.path?.includes('/contragents') && location.pathname.startsWith('/dashboard/contragents')
                            ? true
                            : isPathActive(item.path);
                        return (
                          <div key={item.label} className="mb-1 last:mb-0">
                            <div
                              onClick={() => navigate(targetPath)}
                              className={`flex items-center space-x-3 p-3 cursor-pointer rounded-lg transition-colors ${
                                isActive ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:bg-indigo-700/70 hover:text-white'
                              }`}
                            >
                              <Icon className="flex-shrink-0" fontSize="small" />
                              <span className="font-medium text-sm">{item.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {showWarehouse &&
            firstWarehousePath &&
            navItem(
              <Inventory2 className="text-white flex-shrink-0" />,
              'Ombor',
              firstWarehousePath,
              isPathActive('/dashboard/warehouse')
            )}

          {can('marketplace foydalanuvchilari') &&
            navItem(
              <People className="text-white flex-shrink-0" />,
              'Marketplace foydalanuvchilari',
              '/dashboard/marketplace-users',
              isPathActive('/dashboard/marketplace-users')
            )}

          {showOrders &&
            navItem(
              <Timeline className="text-white flex-shrink-0" />,
              'Buyurtmalar monitoringi',
              '/dashboard/order-pipeline-monitor',
              isPathActive('/dashboard/order-pipeline-monitor')
            )}

          {showCommentary &&
            navItem(
              <Comment className="text-white flex-shrink-0" />,
              'Kommentariya',
              '/dashboard/commentary',
              isPathActive('/dashboard/commentary')
            )}

          {can('trankzasiyalar') &&
            navItem(
              <BarChart className="text-white flex-shrink-0" />,
              'Tranzaksiyalar statistikasi',
              '/dashboard/statistics/transactions-by-area',
              isPathActive('/dashboard/statistics/transactions-by-area')
            )}

          {can("do'kon obunasi") &&
            navItem(
              <Payments className="text-white flex-shrink-0" />,
              "Do'kon obunasi",
              '/dashboard/neighborhood-shop-subscriptions',
              isPathActive('/dashboard/neighborhood-shop-subscriptions')
            )}

          {can('integratsiya kalitlari') &&
            navItem(
              <VpnKey className="text-white flex-shrink-0" />,
              'Integratsiya kalitlari',
              '/dashboard/integration-api-keys',
              isPathActive('/dashboard/integration-api-keys')
            )}

          {can('arxiv') &&
            navItem(
              <Archive className="text-white flex-shrink-0" />,
              'Arxiv',
              '/dashboard/archive',
              isPathActive('/dashboard/archive')
            )}

          {can('qr tizimi') &&
            navItem(
              <QrCode2 className="text-white flex-shrink-0" />,
              'QR tizimi',
              '/dashboard/qr-system',
              isPathActive('/dashboard/qr-system')
            )}
        </nav>

        <div className="p-4 border-t border-indigo-700">
          <motion.div whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', x: isOpen ? 5 : 0 }} className="rounded-lg">
            <button
              type="button"
              onClick={handleLogout}
              className={`w-full flex items-center ${isOpen ? 'space-x-3 justify-start' : 'justify-center'} p-3 rounded-lg transition-colors`}
            >
              <Logout className="text-white flex-shrink-0" />
              {isOpen && <span className="font-medium">Chiqish</span>}
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
