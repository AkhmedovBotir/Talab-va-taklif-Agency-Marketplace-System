import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Search } from '@mui/icons-material';
import * as Icons from '@mui/icons-material';

// Icons organized by categories
const ICONS_BY_CATEGORY = {
  business: [
    'Store', 'ShoppingBag', 'ShoppingCart', 'Category', 'Business', 'Work', 'BusinessCenter',
    'Storefront', 'ShoppingMall', 'LocalMall', 'LocalGroceryStore', 'BakeryDining',
    'PointOfSale', 'Receipt', 'ReceiptLong', 'Inventory', 'Inventory2', 'Shop', 'Shop2',
    'StoreMallDirectory', 'CorporateFare', 'Domain', 'AccountBalance', 'TrendingUp',
    'BarChart', 'Assessment', 'Analytics', 'PieChart', 'ShowChart', 'Timeline',
  ],
  food: [
    'Restaurant', 'RestaurantMenu', 'Fastfood', 'LocalCafe', 'LocalBar', 'SportsBar',
    'Dining', 'RoomService', 'SetMeal', 'BreakfastDining', 'LunchDining', 'DinnerDining',
    'Icecream', 'Cake', 'LocalPizza', 'LocalDrink', 'WineBar', 'FoodBank', 'Kitchen',
    'Coffee', 'LocalDining', 'RamenDining', 'DinnerDining', 'BrunchDining', 'TakeoutDining',
  ],
  transportation: [
    'LocalShipping', 'DirectionsCar', 'TwoWheeler', 'Flight', 'Train', 'DirectionsBus',
    'Subway', 'Tram', 'DirectionsBike', 'ElectricBike', 'ElectricScooter',
    'AirportShuttle', 'LocalTaxi', 'Commute', 'DirectionsWalk', 'DirectionsRun',
    'FlightTakeoff', 'FlightLand', 'TrainIcon', 'DirectionsTransit', 'DirectionsSubway',
    'DirectionsRailway', 'AirlineSeatReclineNormal', 'AirlineSeatFlat', 'AirlineSeatIndividualSuite',
  ],
  building: [
    'Home', 'Apartment', 'Factory', 'Construction', 'Build', 'Engineering',
    'BusinessCenter', 'LocationCity', 'Place', 'Warehouse', 'Museum', 'TheaterComedy',
    'Stadium', 'Castle', 'Church', 'Mosque', 'TempleBuddhist', 'TempleHindu',
    'School', 'Library', 'Hospital', 'Hotel', 'OfficeBuilding', 'Warehouse',
  ],
  finance: [
    'AccountBalance', 'Payment', 'CreditCard', 'AttachMoney', 'MonetizationOn',
    'Savings', 'AccountBalanceWallet', 'AccountTree', 'CurrencyExchange',
    'Paid', 'RequestQuote', 'PriceCheck', 'PointOfSale', 'Calculate',
    'AccountCircle', 'AccountBox', 'CreditScore', 'SavingsOutlined', 'AccountBalanceOutlined',
    'Payments', 'Receipt', 'ReceiptLong', 'Money', 'MoneyOff', 'Euro', 'Dollar', 'Yen',
  ],
  hospitality: [
    'Hotel', 'Spa', 'BeachAccess', 'Pool', 'Casino', 'GolfCourse',
    'SportsSoccer', 'SportsBasketball', 'SportsTennis', 'SportsVolleyball',
    'SportsHockey', 'SportsBaseball', 'SportsCricket', 'SportsKabaddi',
    'FitnessCenter', 'Sports', 'SportsEsports', 'SportsMotorsports', 'SportsMma',
    'Pool', 'BeachAccess', 'Spa', 'HotTub', 'AcUnit', 'Air', 'WaterDrop',
  ],
  education: [
    'School', 'Library', 'Book', 'MenuBook', 'Computer', 'Laptop',
    'Tablet', 'Phone', 'PhoneAndroid', 'PhoneIphone', 'Devices',
    'CastForEducation', 'Science', 'Psychology', 'HistoryEdu', 'School',
    'AutoStories', 'MenuBook', 'BookOnline', 'Class', 'WorkspacePremium',
    'GraduationCap', 'SchoolOutlined', 'LibraryBooks', 'LocalLibrary',
  ],
  communication: [
    'Phone', 'Email', 'Message', 'Chat', 'Forum', 'Comment', 'Comments',
    'Sms', 'Call', 'CallEnd', 'CallMade', 'CallReceived', 'CallSplit',
    'VideoCall', 'Videocam', 'VideocamOff', 'Mic', 'MicOff',
    'PhoneInTalk', 'PhoneEnabled', 'PhoneDisabled', 'PhoneCallback', 'PhonePaused',
    'ChatBubble', 'ChatBubbleOutline', 'Forum', 'QuestionAnswer', 'ContactMail',
  ],
  location: [
    'LocationOn', 'Map', 'Navigation', 'Place', 'MyLocation', 'NearMe',
    'Directions', 'Route', 'Explore', 'ExploreOff', 'LocalActivity',
    'LocalAtm', 'LocalParking', 'LocalGasStation', 'LocalPharmacy',
    'LocationCity', 'LocationSearching', 'LocationDisabled', 'PinDrop', 'AddLocation',
    'EditLocation', 'LocationOff', 'WhereToVote', 'Room', 'Home',
  ],
  medical: [
    'MedicalServices', 'LocalHospital', 'Healing', 'HealthAndSafety', 'Vaccines',
    'Emergency', 'LocalPharmacy', 'MedicalInformation', 'Medication',
    'MonitorHeart', 'Favorite', 'FavoriteBorder', 'HealthAndSafety',
    'LocalHospital', 'Healing', 'MedicalServices', 'Coronavirus', 'Sick',
    'Emergency', 'LocalPharmacy', 'MedicationLiquid', 'PregnantWoman', 'ChildCare',
  ],
  services: [
    'AutoRepair', 'CarRepair', 'BuildCircle', 'Handyman', 'Plumbing',
    'ElectricalServices', 'CleaningServices', 'DryCleaning', 'LocalLaundryService',
    'Carpenter', 'Construction', 'Engineering', 'PrecisionManufacturing',
    'HomeRepairService', 'MiscellaneousServices', 'RoomService',
    'Build', 'Handyman', 'Plumbing', 'ElectricalServices', 'CleaningServices',
    'Carpenter', 'Construction', 'Engineering', 'PrecisionManufacturing',
  ],
  media: [
    'Camera', 'PhotoCamera', 'Videocam', 'MusicNote', 'Movie', 'TheaterComedy',
    'MovieFilter', 'VideoLibrary', 'PhotoLibrary', 'Image', 'Images',
    'VideoFile', 'AudioFile', 'MovieCreation', 'LiveTv', 'Radio',
    'CameraAlt', 'CameraRoll', 'CameraEnhance', 'Photo', 'PhotoAlbum',
    'VideoCall', 'Videocam', 'Movie', 'TheaterComedy', 'MusicNote',
  ],
  technology: [
    'Computer', 'Laptop', 'Phone', 'Tablet', 'Devices', 'Smartphone',
    'Watch', 'Headphones', 'Speaker', 'Tv', 'Monitor', 'Print',
    'Scanner', 'Fax', 'Router', 'Memory', 'Storage', 'Cloud',
    'Computer', 'LaptopMac', 'LaptopWindows', 'PhoneAndroid', 'PhoneIphone',
    'TabletAndroid', 'TabletMac', 'Watch', 'WatchLater', 'Devices',
  ],
  shopping: [
    'ShoppingBag', 'ShoppingCart', 'AddShoppingCart', 'RemoveShoppingCart',
    'ShoppingBasket', 'LocalOffer', 'LocalOfferOutlined', 'Discount',
    'Loyalty', 'CardGiftcard', 'Redeem', 'CardMembership',
    'ShoppingBag', 'ShoppingCart', 'AddShoppingCart', 'RemoveShoppingCart',
    'ShoppingBasket', 'LocalOffer', 'Discount', 'Loyalty', 'CardGiftcard',
  ],
  general: [
    'Settings', 'MoreVert', 'MoreHoriz', 'Menu', 'Apps', 'Dashboard',
    'Notifications', 'NotificationsActive', 'NotificationsOff', 'Star',
    'StarBorder', 'StarHalf', 'Favorite', 'FavoriteBorder', 'ThumbUp',
    'ThumbDown', 'Share', 'Download', 'Upload', 'Print', 'Save',
    'Edit', 'Delete', 'Add', 'Remove', 'Close', 'Check', 'Cancel',
    'Search', 'FilterList', 'Sort', 'ArrowUpward', 'ArrowDownward',
    'ArrowForward', 'ArrowBack', 'Refresh', 'Sync', 'Autorenew',
    'MoreVert', 'MoreHoriz', 'Menu', 'Apps', 'Dashboard', 'Settings',
  ],
  security: [
    'Lock', 'LockOpen', 'Visibility', 'VisibilityOff', 'Security',
    'Verified', 'VerifiedUser', 'AdminPanelSettings', 'Shield', 'ShieldCheck',
    'Lock', 'LockOpen', 'LockClock', 'LockReset', 'Password',
    'Security', 'Verified', 'VerifiedUser', 'AdminPanelSettings', 'Policy',
  ],
  people: [
    'Person', 'People', 'Group', 'PersonAdd', 'PersonRemove', 'AccountCircle', 'AccountBox',
    'PersonOutline', 'PeopleOutline', 'GroupAdd', 'GroupRemove', 'SupervisorAccount',
    'PersonPin', 'PersonPinCircle', 'HowToReg', 'PersonAddAlt', 'PersonRemoveAlt',
  ],
  documents: [
    'Assignment', 'AssignmentInd', 'AssignmentTurnedIn', 'Description',
    'Article', 'Note', 'Notes', 'StickyNote2', 'TextSnippet',
    'Folder', 'FolderOpen', 'InsertDriveFile', 'AttachFile', 'Link',
    'Description', 'Article', 'Note', 'Notes', 'TextSnippet',
  ],
  time: [
    'CalendarToday', 'Event', 'Schedule', 'AccessTime', 'DateRange',
    'Alarm', 'Timer', 'Stopwatch', 'HourglassEmpty', 'HourglassFull',
    'CalendarMonth', 'CalendarViewDay', 'CalendarViewWeek', 'CalendarViewMonth',
    'Today', 'EventAvailable', 'EventBusy', 'EventNote', 'Schedule',
  ],
  weather: [
    'Cloud', 'CloudQueue', 'CloudDone', 'CloudOff', 'CloudUpload', 'CloudDownload',
    'AcUnit', 'Air', 'WaterDrop', 'Brightness', 'BrightnessHigh', 'BrightnessLow',
    'WbSunny', 'WbTwilight', 'WbCloudy', 'Grain', 'FilterDrama',
  ],
  arts: [
    'Palette', 'Brush', 'ColorLens', 'FormatPaint', 'Draw',
    'Photo', 'Image', 'Images', 'PhotoLibrary', 'PhotoAlbum',
    'Camera', 'CameraAlt', 'CameraRoll', 'CameraEnhance',
  ],
  tools: [
    'Build', 'Handyman', 'Construction', 'Engineering', 'PrecisionManufacturing',
    'Settings', 'Tune', 'FilterList', 'Sort', 'ViewList', 'ViewModule',
    'GridOn', 'GridOff', 'ViewComfy', 'ViewCompact', 'ViewHeadline',
  ],
};

const ALL_ICONS = Object.values(ICONS_BY_CATEGORY).flat();

const CATEGORY_LABELS = {
  all: 'Barchasi',
  business: 'Biznes & Savdo',
  food: 'Ovqat & Restoran',
  transportation: 'Transport',
  building: "Binolar & Ko'chmas mulk",
  finance: 'Moliya & Pul',
  hospitality: 'Mehmonxona & Turizm',
  education: "Ta'lim",
  communication: 'Aloqa',
  location: 'Joylashuv & Navigatsiya',
  medical: "Tibbiyot & Sog'liq",
  services: "Xizmatlar & Ta'mirlash",
  media: "Media & Ko'ngilochar",
  technology: 'Texnologiya',
  shopping: "Sotib olish & Do'kon",
  general: 'Umumiy',
  security: 'Xavfsizlik',
  people: 'Odamlar',
  documents: 'Hujjatlar',
  time: 'Vaqt & Kalendar',
  weather: 'Ob-havo',
  arts: "San'at & Dizayn",
  tools: 'Asboblar & Sozlamalar',
};

const IconSelector = ({ value, onChange, label, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const selectedIconName = value || '';
  const SelectedIcon = selectedIconName && Icons[selectedIconName] ? Icons[selectedIconName] : null;

  const filteredIcons = useMemo(() => {
    let icons = selectedCategory === 'all' ? ALL_ICONS : ICONS_BY_CATEGORY[selectedCategory] || [];

    if (searchQuery.trim()) {
      icons = icons.filter((iconName) => iconName.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return icons;
  }, [selectedCategory, searchQuery]);

  const handleIconSelect = (iconName) => {
    onChange({ target: { name: 'icon', value: iconName } });
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const handleClear = () => {
    onChange({ target: { name: 'icon', value: '' } });
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-sm"
        >
          {SelectedIcon ? (
            <>
              <SelectedIcon sx={{ fontSize: 20 }} className="text-indigo-600" />
              <span className="text-gray-700 font-mono text-xs">{selectedIconName}</span>
            </>
          ) : (
            <span className="text-gray-500">Icon tanlang</span>
          )}
        </button>
        {SelectedIcon && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-red-50 hover:border-red-300 transition-colors text-sm text-red-600"
          >
            <Close sx={{ fontSize: 18 }} />
          </button>
        )}
      </div>

      <input type="hidden" name="icon" value={selectedIconName} />

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[199]"
              onClick={() => {
                setIsOpen(false);
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Icon tanlash</h2>
                      <p className="text-xs text-indigo-100 mt-0.5">Iconni tanlang yoki qidiring</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
                    >
                      <Close sx={{ fontSize: 18 }} />
                    </button>
                  </div>
                </div>

                <div className="p-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Icon qidirish..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        autoFocus
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white min-w-[200px]"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([key, catLabel]) => (
                        <option key={key} value={key}>
                          {catLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {filteredIcons.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Icon topilmadi</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
                      {filteredIcons.map((iconName) => {
                        const IconComponent = Icons[iconName];
                        const isSelected = selectedIconName === iconName;

                        if (!IconComponent) return null;

                        return (
                          <motion.button
                            key={iconName}
                            type="button"
                            title={iconName}
                            onClick={() => handleIconSelect(iconName)}
                            className={`
                              flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all
                              ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'
                              }
                            `}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <IconComponent sx={{ fontSize: 24 }} />
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IconSelector;
