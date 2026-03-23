// API Service – localStorage (web), Agent API bilan bir xil
import axios, { AxiosError } from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type {
  AgentProfileResponse,
  ApiError,
  ConfirmOrderResponse,
  GetKPIParams,
  GetOrdersHistoryParams,
  GetOrdersParams,
  GetPaymentTransactionsParams,
  KPISummaryResponse,
  KPITransactionsResponse,
  LoginRequest,
  LoginResponse,
  MarkDeliveredResponse,
  OrderResponse,
  OrdersForPaymentResponse,
  OrdersResponse,
  PayToPunktResponse,
  PaymentBalanceResponse,
  PaymentTransactionsResponse,
} from '../types/api';

const TOKEN_KEY = '@agent_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) removeToken();
    return Promise.reject(error);
  }
);

const deviceInfo = () => ({
  deviceId: `web-${Math.random().toString(36).slice(2)}-${Date.now()}`,
  deviceName: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 50)}` : 'Web',
  deviceType: 'web',
  platform: 'web',
  os: typeof navigator !== 'undefined' ? navigator.platform : '',
  browser: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other') : '',
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
});

export const apiService = {
  async login(credentials: LoginRequest, info?: ReturnType<typeof deviceInfo>): Promise<LoginResponse> {
    const headers: Record<string, string> = {};
    const d = info || deviceInfo();
    headers['X-Device-Id'] = d.deviceId;
    if (d.deviceName) headers['X-Device-Name'] = d.deviceName;
    if (d.deviceType) headers['X-Device-Type'] = d.deviceType;
    if (d.platform) headers['X-Platform'] = d.platform;
    if (d.os) headers['X-OS'] = d.os;
    if (d.browser) headers['X-Browser'] = d.browser;
    if (d.userAgent) headers['X-User-Agent'] = d.userAgent;

    const { data } = await api.post<LoginResponse>(API_ENDPOINTS.AGENT_LOGIN, credentials, { headers });
    if (data.success && data.data.token) setToken(data.data.token);
    return data;
  },

  logout: () => { removeToken(); },

  getToken,

  async getAgentProfile(): Promise<AgentProfileResponse> {
    const { data } = await api.get<AgentProfileResponse>(API_ENDPOINTS.AGENT_PROFILE);
    return data;
  },

  async requestDeviceVerificationCode(payload: {
    phone: string;
    deviceId: string;
    deviceName?: string;
    deviceType?: string;
    platform?: string;
    os?: string;
    browser?: string;
    userAgent?: string;
  }) {
    const { data } = await api.post(API_ENDPOINTS.DEVICE_VERIFICATION_AGENT_REQUEST_CODE, payload);
    return data;
  },

  async verifyDevice(payload: {
    phone: string;
    deviceId: string;
    code: string;
    deviceName?: string;
    deviceType?: string;
    platform?: string;
    os?: string;
    browser?: string;
    userAgent?: string;
  }) {
    const { data } = await api.post(API_ENDPOINTS.DEVICE_VERIFICATION_AGENT_VERIFY, payload);
    return data;
  },

  async resendDeviceVerificationCode(phone: string, deviceId: string) {
    const { data } = await api.post(API_ENDPOINTS.DEVICE_VERIFICATION_AGENT_RESEND_CODE, { phone, deviceId });
    return data;
  },

  async passwordSetupStep1(phone: string) {
    const { data } = await api.post<{ success: boolean; message: string }>(API_ENDPOINTS.PASSWORD_SETUP_STEP1, { phone });
    return data;
  },

  async passwordSetupStep2(phone: string, code: string) {
    const { data } = await api.post<{ success: boolean; message: string }>(API_ENDPOINTS.PASSWORD_SETUP_STEP2, { phone, code });
    return data;
  },

  async passwordSetupStep3(phone: string, newPassword: string) {
    const { data } = await api.post<{ success: boolean; message: string }>(API_ENDPOINTS.PASSWORD_SETUP_STEP3, { phone, newPassword });
    return data;
  },

  async getOrders(params?: GetOrdersParams): Promise<OrdersResponse> {
    const { data } = await api.get<OrdersResponse>(API_ENDPOINTS.AGENT_ORDERS, { params });
    return data;
  },

  async getTodayOrders(params?: GetOrdersParams): Promise<OrdersResponse> {
    const { data } = await api.get<OrdersResponse>(API_ENDPOINTS.AGENT_ORDERS_TODAY, { params });
    return data;
  },

  async getOrdersHistory(params?: GetOrdersHistoryParams): Promise<OrdersResponse> {
    const { data } = await api.get<OrdersResponse>(API_ENDPOINTS.AGENT_ORDERS_HISTORY, { params });
    return data;
  },

  async getOrderById(id: string): Promise<OrderResponse> {
    const { data } = await api.get<OrderResponse>(API_ENDPOINTS.AGENT_ORDER_BY_ID(id));
    return data;
  },

  async confirmOrder(id: string): Promise<ConfirmOrderResponse> {
    const { data } = await api.post<ConfirmOrderResponse>(API_ENDPOINTS.AGENT_CONFIRM_ORDER(id));
    return data;
  },

  async markOrderAsDelivered(id: string): Promise<MarkDeliveredResponse> {
    const { data } = await api.post<MarkDeliveredResponse>(API_ENDPOINTS.AGENT_MARK_DELIVERED(id));
    return data;
  },

  async getKPISummary(params?: GetKPIParams): Promise<KPISummaryResponse> {
    const { data } = await api.get<KPISummaryResponse>(API_ENDPOINTS.AGENT_KPI_SUMMARY, { params });
    return data;
  },

  async getKPITransactions(params?: GetKPIParams): Promise<KPITransactionsResponse> {
    const { data } = await api.get<KPITransactionsResponse>(API_ENDPOINTS.AGENT_KPI_TRANSACTIONS, { params });
    return data;
  },

  async getNotifications(params?: { page?: number; limit?: number }) {
    const { data } = await api.get(API_ENDPOINTS.AGENT_NOTIFICATIONS, { params });
    return data;
  },

  async getUnreadNotificationsCount() {
    const { data } = await api.get(API_ENDPOINTS.AGENT_NOTIFICATIONS_UNREAD_COUNT);
    return data;
  },

  async markNotificationRead(id: string) {
    const { data } = await api.post(API_ENDPOINTS.AGENT_NOTIFICATION_READ(id));
    return data;
  },

  async markAllNotificationsRead() {
    const { data } = await api.post(API_ENDPOINTS.AGENT_NOTIFICATIONS_READ_ALL);
    return data;
  },

  async getOrdersForPayment(): Promise<OrdersForPaymentResponse> {
    const { data } = await api.get<OrdersForPaymentResponse>(API_ENDPOINTS.AGENT_ORDERS_FOR_PAYMENT);
    return data;
  },

  async payToPunkt(orderId: string): Promise<PayToPunktResponse> {
    const { data } = await api.post<PayToPunktResponse>(API_ENDPOINTS.AGENT_PAY_PUNKT(orderId));
    return data;
  },

  async getPaymentTransactions(params?: GetPaymentTransactionsParams): Promise<PaymentTransactionsResponse> {
    const { data } = await api.get<PaymentTransactionsResponse>(API_ENDPOINTS.AGENT_PAYMENT_TRANSACTIONS, { params });
    return data;
  },

  async getPaymentBalance(): Promise<PaymentBalanceResponse> {
    const { data } = await api.get<PaymentBalanceResponse>(API_ENDPOINTS.AGENT_PAYMENT_BALANCE);
    return data;
  },
};

export function getDeviceInfo() {
  return deviceInfo();
}
