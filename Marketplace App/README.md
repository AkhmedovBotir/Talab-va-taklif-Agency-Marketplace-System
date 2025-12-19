# Marketplace - O'zbekiston Marketplace Ilovasi

O'zbekiston uchun yaratilgan zamonaviy marketplace mobil ilovasi. React Native va Expo Router asosida qurilgan, to'liq funksionallik bilan jihozlangan e-commerce yechimi.

## 📱 Funksiyalar

### 🔐 Autentifikatsiya
- SMS orqali telefon raqamini tasdiqlash
- Parol bilan kirish
- Parolni tiklash (SMS orqali)
- Xavfsiz token-based autentifikatsiya
- Avtomatik sessiya boshqaruvi

### 🛍️ Mahsulotlar
- Mahsulotlarni ko'rish va qidirish
- Kategoriya va subkategoriyalar bo'yicha filtrlash
- Narx, kontragent, kategoriya bo'yicha filtrlash
- Mahsulot tafsilotlari (rasmlar, tavsif, narx)
- Mahsulot sharhlari va reytinglar
- Kontragentlar ro'yxati va ma'lumotlari

### 🛒 Savat va Buyurtma
- Savatga qo'shish/olib tashlash
- Savatni yangilash
- Checkout jarayoni
- Buyurtmalar tarixi
- Buyurtma holatini kuzatish
- Buyurtmani bekor qilish
- Yetkazib berishni tasdiqlash

### 💳 To'lov
- Naqd va karta orqali to'lov
- To'lov holatini kuzatish
- To'lov transaksiyalari tarixi

### 📍 Manzil Boshqaruvi
- Viloyat, Tuman, MFY tanlash
- Manzilni saqlash va yangilash
- Manzilga asoslangan mahsulot filtrlash

### 🔔 Bildirishnomalar
- Real-time unread count (har 1 soniyada yangilanadi)
- Turli xil bildirishnoma turlari (info, warning, success, error, announcement, promotion, update)
- Bildirishnomalarni o'qish va barchasini o'qilgan deb belgilash
- Pagination bilan bildirishnomalar ro'yxati

### 👤 Profil
- Shaxsiy ma'lumotlarni tahrirlash
- Avatar yuklash (react-native-image-picker)
- Parolni o'zgartirish
- Manzilni yangilash
- Buyurtmalar tarixi
- Profil ma'lumotlarini yangilash

### ⭐ Sharhlar va Reytinglar
- Mahsulotlarga sharh qoldirish
- Reyting berish (1-5 yulduz)
- Shablon sharhlar
- Maxsus sharh yozish
- Mahsulot sharhlarini ko'rish

### 🤝 Hamkorlik So'rovlari
- Hamkorlik so'rovini yuborish
- So'rov holatini kuzatish
- Kompaniya ma'lumotlarini kiritish

## 🛠️ Texnologiyalar

### Asosiy
- **React Native** 0.81.5
- **Expo** ~54.0.25
- **Expo Router** ~6.0.15 (File-based routing)
- **TypeScript** 5.9.2
- **React** 19.1.0

### Navigation va UI
- **@react-navigation/native** - Navigation
- **@expo/vector-icons** - Iconlar
- **react-native-safe-area-context** - Safe area boshqaruvi
- **react-native-gesture-handler** - Gesture boshqaruvi
- **react-native-reanimated** - Animatsiyalar

### State Management
- **React Context API** - Global state boshqaruvi
  - AuthContext - Autentifikatsiya
  - CartContext - Savat
  - NotificationContext - Bildirishnomalar
  - LocationContext - Manzil

### Storage
- **@react-native-async-storage/async-storage** - Local storage

### Media
- **react-native-image-picker** - Rasm tanlash va yuklash

### Boshqa
- **react-native-webview** - WebView integratsiyasi
- **@react-native-community/datetimepicker** - Sana tanlash

## 📁 Loyiha Strukturasi

```
marketplace/
├── app/                    # Expo Router sahifalar
│   ├── (auth)/            # Autentifikatsiya sahifalari
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── ...
│   ├── (tabs)/            # Asosiy tab sahifalar
│   │   ├── index.tsx      # Bosh sahifa
│   │   ├── search.tsx     # Qidiruv
│   │   ├── cart.tsx       # Savat
│   │   ├── shops.tsx      # Do'konlar
│   │   └── profile.tsx    # Profil
│   ├── product/           # Mahsulot sahifalari
│   ├── order/             # Buyurtma sahifalari
│   ├── checkout.tsx       # Checkout
│   └── notifications.tsx  # Bildirishnomalar
├── components/            # Qayta ishlatiladigan komponentlar
│   ├── ui/               # UI komponentlari
│   └── ...
├── contexts/             # Context providers
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   ├── NotificationContext.tsx
│   └── LocationContext.tsx
├── services/             # API xizmatlari
│   └── api.ts           # Asosiy API service
├── assets/               # Rasmlar va resurslar
└── app.json             # Expo konfiguratsiyasi
```

## 🚀 O'rnatish va Ishga Tushirish

### Talablar
- Node.js (v18 yoki yuqori)
- npm yoki yarn
- Expo CLI
- Android Studio (Android uchun)
- Xcode (iOS uchun, faqat macOS)

### O'rnatish

1. **Repository ni klonlash**
   ```bash
   git clone <repository-url>
   cd marketplace
   ```

2. **Dependencies ni o'rnatish**
   ```bash
   npm install
   ```

3. **API URL ni sozlash**
   
   `services/api.ts` faylida API URL larni o'zgartiring:
   ```typescript
   const BASE_URL = 'http://your-api-url/api/marketplace';
   const REGIONS_BASE_URL = 'http://your-api-url/api';
   const REVIEWS_BASE_URL = 'http://your-api-url/api/reviews';
   const PAYMENT_BASE_URL = 'http://your-api-url/api/payment';
   ```

### Ishga Tushirish

#### Development Mode
```bash
npm start
```

Keyin quyidagi variantlardan birini tanlang:
- `a` - Android emulator
- `i` - iOS simulator
- `w` - Web brauzer
- QR kod orqali Expo Go ilovasida ochish

#### Platformaga Xos Build

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

**Web:**
```bash
npm run web
```

## ⚙️ Konfiguratsiya

### Android Permissions

Android uchun `app.json` da quyidagi ruxsatlar mavjud:
- `CAMERA` - Rasm olish uchun
- `READ_EXTERNAL_STORAGE` - Rasm tanlash uchun
- `WRITE_EXTERNAL_STORAGE` - Rasm saqlash uchun

### iOS Permissions

iOS uchun `app.json` da quyidagi ruxsatlar sozlanadi:
- `NSPhotoLibraryUsageDescription` - Rasm tanlash
- `NSCameraUsageDescription` - Kameradan rasm olish

### Environment Variables

Hozircha API URL lar to'g'ridan-to'g'ri `services/api.ts` faylida sozlangan. Keyinchalik environment variables qo'shish mumkin.

## 📝 API Integratsiyasi

Ilova RESTful API bilan ishlaydi. Asosiy endpointlar:

- **Auth**: `/api/marketplace/login`, `/api/marketplace/register`
- **Products**: `/api/marketplace/products`
- **Cart**: `/api/marketplace/cart`
- **Orders**: `/api/marketplace/orders`
- **Notifications**: `/api/marketplace/notifications`
- **Reviews**: `/api/reviews`
- **Payment**: `/api/payment`
- **Regions**: `/api/regions`

Batafsil ma'lumot uchun `services/api.ts` faylini ko'ring.

## 🔄 Real-time Funksiyalar

- **Bildirishnomalar**: Unread count har 1 soniyada avtomatik yangilanadi
- **Savat**: Real-time yangilanishlar
- **Buyurtmalar**: Holat o'zgarishlarini kuzatish

## 🎨 UI/UX Xususiyatlari

- Zamonaviy va intuitiv interfeys
- Dark/Light mode qo'llab-quvvatlash (automatic)
- Pull-to-refresh funksiyasi
- Infinite scroll (pagination)
- Loading states va error handling
- Smooth animations va transitions
- Responsive dizayn

## 🧪 Testing

```bash
npm run lint
```

## 📦 Build va Deploy

### EAS Build (Expo Application Services)

```bash
# EAS CLI ni o'rnatish
npm install -g eas-cli

# EAS ga kirish
eas login

# Build yaratish
eas build --platform android
eas build --platform ios
```

### Local Build

```bash
# Android APK
npm run android

# iOS
npm run ios
```

## 🤝 Contributing

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/AmazingFeature`)
3. O'zgarishlarni commit qiling (`git commit -m 'Add some AmazingFeature'`)
4. Branch ga push qiling (`git push origin feature/AmazingFeature`)
5. Pull Request yarating

## 📄 License

Bu loyiha private loyiha hisoblanadi.

## 👥 Mualliflar

- Marketplace Development Team

## 📞 Aloqa

Savollar yoki takliflar uchun issue oching yoki aloqa qiling.

## 🔮 Keyingi Rejalar

- [ ] Push notifications
- [ ] Offline mode
- [ ] Favorites/Wishlist
- [ ] Chat funksiyasi
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Social media integratsiyasi

---

**Eslatma**: Bu loyiha ishlab chiqilmoqda. Ba'zi funksiyalar hali to'liq ishlamasligi mumkin.
