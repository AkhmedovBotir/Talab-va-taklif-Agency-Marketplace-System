import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import apiService, { MaxallaStore } from '../services/api';

interface MaxallaStoreSelectionModalProps {
  visible: boolean;
  productId: string;
  productName: string;
  onClose: () => void;
  onSelectStore: (store: MaxallaStore) => void;
}

export default function MaxallaStoreSelectionModal({
  visible,
  productId,
  productName,
  onClose,
  onSelectStore,
}: MaxallaStoreSelectionModalProps) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { selectedMfy } = useLocation();
  const [stores, setStores] = useState<MaxallaStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && productId) {
      loadStores();
    } else {
      setStores([]);
      setError(null);
    }
  }, [visible, productId]);

  const loadStores = async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getMaxallaStores(productId, token || null);
      
      if (response.success && response.data) {
        // Sort stores: open first, then closed, then unknown
        const sortedStores = [...response.data].sort((a, b) => {
          const aIsOpen = a.contragent.isOpen;
          const bIsOpen = b.contragent.isOpen;

          // Open stores first
          if (aIsOpen === true && bIsOpen !== true) return -1;
          if (aIsOpen !== true && bIsOpen === true) return 1;

          // Closed stores second
          if (aIsOpen === false && bIsOpen === null) return -1;
          if (aIsOpen === null && bIsOpen === false) return 1;

          // Within same group, sort alphabetically
          return a.contragent.name.localeCompare(b.contragent.name);
        });

        setStores(sortedStores);
      } else {
        setError('Dokonlar topilmadi');
      }
    } catch (error: any) {
      console.error('Error loading stores:', error);
      setError(error.message || 'Dokonlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getStoreStatus = (isOpen: boolean | null) => {
    if (isOpen === true) {
      return { text: 'Ochiq', color: '#34C759', icon: 'checkmark-circle' };
    } else if (isOpen === false) {
      return { text: 'Yopiq', color: '#FF3B30', icon: 'close-circle' };
    } else {
      return { text: 'Vaqt noma\'lum', color: '#FF9500', icon: 'time-outline' };
    }
  };

  const handleStoreSelect = (store: MaxallaStore) => {
    onSelectStore(store);
    onClose();
  };

  const renderStore = ({ item }: { item: MaxallaStore }) => {
    const { contragent, product } = item;
    const status = getStoreStatus(contragent.isOpen);
    const hasWorkingHours = contragent.workingHours?.open && contragent.workingHours?.close;

    return (
      <TouchableOpacity
        style={styles.storeCard}
        onPress={() => handleStoreSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.storeHeader}>
          <View style={styles.storeInfo}>
            {contragent.logo ? (
              <Image
                source={{ uri: contragent.logo }}
                style={styles.storeLogo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.storeLogoPlaceholder}>
                <Ionicons name="storefront" size={24} color="#666" />
              </View>
            )}
            <View style={styles.storeDetails}>
              <Text style={styles.storeName} numberOfLines={1}>
                {contragent.name}
              </Text>
              <Text style={styles.storePhone}>{contragent.phone}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Ionicons name={status.icon as any} size={16} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>

        {hasWorkingHours && (
          <View style={styles.workingHours}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.workingHoursText}>
              {contragent.workingHours?.open} - {contragent.workingHours?.close}
            </Text>
          </View>
        )}

        <View style={styles.productInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
            {product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>
          <Text style={styles.productQuantity}>
            Mavjud: {product.quantity} {product.unit}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="storefront-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>
          {error || 'Dokonlar topilmadi'}
        </Text>
        {!selectedMfy && (
          <Text style={styles.emptySubtext}>
            Dokonlarni ko'rish uchun MFY tanlang
          </Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dokon tanlash</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.productName} numberOfLines={2}>
            {productName}
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Dokonlar yuklanmoqda...</Text>
            </View>
          ) : (
            <FlatList
              data={stores}
              renderItem={renderStore}
              keyExtractor={(item) => item.contragent._id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmpty}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storeInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  storeLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  storeLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  storePhone: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workingHours: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  workingHoursText: {
    fontSize: 13,
    color: '#666',
  },
  productInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  productQuantity: {
    fontSize: 13,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
