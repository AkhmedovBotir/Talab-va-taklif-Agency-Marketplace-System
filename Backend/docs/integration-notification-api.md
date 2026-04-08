# Integration Notification CRUD API

Integratsiya uchun notification CRUD.

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <integration_jwt>` — integratsiya kaliti orqali login (`POST /integration-auth/login` yoki `POST /integration/login` body: `{"api_key":"..."}`). Admin JWT bu yo‘llar uchun ishlamaydi.

## Notification maydonlari

- `title` (string, majburiy)
- `message` (string, majburiy)
- `type` (majburiy):  
  `info | warning | success | error | update | announcement`
- `target_type` (majburiy):  
  `all | admins | agents | contragents | marketplace | managers | punkts | localshops | deliveryproviders`

`target_type` mapping:
- `all` — hammaga
- `admins` — adminlarga
- `agents` — agentlarga
- `contragents` — kontragentlarga
- `marketplace` — marketplace foydalanuvchilarga
- `managers` — menejerlarga
- `punkts` — punktlarga
- `localshops` — mahalla do'konlarga
- `deliveryproviders` — yetkazuvchilarga

## Endpointlar

- `POST /integration-notifications`
- `GET /integration-notifications?page=1&limit=10`
- `GET /integration-notifications/:id`
- `PUT /integration-notifications/:id`
- `DELETE /integration-notifications/:id`

## Create/Update body

```json
{
  "title": "Yangi yangilanish",
  "message": "Tizimda yangi funksiya yoqildi",
  "type": "update",
  "target_type": "all"
}
```

