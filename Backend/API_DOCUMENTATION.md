# TTSA Backend API Dokumentatsiyasi

## Mundarija

1. [Umumiy Ma'lumot](#umumiy-malumot)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Admin API](#admin-api)
4. [Agent API](#agent-api)
5. [Contragent API](#contragent-api)
6. [Maxalla Contragent API](#maxalla-contragent-api)
7. [Punkt API](#punkt-api)
8. [Marketplace API](#marketplace-api)
9. [Product API](#product-api)
10. [Order API](#order-api)
11. [Payment API](#payment-api)
12. [Finance API](#finance-api)
12. [KPI API](#kpi-api)
13. [Notification API](#notification-api)
14. [Review API](#review-api)
15. [Region API](#region-api)
16. [Category API](#category-api)
17. [Device Verification API](#device-verification-api)
18. [Delivery Provider API](#delivery-provider-api)
19. [Workflow'lar](#workflowlar)

---

## Umumiy Ma'lumot

### Base URL
```
http://localhost:5000/api
```

### Response Format
Barcha API javoblari quyidagi formatda qaytariladi:

**Muvaffaqiyatli javob:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Ma'lumotlar muvaffaqiyatli olingan"
}
```

**Xatolik javobi:**
```json
{
  "success": false,
  "message": "Xatolik xabari",
  "errors": [ ... ]
}
```

### HTTP Status Kodlar
- `200` - Muvaffaqiyatli
- `201` - Yaratildi
- `400` - Noto'g'ri so'rov
- `401` - Autentifikatsiya talab qilinadi
- `403` - Ruxsat yo'q
- `404` - Topilmadi
- `500` - Server xatosi

### Pagination
Ko'pchilik list endpointlarida pagination qo'llab-quvvatlanadi:
- `page` - Sahifa raqami (default: 1)
- `limit` - Har bir sahifadagi elementlar soni (default: 10)

---

## Autentifikatsiya

### Token Format
Barcha autentifikatsiya talab qiladigan endpointlar uchun `Authorization` header'da token yuboriladi:
```
Authorization: Bearer <token>
```

### Token Olish
Har bir user type uchun alohida login endpointlari mavjud (quyidagi bo'limlarda batafsil).

### Device Verification
Ba'zi user typelar (Admin, Contragent, Punkt, Agent) uchun device verification talab qilinadi:
1. Yangi qurilma bilan login qilganda SMS kod yuboriladi
2. SMS kod tasdiqlanadi
3. Device faollashtiriladi
4. Keyingi so'rovlarda deviceId token'da bo'lishi kerak

---

## Admin API

### Base Path
```
/api/admins
```

### Endpointlar

#### Login
**POST** `/api/admins/login`

Admin login qilish.

**Request Body:**
- `username` (string, required) - Admin username
- `parol` (string, required) - Admin parol

**Response:**
- `token` - JWT token
- `admin` - Admin ma'lumotlari

---

#### Admin CRUD

**Create Admin**
**POST** `/api/admins`

Yangi admin yaratish.

**Request Body:**
- `name` (string, required, 2-100 chars)
- `role` (enum: 'general', 'admin', default: 'general')
- `telefonRaqam` (string, required, phone format)
- `username` (string, required, 3-30 chars, unique, alphanumeric)
- `parol` (string, required, min 6 chars)
- `status` (enum: 'active', 'inactive', default: 'active')

**Response:**
- Yaratilgan admin ma'lumotlari

---

**Get All Admins**
**GET** `/api/admins`

Barcha adminlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'active', 'inactive', optional)

**Response:**
- Adminlar ro'yxati

---

**Get Admin By ID**
**GET** `/api/admins/:id`

Bitta admin ma'lumotlarini olish.

**Response:**
- Admin ma'lumotlari

---

**Update Admin**
**PUT** `/api/admins/:id`

Admin ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string, 2-100 chars)
- `role` (enum: 'general', 'admin')
- `telefonRaqam` (string, phone format)
- `username` (string, 3-30 chars, alphanumeric)
- `parol` (string, min 6 chars)
- `status` (enum: 'active', 'inactive')

**Response:**
- Yangilangan admin ma'lumotlari

---

**Delete Admin**
**DELETE** `/api/admins/:id`

Adminni o'chirish.

**Response:**
- Muvaffaqiyat xabari

---

### Dashboard Endpoints

**Get Dashboard Overview**
**GET** `/api/admins/dashboard/overview`

Dashboard umumiy ma'lumotlari.

**Response:**
- Umumiy statistika (orders, revenue, users, products)

---

**Get Dashboard Statistics**
**GET** `/api/admins/dashboard/statistics`

Dashboard statistikalar.

**Query Parameters:**
- `type` (enum: 'daily', 'weekly', 'monthly', optional)

**Response:**
- Statistikalar (orders, revenue, trends)

---

**Get Daily Statistics**
**GET** `/api/admins/dashboard/statistics/daily`

Kunlik statistikalar.

**Response:**
- Kunlik ma'lumotlar

---

**Get Weekly Statistics**
**GET** `/api/admins/dashboard/statistics/weekly`

Haftalik statistikalar.

**Response:**
- Haftalik ma'lumotlar

---

**Get Monthly Statistics**
**GET** `/api/admins/dashboard/statistics/monthly`

Oylik statistikalar.

**Response:**
- Oylik ma'lumotlar

---

**Get Orders Statistics**
**GET** `/api/admins/dashboard/statistics/orders`

Buyurtmalar statistikasi.

**Response:**
- Buyurtmalar statistikasi

---

**Get Finance Statistics**
**GET** `/api/admins/dashboard/statistics/finance`

Moliyaviy statistika.

**Response:**
- Moliyaviy ma'lumotlar

---

**Get Users Statistics**
**GET** `/api/admins/dashboard/statistics/users`

Foydalanuvchilar statistikasi.

**Response:**
- Foydalanuvchilar statistikasi

---

**Get Products Statistics**
**GET** `/api/admins/dashboard/statistics/products`

Mahsulotlar statistikasi.

**Response:**
- Mahsulotlar statistikasi

---

### Category Management

**Create Category**
**POST** `/api/admins/categories`

Yangi kategoriya yaratish.

**Request Body:**
- `name` (string, required, min 2 chars)
- `image` (string, optional, base64 format)
- `censored` (boolean, default: false)
- `status` (enum: 'active', 'inactive', default: 'active')

**Response:**
- Yaratilgan kategoriya

---

**Get All Categories**
**GET** `/api/admins/categories`

Barcha kategoriyalarni olish.

**Response:**
- Kategoriyalar ro'yxati

---

**Get Category By ID**
**GET** `/api/admins/categories/:id`

Bitta kategoriya ma'lumotlarini olish.

**Response:**
- Kategoriya ma'lumotlari

---

**Update Category**
**PUT** `/api/admins/categories/:id`

Kategoriya ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string, min 2 chars)
- `image` (string, base64 format)
- `censored` (boolean)
- `status` (enum: 'active', 'inactive')

**Response:**
- Yangilangan kategoriya

---

**Update Category Status**
**PUT** `/api/admins/categories/:id/status`

Kategoriya statusini yangilash.

**Request Body:**
- `status` (enum: 'active', 'inactive', required)

**Response:**
- Yangilangan kategoriya

---

**Delete Category**
**DELETE** `/api/admins/categories/:id`

Kategoriyani o'chirish.

**Response:**
- Muvaffaqiyat xabari

---

### Subcategory Management

**Create Subcategory**
**POST** `/api/admins/categories/subcategories`

Yangi subkategoriya yaratish.

**Request Body:**
- `name` (string, required, min 2 chars)
- `parent` (string, required) - Ota kategoriya ID
- `status` (enum: 'active', 'inactive', default: 'active')

**Response:**
- Yaratilgan subkategoriya

---

**Get All Subcategories**
**GET** `/api/admins/categories/subcategories`

Barcha subkategoriyalarni olish.

**Response:**
- Subkategoriyalar ro'yxati

---

**Update Subcategory**
**PUT** `/api/admins/categories/subcategories/:id`

Subkategoriya ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string, min 2 chars)
- `parent` (string)
- `status` (enum: 'active', 'inactive')

**Response:**
- Yangilangan subkategoriya

---

**Update Subcategory Status**
**PUT** `/api/admins/categories/subcategories/:id/status`

Subkategoriya statusini yangilash.

**Request Body:**
- `status` (enum: 'active', 'inactive', required)

**Response:**
- Yangilangan subkategoriya

---

**Delete Subcategory**
**DELETE** `/api/admins/categories/subcategories/:id`

Subkategoriyani o'chirish.

**Response:**
- Muvaffaqiyat xabari

---

### Base Product Management

**Create Base Product**
**POST** `/api/admins/base-products`

Yangi base product yaratish.

**Request Body:**
- `name` (string, required, 2-500 chars)
- `description` (object/string, optional)
- `images` (array, optional, max 5, base64 format)
- `category` (string, required) - Kategoriya ID
- `subcategory` (string, optional) - Subkategoriya ID
- `unit` (enum: 'dona', 'litr', 'kg', required)
- `unitSize` (number, optional, min 0)
- `status` (enum: 'active', 'inactive', default: 'active')

**Response:**
- Yaratilgan base product

---

**Get All Base Products**
**GET** `/api/admins/base-products`

Barcha base productlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `category` (string, optional)
- `subcategory` (string, optional)
- `status` (enum: 'active', 'inactive', optional)

**Response:**
- Base productlar ro'yxati

---

**Get Base Product By ID**
**GET** `/api/admins/base-products/:id`

Bitta base product ma'lumotlarini olish.

**Response:**
- Base product ma'lumotlari

---

**Update Base Product**
**PUT** `/api/admins/base-products/:id`

Base product ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string, 2-500 chars)
- `description` (object/string)
- `images` (array, max 5, base64 format)
- `category` (string)
- `subcategory` (string)
- `unit` (enum: 'dona', 'litr', 'kg')
- `unitSize` (number, min 0)
- `status` (enum: 'active', 'inactive')

**Response:**
- Yangilangan base product

---

**Delete Base Product**
**DELETE** `/api/admins/base-products/:id`

Base productni o'chirish.

**Response:**
- Muvaffaqiyat xabari

---

### Maxalla Product Management (Read Only)

**Get All Maxalla Products**
**GET** `/api/admins/maxalla-products`

Barcha maxalla productlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `contragent` (string, optional)
- `status` (enum: 'active', 'inactive', optional)

**Response:**
- Maxalla productlar ro'yxati

---

**Get Maxalla Product By ID**
**GET** `/api/admins/maxalla-products/:id`

Bitta maxalla product ma'lumotlarini olish.

**Response:**
- Maxalla product ma'lumotlari

---

### Product Moderation

**Get Pending Products**
**GET** `/api/admins/products/moderation/pending`

Moderatsiya kutilayotgan productlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)

**Response:**
- Pending productlar ro'yxati

---

**Get Pending Product By ID**
**GET** `/api/admins/products/moderation/pending/:id`

Bitta pending product ma'lumotlarini olish.

**Response:**
- Pending product ma'lumotlari

---

**Get All Products For Moderation**
**GET** `/api/admins/products/moderation`

Barcha productlarni moderatsiya statusi bo'yicha filter qilish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `moderationStatus` (enum: 'pending', 'approved', 'rejected', optional)
- `status` (enum: 'active', 'inactive', 'archived', optional)
- `contragent` (string, optional)
- `category` (string, optional)

**Response:**
- Productlar ro'yxati

---

**Approve Product**
**POST** `/api/admins/products/moderation/:id/approve`

Productni tasdiqlash.

**Response:**
- Tasdiqlangan product ma'lumotlari

---

**Reject Product**
**POST** `/api/admins/products/moderation/:id/reject`

Productni rad etish.

**Request Body:**
- `rejectionReason` (string, required, 1-1000 chars)

**Response:**
- Rad etilgan product ma'lumotlari

---

**Update Product**
**PUT** `/api/admins/products/:id`

Product ma'lumotlarini yangilash (admin tomonidan).

**Request Body:** (barcha fieldlar optional)
- `name` (string, 2-500 chars)
- `description` (object/string)
- `price` (number, min 0)
- `originalPrice` (number, min 0)
- `images` (array, max 5)
- `category` (string)
- `subcategory` (string)
- `quantity` (number, min 0)
- `unit` (enum: 'dona', 'litr', 'kg')
- `unitSize` (number, min 0)
- `length` (number, min 0)
- `width` (number, min 0)
- `weight` (number, min 0)
- `status` (enum: 'active', 'inactive', 'archived')
- `deliveryRegions` (array, min 1)
- `kpiBonusPercent` (number, 0-100)
- `moderationStatus` (enum: 'pending', 'approved', 'rejected')

**Response:**
- Yangilangan product ma'lumotlari

---

### Data Endpoints

**Get All Categories For Admin**
**GET** `/api/admins/data/categories`

Admin uchun barcha kategoriyalar.

**Response:**
- Kategoriyalar ro'yxati

---

**Get All Subcategories For Admin**
**GET** `/api/admins/data/subcategories`

Admin uchun barcha subkategoriyalar.

**Response:**
- Subkategoriyalar ro'yxati

---

**Get Category By ID For Admin**
**GET** `/api/admins/data/categories/:id`

Admin uchun bitta kategoriya.

**Response:**
- Kategoriya ma'lumotlari

---

**Get All Products For Admin**
**GET** `/api/admins/data/products`

Admin uchun barcha productlar (advanced filters).

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'active', 'inactive', 'archived', optional)
- `moderationStatus` (enum: 'pending', 'approved', 'rejected', optional)
- `contragent` (string, optional)
- `category` (string, optional)
- `subcategory` (string, optional)
- `search` (string, optional)

**Response:**
- Productlar ro'yxati

---

**Get Product By ID For Admin**
**GET** `/api/admins/data/products/:id`

Admin uchun bitta product.

**Response:**
- Product ma'lumotlari (to'liq populate)

---

**Get All SMS Verifications For Admin**
**GET** `/api/admins/data/sms-verifications`

Barcha SMS verificationlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `type` (enum, optional)
- `phone` (string, optional)
- `isUsed` (boolean, optional)

**Response:**
- SMS verificationlar ro'yxati

---

**Get SMS Verification By ID For Admin**
**GET** `/api/admins/data/sms-verifications/:id`

Bitta SMS verification ma'lumotlarini olish.

**Response:**
- SMS verification ma'lumotlari

---

**Get All Marketplace Users For Admin**
**GET** `/api/admins/data/marketplace-users`

Barcha marketplace userlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'active', 'inactive', optional)
- `viloyat` (string, optional)
- `tuman` (string, optional)
- `mfy` (string, optional)

**Response:**
- Marketplace userlar ro'yxati

---

**Get Marketplace User By ID For Admin**
**GET** `/api/admins/data/marketplace-users/:id`

Bitta marketplace user ma'lumotlarini olish.

**Response:**
- Marketplace user ma'lumotlari

---

**Get All Orders For Admin**
**GET** `/api/admins/data/orders`

Barcha buyurtmalarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum, optional)
- `paymentStatus` (enum: 'pending', 'paid', 'failed', 'refunded', optional)
- `dateFrom` (date, optional)
- `dateTo` (date, optional)

**Response:**
- Buyurtmalar ro'yxati

---

**Get Marketplace Orders**
**GET** `/api/admins/data/orders/marketplace`

Marketplace buyurtmalarini olish.

**Response:**
- Marketplace buyurtmalar ro'yxati

---

**Get Orders Confirmed By Punkt**
**GET** `/api/admins/data/orders/confirmed-by-punkt`

Punkt tomonidan tasdiqlangan buyurtmalar.

**Response:**
- Buyurtmalar ro'yxati

---

**Get Orders Requested To Contragents**
**GET** `/api/admins/data/orders/requested-to-contragents`

Kontragentlarga yuborilgan buyurtmalar.

**Response:**
- Buyurtmalar ro'yxati

---

**Get Orders Delivered To Punkt**
**GET** `/api/admins/data/orders/delivered-to-punkt`

Kontragent tomonidan punktga yetkazilgan buyurtmalar.

**Response:**
- Buyurtmalar ro'yxati

---

**Get Orders Assigned To Agents**
**GET** `/api/admins/data/orders/assigned-to-agents`

Agentlarga yuborilgan buyurtmalar.

**Response:**
- Buyurtmalar ro'yxati

---

**Get Orders Confirmed By Agents**
**GET** `/api/admins/data/orders/confirmed-by-agents`

Agentlar tomonidan tasdiqlangan buyurtmalar.

**Response:**
- Buyurtmalar ro'yxati

---

**Get Orders Confirmed By Customers**
**GET** `/api/admins/data/orders/confirmed-by-customers`

Mijozlar tomonidan tasdiqlangan buyurtmalar.

**Response:**
- Buyurtmalar ro'yxati

---

**Get Cancelled Orders**
**GET** `/api/admins/data/orders/cancelled`

Bekor qilingan buyurtmalar.

**Response:**
- Buyurtmalar ro'yxati

---

**Get Order By ID For Admin**
**GET** `/api/admins/data/orders/:id`

Bitta buyurtma ma'lumotlarini olish (to'liq populate).

**Response:**
- Buyurtma ma'lumotlari

---

**Get Agents In Region**
**GET** `/api/admins/data/agents`

O'z hududidagi agentlarni olish.

**Query Parameters:**
- `viloyat` (string, optional)
- `tuman` (string, optional)
- `mfy` (string, optional)
- `status` (enum: 'active', 'inactive', optional)

**Response:**
- Agentlar ro'yxati

---

**Get Punkts In Region**
**GET** `/api/admins/data/punkts`

O'z hududidagi punktlarni olish.

**Query Parameters:**
- `viloyat` (string, optional)
- `tuman` (string, optional)
- `status` (enum: 'active', 'inactive', optional)

**Response:**
- Punktlar ro'yxati

---

### Archive Endpoints

**Get Archived Punkts**
**GET** `/api/admins/archive/punkts`

Arxivlangan punktlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)

**Response:**
- Arxivlangan punktlar ro'yxati

---

**Get Archived Agents**
**GET** `/api/admins/archive/agents`

Arxivlangan agentlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)

**Response:**
- Arxivlangan agentlar ro'yxati

---

**Get Archived Punkt With Work**
**GET** `/api/admins/archive/punkts/:id/work`

Arxivlangan punktning ish tarixini olish.

**Response:**
- Punkt ish tarixi (orders, transactions)

---

**Get Archived Agent With Work**
**GET** `/api/admins/archive/agents/:id/work`

Arxivlangan agentning ish tarixini olish.

**Response:**
- Agent ish tarixi (orders, transactions)

---

### Sales Statistics

**Get Sales Stats Summary**
**GET** `/api/admins/stats/sales/summary`

Umumiy savdo statistikasi.

**Response:**
- Umumiy statistika

---

**Get Sales Stats By Viloyats**
**GET** `/api/admins/stats/sales/viloyats`

Viloyatlar bo'yicha savdo statistikasi.

**Response:**
- Viloyatlar statistikasi

---

**Get Sales Stats By Viloyat ID**
**GET** `/api/admins/stats/sales/viloyats/:viloyatId`

Bitta viloyat bo'yicha savdo statistikasi.

**Response:**
- Viloyat statistikasi

---

**Get Sales Stats By Tuman ID**
**GET** `/api/admins/stats/sales/tumans/:tumanId`

Bitta tuman bo'yicha savdo statistikasi.

**Response:**
- Tuman statistikasi

---

**Get Sales Stats By MFY ID**
**GET** `/api/admins/stats/sales/mfys/:mfyId`

Bitta MFY bo'yicha savdo statistikasi.

**Response:**
- MFY statistikasi

---

### KPI Bonus Distribution

**Create KPI Distribution**
**POST** `/api/admins/kpi/distributions`

Yangi KPI bonus taqsimlash konfiguratsiyasi yaratish.

**Request Body:**
- `name` (string, required, unique)
- `description` (string, optional)
- `distribution` (object, required):
  - `punkt` (number, required, 0-100)
  - `agent` (number, required, 0-100)
  - `finance` (number, required, 0-100)
  - `deliveryService` (number, required, 0-100)
  - `punktTransfer` (number, optional, 0-100)
- Note: punkt + agent + finance + deliveryService = 100% bo'lishi kerak

**Response:**
- Yaratilgan distribution

---

**Get All KPI Distributions**
**GET** `/api/admins/kpi/distributions`

Barcha KPI distributionlarni olish.

**Response:**
- Distributionlar ro'yxati

---

**Get KPI Distribution By ID**
**GET** `/api/admins/kpi/distributions/:id`

Bitta KPI distribution ma'lumotlarini olish.

**Response:**
- Distribution ma'lumotlari

---

**Update KPI Distribution**
**PUT** `/api/admins/kpi/distributions/:id`

KPI distribution ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string, unique)
- `description` (string)
- `distribution` (object)
- `isActive` (boolean)

**Response:**
- Yangilangan distribution

---

**Delete KPI Distribution**
**DELETE** `/api/admins/kpi/distributions/:id`

KPI distributionni o'chirish.

**Response:**
- Muvaffaqiyat xabari

---

**Get Initial KPI Distribution**
**GET** `/api/admins/kpi/distributions/initial/defaults`

Boshlang'ich KPI distribution default qiymatlarini olish.

**Response:**
- Default distribution qiymatlari

---

### KPI Bonus Transactions

**Get All KPI Transactions**
**GET** `/api/admins/kpi/transactions`

Barcha KPI bonus transaksiyalarini olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `order` (string, optional) - Order ID
- `isPaid` (boolean, optional)
- `orderStatus` (enum, optional)

**Response:**
- KPI transaksiyalar ro'yxati

---

**Get KPI Transaction By ID**
**GET** `/api/admins/kpi/transactions/:id`

Bitta KPI transaction ma'lumotlarini olish.

**Response:**
- KPI transaction ma'lumotlari

---

### KPI Statistics

**Get KPI Statistics**
**GET** `/api/admins/kpi/statistics`

Umumiy KPI statistikasi.

**Response:**
- KPI statistika

---

**Get Agents KPI**
**GET** `/api/admins/kpi/data/agents`

Agentlarning KPI ma'lumotlari.

**Query Parameters:**
- `viloyatId` (string, optional) - Viloyat ID bo'yicha filter
- `tumanId` (string, optional) - Tuman ID bo'yicha filter
- `mfyId` (string, optional) - MFY ID bo'yicha filter
- `agentId` (string, optional) - Bitta agent ID
- `isPaid` (boolean, optional) - To'langan/To'lanmagan filter
- `startDate` (date, optional)
- `endDate` (date, optional)
- `page` (number, optional)
- `limit` (number, optional)

**Response:**
- Agentlar KPI ro'yxati (totalTransactions, totalAmount, paidAmount, unpaidAmount)

**Note:** Barcha agentlar bir xil, faqat region bo'yicha filter qilish mumkin.

---

**Get Punkts KPI**
**GET** `/api/admins/kpi/data/punkts`

Punktlarning KPI ma'lumotlari.

**Response:**
- Punktlar KPI

---

**Get Agent KPI Details**
**GET** `/api/admins/kpi/data/agents/:agentId`

Bitta agentning batafsil KPI ma'lumotlari.

**Response:**
- Agent KPI ma'lumotlari

---

**Get Punkt KPI Details**
**GET** `/api/admins/kpi/data/punkts/:punktId`

Bitta punktning batafsil KPI ma'lumotlari.

**Response:**
- Punkt KPI ma'lumotlari

---

### Featured Contragents

**Get Featured Contragents For Admin**
**GET** `/api/admins/featured-contragents`

Featured contragentlar ro'yxatini olish.

**Response:**
- Featured contragentlar ro'yxati

---

**Update Featured Contragents**
**PUT** `/api/admins/featured-contragents`

Featured contragentlar ro'yxatini yangilash.

**Request Body:**
- `contragentIds` (array, required) - Contragent ID'lar ro'yxati

**Response:**
- Yangilangan featured contragentlar

---

### Partnership Requests

**Get All Partnership Requests**
**GET** `/api/admins/partnership-requests`

Barcha partnership requestlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'pending', 'approved', 'rejected', optional)
- `contactStatus` (enum: 'not_contacted', 'contacted', 'in_progress', 'completed', optional)

**Response:**
- Partnership requestlar ro'yxati

---

**Get Partnership Request By ID**
**GET** `/api/admins/partnership-requests/:id`

Bitta partnership request ma'lumotlarini olish.

**Response:**
- Partnership request ma'lumotlari

---

**Update Contact Status**
**PATCH** `/api/admins/partnership-requests/:id/contact-status`

Partnership request contact statusini yangilash.

**Request Body:**
- `contactStatus` (enum: 'not_contacted', 'contacted', 'in_progress', 'completed', required)

**Response:**
- Yangilangan partnership request

---

**Update Request Status**
**PATCH** `/api/admins/partnership-requests/:id/status`

Partnership request statusini yangilash.

**Request Body:**
- `status` (enum: 'pending', 'approved', 'rejected', required)
- `adminNotes` (string, optional, max 1000 chars)

**Response:**
- Yangilangan partnership request

---

**Convert Partnership Request To Contragent**
**POST** `/api/admins/partnership-requests/:id/convert-to-contragent`

Partnership requestni Contragent'ga aylantirish.

**Response:**
- Yaratilgan contragent ma'lumotlari

---

### Marketplace Partnership Requests

**Get All Marketplace Partnership Requests**
**GET** `/api/admins/marketplace-partnership-requests`

Barcha marketplace partnership requestlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'pending', 'reviewing', 'contacted', 'approved', 'rejected', optional)

**Response:**
- Marketplace partnership requestlar ro'yxati

---

**Get Marketplace Partnership Request By ID**
**GET** `/api/admins/marketplace-partnership-requests/:id`

Bitta marketplace partnership request ma'lumotlarini olish.

**Response:**
- Marketplace partnership request ma'lumotlari

---

**Update Status To Reviewing**
**PATCH** `/api/admins/marketplace-partnership-requests/:id/reviewing`

Statusni 'reviewing' ga o'zgartirish.

**Response:**
- Yangilangan request

---

**Update Status To Contacted**
**PATCH** `/api/admins/marketplace-partnership-requests/:id/contacted`

Statusni 'contacted' ga o'zgartirish.

**Request Body:**
- `adminNotes` (string, optional, max 1000 chars)

**Response:**
- Yangilangan request

---

**Approve Marketplace Partnership Request**
**PATCH** `/api/admins/marketplace-partnership-requests/:id/approve`

Requestni tasdiqlash.

**Request Body:**
- `adminNotes` (string, optional, max 1000 chars)

**Response:**
- Tasdiqlangan request

---

**Reject Marketplace Partnership Request**
**PATCH** `/api/admins/marketplace-partnership-requests/:id/reject`

Requestni rad etish.

**Request Body:**
- `adminNotes` (string, required, max 1000 chars)

**Response:**
- Rad etilgan request

---

**Convert Marketplace Partnership Request To Contragent**
**POST** `/api/admins/marketplace-partnership-requests/:id/convert-to-contragent`

Marketplace partnership requestni Contragent'ga aylantirish.

**Response:**
- Yaratilgan contragent ma'lumotlari

---

### Device Management

**Get All Devices**
**GET** `/api/admins/devices`

Barcha device'larni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `userModel` (enum: 'Admin', 'Contragent', 'Punkt', 'Agent', optional)
- `isActive` (boolean, optional)

**Response:**
- Device'lar ro'yxati

---

**Get Device Statistics**
**GET** `/api/admins/devices/statistics`

Device statistikasi.

**Response:**
- Device statistika

---

**Get Device By ID**
**GET** `/api/admins/devices/:id`

Bitta device ma'lumotlarini olish.

**Response:**
- Device ma'lumotlari

---

**Get User Devices**
**GET** `/api/admins/devices/user/:userModel/:userId`

Foydalanuvchining barcha device'larini olish.

**Response:**
- Device'lar ro'yxati

---

**Deactivate Device**
**PUT** `/api/admins/devices/:id/deactivate`

Device'ni nofaol qilish.

**Response:**
- Nofaol qilingan device

---

**Activate Device**
**PUT** `/api/admins/devices/:id/activate`

Device'ni faollashtirish.

**Response:**
- Faollashtirilgan device

---

**Delete Device**
**DELETE** `/api/admins/devices/:id`

Device'ni o'chirish.

**Response:**
- Muvaffaqiyat xabari

---

## Agent API

### Base Path
```
/api/agents
```

### Endpointlar

#### Password Setup (3 bosqich)

**Step 1: Request SMS Code**
**POST** `/api/agents/password-setup/step1`

SMS kod so'rash.

**Request Body:**
- `phone` (string, required, phone format)

**Response:**
- Muvaffaqiyat xabari

---

**Step 2: Verify SMS Code**
**POST** `/api/agents/password-setup/step2`

SMS kodni tasdiqlash.

**Request Body:**
- `phone` (string, required, phone format)
- `code` (string, required, 5 digits)

**Response:**
- Verification token

---

**Step 3: Set Password**
**POST** `/api/agents/password-setup/step3`

Parol o'rnatish.

**Request Body:**
- `phone` (string, required, phone format)
- `newPassword` (string, required, min 6 chars)

**Response:**
- Muvaffaqiyat xabari

---

#### Login

**POST** `/api/agents/login`

Agent login qilish.

**Request Body:**
- `phone` (string, required)
- `password` (string, required)

**Response:**
- `token` - JWT token
- `agent` - Agent ma'lumotlari

---

#### Agent CRUD

**Create Agent**
**POST** `/api/agents`

Yangi agent yaratish.

**Request Body:**
- `name` (string, required, 2-200 chars)
- `viloyat` (string, required) - Region ID
- `tuman` (string, optional) - Region ID
- `mfy` (string, optional) - Region ID
- `phone` (string, required, phone format, unique)
- `password` (string, required, min 6 chars)
- `status` (enum: 'active', 'inactive', default: 'active')

**Response:**
- Yaratilgan agent ma'lumotlari

---

**Get All Agents**
**GET** `/api/agents`

Barcha agentlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'active', 'inactive', optional)
- `viloyat` (string, optional)
- `tuman` (string, optional)
- `mfy` (string, optional)

**Response:**
- Agentlar ro'yxati

---

**Get Agents For Selection**
**GET** `/api/agents/selection`

Agent ID tanlash uchun (public endpoint).

**Response:**
- Agentlar ro'yxati (id, name, phone)

---

**Get Agent By ID**
**GET** `/api/agents/:id`

Bitta agent ma'lumotlarini olish.

**Response:**
- Agent ma'lumotlari

---

**Update Agent**
**PUT** `/api/agents/:id`

Agent ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string, 2-200 chars)
- `viloyat` (string)
- `tuman` (string)
- `mfy` (string)
- `phone` (string, phone format)
- `password` (string, min 6 chars)
- `status` (enum: 'active', 'inactive')

**Response:**
- Yangilangan agent ma'lumotlari

---

**Delete Agent**
**DELETE** `/api/agents/:id`

Agentni o'chirish (soft delete).

**Response:**
- Muvaffaqiyat xabari

---

#### Notifications

**Get Agent Notifications**
**GET** `/api/agents/notifications/list`

Agent bildirishnomalarini olish.

**Response:**
- Bildirishnomalar ro'yxati

---

**Get Agent Unread Count**
**GET** `/api/agents/notifications/unread-count`

O'qilmagan bildirishnomalar soni.

**Response:**
- Unread count

---

**Mark Notification As Read**
**POST** `/api/agents/notifications/:notificationId/read`

Bildirishnomani o'qilgan deb belgilash.

**Response:**
- Muvaffaqiyat xabari

---

**Mark All Notifications As Read**
**POST** `/api/agents/notifications/read-all`

Barcha bildirishnomalarni o'qilgan deb belgilash.

**Response:**
- Muvaffaqiyat xabari

---

## Agent Order API

### Base Path
```
/api/agent
```

### Endpointlar

**Get My Orders**
**GET** `/api/agent/orders`

Agentga yuborilgan buyurtmalarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum, optional)

**Response:**
- Buyurtmalar ro'yxati

---

**Get Today's Orders**
**GET** `/api/agent/orders/today`

Bugungi buyurtmalar.

**Response:**
- Bugungi buyurtmalar ro'yxati

---

**Get Order History**
**GET** `/api/agent/orders/history`

O'tgan kunlar buyurtmalari.

**Response:**
- Buyurtmalar tarixi

---

**Get Order By ID**
**GET** `/api/agent/orders/:id`

Bitta buyurtma ma'lumotlarini olish.

**Response:**
- Buyurtma ma'lumotlari

---

**Confirm Order By Agent**
**POST** `/api/agent/orders/:id/confirm`

Buyurtmani agent tomonidan tasdiqlash (mijozga yetkazilgan).

**Response:**
- Tasdiqlangan buyurtma

---

**Mark Order As Delivered**
**POST** `/api/agent/orders/:id/delivered`

Buyurtmani yetkazilgan deb belgilash.

**Response:**
- Yetkazilgan buyurtma

---

#### KPI Bonus Endpoints

**Get My KPI Summary**
**GET** `/api/agent/kpi/summary`

Agent KPI bonus umumiy ma'lumotlari.

**Response:**
- KPI summary (total, paid, unpaid)

---

**Get My KPI Transactions**
**GET** `/api/agent/kpi/transactions`

Agent KPI bonus transaksiyalari.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `isPaid` (boolean, optional)
- `dateFrom` (date, optional)
- `dateTo` (date, optional)

**Response:**
- KPI transaksiyalar ro'yxati

---

**Get My KPI Daily Balance**
**GET** `/api/agent/kpi/balance`

Agent KPI kunlik balansi.

**Response:**
- KPI balance

---

**Get My KPI Daily Report**
**GET** `/api/agent/kpi/reports/daily`

Agent KPI kunlik hisoboti.

**Response:**
- KPI daily report

---

## Agent Finance API

### Base Path
```
/api/agent-finance
```

### Endpointlar

**Get Daily Report**
**GET** `/api/agent-finance/daily-report`

Agent kunlik hisoboti.

**Query Parameters:**
- `date` (date, optional) - Sana (default: bugun)

**Response:**
- Kunlik hisobot ma'lumotlari (ordersCount, totalAmount, collectedAmount, submittedAmount, pendingAmount, cashAmount, cardAmount)

---

**Get Pending Payments**
**GET** `/api/agent-finance/pending-payments`

Kutilayotgan to'lovlarni olish (o'z hududidagi buyurtmalar).

**Response:**
- Pending payments ro'yxati

---

**Collect Payment**
**POST** `/api/agent-finance/collect-payment/:transactionId`

To'lovni qabul qilish (mijozdan).

**Response:**
- Collected payment ma'lumotlari

---

**Submit To Finance**
**POST** `/api/agent-finance/submit-to-finance`

Moliya bo'limiga to'g'ridan-to'g'ri topshirish.

**Request Body:**
- `transactionIds` (array, required) - Transaction ID'lar ro'yxati
- `notes` (string, optional)

**Response:**
- Submission ma'lumotlari
- Contragent payments yaratilgan/yangilangan ma'lumotlari

**Note:** Bu submission moliya bo'limiga yuboriladi va `ContragentPaymentDistribution` yaratiladi.

---

**Get Statistics**
**GET** `/api/agent-finance/statistics`

Agent statistikasi.

**Query Parameters:**
- `startDate` (date, optional)
- `endDate` (date, optional)

**Response:**
- Statistika ma'lumotlari (totalOrders, totalAmount, collectedAmount, submittedAmount, pendingAmount, cashAmount, cardAmount)

---

## Contragent API

### Base Path
```
/api/contragents
```

### Endpointlar

#### Password Setup (3 bosqich)

**Step 1: Request SMS Code**
**POST** `/api/contragents/password-setup/step1`

SMS kod so'rash.

**Request Body:**
- `phone` (string, required, phone format)

**Response:**
- Muvaffaqiyat xabari

---

**Step 2: Verify SMS Code**
**POST** `/api/contragents/password-setup/step2`

SMS kodni tasdiqlash.

**Request Body:**
- `phone` (string, required, phone format)
- `code` (string, required, 5 digits)

**Response:**
- Verification token

---

**Step 3: Set Password**
**POST** `/api/contragents/password-setup/step3`

Parol o'rnatish.

**Request Body:**
- `phone` (string, required, phone format)
- `newPassword` (string, required, min 6 chars)

**Response:**
- Muvaffaqiyat xabari

---

#### Login

**POST** `/api/contragents/login` (old endpoint)
**POST** `/api/contragents/auth/login` (new endpoint)

Contragent login qilish.

**Request Body:**
- `phone` (string, required)
- `password` (string, required)

**Response:**
- `token` - JWT token
- `contragent` - Contragent ma'lumotlari

---

#### Profile Management

**Get Me**
**GET** `/api/contragents/me`

Joriy contragent ma'lumotlarini olish.

**Response:**
- Contragent ma'lumotlari

---

**Update My Profile**
**PUT** `/api/contragents/me`

Profil ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string, 2-200 chars)
- `phone` (string, phone format)
- `inn` (string, 9 or 12 digits)
- `viloyat` (string)
- `tuman` (string)
- `mfy` (string)
- `logo` (string, base64 format)

**Response:**
- Yangilangan contragent

---

**Update My Logo**
**PATCH** `/api/contragents/me/logo`

Faqat logoni yangilash.

**Request Body:**
- `logo` (string, required, base64 format)

**Response:**
- Yangilangan contragent

---

**Get My Delivery Regions**
**GET** `/api/contragents/me/delivery-regions`

Yetkazib berish hududlarini olish.

**Response:**
- Delivery regions ro'yxati

---

**Update My Delivery Regions**
**PATCH** `/api/contragents/me/delivery-regions`

Yetkazib berish hududlarini yangilash.

**Request Body:**
- `deliveryRegions` (array, required):
  - `viloyat` (string, required)
  - `tuman` (string, optional)

**Response:**
- Yangilangan delivery regions

---

#### Contragent CRUD

**Create Contragent**
**POST** `/api/contragents`

Yangi contragent yaratish.

**Request Body:**
- `name` (string, required, 2-200 chars)
- `inn` (string, required for tuman, optional for mfy, 9 or 12 digits)
- `viloyat` (string, required)
- `tuman` (string, required)
- `mfy` (string, required)
- `phone` (string, required, phone format, unique)
- `password` (string, required, min 6 chars)
- `logo` (string, optional, base64 format)
- `activityType` (string, required) - ContragentType ID
- `contragentLevel` (enum: 'tuman', 'mfy', default: 'tuman')
- `status` (enum: 'active', 'inactive', default: 'active')

**Response:**
- Yaratilgan contragent ma'lumotlari

---

**Get All Contragents**
**GET** `/api/contragents`

Barcha contragentlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'active', 'inactive', optional)
- `contragentLevel` (enum: 'tuman', 'mfy', optional)
- `activityType` (string, optional)

**Response:**
- Contragentlar ro'yxati

---

**Get Contragent By ID**
**GET** `/api/contragents/:id`

Bitta contragent ma'lumotlarini olish.

**Response:**
- Contragent ma'lumotlari

---

**Update Contragent**
**PUT** `/api/contragents/:id`

Contragent ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string, 2-200 chars)
- `inn` (string, 9 or 12 digits)
- `viloyat` (string)
- `tuman` (string)
- `mfy` (string)
- `phone` (string, phone format)
- `password` (string, min 6 chars)
- `logo` (string, base64 format)
- `activityType` (string)
- `contragentLevel` (enum: 'tuman', 'mfy')
- `status` (enum: 'active', 'inactive')

**Response:**
- Yangilangan contragent ma'lumotlari

---

**Delete Contragent**
**DELETE** `/api/contragents/:id`

Contragentni o'chirish.

**Response:**
- Muvaffaqiyat xabari

---

#### Notifications

**Get Contragent Notifications**
**GET** `/api/contragents/notifications/list`

Contragent bildirishnomalarini olish.

**Response:**
- Bildirishnomalar ro'yxati

---

**Get Contragent Unread Count**
**GET** `/api/contragents/notifications/unread-count`

O'qilmagan bildirishnomalar soni.

**Response:**
- Unread count

---

**Mark Notification As Read**
**POST** `/api/contragents/notifications/:notificationId/read`

Bildirishnomani o'qilgan deb belgilash.

**Response:**
- Muvaffaqiyat xabari

---

**Mark All Notifications As Read**
**POST** `/api/contragents/notifications/read-all`

Barcha bildirishnomalarni o'qilgan deb belgilash.

**Response:**
- Muvaffaqiyat xabari

---

#### Payments

**Get My Paid Payments**
**GET** `/api/contragents/payments/paid`

To'langan to'lovlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)

**Response:**
- To'langan to'lovlar ro'yxati

---

**Get My Unpaid Payments**
**GET** `/api/contragents/payments/unpaid`

To'lanmagan to'lovlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)

**Response:**
- To'lanmagan to'lovlar ro'yxati (isOverdue flag bilan)

---

**Get My Payment Statistics**
**GET** `/api/contragents/payments/statistics`

To'lov statistikasi.

**Response:**
- Payment statistics

---

**Get My Payment By ID**
**GET** `/api/contragents/payments/:id`

Bitta to'lov ma'lumotlarini olish.

**Response:**
- Payment ma'lumotlari

---

## Contragent Order API

### Base Path
```
/api/contragent
```

### Endpointlar

**Get Orders For Contragent**
**GET** `/api/contragent/orders`

Contragentga kelgan buyurtma so'rovlarini olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'pending', 'accepted', 'rejected', 'delivered_to_punkt', optional)

**Response:**
- Buyurtmalar ro'yxati

---

**Get Today's Orders**
**GET** `/api/contragent/today`

Bugungi buyurtmalar.

**Response:**
- Bugungi buyurtmalar ro'yxati

---

**Get Order History**
**GET** `/api/contragent/history`

O'tgan kunlar buyurtmalari.

**Response:**
- Buyurtmalar tarixi

---

**Get Order By ID**
**GET** `/api/contragent/orders/:id`

Bitta buyurtma ma'lumotlarini olish.

**Response:**
- Buyurtma ma'lumotlari

---

**Respond To Order Request**
**POST** `/api/contragent/orders/:orderId/respond`

Buyurtma so'roviga javob berish.

**Request Body:**
- `response` (enum: 'accepted', 'rejected', required)

**Response:**
- Yangilangan buyurtma

---

**Deliver To Punkt**
**POST** `/api/contragent/orders/:orderId/deliver-to-punkt`

Buyurtmani punktga yetkazib berish.

**Response:**
- Yetkazilgan buyurtma

---

**Get Contragent Statistics**
**GET** `/api/contragent/statistics`

Contragent statistikasi.

**Response:**
- Statistics

---

## Maxalla Contragent API

### Base Path
```
/api/maxalla-contragents
```

### Endpointlar

#### Password Setup (3 bosqich)

**Step 1: Request SMS Code**
**POST** `/api/maxalla-contragents/password-setup/step1`

SMS kod so'rash.

**Request Body:**
- `phone` (string, required, phone format)

**Response:**
- Muvaffaqiyat xabari

---

**Step 2: Verify SMS Code**
**POST** `/api/maxalla-contragents/password-setup/step2`

SMS kodni tasdiqlash.

**Request Body:**
- `phone` (string, required, phone format)
- `code` (string, required, 5 digits)

**Response:**
- Verification token

---

**Step 3: Set Password**
**POST** `/api/maxalla-contragents/password-setup/step3`

Parol o'rnatish.

**Request Body:**
- `phone` (string, required, phone format)
- `newPassword` (string, required, min 6 chars)

**Response:**
- Muvaffaqiyat xabari

---

#### Login

**POST** `/api/maxalla-contragents/login`

Maxalla contragent login qilish.

**Request Body:**
- `phone` (string, required)
- `password` (string, required)

**Response:**
- `token` - JWT token
- `contragent` - Contragent ma'lumotlari

---

#### Device Verification

**Request Device Verification Code**
**POST** `/api/maxalla-contragents/device-verification/request-code`

Yangi qurilma uchun SMS kod so'rash.

**Request Body:**
- `phone` (string, required)
- `deviceId` (string, required)

**Response:**
- Muvaffaqiyat xabari

---

**Verify Device**
**POST** `/api/maxalla-contragents/device-verification/verify`

Qurilmani tasdiqlash.

**Request Body:**
- `phone` (string, required)
- `deviceId` (string, required)
- `code` (string, required, 5 digits)

**Response:**
- Device verified

---

**Resend Device Verification Code**
**POST** `/api/maxalla-contragents/device-verification/resend-code`

SMS kodni qayta yuborish.

**Request Body:**
- `phone` (string, required)
- `deviceId` (string, required)

**Response:**
- Muvaffaqiyat xabari

---

#### Profile Management

**Get My Profile**
**GET** `/api/maxalla-contragents/me`

Joriy maxalla contragent ma'lumotlarini olish.

**Response:**
- Contragent ma'lumotlari

---

**Update My Profile**
**PUT** `/api/maxalla-contragents/me`

Profil ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string, 2-200 chars)
- `phone` (string, phone format)
- `viloyat` (string)
- `tuman` (string)
- `mfy` (string)
- `logo` (string, base64 format)

**Response:**
- Yangilangan contragent

---

**Update Working Hours**
**PATCH** `/api/maxalla-contragents/me/working-hours`

Ish vaqtini yangilash.

**Request Body:**
- `open` (string, optional, HH:MM format)
- `close` (string, optional, HH:MM format)
- Note: Kamida bitta vaqt (open yoki close) kiritilishi kerak

**Response:**
- Yangilangan working hours

---

**Update Service Areas**
**PATCH** `/api/maxalla-contragents/me/service-areas`

Xizmat ko'rsatish hududlarini yangilash.

**Request Body:**
- `tuman` (string, optional)
- `mfys` (array, required, min 1) - MFY ID'lar ro'yxati

**Response:**
- Yangilangan service areas

---

**Logout**
**POST** `/api/maxalla-contragents/logout`

Logout qilish.

**Response:**
- Muvaffaqiyat xabari

---

#### Delivery Providers CRUD

**Create Delivery Provider**
**POST** `/api/maxalla-contragents/delivery-providers`

Yangi yetkazib beruvchi yaratish.

**Request Body:**
- `name` (string, required, 2-200 chars)
- `phone` (string, required, phone format)
- `password` (string, required, min 6 chars)
- `notes` (string, optional, max 1000 chars)

**Response:**
- Yaratilgan delivery provider

---

**Get All Delivery Providers**
**GET** `/api/maxalla-contragents/delivery-providers`

Barcha yetkazib beruvchilarni olish.

**Response:**
- Delivery providers ro'yxati

---

**Get Delivery Provider By ID**
**GET** `/api/maxalla-contragents/delivery-providers/:id`

Bitta yetkazib beruvchi ma'lumotlarini olish.

**Response:**
- Delivery provider ma'lumotlari

---

**Update Delivery Provider**
**PUT** `/api/maxalla-contragents/delivery-providers/:id`

Yetkazib beruvchi ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string, 2-200 chars)
- `phone` (string, phone format)
- `password` (string, min 6 chars)
- `status` (enum: 'active', 'inactive')
- `notes` (string, max 1000 chars)

**Response:**
- Yangilangan delivery provider

---

**Delete Delivery Provider**
**DELETE** `/api/maxalla-contragents/delivery-providers/:id`

Yetkazib beruvchini o'chirish (soft delete).

**Response:**
- Muvaffaqiyat xabari

---

#### Maxalla Products CRUD

**Get Available Base Products**
**GET** `/api/maxalla-contragents/products/available`

Mavjud base productlarni olish (tanlash uchun).

**Response:**
- Base productlar ro'yxati

---

**Create Maxalla Product**
**POST** `/api/maxalla-contragents/products`

Yangi maxalla product yaratish.

**Request Body:**
- `baseProductId` (string, required)
- `quantity` (number, required, min 0)
- `price` (number, required, min 0)
- `originalPrice` (number, required, min 0)
- `status` (enum: 'active', 'inactive', default: 'active')

**Response:**
- Yaratilgan maxalla product

---

**Get All Maxalla Products**
**GET** `/api/maxalla-contragents/products`

Barcha maxalla productlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'active', 'inactive', optional)

**Response:**
- Maxalla productlar ro'yxati

---

**Get Maxalla Product By ID**
**GET** `/api/maxalla-contragents/products/:id`

Bitta maxalla product ma'lumotlarini olish.

**Response:**
- Maxalla product ma'lumotlari

---

**Update Maxalla Product**
**PUT** `/api/maxalla-contragents/products/:id`

Maxalla product ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `quantity` (number, min 0)
- `price` (number, min 0)
- `originalPrice` (number, min 0)
- `status` (enum: 'active', 'inactive')

**Response:**
- Yangilangan maxalla product

---

**Delete Maxalla Product**
**DELETE** `/api/maxalla-contragents/products/:id`

Maxalla productni o'chirish.

**Response:**
- Muvaffaqiyat xabari

---

#### Maxalla Contragent Orders

**Get My Orders**
**GET** `/api/maxalla-contragents/orders`

Maxalla contragentga kelgan buyurtmalarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum, optional)

**Response:**
- Buyurtmalar ro'yxati

---

**Get Order By ID**
**GET** `/api/maxalla-contragents/orders/:id`

Bitta buyurtma ma'lumotlarini olish.

**Response:**
- Buyurtma ma'lumotlari

---

**Respond To Order Request**
**POST** `/api/maxalla-contragents/orders/:orderId/respond`

Buyurtma so'roviga javob berish.

**Request Body:**
- `response` (enum: 'accepted', 'rejected', required)

**Response:**
- Yangilangan buyurtma

---

**Send Order To Delivery Provider**
**POST** `/api/maxalla-contragents/orders/:orderId/send-to-delivery-provider`

Buyurtmani yetkazib beruvchiga yuborish.

**Request Body:**
- `deliveryProviderId` (string, required)

**Response:**
- Yangilangan buyurtma

---

## Punkt API

### Base Path
```
/api/punkts
```

### Endpointlar

#### Password Setup (3 bosqich)

**Step 1: Request SMS Code**
**POST** `/api/punkts/password-setup/step1`

SMS kod so'rash.

**Request Body:**
- `phone` (string, required, phone format)

**Response:**
- Muvaffaqiyat xabari

---

**Step 2: Verify SMS Code**
**POST** `/api/punkts/password-setup/step2`

SMS kodni tasdiqlash.

**Request Body:**
- `phone` (string, required, phone format)
- `code` (string, required, 5 digits)

**Response:**
- Verification token

---

**Step 3: Set Password**
**POST** `/api/punkts/password-setup/step3`

Parol o'rnatish.

**Request Body:**
- `phone` (string, required, phone format)
- `newPassword` (string, required, min 6 chars)

**Response:**
- Muvaffaqiyat xabari

---

#### Login

**POST** `/api/punkts/login`

Punkt login qilish.

**Request Body:**
- `phone` (string, required)
- `password` (string, required)

**Response:**
- `token` - JWT token
- `punkt` - Punkt ma'lumotlari

---

#### Punkt CRUD

**Create Punkt**
**POST** `/api/punkts`

Yangi punkt yaratish.

**Request Body:**
- `name` (string, required, 2-200 chars)
- `phone` (string, required, phone format, unique)
- `password` (string, required, min 6 chars)
- `viloyat` (string, required) - Region ID
- `tuman` (string, optional) - Region ID
- `status` (enum: 'active', 'inactive', default: 'active')

**Response:**
- Yaratilgan punkt ma'lumotlari

---

**Get All Punkts**
**GET** `/api/punkts`

Barcha punktlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'active', 'inactive', optional)
- `viloyat` (string, optional)
- `tuman` (string, optional)

**Response:**
- Punktlar ro'yxati

---

**Get Punkts For Selection**
**GET** `/api/punkts/selection`

Punkt ID tanlash uchun (public endpoint).

**Response:**
- Punktlar ro'yxati (id, name, phone)

---

**Get Punkt By ID**
**GET** `/api/punkts/:id`

Bitta punkt ma'lumotlarini olish.

**Response:**
- Punkt ma'lumotlari

---

**Update Punkt**
**PUT** `/api/punkts/:id`

Punkt ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string, 2-200 chars)
- `phone` (string, phone format)
- `password` (string, min 6 chars)
- `viloyat` (string)
- `tuman` (string)
- `status` (enum: 'active', 'inactive')

**Response:**
- Yangilangan punkt ma'lumotlari

---

**Delete Punkt**
**DELETE** `/api/punkts/:id`

Punktni o'chirish (soft delete).

**Response:**
- Muvaffaqiyat xabari

---

**Get Contragents In Region**
**GET** `/api/punkts/data/contragents`

O'z hududidagi contragentlarni olish.

**Response:**
- Contragentlar ro'yxati

---

#### Notifications

**Get Punkt Notifications**
**GET** `/api/punkts/notifications/list`

Punkt bildirishnomalarini olish.

**Response:**
- Bildirishnomalar ro'yxati

---

**Get Punkt Unread Count**
**GET** `/api/punkts/notifications/unread-count`

O'qilmagan bildirishnomalar soni.

**Response:**
- Unread count

---

**Mark Notification As Read**
**POST** `/api/punkts/notifications/:notificationId/read`

Bildirishnomani o'qilgan deb belgilash.

**Response:**
- Muvaffaqiyat xabari

---

**Mark All Notifications As Read**
**POST** `/api/punkts/notifications/read-all`

Barcha bildirishnomalarni o'qilgan deb belgilash.

**Response:**
- Muvaffaqiyat xabari

---

## Punkt Order API

### Base Path
```
/api/punkt
```

### Endpointlar

**Get My Orders**
**GET** `/api/punkt/orders`

O'z hududidagi buyurtmalarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum, optional)

**Response:**
- Buyurtmalar ro'yxati

---

**Get Today's Orders**
**GET** `/api/punkt/orders/today`

Bugungi buyurtmalarni olish.

**Response:**
- Bugungi buyurtmalar ro'yxati

---

**Get Order History**
**GET** `/api/punkt/orders/history`

O'tgan kunlar buyurtmalarini olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `dateFrom` (date, optional)
- `dateTo` (date, optional)

**Response:**
- Buyurtmalar tarixi

---

**Get Order By ID**
**GET** `/api/punkt/orders/:id`

Bitta buyurtma ma'lumotlarini olish.

**Response:**
- Buyurtma ma'lumotlari (to'liq populate)

---

**Get Order Contragent IDs**
**GET** `/api/punkt/orders/:id/contragents`

Buyurtmadagi maxsulotlarning contragent ID'larini olish.

**Response:**
- Contragent ID'lar ro'yxati

---

**Confirm Order**
**POST** `/api/punkt/orders/:id/confirm`

Buyurtmani tasdiqlash.

**Response:**
- Tasdiqlangan buyurtma ma'lumotlari

---

**Assign Order To Agent**
**POST** `/api/punkt/orders/:id/assign-to-agent`

Buyurtmani agentga yuborish.

**Request Body:**
- `agentId` (string, required) - Agent ID

**Response:**
- Agentga yuborilgan buyurtma ma'lumotlari

---

**Request To Contragent**
**POST** `/api/punkt/orders/:id/request-to-contragent`

Contragentga so'rov yuborish.

**Request Body:**
- `contragentId` (string, required) - Contragent ID
- `itemIds` (array, required) - Buyurtma item ID'lar ro'yxati

**Response:**
- So'rov yuborilgan buyurtma ma'lumotlari

---

**Request To Punkt**
**POST** `/api/punkt/orders/:id/request-to-punkt`

Boshqa punktga so'rov yuborish.

**Request Body:**
- `punktId` (string, required) - Punkt ID

**Response:**
- So'rov yuborilgan buyurtma ma'lumotlari

---

**Request To Punkts**
**POST** `/api/punkt/orders/:id/request-to-punkts`

Bir nechta punktlarga so'rov yuborish.

**Request Body:**
- `punktIds` (array, required) - Punkt ID'lar ro'yxati

**Response:**
- So'rovlar yuborilgan buyurtma ma'lumotlari

---

**Send To Punkt**
**POST** `/api/punkt/orders/:id/send-to-punkt`

Punktga buyurtma yuborish (punktdan punktga transfer).

**Request Body:**
- `punktId` (string, required) - Qabul qiluvchi punkt ID

**Response:**
- Yuborilgan buyurtma ma'lumotlari

---

**Receive From Punkt**
**POST** `/api/punkt/orders/:id/receive-from-punkt`

Punktdan buyurtma qabul qilish.

**Response:**
- Qabul qilingan buyurtma ma'lumotlari

---

**Receive From Contragent**
**POST** `/api/punkt/orders/:id/receive-from-contragent`

Contragentdan buyurtma qabul qilish.

**Response:**
- Qabul qilingan buyurtma ma'lumotlari

---

**Get Punkt To Punkt Requests**
**GET** `/api/punkt/punkt-to-punkt-requests`

Punktdan punktga so'rovlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'pending', 'accepted', 'rejected', 'delivered', optional)

**Response:**
- Punkt-to-punkt so'rovlar ro'yxati

---

**Respond To Punkt To Punkt Request**
**POST** `/api/punkt/punkt-to-punkt-requests/:orderId/respond`

Punktdan punktga so'rovga javob berish.

**Request Body:**
- `response` (enum: 'accepted', 'rejected', required)

**Response:**
- Javob berilgan so'rov ma'lumotlari

---

**Get Requests To My Punkt**
**GET** `/api/punkt/requests`

O'z punktiga kelgan so'rovlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'pending', 'accepted', 'rejected', optional)

**Response:**
- So'rovlar ro'yxati

---

**Respond To Request**
**POST** `/api/punkt/requests/:orderId/respond`

So'rovga javob berish.

**Request Body:**
- `response` (enum: 'accepted', 'rejected', required)

**Response:**
- Javob berilgan so'rov ma'lumotlari

---

### KPI Bonus Endpoints

**Get My KPI Summary**
**GET** `/api/punkt/kpi/summary`

KPI bonus umumiy ma'lumotlari.

**Response:**
- Total KPI amount
- Paid amount
- Unpaid amount

---

**Get My KPI Transactions**
**GET** `/api/punkt/kpi/transactions`

KPI bonus transaksiyalarini olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `isPaid` (boolean, optional)
- `dateFrom` (date, optional)
- `dateTo` (date, optional)

**Response:**
- KPI transaksiyalar ro'yxati

---

**Get My KPI Daily Balance**
**GET** `/api/punkt/kpi/balance`

Kunlik KPI balans.

**Response:**
- Kunlik balans ma'lumotlari

---

**Get My KPI Daily Report**
**GET** `/api/punkt/kpi/reports/daily`

Kunlik KPI hisoboti.

**Response:**
- Kunlik KPI hisoboti

---

## Marketplace API

### Base Path
```
/api/marketplace
```

### Endpointlar

#### Authentication

**Check Phone Exists**
**GET** `/api/marketplace/check-phone`

Telefon raqami mavjudligini tekshirish.

**Query Parameters:**
- `phone` (string, required)

**Response:**
- `exists` (boolean) - Telefon raqami mavjudligi

---

**Register Step 1**
**POST** `/api/marketplace/register/step1`

Ro'yxatdan o'tish - 1-bosqich (SMS kod yuborish).

**Request Body:**
- `phone` (string, required, phone format)

**Response:**
- SMS kod yuborildi xabari

---

**Register Step 2**
**POST** `/api/marketplace/register/step2`

Ro'yxatdan o'tish - 2-bosqich (Foydalanuvchi yaratish).

**Request Body:**
- `firstName` (string, required, 2-50 chars)
- `lastName` (string, required, 2-50 chars)
- `phone` (string, required, phone format)
- `gender` (enum: 'ayol', 'erkak', required)
- `viloyat` (string, required)
- `tuman` (string, required)
- `mfy` (string, required)
- `birthDate` (date, required)
- `password` (string, required, min 6 chars)
- `code` (string, required, 5 digits)

**Response:**
- `token` - JWT token
- `user` - Foydalanuvchi ma'lumotlari

---

**Login Step 1**
**POST** `/api/marketplace/login/step1`

Kirish - 1-bosqich (Parol tekshiruv va SMS kod yuborish).

**Request Body:**
- `phone` (string, required)
- `password` (string, required)

**Response:**
- SMS kod yuborildi xabari

---

**Login Step 2**
**POST** `/api/marketplace/login/step2`

Kirish - 2-bosqich (SMS kod tasdiqlash).

**Request Body:**
- `phone` (string, required)
- `code` (string, required, 5 digits)

**Response:**
- `token` - JWT token
- `user` - Foydalanuvchi ma'lumotlari

---

**Forgot Password Step 1**
**POST** `/api/marketplace/forgot-password/step1`

Parol tiklash - 1-bosqich (SMS kod yuborish).

**Request Body:**
- `phone` (string, required)

**Response:**
- SMS kod yuborildi xabari

---

**Forgot Password Step 2**
**POST** `/api/marketplace/forgot-password/step2`

Parol tiklash - 2-bosqich (Yangi parol o'rnatish).

**Request Body:**
- `phone` (string, required)
- `code` (string, required, 5 digits)
- `newPassword` (string, required, min 6 chars)

**Response:**
- Muvaffaqiyat xabari

---

**Resend SMS Code**
**POST** `/api/marketplace/resend-code`

SMS kodni qayta yuborish.

**Request Body:**
- `phone` (string, required)
- `type` (enum: 'login', 'register', 'forgot_password', required)

**Response:**
- SMS kod yuborildi xabari

---

#### Products & Categories

**Get All Products**
**GET** `/api/marketplace/products`

Barcha productlarni olish (Tuman productlar).

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `category` (string, optional)
- `subcategory` (string, optional)
- `search` (string, optional)
- `minPrice` (number, optional)
- `maxPrice` (number, optional)
- `status` (enum: 'active', optional)

**Response:**
- Productlar ro'yxati

---

**Get Product By ID**
**GET** `/api/marketplace/products/:id`

Bitta product ma'lumotlarini olish.

**Response:**
- Product ma'lumotlari (to'liq populate)

---

**Get All Maxalla Products**
**GET** `/api/marketplace/maxalla-products`

Barcha maxalla productlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `category` (string, optional)
- `search` (string, optional)
- `status` (enum: 'active', optional)

**Response:**
- Maxalla productlar ro'yxati

---

**Get Maxalla Product By ID**
**GET** `/api/marketplace/maxalla-products/:id`

Bitta maxalla product ma'lumotlarini olish.

**Response:**
- Maxalla product ma'lumotlari

---

**Get Maxalla Stores For Product**
**GET** `/api/marketplace/maxalla-products/:productId/stores`

Maxalla product uchun mavjud do'konlarni olish.

**Query Parameters:**
- `viloyat` (string, optional)
- `tuman` (string, optional)
- `mfy` (string, optional)

**Response:**
- Do'konlar ro'yxati (contragentlar)

---

**Get All Categories**
**GET** `/api/marketplace/categories`

Barcha kategoriyalarni olish.

**Response:**
- Kategoriyalar ro'yxati (parent va subcategories bilan)

---

**Get Category By ID**
**GET** `/api/marketplace/categories/:id`

Bitta kategoriya ma'lumotlarini olish.

**Response:**
- Kategoriya ma'lumotlari

---

**Get Products By Category**
**GET** `/api/marketplace/categories/:id/products`

Kategoriya bo'yicha productlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `subcategory` (string, optional)

**Response:**
- Productlar ro'yxati

---

**Get All Contragents**
**GET** `/api/marketplace/contragents`

Barcha contragentlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `activityType` (string, optional)
- `contragentLevel` (enum: 'tuman', 'mfy', optional)
- `status` (enum: 'active', optional)

**Response:**
- Contragentlar ro'yxati

---

**Get Contragent By ID**
**GET** `/api/marketplace/contragents/:id`

Bitta contragent ma'lumotlarini olish.

**Response:**
- Contragent ma'lumotlari (to'liq populate)

---

**Search**
**GET** `/api/marketplace/search`

Umumiy qidiruv (productlar, kategoriyalar, contragentlar).

**Query Parameters:**
- `q` (string, required) - Qidiruv so'zi
- `type` (enum: 'products', 'categories', 'contragents', 'all', optional)
- `page` (number, optional)
- `limit` (number, optional)

**Response:**
- Qidiruv natijalari

---

**Filter Products**
**GET** `/api/marketplace/filter`

Productlarni filter qilish.

**Query Parameters:**
- `category` (string, optional)
- `subcategory` (string, optional)
- `contragent` (string, optional)
- `minPrice` (number, optional)
- `maxPrice` (number, optional)
- `unit` (enum: 'dona', 'litr', 'kg', optional)
- `page` (number, optional)
- `limit` (number, optional)

**Response:**
- Filterlangan productlar ro'yxati

---

**Get Featured Contragents**
**GET** `/api/marketplace/featured-contragents`

Featured contragentlarni olish.

**Response:**
- Featured contragentlar ro'yxati

---

#### Cart (Tuman Products)

**Get Cart**
**GET** `/api/marketplace/cart`

Savatni olish.

**Response:**
- Savat ma'lumotlari

---

**Add To Cart**
**POST** `/api/marketplace/cart`

Savatga maxsulot qo'shish.

**Request Body:**
- `productId` (string, required)
- `quantity` (number, required, min 1)

**Response:**
- Yangilangan savat

---

**Update Cart Item**
**PUT** `/api/marketplace/cart/:productId`

Savatdagi maxsulot miqdorini yangilash.

**Request Body:**
- `quantity` (number, required, min 1)

**Response:**
- Yangilangan savat

---

**Remove From Cart**
**DELETE** `/api/marketplace/cart/:productId`

Savatdan maxsulotni olib tashlash.

**Response:**
- Yangilangan savat

---

**Clear Cart**
**DELETE** `/api/marketplace/cart`

Savatni tozalash.

**Response:**
- Muvaffaqiyat xabari

---

#### Cart (Maxalla Products)

**Get Maxalla Cart**
**GET** `/api/marketplace/maxalla-cart`

Maxalla savatni olish.

**Response:**
- Maxalla savat ma'lumotlari

---

**Add To Maxalla Cart**
**POST** `/api/marketplace/maxalla-cart`

Maxalla savatga maxsulot qo'shish.

**Request Body:**
- `productId` (string, required) - MaxallaProduct ID
- `quantity` (number, required, min 1)

**Response:**
- Yangilangan maxalla savat

---

**Update Maxalla Cart Item**
**PUT** `/api/marketplace/maxalla-cart/:productId`

Maxalla savatdagi maxsulot miqdorini yangilash.

**Request Body:**
- `quantity` (number, required, min 1)

**Response:**
- Yangilangan maxalla savat

---

**Remove From Maxalla Cart**
**DELETE** `/api/marketplace/maxalla-cart/:productId`

Maxalla savatdan maxsulotni olib tashlash.

**Response:**
- Yangilangan maxalla savat

---

**Clear Maxalla Cart**
**DELETE** `/api/marketplace/maxalla-cart`

Maxalla savatni tozalash.

**Response:**
- Muvaffaqiyat xabari

---

#### Orders (Tuman Products)

**Create Order**
**POST** `/api/marketplace/orders`

Yangi buyurtma yaratish (Tuman productlar).

**Request Body:**
- `paymentMethod` (enum: 'cash', 'card', required)
- `deliveryViloyat` (string, required)
- `deliveryTuman` (string, optional)
- `deliveryMfy` (string, optional)
- `deliveryNote` (string, optional, max 1000 chars)
- `phoneNumber` (string, optional, phone format)
- `clearCart` (boolean, default: true)

**Response:**
- Yaratilgan buyurtma ma'lumotlari

---

**Get Orders**
**GET** `/api/marketplace/orders`

O'z buyurtmalarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum, optional)
- `paymentStatus` (enum: 'pending', 'paid', 'failed', 'refunded', optional)

**Response:**
- Buyurtmalar ro'yxati

---

**Get Order By ID**
**GET** `/api/marketplace/orders/:id`

Bitta buyurtma ma'lumotlarini olish.

**Response:**
- Buyurtma ma'lumotlari (to'liq populate)

---

**Cancel Order**
**DELETE** `/api/marketplace/orders/:id`

Buyurtmani bekor qilish (faqat pending status uchun).

**Response:**
- Bekor qilingan buyurtma ma'lumotlari

---

**Confirm Delivery**
**POST** `/api/marketplace/orders/:id/confirm-delivery`

Buyurtmani yetkazib berilgan deb tasdiqlash (mijoz tomonidan).

**Response:**
- Tasdiqlangan buyurtma ma'lumotlari

---

#### Orders (Maxalla Products)

**Create Maxalla Order**
**POST** `/api/marketplace/maxalla-orders`

Yangi buyurtma yaratish (Maxalla productlar).

**Request Body:**
- `paymentMethod` (enum: 'cash', 'card', required)
- `deliveryViloyat` (string, required)
- `deliveryTuman` (string, optional)
- `deliveryMfy` (string, optional)
- `deliveryNote` (string, optional, max 1000 chars)
- `phoneNumber` (string, optional, phone format)
- `clearCart` (boolean, default: true)

**Response:**
- Yaratilgan buyurtma ma'lumotlari

---

**Get Maxalla Orders**
**GET** `/api/marketplace/maxalla-orders`

Maxalla buyurtmalarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum, optional)

**Response:**
- Maxalla buyurtmalar ro'yxati

---

**Get Maxalla Order By ID**
**GET** `/api/marketplace/maxalla-orders/:id`

Bitta maxalla buyurtma ma'lumotlarini olish.

**Response:**
- Maxalla buyurtma ma'lumotlari

---

**Cancel Maxalla Order**
**DELETE** `/api/marketplace/maxalla-orders/:id`

Maxalla buyurtmani bekor qilish.

**Response:**
- Bekor qilingan buyurtma ma'lumotlari

---

**Confirm Maxalla Delivery**
**POST** `/api/marketplace/maxalla-orders/:id/confirm-delivery`

Maxalla buyurtmani yetkazib berilgan deb tasdiqlash.

**Response:**
- Tasdiqlangan buyurtma ma'lumotlari

---

#### Profile

**Get Me**
**GET** `/api/marketplace/me`

O'z profil ma'lumotlarini olish.

**Response:**
- Foydalanuvchi ma'lumotlari

---

**Update Profile**
**PUT** `/api/marketplace/me`

Profil ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `firstName` (string, 2-50 chars)
- `lastName` (string, 2-50 chars)
- `gender` (enum: 'ayol', 'erkak')
- `birthDate` (date)

**Response:**
- Yangilangan profil ma'lumotlari

---

**Update Password**
**PATCH** `/api/marketplace/me/password`

Parolni o'zgartirish.

**Request Body:**
- `currentPassword` (string, required)
- `newPassword` (string, required, min 6 chars)

**Response:**
- Muvaffaqiyat xabari

---

**Update Avatar**
**PATCH** `/api/marketplace/me/avatar`

Avatar yuklash.

**Request Body:**
- `avatar` (string, required, base64 format)

**Response:**
- Yangilangan profil ma'lumotlari

---

**Update Location**
**PATCH** `/api/marketplace/me/location`

Manzilni yangilash.

**Request Body:**
- `viloyat` (string, optional)
- `tuman` (string, optional)
- `mfy` (string, optional)

**Response:**
- Yangilangan profil ma'lumotlari

---

**Get Viloyat Tuman**
**GET** `/api/marketplace/me/viloyat-tuman`

Tanlangan viloyat va tuman ma'lumotlarini olish.

**Response:**
- Viloyat va tuman ma'lumotlari

---

**Update Viloyat Tuman**
**PATCH** `/api/marketplace/me/viloyat-tuman`

Tanlangan viloyat va tuman ma'lumotlarini yangilash.

**Request Body:**
- `viloyat` (string, optional)
- `tuman` (string, optional)
- `mfy` (string, optional)

**Response:**
- Yangilangan ma'lumotlar

---

#### Notifications

**Get Notifications**
**GET** `/api/marketplace/notifications/list`

Bildirishnomalarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `type` (enum, optional)
- `isRead` (boolean, optional)

**Response:**
- Bildirishnomalar ro'yxati

---

**Get Unread Count**
**GET** `/api/marketplace/notifications/unread-count`

O'qilmagan bildirishnomalar soni.

**Response:**
- `count` (number)

---

**Mark Notification As Read**
**POST** `/api/marketplace/notifications/:notificationId/read`

Bildirishnomani o'qilgan deb belgilash.

**Response:**
- Muvaffaqiyat xabari

---

**Mark All Notifications As Read**
**POST** `/api/marketplace/notifications/read-all`

Barcha bildirishnomalarni o'qilgan deb belgilash.

**Response:**
- Muvaffaqiyat xabari

---

#### Partnership Requests

**Create Partnership Request**
**POST** `/api/marketplace/partnership-requests`

Yangi partnership request yaratish (optional auth).

**Request Body:**
- `companyName` (string, required, 2-200 chars)
- `inn` (string, required, 9 yoki 12 raqam)
- `mfo` (string, required)
- `accountNumber` (string, required)
- `viloyat` (string, required)
- `tuman` (string, required)
- `mfy` (string, required)
- `activityType` (string, required)
- `managerFirstName` (string, required, 2-50 chars)
- `managerLastName` (string, required, 2-50 chars)
- `managerPhone` (string, required, phone format)

**Response:**
- Yaratilgan partnership request

---

**Get My Partnership Requests**
**GET** `/api/marketplace/partnership-requests`

O'z partnership requestlarini olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'pending', 'approved', 'rejected', optional)

**Response:**
- Partnership requestlar ro'yxati

---

**Create Marketplace Partnership Request**
**POST** `/api/marketplace/marketplace-partnership-requests`

Yangi marketplace partnership request yaratish (auth required).

**Request Body:**
- `companyName` (string, required, 2-200 chars)
- `inn` (string, required, 9 yoki 12 raqam)
- `mfo` (string, required)
- `accountNumber` (string, required)
- `viloyat` (string, required)
- `tuman` (string, required)
- `mfy` (string, required)
- `activityType` (string, required)
- `managerFirstName` (string, required, 2-50 chars)
- `managerLastName` (string, required, 2-50 chars)
- `managerPhone` (string, required, phone format)

**Response:**
- Yaratilgan partnership request

---

**Get My Marketplace Partnership Requests**
**GET** `/api/marketplace/marketplace-partnership-requests`

O'z marketplace partnership requestlarini olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'pending', 'reviewing', 'contacted', 'approved', 'rejected', optional)

**Response:**
- Marketplace partnership requestlar ro'yxati

---

**Get My Marketplace Partnership Request By ID**
**GET** `/api/marketplace/marketplace-partnership-requests/:id`

Bitta marketplace partnership request ma'lumotlarini olish.

**Response:**
- Marketplace partnership request ma'lumotlari

---

## Product API

### Base Path
```
/api/product
```

### Endpointlar

**Create Product**
**POST** `/api/product/create`

Yangi product yaratish (Contragent uchun).

**Request Body:**
- `name` (string, required, 2-500 chars)
- `description` (object/string, optional)
- `price` (number, required, min 0)
- `originalPrice` (number, required, min 0)
- `images` (array, optional, max 5, base64 format)
- `category` (string, required)
- `subcategory` (string, optional)
- `quantity` (number, required, min 0)
- `unit` (enum: 'dona', 'litr', 'kg', required)
- `unitSize` (number, optional, min 0)
- `length` (number, optional, min 0)
- `width` (number, optional, min 0)
- `weight` (number, optional, min 0)
- `status` (enum: 'active', 'inactive', 'archived', default: 'active')
- `deliveryRegions` (array, optional)
- `kpiBonusPercent` (number, required, 0-100)

**Response:**
- Yaratilgan product (moderationStatus: 'pending')

---

**Get My Products**
**GET** `/api/product/my`

O'z productlarini olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum: 'active', 'inactive', 'archived', optional)
- `moderationStatus` (enum: 'pending', 'approved', 'rejected', optional)

**Response:**
- Productlar ro'yxati

---

**Get All Products**
**GET** `/api/product/list`

Barcha productlarni olish (public).

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `contragent` (string, optional)
- `category` (string, optional)
- `subcategory` (string, optional)
- `status` (enum: 'active', optional)
- `moderationStatus` (enum: 'approved', optional)
- `search` (string, optional)

**Response:**
- Productlar ro'yxati

---

**Get Product By ID**
**GET** `/api/product/:id`

Bitta product ma'lumotlarini olish (public).

**Response:**
- Product ma'lumotlari

---

**Update Product**
**PUT** `/api/product/:id`

Product ma'lumotlarini yangilash (faqat owner).

**Request Body:** (barcha fieldlar optional)
- `name` (string, 2-500 chars)
- `description` (object/string)
- `price` (number, min 0)
- `originalPrice` (number, min 0)
- `images` (array, max 5)
- `category` (string)
- `subcategory` (string)
- `quantity` (number, min 0)
- `unit` (enum: 'dona', 'litr', 'kg')
- `unitSize` (number, min 0)
- `length` (number, min 0)
- `width` (number, min 0)
- `weight` (number, min 0)
- `status` (enum: 'active', 'inactive', 'archived')
- `deliveryRegions` (array)
- `kpiBonusPercent` (number, 0-100)

**Note:** Yangilanganda `moderationStatus` avtomatik 'pending' ga o'zgaradi.

**Response:**
- Yangilangan product

---

**Update Product Status**
**PUT** `/api/product/:id/status`

Product statusini yangilash.

**Request Body:**
- `status` (enum: 'active', 'inactive', 'archived', required)

**Response:**
- Yangilangan product

---

**Delete Product**
**DELETE** `/api/product/:id`

Productni o'chirish (faqat owner).

**Response:**
- Muvaffaqiyat xabari

---

## Order API

**Note:** Order API endpointlari Marketplace API ichida joylashgan. Quyidagi endpointlar mavjud:

- `POST /api/marketplace/orders` - Buyurtma yaratish (Tuman)
- `POST /api/marketplace/maxalla-orders` - Buyurtma yaratish (Maxalla)
- `GET /api/marketplace/orders` - Buyurtmalarni olish
- `GET /api/marketplace/orders/:id` - Buyurtma ma'lumotlari
- `DELETE /api/marketplace/orders/:id` - Buyurtmani bekor qilish
- `POST /api/marketplace/orders/:id/confirm-delivery` - Yetkazib berilgan deb tasdiqlash

Batafsil ma'lumot uchun [Marketplace API](#marketplace-api) bo'limiga qarang.

---

## Payment API

### Base Path
```
/api/payment
```

### Endpointlar

**Pay Order**
**POST** `/api/payment/orders/:orderId/pay`

Buyurtma uchun to'lov amalga oshirish.

**Request Body:**
- `paymentMethod` (enum: 'cash', 'card', required)

**Response:**
- Payment transaction ma'lumotlari

---

**Get Payment Status**
**GET** `/api/payment/orders/:orderId/payment-status`

To'lov holatini ko'rish.

**Response:**
- Payment status ma'lumotlari
- `status` (enum: 'pending', 'collected', 'submitted', 'received', 'confirmed', 'rejected')
- `currentHolder` (enum: 'user', 'agent', 'finance')
- `transactionPath` (array) - To'lov tarixi

---

## Finance API

### Admin Finance

**Base Path:** `/api/admin-finance`

#### Reports

**Get Daily Report**
**GET** `/api/admin-finance/reports/daily`

Kunlik moliyaviy hisobot.

**Query Parameters:**
- `date` (date, optional) - Sana (default: bugun)

**Response:**
- Kunlik hisobot ma'lumotlari

---

**Get Weekly Report**
**GET** `/api/admin-finance/reports/weekly`

Haftalik moliyaviy hisobot.

**Query Parameters:**
- `week` (number, optional) - Hafta raqami
- `year` (number, optional) - Yil

**Response:**
- Haftalik hisobot ma'lumotlari

---

**Get Monthly Report**
**GET** `/api/admin-finance/reports/monthly`

Oylik moliyaviy hisobot.

**Query Parameters:**
- `month` (number, optional) - Oy raqami (1-12)
- `year` (number, optional) - Yil

**Response:**
- Oylik hisobot ma'lumotlari

---

**Get Yearly Report**
**GET** `/api/admin-finance/reports/yearly`

Yillik moliyaviy hisobot.

**Query Parameters:**
- `year` (number, optional) - Yil (default: joriy yil)

**Response:**
- Yillik hisobot ma'lumotlari

---

**Get Custom Report**
**GET** `/api/admin-finance/reports/custom`

Belgilangan muddat hisoboti.

**Query Parameters:**
- `startDate` (date, required)
- `endDate` (date, required)

**Response:**
- Custom hisobot ma'lumotlari

---

#### Submissions

**Get Pending Submissions**
**GET** `/api/admin-finance/submissions/pending`

Kutilayotgan topshiruvlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)

**Response:**
- Pending submissions ro'yxati

---

**Confirm Submission**
**POST** `/api/admin-finance/submissions/:submissionId/confirm`

Topshiruvni tasdiqlash.

**Response:**
- Tasdiqlangan submission ma'lumotlari

---

**Reject Submission**
**POST** `/api/admin-finance/submissions/:submissionId/reject`

Topshiruvni rad etish.

**Request Body:**
- `rejectionReason` (string, required)

**Response:**
- Rad etilgan submission ma'lumotlari

---

#### Transactions

**Get All Transactions**
**GET** `/api/admin-finance/transactions`

Barcha payment transaksiyalarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum, optional)
- `currentHolder` (enum: 'user', 'agent', 'finance', optional)
- `dateFrom` (date, optional)
- `dateTo` (date, optional)

**Response:**
- Payment transaksiyalar ro'yxati

---

#### Statistics

**Get Statistics**
**GET** `/api/admin-finance/statistics`

Umumiy moliyaviy statistika.

**Response:**
- Umumiy statistika

---

**Get Statistics By Region**
**GET** `/api/admin-finance/statistics/region`

Viloyat bo'yicha statistika.

**Response:**
- Viloyatlar statistikasi

---

**Get Statistics By District**
**GET** `/api/admin-finance/statistics/district`

Tuman bo'yicha statistika.

**Response:**
- Tumanlar statistikasi

---

**Get Statistics By MFY**
**GET** `/api/admin-finance/statistics/mfy`

MFY bo'yicha statistika.

**Response:**
- MFYlar statistikasi

---

**Get Agent Performance**
**GET** `/api/admin-finance/statistics/agent-performance`

Agentlar faolligi statistikasi.

**Response:**
- Agentlar faolligi

---

#### Balance

**Get Finance Balance**
**GET** `/api/admin-finance/balance`

Umumiy moliyaviy balans.

**Response:**
- Total received
- Total distributed
- Finance KPI amount
- Total balance

---

**Get Total Received**
**GET** `/api/admin-finance/balance/total-received`

Umumiy tushgan summa.

**Response:**
- Total received amount

---

**Get Total Distributed**
**GET** `/api/admin-finance/balance/total-distributed`

Tarqatilgan summa (KPI bonuslar).

**Response:**
- Total distributed amount

---

**Get Finance KPI Amount**
**GET** `/api/admin-finance/balance/finance-kpi`

Moliya bo'limiga ajratilgan summa.

**Response:**
- Finance KPI amount

---

**Get Delivery Service KPI Amount**
**GET** `/api/admin-finance/balance/delivery-service-kpi`

Yetkazib berish xizmati summasi.

**Response:**
- Delivery service KPI amount

---

**Get Total Balance**
**GET** `/api/admin-finance/balance/total-balance`

Umumiy balans (Tushgan - Tarqatilgan).

**Response:**
- Total balance

---

### Agent Finance

**Base Path:** `/api/agent-finance`

**Get Daily Report**
**GET** `/api/agent-finance/daily-report`

Agent uchun kunlik hisobot.

**Query Parameters:**
- `date` (date, optional) - Sana (default: bugun)

**Response:**
- Kunlik hisobot ma'lumotlari (ordersCount, totalAmount, collectedAmount, submittedAmount, pendingAmount, cashAmount, cardAmount)

---

**Get Pending Payments**
**GET** `/api/agent-finance/pending-payments`

Kutilayotgan to'lovlarni olish (o'z hududidagi buyurtmalar).

**Response:**
- Pending payments ro'yxati

---

**Collect Payment**
**POST** `/api/agent-finance/collect-payment/:transactionId`

To'lovni qabul qilish (mijozdan).

**Response:**
- Collected payment ma'lumotlari

---

**Submit To Finance**
**POST** `/api/agent-finance/submit-to-finance`

Moliya bo'limiga to'g'ridan-to'g'ri topshirish.

**Request Body:**
- `transactionIds` (array, required) - Transaction ID'lar ro'yxati
- `notes` (string, optional)

**Response:**
- Submission ma'lumotlari
- Contragent payments yaratilgan/yangilangan ma'lumotlari

**Note:** Bu submission moliya bo'limiga yuboriladi va `ContragentPaymentDistribution` yaratiladi.

---

**Get Statistics**
**GET** `/api/agent-finance/statistics`

Agent statistikasi.

**Query Parameters:**
- `startDate` (date, optional)
- `endDate` (date, optional)

**Response:**
- Statistika ma'lumotlari (totalOrders, totalAmount, collectedAmount, submittedAmount, pendingAmount, cashAmount, cardAmount)

---

## KPI API

### Admin KPI Payments

**Base Path:** `/api/admin-kpi-payments`

**Get Unpaid Payments**
**GET** `/api/admin-kpi-payments/unpaid`

To'lanmagan KPI to'lovlarini olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `recipientType` (enum: 'agent', 'punkt', optional)
- `dateFrom` (date, optional)
- `dateTo` (date, optional)

**Response:**
- To'lanmagan to'lovlar ro'yxati

---

**Get Unpaid Payments Grouped**
**GET** `/api/admin-kpi-payments/unpaid/grouped`

To'lanmagan to'lovlar (guruhlangan).

**Response:**
- To'lovlar guruhlangan (recipient bo'yicha)

---

**Mark Payments As Paid**
**POST** `/api/admin-kpi-payments/mark-as-paid`

To'lovlarni "to'landi" deb belgilash.

**Request Body:**
- `paymentIds` (array, required) - Payment ID'lar ro'yxati
- `notes` (string, optional)

**Response:**
- To'langan to'lovlar ro'yxati

---

**Get Payment Statistics**
**GET** `/api/admin-kpi-payments/statistics`

To'lovlar statistikasi.

**Response:**
- To'lovlar statistika

---

**Get Paid Payments**
**GET** `/api/admin-kpi-payments/paid`

To'langan to'lovlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `recipientType` (enum: 'agent', 'punkt', optional)
- `dateFrom` (date, optional)
- `dateTo` (date, optional)

**Response:**
- To'langan to'lovlar ro'yxati

---

**Sync KPI Payments**
**POST** `/api/admin-kpi-payments/sync`

KPI transaksiyalardan to'lovlarni yaratish/yangilash.

**Response:**
- Sinxronlashtirish natijasi

---

### Admin Contragent Payments

**Base Path:** `/api/admin-contragent-payments`

**Get Unpaid Payments**
**GET** `/api/admin-contragent-payments/unpaid`

To'lanmagan contragent to'lovlarini olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `contragent` (string, optional)
- `dateFrom` (date, optional)
- `dateTo` (date, optional)
- `isOverdue` (boolean, optional)

**Response:**
- To'lanmagan to'lovlar ro'yxati

---

**Get Unpaid Payments Grouped**
**GET** `/api/admin-contragent-payments/unpaid/grouped`

To'lanmagan to'lovlar (guruhlangan contragent bo'yicha).

**Response:**
- To'lovlar guruhlangan

---

**Pay Contragent Payment**
**POST** `/api/admin-contragent-payments/:id/pay`

Bitta to'lovni to'lash.

**Request Body:**
- `notes` (string, optional)

**Response:**
- To'langan to'lov ma'lumotlari

---

**Pay Contragent Payments By Date Range**
**POST** `/api/admin-contragent-payments/pay-by-date-range`

Belgilangan muddat orasida filterlangan to'lovlarni to'lash.

**Request Body:**
- `dateFrom` (date, required)
- `dateTo` (date, required)
- `contragentIds` (array, optional)
- `notes` (string, optional)

**Response:**
- To'langan to'lovlar ro'yxati

---

**Mark Payments As Paid**
**POST** `/api/admin-contragent-payments/mark-as-paid`

Bir nechta to'lovlarni "to'landi" deb belgilash.

**Request Body:**
- `paymentIds` (array, required) - Payment ID'lar ro'yxati
- `notes` (string, optional)

**Response:**
- To'langan to'lovlar ro'yxati

---

**Get Payment Statistics**
**GET** `/api/admin-contragent-payments/statistics`

To'lovlar statistikasi.

**Response:**
- To'lovlar statistika

---

**Get Paid Payments**
**GET** `/api/admin-contragent-payments/paid`

To'langan to'lovlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `contragent` (string, optional)
- `dateFrom` (date, optional)
- `dateTo` (date, optional)

**Response:**
- To'langan to'lovlar ro'yxati

---

**Sync Contragent Payments**
**POST** `/api/admin-contragent-payments/sync`

Buyurtmalardan to'lovlarni yaratish/yangilash.

**Response:**
- Sinxronlashtirish natijasi

---

## Notification API

### Base Path
```
/api/notifications
```

### Admin Endpoints

**Create Notification**
**POST** `/api/notifications`

Yangi bildirishnoma yaratish.

**Request Body:**
- `title` (string, required, max 200 chars)
- `message` (string, required, max 2000 chars)
- `type` (enum: 'info', 'warning', 'success', 'error', 'announcement', 'promotion', 'update', default: 'info')
- `targetType` (enum: 'all', 'punkts', 'mfy_agents', 'marketplace_users', 'contragents', required)
- `targetIds` (array, optional) - Maxsus target ID'lar
- `targetRefModel` (enum: 'Punkt', 'Agent', 'MarketplaceUser', 'Contragent', optional)
- `viloyatId` (string, optional)
- `tumanId` (string, optional)
- `mfyId` (string, optional)

**Response:**
- Yaratilgan bildirishnoma

**Note:** Bildirishnoma Socket.io orqali real-time yuboriladi.

---

**Get All Notifications**
**GET** `/api/notifications`

Barcha bildirishnomalarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `targetType` (enum, optional)
- `type` (enum, optional)
- `isActive` (boolean, optional)

**Response:**
- Bildirishnomalar ro'yxati

---

**Get Notification Stats**
**GET** `/api/notifications/stats`

Bildirishnomalar statistikasi.

**Response:**
- Statistika ma'lumotlari

---

**Get Notification By ID**
**GET** `/api/notifications/:id`

Bitta bildirishnoma ma'lumotlarini olish.

**Response:**
- Bildirishnoma ma'lumotlari

---

**Update Notification**
**PUT** `/api/notifications/:id`

Bildirishnoma ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `title` (string, max 200 chars)
- `message` (string, max 2000 chars)
- `type` (enum)
- `isActive` (boolean)

**Response:**
- Yangilangan bildirishnoma

---

**Delete Notification**
**DELETE** `/api/notifications/:id`

Bildirishnomani o'chirish.

**Response:**
- Muvaffaqiyat xabari

---

### User Endpoints

**Get My Notifications**
**GET** `/api/notifications/my/:userType/:userId`

O'z bildirishnomalarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `isRead` (boolean, optional)
- `type` (enum, optional)

**Response:**
- Bildirishnomalar ro'yxati

---

**Mark As Read**
**POST** `/api/notifications/:notificationId/read`

Bildirishnomani o'qilgan deb belgilash.

**Request Body:**
- `userType` (enum: 'Punkt', 'Agent', 'MarketplaceUser', 'Contragent', required)
- `userId` (string, required)

**Response:**
- Muvaffaqiyat xabari

---

## Review API

### Base Path
```
/api/reviews
```

### Public Endpoints

**Get Active Templates**
**GET** `/api/reviews/templates`

Faol comment templatelarni olish.

**Response:**
- Comment templatelar ro'yxati

---

**Get Product Reviews**
**GET** `/api/reviews/product/:productId`

Product bo'yicha sharhlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `rating` (number, optional, 1-5)
- `isPositive` (boolean, optional)

**Response:**
- Sharhlar ro'yxati

---

### Marketplace User Endpoints

**Create Review**
**POST** `/api/reviews`

Yangi sharh yaratish.

**Request Body:**
- `order` (string, required) - Order ID
- `product` (string, required) - Product ID
- `rating` (number, required, 1-5)
- `commentTemplate` (string, optional) - Template ID
- `customComment` (string, optional, max 1000 chars)

**Response:**
- Yaratilgan sharh

**Note:** 
- Agar `rating <= 2` yoki `customComment` bo'lsa, avtomatik `ReviewContact` yaratiladi.
- Har bir order-product kombinatsiyasi uchun faqat bitta sharh mumkin.

---

### Admin Endpoints

**Get All Reviews**
**GET** `/api/reviews/admin`

Barcha sharhlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `product` (string, optional)
- `user` (string, optional)
- `rating` (number, optional, 1-5)
- `isPositive` (boolean, optional)

**Response:**
- Sharhlar ro'yxati

---

**Get Review By ID**
**GET** `/api/reviews/admin/:id`

Bitta sharh ma'lumotlarini olish.

**Response:**
- Sharh ma'lumotlari

---

**Create Comment Template**
**POST** `/api/reviews/admin/comment-templates`

Yangi comment template yaratish.

**Request Body:**
- `text` (string, required, max 200 chars)
- `order` (number, required, unique) - Tartib raqami
- `isActive` (boolean, default: true)

**Response:**
- Yaratilgan template

---

**Get All Comment Templates**
**GET** `/api/reviews/admin/comment-templates`

Barcha comment templatelarni olish.

**Query Parameters:**
- `isActive` (boolean, optional)

**Response:**
- Comment templatelar ro'yxati

---

**Get Comment Template By ID**
**GET** `/api/reviews/admin/comment-templates/:id`

Bitta comment template ma'lumotlarini olish.

**Response:**
- Comment template ma'lumotlari

---

**Update Comment Template**
**PUT** `/api/reviews/admin/comment-templates/:id`

Comment template ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `text` (string, max 200 chars)
- `order` (number, unique)
- `isActive` (boolean)

**Response:**
- Yangilangan template

---

**Delete Comment Template**
**DELETE** `/api/reviews/admin/comment-templates/:id`

Comment templateni o'chirish.

**Response:**
- Muvaffaqiyat xabari

---

**Create Initial Templates**
**POST** `/api/reviews/admin/initial-templates`

Boshlang'ich comment templatelarni yaratish.

**Response:**
- Yaratilgan templatelar ro'yxati

---

**Get All Contacts**
**GET** `/api/reviews/admin/contacts`

Barcha review contactlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `isPositive` (boolean, optional)
- `status` (enum: 'pending', 'in_progress', 'resolved', optional)

**Response:**
- Review contactlar ro'yxati

---

**Get Positive Contacts**
**GET** `/api/reviews/admin/contacts/positive`

Ijobiylar contactlarni olish.

**Response:**
- Ijobiylar contactlar ro'yxati

---

**Get Negative Contacts**
**GET** `/api/reviews/admin/contacts/negative`

Salbiylar contactlarni olish.

**Response:**
- Salbiylar contactlar ro'yxati

---

**Get Contact By ID**
**GET** `/api/reviews/admin/contacts/:id`

Bitta contact ma'lumotlarini olish.

**Response:**
- Contact ma'lumotlari

---

**Update Contact Status**
**PUT** `/api/reviews/admin/contacts/:id/status`

Contact statusini yangilash.

**Request Body:**
- `status` (enum: 'pending', 'in_progress', 'resolved', required)
- `adminNotes` (string, optional, max 1000 chars)

**Response:**
- Yangilangan contact

---

**Get Contact Statistics**
**GET** `/api/reviews/admin/contacts/statistics`

Contactlar statistikasi.

**Response:**
- Contactlar statistika

---

## Region API

### Base Path
```
/api/regions
```

### Endpointlar

**Create Region**
**POST** `/api/regions`

Yangi region yaratish.

**Request Body:**
- `name` (string, required)
- `type` (enum: 'region', 'district', 'mfy', required)
- `parent` (string, optional) - Ota region ID
- `code` (string, required, unique)
- `status` (enum: 'active', 'inactive', default: 'active')

**Response:**
- Yaratilgan region

---

**Get All Regions**
**GET** `/api/regions`

Barcha regionlarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `type` (enum: 'region', 'district', 'mfy', optional)
- `parent` (string, optional)
- `status` (enum: 'active', 'inactive', optional)

**Response:**
- Regionlar ro'yxati

---

**Get Regions By Type**
**GET** `/api/regions/type/:type`

Type bo'yicha regionlarni olish.

**Query Parameters:**
- `status` (enum: 'active', 'inactive', optional)
- `parent` (string, optional)

**Response:**
- Regionlar ro'yxati

---

**Get Region Children**
**GET** `/api/regions/:id/children`

Regionning bolalarini olish.

**Query Parameters:**
- `status` (enum: 'active', 'inactive', optional)

**Response:**
- Bolalar regionlar ro'yxati

---

**Update Region Status**
**PATCH** `/api/regions/:id/status`

Region statusini yangilash.

**Request Body:**
- `status` (enum: 'active', 'inactive', required)

**Response:**
- Yangilangan region

---

**Get Region By ID**
**GET** `/api/regions/:id`

Bitta region ma'lumotlarini olish.

**Response:**
- Region ma'lumotlari

---

**Update Region**
**PUT** `/api/regions/:id`

Region ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string)
- `type` (enum: 'region', 'district', 'mfy')
- `parent` (string)
- `code` (string, unique)
- `status` (enum: 'active', 'inactive')

**Response:**
- Yangilangan region

---

**Delete Region**
**DELETE** `/api/regions/:id`

Regionni o'chirish.

**Response:**
- Muvaffaqiyat xabari

---

## Category API

### Base Path
```
/api/category
```

### Endpointlar

**Get All Categories**
**GET** `/api/category/list`

Barcha kategoriyalarni olish (read-only).

**Query Parameters:**
- `status` (enum: 'active', 'inactive', optional)

**Response:**
- Kategoriyalar ro'yxati

---

**Get Category By ID**
**GET** `/api/category/:id`

Bitta kategoriya ma'lumotlarini olish.

**Response:**
- Kategoriya ma'lumotlari

---

**Get All Subcategories**
**GET** `/api/category/subcategory/list`

Barcha subkategoriyalarni olish.

**Query Parameters:**
- `parent` (string, optional) - Ota kategoriya ID
- `status` (enum: 'active', 'inactive', optional)

**Response:**
- Subkategoriyalar ro'yxati

---

## Device Verification API

### Base Path
```
/api/device-verification
```

### Endpointlar

**Request Device Verification Code**
**POST** `/api/device-verification/:userModel/request-code`

Yangi qurilma uchun SMS kod so'rash.

**Path Parameters:**
- `userModel` (enum: 'Admin', 'Contragent', 'Punkt', 'Agent', required)

**Request Body:**
- `phone` (string, required, phone format)
- `deviceId` (string, required)
- `deviceName` (string, optional)
- `deviceType` (enum: 'mobile', 'tablet', 'desktop', 'web', 'unknown', optional)
- `platform` (string, optional)
- `os` (string, optional)
- `browser` (string, optional)
- `ipAddress` (string, optional)
- `userAgent` (string, optional)
- `location` (object, optional)

**Response:**
- SMS kod yuborildi xabari

---

**Verify Device**
**POST** `/api/device-verification/:userModel/verify`

SMS kodni tasdiqlash va qurilmani faollashtirish.

**Path Parameters:**
- `userModel` (enum: 'Admin', 'Contragent', 'Punkt', 'Agent', required)

**Request Body:**
- `phone` (string, required)
- `deviceId` (string, required)
- `code` (string, required, 5 digits)

**Response:**
- Device faollashtirildi xabari

---

**Resend Device Verification Code**
**POST** `/api/device-verification/:userModel/resend-code`

SMS kodni qayta yuborish.

**Path Parameters:**
- `userModel` (enum: 'Admin', 'Contragent', 'Punkt', 'Agent', required)

**Request Body:**
- `phone` (string, required)
- `deviceId` (string, required)

**Response:**
- SMS kod yuborildi xabari

---

## Delivery Provider API

### Base Path
```
/api/delivery-providers
```

### Endpointlar

**Login**
**POST** `/api/delivery-providers/login`

Yetkazib beruvchi login qilish.

**Request Body:**
- `phone` (string, required)
- `password` (string, required)

**Response:**
- `token` - JWT token
- `deliveryProvider` - Yetkazib beruvchi ma'lumotlari

---

**Get My Profile**
**GET** `/api/delivery-providers/me`

O'z profil ma'lumotlarini olish.

**Response:**
- Yetkazib beruvchi ma'lumotlari

---

**Update My Profile**
**PUT** `/api/delivery-providers/me`

Profil ma'lumotlarini yangilash.

**Request Body:** (barcha fieldlar optional)
- `name` (string, 2-200 chars)
- `phone` (string, phone format)
- `status` (enum: 'active', 'inactive')
- `notes` (string, max 1000 chars)

**Response:**
- Yangilangan profil

---

**Change Password**
**POST** `/api/delivery-providers/change-password`

Parolni o'zgartirish.

**Request Body:**
- `currentPassword` (string, required)
- `newPassword` (string, required, min 6 chars)

**Response:**
- Muvaffaqiyat xabari

---

**Get My Orders**
**GET** `/api/delivery-providers/orders`

O'z buyurtmalarni olish.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `status` (enum, optional)

**Response:**
- Buyurtmalar ro'yxati

---

**Get Order By ID**
**GET** `/api/delivery-providers/orders/:id`

Bitta buyurtma ma'lumotlarini olish.

**Response:**
- Buyurtma ma'lumotlari

---

**Mark Order As Delivered**
**POST** `/api/delivery-providers/orders/:orderId/mark-delivered`

Buyurtmani mijozga yetkazilgan deb belgilash.

**Response:**
- Yangilangan buyurtma ma'lumotlari

---

## Workflow'lar

### 1. Marketplace User Buyurtma Oqimi

1. **MarketplaceUser** productlarni ko'radi (`GET /api/marketplace/products`)
2. Savatga qo'shadi (`POST /api/marketplace/cart`)
3. Buyurtma yaratadi (`POST /api/marketplace/orders`)
4. To'lov amalga oshiradi (`POST /api/payment/orders/:orderId/pay`)
5. **Punkt** buyurtmani ko'radi va tasdiqlaydi (`POST /api/punkt/orders/:id/confirm`)
6. **Punkt** contragentga so'rov yuboradi (`POST /api/punkt/orders/:id/request-to-contragent`)
7. **Contragent** so'rovga javob beradi (`POST /api/contragent/orders/:orderId/respond`)
8. **Contragent** punktga yetkazadi (`POST /api/contragent/orders/:orderId/deliver-to-punkt`)
9. **Punkt** contragentdan qabul qiladi (`POST /api/punkt/orders/:id/receive-from-contragent`)
10. **Punkt** agentga yuboradi (`POST /api/punkt/orders/:id/assign-to-agent`)
11. **Agent** buyurtmani ko'radi va mijozga yetkazadi (`POST /api/agent/orders/:id/confirm`)
12. **Agent** mijozga yetkazilgan deb belgilaydi (`POST /api/agent/orders/:id/delivered`)
13. **MarketplaceUser** yetkazib berilgan deb tasdiqlaydi (`POST /api/marketplace/orders/:id/confirm-delivery`)
14. KPI bonus avtomatik hisoblanadi va yaratiladi

---

### 2. Maxalla Contragent Buyurtma Oqimi

1. **MarketplaceUser** maxalla productlarni ko'radi (`GET /api/marketplace/maxalla-products`)
2. Maxalla savatga qo'shadi (`POST /api/marketplace/maxalla-cart`)
3. Maxalla buyurtma yaratadi (`POST /api/marketplace/maxalla-orders`)
4. **MaxallaContragent** buyurtmani ko'radi (`GET /api/maxalla-contragents/orders`)
5. **MaxallaContragent** so'rovga javob beradi (`POST /api/maxalla-contragents/orders/:orderId/respond`)
6. **MaxallaContragent** yetkazib beruvchiga yuboradi (`POST /api/maxalla-contragents/orders/:orderId/send-to-delivery-provider`)
7. **DeliveryProvider** buyurtmani ko'radi (`GET /api/delivery-providers/orders`)
8. **DeliveryProvider** mijozga yetkazadi (`POST /api/delivery-providers/orders/:orderId/mark-delivered`)
9. **MarketplaceUser** yetkazib berilgan deb tasdiqlaydi (`POST /api/marketplace/maxalla-orders/:id/confirm-delivery`)

---

### 3. Payment Oqimi

1. **MarketplaceUser** to'lov amalga oshiradi (`POST /api/payment/orders/:orderId/pay`)
2. **PaymentTransaction** yaratiladi (status: 'pending', currentHolder: 'user')
3. **Agent** to'lovni qabul qiladi (`POST /api/agent-finance/collect-payment/:transactionId`)
   - Status: 'collected', currentHolder: 'agent'
4. **Agent** moliya bo'limiga to'g'ridan-to'g'ri topshiradi (`POST /api/agent-finance/submit-to-finance`)
   - Status: 'submitted', currentHolder: 'finance'
5. **Admin (Finance)** tasdiqlaydi (`POST /api/admin-finance/submissions/:submissionId/confirm`)
   - Status: 'confirmed', currentHolder: 'finance'
6. **ContragentPaymentDistribution** yaratiladi (agar submission finance'ga yuborilgan bo'lsa)

---

### 4. KPI Bonus Oqimi

1. **Order** status `confirmed_by_customer` ga o'zgarganda
2. `calculateAndCreateKpiBonus()` funksiyasi chaqiriladi
3. Har bir order item uchun **KpiBonusTransaction** yaratiladi
4. KPI bonus quyidagicha taqsimlanadi:
   - Punkt: `totalKpiAmount * distribution.punkt / 100`
   - Agent: `totalKpiAmount * distribution.agent / 100`
   - Finance: `totalKpiAmount * distribution.finance / 100`
   - DeliveryService: `totalKpiAmount * distribution.deliveryService / 100`
   - PunktTransfer: `totalKpiAmount * distribution.punktTransfer / 100` (fromPunkt va toPunkt uchun yarmi-yarmi)
5. **Admin** KPI to'lovlarni ko'radi (`GET /api/admin-kpi-payments/unpaid`)
6. **Admin** to'lovlarni "to'landi" deb belgilaydi (`POST /api/admin-kpi-payments/mark-as-paid`)
7. **KpiPaymentDistribution** yaratiladi yoki yangilanadi
8. **Agent/Punkt** o'z KPI ma'lumotlarini ko'radi (`GET /api/agent/kpi/summary`, `GET /api/punkt/kpi/summary`)

---

### 5. Contragent Payment Oqimi

1. **Order** `confirmed_by_customer` statusga o'tganda
2. **ContragentPaymentDistribution** yaratiladi (agar hali yaratilmagan bo'lsa)
3. Summa: `totalPrice - totalKpiPrice`
4. **Admin** to'lanmagan to'lovlarni ko'radi (`GET /api/admin-contragent-payments/unpaid`)
5. **Admin** to'lovni to'laydi (`POST /api/admin-contragent-payments/:id/pay`)
6. **Contragent** o'z to'lovlarini ko'radi (`GET /api/contragents/payments/unpaid`)
7. Socket.io orqali contragentga bildirishnoma yuboriladi

---

### 6. Product Moderation Oqimi

1. **Contragent** product yaratadi (`POST /api/product/create`)
2. Product `moderationStatus: 'pending'` bilan yaratiladi
3. **Admin** pending productlarni ko'radi (`GET /api/admins/products/moderation/pending`)
4. **Admin** productni tasdiqlaydi (`POST /api/admins/products/moderation/:id/approve`)
   - `moderationStatus: 'approved'`
5. Yoki **Admin** productni rad etadi (`POST /api/admins/products/moderation/:id/reject`)
   - `moderationStatus: 'rejected'`
   - `rejectionReason` saqlanadi
6. **Contragent** o'z productlarini ko'radi (`GET /api/product/my`)
7. Agar product yangilansa, `moderationStatus` yana 'pending' ga o'zgaradi

---

### 7. Partnership Request Oqimi

1. **MarketplaceUser** (yoki tokensiz) partnership request yaratadi (`POST /api/marketplace/partnership-requests`)
2. **Admin** requestlarni ko'radi (`GET /api/admins/partnership-requests`)
3. **Admin** contact statusini yangilaydi (`PATCH /api/admins/partnership-requests/:id/contact-status`)
4. **Admin** request statusini yangilaydi (`PATCH /api/admins/partnership-requests/:id/status`)
5. Agar `status: 'approved'` bo'lsa, **Admin** contragentga aylantiradi (`POST /api/admins/partnership-requests/:id/convert-to-contragent`)
6. Yangi **Contragent** yaratiladi
7. Contragentga SMS orqali parol o'rnatish kodi yuboriladi

---

## Xulosa

Bu API dokumentatsiyasi TTSA Backend loyihasining barcha endpointlarini qamrab oladi. Har bir endpoint uchun:
- HTTP method
- Path
- Request body/query parameters
- Response format
- Authentication requirements

ko'rsatilgan.

Qo'shimcha ma'lumot uchun alohida endpoint controller kodlariga qarang.