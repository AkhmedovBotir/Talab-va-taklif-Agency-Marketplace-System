# Punkt - Logistika Punkti Boshqaruv Tizimi

Punkt - bu logistika punktlari uchun mo'ljallangan mobil ilova bo'lib, buyurtmalarni boshqarish, punktlar o'rtasida koordinatsiya, kontragentlar va agentlar bilan ishlash, KPI hisob-kitoblari va xabarnomalar boshqaruvini ta'minlaydi.

## 📱 Asosiy Xususiyatlar

### 1. Buyurtma Boshqaruvi
- **Bugungi buyurtmalar**: Faqat bugungi buyurtmalarni ko'rish (`orders.tsx`)
- **Buyurtma tarixi**: Barcha buyurtmalar tarixini ko'rish va filtrlash (`orders-history.tsx`)
- **Buyurtma detallari**: To'liq buyurtma ma'lumotlari va workflow boshqaruvi (`order/[id].tsx`)
- **Filtrlash**: Holat, to'lov holati, to'lov usuli bo'yicha filtrlash
- **Qidiruv**: Buyurtma raqami va telefon bo'yicha qidiruv
- **Pagination**: Infinite scroll yoki sahifalash orqali ko'p miqdordagi buyurtmalarni yuklash

### 2. Linear Workflow Tizimi
Buyurtmalar quyidagi ketma-ketlikda boshqariladi:

1. **Buyurtma yaratish** - Mijoz buyurtma yaratadi
2. **Punkt tasdiqlash** - Punkt buyurtmani tasdiqlaydi (`confirmOrder`)
3. **Contragentga so'rov** - Punkt contragentlarga so'rov yuboradi (`requestToContragent`)
4. **Contragent javob** - Contragent so'rovni qabul qiladi yoki rad etadi
5. **Contragentdan qabul qilish** - Punkt contragentdan mahsulotlarni qabul qiladi (`receiveFromContragent`)
6. **Punkt-to-Punkt koordinatsiya** - Boshqa tumandagi mahsulotlar uchun punktlar o'rtasida so'rov (`requestToPunkt`, `receiveFromPunkt`, `sendToPunkt`)
7. **Agentga yuborish** - Punkt agentga buyurtmani yuboradi (`assignOrderToAgent`)
8. **Agent tasdiqlash** - Agent buyurtmani tasdiqlaydi
9. **Mijoz tasdiqlash** - Mijoz buyurtmani qabul qilishini tasdiqlaydi

### 3. Punkt-to-Punkt So'rovlar
- Boshqa punktlardan kelgan so'rovlarni ko'rish (`punkt-requests.tsx`)
- So'rovlarni qabul qilish yoki rad etish (`respondToPunktRequest`)
- Qabul qilingan so'rovlarni boshqarish
- Holat bo'yicha filtrlash (kutilmoqda, qabul qilindi, rad etilgan, yetkazildi)
- Avtomatik qabul qilish funksiyasi (pending so'rovni to'g'ridan-to'g'ri qabul qilish)

### 4. Contragentlar Boshqaruvi
- Contragentlar ro'yxati (`getOrderContragents`)
- Contragentlarga so'rov yuborish (`requestToContragent`)
- Contragent javoblarini kuzatish
- Contragentdan mahsulotlarni qabul qilish (`receiveFromContragent`)
- Auto-route funksiyasi - avtomatik contragent va punkt tanlash (`autoRouteOrder`)

### 5. Agentlar Boshqaruvi
- Agentlar ro'yxati (viloyat, tuman, MFY bo'yicha) (`getAgentsForSelection`)
- Buyurtmalarni agentlarga yuborish (`assignOrderToAgent`)
- Agent tasdiqlashlarini kuzatish
- Agent turi bo'yicha filtrlash (viloyat, tuman, MFY)

### 6. KPI (Key Performance Indicator) Tizimi
- KPI balansi ko'rsatkichlari (`getKpiBalance`)
- KPI transaksiyalari tarixi (`getKpiTransactions`)
- KPI xulosa (`getKpiSummary`)
- To'langan/to'lanmagan filtrlash
- Sana bo'yicha filtrlash
- KPI hisob-kitoblari
- KPI bonus turlari: regular, from_punkt, to_punkt

### 7. Xabarnomalar
- Real-time xabarnomalar (har 1 sekunda yangilanadi) (`useUnreadNotifications`)
- Unread count ko'rsatkichlari
- Xabarnomalarni o'qilgan deb belgilash (`markNotificationAsRead`, `markAllNotificationsAsRead`)
- Xabarnoma turlari bo'yicha filtrlash (info, warning, success, error, announcement, promotion, update)
- Xabarnoma detallari modal oynasi

### 8. Profil
- Punkt ma'lumotlari
- KPI xulosa (`KpiSummarySection`)
- Xabarlar bo'limi
- Chiqish funksiyasi (`logout`)

### 9. Autentifikatsiya va Xavfsizlik
- Telefon raqami va parol orqali kirish (`login`)
- JWT token-based autentifikatsiya
- Device verification - yangi qurilmalar uchun SMS kod orqali tasdiqlash
- Password setup - yangi foydalanuvchilar uchun 3 bosqichli parol o'rnatish
- Auto-logout - device xatosi yoki 401/403 xatoliklarda avtomatik chiqish
- Token AsyncStorage da saqlash

## 🛠 Texnologiyalar va Dependencies

### Core Framework
- **React Native**: 0.81.5
- **Expo**: ~54.0.25
- **React**: 19.1.0
- **TypeScript**: ~5.9.2

### Navigation & Routing
- **Expo Router**: ~6.0.15 (file-based routing)
- **React Navigation**: Bottom tabs va stack navigation

### State Management
- **React Context API**: Global state management (`AuthContext`)
- **AsyncStorage**: @react-native-async-storage/async-storage (v2.1.0)

### UI Components
- **@expo/vector-icons**: Ionicons icon library
- **Custom Components**: Button, Input, OrderCard, LoadingSpinner, va boshqalar
- **React Native Components**: Native UI components

### Utilities
- **expo-constants**: Device information
- **expo-font**: Font loading
- **expo-haptics**: Haptic feedback
- **expo-image**: Image optimization
- **@react-native-community/datetimepicker**: Date/Time picker

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Type safety

## 📦 O'rnatish va Konfiguratsiya

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
   const BASE_URL = 'https://api.ttsa.uz/api';
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

## 📁 Loyiha Strukturasi va Arxitektura

```
Punkt/
├── app/                      # Asosiy ilova kodi
│   ├── _layout.tsx          # Root layout (Stack navigation + AuthProvider)
│   ├── index.tsx             # Entry point (authentication check)
│   │
│   ├── (auth)/               # Autentifikatsiya ekranlari
│   │   └── login.tsx          # Login ekrani (device verification, password setup)
│   │
│   ├── (tabs)/               # Tab navigation ekranlari
│   │   ├── _layout.tsx       # Tab navigation layout
│   │   ├── orders.tsx        # Bugungi buyurtmalar
│   │   ├── orders-history.tsx # Buyurtma tarixi
│   │   ├── punkt-requests.tsx # Punkt-to-punkt so'rovlari
│   │   ├── notifications.tsx  # Xabarnomalar (hidden tab)
│   │   └── profile.tsx        # Profil ekrani
│   │
│   ├── order/                # Buyurtma detallari
│   │   └── [id].tsx          # Dynamic route - buyurtma detallari
│   │
│   ├── kpi.tsx               # KPI transaksiyalari ekrani
│   │
│   ├── components/           # Reusable UI komponentlar
│   │   ├── Button.tsx        # Universal button component
│   │   ├── Input.tsx         # Text input component
│   │   ├── OrderCard.tsx     # Buyurtma kartasi
│   │   ├── LoadingSpinner.tsx # Loading indicator
│   │   ├── AgentPicker.tsx   # Agent tanlash komponenti
│   │   ├── ContragentPicker.tsx # Contragent tanlash
│   │   ├── PunktPicker.tsx   # Punkt tanlash
│   │   ├── KpiBalanceCard.tsx # KPI balans kartasi
│   │   ├── KpiBalanceBadge.tsx # KPI balans badge
│   │   └── KpiSummarySection.tsx # KPI xulosa bo'limi
│   │
│   ├── contexts/            # Context providers
│   │   └── AuthContext.tsx   # Authentication context (token, punkt, login, logout)
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useUnreadNotifications.ts # Unread count hook (1 sekunda refresh)
│   │   ├── useKpiBalance.ts  # KPI balans hook
│   │   └── useKpiSummary.ts # KPI xulosa hook
│   │
│   ├── services/             # API servislari
│   │   └── api.ts            # Asosiy API service (1203 qator)
│   │
│   └── utils/                # Utility funksiyalar
│       └── device.ts         # Device ID va device info
│
├── assets/                   # Rasmlar va boshqa resurslar
│   ├── icon.png              # App icon
│   └── images/               # Image assets
│
├── android/                  # Android native code (excluded from review)
│
├── app.json                  # Expo konfiguratsiyasi
├── package.json              # Dependencies va scripts
├── tsconfig.json             # TypeScript konfiguratsiyasi
├── eslint.config.js          # ESLint konfiguratsiyasi
└── README.md                 # Bu fayl
```

## 🔑 API Service Arxitekturasi

### ApiService Class (`app/services/api.ts`)

API service singleton pattern bilan ishlaydi va quyidagi funksiyalarni ta'minlaydi:

#### Token Management
- `setToken(token)`: Token ni saqlash
- `getToken()`: Token ni olish
- `setOnDeviceError(callback)`: Device xatosi callback

#### Request Method
- `request<T>(endpoint, options)`: Universal request method
  - Automatic token injection
  - Error handling (401, 403)
  - Device error detection
  - Auto-logout on authentication errors

#### Autentifikatsiya Endpoints
- `login(credentials, deviceId)`: Login with device verification support
- `passwordSetupStep1/2/3`: 3-bosqichli parol o'rnatish
- `requestDeviceVerificationCode`: Device verification kod so'rash
- `verifyDevice`: Device verification kodni tekshirish
- `resendDeviceVerificationCode`: Kodni qayta yuborish

#### Buyurtma Endpoints
- `getOrders(params)`: Barcha buyurtmalar (filtering, pagination)
- `getTodayOrders(params)`: Bugungi buyurtmalar
- `getOrdersHistory(params)`: Buyurtma tarixi
- `getOrderById(id)`: Buyurtma detallari
- `confirmOrder(id)`: Buyurtmani tasdiqlash
- `autoRouteOrder(id)`: Avtomatik routing

#### Contragent Endpoints
- `getOrderContragents(id)`: Buyurtma contragentlari
- `requestToContragent(id, data)`: Contragentga so'rov
- `receiveFromContragent(id)`: Contragentdan qabul qilish

#### Punkt-to-Punkt Endpoints
- `getPunktToPunktRequests(params)`: Punkt so'rovlari
- `requestToPunkt(id, data)`: Punktga so'rov
- `respondToPunktRequest(id, data)`: So'rovga javob
- `receiveFromPunkt(id)`: Punktdan qabul qilish
- `sendToPunkt(id, data)`: Punktga yuborish

#### Agent Endpoints
- `getAgentsForSelection(params)`: Agentlar ro'yxati (public endpoint)
- `assignOrderToAgent(id, data)`: Agentga yuborish

#### Punkt Selection Endpoints
- `getPunktsForSelection(params)`: Punktlar ro'yxati (public endpoint)

#### KPI Endpoints
- `getKpiBalance(date)`: KPI balansi
- `getKpiTransactions(params)`: KPI transaksiyalari
- `getKpiSummary(params)`: KPI xulosa
- `getKpiDailyReport(params)`: KPI kunlik hisobot

#### Xabarnoma Endpoints
- `getNotifications(params)`: Xabarnomalar ro'yxati
- `getUnreadNotificationsCount()`: Unread count
- `markNotificationAsRead(id)`: O'qilgan deb belgilash
- `markAllNotificationsAsRead()`: Barchasini o'qilgan deb belgilash

## 🎯 Workflow Holatlari va Ish Jarayonlari

### Holat 1: O'z Tumanidagi Buyurtma (Simple Flow)

**Ish Jarayoni:**
1. **Mijoz buyurtma yaratadi** - Backend orqali
2. **Punkt tasdiqlaydi** - `confirmOrder` API chaqiruvi
   - Status: `pending` → `confirmed_by_punkt`
   - `confirmedByPunkt` field to'ldiriladi
   - `currentPunkt` o'rnatiladi
3. **Contragentga so'rov** - `requestToContragent` API
   - Status: `confirmed_by_punkt` → `requested_to_contragent`
   - `contragentRequests` array ga qo'shiladi
4. **Contragent javob beradi** - Backend orqali
   - Status: `requested_to_contragent` → `accepted_by_contragent`
5. **Contragentdan qabul qilish** - `receiveFromContragent` API
   - Status: `accepted_by_contragent` → `delivered_to_punkt`
6. **Agentga yuborish** - `assignOrderToAgent` API
   - Status: `delivered_to_punkt` → `assigned_to_agent`
   - `assignedToAgent` field to'ldiriladi
7. **Agent tasdiqlaydi** - Backend orqali
   - Status: `assigned_to_agent` → `confirmed_by_agent`
8. **Mijoz tasdiqlaydi** - Backend orqali
   - Status: `confirmed_by_agent` → `confirmed_by_customer`

**Kodda ko'rsatilgan joylar:**
- `order/[id].tsx`: Button visibility logic (canConfirm, canRequestToContragent, canReceiveFromContragent, canAssignToAgent)

### Holat 2: Boshqa Tumandagi Contragent (Bir Punkt)

**Ish Jarayoni:**
1. **Mijoz buyurtma yaratadi**
2. **Punkt tasdiqlaydi** - `confirmOrder`
3. **Boshqa tumandagi punktga so'rov** - `requestToPunkt`
   - Status: `confirmed_by_punkt` → `requested_to_contragent`
   - `punktToPunktRequests` array ga qo'shiladi
4. **Ikkinchi punkt qabul qiladi** - `respondToPunktRequest('accepted')` yoki `receiveFromPunkt` (auto-accept)
   - Status: `pending` → `accepted` (request)
   - `currentPunkt` ikkinchi punktga o'zgaradi
5. **Ikkinchi punkt contragentga so'rov yuboradi** - `requestToContragent`
6. **Contragentdan qabul qilinadi** - `receiveFromContragent`
7. **Ikkinchi punkt birinchi punktga yuboradi** - `sendToPunkt`
   - Status: `accepted` → `delivered` (request)
8. **Birinchi punkt qabul qiladi** - `receiveFromPunkt`
   - `currentPunkt` birinchi punktga qaytadi
9. **Agentga yuboriladi** - `assignOrderToAgent`
10. **Agent va mijoz tasdiqlaydi**

**Kodda ko'rsatilgan joylar:**
- `order/[id].tsx`: canRequestToPunkt, canReceiveFromPunkt, canSendToPunkt logic

### Holat 3: Boshqa Tumandagi Contragent (Ikkita Punkt)

**Ish Jarayoni:**
1. **Mijoz buyurtma yaratadi** (masalan, Buloqboshi tumani)
2. **Birinchi punkt (buyurtmachi tumani) tasdiqlaydi** - `confirmOrder`
   - Masalan: Buloqboshi punkti
3. **Ikkinchi punktga (contragent tumani) so'rov** - `requestToPunkt`
   - Masalan: Asaka punktiga
   - `punktToPunktRequests`: fromPunktId = Buloqboshi, toPunktId = Asaka
4. **Ikkinchi punkt qabul qiladi** - `respondToPunktRequest('accepted')` yoki `receiveFromPunkt`
   - `currentPunkt` = Asaka punkti
   - Request status: `pending` → `accepted`
5. **Ikkinchi punkt contragentga so'rov yuboradi** - `requestToContragent`
6. **Contragentdan qabul qilinadi** - `receiveFromContragent`
   - Status: `accepted_by_contragent` → `delivered_to_punkt`
7. **Ikkinchi punkt birinchi punktga yuboradi** - `sendToPunkt`
   - Request status: `accepted` → `delivered`
   - `currentPunkt` = Buloqboshi punkti (qaytadi)
8. **Birinchi punkt qabul qiladi** - `receiveFromPunkt`
   - Status: `delivered_to_punkt` (saqlanadi)
9. **Agentga yuboriladi** - `assignOrderToAgent`
   - Faqat buyurtmachi tumani punkti (Buloqboshi) agentga yuboradi
10. **Agent va mijoz tasdiqlaydi**

**Kodda ko'rsatilgan joylar:**
- `order/[id].tsx`: Complex button visibility logic
  - `canSendToPunkt`: Ikkinchi punkt uchun (kontragent tumani)
  - `canAssignToAgent`: Faqat birinchi punkt uchun (buyurtmachi tumani)
  - `isOrderInPunktTuman`: Tuman tekshiruvi
  - `hasReceivedFromPunktRequest`: Punktdan qabul qilinganligini tekshirish

## 🔄 Real-time Yangilanishlar va State Management

### Unread Notifications Hook
```typescript
// app/hooks/useUnreadNotifications.ts
- Har 1 sekunda avtomatik yangilanadi
- isAuthenticated tekshiruvi
- Error handling (logout holatida error ko'rsatmaydi)
```

### KPI Hooks
- `useKpiBalance`: KPI balans ma'lumotlari
- `useKpiSummary`: KPI xulosa ma'lumotlari
- Refresh funksiyalari bilan

### Context API
- `AuthContext`: Global authentication state
  - Token management
  - Punkt ma'lumotlari
  - Login/Logout funksiyalari
  - Auto-logout on device errors

## 🎨 UI/UX Xususiyatlari va Komponentlar

### Button Component
- Variants: primary, secondary, danger, outline
- Loading state
- Disabled state
- Custom styles support

### OrderCard Component
- Status badges (rangli)
- Punkt status ko'rsatkichlari
- Agent ma'lumotlari
- Formatlangan narx va sana

### Input Component
- Label support
- Placeholder
- Custom styles
- Container style support

### LoadingSpinner Component
- Centered loading indicator
- Reusable across app

### Picker Components
- `AgentPicker`: Agent tanlash (viloyat, tuman, MFY filter)
- `ContragentPicker`: Contragent tanlash (order-based)
- `PunktPicker`: Punkt tanlash (viloyat, tuman filter)

### KPI Components
- `KpiBalanceCard`: KPI balans kartasi (orders.tsx da)
- `KpiBalanceBadge`: KPI balans badge
- `KpiSummarySection`: KPI xulosa bo'limi (profile.tsx da)

## 🔒 Xavfsizlik va Autentifikatsiya

### Device Verification
- Yangi qurilmalar uchun SMS kod orqali tasdiqlash
- Device ID generation va saqlash (AsyncStorage)
- Device info collection (device name, platform, OS)
- Auto-logout on device errors (403)

### Password Setup
- 3 bosqichli jarayon:
  1. Telefon raqamini kiriting
  2. SMS kodni kiriting
  3. Yangi parol o'rnating
- Auto-login after password setup

### Token Management
- JWT token AsyncStorage da saqlash
- Automatic token injection in API requests
- Auto-logout on 401/403 errors
- Token refresh logic (if implemented in backend)

### Error Handling
- Network error handling
- API error handling
- User-friendly error messages
- Auto-logout on authentication failures

## 📊 KPI Tizimi

### KPI Balance
- Kunlik balans ko'rsatkichlari
- Total transactions
- Paid/Unpaid amounts
- Paid/Unpaid transaction counts

### KPI Transactions
- Transaction history
- Pagination support
- Filtering (date range, payment status)
- Transaction details:
  - Order number
  - Product name
  - Quantity
  - Price
  - KPI bonus percent
  - Bonus type (regular, from_punkt, to_punkt)
  - Payment status

### KPI Summary
- Total transactions
- Total amount
- Paid amount
- Unpaid amount

## 🔔 Xabarnomalar Tizimi

### Xabarnoma Turlari
- `info`: Ma'lumot
- `warning`: Ogohlantirish
- `success`: Muvaffaqiyat
- `error`: Xatolik
- `announcement`: E'lon
- `promotion`: Aksiya
- `update`: Yangilanish

### Xabarnoma Funksiyalari
- Real-time unread count (1 sekunda)
- Mark as read (single/all)
- Xabarnoma detallari modal
- Type-based styling va icons

## 📱 Ekranlar va Navigation

### Tab Navigation
1. **Buyurtmalar** (`orders.tsx`)
   - Bugungi buyurtmalar
   - KPI balans kartasi
   - Search va filter
   - Pull-to-refresh
   - Infinite scroll

2. **So'rovlar** (`punkt-requests.tsx`)
   - Punkt-to-punkt so'rovlar
   - Status filter
   - Accept/Reject actions
   - Receive action

3. **Punkt So'rovlari** (`punkt-requests.tsx`)
   - Boshqa punktlardan kelgan so'rovlar
   - Status filter
   - Action buttons

4. **Profil** (`profile.tsx`)
   - Punkt ma'lumotlari
   - KPI xulosa
   - Xabarlar linki (unread count badge)
   - Logout

### Stack Navigation
- **Login** (`(auth)/login.tsx`)
- **Order Details** (`order/[id].tsx`)
- **Orders History** (`(tabs)/orders-history.tsx`)
- **Notifications** (`(tabs)/notifications.tsx`)
- **KPI** (`kpi.tsx`)

## 🔑 Asosiy API Endpointlar

### Autentifikatsiya
- `POST /api/punkts/login` - Punkt login (device verification support)
- `POST /api/punkts/password-setup/step1` - Parol o'rnatish 1-bosqich
- `POST /api/punkts/password-setup/step2` - Parol o'rnatish 2-bosqich
- `POST /api/punkts/password-setup/step3` - Parol o'rnatish 3-bosqich
- `POST /api/device-verification/punkt/request-code` - Device verification kod so'rash
- `POST /api/device-verification/punkt/verify` - Device verification kodni tekshirish
- `POST /api/device-verification/punkt/resend-code` - Kodni qayta yuborish

### Buyurtmalar
- `GET /api/punkt/orders` - Barcha buyurtmalar (filtering, pagination)
- `GET /api/punkt/orders/today` - Bugungi buyurtmalar
- `GET /api/punkt/orders/history` - Buyurtma tarixi
- `GET /api/punkt/orders/:id` - Buyurtma detallari
- `POST /api/punkt/orders/:id/confirm` - Buyurtmani tasdiqlash
- `POST /api/punkt/orders/:id/auto-route` - Avtomatik routing

### Contragentlar
- `GET /api/punkt/orders/:id/contragents` - Buyurtma contragentlari
- `POST /api/punkt/orders/:id/request-to-contragent` - Contragentga so'rov
- `POST /api/punkt/orders/:id/receive-from-contragent` - Contragentdan qabul qilish

### Punkt-to-Punkt
- `GET /api/punkt/punkt-to-punkt-requests` - Punkt so'rovlari
- `POST /api/punkt/orders/:id/request-to-punkt` - Punktga so'rov
- `POST /api/punkt/punkt-to-punkt-requests/:id/respond` - So'rovga javob
- `POST /api/punkt/orders/:id/receive-from-punkt` - Punktdan qabul qilish
- `POST /api/punkt/orders/:id/send-to-punkt` - Punktga yuborish

### Agentlar
- `GET /api/agents/selection` - Agentlar ro'yxati (public)
- `POST /api/punkt/orders/:id/assign-to-agent` - Agentga yuborish

### Punktlar
- `GET /api/punkts/selection` - Punktlar ro'yxati (public)

### KPI
- `GET /api/punkt/kpi/balance` - KPI balansi
- `GET /api/punkt/kpi/transactions` - KPI transaksiyalari
- `GET /api/punkt/kpi/summary` - KPI xulosa
- `GET /api/punkt/kpi/reports/daily` - KPI kunlik hisobot

### Xabarnomalar
- `GET /api/punkts/notifications/list` - Xabarnomalar ro'yxati
- `GET /api/punkts/notifications/unread-count` - Unread count
- `POST /api/punkts/notifications/:id/read` - O'qilgan deb belgilash
- `POST /api/punkts/notifications/read-all` - Barchasini o'qilgan deb belgilash

## 🎯 Workflow Holatlari (Batafsil)

### Holat 1: O'z Tumanidagi Buyurtma

**Ish Jarayoni:**
1. Mijoz buyurtma yaratadi (Backend)
2. Punkt tasdiqlaydi → `confirmOrder(id)`
   - API: `POST /api/punkt/orders/:id/confirm`
   - Status: `pending` → `confirmed_by_punkt`
   - `confirmedByPunkt` = current punkt
   - `currentPunkt` = current punkt
3. Contragentga so'rov → `requestToContragent(id, {contragentId})`
   - API: `POST /api/punkt/orders/:id/request-to-contragent`
   - Status: `confirmed_by_punkt` → `requested_to_contragent`
   - `contragentRequests` array ga qo'shiladi
4. Contragent javob beradi (Backend)
   - Status: `requested_to_contragent` → `accepted_by_contragent`
5. Contragentdan qabul qilish → `receiveFromContragent(id)`
   - API: `POST /api/punkt/orders/:id/receive-from-contragent`
   - Status: `accepted_by_contragent` → `delivered_to_punkt`
6. Agentga yuborish → `assignOrderToAgent(id, {agentId})`
   - API: `POST /api/punkt/orders/:id/assign-to-agent`
   - Status: `delivered_to_punkt` → `assigned_to_agent`
   - `assignedToAgent` = selected agent
7. Agent tasdiqlaydi (Backend)
   - Status: `assigned_to_agent` → `confirmed_by_agent`
8. Mijoz tasdiqlaydi (Backend)
   - Status: `confirmed_by_agent` → `confirmed_by_customer`

**Button Visibility Logic:**
- `canConfirm`: `isPending && (isCurrentPunkt || !order.currentPunkt)`
- `canRequestToContragent`: `(isMyPunkt || isCurrentPunkt) && !isAssignedToAgent && isConfirmedByPunkt && hasUnrequestedContragents`
- `canReceiveFromContragent`: `(isAcceptedByContragent || hasAcceptedContragentRequest) && (isMyPunkt || isCurrentPunkt) && !isDeliveredToPunkt && !isAssignedToAgent`
- `canAssignToAgent`: `isDeliveredToPunkt && isOrderInPunktTuman && (isMyPunkt || isCurrentPunkt) && !isAssignedToAgent`

### Holat 2: Boshqa Tumandagi Contragent (Bir Punkt)

**Ish Jarayoni:**
1. Mijoz buyurtma yaratadi
2. Punkt tasdiqlaydi → `confirmOrder(id)`
3. Boshqa tumandagi punktga so'rov → `requestToPunkt(id, {toPunktId})`
   - API: `POST /api/punkt/orders/:id/request-to-punkt`
   - `punktToPunktRequests` array ga qo'shiladi
   - Status: `pending` (request)
4. Ikkinchi punkt qabul qiladi → `respondToPunktRequest(id, {response: 'accepted'})` yoki `receiveFromPunkt(id)` (auto-accept)
   - API: `POST /api/punkt/punkt-to-punkt-requests/:id/respond` yoki `POST /api/punkt/orders/:id/receive-from-punkt`
   - Request status: `pending` → `accepted`
   - `currentPunkt` = ikkinchi punkt
5. Ikkinchi punkt contragentga so'rov yuboradi → `requestToContragent(id, {contragentId})`
6. Contragentdan qabul qilinadi → `receiveFromContragent(id)`
7. Ikkinchi punkt birinchi punktga yuboradi → `sendToPunkt(id, {toPunktId})`
   - API: `POST /api/punkt/orders/:id/send-to-punkt`
   - Request status: `accepted` → `delivered`
   - `currentPunkt` = birinchi punkt
8. Birinchi punkt qabul qiladi → `receiveFromPunkt(id)`
9. Agentga yuboriladi → `assignOrderToAgent(id, {agentId})`
10. Agent va mijoz tasdiqlaydi

**Button Visibility Logic:**
- `canRequestToPunkt`: `isMyPunkt && !isAssignedToAgent && (isConfirmedByPunkt || (isRequestedToContragent && hasOtherTumanContragents))`
- `canReceiveFromPunkt`: `(hasPendingPunktToPunktRequest || hasAcceptedPunktToPunktRequest || hasDeliveredPunktToPunktRequestToThisPunkt) && !isDeliveredToPunkt && !isAssignedToAgent && !canReceiveFromContragent`
- `canSendToPunkt`: `isCurrentPunkt && !isOrderInPunktTuman && isDeliveredToPunkt && acceptedRequestToThisPunkt.status === 'accepted' && !hasDeliveredPunktToPunktRequest && !isAssignedToAgent`

### Holat 3: Boshqa Tumandagi Contragent (Ikkita Punkt)

**Ish Jarayoni:**
1. Mijoz buyurtma yaratadi (masalan, Buloqboshi tumani)
2. Birinchi punkt (buyurtmachi tumani) tasdiqlaydi → `confirmOrder(id)`
   - Masalan: Buloqboshi punkti
   - `confirmedByPunkt` = Buloqboshi
   - `currentPunkt` = Buloqboshi
3. Ikkinchi punktga (contragent tumani) so'rov → `requestToPunkt(id, {toPunktId})`
   - Masalan: Asaka punktiga
   - `punktToPunktRequests`: fromPunktId = Buloqboshi, toPunktId = Asaka, status = `pending`
4. Ikkinchi punkt qabul qiladi → `respondToPunktRequest(id, {response: 'accepted'})` yoki `receiveFromPunkt(id)`
   - Request status: `pending` → `accepted`
   - `currentPunkt` = Asaka punkti
5. Ikkinchi punkt contragentga so'rov yuboradi → `requestToContragent(id, {contragentId})`
6. Contragentdan qabul qilinadi → `receiveFromContragent(id)`
   - Status: `accepted_by_contragent` → `delivered_to_punkt`
7. Ikkinchi punkt birinchi punktga yuboradi → `sendToPunkt(id, {toPunktId})`
   - Request status: `accepted` → `delivered`
   - `currentPunkt` = Buloqboshi punkti (qaytadi)
8. Birinchi punkt qabul qiladi → `receiveFromPunkt(id)`
   - Status: `delivered_to_punkt` (saqlanadi)
9. Agentga yuboriladi → `assignOrderToAgent(id, {agentId})`
   - Faqat buyurtmachi tumani punkti (Buloqboshi) agentga yuboradi
   - Status: `delivered_to_punkt` → `assigned_to_agent`
10. Agent va mijoz tasdiqlaydi

**Button Visibility Logic:**
- `canSendToPunkt`: `isCurrentPunkt && !isOrderInPunktTuman && isDeliveredToPunkt && acceptedRequestToThisPunkt.status === 'accepted' && !hasDeliveredPunktToPunktRequest && !isAssignedToAgent && !canReceiveFromContragent && !canReceiveFromPunkt`
- `canAssignToAgent`: `isDeliveredToPunkt && isOrderInPunktTuman && (isMyPunkt || isCurrentPunkt || hasReceivedFromPunktRequest) && !isAssignedToAgent && !canReceiveFromContragent && !canReceiveFromPunkt && !canSendToPunkt`

## 🔄 Real-time Yangilanishlar

### Unread Notifications
- **Hook**: `useUnreadNotifications`
- **Refresh Interval**: 1 sekunda
- **Implementation**: `setInterval(fetchUnreadCount, 1000)`
- **Location**: `app/hooks/useUnreadNotifications.ts`

### Pull-to-Refresh
- **Orders Screen**: `RefreshControl` component
- **Orders History**: `RefreshControl` component
- **Punkt Requests**: `RefreshControl` component
- **Notifications**: `RefreshControl` component
- **KPI Screen**: `RefreshControl` component

### Infinite Scroll
- **Orders Screen**: `onEndReached` handler
- **Orders History**: `onEndReached` handler
- **Notifications**: `onEndReached` handler
- **KPI Screen**: `onEndReached` handler

## 🎨 UI/UX Xususiyatlari

### Modern Design
- Clean va minimalist dizayn
- Consistent color scheme (#007AFF primary color)
- Card-based layout
- Status badges with colors
- Icon usage (Ionicons)

### Loading States
- `LoadingSpinner` component
- Button loading states
- Skeleton screens (if implemented)

### Error Handling
- User-friendly error messages
- Alert dialogs
- Error states in UI

### Empty States
- Empty list messages
- Empty state icons
- Helpful messages

### Filtering va Search
- Real-time search
- Multiple filter options
- Active filter indicators
- Clear filters functionality

### Status Indicators
- Color-coded status badges
- Punkt status indicators
- Payment status indicators
- Request status indicators

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

- **Components**: Reusable UI komponentlar (`app/components/`)
- **Contexts**: Global state management (`app/contexts/`)
- **Hooks**: Custom React hooks (`app/hooks/`)
- **Services**: API integration (`app/services/`)
- **Screens**: Ekran komponentlari (`app/(tabs)/`, `app/(auth)/`)
- **Utils**: Utility funksiyalar (`app/utils/`)

### TypeScript Configuration
- Strict mode enabled
- Path aliases configured
- Expo base config extended

### ESLint Configuration
- Expo ESLint config
- Custom ignores

## 🔒 Xavfsizlik

### Authentication
- JWT token-based autentifikatsiya
- AsyncStorage da token saqlash
- API so'rovlarida token header (`Authorization: Bearer <token>`)
- Protected routes (authentication check in `index.tsx`)

### Device Verification
- Device ID generation va saqlash
- SMS kod orqali tasdiqlash
- Device info collection
- Auto-logout on device errors

### Error Handling
- 401 errors: Auto-logout
- 403 errors (device-related): Auto-logout
- Network errors: User-friendly messages
- API errors: Error messages from backend

### Data Protection
- Token AsyncStorage da saqlash
- Sensitive data not logged
- Secure API communication (HTTPS)

## 🐛 Muammolarni Hal Qilish

### API ulanish muammolari
- `BASE_URL` ni tekshiring (`app/services/api.ts`)
- Network connectivity ni tekshiring
- Backend server ishlayotganini tekshiring
- CORS settings (web uchun)

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

### Device Verification muammolari
- Device ID ni tozalash:
  ```typescript
  import { clearDeviceId } from './utils/device';
  await clearDeviceId();
  ```

### Token muammolari
- Token ni tozalash:
  ```typescript
  await AsyncStorage.removeItem('@punkt_token');
  await AsyncStorage.removeItem('@punkt_data');
  ```

## 📊 Ma'lumotlar Strukturasi

### Order Interface
```typescript
interface Order {
  _id: string;
  orderNumber: string;
  user: { _id: string; name: string; phone: string };
  items: OrderItem[];
  totalPrice: number;
  totalOriginalPrice: number;
  totalKpiPrice: number;
  itemCount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 
          'confirmed_by_punkt' | 'requested_to_contragent' | 'accepted_by_contragent' | 
          'delivered_to_punkt' | 'assigned_to_agent' | 'confirmed_by_agent' | 
          'confirmed_by_customer';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cash' | 'card';
  deliveryViloyat: Region;
  deliveryTuman: Region | null;
  deliveryMfy: Region | null;
  deliveryNote: string;
  phoneNumber: string;
  punktRequests: PunktRequest[];
  punktToPunktRequests?: PunktToPunktRequest[];
  contragentRequests?: Array<{...}>;
  confirmedByPunkt: Punkt | null;
  punktStatus: 'pending' | 'confirmed' | 'rejected' | 'requested';
  assignedToAgent: Agent | null;
  assignedByPunkt: Punkt | null;
  assignedAt: string | null;
  currentPunkt?: string | Punkt | null;
  createdAt: string;
  updatedAt: string;
}
```

### Punkt Interface
```typescript
interface Punkt {
  _id: string;
  name: string;
  phone: string;
  viloyat: Region;
  tuman: Region;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

### Agent Interface
```typescript
interface Agent {
  _id: string;
  name: string;
  phone: string;
  viloyat: Region;
  tuman: Region | null;
  mfy: Region | null;
  status: string;
  agentType: 'viloyat' | 'tuman' | 'mfy';
}
```

### KPI Transaction Interface
```typescript
interface KpiTransaction {
  _id: string;
  order: { _id: string; orderNumber: string; status: string; totalPrice: number };
  orderItem: {
    product: { _id: string; name: string; price: number; productCode: string };
    quantity: number;
    price: number;
    kpiBonusPercent: number;
  };
  distributionConfig: { _id: string; name: string };
  recipients: {
    fromPunkt?: { _id: string; name: string };
    toPunkt?: { _id: string; name: string };
  };
  orderStatus: string;
  isPaid: boolean;
  punktAmount: number;
  bonusType: 'regular' | 'from_punkt' | 'to_punkt';
  createdAt: string;
}
```

## 🚀 Performance Optimizations

### Code Optimizations
- `useCallback` hooks for function memoization
- `useMemo` for computed values (if needed)
- Lazy loading for screens
- Image optimization (expo-image)

### API Optimizations
- Pagination support
- Filtering on backend
- Caching strategies (if implemented)

### UI Optimizations
- FlatList for large lists
- Virtualized lists
- Optimized re-renders

## 📄 License

Bu loyiha private loyiha hisoblanadi.

## 👥 Mualliflar

Loyiha jamoasi tomonidan ishlab chiqilgan.

## 📞 Aloqa

Savollar yoki takliflar uchun loyiha boshqaruvchilari bilan bog'laning.

---

**Versiya**: 1.0.0  
**Oxirgi yangilanish**: 2025  
**Framework**: React Native (Expo)  
**Language**: TypeScript  
**API Base URL**: https://api.ttsa.uz/api
