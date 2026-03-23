import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { IoHome, IoBicycle, IoCube, IoReceipt, IoPerson } from 'react-icons/io5';
import styles from './Layout.module.css';

const nav = [
  { to: '/home', label: 'Asosiy', icon: IoHome },
  { to: '/delivery', label: 'Kuryer', icon: IoBicycle },
  { to: '/products', label: 'Ombor', icon: IoCube },
  { to: '/orders', label: 'Buyurtmalar', icon: IoReceipt },
  { to: '/profile', label: 'Profil', icon: IoPerson },
];

export function Layout() {
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
            <Icon size={22} />
            <span className={styles.tabLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
