import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { IoList, IoPerson, IoSettings } from 'react-icons/io5';
import styles from './Layout.module.css';

const nav = [
  { to: '/orders', label: 'Buyurtmalar', icon: IoList },
  { to: '/profile', label: 'Profil', icon: IoPerson },
  { to: '/settings', label: 'Sozlamalar', icon: IoSettings },
];

export function Layout() {
  return (
    <div className={styles.appLayout}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Maxalla Yetkazuvchi</h1>
      </header>
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
