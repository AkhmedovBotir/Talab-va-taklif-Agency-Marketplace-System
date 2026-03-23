import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import PartnershipBlock from '../components/PartnershipBlock';
import Icon from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiService, { Region } from '../services/api';
import { useModal } from '../contexts/ModalContext';
import { useSnackbar } from '../contexts/SnackbarContext';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout, updateUser } = useAuth();
  const { unreadCount } = useNotification();
  const [profile, setProfile] = useState<typeof user>(null);
  const [loading, setLoading] = useState(true);
  const { showConfirm } = useModal();
  const { showSuccess, showError } = useSnackbar();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'erkak' as 'ayol' | 'erkak',
    birthDate: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [locationOpen, setLocationOpen] = useState(false);
  const [locationForm, setLocationForm] = useState({
    viloyatId: '',
    tumanId: '',
    mfyId: '',
  });
  const [viloyatlar, setViloyatlar] = useState<Region[]>([]);
  const [tumanlar, setTumanlar] = useState<Region[]>([]);
  const [mfyList, setMfyList] = useState<Region[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [hasPartnershipRequest, setHasPartnershipRequest] = useState(false);

  const checkPartnershipRequests = useCallback(async () => {
    if (!token) {
      setHasPartnershipRequest(false);
      return;
    }
    try {
      const res = await apiService.getMyPartnershipRequests({ limit: 1 }, token);
      setHasPartnershipRequest(
        Boolean(res.success && res.data && res.data.length > 0)
      );
    } catch {
      setHasPartnershipRequest(false);
    }
  }, [token]);

  const sortRegionsAlphabetically = (regions: Region[]): Region[] => {
    return [...regions].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB, 'uz');
    });
  };

  const loadAllRegions = async (params: {
    type: 'region' | 'district' | 'mfy';
    parent?: string;
  }): Promise<Region[]> => {
    const baseParams: { type: 'region' | 'district' | 'mfy'; parent?: string; page: number; limit: number } = {
      ...params,
      page: 1,
      limit: 1000,
    };

    const first = await apiService.getRegions(baseParams);
    let allData: Region[] = [...(first.data || [])];
    let currentPage = first.page;

    while (currentPage < first.totalPages) {
      currentPage += 1;
      const next = await apiService.getRegions({ ...baseParams, page: currentPage });
      allData = [...allData, ...(next.data || [])];
    }

    return sortRegionsAlphabetically(allData);
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    apiService
      .getProfile(token)
      .then((res) => {
        if (res.success && res.data) setProfile(res.data);
      })
      .catch(() => setProfile(user))
      .finally(() => setLoading(false));
  }, [token, user]);

  useEffect(() => {
    if (token) checkPartnershipRequests();
  }, [token, checkPartnershipRequests]);

  // Re-check when returning to profile (e.g. from partnership-requests)
  useEffect(() => {
    if (location.pathname === '/profile' && token) {
      checkPartnershipRequests();
    }
  }, [location.pathname, token, checkPartnershipRequests]);

  // Load regions for location modal
  useEffect(() => {
    if (!locationOpen || !token) return;
    let cancelled = false;
    loadAllRegions({ type: 'region' })
      .then((list) => {
        if (!cancelled) setViloyatlar(list);
      })
      .catch((err) => {
        console.error('Error loading regions:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [locationOpen, token]);

  useEffect(() => {
    if (!locationOpen) return;
    if (!locationForm.viloyatId) {
      setTumanlar([]);
      return;
    }
    let cancelled = false;
    loadAllRegions({ type: 'district', parent: locationForm.viloyatId })
      .then((list) => {
        if (!cancelled) setTumanlar(list);
      })
      .catch((err) => {
        console.error('Error loading tumans:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [locationOpen, locationForm.viloyatId]);

  useEffect(() => {
    if (!locationOpen) return;
    if (!locationForm.tumanId) {
      setMfyList([]);
      return;
    }
    let cancelled = false;
    loadAllRegions({ type: 'mfy', parent: locationForm.tumanId })
      .then((list) => {
        if (!cancelled) setMfyList(list);
      })
      .catch((err) => {
        console.error('Error loading mfys:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [locationOpen, locationForm.tumanId]);

  const data = profile || user;

  const handleLogout = async () => {
    const confirmed = await showConfirm('Chiqishni xohlaysizmi?', {
      title: 'Chiqish',
      confirmText: 'Ha, chiqish',
    });
    if (!confirmed) return;
    await logout();
    navigate('/login');
  };

  const handleAvatarClick = () => {
    if (!token) {
      showError('Rasmni almashtirish uchun tizimga kiring');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      try {
        setAvatarUploading(true);
        const res = await apiService.updateAvatar(result, token);
        if (res.success && res.data) {
          setProfile(res.data);
          updateUser(res.data);
          showSuccess('Avatar yangilandi');
        } else {
          showError(res.message || 'Avatar yangilashda xatolik');
        }
      } catch (err: any) {
        showError(err?.message || 'Avatar yangilashda xatolik');
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openEditProfile = () => {
    if (!data) return;
    setEditForm({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      gender: (data.gender as 'ayol' | 'erkak') || 'erkak',
      birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
    });
    setEditOpen(true);
  };

  const handleSaveProfile = async (e: any) => {
    e.preventDefault();
    if (!token) return;
    const payload: {
      firstName?: string;
      lastName?: string;
      gender?: 'ayol' | 'erkak';
      birthDate?: string;
    } = {};
    if (editForm.firstName.trim()) payload.firstName = editForm.firstName.trim();
    if (editForm.lastName.trim()) payload.lastName = editForm.lastName.trim();
    if (editForm.gender) payload.gender = editForm.gender;
    if (editForm.birthDate) payload.birthDate = editForm.birthDate;
    if (!Object.keys(payload).length) {
      setEditOpen(false);
      return;
    }
    try {
      setEditLoading(true);
      const res = await apiService.updateProfile(payload, token);
      if (res.success && res.data) {
        setProfile(res.data);
        updateUser(res.data);
        showSuccess('Profil yangilandi');
        setEditOpen(false);
      } else {
        showError(res.message || 'Profil yangilashda xatolik');
      }
    } catch (err: any) {
      showError(err?.message || 'Profil yangilashda xatolik');
    } finally {
      setEditLoading(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError('');
    setPasswordOpen(true);
  };

  const handleSavePassword = async (e: any) => {
    e.preventDefault();
    if (!token) return;
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Barcha maydonlarni to‘ldiring');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Yangi parol kamida 6 ta belgi bo'lishi kerak");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Parollar mos kelmaydi');
      return;
    }
    try {
      setPasswordLoading(true);
      setPasswordError('');
      const res = await apiService.updatePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        token
      );
      if (res.success) {
        showSuccess("Parol muvaffaqiyatli o'zgartirildi");
        setPasswordOpen(false);
      } else {
        showError(res.message || "Parolni o'zgartirishda xatolik");
      }
    } catch (err: any) {
      showError(err?.message || "Parolni o'zgartirishda xatolik");
    } finally {
      setPasswordLoading(false);
    }
  };

  const openLocationModal = () => {
    if (!data) return;
    setLocationForm({
      viloyatId: data.viloyat?._id || '',
      tumanId: data.tuman?._id || '',
      mfyId: data.mfy?._id || '',
    });
    setLocationError('');
    setLocationOpen(true);
  };

  const handleSaveLocation = async (e: any) => {
    e.preventDefault();
    if (!token) return;
    if (!locationForm.viloyatId) {
      setLocationError('Viloyat tanlanishi shart');
      return;
    }
    const payload: { viloyat?: string; tuman?: string; mfy?: string } = {};
    if (locationForm.viloyatId) payload.viloyat = locationForm.viloyatId;
    if (locationForm.tumanId) payload.tuman = locationForm.tumanId;
    if (locationForm.mfyId) payload.mfy = locationForm.mfyId;
    try {
      setLocationLoading(true);
      const res = await apiService.updateLocation(payload, token);
      if (res.success && res.data) {
        setProfile(res.data);
        updateUser(res.data);
        showSuccess('Manzil yangilandi');
        setLocationOpen(false);
      } else {
        showError(res.message || 'Manzil yangilashda xatolik');
      }
    } catch (err: any) {
      showError(err?.message || 'Manzil yangilashda xatolik');
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <>
      <Header
        title="Profil"
        unreadCount={unreadCount}
        onNotificationPress={() => navigate('/notifications')}
      />
      <div className="page">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
        {loading ? (
          <div className="loading-wrap"><div className="loading-spinner" /></div>
        ) : !data ? (
          <div className="card">
            <p style={{ margin: 0 }}>Profil topilmadi.</p>
          </div>
        ) : (
          <>
            {/* Avatar va asosiy ma'lumotlar */}
            <div
              className="card"
              style={{
                textAlign: 'center',
                paddingTop: 24,
                paddingBottom: 24,
                background:
                  'linear-gradient(135deg, #E3F2FD 0%, #F9FAFB 60%, #FFFFFF 100%)',
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  margin: '0 auto 12px',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={handleAvatarClick}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 48,
                    background: '#E3F2FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '3px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 6px 12px rgba(15,23,42,0.15)',
                  }}
                >
                  {data.avatar ? (
                    <img
                      src={data.avatar}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Icon name="person-outline" size={48} color="#007AFF" />
                  )}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    right: -4,
                    bottom: -4,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #fff',
                  }}
                >
                  <Icon name="camera" size={16} color="#fff" />
                </div>
                {avatarUploading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 48,
                      color: '#fff',
                      fontSize: 12,
                    }}
                  >
                    Yuklanmoqda...
                  </div>
                )}
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: 22 }}>
                {data.firstName} {data.lastName}
              </h2>
              <p style={{ margin: 0, color: 'var(--gray)' }}>{data.phone}</p>
            </div>

            {!hasPartnershipRequest ? (
              <PartnershipBlock compact />
            ) : (
              <div
                className="card"
                onClick={() => navigate('/partnership-requests')}
                style={{ cursor: 'pointer' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icon name="business-outline" size={24} color="#007AFF" />
                    <div>
                      <div style={{ fontWeight: 600, color: '#111' }}>
                        Hamkorlik
                      </div>
                      <div style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                        Yuborgan so'rovlarim
                      </div>
                    </div>
                  </div>
                  <Icon name="chevron-forward" size={24} color="#999" />
                </div>
              </div>
            )}

            {/* Shaxsiy ma'lumotlar */}
            <div
              className="card"
              onClick={openEditProfile}
              style={{ cursor: 'pointer' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <Icon name="person-outline" size={20} color="#007AFF" />
                <span style={{ fontWeight: 600 }}>Shaxsiy ma'lumotlar</span>
              </div>
              <p style={{ margin: '0 0 4px', color: '#374151' }}>
                {data.firstName} {data.lastName}
              </p>
              {data.gender || data.birthDate ? (
                <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
                  {data.gender === 'erkak'
                    ? 'Erkak'
                    : data.gender === 'ayol'
                    ? 'Ayol'
                    : 'Jins ko‘rsatilmagan'}
                  {data.birthDate
                    ? ` • ${new Date(data.birthDate).toLocaleDateString('uz-UZ')}`
                    : ''}
                </p>
              ) : null}
            </div>

            {/* Manzil */}
            <div
              className="card"
              onClick={openLocationModal}
              style={{ cursor: 'pointer' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <Icon name="location-outline" size={20} color="#007AFF" />
                <span style={{ fontWeight: 600 }}>Manzil</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>
                {data.viloyat?.name || 'Viloyat tanlanmagan'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6B7280' }}>
                {(data.tuman?.name || 'Tuman')},{' '}
                {data.mfy?.name || 'MFY'} 
              </p>
            </div>

            {/* Xavfsizlik */}
            <div
              className="card"
              onClick={openPasswordModal}
              style={{ cursor: 'pointer' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <Icon name="lock-closed-outline" size={20} color="#007AFF" />
                <span style={{ fontWeight: 600 }}>Xavfsizlik</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
                Parol va kirish ma'lumotlaringiz himoyalangan.
              </p>
            </div>

            {/* Buyurtmalar */}
            <div
              className="card"
              onClick={() => navigate('/order')}
              style={{ cursor: 'pointer' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <Icon name="receipt-outline" size={20} color="#007AFF" />
                <span style={{ fontWeight: 600 }}>Buyurtmalar</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
                Buyurtmalar tarixini ko‘rish
              </p>
            </div>

            {/* Amallar: bildirishnomalar va chiqish */}
            <div className="card">
              <button
                type="button"
                className="btn-primary"
                style={{
                  width: '100%',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onClick={() => navigate('/notifications')}
              >
                <Icon name="notifications-outline" size={20} />
                <span>Bildirishnomalar</span>
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{
                  width: '100%',
                  background: 'var(--gray)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onClick={handleLogout}
              >
                <Icon name="log-out-outline" size={20} />
                <span>Chiqish</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Edit profile modal */}
      {editOpen && (
        <div className="modalOverlay">
          <div
            className="modalContainer"
            style={{ maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }}
          >
            <div style={{ marginBottom: 12 }}>
              <h2 className="modalTitle">Shaxsiy ma'lumotlar</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                Ismingiz, familiyangiz va tug‘ilgan sanani yangilang.
              </p>
            </div>
            <form onSubmit={handleSaveProfile}>
              <label>Ism</label>
              <input
                value={editForm.firstName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, firstName: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: 10,
                  marginBottom: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <label>Familiya</label>
              <input
                value={editForm.lastName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, lastName: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: 10,
                  marginBottom: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <label>Jins</label>
              <select
                value={editForm.gender}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    gender: e.target.value as 'ayol' | 'erkak',
                  }))
                }
                style={{
                  width: '100%',
                  padding: 10,
                  marginBottom: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              >
                <option value="erkak">Erkak</option>
                <option value="ayol">Ayol</option>
              </select>
              <label>Tug‘ilgan sana</label>
              <input
                type="date"
                value={editForm.birthDate}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, birthDate: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: 10,
                  marginBottom: 16,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: 'none',
                    background: '#E5E7EB',
                    cursor: 'pointer',
                  }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    opacity: editLoading ? 0.7 : 1,
                  }}
                >
                  {editLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password modal */}
      {passwordOpen && (
        <div className="modalOverlay">
          <div
            className="modalContainer"
            style={{ maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }}
          >
            <div style={{ marginBottom: 12 }}>
              <h2 className="modalTitle">Parolni o‘zgartirish</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                Xavfsizlik uchun kuchli parol tanlang.
              </p>
            </div>
            <form onSubmit={handleSavePassword}>
              <label>Joriy parol</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({
                    ...f,
                    currentPassword: e.target.value,
                  }))
                }
                style={{
                  width: '100%',
                  padding: 10,
                  marginBottom: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <label>Yangi parol</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({
                    ...f,
                    newPassword: e.target.value,
                  }))
                }
                style={{
                  width: '100%',
                  padding: 10,
                  marginBottom: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <label>Yangi parolni tasdiqlash</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({
                    ...f,
                    confirmPassword: e.target.value,
                  }))
                }
                style={{
                  width: '100%',
                  padding: 10,
                  marginBottom: 8,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              {passwordError && (
                <p style={{ color: 'var(--danger)', marginBottom: 8 }}>
                  {passwordError}
                </p>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setPasswordOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: 'none',
                    background: '#E5E7EB',
                    cursor: 'pointer',
                  }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    opacity: passwordLoading ? 0.7 : 1,
                  }}
                >
                  {passwordLoading ? 'Saqlanmoqda...' : "Parolni o'zgartirish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location modal */}
      {locationOpen && (
        <div className="modalOverlay">
          <div
            className="modalContainer"
            style={{ maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }}
          >
            <div style={{ marginBottom: 12 }}>
              <h2 className="modalTitle">Manzil</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                Viloyat, tuman va MFY ma’lumotlarini yangilang.
              </p>
            </div>
            <form onSubmit={handleSaveLocation}>
              <label>Viloyat</label>
              <select
                value={locationForm.viloyatId}
                onChange={(e) =>
                  setLocationForm((f) => ({
                    ...f,
                    viloyatId: e.target.value,
                    tumanId: '',
                    mfyId: '',
                  }))
                }
                style={{
                  width: '100%',
                  padding: 10,
                  marginBottom: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              >
                <option value="">Tanlang</option>
                {viloyatlar.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <label>Tuman</label>
              <select
                value={locationForm.tumanId}
                onChange={(e) =>
                  setLocationForm((f) => ({
                    ...f,
                    tumanId: e.target.value,
                    mfyId: '',
                  }))
                }
                style={{
                  width: '100%',
                  padding: 10,
                  marginBottom: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              >
                <option value="">Tanlang</option>
                {tumanlar.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <label>MFY</label>
              <select
                value={locationForm.mfyId}
                onChange={(e) =>
                  setLocationForm((f) => ({
                    ...f,
                    mfyId: e.target.value,
                  }))
                }
                style={{
                  width: '100%',
                  padding: 10,
                  marginBottom: 8,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              >
                <option value="">Tanlang</option>
                {mfyList.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {locationError && (
                <p style={{ color: 'var(--danger)', marginBottom: 8 }}>
                  {locationError}
                </p>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setLocationOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: 'none',
                    background: '#E5E7EB',
                    cursor: 'pointer',
                  }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={locationLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    opacity: locationLoading ? 0.7 : 1,
                  }}
                >
                  {locationLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
