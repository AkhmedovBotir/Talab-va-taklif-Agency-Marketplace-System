// API Configuration
import { Platform } from 'react-native';

/** Web: backend on same machine. Native: LAN IP for phone/emulator. */
const API_HOST_WEB = 'http://localhost:8081';
const API_HOST_NATIVE = 'http://192.168.1.6:8081';
const API_VERSION_PREFIX = '/api/v1';

export function getApiBaseUrl(): string {
  const host = Platform.OS === 'web' ? API_HOST_WEB : API_HOST_NATIVE;
  return `${host}${API_VERSION_PREFIX}`;
}

/** `false` bo‘lsa, bildirishnoma endpointlariga HTTP yuborilmaydi */
export const NOTIFICATIONS_API_ENABLED = false;

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  // Agent Auth (docs: Agent Auth API)
  AGENT_AUTH_SEND_CODE: '/agents/auth/send-code',
  AGENT_AUTH_VERIFY_CODE: '/agents/auth/verify-code',
  AGENT_AUTH_RESEND_CODE: '/agents/auth/resend-code',
  AGENT_AUTH_SET_PASSWORD: '/agents/auth/set-password',
  AGENT_AUTH_LOGIN: '/agents/auth/login',
  AGENT_ME_PROFILE: '/agents/me/profile',
  AGENT_ME_CHANGE_PASSWORD: '/agents/me/change-password',
  // Agent marketplace buyurtmalar (docs: Agent buyurtmalar API)
  AGENT_ME_ORDERS_ACTIVE: '/agents/me/orders/active',
  AGENT_ME_ORDERS_HISTORY: '/agents/me/orders/history',
  AGENT_ME_ORDER_BY_ID: (id: string) => `/agents/me/orders/${id}`,
  AGENT_ME_ORDER_PAYMENT_TO_PUNKT: (id: string) => `/agents/me/orders/${id}/payment-to-punkt`,
  AGENT_ME_ORDER_DELIVER: (id: string) => `/agents/me/orders/${id}/deliver`,
  // KPI
  AGENT_KPI_SUMMARY: '/agent/kpi/summary',
  AGENT_KPI_TRANSACTIONS: '/agent/kpi/transactions',
  AGENT_KPI_BALANCE: '/agent/kpi/balance',
  AGENT_KPI_DAILY_REPORT: '/agent/kpi/reports/daily',
  // Notifications
  AGENT_NOTIFICATIONS: '/agents/notifications/list',
  AGENT_NOTIFICATIONS_UNREAD_COUNT: '/agents/notifications/unread-count',
  AGENT_NOTIFICATION_READ: (id: string) => `/agents/notifications/${id}/read`,
  AGENT_NOTIFICATIONS_READ_ALL: '/agents/notifications/read-all',
  // Agent Payments
  AGENT_ORDERS_FOR_PAYMENT: '/agents/payments/orders-for-payment',
  AGENT_PAY_PUNKT: (orderId: string) => `/agents/payments/pay-to-punkt/${orderId}`,
  AGENT_PAYMENT_TRANSACTIONS: '/agents/payments/transactions',
  AGENT_PAYMENT_BALANCE: '/agents/payments/balance',
} as const;
