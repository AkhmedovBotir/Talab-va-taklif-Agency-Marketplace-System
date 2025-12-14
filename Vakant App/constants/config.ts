// API Configuration
export const API_BASE_URL = 'http://192.168.1.6:5000';
export const API_VACANCY_AUTH_URL = `${API_BASE_URL}/api/vacancy-auth`;
export const API_VACANCY_URL = `${API_BASE_URL}/api/vacancy`;
export const API_VACANCY_PROFILE_URL = `${API_BASE_URL}/api/vacancy-profile`;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@vakant:auth_token',
  USER_DATA: '@vakant:user_data',
} as const;

// Code expiration time (5 minutes)
export const CODE_EXPIRATION_MINUTES = 5;
