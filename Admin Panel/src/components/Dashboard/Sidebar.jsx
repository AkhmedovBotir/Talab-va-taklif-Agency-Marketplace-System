import { motion, AnimatePresence } from 'framer-motion';
import {
  Dashboard as DashboardIcon,
  People,
  Settings,
  Analytics,
  Inventory,
  Menu as MenuIcon,
  ChevronLeft,
  Logout,
  AdminPanelSettings,
  Store,
  ShoppingBag,
  LocationOn,
  Person,
  Category,
  ShoppingCart,
  ExpandMore,
  ChevronRight,
  CreditCard,
  Business,
  AccountBalance,
  AssignmentInd,
  Sms,
  PersonOutline,
  Receipt,
  CheckCircle,
  Cancel,
  Notifications,
  RateReview,
  ContactMail,
  Handshake,
  LocationDisabledSharp,
  LocationCity,
  WorkOutline,
  Description,
  AttachMoney,
  Assessment,
  History,
  PendingActions,
  TrendingUp,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
  { icon: DashboardIcon, label: 'Dashboard', path: '/dashboard' },
  {
    icon: AccountBalance,
    label: 'Tuzilmalar',
    path: '/dashboard/structures',
    children: [
      { icon: AdminPanelSettings, label: 'Adminlar', path: '/dashboard/admins' },
      { icon: LocationOn, label: 'Regionlar', path: '/dashboard/regions' },
      { icon: Business, label: 'Kontragentlar', path: '/dashboard/contragents' },
      { icon: AssignmentInd, label: 'Agentlar', path: '/dashboard/agents' },
      { icon: LocationOn, label: 'Punktlar', path: '/dashboard/punkts' },
    ],
  },
  {
    icon: Inventory,
    label: 'Ombor',
    path: '/dashboard/ombor',
    children: [
      { icon: Category, label: 'Kategoriyalar', path: '/dashboard/categories' },
      { icon: ShoppingBag, label: 'Mahsulotlar', path: '/dashboard/products' },
    ],
  },
  { icon: PersonOutline, label: 'Marketplace Mijozlar', path: '/dashboard/marketplace-users' },
  { icon: Notifications, label: 'Xabarlar', path: '/dashboard/notifications' },
  {
    icon: ShoppingCart,
    label: 'Buyurtmalar',
    path: '/dashboard/orders',
    children: [
      { icon: Receipt, label: 'Barcha buyurtmalar', path: '/dashboard/orders' },
      { icon: Store, label: 'Marketplace buyurtmalar', path: '/dashboard/orders/marketplace' },
      { icon: LocationOn, label: 'Punktga yuborilgan', path: '/dashboard/orders/delivered-to-punkt' },
      { icon: AssignmentInd, label: 'Agentga yuborilgan', path: '/dashboard/orders/assigned-to-agents' },
      { icon: CheckCircle, label: 'Agent topshirganlari', path: '/dashboard/orders/confirmed-by-agents' },
      { icon: Person, label: 'Foydalanuvchi qabul qilgan', path: '/dashboard/orders/confirmed-by-customers' },
      { icon: Cancel, label: 'Qaytarilgan buyurtmalar', path: '/dashboard/orders/cancelled' },
    ],
  },
  {
    icon: Analytics,
    label: 'KPI Bonuslar',
    path: '/dashboard/kpi',
    children: [
      { icon: Analytics, label: 'Statistika', path: '/dashboard/kpi/statistics' },
      { icon: Receipt, label: 'Transaksiyalar', path: '/dashboard/kpi/transactions' },
      { icon: LocationOn, label: 'Viloyat agentlari', path: '/dashboard/kpi/viloyat-agents' },
      { icon: Business, label: 'Tuman agentlari', path: '/dashboard/kpi/tuman-agents' },
      { icon: Person, label: 'MFY agentlari', path: '/dashboard/kpi/mfy-agents' },
      { icon: Store, label: 'Punktlar', path: '/dashboard/kpi/punkts' },
    ],
  },
  { icon: LocationCity, label: 'Hududlar Statistikasi', path: '/dashboard/statistics' },
  { icon: Sms, label: 'SMS lar', path: '/dashboard/sms-verifications' },
  {
    icon: AttachMoney,
    label: 'Moliya',
    path: '/dashboard/finance',
    children: [
      { icon: Assessment, label: 'Kunlik hisobot', path: '/dashboard/finance/reports/daily' },
      { icon: Assessment, label: 'Haftalik hisobot', path: '/dashboard/finance/reports/weekly' },
      { icon: Assessment, label: 'Oylik hisobot', path: '/dashboard/finance/reports/monthly' },
      { icon: Assessment, label: 'Yillik hisobot', path: '/dashboard/finance/reports/yearly' },
      { icon: Assessment, label: 'Belgilangan muddat', path: '/dashboard/finance/reports/custom' },
      { icon: PendingActions, label: 'Topshiruvlar', path: '/dashboard/finance/submissions' },
      { icon: History, label: 'Transaksiyalar', path: '/dashboard/finance/transactions' },
      { icon: TrendingUp, label: 'Statistika', path: '/dashboard/finance/statistics' },
    ],
  },
  {
    icon: RateReview,
    label: 'Baholar',
    path: '/dashboard/reviews',
    children: [
      { icon: RateReview, label: 'Barcha baholar', path: '/dashboard/reviews' },
      { icon: ContactMail, label: 'Salbiy aloqalar', path: '/dashboard/reviews/contacts' },
    ],
  },
  { icon: Handshake, label: 'Hamkorlik So\'rovlari', path: '/dashboard/partnership-requests' },
  { icon: WorkOutline, label: 'Vakansiyalar', path: '/dashboard/vacancies' },
  { icon: Settings, label: 'Sozlamalar', path: '/dashboard/settings' },
];

const Sidebar = () => {
  const { isOpen, setIsOpen } = useSidebar();
  const { logout, admin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (menuPath) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuPath]: !prev[menuPath],
    }));
  };

  const isMenuActive = (menu) => {
    if (menu.children) {
      return menu.children.some((child) => location.pathname === child.path);
    }
    return location.pathname === menu.path;
  };

  // Auto-expand parent menu if child is active
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => location.pathname === child.path);
        if (hasActiveChild && !expandedMenus[item.path]) {
          setExpandedMenus((prev) => ({
            ...prev,
            [item.path]: true,
          }));
        }
      }
    });
  }, [location.pathname]);

  return (
    <motion.div
      initial={false}
      animate={{
        width: isOpen ? '280px' : '80px',
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
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus[item.path];
            const isActive = isMenuActive(item);

            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="mx-2 mb-1">
                  {/* Parent Menu Item */}
                  <motion.div
                    whileHover={{ backgroundColor: 'rgba(129, 140, 248, 0.2)', x: isOpen ? 5 : 0 }}
                    className="rounded-lg"
                  >
                    <div
                      onClick={() => {
                        if (hasChildren) {
                          toggleMenu(item.path);
                        } else {
                          navigate(item.path);
                        }
                      }}
                      className={`flex items-center ${isOpen ? 'space-x-3 justify-between' : 'justify-center'} p-3 cursor-pointer rounded-lg transition-colors group ${isActive ? 'bg-indigo-800' : ''
                        }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Icon className="text-white flex-shrink-0" />
                        <AnimatePresence>
                          {isOpen && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              className="font-medium whitespace-nowrap overflow-hidden"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      {hasChildren && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className={isOpen ? '' : 'hidden'}
                        >
                          <ChevronRight className="text-white flex-shrink-0" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* Children Menu Items */}
                  {hasChildren && (isOpen ? isExpanded : (isExpanded || isActive)) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={isOpen ? "ml-8 mt-1 space-y-1" : "mt-1 space-y-1"}
                    >
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location.pathname === child.path;
                        return (
                          <div
                            key={child.path}
                            onClick={() => navigate(child.path)}
                            className={`flex items-center ${isOpen ? 'gap-2 pl-4' : 'justify-center'} p-2 cursor-pointer rounded-lg transition-colors text-sm ${isChildActive
                                ? 'bg-indigo-700 text-white'
                                : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                              }`}
                            title={!isOpen ? child.label : ''}
                          >
                            {ChildIcon && <ChildIcon className={isOpen ? "w-4 h-4" : "w-5 h-5"} />}
                            {isOpen && <span>{child.label}</span>}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
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

