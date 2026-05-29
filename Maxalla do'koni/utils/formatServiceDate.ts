const UZ_MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentyabr',
  'oktyabr',
  'noyabr',
  'dekabr',
] as const;

/** `1-may, 2026, 14:30` — oy nomlari o'zbekcha */
export function formatServiceDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const day = d.getDate();
  const month = UZ_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');

  return `${day}-${month}, ${year}, ${hh}:${mm}`;
}

/** @deprecated — formatServiceDateTime ishlating */
export function formatServiceDate(iso?: string | null): string {
  return formatServiceDateTime(iso);
}

export function billingTypeLabel(type?: string): string {
  if (type === 'monthly') return 'Oylik obuna';
  if (type === 'free') return 'Bepul muddat';
  return type || '—';
}

export function formatFreeMonthsUz(months?: number): string {
  if (months == null || months <= 0) return '';
  return `${months} oy`;
}

/** Tugash sanasigacha qolgan kunlar (mahalliy kalendar bo'yicha) */
export function getCalendarDaysUntilEnd(periodEndAt?: string | null): number | null {
  if (!periodEndAt) return null;
  const end = new Date(periodEndAt);
  if (Number.isNaN(end.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endDay.getTime() - today.getTime()) / 86_400_000);
}

/**
 * 0 — oddiy
 * 1 — 3 kun qoldi (och qizil)
 * 2 — 2 kun qoldi (qizilroq)
 * 3 — 1 kun qoldi (to'liq qizil, oq matn)
 */
export type PeriodEndUrgency = 0 | 1 | 2 | 3;

export function getPeriodEndUrgency(
  periodEndAt?: string | null,
  canOperate = true
): PeriodEndUrgency {
  if (!canOperate || !periodEndAt) return 0;
  const days = getCalendarDaysUntilEnd(periodEndAt);
  if (days == null || days < 0) return 0;
  if (days > 3) return 0;
  if (days === 3) return 1;
  if (days === 2) return 2;
  if (days === 1 || days === 0) return 3;
  return 0;
}

export function getPeriodEndUrgencyMessage(
  periodEndAt?: string | null,
  urgency: PeriodEndUrgency = 0
): string | null {
  if (urgency === 0 || !periodEndAt) return null;
  const days = getCalendarDaysUntilEnd(periodEndAt);
  if (days == null) return null;
  const n = days <= 0 ? 1 : days;
  if (n === 1) return 'Xizmat muddati tugashiga 1 kun qoldi';
  return `Xizmat muddati tugashiga ${n} kun qoldi`;
}
