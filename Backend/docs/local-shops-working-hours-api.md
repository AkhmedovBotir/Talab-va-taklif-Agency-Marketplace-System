# Local Shops Working Hours API

Base URL: `http://localhost:8081/api/v1`

Auth:

```http
Authorization: Bearer <local_shop_jwt>
```

Maxalla do'koni haftaning 7 kuni uchun ish vaqtini belgilaydi:

- `is_off=true` — dam olish kuni
- `is_off=false` — `open_time` va `close_time` kiritiladi

`weekday` formati:

- `1` - Dushanba
- `2` - Seshanba
- `3` - Chorshanba
- `4` - Payshanba
- `5` - Juma
- `6` - Shanba
- `7` - Yakshanba

---

## 1) Ish vaqtini olish

**GET** `/local-shops/me/working-hours`

Javob:

```json
{
  "working_hours": [
    {
      "weekday": 1,
      "is_off": false,
      "open_time": "09:00",
      "close_time": "18:00"
    }
  ]
}
```

---

## 2) Ish vaqtini saqlash / yangilash

**PUT** `/local-shops/me/working-hours`

```json
{
  "working_hours": [
    { "weekday": 1, "is_off": false, "open_time": "09:00", "close_time": "18:00" },
    { "weekday": 2, "is_off": false, "open_time": "09:00", "close_time": "18:00" },
    { "weekday": 3, "is_off": false, "open_time": "09:00", "close_time": "18:00" },
    { "weekday": 4, "is_off": false, "open_time": "09:00", "close_time": "18:00" },
    { "weekday": 5, "is_off": false, "open_time": "09:00", "close_time": "18:00" },
    { "weekday": 6, "is_off": true },
    { "weekday": 7, "is_off": true }
  ]
}
```

Validatsiya:

- `working_hours` bo'sh bo'lmasligi kerak
- `weekday` 1..7 oralig'ida
- `weekday` takrorlanmasligi kerak
- `is_off=false` bo'lsa `open_time` va `close_time` majburiy
- vaqt formati `HH:MM`
- `close_time` > `open_time`
- `is_off=true` bo'lsa `open_time/close_time` yuborilmaydi

---

## Status kodlar

- `200` — OK
- `400` — validatsiya xatosi
- `401` — token yaroqsiz
- `500` — server xatosi
