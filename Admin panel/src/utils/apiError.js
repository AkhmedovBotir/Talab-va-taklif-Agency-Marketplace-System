export class ApiHttpError extends Error {
  constructor(message, status, data = null) {
    super(message || 'So‘rovda xatolik');
    this.name = 'ApiHttpError';
    this.status = status;
    this.data = data;
  }
}

export const isApiHttpError = (error) => error instanceof ApiHttpError;

export const getApiErrorStatus = (error) => (isApiHttpError(error) ? error.status : null);

export const isForbiddenError = (error) => getApiErrorStatus(error) === 403;

export const isNotFoundError = (error) => getApiErrorStatus(error) === 404;

/** API xatosini sahifa holatiga aylantiradi; snackbar faqat kutilmagan xatolar uchun */
export const resolvePageError = (error, fallbackMessage = 'Ma’lumotni yuklab bo‘lmadi') => {
  const status = getApiErrorStatus(error);
  if (status === 403 || status === 404) {
    return {
      status,
      message: error?.message || (status === 403 ? "Ruxsat berilmagan" : 'Topilmadi'),
    };
  }
  return null;
};
