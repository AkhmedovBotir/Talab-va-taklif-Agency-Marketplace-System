# Yetkazib Beruvchi API Dokumentatsiyasi

Bu dokumentatsiya Yetkazib Beruvchilar (Delivery Providers) uchun autentifikatsiya, profil boshqaruvi va buyurtma boshqaruvi API spetsifikatsiyasini o'z ichiga oladi.

**Base Path:** `/api/delivery-providers`

**Eslatma:** Bu API faqat yetkazib beruvchilar uchun ishlaydi. Yetkazib beruvchilar maxalla kontragentlar tomonidan yaratiladi va ularga buyurtmalar yuboriladi.

---

## Munda

1. [Kirish](#kirish)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Profil Boshqaruvi](#profil-boshqaruvi)
4. [Parolni O'zgartirish](#parolni-ozgartirish)
5. [Buyurtmalarni Ko'rish](#buyurtmalarni-korish)
6. [Buyurtmani Yetkazib Berildi Deb Belgilash](#buyurtmani-yetkazib-berildi-deb-belgilash)
7. [Ma'lumotlar Strukturasi](#malumotlar-strukturasi)
8. [Xato Kodlari](#xato-kodlari)
9. [Misollar](#misollar)
10. [Jarayon](#jarayon)

---

## Kirish

Yetkazib Beruvchi API - bu maxalla kontragentlar tomonidan yaratilgan yetkazib beruvchilar uchun alohida autentifikatsiya va buyurtma boshqaruvi funksiyalarini ta'minlaydi.

**Yetkazib Beruvchi nima?**
- Maxalla kontragentlar tomonidan yaratilgan shaxslar
- Maxalla kontragentlar tomonidan yuborilgan buyurtmalarni yetkazib beradi
- Faqat o'z kontragentiga tegishli buyurtmalarni ko'radi va boshqaradi

**Asosiy Funksiyalar:**
- Login (telefon va parol bilan)
- Profil ko'rish va yangilash
- Parolni o'zgartirish
- O'ziga yuborilgan buyurtmalarni ko'rish
- Buyurtmani yetkazib berildi deb belgilash

---

## Autentifikatsiya

### Login

```
POST /api/delivery-providers/login
```

**Authentication:** Not required (Public)

**Description:** Yetkazib beruvchi telefon raqami va parol bilan login qiladi.

**Request Body:**
```json
{
  "phone": "+998901234567",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "jwt_token_here",
    "deliveryProvider": {
      "_id": "delivery_provider_id",
      "name": "Yetkazib Beruvchi Ismi",
      "phone": "+998901234567",
      "contragent": {
        "_id": "contragent_id",
        "name": "Maxalla Dokoni",
        "phone": "+998901234568",
        "viloyat": { "name": "Toshkent", "type": "region", "code": "TOS" },
        "tuman": { "name": "Yunusobod", "type": "district", "code": "YUN" },
        "mfy": { "name": "MFY 1", "type": "mfy", "code": "MFY1" },
        "contragentLevel": "mfy"
      },
      "status": "active",
      "notes": "Eslatmalar"
    }
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Parol o'rnatilmagan
- `401` - Telefon raqami yoki parol noto'g'ri
- `403` - Hisob faol emas
- `500` - Server xatosi

**Eslatmalar:**
- Token 30 kun muddatga amal qiladi
- Token `Authorization: Bearer <token>` header orqali boshqa requestlarda ishlatiladi
- Faqat `status: 'active'` va `isDeleted: false` bo'lgan yetkazib beruvchilar login qilishi mumkin

---

## Profil Boshqaruvi

### Profilni Ko'rish

```
GET /api/delivery-providers/me
```

**Authentication:** Required (deliveryProviderAuth)

**Description:** Yetkazib beruvchi o'z profil ma'lumotlarini ko'radi.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "delivery_provider_id",
    "name": "Yetkazib Beruvchi Ismi",
    "phone": "+998901234567",
    "contragent": {
      "_id": "contragent_id",
      "name": "Maxalla Dokoni",
      "phone": "+998901234568",
      "viloyat": { "name": "Toshkent", "type": "region", "code": "TOS" },
      "tuman": { "name": "Yunusobod", "type": "district", "code": "YUN" },
      "mfy": { "name": "MFY 1", "type": "mfy", "code": "MFY1" },
      "contragentLevel": "mfy"
    },
    "status": "active",
    "notes": "Eslatmalar",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `401` - Autentifikatsiya xatosi
- `404` - Yetkazib beruvchi topilmadi
- `500` - Server xatosi

---

### Profilni Yangilash

```
PUT /api/delivery-providers/me
```

**Authentication:** Required (deliveryProviderAuth)

**Description:** Yetkazib beruvchi o'z profil ma'lumotlarini yangilaydi.

**Request Body:**
```json
{
  "name": "Yangi Ism",
  "phone": "+998901234569",
  "notes": "Yangi eslatmalar"
}
```

**Request Fields:**
- `name` (optional) - Yetkazib beruvchi nomi
- `phone` (optional) - Telefon raqami (o'z kontragentida unique bo'lishi kerak)
- `notes` (optional) - Eslatmalar

**Response:**
```json
{
  "success": true,
  "message": "Profil muvaffaqiyatli yangilandi",
  "data": {
    "_id": "delivery_provider_id",
    "name": "Yangi Ism",
    "phone": "+998901234569",
    "contragent": { /* ... */ },
    "status": "active",
    "notes": "Yangi eslatmalar"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Telefon raqami allaqachon ishlatilmoqda
- `401` - Autentifikatsiya xatosi
- `404` - Yetkazib beruvchi topilmadi
- `500` - Server xatosi

**Eslatmalar:**
- Telefon raqami o'z kontragentida unique bo'lishi kerak
- Faqat o'z kontragentiga tegishli telefon raqamlari bilan to'qnashadi

---

## Parolni O'zgartirish

### Parolni O'zgartirish

```
POST /api/delivery-providers/change-password
```

**Authentication:** Required (deliveryProviderAuth)

**Description:** Yetkazib beruvchi o'z parolini o'zgartiradi.

**Request Body:**
```json
{
  "currentPassword": "eski_parol",
  "newPassword": "yangi_parol"
}
```

**Request Fields:**
- `currentPassword` (required) - Joriy parol
- `newPassword` (required) - Yangi parol (minimum 6 belgi)

**Response:**
```json
{
  "success": true,
  "message": "Parol muvaffaqiyatli o'zgartirildi"
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Joriy parol yoki yangi parol kiritilmagan, yoki yangi parol joriy paroldan farq qilmaydi
- `401` - Joriy parol noto'g'ri
- `500` - Server xatosi

**Eslatmalar:**
- Yangi parol kamida 6 belgidan iborat bo'lishi kerak
- Yangi parol joriy paroldan farq qilishi kerak

---

## Buyurtmalarni Ko'rish

### O'ziga Yuborilgan Buyurtmalarni Olish

```
GET /api/delivery-providers/orders
```

**Authentication:** Required (deliveryProviderAuth)

**Description:** Yetkazib beruvchiga yuborilgan barcha buyurtmalarni ko'rsatadi.

**Query Parameters:**
- `status` (optional) - Buyurtma holati filtri
  - `requested_to_contragent` - Kontragentga so'rov yuborilgan
  - `accepted_by_contragent` - Kontragent tomonidan qabul qilingan
  - `confirmed_by_customer` - Mijoz tomonidan tasdiqlangan (yetkazib berilgan)
- `page` (optional) - Sahifa raqami (default: 1)
- `limit` (optional) - Har bir sahifadagi elementlar soni (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "order_id",
      "orderNumber": "ORD-2024-001",
      "user": {
        "_id": "user_id",
        "firstName": "Ism",
        "lastName": "Familiya",
        "phone": "+998901234567"
      },
      "items": [
        {
          "product": {
            "_id": "maxalla_product_id",
            "name": "Mahsulot nomi",
            "price": 45000,
            "originalPrice": 50000,
            "quantity": 48,
            "productType": "maxalla"
          },
          "quantity": 2,
          "price": 45000,
          "originalPrice": 50000,
          "productType": "maxalla"
        }
      ],
      "totalPrice": 90000,
      "status": "accepted_by_contragent",
      "deliveryViloyat": {
        "_id": "viloyat_id",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TOS"
      },
      "deliveryTuman": {
        "_id": "tuman_id",
        "name": "Yunusobod",
        "type": "district",
        "code": "YUN"
      },
      "deliveryMfy": {
        "_id": "mfy_id",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY1"
      },
      "deliveryNote": "Yetkazib berish eslatmasi",
      "phoneNumber": "+998901234567",
      "contragentRequests": [
        {
          "contragentId": {
            "_id": "contragent_id",
            "name": "Maxalla Dokoni"
          },
          "itemIds": [0],
          "status": "accepted",
          "deliveryProvider": {
            "_id": "delivery_provider_id",
            "name": "Yetkazib Beruvchi",
            "phone": "+998901234567"
          },
          "sentToDeliveryProviderAt": "2024-01-01T12:00:00.000Z"
        }
      ],
      "customerConfirmed": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `401` - Autentifikatsiya xatosi
- `500` - Server xatosi

**Eslatmalar:**
- Faqat o'ziga yuborilgan buyurtmalar ko'rsatiladi
- Faqat o'ziga tegishli mahsulotlar ko'rsatiladi
- Maxalla mahsulotlar marketplace formatida transformatsiya qilinadi

---

### Buyurtmani ID bo'yicha Olish

```
GET /api/delivery-providers/orders/:id
```

**Authentication:** Required (deliveryProviderAuth)

**Description:** Yetkazib beruvchiga tegishli buyurtma ma'lumotlarini batafsil ko'rsatadi.

**Path Parameters:**
- `id` (required) - Buyurtma ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-2024-001",
    "user": {
      "_id": "user_id",
      "firstName": "Ism",
      "lastName": "Familiya",
      "phone": "+998901234567"
    },
    "items": [
      {
        "product": {
          "_id": "maxalla_product_id",
          "name": "Mahsulot nomi",
          "price": 45000,
          "productType": "maxalla"
        },
        "quantity": 2,
        "price": 45000
      }
    ],
    "totalPrice": 90000,
    "status": "accepted_by_contragent",
    "deliveryViloyat": { /* ... */ },
    "deliveryTuman": { /* ... */ },
    "deliveryMfy": { /* ... */ },
    "deliveryNote": "Yetkazib berish eslatmasi",
    "phoneNumber": "+998901234567",
    "contragentRequests": [
      {
        "deliveryProvider": {
          "_id": "delivery_provider_id",
          "name": "Yetkazib Beruvchi",
          "phone": "+998901234567"
        },
        "sentToDeliveryProviderAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "customerConfirmed": false
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Noto'g'ri buyurtma ID
- `403` - Bu buyurtma sizga yuborilmagan
- `404` - Buyurtma topilmadi
- `401` - Autentifikatsiya xatosi
- `500` - Server xatosi

---

## Buyurtmani Yetkazib Berildi Deb Belgilash

### Buyurtmani Yetkazib Berildi Deb Belgilash

```
POST /api/delivery-providers/orders/:orderId/mark-delivered
```

**Authentication:** Required (deliveryProviderAuth)

**Description:** Yetkazib beruvchi buyurtmani yetkazib berildi deb belgilaydi.

**Path Parameters:**
- `orderId` (required) - Buyurtma ID

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma yetkazib berildi deb belgilandi",
  "data": {
    "orderId": "order_id",
    "orderNumber": "ORD-2024-001",
    "status": "confirmed_by_customer",
    "customerConfirmed": true,
    "customerConfirmedAt": "2024-01-01T15:00:00.000Z",
    "deliveredAt": "2024-01-01T15:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Buyurtma allaqachon yetkazib berilgan
- `403` - Bu buyurtma sizga yuborilmagan
- `404` - Buyurtma topilmadi
- `401` - Autentifikatsiya xatosi
- `500` - Server xatosi

**Eslatmalar:**
- Faqat o'ziga yuborilgan buyurtmalar yetkazib berildi deb belgilanishi mumkin
- Buyurtma allaqachon yetkazib berilgan bo'lsa, xato qaytariladi
- Buyurtma holati `'confirmed_by_customer'` ga o'zgaradi
- `customerConfirmed` va `customerConfirmedAt` maydonlari to'ldiriladi

---

## Ma'lumotlar Strukturasi

### DeliveryProvider Ob'ekti

```typescript
interface DeliveryProvider {
  _id: string;
  name: string;
  phone: string;
  contragent: Contragent;
  status: 'active' | 'inactive';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Order Ob'ekti

```typescript
interface Order {
  _id: string;
  orderNumber: string;
  user: MarketplaceUser;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  deliveryViloyat: Region;
  deliveryTuman: Region | null;
  deliveryMfy: Region | null;
  deliveryNote: string;
  phoneNumber: string;
  contragentRequests: ContragentRequest[];
  customerConfirmed: boolean;
  customerConfirmedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Xato Kodlari

| Xato | Status Code | Tavsif |
|------|-------------|--------|
| `Token topilmadi` | 401 | Authorization header topilmadi |
| `Token noto'g'ri yoki muddati tugagan` | 401 | Token noto'g'ri yoki muddati tugagan |
| `Telefon raqami yoki parol noto'g'ri` | 401 | Login ma'lumotlari noto'g'ri |
| `Parol o'rnatilmagan` | 400 | Parol o'rnatilmagan |
| `Hisobingiz faol emas` | 403 | Yetkazib beruvchi faol emas |
| `Yetkazib beruvchi topilmadi` | 404 | Yetkazib beruvchi topilmadi |
| `Bu telefon raqami allaqachon ishlatilmoqda` | 400 | Telefon raqami allaqachon ishlatilmoqda |
| `Joriy parol noto'g'ri` | 401 | Joriy parol noto'g'ri |
| `Yangi parol joriy paroldan farq qilishi kerak` | 400 | Yangi parol joriy paroldan farq qilishi kerak |
| `Bu buyurtma sizga yuborilmagan` | 403 | Buyurtma yetkazib beruvchiga yuborilmagan |
| `Buyurtma allaqachon yetkazib berilgan` | 400 | Buyurtma allaqachon yetkazib berilgan |

---

## Misollar

### JavaScript/TypeScript Misollari

```javascript
// Login
const loginDeliveryProvider = async (phone, password) => {
  const response = await fetch('https://api.example.com/api/delivery-providers/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, password })
  });
  return await response.json();
};

// Profilni ko'rish
const getMyProfile = async (token) => {
  const response = await fetch('https://api.example.com/api/delivery-providers/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// Profilni yangilash
const updateMyProfile = async (token, profileData) => {
  const response = await fetch('https://api.example.com/api/delivery-providers/me', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  return await response.json();
};

// Parolni o'zgartirish
const changePassword = async (token, currentPassword, newPassword) => {
  const response = await fetch('https://api.example.com/api/delivery-providers/change-password', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return await response.json();
};

// Buyurtmalarni olish
const getMyOrders = async (token, filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.limit) queryParams.append('limit', filters.limit);

  const response = await fetch(
    `https://api.example.com/api/delivery-providers/orders?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};

// Buyurtmani yetkazib berildi deb belgilash
const markOrderAsDelivered = async (token, orderId) => {
  const response = await fetch(
    `https://api.example.com/api/delivery-providers/orders/${orderId}/mark-delivered`,
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

## Jarayon

### Yetkazib Beruvchi Buyurtma Jarayoni

1. **Maxalla Kontragent Buyurtmani Qabul Qiladi:**
   - Maxalla kontragent buyurtma so'roviga javob beradi (`response: 'accepted'`)
   - Buyurtma holati `'accepted_by_contragent'` ga o'zgaradi

2. **Maxalla Kontragent Buyurtmani Yetkazib Beruvchiga Yuboradi:**
   - `POST /api/maxalla-contragents/orders/:orderId/send-to-delivery-provider`
   - Yetkazib beruvchi tanlanadi
   - `deliveryProvider` maydoni to'ldiriladi
   - `sentToDeliveryProviderAt` sana belgilanadi

3. **Yetkazib Beruvchi Buyurtmalarni Ko'radi:**
   - `GET /api/delivery-providers/orders` - Barcha buyurtmalarni ko'radi
   - `GET /api/delivery-providers/orders/:id` - Batafsil ma'lumotlarni ko'radi

4. **Yetkazib Beruvchi Buyurtmani Yetkazadi:**
   - Yetkazib beruvchi buyurtmani mijozga yetkazadi

5. **Yetkazib Beruvchi Buyurtmani Yetkazib Berildi Deb Belgilaydi:**
   - `POST /api/delivery-providers/orders/:orderId/mark-delivered`
   - Buyurtma holati `'confirmed_by_customer'` ga o'zgaradi
   - `customerConfirmed` va `customerConfirmedAt` maydonlari to'ldiriladi

---

## Eslatmalar

1. **Autentifikatsiya:**
   - Barcha endpointlar (login dan tashqari) `deliveryProviderAuth` middleware talab qiladi
   - Token `Authorization: Bearer <token>` header orqali yuboriladi
   - Token 30 kun muddatga amal qiladi

2. **Buyurtmalar:**
   - Faqat o'ziga yuborilgan buyurtmalar ko'rsatiladi
   - Faqat o'ziga tegishli mahsulotlar ko'rsatiladi
   - Maxalla mahsulotlar marketplace formatida transformatsiya qilinadi

3. **Profil:**
   - Telefon raqami o'z kontragentida unique bo'lishi kerak
   - Faqat o'z kontragentiga tegishli telefon raqamlari bilan to'qnashadi

4. **Parol:**
   - Yangi parol kamida 6 belgidan iborat bo'lishi kerak
   - Yangi parol joriy paroldan farq qilishi kerak

---

## Bog'liq Dokumentatsiyalar

- [Maxalla Kontragent API](./MAXALLA_CONTRAGENT_API.md)
- [Maxalla Kontragent Buyurtmalar API](./MAXALLA_CONTRAGENT_ORDERS_API.md)
- [Marketplace Products API](./MARKETPLACE_PRODUCTS_API.md)
