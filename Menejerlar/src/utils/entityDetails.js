import { formatMarketplaceUserName } from '../hooks/useMarketplaceUserLookup';

const WEEKDAY_NAMES = {
  1: 'Dushanba',
  2: 'Seshanba',
  3: 'Chorshanba',
  4: 'Payshanba',
  5: 'Juma',
  6: 'Shanba',
  7: 'Yakshanba',
};

export const formatStatus = (status) => {
  if (status === 'active') return 'Faol';
  if (status === 'inactive') return 'Nofaol';
  return status || '-';
};

export const formatWorkingHours = (hours) => {
  if (!Array.isArray(hours) || hours.length === 0) return '-';
  return hours
    .map((h) => {
      const day = WEEKDAY_NAMES[h.weekday] || `Kun ${h.weekday}`;
      if (h.is_off) return `${day}: yopiq`;
      const open = h.open_time || '?';
      const close = h.close_time || '?';
      return `${day}: ${open} – ${close}`;
    })
    .join('; ');
};

export function buildPunktDetailFields(punkt, geo) {
  return [
    { label: 'Nomi', value: punkt.name },
    { label: 'Viloyat', value: geo.regionName(punkt.viloyat_id || punkt.region_id, punkt) },
    { label: 'Tuman', value: geo.districtName(punkt.tuman_id || punkt.district_id, punkt) },
    { label: 'Status', value: formatStatus(punkt.status) },
  ];
}

export function buildAgentDetailFields(agent, geo) {
  return [
    { label: 'Ism', value: agent.name },
    { label: 'Telefon', value: agent.phone || '-' },
    { label: 'Viloyat', value: geo.regionName(agent.viloyat_id || agent.region_id, agent) },
    { label: 'Tuman', value: geo.districtName(agent.tuman_id || agent.district_id, agent) },
    { label: 'MFY', value: geo.mfyName(agent.mfy_id, agent) },
    { label: 'Status', value: formatStatus(agent.status) },
  ];
}

export function buildDokonDetailFields(dokon, geo) {
  return [
    { label: 'Nomi', value: dokon.name },
    { label: 'Telefon', value: dokon.phone || '-' },
    { label: 'Viloyat', value: geo.regionName(dokon.region_id || dokon.viloyat_id, dokon) },
    { label: 'Tuman', value: geo.districtName(dokon.district_id || dokon.tuman_id, dokon) },
    { label: 'MFY', value: geo.mfyName(dokon.mfy_id, dokon) },
    { label: 'Status', value: formatStatus(dokon.status) },
    {
      label: 'Ish vaqti',
      value: formatWorkingHours(dokon.working_hours),
      fullWidth: true,
    },
  ];
}

export function buildContragentDetailFields(item) {
  const fields = [
    { label: 'Nomi', value: item.name },
    { label: 'INN', value: item.inn },
    { label: 'Telefon', value: item.phone },
    { label: 'Status', value: formatStatus(item.status) },
  ];

  if (item.address) fields.push({ label: 'Manzil', value: item.address, fullWidth: true });
  if (item.description) fields.push({ label: 'Tavsif', value: item.description, fullWidth: true });

  return fields;
}

export function buildMarketplaceUserDetailFields(user) {
  const fullName = formatMarketplaceUserName(user);
  return [
    { label: 'To\'liq ism', value: fullName || '-' },
    { label: 'Ism', value: user.first_name },
    { label: 'Familiya', value: user.last_name },
  ];
}

export const ORDER_STAGE_LABELS = {
  marketplace_created: 'Marketplace yaratilgan',
  punkt_inbox: 'Punkt inbox',
  contragent_requests_created: 'Kontragent so\'rovlari',
  punkt_collected_pending: 'Yig\'ish kutilmoqda',
  punkt_ready_pending: 'Tayyor kutilmoqda',
  agent_assign_pending: 'Agent tayinlash',
  agent_payment_pending: 'Agent to\'lovi',
  payment_confirm_pending: 'To\'lov tasdiqlash',
  post_payment_delivery_pending: 'Yetkazish kutilmoqda',
  remainder_handover_pending: 'Qoldiq topshirish',
  ready_for_agent_deliver: 'Agentga topshirishga tayyor',
  delivered: 'Yetkazilgan',
};

export function formatOrderStage(stage) {
  return ORDER_STAGE_LABELS[stage] || stage || '-';
}
