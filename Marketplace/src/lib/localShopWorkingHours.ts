import type { LocalShopWorkingHour } from '../types';

export type LocalShopHoursState = 'open' | 'closed' | 'day_off' | 'unknown';

export type LocalShopHoursStatus = {
  state: LocalShopHoursState;
  badgeLabel: string;
  todayLabel: string;
  hint?: string;
};

const WEEKDAY_UZ: Record<number, string> = {
  1: 'Dushanba',
  2: 'Seshanba',
  3: 'Chorshanba',
  4: 'Payshanba',
  5: 'Juma',
  6: 'Shanba',
  7: 'Yakshanba',
};

/** JS Date.getDay(): 0=yakshanba → backend 7 */
export function dateToBackendWeekday(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

export function weekdayNameUz(weekday: number): string {
  return WEEKDAY_UZ[weekday] ?? '';
}

function parseTimeToMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function normalizeLocalShopWorkingHours(raw: unknown): LocalShopWorkingHour[] {
  if (!Array.isArray(raw)) return [];
  const out: LocalShopWorkingHour[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const weekday = Number((row as any).weekday);
    if (!Number.isFinite(weekday) || weekday < 1 || weekday > 7) continue;
    const isOff = Boolean((row as any).is_off);
    const openTime =
      (row as any).open_time != null && String((row as any).open_time).trim()
        ? String((row as any).open_time).trim()
        : undefined;
    const closeTime =
      (row as any).close_time != null && String((row as any).close_time).trim()
        ? String((row as any).close_time).trim()
        : undefined;
    out.push({
      weekday,
      is_off: isOff,
      open_time: isOff ? undefined : openTime,
      close_time: isOff ? undefined : closeTime,
    });
  }
  return out.sort((a, b) => a.weekday - b.weekday);
}

export function getLocalShopHoursStatus(
  workingHours: LocalShopWorkingHour[] | undefined,
  now: Date = new Date()
): LocalShopHoursStatus {
  if (!workingHours?.length) {
    return {
      state: 'unknown',
      badgeLabel: 'Ish vaqti',
      todayLabel: 'Bugungi ish vaqti kiritilmagan',
    };
  }

  const weekday = dateToBackendWeekday(now);
  const today = workingHours.find((w) => w.weekday === weekday);
  const dayName = weekdayNameUz(weekday);

  if (!today) {
    return {
      state: 'unknown',
      badgeLabel: 'Ish vaqti',
      todayLabel: `${dayName}: jadval yo'q`,
    };
  }

  if (today.is_off) {
    return {
      state: 'day_off',
      badgeLabel: 'Dam olish kuni',
      todayLabel: `Bugun (${dayName}): dam olish`,
      hint: 'Do\'kon bugun ishlamaydi',
    };
  }

  const open = today.open_time;
  const close = today.close_time;
  if (!open || !close) {
    return {
      state: 'unknown',
      badgeLabel: 'Ish vaqti',
      todayLabel: `Bugun (${dayName}): vaqt ko'rsatilmagan`,
    };
  }

  const openMin = parseTimeToMinutes(open);
  const closeMin = parseTimeToMinutes(close);
  if (openMin == null || closeMin == null || closeMin <= openMin) {
    return {
      state: 'unknown',
      badgeLabel: 'Ish vaqti',
      todayLabel: `Bugun: ${open} – ${close}`,
    };
  }

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isOpen = nowMin >= openMin && nowMin < closeMin;

  if (isOpen) {
    return {
      state: 'open',
      badgeLabel: 'Hozir ochiq',
      todayLabel: `Bugun: ${open} – ${close}`,
      hint: `${close} gacha ochiq`,
    };
  }

  if (nowMin < openMin) {
    return {
      state: 'closed',
      badgeLabel: 'Hozir yopiq',
      todayLabel: `Bugun: ${open} – ${close}`,
      hint: `${open} da ochiladi`,
    };
  }

  return {
    state: 'closed',
    badgeLabel: 'Hozir yopiq',
    todayLabel: `Bugun: ${open} – ${close}`,
    hint: 'Bugungi ish vaqti tugagan',
  };
}
