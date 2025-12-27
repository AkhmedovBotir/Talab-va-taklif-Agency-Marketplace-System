import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const BASE_URL = 'https://api.ttsa.uz/api/marketplace';
const REGIONS_BASE_URL = 'https://api.ttsa.uz/api';
const REVIEWS_BASE_URL = 'https://api.ttsa.uz/api/reviews';
const PAYMENT_BASE_URL = 'https://api.ttsa.uz/api/payment';
// Auth storage keys MUST match those used in AuthContext
const TOKEN_KEY = '@marketplace:token';
const USER_KEY = '@marketplace:user';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface Region {
  _id: string;
  name: string;
  type: string;
  code: string;
  parent?: {
    _id: string;
    name: string;
    type: string;
    code: string;
  };
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

export interface CheckPhoneResponse {
  success: boolean;
  status: 'bor' | 'yoq';
  message: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parent?: Category | null;
  status: 'active' | 'inactive';
  subcategories?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Contragent {
  _id: string;
  name: string;
  phone: string;
  viloyat: Region;
  tuman: Region;
  mfy: Region;
  status: 'active' | 'inactive';
  logo?: string | null;
  activityType?: ContragentType | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContragentType {
  _id: string;
  name: string;
  icon: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface ContragentTypesResponse {
  success: boolean;
  count: number;
  data: ContragentType[];
}

export interface Product {
  _id: string;
  name: string;
  description?: {
    ops: Array<{ insert: string }>;
  } | null;
  price: number;
  originalPrice: number;
  images: string[];
  category: Category;
  subcategory?: Category | null;
  quantity: number;
  unit: 'dona' | 'litr' | 'kg';
  unitSize?: number | null;
  status: 'active' | 'inactive' | 'archived';
  contragent: Contragent;
  deliveryRegions?: Array<{
    viloyat: Region;
    tuman: Region | null;
  }>;
  productCode: string;
  censored?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Product[];
}

export interface CategoriesResponse {
  success: boolean;
  count: number;
  data: Category[];
}

export interface ContragentsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Contragent[];
  imgBase?: string;
  next?: {
    page?: number;
    limit?: number;
  };
}

// Featured Contragents (short view)
export interface FeaturedContragent {
  _id: string;
  name: string;
  logo?: string | null;
}

export interface FeaturedContragentsResponse {
  success: boolean;
  count: number;
  data: FeaturedContragent[];
}

export interface ContragentResponse {
  success: boolean;
  data: Contragent & {
    categories?: Category[];
    subcategories?: Category[];
    products?: Product[];
  };
}

export interface SearchResponse {
  success: boolean;
  query: string;
  results: {
    products: ProductsResponse;
    categories: CategoriesResponse;
    contragents: ContragentsResponse;
  };
}

export interface FilterResponse {
  success: boolean;
  filters: {
    minPrice?: number;
    maxPrice?: number;
    contragent?: string;
    category?: string;
    subcategory?: string | null;
  };
  availableFilters: {
    contragents: Contragent[];
    categories: Category[];
    subcategories: Category[];
  };
  results: ProductsResponse;
}

export interface ProductResponse {
  success: boolean;
  data: Product;
}

// Cart Interfaces
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  _id: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalOriginalPrice: number;
  totalDiscount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartResponse {
  success: boolean;
  message?: string;
  data?: Cart;
}

// Order Interfaces
export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
  originalPrice: number;
  kpiBonusPercent: number;
}

export interface Order {
  _id: string;
  user: string;
  orderNumber: string;
  items: OrderItem[];
  totalPrice: number;
  totalOriginalPrice: number;
  totalKpiPrice: number;
  itemCount: number;
  status: 'pending' | 'confirmed_by_punkt' | 'requested_to_contragent' | 'accepted_by_contragent' | 'delivered_to_punkt' | 'assigned_to_agent' | 'confirmed_by_agent' | 'confirmed_by_customer' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cash' | 'card';
  deliveryViloyat: Region;
  deliveryTuman?: Region | null;
  deliveryMfy?: Region | null;
  deliveryNote?: string;
  phoneNumber: string;
  punktStatus?: 'pending' | 'confirmed' | null;
  confirmedByPunkt?: string | null;
  assignedToAgent?: string | null;
  assignedByPunkt?: string | null;
  assignedAt?: string | null;
  confirmedByAgent?: string | null;
  agentConfirmedAt?: string | null;
  customerConfirmed?: boolean;
  customerConfirmedAt?: string | null;
  currentPunkt?: string | null;
  contragentRequests?: any[];
  punktToPunktRequests?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  data?: Order;
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

// Payment Interfaces
export interface TransactionPath {
  holder: 'user' | 'mfy_agent' | 'district_agent' | 'province_agent' | 'finance';
  holderId: string;
  action: string;
  timestamp: string;
  note: string;
}

export interface PaymentTransaction {
  _id: string;
  order: string | Order;
  user: string;
  amount: number;
  paymentMethod: 'cash' | 'card';
  status: 'pending' | 'collected' | 'submitted' | 'received' | 'confirmed' | 'rejected';
  collectedBy?: {
    _id: string;
    name: string;
    phone: string;
  } | null;
  collectedAt?: string | null;
  currentHolder: 'user' | 'mfy_agent' | 'district_agent' | 'province_agent' | 'finance';
  transactionPath: TransactionPath[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  transaction?: PaymentTransaction;
}

export interface PaymentStatusResponse {
  success: boolean;
  transaction?: PaymentTransaction;
  message?: string;
}

export interface CreateOrderRequest {
  paymentMethod: 'cash' | 'card';
  deliveryViloyat: string;
  deliveryTuman?: string;
  deliveryMfy?: string;
  deliveryNote?: string;
  phoneNumber?: string;
  clearCart?: boolean;
}

// Notification Interfaces
export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'announcement' | 'promotion' | 'update';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetType: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Review Interfaces
export interface CommentTemplate {
  _id: string;
  text: string;
  order: number;
}

export interface CommentTemplatesResponse {
  success: boolean;
  data: CommentTemplate[];
}

export interface Review {
  _id: string;
  order: string;
  product: {
    _id: string;
    name: string;
    images: string[];
  };
  user: string;
  rating: number;
  commentTemplate?: CommentTemplate | null;
  customComment?: string | null;
  contact?: string | null;
  isPositive?: boolean | null;
  createdAt: string;
}

export interface ReviewResponse {
  success: boolean;
  message?: string;
  data: Review;
}

export interface CreateReviewRequest {
  orderId: string;
  productId: string;
  rating: number;
  commentTemplateId?: string;
  customComment?: string;
  isPositive?: boolean;
}

export interface ProductReview {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  rating: number;
  commentTemplate?: CommentTemplate | null;
  customComment?: string | null;
  createdAt: string;
}

export interface ProductReviewsResponse {
  success: boolean;
  data: ProductReview[];
  statistics: {
    averageRating: number;
    totalReviews: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Partnership Request Interfaces
export type ContactStatus = 'not_contacted' | 'contacted' | 'in_progress' | 'completed';
export type RequestStatus = 'pending' | 'reviewing' | 'contacted' | 'approved' | 'rejected';

export interface PartnershipRequest {
  _id: string;
  marketplaceUser: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  companyName: string;
  inn: string;
  mfo: string;
  accountNumber: string;
  viloyat: Region;
  tuman: Region;
  mfy: Region;
  activityType: ContragentType | string;
  managerFirstName: string;
  managerLastName: string;
  managerPhone: string;
  contactStatus?: ContactStatus;
  status: RequestStatus;
  adminNotes?: string | null;
  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  reviewedAt?: string | null;
  contactedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnershipRequest {
  companyName: string;
  inn: string;
  mfo: string;
  accountNumber: string;
  viloyat: string;
  tuman: string;
  mfy: string;
  activityType: string;
  managerFirstName: string;
  managerLastName: string;
  managerPhone: string;
}

export interface PartnershipRequestResponse {
  success: boolean;
  message?: string;
  data: PartnershipRequest;
}

export interface PartnershipRequestsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: PartnershipRequest[];
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: 'ayol' | 'erkak';
  viloyat: Region;
  tuman: Region;
  mfy: Region;
  birthDate: string;
  isPhoneVerified: boolean;
  avatar?: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

class ApiService {
  private getAuthToken(): string | null {
    // Token will be passed from context
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string | null
  ): Promise<ApiResponse<T>> {
    const url = `${BASE_URL}${endpoint}`;
    const authToken = token || this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error Response:', JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        data: data,
      }, null, 2));
      
      // Handle 401 Unauthorized - logout user and clear all marketplace data
      if (response.status === 401) {
        // Clear all marketplace data from storage
        try {
          // Get all keys from AsyncStorage
          const allKeys = await AsyncStorage.getAllKeys();
          
          // Filter keys that start with @marketplace:
          const marketplaceKeys = allKeys.filter(key => key.startsWith('@marketplace:'));
          
          // Remove all marketplace-related keys
          if (marketplaceKeys.length > 0) {
            await AsyncStorage.multiRemove(marketplaceKeys);
            console.log('User logged out due to 401 error. Cleared all marketplace data:', marketplaceKeys);
          }
          
          // Emit event to notify AuthContext about 401 error
          // This will trigger logout and navigation to login screen
          DeviceEventEmitter.emit('marketplace:401-unauthorized');
        } catch (storageError) {
          console.error('Error clearing auth data:', storageError);
        }
      }
      
      // Extract detailed error messages
      let errorMessage = data.message || 'Xatolik yuz berdi';
      if (data.data && data.data.errors) {
        const errors = data.data.errors;
        console.error('API Validation Errors:', JSON.stringify(errors, null, 2));
        
        if (Array.isArray(errors) && errors.length > 0) {
          const errorDetails = errors.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.msg) return err.msg;
            if (err.message) return err.message;
            if (err.path && err.msg) return `${err.path}: ${err.msg}`;
            return JSON.stringify(err);
          }).join(', ');
          errorMessage = `${errorMessage}: ${errorDetails}`;
        } else if (typeof errors === 'object') {
          const errorDetails = Object.entries(errors)
            .map(([key, value]: [string, any]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            })
            .join(', ');
          errorMessage = `${errorMessage}: ${errorDetails}`;
        }
      }
      
      // Add status code and response data to error for better error handling
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).response = {
        status: response.status,
        data: data,
      };
      throw error;
    }

    // Check if response has success: false
    if (data.success === false) {
      console.error('API Error (success: false):', JSON.stringify(data, null, 2));
      
      // Extract detailed error messages
      let errorMessage = data.message || 'Xatolik yuz berdi';
      if (data.data && data.data.errors) {
        const errors = data.data.errors;
        console.error('API Validation Errors:', JSON.stringify(errors, null, 2));
        
        if (Array.isArray(errors) && errors.length > 0) {
          const errorDetails = errors.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.msg) return err.msg;
            if (err.message) return err.message;
            if (err.path && err.msg) return `${err.path}: ${err.msg}`;
            return JSON.stringify(err);
          }).join(', ');
          errorMessage = `${errorMessage}: ${errorDetails}`;
        } else if (typeof errors === 'object') {
          const errorDetails = Object.entries(errors)
            .map(([key, value]: [string, any]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            })
            .join(', ');
          errorMessage = `${errorMessage}: ${errorDetails}`;
        }
      }
      
      const error = new Error(errorMessage);
      (error as any).response = {
        status: 400,
        data: data,
      };
      throw error;
    }

    return data;
  }

  // Register - Step 1: Send SMS Code
  async registerStep1(phone: string): Promise<ApiResponse> {
    return this.request('/register/step1', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  // Register - Step 2: Verify Code and Create Account
  async registerStep2(
    firstName: string,
    lastName: string,
    phone: string,
    gender: 'ayol' | 'erkak',
    viloyat: string,
    tuman: string,
    mfy: string,
    birthDate: string,
    password: string,
    code: string
  ): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/register/step2', {
      method: 'POST',
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        gender,
        viloyat,
        tuman,
        mfy,
        birthDate,
        password,
        code,
      }),
    });
  }

  // Login - Step 1: Verify Credentials and Send SMS Code
  async loginStep1(phone: string, password: string): Promise<ApiResponse> {
    return this.request('/login/step1', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  }

  // Login - Step 2: Verify SMS Code
  async loginStep2(phone: string, code: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/login/step2', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  // Forgot Password - Step 1: Send SMS Code
  async forgotPasswordStep1(phone: string): Promise<ApiResponse> {
    return this.request('/forgot-password/step1', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  // Forgot Password - Step 2: Verify Code and Reset Password
  async forgotPasswordStep2(
    phone: string,
    code: string,
    newPassword: string
  ): Promise<ApiResponse> {
    return this.request('/forgot-password/step2', {
      method: 'POST',
      body: JSON.stringify({ phone, code, newPassword }),
    });
  }

  // Resend SMS Code
  async resendCode(
    phone: string,
    type: 'login' | 'register' | 'forgot_password'
  ): Promise<ApiResponse> {
    return this.request('/resend-code', {
      method: 'POST',
      body: JSON.stringify({ phone, type }),
    });
  }

  // Check Phone Number
  async checkPhone(phone: string): Promise<CheckPhoneResponse> {
    // Remove + if exists and ensure it's just digits
    let cleanedPhone = phone.replace(/\D/g, '');
    
    // If phone starts with 998, use it as is, otherwise ensure it's 12 digits
    if (!cleanedPhone.startsWith('998') && cleanedPhone.length === 9) {
      cleanedPhone = '998' + cleanedPhone;
    }
    
    const url = `${BASE_URL}/check-phone?phone=${cleanedPhone}`;
    console.log('Checking phone:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Check phone response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  // Get Regions
  async getRegions(params?: {
    type?: 'region' | 'district' | 'mfy';
    parent?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<RegionsResponse> {
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
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  // Get All Products
  async getProducts(params?: {
    category?: string;
    subcategory?: string;
    contragent?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.subcategory) queryParams.append('subcategory', params.subcategory);
    if (params?.contragent) queryParams.append('contragent', params.contragent);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  // Get Product by ID
  async getProductById(id: string): Promise<ProductResponse> {
    const response = await fetch(`${BASE_URL}/products/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  // Get All Categories
  async getCategories(params?: {
    status?: string;
    includeSubcategories?: boolean;
  }): Promise<CategoriesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.includeSubcategories) {
      queryParams.append('includeSubcategories', 'true');
    }

    const queryString = queryParams.toString();
    const endpoint = `/categories${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  // Get Category by ID
  async getCategoryById(id: string, includeSubcategories = false): Promise<ApiResponse<Category>> {
    const queryParams = includeSubcategories ? '?includeSubcategories=true' : '';
    const endpoint = `/categories/${id}${queryParams}`;
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  // Get All Contragents
  async getContragents(params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
    activityType?: string;
  }): Promise<ContragentsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.activityType) queryParams.append('activityType', params.activityType);

    const queryString = queryParams.toString();
    const endpoint = `/contragents${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  // Get Featured Contragents (public)
  async getFeaturedContragents(): Promise<FeaturedContragentsResponse> {
    const response = await fetch(`${BASE_URL}/featured-contragents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Tanlangan kontragentlarni olishda xatolik yuz berdi');
    }

    return data;
  }

  // Get Contragent by ID
  async getContragentById(
    id: string,
    options?: {
      includeProducts?: boolean;
      includeCategories?: boolean;
    }
  ): Promise<ContragentResponse> {
    const queryParams = new URLSearchParams();
    if (options?.includeProducts) queryParams.append('includeProducts', 'true');
    if (options?.includeCategories) queryParams.append('includeCategories', 'true');

    const queryString = queryParams.toString();
    const endpoint = `/contragents/${id}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  // Search
  async search(params: {
    q: string;
    page?: number;
    limit?: number;
  }): Promise<SearchResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.q);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/search?${queryString}`;
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  // Filter Products
  async filterProducts(params?: {
    minPrice?: number;
    maxPrice?: number;
    contragent?: string;
    category?: string;
    subcategory?: string;
    page?: number;
    limit?: number;
  }): Promise<FilterResponse> {
    const queryParams = new URLSearchParams();
    if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.contragent) queryParams.append('contragent', params.contragent);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.subcategory) queryParams.append('subcategory', params.subcategory);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/filter${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  // Cart Methods
  async getCart(token: string): Promise<CartResponse> {
    return this.request<Cart>('/cart', {
      method: 'GET',
    }, token);
  }

  async addToCart(
    productId: string,
    quantity: number = 1,
    token: string
  ): Promise<CartResponse> {
    return this.request<Cart>('/cart', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        quantity,
      }),
    }, token);
  }

  async updateCartItem(
    productId: string,
    quantity: number,
    token: string
  ): Promise<CartResponse> {
    return this.request<Cart>(`/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({
        quantity,
      }),
    }, token);
  }

  async removeFromCart(
    productId: string,
    token: string
  ): Promise<CartResponse> {
    return this.request<Cart>(`/cart/${productId}`, {
      method: 'DELETE',
    }, token);
  }

  async clearCart(token: string): Promise<CartResponse> {
    return this.request<Cart>('/cart', {
      method: 'DELETE',
    }, token);
  }

  // Profile Methods
  async getProfile(token: string): Promise<ApiResponse<User>> {
    return this.request<User>('/me', {
      method: 'GET',
    }, token);
  }

  async updateProfile(
    data: {
      firstName?: string;
      lastName?: string;
      gender?: 'ayol' | 'erkak';
      birthDate?: string;
    },
    token: string
  ): Promise<ApiResponse<User>> {
    return this.request<User>('/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  }

  async updatePassword(
    currentPassword: string,
    newPassword: string,
    token: string
  ): Promise<ApiResponse> {
    return this.request('/me/password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    }, token);
  }

  async updateAvatar(
    avatar: string,
    token: string
  ): Promise<ApiResponse<User>> {
    return this.request<User>('/me/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatar }),
    }, token);
  }

  async updateLocation(
    data: {
      viloyat?: string;
      tuman?: string;
      mfy?: string;
    },
    token: string
  ): Promise<ApiResponse<User>> {
    return this.request<User>('/me/location', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  }

  // Get Viloyat and Tuman
  async getViloyatTuman(token: string): Promise<ApiResponse<{
    _id: string;
    viloyat: Region | null;
    tuman: Region | null;
    mfy: Region | null;
  }>> {
    return this.request<{
      _id: string;
      viloyat: Region | null;
      tuman: Region | null;
      mfy: Region | null;
    }>('/me/viloyat-tuman', {
      method: 'GET',
    }, token);
  }

  // Update Viloyat and Tuman
  async updateViloyatTuman(
    data: {
      viloyat?: string;
      tuman?: string | null;
    },
    token: string
  ): Promise<ApiResponse<User>> {
    return this.request<User>('/me/viloyat-tuman', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  }

  // Order Methods
  async createOrder(
    data: CreateOrderRequest,
    token: string
  ): Promise<OrderResponse> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async getOrders(
    params?: {
      status?: 'pending' | 'confirmed_by_punkt' | 'requested_to_contragent' | 'accepted_by_contragent' | 'delivered_to_punkt' | 'assigned_to_agent' | 'confirmed_by_agent' | 'confirmed_by_customer' | 'cancelled';
      paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
      page?: number;
      limit?: number;
    },
    token?: string
  ): Promise<OrdersResponse> {
    if (!token) {
      throw new Error('Token is required');
    }

    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<Order[]>(endpoint, {
      method: 'GET',
    }, token);

    return {
      success: response.success,
      count: (response as any).count || 0,
      total: (response as any).total || 0,
      page: (response as any).page || 1,
      limit: (response as any).limit || 20,
      totalPages: (response as any).totalPages || 1,
      data: (response as any).data || response.data || [],
    };
  }

  async getOrderById(
    orderId: string,
    token: string
  ): Promise<OrderResponse> {
    return this.request<Order>(`/orders/${orderId}`, {
      method: 'GET',
    }, token);
  }

  async cancelOrder(
    orderId: string,
    token: string
  ): Promise<OrderResponse> {
    return this.request<Order>(`/orders/${orderId}`, {
      method: 'DELETE',
    }, token);
  }

  async confirmDelivery(
    orderId: string,
    token: string
  ): Promise<OrderResponse> {
    return this.request<Order>(`/orders/${orderId}/confirm-delivery`, {
      method: 'POST',
    }, token);
  }

  // Notification Methods
  async getNotifications(
    params?: { page?: number; limit?: number },
    token?: string
  ): Promise<NotificationsResponse> {
    if (!token) throw new Error('Token is required');
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/notifications/list${queryString ? `?${queryString}` : ''}`;
    
    return this.request<Notification[]>(endpoint, { method: 'GET' }, token) as any;
  }

  async getUnreadNotificationCount(token: string): Promise<ApiResponse<{ unreadCount: number }>> {
    return this.request<{ unreadCount: number }>('/notifications/unread-count', { method: 'GET' }, token);
  }

  async markNotificationAsRead(notificationId: string, token: string): Promise<ApiResponse> {
    return this.request(`/notifications/${notificationId}/read`, { method: 'POST' }, token);
  }

  async markAllNotificationsAsRead(token: string): Promise<ApiResponse> {
    return this.request('/notifications/read-all', { method: 'POST' }, token);
  }

  // Review Methods
  async getCommentTemplates(): Promise<CommentTemplatesResponse> {
    const response = await fetch(`${REVIEWS_BASE_URL}/templates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  async createReview(data: CreateReviewRequest, token: string): Promise<ReviewResponse> {
    try {
      const response = await fetch(`${REVIEWS_BASE_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Xatolik yuz berdi';
        console.error('Review API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: result,
        });
        throw new Error(errorMessage);
      }

      return result;
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      throw new Error('Baholash yuborishda xatolik yuz berdi');
    }
  }

  async getProductReviews(
    productId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ProductReviewsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `${REVIEWS_BASE_URL}/product/${productId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  // Partnership Request Methods
  async createPartnershipRequest(
    data: CreatePartnershipRequest,
    token: string
  ): Promise<PartnershipRequestResponse> {
    return this.request<PartnershipRequest>('/marketplace-partnership-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token) as any;
  }

  async getMyPartnershipRequests(
    params?: { status?: string; page?: number; limit?: number },
    token?: string
  ): Promise<PartnershipRequestsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/marketplace-partnership-requests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<PartnershipRequest[]>(url, {
      method: 'GET',
    }, token) as any;
  }

  async getPartnershipRequestById(
    id: string,
    token: string
  ): Promise<PartnershipRequestResponse> {
    return this.request<PartnershipRequest>(`/marketplace-partnership-requests/${id}`, {
      method: 'GET',
    }, token) as any;
  }

  // Get All Contragent Types
  async getContragentTypes(params?: {
    status?: 'active' | 'inactive';
  }): Promise<ContragentTypesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/contragent-types${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${REGIONS_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }

    return data;
  }

  // Payment Methods
  async payOrder(orderId: string, token: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${PAYMENT_BASE_URL}/orders/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || 'To\'lov qilishda xatolik yuz berdi';
        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      throw new Error('To\'lov qilishda xatolik yuz berdi');
    }
  }

  async getPaymentStatus(orderId: string, token: string): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${PAYMENT_BASE_URL}/orders/${orderId}/payment-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // If payment transaction not found, return success: false but don't throw
        if (response.status === 404) {
          return {
            success: false,
            message: data.message || 'To\'lov transaksiyasi topilmadi',
          };
        }
        const errorMessage = data.message || 'To\'lov holatini olishda xatolik yuz berdi';
        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      throw new Error('To\'lov holatini olishda xatolik yuz berdi');
    }
  }
}

export default new ApiService();

