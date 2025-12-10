# Admin Dashboard API

Admin paneldagi dashboard kartalari va oxirgi obyektlar uchun yagona endpoint.

## Base URL
```
/api/admins/dashboard
```

## Auth
```
Authorization: Bearer <admin_token>
```

---

## Dashboard Overview
**GET** `/overview`

**Description:** Tezkor ko'rinish uchun asosiy ko'rsatkichlar, bugun/oy davri statistikasi va oxirgi obyektlar.

**Query params:** Yo'q

**Response 200**
```json
{
  "success": true,
  "data": {
    "cards": {
      "orders": 1523,
      "revenue": 742500000,
      "products": 420,
      "categories": 34,
      "marketplaceUsers": 18340,
      "contragents": 120,
      "punkts": 540,
      "agents": 1320,
      "admins": 8,
      "vacancies": 24,
      "vacancyApplicants": 1580,
      "vacancyApplications": 2040,
      "openPartnershipRequests": 12,
      "avgOrderValue": 488000
    },
    "period": {
      "today": {
        "orders": 34,
        "revenue": 16800000
      },
      "month": {
        "orders": 540,
        "revenue": 268000000
      }
    },
    "latest": {
      "orders": [
        { "_id": "...", "orderNumber": "ORD-001", "totalPrice": 250000, "status": "confirmed_by_customer", "createdAt": "2024-02-10T08:30:00.000Z" }
      ],
      "vacancies": [
        { "_id": "...", "name": "Punkt operatori", "target": "punkt", "type": "fulltime", "createdAt": "2024-02-10T07:10:00.000Z" }
      ],
      "vacancyApplications": [
        {
          "_id": "...",
          "status": "pending",
          "createdAt": "2024-02-10T06:55:00.000Z",
          "vacancy": { "_id": "...", "name": "Punkt operatori", "target": "punkt", "type": "fulltime" },
          "applicant": { "_id": "...", "firstName": "Ali", "lastName": "Valiyev", "phone": "+998901234567" }
        }
      ]
    }
  }
}
```

**Notes**
- Buyurtma yig'indilari faqat `status = confirmed_by_customer` bo'yicha hisoblanadi.
- `today` va `month` vaqt oralig'i server vaqtiga ko'ra.
- `latest` obyektlar max 5 tadan.
- `openPartnershipRequests` — `contactStatus != done` bo'lgan so'rovlar soni.

**Errors**
- `401` — token yo'q yoki noto'g'ri
- `500` — server xatosi



