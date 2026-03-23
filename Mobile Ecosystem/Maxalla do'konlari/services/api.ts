/**
 * Maxalla Kontragent API Service
 * Base Path: /api/maxalla-contragents
 */

const API_BASE_URL = 'http://192.168.1.5:5000';
const REGIONS_BASE_URL = 'http://192.168.1.5:5000/api';

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
  ipAddress?: string;
  location?: string;
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
  ipAddress?: string;
  location?: string;
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
  ipAddress?: string;
  location?: string;
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

export interface DeliveryProviderPasswordSetupStep1Request {
  providerId: string;
  phone: string;
}

export interface DeliveryProviderPasswordSetupStep2Request {
  providerId: string;
  phone: string;
  code: string;
}

export interface DeliveryProviderPasswordSetupStep3Request {
  providerId: string;
  phone: string;
  newPassword: string;
  sessionToken: string;
}

export interface DeliveryProviderLoginRequest {
  providerId: string;
  phone: string;
  password: string;
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
  contragent: {
    _id: string;
    name: string;
    inn: string;
    phone: string;
  };
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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
  images?: string[];
  price: number;
  originalPrice: number;
  quantity: number;
  unit: string;
  unitSize: number;
  category: {
    _id: string;
    name: string;
    slug: string;
    status?: string;
  };
  subcategory: {
    _id: string;
    name: string;
    slug: string;
    status?: string;
  };
  contragent?: {
    _id: string;
    name: string;
    phone: string;
    viloyat: { name: string; type: string; code: string };
    tuman: { name: string; type: string; code: string };
    mfy: { name: string; type: string; code: string };
  };
  productType: 'maxalla' | 'tuman';
}

export interface OrderItem {
  product: OrderProduct | string;
  quantity: number;
  price: number;
  originalPrice: number;
  productType: 'maxalla' | 'tuman';
  productModel?: string;
  kpiBonusPercent?: number | null;
}

export interface ContragentRequest {
  contragentId: {
    _id: string;
    name: string;
    phone: string;
    viloyat?: { name: string; type: string; code: string };
    tuman?: { name: string; type: string; code: string };
    mfy?: { name: string; type: string; code: string };
  };
  itemIds: number[];
  status: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
  requestedAt: string;
  respondedAt: string | null;
  deliveredToPunktAt: string | null;
  deliveryProvider: {
    _id: string;
    name: string;
    phone: string;
  } | null;
  sentToDeliveryProviderAt: string | null;
}

export interface Region {
  _id: string;
  name: string;
  type: string;
  code: string;
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

export interface SendOrderToDeliveryProviderResponse {
  orderId: string;
  orderNumber: string;
  contragentRequest: ContragentRequest;
  deliveryProvider: {
    _id: string;
    name: string;
    phone: string;
  };
  sentAt: string;
}

export interface RespondToOrderRequestRequest {
  response: 'accepted' | 'rejected';
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
  device: {
    deviceId: string;
    deviceName?: string;
    isPrimary: boolean;
  };
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

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'API xatosi yuz berdi',
        response.status,
        data
      );
    }

    return data;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network error
    throw new ApiError(
      error.message || 'Tarmoq xatosi yuz berdi',
      0,
      error
    );
  }
}

async function fetchApiWithAuth<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(
        data.message || 'API xatosi yuz berdi',
        response.status,
        data
      );
    }

    return data;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network error
    throw new ApiError(
      error.message || 'Tarmoq xatosi yuz berdi',
      0,
      error
    );
  }
}

export const apiService = {
  /**
   * Password Setup Step 1: Request SMS Code
   * POST /api/maxalla-contragents/password-setup/step1
   */
  async passwordSetupStep1(request: PasswordSetupStep1Request): Promise<ApiResponse> {
    try {
      return await fetchApi('/api/maxalla-contragents/password-setup/step1', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Password Setup Step 2: Verify SMS Code
   * POST /api/maxalla-contragents/password-setup/step2
   */
  async passwordSetupStep2(request: PasswordSetupStep2Request): Promise<ApiResponse> {
    try {
      return await fetchApi('/api/maxalla-contragents/password-setup/step2', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Password Setup Step 3: Set Password
   * POST /api/maxalla-contragents/password-setup/step3
   */
  async passwordSetupStep3(request: PasswordSetupStep3Request): Promise<ApiResponse> {
    try {
      return await fetchApi('/api/maxalla-contragents/password-setup/step3', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Login
   * POST /api/maxalla-contragents/login
   */
  async login(request: LoginRequest, deviceInfo: DeviceInfo): Promise<ApiResponse<LoginResponse>> {
    try {
      return await fetchApi<LoginResponse>('/api/maxalla-contragents/login', {
        method: 'POST',
        headers: {
          'x-device-id': deviceInfo.deviceId,
          ...(deviceInfo.deviceName && { 'x-device-name': deviceInfo.deviceName }),
          ...(deviceInfo.deviceType && { 'x-device-type': deviceInfo.deviceType }),
        },
        body: JSON.stringify(request),
      });
    } catch (error: any) {
      // Check if device verification is required
      if (error.status === 403 && error.data?.requiresDeviceVerification) {
        throw error;
      }
      throw error;
    }
  },

  /**
   * Device Verification: Request Code
   * POST /api/maxalla-contragents/device-verification/request-code
   */
  async requestDeviceVerificationCode(
    request: DeviceVerificationRequestCodeRequest
  ): Promise<ApiResponse<{ phone: string; deviceId: string; expiresIn: number }>> {
    try {
      return await fetchApi('/api/maxalla-contragents/device-verification/request-code', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Device Verification: Verify Device
   * POST /api/maxalla-contragents/device-verification/verify
   */
  async verifyDevice(
    request: DeviceVerificationVerifyRequest
  ): Promise<ApiResponse<DeviceVerificationResponse>> {
    try {
      return await fetchApi<DeviceVerificationResponse>(
        '/api/maxalla-contragents/device-verification/verify',
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Device Verification: Resend Code
   * POST /api/maxalla-contragents/device-verification/resend-code
   */
  async resendDeviceVerificationCode(
    request: DeviceVerificationResendCodeRequest
  ): Promise<ApiResponse<{ phone: string; deviceId: string; expiresIn: number }>> {
    try {
      return await fetchApi('/api/maxalla-contragents/device-verification/resend-code', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get My Profile
   * GET /api/maxalla-contragents/me
   */
  async getMyProfile(token: string): Promise<ApiResponse<Contragent>> {
    try {
      return await fetchApiWithAuth<Contragent>('/api/maxalla-contragents/me', token, {
        method: 'GET',
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update My Profile
   * PUT /api/maxalla-contragents/me
   */
  async updateMyProfile(
    token: string,
    profileData: {
      name?: string;
      phone?: string;
      inn?: string;
      viloyat?: string;
      tuman?: string;
      mfy?: string;
      logo?: string;
      activityType?: string;
    }
  ): Promise<ApiResponse<Contragent>> {
    try {
      return await fetchApiWithAuth<Contragent>('/api/maxalla-contragents/me', token, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update Working Hours
   * PATCH /api/maxalla-contragents/me/working-hours
   */
  async updateWorkingHours(
    token: string,
    workingHours: {
      open?: string;
      close?: string;
    }
  ): Promise<ApiResponse<{ workingHours: WorkingHours }>> {
    try {
      return await fetchApiWithAuth<{ workingHours: WorkingHours }>(
        '/api/maxalla-contragents/me/working-hours',
        token,
        {
          method: 'PATCH',
          body: JSON.stringify(workingHours),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update Service Areas
   * PATCH /api/maxalla-contragents/me/service-areas
   */
  async updateServiceAreas(
    token: string,
    serviceAreas: {
      tuman?: string;
      mfys?: string[];
    }
  ): Promise<ApiResponse<{ serviceAreas: ServiceAreas }>> {
    try {
      return await fetchApiWithAuth<{ serviceAreas: ServiceAreas }>(
        '/api/maxalla-contragents/me/service-areas',
        token,
        {
          method: 'PATCH',
          body: JSON.stringify(serviceAreas),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Logout
   * POST /api/maxalla-contragents/logout
   */
  async logout(token: string, deviceId?: string): Promise<ApiResponse> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (deviceId) {
        headers['x-device-id'] = deviceId;
      }

      return await fetchApiWithAuth<{}>(
        '/api/maxalla-contragents/logout',
        token,
        {
          method: 'POST',
          headers,
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Create Delivery Provider
   * POST /api/maxalla-contragents/delivery-providers
   */
  async createDeliveryProvider(
    token: string,
    data: CreateDeliveryProviderRequest
  ): Promise<ApiResponse<DeliveryProvider>> {
    try {
      return await fetchApiWithAuth<DeliveryProvider>(
        '/api/maxalla-contragents/delivery-providers',
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get All Delivery Providers
   * GET /api/maxalla-contragents/delivery-providers
   */
  async getDeliveryProviders(
    token: string,
    status?: 'active' | 'inactive'
  ): Promise<ApiResponse<DeliveryProvider[]>> {
    try {
      const query = status ? `?status=${status}` : '';
      return await fetchApiWithAuth<DeliveryProvider[]>(
        `/api/maxalla-contragents/delivery-providers${query}`,
        token,
        {
          method: 'GET',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Delivery Provider by ID
   * GET /api/maxalla-contragents/delivery-providers/:id
   */
  async getDeliveryProviderById(
    token: string,
    id: string
  ): Promise<ApiResponse<DeliveryProvider>> {
    try {
      return await fetchApiWithAuth<DeliveryProvider>(
        `/api/maxalla-contragents/delivery-providers/${id}`,
        token,
        {
          method: 'GET',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update Delivery Provider
   * PUT /api/maxalla-contragents/delivery-providers/:id
   */
  async updateDeliveryProvider(
    token: string,
    id: string,
    data: UpdateDeliveryProviderRequest
  ): Promise<ApiResponse<DeliveryProvider>> {
    try {
      return await fetchApiWithAuth<DeliveryProvider>(
        `/api/maxalla-contragents/delivery-providers/${id}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete Delivery Provider
   * DELETE /api/maxalla-contragents/delivery-providers/:id
   */
  async deleteDeliveryProvider(
    token: string,
    id: string
  ): Promise<ApiResponse> {
    try {
      return await fetchApiWithAuth(
        `/api/maxalla-contragents/delivery-providers/${id}`,
        token,
        {
          method: 'DELETE',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delivery Provider Password Setup Step 1
   * POST /api/maxalla-contragents/delivery-providers/password-setup/step1
   */
  async deliveryProviderPasswordSetupStep1(
    token: string,
    data: DeliveryProviderPasswordSetupStep1Request
  ): Promise<ApiResponse> {
    try {
      return await fetchApiWithAuth(
        '/api/maxalla-contragents/delivery-providers/password-setup/step1',
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delivery Provider Password Setup Step 2
   * POST /api/maxalla-contragents/delivery-providers/password-setup/step2
   */
  async deliveryProviderPasswordSetupStep2(
    token: string,
    data: DeliveryProviderPasswordSetupStep2Request
  ): Promise<ApiResponse<{ sessionToken: string }>> {
    try {
      return await fetchApiWithAuth<{ sessionToken: string }>(
        '/api/maxalla-contragents/delivery-providers/password-setup/step2',
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delivery Provider Password Setup Step 3
   * POST /api/maxalla-contragents/delivery-providers/password-setup/step3
   */
  async deliveryProviderPasswordSetupStep3(
    token: string,
    data: DeliveryProviderPasswordSetupStep3Request
  ): Promise<ApiResponse<DeliveryProvider>> {
    try {
      return await fetchApiWithAuth<DeliveryProvider>(
        '/api/maxalla-contragents/delivery-providers/password-setup/step3',
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delivery Provider Login
   * POST /api/maxalla-contragents/delivery-providers/login
   */
  async deliveryProviderLogin(
    token: string,
    data: DeliveryProviderLoginRequest
  ): Promise<ApiResponse<{ token: string; deliveryProvider: DeliveryProvider }>> {
    try {
      return await fetchApiWithAuth<{ token: string; deliveryProvider: DeliveryProvider }>(
        '/api/maxalla-contragents/delivery-providers/login',
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Regions
   * GET /api/regions
   */
  async getRegions(params?: {
    type?: 'region' | 'district' | 'mfy';
    parent?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<RegionsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.type) queryParams.append('type', params.type);
      if (params?.parent) queryParams.append('parent', params.parent);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      const endpoint = `/regions${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(`${REGIONS_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(
          data.message || 'API xatosi yuz berdi',
          response.status,
          data
        );
      }

      // Regions API returns RegionsResponse directly
      return data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Available Base Products
   * GET /api/maxalla-contragents/products/available
   */
  async getAvailableBaseProducts(
    token: string,
    params?: {
      category?: string;
      subcategory?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<BaseProduct>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.subcategory) queryParams.append('subcategory', params.subcategory);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = `/api/maxalla-contragents/products/available${queryString ? `?${queryString}` : ''}`;
      
      // API returns PaginatedResponse directly, not wrapped in ApiResponse
      // fetchApiWithAuth returns the data directly from the API response
      const response = await fetchApiWithAuth<any>(endpoint, token, {
        method: 'GET',
      });
      // API returns { success, data, pagination } directly
      return response as unknown as PaginatedResponse<BaseProduct>;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Create Maxalla Product
   * POST /api/maxalla-contragents/products
   */
  async createMaxallaProduct(
    token: string,
    data: CreateMaxallaProductRequest
  ): Promise<ApiResponse<MaxallaProduct>> {
    try {
      return await fetchApiWithAuth<MaxallaProduct>(
        '/api/maxalla-contragents/products',
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get All Maxalla Products
   * GET /api/maxalla-contragents/products
   */
  async getMaxallaProducts(
    token: string,
    params?: {
      status?: 'active' | 'inactive';
      category?: string;
      subcategory?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<MaxallaProduct>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.subcategory) queryParams.append('subcategory', params.subcategory);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = `/api/maxalla-contragents/products${queryString ? `?${queryString}` : ''}`;
      
      // API returns PaginatedResponse directly, not wrapped in ApiResponse
      // fetchApiWithAuth returns the data directly from the API response
      const response = await fetchApiWithAuth<any>(endpoint, token, {
        method: 'GET',
      });
      // API returns { success, data, pagination } directly
      return response as unknown as PaginatedResponse<MaxallaProduct>;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Maxalla Product by ID
   * GET /api/maxalla-contragents/products/:id
   */
  async getMaxallaProductById(
    token: string,
    id: string
  ): Promise<ApiResponse<MaxallaProduct>> {
    try {
      return await fetchApiWithAuth<MaxallaProduct>(
        `/api/maxalla-contragents/products/${id}`,
        token,
        {
          method: 'GET',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update Maxalla Product
   * PUT /api/maxalla-contragents/products/:id
   */
  async updateMaxallaProduct(
    token: string,
    id: string,
    data: UpdateMaxallaProductRequest
  ): Promise<ApiResponse<MaxallaProduct>> {
    try {
      return await fetchApiWithAuth<MaxallaProduct>(
        `/api/maxalla-contragents/products/${id}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete Maxalla Product
   * DELETE /api/maxalla-contragents/products/:id
   */
  async deleteMaxallaProduct(
    token: string,
    id: string
  ): Promise<ApiResponse> {
    try {
      return await fetchApiWithAuth(
        `/api/maxalla-contragents/products/${id}`,
        token,
        {
          method: 'DELETE',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Orders
   * GET /api/maxalla-contragents/orders
   */
  async getOrders(
    token: string,
    params?: {
      status?: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
      page?: number;
      limit?: number;
    }
  ): Promise<OrderPaginatedResponse<Order>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = `/api/maxalla-contragents/orders${queryString ? `?${queryString}` : ''}`;
      
      // API returns OrderPaginatedResponse directly
      const response = await fetchApiWithAuth<any>(endpoint, token, {
        method: 'GET',
      });
      return response as unknown as OrderPaginatedResponse<Order>;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Order by ID
   * GET /api/maxalla-contragents/orders/:id
   */
  async getOrderById(
    token: string,
    orderId: string
  ): Promise<ApiResponse<Order>> {
    try {
      return await fetchApiWithAuth<Order>(
        `/api/maxalla-contragents/orders/${orderId}`,
        token,
        {
          method: 'GET',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Respond to Order Request (Accept or Reject)
   * POST /api/maxalla-contragents/orders/:orderId/respond
   */
  async respondToOrderRequest(
    token: string,
    orderId: string,
    response: 'accepted' | 'rejected'
  ): Promise<ApiResponse<RespondToOrderRequestResponse>> {
    try {
      return await fetchApiWithAuth<RespondToOrderRequestResponse>(
        `/api/maxalla-contragents/orders/${orderId}/respond`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({ response }),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Send Order to Delivery Provider
   * POST /api/maxalla-contragents/orders/:orderId/send-to-delivery-provider
   */
  async sendOrderToDeliveryProvider(
    token: string,
    orderId: string,
    data: SendOrderToDeliveryProviderRequest
  ): Promise<ApiResponse<SendOrderToDeliveryProviderResponse>> {
    try {
      return await fetchApiWithAuth<SendOrderToDeliveryProviderResponse>(
        `/api/maxalla-contragents/orders/${orderId}/send-to-delivery-provider`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },
};
