import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.7:5000';

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface PasswordSetupStep1Request {
  phone: string;
}

export interface PasswordSetupStep1Response {
  success: boolean;
  message: string;
}

export interface PasswordSetupStep2Request {
  phone: string;
  code: string;
}

export interface PasswordSetupStep2Response {
  success: boolean;
  message: string;
}

export interface PasswordSetupStep3Request {
  phone: string;
  newPassword: string;
}

export interface PasswordSetupStep3Response {
  success: boolean;
  message: string;
}

export interface Contragent {
  _id: string;
  name: string;
  inn: string;
  viloyat: {
    _id: string;
    name: string;
    type: string;
    code: string;
  };
  tuman: {
    _id: string;
    name: string;
    type: string;
    code: string;
  };
  mfy: {
    _id: string;
    name: string;
    type: string;
    code: string;
  };
  phone: string;
  status: string;
  logo?: string; // base64 encoded logo
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  requiresDeviceVerification?: boolean;
  data: {
    token?: string;
    contragent?: Contragent;
    phone?: string;
    deviceId?: string;
  };
}

export interface GetMeResponse {
  success: boolean;
  data: Contragent;
}

export interface ContragentResponse {
  success: boolean;
  message?: string;
  data: Contragent;
}

export interface ContragentUpdateRequest {
  name?: string;
  phone?: string;
  inn?: string;
  viloyat?: string;
  tuman?: string;
  mfy?: string;
  logo?: string;
}

// Category interfaces
export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string | null;
  censored?: boolean;
  parent: Category | null | string;
  status: 'active' | 'inactive';
  createdBy?: {
    _id: string;
    name: string;
    phone?: string;
    username?: string;
  };
  createdByModel?: string;
  subcategories?: Array<{
    _id: string;
    name: string;
    slug: string;
    parent: string;
    status: 'active' | 'inactive';
    id?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Category[];
}

export interface CategoryResponse {
  success: boolean;
  message?: string;
  data: Category;
}

export interface CategoryCreateRequest {
  name: string;
}

export interface CategoryUpdateRequest {
  name: string;
}

export interface CategoryStatusRequest {
  status: 'active' | 'inactive';
}

// Region interfaces
export interface Region {
  _id: string;
  name: string;
  type: 'region' | 'district' | 'mfy';
  parent?: {
    _id: string;
    name: string;
    type: string;
    code: string;
  } | null;
  code: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface RegionListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Region[];
}

// Product interfaces
export interface DeliveryRegion {
  viloyat: string;
  tuman?: string | null;
}

export interface DeltaFormat {
  ops: Array<{
    insert: string;
    attributes?: Record<string, any>;
  }>;
}

export interface Product {
  _id: string;
  name: string;
  description?: DeltaFormat | null;
  price: number;
  originalPrice: number;
  images: string[];
  category: Category;
  subcategory: Category | null;
  quantity: number;
  unit: 'dona' | 'litr' | 'kg';
  unitSize?: number | null;
  length?: number | null;
  width?: number | null;
  weight?: number | null;
  status: 'active' | 'inactive' | 'archived';
  censored?: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderatedBy?: {
    _id: string;
    name: string;
    username?: string;
  } | null;
  moderatedAt?: string | null;
  rejectionReason?: string | null;
  contragent?: {
    _id: string;
    name: string;
    inn: string;
    phone: string;
  };
  deliveryRegions?: Array<{
    viloyat: {
      _id: string;
      name: string;
      type: string;
      code: string;
    };
    tuman?: {
      _id: string;
      name: string;
      type: string;
      code: string;
    } | null;
  }>;
  kpiBonusPercent: number;
  productCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Product[];
}

export interface ProductResponse {
  success: boolean;
  message?: string;
  data: Product;
}

export interface ProductCreateRequest {
  name: string;
  description?: DeltaFormat | null;
  price: number;
  originalPrice: number;
  images?: string[];
  category: string;
  subcategory?: string | null;
  quantity: number;
  unit: 'dona' | 'litr' | 'kg';
  unitSize?: number | null;
  length?: number | null;
  width?: number | null;
  weight?: number | null;
  status?: 'active' | 'inactive' | 'archived';
  kpiBonusPercent: number;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: DeltaFormat | null;
  price?: number;
  originalPrice?: number;
  images?: string[];
  category?: string;
  subcategory?: string | null;
  quantity?: number;
  unit?: 'dona' | 'litr' | 'kg';
  unitSize?: number | null;
  length?: number | null;
  width?: number | null;
  weight?: number | null;
  status?: 'active' | 'inactive' | 'archived';
  kpiBonusPercent?: number;
}

export interface ProductStatusRequest {
  status: 'active' | 'inactive' | 'archived';
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Contragent Order interfaces
export interface ContragentRequest {
  _id?: string;
  contragentId: {
    _id: string;
    name: string;
    inn: string;
    phone?: string;
  };
  itemIds: number[];
  status: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
  requestedAt: string;
  respondedAt?: string | null;
  deliveredToPunktAt?: string | null;
}

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    images?: string[];
    productCode?: string;
    price?: number;
    contragent?: {
      _id: string;
      name: string;
    };
  };
  quantity: number;
  price: number;
  originalPrice?: number;
  kpiBonusPercent?: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  contragentRequests: ContragentRequest[];
  currentPunkt: {
    _id: string;
    name: string;
    phone?: string;
    tuman?: string;
    viloyat?: string;
  };
  items: OrderItem[];
  itemCount: number;
  phoneNumber: string;
  deliveryViloyat?: {
    _id: string;
    name: string;
    code: string;
    type: string;
  };
  deliveryTuman?: {
    _id: string;
    name: string;
    code: string;
    type: string;
  };
  deliveryMfy?: {
    _id: string;
    name: string;
    code: string;
    type: string;
  };
  deliveryNote?: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  totalPrice: number;
  totalOriginalPrice: number;
  totalKpiPrice: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Order[];
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  data: Order;
}

export interface OrderRespondRequest {
  response: 'accepted' | 'rejected';
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    // Add token to headers if available (only for authenticated endpoints)
    // Device verification endpoints don't require authentication
    if (!endpoint.includes('/device-verification/')) {
      const token = await this.getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || 'An error occurred',
          errors: data.errors,
        };
      }

      return data;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        status: 500,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  async login(credentials: LoginRequest, deviceId?: string): Promise<LoginResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (deviceId) {
      headers['X-Device-Id'] = deviceId;
    }

    return this.request<LoginResponse>('/api/contragents/auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify(credentials),
    });
  }

  async passwordSetupStep1(data: PasswordSetupStep1Request): Promise<PasswordSetupStep1Response> {
    return this.request<PasswordSetupStep1Response>('/api/contragents/password-setup/step1', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async passwordSetupStep2(data: PasswordSetupStep2Request): Promise<PasswordSetupStep2Response> {
    return this.request<PasswordSetupStep2Response>('/api/contragents/password-setup/step2', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async passwordSetupStep3(data: PasswordSetupStep3Request): Promise<PasswordSetupStep3Response> {
    return this.request<PasswordSetupStep3Response>('/api/contragents/password-setup/step3', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Device Verification methods for Contragent
  async requestDeviceVerificationCode(data: {
    phone: string;
    deviceId: string;
    deviceName?: string;
    deviceType?: string;
    platform?: string;
    os?: string;
    browser?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: {
      country?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
  }): Promise<{ success: boolean; message: string; data: { phone: string; expiresAt: string } }> {
    return this.request('/api/device-verification/contragent/request-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyDevice(data: {
    phone: string;
    deviceId: string;
    code: string;
    deviceName?: string;
    deviceType?: string;
    platform?: string;
    os?: string;
    browser?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: {
      country?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      device: {
        _id: string;
        deviceId: string;
        deviceName?: string;
        isPrimary: boolean;
        lastLoginAt: string;
      };
      isNew: boolean;
    };
  }> {
    return this.request('/api/device-verification/contragent/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendDeviceVerificationCode(data: {
    phone: string;
    deviceId: string;
  }): Promise<{ success: boolean; message: string; data: { phone: string; expiresAt: string } }> {
    return this.request('/api/device-verification/contragent/resend-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin Device Management methods
  async getAllDevices(params?: {
    userModel?: 'Admin' | 'Contragent' | 'Punkt' | 'Agent';
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    count: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: Array<{
      _id: string;
      user: {
        _id: string;
        name: string;
        phone: string;
      };
      userModel: string;
      deviceId: string;
      deviceName?: string;
      isActive: boolean;
      isPrimary: boolean;
      lastLoginAt: string;
      lastActivityAt: string;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.userModel) queryParams.append('userModel', params.userModel);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/api/admins/devices${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async getDeviceById(deviceId: string): Promise<{
    success: boolean;
    data: {
      _id: string;
      user: {
        _id: string;
        name: string;
        phone: string;
      };
      userModel: string;
      deviceId: string;
      deviceName?: string;
      deviceType?: string;
      platform?: string;
      os?: string;
      browser?: string;
      ipAddress?: string;
      isActive: boolean;
      isPrimary: boolean;
      lastLoginAt: string;
      lastActivityAt: string;
    };
  }> {
    return this.request(`/api/admins/devices/${deviceId}`, {
      method: 'GET',
    });
  }

  async getUserDevices(userModel: 'Admin' | 'Contragent' | 'Punkt' | 'Agent', userId: string): Promise<{
    success: boolean;
    count: number;
    data: Array<{
      _id: string;
      deviceId: string;
      deviceName?: string;
      isActive: boolean;
      isPrimary: boolean;
      lastLoginAt: string;
    }>;
  }> {
    return this.request(`/api/admins/devices/user/${userModel}/${userId}`, {
      method: 'GET',
    });
  }

  async deactivateDevice(deviceId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      _id: string;
      isActive: boolean;
      lastActivityAt: string;
    };
  }> {
    return this.request(`/api/admins/devices/${deviceId}/deactivate`, {
      method: 'PUT',
    });
  }

  async activateDevice(deviceId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      _id: string;
      isActive: boolean;
      lastLoginAt: string;
    };
  }> {
    return this.request(`/api/admins/devices/${deviceId}/activate`, {
      method: 'PUT',
    });
  }

  async deleteDevice(deviceId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request(`/api/admins/devices/${deviceId}`, {
      method: 'DELETE',
    });
  }

  async getDeviceStatistics(): Promise<{
    success: boolean;
    data: {
      total: number;
      active: number;
      inactive: number;
      byUserModel: Array<{
        _id: string;
        total: number;
        active: number;
        inactive: number;
      }>;
      byDeviceType: Array<{
        _id: string;
        count: number;
      }>;
    };
  }> {
    return this.request('/api/admins/devices/statistics', {
      method: 'GET',
    });
  }

  async getMe(): Promise<GetMeResponse> {
    return this.request<GetMeResponse>('/api/contragents/me', {
      method: 'GET',
    });
  }

  async updateProfile(data: ContragentUpdateRequest): Promise<ContragentResponse> {
    return this.request<ContragentResponse>('/api/contragents/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateLogo(data: { logo: string }): Promise<ContragentResponse> {
    return this.request<ContragentResponse>('/api/contragents/me/logo', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getDeliveryRegions(): Promise<{
    success: boolean;
    data: {
      deliveryRegions: Array<{
        viloyat: {
          _id: string;
          name: string;
          type: string;
          code: string;
        };
        tuman: {
          _id: string;
          name: string;
          type: string;
          code: string;
        } | null;
      }>;
    };
  }> {
    return this.request('/api/contragents/me/delivery-regions', {
      method: 'GET',
    });
  }

  async updateDeliveryRegions(data: {
    deliveryRegions: DeliveryRegion[];
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      deliveryRegions: Array<{
        viloyat: {
          _id: string;
          name: string;
          type: string;
          code: string;
        };
        tuman: {
          _id: string;
          name: string;
          type: string;
          code: string;
        } | null;
      }>;
    };
  }> {
    return this.request('/api/contragents/me/delivery-regions', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Category methods
  async createCategory(data: CategoryCreateRequest): Promise<CategoryResponse> {
    return this.request<CategoryResponse>('/api/category/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCategories(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive';
  }): Promise<CategoryListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request<CategoryListResponse>(
      `/api/category/list${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getCategoryById(id: string): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(`/api/category/${id}`, {
      method: 'GET',
    });
  }

  async updateCategory(
    id: string,
    data: CategoryUpdateRequest
  ): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(`/api/category/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateCategoryStatus(
    id: string,
    data: CategoryStatusRequest
  ): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(`/api/category/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/category/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Subcategory methods
  async createSubcategory(data: {
    name: string;
    parent: string;
  }): Promise<CategoryResponse> {
    return this.request<CategoryResponse>('/api/category/subcategory/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSubcategories(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive';
    parent?: string;
  }): Promise<CategoryListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.parent) queryParams.append('parent', params.parent);

    const query = queryParams.toString();
    return this.request<CategoryListResponse>(
      `/api/category/subcategory/list${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async updateSubcategory(
    id: string,
    data: CategoryUpdateRequest
  ): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(`/api/category/subcategory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateSubcategoryStatus(
    id: string,
    data: CategoryStatusRequest
  ): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(
      `/api/category/subcategory/${id}/status`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteSubcategory(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/category/subcategory/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Product methods
  async createProduct(data: ProductCreateRequest): Promise<ProductResponse> {
    return this.request<ProductResponse>('/api/product/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyProducts(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive' | 'archived';
    category?: string;
    subcategory?: string;
  }): Promise<ProductListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.subcategory) queryParams.append('subcategory', params.subcategory);

    const query = queryParams.toString();
    return this.request<ProductListResponse>(
      `/api/product/my${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getAllProducts(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive' | 'archived';
    category?: string;
    subcategory?: string;
    contragent?: string;
    viloyat?: string;
    tuman?: string;
  }): Promise<ProductListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.subcategory) queryParams.append('subcategory', params.subcategory);
    if (params?.contragent) queryParams.append('contragent', params.contragent);
    if (params?.viloyat) queryParams.append('viloyat', params.viloyat);
    if (params?.tuman) queryParams.append('tuman', params.tuman);

    const query = queryParams.toString();
    return this.request<ProductListResponse>(
      `/api/product/list${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getProductById(id: string): Promise<ProductResponse> {
    return this.request<ProductResponse>(`/api/product/${id}`, {
      method: 'GET',
    });
  }

  async updateProduct(
    id: string,
    data: ProductUpdateRequest
  ): Promise<ProductResponse> {
    return this.request<ProductResponse>(`/api/product/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateProductStatus(
    id: string,
    data: ProductStatusRequest
  ): Promise<ProductResponse> {
    return this.request<ProductResponse>(`/api/product/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/product/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Contragent Order methods
  async getTodayOrders(params?: {
    status?: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
    page?: number;
    limit?: number;
  }): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<OrderListResponse>(
      `/api/contragent/today${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getOrdersHistory(params?: {
    status?: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<OrderListResponse>(
      `/api/contragent/history${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getContragentOrders(params?: {
    status?: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
    page?: number;
    limit?: number;
  }): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<OrderListResponse>(
      `/api/contragent/orders${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getContragentOrderById(id: string): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/api/contragent/orders/${id}`, {
      method: 'GET',
    });
  }

  async respondToOrder(orderId: string, data: OrderRespondRequest): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/api/contragent/orders/${orderId}/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deliverOrderToPunkt(orderId: string): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/api/contragent/orders/${orderId}/deliver-to-punkt`, {
      method: 'POST',
    });
  }

  // Region methods
  async getRegions(params?: {
    page?: number;
    limit?: number;
    type?: 'region' | 'district' | 'mfy';
    parent?: string;
    status?: 'active' | 'inactive';
  }): Promise<RegionListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.parent) queryParams.append('parent', params.parent);
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request<RegionListResponse>(
      `/api/regions${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@auth_token');
    } catch (error) {
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('@auth_token', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@auth_token');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Statistics
  async getStatistics(params?: StatisticsParams): Promise<StatisticsResponse> {
    const query = params ? new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined) as [string, string][]
    ).toString() : '';
    
    return this.request<StatisticsResponse>(
      `/api/contragent/statistics${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  // Notification methods
  async getNotifications(params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<NotificationListResponse>(
      `/api/contragents/notifications/list${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    return this.request<UnreadCountResponse>(
      '/api/contragents/notifications/unread-count',
      { method: 'GET' }
    );
  }

  async markNotificationRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/contragents/notifications/${notificationId}/read`,
      { method: 'POST' }
    );
  }

  async markAllNotificationsRead(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      '/api/contragents/notifications/read-all',
      { method: 'POST' }
    );
  }

  // Payment methods
  async getPaidPayments(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PaidPaymentsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const query = queryParams.toString();
    return this.request<PaidPaymentsResponse>(
      `/api/contragents/payments/paid${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async getUnpaidPayments(params?: {
    page?: number;
    limit?: number;
    isOverdue?: string;
  }): Promise<UnpaidPaymentsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isOverdue) queryParams.append('isOverdue', params.isOverdue);
    
    const query = queryParams.toString();
    return this.request<UnpaidPaymentsResponse>(
      `/api/contragents/payments/unpaid${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async getPaymentStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PaymentStatisticsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const query = queryParams.toString();
    return this.request<PaymentStatisticsResponse>(
      `/api/contragents/payments/statistics${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async getPaymentById(paymentId: string): Promise<PaymentDetailResponse> {
    return this.request<PaymentDetailResponse>(
      `/api/contragents/payments/${paymentId}`,
      { method: 'GET' }
    );
  }
}

// Statistics interfaces
export interface StatisticsSummary {
  totalOrders: number;
  pendingOrders: number;
  acceptedOrders: number;
  rejectedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  totalItems: number;
  acceptanceRate: string;
}

export interface MonthlyStatistics {
  year: number;
  month: number;
  orders: number;
  revenue: number;
}

export interface StatisticsData {
  summary: StatisticsSummary;
  monthly: MonthlyStatistics[];
}

export interface StatisticsResponse {
  success: boolean;
  data: StatisticsData;
}

export interface StatisticsParams {
  startDate?: string;
  endDate?: string;
}

// Notification interfaces
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'announcement' | 'promotion' | 'update';
  targetType: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

// Payment interfaces
export interface PaymentOrder {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  totalKpiPrice: number;
  createdAt: string;
}

export interface PaidBy {
  _id: string;
  name: string;
  phone: string;
}

export interface ContragentPayment {
  _id: string;
  contragent: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt: string | null;
  paidBy: PaidBy | null;
  notes: string | null;
  orders: PaymentOrder[];
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaidPaymentsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalAmount: number;
  totalPaidAmount: number;
  data: ContragentPayment[];
}

export interface UnpaidPaymentsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalAmount: number;
  totalUnpaidAmount: number;
  overdue: {
    totalAmount: number;
    count: number;
  };
  data: ContragentPayment[];
}

export interface PaymentStatisticsData {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  unpaid: {
    totalAmount: number;
    count: number;
  };
  paid: {
    totalAmount: number;
    count: number;
  };
  overdue: {
    totalAmount: number;
    count: number;
  };
}

export interface PaymentStatisticsResponse {
  success: boolean;
  data: PaymentStatisticsData;
}

export interface PaymentDetailResponse {
  success: boolean;
  data: ContragentPayment;
}

export const apiService = new ApiService();




