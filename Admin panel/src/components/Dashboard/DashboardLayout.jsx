import { Outlet } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Dashboard, AdminPanelSettings } from '@mui/icons-material';
import Sidebar from './Sidebar';
import AdminNotificationBell from './AdminNotificationBell';
import { useSidebar } from '../../contexts/SidebarContext';

const DashboardLayout = () => {
  const { isOpen } = useSidebar();
  const { admin } = useAuth();
  const location = useLocation();

  const pageTitle = useMemo(() => {
    if (location.pathname === '/dashboard') return 'Dashboard';
    if (location.pathname.startsWith('/dashboard/admins')) return 'Adminlar';
    if (location.pathname.startsWith('/dashboard/regions')) return 'Hududlar';
    if (location.pathname.startsWith('/dashboard/agents')) return 'Agentlar';
    if (location.pathname.startsWith('/dashboard/managers')) return 'Menejerlar';
    if (location.pathname.startsWith('/dashboard/warehouse/categories')) return 'Kategoriyalar';
    if (location.pathname.startsWith('/dashboard/warehouse/products')) return 'Mahsulotlar';
    if (location.pathname.startsWith('/dashboard/warehouse/neighborhood-products')) return 'Maxalla mahsulotlari';
    if (location.pathname.startsWith('/dashboard/warehouse')) return 'Ombor';
    if (location.pathname.startsWith('/dashboard/marketplace-users')) return 'Marketplace foydalanuvchilari';
    if (location.pathname.startsWith('/dashboard/commentary')) return 'Kommentariya';
    if (location.pathname.startsWith('/dashboard/qr-system')) return 'QR tizimi';
    if (location.pathname.startsWith('/dashboard/archive')) return 'Arxiv';
    if (location.pathname.startsWith('/dashboard/order-pipeline-monitor')) return 'Marketplace buyurtmalar';
    if (location.pathname.startsWith('/dashboard/statistics/transactions-by-area')) return 'Tranzaksiyalar statistikasi';
    if (location.pathname.startsWith('/dashboard/integration-api-keys')) return 'Integratsiya API kalitlari';
    if (location.pathname.startsWith('/dashboard/neighborhood-shop-subscriptions')) {
      return "Maxalla do'koni obunasi";
    }
    if (location.pathname.startsWith('/dashboard/punkts')) return 'Punktlar';
    if (location.pathname.startsWith('/dashboard/contragents/types')) return 'Kontragent turlari';
    if (location.pathname.startsWith('/dashboard/contragents/tuman')) return 'Kontragentlar';
    if (location.pathname.startsWith('/dashboard/contragents/maxalla-dokonlar')) return "Do'konlar";
    if (location.pathname.startsWith('/dashboard/contragents/hamkorlik-sorovlari')) return "Hamkorlik so'rovlari";
    if (location.pathname.startsWith('/dashboard/contragents')) return "Kontragent va do'konlar";
    return 'Admin Panel';
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <Motion.main
        animate={{
          marginLeft: isOpen ? '320px' : '80px',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 h-screen overflow-y-auto"
      >
        <div className="sticky top-0 z-40 px-6 py-4 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Dashboard fontSize="small" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
                <p className="text-xs text-gray-500">Boshqaruv paneli</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <AdminNotificationBell />
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
                  {(admin?.name || admin?.username || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-gray-800">{admin?.name || admin?.username || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{admin?.role || 'admin'}</p>
                </div>
                <AdminPanelSettings className="text-gray-400" fontSize="small" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </Motion.main>
    </div>
  );
};

export default DashboardLayout;

