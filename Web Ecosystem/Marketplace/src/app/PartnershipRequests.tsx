import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Icon from '../components/ui/Icon';
import PartnershipRequestModal from '../components/PartnershipRequestModal';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiService, { PartnershipRequest } from '../services/api';

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  pending: { bg: '#FFF3CD', text: '#856404', icon: 'time-outline' },
  reviewing: { bg: '#D1ECF1', text: '#0C5460', icon: 'eye-outline' },
  contacted: { bg: '#D4EDDA', text: '#155724', icon: 'call-outline' },
  approved: { bg: '#D4EDDA', text: '#155724', icon: 'checkmark-circle-outline' },
  rejected: { bg: '#F8D7DA', text: '#721C24', icon: 'close-circle-outline' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Kutilmoqda",
  reviewing: "Ko'rib chiqilmoqda",
  contacted: "Aloqa o'rnatildi",
  approved: 'Tasdiqlandi',
  rejected: "Rad etildi",
};

function formatDate(dateString: string) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActivityName(activityType: PartnershipRequest['activityType']): string {
  if (!activityType) return '-';
  if (typeof activityType === 'object' && activityType !== null && 'name' in activityType) {
    return (activityType as { name?: string }).name || '-';
  }
  return String(activityType);
}

export default function PartnershipRequests() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { unreadCount } = useNotification();
  const [requests, setRequests] = useState<PartnershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PartnershipRequest | null>(null);

  const loadRequests = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!token) return;
      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);
        const res = await apiService.getMyPartnershipRequests(
          { page: pageNum, limit: 20 },
          token
        );
        if (res.success) {
          if (append) {
            setRequests((prev) => [...prev, ...res.data]);
          } else {
            setRequests(res.data);
          }
          setPage(res.page);
          setHasMore(res.page < res.totalPages);
        }
      } catch {
        if (!append) {
          setRequests([]);
          setPage(1);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadRequests(1, false);
  }, [loadRequests]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadRequests(page + 1, true);
    }
  }, [loadingMore, hasMore, loading, page, loadRequests]);

  const handleRequestSuccess = useCallback(() => {
    setModalOpen(false);
    loadRequests(1, false);
  }, [loadRequests]);

  return (
    <div className="app-layout" style={{ paddingBottom: 24 }}>
      <Header
        title="Hamkorlik so'rovlarim"
        onNotificationPress={() => navigate('/notifications')}
        unreadCount={unreadCount}
        showBackButton
        onBackPress={() => navigate(-1)}
      />

      {loading && requests.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
          }}
        >
          <div className="loading-spinner" />
        </div>
      ) : (
        <div style={{ padding: 16, paddingTop: 0 }}>
          {requests.length > 0 && token && (
            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onClick={() => setModalOpen(true)}
            >
              <Icon name="add-circle-outline" size={20} color="#fff" />
              <span>Yangi so'rov yuborish</span>
            </button>
          )}

          {requests.length === 0 && !loading ? (
            <div
              className="emptyContainer"
              style={{ paddingTop: 48 }}
            >
              <Icon name="document-text-outline" size={64} color="#ccc" />
              <p className="emptyText">Hamkorlik so'rovlari topilmadi</p>
              <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8 }}>
                Hamkorlik so'rovi yuborish uchun quyidagi tugmani bosing
              </p>
              {token && (
                <button
                  type="button"
                  className="btn-primary"
                  style={{
                    marginTop: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onClick={() => setModalOpen(true)}
                >
                  <Icon name="add-circle-outline" size={20} color="#fff" />
                  <span>Hamkorlik so'rovi yuborish</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {requests.map((item) => {
                const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                const statusLabel = STATUS_LABELS[item.status] || item.status;
                return (
                  <div
                    key={item._id}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      padding: 16,
                    }}
                    onClick={() => {
                      setSelectedRequest(item);
                      setDetailOpen(true);
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 10px',
                          borderRadius: 12,
                          backgroundColor: statusConfig.bg,
                          color: statusConfig.text,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Icon
                          name={statusConfig.icon as 'time-outline'}
                          size={16}
                          color={statusConfig.text}
                        />
                        {statusLabel}
                      </span>
                      <span style={{ fontSize: 12, color: '#666' }}>
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <strong style={{ fontSize: 18, color: '#333' }}>
                        {item.companyName}
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
                      INN: {item.inn} • MFO: {item.mfo}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>
                      {item.viloyat?.name}, {item.tuman?.name}, {item.mfy?.name}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>
                      Rahbar: {item.managerFirstName} {item.managerLastName}
                    </p>
                    {item.adminNotes && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: 10,
                          background: '#F9FAFB',
                          borderRadius: 8,
                          fontSize: 13,
                          color: '#6B7280',
                        }}
                      >
                        <strong>Admin izohi:</strong> {item.adminNotes}
                      </div>
                    )}
                    {item.status === 'approved' && item.approvedAt && (
                      <div
                        style={{
                          marginTop: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          color: '#155724',
                          fontSize: 13,
                        }}
                      >
                        <Icon name="checkmark-circle" size={16} color="#155724" />
                        Kontragentga aylantirildi • {formatDate(item.approvedAt)}
                      </div>
                    )}
                  </div>
                );
              })}
              {loadingMore && (
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }} />
                </div>
              )}
              {hasMore && requests.length > 0 && !loadingMore && (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: 'var(--gray)' }}
                  onClick={handleLoadMore}
                >
                  Ko'proq yuklash
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {token && (
        <PartnershipRequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          token={token}
          onSuccess={handleRequestSuccess}
        />
      )}

      {/* Detail Modal */}
      {selectedRequest && detailOpen && (
        <div
          className="modalOverlay"
          onClick={() => setDetailOpen(false)}
        >
          <div
            className="modalContainer"
            style={{
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    background:
                      STATUS_CONFIG[selectedRequest.status]?.bg || '#E3F2FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    name={
                      (STATUS_CONFIG[selectedRequest.status]?.icon ||
                        'business') as 'business'
                    }
                    size={24}
                    color={
                      STATUS_CONFIG[selectedRequest.status]?.text || '#007AFF'
                    }
                  />
                </div>
                <div>
                  <h2 className="modalTitle" style={{ margin: 0 }}>
                    Hamkorlik so'rovi
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6B7280' }}>
                    {selectedRequest.companyName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <Icon name="close" size={24} color="#666" />
              </button>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 12,
                backgroundColor:
                  STATUS_CONFIG[selectedRequest.status]?.bg || '#FFF3CD',
                color: STATUS_CONFIG[selectedRequest.status]?.text || '#856404',
                marginBottom: 20,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <Icon
                name={
                  (STATUS_CONFIG[selectedRequest.status]?.icon ||
                    'time-outline') as 'time-outline'
                }
                size={18}
                color={STATUS_CONFIG[selectedRequest.status]?.text || '#856404'}
              />
              {STATUS_LABELS[selectedRequest.status] || selectedRequest.status}
            </div>

            <section style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                Kompaniya ma'lumotlari
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <InfoRow label="Kompaniya nomi" value={selectedRequest.companyName} icon="business-outline" />
                <InfoRow label="INN" value={selectedRequest.inn} icon="card-outline" />
                <InfoRow label="MFO" value={selectedRequest.mfo} icon="card-outline" />
                <InfoRow label="Hisob raqami" value={selectedRequest.accountNumber} icon="wallet-outline" />
              </div>
            </section>

            <section style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                Manzil
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <InfoRow label="Viloyat" value={selectedRequest.viloyat?.name} icon="location-outline" />
                <InfoRow label="Tuman" value={selectedRequest.tuman?.name} icon="map-outline" />
                <InfoRow label="MFY" value={selectedRequest.mfy?.name} icon="home-outline" />
              </div>
            </section>

            <section style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                Faoliyat
              </h3>
              <p style={{ margin: 0, fontSize: 15, color: '#374151' }}>
                {getActivityName(selectedRequest.activityType)}
              </p>
            </section>

            <section style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                Rahbar ma'lumotlari
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <InfoRow label="Ism" value={selectedRequest.managerFirstName} icon="person-outline" />
                <InfoRow label="Familiya" value={selectedRequest.managerLastName} icon="person-outline" />
                <InfoRow label="Telefon" value={selectedRequest.managerPhone} icon="call-outline" />
              </div>
            </section>

            {selectedRequest.adminNotes && (
              <section style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                  Admin izohi
                </h3>
                <div
                  style={{
                    padding: 12,
                    background: '#F9FAFB',
                    borderRadius: 12,
                    fontSize: 14,
                    color: '#374151',
                  }}
                >
                  {selectedRequest.adminNotes}
                </div>
              </section>
            )}

            {selectedRequest.reviewedBy && (
              <section style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                  Ko'rib chiqdi
                </h3>
                <p style={{ margin: 0, fontSize: 15, color: '#374151' }}>
                  {selectedRequest.reviewedBy.firstName}{' '}
                  {selectedRequest.reviewedBy.lastName}
                </p>
              </section>
            )}

            {selectedRequest.status === 'approved' && selectedRequest.approvedAt && (
              <section style={{ marginBottom: 0 }}>
                <div
                  style={{
                    padding: 16,
                    background: '#D4EDDA',
                    borderRadius: 12,
                    border: '1px solid #C3E6CB',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Icon name="checkmark-circle" size={24} color="#155724" />
                    <div>
                      <div style={{ fontWeight: 700, color: '#155724' }}>
                        Kontragentga aylantirildi
                      </div>
                      <div style={{ fontSize: 13, color: '#155724', opacity: 0.9 }}>
                        {formatDate(selectedRequest.approvedAt)}
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#155724', lineHeight: 1.5 }}>
                    Sizning so'rovingiz tasdiqlandi va kompaniyangiz kontragent sifatida
                    ro'yxatdan o'tkazildi. Platformaga kirish uchun kontragent
                    autentifikatsiya qismidan telefon raqamingizni yuborib SMS kod
                    so'rashingiz kerak. SMS kod 5 daqiqa amal qiladi.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | undefined | null;
  icon: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        background: '#F9FAFB',
        borderRadius: 12,
      }}
    >
      <Icon name={icon as 'business-outline'} size={20} color="#007AFF" />
      <div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>
          {value || '-'}
        </div>
      </div>
    </div>
  );
}
