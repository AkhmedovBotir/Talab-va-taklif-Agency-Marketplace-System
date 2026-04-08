const API_BASE_URL = 'https://api.ttsa.uz/api';
const MANAGER_API_BASE_URL = 'https://api.ttsa.uz/api/v1';

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

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const extractToken = (payload) =>
  payload?.token || payload?.data?.token || payload?.data?.access_token || null;

const extractManager = (payload) =>
  payload?.manager || payload?.data?.manager || payload?.data?.user || payload?.data || null;

const persistAuth = (payload) => {
  const token = extractToken(payload);
  const manager = extractManager(payload);

  if (token) {
    localStorage.setItem('token', token);
  }

  if (manager) {
    localStorage.setItem('user', JSON.stringify(manager));
  }
};

const managerApiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const url = `${MANAGER_API_BASE_URL}${endpoint}`;
  const response = await fetch(url, config);
  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.message || 'Xatolik yuz berdi');
  }

  return data;
};

export const sendManagerCode = async (phone) => {
  return await managerApiRequest('/managers/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
};

export const verifyManagerCode = async (phone, code) => {
  return await managerApiRequest('/managers/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
};

export const resendManagerCode = async (phone) => {
  return await managerApiRequest('/managers/auth/resend-code', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
};

export const setManagerPassword = async (phone, password) => {
  const response = await managerApiRequest('/managers/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
  persistAuth(response);
  return response;
};

// Login API
export const login = async (phone, password) => {
  const response = await managerApiRequest('/managers/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
  persistAuth(response);
  return response;
};

export const getManagerProfile = async () => {
  const response = await managerApiRequest('/managers/me/profile', {
    method: 'GET',
  });
  const manager = extractManager(response);
  if (manager) {
    localStorage.setItem('user', JSON.stringify(manager));
  }
  return response;
};

export const changeManagerPassword = async (oldPassword, newPassword) => {
  return await managerApiRequest('/managers/me/change-password', {
    method: 'POST',
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });
};

export const getManagerNotifications = async (filters = {}) => {
  const queryString = buildQueryString({
    page: filters.page,
    limit: filters.limit,
  });
  return await managerApiRequest(`/managers/me/notifications${queryString}`, {
    method: 'GET',
  });
};

export const getManagerNotificationsUnreadCount = async () => {
  return await managerApiRequest('/managers/me/notifications/unread-count', {
    method: 'GET',
  });
};

export const markManagerNotificationRead = async (id) => {
  return await managerApiRequest(`/managers/me/notifications/${id}/read`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
};

export const markAllManagerNotificationsRead = async () => {
  return await managerApiRequest('/managers/me/notifications/read-all', {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
};

export const getNoAuthRegions = async () => {
  return await managerApiRequest('/noauth/regions', {
    method: 'GET',
    headers: {},
  });
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

/** Browser WebSocket URL for manager notification stream (token in query). */
export const getManagerNotificationsWsUrl = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const wsBase = MANAGER_API_BASE_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  return `${wsBase}/managers/me/notifications/ws?token=${encodeURIComponent(token)}`;
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

const normalizePaginatedResponse = (payload) => {
  const paged = payload?.data?.items ? payload.data : payload;
  return {
    success: payload?.success ?? true,
    message: payload?.message || '',
    data: paged?.items || [],
    total: paged?.total || 0,
    page: paged?.page || 1,
    limit: paged?.limit || 10,
    totalPages: paged?.total_pages || paged?.totalPages || 1,
  };
};

// Get Punkts
export const getPunkts = async (filters = {}) => {
  const queryString = buildQueryString({
    page: filters.page,
    limit: filters.limit,
    q: filters.search || filters.q,
  });
  const response = await managerApiRequest(`/noauth/punkts${queryString}`, { method: 'GET' });
  return normalizePaginatedResponse(response);
};

// Get Agents
export const getAgents = async (filters = {}) => {
  const queryString = buildQueryString({
    page: filters.page,
    limit: filters.limit,
    q: filters.search || filters.q,
  });
  const response = await managerApiRequest(`/noauth/agents${queryString}`, { method: 'GET' });
  return normalizePaginatedResponse(response);
};

// Get Maxalla do'konlari
export const getDokons = async (filters = {}) => {
  const queryString = buildQueryString({
    page: filters.page,
    limit: filters.limit,
    q: filters.search || filters.q,
    district_id: filters.tuman || filters.district_id,
    mfy_id: filters.mfy || filters.mfy_id,
  });
  const response = await managerApiRequest(`/noauth/local-shops${queryString}`, { method: 'GET' });
  return normalizePaginatedResponse(response);
};

export const getContragents = async (filters = {}) => {
  const queryString = buildQueryString({
    page: filters.page,
    limit: filters.limit,
    q: filters.search || filters.q,
    nested_limit: filters.nested_limit || 30,
    include: filters.include || '',
  });
  const response = await managerApiRequest(`/noauth/contragents${queryString}`, { method: 'GET' });
  return normalizePaginatedResponse(response);
};

export const getMarketplaceUsers = async (filters = {}) => {
  const queryString = buildQueryString({
    page: filters.page,
    limit: filters.limit,
    q: filters.search || filters.q,
  });
  const response = await managerApiRequest(`/noauth/marketplace-users${queryString}`, { method: 'GET' });
  return normalizePaginatedResponse(response);
};

// Get Tumans (districts)
export const getTumans = async (filters = {}) => {
  const queryString = buildQueryString({
    region_id: filters.region_id || filters.viloyat_id,
  });
  const response = await managerApiRequest(`/noauth/districts${queryString}`, { method: 'GET' });
  const list = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : [];
  const search = (filters.search || '').toLowerCase();
  const filtered = search
    ? list.filter((item) => (item?.name || '').toLowerCase().includes(search))
    : list;

  return {
    success: true,
    data: filtered,
    total: filtered.length,
    page: 1,
    limit: filtered.length || 20,
    totalPages: 1,
  };
};

export const getMfys = async (filters = {}) => {
  const queryString = buildQueryString({
    district_id: filters.district_id || filters.tuman_id,
  });
  const response = await managerApiRequest(`/noauth/mfys${queryString}`, { method: 'GET' });
  const list = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : [];
  return {
    success: true,
    data: list,
  };
};

export const getManagerOrderPipelineOverview = async () => {
  return await managerApiRequest('/managers/order-pipeline/overview', {
    method: 'GET',
  });
};

export const getManagerOrderPipelineAll = async (filters = {}) => {
  const queryString = buildQueryString({
    page: filters.page,
    limit: filters.limit,
  });
  const response = await managerApiRequest(`/managers/order-pipeline/all${queryString}`, {
    method: 'GET',
  });
  return normalizePaginatedResponse(response);
};

const ORDER_PIPELINE_STAGE_ENDPOINTS = {
  'marketplace-created': '/managers/order-pipeline/marketplace-created',
  'punkt-inbox': '/managers/order-pipeline/punkt-inbox',
  'contragent-requests-created': '/managers/order-pipeline/contragent-requests-created',
  'punkt-collected-pending': '/managers/order-pipeline/punkt-collected-pending',
  'punkt-ready-pending': '/managers/order-pipeline/punkt-ready-pending',
  'agent-assign-pending': '/managers/order-pipeline/agent-assign-pending',
  'agent-payment-pending': '/managers/order-pipeline/agent-payment-pending',
  'payment-confirm-pending': '/managers/order-pipeline/payment-confirm-pending',
  'post-payment-delivery-pending': '/managers/order-pipeline/post-payment-delivery-pending',
  'remainder-handover-pending': '/managers/order-pipeline/remainder-handover-pending',
  'ready-for-agent-deliver': '/managers/order-pipeline/ready-for-agent-deliver',
  delivered: '/managers/order-pipeline/delivered',
};

export const getManagerOrderPipelineStage = async (stage, filters = {}) => {
  const endpoint = ORDER_PIPELINE_STAGE_ENDPOINTS[stage];
  if (!endpoint) {
    throw new Error('Noto‘g‘ri stage tanlandi');
  }

  const queryString = buildQueryString({
    page: filters.page,
    limit: filters.limit,
  });
  const response = await managerApiRequest(`${endpoint}${queryString}`, {
    method: 'GET',
  });
  return normalizePaginatedResponse(response);
};

export const getManagerProductComments = async (filters = {}) => {
  const queryString = buildQueryString({
    page: filters.page,
    limit: filters.limit,
    status: filters.status,
    escalated: filters.escalated,
  });
  const response = await managerApiRequest(`/managers/product-comments${queryString}`, {
    method: 'GET',
  });
  return normalizePaginatedResponse(response);
};

export const getManagerProductCommentById = async (ratingId) => {
  return await managerApiRequest(`/managers/product-comments/${ratingId}`, {
    method: 'GET',
  });
};

export const addManagerProductCommentNote = async (ratingId, note) => {
  return await managerApiRequest(`/managers/product-comments/${ratingId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
};

export const addManagerProductCommentCall = async (ratingId, note) => {
  return await managerApiRequest(`/managers/product-comments/${ratingId}/calls`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
};

export const escalateManagerProductComment = async (ratingId, note) => {
  return await managerApiRequest(`/managers/product-comments/${ratingId}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
};

export const resolveManagerProductComment = async (ratingId, note) => {
  return await managerApiRequest(`/managers/product-comments/${ratingId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ note }),
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
