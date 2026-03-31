export function getStatusUz(status?: string | null): string {
  const s = String(status ?? '').trim();
  const map: Record<string, string> = {
    // common
    active: 'Faol',
    inactive: 'Nofaol',

    // marketplace order
    pending: 'Kutilmoqda',
    cancelled: 'Bekor qilingan',
    delivered: 'Yetkazib berilgan',

    // address type
    default: 'Asosiy saqlangan manzil',
    delivery_area: 'Tanlangan saqlangan manzil',
    extra: "Qo'lda kiritilgan manzil",

    // punkt acceptance
    none: "Tuman aniqlanmagan, punkt oqimi yo'q",
    no_punkt: "Shu tumanda faol punkt topilmagan",
    inbox: 'Punkt inboxida',
    contragent_requests_created: "Kontragent so'rovlari yaratilgan",

    // contragent line requests
    accepted: 'Qabul qilindi',
    preparing: 'Tayyorlanmoqda',
    rejected: 'Rad etildi',

    // punkt transfer
    sent: 'Yuborilgan',
    accepted_by_target: 'Qabul qilingan',
    returned_to_source: 'Manbaga qaytarilgan',
    received_by_source: 'Manbada qabul qilingan',

    // product moderation
    approved: 'Tasdiqlangan',

    // roles
    general: 'General admin',
    admin: 'Admin',

    // sms purposes
    login: 'Login uchun kod',
    register: "Ro'yxatdan o'tish uchun kod",
    forgot_password: 'Parolni tiklash uchun kod',

    // pipeline stages
    marketplace_created: "Marketplace'da yaratilgan",
    punkt_inbox: 'Punkt qabulini kutmoqda',
    punkt_collected_pending: "Punkt yig'ish bosqichi kutilmoqda",
    punkt_ready_pending: 'Punkt tayyorlash kutilmoqda',
    agent_assign_pending: 'Agentga topshirish kutilmoqda',
    agent_payment_pending: "Agent to'lov e'loni kutilmoqda",
    payment_confirm_pending: "To'lov tasdig'i kutilmoqda",
    post_payment_delivery_pending: "To'lovdan keyingi yetkazish kutilmoqda",
    remainder_handover_pending: "Qolgan qism topshirilishi kutilmoqda",
    ready_for_agent_deliver: 'Agent yetkazishi uchun tayyor',
  };
  return map[s] ?? (s || '—');
}

