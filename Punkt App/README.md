# Punkt - Logistika Punkti Boshqaruv Tizimi

Punkt - bu logistika punktlari uchun mo'ljallangan mobil ilova bo'lib, buyurtmalarni boshqarish, punktlar o'rtasida koordinatsiya, kontragentlar va agentlar bilan ishlash, KPI hisob-kitoblari va xabarnomalar boshqaruvini ta'minlaydi.

## 📱 Asosiy Xususiyatlar

### 1. Buyurtma Boshqaruvi
- **Bugungi buyurtmalar**: Faqat bugungi buyurtmalarni ko'rish
- **Buyurtma tarixi**: Barcha buyurtmalar tarixini ko'rish va filtrlash
- **Buyurtma detallari**: To'liq buyurtma ma'lumotlari va workflow boshqaruvi
- **Filtrlash**: Holat, to'lov holati, to'lov usuli bo'yicha filtrlash
- **Qidiruv**: Buyurtma raqami va telefon bo'yicha qidiruv

### 2. Linear Workflow Tizimi
Buyurtmalar quyidagi ketma-ketlikda boshqariladi:

1. **Buyurtma yaratish** - Mijoz buyurtma yaratadi
2. **Punkt tasdiqlash** - Punkt buyurtmani tasdiqlaydi
3. **Contragentga so'rov** - Punkt contragentlarga so'rov yuboradi
4. **Contragent javob** - Contragent so'rovni qabul qiladi yoki rad etadi
5. **Contragentdan qabul qilish** - Punkt contragentdan mahsulotlarni qabul qiladi
6. **Punkt-to-Punkt koordinatsiya** - Boshqa tumandagi mahsulotlar uchun punktlar o'rtasida so'rov
7. **Agentga yuborish** - Punkt agentga buyurtmani yuboradi
8. **Agent tasdiqlash** - Agent buyurtmani tasdiqlaydi
9. **Mijoz tasdiqlash** - Mijoz buyurtmani qabul qilishini tasdiqlaydi

### 3. Punkt-to-Punkt So'rovlar
- Boshqa punktlardan kelgan so'rovlarni ko'rish
- So'rovlarni qabul qilish yoki rad etish
- Qabul qilingan so'rovlarni boshqarish
- Holat bo'yicha filtrlash (kutilmoqda, qabul qilindi, rad etilgan, yetkazildi)

### 4. Contragentlar Boshqaruvi
- Contragentlar ro'yxati
- Contragentlarga so'rov yuborish
- Contragent javoblarini kuzatish
- Contragentdan mahsulotlarni qabul qilish

### 5. Agentlar Boshqaruvi
- Agentlar ro'yxati (viloyat, tuman, MFY bo'yicha)
- Buyurtmalarni agentlarga yuborish
- Agent tasdiqlashlarini kuzatish

### 6. KPI (Key Performance Indicator) Tizimi
- KPI balansi ko'rsatkichlari
- KPI transaksiyalari tarixi
- To'langan/to'lanmagan filtrlash
- Sana bo'yicha filtrlash
- KPI hisob-kitoblari

### 7. Xabarnomalar
- Real-time xabarnomalar (har 1 sekunda yangilanadi)
- Unread count ko'rsatkichlari
- Xabarnomalarni o'qilgan deb belgilash
- Xabarnoma turlari bo'yicha filtrlash

### 8. Profil
- Punkt ma'lumotlari
- KPI xulosa
- Xabarlar bo'limi
- Chiqish funksiyasi

## 🛠 Texnologiyalar

- **Framework**: React Native (Expo)
- **Routing**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **Language**: TypeScript
- **UI Components**: Custom components + Ionicons
- **API**: RESTful API integration

## 📦 O'rnatish

### Talablar
- Node.js (v18 yoki yuqori)
- npm yoki yarn
- Expo CLI
- Android Studio (Android uchun) yoki Xcode (iOS uchun)

### O'rnatish qadamlari

1. **Repository ni klonlash**
   ```bash
   git clone <repository-url>
   cd Punkt
   ```

2. **Dependencies ni o'rnatish**
   ```bash
   npm install
   ```

3. **API Base URL ni sozlash**
   
   `app/services/api.ts` faylida `BASE_URL` ni o'zgartiring:
   ```typescript
   const BASE_URL = 'http://your-api-url:port/api';
   ```

4. **Ilovani ishga tushirish**
   ```bash
   npm start
   # yoki
   npx expo start
   ```

5. **Platforma bo'yicha ishga tushirish**
   ```bash
   # Android uchun
   npm run android
   
   # iOS uchun
   npm run ios
   
   # Web uchun
   npm run web
   ```

## 📁 Loyiha Strukturasi

```
Punkt/
├── app/                      # Asosiy ilova kodi
│   ├── (auth)/              # Autentifikatsiya ekranlari
│   │   └── login.tsx        # Login ekrani
│   ├── (tabs)/              # Tab navigation ekranlari
│   │   ├── orders.tsx       # Buyurtmalar ro'yxati
│   │   ├── orders-history.tsx # Buyurtma tarixi
│   │   ├── punkt-requests.tsx # Punkt so'rovlari
│   │   ├── notifications.tsx  # Xabarnomalar
│   │   └── profile.tsx      # Profil
│   ├── order/               # Buyurtma detallari
│   │   └── [id].tsx         # Buyurtma detallari ekrani
│   ├── kpi.tsx              # KPI ekrani
│   ├── components/          # Reusable komponentlar
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── OrderCard.tsx
│   │   ├── AgentPicker.tsx
│   │   ├── ContragentPicker.tsx
│   │   ├── PunktPicker.tsx
│   │   └── ...
│   ├── contexts/            # Context providers
│   │   └── AuthContext.tsx  # Autentifikatsiya context
│   ├── hooks/               # Custom hooks
│   │   └── useUnreadNotifications.ts
│   ├── services/            # API servislari
│   │   └── api.ts           # Asosiy API service
│   ├── _layout.tsx          # Root layout
│   └── index.tsx            # Entry point
├── assets/                  # Rasmlar va boshqa resurslar
├── app.json                 # Expo konfiguratsiyasi
├── package.json             # Dependencies
└── README.md                # Bu fayl
```

## 🔑 Asosiy API Endpointlar

### Autentifikatsiya
- `POST /api/punkts/login` - Punkt login

### Buyurtmalar
- `GET /api/punkt/orders` - Barcha buyurtmalar
- `GET /api/punkt/orders/today` - Bugungi buyurtmalar
- `GET /api/punkt/orders/history` - Buyurtma tarixi
- `GET /api/punkt/orders/:id` - Buyurtma detallari
- `POST /api/punkt/orders/:id/confirm` - Buyurtmani tasdiqlash
- `POST /api/punkt/orders/:id/request-to-contragent` - Contragentga so'rov
- `POST /api/punkt/orders/:id/assign-to-agent` - Agentga yuborish

### Punkt-to-Punkt
- `GET /api/punkt/punkt-to-punkt-requests` - Punkt so'rovlari
- `POST /api/punkt/orders/:id/request-to-punkt` - Punktga so'rov
- `POST /api/punkt/orders/:id/respond-to-punkt-request` - So'rovga javob
- `POST /api/punkt/orders/:id/receive-from-punkt` - Punktdan qabul qilish
- `POST /api/punkt/orders/:id/send-to-punkt` - Punktga yuborish

### Contragentlar
- `GET /api/punkt/orders/:id/contragents` - Buyurtma contragentlari
- `POST /api/punkt/orders/:id/receive-from-contragent` - Contragentdan qabul qilish

### KPI
- `GET /api/punkt/kpi/balance` - KPI balansi
- `GET /api/punkt/kpi/transactions` - KPI transaksiyalari

### Xabarnomalar
- `GET /api/punkts/notifications/list` - Xabarnomalar ro'yxati
- `GET /api/punkts/notifications/unread-count` - Unread count
- `POST /api/punkts/notifications/:id/mark-read` - O'qilgan deb belgilash

## 🎯 Workflow Holatlari

### Holat 1: O'z tumanidagi buyurtma
1. Mijoz buyurtma yaratadi
2. Punkt tasdiqlaydi
3. Contragentga so'rov yuboriladi
4. Contragentdan qabul qilinadi
5. Agentga yuboriladi
6. Agent tasdiqlaydi
7. Mijoz tasdiqlaydi

### Holat 2: Boshqa tumandagi contragent (bir punkt)
1. Mijoz buyurtma yaratadi
2. Punkt tasdiqlaydi
3. Boshqa tumandagi punktga so'rov yuboriladi
4. Ikkinchi punkt qabul qiladi va contragentga so'rov yuboradi
5. Contragentdan qabul qilinadi
6. Ikkinchi punkt birinchi punktga yuboradi
7. Birinchi punkt qabul qiladi va agentga yuboradi
8. Agent tasdiqlaydi
9. Mijoz tasdiqlaydi

### Holat 3: Boshqa tumandagi contragent (ikkita punkt)
1. Mijoz buyurtma yaratadi
2. Birinchi punkt (buyurtmachi tumani) tasdiqlaydi
3. Ikkinchi punktga (contragent tumani) so'rov yuboriladi
4. Ikkinchi punkt qabul qiladi va contragentga so'rov yuboradi
5. Contragentdan qabul qilinadi
6. Ikkinchi punkt birinchi punktga yuboradi
7. Birinchi punkt qabul qiladi va agentga yuboradi
8. Agent tasdiqlaydi
9. Mijoz tasdiqlaydi

## 🔄 Real-time Yangilanishlar

- **Unread count**: Har 1 sekunda avtomatik yangilanadi
- **Buyurtmalar**: Pull-to-refresh orqali yangilash
- **Xabarnomalar**: Real-time yangilanishlar

## 🎨 UI/UX Xususiyatlari

- Modern va intuitiv interfeys
- Responsive dizayn
- Loading states
- Error handling
- Pull-to-refresh
- Infinite scroll (pagination)
- Filter va search funksiyalari
- Status badges va ko'rsatkichlar

## 📝 Development

### Scripts

```bash
# Development server ishga tushirish
npm start

# Android uchun build
npm run android

# iOS uchun build
npm run ios

# Web uchun build
npm run web

# Linting
npm run lint
```

### Code Structure

- **Components**: Reusable UI komponentlar
- **Contexts**: Global state management
- **Hooks**: Custom React hooks
- **Services**: API integration
- **Screens**: Ekran komponentlari

## 🔒 Xavfsizlik

- JWT token-based autentifikatsiya
- AsyncStorage da token saqlash
- API so'rovlarida token header
- Protected routes

## 🐛 Muammolarni Hal Qilish

### API ulanish muammolari
- `BASE_URL` ni tekshiring
- Network connectivity ni tekshiring
- Backend server ishlayotganini tekshiring

### Build muammolari
- `node_modules` ni o'chirib qayta o'rnatish:
  ```bash
  rm -rf node_modules
  npm install
  ```

### Cache muammolari
- Expo cache ni tozalash:
  ```bash
  npx expo start -c
  ```

## 📄 License

Bu loyiha private loyiha hisoblanadi.

## 👥 Mualliflar

Loyiha jamoasi tomonidan ishlab chiqilgan.

## 📞 Aloqa

Savollar yoki takliflar uchun loyiha boshqaruvchilari bilan bog'laning.

---

**Versiya**: 1.0.0  
**Oxirgi yangilanish**: 2025
