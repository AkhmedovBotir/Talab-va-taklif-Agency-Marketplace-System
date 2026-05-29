/** Raqamni bo'shliq bilan ajratilgan qator (so'm kiritish uchun). */
export function formatSomDigits(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '';
  const s = String(Math.floor(n));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Kiritilgan qatordan butun musbat son (cheksiz emas, max bilan cheklash mumkin). */
export function parseSomDigitsFromInput(raw: string): number | null {
  const d = raw.replace(/\D/g, '');
  if (d === '') return null;
  const n = Number(d);
  return Number.isFinite(n) ? n : null;
}
