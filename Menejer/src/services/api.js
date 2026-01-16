const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API helper functions
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Xatolik yuz berdi');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Login API
export const login = async (phone, password, deviceId = null, deviceInfo = {}) => {
  const response = await apiRequest('/viloyat-managers/login', {
    method: 'POST',
    body: JSON.stringify({
      phone,
      password,
      ...(deviceId && { deviceId }),
      ...(Object.keys(deviceInfo).length > 0 && { deviceInfo }),
    }),
  });
  
  if (response.token) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  
  return response;
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to build query string
const buildQueryString = (params) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Get Punkts
export const getPunkts = async (filters = {}) => {
  const queryString = buildQueryString(filters);
  return await apiRequest(`/viloyat-managers/data/punkts${queryString}`, {
    method: 'GET',
  });
};

// Get Agents
export const getAgents = async (filters = {}) => {
  const queryString = buildQueryString(filters);
  return await apiRequest(`/viloyat-managers/data/agents${queryString}`, {
    method: 'GET',
  });
};

// Get Dokons
export const getDokons = async (filters = {}) => {
  const queryString = buildQueryString(filters);
  return await apiRequest(`/viloyat-managers/data/dokons${queryString}`, {
    method: 'GET',
  });
};

// Get Tumans
export const getTumans = async (filters = {}) => {
  const queryString = buildQueryString(filters);
  return await apiRequest(`/viloyat-managers/data/tumans${queryString}`, {
    method: 'GET',
  });
};

// Get Orders - Tuman
export const getTumanOrders = async (type = '', filters = {}) => {
  const queryString = buildQueryString(filters);
  const endpoint = type 
    ? `/viloyat-managers/orders/tuman/${type}${queryString}`
    : `/viloyat-managers/orders/tuman${queryString}`;
  return await apiRequest(endpoint, { method: 'GET' });
};

// Get Orders - Maxalla
export const getMaxallaOrders = async (type = '', filters = {}) => {
  const queryString = buildQueryString(filters);
  const endpoint = type 
    ? `/viloyat-managers/orders/maxalla/${type}${queryString}`
    : `/viloyat-managers/orders/maxalla${queryString}`;
  return await apiRequest(endpoint, { method: 'GET' });
};
