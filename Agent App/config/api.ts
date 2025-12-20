// API Configuration

export const API_BASE_URL = 'https://api.ttsa.uz/api';

export const API_ENDPOINTS = {
  AGENT_LOGIN: '/agents/login',
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
  // Agent Finance - MFY
  MFY_DAILY_REPORT: '/agent-finance/mfy/daily-report',
  MFY_PENDING_PAYMENTS: '/agent-finance/mfy/pending-payments',
  MFY_COLLECT_PAYMENT: (id: string) => `/agent-finance/mfy/collect-payment/${id}`,
  MFY_SUBMIT_TO_DISTRICT: '/agent-finance/mfy/submit-to-district',
  MFY_STATISTICS: '/agent-finance/mfy/statistics',
  // Agent Finance - Tuman
  DISTRICT_REPORT: '/agent-finance/district/report',
  DISTRICT_SUBMISSIONS: '/agent-finance/district/submissions',
  DISTRICT_CONFIRM_SUBMISSION: (id: string) => `/agent-finance/district/confirm-submission/${id}`,
  DISTRICT_SUBMIT_TO_PROVINCE: '/agent-finance/district/submit-to-province',
  DISTRICT_STATISTICS: '/agent-finance/district/statistics',
  // Agent Finance - Viloyat
  PROVINCE_REPORT: '/agent-finance/province/report',
  PROVINCE_SUBMISSIONS: '/agent-finance/province/submissions',
  PROVINCE_CONFIRM_SUBMISSION: (id: string) => `/agent-finance/province/confirm-submission/${id}`,
  PROVINCE_SUBMIT_TO_FINANCE: '/agent-finance/province/submit-to-finance',
  PROVINCE_STATISTICS: '/agent-finance/province/statistics',
} as const;
