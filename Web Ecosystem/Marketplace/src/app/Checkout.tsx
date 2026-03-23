import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Icon from '../components/ui/Icon';
import RegionSelect from '../components/ui/RegionSelect';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import apiService, { Region } from '../services/api';

const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as { productType?: 'tuman' | 'maxalla' };
  const { token, user } = useAuth();
  const { getCart, refreshCart } = useCart();
  const { showSuccess, showError } = useSnackbar();

  const activeProductType = state.productType || 'tuman';
  const cart = getCart(activeProductType);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const [viloyatlar, setViloyatlar] = useState<Region[]>([]);
  const [tumanlar, setTumanlar] = useState<Region[]>([]);
  const [mfyList, setMfyList] = useState<Region[]>([]);
  const [deliveryViloyatId, setDeliveryViloyatId] = useState('');
  const [deliveryTumanId, setDeliveryTumanId] = useState('');
  const [deliveryMfyId, setDeliveryMfyId] = useState('');
  const [addressError, setAddressError] = useState('');

  const getPhoneDigits = (phoneStr?: string | null) => {
    if (!phoneStr) return '';
    const cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.startsWith('998') && cleaned.length === 12) {
      return cleaned.substring(3);
    }
    if (cleaned.length === 9) {
      return cleaned;
    }
    return '';
  };

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
    if (user?.phone) {
      setPhone((prev) => prev || getPhoneDigits(user.phone));
    }
  }, [user]);

  // Prefill address from profile bir marta (foydalanuvchi o'zgartirmaguncha)
  useEffect(() => {
    if (!user) return;
    setDeliveryViloyatId((prev) => prev || user.viloyat?._id || '');
    setDeliveryTumanId((prev) => prev || user.tuman?._id || '');
    setDeliveryMfyId((prev) => prev || user.mfy?._id || '');
  }, [user]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!deliveryViloyatId) {
      setTumanlar([]);
      return;
    }
    let cancelled = false;
    loadAllRegions({ type: 'district', parent: deliveryViloyatId })
      .then((list) => {
        if (!cancelled) setTumanlar(list);
      })
      .catch((err) => {
        console.error('Error loading tumans:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [deliveryViloyatId]);

  useEffect(() => {
    if (!deliveryTumanId) {
      setMfyList([]);
      return;
    }
    let cancelled = false;
    loadAllRegions({ type: 'mfy', parent: deliveryTumanId })
      .then((list) => {
        if (!cancelled) setMfyList(list);
      })
      .catch((err) => {
        console.error('Error loading mfys:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [deliveryTumanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !cart) return;

    const viloyatId = deliveryViloyatId || user?.viloyat?._id || '';
    const tumanId = deliveryTumanId || user?.tuman?._id || '';
    const mfyId = deliveryMfyId || user?.mfy?._id || '';

    if (!viloyatId) {
      setAddressError('Viloyat tanlanishi shart');
      return;
    }
    setAddressError('');

    setLoading(true);
    try {
      const digits = phone.replace(/\D/g, '');
      const fullPhone = digits.length === 9 ? `+998${digits}` : undefined;

      const res = await apiService.createOrder(
        {
          paymentMethod: 'cash',
          deliveryViloyat: viloyatId,
          deliveryTuman: tumanId || undefined,
          deliveryMfy: mfyId || undefined,
          phoneNumber: fullPhone || undefined,
          deliveryNote: note.trim() || undefined,
          clearCart: true,
        },
        token,
        activeProductType
      );
      if (res.data?._id) {
        showSuccess('Buyurtma qabul qilindi');
        refreshCart(activeProductType);
        navigate(`/order/${res.data._id}`);
      } else {
        showError(res.message || 'Xatolik');
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Buyurtma yuborishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (!cart?.items?.length) {
    return (
      <>
        <Header showBackButton onBackPress={() => navigate('/cart')} title="Buyurtma berish" />
        <div className="page">
          <div className="card" style={{ textAlign: 'center' }}>
            <Icon name="cart-outline" size={48} color="#D1D5DB" />
            <p style={{ marginTop: 8 }}>Korzinka bo'sh. Avval mahsulot qo'shing.</p>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: 12 }}
              onClick={() => navigate('/search')}
            >
              Mahsulotlar
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header showBackButton onBackPress={() => navigate('/cart')} title="Buyurtma berish" />
      <div className="page">
        {/* Buyurtma ma'lumotlari */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>Buyurtma ma'lumotlari</h3>
          {cart.items.map((item) => (
            <div
              key={item.product._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8,
                gap: 8,
              }}
            >
              <div style={{ flex: 1, marginRight: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                  {item.product.name}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  {item.quantity} ta × {formatPrice(item.product.price)}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
                {formatPrice(item.product.price * item.quantity)}
              </div>
            </div>
          ))}
          <div
            style={{
              height: 1,
              backgroundColor: 'var(--border)',
              margin: '12px 0',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700 }}>Jami</span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--primary)',
              }}
            >
              {formatPrice(cart.totalPrice)}
            </span>
          </div>
        </div>

        {/* To'lov usuli */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>To'lov usuli</h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 12,
              borderRadius: 12,
              backgroundColor: '#E5F0FF',
              border: '2px solid #3B82F6',
              gap: 10,
            }}
          >
            <Icon name="card-outline" size={22} color="#2563EB" />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1D4ED8',
                }}
              >
                Naqd pul
              </div>
              <div style={{ fontSize: 13, color: '#4B5563' }}>
                Hozircha faqat naqd to'lov qo'llab-quvvatlanadi.
              </div>
            </div>
            <Icon name="checkmark-circle" size={22} color="#2563EB" />
          </div>
        </div>

        {/* Manzil (profil manzili) */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>Yetkazib berish manzili</h3>
          <RegionSelect
            label="Viloyat"
            icon="location-outline"
            valueId={deliveryViloyatId || user?.viloyat?._id || ''}
            options={viloyatlar}
            placeholder={
              user?.viloyat?.name
                ? `Profil: ${user.viloyat.name}`
                : 'Viloyatni tanlang'
            }
            onChange={(opt) => {
              setDeliveryViloyatId(opt?._id || '');
              setDeliveryTumanId('');
              setDeliveryMfyId('');
            }}
          />

          <RegionSelect
            label="Tuman (ixtiyoriy)"
            icon="map-outline"
            valueId={deliveryTumanId || user?.tuman?._id || ''}
            options={tumanlar}
            placeholder={
              user?.tuman?.name
                ? `Profil: ${user.tuman.name}`
                : 'Tumanni tanlang'
            }
            disabled={!deliveryViloyatId && !user?.viloyat?._id}
            onChange={(opt) => {
              setDeliveryTumanId(opt?._id || '');
              setDeliveryMfyId('');
            }}
          />

          <RegionSelect
            label="MFY (ixtiyoriy)"
            icon="home"
            valueId={deliveryMfyId || user?.mfy?._id || ''}
            options={mfyList}
            placeholder={
              user?.mfy?.name ? `Profil: ${user.mfy.name}` : 'MFY ni tanlang'
            }
            disabled={!deliveryTumanId && !user?.tuman?._id}
            onChange={(opt) => {
              setDeliveryMfyId(opt?._id || '');
            }}
          />
          {addressError && (
            <p style={{ color: 'var(--danger)', marginTop: 4 }}>{addressError}</p>
          )}
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>
            Agar biror maydonni tanlamasangiz, profildagi mavjud manzil ishlatiladi.
          </p>
        </div>

        {/* Eslatma va telefon */}
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ margin: '0 0 12px' }}>Aloqa ma'lumotlari</h3>
          <label style={{ display: 'block', marginBottom: 4 }}>Telefon</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))
            }
            placeholder="901234567"
            style={{
              width: '100%',
              padding: 10,
              marginBottom: 12,
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          />
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9CA3AF' }}>
            Agar kiritmasangiz, profil telefon raqamingiz ishlatiladi.
          </p>

          <label style={{ display: 'block', marginBottom: 4 }}>
            Qo'shimcha eslatma (ixtiyoriy)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Masalan: Uy eshigiga qo‘ng‘iroq qiling"
            style={{
              width: '100%',
              padding: 10,
              marginBottom: 16,
              border: '1px solid var(--border)',
              borderRadius: 8,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Yuborilmoqda...' : 'Buyurtma berish'}
          </button>
        </form>
      </div>
    </>
  );
}
