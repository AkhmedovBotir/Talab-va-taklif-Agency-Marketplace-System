import React, { useState } from 'react';
import { IoStorefront, IoTimeOutline, IoLocationOutline, IoCreateOutline, IoLogOutOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Region } from '../services/api';
import { RegionPicker } from '../components/RegionPicker';
import styles from './Profile.module.css';

export function Profile() {
  const { user, token, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showAreasModal, setShowAreasModal] = useState(false);
  const [workingHoursOpen, setWorkingHoursOpen] = useState('');
  const [workingHoursClose, setWorkingHoursClose] = useState('');
  const [selectedTuman, setSelectedTuman] = useState<Region | null>(null);
  const [selectedMfys, setSelectedMfys] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user || !token) {
    return (
      <div className={styles.centerContent}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!workingHoursOpen && !workingHoursClose) {
      setError('Kamida bitta vaqt kiritilishi kerak');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.updateWorkingHours(token, {
        open: workingHoursOpen || undefined,
        close: workingHoursClose || undefined,
      });
      if (res.success) {
        setShowHoursModal(false);
        refreshUser();
      } else setError(res.message || 'Xatolik');
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAreas = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (selectedMfys.length === 0) {
      setError('Kamida bitta MFY tanlashingiz kerak');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.updateServiceAreas(token, {
        tuman: selectedTuman?._id || undefined,
        mfys: selectedMfys.map((m) => m._id),
      });
      if (res.success) {
        setShowAreasModal(false);
        refreshUser();
      } else setError(res.message || 'Xatolik');
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profil</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <IoStorefront size={24} color="#007AFF" />
          <h2 className={styles.cardTitle}>Dokon ma'lumotlari</h2>
        </div>
        <div className={styles.infoRow}><span className={styles.infoLabel}>Nomi:</span><span className={styles.infoValue}>{user.name}</span></div>
        <div className={styles.infoRow}><span className={styles.infoLabel}>INN:</span><span className={styles.infoValue}>{user.inn}</span></div>
        <div className={styles.infoRow}><span className={styles.infoLabel}>Telefon:</span><span className={styles.infoValue}>{user.phone}</span></div>
        {user.viloyat && <div className={styles.infoRow}><span className={styles.infoLabel}>Viloyat:</span><span className={styles.infoValue}>{user.viloyat.name}</span></div>}
        {user.tuman && <div className={styles.infoRow}><span className={styles.infoLabel}>Tuman:</span><span className={styles.infoValue}>{user.tuman.name}</span></div>}
        {user.mfy && <div className={styles.infoRow}><span className={styles.infoLabel}>MFY:</span><span className={styles.infoValue}>{user.mfy.name}</span></div>}
        {user.activityType && <div className={styles.infoRow}><span className={styles.infoLabel}>Faoliyat turi:</span><span className={styles.infoValue}>{user.activityType.name}</span></div>}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Status:</span>
          <span className={[styles.statusBadge, user.status === 'active' && styles.statusActive].filter(Boolean).join(' ')}>
            {user.status === 'active' ? 'Faol' : 'Nofaol'}
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <IoTimeOutline size={24} color="#007AFF" />
          <h2 className={styles.cardTitle}>Ish vaqti</h2>
          <button type="button" className={styles.editIcon} onClick={() => { setWorkingHoursOpen(user.workingHours?.open || ''); setWorkingHoursClose(user.workingHours?.close || ''); setShowHoursModal(true); setError(''); }}>
            <IoCreateOutline size={20} color="#007AFF" />
          </button>
        </div>
        {user.workingHours ? (
          <>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Ochilish:</span><span className={styles.infoValue}>{user.workingHours.open || '—'}</span></div>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Yopilish:</span><span className={styles.infoValue}>{user.workingHours.close || '—'}</span></div>
          </>
        ) : (
          <p className={styles.emptyStateText}>Ish vaqti belgilanmagan</p>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <IoLocationOutline size={24} color="#007AFF" />
          <h2 className={styles.cardTitle}>Xizmat ko'rsatish hududlari</h2>
          <button type="button" className={styles.editIcon} onClick={() => { setSelectedTuman(user.serviceAreas?.tuman || user.tuman || null); setSelectedMfys(user.serviceAreas?.mfys || []); setShowAreasModal(true); setError(''); }}>
            <IoCreateOutline size={20} color="#007AFF" />
          </button>
        </div>
        {user.serviceAreas ? (
          <>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Tuman:</span><span className={styles.infoValue}>{user.serviceAreas.tuman?.name || '—'}</span></div>
            <div className={styles.infoRow}><span className={styles.infoLabel}>MFYlar:</span><span className={styles.infoValue}>{user.serviceAreas.mfys?.length || 0} ta</span></div>
          </>
        ) : (
          <p className={styles.emptyStateText}>Hududlar belgilanmagan</p>
        )}
      </div>

      <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
        <IoLogOutOutline size={20} /> Chiqish
      </button>

      {showHoursModal && (
        <div className={styles.modalOverlay} onClick={() => !loading && setShowHoursModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Ish vaqtini yangilash</h2>
            <form onSubmit={handleSaveHours}>
              <div className={styles.field}>
                <label className={styles.label}>Ochilish vaqti</label>
                <input type="time" className={styles.input} value={workingHoursOpen} onChange={(e) => setWorkingHoursOpen(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Yopilish vaqti</label>
                <input type="time" className={styles.input} value={workingHoursClose} onChange={(e) => setWorkingHoursClose(e.target.value)} />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Kutilmoqda...' : 'Saqlash'}</button>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowHoursModal(false)}>Bekor qilish</button>
            </form>
          </div>
        </div>
      )}

      {showAreasModal && (
        <div className={styles.modalOverlay} onClick={() => !loading && setShowAreasModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Xizmat ko'rsatish hududlari</h2>
            <form onSubmit={handleSaveAreas}>
              <div className={styles.field}>
                <label className={styles.label}>Tuman (ixtiyoriy)</label>
                <RegionPicker
                  label="Tumanni tanlang"
                  value={selectedTuman?._id || ''}
                  type="district"
                  parentId={user.viloyat?._id}
                  onSelect={(r) => { setSelectedTuman(r); setSelectedMfys([]); }}
                  displayValue={selectedTuman?.name}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>MFYlar (majburiy)</label>
                <RegionPicker
                  label="MFYlarni tanlang"
                  value=""
                  type="mfy"
                  parentId={selectedTuman?._id || user.tuman?._id}
                  onSelect={(r) => setSelectedMfys((prev) => prev.find((x) => x._id === r._id) ? prev.filter((x) => x._id !== r._id) : [...prev, r])}
                  displayValue={selectedMfys.length > 0 ? `${selectedMfys.length} ta MFY` : 'Tanlang'}
                  multiple
                  selectedIds={selectedMfys.map((m) => m._id)}
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.submitBtn} disabled={loading || selectedMfys.length === 0}>{loading ? 'Kutilmoqda...' : 'Saqlash'}</button>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowAreasModal(false)}>Bekor qilish</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
