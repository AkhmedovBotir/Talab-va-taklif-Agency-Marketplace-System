import { API_BASE_URL } from '../config/api';
import { parseAdminPermissions, sanitizePermissionsPayload } from '../utils/permissions';
import { ApiHttpError } from '../utils/apiError';

export { API_BASE_URL };

const getToken = () => localStorage.getItem('adminToken');

const clearAuthAndRedirect = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  window.location.href = '/login';
};

const normalizeCommonSuccess = (data) => {
  if (data && typeof data === 'object' && data.success === undefined) {
    return { success: true, ...data };
  }
  return data;
};

const isAuthEndpoint = (endpoint) =>
  endpoint.includes('/admins/login') || endpoint.includes('/admins/auth/check');

const apiRequest = async (endpoint, options = {}, requiresAuth = true) => {
  const { noAuthRedirect = false, ...fetchOptions } = options;
  const token = getToken();
  const config = {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(requiresAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  let data = {};

  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      if (response.status === 401 && !isAuthEndpoint(endpoint) && !noAuthRedirect) clearAuthAndRedirect();
      throw new Error(`Server xatolik: ${response.status}`);
    }
  }

  if (!response.ok) {
    const msg = data.message || data.error || "So'rovda xatolik yuz berdi";
    if (response.status === 401) {
      if (!isAuthEndpoint(endpoint) && !noAuthRedirect) clearAuthAndRedirect();
      throw new ApiHttpError(data.message || "Sessiya tugadi. Qayta kiring.", 401, data);
    }
    if (response.status === 403) {
      throw new ApiHttpError(data.message || "Ruxsat berilmagan", 403, data);
    }
    if (response.status === 404) {
      throw new ApiHttpError(data.message || 'Topilmadi', 404, data);
    }
    if (response.status === 409) {
      throw new ApiHttpError(data.message || 'Bu maʼlumot allaqachon mavjud', 409, data);
    }
    throw new ApiHttpError(msg, response.status, data);
  }

  return normalizeCommonSuccess(data);
};

/** JSON body yubormaydi — brauzer multipart boundary ni o‘zi qo‘yadi */
const apiMultipartRequest = async (endpoint, formData, { method = 'POST', noAuthRedirect = false } = {}) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  let data = {};

  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      if (response.status === 401 && !noAuthRedirect) clearAuthAndRedirect();
      throw new Error(`Server xatolik: ${response.status}`);
    }
  }

  if (!response.ok) {
    const msg = data.message || data.error || "So'rovda xatolik yuz berdi";
    if (response.status === 401) {
      if (!noAuthRedirect) clearAuthAndRedirect();
      throw new ApiHttpError(data.message || "Sessiya tugadi. Qayta kiring.", 401, data);
    }
    if (response.status === 403) {
      throw new ApiHttpError(data.message || 'Ruxsat berilmagan', 403, data);
    }
    if (response.status === 404) {
      throw new ApiHttpError(data.message || 'Topilmadi', 404, data);
    }
    throw new ApiHttpError(msg, response.status, data);
  }

  return normalizeCommonSuccess(data);
};

const appendProductFormFields = (formData, form) => {
  formData.append('contragent_id', String(form.contragent_id));
  formData.append('name', String(form.name || '').trim());
  formData.append('description', form.descriptionNormalized ?? form.description ?? '');
  formData.append('price', String(form.price));
  formData.append('original_price', String(form.original_price));
  formData.append('category_id', String(form.category_id));
  formData.append('subcategory_id', String(form.subcategory_id));
  formData.append('quantity', String(form.quantity));
  formData.append('unit', form.unit);
  formData.append('unit_size', String(form.unit_size || '').trim());
  formData.append('status', form.status === 'inactive' ? 'inactive' : 'active');
  formData.append('kpi_bonus_percent', String(form.kpi_bonus_percent));
};

const appendImageFiles = (formData, files, fieldName = 'images') => {
  for (const file of files) {
    if (file instanceof File) formData.append(fieldName, file);
  }
};

const appendTemplateFormFields = (formData, form) => {
  formData.append('name', String(form.name || '').trim());
  formData.append('description', String(form.description ?? ''));
  formData.append('category_id', String(form.category_id));
  formData.append('subcategory_id', String(form.subcategory_id));
  formData.append('unit', form.unit || 'dona');
  formData.append('unit_size', String(form.unit_size || '').trim());
  formData.append('status', form.status === 'inactive' ? 'inactive' : 'active');
};

const normalizeAdmin = (admin) => {
  if (!admin || typeof admin !== 'object') return admin;
  return {
    ...admin,
    _id: admin._id ?? admin.id,
    id: admin.id ?? admin._id,
    name: admin.name ?? admin.fullname,
    fullname: admin.fullname ?? admin.name,
    phone: admin.phone ?? admin.telefonRaqam,
    telefonRaqam: admin.telefonRaqam ?? admin.phone,
    permissions: parseAdminPermissions(admin),
    createdAt: admin.createdAt ?? admin.created_at,
    updatedAt: admin.updatedAt ?? admin.updated_at,
  };
};

const normalizeAdminResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeAdmin) };
  }
  if (response.data && typeof response.data === 'object') {
    // Paginated list shape: { items, total, page, limit, total_pages }
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeAdmin),
        },
      };
    }
    if (response.data.admin) {
      return {
        ...response,
        data: { ...response.data, admin: normalizeAdmin(response.data.admin) },
      };
    }
    if (response.data.token) {
      return {
        ...response,
        data: {
          ...response.data,
          ...(response.data.admin ? { admin: normalizeAdmin(response.data.admin) } : {}),
        },
      };
    }
    return { ...response, data: normalizeAdmin(response.data) };
  }
  return response;
};

const normalizeGeoEntity = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    _id: item._id ?? item.id,
    id: item.id ?? item._id,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeGeoResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeGeoEntity) };
  }
  if (response.data && typeof response.data === 'object') {
    return { ...response, data: normalizeGeoEntity(response.data) };
  }
  return response;
};

/** GET /admins/auth/check — token yaroqliligi (ruxsatlar qaytarmaydi) */
export const checkAuthToken = async (tokenOverride) => {
  const token = tokenOverride ?? getToken();
  if (!token) {
    throw new ApiHttpError('Token yaroqsiz', 401, null);
  }
  const query = tokenOverride ? `?token=${encodeURIComponent(token)}` : '';
  const response = await apiRequest(
    `/admins/auth/check${query}`,
    { method: 'GET', noAuthRedirect: true },
    !tokenOverride
  );
  return normalizeCommonSuccess(response);
};

export const adminAPI = {
  login: async (username, password) => {
    const response = await apiRequest(
      '/admins/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      },
      false
    );
    return normalizeAdminResponse(response);
  },

  checkAuth: checkAuthToken,

  getMe: async () =>
    normalizeAdminResponse(
      await apiRequest('/admins/me', { noAuthRedirect: true })
    ),

  getPermissionNames: async () => {
    const res = await apiRequest('/admins/permission-names');
    const items = res?.data?.items;
    return Array.isArray(items) ? items : [];
  },

  getAllAdmins: async ({ page = 1, limit = 10 } = {}) =>
    normalizeAdminResponse(await apiRequest(`/admins?page=${page}&limit=${limit}`)),
  getAdminById: async (id) => normalizeAdminResponse(await apiRequest(`/admins/${id}`)),

  createAdmin: async (adminData) => {
    const payload = {
      name: adminData.name || adminData.fullname,
      role: adminData.role || 'admin',
      phone: adminData.phone || adminData.telefonRaqam,
      username: (adminData.username || '').toLowerCase(),
      password: adminData.password || adminData.parol,
      status: adminData.status || 'active',
    };
    if (Array.isArray(adminData.permissions)) {
      payload.permissions = sanitizePermissionsPayload(adminData.permissions);
    }
    return normalizeAdminResponse(
      await apiRequest('/admins', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  },

  updateAdmin: async (id, adminData) => {
    const payload = {};
    if (adminData.name !== undefined) payload.name = adminData.name;
    if (adminData.fullname !== undefined) payload.name = adminData.fullname;
    if (adminData.role !== undefined) payload.role = adminData.role;
    if (adminData.phone !== undefined) payload.phone = adminData.phone;
    if (adminData.telefonRaqam !== undefined) payload.phone = adminData.telefonRaqam;
    if (adminData.username !== undefined) payload.username = adminData.username.toLowerCase();
    if (adminData.password !== undefined && String(adminData.password).trim() !== '') payload.password = adminData.password;
    if (adminData.parol !== undefined && String(adminData.parol).trim() !== '') payload.password = adminData.parol;
    if (adminData.status !== undefined) payload.status = adminData.status;
    if (Object.prototype.hasOwnProperty.call(adminData, 'permissions') && Array.isArray(adminData.permissions)) {
      payload.permissions = sanitizePermissionsPayload(adminData.permissions);
    }

    return normalizeAdminResponse(
      await apiRequest(`/admins/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    );
  },

  updateAdminStatus: async (id, status) =>
    normalizeAdminResponse(
      await apiRequest(`/admins/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),

  deleteAdmin: async (id) =>
    apiRequest(`/admins/${id}`, {
      method: 'DELETE',
    }),
};

export const regionAPI = {
  getAllRegions: async () => normalizeGeoResponse(await apiRequest('/regions')),
  getRegionById: async (id) => normalizeGeoResponse(await apiRequest(`/regions/${id}`)),
  createRegion: async (data) =>
    normalizeGeoResponse(
      await apiRequest('/regions', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  updateRegion: async (id, data) =>
    normalizeGeoResponse(
      await apiRequest(`/regions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),
  updateRegionStatus: async (id, status) =>
    normalizeGeoResponse(
      await apiRequest(`/regions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  deleteRegion: async (id) =>
    apiRequest(`/regions/${id}`, {
      method: 'DELETE',
    }),
};

export const districtAPI = {
  getAllDistricts: async () => normalizeGeoResponse(await apiRequest('/districts')),
  getDistrictById: async (id) => normalizeGeoResponse(await apiRequest(`/districts/${id}`)),
  createDistrict: async (data) =>
    normalizeGeoResponse(
      await apiRequest('/districts', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  updateDistrict: async (id, data) =>
    normalizeGeoResponse(
      await apiRequest(`/districts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),
  updateDistrictStatus: async (id, status) =>
    normalizeGeoResponse(
      await apiRequest(`/districts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  deleteDistrict: async (id) =>
    apiRequest(`/districts/${id}`, {
      method: 'DELETE',
    }),
};

export const mfyAPI = {
  getAllMFYs: async () => normalizeGeoResponse(await apiRequest('/mfys')),
  getMFYById: async (id) => normalizeGeoResponse(await apiRequest(`/mfys/${id}`)),
  createMFY: async (data) =>
    normalizeGeoResponse(
      await apiRequest('/mfys', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  updateMFY: async (id, data) =>
    normalizeGeoResponse(
      await apiRequest(`/mfys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),
  updateMFYStatus: async (id, status) =>
    normalizeGeoResponse(
      await apiRequest(`/mfys/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  deleteMFY: async (id) =>
    apiRequest(`/mfys/${id}`, {
      method: 'DELETE',
    }),
};

const normalizeContragentType = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    _id: item._id ?? item.id,
    id: item.id ?? item._id,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeContragentTypeResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeContragentType) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeContragentType),
        },
      };
    }
    return { ...response, data: normalizeContragentType(response.data) };
  }
  return response;
};

export const contragentTypeAPI = {
  getAllTypes: async ({ page = 1, limit = 10 } = {}) =>
    normalizeContragentTypeResponse(await apiRequest(`/contragent_type?page=${page}&limit=${limit}`)),
  getTypeById: async (id) => normalizeContragentTypeResponse(await apiRequest(`/contragent_type/${id}`)),
  createType: async (data) =>
    normalizeContragentTypeResponse(
      await apiRequest('/contragent_type', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  updateType: async (id, data) =>
    normalizeContragentTypeResponse(
      await apiRequest(`/contragent_type/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),
  updateTypeStatus: async (id, status) =>
    normalizeContragentTypeResponse(
      await apiRequest(`/contragent_type/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  deleteType: async (id) =>
    apiRequest(`/contragent_type/${id}`, {
      method: 'DELETE',
    }),
};

const normalizeContragent = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    _id: item._id ?? item.id,
    id: item.id ?? item._id,
    region_id: item.region_id ?? item.region?.id ?? item.region?._id,
    district_id: item.district_id ?? item.district?.id ?? item.district?._id,
    mfy_id: item.mfy_id ?? item.mfy?.id ?? item.mfy?._id,
    activity_type_id:
      item.activity_type_id ?? item.activityType?.id ?? item.activity_type?.id ?? item.contragent_type_id,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeContragentResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeContragent) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeContragent),
        },
      };
    }
    return { ...response, data: normalizeContragent(response.data) };
  }
  return response;
};

/** Kontragentlar API — jadval `contragents`, base `/contragents` */
export const contragentAPI = {
  /** limit serverda max 100 */
  getAll: async ({ page = 1, limit = 10 } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return normalizeContragentResponse(await apiRequest(`/contragents?page=${p}&limit=${l}`));
  },
  getById: async (id) => normalizeContragentResponse(await apiRequest(`/contragents/${id}`)),
  create: async (payload) =>
    normalizeContragentResponse(
      await apiRequest('/contragents', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),
  update: async (id, payload) =>
    normalizeContragentResponse(
      await apiRequest(`/contragents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
  updateStatus: async (id, status) =>
    normalizeContragentResponse(
      await apiRequest(`/contragents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  delete: async (id) =>
    apiRequest(`/contragents/${id}`, {
      method: 'DELETE',
    }),
};

const normalizeNeighborhoodShop = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    _id: item._id ?? item.id,
    id: item.id ?? item._id,
    region_id: item.region_id ?? item.region?.id ?? item.region?._id,
    district_id: item.district_id ?? item.district?.id ?? item.district?._id,
    mfy_id: item.mfy_id ?? item.mfy?.id ?? item.mfy?._id,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeNeighborhoodShopResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeNeighborhoodShop) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeNeighborhoodShop),
        },
      };
    }
    return { ...response, data: normalizeNeighborhoodShop(response.data) };
  }
  return response;
};

/** Maxalla do'konlari — `neighborhood_shops`, `/neighborhood_shops` */
export const neighborhoodShopAPI = {
  getAll: async ({ page = 1, limit = 10 } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return normalizeNeighborhoodShopResponse(await apiRequest(`/neighborhood_shops?page=${p}&limit=${l}`));
  },
  getById: async (id) => normalizeNeighborhoodShopResponse(await apiRequest(`/neighborhood_shops/${id}`)),
  create: async (payload) =>
    normalizeNeighborhoodShopResponse(
      await apiRequest('/neighborhood_shops', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),
  update: async (id, payload) =>
    normalizeNeighborhoodShopResponse(
      await apiRequest(`/neighborhood_shops/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
  updateStatus: async (id, status) =>
    normalizeNeighborhoodShopResponse(
      await apiRequest(`/neighborhood_shops/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  delete: async (id) =>
    apiRequest(`/neighborhood_shops/${id}`, {
      method: 'DELETE',
    }),
};

const normalizeNeighborhoodShopMonthlyConfig = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id ?? 1,
    monthlyPriceUzs: item.monthly_price_uzs ?? item.monthlyPriceUzs,
    monthly_price_uzs: item.monthly_price_uzs ?? item.monthlyPriceUzs,
    currency: item.currency ?? 'UZS',
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeNeighborhoodShopMonthlyConfigResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (response.data && typeof response.data === 'object') {
    return { ...response, data: normalizeNeighborhoodShopMonthlyConfig(response.data) };
  }
  return response;
};

const normalizeNeighborhoodShopSubscription = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id,
    neighborhoodShopId: item.neighborhood_shop_id ?? item.neighborhoodShopId,
    billingType: item.billing_type ?? item.billingType,
    billing_type: item.billing_type ?? item.billingType,
    monthlyPriceUzs: item.monthly_price_uzs ?? item.monthlyPriceUzs,
    monthly_price_uzs: item.monthly_price_uzs ?? item.monthlyPriceUzs,
    freeMonths: item.free_months ?? item.freeMonths,
    free_months: item.free_months ?? item.freeMonths,
    periodStartAt: item.period_start_at ?? item.periodStartAt,
    period_start_at: item.period_start_at ?? item.periodStartAt,
    periodEndAt: item.period_end_at ?? item.periodEndAt,
    period_end_at: item.period_end_at ?? item.periodEndAt,
    configMonthlyPriceUzs: item.config_monthly_price_uzs ?? item.configMonthlyPriceUzs,
    config_monthly_price_uzs: item.config_monthly_price_uzs ?? item.configMonthlyPriceUzs,
    effectiveMonthlyPriceUzs: item.effective_monthly_price_uzs ?? item.effectiveMonthlyPriceUzs,
    effective_monthly_price_uzs: item.effective_monthly_price_uzs ?? item.effectiveMonthlyPriceUzs,
    isInFreePeriod: Boolean(item.is_in_free_period ?? item.isInFreePeriod),
    is_in_free_period: Boolean(item.is_in_free_period ?? item.isInFreePeriod),
    isPeriodActive: Boolean(item.is_period_active ?? item.isPeriodActive),
    is_period_active: Boolean(item.is_period_active ?? item.isPeriodActive),
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeNeighborhoodShopSubscriptionResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (response.data && typeof response.data === 'object') {
    return { ...response, data: normalizeNeighborhoodShopSubscription(response.data) };
  }
  return response;
};

/** Maxalla do'koni — standart oylik narx (singleton) */
export const neighborhoodShopMonthlyConfigAPI = {
  get: async () =>
    normalizeNeighborhoodShopMonthlyConfigResponse(
      await apiRequest('/neighborhood-shop-monthly-config')
    ),
  update: async ({ monthly_price_uzs, currency }) =>
    normalizeNeighborhoodShopMonthlyConfigResponse(
      await apiRequest('/neighborhood-shop-monthly-config', {
        method: 'PUT',
        body: JSON.stringify({ monthly_price_uzs, currency }),
      })
    ),
};

/** Maxalla do'koni — obuna */
export const neighborhoodShopSubscriptionAPI = {
  get: async (shopId) =>
    normalizeNeighborhoodShopSubscriptionResponse(
      await apiRequest(`/neighborhood_shops/${shopId}/subscription`)
    ),
  upsert: async (shopId, payload) =>
    normalizeNeighborhoodShopSubscriptionResponse(
      await apiRequest(`/neighborhood_shops/${shopId}/subscription`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
};

const normalizeAgent = (item) => {
  if (!item || typeof item !== 'object') return item;
  const viloyat_id = item.viloyat_id ?? item.region_id ?? item.region?.id ?? item.region?._id;
  const tuman_id = item.tuman_id ?? item.district_id ?? item.district?.id ?? item.district?._id;
  const mfy_id = item.mfy_id ?? item.mfy?.id ?? item.mfy?._id;
  return {
    ...item,
    _id: item._id ?? item.id,
    id: item.id ?? item._id,
    viloyat_id,
    tuman_id,
    mfy_id,
    region_id: viloyat_id,
    district_id: tuman_id,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeAgentResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeAgent) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeAgent),
        },
      };
    }
    return { ...response, data: normalizeAgent(response.data) };
  }
  return response;
};

/** Agentlar — `/agents` (maydonlar: viloyat_id, tuman_id, mfy_id) */
export const agentAPI = {
  getAll: async ({ page = 1, limit = 10 } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return normalizeAgentResponse(await apiRequest(`/agents?page=${p}&limit=${l}`));
  },
  getById: async (id) => normalizeAgentResponse(await apiRequest(`/agents/${id}`)),
  create: async (payload) =>
    normalizeAgentResponse(
      await apiRequest('/agents', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),
  update: async (id, payload) =>
    normalizeAgentResponse(
      await apiRequest(`/agents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
  updateStatus: async (id, status) =>
    normalizeAgentResponse(
      await apiRequest(`/agents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  delete: async (id) =>
    apiRequest(`/agents/${id}`, {
      method: 'DELETE',
    }),
};

const normalizeManager = (item) => {
  if (!item || typeof item !== 'object') return item;
  const viloyat_id = item.viloyat_id ?? item.region_id ?? item.region?.id ?? item.region?._id;
  return {
    ...item,
    _id: item._id ?? item.id,
    id: item.id ?? item._id,
    viloyat_id,
    region_id: viloyat_id,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeManagerResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeManager) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeManager),
        },
      };
    }
    return { ...response, data: normalizeManager(response.data) };
  }
  return response;
};

/** Menejerlar — `/managers` */
export const managerAPI = {
  getAll: async ({ page = 1, limit = 10 } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return normalizeManagerResponse(await apiRequest(`/managers?page=${p}&limit=${l}`));
  },
  getById: async (id) => normalizeManagerResponse(await apiRequest(`/managers/${id}`)),
  create: async (payload) =>
    normalizeManagerResponse(
      await apiRequest('/managers', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),
  update: async (id, payload) =>
    normalizeManagerResponse(
      await apiRequest(`/managers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
  updateStatus: async (id, status) =>
    normalizeManagerResponse(
      await apiRequest(`/managers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  delete: async (id) =>
    apiRequest(`/managers/${id}`, {
      method: 'DELETE',
    }),
};

const normalizeCategory = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    _id: item._id ?? item.id,
    id: item.id ?? item._id,
    parent_id: item.parent_id ?? item.parent?.id ?? item.parent?._id ?? null,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeCategoryResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeCategory) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeCategory),
        },
      };
    }
    return { ...response, data: normalizeCategory(response.data) };
  }
  return response;
};

/** Kategoriyalar — `/categories` (parent_id=null) */
export const categoryAPI = {
  getAll: async ({ page = 1, limit = 10 } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return normalizeCategoryResponse(await apiRequest(`/categories?page=${p}&limit=${l}`));
  },
  getById: async (id) => normalizeCategoryResponse(await apiRequest(`/categories/${id}`)),
  create: async (payload) =>
    normalizeCategoryResponse(
      await apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),
  update: async (id, payload) =>
    normalizeCategoryResponse(
      await apiRequest(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
  updateStatus: async (id, status) =>
    normalizeCategoryResponse(
      await apiRequest(`/categories/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  delete: async (id) =>
    apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

/** Subkategoriyalar — `/subcategories` */
export const subcategoryAPI = {
  getAll: async ({ page = 1, limit = 10, parent_id } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    const parentPart = parent_id != null && parent_id !== '' ? `&parent_id=${encodeURIComponent(parent_id)}` : '';
    return normalizeCategoryResponse(await apiRequest(`/subcategories?page=${p}&limit=${l}${parentPart}`));
  },
  getById: async (id) => normalizeCategoryResponse(await apiRequest(`/subcategories/${id}`)),
  create: async (payload) =>
    normalizeCategoryResponse(
      await apiRequest('/subcategories', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),
  update: async (id, payload) =>
    normalizeCategoryResponse(
      await apiRequest(`/subcategories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
  updateStatus: async (id, status) =>
    normalizeCategoryResponse(
      await apiRequest(`/subcategories/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  delete: async (id) =>
    apiRequest(`/subcategories/${id}`, {
      method: 'DELETE',
    }),
};

const normalizePunkt = (item) => {
  if (!item || typeof item !== 'object') return item;
  const viloyat_id = item.viloyat_id ?? item.region_id ?? item.region?.id ?? item.region?._id;
  const tuman_id = item.tuman_id ?? item.district_id ?? item.district?.id ?? item.district?._id;
  return {
    ...item,
    _id: item._id ?? item.id,
    id: item.id ?? item._id,
    viloyat_id,
    tuman_id,
    region_id: viloyat_id,
    district_id: tuman_id,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizePunktResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizePunkt) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizePunkt),
        },
      };
    }
    return { ...response, data: normalizePunkt(response.data) };
  }
  return response;
};

/** Punkts jadvali — `/punkts` */
export const punktAPI = {
  getAll: async ({ page = 1, limit = 10 } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return normalizePunktResponse(await apiRequest(`/punkts?page=${p}&limit=${l}`));
  },
  getById: async (id) => normalizePunktResponse(await apiRequest(`/punkts/${id}`)),
  create: async (payload) =>
    normalizePunktResponse(
      await apiRequest('/punkts', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),
  update: async (id, payload) =>
    normalizePunktResponse(
      await apiRequest(`/punkts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
  updateStatus: async (id, status) =>
    normalizePunktResponse(
      await apiRequest(`/punkts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  delete: async (id) =>
    apiRequest(`/punkts/${id}`, {
      method: 'DELETE',
    }),
};

const normalizeProduct = (item) => {
  if (!item || typeof item !== 'object') return item;
  const imageItems = Array.isArray(item.image_items)
    ? item.image_items.map((img) => ({
        id: img.id ?? img._id,
        url: img.url ?? '',
        sort_order: img.sort_order ?? img.sortOrder ?? 0,
      }))
    : [];
  return {
    ...item,
    _id: item._id ?? item.id,
    id: item.id ?? item._id,
    product_code: item.product_code ?? item.productCode ?? '',
    contragent_id: item.contragent_id ?? item.contragent?.id ?? item.contragent?._id,
    category_id: item.category_id ?? item.category?.id ?? item.category?._id,
    subcategory_id: item.subcategory_id ?? item.subcategory?.id ?? item.subcategory?._id,
    moderation_status: item.moderation_status ?? item.moderationStatus ?? '',
    rejection_reason: item.rejection_reason ?? item.rejectionReason ?? '',
    images: Array.isArray(item.images)
      ? item.images.filter(Boolean)
      : imageItems.map((img) => img.url).filter(Boolean),
    image_items: imageItems,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeProductResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeProduct) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeProduct),
        },
      };
    }
    return { ...response, data: normalizeProduct(response.data) };
  }
  return response;
};

/** Mahsulotlar — `/products` (admin CRUD + moderatsiya) */
export const productAPI = {
  getAll: async ({ page = 1, limit = 10, contragent_id, moderation_status } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    let q = `?page=${p}&limit=${l}`;
    if (contragent_id != null && String(contragent_id).trim() !== '') {
      q += `&contragent_id=${encodeURIComponent(contragent_id)}`;
    }
    if (moderation_status != null && String(moderation_status).trim() !== '') {
      q += `&moderation_status=${encodeURIComponent(moderation_status)}`;
    }
    return normalizeProductResponse(await apiRequest(`/products${q}`));
  },
  getById: async (id) => normalizeProductResponse(await apiRequest(`/products/${id}`)),
  create: async (payload) =>
    normalizeProductResponse(
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),
  update: async (id, payload) =>
    normalizeProductResponse(
      await apiRequest(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
  updateStatus: async (id, status) =>
    normalizeProductResponse(
      await apiRequest(`/products/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  approve: async (id) =>
    normalizeProductResponse(
      await apiRequest(`/products/${id}/approve`, {
        method: 'PATCH',
      })
    ),
  reject: async (id, rejection_reason) =>
    normalizeProductResponse(
      await apiRequest(`/products/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejection_reason }),
      })
    ),
  delete: async (id) =>
    apiRequest(`/products/${id}`, {
      method: 'DELETE',
    }),
  /** Multipart: matn + 1–5 rasm fayl */
  createWithImages: async (form, files) => {
    const formData = new FormData();
    appendProductFormFields(formData, form);
    appendImageFiles(formData, files);
    return normalizeProductResponse(
      await apiMultipartRequest('/products/with-images', formData, { method: 'POST' })
    );
  },
  /** Multipart: matn; ixtiyoriy 1–5 fayl (yuborilsa barcha rasmlar almashtiriladi) */
  updateWithImages: async (id, form, files = []) => {
    const formData = new FormData();
    appendProductFormFields(formData, form);
    if (files.length) appendImageFiles(formData, files);
    return normalizeProductResponse(
      await apiMultipartRequest(`/products/${id}/with-images`, formData, { method: 'PUT' })
    );
  },
  addImages: async (id, files) => {
    const formData = new FormData();
    appendImageFiles(formData, files);
    return normalizeProductResponse(
      await apiMultipartRequest(`/products/${id}/images`, formData, { method: 'POST' })
    );
  },
  replaceAllImages: async (id, files) => {
    const formData = new FormData();
    appendImageFiles(formData, files);
    return normalizeProductResponse(
      await apiMultipartRequest(`/products/${id}/images`, formData, { method: 'PUT' })
    );
  },
  replaceImage: async (id, imageId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return normalizeProductResponse(
      await apiMultipartRequest(`/products/${id}/images/${imageId}`, formData, { method: 'PUT' })
    );
  },
  deleteImage: async (id, imageId) =>
    normalizeProductResponse(
      await apiRequest(`/products/${id}/images/${imageId}`, {
        method: 'DELETE',
      })
    ),
};

const normalizeMarketplaceUser = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    _id: item._id ?? item.id,
    id: item.id ?? item._id,
    region_id: item.region_id ?? item.region?.id ?? item.region?._id,
    district_id: item.district_id ?? item.district?.id ?? item.district?._id,
    mfy_id: item.mfy_id ?? item.mfy?.id ?? item.mfy?._id,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeMarketplaceUserResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeMarketplaceUser) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeMarketplaceUser),
        },
      };
    }
    return { ...response, data: normalizeMarketplaceUser(response.data) };
  }
  return response;
};

/** Marketplace foydalanuvchilar — `/marketplace-users` */
export const marketplaceUserAPI = {
  getAll: async ({
    page = 1,
    limit = 10,
    status,
    region_id,
    district_id,
    mfy_id,
    phone,
    q,
  } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    const params = new URLSearchParams({ page: String(p), limit: String(l) });
    if (status) params.set('status', status);
    if (region_id) params.set('region_id', String(region_id));
    if (district_id) params.set('district_id', String(district_id));
    if (mfy_id) params.set('mfy_id', String(mfy_id));
    if (phone) params.set('phone', String(phone));
    if (q) params.set('q', String(q));
    return normalizeMarketplaceUserResponse(await apiRequest(`/marketplace-users?${params.toString()}`));
  },
  getById: async (id) => normalizeMarketplaceUserResponse(await apiRequest(`/marketplace-users/${id}`)),
  update: async (id, payload) =>
    normalizeMarketplaceUserResponse(
      await apiRequest(`/marketplace-users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
  updateStatus: async (id, status) =>
    normalizeMarketplaceUserResponse(
      await apiRequest(`/marketplace-users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  delete: async (id) =>
    apiRequest(`/marketplace-users/${id}`, {
      method: 'DELETE',
    }),
};

const ORDER_PIPELINE_STAGES = {
  all: '/order-pipeline/all',
  marketplace_created: '/order-pipeline/marketplace-created',
  punkt_inbox: '/order-pipeline/punkt-inbox',
  contragent_requests_created: '/order-pipeline/contragent-requests-created',
  punkt_collected_pending: '/order-pipeline/punkt-collected-pending',
  punkt_ready_pending: '/order-pipeline/punkt-ready-pending',
  agent_assign_pending: '/order-pipeline/agent-assign-pending',
  agent_payment_pending: '/order-pipeline/agent-payment-pending',
  payment_confirm_pending: '/order-pipeline/payment-confirm-pending',
  post_payment_delivery_pending: '/order-pipeline/post-payment-delivery-pending',
  remainder_handover_pending: '/order-pipeline/remainder-handover-pending',
  ready_for_agent_deliver: '/order-pipeline/ready-for-agent-deliver',
  delivered: '/order-pipeline/delivered',
};

const normalizeOrderPipelineItem = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id ?? item._id,
    _id: item._id ?? item.id,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeOrderPipelineResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  const payload = response.data;
  if (Array.isArray(payload)) {
    return { ...response, data: payload.map(normalizeOrderPipelineItem) };
  }
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) {
      return {
        ...response,
        data: {
          ...payload,
          items: payload.items.map(normalizeOrderPipelineItem),
        },
      };
    }
    return { ...response, data: normalizeOrderPipelineItem(payload) };
  }
  return response;
};

export const orderPipelineAPI = {
  getOverview: async () => apiRequest('/order-pipeline/overview'),
  getStageOrders: async (stageKey, { page = 1, limit = 10 } = {}) => {
    const endpoint = ORDER_PIPELINE_STAGES[stageKey];
    if (!endpoint) {
      throw new Error("Noto'g'ri pipeline stage yuborildi");
    }
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return normalizeOrderPipelineResponse(await apiRequest(`${endpoint}?page=${p}&limit=${l}`));
  },
  stages: ORDER_PIPELINE_STAGES,
};

export const transactionsStatsAPI = {
  getByArea: async ({ level = 'region', status = 'delivered', from, to } = {}) => {
    const allowedLevels = new Set(['region', 'district', 'mfy']);
    const normalizedLevel = allowedLevels.has(level) ? level : 'region';
    const params = new URLSearchParams({ level: normalizedLevel });
    if (status && String(status).trim() !== '') params.set('status', String(status).trim());
    if (from && String(from).trim() !== '') params.set('from', String(from).trim());
    if (to && String(to).trim() !== '') params.set('to', String(to).trim());
    return apiRequest(`/transactions/by-area?${params.toString()}`);
  },
};

const normalizeIntegrationApiKey = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id ?? item._id,
    createdAt: item.createdAt ?? item.created_at,
    keyHint: item.keyHint ?? item.key_hint,
    apiKey: item.apiKey ?? item.api_key,
  };
};

const normalizeIntegrationApiKeysResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeIntegrationApiKey) };
  }
  if (response.data && typeof response.data === 'object') {
    return { ...response, data: normalizeIntegrationApiKey(response.data) };
  }
  return response;
};

export const integrationApiKeysAPI = {
  list: async () => normalizeIntegrationApiKeysResponse(await apiRequest('/integration-api-keys')),
  create: async (name) =>
    normalizeIntegrationApiKeysResponse(
      await apiRequest('/integration-api-keys', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
    ),
  update: async (id, name) =>
    apiRequest(`/integration-api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),
  deleteKey: async (id) =>
    apiRequest(`/integration-api-keys/${id}`, {
      method: 'DELETE',
    }),
};

const normalizeLocalShopProductTemplate = (item) => {
  if (!item || typeof item !== 'object') return item;
  const imageItems = Array.isArray(item.image_items)
    ? item.image_items.map((img) => ({
        id: img.id ?? img._id,
        url: img.url ?? '',
        sort_order: img.sort_order ?? img.sortOrder ?? 0,
      }))
    : [];
  return {
    ...item,
    id: item.id ?? item._id,
    category_id: item.category_id ?? item.category?.id ?? item.category?._id,
    subcategory_id: item.subcategory_id ?? item.subcategory?.id ?? item.subcategory?._id,
    images: Array.isArray(item.images)
      ? item.images.filter(Boolean)
      : imageItems.map((img) => img.url).filter(Boolean),
    image_items: imageItems,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeLocalShopTemplateResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeLocalShopProductTemplate) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeLocalShopProductTemplate),
        },
      };
    }
    return { ...response, data: normalizeLocalShopProductTemplate(response.data) };
  }
  return response;
};

const buildLocalShopProductsQuery = ({
  page = 1,
  limit = 10,
  q,
  local_shop_id,
  template_id,
  region_id,
  district_id,
  mfy_id,
  shop_status,
  template_status,
} = {}) => {
  const sp = new URLSearchParams();
  sp.set('page', String(Math.max(1, Number(page) || 1)));
  sp.set('limit', String(Math.min(100, Math.max(1, Number(limit) || 10))));
  if (q != null && String(q).trim()) sp.set('q', String(q).trim());
  if (local_shop_id != null && local_shop_id !== '') sp.set('local_shop_id', String(local_shop_id));
  if (template_id != null && template_id !== '') sp.set('template_id', String(template_id));
  if (region_id != null && region_id !== '') sp.set('region_id', String(region_id));
  if (district_id != null && district_id !== '') sp.set('district_id', String(district_id));
  if (mfy_id != null && mfy_id !== '') sp.set('mfy_id', String(mfy_id));
  if (shop_status) sp.set('shop_status', shop_status);
  if (template_status) sp.set('template_status', template_status);
  return sp.toString();
};

const normalizeLocalShopProduct = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id ?? item._id,
    local_shop_id: item.local_shop_id ?? item.localShopId,
    template_id: item.template_id ?? item.templateId,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
    template: item.template ? normalizeLocalShopProductTemplate(item.template) : item.template,
    shop: item.shop
      ? {
          ...item.shop,
          id: item.shop.id ?? item.shop._id,
          region_id: item.shop.region_id ?? item.shop.region?.id,
          district_id: item.shop.district_id ?? item.shop.district?.id,
          mfy_id: item.shop.mfy_id ?? item.shop.mfy?.id,
        }
      : item.shop,
    delivery_areas: Array.isArray(item.delivery_areas) ? item.delivery_areas : [],
  };
};

const normalizeLocalShopProductResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeLocalShopProduct) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeLocalShopProduct),
        },
      };
    }
    return { ...response, data: normalizeLocalShopProduct(response.data) };
  }
  return response;
};

/** Maxalla do'koni mahsulotlari (read-only) — `local_shop_products` */
export const localShopProductAPI = {
  getAll: async (params = {}) =>
    normalizeLocalShopProductResponse(
      await apiRequest(`/local-shop-products?${buildLocalShopProductsQuery(params)}`)
    ),
  getById: async (id) =>
    normalizeLocalShopProductResponse(await apiRequest(`/local-shop-products/${id}`)),
};

export const localShopProductTemplateAPI = {
  getAll: async ({ page = 1, limit = 10 } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return normalizeLocalShopTemplateResponse(
      await apiRequest(`/local-shop-product-templates?page=${p}&limit=${l}`)
    );
  },
  getById: async (id) =>
    normalizeLocalShopTemplateResponse(await apiRequest(`/local-shop-product-templates/${id}`)),
  create: async (payload) =>
    normalizeLocalShopTemplateResponse(
      await apiRequest('/local-shop-product-templates', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),
  update: async (id, payload) =>
    normalizeLocalShopTemplateResponse(
      await apiRequest(`/local-shop-product-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
  updateStatus: async (id, status) =>
    normalizeLocalShopTemplateResponse(
      await apiRequest(`/local-shop-product-templates/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  delete: async (id) =>
    apiRequest(`/local-shop-product-templates/${id}`, {
      method: 'DELETE',
    }),
  createWithImages: async (form, files) => {
    const formData = new FormData();
    appendTemplateFormFields(formData, form);
    appendImageFiles(formData, files);
    return normalizeLocalShopTemplateResponse(
      await apiMultipartRequest('/local-shop-product-templates/with-images', formData, { method: 'POST' })
    );
  },
  updateWithImages: async (id, form, files = []) => {
    const formData = new FormData();
    appendTemplateFormFields(formData, form);
    if (files.length) appendImageFiles(formData, files);
    return normalizeLocalShopTemplateResponse(
      await apiMultipartRequest(`/local-shop-product-templates/${id}/with-images`, formData, { method: 'PUT' })
    );
  },
  addImages: async (id, files) => {
    const formData = new FormData();
    appendImageFiles(formData, files);
    return normalizeLocalShopTemplateResponse(
      await apiMultipartRequest(`/local-shop-product-templates/${id}/images`, formData, { method: 'POST' })
    );
  },
  replaceAllImages: async (id, files) => {
    const formData = new FormData();
    appendImageFiles(formData, files);
    return normalizeLocalShopTemplateResponse(
      await apiMultipartRequest(`/local-shop-product-templates/${id}/images`, formData, { method: 'PUT' })
    );
  },
  replaceImage: async (id, imageId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return normalizeLocalShopTemplateResponse(
      await apiMultipartRequest(`/local-shop-product-templates/${id}/images/${imageId}`, formData, {
        method: 'PUT',
      })
    );
  },
  deleteImage: async (id, imageId) =>
    normalizeLocalShopTemplateResponse(
      await apiRequest(`/local-shop-product-templates/${id}/images/${imageId}`, {
        method: 'DELETE',
      })
    ),
};

const normalizeAdminPartnerRequest = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id ?? item._id,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeAdminPartnerRequestResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeAdminPartnerRequest) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeAdminPartnerRequest),
        },
      };
    }
    return { ...response, data: normalizeAdminPartnerRequest(response.data) };
  }
  return response;
};

export const adminPartnerRequestsAPI = {
  getAll: async ({ page = 1, limit = 10 } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return normalizeAdminPartnerRequestResponse(
      await apiRequest(`/admin-partner-requests?page=${p}&limit=${l}`)
    );
  },
  getById: async (id) =>
    normalizeAdminPartnerRequestResponse(await apiRequest(`/admin-partner-requests/${id}`)),
  markContacted: async (id) =>
    normalizeAdminPartnerRequestResponse(
      await apiRequest(`/admin-partner-requests/${id}/contacted`, {
        method: 'PATCH',
        body: JSON.stringify({}),
      })
    ),
  updateDeal: async (id, signed) =>
    normalizeAdminPartnerRequestResponse(
      await apiRequest(`/admin-partner-requests/${id}/deal`, {
        method: 'PATCH',
        body: JSON.stringify({ signed: Boolean(signed) }),
      })
    ),
  convertToContragent: async (id, phone) =>
    normalizeAdminPartnerRequestResponse(
      await apiRequest(`/admin-partner-requests/${id}/convert-to-contragent`, {
        method: 'POST',
        body: JSON.stringify(phone ? { phone } : {}),
      })
    ),
};

const normalizeCommentTemplate = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id ?? item._id,
    comment: item.comment ?? item.body,
    sortOrder: item.sortOrder ?? item.sort_order,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeCommentTemplateResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeCommentTemplate) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeCommentTemplate),
        },
      };
    }
    return { ...response, data: normalizeCommentTemplate(response.data) };
  }
  return response;
};

export const commentTemplateAPI = {
  create: async (payload) =>
    normalizeCommentTemplateResponse(
      await apiRequest('/comment-templates', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),
  getAll: async ({ page = 1, limit = 10 } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return normalizeCommentTemplateResponse(await apiRequest(`/comment-templates?page=${p}&limit=${l}`));
  },
  getById: async (id) => normalizeCommentTemplateResponse(await apiRequest(`/comment-templates/${id}`)),
  update: async (id, payload) =>
    normalizeCommentTemplateResponse(
      await apiRequest(`/comment-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
  remove: async (id) =>
    apiRequest(`/comment-templates/${id}`, {
      method: 'DELETE',
    }),
  reorder: async (from_id, to_id) =>
    normalizeCommentTemplateResponse(
      await apiRequest('/comment-templates/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ from_id, to_id }),
      })
    ),
};

const extractProductCommentId = (value) => {
  if (value == null || value === '') return undefined;
  if (typeof value === 'object') {
    const nested = value.rating_id ?? value.ratingId ?? value.id ?? value._id;
    return nested != null && typeof nested === 'object' ? extractProductCommentId(nested) : nested;
  }
  return value;
};

const extractProductCommentText = (value) => {
  if (value == null || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const isProductCommentCasePayload = (value) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (value.rating_id != null || value.ratingId != null);

const normalizeProductCommentActivities = (activities) =>
  (Array.isArray(activities) ? activities : []).map((entry) =>
    entry && typeof entry === 'object'
      ? {
          ...entry,
          note: extractProductCommentText(entry.note) || extractProductCommentText(entry.message),
          message: extractProductCommentText(entry.message),
          createdAt: entry.createdAt ?? entry.created_at,
        }
      : entry
  );

/** GET /product-comments/:id — { comment: { case fields }, activities: [...] } */
const normalizeProductCommentDetail = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;

  const casePayload = isProductCommentCasePayload(data.comment)
    ? data.comment
    : isProductCommentCasePayload(data.case)
      ? data.case
      : isProductCommentCasePayload(data.rating)
        ? data.rating
        : isProductCommentCasePayload(data)
          ? data
          : null;

  if (!casePayload) return normalizeProductCommentCase(data);

  const activities = data.activities ?? data.activity_log ?? data.activityLog ?? [];
  const normalized = normalizeProductCommentCase(casePayload);
  const activityLog = normalizeProductCommentActivities(activities);
  return { ...normalized, activities: activityLog, activityLog };
};

const normalizeProductCommentCase = (item) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return item;

  const ratingId = extractProductCommentId(item.ratingId ?? item.rating_id ?? item.id ?? item._id);
  const nestedUser = item.user && typeof item.user === 'object' && !Array.isArray(item.user) ? item.user : null;
  const user = nestedUser
    ? nestedUser
    : {
        id: item.user_id,
        phone: item.user_phone,
        first_name: item.user_first_name,
        last_name: item.user_last_name,
        full_name: [item.user_first_name, item.user_last_name].filter(Boolean).join(' ') || undefined,
        region_id: item.user_region_id,
      };

  const nestedProduct = item.product && typeof item.product === 'object' && !Array.isArray(item.product) ? item.product : null;
  const product = nestedProduct || { id: item.product_id, name: item.product_name };

  const nestedContragent =
    item.contragent && typeof item.contragent === 'object' && !Array.isArray(item.contragent) ? item.contragent : null;
  const contragent = nestedContragent || { id: item.contragent_id, name: item.contragent_name };

  const rawScore = item.score ?? item.rating_score;
  const score = typeof rawScore === 'object' ? undefined : rawScore;
  const commentText = isProductCommentCasePayload(item.comment) ? '' : extractProductCommentText(item.comment);

  return {
    ...item,
    id: ratingId,
    ratingId,
    status: item.status ?? item.case_status,
    caseStatus: item.case_status ?? item.status,
    score,
    user,
    product,
    contragent,
    note:
      extractProductCommentText(item.note) ||
      extractProductCommentText(item.customer_comment) ||
      extractProductCommentText(item.template_comment) ||
      commentText ||
      '',
    comment: commentText,
    template_comment: extractProductCommentText(item.template_comment),
    product_name: item.product_name ?? product?.name,
    contragent_name: item.contragent_name ?? contragent?.name ?? contragent?.company_name,
    user_phone: item.user_phone ?? user?.phone,
    user_first_name: item.user_first_name ?? user?.first_name,
    user_last_name: item.user_last_name ?? user?.last_name,
    escalatedToAdmin: item.escalatedToAdmin ?? item.escalated_to_admin,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at ?? item.last_contact_at,
    scanCount: item.scanCount ?? item.scan_count,
    activityLog: normalizeProductCommentActivities(
      item.activityLog ?? item.activity_log ?? item.activities
    ),
  };
};

const normalizeProductCommentResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeProductCommentCase) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeProductCommentCase),
        },
      };
    }
    if (Array.isArray(response.data.cases)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.cases.map(normalizeProductCommentCase),
        },
      };
    }
    if (isProductCommentCasePayload(response.data.comment)) {
      return { ...response, data: normalizeProductCommentDetail(response.data) };
    }
    return { ...response, data: normalizeProductCommentCase(response.data) };
  }
  return response;
};

export const productCommentsAPI = {
  getAll: async ({ page = 1, limit = 10, status, escalated } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    const params = new URLSearchParams({ page: String(p), limit: String(l) });
    if (status && String(status).trim() !== '') params.set('status', String(status).trim());
    if (escalated !== undefined && escalated !== null && String(escalated).trim() !== '') {
      params.set('escalated', String(escalated));
    }
    return normalizeProductCommentResponse(await apiRequest(`/product-comments?${params.toString()}`));
  },
  getById: async (ratingId) =>
    normalizeProductCommentResponse(await apiRequest(`/product-comments/${ratingId}`)),
  addNote: async (ratingId, note) =>
    normalizeProductCommentResponse(
      await apiRequest(`/product-comments/${ratingId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      })
    ),
  addCall: async (ratingId, note) =>
    normalizeProductCommentResponse(
      await apiRequest(`/product-comments/${ratingId}/calls`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      })
    ),
  resolve: async (ratingId, note) =>
    normalizeProductCommentResponse(
      await apiRequest(`/product-comments/${ratingId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      })
    ),
};

/** WebSocket URL for admin notification stream (pass JWT as query `token`). */
export const buildAdminNotificationsWebSocketUrl = (token) => {
  if (!token || typeof token !== 'string') return null;
  const wsBase = API_BASE_URL.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
  return `${wsBase}/admin-notifications/ws?token=${encodeURIComponent(token)}`;
};

const normalizeAdminNotification = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id,
    isRead: Boolean(item.isRead ?? item.is_read),
    readAt: item.readAt ?? item.read_at ?? null,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
    targetType: item.targetType ?? item.target_type,
  };
};

const normalizeAdminNotificationsListResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (response.data && typeof response.data === 'object' && Array.isArray(response.data.items)) {
    const d = response.data;
    return {
      ...response,
      data: {
        ...d,
        items: d.items.map(normalizeAdminNotification),
        unreadCount: Number(d.unreadCount ?? d.unread_count ?? 0) || 0,
      },
    };
  }
  if (response.data && typeof response.data === 'object' && response.data.unread_count !== undefined) {
    return {
      ...response,
      data: {
        ...response.data,
        unreadCount: Number(response.data.unreadCount ?? response.data.unread_count) || 0,
      },
    };
  }
  return response;
};

export const adminNotificationsAPI = {
  getAll: async ({ page = 1, limit = 10 } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return normalizeAdminNotificationsListResponse(
      await apiRequest(`/admin-notifications?page=${p}&limit=${l}`)
    );
  },
  getUnreadCount: async () => {
    const res = await apiRequest('/admin-notifications/unread-count');
    const raw = res.data;
    const c =
      raw && typeof raw === 'object'
        ? Number(raw.unreadCount ?? raw.unread_count ?? 0)
        : 0;
    return { ...res, data: { unreadCount: c || 0 } };
  },
  markRead: async (id) =>
    apiRequest(`/admin-notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllRead: async () =>
    apiRequest('/admin-notifications/read-all', {
      method: 'PATCH',
    }),
};

const normalizeArchiveItem = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id ?? item._id,
    entityType: item.entityType ?? item.entity_type,
    entityId: item.entityId ?? item.entity_id,
    deletedById: item.deletedById ?? item.deleted_by_id,
    archivedAt: item.archivedAt ?? item.archived_at,
  };
};

const normalizeArchiveResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeArchiveItem) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeArchiveItem),
        },
      };
    }
    return { ...response, data: normalizeArchiveItem(response.data) };
  }
  return response;
};

const getArchiveList = async (type, { page = 1, limit = 10 } = {}) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 10));
  return normalizeArchiveResponse(await apiRequest(`/arxiv/${type}?page=${p}&limit=${l}`));
};

const getArchiveById = async (type, id) => normalizeArchiveResponse(await apiRequest(`/arxiv/${type}/${id}`));

export const archiveAPI = {
  getAgentList: async (opts) => getArchiveList('agent', opts),
  getAgentById: async (id) => getArchiveById('agent', id),
  getContragentList: async (opts) => getArchiveList('contragent', opts),
  getContragentById: async (id) => getArchiveById('contragent', id),
  getLocalShopList: async (opts) => getArchiveList('local-shop', opts),
  getLocalShopById: async (id) => getArchiveById('local-shop', id),
  getMarketplaceUserList: async (opts) => getArchiveList('marketplace-user', opts),
  getMarketplaceUserById: async (id) => getArchiveById('marketplace-user', id),
  getPunktList: async (opts) => getArchiveList('punkt', opts),
  getPunktById: async (id) => getArchiveById('punkt', id),
};

const normalizeQr = (item) => {
  if (!item || typeof item !== 'object') return item;
  const rawImage = item.imageBase64 ?? item.image_base64 ?? '';
  const imageWithPrefix =
    rawImage && String(rawImage).startsWith('data:image')
      ? String(rawImage)
      : rawImage
        ? `data:image/png;base64,${rawImage}`
        : '';
  return {
    ...item,
    id: item.id ?? item._id,
    imageBase64: imageWithPrefix,
    image_base64: imageWithPrefix,
    scanCount: item.scanCount ?? item.scan_count ?? 0,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
};

const normalizeQrResponse = (response) => {
  if (!response || typeof response !== 'object') return response;
  if (Array.isArray(response.data)) {
    return { ...response, data: response.data.map(normalizeQr) };
  }
  if (response.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.items)) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeQr),
        },
      };
    }
    return { ...response, data: normalizeQr(response.data) };
  }
  return response;
};

export const qrAPI = {
  create: async (payload) =>
    normalizeQrResponse(
      await apiRequest('/qrs', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),
  getAll: async ({ page = 1, limit = 10 } = {}) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return normalizeQrResponse(await apiRequest(`/qrs?page=${p}&limit=${l}`));
  },
  getById: async (id) => normalizeQrResponse(await apiRequest(`/qrs/${id}`)),
  update: async (id, payload) =>
    normalizeQrResponse(
      await apiRequest(`/qrs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),
  remove: async (id) =>
    apiRequest(`/qrs/${id}`, {
      method: 'DELETE',
    }),
};
