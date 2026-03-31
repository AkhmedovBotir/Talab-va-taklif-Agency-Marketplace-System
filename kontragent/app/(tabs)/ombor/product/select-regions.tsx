import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useSnackbar } from '../../../../components/AppSnackbar';
import {
  apiService,
  Region,
  DeliveryRegion,
  ContragentAreaRegion,
  ContragentAreaDistrict,
} from '../../../../services/api';

interface SelectedRegion {
  viloyat: Region;
  tuman: Region | null;
}

export default function SelectRegionsScreen() {
  const params = useLocalSearchParams<{
    selectedRegions?: string;
    returnPath?: string;
    deliveryApiVersion?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { show: showSnackbar } = useSnackbar();
  const useV1Delivery = params.deliveryApiVersion === 'v1';

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);
  const [selectedViloyat, setSelectedViloyat] = useState<Region | null>(null);
  const [selectedTuman, setSelectedTuman] = useState<Region | null>(null);
  const [v1Regions, setV1Regions] = useState<ContragentAreaRegion[]>([]);
  const [v1Districts, setV1Districts] = useState<ContragentAreaDistrict[]>([]);
  const [v1Selected, setV1Selected] = useState<
    Array<{ region: ContragentAreaRegion; district: ContragentAreaDistrict }>
  >([]);
  const [selV1Region, setSelV1Region] = useState<ContragentAreaRegion | null>(null);
  const [selV1District, setSelV1District] = useState<ContragentAreaDistrict | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'regions' | 'selected'>('regions');
  const v1DistrictRequestGen = useRef(0);

  const selectedCount = useV1Delivery ? v1Selected.length : selectedRegions.length;

  // Load initial selected regions from params (legacy mahsulot oqimi)
  useEffect(() => {
    if (useV1Delivery || !params?.selectedRegions) return;
    try {
      const parsed: DeliveryRegion[] = JSON.parse(params.selectedRegions);
      loadInitialRegions(parsed);
    } catch {
      // Ignore parsing errors
    }
  }, [params?.selectedRegions, useV1Delivery]);

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

  const loadV1RegionsList = useCallback(async () => {
    try {
      setLoading(true);
      const list = await apiService.getContragentRegions();
      setV1Regions(
        [...list].sort((a, b) =>
          a.name.localeCompare(b.name, 'uz', { sensitivity: 'base' })
        )
      );
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Viloyatlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadV1DistrictsList = useCallback(async (regionId: number) => {
    if (!Number.isFinite(regionId)) {
      setV1Districts([]);
      setLoadingDistricts(false);
      return;
    }
    const gen = ++v1DistrictRequestGen.current;
    try {
      setLoadingDistricts(true);
      const list = await apiService.getContragentDistricts(regionId);
      if (gen !== v1DistrictRequestGen.current) return;
      setV1Districts(
        [...list].sort((a, b) =>
          a.name.localeCompare(b.name, 'uz', { sensitivity: 'base' })
        )
      );
    } catch (error: any) {
      if (gen === v1DistrictRequestGen.current) {
        Alert.alert('Xatolik', error.message || 'Tumanlarni yuklashda xatolik');
        setV1Districts([]);
      }
    } finally {
      if (gen === v1DistrictRequestGen.current) {
        setLoadingDistricts(false);
      }
    }
  }, []);

  const loadV1InitialSelection = useCallback(async () => {
    try {
      const { data } = await apiService.getContragentDeliveryAreas();
      const rows = await apiService.resolveContragentDeliveryAreaRows(data);
      setV1Selected(
        rows.map((r) => ({
          region: { id: r.regionId, name: r.regionName },
          district: {
            id: r.districtId,
            name: r.districtName,
            region_id: r.regionId,
          },
        }))
      );
    } catch {
      setV1Selected([]);
    }
  }, []);

  useEffect(() => {
    if (useV1Delivery) {
      loadV1RegionsList();
      loadV1InitialSelection();
    } else {
      loadRegions();
    }
  }, [useV1Delivery, loadV1RegionsList, loadV1InitialSelection, loadRegions]);

  useEffect(() => {
    if (useV1Delivery) return;
    if (selectedViloyat) {
      loadDistricts(selectedViloyat._id);
      setSelectedTuman(null);
    } else {
      setDistricts([]);
    }
  }, [useV1Delivery, selectedViloyat, loadDistricts]);

  useEffect(() => {
    if (!useV1Delivery) return;
    if (selV1Region) {
      loadV1DistrictsList(selV1Region.id);
      setSelV1District(null);
    } else {
      setV1Districts([]);
    }
  }, [useV1Delivery, selV1Region, loadV1DistrictsList]);

  const handleViloyatSelect = (viloyat: Region) => {
    setSelectedViloyat(viloyat);
    setSearchQuery('');
  };

  const handleTumanSelect = (tuman: Region | null) => {
    setSelectedTuman(tuman);
    setSearchQuery('');
  };

  const handleV1RegionSelect = (r: ContragentAreaRegion) => {
    setSelV1Region(r);
    setSearchQuery('');
  };

  const handleV1DistrictSelect = (d: ContragentAreaDistrict) => {
    setSelV1District(d);
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

  const handleAddV1Region = () => {
    if (!selV1Region) {
      Alert.alert('Xatolik', 'Viloyat tanlang');
      return;
    }
    if (!selV1District) {
      Alert.alert('Xatolik', 'Tuman tanlash majburiy');
      return;
    }
    const exists = v1Selected.some(
      (p) => p.region.id === selV1Region.id && p.district.id === selV1District.id
    );
    if (exists) {
      Alert.alert('Xatolik', 'Bu hudud allaqachon qo\'shilgan');
      return;
    }
    setV1Selected([
      ...v1Selected,
      { region: selV1Region, district: selV1District },
    ]);
    setSelV1Region(null);
    setSelV1District(null);
    setV1Districts([]);
    setActiveTab('selected');
  };

  const handleRemoveAt = (index: number) => {
    if (useV1Delivery) {
      setV1Selected(v1Selected.filter((_, i) => i !== index));
    } else {
      setSelectedRegions(selectedRegions.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (useV1Delivery) {
      if (v1Selected.length === 0) {
        Alert.alert('Ogohlantirish', 'Kamida bitta hudud tanlashingiz kerak');
        return;
      }
      const region_ids = [...new Set(v1Selected.map((p) => p.region.id))];
      const district_ids = v1Selected.map((p) => p.district.id);
      const returnPath = params?.returnPath || '/(tabs)/ombor/product/create';
      if (!returnPath.includes('profile')) {
        Alert.alert(
          'Xatolik',
          'v1 yetkazib berish hududlari hozircha faqat profildan boshqariladi'
        );
        return;
      }
      try {
        const res = await apiService.putContragentDeliveryAreas({
          region_ids,
          district_ids,
        });
        showSnackbar(res.message || 'Yetkazib berish hududlari yangilandi', {
          title: 'Muvaffaqiyatli',
          variant: 'success',
        });
        router.back();
      } catch (error: any) {
        Alert.alert('Xatolik', error.message || 'Hududlarni saqlashda xatolik yuz berdi');
      }
      return;
    }

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

  const filteredV1Regions = v1Regions.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredV1Districts = v1Districts.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isV1DistrictAlreadyPicked = (regionId: number, districtId: number) =>
    v1Selected.some(
      (p) => p.region.id === regionId && p.district.id === districtId
    );

  const isLegacyDistrictPairTaken = (viloyat: Region, tuman: Region | null) =>
    selectedRegions.some(
      (r) =>
        r.viloyat._id === viloyat._id &&
        (tuman ? r.tuman?._id === tuman._id : !r.tuman)
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
            {selectedCount > 0
              ? `${selectedCount} ta hudud tanlangan`
              : 'Hududlarni tanlang'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveButton,
            selectedCount === 0 && styles.saveButtonDisabled,
          ]}
          disabled={selectedCount === 0}
        >
          <Text
            style={[
              styles.saveButtonText,
              selectedCount === 0 && styles.saveButtonTextDisabled,
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
            Tanlangan ({selectedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'selected' ? (
        /* Selected Regions Tab */
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {selectedCount === 0 ? (
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
                  Tanlangan hududlar ({selectedCount})
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
                          onPress: () =>
                            useV1Delivery ? setV1Selected([]) : setSelectedRegions([]),
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  <Text style={styles.clearAllText}>Barchasini o'chirish</Text>
                </TouchableOpacity>
              </View>

              {useV1Delivery
                ? v1Selected.map((pair, index) => (
                    <View
                      key={`${pair.region.id}-${pair.district.id}-${index}`}
                      style={styles.selectedCard}
                    >
                      <View style={styles.selectedCardContent}>
                        <View style={styles.selectedCardIcon}>
                          <Ionicons name="location" size={24} color="#007AFF" />
                        </View>
                        <View style={styles.selectedCardInfo}>
                          <Text style={styles.selectedCardTitle}>{pair.region.name}</Text>
                          <Text style={styles.selectedCardSubtitle}>{pair.district.name}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveAt(index)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close-circle" size={28} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))
                : selectedRegions.map((region, index) => (
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
                        onPress={() => handleRemoveAt(index)}
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

          {useV1Delivery ? (
            <>
              {/* Selected Region Preview (v1) */}
              {selV1Region && (
                <View style={styles.previewCard}>
                  <View style={styles.previewCardHeader}>
                    <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                    <Text style={styles.previewCardTitle}>Tanlangan hudud</Text>
                  </View>
                  <View style={styles.previewCardContent}>
                    <View style={styles.previewItem}>
                      <Ionicons name="location" size={20} color="#007AFF" />
                      <Text style={styles.previewText}>{selV1Region.name}</Text>
                    </View>
                    {selV1District && (
                      <View style={styles.previewItem}>
                        <Ionicons name="location-outline" size={20} color="#8E8E93" />
                        <Text style={styles.previewText}>{selV1District.name}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="map-outline" size={22} color="#1A1A1A" />
                  <Text style={styles.sectionTitle}>Viloyat tanlash</Text>
                </View>
                {loading ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                  </View>
                ) : filteredV1Regions.length === 0 ? (
                  <View style={styles.emptyList}>
                    <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyListText}>Hech narsa topilmadi</Text>
                  </View>
                ) : (
                  <View style={styles.regionsGrid}>
                    {filteredV1Regions.map((item) => (
                      <TouchableOpacity
                        key={String(item.id)}
                        style={[
                          styles.regionCard,
                          selV1Region?.id === item.id && styles.regionCardSelected,
                        ]}
                        onPress={() => handleV1RegionSelect(item)}
                      >
                        <Ionicons
                          name={
                            selV1Region?.id === item.id
                              ? 'checkmark-circle'
                              : 'location-outline'
                          }
                          size={24}
                          color={selV1Region?.id === item.id ? '#007AFF' : '#8E8E93'}
                        />
                        <Text
                          style={[
                            styles.regionCardText,
                            selV1Region?.id === item.id && styles.regionCardTextSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {selV1Region && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="location-outline" size={22} color="#1A1A1A" />
                    <Text style={styles.sectionTitle}>Tuman tanlash (majburiy)</Text>
                  </View>
                  {loadingDistricts ? (
                    <View style={styles.loaderContainer}>
                      <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                  ) : v1Districts.length > 0 ? (
                    <View style={styles.districtsList}>
                      {filteredV1Districts.map((item) => {
                        const picked =
                          !!selV1Region &&
                          isV1DistrictAlreadyPicked(selV1Region.id, item.id);
                        const activePick = !picked && selV1District?.id === item.id;
                        return (
                          <TouchableOpacity
                            key={String(item.id)}
                            disabled={picked}
                            style={[
                              styles.districtOption,
                              picked && styles.districtOptionDisabled,
                              activePick && styles.districtOptionSelected,
                            ]}
                            onPress={() => {
                              if (picked) return;
                              handleV1DistrictSelect(item);
                            }}
                          >
                            <Ionicons
                              name={
                                picked
                                  ? 'checkmark-done'
                                  : activePick
                                    ? 'checkmark-circle'
                                    : 'radio-button-off-outline'
                              }
                              size={22}
                              color={
                                picked
                                  ? '#C7C7CC'
                                  : activePick
                                    ? '#007AFF'
                                    : '#8E8E93'
                              }
                            />
                            <Text
                              style={[
                                styles.districtOptionText,
                                activePick && styles.districtOptionTextSelected,
                                picked && styles.districtOptionTextDisabled,
                              ]}
                            >
                              {item.name}
                              {picked ? ' · tanlangan' : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
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

              {selV1Region && (
                <TouchableOpacity style={styles.addButton} onPress={handleAddV1Region}>
                  <Ionicons name="add-circle" size={24} color="#fff" />
                  <Text style={styles.addButtonText}>Qo'shish</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
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
                          name={
                            selectedViloyat?._id === item._id
                              ? 'checkmark-circle'
                              : 'location-outline'
                          }
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
                      {(() => {
                        const wholeTaken = selectedViloyat
                          ? isLegacyDistrictPairTaken(selectedViloyat, null)
                          : false;
                        const wholeActive =
                          !wholeTaken && selectedTuman === null;
                        return (
                          <TouchableOpacity
                            disabled={wholeTaken}
                            style={[
                              styles.districtOption,
                              wholeTaken && styles.districtOptionDisabled,
                              wholeActive && styles.districtOptionSelected,
                            ]}
                            onPress={() => {
                              if (wholeTaken) return;
                              handleTumanSelect(null);
                            }}
                          >
                            <Ionicons
                              name={
                                wholeTaken
                                  ? 'checkmark-done'
                                  : wholeActive
                                    ? 'checkmark-circle'
                                    : 'radio-button-off-outline'
                              }
                              size={22}
                              color={
                                wholeTaken
                                  ? '#C7C7CC'
                                  : wholeActive
                                    ? '#007AFF'
                                    : '#8E8E93'
                              }
                            />
                            <Text
                              style={[
                                styles.districtOptionText,
                                wholeActive && styles.districtOptionTextSelected,
                                wholeTaken && styles.districtOptionTextDisabled,
                              ]}
                            >
                              Butun viloyat
                              {wholeTaken ? ' · tanlangan' : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })()}
                      <View style={styles.districtsList}>
                        {filteredDistricts.map((item) => {
                          const taken = selectedViloyat
                            ? isLegacyDistrictPairTaken(selectedViloyat, item)
                            : false;
                          const activePick =
                            !taken && selectedTuman?._id === item._id;
                          return (
                            <TouchableOpacity
                              key={item._id}
                              disabled={taken}
                              style={[
                                styles.districtOption,
                                taken && styles.districtOptionDisabled,
                                activePick && styles.districtOptionSelected,
                              ]}
                              onPress={() => {
                                if (taken) return;
                                handleTumanSelect(item);
                              }}
                            >
                              <Ionicons
                                name={
                                  taken
                                    ? 'checkmark-done'
                                    : activePick
                                      ? 'checkmark-circle'
                                      : 'radio-button-off-outline'
                                }
                                size={22}
                                color={
                                  taken
                                    ? '#C7C7CC'
                                    : activePick
                                      ? '#007AFF'
                                      : '#8E8E93'
                                }
                              />
                              <Text
                                style={[
                                  styles.districtOptionText,
                                  activePick && styles.districtOptionTextSelected,
                                  taken && styles.districtOptionTextDisabled,
                                ]}
                              >
                                {item.name}
                                {taken ? ' · tanlangan' : ''}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
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
            </>
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
  districtOptionDisabled: {
    opacity: 0.72,
    backgroundColor: '#F5F5F7',
    borderColor: '#E5E5EA',
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
  districtOptionTextDisabled: {
    color: '#8E8E93',
    fontWeight: '400',
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
