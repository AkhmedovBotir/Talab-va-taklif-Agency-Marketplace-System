import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Icon from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useNotification } from '../contexts/NotificationContext';
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

export default function Orders() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showConfirm } = useModal();
  const { unreadCount } = useNotification();
  const { showError, showSuccess, showInfo } = useSnackbar();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeOrderType, setActiveOrderType] = useState<'tuman' | 'maxalla'>('tuman');
  const [confirmingOrders, setConfirmingOrders] = useState<Record<string, boolean>>({});
  const [payingOrders, setPayingOrders] = useState<Record<string, boolean>>({});

  const loadOrders = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!token) return;

      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        let response;
        if (activeOrderType === 'maxalla') {
          try {
            response = await apiService.getMaxallaOrders(
              {
                page: pageNum,
                limit: 20,
              },
              token
            );
          } catch (error: any) {
            if (error.message && error.message.includes('Route topilmadi')) {
              response = {
                success: true,
                data: [],
                count: 0,
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0,
              };
            } else {
              throw error;
            }
          }
        } else {
          response = await apiService.getOrders(
            {
              page: pageNum,
              limit: 20,
            },
            token
          );
        }

        let filteredOrders = response.data;
        if (activeOrderType === 'maxalla') {
          filteredOrders = response.data.filter((order: OrderType) => {
            if (!order.items || order.items.length === 0) return false;
            const allItemsAreMaxalla = order.items.every(
              (item: any) =>
                item.productType === 'maxalla' || item.productModel === 'MaxallaProduct'
            );
            const hasNoKpi = (order as any).totalKpiPrice === 0;
            return allItemsAreMaxalla && hasNoKpi;
          });
        } else {
          filteredOrders = response.data.filter((order: OrderType) => {
            if (!order.items || order.items.length === 0) return false;
            const allItemsAreTuman = order.items.every(
              (item: any) =>
                (item.productType === 'tuman' || item.productModel === 'Product') &&
                item.productType !== 'maxalla' &&
                item.productModel !== 'MaxallaProduct'
            );
            const hasKpi = (order as any).totalKpiPrice > 0;
            const isNotMaxallaStatus =
              order.status !== 'requested_to_contragent' || hasKpi;
            return allItemsAreTuman && isNotMaxallaStatus;
          });
        }

        if (append) {
          setOrders((prev) => [...prev, ...filteredOrders]);
        } else {
          setOrders(filteredOrders);
        }

        setPage(response.page);
        setHasMore(response.page < response.totalPages);
      } catch (error: any) {
        showError(error?.message || 'Buyurtmalarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, activeOrderType, showError]
  );

  useEffect(() => {
    if (!token) return;
    setPage(1);
    setHasMore(true);
    loadOrders(1, false);
  }, [token, activeOrderType, loadOrders]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadOrders(page + 1, true);
    }
  };

  const handleConfirmDelivery = async (order: OrderType) => {
    if (!token) return;
    if (order.status !== 'confirmed_by_agent') {
      showError("Buyurtma agent tomonidan tasdiqlangan bo'lishi kerak");
      return;
    }
    if (order.customerConfirmed) {
      showInfo("Bu buyurtma allaqachon tasdiqlangan");
      return;
    }
    const confirmed = await showConfirm(
      "Yetkazilganini tasdiqlaysizmi? Tasdiqlash bilan to'lov hisobga olinadi.",
      {
        title: `Summa: ${formatPrice(order.totalPrice)}`,
        confirmText: "Tasdiqlash",
        cancelText: "Bekor qilish",
      }
    );
    if (!confirmed) return;
    try {
      setConfirmingOrders((prev) => ({ ...prev, [order._id]: true }));
      const isMaxalla = activeOrderType === 'maxalla';
      const res = isMaxalla
        ? await apiService.confirmDelivery(order._id, token, 'maxalla')
        : await apiService.confirmDelivery(order._id, token, 'tuman');
      if (res.success && res.data) {
        showSuccess("Buyurtma tasdiqlandi, to'lov hisobga olishildi");
        loadOrders(page, false);
      } else {
        showError(res.message || "Tasdiqlashda xatolik yuz berdi");
      }
    } catch (error: any) {
      showError(error?.message || "Tasdiqlashda xatolik yuz berdi");
    } finally {
      setConfirmingOrders((prev) => {
        const map = { ...prev };
        delete map[order._id];
        return map;
      });
    }
  };

  const handlePayMaxalla = async (order: OrderType) => {
    if (!token || activeOrderType !== 'maxalla') return;
    const delivered =
      order.deliveredByProvider === true ||
      order.contragentRequests?.some((r: any) => r.status === 'delivered');
    if (!delivered) {
      showError("To'lov uchun yetkazuvchi avval buyurtmani yetkazilgan deb belgilashi kerak");
      return;
    }
    if (order.customerConfirmed || order.paymentStatus === 'paid') {
      showInfo("Bu buyurtma uchun to'lov allaqachon qilingan");
      return;
    }
    const confirmed = await showConfirm(
      `To'lov summa: ${formatPrice(order.totalPrice)}. To'lovni amalga oshirasizmi?`,
      { confirmText: "Ha", cancelText: "Bekor qilish" }
    );
    if (!confirmed) return;
    try {
      setPayingOrders((prev) => ({ ...prev, [order._id]: true }));
      const res = await apiService.payMaxallaOrder(order._id, token);
      if (res.success) {
        showSuccess("To'lov muvaffaqiyatli amalga oshirildi");
        loadOrders(page, false);
      } else {
        showError(res.message || "To'lov qilishda xatolik yuz berdi");
      }
    } catch (error: any) {
      showError(error?.message || "To'lov qilishda xatolik yuz berdi");
    } finally {
      setPayingOrders((prev) => {
        const map = { ...prev };
        delete map[order._id];
        return map;
      });
    }
  };

  const renderTabs = () => (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        background: '#fff',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <button
        type="button"
        onClick={() => setActiveOrderType('tuman')}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px 12px',
          borderRadius: 10,
          border: `2px solid ${
            activeOrderType === 'tuman' ? '#007AFF' : 'transparent'
          }`,
          background: activeOrderType === 'tuman' ? '#E6F3FF' : '#F5F5F5',
          cursor: 'pointer',
        }}
      >
        <Icon
          name="storefront"
          size={20}
          color={activeOrderType === 'tuman' ? '#007AFF' : '#666'}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: activeOrderType === 'tuman' ? '#007AFF' : '#666',
          }}
        >
          Tuman buyurtmalari
        </span>
      </button>
      <button
        type="button"
        onClick={() => setActiveOrderType('maxalla')}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px 12px',
          borderRadius: 10,
          border: `2px solid ${
            activeOrderType === 'maxalla' ? '#007AFF' : 'transparent'
          }`,
          background: activeOrderType === 'maxalla' ? '#E6F3FF' : '#F5F5F5',
          cursor: 'pointer',
        }}
      >
        <Icon
          name="home"
          size={20}
          color={activeOrderType === 'maxalla' ? '#007AFF' : '#666'}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: activeOrderType === 'maxalla' ? '#007AFF' : '#666',
          }}
        >
          Maxalla buyurtmalari
        </span>
      </button>
    </div>
  );

  const renderContent = () => {
    if (loading && orders.length === 0) {
      return <div className="loading-wrap"><div className="loading-spinner" /></div>;
    }

    if (!loading && orders.length === 0) {
      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 80,
            paddingBottom: 40,
            textAlign: 'center',
          }}
        >
          <Icon name="receipt-outline" size={64} color="#D1D5DB" />
          <p style={{ marginTop: 16, fontSize: 18, fontWeight: 600, color: '#111827' }}>
            Buyurtmalar topilmadi
          </p>
          <p style={{ marginTop: 8, fontSize: 14, color: '#6B7280', maxWidth: 320 }}>
            {activeOrderType === 'tuman'
              ? 'Siz hali tuman buyurtmasi bermadingiz.'
              : 'Siz hali maxalla buyurtmasi bermadingiz.'}
          </p>
        </div>
      );
    }

    return (
      <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {orders.map((order) => {
          const isConfirming = !!confirmingOrders[order._id];
          const isPaying = !!payingOrders[order._id];
          const isMaxalla = activeOrderType === 'maxalla';
          const isMaxallaDelivered =
            isMaxalla &&
            (order.deliveredByProvider === true ||
              order.contragentRequests?.some((r: any) => r.status === 'delivered') ||
              order.status === 'confirmed_by_agent' ||
              (order as any).status === 'delivered');
          const shouldShowConfirmButton = isMaxalla
            ? isMaxallaDelivered && !order.customerConfirmed
            : order.status === 'confirmed_by_agent' && !order.customerConfirmed;
          const shouldShowPayButton =
            isMaxalla &&
            isMaxallaDelivered &&
            !order.customerConfirmed &&
            order.paymentStatus !== 'paid';
          const isPaidOrConfirmed =
            order.status === 'confirmed_by_customer' || order.paymentStatus === 'paid';

          const statusColor = getStatusColor(order.status);

          return (
            <div
              key={order._id}
              className="card"
              style={{ padding: 14 }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/order/${order._id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/order/${order._id}`)}
                style={{
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>#{order.orderNumber}</span>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        backgroundColor: statusColor + '20',
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <Icon name="chevron-forward" size={18} color="#9CA3AF" />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    marginBottom: 8,
                    fontSize: 13,
                    color: '#4B5563',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="cube-outline" size={16} color="#6B7280" />
                    <span>{order.itemCount} ta mahsulot</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="calendar-outline" size={16} color="#6B7280" />
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
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#007AFF' }}>
                    {formatPrice(order.totalPrice)}
                  </span>
                  {isPaidOrConfirmed && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Icon name="checkmark-circle" size={16} color="#22C55E" />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#16A34A' }}>
                        To'langan
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {shouldShowConfirmButton && (
                <button
                  type="button"
                  onClick={() => handleConfirmDelivery(order)}
                  disabled={isConfirming}
                  style={{
                    marginTop: 10,
                    width: '100%',
                    borderRadius: 10,
                    padding: '10px 14px',
                    border: 'none',
                    background: '#007AFF',
                    color: '#fff',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    opacity: isConfirming ? 0.7 : 1,
                  }}
                >
                  {isConfirming ? (
                    <span>Tasdiqlanmoqda...</span>
                  ) : (
                    <>
                      <Icon name="checkmark-circle" size={18} color="#fff" />
                      <span>Tasdiqlash (to'lov hisobga olinadi)</span>
                    </>
                  )}
                </button>
              )}

              {shouldShowPayButton && (
                <button
                  type="button"
                  onClick={() => handlePayMaxalla(order)}
                  disabled={isPaying}
                  style={{
                    marginTop: 8,
                    width: '100%',
                    borderRadius: 10,
                    padding: '10px 14px',
                    border: '1px solid #007AFF',
                    background: '#fff',
                    color: '#007AFF',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    opacity: isPaying ? 0.7 : 1,
                  }}
                >
                  {isPaying ? (
                    <span>To'lov amalga oshirilmoqda...</span>
                  ) : (
                    <>
                      <Icon name="card-outline" size={18} color="#007AFF" />
                      <span>To'lov qilish</span>
                    </>
                  )}
                </button>
              )}

              {isPaidOrConfirmed && (
                <button
                  type="button"
                  onClick={() => showInfo("To'lov tasdiqlash bilan hisobga olingan")}
                  style={{
                    marginTop: 10,
                    width: '100%',
                    borderRadius: 10,
                    padding: '10px 14px',
                    border: '1px solid #22C55E',
                    background: '#F0FDF4',
                    color: '#16A34A',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <Icon name="checkmark-circle" size={18} color="#16A34A" />
                  <span>To'lov qilindi</span>
                </button>
              )}
            </div>
          );
        })}

        {hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              marginTop: 4,
              width: '100%',
              borderRadius: 999,
              padding: '10px 16px',
              border: '1px solid var(--primary)',
              background: '#FFFFFF',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: loadingMore ? 0.7 : 1,
            }}
          >
            {loadingMore ? 'Yuklanmoqda...' : 'Yana yuklash'}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <Header
        title="Buyurtmalarim"
        showBackButton
        onBackPress={() => navigate('/profile')}
        onNotificationPress={() => navigate('/notifications')}
        unreadCount={unreadCount}
      />
      <div className="page" style={{ paddingTop: 0 }}>
        {renderTabs()}
        {renderContent()}
      </div>
    </>
  );
}

