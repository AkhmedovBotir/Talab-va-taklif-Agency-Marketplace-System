import React from 'react';
import { IoStorefront, IoInformationCircle } from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';
import styles from './Home.module.css';

export function Home() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className={styles.centerContent}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <IoStorefront size={48} color="#007AFF" />
        </div>
        <h1 className={styles.welcomeText}>Xush kelibsiz!</h1>
        <p className={styles.storeName}>{user.name}</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <IoInformationCircle size={24} color="#007AFF" />
          <h2 className={styles.cardTitle}>Dokon ma'lumotlari</h2>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>INN:</span>
          <span className={styles.infoValue}>{user.inn}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Telefon:</span>
          <span className={styles.infoValue}>{user.phone}</span>
        </div>
        {user.viloyat && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Viloyat:</span>
            <span className={styles.infoValue}>{user.viloyat.name}</span>
          </div>
        )}
        {user.tuman && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tuman:</span>
            <span className={styles.infoValue}>{user.tuman.name}</span>
          </div>
        )}
        {user.mfy && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>MFY:</span>
            <span className={styles.infoValue}>{user.mfy.name}</span>
          </div>
        )}
        {user.activityType && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Faoliyat turi:</span>
            <span className={styles.infoValue}>{user.activityType.name}</span>
          </div>
        )}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Status:</span>
          <span className={[styles.statusBadge, user.status === 'active' && styles.statusActive].filter(Boolean).join(' ')}>
            {user.status === 'active' ? 'Faol' : 'Nofaol'}
          </span>
        </div>
      </div>
    </div>
  );
}
