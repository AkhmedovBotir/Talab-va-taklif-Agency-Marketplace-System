# Marketplace Mahsulotlar API Dokumentatsiyasi

Bu dokumentatsiya Marketplace uchun mahsulotlar API spetsifikatsiyasini o'z ichiga oladi. Marketplace ikki xil mahsulot turini qo'llab-quvvatlaydi: **Tuman mahsulotlari** va **Maxalla mahsulotlari**.

**Base Path:** `/api/marketplace`

---

## Munda

1. [Kirish](#kirish)
2. [Tuman Mahsulotlari API](#tuman-mahsulotlari-api)
3. [Maxalla Mahsulotlari API](#maxalla-mahsulotlari-api)
4. [Maxalla Dokonlarini Tanlash](#maxalla-dokonlarini-tanlash)
5. [Savat API (Alohida Korzinkalar)](#savat-api-alohida-korzinkalar)
6. [Buyurtma API (Alohida Buyurtmalar)](#buyurtma-api-alohida-buyurtmalar)
7. [Tuman vs Maxalla Buyurtmalari](#tuman-vs-maxalla-buyurtmalari)
8. [Ma'lumotlar Strukturasi](#malumotlar-strukturasi)
9. [Xato Kodlari](#xato-kodlari)
10. [Misollar](#misollar)
11. [Eslatmalar](#eslatmalar)
12. [Bog'liq Dokumentatsiyalar](#bogliq-dokumentatsiyalar)

---

## Kirish

Marketplace ikki xil mahsulot turini qo'llab-quvvatlaydi:

### Tuman Mahsulotlari
- **Kontragent Darajasi:** `contragentLevel: 'tuman'`
- **Model:** `Product`
- **API Path:** `/api/marketplace/products`
- **Xususiyatlar:**
  - To'liq mahsulot ma'lumotlari (name, description, images, category, subcategory)
  - Moderation status (faqat approved mahsulotlar ko'rsatiladi)
  - KPI bonus foizi mavjud
  - Delivery regions mavjud

### Maxalla Mahsulotlari
- **Kontragent Darajasi:** `contragentLevel: 'mfy'`
- **Model:** `MaxallaProduct` (BaseProduct'ga reference)
- **API Path:** `/api/marketplace/maxalla-products`
- **Xususiyatlar:**
  - BaseProduct ma'lumotlaridan foydalanadi
  - Har bir maxalla kontragent o'z narxi va miqdorini belgilaydi
  - KPI bonus foizi yo'q
  - Faqat o'z MFYsi bo'yicha xizmat ko'rsatadi

---

## Tuman Mahsulotlari API

### Barcha Tuman Mahsulotlarini Olish

```
GET /api/marketplace/products
```

**Authentication:** Not required (Public)

**Query Parameters:**
- `category` - Kategoriya ID (optional)
- `subcategory` - Subkategoriya ID (optional)
- `contragent` - Kontragent ID (optional, faqat tuman kontragentlar)
- `status` - Status filter (optional, default: active)
- `minPrice` - Minimal narx (optional)
- `maxPrice` - Maksimal narx (optional)
- `search` - Qidiruv so'rovi (optional)
- `page` - Sahifa raqami (default: 1)
- `limit` - Har sahifadagi elementlar soni (default: 20)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5,
  "data": [
    {
      "_id": "product_id",
      "name": "Mahsulot nomi",
      "description": "Tavsif",
      "images": ["image1.jpg", "image2.jpg"],
      "price": 50000,
      "originalPrice": 60000,
      "quantity": 100,
      "unit": "dona",
      "unitSize": 1,
      "category": {
        "_id": "category_id",
        "name": "Kategoriya",
        "slug": "kategoriya",
        "status": "active"
      },
      "subcategory": {
        "_id": "subcategory_id",
        "name": "Subkategoriya",
        "slug": "subkategoriya",
        "status": "active"
      },
      "contragent": {
        "_id": "contragent_id",
        "name": "Kontragent nomi",
        "phone": "+998901234567",
        "viloyat": { "name": "Toshkent", "type": "region", "code": "TOS" },
        "tuman": { "name": "Yunusobod", "type": "district", "code": "YUN" },
        "mfy": { "name": "MFY 1", "type": "mfy", "code": "MFY1" },
        "status": "active"
      },
      "deliveryRegions": [
        {
          "viloyat": { "name": "Toshkent", "type": "region", "code": "TOS" },
          "tuman": { "name": "Yunusobod", "type": "district", "code": "YUN" }
        }
      ],
      "productCode": "001",
      "status": "active",
      "productType": "tuman",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Eslatma:** Faqat `contragentLevel: 'tuman'` bo'lgan kontragentlar mahsulotlari ko'rsatiladi.

---

### Tuman Mahsulotini ID bo'yicha Olish

```
GET /api/marketplace/products/:id
```

**Authentication:** Not required (Public)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "name": "Mahsulot nomi",
    // ... barcha maydonlar (yuqoridagi kabi)
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `404` - Maxsulot topilmadi yoki hali tasdiqlanmagan
- `400` - Noto'g'ri maxsulot ID

---

## Maxalla Mahsulotlari API

### Barcha Maxalla Mahsulotlarini Olish

```
GET /api/marketplace/maxalla-products
```

**Authentication:** Not required (Public)

**Query Parameters:**
- `category` - Kategoriya ID (optional)
- `subcategory` - Subkategoriya ID (optional)
- `contragent` - Kontragent ID (optional, faqat maxalla kontragentlar)
- `status` - Status filter (optional, default: active)
- `minPrice` - Minimal narx (optional)
- `maxPrice` - Maksimal narx (optional)
- `search` - Qidiruv so'rovi (optional)
- `page` - Sahifa raqami (default: 1)
- `limit` - Har sahifadagi elementlar soni (default: 20)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "data": [
    {
      "_id": "maxalla_product_id",
      "name": "Mahsulot nomi",
      "description": "Tavsif",
      "images": ["image1.jpg", "image2.jpg"],
      "price": 45000,
      "originalPrice": 50000,
      "quantity": 50,
      "unit": "dona",
      "unitSize": 1,
      "category": {
        "_id": "category_id",
        "name": "Kategoriya",
        "slug": "kategoriya",
        "status": "active"
      },
      "subcategory": {
        "_id": "subcategory_id",
        "name": "Subkategoriya",
        "slug": "subkategoriya",
        "status": "active"
      },
      "contragent": {
        "_id": "contragent_id",
        "name": "Maxalla Dokoni",
        "phone": "+998901234567",
        "viloyat": { "name": "Toshkent", "type": "region", "code": "TOS" },
        "tuman": { "name": "Yunusobod", "type": "district", "code": "YUN" },
        "mfy": { "name": "MFY 1", "type": "mfy", "code": "MFY1" },
        "status": "active"
      },
      "status": "active",
      "productType": "maxalla",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Eslatma:** Faqat `contragentLevel: 'mfy'` bo'lgan kontragentlar mahsulotlari ko'rsatiladi.

---

### Maxalla Mahsulotini ID bo'yicha Olish

```
GET /api/marketplace/maxalla-products/:id
```

**Authentication:** Not required (Public)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "maxalla_product_id",
    "name": "Mahsulot nomi",
    // ... barcha maydonlar (yuqoridagi kabi)
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `404` - Maxalla maxsuloti topilmadi
- `400` - Noto'g'ri maxalla maxsulot ID

---

### Maxalla Mahsulot uchun Dokonlarni Olish

```
GET /api/marketplace/maxalla-products/:productId/stores
```

**Authentication:** Optional (optionalMarketplaceUserAuth)

**Description:** Maxalla mahsulot uchun o'z MFYsidagi dokonlarni (maxalla kontragentlar) ko'rsatadi. Har bir dokon uchun working hours tekshiriladi va ochiq/yopiq holati ko'rsatiladi.

**Path Parameters:**
- `productId` (required) - Maxalla mahsulot ID

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "contragent": {
        "_id": "contragent_id",
        "name": "Maxalla Dokoni",
        "phone": "+998901234567",
        "logo": "base64_logo_string",
        "viloyat": { "name": "Toshkent", "type": "region", "code": "TOS" },
        "tuman": { "name": "Yunusobod", "type": "district", "code": "YUN" },
        "mfy": { "name": "MFY 1", "type": "mfy", "code": "MFY1" },
        "activityType": { "name": "Oziq-ovqat", "icon": "icon_url" },
        "workingHours": {
          "open": "09:00",
          "close": "18:00"
        },
        "isOpen": true,
        "status": "active"
      },
      "product": {
        "_id": "maxalla_product_id",
        "name": "Mahsulot nomi",
        "price": 45000,
        "originalPrice": 50000,
        "quantity": 50,
        "productType": "maxalla",
        // ... boshqa maydonlar
      }
    }
  ]
}
```

**Response Fields:**
- `contragent.isOpen` - Dokon ochiqmi?
  - `true` - Dokon ochiq (hozirgi vaqtda ish vaqtida)
  - `false` - Dokon yopiq (hozirgi vaqtda ish vaqti tashqarida)
  - `null` - Working hours o'rnatilmagan

**Status Codes:**
- `200` - Muvaffaqiyatli
- `404` - Maxalla maxsuloti topilmadi
- `400` - Maxalla maxsuloti hozir mavjud emas

**Eslatmalar:**
- Dokonlar tartibi: ochiq dokonlar birinchi, keyin yopiq dokonlar, keyin working hours o'rnatilmagan dokonlar
- Har bir guruh ichida alfavit tartibida
- Faqat o'z MFYsidagi dokonlar ko'rsatiladi (agar foydalanuvchi autentifikatsiya qilingan bo'lsa)
- Faqat `status: 'active'` bo'lgan dokonlar va maxalla mahsulotlar ko'rsatiladi

**Batafsil ma'lumot:** [Marketplace Maxalla Stores API](./MARKETPLACE_MAXALLA_STORES_API.md)

---

## Maxalla Dokonlarini Tanlash

Maxalla mahsulotini tanlaganda, foydalanuvchi o'z MFYsidagi ushbu maxsulotni sotadigan dokonlardan birini tanlashi kerak.

### Maxalla Mahsulot uchun Dokonlarni Olish

```
GET /api/marketplace/maxalla-products/:productId/stores
```

**Authentication:** Optional (optionalMarketplaceUserAuth)

**Description:** Maxalla mahsulot uchun o'z MFYsidagi dokonlarni (maxalla kontragentlar) ko'rsatadi. Har bir dokon uchun working hours tekshiriladi va ochiq/yopiq holati ko'rsatiladi.

**Path Parameters:**
- `productId` (required) - Maxalla mahsulot ID

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "contragent": {
        "_id": "contragent_id",
        "name": "Maxalla Dokoni",
        "phone": "+998901234567",
        "logo": "base64_logo_string",
        "viloyat": { "name": "Toshkent", "type": "region", "code": "TOS" },
        "tuman": { "name": "Yunusobod", "type": "district", "code": "YUN" },
        "mfy": { "name": "MFY 1", "type": "mfy", "code": "MFY1" },
        "activityType": { "name": "Oziq-ovqat", "icon": "icon_url" },
        "workingHours": {
          "open": "09:00",
          "close": "18:00"
        },
        "isOpen": true,
        "status": "active"
      },
      "product": {
        "_id": "maxalla_product_id",
        "name": "Mahsulot nomi",
        "price": 45000,
        "originalPrice": 50000,
        "quantity": 50,
        "productType": "maxalla"
      }
    }
  ]
}
```

**Eslatmalar:**
- Dokonlar tartibi: ochiq dokonlar birinchi, keyin yopiq dokonlar, keyin working hours o'rnatilmagan dokonlar
- Har bir guruh ichida alfavit tartibida
- Faqat o'z MFYsidagi dokonlar ko'rsatiladi
- `isOpen` maydoni hozirgi vaqt asosida hisoblanadi

**Batafsil ma'lumot:** [Marketplace Maxalla Stores API](./MARKETPLACE_MAXALLA_STORES_API.md)

---

## Savat API (Alohida Korzinkalar)

Marketplace ikki xil alohida korzinkani qo'llab-quvvatlaydi:
- **Tuman Korzinkasi** - faqat tuman mahsulotlari uchun
- **Maxalla Korzinkasi** - faqat maxalla mahsulotlari uchun

Har bir korzinka alohida saqlanadi va boshqariladi.

### Tuman Korzinkasini Olish

```
GET /api/marketplace/cart
```

**Authentication:** Required (marketplaceUserAuth)

**Description:** Faqat tuman mahsulotlarini ko'rsatadi.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "cart_id",
    "items": [
      {
        "product": {
          "_id": "product_id",
          "name": "Mahsulot nomi",
          "price": 50000,
          "originalPrice": 60000,
          "quantity": 100,
          "productType": "tuman",
          // ... boshqa maydonlar
        },
        "quantity": 2,
        "productType": "tuman"
      }
    ],
    "totalItems": 2,
    "totalPrice": 100000,
    "totalOriginalPrice": 120000,
    "totalDiscount": 20000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Maxalla Korzinkasini Olish

```
GET /api/marketplace/maxalla-cart
```

**Authentication:** Required (marketplaceUserAuth)

**Description:** Faqat maxalla mahsulotlarini ko'rsatadi.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "maxalla_cart_id",
    "items": [
      {
        "product": {
          "_id": "maxalla_product_id",
          "name": "Maxalla mahsuloti",
          "price": 45000,
          "originalPrice": 50000,
          "quantity": 50,
          "productType": "maxalla",
          // ... boshqa maydonlar
        },
        "quantity": 1,
        "productType": "maxalla"
      }
    ],
    "totalItems": 1,
    "totalPrice": 45000,
    "totalOriginalPrice": 50000,
    "totalDiscount": 5000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Tuman Korzinkasiga Qo'shish

```
POST /api/marketplace/cart
```

**Authentication:** Required (marketplaceUserAuth)

**Description:** Faqat tuman mahsulotlarini qo'shadi.

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2
}
```

**Request Body Fields:**
- `productId` (required) - Tuman mahsulot ID
- `quantity` (optional, default: 1) - Miqdor

**Response:**
```json
{
  "success": true,
  "message": "Maxsulot korzinkaga qo'shildi",
  "data": {
    "_id": "cart_id",
    "items": [/* savat elementlari */],
    "totalItems": 2,
    "totalPrice": 100000,
    "totalOriginalPrice": 120000,
    "totalDiscount": 20000
  }
}
```

---

### Maxalla Korzinkasiga Qo'shish

```
POST /api/marketplace/maxalla-cart
```

**Authentication:** Required (marketplaceUserAuth)

**Description:** Faqat maxalla mahsulotlarini qo'shadi.

**Request Body:**
```json
{
  "productId": "maxalla_product_id",
  "quantity": 1
}
```

**Request Body Fields:**
- `productId` (required) - Maxalla mahsulot ID
- `quantity` (optional, default: 1) - Miqdor

**Response:**
```json
{
  "success": true,
  "message": "Maxalla maxsuloti korzinkaga qo'shildi",
  "data": {
    "_id": "maxalla_cart_id",
    "items": [/* savat elementlari */],
    "totalItems": 1,
    "totalPrice": 45000,
    "totalOriginalPrice": 50000,
    "totalDiscount": 5000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Maxsulot korzinkaga qo'shildi",
  "data": {
    "_id": "cart_id",
    "items": [/* savat elementlari */],
    "totalItems": 3,
    "totalPrice": 145000,
    "totalOriginalPrice": 170000,
    "totalDiscount": 25000
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Noto'g'ri so'rov (productId yo'q, miqdor yetarli emas)
- `404` - Maxsulot topilmadi

---

### Tuman Korzinka Elementini Yangilash

```
PUT /api/marketplace/cart/:productId
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:**
```json
{
  "quantity": 3
}
```

**Request Body Fields:**
- `quantity` (required) - Yangi miqdor

---

### Maxalla Korzinka Elementini Yangilash

```
PUT /api/marketplace/maxalla-cart/:productId
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:**
```json
{
  "quantity": 2
}
```

**Request Body Fields:**
- `quantity` (required) - Yangi miqdor

**Response:**
```json
{
  "success": true,
  "message": "Korzinka yangilandi",
  "data": {
    "_id": "cart_id",
    "items": [/* yangilangan savat elementlari */],
    "totalItems": 4,
    "totalPrice": 195000,
    "totalOriginalPrice": 230000,
    "totalDiscount": 35000
  }
}
```

---

### Tuman Korzinkadan Olib Tashlash

```
DELETE /api/marketplace/cart/:productId
```

**Authentication:** Required (marketplaceUserAuth)

---

### Maxalla Korzinkadan Olib Tashlash

```
DELETE /api/marketplace/maxalla-cart/:productId
```

**Authentication:** Required (marketplaceUserAuth)

**Response:**
```json
{
  "success": true,
  "message": "Maxsulot korzinkadan olib tashlandi",
  "data": {
    "_id": "cart_id",
    "items": [/* qolgan savat elementlari */],
    "totalItems": 2,
    "totalPrice": 95000,
    "totalOriginalPrice": 110000,
    "totalDiscount": 15000
  }
}
```

---

### Tuman Korzinkani Tozalash

```
DELETE /api/marketplace/cart
```

**Authentication:** Required (marketplaceUserAuth)

---

### Maxalla Korzinkani Tozalash

```
DELETE /api/marketplace/maxalla-cart
```

**Authentication:** Required (marketplaceUserAuth)

**Response:**
```json
{
  "success": true,
  "message": "Korzinka tozalandi",
  "data": {
    "_id": "cart_id",
    "items": [],
    "totalItems": 0,
    "totalPrice": 0,
    "totalOriginalPrice": 0,
    "totalDiscount": 0
  }
}
```

---

## Buyurtma API (Alohida Buyurtmalar)

Marketplace ikki xil alohida buyurtma API'sini qo'llab-quvvatlaydi:
- **Tuman Buyurtmalari** - tuman korzinkasidan yaratiladi
- **Maxalla Buyurtmalari** - maxalla korzinkasidan yaratiladi

Har bir buyurtma alohida yaratiladi va boshqariladi.

### Tuman Buyurtmasini Yaratish

```
POST /api/marketplace/orders
```

**Authentication:** Required (marketplaceUserAuth)

**Description:** Tuman korzinkasidan buyurtma yaratadi. Faqat tuman mahsulotlarini qabul qiladi.

**Request Body:**
```json
{
  "paymentMethod": "cash",
  "deliveryViloyat": "viloyat_id",
  "deliveryTuman": "tuman_id",
  "deliveryMfy": "mfy_id",
  "deliveryNote": "Eslatma",
  "phoneNumber": "+998901234567",
  "clearCart": true
}
```

**Request Body Fields:**
- `paymentMethod` (required) - To'lov usuli: `'cash'` yoki `'card'`
- `deliveryViloyat` (required) - Yetkazib berish viloyati ID
- `deliveryTuman` (optional) - Yetkazib berish tumani ID
- `deliveryMfy` (optional) - Yetkazib berish MFY ID
- `deliveryNote` (optional) - Yetkazib berish eslatmasi
- `phoneNumber` (optional) - Telefon raqami (default: user phone)
- `clearCart` (optional, default: true) - Tuman korzinkasini tozalash

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli yaratildi",
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-2024-001",
    "items": [
      {
        "product": {
          "_id": "product_id",
          "name": "Mahsulot nomi",
          "productType": "tuman",
          // ... boshqa maydonlar
        },
        "quantity": 2,
        "price": 50000,
        "originalPrice": 60000,
        "kpiBonusPercent": 5,
        "productType": "tuman",
        "productModel": "Product"
      }
    ],
    "totalPrice": 100000,
    "totalOriginalPrice": 120000,
    "totalKpiPrice": 5000,
    "itemCount": 2,
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "cash",
    "deliveryViloyat": { "name": "Toshkent", "type": "region", "code": "TOS" },
    "deliveryTuman": { "name": "Yunusobod", "type": "district", "code": "YUN" },
    "deliveryMfy": { "name": "MFY 1", "type": "mfy", "code": "MFY1" },
    "deliveryNote": "Eslatma",
    "phoneNumber": "+998901234567",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Eslatma:** 
- Tuman korzinkasidan faqat tuman mahsulotlari buyurtma qilinadi
- Tuman mahsulotlari uchun `kpiBonusPercent` mavjud

---

### Maxalla Buyurtmasini Yaratish

```
POST /api/marketplace/maxalla-orders
```

**Authentication:** Required (marketplaceUserAuth)

**Description:** Maxalla korzinkasidan buyurtma yaratadi. Faqat maxalla mahsulotlarini qabul qiladi. **Maxalla buyurtmasi to'g'ridan-to'g'ri maxalla kontragentga yuboriladi** (punkt orqali o'tmaydi).

**Request Body:**
```json
{
  "paymentMethod": "cash",
  "deliveryViloyat": "viloyat_id",
  "deliveryTuman": "tuman_id",
  "deliveryMfy": "mfy_id",
  "deliveryNote": "Eslatma",
  "phoneNumber": "+998901234567",
  "clearCart": true
}
```

**Request Body Fields:**
- `paymentMethod` (required) - To'lov usuli: `'cash'` yoki `'card'`
- `deliveryViloyat` (required) - Yetkazib berish viloyati ID
- `deliveryTuman` (optional) - Yetkazib berish tumani ID
- `deliveryMfy` (optional) - Yetkazib berish MFY ID
- `deliveryNote` (optional) - Yetkazib berish eslatmasi
- `phoneNumber` (optional) - Telefon raqami (default: user phone)
- `clearCart` (optional, default: true) - Maxalla korzinkasini tozalash

**Response:**
```json
{
  "success": true,
  "message": "Maxalla buyurtmasi muvaffaqiyatli yaratildi",
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-2024-002",
    "items": [
      {
        "product": {
          "_id": "maxalla_product_id",
          "name": "Maxalla mahsuloti",
          "productType": "maxalla",
          "contragent": {
            "_id": "contragent_id",
            "name": "Maxalla Dokoni",
            "contragentLevel": "mfy"
          },
          // ... boshqa maydonlar
        },
        "quantity": 1,
        "price": 45000,
        "originalPrice": 50000,
        "kpiBonusPercent": null,
        "productType": "maxalla",
        "productModel": "MaxallaProduct"
      }
    ],
    "totalPrice": 45000,
    "totalOriginalPrice": 50000,
    "totalKpiPrice": 0,
    "itemCount": 1,
    "status": "requested_to_contragent",
    "paymentStatus": "pending",
    "paymentMethod": "cash",
    "deliveryViloyat": { "name": "Toshkent", "type": "region", "code": "TOS" },
    "deliveryTuman": { "name": "Yunusobod", "type": "district", "code": "YUN" },
    "deliveryMfy": { "name": "MFY 1", "type": "mfy", "code": "MFY1" },
    "deliveryNote": "Eslatma",
    "phoneNumber": "+998901234567",
    "currentPunkt": null,
    "contragentRequests": [
      {
        "contragentId": "contragent_id",
        "itemIds": [0],
        "status": "pending",
        "requestedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Eslatmalar:** 
- Maxalla korzinkasidan faqat maxalla mahsulotlari buyurtma qilinadi
- Maxalla mahsulotlari uchun `kpiBonusPercent` null (KPI yo'q)
- **Maxalla buyurtmasi to'g'ridan-to'g'ri maxalla kontragentga yuboriladi** (punkt orqali o'tmaydi)
- Status avtomatik `'requested_to_contragent'` bo'ladi
- `contragentRequests` ga avtomatik qo'shiladi
- `currentPunkt` null bo'ladi (punkt orqali o'tmaydi)
- Buyurtma ma'lumotlari tuman buyurtmalari bilan bir xil strukturada

---

### Buyurtmalarni Olish

```
GET /api/marketplace/orders
```

**Yoki maxalla buyurtmalari uchun:**
```
GET /api/marketplace/maxalla-orders
```

**Authentication:** Required (marketplaceUserAuth)

**Description:** Barcha buyurtmalarni ko'rsatadi (tuman va maxalla buyurtmalari birga).

**Query Parameters:**
- `status` - Buyurtma holati (optional)
- `paymentStatus` - To'lov holati (optional)
- `page` - Sahifa raqami (default: 1)
- `limit` - Har sahifadagi elementlar soni (default: 20)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "data": [
    {
      "_id": "order_id",
      "orderNumber": "ORD-2024-001",
      "items": [/* buyurtma elementlari */],
      "totalPrice": 145000,
      "status": "pending",
      "currentPunkt": "punkt_id", // Tuman buyurtmalari uchun
      "contragentRequests": [], // Tuman buyurtmalari uchun
      // ... boshqa maydonlar
    },
    {
      "_id": "maxalla_order_id",
      "orderNumber": "ORD-2024-002",
      "items": [/* maxalla buyurtma elementlari */],
      "totalPrice": 45000,
      "status": "requested_to_contragent",
      "currentPunkt": null, // Maxalla buyurtmalari uchun null
      "contragentRequests": [
        {
          "contragentId": "contragent_id",
          "itemIds": [0],
          "status": "pending",
          "requestedAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      // ... boshqa maydonlar
    }
  ]
}
```

---

### Buyurtmani ID bo'yicha Olish

```
GET /api/marketplace/orders/:id
```

**Yoki maxalla buyurtmasi uchun:**
```
GET /api/marketplace/maxalla-orders/:id
```

**Authentication:** Required (marketplaceUserAuth)

**Description:** Buyurtmani ID bo'yicha ko'rsatadi (tuman va maxalla buyurtmalari uchun ishlaydi).

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-2024-001",
    "items": [/* buyurtma elementlari */],
    "status": "pending", // yoki "requested_to_contragent" maxalla buyurtmalari uchun
    "currentPunkt": "punkt_id", // Tuman buyurtmalari uchun, maxalla uchun null
    "contragentRequests": [/* contragent so'rovlari */],
    // ... boshqa maydonlar
  }
}
```

---

### Buyurtmani Bekor Qilish

```
DELETE /api/marketplace/orders/:id
```

**Yoki maxalla buyurtmasi uchun:**
```
DELETE /api/marketplace/maxalla-orders/:id
```

**Authentication:** Required (marketplaceUserAuth)

**Eslatma:** Faqat `status: 'pending'` yoki `status: 'requested_to_contragent'` bo'lgan buyurtmalarni bekor qilish mumkin. Bekor qilinganda mahsulotlar inventariga qaytariladi.

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma bekor qilindi",
  "data": {
    "_id": "order_id",
    "status": "cancelled",
    // ... boshqa maydonlar
  }
}
```

---

### Yetkazib Berishni Tasdiqlash

```
POST /api/marketplace/orders/:id/confirm-delivery
```

**Yoki maxalla buyurtmasi uchun:**
```
POST /api/marketplace/maxalla-orders/:id/confirm-delivery
```

**Authentication:** Required (marketplaceUserAuth)

**Description:** Mijoz buyurtmani olganini tasdiqlaydi. Ikkala turdagi buyurtmalar uchun ishlaydi.

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "_id": "order_id",
    "status": "confirmed_by_customer",
    "customerConfirmed": true,
    "customerConfirmedAt": "2024-01-01T00:00:00.000Z",
    // ... boshqa maydonlar
  }
}
```

---

## Tuman vs Maxalla Buyurtmalari

### Tuman Buyurtmalari

**Jarayon:**
1. Foydalanuvchi tuman mahsulotlarini tanlaydi
2. Tuman korzinkasiga qo'shadi
3. Buyurtma yaratadi (`POST /api/marketplace/orders`)
4. Buyurtma punktga yuboriladi
5. Punkt buyurtmani tasdiqlaydi
6. Punkt kontragentga so'rov yuboradi
7. Kontragent javob beradi
8. Agentga yuboriladi
9. Mijozga yetkaziladi

**Status Oqimi:**
```
pending → confirmed_by_punkt → requested_to_contragent → 
accepted_by_contragent → delivered_to_punkt → 
assigned_to_agent → confirmed_by_agent → confirmed_by_customer
```

**Xususiyatlar:**
- Punkt orqali yuboriladi
- `currentPunkt` maydoni mavjud
- `contragentRequests` punkt tomonidan yaratiladi
- KPI bonus mavjud

---

### Maxalla Buyurtmalari

**Jarayon:**
1. Foydalanuvchi maxalla mahsulotini tanlaydi
2. O'z MFYsidagi maxalla kontragentni tanlaydi
3. Maxalla korzinkasiga qo'shadi
4. Buyurtma yaratadi (`POST /api/marketplace/maxalla-orders`)
5. **Buyurtma to'g'ridan-to'g'ri maxalla kontragentga yuboriladi** (punkt orqali o'tmaydi)
6. Kontragent javob beradi
7. Mijozga yetkaziladi

**Status Oqimi:**
```
requested_to_contragent → accepted_by_contragent → 
delivered_to_punkt → assigned_to_agent → 
confirmed_by_agent → confirmed_by_customer
```

**Xususiyatlar:**
- **To'g'ridan-to'g'ri maxalla kontragentga yuboriladi**
- Punkt orqali o'tmaydi
- `currentPunkt` null
- `contragentRequests` avtomatik yaratiladi (buyurtma yaratilganda)
- KPI bonus yo'q

---

## Ma'lumotlar Strukturasi

### Tuman Mahsulot Ob'ekti

```typescript
interface TumanProduct {
  _id: string;
  name: string;
  description: string | null;
  images: string[];
  price: number;
  originalPrice: number;
  quantity: number;
  unit: 'dona' | 'litr' | 'kg';
  unitSize: number | null;
  category: Category;
  subcategory: Category | null;
  contragent: Contragent;
  deliveryRegions: DeliveryRegion[];
  productCode: string;
  status: 'active' | 'inactive' | 'archived';
  moderationStatus: 'pending' | 'approved' | 'rejected';
  productType: 'tuman';
  createdAt: Date;
  updatedAt: Date;
}
```

### Maxalla Mahsulot Ob'ekti

```typescript
interface MaxallaProduct {
  _id: string;
  name: string; // BaseProduct'dan
  description: string | null; // BaseProduct'dan
  images: string[]; // BaseProduct'dan
  price: number; // MaxallaProduct'dan
  originalPrice: number; // MaxallaProduct'dan
  quantity: number; // MaxallaProduct'dan
  unit: 'dona' | 'litr' | 'kg'; // BaseProduct'dan
  unitSize: number | null; // BaseProduct'dan
  category: Category; // BaseProduct'dan
  subcategory: Category | null; // BaseProduct'dan
  contragent: Contragent; // MaxallaProduct'dan
  status: 'active' | 'inactive';
  productType: 'maxalla';
  createdAt: Date;
  updatedAt: Date;
}
```

### Savat Elementi Ob'ekti

```typescript
interface CartItem {
  product: TumanProduct | MaxallaProduct;
  quantity: number;
  productType: 'tuman' | 'maxalla';
}
```

### Buyurtma Elementi Ob'ekti

```typescript
interface OrderItem {
  product: TumanProduct | MaxallaProduct;
  quantity: number;
  price: number;
  originalPrice: number;
  kpiBonusPercent: number | null; // Faqat tuman mahsulotlari uchun
  productType: 'tuman' | 'maxalla';
  productModel: 'Product' | 'MaxallaProduct';
}
```

---

## Xato Kodlari

| Xato | Status Code | Tavsif |
|------|-------------|--------|
| `Maxsulot topilmadi` | 404 | Mahsulot topilmadi |
| `Bu kontragent tuman kontragenti emas` | 400 | Tuman mahsulotlari API'da maxalla kontragent ID kiritilgan |
| `Bu kontragent maxalla kontragenti emas` | 400 | Maxalla mahsulotlari API'da tuman kontragent ID kiritilgan |
| `Mavjud miqdor: X. Siz Y ta so'rayapsiz` | 400 | Yetarli miqdor yo'q |
| `Noto'g'ri maxsulot ID` | 400 | Noto'g'ri ID formati |
| `Korzinka bo'sh` | 400 | Savat bo'sh |
| `Faqat "pending" holatdagi buyurtmalarni bekor qilish mumkin` | 400 | Bekor qilish mumkin bo'lmagan holat |
| `Maxalla korzinka bo'sh` | 400 | Maxalla korzinkada maxalla maxsulotlari yo'q |
| `Maxalla maxsuloti topilmadi` | 404 | Maxalla maxsuloti topilmadi |

---

## Misollar

### JavaScript/TypeScript Misollari

```javascript
// Tuman mahsulotlarini olish
const getTumanProducts = async () => {
  const response = await fetch('https://api.example.com/api/marketplace/products?page=1&limit=20');
  return await response.json();
};

// Maxalla mahsulotlarini olish
const getMaxallaProducts = async () => {
  const response = await fetch('https://api.example.com/api/marketplace/maxalla-products?page=1&limit=20');
  return await response.json();
};

// Tuman mahsulotini tuman korzinkasiga qo'shish
const addTumanProductToCart = async (token, productId, quantity) => {
  const response = await fetch('https://api.example.com/api/marketplace/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productId,
      quantity
    })
  });
  return await response.json();
};

// Maxalla mahsulotini maxalla korzinkasiga qo'shish
const addMaxallaProductToCart = async (token, productId, quantity) => {
  const response = await fetch('https://api.example.com/api/marketplace/maxalla-cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productId,
      quantity
    })
  });
  return await response.json();
};

// Tuman buyurtmasini yaratish
const createTumanOrder = async (token, orderData) => {
  const response = await fetch('https://api.example.com/api/marketplace/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      paymentMethod: 'cash',
      deliveryViloyat: orderData.viloyatId,
      deliveryTuman: orderData.tumanId,
      deliveryMfy: orderData.mfyId,
      clearCart: true
    })
  });
  return await response.json();
};

// Maxalla buyurtmasini yaratish
const createMaxallaOrder = async (token, orderData) => {
  const response = await fetch('https://api.example.com/api/marketplace/maxalla-orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      paymentMethod: 'cash',
      deliveryViloyat: orderData.viloyatId,
      deliveryTuman: orderData.tumanId,
      deliveryMfy: orderData.mfyId,
      clearCart: true
    })
  });
  return await response.json();
};

// Maxalla buyurtmalarini olish
const getMaxallaOrders = async (token, filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.paymentStatus) queryParams.append('paymentStatus', filters.paymentStatus);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.limit) queryParams.append('limit', filters.limit);

  const response = await fetch(
    `https://api.example.com/api/marketplace/maxalla-orders?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};

// Maxalla buyurtmasini ID bo'yicha olish
const getMaxallaOrderById = async (token, orderId) => {
  const response = await fetch(
    `https://api.example.com/api/marketplace/maxalla-orders/${orderId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};

// Maxalla buyurtmasini bekor qilish
const cancelMaxallaOrder = async (token, orderId) => {
  const response = await fetch(
    `https://api.example.com/api/marketplace/maxalla-orders/${orderId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};

// Maxalla buyurtmasini tasdiqlash
const confirmMaxallaDelivery = async (token, orderId) => {
  const response = await fetch(
    `https://api.example.com/api/marketplace/maxalla-orders/${orderId}/confirm-delivery`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};
```

---

## Eslatmalar

1. **Mahsulot Turlarini Ajratish:**
   - Tuman mahsulotlari: `/api/marketplace/products`
   - Maxalla mahsulotlari: `/api/marketplace/maxalla-products`

2. **Korzinkalar (Alohida):**
   - **Tuman Korzinkasi:** `/api/marketplace/cart` - faqat tuman mahsulotlari
   - **Maxalla Korzinkasi:** `/api/marketplace/maxalla-cart` - faqat maxalla mahsulotlari
   - Har bir korzinka alohida saqlanadi va boshqariladi
   - Bir foydalanuvchi ikkita alohida korzinkaga ega bo'lishi mumkin

3. **Buyurtmalar (Alohida):**
   - **Tuman Buyurtmalari:** 
     - Yaratish: `POST /api/marketplace/orders`
     - Ko'rish: `GET /api/marketplace/orders` yoki `GET /api/marketplace/maxalla-orders` (ikkalasi ham ishlaydi)
     - Tuman korzinkasidan yaratiladi
     - Punkt orqali yuboriladi
   - **Maxalla Buyurtmalari:**
     - Yaratish: `POST /api/marketplace/maxalla-orders`
     - Ko'rish: `GET /api/marketplace/maxalla-orders` yoki `GET /api/marketplace/orders` (ikkalasi ham ishlaydi)
     - Maxalla korzinkasidan yaratiladi
     - **To'g'ridan-to'g'ri maxalla kontragentga yuboriladi** (punkt orqali o'tmaydi)
   - Har bir buyurtma alohida yaratiladi
   - Buyurtma ma'lumotlari bir xil strukturada (Order model)
   - `getOrders` va `getOrderById` funksiyalari ikkala turdagi buyurtmalarni qo'llab-quvvatlaydi

4. **KPI Bonus:**
   - Faqat tuman mahsulotlari uchun `kpiBonusPercent` mavjud
   - Maxalla mahsulotlari uchun `kpiBonusPercent` null (KPI yo'q)

5. **Moderation:**
   - Tuman mahsulotlari uchun moderation status tekshiriladi (faqat approved)
   - Maxalla mahsulotlari uchun moderation status tekshirilmaydi

6. **Delivery Regions:**
   - Tuman mahsulotlari uchun `deliveryRegions` maydoni mavjud
   - Maxalla mahsulotlari uchun `deliveryRegions` maydoni yo'q (faqat o'z MFYsi)

7. **Maxalla Buyurtma Jarayoni:**
   - Foydalanuvchi maxalla mahsulotini tanlaydi
   - **O'z MFYsidagi ushbu maxsulotni sotadigan dokonlarni ko'radi** (`GET /api/marketplace/maxalla-products/:productId/stores`)
   - Har bir dokon uchun working hours tekshiriladi va ochiq/yopiq holati ko'rsatiladi
   - Foydalanuvchi dokonni tanlaydi
   - Tanlangan dokonning maxalla mahsulotini maxalla korzinkasiga qo'shadi
   - Maxalla buyurtmasini yaratadi
   - **Maxalla buyurtmasi to'g'ridan-to'g'ri tanlangan maxalla kontragentga yuboriladi** (punkt orqali o'tmaydi)
   - Status avtomatik `'requested_to_contragent'` bo'ladi
   - `contragentRequests` ga avtomatik qo'shiladi
   - Buyurtma ma'lumotlari tuman buyurtmalari bilan bir xil strukturada

8. **Tuman vs Maxalla Buyurtmalari:**
   - **Tuman Buyurtmalari:**
     - Punkt orqali yuboriladi
     - Status: `'pending'` → `'confirmed_by_punkt'` → `'requested_to_contragent'` → ...
     - `currentPunkt` maydoni mavjud
   - **Maxalla Buyurtmalari:**
     - To'g'ridan-to'g'ri maxalla kontragentga yuboriladi
     - Status: `'requested_to_contragent'` (to'g'ridan-to'g'ri)
     - `currentPunkt` null
     - `contragentRequests` ga avtomatik qo'shiladi

---

## Bog'liq Dokumentatsiyalar

- [Marketplace Authentication API](./MARKETPLACE_AUTH_API.md)
- [Marketplace Categories API](./MARKETPLACE_CATEGORIES_API.md)
- [Marketplace Contragents API](./MARKETPLACE_CONTRAGENTS_API.md)
- [Marketplace Maxalla Stores API](./MARKETPLACE_MAXALLA_STORES_API.md)
- [Tuman Contragent API](./CONTRAGENT_API.md)
- [Maxalla Contragent API](./MAXALLA_CONTRAGENT_API.md)
