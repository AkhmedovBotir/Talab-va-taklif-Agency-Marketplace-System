import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import RegionPicker from './ui/RegionPicker';
import { Region } from '../services/api';
import apiService from '../services/api';

interface LocationSelectorProps {
  show?: boolean;
  autoOpen?: boolean; // Auto open modal if location not set
}

export default function LocationSelector({ show = true, autoOpen = false }: LocationSelectorProps) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token } = useAuth();
  const { selectedViloyat, selectedTuman, selectedMfy, setSelectedViloyat, setSelectedTuman, setSelectedMfy } = useLocation();
  const { showError } = useSnackbar();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [tempViloyat, setTempViloyat] = useState<Region | null>(null);
  const [tempTuman, setTempTuman] = useState<Region | null>(null);
  const [tempMfy, setTempMfy] = useState<Region | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasCheckedLocation, setHasCheckedLocation] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  
  // Animation values
  const highlightOpacity = useRef(new Animated.Value(0)).current;
  const highlightScale = useRef(new Animated.Value(0.9)).current;
  const alertOpacity = useRef(new Animated.Value(0)).current;
  const alertScale = useRef(new Animated.Value(0.8)).current;

  // Load user's saved location from API
  useEffect(() => {
    const loadUserLocation = async () => {
      if (!isAuthenticated || !token) {
        setHasCheckedLocation(true);
        return;
      }

      try {
        setLoading(true);
        const response = await apiService.getViloyatTuman(token);
        
        if (response.success && response.data) {
          // Update location from API response
          // API dan kelgan ma'lumotlar to'g'ri formatda bo'lishi kerak
          if (response.data.viloyat && typeof response.data.viloyat === 'object') {
            setSelectedViloyat(response.data.viloyat);
          } else {
            setSelectedViloyat(null);
          }
          
          if (response.data.tuman && typeof response.data.tuman === 'object') {
            setSelectedTuman(response.data.tuman);
          } else {
            setSelectedTuman(null);
          }
          
          if (response.data.mfy && typeof response.data.mfy === 'object') {
            setSelectedMfy(response.data.mfy);
          } else {
            setSelectedMfy(null);
          }
        }
      } catch (error: any) {
        console.error('Error loading user location:', error);
        // If error, don't update location - keep current state
      } finally {
        setLoading(false);
        setHasCheckedLocation(true);
      }
    };

    loadUserLocation();
  }, [isAuthenticated, token]);

  // Update temp values when modal opens and location is loaded
  useEffect(() => {
    if (locationModalVisible) {
      // Set temp values from current selected location when modal opens
      setTempViloyat(selectedViloyat);
      setTempTuman(selectedTuman);
      setTempMfy(selectedMfy);
    }
  }, [locationModalVisible, selectedViloyat, selectedTuman, selectedMfy]);

  // Show highlight alert for new users
  useEffect(() => {
    if (hasCheckedLocation && !loading && !selectedViloyat && !selectedTuman && !showHighlight && !locationModalVisible) {
      // Small delay to ensure screen is loaded
      const timer = setTimeout(() => {
        setShowHighlight(true);
        // Animate alert in
        Animated.parallel([
          Animated.timing(alertOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(alertScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Animate highlight pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(highlightOpacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(highlightOpacity, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasCheckedLocation, loading, selectedViloyat, selectedTuman, showHighlight, locationModalVisible]);

  // Auto open modal if location not set (after highlight is dismissed)
  useEffect(() => {
    if (autoOpen && hasCheckedLocation && !loading && !selectedViloyat && !selectedTuman && !locationModalVisible && !showHighlight) {
      // Small delay to ensure screen is loaded
      const timer = setTimeout(() => {
        setLocationModalVisible(true);
        // Initialize temp values when auto opening
        setTempViloyat(null);
        setTempTuman(null);
        setTempMfy(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoOpen, hasCheckedLocation, loading, selectedViloyat, selectedTuman, locationModalVisible, showHighlight]);

  const handleLocationPress = () => {
    // Hide highlight if visible
    if (showHighlight) {
      handleDismissHighlight();
    }
    // Use current selected values from context
    // These values come from API (GET /api/marketplace/me/viloyat-tuman)
    setTempViloyat(selectedViloyat);
    setTempTuman(selectedTuman);
    setTempMfy(selectedMfy);
    setLocationModalVisible(true);
  };

  const handleDismissHighlight = () => {
    // Animate alert out
    Animated.parallel([
      Animated.timing(alertOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(alertScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowHighlight(false);
      highlightOpacity.setValue(0);
      highlightScale.setValue(0.9);
    });
  };

  const handleViloyatSelect = (region: Region) => {
    setTempViloyat(region);
    setTempTuman(null); // Clear tuman when viloyat changes
    setTempMfy(null); // Clear mfy when viloyat changes
  };

  const handleTumanSelect = (region: Region) => {
    setTempTuman(region);
    setTempMfy(null); // Clear mfy when tuman changes
  };

  const handleMfySelect = (region: Region) => {
    setTempMfy(region);
  };

  const handleSave = async () => {
    if (!tempViloyat || !tempTuman) {
      showError('Iltimos, viloyat va tumanni tanlang');
      return;
    }

    setSaving(true);
    try {
      // Save to API if authenticated
      if (isAuthenticated && token) {
        try {
          const requestData: {
            viloyat: string;
            tuman: string;
            mfy?: string | null;
          } = {
            viloyat: tempViloyat._id,
            tuman: tempTuman._id,
          };
          
          // Add mfy if selected
          if (tempMfy) {
            requestData.mfy = tempMfy._id;
          } else {
            requestData.mfy = null;
          }
          
          const response = await apiService.updateViloyatTuman(
            requestData,
            token
          );

          if (response.success && response.data) {
            // Update location in context from API response
            // API dan kelgan ma'lumotlar to'g'ri formatda bo'lishi kerak
            if (response.data.viloyat && typeof response.data.viloyat === 'object') {
              setSelectedViloyat(response.data.viloyat);
            } else {
              setSelectedViloyat(null);
            }
            if (response.data.tuman && typeof response.data.tuman === 'object') {
              setSelectedTuman(response.data.tuman);
            } else {
              setSelectedTuman(null);
            }
            if (response.data.mfy && typeof response.data.mfy === 'object') {
              setSelectedMfy(response.data.mfy);
            } else {
              setSelectedMfy(null);
            }
          }
        } catch (error: any) {
          console.error('Error saving location to API:', error);
          console.error('PATCH /api/marketplace/me/viloyat-tuman Error Response:', error);
          // Update location in context locally even if API fails
          setSelectedViloyat(tempViloyat);
          setSelectedTuman(tempTuman);
          setSelectedMfy(tempMfy);
          
          // Show error to user
          showError(error.message || 'Hududni saqlashda xatolik yuz berdi. Hudud mahalliy saqlandi.');
          setLocationModalVisible(false);
          setSaving(false);
          return;
        }
      } else {
        // Update location in context if not authenticated
        setSelectedViloyat(tempViloyat);
        setSelectedTuman(tempTuman);
        setSelectedMfy(tempMfy);
      }

      setLocationModalVisible(false);
    } catch (error: any) {
      console.error('Error in handleSave:', error);
      showError(error.message || 'Hududni saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setTempViloyat(null);
    setTempTuman(null);
    setTempMfy(null);
    setSelectedViloyat(null);
    setSelectedTuman(null);
    setSelectedMfy(null);
    
    // Clear from API if authenticated
    if (isAuthenticated && token) {
      try {
        const requestData = {
          viloyat: null,
          tuman: null,
          mfy: null,
        };
        
        const response = await apiService.updateViloyatTuman(
          requestData,
          token
        );
      } catch (error: any) {
        console.error('Error clearing location from API:', error);
        console.error('PATCH /api/marketplace/me/viloyat-tuman (Clear) Error Response:', error);
        // Don't show error, location is cleared locally
      }
    }
    
    setLocationModalVisible(false);
  };

  const getLocationText = () => {
    if (selectedMfy && selectedTuman && selectedViloyat) {
      return `${selectedViloyat.name}, ${selectedTuman.name}, ${selectedMfy.name}`;
    }
    if (selectedTuman && selectedViloyat) {
      return `${selectedViloyat.name}, ${selectedTuman.name}`;
    }
    if (selectedViloyat) {
      return selectedViloyat.name;
    }
    return 'Hududni tanlang';
  };

  if (!show) return null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.locationSelectorWrapper}>
        {/* Highlight overlay for new users */}
        {showHighlight && (
          <Animated.View
            style={[
              styles.highlightOverlay,
              {
                opacity: highlightOpacity,
                transform: [{ scale: highlightScale }],
              },
            ]}
            pointerEvents="none"
          />
        )}
        
      <TouchableOpacity
          style={[
            styles.locationSelector,
            showHighlight && styles.locationSelectorHighlighted,
          ]}
        onPress={handleLocationPress}
        activeOpacity={0.7}
      >
        <View style={styles.locationIconContainer}>
          <Ionicons name="location" size={20} color="#007AFF" />
        </View>
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationLabel}>Yetkazib berish hududi</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {getLocationText()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
      </View>

      {/* Alert-style explanation for new users */}
      {showHighlight && (
        <Animated.View
          style={[
            styles.alertContainer,
            {
              opacity: alertOpacity,
              transform: [{ scale: alertScale }],
            },
          ]}
        >
          <View style={styles.alertContent}>
            <View style={styles.alertHeader}>
              <View style={styles.alertIconContainer}>
                <Ionicons name="information-circle" size={24} color="#007AFF" />
              </View>
              <TouchableOpacity
                onPress={handleDismissHighlight}
                style={styles.alertCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.alertTitle}>Yetkazib berish hududini tanlang</Text>
            <Text style={styles.alertMessage}>
              Mahsulotlarni ko'rish va buyurtma berish uchun yetkazib berish hududini tanlashingiz kerak. Yuqoridagi tugmani bosing va viloyat va tumanni tanlang.
            </Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={handleLocationPress}
              activeOpacity={0.8}
            >
              <Ionicons name="location" size={18} color="#fff" />
              <Text style={styles.alertButtonText}>Hududni tanlash</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <Modal
        visible={locationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
            {/* Drag Indicator */}
            <View style={styles.dragIndicator} />
            
            {/* Header */}
          <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="location" size={20} color="#007AFF" />
                </View>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Yetkazib berish hududini tanlang</Text>
                  <Text style={styles.modalSubtitle}>
                    Tanlangan hududga qarab mahsulotlar ko'rsatiladi
                  </Text>
                </View>
              </View>
            <TouchableOpacity
                onPress={() => setLocationModalVisible(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={24} color="#999" />
            </TouchableOpacity>
          </View>

            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Info Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Qanday tanlash kerak?</Text>
                  <Text style={styles.infoDescription}>
                    Avval viloyatni, keyin tumanni, so'ng MFY ni tanlang. Tanlangan hududga qarab faqat sizning hududingizga yetkazib beriladigan mahsulotlar ko'rsatiladi.
              </Text>
                </View>
            </View>
            
              {/* Viloyat Selector Card */}
              <View style={styles.selectorCard}>
                <View style={styles.selectorCardHeader}>
                  <View style={styles.selectorIconContainer}>
                    <Ionicons name="map" size={18} color="#007AFF" />
                  </View>
                  <Text style={styles.selectorCardTitle}>Viloyat</Text>
                </View>
                <View style={styles.regionPickerWrapper}>
            <RegionPicker
                    label=""
                    value={tempViloyat?._id || ''}
              type="region"
              onSelect={handleViloyatSelect}
                    displayValue={tempViloyat?.name}
                  />
                </View>
              </View>

              {/* Tuman Selector Card */}
              <View style={[styles.selectorCard, !tempViloyat && styles.selectorCardDisabled]}>
                <View style={styles.selectorCardHeader}>
                  <View style={styles.selectorIconContainer}>
                    <Ionicons name="location" size={18} color={tempViloyat ? "#007AFF" : "#ccc"} />
                  </View>
                  <Text style={[styles.selectorCardTitle, !tempViloyat && styles.selectorCardTitleDisabled]}>
                    Tuman
                  </Text>
                  {!tempViloyat && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredBadgeText}>Viloyat tanlang</Text>
                    </View>
                  )}
                </View>
                <View style={styles.regionPickerWrapper}>
            <RegionPicker
                    label=""
                    value={tempTuman?._id || ''}
              type="district"
                    parentId={tempViloyat?._id}
              onSelect={handleTumanSelect}
                    displayValue={tempTuman?.name}
                    disabled={!tempViloyat}
            />
                </View>
              </View>

              {/* MFY Selector Card */}
              <View style={[styles.selectorCard, (!tempViloyat || !tempTuman) && styles.selectorCardDisabled]}>
                <View style={styles.selectorCardHeader}>
                  <View style={styles.selectorIconContainer}>
                    <Ionicons name="home" size={18} color={(tempViloyat && tempTuman) ? "#007AFF" : "#ccc"} />
                  </View>
                  <Text style={[styles.selectorCardTitle, (!tempViloyat || !tempTuman) && styles.selectorCardTitleDisabled]}>
                    MFY
                  </Text>
                  {(!tempViloyat || !tempTuman) && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredBadgeText}>
                        {!tempViloyat ? 'Viloyat tanlang' : 'Tuman tanlang'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.regionPickerWrapper}>
            <RegionPicker
                    label=""
                    value={tempMfy?._id || ''}
              type="mfy"
                    parentId={tempTuman?._id}
              onSelect={handleMfySelect}
                    displayValue={tempMfy?.name}
                    disabled={!tempViloyat || !tempTuman}
            />
                </View>
              </View>

              {/* Selected Location Preview */}
              {tempTuman && tempViloyat && (
                <View style={styles.selectedLocationCard}>
                  <View style={styles.selectedLocationHeader}>
                    <View style={styles.selectedLocationIconContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    </View>
                    <Text style={styles.selectedLocationTitle}>Tanlangan hudud</Text>
                  </View>
                  <View style={styles.selectedLocationContent}>
                    <View style={styles.selectedLocationItem}>
                      <Ionicons name="map" size={16} color="#007AFF" />
                      <Text style={styles.selectedLocationText}>{tempViloyat.name}</Text>
                    </View>
                    <View style={styles.selectedLocationDivider} />
                    <View style={styles.selectedLocationItem}>
                      <Ionicons name="location" size={16} color="#007AFF" />
                      <Text style={styles.selectedLocationText}>{tempTuman.name}</Text>
                    </View>
                    {tempMfy && (
                      <>
                        <View style={styles.selectedLocationDivider} />
                        <View style={styles.selectedLocationItem}>
                          <Ionicons name="home" size={16} color="#007AFF" />
                          <Text style={styles.selectedLocationText}>{tempMfy.name}</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {tempViloyat && tempTuman && (
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  activeOpacity={0.8}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>Saqlash</Text>
              </>
            )}
                  </TouchableOpacity>
                )}
                {(tempViloyat || tempTuman || tempMfy) && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClear}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                    <Text style={styles.clearButtonText}>Tozalash</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  locationSelectorWrapper: {
    position: 'relative',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
    gap: 12,
  },
  locationSelectorHighlighted: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  highlightOverlay: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    opacity: 0.1,
    zIndex: -1,
  },
  alertContainer: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  alertContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCloseButton: {
    padding: 4,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  alertButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  locationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    flexDirection: 'column',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  modalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
  },
  closeButton: {
    padding: 4,
    marginTop: 2,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    gap: 8,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 3,
  },
  infoDescription: {
    fontSize: 11,
    color: '#0066cc',
    lineHeight: 14,
  },
  selectorCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectorCardDisabled: {
    opacity: 0.6,
    backgroundColor: '#f9f9f9',
  },
  selectorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  selectorIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  selectorCardTitleDisabled: {
    color: '#999',
  },
  requiredBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  requiredBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#856404',
  },
  regionPickerWrapper: {
    marginTop: 6,
  },
  selectedLocationCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  selectedLocationIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedLocationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  selectedLocationContent: {
    gap: 8,
  },
  selectedLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedLocationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  selectedLocationDivider: {
    height: 1,
    backgroundColor: '#bbf7d0',
    marginVertical: 3,
  },
  actionButtons: {
    gap: 8,
    marginTop: 6,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    gap: 6,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
