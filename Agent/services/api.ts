// API Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { getApiBaseUrl, API_ENDPOINTS, NOTIFICATIONS_API_ENABLED } from '../config/api';
import { emitUnauthorized } from './authSession';
import type {
  Agent,
  AgentKpiHistoryDay,
  AgentKpiToday,
  AgentNotification,
  AgentNotificationsListData,
  AgentOrdersAnalytics,
  AgentMeOrderDetail,
  AgentMeOrderListItem,
  AgentProfileResponse,
  ApiEnvelope,
  ApiError,
  GetPaymentTransactionsParams,
  LoginRequest,
  LoginResponse,
  OrdersForPaymentResponse,
  PayToPunktResponse,
  PaymentBalanceResponse,
  PaymentTransactionsResponse,
} from '../types/api';

const TOKEN_KEY = '@agent_token';

/** `{ message, data: { token, agent }, error }` yoki eski shakllar */
function normalizeLoginResponse(raw: unknown): LoginResponse {
  const r = raw as Record<string, unknown>;
  const nested = r?.data as Record<string, unknown> | null | undefined;
  const payload =
    nested && typeof nested === 'object' && ('token' in nested || 'agent' in nested)
      ? nested
      : (r as Record<string, unknown>);
  const token = (payload?.token as string) || '';
  const agent = (payload?.agent as Agent) || ({} as Agent);
  const message = (typeof r?.message === 'string' ? r.message : '') || '';
  const explicitFail = r?.success === false;
  const agentOk =
    !!agent &&
    (typeof agent.phone === 'string' ||
      typeof agent.id === 'number' ||
      typeof (agent as { _id?: string })._id === 'string');
  const success = !explicitFail && !!token && agentOk;
  return {
    success,
    message,
    data: {
      token,
      agent,
      device: payload?.device as LoginResponse['data']['device'],
    },
  };
}

function normalizeProfileResponse(raw: unknown): AgentProfileResponse {
  const r = raw as Record<string, unknown>;
  let data = r?.data as Agent | undefined;
  if (!data && r && typeof r === 'object' && ('phone' in r || 'id' in r)) {
    data = r as unknown as Agent;
  }
  const ok =
    r?.success !== false &&
    data &&
    typeof data === 'object' &&
    (typeof data.phone === 'string' || typeof data.id === 'number' || typeof data._id === 'string');
  return {
    success: !!ok,
    data: (data || {}) as Agent,
    message: typeof r?.message === 'string' ? r.message : undefined,
  };
}

export interface AgentMeOrdersPageResult {
  success: boolean;
  items: AgentMeOrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AgentNotificationsListResult {
  success: boolean;
  items: AgentNotification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  total_pages: number;
  message?: string;
}

export interface NoAuthLookupItem {
  id: number;
  name: string;
  region_id?: number | null;
  district_id?: number | null;
  parent_id?: number | null;
  [key: string]: unknown;
}

export interface NoAuthMarketplaceUserItem {
  id: number;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

function parseAgentMeOrdersPage(raw: unknown): AgentMeOrdersPageResult {
  const r = raw as Record<string, unknown>;
  const d = (r?.data ?? r) as Record<string, unknown>;
  const items = (Array.isArray(d?.items) ? d.items : []) as AgentMeOrderListItem[];
  const total = typeof d?.total === 'number' ? d.total : 0;
  const page = typeof d?.page === 'number' ? d.page : 1;
  const limit = typeof d?.limit === 'number' ? d.limit : 10;
  const totalPages =
    typeof d?.total_pages === 'number'
      ? d.total_pages
      : typeof d?.totalPages === 'number'
        ? d.totalPages
        : Math.max(1, Math.ceil(total / (limit || 1)));
  return { success: true, items, total, page, limit, totalPages };
}

function parseNoAuthLookupItems(raw: unknown): NoAuthLookupItem[] {
  const r = raw as Record<string, unknown>;
  const d = (r?.data ?? r) as Record<string, unknown>;
  const items = Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
  return items.filter((item): item is NoAuthLookupItem => {
    if (!item || typeof item !== 'object') return false;
    const obj = item as Record<string, unknown>;
    return typeof obj.id === 'number' && typeof obj.name === 'string';
  });
}

function parseNoAuthMarketplaceUsers(raw: unknown): {
  items: NoAuthMarketplaceUserItem[];
  totalPages: number;
} {
  const r = raw as Record<string, unknown>;
  const d = (r?.data ?? r) as Record<string, unknown>;
  const itemsRaw = Array.isArray(d?.items) ? d.items : [];
  const items = itemsRaw.filter((item): item is NoAuthMarketplaceUserItem => {
    if (!item || typeof item !== 'object') return false;
    const obj = item as Record<string, unknown>;
    return typeof obj.id === 'number';
  });
  const totalPages =
    typeof d?.total_pages === 'number'
      ? d.total_pages
      : typeof d?.totalPages === 'number'
        ? d.totalPages
        : 1;
  return { items, totalPages: Math.max(1, totalPages) };
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: getApiBaseUrl(),
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

    // 401: tokenni faqat himoyalangan marshrutlarda tozalash (login 401 tokenni o‘chirmasin)
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const status = error.response?.status;
        const url = error.config?.url || '';
        const isAuthPublic = url.includes('/agents/auth/');
        if (status === 401 && !isAuthPublic) {
          await AsyncStorage.removeItem(TOKEN_KEY);
          emitUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  // Login — POST /agents/auth/login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post<unknown>(
      API_ENDPOINTS.AGENT_AUTH_LOGIN,
      credentials
    );
    const normalized = normalizeLoginResponse(response.data);
    if (normalized.success && normalized.data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, normalized.data.token);
    }
    return normalized;
  }

  // Logout
  async logout(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }

  // Get token
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  // GET /agents/me/profile
  async getAgentProfile(): Promise<AgentProfileResponse> {
    const response = await this.api.get<unknown>(API_ENDPOINTS.AGENT_ME_PROFILE);
    return normalizeProfileResponse(response.data);
  }

  /** POST /agents/auth/send-code — 200: { message, data, error } */
  async sendAuthCode(phone: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post<{ message?: string }>(API_ENDPOINTS.AGENT_AUTH_SEND_CODE, {
      phone,
    });
    const d = response.data;
    return {
      success: true,
      message: d?.message?.trim() || 'SMS kodi yuborildi',
    };
  }

  /** POST /agents/auth/verify-code */
  async verifyAuthCode(phone: string, code: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post<{ message?: string }>(API_ENDPOINTS.AGENT_AUTH_VERIFY_CODE, {
      phone,
      code,
    });
    const d = response.data;
    return {
      success: true,
      message: d?.message?.trim() || 'Kod tasdiqlandi',
    };
  }

  /** POST /agents/auth/resend-code */
  async resendAuthCode(phone: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post<{ message?: string }>(API_ENDPOINTS.AGENT_AUTH_RESEND_CODE, {
      phone,
    });
    const d = response.data;
    return {
      success: true,
      message: d?.message?.trim() || 'SMS kodi qayta yuborildi',
    };
  }

  /** POST /agents/auth/set-password — returns JWT + agent */
  async setAgentPassword(phone: string, password: string): Promise<LoginResponse> {
    const response = await this.api.post<unknown>(API_ENDPOINTS.AGENT_AUTH_SET_PASSWORD, {
      phone,
      password,
    });
    const normalized = normalizeLoginResponse(response.data);
    if (normalized.success && normalized.data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, normalized.data.token);
    }
    return normalized;
  }

  /** POST /agents/me/change-password — `{ message, data, error }` */
  async changeAgentPassword(old_password: string, new_password: string): Promise<{ message: string }> {
    const response = await this.api.post<{ message?: string }>(
      API_ENDPOINTS.AGENT_ME_CHANGE_PASSWORD,
      { old_password, new_password }
    );
    const msg = response.data?.message?.trim();
    return { message: msg || 'Parol muvaffaqiyatli yangilandi' };
  }

  /** GET /agents/me/orders/active */
  async getMyActiveOrders(params?: { page?: number; limit?: number }): Promise<AgentMeOrdersPageResult> {
    const response = await this.api.get<unknown>(API_ENDPOINTS.AGENT_ME_ORDERS_ACTIVE, { params });
    return parseAgentMeOrdersPage(response.data);
  }

  /** GET /agents/me/orders/history */
  async getMyOrdersHistory(params?: { page?: number; limit?: number }): Promise<AgentMeOrdersPageResult> {
    const response = await this.api.get<unknown>(API_ENDPOINTS.AGENT_ME_ORDERS_HISTORY, { params });
    return parseAgentMeOrdersPage(response.data);
  }

  /** GET /agents/me/orders/analytics?from=&to= */
  async getMyOrdersAnalytics(params?: {
    from?: string;
    to?: string;
  }): Promise<{ success: boolean; data: AgentOrdersAnalytics | null }> {
    const response = await this.api.get<ApiEnvelope<AgentOrdersAnalytics>>(
      API_ENDPOINTS.AGENT_ME_ORDERS_ANALYTICS,
      { params }
    );
    const body = response.data;
    const data = body?.data ?? null;
    return { success: !!data && body?.error == null, data };
  }

  /** GET /agents/me/orders/{id} */
  async getMyOrderById(id: string): Promise<{ success: boolean; data: AgentMeOrderDetail | null }> {
    const response = await this.api.get<ApiEnvelope<AgentMeOrderDetail>>(
      API_ENDPOINTS.AGENT_ME_ORDER_BY_ID(id)
    );
    const body = response.data;
    const data = body?.data ?? null;
    return { success: !!data && body?.error == null, data };
  }

  /** GET /noauth/regions */
  async getNoAuthRegions(): Promise<NoAuthLookupItem[]> {
    const response = await this.api.get<unknown>('/noauth/regions');
    return parseNoAuthLookupItems(response.data);
  }

  /** GET /noauth/districts?region_id= */
  async getNoAuthDistricts(regionId?: number): Promise<NoAuthLookupItem[]> {
    const response = await this.api.get<unknown>('/noauth/districts', {
      params: regionId != null ? { region_id: regionId } : undefined,
    });
    return parseNoAuthLookupItems(response.data);
  }

  /** GET /noauth/mfys?district_id= */
  async getNoAuthMfys(districtId?: number): Promise<NoAuthLookupItem[]> {
    const response = await this.api.get<unknown>('/noauth/mfys', {
      params: districtId != null ? { district_id: districtId } : undefined,
    });
    return parseNoAuthLookupItems(response.data);
  }

  /** GET /noauth/marketplace-users?page=1&limit=10&q= */
  async getNoAuthMarketplaceUsers(params?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{ items: NoAuthMarketplaceUserItem[]; totalPages: number }> {
    const response = await this.api.get<unknown>('/noauth/marketplace-users', { params });
    return parseNoAuthMarketplaceUsers(response.data);
  }

  /** `/noauth/marketplace-users` listidan ID bo‘yicha izlab topish */
  async findNoAuthMarketplaceUserById(
    userId: number,
    options?: { limit?: number; maxPages?: number }
  ): Promise<NoAuthMarketplaceUserItem | null> {
    const limit = options?.limit ?? 100;
    const maxPages = options?.maxPages ?? 30;

    let page = 1;
    while (page <= maxPages) {
      const { items, totalPages } = await this.getNoAuthMarketplaceUsers({ page, limit });
      const found = items.find((x) => x.id === userId);
      if (found) return found;
      if (page >= totalPages) break;
      page += 1;
    }
    return null;
  }

  /** POST /agents/me/orders/{id}/payment-to-punkt — tana yo‘q, idempotent */
  async declareMyOrderPaymentToPunkt(id: string): Promise<{ message: string }> {
    const response = await this.api.post<ApiEnvelope<unknown>>(
      API_ENDPOINTS.AGENT_ME_ORDER_PAYMENT_TO_PUNKT(id)
    );
    const msg = response.data?.message?.trim();
    return { message: msg || "Punktga to'lov e'lon qilindi" };
  }

  /** POST /agents/me/orders/{id}/deliver — tana yo‘q */
  async deliverMyOrder(id: string): Promise<{ message: string }> {
    const response = await this.api.post<ApiEnvelope<unknown>>(
      API_ENDPOINTS.AGENT_ME_ORDER_DELIVER(id)
    );
    const msg = response.data?.message?.trim();
    return { message: msg || 'Buyurtma yetkazildi deb belgilandi' };
  }

  /** GET /agents/me/kpi/today — bugungi KPI (UTC kun) */
  async getAgentKpiToday(): Promise<{ success: boolean; data: AgentKpiToday | null }> {
    const response = await this.api.get<ApiEnvelope<AgentKpiToday>>(API_ENDPOINTS.AGENT_ME_KPI_TODAY);
    const body = response.data;
    const data = body?.data ?? null;
    const ok = data != null && body?.error == null;
    return { success: ok, data };
  }

  /** GET /agents/me/kpi/history?from=&to= (YYYY-MM-DD, UTC) */
  async getAgentKpiHistory(params?: {
    from?: string;
    to?: string;
  }): Promise<{ success: boolean; days: AgentKpiHistoryDay[] }> {
    const response = await this.api.get<ApiEnvelope<{ days?: AgentKpiHistoryDay[] }>>(
      API_ENDPOINTS.AGENT_ME_KPI_HISTORY,
      { params }
    );
    const body = response.data;
    const raw = body?.data as { days?: AgentKpiHistoryDay[] } | AgentKpiHistoryDay[] | null | undefined;
    const days = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.days)
        ? raw.days
        : [];
    const ok = body?.error == null;
    return { success: ok, days };
  }

  /** GET /agents/me/notifications */
  async getNotifications(params?: { page?: number; limit?: number }): Promise<AgentNotificationsListResult> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    if (!NOTIFICATIONS_API_ENABLED) {
      return {
        success: true,
        items: [],
        total: 0,
        unread_count: 0,
        page,
        limit,
        total_pages: 0,
      };
    }
    const response = await this.api.get<ApiEnvelope<AgentNotificationsListData>>(
      API_ENDPOINTS.AGENT_ME_NOTIFICATIONS,
      { params: { page, limit } }
    );
    const body = response.data;
    const d = body?.data;
    if (!d || body?.error != null) {
      return {
        success: false,
        items: [],
        total: 0,
        unread_count: 0,
        page,
        limit,
        total_pages: 0,
        message: typeof body?.message === 'string' ? body.message : undefined,
      };
    }
    return {
      success: true,
      items: d.items ?? [],
      total: d.total ?? 0,
      unread_count: d.unread_count ?? 0,
      page: d.page ?? page,
      limit: d.limit ?? limit,
      total_pages: d.total_pages ?? 0,
    };
  }

  /** GET /agents/me/notifications/unread-count */
  async getAgentNotificationsUnreadCount(): Promise<number> {
    if (!NOTIFICATIONS_API_ENABLED) return 0;
    const response = await this.api.get<ApiEnvelope<{ unread_count: number }>>(
      API_ENDPOINTS.AGENT_ME_NOTIFICATIONS_UNREAD_COUNT
    );
    return response.data?.data?.unread_count ?? 0;
  }

  /** PATCH /agents/me/notifications/:id/read */
  async markNotificationRead(notificationId: number | string): Promise<{ success: boolean; message?: string }> {
    if (!NOTIFICATIONS_API_ENABLED) return { success: true };
    try {
      const response = await this.api.patch<ApiEnvelope<unknown>>(
        API_ENDPOINTS.AGENT_ME_NOTIFICATION_READ(notificationId)
      );
      const body = response.data;
      return { success: body?.error == null, message: typeof body?.message === 'string' ? body.message : undefined };
    } catch {
      return { success: false };
    }
  }

  /** PATCH /agents/me/notifications/read-all */
  async markAllNotificationsRead(): Promise<{ success: boolean; message?: string }> {
    if (!NOTIFICATIONS_API_ENABLED) return { success: true };
    try {
      const response = await this.api.patch<ApiEnvelope<unknown>>(
        API_ENDPOINTS.AGENT_ME_NOTIFICATIONS_READ_ALL
      );
      const body = response.data;
      return { success: body?.error == null, message: typeof body?.message === 'string' ? body.message : undefined };
    } catch {
      return { success: false };
    }
  }

  // Get Orders For Payment
  async getOrdersForPayment(): Promise<OrdersForPaymentResponse> {
    const response = await this.api.get<OrdersForPaymentResponse>(
      API_ENDPOINTS.AGENT_ORDERS_FOR_PAYMENT
    );
    return response.data;
  }

  // Pay to Punkt
  async payToPunkt(orderId: string): Promise<PayToPunktResponse> {
    const response = await this.api.post<PayToPunktResponse>(
      API_ENDPOINTS.AGENT_PAY_PUNKT(orderId)
    );
    return response.data;
  }

  // Get Payment Transactions
  async getPaymentTransactions(params?: GetPaymentTransactionsParams): Promise<PaymentTransactionsResponse> {
    const response = await this.api.get<PaymentTransactionsResponse>(
      API_ENDPOINTS.AGENT_PAYMENT_TRANSACTIONS,
      { params }
    );
    return response.data;
  }

  // Get Payment Balance
  async getPaymentBalance(): Promise<PaymentBalanceResponse> {
    const response = await this.api.get<PaymentBalanceResponse>(
      API_ENDPOINTS.AGENT_PAYMENT_BALANCE
    );
    return response.data;
  }
}

export const apiService = new ApiService();


