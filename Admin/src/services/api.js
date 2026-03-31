const API_BASE_URL = 'http://localhost:8081/api/v1';

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

const apiRequest = async (endpoint, options = {}, requiresAuth = true) => {
  const token = getToken();
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(requiresAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  let data = {};

  try {
    data = await response.json();
  } catch (err) {
    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/login')) clearAuthAndRedirect();
      throw new Error(`Server xatolik: ${response.status}`);
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (!endpoint.includes('/login')) clearAuthAndRedirect();
      throw new Error(data.message || "Sessiya tugadi. Qayta kiring.");
    }
    if (response.status === 403) {
      throw new Error(data.message || "Ruxsat yo'q");
    }
    if (response.status === 409) {
      throw new Error(data.message || 'Bu maʼlumot allaqachon mavjud');
    }
    throw new Error(data.message || "So'rovda xatolik yuz berdi");
  }

  return normalizeCommonSuccess(data);
};

const normalizeAdmin = (admin) => {
  if (!admin || typeof admin !== 'object') return admin;
  return {
    ...admin,
    _id: admin._id ?? admin.id,
    id: admin.id ?? admin._id,
    phone: admin.phone ?? admin.telefonRaqam,
    telefonRaqam: admin.telefonRaqam ?? admin.phone,
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

  getAllAdmins: async ({ page = 1, limit = 10 } = {}) =>
    normalizeAdminResponse(await apiRequest(`/admins?page=${page}&limit=${limit}`)),
  getAdminById: async (id) => normalizeAdminResponse(await apiRequest(`/admins/${id}`)),

  createAdmin: async (adminData) =>
    normalizeAdminResponse(
      await apiRequest('/admins', {
        method: 'POST',
        body: JSON.stringify({
          name: adminData.name || adminData.fullname,
          role: adminData.role || 'admin',
          phone: adminData.phone || adminData.telefonRaqam,
          username: (adminData.username || '').toLowerCase(),
          password: adminData.password || adminData.parol,
          status: adminData.status || 'active',
        }),
      })
    ),

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
  return {
    ...item,
    _id: item._id ?? item.id,
    id: item.id ?? item._id,
    contragent_id: item.contragent_id ?? item.contragent?.id ?? item.contragent?._id,
    category_id: item.category_id ?? item.category?.id ?? item.category?._id,
    subcategory_id: item.subcategory_id ?? item.subcategory?.id ?? item.subcategory?._id,
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
        body: JSON.stringify({}),
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
