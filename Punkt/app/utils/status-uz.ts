import type { PunktTransferStatus } from '../services/api';

export function uzActiveStatus(status?: string | null): string {
  switch (status) {
    case 'active':
      return 'Faol';
    case 'inactive':
      return 'Nofaol';
    default:
      return status || '—';
  }
}

export function uzMarketplaceStatus(status?: string | null): string {
  switch (status) {
    case 'pending':
      return 'Kutilmoqda (jarayonda)';
    case 'cancelled':
      return 'Bekor qilingan';
    case 'delivered':
    case 'completed':
      return 'Yetkazib berilgan';
    default:
      return status || '—';
  }
}

export function uzAddressType(type?: string | null): string {
  switch (type) {
    case 'default':
      return 'Asosiy saqlangan manzil';
    case 'delivery_area':
      return "Foydalanuvchining tanlangan saqlangan manzili";
    case 'extra':
      return "Matnli (qo'lda kiritilgan) manzil";
    default:
      return type || '—';
  }
}

export function uzPunktAcceptanceStatus(status?: string | null): string {
  switch (status) {
    case 'none':
      return "Tuman aniqlanmagan, punkt oqimi yo'q";
    case 'no_punkt':
      return 'Shu tumanda faol punkt topilmagan';
    case 'inbox':
      return 'Punkt inboxida, qabul/rad kutilmoqda';
    case 'rejected':
      return 'Punkt rad etgan';
    case 'contragent_requests_created':
      return "Kontragent qator so'rovlari yaratilgan";
    default:
      return status || '—';
  }
}

export function uzContragentLineRequestStatus(status?: string | null): string {
  switch (status) {
    case 'pending':
      return "So'rov yuborilgan, javob kutilmoqda";
    case 'accepted':
      return 'Kontragent qabul qilgan';
    case 'preparing':
      return 'Tayyorlanmoqda';
    case 'delivered':
      return 'Qator yetkazilgan';
    case 'rejected':
      return 'Kontragent rad etgan';
    default:
      return status || '—';
  }
}

export function uzTransferStatus(status?: PunktTransferStatus | string | null): string {
  switch (status) {
    case 'sent':
      return "Birinchi punktdan ikkinchi punktga yuborilgan";
    case 'accepted_by_target':
      return 'Ikkinchi punkt qabul qilgan';
    case 'returned_to_source':
      return "Ikkinchi punkt birinchi punktga qaytargan";
    case 'received_by_source':
      return "Birinchi punkt qaytgan transferni qabul qilgan (yakun)";
    default:
      return String(status || '—');
  }
}
