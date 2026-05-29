// API Configuration

/** Production API (web va native bir xil). */
const API_ORIGIN = 'https://api.ttsa.uz';
const API_VERSION_PREFIX = '/api/v1';

export function getApiBaseUrl(): string {
  return `${API_ORIGIN}${API_VERSION_PREFIX}`;
}

/** `false` bo‘lsa, bildirishnoma endpointlariga HTTP yuborilmaydi */
export const NOTIFICATIONS_API_ENABLED = true;

/** WebSocket: `GET .../agents/me/notifications/ws?token=` */
export function getNotificationsWebSocketUrl(token: string): string {
  const http = getApiBaseUrl();
  const wsRoot =
    http.startsWith('https://') ? http.replace('https://', 'wss://') : http.replace('http://', 'ws://');
  return `${wsRoot}/agents/me/notifications/ws?token=${encodeURIComponent(token)}`;
}

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
  AGENT_ME_ORDERS_ANALYTICS: '/agents/me/orders/analytics',
  AGENT_ME_ORDER_BY_ID: (id: string) => `/agents/me/orders/${id}`,
  AGENT_ME_ORDER_PAYMENT_TO_PUNKT: (id: string) => `/agents/me/orders/${id}/payment-to-punkt`,
  AGENT_ME_ORDER_DELIVER: (id: string) => `/agents/me/orders/${id}/deliver`,
  // Agent KPI (docs: Agent KPI API) — faqat GET
  AGENT_ME_KPI_TODAY: '/agents/me/kpi/today',
  AGENT_ME_KPI_HISTORY: '/agents/me/kpi/history',
  // Agent notifications (docs: Agent Notifications API)
  AGENT_ME_NOTIFICATIONS: '/agents/me/notifications',
  AGENT_ME_NOTIFICATIONS_UNREAD_COUNT: '/agents/me/notifications/unread-count',
  AGENT_ME_NOTIFICATION_READ: (id: number | string) => `/agents/me/notifications/${id}/read`,
  AGENT_ME_NOTIFICATIONS_READ_ALL: '/agents/me/notifications/read-all',
  // Agent Payments
  AGENT_ORDERS_FOR_PAYMENT: '/agents/payments/orders-for-payment',
  AGENT_PAY_PUNKT: (orderId: string) => `/agents/payments/pay-to-punkt/${orderId}`,
  AGENT_PAYMENT_TRANSACTIONS: '/agents/payments/transactions',
  AGENT_PAYMENT_BALANCE: '/agents/payments/balance',
} as const;
