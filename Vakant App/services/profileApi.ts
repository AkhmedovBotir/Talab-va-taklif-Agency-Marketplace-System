import { API_VACANCY_PROFILE_URL, STORAGE_KEYS } from '@/constants/config';
import { handleUnauthorized, isUnauthorizedError } from '@/utils/authUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Region } from './api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ApplicantProfile {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  birthDate: string;
  avatar?: string | null;
  viloyat?: Region | string;
  tuman?: Region | string;
  mfy?: Region | string;
  status: 'active' | 'inactive';
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateAvatarPayload {
  avatar: string;
}

export interface UpdateLocationPayload {
  viloyat?: string;
  tuman?: string;
  mfy?: string;
}

class ProfileApiService {
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
      
      const response = await fetch(`${API_VACANCY_PROFILE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Check for 401 or unauthorized errors
        if (response.status === 401 || isUnauthorizedError(data, response)) {
          await handleUnauthorized();
          throw new Error(data.message || 'Avtorizatsiya talab qilinadi');
        }
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error: any) {
      console.error('Profile API Error:', error);
      
      // Check if error is unauthorized
      if (isUnauthorizedError(error)) {
        await handleUnauthorized();
        throw new Error('Avtorizatsiya talab qilinadi');
      }
      
      throw error;
    }
  }

  async getProfile(): Promise<ApplicantProfile> {
    const response = await this.request<ApplicantProfile>('/me', {
      method: 'GET',
    });
    
    console.log('Profile API Response:', JSON.stringify(response, null, 2));
    
    // Handle different response structures
    if (response.data) {
      return response.data;
    }
    
    // If response itself is the data (direct return from API)
    if (response && typeof response === 'object' && '_id' in response) {
      return response as unknown as ApplicantProfile;
    }
    
    // If response has nested data structure
    if ((response as any).data && typeof (response as any).data === 'object') {
      return (response as any).data;
    }
    
    throw new Error('Profil ma\'lumotlari topilmadi');
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<ApplicantProfile> {
    const response = await this.request<ApplicantProfile>('/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    
    return response.data || (response as any);
  }

  async updatePassword(payload: UpdatePasswordPayload): Promise<void> {
    await this.request<any>('/me/password', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async updateAvatar(payload: UpdateAvatarPayload): Promise<ApplicantProfile> {
    const response = await this.request<ApplicantProfile>('/me/avatar', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    
    return response.data || (response as any);
  }

  async updateLocation(payload: UpdateLocationPayload): Promise<ApplicantProfile> {
    const response = await this.request<ApplicantProfile>('/me/location', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    
    return response.data || (response as any);
  }
}

export const profileApi = new ProfileApiService();
