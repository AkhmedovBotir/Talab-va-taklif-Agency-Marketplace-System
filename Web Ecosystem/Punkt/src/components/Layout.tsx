import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { IoList, IoTimeOutline, IoBusinessOutline, IoWalletOutline, IoNotificationsOutline, IoPersonOutline } from 'react-icons/io5';
import { apiService } from '../services/api';
import styles from './Layout.module.css';

const nav = [
  { to: '/orders', label: 'Buyurtmalar', icon: IoList },
  { to: '/punkt-requests', label: 'Punkt so\'rovlari', icon: IoBusinessOutline },
  { to: '/finance', label: 'Moliya', icon: IoWalletOutline },
  { to: '/notifications', label: 'Xabarlar', icon: IoNotificationsOutline },
  { to: '/profile', label: 'Profil', icon: IoPersonOutline },
];

export function Layout() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getUnreadNotificationsCount();
        if (res?.success && res?.data?.unreadCount != null) setUnreadCount(res.data.unreadCount);
      } catch {}
    };
    load();
    const id = setInterval(load, 5000);
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
            className={({ isActive }) => (isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab)}
          >
            <span className={styles.tabIconWrap}>
              <Icon size={22} />
              {to === '/profile' && unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </span>
            <span className={styles.tabLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
