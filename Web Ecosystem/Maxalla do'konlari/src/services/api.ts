/**
 * Maxalla Kontragent API Service (Web)
 * Base Path: /api/maxalla-contragents
 */

import { API_BASE_URL } from '../config';
import { clearAuthStorage, emitForceLogout } from '../contexts/authStorage';

const REGIONS_BASE_URL = `${API_BASE_URL}/api`;

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PasswordSetupStep1Request {
  phone: string;
}

export interface PasswordSetupStep2Request {
  phone: string;
  code: string;
}

export interface PasswordSetupStep3Request {
  phone: string;
  newPassword: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  platform?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
}

export interface DeviceVerificationRequestCodeRequest {
  phone: string;
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  platform?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
}

export interface DeviceVerificationVerifyRequest {
  phone: string;
  deviceId: string;
  code: string;
  deviceName?: string;
  deviceType?: string;
  platform?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
}

export interface DeviceVerificationResendCodeRequest {
  phone: string;
  deviceId: string;
}

export interface WorkingHours {
  open: string | null;
  close: string | null;
}

export interface ServiceAreas {
  tuman: Region | null;
  mfys: Region[];
}

export interface Contragent {
  _id: string;
  name: string;
  inn: string;
  phone: string;
  logo: string | null;
  viloyat: Region;
  tuman: Region;
  mfy: Region;
  activityType: ContragentType;
  contragentLevel: 'mfy';
  workingHours?: WorkingHours;
  serviceAreas?: ServiceAreas;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Region {
  _id: string;
  name: string;
  type: 'region' | 'district' | 'mfy';
  code: string;
  parent?: Region;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegionsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Region[];
}

export interface ContragentType {
  _id: string;
  name: string;
  icon: string;
}

export interface DeliveryProvider {
  _id: string;
  name: string;
  phone: string;
  contragent: string;
  status: 'active' | 'inactive';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryProviderRequest {
  name: string;
  phone: string;
  password: string;
  notes?: string;
}

export interface UpdateDeliveryProviderRequest {
  name?: string;
  phone?: string;
  password?: string;
  status?: 'active' | 'inactive';
  notes?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
}

export interface BaseProduct {
  _id: string;
  name: string;
  description?: string;
  images?: string[];
  category: Category;
  subcategory?: Subcategory;
  unit: string;
  unitSize: number;
  status: 'active' | 'inactive';
}

export interface MaxallaProduct {
  _id: string;
  baseProduct: BaseProduct;
  contragent: { _id: string; name: string; inn: string; phone: string };
  quantity: number;
  price: number;
  originalPrice: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaxallaProductRequest {
  baseProductId: string;
  quantity: number;
  price: number;
  originalPrice: number;
  status?: 'active' | 'inactive';
}

export interface UpdateMaxallaProductRequest {
  quantity?: number;
  price?: number;
  originalPrice?: number;
  status?: 'active' | 'inactive';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface OrderPaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: T[];
}

export interface OrderUser {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface OrderProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice: number;
  quantity: number;
  unit: string;
  unitSize: number;
  category: { _id: string; name: string; slug: string };
  subcategory: { _id: string; name: string; slug: string };
  productType: 'maxalla' | 'tuman';
}

export interface OrderItem {
  product: OrderProduct | string;
  quantity: number;
  price: number;
  originalPrice: number;
  productType: 'maxalla' | 'tuman';
}

export interface ContragentRequest {
  contragentId: { _id: string; name: string; phone: string };
  itemIds: number[];
  status: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
  requestedAt: string;
  respondedAt: string | null;
  deliveryProvider: { _id: string; name: string; phone: string } | null;
  sentToDeliveryProviderAt: string | null;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: OrderUser;
  items: OrderItem[];
  totalPrice: number;
  totalOriginalPrice: number;
  itemCount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryViloyat: Region;
  deliveryTuman: Region | null;
  deliveryMfy: Region | null;
  deliveryNote: string;
  phoneNumber: string;
  contragentRequests: ContragentRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface SendOrderToDeliveryProviderRequest {
  deliveryProviderId: string;
}

export interface RespondToOrderRequestResponse {
  _id: string;
  orderNumber: string;
  user: OrderUser;
  items: OrderItem[];
  status: string;
  contragentRequests: ContragentRequest[];
}

export interface LoginResponse {
  token: string;
  contragent: Contragent;
  device: { deviceId: string; deviceName?: string; isPrimary: boolean };
}

export interface DeviceVerificationResponse {
  deviceId: string;
  deviceName?: string;
  isPrimary: boolean;
  isVerified: boolean;
}

class ApiError extends Error {
  status?: number;
  data?: any;
  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function parseJsonSafely(response: Response): Promise<any | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isPermissionError(status: number, data: any): boolean {
  if (status === 401) return true;
  if (status !== 403) return false;
  const msg = (data?.message || data?.error || data?.detail || '').toString();
  return /permission|forbidden|unauthorized|ruxsat|huquq|yo['’]?q|mumkin emas/i.test(msg);
}

function forceLoginRedirect(reason: string) {
  if (typeof window === 'undefined') return;
  try {
    emitForceLogout(reason);
    clearAuthStorage();
  } catch {}

  const path = window.location?.pathname || '';
  if (path.startsWith('/login')) return;
  try {
    window.location.assign('/login');
  } catch {
    window.location.href = '/login';
  }
}

function handleAuthProblems(status: number, data: any) {
  if (isPermissionError(status, data)) {
    forceLoginRedirect(`auth-error:${status}`);
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...options.headers };
  try {
    const response = await fetch(url, { ...options, headers });
    const data = await parseJsonSafely(response);
    if (!response.ok) {
      handleAuthProblems(response.status, data);
      throw new ApiError((data?.message as string) || 'API xatosi yuz berdi', response.status, data);
    }
    return (data || { success: true, message: '', data: null }) as ApiResponse<T>;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Tarmoq xatosi yuz berdi', 0, error);
  }
}

async function fetchApiWithAuth<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers };
  try {
    const response = await fetch(url, { ...options, headers });
    const data = await parseJsonSafely(response);
    if (!response.ok) {
      handleAuthProblems(response.status, data);
      throw new ApiError((data?.message as string) || 'API xatosi yuz berdi', response.status, data);
    }
    return (data || { success: true, message: '', data: null }) as ApiResponse<T>;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Tarmoq xatosi yuz berdi', 0, error);
  }
}

export const apiService = {
  async passwordSetupStep1(request: PasswordSetupStep1Request) {
    return fetchApi('/api/maxalla-contragents/password-setup/step1', { method: 'POST', body: JSON.stringify(request) });
  },
  async passwordSetupStep2(request: PasswordSetupStep2Request) {
    return fetchApi('/api/maxalla-contragents/password-setup/step2', { method: 'POST', body: JSON.stringify(request) });
  },
  async passwordSetupStep3(request: PasswordSetupStep3Request) {
    return fetchApi('/api/maxalla-contragents/password-setup/step3', { method: 'POST', body: JSON.stringify(request) });
  },
  async login(request: LoginRequest, deviceInfo: DeviceInfo) {
    return fetchApi<LoginResponse>('/api/maxalla-contragents/login', {
      method: 'POST',
      headers: {
        'x-device-id': deviceInfo.deviceId,
        ...(deviceInfo.deviceName && { 'x-device-name': deviceInfo.deviceName }),
        ...(deviceInfo.deviceType && { 'x-device-type': deviceInfo.deviceType }),
      },
      body: JSON.stringify(request),
    });
  },
  async requestDeviceVerificationCode(request: DeviceVerificationRequestCodeRequest) {
    return fetchApi('/api/maxalla-contragents/device-verification/request-code', { method: 'POST', body: JSON.stringify(request) });
  },
  async verifyDevice(request: DeviceVerificationVerifyRequest) {
    return fetchApi<DeviceVerificationResponse>('/api/maxalla-contragents/device-verification/verify', { method: 'POST', body: JSON.stringify(request) });
  },
  async resendDeviceVerificationCode(request: DeviceVerificationResendCodeRequest) {
    return fetchApi('/api/maxalla-contragents/device-verification/resend-code', { method: 'POST', body: JSON.stringify(request) });
  },
  async getMyProfile(token: string) {
    return fetchApiWithAuth<Contragent>('/api/maxalla-contragents/me', token, { method: 'GET' });
  },
  async updateWorkingHours(token: string, workingHours: { open?: string; close?: string }) {
    return fetchApiWithAuth('/api/maxalla-contragents/me/working-hours', token, { method: 'PATCH', body: JSON.stringify(workingHours) });
  },
  async updateServiceAreas(token: string, serviceAreas: { tuman?: string; mfys?: string[] }) {
    return fetchApiWithAuth('/api/maxalla-contragents/me/service-areas', token, { method: 'PATCH', body: JSON.stringify(serviceAreas) });
  },
  async logout(token: string, deviceId?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (deviceId) (headers as Record<string, string>)['x-device-id'] = deviceId;
    return fetchApiWithAuth('/api/maxalla-contragents/logout', token, { method: 'POST', headers });
  },
  async getDeliveryProviders(token: string, status?: 'active' | 'inactive') {
    const query = status ? `?status=${status}` : '';
    return fetchApiWithAuth<DeliveryProvider[]>(`/api/maxalla-contragents/delivery-providers${query}`, token, { method: 'GET' });
  },
  async createDeliveryProvider(token: string, data: CreateDeliveryProviderRequest) {
    return fetchApiWithAuth<DeliveryProvider>('/api/maxalla-contragents/delivery-providers', token, { method: 'POST', body: JSON.stringify(data) });
  },
  async updateDeliveryProvider(token: string, id: string, data: UpdateDeliveryProviderRequest) {
    return fetchApiWithAuth<DeliveryProvider>(`/api/maxalla-contragents/delivery-providers/${id}`, token, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteDeliveryProvider(token: string, id: string) {
    return fetchApiWithAuth(`/api/maxalla-contragents/delivery-providers/${id}`, token, { method: 'DELETE' });
  },
  async getRegions(params?: { type?: 'region' | 'district' | 'mfy'; parent?: string; limit?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.parent) queryParams.append('parent', params.parent);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.search) queryParams.append('search', params.search);
    const q = queryParams.toString();
    const res = await fetch(`${REGIONS_BASE_URL}/regions${q ? `?${q}` : ''}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    const data = await parseJsonSafely(res);
    if (!res.ok) {
      handleAuthProblems(res.status, data);
      throw new ApiError((data?.message as string) || 'API xatosi', res.status, data);
    }
    return data as RegionsResponse;
  },
  async getAvailableBaseProducts(token: string, params?: { search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    const q = queryParams.toString();
    return fetchApiWithAuth<any>(`/api/maxalla-contragents/products/available${q ? `?${q}` : ''}`, token, { method: 'GET' }) as unknown as Promise<PaginatedResponse<BaseProduct>>;
  },
  async getMaxallaProducts(token: string) {
    return fetchApiWithAuth<any>('/api/maxalla-contragents/products', token, { method: 'GET' }) as unknown as Promise<PaginatedResponse<MaxallaProduct>>;
  },
  async createMaxallaProduct(token: string, data: CreateMaxallaProductRequest) {
    return fetchApiWithAuth<MaxallaProduct>('/api/maxalla-contragents/products', token, { method: 'POST', body: JSON.stringify(data) });
  },
  async updateMaxallaProduct(token: string, id: string, data: UpdateMaxallaProductRequest) {
    return fetchApiWithAuth<MaxallaProduct>(`/api/maxalla-contragents/products/${id}`, token, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteMaxallaProduct(token: string, id: string) {
    return fetchApiWithAuth(`/api/maxalla-contragents/products/${id}`, token, { method: 'DELETE' });
  },
  async getMaxallaProductById(token: string, id: string) {
    return fetchApiWithAuth<MaxallaProduct>(`/api/maxalla-contragents/products/${id}`, token, { method: 'GET' });
  },
  async getOrders(token: string, params?: { status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const q = queryParams.toString();
    return fetchApiWithAuth<any>(`/api/maxalla-contragents/orders${q ? `?${q}` : ''}`, token, { method: 'GET' }) as unknown as Promise<OrderPaginatedResponse<Order>>;
  },
  async getOrderById(token: string, orderId: string) {
    return fetchApiWithAuth<Order>(`/api/maxalla-contragents/orders/${orderId}`, token, { method: 'GET' });
  },
  async respondToOrderRequest(token: string, orderId: string, response: 'accepted' | 'rejected') {
    return fetchApiWithAuth<RespondToOrderRequestResponse>(`/api/maxalla-contragents/orders/${orderId}/respond`, token, { method: 'POST', body: JSON.stringify({ response }) });
  },
  async sendOrderToDeliveryProvider(token: string, orderId: string, data: SendOrderToDeliveryProviderRequest) {
    return fetchApiWithAuth(`/api/maxalla-contragents/orders/${orderId}/send-to-delivery-provider`, token, { method: 'POST', body: JSON.stringify(data) });
  },
};
