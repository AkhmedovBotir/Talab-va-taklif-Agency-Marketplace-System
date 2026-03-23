import React, { useEffect, useState } from 'react';
import { IoAdd, IoCreateOutline, IoTrashOutline } from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';
import { apiService, DeliveryProvider } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import styles from './Delivery.module.css';

export function Delivery() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DeliveryProvider | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<DeliveryProvider | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (token) loadProviders();
  }, [token]);

  const loadProviders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiService.getDeliveryProviders(token);
      if (res.success && res.data) setProviders(res.data);
    } catch {}
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setPassword('');
    setNotes('');
    setStatus('active');
    setError('');
    setShowModal(true);
  };

  const openEdit = (p: DeliveryProvider) => {
    setEditing(p);
    setName(p.name);
    setPhone(p.phone);
    setPassword('');
    setNotes(p.notes || '');
    setStatus(p.status);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError('Ism va telefon majburiy');
      return;
    }
    if (!editing && !password.trim()) {
      setError('Parol majburiy (min 6 belgi)');
      return;
    }
    if (password.trim() && password.length < 6) {
      setError('Parol kamida 6 belgi');
      return;
    }
    if (!token) return;
    setSubmitLoading(true);
    try {
      if (editing) {
        const res = await apiService.updateDeliveryProvider(token, editing._id, {
          name: name.trim(),
          phone: phone.trim(),
          status,
          ...(password.trim() && { password: password.trim() }),
          notes: notes.trim() || undefined,
        });
        if (res.success) {
          setShowModal(false);
          loadProviders();
        } else setError(res.message || 'Xatolik');
      } else {
        const res = await apiService.createDeliveryProvider(token, {
          name: name.trim(),
          phone: phone.trim(),
          password: password.trim(),
          notes: notes.trim() || undefined,
        });
        if (res.success) {
          setShowModal(false);
          loadProviders();
        } else setError(res.message || 'Xatolik');
      }
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Xatolik');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (p: DeliveryProvider) => {
    if (!token) return;
    setConfirmDelete(p);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !confirmDelete) return;
    setDeleteLoading(true);
    try {
      const res = await apiService.deleteDeliveryProvider(token, confirmDelete._id);
      if (res.success) {
        setConfirmDelete(null);
        loadProviders();
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Kuryerlar</h1>
        <button type="button" className={styles.addButton} onClick={openCreate}>
          <IoAdd size={24} color="#fff" />
        </button>
      </div>

      {loading && providers.length === 0 ? (
        <div className={styles.centerContent}>
          <div className={styles.spinner} />
        </div>
      ) : providers.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Hozircha kuryer yo'q</p>
          <button type="button" className={styles.emptyButton} onClick={openCreate}>
            Qo'shish
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {providers.map((p) => (
            <div key={p._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardInfo}>
                  <p className={styles.providerName}>{p.name}</p>
                  <p className={styles.providerPhone}>{p.phone}</p>
                  {p.notes && <p className={styles.providerNotes}>{p.notes}</p>}
                </div>
                <span className={[styles.statusBadge, p.status === 'active' && styles.statusActive].filter(Boolean).join(' ')}>
                  {p.status === 'active' ? 'Faol' : 'Nofaol'}
                </span>
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.editBtn} onClick={() => openEdit(p)}>
                  <IoCreateOutline size={18} color="#007AFF" />
                  Tahrirlash
                </button>
                <button type="button" className={styles.deleteBtn} onClick={() => handleDeleteClick(p)}>
                  <IoTrashOutline size={18} color="#FF3B30" />
                  O'chirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => !submitLoading && setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{editing ? 'Kuryerni tahrirlash' : 'Yangi kuryer'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Ism (majburiy)</label>
                <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Kuryer ismi" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Telefon (majburiy)</label>
                <input className={styles.input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998901234567" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{editing ? 'Parol (ixtiyoriy)' : 'Parol (majburiy, min 6 belgi)'}</label>
                <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol" />
              </div>
              {editing && (
                <div className={styles.field}>
                  <label className={styles.label}>Holat</label>
                  <div className={styles.statusRow}>
                    <button type="button" className={[styles.statusBtn, status === 'active' && styles.statusBtnActive].filter(Boolean).join(' ')} onClick={() => setStatus('active')}>
                      Faol
                    </button>
                    <button type="button" className={[styles.statusBtn, status === 'inactive' && styles.statusBtnActive].filter(Boolean).join(' ')} onClick={() => setStatus('inactive')}>
                      Nofaol
                    </button>
                  </div>
                </div>
              )}
              <div className={styles.field}>
                <label className={styles.label}>Eslatmalar (ixtiyoriy)</label>
                <textarea className={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Qo'shimcha eslatmalar" rows={3} />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.submitBtn} disabled={submitLoading}>
                {submitLoading ? 'Kutilmoqda...' : 'Saqlash'}
              </button>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                Bekor qilish
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        title="O'chirishni tasdiqlash"
        message={confirmDelete ? `"${confirmDelete.name}" ni o'chirishni tasdiqlaysizmi?` : ''}
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
        loading={deleteLoading}
        danger
      />
    </div>
  );
}
