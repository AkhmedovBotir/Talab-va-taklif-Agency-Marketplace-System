// API Configuration

export const API_BASE_URL = 'http://192.168.1.7:5000/api';

export const API_ENDPOINTS = {
  AGENT_LOGIN: '/agents/login',
  // Password Setup
  PASSWORD_SETUP_STEP1: '/agents/password-setup/step1',
  PASSWORD_SETUP_STEP2: '/agents/password-setup/step2',
  PASSWORD_SETUP_STEP3: '/agents/password-setup/step3',
  // Device Verification - Agent
  DEVICE_VERIFICATION_AGENT_REQUEST_CODE: '/device-verification/agent/request-code',
  DEVICE_VERIFICATION_AGENT_VERIFY: '/device-verification/agent/verify',
  DEVICE_VERIFICATION_AGENT_RESEND_CODE: '/device-verification/agent/resend-code',
  // Agent Orders
  AGENT_ORDERS: '/agent/orders',
  AGENT_ORDERS_TODAY: '/agent/orders/today',
  AGENT_ORDERS_HISTORY: '/agent/orders/history',
  AGENT_ORDER_BY_ID: (id: string) => `/agent/orders/${id}`,
  AGENT_CONFIRM_ORDER: (id: string) => `/agent/orders/${id}/confirm`,
  AGENT_MARK_DELIVERED: (id: string) => `/agent/orders/${id}/delivered`,
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
  // Agent Profile
  AGENT_PROFILE: '/agents/profile/me',
} as const;
