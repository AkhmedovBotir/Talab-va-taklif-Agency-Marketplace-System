import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IoBusiness,
  IoChatbubbles,
  IoLocationOutline,
  IoLogOutOutline,
  IoCamera,
  IoChevronForward,
  IoRefreshOutline,
} from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { AppModal } from '../components/AppModal';
import styles from './Profile.module.css';

function isValidImage(val?: string) {
  return !!val && /^data:image\/(jpeg|png|jpg);base64,/.test(val);
}

export function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { contragent, logout, refreshContragent } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deliveryRegions, setDeliveryRegions] = useState<
    Array<{ viloyat: { _id: string; name: string }; tuman?: { _id: string; name: string } | null }>
  >([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'alert' | 'confirm';
    onConfirm?: () => void;
  }>({ open: false, title: '', message: '', variant: 'alert' });

  const loadUnread = useCallback(async () => {
    try {
      const res = await apiService.getUnreadCount();
      if (res.success && res.data?.unreadCount != null)
        setUnreadCount(res.data.unreadCount);
    } catch {
      /* ignore */
    }
  }, []);

  const loadRegions = useCallback(async () => {
    setLoadingRegions(true);
    try {
      const res = await apiService.getDeliveryRegions();
      const list = (res as { data?: { deliveryRegions?: typeof deliveryRegions } }).data?.deliveryRegions || [];
      setDeliveryRegions(list);
    } catch {
      setDeliveryRegions([]);
    } finally {
      setLoadingRegions(false);
    }
  }, []);

  useEffect(() => {
    loadUnread();
    loadRegions();
  }, [loadUnread, loadRegions]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshContragent(), loadUnread(), loadRegions()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    setModal({
      open: true,
      title: 'Chiqish',
      message: 'Tizimdan chiqmoqchimisiz?',
      variant: 'confirm',
      onConfirm: () => {
        logout();
        window.location.href = '/login';
      },
    });
  };

  const handleChangeLogo = () => {
    if (uploadingLogo) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        if (!isValidImage(base64)) {
          setModal({ open: true, title: 'Xatolik', message: 'Rasm formati noto\'g\'ri', variant: 'alert' });
          return;
        }
        await apiService.updateLogo({ logo: base64 });
        await refreshContragent();
        setModal({ open: true, title: 'Muvaffaqiyatli', message: 'Logo yangilandi.', variant: 'alert' });
      } catch (err: unknown) {
        const m = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Logo yangilashda xatolik';
        setModal({ open: true, title: 'Xatolik', message: m, variant: 'alert' });
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.onerror = () => {
      setModal({ open: true, title: 'Xatolik', message: 'Rasm o\'qishda xatolik', variant: 'alert' });
      setUploadingLogo(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectDeliveryRegions = () => {
    navigate('/profile/select-regions', {
      state: {
        returnPath: '/profile',
        selectedRegions: deliveryRegions.map((r) => ({
          viloyat: r.viloyat._id,
          tuman: r.tuman?._id ?? null,
        })),
      },
    });
  };

  const logoUrl = contragent?.logo && isValidImage(contragent.logo) ? contragent.logo : null;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.profileCard}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarContainer}>
              {logoUrl ? (
                <img src={logoUrl} alt="" className={styles.logo} />
              ) : (
                <IoBusiness size={48} color="#007AFF" />
              )}
            </div>
            <button
              type="button"
              className={[styles.editAvatarBtn, uploadingLogo && styles.editAvatarBtnDisabled].filter(Boolean).join(' ')}
              onClick={handleChangeLogo}
              disabled={uploadingLogo}
              title="Logo o'zgartirish"
            >
              {uploadingLogo ? (
                <span className={styles.spinner} />
              ) : (
                <IoCamera size={18} color="#fff" />
              )}
            </button>
          </div>
          <h2 className={styles.companyName}>{contragent?.name || 'Kontragent'}</h2>
          <p className={styles.inn}>{contragent?.inn || ''}</p>
        </div>

        <div className={styles.detailsCard}>
          <h3 className={styles.sectionTitle}>Ma'lumotlar</h3>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Telefon raqami</span>
            <span className={styles.detailValue}>{contragent?.phone || '-'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Viloyat</span>
            <span className={styles.detailValue}>{contragent?.viloyat?.name || '-'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Tuman</span>
            <span className={styles.detailValue}>{contragent?.tuman?.name || '-'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>MFY</span>
            <span className={styles.detailValue}>{contragent?.mfy?.name || '-'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Holat</span>
            <span className={styles.statusBadge}>
              {contragent?.status === 'active' ? 'Faol' : contragent?.status || '-'}
            </span>
          </div>
        </div>

        <div className={styles.detailsCard}>
          <h3 className={styles.sectionTitle}>Yetkazib berish hududlari</h3>
          {loadingRegions ? (
            <p className={styles.loadingText}>Yuklanmoqda...</p>
          ) : (
            <>
              {deliveryRegions.length > 0 ? (
                <div className={styles.regionsList}>
                  {deliveryRegions.map((r, i) => (
                    <div key={i} className={styles.regionItem}>
                      <IoLocationOutline size={16} color="#007AFF" />
                      <span>
                        {r.viloyat.name}
                        {r.tuman && `, ${r.tuman.name}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noRegions}>Hozircha yetkazib berish hududlari tanlanmagan</p>
              )}
              <button type="button" className={styles.editRegionsBtn} onClick={handleSelectDeliveryRegions}>
                <IoLocationOutline size={20} color="#007AFF" />
                <span>
                  {deliveryRegions.length > 0 ? 'Hududlarni yangilash' : 'Hududlarni tanlash'}
                </span>
                <IoChevronForward size={20} color="#8E8E93" />
              </button>
            </>
          )}
        </div>

        <div className={styles.actionsCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Amallar</h3>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={onRefresh}
              disabled={refreshing}
              title="Yangilash"
            >
              <IoRefreshOutline size={22} color={refreshing ? '#999' : '#007AFF'} />
            </button>
          </div>
          <Link to="/habarlar" className={styles.actionButton}>
            <div className={styles.actionIconWrap}>
              <IoChatbubbles size={24} color="#007AFF" />
              {unreadCount > 0 && (
                <span className={styles.actionBadge}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className={styles.actionButtonText}>Habarlar</span>
            {unreadCount > 0 && (
              <span className={styles.newBadge}>Yangi {unreadCount} ta</span>
            )}
            <IoChevronForward size={20} color="#8E8E93" />
          </Link>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          <IoLogOutOutline size={24} color="#FF3B30" />
          <span>Chiqish</span>
        </button>
      </div>

      <AppModal
        open={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        confirmText={modal.variant === 'confirm' ? 'Chiqish' : undefined}
        onConfirm={modal.onConfirm}
        confirmDanger={modal.variant === 'confirm'}
      />
    </div>
  );
}
