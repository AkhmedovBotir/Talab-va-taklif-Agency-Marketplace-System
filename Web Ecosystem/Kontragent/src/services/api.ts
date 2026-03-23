import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';
import { getDeviceInfo } from '../utils/deviceId';
import type {
  Contragent,
  ContragentPayment,
  LoginRequest,
  LoginResponse,
  Notification,
  Order,
  OrderListResponse,
  OrderResponse,
} from '../types/api';

const TOKEN_KEY = '@auth_token';
const CONTRAGENT_KEY = '@contragent_data';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CONTRAGENT_KEY);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !config.url?.includes('/device-verification/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401) removeToken();
    return Promise.reject(error);
  }
);

function toError(err: unknown) {
  const ax = err as AxiosError<{ message?: string }>;
  return {
    status: ax.response?.status ?? 500,
    message: ax.response?.data?.message || (err instanceof Error ? err.message : 'Xatolik'),
    response: ax.response,
  };
}

export { getDeviceInfo };

export const apiService = {
  getToken,

  async login(credentials: LoginRequest, deviceId?: string): Promise<LoginResponse> {
    const info = getDeviceInfo();
    const headers: Record<string, string> = {};
    if (deviceId || info.deviceId) headers['X-Device-Id'] = deviceId || info.deviceId;
    const { data } = await api.post<LoginResponse>('/api/contragents/auth/login', credentials, { headers });
    if (data.success && data.data?.token && data.data?.contragent) {
      setToken(data.data.token);
      localStorage.setItem(CONTRAGENT_KEY, JSON.stringify(data.data.contragent));
    }
    return data;
  },

  logout: () => { removeToken(); },

  async getMe() {
    const { data } = await api.get<{ success: boolean; data: Contragent }>('/api/contragents/me');
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
    const { data } = await api.post('/api/device-verification/contragent/request-code', payload);
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
    const { data } = await api.post('/api/device-verification/contragent/verify', payload);
    return data;
  },

  async passwordSetupStep1(payload: { phone: string }) {
    const { data } = await api.post('/api/contragents/password-setup/step1', payload);
    return data;
  },

  async passwordSetupStep2(payload: { phone: string; code: string }) {
    const { data } = await api.post('/api/contragents/password-setup/step2', payload);
    return data;
  },

  async passwordSetupStep3(payload: { phone: string; newPassword: string }) {
    const { data } = await api.post('/api/contragents/password-setup/step3', payload);
    return data;
  },

  async getTodayOrders(params?: { page?: number; limit?: number; status?: string }) {
    const { data } = await api.get<OrderListResponse>('/api/contragent/today', { params });
    return data;
  },

  async getOrdersHistory(params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string }) {
    const { data } = await api.get<OrderListResponse>('/api/contragent/history', { params });
    return data;
  },

  async getContragentOrderById(id: string) {
    const { data } = await api.get<OrderResponse>(`/api/contragent/orders/${id}`);
    return data;
  },

  async respondToOrder(orderId: string, payload: { response: 'accepted' | 'rejected' }) {
    const { data } = await api.post<OrderResponse>(`/api/contragent/orders/${orderId}/respond`, payload);
    return data;
  },

  async deliverOrderToPunkt(orderId: string) {
    const { data } = await api.post<OrderResponse>(`/api/contragent/orders/${orderId}/deliver-to-punkt`);
    return data;
  },

  async getStatistics(params?: { startDate?: string; endDate?: string }) {
    const { data } = await api.get<{ success?: boolean; data?: { summary?: unknown; monthly?: unknown[] } }>(
      '/api/contragent/statistics',
      { params }
    );
    return data;
  },

  async getNotifications(params?: { page?: number; limit?: number }) {
    const { data } = await api.get<{ success: boolean; data: Notification[]; pagination?: { pages: number } }>(
      '/api/contragents/notifications/list',
      { params }
    );
    return data;
  },

  async getUnreadCount() {
    const { data } = await api.get<{ success: boolean; data: { unreadCount: number } }>(
      '/api/contragents/notifications/unread-count'
    );
    return data;
  },

  async markNotificationRead(id: string) {
    const { data } = await api.post(`/api/contragents/notifications/${id}/read`);
    return data;
  },

  async markAllNotificationsRead() {
    const { data } = await api.post('/api/contragents/notifications/read-all');
    return data;
  },

  async getPaidPayments(params?: { page?: number; limit?: number }) {
    const { data } = await api.get<{ success: boolean; data: ContragentPayment[]; totalPages?: number }>(
      '/api/contragents/payments/paid',
      { params }
    );
    return data;
  },

  async getUnpaidPayments(params?: { page?: number; limit?: number }) {
    const { data } = await api.get<{ success: boolean; data: ContragentPayment[]; totalPages?: number }>(
      '/api/contragents/payments/unpaid',
      { params }
    );
    return data;
  },

  async getPaymentStatistics() {
    const { data } = await api.get('/api/contragents/payments/statistics');
    return data;
  },

  async getPaymentById(id: string) {
    const { data } = await api.get<{ success: boolean; data: ContragentPayment }>(
      `/api/contragents/payments/${id}`
    );
    return data;
  },

  async getFinanceTransactions(params?: {
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { data } = await api.get<{ success?: boolean; data?: unknown[] }>(
      '/api/contragents/finance/transactions',
      { params }
    );
    return data;
  },

  async getZakladInfo() {
    const { data } = await api.get('/api/contragents/finance/zaklad-info');
    return data;
  },

  async getCategories(params?: { limit?: number; status?: string }) {
    const { data } = await api.get('/api/category/list', { params });
    return data;
  },

  async getSubcategories(params?: { parent: string; limit?: number; status?: string }) {
    const { data } = await api.get('/api/category/subcategory/list', { params });
    return data;
  },

  async getMyProducts(params?: { limit?: number }) {
    const { data } = await api.get('/api/product/my', { params });
    return data;
  },

  async getProductById(id: string) {
    const { data } = await api.get(`/api/product/${id}`);
    return data;
  },

  async createProduct(payload: {
    name: string;
    price: number;
    originalPrice: number;
    category: string;
    quantity: number;
    unit: 'dona' | 'litr' | 'kg';
    kpiBonusPercent: number;
    description?: unknown;
    images?: string[];
    subcategory?: string | null;
    unitSize?: number | null;
    length?: number | null;
    width?: number | null;
    weight?: number | null;
    status?: string;
  }) {
    const { data } = await api.post('/api/product/create', payload);
    return data;
  },

  async updateProduct(
    id: string,
    payload: {
      name?: string;
      price?: number;
      originalPrice?: number;
      category?: string;
      subcategory?: string | null;
      quantity?: number;
      unit?: 'dona' | 'litr' | 'kg';
      unitSize?: number | null;
      length?: number | null;
      width?: number | null;
      weight?: number | null;
      kpiBonusPercent?: number;
      description?: unknown;
      images?: string[];
      status?: string;
    }
  ) {
    const { data } = await api.put(`/api/product/${id}`, payload);
    return data;
  },

  async updateProductStatus(id: string, payload: { status: 'active' | 'inactive' | 'archived' }) {
    const { data } = await api.put(`/api/product/${id}/status`, payload);
    return data;
  },

  async deleteProduct(id: string) {
    const { data } = await api.delete(`/api/product/${id}`);
    return data;
  },

  async getDeliveryRegions() {
    const { data } = await api.get('/api/contragents/me/delivery-regions');
    return data;
  },

  async updateDeliveryRegions(payload: { deliveryRegions: Array<{ viloyat: string; tuman?: string | null }> }) {
    const { data } = await api.patch('/api/contragents/me/delivery-regions', payload);
    return data;
  },

  async updateLogo(payload: { logo: string }) {
    const { data } = await api.patch('/api/contragents/me/logo', payload);
    return data;
  },

  async getRegions(params?: { type?: string; parent?: string; limit?: number; status?: string }) {
    const { data } = await api.get('/api/regions', { params });
    return data;
  },
};
