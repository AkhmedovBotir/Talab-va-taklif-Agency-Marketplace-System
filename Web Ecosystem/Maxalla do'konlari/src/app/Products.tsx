import React, { useEffect, useState } from 'react';
import { IoAdd, IoCreateOutline, IoTrashOutline } from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';
import { apiService, BaseProduct, MaxallaProduct } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import styles from './Products.module.css';

function formatCurrency(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function Products() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<MaxallaProduct[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectProductModal, setSelectProductModal] = useState(false);
  const [editing, setEditing] = useState<MaxallaProduct | null>(null);
  const [selectedBase, setSelectedBase] = useState<BaseProduct | null>(null);
  const [baseList, setBaseList] = useState<BaseProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [baseListLoading, setBaseListLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<MaxallaProduct | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (token) loadProducts();
  }, [token]);

  useEffect(() => {
    if (showModal && selectProductModal && token) loadBaseProducts();
  }, [showModal, selectProductModal, token]);

  const loadProducts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiService.getMaxallaProducts(token);
      if (res.success && res.data) setProducts(res.data);
    } catch {}
    setLoading(false);
  };

  const loadBaseProducts = async () => {
    if (!token) return;
    setBaseListLoading(true);
    try {
      const res = await apiService.getAvailableBaseProducts(token, { search: searchQuery || undefined });
      if (res.success && res.data) setBaseList(res.data);
    } catch {}
    setBaseListLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setSelectedBase(null);
    setQuantity('');
    setPrice('');
    setOriginalPrice('');
    setStatus('active');
    setSearchQuery('');
    setBaseList([]);
    setError('');
    setShowModal(true);
    setSelectProductModal(true);
  };

  const openEdit = (p: MaxallaProduct) => {
    setEditing(p);
    setSelectedBase(p.baseProduct);
    setQuantity(String(p.quantity));
    setPrice(formatCurrency(p.price));
    setOriginalPrice(formatCurrency(p.originalPrice));
    setStatus(p.status);
    setError('');
    setShowModal(true);
    setSelectProductModal(false);
  };

  const parseNum = (s: string) => parseFloat(s.replace(/\s/g, '')) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedBase) {
      setError('Asosiy maxsulotni tanlang');
      return;
    }
    const q = parseFloat(quantity);
    const pr = parseNum(price);
    const oPr = parseNum(originalPrice);
    if (isNaN(q) || q < 0) {
      setError('Miqdor to\'g\'ri raqam bo\'lishi kerak');
      return;
    }
    if (isNaN(pr) || pr < 0 || isNaN(oPr) || oPr < 0) {
      setError('Narxlar to\'g\'ri bo\'lishi kerak');
      return;
    }
    if (!token) return;
    setSubmitLoading(true);
    try {
      if (editing) {
        const res = await apiService.updateMaxallaProduct(token, editing._id, { quantity: q, price: pr, originalPrice: oPr, status });
        if (res.success) {
          setShowModal(false);
          loadProducts();
        } else setError(res.message || 'Xatolik');
      } else {
        const res = await apiService.createMaxallaProduct(token, {
          baseProductId: selectedBase._id,
          quantity: q,
          price: pr,
          originalPrice: oPr,
          status,
        });
        if (res.success) {
          setShowModal(false);
          loadProducts();
        } else setError(res.message || 'Xatolik');
      }
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Xatolik');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (p: MaxallaProduct) => {
    if (!token) return;
    setConfirmDelete(p);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !confirmDelete) return;
    setDeleteLoading(true);
    try {
      const res = await apiService.deleteMaxallaProduct(token, confirmDelete._id);
      if (res.success) {
        setConfirmDelete(null);
        loadProducts();
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatInput = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ombor</h1>
        <button type="button" className={styles.addButton} onClick={openCreate}>
          <IoAdd size={24} color="#fff" />
        </button>
      </div>

      {loading && products.length === 0 ? (
        <div className={styles.centerContent}>
          <div className={styles.spinner} />
        </div>
      ) : products.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Hozircha maxsulot yo'q</p>
          <button type="button" className={styles.emptyButton} onClick={openCreate}>
            Qo'shish
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {products.map((p) => (
            <div key={p._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.productName}>{p.baseProduct.name}</p>
                  <p className={styles.productCategory}>Kategoriya: {p.baseProduct.category.name}</p>
                </div>
                <span className={[styles.statusBadge, p.status === 'active' && styles.statusActive].filter(Boolean).join(' ')}>
                  {p.status === 'active' ? 'Faol' : 'Nofaol'}
                </span>
              </div>
              <div className={styles.details}>
                <p>Miqdor: {p.quantity} {p.baseProduct.unit}</p>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabelWrap}>
                    <span className={styles.detailLabelMain}>Narx</span>
                    <span className={styles.detailLabelSub}><em>(Sotmoqchi bo'lgan narxi)</em></span>
                  </div>
                  <span className={styles.detailValue}>{formatCurrency(p.price)} so'm</span>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabelWrap}>
                    <span className={styles.detailLabelMain}>Asl narx</span>
                    <span className={styles.detailLabelSub}><em>(Sotib olingan narxi)</em></span>
                  </div>
                  <span className={[styles.detailValue, styles.originalPrice].filter(Boolean).join(' ')}>
                    {formatCurrency(p.originalPrice)} so'm
                  </span>
                </div>
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.editBtn} onClick={() => openEdit(p)}>
                  <IoCreateOutline size={18} /> Tahrirlash
                </button>
                <button type="button" className={styles.deleteBtn} onClick={() => handleDeleteClick(p)}>
                  <IoTrashOutline size={18} /> O'chirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => !submitLoading && setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{editing ? 'Maxsulotni tahrirlash' : 'Yangi maxsulot'}</h2>

            {selectProductModal ? (
              <>
                <div className={styles.searchRow}>
                  <input className={styles.input} placeholder="Qidirish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), loadBaseProducts())} />
                  <button type="button" className={styles.searchBtn} onClick={loadBaseProducts} disabled={baseListLoading}>
                    {baseListLoading ? '...' : 'Qidirish'}
                  </button>
                </div>
                {baseListLoading && baseList.length === 0 ? (
                  <div className={styles.loadingWrap}>
                    <div className={styles.spinner} />
                    <p className={styles.loadingText}>Yuklanmoqda...</p>
                  </div>
                ) : (
                  <div className={styles.baseList}>
                    {baseList.map((b) => (
                      <button key={b._id} type="button" className={styles.baseItem} onClick={() => { setSelectedBase(b); setSelectProductModal(false); }}>
                        {b.name} — {b.category.name}
                      </button>
                    ))}
                  </div>
                )}
                {selectedBase && (
                  <button type="button" className={styles.secondaryBtn} onClick={() => setSelectProductModal(true)}>
                    Boshqa tanlash
                  </button>
                )}
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Bekor qilish
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                {selectedBase && (
                  <div className={styles.selectedInfo}>
                    <p className={styles.selectedName}>{selectedBase.name}</p>
                    <p className={styles.selectedCat}>{selectedBase.category.name}</p>
                  </div>
                )}
                <div className={styles.field}>
                  <label className={styles.label}>Miqdor</label>
                  <input className={styles.input} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" type="number" step="any" />
                  {selectedBase && <span className={styles.hint}>Birlik: {selectedBase.unit}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    <span>Narx</span>
                    <span className={styles.labelSub}><em>(Sotmoqchi bo'lgan narxi)</em></span>
                  </label>
                  <input className={styles.input} value={price} onChange={(e) => setPrice(formatInput(e.target.value))} placeholder="0" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    <span>Asl narx</span>
                    <span className={styles.labelSub}><em>(Sotib olingan narxi)</em></span>
                  </label>
                  <input className={styles.input} value={originalPrice} onChange={(e) => setOriginalPrice(formatInput(e.target.value))} placeholder="0" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Holat</label>
                  <div className={styles.statusRow}>
                    <button type="button" className={[styles.statusBtn, status === 'active' && styles.statusBtnActive].filter(Boolean).join(' ')} onClick={() => setStatus('active')}>Faol</button>
                    <button type="button" className={[styles.statusBtn, status === 'inactive' && styles.statusBtnActive].filter(Boolean).join(' ')} onClick={() => setStatus('inactive')}>Nofaol</button>
                  </div>
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" className={styles.submitBtn} disabled={submitLoading}>{submitLoading ? 'Kutilmoqda...' : 'Saqlash'}</button>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)} style={{ marginTop: 8 }}>
                  Bekor qilish
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        title="O'chirishni tasdiqlash"
        message={confirmDelete ? `"${confirmDelete.baseProduct.name}" ni o'chirishni tasdiqlaysizmi?` : ''}
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
