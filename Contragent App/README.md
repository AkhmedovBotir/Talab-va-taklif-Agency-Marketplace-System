# Kontragent Dasturi

Kontragent (yetkazib beruvchi) uchun mobil ilova. Bu ilova kontragentlarga maxsulotlarni boshqarish, buyurtmalarni ko'rish va qabul qilish, statistikalarni kuzatish va xabarlar bilan ishlash imkoniyatini beradi.

## 📱 Asosiy funksiyalar

### 🔐 Autentifikatsiya
- Telefon raqami va parol orqali kirish
- Token asosida autentifikatsiya
- Avtomatik sessiya saqlash

### 🏠 Bosh sahifa
- Kontragent ma'lumotlarini ko'rish
- INN, telefon, manzil ma'lumotlari
- Holat ko'rsatkichlari

### 📦 Ombor boshqaruvi
- **Kategoriyalar**: Maxsulot kategoriyalarini ko'rish va tanlash
- **Maxsulotlar**: 
  - Yangi maxsulot yaratish
  - Maxsulotlarni tahrirlash
  - Maxsulot ma'lumotlarini ko'rish
  - Rasm yuklash (maksimal 5 ta rasm)
  - Rich text editor bilan tavsif yozish
  - Narx, miqdor, o'lchamlar kiritish
  - Yetkazib berish hududlarini tanlash
- **Buyurtmalar**: Ombor buyurtmalarini ko'rish

### 📋 Buyurtmalar
- Bugungi buyurtmalarni ko'rish
- Status bo'yicha filtrlash (Barchasi, Kutilmoqda, Qabul qilindi, Rad etildi, Yetkazildi)
- Buyurtma tafsilotlarini ko'rish
- Buyurtmalar tarixini ko'rish
- Pull-to-refresh funksiyasi
- Pagination qo'llab-quvvatlash

### 📊 Statistika
- Kontragent statistikalarini ko'rish
- Ma'lumotlarni vizual ko'rinishda ko'rsatish

### 👤 Profil
- Kontragent ma'lumotlarini ko'rish va yangilash
- Logo yuklash va yangilash
- Habarlar sonini ko'rish (real-time yangilanadi - har 1 soniyada)
- Tizimdan chiqish

### 💬 Habarlar
- Xabarlarni ko'rish
- Yangi xabarlarni belgilash
- Barcha xabarlarni o'qilgan deb belgilash
- Pagination qo'llab-quvvatlash

## 🛠 Texnologiyalar

- **Framework**: React Native 0.81.5
- **UI Framework**: Expo SDK 54
- **Routing**: Expo Router 6.0 (file-based routing)
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **Image Picker**: react-native-image-picker 7.2.3
- **Language**: TypeScript 5.9.2
- **Icons**: @expo/vector-icons (Ionicons)
- **Rich Text Editor**: Quill Editor (WebView orqali)

## 📋 Talablar

- Node.js (v18 yoki yuqori)
- npm yoki yarn
- Expo CLI
- Android Studio (Android uchun)
- Xcode (iOS uchun, faqat macOS)

## 🚀 O'rnatish

### 1. Loyihani klonlash yoki yuklab olish

```bash
git clone <repository-url>
cd contragent
```

### 2. Dependencies o'rnatish

   ```bash
   npm install
   ```

yoki

```bash
yarn install
```

### 3. API URL ni sozlash

`services/api.ts` faylida `BASE_URL` ni o'zgartiring:

```typescript
const BASE_URL = 'http://your-api-url:port';
```

### 4. Ilovani ishga tushirish

#### Development mode

```bash
npm start
```

yoki

   ```bash
   npx expo start
   ```

#### Android uchun

```bash
npm run android
```

#### iOS uchun (faqat macOS)

```bash
npm run ios
```

#### Web uchun

```bash
npm run web
```

## 📱 Build qilish

### Android APK yaratish

```bash
npx expo build:android
```

yoki EAS Build ishlatish:

```bash
eas build --platform android
```

### iOS build (faqat macOS)

```bash
npx expo build:ios
```

yoki

```bash
eas build --platform ios
```

## 📁 Loyiha strukturası

```
contragent/
├── app/                    # Expo Router fayllari
│   ├── (tabs)/            # Tab navigation ekranlari
│   │   ├── index.tsx      # Bosh sahifa
│   │   ├── ombor/         # Ombor moduli
│   │   ├── buyurtmalar/   # Buyurtmalar moduli
│   │   ├── statistika.tsx # Statistika
│   │   ├── profile.tsx    # Profil
│   │   └── habarlar.tsx   # Habarlar
│   ├── login.tsx          # Login ekrani
│   └── _layout.tsx        # Root layout
├── components/            # Reusable komponentlar
├── contexts/             # React Context providers
│   └── AuthContext.tsx   # Autentifikatsiya context
├── services/             # API xizmatlari
│   └── api.ts           # API client
├── utils/                # Utility funksiyalar
│   └── formatNumber.ts   # Raqamlarni formatlash
├── assets/               # Rasmlar va boshqa assetlar
├── app.json             # Expo konfiguratsiyasi
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript konfiguratsiyasi
```

## 🔧 Konfiguratsiya

### Android permissions

`app.json` faylida quyidagi ruxsatlar sozlang:

```json
{
  "android": {
    "permissions": [
      "CAMERA",
      "READ_MEDIA_IMAGES"
    ]
  }
}
```

### react-native-image-picker sozlash

Android uchun `android/app/src/main/AndroidManifest.xml` fayliga quyidagilarni qo'shing:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

iOS uchun `ios/Info.plist` fayliga quyidagilarni qo'shing:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Rasmlarni tanlash uchun ruxsat kerak</string>
<key>NSCameraUsageDescription</key>
<string>Kameradan rasm olish uchun ruxsat kerak</string>
```

## 🐛 Muammolarni hal qilish

### react-native-image-picker xatosi

Agar `Cannot read property 'launchImageLibrary' of null` xatosi chiqsa:

1. Native modullarni rebuild qiling:
   ```bash
   npx expo prebuild
   ```

2. Yoki development build yarating:
   ```bash
   npx expo run:android
   # yoki
   npx expo run:ios
   ```

### Metro bundler xatolari

Cache ni tozalash:

```bash
npx expo start --clear
```

### Dependencies muammolari

```bash
rm -rf node_modules
npm install
```

## 📝 API Integration

Ilova REST API bilan ishlaydi. Asosiy endpointlar:

- `POST /api/contragents/login` - Kirish
- `GET /api/contragents/me` - Kontragent ma'lumotlari
- `GET /api/contragents/categories` - Kategoriyalar
- `GET /api/contragents/products` - Maxsulotlar
- `POST /api/contragents/products` - Maxsulot yaratish
- `GET /api/contragents/orders` - Buyurtmalar
- `GET /api/contragents/notifications` - Xabarlar
- `GET /api/contragents/notifications/unread-count` - O'qilmagan xabarlar soni

## 🔄 Real-time yangilanishlar

- **Unread count**: Har 1 soniyada avtomatik yangilanadi
- **Buyurtmalar**: Pull-to-refresh orqali yangilash
- **Xabarlar**: Real-time yangilanishlar

## 🎨 UI/UX

- Modern va intuitiv interfeys
- Material Design prinsiplari
- Dark mode qo'llab-quvvatlash (automatic)
- Safe area insets qo'llab-quvvatlash
- Responsive dizayn

## 📄 Litsenziya

Bu loyiha private loyiha hisoblanadi.

## 👥 Muallif

Botir123

## 📞 Aloqa

Savollar yoki takliflar uchun loyiha egasiga murojaat qiling.

---

**Eslatma**: Bu ilova development jarayonida. Production uchun ishlatishdan oldin barcha xavfsizlik sozlamalarini tekshiring.
