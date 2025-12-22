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
  const [mfys, setMfys] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);
  const [selectedViloyat, setSelectedViloyat] = useState<Region | null>(null);
  const [selectedTuman, setSelectedTuman] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingMfys, setLoadingMfys] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load initial selected regions from params
  useEffect(() => {
    if (params?.selectedRegions) {
      try {
        const parsed: DeliveryRegion[] = JSON.parse(params.selectedRegions);
        // Convert DeliveryRegion[] to SelectedRegion[] format
        // We'll need to load full region objects
        loadInitialRegions(parsed);
      } catch (e) {
        console.error('Error parsing selected regions:', e);
      }
    }
  }, [params?.selectedRegions]);

  const loadInitialRegions = async (deliveryRegions: DeliveryRegion[]) => {
    // This is a simplified version - in production you'd want to load full region objects
    // For now, we'll just store the IDs and load them when needed
  };

  const loadRegions = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(!append);
      const response = await apiService.getRegions({
        page: pageNum,
        limit: 1000,
        type: 'region',
        status: 'active',
      });

      // Sort regions alphabetically by name
      const sortedRegions = [...response.data].sort((a, b) => 
        a.name.localeCompare(b.name, 'uz', { sensitivity: 'base' })
      );

      if (append) {
        setRegions((prev) => {
          const combined = [...prev, ...sortedRegions];
          return combined.sort((a, b) => 
            a.name.localeCompare(b.name, 'uz', { sensitivity: 'base' })
          );
        });
      } else {
        setRegions(sortedRegions);
      }

      setHasMore(response.data.length === 1000);
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
      // Sort districts alphabetically by name
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

  const loadMfys = useCallback(async (tumanId: string) => {
    try {
      setLoadingMfys(true);
      const response = await apiService.getRegions({
        page: 1,
        limit: 1000,
        type: 'mfy',
        parent: tumanId,
        status: 'active',
      });
      setMfys(response.data);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'MFYlarni yuklashda xatolik');
    } finally {
      setLoadingMfys(false);
    }
  }, []);

  useEffect(() => {
    loadRegions(1);
  }, [loadRegions]);

  useEffect(() => {
    if (selectedViloyat) {
      loadDistricts(selectedViloyat._id);
      setSelectedTuman(null);
      setMfys([]);
    } else {
      setDistricts([]);
      setMfys([]);
    }
  }, [selectedViloyat, loadDistricts]);

  useEffect(() => {
    if (selectedTuman) {
      loadMfys(selectedTuman._id);
    } else {
      setMfys([]);
    }
  }, [selectedTuman, loadMfys]);

  const handleViloyatSelect = (viloyat: Region) => {
    setSelectedViloyat(viloyat);
    setSearchQuery('');
  };

  const handleTumanSelect = (tuman: Region) => {
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

    // Check if already exists
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
    setMfys([]);
  };

  const handleRemoveRegion = (index: number) => {
    setSelectedRegions(selectedRegions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const deliveryRegions: DeliveryRegion[] = selectedRegions.map((r) => ({
      viloyat: r.viloyat._id,
      tuman: r.tuman?._id || null,
    }));

    const returnPath = params?.returnPath || '/(tabs)/ombor/product/create';
    router.push({
      pathname: returnPath as any,
      params: {
        selectedRegions: JSON.stringify(deliveryRegions),
      },
    });
  };

  // Filter and sort regions alphabetically
  const filteredRegions = regions
    .filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'uz', { sensitivity: 'base' }));

  // Filter and sort districts alphabetically
  const filteredDistricts = districts
    .filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'uz', { sensitivity: 'base' }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hududlarni tanlash</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Saqlash</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Selected Regions */}
        {selectedRegions.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.sectionTitle}>Tanlangan hududlar</Text>
            {selectedRegions.map((region, index) => (
              <View key={index} style={styles.selectedRegionCard}>
                <View style={styles.selectedRegionInfo}>
                  <Ionicons name="location" size={20} color="#007AFF" />
                  <Text style={styles.selectedRegionText}>
                    {region.viloyat.name}
                    {region.tuman && `, ${region.tuman.name}`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveRegion(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Qidirish..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Viloyat Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Viloyat tanlash</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          ) : (
            <FlatList
              data={filteredRegions}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.regionItem,
                    selectedViloyat?._id === item._id && styles.regionItemSelected,
                  ]}
                  onPress={() => handleViloyatSelect(item)}
                >
                  <Text
                    style={[
                      styles.regionItemText,
                      selectedViloyat?._id === item._id && styles.regionItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedViloyat?._id === item._id && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Tuman Selection */}
        {selectedViloyat && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tuman tanlash (ixtiyoriy)</Text>
            {loadingDistricts ? (
              <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            ) : districts.length > 0 ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.regionItem,
                    selectedTuman === null && styles.regionItemSelected,
                  ]}
                  onPress={() => setSelectedTuman(null)}
                >
                  <Text
                    style={[
                      styles.regionItemText,
                      selectedTuman === null && styles.regionItemTextSelected,
                    ]}
                  >
                    Tuman tanlamaslik
                  </Text>
                  {selectedTuman === null && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
                <FlatList
                  data={filteredDistricts}
                  keyExtractor={(item) => item._id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.regionItem,
                        selectedTuman?._id === item._id && styles.regionItemSelected,
                      ]}
                      onPress={() => handleTumanSelect(item)}
                    >
                      <Text
                        style={[
                          styles.regionItemText,
                          selectedTuman?._id === item._id && styles.regionItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {selectedTuman?._id === item._id && (
                        <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </>
            ) : (
              <Text style={styles.noDistrictsText}>
                Bu viloyat uchun tumanlar mavjud emas
              </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDED',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  selectedSection: {
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  selectedRegionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  selectedRegionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedRegionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  regionItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  regionItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  regionItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  loader: {
    padding: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  noDistrictsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

