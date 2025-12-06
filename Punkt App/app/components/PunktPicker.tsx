import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService, OrderItem, PunktSelection } from '../services/api';

interface PunktPickerProps {
  selectedPunkt: PunktSelection | null;
  onSelect: (punkt: PunktSelection) => void;
  viloyatId?: string;
  tumanId?: string;
  orderItems?: OrderItem[]; // Mahsulotlar ma'lumotlari yetkazib berish hududlari bilan
}

export function PunktPicker({
  selectedPunkt,
  onSelect,
  viloyatId,
  tumanId,
  orderItems,
}: PunktPickerProps) {
  const [punkts, setPunkts] = useState<PunktSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    if (showList) {
      loadPunkts();
    }
  }, [showList, searchQuery, viloyatId, tumanId, orderItems]);

  const loadPunkts = async () => {
    setLoading(true);
    try {
      const params: any = {
        status: 'active',
        page: 1,
        limit: 100,
      };

      // Agar orderItems bo'lsa, mahsulotlarning yetkazib berish hududlariga qarab filtrlash
      if (orderItems && orderItems.length > 0) {
        // Barcha mahsulotlarning yetkazib berish hududlarini yig'ish
        const deliveryRegions = new Set<string>();
        
        orderItems.forEach((item) => {
          if (item.product.deliveryRegions && item.product.deliveryRegions.length > 0) {
            item.product.deliveryRegions.forEach((region) => {
              // Viloyat + Tuman kombinatsiyasini yaratish
              const regionKey = `${region.viloyat._id}_${region.tuman._id}`;
              deliveryRegions.add(regionKey);
            });
          }
        });

        // Agar mahsulotlarda yetkazib berish hududlari bo'lsa, ularga mos punktlarni qidirish
        if (deliveryRegions.size > 0) {
          // Barcha punktlarni yuklash (filtrsiz)
          const response = await apiService.getPunktsForSelection({
            status: 'active',
            page: 1,
            limit: 1000, // Ko'proq punktlarni olish uchun
          });

          // Punktlarni mahsulotlarning yetkazib berish hududlariga mos keladiganlarini filtrlash
          const punktsWithTuman = response.data.filter((p) => {
            if (!p.tuman) return false;
            
            // Punktning viloyat + tuman kombinatsiyasini yaratish
            const punktKey = `${p.viloyat._id}_${p.tuman._id}`;
            
            // Punkt mahsulotlarning yetkazib berish hududlaridan birida bo'lsa, qo'shish
            return deliveryRegions.has(punktKey);
          });

          // Qidiruv bo'lsa, qo'shimcha filtrlash
          const filteredPunkts = searchQuery.trim()
            ? punktsWithTuman.filter((p) => {
                const query = searchQuery.trim().toLowerCase();
                return (
                  p.name.toLowerCase().includes(query) ||
                  p.phone.includes(query)
                );
              })
            : punktsWithTuman;

          setPunkts(filteredPunkts);
        } else {
          // Agar mahsulotlarda yetkazib berish hududlari bo'lmasa, eski logikani ishlatish
          if (viloyatId) {
            params.viloyat = viloyatId;
          }

          if (tumanId) {
            params.tuman = tumanId;
          }

          if (searchQuery.trim()) {
            params.search = searchQuery.trim();
          }

          const response = await apiService.getPunktsForSelection(params);
          const punktsWithTuman = response.data.filter((p) => p.tuman !== null);
          setPunkts(punktsWithTuman);
        }
      } else {
        // Agar orderItems bo'lmasa, eski logikani ishlatish
        if (viloyatId) {
          params.viloyat = viloyatId;
        }

        if (tumanId) {
          params.tuman = tumanId;
        }

        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        const response = await apiService.getPunktsForSelection(params);
        const punktsWithTuman = response.data.filter((p) => p.tuman !== null);
        setPunkts(punktsWithTuman);
      }
    } catch (error: any) {
      console.error('Error loading punkts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (punkt: PunktSelection) => {
    onSelect(punkt);
    setShowList(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowList(!showList)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectorText, !selectedPunkt && styles.placeholder]} numberOfLines={1}>
          {selectedPunkt
            ? `${selectedPunkt.name} (${selectedPunkt.tuman?.name || 'N/A'})`
            : 'Punktni tanlang'}
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
              placeholder="Qidirish (nomi yoki telefon)"
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
              data={punkts}
              keyExtractor={(item) => item._id}
              style={styles.list}
              nestedScrollEnabled
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedPunkt?._id === item._id && styles.itemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPhone}>{item.phone}</Text>
                    {item.tuman && (
                      <Text style={styles.itemLocation}>
                        {item.viloyat.name}, {item.tuman.name}
                      </Text>
                    )}
                  </View>
                  {selectedPunkt?._id === item._id && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Punktlar topilmadi</Text>
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
    maxHeight: 300,
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
    maxHeight: 250,
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
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  itemPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemLocation: {
    fontSize: 12,
    color: '#999',
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

