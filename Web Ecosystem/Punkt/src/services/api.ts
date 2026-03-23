import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';
import type {
  AgentSelection,
  BalanceResponse,
  GetOrderContragentsResponse,
  KpiBalanceResponse,
  KpiSummaryResponse,
  KpiTransactionsResponse,
  LoginRequest,
  LoginResponse,
  Notification,
  NotificationsResponse,
  Order,
  OrderResponse,
  OrdersResponse,
  PointToPunktRequestsResponse,
  PunktSelection,
  TransactionsResponse,
  UnreadCountResponse,
} from '../types/api';

const TOKEN_KEY = '@punkt_token';
const PUNKT_KEY = '@punkt_data';

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getStoredPunkt(): string | null {
  return localStorage.getItem(PUNKT_KEY);
}

function setStoredPunkt(json: string): void {
  localStorage.setItem(PUNKT_KEY, json);
}

function removeStoredPunkt(): void {
  localStorage.removeItem(PUNKT_KEY);
}

export function getDeviceInfo(): {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  platform: string;
  os: string;
  browser: string;
  userAgent: string;
} {
  let deviceId = localStorage.getItem('@punkt_device_id');
  if (!deviceId) {
    deviceId = `web-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    localStorage.setItem('@punkt_device_id', deviceId);
  }
  return {
    deviceId,
    deviceName: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'Web',
    deviceType: 'web',
    platform: 'Web',
    os: typeof navigator !== 'undefined' ? navigator.platform : '',
    browser: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other') : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      removeStoredToken();
      removeStoredPunkt();
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  getToken: getStoredToken,

  async login(credentials: LoginRequest, deviceId?: string): Promise<LoginResponse> {
    const headers: Record<string, string> = {};
    if (deviceId) headers['X-Device-Id'] = deviceId;
    const { data } = await api.post<LoginResponse>('/punkts/login', credentials, { headers });
    if (data.success && data.data?.token && data.data?.punkt) {
      setStoredToken(data.data.token);
      setStoredPunkt(JSON.stringify(data.data.punkt));
    }
    return data;
  },

  logout() {
    removeStoredToken();
    removeStoredPunkt();
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
    const { data } = await api.post('/device-verification/punkt/request-code', payload);
    return data;
  },

  async verifyDevice(payload: {
    phone: string;
    deviceId: string;
    code: string;
    deviceName?: string;
    deviceType?: string;
    platform?: string;
    browser?: string;
    userAgent?: string;
  }) {
    const { data } = await api.post('/device-verification/punkt/verify', payload);
    return data;
  },

  async resendDeviceVerificationCode(phone: string, deviceId: string) {
    const { data } = await api.post('/device-verification/punkt/resend-code', { phone, deviceId });
    return data;
  },

  async passwordSetupStep1(payload: { phone: string }) {
    const { data } = await api.post('/punkts/password-setup/step1', payload);
    return data;
  },

  async passwordSetupStep2(payload: { phone: string; code: string }) {
    const { data } = await api.post('/punkts/password-setup/step2', payload);
    return data;
  },

  async passwordSetupStep3(payload: { phone: string; newPassword: string }) {
    const { data } = await api.post('/punkts/password-setup/step3', payload);
    return data;
  },

  async getTodayOrders(params?: { page?: number; limit?: number; status?: string; paymentStatus?: string; paymentMethod?: string; search?: string }): Promise<OrdersResponse> {
    const { data } = await api.get<OrdersResponse>('/punkt/orders/today', { params });
    return data;
  },

  async getOrdersHistory(params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string }): Promise<OrdersResponse> {
    const { data } = await api.get<OrdersResponse>('/punkt/orders/history', { params });
    return data;
  },

  async getOrderById(id: string): Promise<OrderResponse> {
    const { data } = await api.get<OrderResponse>(`/punkt/orders/${id}`);
    return data;
  },

  async confirmOrder(id: string) {
    const { data } = await api.post<OrderResponse>(`/punkt/orders/${id}/confirm`);
    return data;
  },

  async getPunktToPunktRequests(params?: { page?: number; limit?: number; status?: string }): Promise<PointToPunktRequestsResponse> {
    const { data } = await api.get<PointToPunktRequestsResponse>('/punkt/punkt-to-punkt-requests', { params });
    return data;
  },

  async respondToPunktRequest(orderId: string, payload: { response: 'accepted' | 'rejected' }) {
    const { data } = await api.post(`/punkt/punkt-to-punkt-requests/${orderId}/respond`, payload);
    return data;
  },

  async receiveFromPunkt(id: string) {
    const { data } = await api.post(`/punkt/orders/${id}/receive-from-punkt`);
    return data;
  },

  async requestToPunkt(id: string, payload: { toPunktId: string }) {
    const { data } = await api.post(`/punkt/orders/${id}/request-to-punkt`, payload);
    return data;
  },

  async requestToContragent(id: string, payload: { contragentId: string }) {
    const { data } = await api.post(`/punkt/orders/${id}/request-to-contragent`, payload);
    return data;
  },

  async sendToPunkt(id: string, payload: { toPunktId: string }) {
    const { data } = await api.post(`/punkt/orders/${id}/send-to-punkt`, payload);
    return data;
  },

  async receiveFromContragent(id: string) {
    const { data } = await api.post(`/punkt/orders/${id}/receive-from-contragent`);
    return data;
  },

  async assignOrderToAgent(id: string, payload: { agentId: string }) {
    const { data } = await api.post(`/punkt/orders/${id}/assign-to-agent`, payload);
    return data;
  },

  async getOrderContragents(id: string): Promise<GetOrderContragentsResponse> {
    const { data } = await api.get<GetOrderContragentsResponse>(`/punkt/orders/${id}/contragents`);
    return data;
  },

  async getKpiSummary(params?: { startDate?: string; endDate?: string; isPaid?: boolean }): Promise<KpiSummaryResponse> {
    const { data } = await api.get<KpiSummaryResponse>('/punkt/kpi/summary', { params });
    return data;
  },

  async getKpiBalance(date?: string): Promise<KpiBalanceResponse> {
    const { data } = await api.get<KpiBalanceResponse>('/punkt/kpi/balance', date ? { params: { date } } : {});
    return data;
  },

  async getKpiTransactions(params?: { startDate?: string; endDate?: string; isPaid?: boolean; page?: number; limit?: number }): Promise<KpiTransactionsResponse> {
    const { data } = await api.get<KpiTransactionsResponse>('/punkt/kpi/transactions', { params });
    return data;
  },

  async getNotifications(params?: { page?: number; limit?: number }): Promise<NotificationsResponse> {
    const { data } = await api.get<NotificationsResponse>('/punkts/notifications/list', { params });
    return data;
  },

  async getUnreadNotificationsCount(): Promise<UnreadCountResponse> {
    const { data } = await api.get<UnreadCountResponse>('/punkts/notifications/unread-count');
    return data;
  },

  async markNotificationAsRead(id: string) {
    const { data } = await api.post(`/punkts/notifications/${id}/read`);
    return data;
  },

  async markAllNotificationsAsRead() {
    const { data } = await api.post('/punkts/notifications/read-all');
    return data;
  },

  async getBalance(): Promise<BalanceResponse> {
    const { data } = await api.get<BalanceResponse>('/punkts/payments/balance');
    return data;
  },

  async getTransactions(params?: { type?: string; category?: string; startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<TransactionsResponse> {
    const { data } = await api.get<TransactionsResponse>('/punkts/payments/transactions', { params });
    return data;
  },

  async payZaklad(payload: { orderId: string; contragentRequestId: string; zakladPercentage: number }) {
    const { data } = await api.post('/punkts/payments/pay-zaklad', payload);
    return data;
  },

  async payFinalPayment(payload: { orderId: string; contragentRequestId: string }) {
    const { data } = await api.post('/punkts/payments/pay-final-payment', payload);
    return data;
  },

  async payProfit(payload: { orderId: string; contragentRequestId: string }) {
    const { data } = await api.post('/punkts/payments/pay-profit', payload);
    return data;
  },

  async getPunktsForSelection(params?: { status?: string; viloyat?: string; tuman?: string; search?: string; page?: number; limit?: number }) {
    const { data } = await api.get<{ success?: boolean; data?: PunktSelection[] }>('/punkts/selection', { params });
    return data;
  },

  async getAgentsForSelection(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const { data } = await api.get<{ success?: boolean; data?: AgentSelection[] }>('/agents/selection', { params });
    return data;
  },
};

export type { Order, Notification };
