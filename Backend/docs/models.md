# Database Models Documentation

Bu hujjat loyihadagi barcha MongoDB modellarining to'liq tavsifini o'z ichiga oladi.

## Jadval

1. [Admin](#admin)
2. [Agent](#agent)
3. [AgentDailyReport](#agentdailyreport)
4. [Cart](#cart)
5. [Category](#category)
6. [Contragent](#contragent)
7. [ContragentPaymentDistribution](#contragentpaymentdistribution)
8. [ContragentType](#contragenttype)
9. [Counter](#counter)
10. [Device](#device)
11. [FinanceReport](#financereport)
12. [FinanceSubmission](#financesubmission)
13. [KpiBonusDistribution](#kpibonusdistribution)
14. [KpiBonusTransaction](#kpibonustransaction)
15. [KpiPaymentDistribution](#kpipaymentdistribution)
16. [MarketplacePartnershipRequest](#marketplacepartnershiprequest)
17. [MarketplaceUser](#marketplaceuser)
18. [MarketplaceUserRegionSelection](#marketplaceuserregionselection)
19. [Notification](#notification)
20. [Order](#order)
21. [PartnershipRequest](#partnershiprequest)
22. [PaymentTransaction](#paymenttransaction)
23. [Product](#product)
24. [Punkt](#punkt)
25. [Region](#region)
26. [Review](#review)
27. [ReviewCommentTemplate](#reviewcommenttemplate)
28. [ReviewContact](#reviewcontact)
29. [SmsVerification](#smsverification)

---

## Admin

**Tavsif:** Admin foydalanuvchilari uchun model. Tizim boshqaruvchilari va umumiy adminlar.

### Schema Fields

- `name` (String, required): Admin ismi (2-100 belgi)
- `role` (String, enum: 'general', 'admin', default: 'general'): Admin roli
- `telefonRaqam` (String, required, unique): Telefon raqami
- `username` (String, required, unique): Foydalanuvchi nomi (3-30 belgi, lowercase)
- `parol` (String, required, min: 6, select: false): Parol (hash qilingan)
- `status` (String, enum: 'active', 'inactive', default: 'active'): Holati
- `permissions` (Array[String]): Ruxsatlar ro'yxati
  - Default: ['dashboard', 'admins', 'regions', 'counterparties', 'agents', 'points', 'archive', 'warehouse', 'marketplace_clients', 'messages', 'orders', 'kpi_bonuses', 'area_statistics', 'sms', 'finance', 'pricing', 'partnership_requests', 'vacancies', 'settings']
- `createdAt`, `updatedAt` (Date): Timestamps

### Methods

- `comparePassword(candidatePassword)`: Parolni solishtirish
- `toJSON()`: Parolni olib tashlab JSON qaytarish

### Hooks

- `pre('save')`: Parolni bcrypt bilan hash qilish

---

## Agent

**Tavsif:** Agentlar uchun model. Viloyat, tuman yoki MFY agentlari.

### Schema Fields

- `name` (String, required): Agent ismi (2-200 belgi)
- `viloyat` (ObjectId, ref: 'Region', required): Viloyat
- `tuman` (ObjectId, ref: 'Region', default: null): Tuman
- `mfy` (ObjectId, ref: 'Region', default: null): MFY
- `phone` (String, required, unique): Telefon raqami
- `password` (String, min: 6, select: false): Parol (hash qilingan)
- `passwordSetupAllowed` (Boolean, default: false): Parol o'rnatishga ruxsat
- `status` (String, enum: 'active', 'inactive', default: 'active'): Holati
- `isDeleted` (Boolean, default: false): O'chirilganmi
- `deletedAt` (Date, default: null): O'chirilgan vaqt
- `createdAt`, `updatedAt` (Date): Timestamps

### Virtual Fields

- `agentType` (String): Agent turi ('mfy', 'tuman', 'viloyat')

### Methods

- `comparePassword(candidatePassword)`: Parolni solishtirish
- `toJSON()`: Parolni olib tashlab JSON qaytarish

### Hooks

- `pre('save')`: Parolni bcrypt bilan hash qilish

### Indexes

- `viloyat`, `tuman`, `mfy`, `status`, `isDeleted`, `deletedAt`
- `phone` (unique, partialFilterExpression: { isDeleted: false })

---

## AgentDailyReport

**Tavsif:** Agentlarning kunlik hisobotlari.

### Schema Fields

- `agent` (ObjectId, ref: 'Agent', required): Agent
- `date` (Date, required): Sana
- `agentType` (String, enum: 'mfy', 'tuman', 'viloyat', required): Agent turi
- `ordersCount` (Number, default: 0, min: 0): Buyurtmalar soni
- `totalAmount` (Number, default: 0, min: 0): Jami summa
- `collectedAmount` (Number, default: 0, min: 0): Yig'ilgan summa
- `submittedAmount` (Number, default: 0, min: 0): Topshirilgan summa
- `pendingAmount` (Number, default: 0, min: 0): Kutayotgan summa
- `receivedAmount` (Number, default: 0, min: 0): Qabul qilingan summa
- `transactions` (Array[ObjectId], ref: 'PaymentTransaction'): Transaksiyalar
- `cashAmount` (Number, default: 0, min: 0): Naqd summa
- `cardAmount` (Number, default: 0, min: 0): Karta summa
- `isSubmitted` (Boolean, default: false): Topshirilganmi
- `submittedAt` (Date, default: null): Topshirilgan vaqt
- `notes` (String, maxlength: 1000): Eslatmalar
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `agent + date` (unique)
- `date`, `agentType`, `isSubmitted`

---

## Cart

**Tavsif:** Marketplace foydalanuvchilarining savat modeli.

### Schema Fields

- `user` (ObjectId, ref: 'MarketplaceUser', required, unique): Foydalanuvchi
- `items` (Array[CartItem]): Savat elementlari
  - `product` (ObjectId, ref: 'Product', required): Mahsulot
  - `quantity` (Number, required, min: 1): Miqdor
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `user` (unique)

---

## Category

**Tavsif:** Mahsulot kategoriyalari. Ierarxik struktura (parent-child).

### Schema Fields

- `name` (String, required, minlength: 2): Kategoriya nomi
- `slug` (String, lowercase, unique): URL slug
- `image` (String, default: null): Rasm
- `censored` (Boolean, default: false): Sensur qilinganmi
- `parent` (ObjectId, ref: 'Category', default: null): Ota kategoriya
- `status` (String, enum: 'active', 'inactive', default: 'active'): Holati
- `createdBy` (ObjectId, refPath: 'createdByModel', required): Yaratgan
- `createdByModel` (String, enum: 'Admin', 'ShopOwner', 'Contragent', required): Yaratgan model
- `createdAt`, `updatedAt` (Date): Timestamps

### Virtual Fields

- `subcategories`: Subkategoriyalar ro'yxati

### Hooks

- `pre('save')`: Slug yaratish va unikal qilish

### Indexes

- `name + parent` (unique)
- `slug` (unique)
- `status`, `createdBy + createdByModel`

---

## Contragent

**Tavsif:** Kontragentlar (yetkazib beruvchilar) uchun model.

### Schema Fields

- `name` (String, required, 2-200 belgi): Nomi
- `inn` (String, required, unique, match: /^\d{9}$|^\d{12}$/): INN (9 yoki 12 raqam)
- `viloyat` (ObjectId, ref: 'Region', required): Viloyat
- `tuman` (ObjectId, ref: 'Region', required): Tuman
- `mfy` (ObjectId, ref: 'Region', required): MFY
- `phone` (String, required, unique): Telefon raqami
- `password` (String, min: 6, select: false): Parol (hash qilingan)
- `passwordSetupAllowed` (Boolean, default: false): Parol o'rnatishga ruxsat
- `logo` (String, default: null): Logo
- `isFeaturedForMarketplace` (Boolean, default: false): Marketplace uchun ajratilgan
- `activityType` (ObjectId, ref: 'ContragentType', required): Faoliyat turi
- `status` (String, enum: 'active', 'inactive', default: 'active'): Holati
- `createdAt`, `updatedAt` (Date): Timestamps

### Methods

- `comparePassword(candidatePassword)`: Parolni solishtirish
- `toJSON()`: Parolni olib tashlab JSON qaytarish

### Hooks

- `pre('save')`: Parolni bcrypt bilan hash qilish

### Indexes

- `inn` (unique)
- `phone` (unique)
- `viloyat`, `tuman`, `mfy`, `activityType`, `status`, `isFeaturedForMarketplace`

---

## ContragentPaymentDistribution

**Tavsif:** Kontragentlarga to'lov taqsimlash.

### Schema Fields

- `contragent` (ObjectId, ref: 'Contragent', required): Kontragent
- `amount` (Number, required, min: 0): To'lov summasi
- `status` (String, enum: 'pending', 'paid', 'cancelled', default: 'pending'): Holati
- `paidAt` (Date, default: null): To'langan vaqt
- `paidBy` (ObjectId, ref: 'Admin', default: null): To'lovni tasdiqlagan admin
- `notes` (String, default: null): Eslatmalar
- `orders` (Array[ObjectId], ref: 'Order'): Buyurtmalar
- `dueDate` (Date, required): To'lov muddati
- `isOverdue` (Boolean, default: false): Muddati o'tganmi
- `createdAt`, `updatedAt` (Date): Timestamps

### Hooks

- `pre('save')`: `isOverdue` ni yangilash

### Indexes

- `contragent`, `status`, `createdAt`, `paidAt`, `dueDate`, `isOverdue`
- Compound: `contragent + status`, `status + dueDate`, `status + isOverdue`

---

## ContragentType

**Tavsif:** Kontragent faoliyat turlari.

### Schema Fields

- `name` (String, required, 2-200 belgi): Nomi
- `icon` (String, required): Icon
- `status` (String, enum: 'active', 'inactive', default: 'active'): Holati
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `name`, `status`

---

## Counter

**Tavsif:** Global counterlar uchun model (masalan, mahsulot kodlari uchun).

### Schema Fields

- `name` (String, required, unique): Counter nomi
- `value` (Number, default: 0): Qiymati
- `createdAt`, `updatedAt` (Date): Timestamps

### Static Methods

- `getNextValue(counterName)`: Keyingi qiymatni olish va oshirish

### Indexes

- `name` (unique)

---

## Device

**Tavsif:** Foydalanuvchi qurilmalari uchun model (polymorphic).

### Schema Fields

- `user` (ObjectId, refPath: 'userModel', required): Foydalanuvchi
- `userModel` (String, enum: 'Admin', 'Contragent', 'Punkt', 'Agent', required): Foydalanuvchi modeli
- `deviceId` (String, required): Qurilma ID
- `deviceName` (String, maxlength: 200): Qurilma nomi
- `deviceType` (String, enum: 'mobile', 'tablet', 'desktop', 'web', 'unknown', default: 'unknown'): Qurilma turi
- `platform` (String, maxlength: 100): Platforma
- `os` (String, maxlength: 100): Operatsion tizim
- `browser` (String, maxlength: 100): Brauzer
- `ipAddress` (String): IP manzil
- `userAgent` (String, maxlength: 500): User agent
- `isActive` (Boolean, default: true): Faolmi
- `isPrimary` (Boolean, default: false): Asosiy qurilmami
- `lastLoginAt` (Date, default: Date.now): Oxirgi kirish
- `lastActivityAt` (Date, default: Date.now): Oxirgi faollik
- `location` (Object): Joylashuv
  - `country`, `city`, `latitude`, `longitude`
- `createdAt`, `updatedAt` (Date): Timestamps

### Methods

- `isPrimaryDevice()`: Asosiy qurilma ekanligini tekshirish
- `deactivate()`: Qurilmani deaktivatsiya qilish
- `activate()`: Qurilmani aktivatsiya qilish

### Static Methods

- `findOrCreateDevice(user, userModel, deviceData)`: Topish yoki yaratish
- `getUserActiveDevices(user, userModel)`: Faol qurilmalarni olish
- `getUserPrimaryDevice(user, userModel)`: Asosiy qurilmani olish
- `deactivateAllExcept(user, userModel, exceptDeviceId)`: Barcha qurilmalarni deaktivatsiya qilish (birini qoldirib)

### Indexes

- `user + userModel + isActive`
- `deviceId + user + userModel` (unique)
- `user + userModel + isPrimary`
- `lastActivityAt`

---

## FinanceReport

**Tavsif:** Moliyaviy hisobotlar.

### Schema Fields

- `reportType` (String, enum: 'daily', 'weekly', 'monthly', 'yearly', 'custom', required): Hisobot turi
- `startDate` (Date, required): Boshlanish sanasi
- `endDate` (Date, required): Tugash sanasi
- `totalReceived` (Number, default: 0, min: 0): Jami qabul qilingan
- `totalOrders` (Number, default: 0, min: 0): Jami buyurtmalar
- `byRegion` (Array): Viloyat bo'yicha
  - `region` (ObjectId, ref: 'Region')
  - `regionName` (String)
  - `totalAmount` (Number, default: 0)
  - `ordersCount` (Number, default: 0)
- `byDistrict` (Array): Tuman bo'yicha
  - `district`, `districtName`, `region`, `regionName`, `totalAmount`, `ordersCount`
- `byMfy` (Array): MFY bo'yicha
  - `mfy`, `mfyName`, `district`, `districtName`, `region`, `regionName`, `totalAmount`, `ordersCount`
- `byPaymentMethod` (Object): To'lov usullari bo'yicha
  - `cash` (Number, default: 0)
  - `card` (Number, default: 0)
- `byAgent` (Array): Agentlar bo'yicha
  - `agent` (ObjectId, ref: 'Agent')
  - `agentName` (String)
  - `agentType` (String)
  - `totalAmount` (Number, default: 0)
  - `ordersCount` (Number, default: 0)
- `breakdown` (Mixed): Tafsilotlar
- `generatedAt` (Date, default: Date.now): Yaratilgan vaqt
- `generatedBy` (ObjectId, ref: 'Admin', default: null): Yaratgan admin
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `reportType + startDate + endDate`
- `generatedAt`

---

## FinanceSubmission

**Tavsif:** Agentlardan moliyaga topshiruvlar.

### Schema Fields

- `fromAgent` (ObjectId, ref: 'Agent', required): Kimdan
- `fromAgentType` (String, enum: 'mfy', 'tuman', 'viloyat', required): Agent turi
- `toAgent` (ObjectId, ref: 'Agent', default: null): Kimga (null bo'lsa moliyaga)
- `toAgentType` (String, enum: 'tuman', 'viloyat', 'finance', required): Qabul qiluvchi turi
- `amount` (Number, required, min: 0): Summa
- `submissionDate` (Date, required): Topshiruv sanasi
- `status` (String, enum: 'pending', 'confirmed', 'rejected', default: 'pending'): Holati
- `transactions` (Array[ObjectId], ref: 'PaymentTransaction'): Transaksiyalar
- `confirmedBy` (ObjectId, refPath: 'confirmedByModel', default: null): Tasdiqlagan
- `confirmedByModel` (String, enum: 'Agent', 'Admin', default: null): Tasdiqlagan model
- `confirmedAt` (Date, default: null): Tasdiqlangan vaqt
- `rejectedBy` (ObjectId, refPath: 'rejectedByModel', default: null): Rad etgan
- `rejectedByModel` (String, enum: 'Agent', 'Admin', default: null): Rad etgan model
- `rejectedAt` (Date, default: null): Rad etilgan vaqt
- `rejectionReason` (String, maxlength: 500, default: null): Rad etish sababi
- `notes` (String, maxlength: 1000, default: ''): Eslatmalar
- `cashAmount` (Number, default: 0, min: 0): Naqd summa
- `cardAmount` (Number, default: 0, min: 0): Karta summa
- `transactionsCount` (Number, default: 0, min: 0): Transaksiyalar soni
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `fromAgent + submissionDate`
- `toAgent + status`
- `status`, `submissionDate`, `fromAgentType + toAgentType`

---

## KpiBonusDistribution

**Tavsif:** KPI bonus taqsimlash konfiguratsiyalari.

### Schema Fields

- `name` (String, required, unique): Taqsimlash nomi
- `description` (String, default: null): Tavsif
- `distribution` (Object): Taqsimlash foizlari (jami 100% bo'lishi kerak)
  - `punkt` (Number, required, 0-100, default: 0)
  - `viloyatAgent` (Number, required, 0-100, default: 0)
  - `tumanAgent` (Number, required, 0-100, default: 0)
  - `mfyAgent` (Number, required, 0-100, default: 0)
  - `finance` (Number, required, 0-100, default: 0)
  - `deliveryService` (Number, required, 0-100, default: 0)
  - `punktTransfer` (Number, 0-100, default: 0): Punktlar orasida transfer
- `isActive` (Boolean, default: true): Faolmi
- `createdBy` (ObjectId, ref: 'Admin', required): Yaratgan admin
- `createdAt`, `updatedAt` (Date): Timestamps

### Hooks

- `pre('save')`: Jami foizlar 100% ekanligini tekshirish

### Indexes

- `isActive`, `createdBy`, `createdAt`

---

## KpiBonusTransaction

**Tavsif:** KPI bonus transaksiyalari.

### Schema Fields

- `order` (ObjectId, ref: 'Order', required): Buyurtma
- `orderItem` (Object): Buyurtma elementi
  - `product` (ObjectId, ref: 'Product', required)
  - `quantity` (Number, required)
  - `price` (Number, required)
  - `originalPrice` (Number, required)
  - `kpiBonusPercent` (Number, required)
- `totalKpiAmount` (Number, required, min: 0): Jami KPI summa
- `distributionConfig` (ObjectId, ref: 'KpiBonusDistribution', required): Taqsimlash konfiguratsiyasi
- `amounts` (Object): Taqsimlangan summalar
  - `punkt`, `viloyatAgent`, `tumanAgent`, `mfyAgent`, `finance`, `deliveryService`, `punktTransfer` (Number, default: 0, min: 0)
- `recipients` (Object): Kimlarga ajratilgan
  - `punkt` (ObjectId, ref: 'Punkt', default: null)
  - `viloyatAgent` (ObjectId, ref: 'Agent', default: null)
  - `tumanAgent` (ObjectId, ref: 'Agent', default: null)
  - `mfyAgent` (ObjectId, ref: 'Agent', default: null)
  - `fromPunkt`, `toPunkt` (ObjectId, ref: 'Punkt', default: null): Punkt transfer uchun
  - `fromPunktAmount`, `toPunktAmount` (Number, default: 0, min: 0)
- `orderStatus` (String, enum: 'pending', 'confirmed_by_punkt', 'requested_to_contragent', 'accepted_by_contragent', 'delivered_to_punkt', 'assigned_to_agent', 'confirmed_by_agent', 'confirmed_by_customer', 'cancelled', required): Buyurtma holati
- `isPaid` (Boolean, default: false): To'langanmi
- `paidAt` (Date, default: null): To'langan vaqt
- `notes` (String, default: null): Eslatmalar
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `order`, `orderItem.product`
- `recipients.punkt`, `recipients.viloyatAgent`, `recipients.tumanAgent`, `recipients.mfyAgent`
- `recipients.fromPunkt`, `recipients.toPunkt`
- `orderStatus`, `isPaid`, `createdAt`

---

## KpiPaymentDistribution

**Tavsif:** KPI bonus to'lovlari taqsimlash.

### Schema Fields

- `recipientType` (String, enum: 'agent', 'punkt', required): Qabul qiluvchi turi
- `recipient` (ObjectId, refPath: 'recipientModel', required): Qabul qiluvchi
- `recipientModel` (String, enum: 'Agent', 'Punkt', required): Qabul qiluvchi modeli
- `agentType` (String, enum: 'viloyat', 'tuman', 'mfy', default: null): Agent turi
- `amount` (Number, required, min: 0): To'lov summasi
- `status` (String, enum: 'pending', 'paid', 'cancelled', default: 'pending'): Holati
- `paidAt` (Date, default: null): To'langan vaqt
- `paidBy` (ObjectId, ref: 'Admin', default: null): To'lovni tasdiqlagan admin
- `notes` (String, default: null): Eslatmalar
- `kpiTransactions` (Array[ObjectId], ref: 'KpiBonusTransaction'): KPI transaksiyalar
- `dueDate` (Date, default: null): To'lov muddati
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `recipientType + recipient`
- `status`, `agentType`, `createdAt`, `paidAt`
- Compound: `recipientType + status`, `recipientType + recipient + status`

---

## MarketplacePartnershipRequest

**Tavsif:** Marketplace foydalanuvchilarining hamkorlik so'rovlari.

### Schema Fields

- `marketplaceUser` (ObjectId, ref: 'MarketplaceUser', required): Marketplace foydalanuvchisi
- `companyName` (String, required, 2-200 belgi): Kompaniya nomi
- `inn` (String, required, match: /^\d{9}$|^\d{12}$/): INN
- `mfo` (String, required): MFO
- `accountNumber` (String, required): Hisob raqami
- `viloyat` (ObjectId, ref: 'Region', required): Viloyat
- `tuman` (ObjectId, ref: 'Region', required): Tuman
- `mfy` (ObjectId, ref: 'Region', required): MFY
- `activityType` (ObjectId, ref: 'ContragentType', required): Faoliyat turi
- `managerFirstName` (String, required, 2-50 belgi): Rahbar ismi
- `managerLastName` (String, required, 2-50 belgi): Rahbar familiyasi
- `managerPhone` (String, required): Rahbar telefon raqami
- `status` (String, enum: 'pending', 'reviewing', 'contacted', 'approved', 'rejected', default: 'pending'): Holati
- `adminNotes` (String, maxlength: 1000, default: null): Admin eslatmasi
- `reviewedBy` (ObjectId, ref: 'Admin', default: null): Ko'rib chiqqan admin
- `reviewedAt` (Date, default: null): Ko'rib chiqilgan vaqt
- `contactedAt` (Date, default: null): Bog'lanish vaqti
- `approvedAt` (Date, default: null): Tasdiqlangan vaqt
- `rejectedAt` (Date, default: null): Rad etilgan vaqt
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `marketplaceUser`, `status`, `createdAt`, `reviewedBy`, `activityType`

---

## MarketplaceUser

**Tavsif:** Marketplace foydalanuvchilari (xaridorlar).

### Schema Fields

- `firstName` (String, required, 2-50 belgi): Ism
- `lastName` (String, required, 2-50 belgi): Familiya
- `phone` (String, required, unique): Telefon raqami
- `gender` (String, enum: 'ayol', 'erkak', required): Jins
- `viloyat` (ObjectId, ref: 'Region', required): Viloyat
- `tuman` (ObjectId, ref: 'Region', required): Tuman
- `mfy` (ObjectId, ref: 'Region', required): MFY
- `birthDate` (Date, required): Tug'ilgan sana
- `password` (String, required, min: 6, select: false): Parol (hash qilingan)
- `isPhoneVerified` (Boolean, default: false): Telefon tasdiqlanganmi
- `avatar` (String, default: null): Avatar
- `status` (String, enum: 'active', 'inactive', default: 'active'): Holati
- `createdAt`, `updatedAt` (Date): Timestamps

### Methods

- `comparePassword(candidatePassword)`: Parolni solishtirish
- `toJSON()`: Parolni olib tashlab JSON qaytarish

### Hooks

- `pre('save')`: Parolni bcrypt bilan hash qilish

### Indexes

- `phone` (unique)
- `viloyat`, `tuman`, `mfy`, `status`

---

## MarketplaceUserRegionSelection

**Tavsif:** Marketplace foydalanuvchilarining tanlangan viloyat/tumanlari.

### Schema Fields

- `user` (ObjectId, ref: 'MarketplaceUser', required, unique): Foydalanuvchi
- `viloyat` (ObjectId, ref: 'Region', default: null): Tanlangan viloyat
- `tuman` (ObjectId, ref: 'Region', default: null): Tanlangan tuman
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `user` (unique)
- `viloyat`, `tuman`

---

## Notification

**Tavsif:** Bildirishnomalar.

### Schema Fields

- `title` (String, required, maxlength: 200): Sarlavha
- `message` (String, required, maxlength: 2000): Xabar
- `type` (String, enum: 'info', 'warning', 'success', 'error', 'announcement', 'promotion', 'update', default: 'info'): Turi
- `targetType` (String, enum: 'all', 'punkts', 'viloyat_agents', 'tuman_agents', 'mfy_agents', 'marketplace_users', 'contragents', required): Maqsadli guruh
- `targetIds` (Array[ObjectId], refPath: 'targetRefModel'): Maxsus maqsadli IDlar
- `targetRefModel` (String, enum: 'Punkt', 'Agent', 'MarketplaceUser', 'Contragent'): Maqsadli model
- `viloyatId`, `tumanId`, `mfyId` (ObjectId, ref: 'Region'): Filtrlar
- `sentBy` (ObjectId, ref: 'Admin', required): Yuborgan admin
- `readBy` (Array): O'qilganlar ro'yxati
  - `recipientId` (ObjectId)
  - `recipientType` (String, enum: 'Punkt', 'Agent', 'MarketplaceUser', 'Contragent')
  - `readAt` (Date, default: Date.now)
- `isActive` (Boolean, default: true): Faolmi
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `targetType + createdAt`
- `isActive`

---

## Order

**Tavsif:** Buyurtmalar.

### Schema Fields

- `user` (ObjectId, ref: 'MarketplaceUser', required): Foydalanuvchi
- `orderNumber` (String, required, unique): Buyurtma raqami
- `items` (Array[OrderItem], required): Buyurtma elementlari
  - `product` (ObjectId, ref: 'Product', required)
  - `quantity` (Number, required, min: 1)
  - `price` (Number, required, min: 0)
  - `originalPrice` (Number, required, min: 0)
  - `kpiBonusPercent` (Number, required, 0-100)
- `totalPrice` (Number, required, min: 0): Jami narx
- `totalOriginalPrice` (Number, required, min: 0): Jami asl narx
- `totalKpiPrice` (Number, required, min: 0): Jami KPI narx
- `itemCount` (Number, required, min: 1): Mahsulotlar soni
- `status` (String, enum: 'pending', 'confirmed_by_punkt', 'requested_to_contragent', 'accepted_by_contragent', 'delivered_to_punkt', 'assigned_to_agent', 'confirmed_by_agent', 'confirmed_by_customer', 'cancelled', default: 'pending'): Holati
- `paymentStatus` (String, enum: 'pending', 'paid', 'failed', 'refunded', default: 'pending'): To'lov holati
- `paymentMethod` (String, enum: 'cash', 'card', required): To'lov usuli
- `deliveryViloyat` (ObjectId, ref: 'Region', required): Yetkazib berish viloyati
- `deliveryTuman` (ObjectId, ref: 'Region', default: null): Yetkazib berish tumani
- `deliveryMfy` (ObjectId, ref: 'Region', default: null): Yetkazib berish MFY
- `deliveryNote` (String, maxlength: 1000, default: ''): Yetkazib berish eslatmasi
- `phoneNumber` (String, required): Telefon raqami
- `punktRequests` (Array): Punkt so'rovlari
  - `punktId` (ObjectId, ref: 'Punkt', required)
  - `status` (String, enum: 'pending', 'accepted', 'rejected', default: 'pending')
  - `requestedAt` (Date, default: Date.now)
  - `respondedAt` (Date, default: null)
- `confirmedByPunkt` (ObjectId, ref: 'Punkt', default: null): Tasdiqlagan punkt
- `punktStatus` (String, enum: 'pending', 'confirmed', 'rejected', 'requested', default: 'pending'): Punkt holati
- `assignedToAgent` (ObjectId, ref: 'Agent', default: null): Tayinlangan agent
- `assignedByPunkt` (ObjectId, ref: 'Punkt', default: null): Tayinlagan punkt
- `assignedAt` (Date, default: null): Tayinlangan vaqt
- `confirmedByAgent` (ObjectId, ref: 'Agent', default: null): Tasdiqlagan agent
- `agentConfirmedAt` (Date, default: null): Agent tasdiqlagan vaqt
- `deliveredAt` (Date, default: null): Yetkazilgan vaqt
- `contragentRequests` (Array): Kontragent so'rovlari
  - `contragentId` (ObjectId, ref: 'Contragent', required)
  - `itemIds` (Array[Number], required)
  - `status` (String, enum: 'pending', 'accepted', 'rejected', 'delivered_to_punkt', default: 'pending')
  - `requestedAt` (Date, default: Date.now)
  - `respondedAt` (Date, default: null)
  - `deliveredToPunktAt` (Date, default: null)
- `punktToPunktRequests` (Array): Punktdan punktga so'rovlar
  - `fromPunktId`, `toPunktId` (ObjectId, ref: 'Punkt', required)
  - `status` (String, enum: 'pending', 'accepted', 'rejected', 'delivered', default: 'pending')
  - `requestedAt` (Date, default: Date.now)
  - `respondedAt`, `deliveredAt` (Date, default: null)
- `customerConfirmed` (Boolean, default: false): Mijoz tasdiqlaganmi
- `customerConfirmedAt` (Date, default: null): Mijoz tasdiqlagan vaqt
- `currentPunkt` (ObjectId, ref: 'Punkt', default: null): Hozirgi punkt
- `createdAt`, `updatedAt` (Date): Timestamps

### Static Methods

- `generateOrderNumber()`: Buyurtma raqamini yaratish (00001, 00001a, 00001b, ...)

### Indexes

- `user`, `orderNumber` (unique), `status`, `paymentStatus`, `createdAt`
- `deliveryViloyat`, `deliveryTuman`, `deliveryMfy`
- `confirmedByPunkt`, `punktStatus`
- `punktRequests.punktId`, `punktRequests.status`
- `assignedToAgent`, `assignedByPunkt`, `confirmedByAgent`, `deliveredAt`
- `contragentRequests.contragentId`, `contragentRequests.status`
- `punktToPunktRequests.toPunktId`, `punktToPunktRequests.status`
- `currentPunkt`, `customerConfirmed`

---

## PartnershipRequest

**Tavsif:** Hamkorlik so'rovlari (eski model, MarketplacePartnershipRequest o'rniga).

### Schema Fields

- `marketplaceUser` (ObjectId, ref: 'MarketplaceUser', required): Marketplace foydalanuvchisi
- `companyName` (String, required, 2-200 belgi): Kompaniya nomi
- `inn` (String, required, match: /^\d{9}$|^\d{12}$/): INN
- `mfo` (String, required): MFO
- `accountNumber` (String, required): Hisob raqami
- `viloyat`, `tuman`, `mfy` (ObjectId, ref: 'Region', required): Joylashuv
- `activityType` (ObjectId, ref: 'ContragentType', required): Faoliyat turi
- `managerFirstName`, `managerLastName` (String, required, 2-50 belgi): Rahbar ma'lumotlari
- `managerPhone` (String, required): Rahbar telefon raqami
- `contactStatus` (String, enum: 'not_contacted', 'contacted', 'in_progress', 'completed', default: 'not_contacted'): Bog'lanish holati
- `status` (String, enum: 'pending', 'approved', 'rejected', default: 'pending'): Holati
- `adminNotes` (String, maxlength: 1000, default: null): Admin eslatmasi
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `marketplaceUser`, `status`, `contactStatus`, `activityType`, `createdAt`

---

## PaymentTransaction

**Tavsif:** To'lov transaksiyalari.

### Schema Fields

- `order` (ObjectId, ref: 'Order', required, unique): Buyurtma
- `user` (ObjectId, ref: 'MarketplaceUser', required): Foydalanuvchi
- `amount` (Number, required, min: 0): To'lov summasi
- `paymentMethod` (String, enum: 'cash', 'card', required): To'lov usuli
- `status` (String, enum: 'pending', 'collected', 'submitted', 'received', 'confirmed', 'rejected', default: 'pending'): Holati
- `collectedBy` (ObjectId, ref: 'Agent', default: null): Yig'ilgan agent (MFY)
- `collectedAt` (Date, default: null): Yig'ilgan vaqt
- `submittedToDistrict` (ObjectId, ref: 'Agent', default: null): Tumanga topshirilgan agent
- `submittedToDistrictAt` (Date, default: null): Tumanga topshirilgan vaqt
- `receivedByDistrict` (ObjectId, ref: 'Agent', default: null): Tuman tomonidan qabul qilingan agent
- `receivedByDistrictAt` (Date, default: null): Tuman tomonidan qabul qilingan vaqt
- `submittedToProvince` (ObjectId, ref: 'Agent', default: null): Viloyatga topshirilgan agent
- `submittedToProvinceAt` (Date, default: null): Viloyatga topshirilgan vaqt
- `receivedByProvince` (ObjectId, ref: 'Agent', default: null): Viloyat tomonidan qabul qilingan agent
- `receivedByProvinceAt` (Date, default: null): Viloyat tomonidan qabul qilingan vaqt
- `submittedToFinance` (Date, default: null): Moliyaga topshirilgan vaqt
- `receivedByFinance` (Boolean, default: false): Moliya tomonidan qabul qilinganmi
- `receivedByFinanceAt` (Date, default: null): Moliya tomonidan qabul qilingan vaqt
- `confirmedByFinance` (ObjectId, ref: 'Admin', default: null): Moliya tomonidan tasdiqlagan admin
- `confirmedByFinanceAt` (Date, default: null): Moliya tomonidan tasdiqlangan vaqt
- `currentHolder` (String, enum: 'user', 'mfy_agent', 'district_agent', 'province_agent', 'finance', default: 'user'): Hozirgi egasi
- `currentHolderId` (ObjectId, default: null): Hozirgi egasi ID
- `transactionPath` (Array): Transaksiya yo'li
  - `holder` (String, enum: 'user', 'mfy_agent', 'district_agent', 'province_agent', 'finance')
  - `holderId` (ObjectId)
  - `action` (String, enum: 'paid', 'collected', 'submitted', 'received', 'confirmed')
  - `timestamp` (Date, default: Date.now)
  - `note` (String, default: '')
- `rejectionReason` (String, default: null): Rad etish sababi
- `rejectedAt` (Date, default: null): Rad etilgan vaqt
- `rejectedBy` (ObjectId, default: null): Rad etgan
- `createdAt`, `updatedAt` (Date): Timestamps

### Methods

- `addTransactionPath(holder, holderId, action, note)`: Transaksiya yo'lini qo'shish

### Indexes

- `order` (unique)
- `user`, `status`, `currentHolder + currentHolderId`
- `collectedBy`, `collectedAt`
- `submittedToDistrict`, `submittedToProvince`
- `createdAt`

---

## Product

**Tavsif:** Mahsulotlar.

### Schema Fields

- `name` (String, required, 2-500 belgi): Maxsulot nomi
- `description` (Mixed, default: null): Tavsif
- `price` (Number, required, min: 0): Narx
- `originalPrice` (Number, required, min: 0): Asl narx
- `images` (Array[String], max: 5): Rasmlar
- `category` (ObjectId, ref: 'Category', required): Kategoriya
- `subcategory` (ObjectId, ref: 'Category', default: null): Subkategoriya
- `quantity` (Number, required, min: 0): Miqdor
- `unit` (String, enum: 'dona', 'litr', 'kg', required): Birlik
- `unitSize` (Number, default: null, min: 0): Birlik o'lchami
- `length` (Number, default: null, min: 0): Bo'yi
- `width` (Number, default: null, min: 0): Eni
- `weight` (Number, default: null, min: 0): Og'irligi
- `status` (String, enum: 'active', 'inactive', 'archived', default: 'active'): Holati
- `contragent` (ObjectId, ref: 'Contragent', required): Kontragent
- `deliveryRegions` (Array[DeliveryRegion]): Yetkazib berish hududlari
  - `viloyat` (ObjectId, ref: 'Region', required)
  - `tuman` (ObjectId, ref: 'Region', default: null)
- `kpiBonusPercent` (Number, required, 0-100): KPI bonus foizi
- `productCode` (String, required, unique): Mahsulot kodi
- `moderationStatus` (String, enum: 'pending', 'approved', 'rejected', default: 'pending'): Moderatsiya holati
- `moderatedBy` (ObjectId, ref: 'Admin', default: null): Moderatsiya qilgan admin
- `moderatedAt` (Date, default: null): Moderatsiya qilingan vaqt
- `rejectionReason` (String, maxlength: 1000, default: null): Rad etish sababi
- `censored` (Boolean, default: false): Sensur qilinganmi
- `createdAt`, `updatedAt` (Date): Timestamps

### Static Methods

- `generateProductCode(contragentId)`: Mahsulot kodini yaratish (001, 1000, A00001, ...)

### Indexes

- `contragent`, `category`, `subcategory`, `status`, `moderationStatus`
- `productCode` (unique)
- `deliveryRegions.viloyat`, `deliveryRegions.tuman`
- `createdAt`

---

## Punkt

**Tavsif:** Punktlar (yetkazib berish punktlari).

### Schema Fields

- `name` (String, required, 2-200 belgi): Nomi
- `phone` (String, required, unique): Telefon raqami
- `password` (String, min: 6, select: false): Parol (hash qilingan)
- `passwordSetupAllowed` (Boolean, default: false): Parol o'rnatishga ruxsat
- `viloyat` (ObjectId, ref: 'Region', required): Viloyat
- `tuman` (ObjectId, ref: 'Region', default: null): Tuman
- `status` (String, enum: 'active', 'inactive', default: 'active'): Holati
- `isDeleted` (Boolean, default: false): O'chirilganmi
- `deletedAt` (Date, default: null): O'chirilgan vaqt
- `createdAt`, `updatedAt` (Date): Timestamps

### Methods

- `comparePassword(candidatePassword)`: Parolni solishtirish
- `toJSON()`: Parolni olib tashlab JSON qaytarish

### Hooks

- `pre('save')`: Parolni bcrypt bilan hash qilish

### Indexes

- `viloyat`, `tuman`
- `phone` (unique, partialFilterExpression: { isDeleted: false })
- `status`, `isDeleted`, `deletedAt`

---

## Region

**Tavsif:** Hududlar (viloyat, tuman, MFY).

### Schema Fields

- `name` (String, required): Nomi
- `type` (String, enum: 'region', 'district', 'mfy', required): Turi
- `parent` (ObjectId, ref: 'Region', default: null): Ota hudud
- `code` (String, required, unique): Kod
- `status` (String, enum: 'active', 'inactive', default: 'active'): Holati
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `type + parent`
- `code` (unique)

---

## Review

**Tavsif:** Mahsulot baholashlari.

### Schema Fields

- `order` (ObjectId, ref: 'Order', required): Buyurtma
- `product` (ObjectId, ref: 'Product', required): Mahsulot
- `user` (ObjectId, ref: 'MarketplaceUser', required): Foydalanuvchi
- `rating` (Number, required, 1-5): Baholash
- `commentTemplate` (ObjectId, ref: 'ReviewCommentTemplate', default: null): Shablon kommentariya
- `customComment` (String, maxlength: 1000, default: null): Maxsus kommentariya
- `contact` (ObjectId, ref: 'ReviewContact', default: null): Aloqa
- `isPositive` (Boolean, default: null): Ijobiy/salbiy (null - shablon tanlangan)
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `order`, `product`, `user`, `rating`, `isPositive`, `createdAt`
- `order + product` (unique)

---

## ReviewCommentTemplate

**Tavsif:** Baholash kommentariya shablonlari.

### Schema Fields

- `text` (String, required, maxlength: 200): Shablon matni
- `order` (Number, required, min: 1, unique): Tartib raqami
- `isActive` (Boolean, default: true): Faolmi
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `order` (unique)
- `isActive`

---

## ReviewContact

**Tavsif:** Baholash bo'yicha aloqa.

### Schema Fields

- `review` (ObjectId, ref: 'Review', required, unique): Baholash
- `message` (String, required, maxlength: 2000): Xabar
- `isPositive` (Boolean, required): Ijobiy/salbiy
- `status` (String, enum: 'pending', 'in_progress', 'resolved', default: 'pending'): Holati
- `adminNotes` (String, maxlength: 1000, default: null): Admin eslatmasi
- `resolvedAt` (Date, default: null): Hal qilingan vaqt
- `resolvedBy` (ObjectId, ref: 'Admin', default: null): Hal qilgan admin
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `review` (unique)
- `isPositive`, `status`, `createdAt`

---

## SmsVerification

**Tavsif:** SMS tasdiqlash kodlari.

### Schema Fields

- `phone` (String, required): Telefon raqami
- `code` (String, required): Kod
- `type` (String, enum: 'login', 'register', 'forgot_password', 'contragent_password_setup', 'punkt_password_setup', 'agent_password_setup', 'device_verification', required): Kod turi
- `deviceId` (String, default: null): Qurilma ID (device_verification uchun)
- `userModel` (String, enum: 'Admin', 'Contragent', 'Punkt', 'Agent', default: null): Foydalanuvchi modeli
- `isUsed` (Boolean, default: false): Ishlatilganmi
- `expiresAt` (Date, required): Muddati (auto-delete)
- `createdAt`, `updatedAt` (Date): Timestamps

### Indexes

- `phone + type + isUsed + expiresAt`
- `expiresAt` (expireAfterSeconds: 0)

---

## Umumiy Eslatmalar

### Timestamps
Barcha modellar `createdAt` va `updatedAt` maydonlariga ega (Mongoose timestamps).

### Parol Xavfsizligi
Parol maydoni bo'lgan modellar:
- `Admin`, `Agent`, `Contragent`, `Punkt`, `MarketplaceUser`
- Barcha parollar bcrypt bilan hash qilinadi
- `select: false` - parol default ravishda qaytarilmaydi
- `toJSON()` metodi parolni olib tashlaydi

### Soft Delete
Quyidagi modellar soft delete qo'llab-quvvatlaydi:
- `Agent` (`isDeleted`, `deletedAt`)
- `Punkt` (`isDeleted`, `deletedAt`)

### Polymorphic References
Quyidagi modellar polymorphic referencelardan foydalanadi:
- `Device` (`userModel`: 'Admin', 'Contragent', 'Punkt', 'Agent')
- `Category` (`createdByModel`: 'Admin', 'ShopOwner', 'Contragent')
- `FinanceSubmission` (`confirmedByModel`, `rejectedByModel`: 'Agent', 'Admin')
- `KpiPaymentDistribution` (`recipientModel`: 'Agent', 'Punkt')
- `Notification` (`targetRefModel`: 'Punkt', 'Agent', 'MarketplaceUser', 'Contragent')

### Auto-expiring Documents
Quyidagi modellar TTL (Time To Live) indexlariga ega:
- `SmsVerification` (`expiresAt`)

### Unique Constraints
Ko'plab modellar unique constraintlarga ega:
- `Admin`: `telefonRaqam`, `username`
- `Agent`: `phone` (faqat `isDeleted: false` bo'lganda)
- `Contragent`: `inn`, `phone`
- `Punkt`: `phone` (faqat `isDeleted: false` bo'lganda)
- `MarketplaceUser`: `phone`
- `Product`: `productCode`
- `Order`: `orderNumber`
- `Cart`: `user`
- `Category`: `name + parent`, `slug`
- Va boshqalar...

---

*Hujjat oxirgi marta yangilandi: 2024*


