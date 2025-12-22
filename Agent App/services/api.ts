// API Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type {
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
  // Agent Finance Types
  MFYDailyReportResponse,
  MFYPendingPaymentsResponse,
  MFYCollectPaymentResponse,
  MFYSubmitToDistrictRequest,
  MFYSubmitToDistrictResponse,
  MFYStatisticsResponse,
  DistrictReportResponse,
  DistrictSubmissionsResponse,
  DistrictConfirmSubmissionResponse,
  DistrictSubmitToProvinceRequest,
  DistrictSubmitToProvinceResponse,
  DistrictStatisticsResponse,
  ProvinceReportResponse,
  ProvinceSubmissionsResponse,
  ProvinceConfirmSubmissionResponse,
  ProvinceSubmitToFinanceRequest,
  ProvinceSubmitToFinanceResponse,
  ProvinceStatisticsResponse,
  GetFinanceStatisticsParams,
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
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>(
      API_ENDPOINTS.AGENT_LOGIN,
      credentials
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
  async getKPIDailyReport(startDate?: string, endDate?: string): Promise<KPIDailyReportResponse> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
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

  // ========== Agent Finance - MFY Agent ==========
  
  // Get MFY Daily Report
  async getMFYDailyReport(date?: string): Promise<MFYDailyReportResponse> {
    const params = date ? { date } : {};
    const response = await this.api.get<MFYDailyReportResponse>(
      API_ENDPOINTS.MFY_DAILY_REPORT,
      { params }
    );
    return response.data;
  }

  // Get MFY Pending Payments
  async getMFYPendingPayments(): Promise<MFYPendingPaymentsResponse> {
    const response = await this.api.get<MFYPendingPaymentsResponse>(
      API_ENDPOINTS.MFY_PENDING_PAYMENTS
    );
    return response.data;
  }

  // Collect Payment (MFY)
  async collectPayment(transactionId: string): Promise<MFYCollectPaymentResponse> {
    const response = await this.api.post<MFYCollectPaymentResponse>(
      API_ENDPOINTS.MFY_COLLECT_PAYMENT(transactionId)
    );
    return response.data;
  }

  // Submit to District (MFY)
  async submitToDistrict(data: MFYSubmitToDistrictRequest): Promise<MFYSubmitToDistrictResponse> {
    const response = await this.api.post<MFYSubmitToDistrictResponse>(
      API_ENDPOINTS.MFY_SUBMIT_TO_DISTRICT,
      data
    );
    return response.data;
  }

  // Get MFY Statistics
  async getMFYStatistics(params?: GetFinanceStatisticsParams): Promise<MFYStatisticsResponse> {
    const response = await this.api.get<MFYStatisticsResponse>(
      API_ENDPOINTS.MFY_STATISTICS,
      { params }
    );
    return response.data;
  }

  // ========== Agent Finance - Tuman Agent ==========

  // Get District Report
  async getDistrictReport(date?: string): Promise<DistrictReportResponse> {
    const params = date ? { date } : {};
    const response = await this.api.get<DistrictReportResponse>(
      API_ENDPOINTS.DISTRICT_REPORT,
      { params }
    );
    return response.data;
  }

  // Get District Submissions
  async getDistrictSubmissions(status?: 'pending' | 'confirmed' | 'rejected'): Promise<DistrictSubmissionsResponse> {
    const params = status ? { status } : {};
    const response = await this.api.get<DistrictSubmissionsResponse>(
      API_ENDPOINTS.DISTRICT_SUBMISSIONS,
      { params }
    );
    return response.data;
  }

  // Confirm Submission (District)
  async confirmDistrictSubmission(submissionId: string): Promise<DistrictConfirmSubmissionResponse> {
    const response = await this.api.post<DistrictConfirmSubmissionResponse>(
      API_ENDPOINTS.DISTRICT_CONFIRM_SUBMISSION(submissionId)
    );
    return response.data;
  }

  // Submit to Province (District)
  async submitToProvince(data: DistrictSubmitToProvinceRequest): Promise<DistrictSubmitToProvinceResponse> {
    const response = await this.api.post<DistrictSubmitToProvinceResponse>(
      API_ENDPOINTS.DISTRICT_SUBMIT_TO_PROVINCE,
      data
    );
    return response.data;
  }

  // Get District Statistics
  async getDistrictStatistics(params?: GetFinanceStatisticsParams): Promise<DistrictStatisticsResponse> {
    const response = await this.api.get<DistrictStatisticsResponse>(
      API_ENDPOINTS.DISTRICT_STATISTICS,
      { params }
    );
    return response.data;
  }

  // ========== Agent Finance - Viloyat Agent ==========

  // Get Province Report
  async getProvinceReport(date?: string): Promise<ProvinceReportResponse> {
    const params = date ? { date } : {};
    const response = await this.api.get<ProvinceReportResponse>(
      API_ENDPOINTS.PROVINCE_REPORT,
      { params }
    );
    return response.data;
  }

  // Get Province Submissions
  async getProvinceSubmissions(status?: 'pending' | 'confirmed' | 'rejected'): Promise<ProvinceSubmissionsResponse> {
    const params = status ? { status } : {};
    const response = await this.api.get<ProvinceSubmissionsResponse>(
      API_ENDPOINTS.PROVINCE_SUBMISSIONS,
      { params }
    );
    return response.data;
  }

  // Confirm Submission (Province)
  async confirmProvinceSubmission(submissionId: string): Promise<ProvinceConfirmSubmissionResponse> {
    const response = await this.api.post<ProvinceConfirmSubmissionResponse>(
      API_ENDPOINTS.PROVINCE_CONFIRM_SUBMISSION(submissionId)
    );
    return response.data;
  }

  // Submit to Finance (Province)
  async submitToFinance(data: ProvinceSubmitToFinanceRequest): Promise<ProvinceSubmitToFinanceResponse> {
    const response = await this.api.post<ProvinceSubmitToFinanceResponse>(
      API_ENDPOINTS.PROVINCE_SUBMIT_TO_FINANCE,
      data
    );
    return response.data;
  }

  // Get Province Statistics
  async getProvinceStatistics(params?: GetFinanceStatisticsParams): Promise<ProvinceStatisticsResponse> {
    const response = await this.api.get<ProvinceStatisticsResponse>(
      API_ENDPOINTS.PROVINCE_STATISTICS,
      { params }
    );
    return response.data;
  }
}

export const apiService = new ApiService();


