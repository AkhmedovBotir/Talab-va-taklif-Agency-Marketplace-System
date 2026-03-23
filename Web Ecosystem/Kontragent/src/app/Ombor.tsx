import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IoAdd,
  IoSearch,
  IoClose,
  IoFilter,
  IoCreateOutline,
  IoEyeOutline,
  IoTrashOutline,
  IoImageOutline,
} from 'react-icons/io5';
import { apiService } from '../services/api';
import { formatNumberDisplay } from '../utils/formatNumber';
import { AppModal } from '../components/AppModal';
import styles from './Ombor.module.css';

interface Product {
  _id: string;
  name: string;
  productCode?: string;
  price?: number;
  originalPrice?: number;
  quantity?: number;
  unit?: string;
  status?: string;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  censored?: boolean;
  images?: string[];
  category?: { _id: string; name: string } | string;
}

type StatusFilter = 'all' | 'active' | 'inactive';
type ModerationFilter = 'all' | 'pending' | 'approved' | 'rejected';

export function Ombor() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [filterModeration, setFilterModeration] = useState<ModerationFilter>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getMyProducts({ limit: 1000 });
      const list = (res as { data?: Product[] }).data || [];
      setProducts(list);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = products.filter((p) => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchMod = filterModeration === 'all' || p.moderationStatus === filterModeration;
    return matchSearch && matchStatus && matchMod;
  });

  const hasFilters = filterStatus !== 'all' || filterModeration !== 'all';

  const handleStatusChange = async (p: Product, active: boolean) => {
    try {
      await apiService.updateProductStatus(p._id, {
        status: active ? 'active' : 'inactive',
      });
      load();
    } catch {
      setErrorModal({ open: true, message: 'Status yangilashda xatolik' });
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setSubmitting(true);
    try {
      await apiService.deleteProduct(deleteProduct._id);
      setDeleteProduct(null);
      load();
    } catch {
      setErrorModal({ open: true, message: 'O\'chirishda xatolik' });
    } finally {
      setSubmitting(false);
    }
  };

  const getModerationBadge = (status?: string) => {
    if (!status) return null;
    const m: Record<string, { label: string; cls: string }> = {
      approved: { label: 'Tasdiqlangan', cls: styles.badgeApproved },
      rejected: { label: 'Rad etilgan', cls: styles.badgeRejected },
      pending: { label: 'Kutilmoqda', cls: styles.badgePending },
    };
    const c = m[status];
    if (!c) return null;
    return <span className={[styles.moderationBadge, c.cls].join(' ')}>{c.label}</span>;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Maxsulotlar</h1>
        <p className={styles.subtitle}>Maxsulotlarni boshqarish</p>
      </header>

      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <IoSearch size={20} color="#666" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className={styles.clearBtn} onClick={() => setSearchQuery('')}>
              <IoClose size={20} />
            </button>
          )}
        </div>
        <button
          type="button"
          className={[styles.filterBtn, hasFilters && styles.filterBtnActive].filter(Boolean).join(' ')}
          onClick={() => setShowFilter(!showFilter)}
        >
          <IoFilter size={20} color={hasFilters ? '#007AFF' : '#666'} />
        </button>
      </div>

      {showFilter && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            <div className={styles.filterChips}>
              {(['all', 'active', 'inactive'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={[styles.chip, filterStatus === s && styles.chipActive].filter(Boolean).join(' ')}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === 'all' ? 'Barchasi' : s === 'active' ? 'Faol' : 'Nofaol'}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Moderatsiya</span>
            <div className={styles.filterChips}>
              {(['all', 'pending', 'approved', 'rejected'] as ModerationFilter[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={[styles.chip, filterModeration === m && styles.chipActive].filter(Boolean).join(' ')}
                  onClick={() => setFilterModeration(m)}
                >
                  {m === 'all' ? 'Barchasi' : m === 'pending' ? 'Kutilmoqda' : m === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>{searchQuery || hasFilters ? 'Natija topilmadi' : 'Maxsulotlar mavjud emas'}</p>
          </div>
        ) : (
          filtered.map((p) => (
            <div key={p._id} className={styles.card}>
              <div className={styles.cardImage}>
                {p.images && p.images.length > 0 ? (
                  <img src={p.images[0]} alt="" />
                ) : (
                  <IoImageOutline size={32} color="#ccc" />
                )}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardName}>{p.name}</h3>
                    {p.productCode && (
                      <span className={styles.cardCode}>Kod: {p.productCode}</span>
                    )}
                    <div className={styles.badges}>
                      {p.censored && <span className={styles.badgeCensored}>18+</span>}
                      {getModerationBadge(p.moderationStatus)}
                    </div>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={p.status === 'active'}
                      onChange={(e) => handleStatusChange(p, e.target.checked)}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
                <div className={styles.cardDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.cardLabel}>Narx</span>
                    <span className={styles.cardSubtitle}>(Sotmoqchi bo'lgan narxi)</span>
                    <span>{formatNumberDisplay(p.price ?? 0)} so'm</span>
                  </div>
                  <span>{p.quantity} {p.unit || 'dona'}</span>
                </div>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => navigate(`/ombor/product/${p._id}`)}
                  >
                    <IoEyeOutline size={18} /> Ko'rish
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => navigate(`/ombor/product/${p._id}/edit`)}
                  >
                    <IoCreateOutline size={18} /> Tahrirlash
                  </button>
                  <button
                    type="button"
                    className={[styles.actionBtn, styles.actionBtnDanger].join(' ')}
                    onClick={() => setDeleteProduct(p)}
                  >
                    <IoTrashOutline size={18} /> O'chirish
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        className={styles.fab}
        onClick={() => navigate('/ombor/create')}
      >
        <IoAdd size={28} color="#fff" />
      </button>

      <AppModal
        open={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: '' })}
        title="Xatolik"
        message={errorModal.message}
        variant="alert"
      />

      {deleteProduct && (
        <div className={styles.modalOverlay} onClick={() => !submitting && setDeleteProduct(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>O'chirish</h3>
            <p>"{deleteProduct.name}" maxsulotini o'chirmoqchimisiz?</p>
            <div className={styles.modalBtns}>
              <button
                type="button"
                className={styles.modalBtnCancel}
                onClick={() => setDeleteProduct(null)}
                disabled={submitting}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className={styles.modalBtnConfirm}
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? 'Kutilmoqda...' : 'O\'chirish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
