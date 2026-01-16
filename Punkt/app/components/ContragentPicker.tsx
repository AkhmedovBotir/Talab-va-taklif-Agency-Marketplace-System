import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService, Contragent } from '../services/api';

interface ContragentPickerProps {
  selectedContragent: Contragent | null;
  onSelect: (contragent: Contragent) => void;
  orderId: string;
}

export function ContragentPicker({
  selectedContragent,
  onSelect,
  orderId,
}: ContragentPickerProps) {
  const [contragents, setContragents] = useState<Contragent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    if (showList && orderId) {
      loadContragents();
    }
  }, [showList, orderId, searchQuery]);

  const loadContragents = async () => {
    setLoading(true);
    try {
      const response = await apiService.getOrderContragents(orderId);
      
      let filteredContragents = response.data.contragents;

      // Filter by search query if provided
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        filteredContragents = filteredContragents.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.phone?.toLowerCase().includes(query) ||
            c.inn?.toLowerCase().includes(query)
        );
      }

      setContragents(filteredContragents);
    } catch (error: any) {
      console.error('Error loading contragents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (contragent: Contragent) => {
    onSelect(contragent);
    setShowList(false);
    setSearchQuery('');
  };

  const getRequestStatusColor = (status: string | null | undefined) => {
    if (!status) return '#8E8E93';
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'accepted':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      case 'delivered_to_punkt':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const getRequestStatusLabel = (status: string | null | undefined) => {
    if (!status) return '';
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'accepted':
        return 'Qabul qilindi';
      case 'rejected':
        return 'Rad etildi';
      case 'delivered_to_punkt':
        return 'Yetkazildi';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowList(!showList)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectorText, !selectedContragent && styles.placeholder]} numberOfLines={1}>
          {selectedContragent
            ? `${selectedContragent.name}${selectedContragent.inn ? ` (INN: ${selectedContragent.inn})` : ''}`
            : 'Contragentni tanlang'}
        </Text>
        <Ionicons
          name={showList ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
        />
      </TouchableOpacity>

      {showList && (
        <View style={styles.dropdown}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Qidirish (nomi, telefon, INN)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : (
            <FlatList
              data={contragents}
              keyExtractor={(item) => item._id}
              style={styles.list}
              nestedScrollEnabled
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedContragent?._id === item._id && styles.itemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.hasRequest && item.requestStatus && (
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getRequestStatusColor(item.requestStatus) + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: getRequestStatusColor(item.requestStatus) },
                            ]}
                          >
                            {getRequestStatusLabel(item.requestStatus)}
                          </Text>
                        </View>
                      )}
                    </View>
                    {item.inn && (
                      <Text style={styles.itemInn}>INN: {item.inn}</Text>
                    )}
                    {item.phone && (
                      <Text style={styles.itemPhone}>{item.phone}</Text>
                    )}
                    {item.viloyat && (
                      <Text style={styles.itemLocation}>
                        {item.viloyat.name}
                        {item.tuman && `, ${item.tuman.name}`}
                        {item.mfy && `, ${item.mfy.name}`}
                      </Text>
                    )}
                    {item.products && item.products.length > 0 && (
                      <Text style={styles.itemProducts}>
                        {item.products.length} ta mahsulot
                      </Text>
                    )}
                    {item.isInRegion !== undefined && (
                      <View style={styles.regionIndicator}>
                        <Ionicons
                          name={item.isInRegion ? 'checkmark-circle' : 'close-circle'}
                          size={14}
                          color={item.isInRegion ? '#34C759' : '#FF3B30'}
                        />
                        <Text
                          style={[
                            styles.regionText,
                            { color: item.isInRegion ? '#34C759' : '#FF3B30' },
                          ]}
                        >
                          {item.isInRegion ? 'Hududda' : 'Hududdan tashqari'}
                        </Text>
                      </View>
                    )}
                  </View>
                  {selectedContragent?._id === item._id && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Contragentlar topilmadi</Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    minHeight: 48,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  placeholder: {
    color: '#999',
  },
  dropdown: {
    marginTop: 4,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 4,
  },
  list: {
    maxHeight: 350,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemSelected: {
    backgroundColor: '#007AFF10',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
    flexWrap: 'wrap',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemInn: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemLocation: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  itemProducts: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  regionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  regionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});



