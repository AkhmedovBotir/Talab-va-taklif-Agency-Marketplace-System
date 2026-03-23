import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoArrowBack, IoCreateOutline, IoImageOutline } from 'react-icons/io5';
import { apiService } from '../services/api';
import { formatNumberDisplay } from '../utils/formatNumber';
import { QuillEditor } from '../components/QuillEditor';
import { AppModal } from '../components/AppModal';
import styles from './ProductView.module.css';

interface Product {
  _id: string;
  name: string;
  productCode?: string;
  price?: number;
  originalPrice?: number;
  quantity?: number;
  unit?: string;
  status?: string;
  moderationStatus?: string;
  images?: string[];
  description?: { ops?: Array<{ insert?: string }> };
  category?: { name: string } | string;
  subcategory?: { name: string } | null;
  kpiBonusPercent?: number;
  unitSize?: number;
  length?: number;
  width?: number;
  weight?: number;
  censored?: boolean;
  rejectionReason?: string;
  moderatedAt?: string;
}

function hasDescription(delta: unknown): boolean {
  if (!delta || typeof delta !== 'object') return false;
  const d = delta as { ops?: Array<{ insert?: string }> };
  if (!Array.isArray(d.ops)) return false;
  return d.ops.some((op) => typeof op.insert === 'string' && op.insert.trim());
}

export function ProductView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiService.getProductById(id);
      setProduct((res as { data?: Product }).data || null);
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (active: boolean) => {
    if (!product) return;
    try {
      await apiService.updateProductStatus(product._id, {
        status: active ? 'active' : 'inactive',
      });
      load();
    } catch {
      setErrorModal({ open: true, message: 'Status yangilashda xatolik' });
    }
  };

  const getModerationLabel = (s?: string) => {
    if (!s) return '-';
    if (s === 'approved') return 'Tasdiqlangan';
    if (s === 'rejected') return 'Rad etilgan';
    return 'Kutilmoqda';
  };

  if (loading && !product) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
            <IoArrowBack size={24} color="#333" />
          </button>
          <h1 className={styles.headerTitle}>Maxsulot</h1>
          <span className={styles.placeholder} />
        </header>
        <p className={styles.errorText}>Maxsulot topilmadi</p>
      </div>
    );
  }

  const images = product.images || [];
  const catName = typeof product.category === 'object' ? product.category?.name : product.category;
  const subName = product.subcategory && typeof product.subcategory === 'object' ? product.subcategory.name : '';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          <IoArrowBack size={24} color="#333" />
        </button>
        <h1 className={styles.headerTitle}>Maxsulot ma'lumotlari</h1>
        <button
          type="button"
          className={styles.editBtn}
          onClick={() => navigate(`/ombor/product/${product._id}/edit`)}
        >
          <IoCreateOutline size={24} color="#007AFF" />
        </button>
      </header>

      <div className={styles.content}>
        {images.length > 0 ? (
          <div className={styles.imageWrap}>
            <img src={images[currentImgIndex]} alt="" />
            {images.length > 1 && (
              <div className={styles.indicators}>
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={[styles.indicator, i === currentImgIndex && styles.indicatorActive].filter(Boolean).join(' ')}
                    onClick={() => setCurrentImgIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.imagePlaceholder}>
            <IoImageOutline size={64} color="#ccc" />
            <p>Rasm mavjud emas</p>
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Asosiy ma'lumotlar</h3>
            <div className={styles.statusWrap}>
              <span className={styles.statusLabel}>Holat:</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={product.status === 'active'}
                  onChange={(e) => handleStatusChange(e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </div>

          {(product.censored || product.moderationStatus) && (
            <div className={styles.moderationWrap}>
              <div className={styles.badgesWrap}>
                {product.censored && (
                  <span className={styles.badgeCensored}>18+</span>
                )}
                {product.moderationStatus && (
                  <span
                    className={[
                      styles.moderationBadge,
                      product.moderationStatus === 'approved' && styles.badgeApproved,
                      product.moderationStatus === 'rejected' && styles.badgeRejected,
                      product.moderationStatus === 'pending' && styles.badgePending,
                    ].filter(Boolean).join(' ')}
                  >
                    {getModerationLabel(product.moderationStatus)}
                  </span>
                )}
              </div>
              {product.moderatedAt && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Tekshirilgan vaqti</span>
                  <span className={styles.infoValue}>
                    {new Date(product.moderatedAt).toLocaleString('uz-UZ')}
                  </span>
                </div>
              )}
              {product.rejectionReason && (
                <div className={styles.rejectionBox}>
                  <span className={styles.rejectionLabel}>Rad etish sababi:</span>
                  <p>{product.rejectionReason}</p>
                </div>
              )}
            </div>
          )}

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Nomi</span>
            <span className={styles.infoValue}>{product.name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Kod</span>
            <span className={styles.infoValue}>{product.productCode || '-'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Kategoriya</span>
            <span className={styles.infoValue}>
              {catName || '-'}
              {subName && ` / ${subName}`}
            </span>
          </div>
        </div>

        {product.description && hasDescription(product.description) && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Tavsif</h3>
            <div className={styles.descContent}>
              <QuillEditor
                readOnly
                initialDelta={product.description as { ops?: Array<{ insert: string; attributes?: Record<string, unknown> }> }}
                className={styles.quillView}
              />
            </div>
          </div>
        )}

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Narx ma'lumotlari</h3>
          <div className={styles.infoRow}>
            <div className={styles.labelBlock}>
              <span className={styles.infoLabel}>Narx</span>
              <span className={styles.labelSubtitle}>(Sotmoqchi bo'lgan narxi)</span>
            </div>
            <span className={styles.priceValue}>{formatNumberDisplay(product.price ?? 0)} so'm</span>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.labelBlock}>
              <span className={styles.infoLabel}>Asl narx</span>
              <span className={styles.labelSubtitle}>(Sotib olingan narxi)</span>
            </div>
            <span className={styles.infoValue}>{formatNumberDisplay(product.originalPrice ?? 0)} so'm</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>KPI Bonus</span>
            <span className={styles.bonusValue}>{product.kpiBonusPercent ?? 0}%</span>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Miqdor ma'lumotlari</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Miqdor</span>
            <span className={styles.infoValue}>
              {product.quantity} {product.unit || 'dona'}
            </span>
          </div>
          {product.unitSize != null && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Birlik o'lchami</span>
              <span className={styles.infoValue}>{product.unitSize} {product.unit}</span>
            </div>
          )}
        </div>

        {(product.length || product.width || product.weight) && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Fizik o'lchamlar</h3>
            {product.length && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Bo'yi</span>
                <span className={styles.infoValue}>{product.length}</span>
              </div>
            )}
            {product.width && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Eni</span>
                <span className={styles.infoValue}>{product.width}</span>
              </div>
            )}
            {product.weight && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Og'irligi</span>
                <span className={styles.infoValue}>{product.weight}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <AppModal
        open={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: '' })}
        title="Xatolik"
        message={errorModal.message}
        variant="alert"
      />
    </div>
  );
}
