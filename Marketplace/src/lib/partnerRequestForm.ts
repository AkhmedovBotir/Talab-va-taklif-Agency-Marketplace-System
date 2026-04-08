import type { PartnerRequestPayload } from '../types';

export const PARTNER_PHONE_RE = /^\+998\d{9}$/;
export const PARTNER_INN_RE = /^\d{9}$/;
export const PARTNER_MFO_RE = /^\d{5}$/;
export const PARTNER_ACCOUNT_RE = /^\d{20}$/;

export function digitsOnly(value: string, maxLen?: number) {
  const cleaned = value.replace(/\D+/g, '');
  return typeof maxLen === 'number' ? cleaned.slice(0, maxLen) : cleaned;
}

export function sanitizePhoneInput(value: string) {
  const digits = digitsOnly(value, 12);
  if (!digits) return '+998';
  if (digits.startsWith('998')) return `+${digits}`;
  return `+998${digits.slice(0, 9)}`;
}

export function normalizePartnerRequestPayload(payload: PartnerRequestPayload): PartnerRequestPayload {
  return {
    company_name: String(payload.company_name ?? '').trim(),
    inn: digitsOnly(String(payload.inn ?? ''), 9),
    mfo: digitsOnly(String(payload.mfo ?? ''), 5),
    account_number: digitsOnly(String(payload.account_number ?? ''), 20),
    activity_type_id: Number(payload.activity_type_id ?? 0),
    region_id: Number(payload.region_id ?? 0),
    district_id: Number(payload.district_id ?? 0),
    mfy_id: Number(payload.mfy_id ?? 0),
    phone: sanitizePhoneInput(String(payload.phone ?? '')),
  };
}

export function validatePartnerRequestPayload(payload: PartnerRequestPayload): string | null {
  if (!payload.company_name) return "Kompaniya nomini kiriting";
  if (!PARTNER_INN_RE.test(payload.inn)) return "INN 9 xonali bo'lishi kerak";
  if (!PARTNER_MFO_RE.test(payload.mfo)) return "MFO 5 xonali bo'lishi kerak";
  if (!PARTNER_ACCOUNT_RE.test(payload.account_number)) return "Hisob raqam 20 xonali bo'lishi kerak";
  if (!PARTNER_PHONE_RE.test(payload.phone)) return "Telefon raqam +998901234567 formatida bo'lishi kerak";
  if (!payload.activity_type_id || !payload.region_id || !payload.district_id || !payload.mfy_id) {
    return "Faoliyat turi va manzilni to'liq tanlang";
  }
  return null;
}
