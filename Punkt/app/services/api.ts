const BASE_URL = 'http://192.168.1.7:5000/api';

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    punkt: Punkt;
  };
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

export interface DeviceVerificationRequest {
  phone: string;
  deviceId: string;
  deviceName?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop' | 'web' | 'unknown';
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
}

export interface DeviceVerificationCodeResponse {
  success: boolean;
  message: string;
  data: {
    phone: string;
    expiresAt: string;
  };
}

export interface DeviceVerificationVerifyRequest extends DeviceVerificationRequest {
  code: string;
}

export interface DeviceVerificationVerifyResponse {
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
}

export interface LoginResponseWithDeviceVerification {
  success: boolean;
  message: string;
  requiresDeviceVerification?: boolean;
  data?: {
    token?: string;
    punkt?: Punkt;
    phone?: string;
    deviceId?: string;
  };
}

export interface Punkt {
  _id: string;
  name: string;
  phone: string;
  viloyat: Region;
  tuman: Region;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PunktSelection {
  _id: string;
  name: string;
  phone: string;
  viloyat: Region;
  tuman: Region | null;
  status: 'active' | 'inactive';
}

export interface Agent {
  _id: string;
  name: string;
  phone: string;
  viloyat: Region;
  tuman: Region | null;
  mfy: Region | null;
  status: string;
}

export interface AgentSelection {
  _id: string;
  name: string;
  phone: string;
  viloyat: Region;
  tuman: Region | null;
  mfy: Region | null;
  status: 'active' | 'inactive';
  agentType: 'viloyat' | 'tuman' | 'mfy';
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
  user: {
    _id: string;
    name: string;
    phone: string;
  };
  items: OrderItem[];
  totalPrice: number;
  totalOriginalPrice: number;
  totalKpiPrice: number;
  itemCount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'confirmed_by_punkt' | 'requested_to_contragent' | 'accepted_by_contragent' | 'delivered_to_punkt' | 'assigned_to_agent' | 'confirmed_by_agent' | 'confirmed_by_customer';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cash' | 'card';
  deliveryViloyat: Region;
  deliveryTuman: Region | null;
  deliveryMfy: Region | null;
  deliveryNote: string;
  phoneNumber: string;
  punktRequests: PunktRequest[];
  punktToPunktRequests?: PunktToPunktRequest[];
  contragentRequests?: Array<{
    contragentId: Contragent | string;
    status: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
    requestedAt: string;
  }>;
  confirmedByPunkt: Punkt | null;
  punktStatus: 'pending' | 'confirmed' | 'rejected' | 'requested';
  assignedToAgent: Agent | null;
  assignedByPunkt: Punkt | null;
  assignedAt: string | null;
  currentPunkt?: string | Punkt | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    originalPrice: number;
    category?: {
      _id: string;
      name: string;
      slug: string;
    };
    deliveryRegions?: Array<{
      viloyat: Region;
      tuman: Region;
    }>;
  };
  quantity: number;
  price: number;
  originalPrice: number;
}

export interface PunktRequest {
  punktId: Punkt | string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  respondedAt: string | null;
}

export interface PunktToPunktRequest {
  fromPunktId: Punkt | string;
  toPunktId: Punkt | string;
  status: 'pending' | 'accepted' | 'rejected' | 'delivered';
  requestedAt: string;
  respondedAt: string | null;
  deliveredAt: string | null;
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

export interface OrderResponse {
  success: boolean;
  data: Order;
}

export interface ConfirmOrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface RequestToPunktsRequest {
  tumanIds: string[];
}

export interface RequestToPunktsResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    orderNumber: string;
    requestedPunkts: Punkt[];
    punktRequests: PunktRequest[];
  };
}

export interface RequestsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Order[];
}

export interface RespondToRequestRequest {
  response: 'accepted' | 'rejected';
}

export interface RespondToRequestResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

export interface PunktsSelectionResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: PunktSelection[];
}

export interface AgentsSelectionResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: AgentSelection[];
}

export interface AssignToAgentRequest {
  agentId: string;
}

export interface AssignToAgentResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface Contragent {
  _id: string;
  name: string;
  inn?: string;
  phone?: string;
  viloyat?: Region;
  tuman?: Region | null;
  mfy?: Region | null;
  status?: string;
  isInRegion?: boolean;
  products?: Array<{
    _id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  hasRequest?: boolean;
  requestStatus?: string | null;
  requestedAt?: string | null;
}

export interface RequestToContragentRequest {
  contragentId: string;
}

export interface RequestToContragentResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    contragentRequests: Array<{
      contragentId: Contragent;
      status: string;
      requestedAt: string;
    }>;
  };
}

export interface RequestToPunktRequest {
  toPunktId: string;
}

export interface RequestToPunktResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface ReceiveFromPunktResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface SendToPunktRequest {
  toPunktId: string;
}

export interface SendToPunktResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface ReceiveFromContragentResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface PunktToPunktRequestsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Order[];
}

export interface RespondToPunktRequestRequest {
  response: 'accepted' | 'rejected';
}

export interface RespondToPunktRequestResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface GetOrderContragentsResponse {
  success: boolean;
  data: {
    orderId: string;
    orderNumber: string;
    contragents: Contragent[];
  };
}

export interface AutoRouteOrderResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    orderNumber: string;
    analysis: {
      ownTumanContragents: Array<{
        contragent: Contragent;
        products: Array<{
          _id: string;
          name: string;
          quantity: number;
          price: number;
        }>;
      }>;
      otherTumanPunkts: Array<{
        tuman: Region;
        contragents: Array<{
          contragent: Contragent;
          products: Array<{
            _id: string;
            name: string;
            quantity: number;
            price: number;
          }>;
        }>;
      }>;
      allProductsCovered: boolean;
    };
    routingResults: {
      ownTumanRequests: Array<{
        contragentId: string;
        contragentName: string;
        status: string;
      }>;
      otherTumanRequests: Array<{
        tumanId: string;
        tumanName: string;
        punktId: string;
        punktName: string;
        status: string;
      }>;
      errors: string[];
    };
    order: Order;
  };
}

// KPI Bonus Interfaces
export interface KpiSummaryResponse {
  success: boolean;
  data: {
    punkt: {
      _id: string;
      name: string;
      phone: string;
    };
    summary: {
      totalTransactions: number;
      totalAmount: number;
      paidAmount: number;
      unpaidAmount: number;
    };
  };
}

export interface KpiTransaction {
  _id: string;
  order: {
    _id: string;
    orderNumber: string;
    status: string;
    totalPrice: number;
  };
  orderItem: {
    product: {
      _id: string;
      name: string;
      price: number;
      productCode: string;
    };
    quantity: number;
    price: number;
    kpiBonusPercent: number;
  };
  distributionConfig: {
    _id: string;
    name: string;
  };
  recipients: {
    fromPunkt?: {
      _id: string;
      name: string;
    };
    toPunkt?: {
      _id: string;
      name: string;
    };
  };
  orderStatus: string;
  isPaid: boolean;
  punktAmount: number;
  bonusType: 'regular' | 'from_punkt' | 'to_punkt';
  createdAt: string;
}

export interface KpiTransactionsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: KpiTransaction[];
}

export interface KpiBalanceResponse {
  success: boolean;
  data: {
    date: string;
    totals: {
      totalTransactions: number;
      totalAmount: number;
      paidAmount: number;
      unpaidAmount: number;
      paidTransactions: number;
      unpaidTransactions: number;
    };
  };
}

export interface KpiDailyReportItem {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  paidTransactions: number;
  unpaidTransactions: number;
}

export interface KpiDailyReportResponse {
  success: boolean;
  data: {
    range: {
      startDate: string;
      endDate: string;
    };
    report: KpiDailyReportItem[];
  };
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  targetType: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Notification[];
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
}

class ApiService {
  private token: string | null = null;
  private onDeviceErrorCallback: (() => void) | null = null;
  private isLoggingOut: boolean = false;

  setOnDeviceError(callback: () => void) {
    this.onDeviceErrorCallback = callback;
  }

  private getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // If already logging out, don't make new requests
    if (this.isLoggingOut) {
      const error: any = new Error('Logging out...');
      error.status = 401;
      throw error;
    }

    const token = this.getToken();
    const url = `${BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          data,
        });
        
        const errorMessage = data.message || data.data?.message || '';
        
        // Check if it's a device-related error (403 with device message)
        if (response.status === 403 && errorMessage && 
            (errorMessage.toLowerCase().includes('qurilma') || 
             errorMessage.toLowerCase().includes('device') ||
             errorMessage.toLowerCase().includes('nofaol'))) {
          // Don't trigger logout for login endpoint or device verification endpoints
          const isLoginEndpoint = endpoint.includes('/login') || 
                                  endpoint.includes('/password-setup') ||
                                  endpoint.includes('/device-verification');
          if (!isLoginEndpoint && this.onDeviceErrorCallback && !this.isLoggingOut) {
            console.log('🔴 Device error detected, triggering logout...');
            this.isLoggingOut = true;
            // Trigger logout callback immediately (synchronously if possible)
            try {
              this.onDeviceErrorCallback();
            } catch (error) {
              console.error('Error in logout callback:', error);
            }
            // Don't throw error after logout is triggered
            const error: any = new Error('Logging out...');
            error.status = 403;
            throw error;
          }
        }
        
        // Check if it's an authentication error (401) - like "Punkt topilmadi" or "Token topilmadi"
        if (response.status === 401) {
          // Don't trigger logout for login endpoint or password setup endpoints
          const isAuthEndpoint = endpoint.includes('/login') || 
                                 endpoint.includes('/password-setup') ||
                                 endpoint.includes('/device-verification');
          if (!isAuthEndpoint && this.onDeviceErrorCallback && !this.isLoggingOut) {
            console.log('🔴 Authentication error (401) detected, triggering logout...');
            this.isLoggingOut = true;
            // Trigger logout callback immediately (synchronously if possible)
            try {
              this.onDeviceErrorCallback();
            } catch (error) {
              console.error('Error in logout callback:', error);
            }
            // Don't throw error after logout is triggered
            const error: any = new Error('Logging out...');
            error.status = 401;
            throw error;
          }
        }
        
        const error: any = new Error(errorMessage || 'An error occurred');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data as T;
    } catch (error) {
      // Don't log errors if we're logging out
      if (!this.isLoggingOut) {
        console.error('❌ Request Error:', error);
        if (error instanceof Error) {
          console.error('Error Message:', error.message);
          console.error('Error Stack:', error.stack);
        }
      }
      throw error;
    }
  }

  async login(credentials: LoginRequest, deviceId?: string): Promise<LoginResponse | LoginResponseWithDeviceVerification> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (deviceId) {
      headers['X-Device-Id'] = deviceId;
    }

    return this.request<LoginResponse | LoginResponseWithDeviceVerification>('/punkts/login', {
      method: 'POST',
      headers,
      body: JSON.stringify(credentials),
    });
  }

  async requestDeviceVerificationCode(data: DeviceVerificationRequest): Promise<DeviceVerificationCodeResponse> {
    return this.request<DeviceVerificationCodeResponse>('/device-verification/punkt/request-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyDevice(data: DeviceVerificationVerifyRequest): Promise<DeviceVerificationVerifyResponse> {
    return this.request<DeviceVerificationVerifyResponse>('/device-verification/punkt/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendDeviceVerificationCode(phone: string, deviceId: string): Promise<DeviceVerificationCodeResponse> {
    return this.request<DeviceVerificationCodeResponse>('/device-verification/punkt/resend-code', {
      method: 'POST',
      body: JSON.stringify({ phone, deviceId }),
    });
  }

  async passwordSetupStep1(data: PasswordSetupStep1Request): Promise<PasswordSetupStep1Response> {
    return this.request<PasswordSetupStep1Response>('/punkts/password-setup/step1', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async passwordSetupStep2(data: PasswordSetupStep2Request): Promise<PasswordSetupStep2Response> {
    return this.request<PasswordSetupStep2Response>('/punkts/password-setup/step2', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async passwordSetupStep3(data: PasswordSetupStep3Request): Promise<PasswordSetupStep3Response> {
    return this.request<PasswordSetupStep3Response>('/punkts/password-setup/step3', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders(params?: {
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    orderNumber?: string;
    startDate?: string;
    endDate?: string;
    minTotalPrice?: number;
    maxTotalPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<OrdersResponse>(`/punkt/orders${query ? `?${query}` : ''}`);
  }

  async getTodayOrders(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<OrdersResponse>(`/punkt/orders/today${query ? `?${query}` : ''}`);
  }

  async getOrdersHistory(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<OrdersResponse>(`/punkt/orders/history${query ? `?${query}` : ''}`);
  }

  async getOrderById(id: string): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/punkt/orders/${id}`);
  }

  async confirmOrder(id: string): Promise<ConfirmOrderResponse> {
    return this.request<ConfirmOrderResponse>(`/punkt/orders/${id}/confirm`, {
      method: 'POST',
    });
  }

  async autoRouteOrder(id: string): Promise<AutoRouteOrderResponse> {
    return this.request<AutoRouteOrderResponse>(`/punkt/orders/${id}/auto-route`, {
      method: 'POST',
    });
  }

  async requestToPunkts(
    id: string,
    data: RequestToPunktsRequest
  ): Promise<RequestToPunktsResponse> {
    return this.request<RequestToPunktsResponse>(
      `/punkt/orders/${id}/request-to-punkts`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getRequests(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<RequestsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<RequestsResponse>(`/punkt/requests${query ? `?${query}` : ''}`);
  }

  async respondToRequest(
    orderId: string,
    data: RespondToRequestRequest
  ): Promise<RespondToRequestResponse> {
    return this.request<RespondToRequestResponse>(
      `/punkt/requests/${orderId}/respond`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getPunktsForSelection(params?: {
    status?: 'active' | 'inactive';
    viloyat?: string;
    tuman?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PunktsSelectionResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    const url = `${BASE_URL}/punkts/selection${query ? `?${query}` : ''}`;

    // This endpoint is public, so we don't send token
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      return data as PunktsSelectionResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async getAgentsForSelection(params?: {
    status?: 'active' | 'inactive';
    viloyat?: string;
    tuman?: string;
    mfy?: string;
    agentType?: 'viloyat' | 'tuman' | 'mfy';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AgentsSelectionResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    const url = `${BASE_URL}/agents/selection${query ? `?${query}` : ''}`;

    // This endpoint is public, so we don't send token
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      return data as AgentsSelectionResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async assignOrderToAgent(
    id: string,
    data: AssignToAgentRequest
  ): Promise<AssignToAgentResponse> {
    return this.request<AssignToAgentResponse>(`/punkt/orders/${id}/assign-to-agent`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestToContragent(
    id: string,
    data: RequestToContragentRequest
  ): Promise<RequestToContragentResponse> {
    const endpoint = `/punkt/orders/${id}/request-to-contragent`;
    console.log('🔵 API: requestToContragent called');
    console.log('Endpoint:', endpoint);
    console.log('Order ID:', id);
    console.log('Request Data:', data);
    console.log('Full URL will be:', `${BASE_URL}${endpoint}`);
    
    try {
      const response = await this.request<RequestToContragentResponse>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      console.log('✅ API Response:', response);
      return response;
    } catch (error) {
      console.error('❌ API Error in requestToContragent:', error);
      throw error;
    }
  }

  async requestToPunkt(
    id: string,
    data: RequestToPunktRequest
  ): Promise<RequestToPunktResponse> {
    return this.request<RequestToPunktResponse>(`/punkt/orders/${id}/request-to-punkt`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async receiveFromPunkt(id: string): Promise<ReceiveFromPunktResponse> {
    return this.request<ReceiveFromPunktResponse>(`/punkt/orders/${id}/receive-from-punkt`, {
      method: 'POST',
    });
  }

  async sendToPunkt(
    id: string,
    data: SendToPunktRequest
  ): Promise<SendToPunktResponse> {
    return this.request<SendToPunktResponse>(`/punkt/orders/${id}/send-to-punkt`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async receiveFromContragent(id: string): Promise<ReceiveFromContragentResponse> {
    return this.request<ReceiveFromContragentResponse>(
      `/punkt/orders/${id}/receive-from-contragent`,
      {
        method: 'POST',
      }
    );
  }

  async getPunktToPunktRequests(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PunktToPunktRequestsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<PunktToPunktRequestsResponse>(
      `/punkt/punkt-to-punkt-requests${query ? `?${query}` : ''}`
    );
  }

  async respondToPunktRequest(
    orderId: string,
    data: RespondToPunktRequestRequest
  ): Promise<RespondToPunktRequestResponse> {
    return this.request<RespondToPunktRequestResponse>(
      `/punkt/punkt-to-punkt-requests/${orderId}/respond`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getOrderContragents(id: string): Promise<GetOrderContragentsResponse> {
    return this.request<GetOrderContragentsResponse>(`/punkt/orders/${id}/contragents`);
  }

  // KPI Bonus Methods
  async getKpiSummary(params?: {
    startDate?: string;
    endDate?: string;
    isPaid?: boolean;
  }): Promise<KpiSummaryResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<KpiSummaryResponse>(`/punkt/kpi/summary${query ? `?${query}` : ''}`);
  }

  async getKpiTransactions(params?: {
    startDate?: string;
    endDate?: string;
    isPaid?: boolean;
    page?: number;
    limit?: number;
  }): Promise<KpiTransactionsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<KpiTransactionsResponse>(`/punkt/kpi/transactions${query ? `?${query}` : ''}`);
  }

  async getKpiBalance(date?: string): Promise<KpiBalanceResponse> {
    const queryParams = new URLSearchParams();
    if (date) {
      queryParams.append('date', date);
    }
    const query = queryParams.toString();
    return this.request<KpiBalanceResponse>(`/punkt/kpi/balance${query ? `?${query}` : ''}`);
  }

  async getKpiDailyReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<KpiDailyReportResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<KpiDailyReportResponse>(`/punkt/kpi/reports/daily${query ? `?${query}` : ''}`);
  }

  async getNotifications(params?: {
    page?: number;
    limit?: number;
    read?: boolean;
  }): Promise<NotificationsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<NotificationsResponse>(`/punkts/notifications/list${query ? `?${query}` : ''}`);
  }

  async getUnreadNotificationsCount(): Promise<UnreadCountResponse> {
    return this.request<UnreadCountResponse>('/punkts/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId: string): Promise<MarkReadResponse> {
    return this.request<MarkReadResponse>(`/punkts/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead(): Promise<MarkReadResponse> {
    return this.request<MarkReadResponse>('/punkts/notifications/read-all', {
      method: 'POST',
    });
  }

  setToken(token: string | null) {
    this.token = token;
    // Reset logging out flag when setting a new token (login)
    if (token) {
      this.isLoggingOut = false;
    }
  }
}

export const apiService = new ApiService();

