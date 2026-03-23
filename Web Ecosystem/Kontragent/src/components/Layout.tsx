import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  IoHome,
  IoCubeOutline,
  IoDocumentTextOutline,
  IoStatsChartOutline,
  IoPerson,
} from 'react-icons/io5';
import { apiService } from '../services/api';
import styles from './Layout.module.css';

const nav = [
  { to: '/', label: 'Bosh sahifa', icon: IoHome },
  { to: '/ombor', label: 'Ombor', icon: IoCubeOutline },
  { to: '/buyurtmalar', label: 'Buyurtmalar', icon: IoDocumentTextOutline },
  { to: '/statistika', label: 'Statistika', icon: IoStatsChartOutline },
  { to: '/profile', label: 'Profil', icon: IoPerson },
];

export function Layout() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getUnreadCount();
        if (res?.success && res?.data?.unreadCount != null)
          setUnreadCount(res.data.unreadCount);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.appLayout}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <nav className={styles.tabBar}>
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            isActive={to === '/ombor' ? (_, loc) => loc.pathname.startsWith('/ombor') : undefined}
            className={({ isActive }) =>
              isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
            }
          >
            <span className={styles.tabIconWrap}>
              <Icon size={22} />
              {to === '/profile' && unreadCount > 0 && (
                <span className={styles.badge}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>
            <span className={styles.tabLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
