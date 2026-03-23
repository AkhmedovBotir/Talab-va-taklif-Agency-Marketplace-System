import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoPersonCircle, IoCall, IoLocationOutline, IoWalletOutline, IoLogOutOutline } from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Agent, KPISummary } from '../types/api';
import { ConfirmModal } from '../components/ConfirmModal';
import styles from './Profile.module.css';

export function Profile() {
  const { agent: authAgent, logout } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(authAgent);
  const [kpi, setKpi] = useState<KPISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authAgent) setAgent(authAgent);
  }, [authAgent]);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, kpiRes] = await Promise.all([
          apiService.getAgentProfile(),
          apiService.getKPISummary().catch(() => null),
        ]);
        if (profileRes?.success && profileRes?.data) setAgent(profileRes.data);
        if (kpiRes?.success && kpiRes?.data) setKpi(kpiRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const doLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login', { replace: true });
  };

  if (loading && !agent) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Yuklanmoqda...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>Agent ma'lumotlari topilmadi</p>
      </div>
    );
  }

  const kpiData = kpi?.summary ?? kpi;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <div className={styles.titleSection}>
            <h1 className={styles.name}>{agent.name}</h1>
            <span className={styles.roleBadge}>
              <IoPersonCircle size={14} color="#007AFF" />
              Agent
            </span>
          </div>
          {agent.status === 'active' && (
            <span className={styles.statusBadge}>
              <span className={styles.statusDot} />
              Faol
            </span>
          )}
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>
              <IoCall size={18} color="#007AFF" />
            </div>
            <div>
              <span className={styles.infoLabel}>Telefon</span>
              <span className={styles.infoValue}>{agent.phone}</span>
            </div>
          </div>
          {agent.viloyat && (
            <div className={styles.infoItem}>
              <div className={styles.infoIcon}>
                <IoLocationOutline size={18} color="#007AFF" />
              </div>
              <div>
                <span className={styles.infoLabel}>Viloyat</span>
                <span className={styles.infoValue}>{agent.viloyat.name}</span>
              </div>
            </div>
          )}
          {agent.tuman && (
            <div className={styles.infoItem}>
              <div className={styles.infoIcon}>
                <IoLocationOutline size={18} color="#007AFF" />
              </div>
              <div>
                <span className={styles.infoLabel}>Tuman</span>
                <span className={styles.infoValue}>{agent.tuman.name}</span>
              </div>
            </div>
          )}
          {agent.mfy && (
            <div className={styles.infoItem}>
              <div className={styles.infoIcon}>
                <IoLocationOutline size={18} color="#007AFF" />
              </div>
              <div>
                <span className={styles.infoLabel}>MFY</span>
                <span className={styles.infoValue}>{agent.mfy.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {kpiData && (
        <div className={styles.kpiSection}>
          <h2 className={styles.kpiTitle}>KPI Bonus</h2>
          <div className={styles.kpiCard}>
            <div className={styles.kpiRow}>
              <div className={styles.kpiItem}>
                <IoWalletOutline size={24} color="#007AFF" />
                <span className={styles.kpiLabel}>Jami bonus</span>
                <span className={styles.kpiVal}>{(kpiData.totalAmount ?? 0).toLocaleString()} so'm</span>
              </div>
              <div className={styles.kpiItem}>
                <span className={styles.kpiLabel}>To'langan</span>
                <span className={`${styles.kpiVal} ${styles.kpiPaid}`}>{(kpiData.paidAmount ?? 0).toLocaleString()} so'm</span>
              </div>
              <div className={styles.kpiItem}>
                <span className={styles.kpiLabel}>To'lanmagan</span>
                <span className={`${styles.kpiVal} ${styles.kpiUnpaid}`}>{(kpiData.unpaidAmount ?? 0).toLocaleString()} so'm</span>
              </div>
            </div>
            <button type="button" className={styles.kpiBtn} onClick={() => navigate('/kpi')}>
              KPI to'liq
            </button>
          </div>
        </div>
      )}

      <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
        <IoLogOutOutline size={22} />
        Chiqish
      </button>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Chiqish"
        message="Chiqishni xohlaysizmi?"
        confirmLabel="Ha"
        cancelLabel="Bekor"
        onConfirm={doLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
