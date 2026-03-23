import { useEffect, useState } from 'react';
import Icon from './ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import apiService, { MaxallaStore } from '../services/api';

interface Props {
  open: boolean;
  productId: string;
  productName: string;
  onClose: () => void;
  onSelectStore: (store: MaxallaStore) => void;
}

export default function MaxallaStoreSelectionModal({
  open,
  productId,
  productName,
  onClose,
  onSelectStore,
}: Props) {
  const { token } = useAuth();
  const { selectedMfy } = useLocation();
  const [stores, setStores] = useState<MaxallaStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !productId) {
      setStores([]);
      setError(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.getMaxallaStores(productId, token || null);
        if (!cancelled && res.success && res.data) {
          const sorted = [...res.data].sort((a, b) => {
            const aOpen = a.contragent.isOpen;
            const bOpen = b.contragent.isOpen;
            if (aOpen === true && bOpen !== true) return -1;
            if (aOpen !== true && bOpen === true) return 1;
            if (aOpen === false && bOpen === null) return -1;
            if (aOpen === null && bOpen === false) return 1;
            return a.contragent.name.localeCompare(b.contragent.name);
          });
          setStores(sorted);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Dokonlarni yuklashda xatolik yuz berdi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, productId, token]);

  if (!open) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('uz-UZ').format(price) + " so'm";

  const getStatus = (isOpen: boolean | null | undefined) => {
    if (isOpen === true)
      return { text: 'Ochiq', color: '#16A34A', icon: 'checkmark-circle' };
    if (isOpen === false)
      return { text: 'Yopiq', color: '#EF4444', icon: 'close-circle' };
    return { text: "Vaqt noma'lum", color: '#F59E0B', icon: 'time-outline' };
  };

  return (
    <div className="modalOverlay">
      <div
        className="modalContainer"
        style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <h2 className="modalTitle">Dokon tanlash</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
          {productName}
        </p>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div className="loading-spinner" />
            <p style={{ marginTop: 8, fontSize: 14, color: '#6B7280' }}>
              Dokonlar yuklanmoqda...
            </p>
          </div>
        ) : stores.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <Icon name="storefront-outline" size={40} color="#D1D5DB" />
            <p style={{ marginTop: 12, fontSize: 15, color: '#4B5563' }}>
              {error || 'Dokonlar topilmadi'}
            </p>
            {!selectedMfy && (
              <p style={{ marginTop: 4, fontSize: 13, color: '#9CA3AF' }}>
                Dokonlarni ko‘rish uchun MFY tanlang
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stores.map((store) => {
              const status = getStatus(store.contragent.isOpen);
              const working =
                store.contragent.workingHours?.open &&
                store.contragent.workingHours?.close;
              return (
                <button
                  key={store.contragent._id}
                  type="button"
                  onClick={() => onSelectStore(store)}
                  style={{
                    textAlign: 'left',
                    borderRadius: 12,
                    border: '1px solid #E5E7EB',
                    padding: 12,
                    background: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#111827',
                        }}
                      >
                        {store.contragent.name}
                      </div>
                      {store.contragent.phone && (
                        <div
                          style={{
                            fontSize: 13,
                            color: '#6B7280',
                            marginTop: 2,
                          }}
                        >
                          {store.contragent.phone}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        borderRadius: 999,
                        backgroundColor: status.color + '20',
                      }}
                    >
                      <Icon name={status.icon} size={14} color={status.color} />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: status.color,
                        }}
                      >
                        {status.text}
                      </span>
                    </div>
                  </div>
                  {working && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        color: '#6B7280',
                        marginBottom: 6,
                      }}
                    >
                      <Icon name="time-outline" size={14} color="#6B7280" />
                      <span>
                        {store.contragent.workingHours?.open} -{' '}
                        {store.contragent.workingHours?.close}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      borderTop: '1px solid #E5E7EB',
                      marginTop: 8,
                      paddingTop: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#111827' }}>
                      {formatPrice(store.product.price)}
                    </span>
                    <span style={{ color: '#6B7280' }}>
                      Mavjud: {store.product.quantity} {store.product.unit}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

