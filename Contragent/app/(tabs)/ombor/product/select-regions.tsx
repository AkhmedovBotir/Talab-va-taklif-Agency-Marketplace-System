import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService, Region, DeliveryRegion } from '../../../../services/api';

interface SelectedRegion {
  viloyat: Region;
  tuman: Region | null;
}

export default function SelectRegionsScreen() {
  const params = useLocalSearchParams<{ selectedRegions?: string; returnPath?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);
  const [selectedViloyat, setSelectedViloyat] = useState<Region | null>(null);
  const [selectedTuman, setSelectedTuman] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'regions' | 'selected'>('regions');

  // Load initial selected regions from params
  useEffect(() => {
    if (params?.selectedRegions) {
      try {
        const parsed: DeliveryRegion[] = JSON.parse(params.selectedRegions);
        loadInitialRegions(parsed);
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, [params?.selectedRegions]);

  const loadInitialRegions = async (deliveryRegions: DeliveryRegion[]) => {
    // Load full region objects for selected regions
    try {
      const loadedRegions: SelectedRegion[] = [];
      for (const dr of deliveryRegions) {
        try {
          const viloyatResponse = await apiService.getRegions({
            type: 'region',
            limit: 1,
          });
          const viloyat = viloyatResponse.data.find((r) => r._id === dr.viloyat);
          
          if (viloyat) {
            let tuman: Region | null = null;
            if (dr.tuman) {
              const tumanResponse = await apiService.getRegions({
                type: 'district',
                parent: dr.viloyat,
                limit: 1000,
              });
              tuman = tumanResponse.data.find((r) => r._id === dr.tuman) || null;
            }
            loadedRegions.push({ viloyat, tuman });
          }
        } catch (e) {
          // Ignore region loading errors
        }
      }
      setSelectedRegions(loadedRegions);
    } catch (e) {
      // Ignore initial regions loading errors
    }
  };

  const loadRegions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getRegions({
        page: 1,
        limit: 1000,
        type: 'region',
        status: 'active',
      });

      const sortedRegions = [...response.data].sort((a, b) => 
        a.name.localeCompare(b.name, 'uz', { sensitivity: 'base' })
      );
        setRegions(sortedRegions);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Viloyatlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDistricts = useCallback(async (viloyatId: string) => {
    try {
      setLoadingDistricts(true);
      const response = await apiService.getRegions({
        page: 1,
        limit: 1000,
        type: 'district',
        parent: viloyatId,
        status: 'active',
      });
      const sortedDistricts = [...response.data].sort((a, b) => 
        a.name.localeCompare(b.name, 'uz', { sensitivity: 'base' })
      );
      setDistricts(sortedDistricts);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Tumanlarni yuklashda xatolik');
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  useEffect(() => {
    if (selectedViloyat) {
      loadDistricts(selectedViloyat._id);
      setSelectedTuman(null);
    } else {
      setDistricts([]);
    }
  }, [selectedViloyat, loadDistricts]);

  const handleViloyatSelect = (viloyat: Region) => {
    setSelectedViloyat(viloyat);
    setSearchQuery('');
  };

  const handleTumanSelect = (tuman: Region | null) => {
    setSelectedTuman(tuman);
    setSearchQuery('');
  };

  const handleAddRegion = () => {
    if (!selectedViloyat) {
      Alert.alert('Xatolik', 'Viloyat tanlang');
      return;
    }

    const newRegion: SelectedRegion = {
      viloyat: selectedViloyat,
      tuman: selectedTuman,
    };

    const exists = selectedRegions.some(
      (r) =>
        r.viloyat._id === newRegion.viloyat._id &&
        (r.tuman?._id === newRegion.tuman?._id || (!r.tuman && !newRegion.tuman))
    );

    if (exists) {
      Alert.alert('Xatolik', 'Bu hudud allaqachon qo\'shilgan');
      return;
    }

    setSelectedRegions([...selectedRegions, newRegion]);
    setSelectedViloyat(null);
    setSelectedTuman(null);
    setDistricts([]);
    setActiveTab('selected');
  };

  const handleRemoveRegion = (index: number) => {
    setSelectedRegions(selectedRegions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (selectedRegions.length === 0) {
      Alert.alert('Ogohlantirish', 'Kamida bitta hudud tanlashingiz kerak');
      return;
    }

    const deliveryRegions: DeliveryRegion[] = selectedRegions.map((r) => ({
      viloyat: r.viloyat._id,
      tuman: r.tuman?._id || null,
    }));

    const returnPath = params?.returnPath || '/(tabs)/ombor/product/create';

    if (returnPath.includes('profile')) {
      try {
        await apiService.updateDeliveryRegions({ deliveryRegions });
        Alert.alert('Muvaffaqiyat', 'Yetkazib berish hududlari yangilandi', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } catch (error: any) {
        Alert.alert('Xatolik', error.message || 'Hududlarni saqlashda xatolik yuz berdi');
      }
    } else {
    router.push({
      pathname: returnPath as any,
      params: {
        selectedRegions: JSON.stringify(deliveryRegions),
      },
    });
    }
  };

  const filteredRegions = regions.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDistricts = districts.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Yetkazib berish hududlari</Text>
          <Text style={styles.headerSubtitle}>
            {selectedRegions.length > 0
              ? `${selectedRegions.length} ta hudud tanlangan`
              : 'Hududlarni tanlang'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveButton,
            selectedRegions.length === 0 && styles.saveButtonDisabled,
          ]}
          disabled={selectedRegions.length === 0}
        >
          <Text
            style={[
              styles.saveButtonText,
              selectedRegions.length === 0 && styles.saveButtonTextDisabled,
            ]}
          >
            Saqlash
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'regions' && styles.tabActive]}
          onPress={() => setActiveTab('regions')}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color={activeTab === 'regions' ? '#007AFF' : '#8E8E93'}
          />
          <Text
            style={[styles.tabText, activeTab === 'regions' && styles.tabTextActive]}
          >
            Hududlar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'selected' && styles.tabActive]}
          onPress={() => setActiveTab('selected')}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={activeTab === 'selected' ? '#007AFF' : '#8E8E93'}
          />
          <Text
            style={[styles.tabText, activeTab === 'selected' && styles.tabTextActive]}
          >
            Tanlangan ({selectedRegions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'selected' ? (
        /* Selected Regions Tab */
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {selectedRegions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>Hududlar tanlanmagan</Text>
              <Text style={styles.emptyStateText}>
                Yetkazib berish hududlarini tanlash uchun "Hududlar" bo'limiga o'ting
                  </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setActiveTab('regions')}
              >
                <Text style={styles.emptyStateButtonText}>Hududlarni tanlash</Text>
              </TouchableOpacity>
                </View>
          ) : (
            <>
              <View style={styles.selectedHeader}>
                <Text style={styles.selectedHeaderTitle}>
                  Tanlangan hududlar ({selectedRegions.length})
                </Text>
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={() => {
                    Alert.alert(
                      'Barchasini o\'chirish',
                      'Barcha tanlangan hududlarni o\'chirmoqchimisiz?',
                      [
                        { text: 'Bekor qilish', style: 'cancel' },
                        {
                          text: 'O\'chirish',
                          style: 'destructive',
                          onPress: () => setSelectedRegions([]),
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  <Text style={styles.clearAllText}>Barchasini o'chirish</Text>
                </TouchableOpacity>
              </View>

              {selectedRegions.map((region, index) => (
                <View key={index} style={styles.selectedCard}>
                  <View style={styles.selectedCardContent}>
                    <View style={styles.selectedCardIcon}>
                      <Ionicons name="location" size={24} color="#007AFF" />
                    </View>
                    <View style={styles.selectedCardInfo}>
                      <Text style={styles.selectedCardTitle}>{region.viloyat.name}</Text>
                      {region.tuman ? (
                        <Text style={styles.selectedCardSubtitle}>
                          {region.tuman.name}
                        </Text>
                      ) : (
                        <Text style={styles.selectedCardSubtitle}>Butun viloyat</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveRegion(index)}
                  style={styles.removeButton}
                >
                    <Ionicons name="close-circle" size={28} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
            </>
          )}
        </ScrollView>
      ) : (
        /* Regions Selection Tab */
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Modern Search Bar */}
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={22} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
              placeholder="Viloyat yoki tuman qidirish..."
              placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
                <Ionicons name="close-circle" size={22} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

          {/* Selected Region Preview */}
          {selectedViloyat && (
            <View style={styles.previewCard}>
              <View style={styles.previewCardHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                <Text style={styles.previewCardTitle}>Tanlangan hudud</Text>
              </View>
              <View style={styles.previewCardContent}>
                <View style={styles.previewItem}>
                  <Ionicons name="location" size={20} color="#007AFF" />
                  <Text style={styles.previewText}>{selectedViloyat.name}</Text>
                </View>
                {selectedTuman && (
                  <View style={styles.previewItem}>
                    <Ionicons name="location-outline" size={20} color="#8E8E93" />
                    <Text style={styles.previewText}>{selectedTuman.name}</Text>
                  </View>
                )}
                {!selectedTuman && districts.length > 0 && (
                  <View style={styles.previewItem}>
                    <Ionicons name="location-outline" size={20} color="#8E8E93" />
                    <Text style={styles.previewText}>Butun viloyat</Text>
                  </View>
                )}
              </View>
            </View>
          )}

        {/* Viloyat Selection */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="map-outline" size={22} color="#1A1A1A" />
          <Text style={styles.sectionTitle}>Viloyat tanlash</Text>
            </View>
          {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : filteredRegions.length === 0 ? (
              <View style={styles.emptyList}>
                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyListText}>Hech narsa topilmadi</Text>
              </View>
            ) : (
              <View style={styles.regionsGrid}>
                {filteredRegions.map((item) => (
                <TouchableOpacity
                    key={item._id}
                  style={[
                      styles.regionCard,
                      selectedViloyat?._id === item._id && styles.regionCardSelected,
                  ]}
                  onPress={() => handleViloyatSelect(item)}
                >
                    <Ionicons
                      name={selectedViloyat?._id === item._id ? 'checkmark-circle' : 'location-outline'}
                      size={24}
                      color={selectedViloyat?._id === item._id ? '#007AFF' : '#8E8E93'}
                    />
                  <Text
                    style={[
                        styles.regionCardText,
                        selectedViloyat?._id === item._id && styles.regionCardTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
                ))}
              </View>
          )}
        </View>

        {/* Tuman Selection */}
        {selectedViloyat && (
          <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={22} color="#1A1A1A" />
            <Text style={styles.sectionTitle}>Tuman tanlash (ixtiyoriy)</Text>
              </View>
            {loadingDistricts ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : districts.length > 0 ? (
              <>
                <TouchableOpacity
                    style={[
                      styles.districtOption,
                      selectedTuman === null && styles.districtOptionSelected,
                    ]}
                    onPress={() => handleTumanSelect(null)}
                  >
                    <Ionicons
                      name={selectedTuman === null ? 'checkmark-circle' : 'radio-button-off-outline'}
                      size={22}
                      color={selectedTuman === null ? '#007AFF' : '#8E8E93'}
                    />
                    <Text
                      style={[
                        styles.districtOptionText,
                        selectedTuman === null && styles.districtOptionTextSelected,
                      ]}
                    >
                      Butun viloyat
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.districtsList}>
                    {filteredDistricts.map((item) => (
                      <TouchableOpacity
                        key={item._id}
                        style={[
                          styles.districtOption,
                          selectedTuman?._id === item._id && styles.districtOptionSelected,
                        ]}
                        onPress={() => handleTumanSelect(item)}
                      >
                        <Ionicons
                          name={selectedTuman?._id === item._id ? 'checkmark-circle' : 'radio-button-off-outline'}
                          size={22}
                          color={selectedTuman?._id === item._id ? '#007AFF' : '#8E8E93'}
                        />
                        <Text
                          style={[
                            styles.districtOptionText,
                            selectedTuman?._id === item._id && styles.districtOptionTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                    ))}
                  </View>
              </>
            ) : (
                <View style={styles.emptyList}>
                  <Ionicons name="information-circle-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyListText}>
                Bu viloyat uchun tumanlar mavjud emas
              </Text>
                </View>
            )}
          </View>
        )}

        {/* Add Button */}
        {selectedViloyat && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddRegion}>
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Qo'shish</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5EA',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: '#8E8E93',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  searchClear: {
    marginLeft: 8,
    padding: 4,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  previewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  previewCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  previewCardContent: {
    gap: 8,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  loaderContainer: {
    padding: 40,
    alignItems: 'center',
  },
  regionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  regionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 8,
  },
  regionCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  regionCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  regionCardTextSelected: {
    color: '#007AFF',
  },
  districtOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    gap: 12,
  },
  districtOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  districtOptionText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
  },
  districtOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  districtsList: {
    marginTop: 8,
  },
  emptyList: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyListText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 12,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 8,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },
  clearAllText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  selectedCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCardInfo: {
    flex: 1,
  },
  selectedCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  selectedCardSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
