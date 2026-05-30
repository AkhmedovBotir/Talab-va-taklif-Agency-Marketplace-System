/** API xato javoblarini foydalanuvchi uchun matnga aylantiradi */
export function formatApiError(error: unknown): string {
  const err = error as {
    message?: string;
    errors?: Record<string, string[] | string>;
    status?: number;
  };

  if (err.errors && typeof err.errors === 'object') {
    const lines = Object.entries(err.errors).flatMap(([field, val]) => {
      const msgs = Array.isArray(val) ? val : [String(val)];
      return msgs.map((m) => (field === 'message' ? m : `${field}: ${m}`));
    });
    if (lines.length > 0) return lines.join('\n');
  }

  if (typeof err.message === 'string' && err.message.trim()) {
    return err.message.trim();
  }

  if (err.status === 401) return 'Avtorizatsiya talab qilinadi. Qaytadan kiring.';
  if (err.status === 403) return 'Bu amal uchun ruxsat yo‘q.';
  if (err.status === 404) return 'Maʼlumot topilmadi.';
  if (err.status === 400) return 'So‘rov maʼlumotlari noto‘g‘ri.';

  return 'So‘rovda xatolik yuz berdi. Qayta urinib ko‘ring.';
}
