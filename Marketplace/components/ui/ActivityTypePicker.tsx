import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '../../services/api';
import { ContragentType } from '../../services/api';

interface ActivityTypePickerProps {
  label: string;
  value: string;
  onSelect: (activityType: ContragentType) => void;
  error?: string;
  disabled?: boolean;
  displayValue?: string;
}

export default function ActivityTypePicker({
  label,
  value,
  onSelect,
  error,
  disabled = false,
  displayValue,
}: ActivityTypePickerProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [allActivityTypes, setAllActivityTypes] = useState<ContragentType[]>([]);
  const [filteredActivityTypes, setFilteredActivityTypes] = useState<ContragentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState<ContragentType | null>(null);
  const [displayText, setDisplayText] = useState<string>('');

  // Sort activity types alphabetically by name (Uzbek alphabet)
  const sortActivityTypesAlphabetically = useCallback((types: ContragentType[]): ContragentType[] => {
    return [...types].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB, 'uz');
    });
  }, []);

  // Load all activity types
  const loadAllActivityTypes = useCallback(async () => {
    if (disabled) return;

    setLoading(true);
    try {
      const response = await apiService.getContragentTypes({ status: 'active' });
      
      // Sort alphabetically
      const sortedTypes = sortActivityTypesAlphabetically(response.data);
      setAllActivityTypes(sortedTypes);
      setFilteredActivityTypes(sortedTypes);
    } catch (error) {
      console.error('Error loading activity types:', error);
    } finally {
      setLoading(false);
    }
  }, [disabled, sortActivityTypesAlphabetically]);

  useEffect(() => {
    if (visible) {
      setSearchText('');
      setSelectedActivityType(null);
      loadAllActivityTypes();
    }
  }, [visible, loadAllActivityTypes]);

  useEffect(() => {
    if (value && allActivityTypes.length > 0) {
      const activityType = allActivityTypes.find((t) => t._id === value);
      if (activityType) {
        setSelectedActivityType(activityType);
        setDisplayText(activityType.name);
      }
    } else if (!value) {
      setSelectedActivityType(null);
      setDisplayText('');
    }
  }, [value, allActivityTypes]);

  useEffect(() => {
    if (displayValue && value) {
      setDisplayText(displayValue);
    } else if (!value) {
      setDisplayText('');
    }
  }, [displayValue, value]);

  // Filter activity types locally based on search text
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredActivityTypes(allActivityTypes);
    } else {
      const searchLower = searchText.toLowerCase();
      const filtered = allActivityTypes.filter((type) =>
        type.name?.toLowerCase().includes(searchLower)
      );
      setFilteredActivityTypes(filtered);
    }
  }, [searchText, allActivityTypes]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleSelect = (activityType: ContragentType) => {
    setSelectedActivityType(activityType);
    setDisplayText(activityType.name);
    onSelect(activityType);
    setVisible(false);
    setSearchText('');
  };

  // Material-UI icon names mapping to React Native Material icon names
  const getMaterialIconName = (iconName: string): string => {
    if (!iconName) return 'business';

    // All Material-UI icons list (complete mapping)
    const materialUIIcons: { [key: string]: string } = {
      // Business & Shopping
      'Store': 'store',
      'ShoppingBag': 'shopping-bag',
      'ShoppingCart': 'shopping-cart',
      'ShoppingBasket': 'shopping-basket',
      'Category': 'category',
      'Business': 'business',
      'Work': 'work',
      'BusinessCenter': 'business-center',
      'Storefront': 'store',
      'ShoppingMall': 'shopping-bag',
      'LocalMall': 'shopping-bag',
      'LocalGroceryStore': 'shopping-bag',
      'BakeryDining': 'restaurant',
      'PointOfSale': 'point-of-sale',
      'Receipt': 'receipt',
      'ReceiptLong': 'receipt-long',
      'Inventory': 'inventory',
      'Inventory2': 'inventory-2',
      'Shop': 'store',
      'Shop2': 'store',
      'StoreMallDirectory': 'store',
      'CorporateFare': 'business',
      'Domain': 'domain',
      'AccountBalance': 'account-balance',
      'TrendingUp': 'trending-up',
      'BarChart': 'bar-chart',
      'Assessment': 'assessment',
      'Analytics': 'analytics',
      'PieChart': 'pie-chart',
      'ShowChart': 'show-chart',
      'Timeline': 'timeline',
      
      // Food & Restaurant
      'Restaurant': 'restaurant',
      'RestaurantMenu': 'restaurant-menu',
      'Fastfood': 'fastfood',
      'LocalCafe': 'local-cafe',
      'LocalBar': 'local-bar',
      'SportsBar': 'sports-bar',
      'Dining': 'dining',
      'RoomService': 'room-service',
      'SetMeal': 'restaurant',
      'BreakfastDining': 'restaurant',
      'LunchDining': 'restaurant',
      'DinnerDining': 'restaurant',
      'Icecream': 'icecream',
      'Cake': 'cake',
      'LocalPizza': 'local-pizza',
      'LocalDrink': 'local-drink',
      'WineBar': 'wine-bar',
      'FoodBank': 'food-bank',
      'Kitchen': 'kitchen',
      'Coffee': 'local-cafe',
      'LocalDining': 'restaurant',
      'RamenDining': 'restaurant',
      'BrunchDining': 'restaurant',
      'TakeoutDining': 'restaurant',
      
      // Transportation
      'LocalShipping': 'local-shipping',
      'DirectionsCar': 'directions-car',
      'TwoWheeler': 'two-wheeler',
      'Flight': 'flight',
      'Train': 'train',
      'DirectionsBus': 'directions-bus',
      'Subway': 'subway',
      'Tram': 'tram',
      'DirectionsBike': 'directions-bike',
      'ElectricBike': 'electric-bike',
      'ElectricScooter': 'electric-scooter',
      'AirportShuttle': 'airport-shuttle',
      'LocalTaxi': 'local-taxi',
      'Commute': 'commute',
      'DirectionsWalk': 'directions-walk',
      'DirectionsRun': 'directions-run',
      'FlightTakeoff': 'flight-takeoff',
      'FlightLand': 'flight-land',
      'TrainIcon': 'train',
      'DirectionsTransit': 'directions-transit',
      'DirectionsSubway': 'directions-subway',
      'DirectionsRailway': 'directions-railway',
      'AirlineSeatReclineNormal': 'airline-seat-recline-normal',
      'AirlineSeatFlat': 'airline-seat-flat',
      'AirlineSeatIndividualSuite': 'airline-seat-individual-suite',
      
      // Building
      'Home': 'home',
      'Apartment': 'apartment',
      'Factory': 'factory',
      'Construction': 'construction',
      'Build': 'build',
      'Engineering': 'engineering',
      'LocationCity': 'location-city',
      'Place': 'place',
      'Warehouse': 'warehouse',
      'Museum': 'museum',
      'TheaterComedy': 'theater-comedy',
      'Stadium': 'stadium',
      'Castle': 'castle',
      'Church': 'church',
      'Mosque': 'mosque',
      'TempleBuddhist': 'temple-buddhist',
      'TempleHindu': 'temple-hindu',
      'School': 'school',
      'Library': 'library',
      'Hospital': 'local-hospital',
      'Hotel': 'hotel',
      'OfficeBuilding': 'business',
      
      // Finance
      'Payment': 'payment',
      'CreditCard': 'credit-card',
      'AttachMoney': 'attach-money',
      'MonetizationOn': 'monetization-on',
      'Savings': 'savings',
      'AccountBalanceWallet': 'account-balance-wallet',
      'AccountTree': 'account-tree',
      'CurrencyExchange': 'currency-exchange',
      'Paid': 'paid',
      'RequestQuote': 'request-quote',
      'PriceCheck': 'price-check',
      'Calculate': 'calculate',
      'Payments': 'payments',
      'Money': 'attach-money',
      'MoneyOff': 'money-off',
      'CreditScore': 'credit-score',
      'SavingsOutlined': 'savings',
      'AccountBalanceOutlined': 'account-balance',
      'Euro': 'euro',
      'Dollar': 'attach-money',
      'Yen': 'yen',
      
      // Hospitality
      'Spa': 'spa',
      'BeachAccess': 'beach-access',
      'Pool': 'pool',
      'Casino': 'casino',
      'GolfCourse': 'golf-course',
      'FitnessCenter': 'fitness-center',
      'Sports': 'sports',
      'HotTub': 'hot-tub',
      'AcUnit': 'ac-unit',
      'Air': 'air',
      'WaterDrop': 'water-drop',
      'SportsSoccer': 'sports-soccer',
      'SportsBasketball': 'sports-basketball',
      'SportsTennis': 'sports-tennis',
      'SportsVolleyball': 'sports-volleyball',
      'SportsHockey': 'sports-hockey',
      'SportsBaseball': 'sports-baseball',
      'SportsCricket': 'sports-cricket',
      'SportsKabaddi': 'sports-kabaddi',
      'SportsEsports': 'sports-esports',
      'SportsMotorsports': 'sports-motorsports',
      'SportsMma': 'sports-mma',
      
      // Education
      'Book': 'menu-book',
      'MenuBook': 'menu-book',
      'Computer': 'computer',
      'Laptop': 'laptop',
      'Tablet': 'tablet',
      'Phone': 'phone',
      'PhoneAndroid': 'phone-android',
      'PhoneIphone': 'phone-iphone',
      'Devices': 'devices',
      'CastForEducation': 'cast-for-education',
      'Science': 'science',
      'Psychology': 'psychology',
      'HistoryEdu': 'history-edu',
      'AutoStories': 'auto-stories',
      'BookOnline': 'menu-book',
      'Class': 'class',
      'WorkspacePremium': 'workspace-premium',
      'GraduationCap': 'school',
      'LibraryBooks': 'library-books',
      'LocalLibrary': 'local-library',
      'SchoolOutlined': 'school',
      
      // Communication
      'Email': 'email',
      'Message': 'message',
      'Chat': 'chat',
      'Forum': 'forum',
      'Comment': 'comment',
      'Comments': 'comments',
      'Sms': 'sms',
      'Call': 'call',
      'CallEnd': 'call-end',
      'CallMade': 'call-made',
      'CallReceived': 'call-received',
      'CallSplit': 'call-split',
      'VideoCall': 'video-call',
      'Videocam': 'videocam',
      'VideocamOff': 'videocam-off',
      'Mic': 'mic',
      'MicOff': 'mic-off',
      'PhoneInTalk': 'phone-in-talk',
      'PhoneEnabled': 'phone-enabled',
      'PhoneDisabled': 'phone-disabled',
      'PhoneCallback': 'phone-callback',
      'PhonePaused': 'phone-paused',
      'ChatBubble': 'chat-bubble',
      'ChatBubbleOutline': 'chat-bubble-outline',
      'QuestionAnswer': 'question-answer',
      'ContactMail': 'contact-mail',
      
      // Location
      'LocationOn': 'location-on',
      'Map': 'map',
      'Navigation': 'navigation',
      'MyLocation': 'my-location',
      'NearMe': 'near-me',
      'Directions': 'directions',
      'Route': 'route',
      'Explore': 'explore',
      'ExploreOff': 'explore-off',
      'LocalActivity': 'local-activity',
      'LocalAtm': 'local-atm',
      'LocalParking': 'local-parking',
      'LocalGasStation': 'local-gas-station',
      'LocalPharmacy': 'local-pharmacy',
      'LocationSearching': 'location-searching',
      'LocationDisabled': 'location-disabled',
      'PinDrop': 'pin-drop',
      'AddLocation': 'add-location',
      'EditLocation': 'edit-location',
      'LocationOff': 'location-off',
      'WhereToVote': 'where-to-vote',
      'Room': 'room',
      
      // Medical
      'MedicalServices': 'medical-services',
      'LocalHospital': 'local-hospital',
      'Healing': 'healing',
      'HealthAndSafety': 'health-and-safety',
      'Vaccines': 'vaccines',
      'Emergency': 'emergency',
      'MedicalInformation': 'medical-information',
      'Medication': 'medication',
      'MonitorHeart': 'monitor-heart',
      'Favorite': 'favorite',
      'FavoriteBorder': 'favorite-border',
      'Coronavirus': 'coronavirus',
      'Sick': 'sick',
      'MedicationLiquid': 'medication-liquid',
      'PregnantWoman': 'pregnant-woman',
      'ChildCare': 'child-care',
      
      // Services
      'AutoRepair': 'build',
      'CarRepair': 'build',
      'BuildCircle': 'build',
      'Handyman': 'build',
      'Plumbing': 'plumbing',
      'ElectricalServices': 'electrical-services',
      'CleaningServices': 'cleaning-services',
      'DryCleaning': 'dry-cleaning',
      'LocalLaundryService': 'local-laundry-service',
      'Carpenter': 'carpenter',
      'PrecisionManufacturing': 'precision-manufacturing',
      'HomeRepairService': 'build',
      'MiscellaneousServices': 'miscellaneous-services',
      
      // Media
      'Camera': 'camera-alt',
      'PhotoCamera': 'camera-alt',
      'MusicNote': 'music-note',
      'Movie': 'movie',
      'MovieFilter': 'movie-filter',
      'VideoLibrary': 'video-library',
      'PhotoLibrary': 'photo-library',
      'Image': 'image',
      'Images': 'images',
      'VideoFile': 'video-file',
      'AudioFile': 'audio-file',
      'MovieCreation': 'movie-creation',
      'LiveTv': 'live-tv',
      'Radio': 'radio',
      'CameraAlt': 'camera-alt',
      'CameraRoll': 'camera-roll',
      'CameraEnhance': 'camera-enhance',
      'Photo': 'photo',
      'PhotoAlbum': 'photo-album',
      
      // Technology
      'Smartphone': 'smartphone',
      'Watch': 'watch',
      'Headphones': 'headphones',
      'Speaker': 'speaker',
      'Tv': 'tv',
      'Monitor': 'monitor',
      'Print': 'print',
      'Scanner': 'scanner',
      'Fax': 'fax',
      'Router': 'router',
      'Memory': 'memory',
      'Storage': 'storage',
      'LaptopMac': 'laptop-mac',
      'LaptopWindows': 'laptop-windows',
      'TabletAndroid': 'tablet-android',
      'TabletMac': 'tablet-mac',
      'WatchLater': 'watch-later',
      
      // Shopping
      'AddShoppingCart': 'add-shopping-cart',
      'RemoveShoppingCart': 'remove-shopping-cart',
      'LocalOffer': 'local-offer',
      'LocalOfferOutlined': 'local-offer',
      'Discount': 'local-offer',
      'Loyalty': 'loyalty',
      'CardGiftcard': 'card-giftcard',
      'Redeem': 'redeem',
      'CardMembership': 'card-membership',
      
      // General
      'Settings': 'settings',
      'MoreVert': 'more-vert',
      'MoreHoriz': 'more-horiz',
      'Menu': 'menu',
      'Apps': 'apps',
      'Dashboard': 'dashboard',
      'Notifications': 'notifications',
      'NotificationsActive': 'notifications-active',
      'NotificationsOff': 'notifications-off',
      'Star': 'star',
      'StarBorder': 'star-border',
      'StarHalf': 'star-half',
      'ThumbUp': 'thumb-up',
      'ThumbDown': 'thumb-down',
      'Share': 'share',
      'Download': 'file-download',
      'Upload': 'file-upload',
      'Save': 'save',
      'Edit': 'edit',
      'Delete': 'delete',
      'Add': 'add',
      'Remove': 'remove',
      'Close': 'close',
      'Check': 'check',
      'Cancel': 'cancel',
      'Search': 'search',
      'FilterList': 'filter-list',
      'Sort': 'sort',
      'ArrowUpward': 'arrow-upward',
      'ArrowDownward': 'arrow-downward',
      'ArrowForward': 'arrow-forward',
      'ArrowBack': 'arrow-back',
      'Refresh': 'refresh',
      'Sync': 'sync',
      'Autorenew': 'autorenew',
      
      // Security
      'Lock': 'lock',
      'LockOpen': 'lock-open',
      'Visibility': 'visibility',
      'VisibilityOff': 'visibility-off',
      'Security': 'security',
      'Verified': 'verified',
      'VerifiedUser': 'verified-user',
      'AdminPanelSettings': 'admin-panel-settings',
      'Shield': 'security',
      'ShieldCheck': 'security',
      'LockClock': 'lock-clock',
      'LockReset': 'lock-reset',
      'Password': 'lock',
      'Policy': 'policy',
      
      // People
      'Person': 'person',
      'People': 'people',
      'Group': 'group',
      'PersonAdd': 'person-add',
      'PersonRemove': 'person-remove',
      'AccountCircle': 'account-circle',
      'AccountBox': 'account-box',
      'PersonOutline': 'person-outline',
      'PeopleOutline': 'people-outline',
      'GroupAdd': 'group-add',
      'GroupRemove': 'group-remove',
      'SupervisorAccount': 'supervisor-account',
      'PersonPin': 'person-pin',
      'PersonPinCircle': 'person-pin-circle',
      'HowToReg': 'how-to-reg',
      'PersonAddAlt': 'person-add',
      'PersonRemoveAlt': 'person-remove',
      
      // Documents
      'Assignment': 'assignment',
      'AssignmentInd': 'assignment-ind',
      'AssignmentTurnedIn': 'assignment-turned-in',
      'Description': 'description',
      'Article': 'article',
      'Note': 'note',
      'Notes': 'notes',
      'StickyNote2': 'note',
      'TextSnippet': 'text-snippet',
      'Folder': 'folder',
      'FolderOpen': 'folder-open',
      'InsertDriveFile': 'insert-drive-file',
      'AttachFile': 'attach-file',
      'Link': 'link',
      
      // Time
      'CalendarToday': 'calendar-today',
      'Event': 'event',
      'Schedule': 'schedule',
      'AccessTime': 'access-time',
      'DateRange': 'date-range',
      'Alarm': 'alarm',
      'Timer': 'timer',
      'Stopwatch': 'timer',
      'HourglassEmpty': 'hourglass-empty',
      'HourglassFull': 'hourglass-full',
      'CalendarMonth': 'calendar-month',
      'CalendarViewDay': 'calendar-view-day',
      'CalendarViewWeek': 'calendar-view-week',
      'CalendarViewMonth': 'calendar-view-month',
      'Today': 'today',
      'EventAvailable': 'event-available',
      'EventBusy': 'event-busy',
      'EventNote': 'event-note',
      
      // Weather
      'Cloud': 'cloud',
      'CloudQueue': 'cloud-queue',
      'CloudDone': 'cloud-done',
      'CloudOff': 'cloud-off',
      'CloudUpload': 'cloud-upload',
      'CloudDownload': 'cloud-download',
      'Brightness': 'brightness-high',
      'BrightnessHigh': 'brightness-high',
      'BrightnessLow': 'brightness-low',
      'WbSunny': 'wb-sunny',
      'WbTwilight': 'wb-twilight',
      'WbCloudy': 'wb-cloudy',
      'Grain': 'grain',
      'FilterDrama': 'filter-drama',
      
      // Arts
      'Palette': 'palette',
      'Brush': 'brush',
      'ColorLens': 'color-lens',
      'FormatPaint': 'format-paint',
      'Draw': 'brush',
      
      // Tools
      'Tune': 'tune',
      'ViewList': 'view-list',
      'ViewModule': 'view-module',
      'GridOn': 'grid-on',
      'GridOff': 'grid-off',
      'ViewComfy': 'view-comfy',
      'ViewCompact': 'view-compact',
      'ViewHeadline': 'view-headline',
    };

    // Try exact match first
    if (materialUIIcons[iconName]) {
      return materialUIIcons[iconName];
    }

    // Try case-insensitive match
    const lowerName = iconName.toLowerCase();
    for (const [muiName, rnName] of Object.entries(materialUIIcons)) {
      if (muiName.toLowerCase() === lowerName) {
        return rnName;
      }
    }

    // Convert PascalCase to kebab-case as fallback
    const kebabCase = iconName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');

    return kebabCase;
  };

  // Helper function to render Material icon
  const renderMaterialIcon = (iconName: string, size: number = 18, color: string = '#999') => {
    if (!iconName) {
      return <MaterialIcons name="business" size={size} color={color} />;
    }

    const materialIconName = getMaterialIconName(iconName);

    // For WaterDrop, use MaterialCommunityIcons as it's not in MaterialIcons
    if (iconName.toLowerCase() === 'waterdrop' || materialIconName === 'water-drop') {
      return (
        <MaterialCommunityIcons 
          name="water" 
          size={size} 
          color={color} 
        />
      );
    }

    // Try MaterialIcons first
    return (
      <MaterialIcons 
        name={materialIconName as any} 
        size={size} 
        color={color} 
      />
    );
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.input,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.inputContent}>
          {selectedActivityType ? (
            renderMaterialIcon(selectedActivityType.icon, 20, displayText ? '#007AFF' : '#999')
          ) : (
            <MaterialIcons 
              name="business" 
              size={20} 
              color={displayText ? '#007AFF' : '#999'} 
              style={styles.inputIcon}
            />
          )}
          <Text style={[styles.inputText, !displayText && styles.placeholder]}>
            {displayText || 'Faoliyat turini tanlang'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            {/* Drag Indicator */}
            <View style={styles.dragIndicator} />
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconContainer}>
                  <MaterialIcons 
                    name="business" 
                    size={24} 
                    color="#007AFF" 
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>{label}</Text>
                  <Text style={styles.modalSubtitle}>
                    {filteredActivityTypes.length} ta faoliyat turi
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setVisible(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={28} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Qidirish..."
                value={searchText}
                onChangeText={handleSearch}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity 
                  onPress={() => handleSearch('')}
                  style={styles.clearSearchButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Activity Types List */}
            <FlatList
              data={filteredActivityTypes}
              keyExtractor={(item, index) => item._id || `activity-type-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedActivityType?._id === item._id && styles.itemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemContent}>
                    <View style={[
                      styles.itemIconContainer,
                      selectedActivityType?._id === item._id && styles.itemIconContainerActive
                    ]}>
                      {renderMaterialIcon(
                        item.icon, 
                        18, 
                        selectedActivityType?._id === item._id ? '#007AFF' : '#999'
                      )}
                    </View>
                    <Text
                      style={[
                        styles.itemText,
                        selectedActivityType?._id === item._id && styles.itemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  {selectedActivityType?._id === item._id && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              removeClippedSubviews={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ 
                paddingBottom: Math.max(insets.bottom + 20, 40) 
              }}
              ListEmptyComponent={
                loading ? (
                  <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.emptyText}>Yuklanmoqda...</Text>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>Hech narsa topilmadi</Text>
                    <Text style={styles.emptySubtext}>Boshqa so'z bilan qidiring</Text>
                  </View>
                )
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  inputContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  placeholder: {
    color: '#999',
    fontWeight: '400',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    gap: 12,
  },
  searchIcon: {
    marginRight: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemSelected: {
    backgroundColor: '#f0f8ff',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIconContainerActive: {
    backgroundColor: '#e6f3ff',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  itemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
});


