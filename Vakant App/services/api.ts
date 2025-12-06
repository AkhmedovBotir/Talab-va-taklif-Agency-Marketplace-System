import { API_VACANCY_AUTH_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  exists?: boolean;
}

export interface Region {
  _id: string;
  name: string;
  type: 'region' | 'district' | 'mfy';
  code?: string;
  parent?: string;
}

export interface VacancyApplicant {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  birthDate: string;
  viloyat: string | Region;
  tuman: string | Region;
  mfy: string | Region;
  status: 'active' | 'inactive';
}

class ApiService {
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
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(`${API_VACANCY_AUTH_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Regions
  async getRegions(type: 'region' | 'district' | 'mfy', parentId?: string): Promise<Region[]> {
    const params = new URLSearchParams({ type });
    if (parentId) {
      params.append('parentId', parentId);
    }
    
    const response = await this.request<Region[]>(`/regions?${params.toString()}`, {
      method: 'GET',
    });
    return response.data || [];
  }

  // Register: Check phone
  async checkPhone(phone: string): Promise<boolean> {
    const response = await this.request<{ exists: boolean }>(
      `/register/check?phone=${encodeURIComponent(phone)}`,
      { method: 'GET' }
    );
    return response.exists ?? false;
  }

  // Register: Send code
  async registerSendCode(phone: string): Promise<void> {
    await this.request('/register/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  // Register: Verify code only
  async registerVerifyCode(phone: string, code: string): Promise<void> {
    await this.request('/register/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  // Register: Confirm & create account
  async registerConfirm(data: {
    firstName: string;
    lastName: string;
    phone: string;
    gender: 'male' | 'female' | 'other';
    birthDate: string;
    viloyat: string;
    tuman: string;
    mfy: string;
    password: string;
    code: string;
  }): Promise<{ token: string; applicant: VacancyApplicant }> {
    const response = await this.request<{ token: string; applicant: VacancyApplicant }>(
      '/register/confirm',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  // Login: Send code
  async loginSendCode(phone: string, password: string): Promise<void> {
    await this.request('/login/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  }

  // Login: Confirm code
  async loginConfirm(phone: string, code: string): Promise<{ token: string; applicant: VacancyApplicant }> {
    const response = await this.request<{ token: string; applicant: VacancyApplicant }>(
      '/login/confirm',
      {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      }
    );
    return response.data!;
  }

  // Forgot password: Send code
  async forgotPasswordSendCode(phone: string): Promise<void> {
    await this.request('/password/forgot/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  // Forgot password: Confirm & set new password
  async forgotPasswordConfirm(phone: string, code: string, newPassword: string): Promise<void> {
    await this.request('/password/forgot/confirm', {
      method: 'POST',
      body: JSON.stringify({ phone, code, newPassword }),
    });
  }

  // Resend code
  async resendCode(
    phone: string,
    purpose: 'register' | 'login' | 'forgot_password',
    password?: string
  ): Promise<void> {
    const body: any = { phone, purpose };
    if (purpose === 'login' && password) {
      body.password = password;
    }
    
    await this.request('/resend-code', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export const apiService = new ApiService();

