# Manager Auth API

Menejer uchun auth oqimi (Punkt/Agent/Contragent uslubida).

Base URL: `http://localhost:8081/api/v1`

## SMS tekshiruv

Manager SMS matni eskiz service orqali:
- `SendManagerPasswordSetupCode`
- Matn: `${code} - Menejer hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.`

## Public endpointlar

- `POST /managers/auth/send-code`
- `POST /managers/auth/verify-code`
- `POST /managers/auth/resend-code`
- `POST /managers/auth/set-password`
- `POST /managers/auth/login`

## Protected endpointlar

Auth: `Authorization: Bearer <manager_jwt>`

- `GET /managers/me/profile`
- `POST /managers/me/change-password`

## Qisqa oqim

1. `send-code` (parol hali o'rnatilmagan bo'lsa)
2. `verify-code`
3. `set-password` (token qaytadi)
4. keyingi safar `login`
5. `profile`, `change-password`

## Namuna body

`send-code`, `resend-code`:
```json
{ "phone": "+998901234567" }
```

`verify-code`:
```json
{ "phone": "+998901234567", "code": "12345" }
```

`set-password`, `login`:
```json
{ "phone": "+998901234567", "password": "secret123" }
```

`change-password`:
```json
{ "old_password": "secret123", "new_password": "secret456" }
```
