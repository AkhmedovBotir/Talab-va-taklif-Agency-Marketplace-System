import { API_VACANCY_URL, STORAGE_KEYS } from '@/constants/config';
import { handleUnauthorized, isUnauthorizedError } from '@/utils/authUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationType =
  | 'info'
  | 'warning'
  | 'success'
  | 'error'
  | 'announcement'
  | 'promotion'
  | 'update';

export interface VacancyNotification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetType: string;
  createdAt: string;
  isRead?: boolean;
}

export interface NotificationListResponse {
  data: VacancyNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class NotificationApiService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getHeaders();

    try {
      const response = await fetch(`${API_VACANCY_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || isUnauthorizedError(data, response)) {
          await handleUnauthorized();
          throw new Error(data.message || 'Avtorizatsiya talab qilinadi');
        }

        throw new Error(data.message || 'Server xatosi');
      }

      return data;
    } catch (error: any) {
      console.error('Notifications API error:', error);

      if (isUnauthorizedError(error)) {
        await handleUnauthorized();
        throw new Error('Avtorizatsiya talab qilinadi');
      }

      throw error;
    }
  }

  async getNotifications(params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const response = await this.request<{
      success: boolean;
      data: VacancyNotification[];
      pagination: NotificationListResponse['pagination'];
    }>(`/notifications/list${query ? `?${query}` : ''}`, {
      method: 'GET',
    });

    return {
      data: response.data || [],
      pagination:
        response.pagination || {
          page: params?.page || 1,
          limit: params?.limit || 20,
          total: response.data?.length || 0,
          pages: 1,
        },
    };
  }

  async getUnreadCount(): Promise<number> {
    const response = await this.request<{
      success: boolean;
      data: { unreadCount: number };
    }>('/notifications/unread-count', {
      method: 'GET',
    });

    return response.data?.unreadCount ?? 0;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.request(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async markAllAsRead(): Promise<void> {
    await this.request('/notifications/read-all', {
      method: 'POST',
    });
  }
}

export const notificationApi = new NotificationApiService();

