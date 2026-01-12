# Marketplace Maxalla Dokonlar API Dokumentatsiyasi

Bu dokumentatsiya Marketplace uchun maxalla mahsulotlarini sotadigan dokonlarni (maxalla kontragentlar) ko'rsatish API spetsifikatsiyasini o'z ichiga oladi.

**Base Path:** `/api/marketplace`

---

## Munda

1. [Kirish](#kirish)
2. [Maxalla Dokonlarini Olish](#maxalla-dokonlarini-olish)
3. [Ma'lumotlar Strukturasi](#malumotlar-strukturasi)
4. [Working Hours Tekshirish](#working-hours-tekshirish)
5. [Xato Kodlari](#xato-kodlari)
6. [Misollar](#misollar)

---

## Kirish

Maxalla mahsulotini tanlaganda, foydalanuvchi o'z MFYsidagi ushbu maxsulotni sotadigan dokonlardan birini tanlashi kerak. Har bir dokon uchun:

- Dokon ma'lumotlari (nomi, telefon, logo, manzil)
- Working hours (ish vaqti)
- Dokon ochiq/yopiq holati
- Maxalla mahsulot ma'lumotlari (narx, miqdor)

**Eslatma:** Agar foydalanuvchi autentifikatsiya qilingan bo'lsa, faqat o'z MFYsidagi dokonlar ko'rsatiladi. Agar autentifikatsiya qilinmagan bo'lsa, maxalla mahsulotning o'z kontragentining MFYsidagi dokonlar ko'rsatiladi.

---

## Maxalla Dokonlarini Olish

### Maxalla Mahsulot uchun Dokonlarni Olish

```
GET /api/marketplace/maxalla-products/:productId/stores
```

**Authentication:** Optional (optionalMarketplaceUserAuth)

**Description:** Maxalla mahsulot uchun o'z MFYsidagi dokonlarni (maxalla kontragentlar) ko'rsatadi. Har bir dokon uchun working hours tekshiriladi va ochiq/yopiq holati ko'rsatiladi.

**Path Parameters:**
- `productId` (required) - Maxalla mahsulot ID

**Query Parameters:**
- Yo'q

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "contragent": {
        "_id": "contragent_id_1",
        "name": "Maxalla Dokoni 1",
        "phone": "+998901234567",
        "logo": "base64_logo_string",
        "viloyat": {
          "_id": "viloyat_id",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "TOS"
        },
        "tuman": {
          "_id": "tuman_id",
          "name": "Yunusobod",
          "type": "district",
          "code": "YUN"
        },
        "mfy": {
          "_id": "mfy_id",
          "name": "MFY 1",
          "type": "mfy",
          "code": "MFY1"
        },
        "activityType": {
          "_id": "activity_type_id",
          "name": "Oziq-ovqat",
          "icon": "icon_url"
        },
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
        "productType": "maxalla"
      }
    },
    {
      "contragent": {
        "_id": "contragent_id_2",
        "name": "Maxalla Dokoni 2",
        "phone": "+998901234568",
        "logo": "base64_logo_string",
        "viloyat": { /* ... */ },
        "tuman": { /* ... */ },
        "mfy": { /* ... */ },
        "activityType": { /* ... */ },
        "workingHours": {
          "open": "10:00",
          "close": "20:00"
        },
        "isOpen": false,
        "status": "active"
      },
      "product": {
        "_id": "maxalla_product_id_2",
        "name": "Mahsulot nomi",
        "price": 47000,
        "originalPrice": 52000,
        "quantity": 30,
        // ... boshqa maydonlar
      }
    },
    {
      "contragent": {
        "_id": "contragent_id_3",
        "name": "Maxalla Dokoni 3",
        "phone": "+998901234569",
        "logo": null,
        "workingHours": {
          "open": null,
          "close": null
        },
        "isOpen": null,
        "status": "active"
      },
      "product": {
        "_id": "maxalla_product_id_3",
        "name": "Mahsulot nomi",
        "price": 46000,
        "originalPrice": 51000,
        "quantity": 40,
        // ... boshqa maydonlar
      }
    }
  ]
}
```

**Response Fields:**

**contragent:**
- `_id` - Kontragent ID
- `name` - Dokon nomi
- `phone` - Telefon raqami
- `logo` - Logo (base64 yoki null)
- `viloyat` - Viloyat ob'ekti
- `tuman` - Tuman ob'ekti
- `mfy` - MFY ob'ekti
- `activityType` - Faoliyat turi
- `workingHours` - Ish vaqti
  - `open` - Ochilish vaqti (HH:MM formatida yoki null)
  - `close` - Yopilish vaqti (HH:MM formatida yoki null)
- `isOpen` - Dokon ochiqmi?
  - `true` - Dokon ochiq (hozirgi vaqtda ish vaqtida)
  - `false` - Dokon yopiq (hozirgi vaqtda ish vaqti tashqarida)
  - `null` - Working hours o'rnatilmagan
- `status` - Kontragent holati (active/inactive)

**product:**
- `_id` - Maxalla mahsulot ID
- `name` - Mahsulot nomi (BaseProduct'dan)
- `description` - Tavsif (BaseProduct'dan)
- `images` - Rasmlar (BaseProduct'dan)
- `price` - Narx (MaxallaProduct'dan)
- `originalPrice` - Asl narx (MaxallaProduct'dan)
- `quantity` - Mavjud miqdor (MaxallaProduct'dan)
- `unit` - Birlik (BaseProduct'dan)
- `unitSize` - Birlik o'lchami (BaseProduct'dan)
- `category` - Kategoriya (BaseProduct'dan)
- `subcategory` - Subkategoriya (BaseProduct'dan)
- `productType` - "maxalla"

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Maxalla maxsuloti hozir mavjud emas
- `404` - Maxalla maxsuloti topilmadi
- `500` - Server xatosi

**Eslatmalar:**
- Dokonlar tartibi: ochiq dokonlar birinchi, keyin yopiq dokonlar, keyin working hours o'rnatilmagan dokonlar
- Har bir dokon ichida alfavit tartibida
- Faqat o'z MFYsidagi dokonlar ko'rsatiladi (agar foydalanuvchi autentifikatsiya qilingan bo'lsa)
- Faqat `status: 'active'` bo'lgan dokonlar ko'rsatiladi
- Faqat `status: 'active'` bo'lgan maxalla mahsulotlar ko'rsatiladi

---

## Working Hours Tekshirish

### Working Hours Format

Working hours `HH:MM` formatida saqlanadi:
- `open` - Ochilish vaqti (masalan: "09:00")
- `close` - Yopilish vaqti (masalan: "18:00")

### IsOpen Tekshirish

`isOpen` maydoni quyidagicha hisoblanadi:

1. **Agar working hours o'rnatilmagan bo'lsa:**
   - `isOpen: null`

2. **Agar working hours o'rnatilgan bo'lsa:**
   - Hozirgi vaqt working hours ichida bo'lsa: `isOpen: true`
   - Hozirgi vaqt working hours tashqarisida bo'lsa: `isOpen: false`

3. **Kechasi ochiq dokonlar (masalan: 22:00 - 02:00):**
   - Agar `close` vaqti `open` vaqtidan kichik bo'lsa, kechasi ochiq dokon deb hisoblanadi
   - Masalan: `open: "22:00"`, `close: "02:00"` - kechasi ochiq dokon

### Misollar

**Ochiq dokon:**
```json
{
  "workingHours": {
    "open": "09:00",
    "close": "18:00"
  },
  "isOpen": true
}
```

**Yopiq dokon:**
```json
{
  "workingHours": {
    "open": "09:00",
    "close": "18:00"
  },
  "isOpen": false
}
```

**Working hours o'rnatilmagan:**
```json
{
  "workingHours": {
    "open": null,
    "close": null
  },
  "isOpen": null
}
```

**Kechasi ochiq dokon:**
```json
{
  "workingHours": {
    "open": "22:00",
    "close": "02:00"
  },
  "isOpen": true // Agar hozirgi vaqt 22:00-23:59 yoki 00:00-01:59 orasida bo'lsa
}
```

---

## Ma'lumotlar Strukturasi

### Store Ob'ekti

```typescript
interface MaxallaStore {
  contragent: {
    _id: string;
    name: string;
    phone: string;
    logo: string | null;
    viloyat: Region;
    tuman: Region;
    mfy: Region;
    activityType: ContragentType;
    workingHours: {
      open: string | null; // HH:MM formatida
      close: string | null; // HH:MM formatida
    };
    isOpen: boolean | null; // true, false, yoki null
    status: 'active' | 'inactive';
  };
  product: {
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
    productType: 'maxalla';
  };
}
```

### Region Ob'ekti

```typescript
interface Region {
  _id: string;
  name: string;
  type: 'region' | 'district' | 'mfy';
  code: string;
}
```

### ContragentType Ob'ekti

```typescript
interface ContragentType {
  _id: string;
  name: string;
  icon: string;
}
```

---

## Xato Kodlari

| Xato | Status Code | Tavsif |
|------|-------------|--------|
| `Maxalla maxsuloti topilmadi` | 404 | Maxalla maxsulot topilmadi |
| `Bu maxalla maxsuloti hozir mavjud emas` | 400 | Maxalla maxsulot statusi 'active' emas |
| `Asosiy maxsulot topilmadi` | 404 | BaseProduct topilmadi |
| `Noto'g'ri maxalla maxsulot ID` | 400 | Noto'g'ri ID formati |

---

## Misollar

### JavaScript/TypeScript Misollari

```javascript
// Maxalla mahsulot uchun dokonlarni olish (autentifikatsiya qilinmagan)
const getMaxallaStoresForProduct = async (productId) => {
  const response = await fetch(
    `https://api.example.com/api/marketplace/maxalla-products/${productId}/stores`
  );
  return await response.json();
};

// Maxalla mahsulot uchun dokonlarni olish (autentifikatsiya qilingan)
const getMaxallaStoresForProductAuth = async (token, productId) => {
  const response = await fetch(
    `https://api.example.com/api/marketplace/maxalla-products/${productId}/stores`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};

// Dokonlarni filtrlash (ochiq dokonlar)
const getOpenStores = (stores) => {
  return stores.data.filter(store => store.contragent.isOpen === true);
};

// Dokonlarni filtrlash (yopiq dokonlar)
const getClosedStores = (stores) => {
  return stores.data.filter(store => store.contragent.isOpen === false);
};

// Dokonlarni filtrlash (working hours o'rnatilmagan)
const getStoresWithoutHours = (stores) => {
  return stores.data.filter(store => store.contragent.isOpen === null);
};

// Eng arzon dokonni topish
const getCheapestStore = (stores) => {
  if (stores.data.length === 0) return null;
  return stores.data.reduce((cheapest, store) => {
    return store.product.price < cheapest.product.price ? store : cheapest;
  });
};
```

### React Native Misoli

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

const MaxallaStoresScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(
        `https://api.example.com/api/marketplace/maxalla-products/${productId}/stores`,
        { headers }
      );
      const data = await response.json();
      
      if (data.success) {
        setStores(data.data);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStore = ({ item }) => {
    const { contragent, product } = item;
    const isOpen = contragent.isOpen;
    
    return (
      <TouchableOpacity
        style={styles.storeCard}
        onPress={() => handleStoreSelect(item)}
      >
        <View style={styles.storeHeader}>
          <Text style={styles.storeName}>{contragent.name}</Text>
          <View style={[
            styles.statusBadge,
            isOpen === true && styles.openBadge,
            isOpen === false && styles.closedBadge,
            isOpen === null && styles.unknownBadge
          ]}>
            <Text style={styles.statusText}>
              {isOpen === true ? 'Ochiq' : 
               isOpen === false ? 'Yopiq' : 
               'Vaqt noma\'lum'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.storePhone}>{contragent.phone}</Text>
        
        {contragent.workingHours.open && contragent.workingHours.close && (
          <Text style={styles.workingHours}>
            {contragent.workingHours.open} - {contragent.workingHours.close}
          </Text>
        )}
        
        <View style={styles.productInfo}>
          <Text style={styles.productPrice}>
            {product.price.toLocaleString()} so'm
          </Text>
          {product.originalPrice > product.price && (
            <Text style={styles.originalPrice}>
              {product.originalPrice.toLocaleString()} so'm
            </Text>
          )}
          <Text style={styles.productQuantity}>
            Mavjud: {product.quantity} {product.unit}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleStoreSelect = (store) => {
    // Dokonni tanlash va maxalla korzinkasiga qo'shish
    navigation.navigate('AddToMaxallaCart', {
      productId: store.product._id,
      contragentId: store.contragent._id,
    });
  };

  if (loading) {
    return <Text>Yuklanmoqda...</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stores}
        renderItem={renderStore}
        keyExtractor={(item) => item.contragent._id}
        ListEmptyComponent={<Text>Dokonlar topilmadi</Text>}
      />
    </View>
  );
};
```

---

## Jarayon

### Maxalla Mahsulotni Tanlash va Dokonni Tanlash

1. **Foydalanuvchi maxalla mahsulotini tanlaydi**
   - `/api/marketplace/maxalla-products` yoki `/api/marketplace/maxalla-products/:id`

2. **Foydalanuvchi dokonlarni ko'radi**
   - `GET /api/marketplace/maxalla-products/:productId/stores`
   - O'z MFYsidagi ushbu maxsulotni sotadigan dokonlar ko'rsatiladi
   - Har bir dokon uchun:
     - Dokon ma'lumotlari
     - Working hours
     - Ochiq/yopiq holati
     - Maxalla mahsulot ma'lumotlari (narx, miqdor)

3. **Foydalanuvchi dokonni tanlaydi**
   - Tanlangan dokonning maxalla mahsulotini maxalla korzinkasiga qo'shadi
   - `POST /api/marketplace/maxalla-cart` (productId va quantity bilan)

4. **Foydalanuvchi buyurtma beradi**
   - `POST /api/marketplace/maxalla-orders`
   - Buyurtma to'g'ridan-to'g'ri tanlangan maxalla kontragentga yuboriladi

---

## Eslatmalar

1. **MFY Filtrlash:**
   - Agar foydalanuvchi autentifikatsiya qilingan bo'lsa, faqat o'z MFYsidagi dokonlar ko'rsatiladi
   - Agar autentifikatsiya qilinmagan bo'lsa, maxalla mahsulotning o'z kontragentining MFYsidagi dokonlar ko'rsatiladi

2. **Working Hours:**
   - Working hours `HH:MM` formatida saqlanadi
   - `isOpen` maydoni hozirgi vaqt asosida hisoblanadi
   - Agar working hours o'rnatilmagan bo'lsa, `isOpen: null`

3. **Dokonlar Tartibi:**
   - Ochiq dokonlar birinchi
   - Keyin yopiq dokonlar
   - Keyin working hours o'rnatilmagan dokonlar
   - Har bir guruh ichida alfavit tartibida

4. **Maxalla Mahsulot:**
   - Faqat `status: 'active'` bo'lgan maxalla mahsulotlar ko'rsatiladi
   - Har bir dokon uchun o'zining maxalla mahsulot ma'lumotlari ko'rsatiladi (narx, miqdor)

5. **Kontragent:**
   - Faqat `contragentLevel: 'mfy'` bo'lgan kontragentlar ko'rsatiladi
   - Faqat `status: 'active'` bo'lgan kontragentlar ko'rsatiladi

---

## Bog'liq Dokumentatsiyalar

- [Marketplace Products API](./MARKETPLACE_PRODUCTS_API.md)
- [Marketplace Authentication API](./MARKETPLACE_AUTH_API.md)
- [Maxalla Contragent API](./MAXALLA_CONTRAGENT_API.md)
- [Maxalla Dokoni API](./MAXALLA_DOKONI_API.md)
