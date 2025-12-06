import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { OrderCard } from '../components/OrderCard';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Order } from '../services/api';

export default function PunktRequestsScreen() {
  const [requests, setRequests] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();
  const { punkt } = useAuth();

  const loadRequests = useCallback(async () => {
    try {
      const params: any = {
        page: 1,
        limit: 50,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await apiService.getPunktToPunktRequests(params);
      setRequests(response.data);
    } catch (error: any) {
      console.error('Error loading punkt requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const getRequestStatus = (order: Order) => {
    if (!order.punktToPunktRequests || order.punktToPunktRequests.length === 0) {
      return null;
    }
    const request = order.punktToPunktRequests.find(
      (req) => req.toPunktId && typeof req.toPunktId === 'object' && req.toPunktId._id === punkt?._id
    );
    return request?.status || null;
  };

  const handleRespond = async (order: Order, response: 'accepted' | 'rejected') => {
    const message = response === 'accepted' 
      ? 'Punkt so\'rovini qabul qilishni xohlaysizmi?'
      : 'Punkt so\'rovini rad etishni xohlaysizmi?';

    Alert.alert('Javob berish', message, [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: response === 'accepted' ? 'Qabul qilish' : 'Rad etish',
        onPress: async () => {
          setActionLoading(order._id);
          try {
            await apiService.respondToPunktRequest(order._id, { response });
            await loadRequests();
            Alert.alert('Muvaffaqiyatli', 'Javob yuborildi');
          } catch (error: any) {
            Alert.alert('Xatolik', error.message || 'Javob yuborishda xatolik');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleReceive = async (order: Order) => {
    Alert.alert(
      'Qabul qilish',
      'Punktdan buyurtmani qabul qilishni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Qabul qilish',
          onPress: async () => {
            setActionLoading(order._id);
            try {
              await apiService.receiveFromPunkt(order._id);
              await loadRequests();
              Alert.alert('Muvaffaqiyatli', 'Buyurtma qabul qilindi');
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Qabul qilishda xatolik');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const renderRequestActions = (order: Order) => {
    const status = getRequestStatus(order);
    const isLoading = actionLoading === order._id;

    if (status === 'pending') {
      return (
        <View style={styles.actionsContainer}>
          <Button
            title="Qabul qilish"
            onPress={() => handleRespond(order, 'accepted')}
            variant="primary"
            style={styles.actionButton}
            disabled={isLoading}
          />
          <Button
            title="Rad etish"
            onPress={() => handleRespond(order, 'rejected')}
            variant="outline"
            style={styles.actionButton}
            disabled={isLoading}
          />
        </View>
      );
    }

    if (status === 'accepted') {
      return (
        <View style={styles.actionsContainer}>
          <Button
            title="Qabul qilish"
            onPress={() => handleReceive(order)}
            variant="primary"
            style={styles.actionButton}
            disabled={isLoading}
          />
        </View>
      );
    }

    return null;
  };

  const renderItem = ({ item }: { item: Order }) => {
    const status = getRequestStatus(item);
    const request = item.punktToPunktRequests?.find(
      (req) => req.toPunktId && typeof req.toPunktId === 'object' && req.toPunktId._id === punkt?._id
    );
    const fromPunkt = request?.fromPunktId && typeof request.fromPunktId === 'object' 
      ? request.fromPunktId 
      : null;

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          onPress={() => router.push(`/order/${item._id}`)}
          activeOpacity={0.7}
        >
          <OrderCard order={item} onPress={() => router.push(`/order/${item._id}`)} />
        </TouchableOpacity>
        
        {fromPunkt && (
          <View style={styles.fromPunktInfo}>
            <Ionicons name="business-outline" size={16} color="#666" />
            <Text style={styles.fromPunktText}>
              {fromPunkt.name} punktidan
            </Text>
            {status && (
              <View style={[styles.statusBadge, styles[`status${status}`]]}>
                <Text style={styles.statusText}>
                  {status === 'pending' ? 'Kutilmoqda' : 
                   status === 'accepted' ? 'Qabul qilindi' : 
                   status === 'rejected' ? 'Rad etilgan' : 
                   status === 'delivered' ? 'Yetkazildi' : status}
                </Text>
              </View>
            )}
          </View>
        )}

        {renderRequestActions(item)}
      </View>
    );
  };

  if (loading && requests.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Holat:</Text>
        <View style={styles.filterButtons}>
          {['', 'pending', 'accepted', 'rejected', 'delivered'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                statusFilter === status && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === status && styles.filterButtonTextActive,
                ]}
              >
                {status === '' ? 'Barchasi' : 
                 status === 'pending' ? 'Kutilmoqda' :
                 status === 'accepted' ? 'Qabul qilindi' :
                 status === 'rejected' ? 'Rad etilgan' :
                 status === 'delivered' ? 'Yetkazildi' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Punkt so'rovlari topilmadi</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  filterContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  list: {
    padding: 16,
  },
  cardWrapper: {
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  fromPunktInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  fromPunktText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statuspending: {
    backgroundColor: '#FFF3E0',
  },
  statusaccepted: {
    backgroundColor: '#E8F5E9',
  },
  statusrejected: {
    backgroundColor: '#FFEBEE',
  },
  statusdelivered: {
    backgroundColor: '#E3F2FD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
