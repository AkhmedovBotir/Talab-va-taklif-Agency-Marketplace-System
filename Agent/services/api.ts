// API Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type {
  AgentProfileResponse,
  ApiError,
  ConfirmOrderResponse,
  GetKPIParams,
  GetOrdersHistoryParams,
  GetOrdersParams,
  KPIDailyBalanceResponse,
  KPIDailyReportResponse,
  KPISummaryResponse,
  KPITransactionsResponse,
  LoginRequest,
  LoginResponse,
  MarkDeliveredResponse,
  OrderResponse,
  OrdersResponse,
} from '../types/api';

const TOKEN_KEY = '@agent_token';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear storage
          await AsyncStorage.removeItem(TOKEN_KEY);
        }
        return Promise.reject(error);
      }
    );
  }

  // Login
  async login(
    credentials: LoginRequest,
    deviceInfo?: {
      deviceId: string;
      deviceName?: string;
      deviceType?: string;
      platform?: string;
      os?: string;
      browser?: string;
      userAgent?: string;
    }
  ): Promise<LoginResponse> {
    // Prepare headers with device information
    const headers: Record<string, string> = {};
    
    if (deviceInfo) {
      headers['X-Device-Id'] = deviceInfo.deviceId;
      if (deviceInfo.deviceName) headers['X-Device-Name'] = deviceInfo.deviceName;
      if (deviceInfo.deviceType) headers['X-Device-Type'] = deviceInfo.deviceType;
      if (deviceInfo.platform) headers['X-Platform'] = deviceInfo.platform;
      if (deviceInfo.os) headers['X-OS'] = deviceInfo.os;
      if (deviceInfo.browser) headers['X-Browser'] = deviceInfo.browser;
      if (deviceInfo.userAgent) headers['X-User-Agent'] = deviceInfo.userAgent;
    }

    const response = await this.api.post<LoginResponse>(
      API_ENDPOINTS.AGENT_LOGIN,
      credentials,
      { headers }
    );
    
    if (response.data.success && response.data.data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.data.token);
    }
    
    return response.data;
  }

  // Logout
  async logout(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }

  // Get token
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  // Get Agent Profile
  async getAgentProfile(): Promise<AgentProfileResponse> {
    const response = await this.api.get<AgentProfileResponse>(
      API_ENDPOINTS.AGENT_PROFILE
    );
    return response.data;
  }

  // Password Setup - Step 1: Request Phone
  async passwordSetupStep1(phone: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.PASSWORD_SETUP_STEP1,
      { phone }
    );
    return response.data;
  }

  // Password Setup - Step 2: Verify SMS Code
  async passwordSetupStep2(phone: string, code: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.PASSWORD_SETUP_STEP2,
      { phone, code }
    );
    return response.data;
  }

  // Password Setup - Step 3: Set Password
  async passwordSetupStep3(phone: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.PASSWORD_SETUP_STEP3,
      { phone, newPassword }
    );
    return response.data;
  }

  // Device Verification - Request Code
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
  }): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await this.api.post<{ success: boolean; message: string; data?: any }>(
      API_ENDPOINTS.DEVICE_VERIFICATION_AGENT_REQUEST_CODE,
      data
    );
    return response.data;
  }

  // Device Verification - Verify
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
  }): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await this.api.post<{ success: boolean; message: string; data?: any }>(
      API_ENDPOINTS.DEVICE_VERIFICATION_AGENT_VERIFY,
      data
    );
    return response.data;
  }

  // Device Verification - Resend Code
  async resendDeviceVerificationCode(phone: string, deviceId: string): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await this.api.post<{ success: boolean; message: string; data?: any }>(
      API_ENDPOINTS.DEVICE_VERIFICATION_AGENT_RESEND_CODE,
      { phone, deviceId }
    );
    return response.data;
  }

  // Get Orders (all)
  async getOrders(params?: GetOrdersParams): Promise<OrdersResponse> {
    const response = await this.api.get<OrdersResponse>(
      API_ENDPOINTS.AGENT_ORDERS,
      { params }
    );
    return response.data;
  }

  // Get Today's Orders
  async getTodayOrders(params?: GetOrdersParams): Promise<OrdersResponse> {
    const response = await this.api.get<OrdersResponse>(
      API_ENDPOINTS.AGENT_ORDERS_TODAY,
      { params }
    );
    return response.data;
  }

  // Get Orders History
  async getOrdersHistory(params?: GetOrdersHistoryParams): Promise<OrdersResponse> {
    const response = await this.api.get<OrdersResponse>(
      API_ENDPOINTS.AGENT_ORDERS_HISTORY,
      { params }
    );
    return response.data;
  }

  // Get Order by ID
  async getOrderById(id: string): Promise<OrderResponse> {
    const response = await this.api.get<OrderResponse>(
      API_ENDPOINTS.AGENT_ORDER_BY_ID(id)
    );
    return response.data;
  }

  // Confirm Order
  async confirmOrder(id: string): Promise<ConfirmOrderResponse> {
    const response = await this.api.post<ConfirmOrderResponse>(
      API_ENDPOINTS.AGENT_CONFIRM_ORDER(id)
    );
    return response.data;
  }

  // Mark Order as Delivered
  async markOrderAsDelivered(id: string): Promise<MarkDeliveredResponse> {
    const response = await this.api.post<MarkDeliveredResponse>(
      API_ENDPOINTS.AGENT_MARK_DELIVERED(id)
    );
    return response.data;
  }

  // Get KPI Summary
  async getKPISummary(params?: GetKPIParams): Promise<KPISummaryResponse> {
    const response = await this.api.get<KPISummaryResponse>(
      API_ENDPOINTS.AGENT_KPI_SUMMARY,
      { params }
    );
    return response.data;
  }

  // Get KPI Transactions
  async getKPITransactions(params?: GetKPIParams): Promise<KPITransactionsResponse> {
    const response = await this.api.get<KPITransactionsResponse>(
      API_ENDPOINTS.AGENT_KPI_TRANSACTIONS,
      { params }
    );
    return response.data;
  }

  // Get KPI Daily Balance
  async getKPIDailyBalance(date?: string): Promise<KPIDailyBalanceResponse> {
    const params = date ? { date } : {};
    const response = await this.api.get<KPIDailyBalanceResponse>(
      API_ENDPOINTS.AGENT_KPI_BALANCE,
      { params }
    );
    return response.data;
  }

  // Get KPI Daily Report
  async getKPIDailyReport(date?: string): Promise<KPIDailyReportResponse> {
    const params = date ? { date } : {};
    const response = await this.api.get<KPIDailyReportResponse>(
      API_ENDPOINTS.AGENT_KPI_DAILY_REPORT,
      { params }
    );
    return response.data;
  }

  // Get Notifications
  async getNotifications(params?: { page?: number; limit?: number }): Promise<any> {
    const response = await this.api.get(
      API_ENDPOINTS.AGENT_NOTIFICATIONS,
      { params }
    );
    return response.data;
  }

  // Get Unread Notifications Count
  async getUnreadNotificationsCount(): Promise<any> {
    const response = await this.api.get(API_ENDPOINTS.AGENT_NOTIFICATIONS_UNREAD_COUNT);
    return response.data;
  }

  // Mark Notification as Read
  async markNotificationRead(notificationId: string): Promise<any> {
    const response = await this.api.post(API_ENDPOINTS.AGENT_NOTIFICATION_READ(notificationId));
    return response.data;
  }

  // Mark All Notifications as Read
  async markAllNotificationsRead(): Promise<any> {
    const response = await this.api.post(API_ENDPOINTS.AGENT_NOTIFICATIONS_READ_ALL);
    return response.data;
  }
}

export const apiService = new ApiService();


