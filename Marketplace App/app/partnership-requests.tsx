import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import PartnershipRequestModal from '../components/PartnershipRequestModal';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiService, { PartnershipRequest } from '../services/api';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: '#FFF3CD', text: '#856404', icon: 'time-outline' },
  reviewing: { bg: '#D1ECF1', text: '#0C5460', icon: 'eye-outline' },
  contacted: { bg: '#D4EDDA', text: '#155724', icon: 'call-outline' },
  approved: { bg: '#D4EDDA', text: '#155724', icon: 'checkmark-circle-outline' },
  rejected: { bg: '#F8D7DA', text: '#721C24', icon: 'close-circle-outline' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Kutilmoqda',
  reviewing: 'Ko\'rib chiqilmoqda',
  contacted: 'Aloqa o\'rnatildi',
  approved: 'Tasdiqlandi',
  rejected: 'Rad etildi',
};

export default function PartnershipRequestsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { unreadCount } = useNotification();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<PartnershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PartnershipRequest | null>(null);

  const loadRequests = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!token) return;

    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await apiService.getMyPartnershipRequests(
        { page: pageNum, limit: 20 },
        token
      );

      if (response.success) {
        if (append) {
          setRequests((prev) => [...prev, ...response.data]);
        } else {
          setRequests(response.data);
        }

        setPage(response.page);
        setHasMore(response.page < response.totalPages);
      }
    } catch (error: any) {
      // If 404, it means no requests exist yet - this is fine
      if (error?.status === 404) {
        setRequests([]);
        setPage(1);
        setHasMore(false);
      } else {
        console.error('Error loading partnership requests:', error);
        if (!append) {
          Alert.alert('Xatolik', error.message || 'So\'rovlarni yuklashda xatolik yuz berdi');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests(1, false);
  }, [loadRequests]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadRequests(1, false);
  }, [loadRequests]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadRequests(page + 1, true);
    }
  }, [loadingMore, hasMore, loading, page, loadRequests]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleNotificationPress = () => {
    router.push('/notifications' as any);
  };

  const handleCardPress = (item: PartnershipRequest) => {
    setSelectedRequest(item);
    setDetailModalVisible(true);
  };

  const renderTimelineItem = (
    status: string,
    label: string,
    date: string | null | undefined,
    isCompleted: boolean,
    isActive: boolean
  ) => {
    const statusConfig = STATUS_COLORS[status] || STATUS_COLORS.pending;
    
    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineLeft}>
          <View style={[
            styles.timelineDot,
            isCompleted && { backgroundColor: statusConfig.bg },
            isActive && styles.timelineDotActive
          ]}>
            {isCompleted && (
              <Ionicons 
                name={statusConfig.icon as any} 
                size={14} 
                color={statusConfig.text} 
              />
            )}
          </View>
          {!isActive && <View style={[styles.timelineLine, isCompleted && styles.timelineLineCompleted]} />}
        </View>
        <View style={styles.timelineContent}>
          <Text style={[styles.timelineLabel, isCompleted && styles.timelineLabelCompleted]}>
            {label}
          </Text>
          {date && (
            <Text style={styles.timelineDate}>
              {new Date(date).toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: PartnershipRequest }) => {
    const statusConfig = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    const statusLabel = STATUS_LABELS[item.status] || item.status;

    return (
      <TouchableOpacity
        style={styles.requestCard}
        activeOpacity={0.7}
        onPress={() => handleCardPress(item)}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Ionicons name={statusConfig.icon as any} size={16} color={statusConfig.text} />
              <Text style={[styles.statusText, { color: statusConfig.text }]}>
                {statusLabel}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.requestContent}>
          <Text style={styles.companyName}>{item.companyName}</Text>
          <Text style={styles.companyInfo}>
            INN: {item.inn} • MFO: {item.mfo}
          </Text>
          <Text style={styles.locationText}>
            {item.viloyat?.name}, {item.tuman?.name}, {item.mfy?.name}
          </Text>
          <Text style={styles.managerText}>
            Rahbar: {item.managerFirstName} {item.managerLastName}
          </Text>
        </View>

        {item.adminNotes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Admin izohi:</Text>
            <Text style={styles.notesText}>{item.adminNotes}</Text>
          </View>
        )}

        {item.status === 'approved' && item.approvedAt && (
          <View style={styles.approvedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#155724" />
            <Text style={styles.approvedText}>
              Kontragentga aylantirildi • {formatDate(item.approvedAt)}
            </Text>
          </View>
        )}

        {item.reviewedAt && item.status !== 'approved' && (
          <Text style={styles.reviewedText}>
            Ko'rib chiqildi: {formatDate(item.reviewedAt)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  const handleRequestSuccess = () => {
    setModalVisible(false);
    // Reload requests after successful submission
    loadRequests(1, false);
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Hamkorlik so'rovlari topilmadi</Text>
        <Text style={styles.emptySubtext}>
          Hamkorlik so'rovi yuborish uchun quyidagi tugmani bosing
        </Text>
        {token && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Hamkorlik so'rovi yuborish</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Hamkorlik so'rovlarim"
        onNotificationPress={handleNotificationPress}
        unreadCount={unreadCount}
        showBackButton
        onBackPress={() => router.back()}
      />

      {loading && requests.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            requests.length === 0 && styles.emptyListContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            requests.length > 0 && token ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                <Text style={styles.addButtonText}>Yangi so'rov yuborish</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {token && (
        <PartnershipRequestModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          token={token}
          onSuccess={handleRequestSuccess}
        />
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <Modal
          visible={detailModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View style={styles.detailModalOverlay}>
            <View style={[styles.detailModalContent, { paddingBottom: insets.bottom }]}>
              {/* Drag Indicator */}
              <View style={styles.dragIndicator} />

              {/* Header */}
              <View style={styles.detailHeader}>
                <View style={styles.detailHeaderLeft}>
                  <View style={[styles.detailIconContainer, { backgroundColor: STATUS_COLORS[selectedRequest.status]?.bg || '#E3F2FD' }]}>
                    <Ionicons 
                      name={STATUS_COLORS[selectedRequest.status]?.icon as any || 'business'} 
                      size={24} 
                      color={STATUS_COLORS[selectedRequest.status]?.text || '#007AFF'} 
                    />
                  </View>
                  <View>
                    <Text style={styles.detailTitle}>Hamkorlik so'rovi</Text>
                    <Text style={styles.detailSubtitle}>{selectedRequest.companyName}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setDetailModalVisible(false)}
                  style={styles.detailCloseButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.detailScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailScrollContent}
              >
                {/* Status Badge */}
                <View style={[styles.detailStatusBadge, { backgroundColor: STATUS_COLORS[selectedRequest.status]?.bg || '#FFF3CD' }]}>
                  <Ionicons 
                    name={STATUS_COLORS[selectedRequest.status]?.icon as any || 'time-outline'} 
                    size={18} 
                    color={STATUS_COLORS[selectedRequest.status]?.text || '#856404'} 
                  />
                  <Text style={[styles.detailStatusText, { color: STATUS_COLORS[selectedRequest.status]?.text || '#856404' }]}>
                    {STATUS_LABELS[selectedRequest.status] || selectedRequest.status}
                  </Text>
                </View>

                {/* Roadmap Timeline */}
                <View style={styles.roadmapContainer}>
                  <Text style={styles.roadmapTitle}>So'rov holati</Text>
                  
                  {/* Timeline Items */}
                  {renderTimelineItem(
                    'pending',
                    'So\'rov yuborildi',
                    selectedRequest.createdAt,
                    selectedRequest.status !== 'pending',
                    selectedRequest.status === 'pending'
                  )}
                  
                  {renderTimelineItem(
                    'reviewing',
                    'Ko\'rib chiqilmoqda',
                    selectedRequest.reviewedAt,
                    ['reviewing', 'contacted', 'approved', 'rejected'].includes(selectedRequest.status),
                    selectedRequest.status === 'reviewing'
                  )}
                  
                  {renderTimelineItem(
                    'contacted',
                    'Aloqa o\'rnatildi',
                    selectedRequest.contactedAt,
                    ['contacted', 'approved', 'rejected'].includes(selectedRequest.status),
                    selectedRequest.status === 'contacted'
                  )}
                  
                  {selectedRequest.status === 'approved' && renderTimelineItem(
                    'approved',
                    'Tasdiqlandi va Kontragentga aylantirildi',
                    selectedRequest.approvedAt,
                    true,
                    true
                  )}
                  
                  {selectedRequest.status === 'rejected' && renderTimelineItem(
                    'rejected',
                    'Rad etildi',
                    selectedRequest.rejectedAt,
                    true,
                    true
                  )}
                </View>

                {/* Company Information */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Kompaniya ma'lumotlari</Text>
                  
                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons name="business-outline" size={20} color="#007AFF" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Kompaniya nomi</Text>
                        <Text style={styles.infoValue}>{selectedRequest.companyName}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons name="card-outline" size={20} color="#007AFF" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>INN</Text>
                        <Text style={styles.infoValue}>{selectedRequest.inn}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons name="card-outline" size={20} color="#007AFF" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>MFO</Text>
                        <Text style={styles.infoValue}>{selectedRequest.mfo}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons name="wallet-outline" size={20} color="#007AFF" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Hisob raqami</Text>
                        <Text style={styles.infoValue}>{selectedRequest.accountNumber}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Location Information */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Manzil</Text>
                  
                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={20} color="#007AFF" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Viloyat</Text>
                        <Text style={styles.infoValue}>{selectedRequest.viloyat?.name || '-'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons name="map-outline" size={20} color="#007AFF" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Tuman</Text>
                        <Text style={styles.infoValue}>{selectedRequest.tuman?.name || '-'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons name="home-outline" size={20} color="#007AFF" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>MFY</Text>
                        <Text style={styles.infoValue}>{selectedRequest.mfy?.name || '-'}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Activity */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Faoliyat</Text>
                  <View style={styles.infoCard}>
                    <Text style={styles.activityText}>{selectedRequest.activity}</Text>
                  </View>
                </View>

                {/* Manager Information */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Rahbar ma'lumotlari</Text>
                  
                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons name="person-outline" size={20} color="#007AFF" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Ism</Text>
                        <Text style={styles.infoValue}>{selectedRequest.managerFirstName}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons name="person-outline" size={20} color="#007AFF" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Familiya</Text>
                        <Text style={styles.infoValue}>{selectedRequest.managerLastName}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons name="call-outline" size={20} color="#007AFF" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Telefon</Text>
                        <Text style={styles.infoValue}>{selectedRequest.managerPhone}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Admin Notes */}
                {selectedRequest.adminNotes && (
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Admin izohi</Text>
                    <View style={[styles.infoCard, styles.notesCard]}>
                      <Text style={styles.detailNotesText}>{selectedRequest.adminNotes}</Text>
                    </View>
                  </View>
                )}

                {/* Reviewed By */}
                {selectedRequest.reviewedBy && (
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Ko'rib chiqdi</Text>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoValue}>
                        {selectedRequest.reviewedBy.firstName} {selectedRequest.reviewedBy.lastName}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Contragent Conversion Info */}
                {selectedRequest.status === 'approved' && selectedRequest.approvedAt && (
                  <View style={styles.infoSection}>
                    <View style={[styles.infoCard, styles.contragentCard]}>
                      <View style={styles.contragentHeader}>
                        <View style={styles.contragentIconContainer}>
                          <Ionicons name="checkmark-circle" size={24} color="#155724" />
                        </View>
                        <View style={styles.contragentContent}>
                          <Text style={styles.contragentTitle}>Kontragentga aylantirildi</Text>
                          <Text style={styles.contragentSubtitle}>
                            {formatDate(selectedRequest.approvedAt)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.contragentInfo}>
                        <Text style={styles.contragentInfoText}>
                          Sizning so'rovingiz tasdiqlandi va kompaniyangiz kontragent sifatida ro'yxatdan o'tkazildi.
                        </Text>
                        <Text style={styles.contragentInfoText}>
                          Platformaga kirish uchun kontragent autentifikatsiya qismidan telefon raqamingizni yuborib SMS kod so'rashingiz kerak.
                        </Text>
                        <Text style={styles.contragentInfoText}>
                          SMS kod 5 daqiqa amal qiladi.
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestHeaderLeft: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  requestContent: {
    marginBottom: 8,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  companyInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  managerText: {
    fontSize: 14,
    color: '#666',
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  reviewedText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Detail Modal Styles
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  detailSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  detailCloseButton: {
    padding: 4,
  },
  detailScrollView: {
    flex: 1,
  },
  detailScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
    marginBottom: 24,
  },
  detailStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  roadmapContainer: {
    marginBottom: 32,
  },
  roadmapTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  timelineDotActive: {
    borderWidth: 3,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
    minHeight: 40,
  },
  timelineLineCompleted: {
    backgroundColor: '#007AFF',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  timelineLabelCompleted: {
    color: '#333',
  },
  timelineDate: {
    fontSize: 13,
    color: '#666',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  activityText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  notesCard: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  detailNotesText: {
    fontSize: 15,
    color: '#856404',
    lineHeight: 22,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  approvedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#155724',
    flex: 1,
  },
  contragentCard: {
    backgroundColor: '#D4EDDA',
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
    padding: 16,
  },
  contragentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  contragentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contragentContent: {
    flex: 1,
  },
  contragentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#155724',
    marginBottom: 4,
  },
  contragentSubtitle: {
    fontSize: 13,
    color: '#155724',
    opacity: 0.8,
  },
  contragentInfo: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(21, 87, 36, 0.2)',
  },
  contragentInfoText: {
    fontSize: 14,
    color: '#155724',
    lineHeight: 20,
    marginBottom: 8,
  },
});

