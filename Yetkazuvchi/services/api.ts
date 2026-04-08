import { API_BASE_URL as API_BASE_FROM_CONFIG } from '../constants/api';

export function getApiBaseUrl(): string {
  return API_BASE_FROM_CONFIG.replace(/\/$/, '');
}
const API_BASE_URL = getApiBaseUrl();

/** Yetkazuvchi notification WebSocket (token query). */
export function getDeliveryNotificationsWebSocketUrl(token: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const wsBase = base.startsWith('https://')
    ? `wss://${base.slice('https://'.length)}`
    : base.startsWith('http://')
    ? `ws://${base.slice('http://'.length)}`
    : base;
  return `${wsBase}/delivery-providers/me/notifications/ws?token=${encodeURIComponent(token)}`;
}

// 401/403 da login ga qaytarish uchun handler (root layout da o‘rnatiladi)
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}
export function clearUnauthorizedHandler(): void {
  onUnauthorized = null;
}

// Types
export interface DeliveryProvider {
  _id: string;
  name: string;
  phone: string;
  contragent: Contragent;
  status: 'active' | 'inactive';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contragent {
  _id: string;
  name: string;
  phone: string;
  viloyat: Region;
  tuman: Region | null;
  mfy: Region | null;
  contragentLevel: string;
}

export interface Region {
  _id?: string;
  name: string;
  type: 'region' | 'district' | 'mfy';
  code: string;
}

export interface MarketplaceUser {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity?: number;
  productType: 'maxalla' | 'marketplace';
}

export interface OrderItem {
  // Backenddan keladigan product hozircha faqat ID (string),
  // lekin kelajakda to'liq Product bo'lishi ham mumkin
  product: string | Product;
  productType: 'maxalla' | 'marketplace';
  productModel?: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  kpiBonusPercent?: number | null;
}

export interface ContragentRequest {
  contragentId?: {
    _id: string;
    name: string;
  };
  itemIds?: number[];
  status?: string;
  deliveryProvider?: {
    _id: string;
    name: string;
    phone: string;
  };
  sentToDeliveryProviderAt?: string;
}

export interface Order {
  _id: string;
  id?: number;
  orderNumber?: string;
  local_shop_id?: number;
  user_id?: number;
  user?: MarketplaceUser;
  items: Array<OrderItem & {
    local_shop_product_id?: number;
    product_name?: string;
    unit?: string;
    unit_price?: number;
    line_total?: number;
  }>;
  totalPrice: number;
  total_amount?: number;
  status: string;
  deliveryViloyat?: Region;
  deliveryTuman?: Region | null;
  deliveryMfy?: Region | null;
  deliveryNote?: string;
  phoneNumber?: string;
  courier_accepted_at?: string | null;
  delivered_at?: string | null;
  payment_collected_at?: string | null;
  payment_transferred_to_shop_at?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    deliveryProvider: DeliveryProvider;
  };
}

export interface AuthSimpleResponse {
  success: boolean;
  message: string;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

export interface SetPasswordResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface OrdersResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Order[];
}

export interface OrdersListResponse {
  success: boolean;
  message?: string;
  data: Order[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  notes?: string;
}

export type DeliveryNotificationType =
  | 'info'
  | 'warning'
  | 'success'
  | 'error'
  | 'update'
  | 'announcement'
  | string;

export interface DeliveryNotification {
  id: number;
  title: string;
  message: string;
  type: DeliveryNotificationType;
  target_type: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationsListPayload {
  items: DeliveryNotification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UnreadCountPayload {
  unread_count: number;
}

// API Service
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Ruhsat xatolari (401, 403) bo‘lsa login ga qaytarish
      if (response.status === 401 || response.status === 403) {
        onUnauthorized?.();
        throw new Error('Ruhsat xatosi. Qayta kiring.');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as { message?: string }).message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      if (error.message === 'Ruhsat xatosi. Qayta kiring.') throw error;
      throw new Error(error.message || 'Network error');
    }
  }

  private async authenticatedRequest<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private normalizeDeliveryProvider(raw: any): DeliveryProvider {
    const firstName = raw?.first_name || '';
    const lastName = raw?.last_name || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    return {
      _id: String(raw?._id ?? raw?.id ?? ''),
      name: raw?.name || fullName || 'Yetkazib beruvchi',
      phone: raw?.phone || '',
      contragent: raw?.contragent || {
        _id: String(raw?.local_shop_id ?? ''),
        name: 'Noma\'lum kontragent',
        phone: '',
        viloyat: { name: 'Noma\'lum', type: 'region', code: '' },
        tuman: null,
        mfy: null,
        contragentLevel: '',
      },
      status: raw?.status || 'active',
      notes: raw?.notes ?? raw?.note ?? null,
      createdAt: raw?.createdAt ?? raw?.created_at ?? new Date().toISOString(),
      updatedAt: raw?.updatedAt ?? raw?.updated_at ?? new Date().toISOString(),
    };
  }

  private normalizeOrder(raw: any): Order {
    const items = Array.isArray(raw?.items) ? raw.items : [];
    return {
      _id: String(raw?._id ?? raw?.id ?? ''),
      id: raw?.id,
      orderNumber: raw?.orderNumber ?? `#${raw?.id ?? ''}`,
      local_shop_id: raw?.local_shop_id,
      user_id: raw?.user_id,
      user: raw?.user,
      items,
      totalPrice: Number(raw?.totalPrice ?? raw?.total_amount ?? 0),
      total_amount: raw?.total_amount,
      status: raw?.status ?? 'approved',
      deliveryViloyat: raw?.deliveryViloyat,
      deliveryTuman: raw?.deliveryTuman ?? null,
      deliveryMfy: raw?.deliveryMfy ?? null,
      deliveryNote: raw?.deliveryNote ?? '',
      phoneNumber: raw?.phoneNumber ?? '',
      courier_accepted_at: raw?.courier_accepted_at ?? null,
      delivered_at: raw?.delivered_at ?? null,
      payment_collected_at: raw?.payment_collected_at ?? null,
      payment_transferred_to_shop_at: raw?.payment_transferred_to_shop_at ?? null,
      createdAt: raw?.createdAt ?? raw?.created_at ?? new Date().toISOString(),
      updatedAt: raw?.updatedAt ?? raw?.updated_at ?? new Date().toISOString(),
    };
  }

  private normalizeOrdersList(payload: any): OrdersListResponse {
    const list = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.data?.items)
      ? payload.data.items
      : Array.isArray(payload?.items)
      ? payload.items
      : [];
    const normalized = list.map((item: any) => this.normalizeOrder(item));
    const page = Number(payload?.page ?? payload?.data?.page ?? 1);
    const resolvedLimit = payload?.limit ?? payload?.data?.limit ?? normalized.length;
    const limit = Number(resolvedLimit || 10);
    const total = Number(payload?.total ?? payload?.data?.total ?? normalized.length);
    const totalPages = Number(payload?.totalPages ?? payload?.data?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit))));

    return {
      success: payload?.success ?? true,
      message: payload?.message,
      data: normalized,
      page,
      limit,
      total,
      totalPages,
    };
  }

  // Delivery Provider Authentication
  async sendCode(phone: string): Promise<AuthSimpleResponse> {
    return this.request<void>('/delivery-providers/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }) as Promise<AuthSimpleResponse>;
  }

  async verifyCode(data: VerifyCodeRequest): Promise<AuthSimpleResponse> {
    return this.request<void>('/delivery-providers/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify(data),
    }) as Promise<AuthSimpleResponse>;
  }

  async resendCode(phone: string): Promise<AuthSimpleResponse> {
    return this.request<void>('/delivery-providers/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }) as Promise<AuthSimpleResponse>;
  }

  async setPassword(phone: string, password: string): Promise<SetPasswordResponse> {
    return this.request<SetPasswordResponse['data']>('/delivery-providers/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }) as Promise<SetPasswordResponse>;
  }

  async login(phone: string, password: string): Promise<LoginResponse> {
    return this.request<any>('/delivery-providers/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }).then((payload) => {
      const token = payload?.data?.token;
      const rawProvider = payload?.data?.deliveryProvider ?? payload?.data?.delivery_provider;

      if (!token || !rawProvider) {
        throw new Error(payload?.message || 'Login javobi noto\'g\'ri formatda');
      }

      return {
        success: true,
        message: payload?.message || 'Muvaffaqiyatli login qilindi',
        data: {
          token,
          deliveryProvider: this.normalizeDeliveryProvider(rawProvider),
        },
      };
    });
  }

  // Profile Management
  async getMyProfile(token: string): Promise<ApiResponse<DeliveryProvider>> {
    return this.authenticatedRequest<any>(
      '/delivery-providers/me/profile',
      token,
      { method: 'GET' }
    ).then((payload) => {
      const raw = payload?.data?.deliveryProvider ?? payload?.data?.delivery_provider ?? payload?.data;
      return {
        ...payload,
        success: payload?.success ?? true,
        data: raw ? this.normalizeDeliveryProvider(raw) : undefined,
      };
    });
  }

  async updateMyProfile(
    token: string,
    data: UpdateProfileRequest
  ): Promise<ApiResponse<DeliveryProvider>> {
    return this.authenticatedRequest<any>(
      '/delivery-providers/me/profile',
      token,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ).then((payload) => {
      const raw = payload?.data?.deliveryProvider ?? payload?.data?.delivery_provider ?? payload?.data;
      return {
        ...payload,
        success: payload?.success ?? true,
        data: raw ? this.normalizeDeliveryProvider(raw) : undefined,
      };
    });
  }

  // Password Management
  async changePassword(
    token: string,
    data: ChangePasswordRequest
  ): Promise<ApiResponse<void>> {
    return this.authenticatedRequest<void>(
      '/delivery-providers/me/change-password',
      token,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Orders Management
  async getTodayOrders(
    token: string,
    page = 1,
    limit = 10
  ): Promise<OrdersListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(page));
    queryParams.append('limit', String(limit));
    const endpoint = `/delivery-providers/me/orders/today?${queryParams.toString()}`;
    return this.authenticatedRequest<any>(endpoint, token, { method: 'GET' }).then((payload) =>
      this.normalizeOrdersList(payload)
    );
  }

  async getHistoryOrders(
    token: string,
    page = 1,
    limit = 10
  ): Promise<OrdersListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(page));
    queryParams.append('limit', String(limit));
    const endpoint = `/delivery-providers/me/orders/history?${queryParams.toString()}`;
    return this.authenticatedRequest<any>(endpoint, token, { method: 'GET' }).then((payload) =>
      this.normalizeOrdersList(payload)
    );
  }

  async getOrderById(
    token: string,
    orderId: string
  ): Promise<ApiResponse<Order>> {
    return this.authenticatedRequest<any>(
      `/delivery-providers/me/orders/${orderId}`,
      token,
      { method: 'GET' }
    ).then((payload) => {
      const raw = payload?.data?.order ?? payload?.data ?? payload;
      return {
        ...payload,
        success: payload?.success ?? true,
        data: raw ? this.normalizeOrder(raw) : undefined,
      };
    });
  }

  async acceptOrder(token: string, orderId: string): Promise<ApiResponse<Order>> {
    return this.authenticatedRequest<any>(
      `/delivery-providers/me/orders/${orderId}/accept`,
      token,
      { method: 'PATCH' }
    ).then((payload) => {
      const raw = payload?.data?.order ?? payload?.data;
      return { ...payload, success: payload?.success ?? true, data: raw ? this.normalizeOrder(raw) : undefined };
    });
  }

  async deliverOrder(token: string, orderId: string): Promise<ApiResponse<Order>> {
    return this.authenticatedRequest<any>(
      `/delivery-providers/me/orders/${orderId}/deliver`,
      token,
      { method: 'PATCH' }
    ).then((payload) => {
      const raw = payload?.data?.order ?? payload?.data;
      return { ...payload, success: payload?.success ?? true, data: raw ? this.normalizeOrder(raw) : undefined };
    });
  }

  async collectPayment(token: string, orderId: string): Promise<ApiResponse<Order>> {
    return this.authenticatedRequest<any>(
      `/delivery-providers/me/orders/${orderId}/collect-payment`,
      token,
      { method: 'PATCH' }
    ).then((payload) => {
      const raw = payload?.data?.order ?? payload?.data;
      return { ...payload, success: payload?.success ?? true, data: raw ? this.normalizeOrder(raw) : undefined };
    });
  }

  async transferPaymentToShop(token: string, orderId: string): Promise<ApiResponse<Order>> {
    return this.authenticatedRequest<any>(
      `/delivery-providers/me/orders/${orderId}/transfer-payment-to-shop`,
      token,
      { method: 'PATCH' }
    ).then((payload) => {
      const raw = payload?.data?.order ?? payload?.data;
      return { ...payload, success: payload?.success ?? true, data: raw ? this.normalizeOrder(raw) : undefined };
    });
  }

  private normalizeNotification(raw: any): DeliveryNotification {
    return {
      id: Number(raw?.id),
      title: String(raw?.title ?? ''),
      message: String(raw?.message ?? ''),
      type: raw?.type ?? 'info',
      target_type: raw?.target_type ?? 'deliveryproviders',
      is_read: Boolean(raw?.is_read),
      read_at: raw?.read_at ?? null,
      created_at: raw?.created_at ?? new Date().toISOString(),
      updated_at: raw?.updated_at ?? raw?.created_at ?? new Date().toISOString(),
    };
  }

  async getNotifications(
    token: string,
    page = 1,
    limit = 10
  ): Promise<{ success: boolean; message?: string; data: NotificationsListPayload }> {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    return this.authenticatedRequest<any>(
      `/delivery-providers/me/notifications?${q.toString()}`,
      token,
      { method: 'GET' }
    ).then((payload) => {
      const d = payload?.data ?? {};
      const items = Array.isArray(d.items) ? d.items.map((x: any) => this.normalizeNotification(x)) : [];
      return {
        success: payload?.success ?? true,
        message: payload?.message,
        data: {
          items,
          total: Number(d.total ?? items.length),
          unread_count: Number(d.unread_count ?? 0),
          page: Number(d.page ?? page),
          limit: Number(d.limit ?? limit),
          total_pages: Number(d.total_pages ?? 1),
        },
      };
    });
  }

  async getNotificationsUnreadCount(token: string): Promise<{ success: boolean; data: UnreadCountPayload }> {
    return this.authenticatedRequest<any>(
      '/delivery-providers/me/notifications/unread-count',
      token,
      { method: 'GET' }
    ).then((payload) => ({
      success: payload?.success ?? true,
      data: {
        unread_count: Number(payload?.data?.unread_count ?? 0),
      },
    }));
  }

  async markNotificationRead(token: string, id: number): Promise<ApiResponse<void>> {
    return this.authenticatedRequest<void>(
      `/delivery-providers/me/notifications/${id}/read`,
      token,
      { method: 'PATCH' }
    );
  }

  async markAllNotificationsRead(token: string): Promise<ApiResponse<void>> {
    return this.authenticatedRequest<void>(
      '/delivery-providers/me/notifications/read-all',
      token,
      { method: 'PATCH' }
    );
  }
}

export const apiService = new ApiService();
