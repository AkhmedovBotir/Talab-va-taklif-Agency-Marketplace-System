# Maxalla Kontragent Buyurtmalar API Dokumentatsiyasi

Bu dokumentatsiya Maxalla Kontragentlar uchun o'z dokoniga kelgan buyurtmalarni ko'rish va yetkazib beruvchiga yuborish API spetsifikatsiyasini o'z ichiga oladi.

**Base Path:** `/api/maxalla-contragents`

**Eslatma:** Bu API faqat `contragentLevel: 'mfy'` (Maxalla) kontragentlar uchun ishlaydi.

---

## Munda

1. [Kirish](#kirish)
2. [Buyurtmalarni Ko'rish](#buyurtmalarni-korish)
3. [Buyurtmani ID bo'yicha Olish](#buyurtmani-id-boyicha-olish)
4. [Buyurtma So'roviga Javob Berish (Qabul Qilish/Rad Etish)](#buyurtma-soroviga-javob-berish-qabul-qilishrad-etish)
5. [Buyurtmani Yetkazib Beruvchiga Yuborish](#buyurtmani-yetkazib-beruvchiga-yuborish)
6. [Ma'lumotlar Strukturasi](#malumotlar-strukturasi)
7. [Xato Kodlari](#xato-kodlari)
8. [Misollar](#misollar)
9. [Jarayon](#jarayon)

---

## Kirish

Maxalla Kontragent Buyurtmalar API - bu maxalla kontragentlar uchun o'z dokoniga kelgan buyurtmalarni ko'rish va boshqarish funksiyalarini ta'minlaydi.

**Asosiy Funksiyalar:**
- O'z dokoniga kelgan buyurtmalarni ko'rish
- Buyurtma ma'lumotlarini batafsil ko'rish
- Buyurtmalarni yetkazib beruvchiga yuborish

**Autentifikatsiya:** Barcha endpointlar `maxallaContragentAuth` middleware orqali autentifikatsiya talab qiladi.

---

## Buyurtmalarni Ko'rish

### O'z Dokoniga Kelgan Buyurtmalarni Olish

```
GET /api/maxalla-contragents/orders
```

**Authentication:** Required (maxallaContragentAuth)

**Description:** Maxalla kontragentga kelgan barcha buyurtmalarni ko'rsatadi. Faqat o'z kontragentiga so'rov yuborilgan buyurtmalar ko'rsatiladi.

**Query Parameters:**
- `status` (optional) - Buyurtma holati filtri
  - `pending` - Kutayotgan buyurtmalar
  - `accepted` - Qabul qilingan buyurtmalar
  - `rejected` - Rad etilgan buyurtmalar
  - `delivered_to_punkt` - Punktga yetkazilgan buyurtmalar
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
      "_id": "order_id_1",
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
            "description": "Tavsif",
            "images": ["image1.jpg"],
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
              "mfy": { "name": "MFY 1", "type": "mfy", "code": "MFY1" }
            },
            "productType": "maxalla"
          },
          "quantity": 2,
          "price": 45000,
          "originalPrice": 50000,
          "productType": "maxalla"
        }
      ],
      "totalPrice": 90000,
      "totalOriginalPrice": 100000,
      "itemCount": 2,
      "status": "requested_to_contragent",
      "paymentStatus": "pending",
      "paymentMethod": "cash",
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
            "name": "Maxalla Dokoni",
            "phone": "+998901234567",
            "viloyat": { "name": "Toshkent", "type": "region", "code": "TOS" },
            "tuman": { "name": "Yunusobod", "type": "district", "code": "YUN" },
            "mfy": { "name": "MFY 1", "type": "mfy", "code": "MFY1" }
          },
          "itemIds": [0],
          "status": "pending",
          "requestedAt": "2024-01-01T00:00:00.000Z",
          "respondedAt": null,
          "deliveredToPunktAt": null,
          "deliveryProvider": null,
          "sentToDeliveryProviderAt": null
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response Fields:**

**Order:**
- `_id` - Buyurtma ID
- `orderNumber` - Buyurtma raqami
- `user` - Foydalanuvchi ma'lumotlari
- `items` - Buyurtma mahsulotlari (faqat o'z kontragentiga tegishli mahsulotlar)
- `totalPrice` - Jami narx
- `totalOriginalPrice` - Jami asl narx
- `itemCount` - Mahsulotlar soni
- `status` - Buyurtma holati
- `paymentStatus` - To'lov holati
- `paymentMethod` - To'lov usuli
- `deliveryViloyat` - Yetkazib berish viloyati
- `deliveryTuman` - Yetkazib berish tumani
- `deliveryMfy` - Yetkazib berish MFY
- `deliveryNote` - Yetkazib berish eslatmasi
- `phoneNumber` - Telefon raqami
- `contragentRequests` - Kontragent so'rovlari (faqat o'z kontragentiga tegishli so'rov)
- `createdAt` - Yaratilgan sana
- `updatedAt` - Yangilangan sana

**contragentRequests:**
- `contragentId` - Kontragent ma'lumotlari
- `itemIds` - Bu kontragentga tegishli mahsulotlar indekslari
- `status` - So'rov holati
- `requestedAt` - So'rov yuborilgan sana
- `respondedAt` - Javob berilgan sana
- `deliveredToPunktAt` - Punktga yetkazilgan sana
- `deliveryProvider` - Yetkazib beruvchi (agar yuborilgan bo'lsa)
- `sentToDeliveryProviderAt` - Yetkazib beruvchiga yuborilgan sana

**Status Codes:**
- `200` - Muvaffaqiyatli
- `401` - Autentifikatsiya xatosi
- `500` - Server xatosi

**Eslatmalar:**
- Faqat o'z kontragentiga so'rov yuborilgan buyurtmalar ko'rsatiladi
- Faqat o'z kontragentiga tegishli mahsulotlar ko'rsatiladi
- Maxalla mahsulotlar marketplace formatida transformatsiya qilinadi

---

## Buyurtmani ID bo'yicha Olish

### Buyurtma Ma'lumotlarini Batafsil Ko'rish

```
GET /api/maxalla-contragents/orders/:id
```

**Authentication:** Required (maxallaContragentAuth)

**Description:** Maxalla kontragentga tegishli buyurtma ma'lumotlarini batafsil ko'rsatadi.

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
          "originalPrice": 50000,
          "quantity": 50,
          "productType": "maxalla"
        },
        "quantity": 2,
        "price": 45000,
        "originalPrice": 50000,
        "productType": "maxalla"
      }
    ],
    "totalPrice": 90000,
    "status": "requested_to_contragent",
    "contragentRequests": [
      {
        "contragentId": {
          "_id": "contragent_id",
          "name": "Maxalla Dokoni"
        },
        "itemIds": [0],
        "status": "pending",
        "deliveryProvider": null,
        "sentToDeliveryProviderAt": null
      }
    ]
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Noto'g'ri buyurtma ID
- `403` - Bu buyurtma sizga so'rov yuborilmagan
- `404` - Buyurtma topilmadi
- `401` - Autentifikatsiya xatosi
- `500` - Server xatosi

---

## Buyurtma So'roviga Javob Berish (Qabul Qilish/Rad Etish)

### Buyurtma So'roviga Javob Berish

```
POST /api/maxalla-contragents/orders/:orderId/respond
```

**Authentication:** Required (maxallaContragentAuth)

**Description:** Maxalla kontragentga kelgan buyurtma so'roviga javob beradi. Buyurtmani qabul qilish yoki rad etish mumkin.

**Path Parameters:**
- `orderId` (required) - Buyurtma ID

**Request Body:**
```json
{
  "response": "accepted"
}
```

yoki

```json
{
  "response": "rejected"
}
```

**Request Fields:**
- `response` (required) - Javob turi
  - `"accepted"` - Buyurtmani qabul qilish
  - `"rejected"` - Buyurtmani rad etish

**Response (Qabul qilinganda):**
```json
{
  "success": true,
  "message": "So'rov qabul qilindi",
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
    "status": "accepted_by_contragent",
    "contragentRequests": [
      {
        "contragentId": {
          "_id": "contragent_id",
          "name": "Maxalla Dokoni"
        },
        "itemIds": [0],
        "status": "accepted",
        "requestedAt": "2024-01-01T00:00:00.000Z",
        "respondedAt": "2024-01-01T12:00:00.000Z",
        "deliveryProvider": null,
        "sentToDeliveryProviderAt": null
      }
    ]
  }
}
```

**Response (Rad etilganda):**
```json
{
  "success": true,
  "message": "So'rov rad etildi",
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-2024-001",
    "status": "requested_to_contragent",
    "contragentRequests": [
      {
        "status": "rejected",
        "requestedAt": "2024-01-01T00:00:00.000Z",
        "respondedAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Javob noto'g'ri yoki so'rovga allaqachon javob berilgan yoki mahsulot miqdori yetarli emas
- `404` - Buyurtma topilmadi yoki sizga so'rov yuborilmagan
- `401` - Autentifikatsiya xatosi
- `500` - Server xatosi

**Eslatmalar:**
- Faqat `status: 'pending'` bo'lgan so'rovlarga javob berish mumkin
- Qabul qilinganda, mahsulot miqdorlari tekshiriladi va kamaytiriladi (buyurtma uchun rezervatsiya qilinadi)
- Agar mahsulot miqdori yetarli bo'lmasa, xato qaytariladi va buyurtma qabul qilinmaydi
- Qabul qilinganda, buyurtma holati `'accepted_by_contragent'` ga o'zgaradi
- Rad etilganda, buyurtma holati o'zgarmaydi

---

## Buyurtmani Yetkazib Beruvchiga Yuborish

### Buyurtmani O'z Yetkazib Beruvchiga Yuborish

```
POST /api/maxalla-contragents/orders/:orderId/send-to-delivery-provider
```

**Authentication:** Required (maxallaContragentAuth)

**Description:** Qabul qilingan buyurtmani o'z yetkazib beruvchiga yuboradi.

**Path Parameters:**
- `orderId` (required) - Buyurtma ID

**Request Body:**
```json
{
  "deliveryProviderId": "delivery_provider_id"
}
```

**Request Fields:**
- `deliveryProviderId` (required) - Yetkazib beruvchi ID

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma yetkazib beruvchiga muvaffaqiyatli yuborildi",
  "data": {
    "orderId": "order_id",
    "orderNumber": "ORD-2024-001",
    "contragentRequest": {
      "contragentId": "contragent_id",
      "itemIds": [0],
      "status": "accepted",
      "deliveryProvider": {
        "_id": "delivery_provider_id",
        "name": "Yetkazib Beruvchi",
        "phone": "+998901234567"
      },
      "sentToDeliveryProviderAt": "2024-01-01T12:00:00.000Z"
    },
    "deliveryProvider": {
      "_id": "delivery_provider_id",
      "name": "Yetkazib Beruvchi",
      "phone": "+998901234567"
    },
    "sentAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Yetkazib beruvchi ID kiritilmagan yoki buyurtma allaqachon yuborilgan
- `404` - Buyurtma yoki yetkazib beruvchi topilmadi
- `401` - Autentifikatsiya xatosi
- `500` - Server xatosi

**Eslatmalar:**
- Faqat `status: 'accepted'` bo'lgan buyurtmalar yetkazib beruvchiga yuborilishi mumkin
- Yetkazib beruvchi faqat o'z kontragentiga tegishli bo'lishi kerak
- Yetkazib beruvchi `status: 'active'` va `isDeleted: false` bo'lishi kerak
- Buyurtma allaqachon yetkazib beruvchiga yuborilgan bo'lsa, xato qaytariladi

---

## Ma'lumotlar Strukturasi

### Order Ob'ekti

```typescript
interface Order {
  _id: string;
  orderNumber: string;
  user: MarketplaceUser;
  items: OrderItem[];
  totalPrice: number;
  totalOriginalPrice: number;
  itemCount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryViloyat: Region;
  deliveryTuman: Region | null;
  deliveryMfy: Region | null;
  deliveryNote: string;
  phoneNumber: string;
  contragentRequests: ContragentRequest[];
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  product: MaxallaProduct | Product;
  quantity: number;
  price: number;
  originalPrice: number;
  productType: 'tuman' | 'maxalla';
}

interface ContragentRequest {
  contragentId: Contragent;
  itemIds: number[];
  status: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
  requestedAt: Date;
  respondedAt: Date | null;
  deliveredToPunktAt: Date | null;
  deliveryProvider: DeliveryProvider | null;
  sentToDeliveryProviderAt: Date | null;
}

interface DeliveryProvider {
  _id: string;
  name: string;
  phone: string;
  contragent: string;
  status: 'active' | 'inactive';
}
```

---

## Xato Kodlari

| Xato | Status Code | Tavsif |
|------|-------------|--------|
| `Buyurtma topilmadi` | 404 | Buyurtma topilmadi |
| `Sizga so'rov yuborilmagan` | 403 | Bu buyurtma sizga so'rov yuborilmagan |
| `Yetkazib beruvchi ID kiritilishi shart` | 400 | Yetkazib beruvchi ID kiritilmagan |
| `Yetkazib beruvchi topilmadi yoki sizga tegishli emas` | 404 | Yetkazib beruvchi topilmadi yoki sizga tegishli emas |
| `Javob "accepted" yoki "rejected" bo'lishi kerak` | 400 | Javob noto'g'ri formatda |
| `Bu so'rovga allaqachon javob berilgan` | 400 | So'rovga allaqachon javob berilgan |
| `Mahsulot miqdori yetarli emas` | 400 | Mahsulot miqdori yetarli emas (qabul qilishda) |
| `So'rov qabul qilinmagan. Avval buyurtmani qabul qiling` | 400 | Buyurtma hali qabul qilinmagan |
| `Buyurtma allaqachon yetkazib beruvchiga yuborilgan` | 400 | Buyurtma allaqachon yuborilgan |
| `Noto'g'ri buyurtma ID` | 400 | Noto'g'ri ID formati |

---

## Misollar

### JavaScript/TypeScript Misollari

```javascript
// O'z dokoniga kelgan buyurtmalarni olish
const getMyOrders = async (token, filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.limit) queryParams.append('limit', filters.limit);

  const response = await fetch(
    `https://api.example.com/api/maxalla-contragents/orders?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};

// Buyurtmani ID bo'yicha olish
const getOrderById = async (token, orderId) => {
  const response = await fetch(
    `https://api.example.com/api/maxalla-contragents/orders/${orderId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};

// Buyurtma so'roviga javob berish (qabul qilish yoki rad etish)
const respondToOrderRequest = async (token, orderId, response) => {
  const responseData = await fetch(
    `https://api.example.com/api/maxalla-contragents/orders/${orderId}/respond`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ response })
    }
  );
  return await responseData.json();
};

// Buyurtmani yetkazib beruvchiga yuborish
const sendOrderToDeliveryProvider = async (token, orderId, deliveryProviderId) => {
  const response = await fetch(
    `https://api.example.com/api/maxalla-contragents/orders/${orderId}/send-to-delivery-provider`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deliveryProviderId
      })
    }
  );
  return await response.json();
};

// Kutayotgan buyurtmalarni olish
const getPendingOrders = async (token) => {
  return await getMyOrders(token, { status: 'pending' });
};

// Qabul qilingan buyurtmalarni olish
const getAcceptedOrders = async (token) => {
  return await getMyOrders(token, { status: 'accepted' });
};

// Buyurtmani qabul qilish
const acceptOrder = async (token, orderId) => {
  return await respondToOrderRequest(token, orderId, 'accepted');
};

// Buyurtmani rad etish
const rejectOrder = async (token, orderId) => {
  return await respondToOrderRequest(token, orderId, 'rejected');
};
```

### React Native Misoli

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MaxallaContragentOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('maxallaContragentToken');
      const response = await fetch(
        `https://api.example.com/api/maxalla-contragents/orders?status=${statusFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToOrder = async (orderId, response) => {
    try {
      const token = await AsyncStorage.getItem('maxallaContragentToken');
      const result = await respondToOrderRequest(token, orderId, response);
      
      if (result.success) {
        Alert.alert(
          'Muvaffaqiyatli',
          response === 'accepted' ? 'Buyurtma qabul qilindi' : 'Buyurtma rad etildi'
        );
        fetchOrders(); // Refresh list
      } else {
        Alert.alert('Xatolik', result.message);
      }
    } catch (error) {
      console.error('Error responding to order:', error);
      Alert.alert('Xatolik', 'Javob berishda xatolik yuz berdi');
    }
  };

  const handleSendToDeliveryProvider = async (orderId, deliveryProviderId) => {
    try {
      const token = await AsyncStorage.getItem('maxallaContragentToken');
      const response = await fetch(
        `https://api.example.com/api/maxalla-contragents/orders/${orderId}/send-to-delivery-provider`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ deliveryProviderId })
        }
      );
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Muvaffaqiyatli', 'Buyurtma yetkazib beruvchiga yuborildi');
        fetchOrders(); // Refresh list
      } else {
        Alert.alert('Xatolik', data.message);
      }
    } catch (error) {
      console.error('Error sending to delivery provider:', error);
      Alert.alert('Xatolik', 'Yetkazib beruvchiga yuborishda xatolik yuz berdi');
    }
  };

  const renderOrder = ({ item }) => {
    const request = item.contragentRequests[0];
    const isAccepted = request.status === 'accepted';
    const isSent = request.deliveryProvider !== null;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <View style={[
            styles.statusBadge,
            request.status === 'pending' && styles.pendingBadge,
            request.status === 'accepted' && styles.acceptedBadge,
            request.status === 'rejected' && styles.rejectedBadge
          ]}>
            <Text style={styles.statusText}>
              {request.status === 'pending' ? 'Kutayotgan' :
               request.status === 'accepted' ? 'Qabul qilingan' :
               request.status === 'rejected' ? 'Rad etilgan' :
               'Yetkazilgan'}
            </Text>
          </View>
        </View>

        <Text style={styles.customerName}>
          {item.user.firstName} {item.user.lastName}
        </Text>
        <Text style={styles.customerPhone}>{item.user.phone}</Text>

        <Text style={styles.totalPrice}>
          {item.totalPrice.toLocaleString()} so'm
        </Text>

        {request.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleRespondToOrder(item._id, 'accepted')}
            >
              <Text style={styles.acceptButtonText}>Qabul Qilish</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleRespondToOrder(item._id, 'rejected')}
            >
              <Text style={styles.rejectButtonText}>Rad Etish</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && !isSent && (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => {
              // Show delivery provider selection modal
              navigation.navigate('SelectDeliveryProvider', {
                orderId: item._id,
                onSelect: (deliveryProviderId) => {
                  handleSendToDeliveryProvider(item._id, deliveryProviderId);
                }
              });
            }}
          >
            <Text style={styles.sendButtonText}>Yetkazib Beruvchiga Yuborish</Text>
          </TouchableOpacity>
        )}

        {isSent && (
          <View style={styles.sentInfo}>
            <Text style={styles.sentText}>
              Yetkazib beruvchiga yuborilgan
            </Text>
            <Text style={styles.sentDate}>
              {new Date(request.sentToDeliveryProviderAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Text>Yuklanmoqda...</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'pending' && styles.activeFilter]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text>Kutayotgan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'accepted' && styles.activeFilter]}
          onPress={() => setStatusFilter('accepted')}
        >
          <Text>Qabul qilingan</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={<Text>Buyurtmalar topilmadi</Text>}
      />
    </View>
  );
};
```

---

## Jarayon

### Maxalla Kontragent Buyurtma Jarayoni

1. **Buyurtma Keladi:**
   - Foydalanuvchi maxalla mahsulotni tanlaydi va buyurtma beradi
   - Buyurtma to'g'ridan-to'g'ri maxalla kontragentga yuboriladi
   - `contragentRequests` ga so'rov qo'shiladi (`status: 'pending'`)

2. **Maxalla Kontragent Buyurtmani Ko'radi:**
   - `GET /api/maxalla-contragents/orders` - Barcha buyurtmalarni ko'radi
   - `GET /api/maxalla-contragents/orders/:id` - Batafsil ma'lumotlarni ko'radi

3. **Maxalla Kontragent Buyurtma So'roviga Javob Beradi:**
   - `POST /api/maxalla-contragents/orders/:orderId/respond`
   - `response: 'accepted'` - Buyurtmani qabul qilish
   - `response: 'rejected'` - Buyurtmani rad etish
   - Qabul qilinganda:
     - Mahsulot miqdorlari tekshiriladi
     - Mahsulot miqdorlari kamaytiriladi (rezervatsiya)
     - `status: 'pending'` dan `status: 'accepted'` ga o'zgaradi
     - Buyurtma holati `'accepted_by_contragent'` ga o'zgaradi

4. **Maxalla Kontragent Buyurtmani Yetkazib Beruvchiga Yuboradi:**
   - `POST /api/maxalla-contragents/orders/:orderId/send-to-delivery-provider`
   - Faqat qabul qilingan buyurtmalar yuborilishi mumkin
   - Yetkazib beruvchi tanlanadi
   - `deliveryProvider` maydoni to'ldiriladi
   - `sentToDeliveryProviderAt` sana belgilanadi

5. **Yetkazib Beruvchi Buyurtmani Yetkazadi:**
   - (Bu funksiya yetkazib beruvchi API da bo'lishi kerak)

---

## Eslatmalar

1. **Buyurtma Filtrlash:**
   - Faqat o'z kontragentiga so'rov yuborilgan buyurtmalar ko'rsatiladi
   - Faqat o'z kontragentiga tegishli mahsulotlar ko'rsatiladi

2. **Yetkazib Beruvchi:**
   - Faqat o'z kontragentiga tegishli yetkazib beruvchilar tanlanishi mumkin
   - Yetkazib beruvchi `status: 'active'` va `isDeleted: false` bo'lishi kerak

3. **Buyurtma Holati:**
   - `pending` - Kutayotgan buyurtmalar
   - `accepted` - Qabul qilingan buyurtmalar (yetkazib beruvchiga yuborish mumkin)
   - `rejected` - Rad etilgan buyurtmalar
   - `delivered_to_punkt` - Punktga yetkazilgan buyurtmalar

4. **Maxalla Mahsulotlar:**
   - Maxalla mahsulotlar marketplace formatida transformatsiya qilinadi
   - `productType: 'maxalla'` maydoni qo'shiladi

---

## Bog'liq Dokumentatsiyalar

- [Maxalla Kontragent API](./MAXALLA_CONTRAGENT_API.md)
- [Maxalla Dokoni API](./MAXALLA_DOKONI_API.md)
- [Delivery Provider API](./DELIVERY_PROVIDER_API.md)
- [Marketplace Products API](./MARKETPLACE_PRODUCTS_API.md)
