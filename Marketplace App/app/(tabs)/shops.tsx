import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { useNotification } from '../../contexts/NotificationContext';
import apiService, { Contragent, ContragentType } from '../../services/api';

export default function ShopsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { unreadCount } = useNotification();
    
    // Contragent Types state
    const [contragentTypes, setContragentTypes] = useState<ContragentType[]>([]);
    const [typesLoading, setTypesLoading] = useState(true);
    const [typesRefreshing, setTypesRefreshing] = useState(false);
    const [selectedType, setSelectedType] = useState<ContragentType | null>(null);
    
    // Contragents state
    const [allContragents, setAllContragents] = useState<Contragent[]>([]);
    const [contragents, setContragents] = useState<Contragent[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [imgBase, setImgBase] = useState<string | null>(null);

    // Load Contragent Types
    const loadContragentTypes = useCallback(async () => {
        try {
            setTypesLoading(true);
            const response = await apiService.getContragentTypes({ status: 'active' });
            setContragentTypes(response.data);
        } catch (error: any) {
            console.error('Error loading contragent types:', error);
            Alert.alert('Xatolik', error.message || 'Faoliyat turlarini yuklashda xatolik yuz berdi');
        } finally {
            setTypesLoading(false);
            setTypesRefreshing(false);
        }
    }, []);

    // Load Contragents by Activity Type
    const loadContragents = useCallback(async (pageNum: number = 1, append: boolean = false, search?: string, activityTypeId?: string) => {
        try {
            if (!append) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const response = await apiService.getContragents({
                page: pageNum,
                limit: 20,
                status: 'active',
                search: search || undefined,
                activityType: activityTypeId,
            });

            if (response.imgBase) {
                setImgBase(response.imgBase);
            }

            if (append) {
                setAllContragents((prev) => [...prev, ...response.data]);
            } else {
                setAllContragents(response.data);
            }

            setPage(response.page);
            
            if (response.next) {
                setHasMore(true);
            } else {
            setHasMore(response.page < response.totalPages);
            }
        } catch (error: any) {
            console.error('Error loading contragents:', error);
            Alert.alert('Xatolik', error.message || 'Do\'konlarni yuklashda xatolik yuz berdi');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        loadContragentTypes();
    }, []);

    useEffect(() => {
        if (selectedType) {
            setPage(1);
            setHasMore(true);
            setSearchQuery('');
            loadContragents(1, false, undefined, selectedType._id);
        }
    }, [selectedType, loadContragents]);

    // Local filter - search query ga qarab do'konlarni filter qilish
    useEffect(() => {
        if (!searchQuery.trim()) {
            setContragents(allContragents);
        } else {
            const query = searchQuery.toLowerCase().trim();
            const filtered = allContragents.filter((contragent) =>
                contragent.name.toLowerCase().includes(query)
            );
            setContragents(filtered);
        }
    }, [searchQuery, allContragents]);

    const handleRefresh = useCallback(() => {
        if (selectedType) {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
            setSearchQuery('');
            loadContragents(1, false, undefined, selectedType._id);
        } else {
            setTypesRefreshing(true);
            loadContragentTypes();
        }
    }, [selectedType, loadContragents, loadContragentTypes]);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore && !searchQuery.trim() && selectedType) {
            loadContragents(page + 1, true, undefined, selectedType._id);
        }
    }, [loadingMore, hasMore, page, loadContragents, searchQuery, selectedType]);

    const handleTypePress = (type: ContragentType) => {
        setSelectedType(type);
    };

    const handleBackPress = () => {
        setSelectedType(null);
        setAllContragents([]);
        setContragents([]);
        setSearchQuery('');
        setPage(1);
        setHasMore(true);
    };

    const handleShopPress = (contragent: Contragent) => {
        router.push({
            pathname: '/(tabs)/search',
            params: { contragentId: contragent._id, contragentName: contragent.name },
        });
    };

    const handleNotificationPress = () => {
        router.push('/notifications' as any);
    };

    // Material-UI icon names mapping to React Native Material icon names
    // Converts PascalCase Material-UI names to kebab-case MaterialIcons names
    const getMaterialIconName = (iconName: string): string => {
        if (!iconName) return 'business';

        // All Material-UI icons list
        const materialUIIcons: { [key: string]: string } = {
            // Business & Shopping
            'Store': 'store',
            'ShoppingBag': 'shopping-bag',
            'ShoppingCart': 'shopping-cart',
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
            'ShoppingBasket': 'shopping-basket',
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
    const renderMaterialIcon = (iconName: string) => {
        if (!iconName) {
            return <MaterialIcons name="business" size={28} color="#007AFF" />;
        }

        const materialIconName = getMaterialIconName(iconName);

        // For WaterDrop, use MaterialCommunityIcons as it's not in MaterialIcons
        if (iconName.toLowerCase() === 'waterdrop' || materialIconName === 'water-drop') {
            return (
                <MaterialCommunityIcons 
                    name="water" 
                    size={28} 
                    color="#007AFF" 
                />
            );
        }

        // Try MaterialIcons first
        return (
            <MaterialIcons 
                name={materialIconName as any} 
                size={28} 
                color="#007AFF" 
            />
        );
    };

    // Render Contragent Type Item
    const renderTypeItem = ({ item }: { item: ContragentType }) => {
        return (
            <TouchableOpacity
                style={styles.typeCard}
                onPress={() => handleTypePress(item)}
                activeOpacity={0.8}
            >
                <View style={styles.typeIconContainer}>
                    {renderMaterialIcon(item.icon)}
                </View>
                <View style={styles.typeInfo}>
                    <Text style={styles.typeName} numberOfLines={2}>
                        {item.name}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
        );
    };

    // Render Contragent Item
    const renderContragentItem = ({ item }: { item: Contragent }) => {
        const logoUrl = item.logo 
            ? (imgBase && !item.logo.startsWith('http') 
                ? `${imgBase}${item.logo}` 
                : item.logo)
            : null;

        return (
        <TouchableOpacity
            style={styles.shopCard}
            onPress={() => handleShopPress(item)}
            activeOpacity={0.8}
        >
            <View style={styles.shopIconContainer}>
                    {logoUrl ? (
                    <Image 
                            source={{ uri: logoUrl }} 
                        style={styles.shopLogo}
                        resizeMode="cover"
                    />
                ) : (
                    <Ionicons name="storefront" size={24} color="#007AFF" />
                )}
            </View>
            <View style={styles.shopInfo}>
                <Text style={styles.shopName} numberOfLines={1}>
                    {item.name}
                </Text>
                <View style={styles.shopLocation}>
                        <Text style={styles.locationText}>
                        {item.viloyat?.name || ''}
                        {item.tuman?.name ? `, ${item.tuman.name}` : ''}
                        {item.mfy?.name ? `, ${item.mfy.name}` : ''}
                    </Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
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

    const renderEmptyTypes = () => {
        if (typesLoading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="business-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Faoliyat turlari topilmadi</Text>
            </View>
        );
    };

    const renderEmptyContragents = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="storefront-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Do'konlar topilmadi</Text>
            </View>
        );
    };

    // Show Contragent Types List
    if (!selectedType) {
        return (
            <View style={styles.container}>
                <Header 
                    title="Do'konlar turlari" 
                    onNotificationPress={handleNotificationPress} 
                    unreadCount={unreadCount} 
                />

                {typesLoading && contragentTypes.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                ) : (
                    <FlatList
                        data={contragentTypes}
                        renderItem={renderTypeItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={[
                            styles.listContent,
                            { paddingBottom: insets.bottom + 100 },
                        ]}
                        refreshControl={
                            <RefreshControl refreshing={typesRefreshing} onRefresh={handleRefresh} />
                        }
                        ListEmptyComponent={renderEmptyTypes}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        );
    }

    // Show Contragents List for Selected Type
    return (
        <View style={styles.container}>
            <Header 
                title={selectedType.name} 
                onNotificationPress={handleNotificationPress} 
                unreadCount={unreadCount}
                showBackButton
                onBackPress={handleBackPress}
            />

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Do'kon qidirish..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery('')}
                            style={styles.clearButton}
                        >
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading && contragents.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={contragents}
                    renderItem={renderContragentItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + 100 },
                    ]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    onEndReached={!searchQuery.trim() ? handleLoadMore : undefined}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={renderEmptyContragents}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e7',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 0,
    },
    clearButton: {
        marginLeft: 8,
        padding: 4,
    },
    listContent: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        padding: 16,
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    typeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    typeIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    typeInfo: {
        flex: 1,
        marginRight: 12,
    },
    typeName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    shopCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    shopIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    shopLogo: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    shopInfo: {
        flex: 1,
        marginRight: 12,
    },
    shopName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    shopLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6,
    },
    locationText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
});
