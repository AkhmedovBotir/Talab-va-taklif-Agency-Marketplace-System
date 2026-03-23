import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Icon from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import apiService, { Order as OrderType } from '../services/api';

const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#FF9500';
    case 'confirmed_by_punkt':
      return '#007AFF';
    case 'requested_to_contragent':
      return '#5856D6';
    case 'accepted_by_contragent':
      return '#5AC8FA';
    case 'delivered_to_punkt':
      return '#AF52DE';
    case 'assigned_to_agent':
      return '#FF2D55';
    case 'confirmed_by_agent':
    case 'confirmed_by_customer':
      return '#34C759';
    case 'cancelled':
      return '#FF3B30';
    default:
      return '#666666';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'Kutilmoqda';
    case 'confirmed_by_punkt':
      return "Punkt tomonidan tasdiqlandi";
    case 'requested_to_contragent':
      return "Kontragentga so'rov yuborildi";
    case 'accepted_by_contragent':
      return 'Kontragent tomonidan qabul qilindi';
    case 'delivered_to_punkt':
      return 'Punktga yetkazildi';
    case 'assigned_to_agent':
      return 'Agentga tayinlandi';
    case 'confirmed_by_agent':
      return 'Agent tomonidan tasdiqlandi';
    case 'confirmed_by_customer':
      return 'Mijoz tomonidan tasdiqlandi';
    case 'cancelled':
      return 'Bekor qilingan';
    default:
      return status;
  }
}

export default function Order() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showConfirm } = useModal();
  const { showError, showSuccess } = useSnackbar();
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!id || !token) return;
    let cancelled = false;
    const load = async () => {
      try {
        let res;
        try {
          res = await apiService.getOrderById(id, token);
        } catch (e: any) {
          if (e?.status === 404 || e?.message?.includes('topilmadi')) {
            res = await apiService.getMaxallaOrderById(id, token);
          } else {
            throw e;
          }
        }
        if (!cancelled && res?.data) setOrder(res.data);
      } catch (err: any) {
        if (!cancelled) {
          showError(err?.message || 'Buyurtmani yuklashda xatolik yuz berdi');
          setOrder(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, token, showError]);

  const handleCancelOrder = async () => {
    if (!order || !id || !token) return;
    const confirmed = await showConfirm('Buyurtmani bekor qilmoqchimisiz?', {
      confirmText: 'Ha',
      cancelText: "Yo'q",
    });
    if (!confirmed) return;
    try {
      setCancelling(true);
      const isMaxalla =
        order.items && order.items[0]?.productType === 'maxalla';
      const res = isMaxalla
        ? await apiService.cancelMaxallaOrder(id, token)
        : await apiService.cancelOrder(id, token);
      if (res.success && res.data) {
        setOrder(res.data);
        showSuccess('Buyurtma bekor qilindi');
      } else {
        showError(res.message || 'Bekor qilishda xatolik');
      }
    } catch (err: any) {
      showError(err?.message || 'Bekor qilishda xatolik');
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order || !id || !token) return;
    const confirmed = await showConfirm('Buyurtmani olganingizni tasdiqlaysizmi?', {
      confirmText: 'Ha',
      cancelText: "Yo'q",
    });
    if (!confirmed) return;
    try {
      setConfirming(true);
      const isMaxalla =
        order.items && order.items[0]?.productType === 'maxalla';
      const res = await apiService.confirmDelivery(
        id,
        token,
        isMaxalla ? 'maxalla' : 'tuman'
      );
      if (res.success && res.data) {
        setOrder(res.data);
        showSuccess('Buyurtma tasdiqlandi');
      } else {
        showError(res.message || 'Tasdiqlashda xatolik');
      }
    } catch (err: any) {
      showError(err?.message || 'Tasdiqlashda xatolik');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header showBackButton onBackPress={() => navigate(-1)} title="Buyurtma" />
        <div className="loading-wrap"><div className="loading-spinner" /></div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header showBackButton onBackPress={() => navigate(-1)} title="Buyurtma" />
        <div className="page"><p>Buyurtma topilmadi.</p></div>
      </>
    );
  }

  const statusColor = getStatusColor(order.status);

  return (
    <>
      <Header
        showBackButton
        onBackPress={() => navigate(-1)}
        title={`Buyurtma #${order.orderNumber}`}
      />
      <div className="page">
        {/* Holat */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontWeight: 600 }}>Holat</span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                backgroundColor: statusColor + '20',
                color: statusColor,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {getStatusText(order.status)}
            </span>
          </div>
          {order.paymentStatus && (
            <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
              To'lov: {order.paymentStatus === 'paid' ? "Qilingan" : order.paymentStatus}
            </p>
          )}
        </div>

        {/* Mahsulotlar */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>Mahsulotlar</h3>
          {order.items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: 10,
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  background: '#F3F4F6',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.product?.images?.[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Icon name="image-outline" size={28} color="#9CA3AF" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: 4,
                  }}
                >
                  {item.product?.name || 'Mahsulot'}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  {item.quantity} ta × {formatPrice(item.price)}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--primary)',
                    marginTop: 2,
                  }}
                >
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Buyurtma ma'lumotlari */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>Buyurtma ma'lumotlari</h3>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: 14,
            }}
          >
            <span>Buyurtma raqami</span>
            <span style={{ fontWeight: 600 }}>#{order.orderNumber}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: 14,
            }}
          >
            <span>Sana</span>
            <span>
              {new Date(order.createdAt).toLocaleString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: 14,
            }}
          >
            <span>To'lov usuli</span>
            <span style={{ fontWeight: 600 }}>
              {order.paymentMethod === 'cash' ? 'Naqd pul' : 'Karta'}
            </span>
          </div>
          {order.phoneNumber && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 14,
              }}
            >
              <span>Telefon</span>
              <span style={{ fontWeight: 600 }}>{order.phoneNumber}</span>
            </div>
          )}
        </div>

        {/* Manzil */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>Yetkazib berish manzili</h3>
          <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>
            Viloyat: {order.deliveryViloyat?.name || 'Noma\'lum'}
          </p>
          {order.deliveryTuman && (
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#4B5563' }}>
              Tuman: {order.deliveryTuman.name}
            </p>
          )}
          {order.deliveryMfy && (
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#4B5563' }}>
              MFY: {order.deliveryMfy.name}
            </p>
          )}
          {order.deliveryNote && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6B7280' }}>
              Eslatma: {order.deliveryNote}
            </p>
          )}
        </div>

        {/* Jami */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>Jami</h3>
          {order.totalOriginalPrice && order.totalOriginalPrice > order.totalPrice && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontSize: 14,
              }}
            >
              <span>Mahsulotlar ({order.itemCount} ta)</span>
              <span style={{ textDecoration: 'line-through', color: '#9CA3AF' }}>
                {formatPrice(order.totalOriginalPrice)}
              </span>
            </div>
          )}
          {order.totalOriginalPrice && order.totalOriginalPrice > order.totalPrice && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontSize: 14,
                color: '#16A34A',
                fontWeight: 600,
              }}
            >
              <span>Chegirma</span>
              <span>
                -{formatPrice(order.totalOriginalPrice - order.totalPrice)}
              </span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700 }}>Umumiy</span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--primary)',
              }}
            >
              {formatPrice(order.totalPrice)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {order.status === 'pending' && (
            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={cancelling}
              style={{
                width: '100%',
                borderRadius: 12,
                padding: '10px 16px',
                border: '1px solid #FF3B30',
                background: '#FFFFFF',
                color: '#FF3B30',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                opacity: cancelling ? 0.7 : 1,
              }}
            >
              <Icon name="close-circle" size={18} color="#FF3B30" />
              <span>Buyurtmani bekor qilish</span>
            </button>
          )}
          {order.status === 'confirmed_by_agent' && !order.customerConfirmed && (
            <button
              type="button"
              onClick={handleConfirmDelivery}
              disabled={confirming}
              style={{
                width: '100%',
                borderRadius: 12,
                padding: '10px 16px',
                border: '1px solid #22C55E',
                background: '#FFFFFF',
                color: '#16A34A',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                opacity: confirming ? 0.7 : 1,
              }}
            >
              <Icon name="checkmark-circle" size={18} color="#16A34A" />
              <span>Buyurtmani tasdiqlash</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
