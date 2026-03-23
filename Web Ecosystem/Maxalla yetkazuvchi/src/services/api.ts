function getApiBaseUrl(): string {
  const env = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL;
  if (env && typeof env === 'string') return env.replace(/\/$/, '');
  return 'http://localhost:5000';
}
const API_BASE_URL = getApiBaseUrl();

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}
export function clearUnauthorizedHandler(): void {
  onUnauthorized = null;
}

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
  product: string | Product;
  productType: 'maxalla' | 'marketplace';
  productModel?: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  kpiBonusPercent?: number | null;
}

export interface ContragentRequest {
  contragentId?: { _id: string; name: string };
  itemIds?: number[];
  status?: string;
  deliveryProvider?: { _id: string; name: string; phone: string };
  sentToDeliveryProviderAt?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: MarketplaceUser;
  items: OrderItem[];
  totalPrice: number;
  totalOriginalPrice?: number;
  totalKpiPrice?: number;
  itemCount?: number;
  orderType?: string;
  status: 'requested_to_contragent' | 'accepted_by_contragent' | 'confirmed_by_customer';
  paymentStatus?: string;
  paymentMethod?: string;
  deliveryViloyat: Region;
  deliveryTuman: Region | null;
  deliveryMfy: Region | null;
  deliveryNote: string;
  phoneNumber: string;
  contragentRequests: ContragentRequest[];
  customerConfirmed: boolean;
  customerConfirmedAt: string | null;
  deliveredAt: string | null;
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

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  notes?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers as object) },
    };

    try {
      const response = await fetch(url, config);
      if (response.status === 401 || response.status === 403) {
        onUnauthorized?.();
        throw new Error('Ruhsat xatosi. Qayta kiring.');
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Ruhsat xatosi. Qayta kiring.') throw error;
      throw new Error(error instanceof Error ? error.message : 'Network error');
    }
  }

  private async authenticatedRequest<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      headers: { ...(options.headers as object), Authorization: `Bearer ${token}` },
    });
  }

  async login(phone: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse['data']>('/api/delivery-providers/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }) as Promise<LoginResponse>;
  }

  async getMyProfile(token: string): Promise<ApiResponse<DeliveryProvider>> {
    return this.authenticatedRequest<DeliveryProvider>('/api/delivery-providers/me', token, { method: 'GET' });
  }

  async updateMyProfile(token: string, data: UpdateProfileRequest): Promise<ApiResponse<DeliveryProvider>> {
    return this.authenticatedRequest<DeliveryProvider>('/api/delivery-providers/me', token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(token: string, data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return this.authenticatedRequest<void>('/api/delivery-providers/change-password', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders(
    token: string,
    filters?: { status?: string; page?: number; limit?: number }
  ): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    const queryString = queryParams.toString();
    const endpoint = `/api/delivery-providers/orders${queryString ? `?${queryString}` : ''}`;
    return this.authenticatedRequest<OrdersResponse['data']>(endpoint, token, { method: 'GET' }) as Promise<OrdersResponse>;
  }

  async getOrderById(token: string, orderId: string): Promise<ApiResponse<Order>> {
    return this.authenticatedRequest<Order>(`/api/delivery-providers/orders/${orderId}`, token, { method: 'GET' });
  }

  async markOrderAsDelivered(token: string, orderId: string): Promise<ApiResponse<Order>> {
    return this.authenticatedRequest<Order>(
      `/api/delivery-providers/orders/${orderId}/mark-delivered`,
      token,
      { method: 'POST' }
    );
  }
}

export const apiService = new ApiService();
