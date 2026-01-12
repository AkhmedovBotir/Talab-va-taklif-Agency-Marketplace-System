const API_BASE_URL = 'http://localhost:5000/api';
const PUBLIC_API_BASE_URL = 'https://api.milliycrm.uz/api';

// Helper function to get token from localStorage
const getToken = () => {
  return localStorage.getItem('adminToken');
};

// Helper function to handle unauthorized errors
const handleUnauthorized = () => {
  // Clear authentication data
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  
  // Redirect to login page
  window.location.href = '/login';
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}, requiresAuth = true) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(requiresAuth && token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle non-JSON responses
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON, create a simple error
      if (!response.ok) {
        if (response.status === 401) {
          // Don't redirect on login endpoint
          if (!endpoint.includes('/login')) {
            handleUnauthorized();
          }
          throw new Error('Sizning sessiyangiz tugadi. Iltimos, qayta kiring.');
        }
        throw new Error(`Server xatolik: ${response.status}`);
      }
      throw jsonError;
    }
    
    if (!response.ok) {
      // Handle 401 Unauthorized error
      if (response.status === 401) {
        // Don't redirect on login endpoint (login failures are expected)
        if (!endpoint.includes('/login')) {
          handleUnauthorized();
        }
        throw new Error(data.message || 'Sizning sessiyangiz tugadi. Iltimos, qayta kiring.');
      }
      
      // Handle 403 Forbidden - Device verification required or inactive device
      if (response.status === 403) {
        const errorMessage = data.message || '';
        
        // Check if error is about inactive device or device not found
        // These errors should redirect to login page
        const isDeviceError = errorMessage.toLowerCase().includes('nofaol') || 
            errorMessage.toLowerCase().includes('inactive') ||
            errorMessage.toLowerCase().includes('faqat faol') ||
            errorMessage.toLowerCase().includes('deactivated') ||
            errorMessage.toLowerCase().includes('not active') ||
            errorMessage.toLowerCase().includes('device is not active') ||
            errorMessage.toLowerCase().includes('qurilma topilmadi') ||
            errorMessage.toLowerCase().includes('device not found') ||
            errorMessage.toLowerCase().includes('qurilmani tasdiqlang') ||
            errorMessage.toLowerCase().includes('faol qurilma bilan');
        
        // If it's a device-related error and not on login endpoint, redirect to login
        if (isDeviceError && !endpoint.includes('/login') && !endpoint.includes('/device-verification')) {
          // Clear authentication data
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          // Redirect to login page
          window.location.href = '/login';
          throw new Error(errorMessage || 'Qurilma nofaol. Iltimos, qayta kiring.');
        }
        
        // For login endpoint, handle device verification
        if (endpoint.includes('/login')) {
          if (isDeviceError) {
            // Inactive device on login - reject login, don't show device verification
            throw new Error(errorMessage || 'Bu qurilma nofaol. Faqat faol qurilma bilan login qilish mumkin');
          }
          
          // Only allow device verification for new devices (when requiresDeviceVerification is true)
          if (data.requiresDeviceVerification) {
            const error = new Error(errorMessage || 'Qurilma tasdiqlash kerak');
            error.requiresDeviceVerification = true;
            error.response = response;
            error.data = data;
            throw error;
          }
        }
        
        // Other 403 errors - redirect to login if authenticated request
        if (requiresAuth && !endpoint.includes('/device-verification')) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          window.location.href = '/login';
        }
        
        throw new Error(errorMessage || 'Kirish rad etildi');
      }
      
      // Handle validation errors (400) with detailed error messages
      if (response.status === 400 && data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map(err => err.message || `${err.field}: ${err.message}`).join(', ');
        const error = new Error(errorMessages || data.message || 'Validatsiya xatosi');
        // Preserve existingUser info if present
        if (data.existingUser) {
          error.existingUser = data.existingUser;
        }
        throw error;
      }
      
      // Create error with existingUser info if present
      const error = new Error(data.message || 'Something went wrong');
      if (data.existingUser) {
        error.existingUser = data.existingUser;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    // Re-throw the error to be handled by the calling code
    throw error;
  }
};

// Admin API functions
export const adminAPI = {
  // Note: Login endpoint not in API docs - may need separate endpoint
  login: async (username, password, deviceInfo = null) => {
    const headers = {};
    
    // Add device headers if device info is provided
    if (deviceInfo) {
      if (deviceInfo.deviceId) headers['X-Device-Id'] = deviceInfo.deviceId;
      if (deviceInfo.deviceName) headers['X-Device-Name'] = deviceInfo.deviceName;
      if (deviceInfo.deviceType) headers['X-Device-Type'] = deviceInfo.deviceType;
      if (deviceInfo.platform) headers['X-Platform'] = deviceInfo.platform;
      if (deviceInfo.os) headers['X-OS'] = deviceInfo.os;
      if (deviceInfo.browser) headers['X-Browser'] = deviceInfo.browser;
    }
    
    try {
      const response = await apiRequest('/admins/login', {
        method: 'POST',
        body: JSON.stringify({ username, parol: password }),
        headers,
      }, false); // No auth required for login
      
      return response;
    } catch (error) {
      // Check if error indicates device verification is required
      // This can happen for NEW devices OR inactive devices
      // For inactive devices, we also allow device verification via SMS
      if (error.requiresDeviceVerification) {
        const errorMessage = error.message || '';
        
        // Check if error is about inactive device
        // For inactive devices, we still allow device verification via SMS
        const isInactiveDevice = errorMessage.toLowerCase().includes('nofaol') || 
            errorMessage.toLowerCase().includes('inactive') ||
            errorMessage.toLowerCase().includes('faqat faol') ||
            errorMessage.toLowerCase().includes('qurilma topilmadi') ||
            errorMessage.toLowerCase().includes('qurilmani tasdiqlang');
        
        if (isInactiveDevice) {
          // Inactive device - allow device verification via SMS
          return {
            success: false,
            requiresDeviceVerification: true,
            phone: error.data?.phone,
            username: username, // Pass username for admin verification
            deviceId: deviceInfo?.deviceId,
            deviceInfo: deviceInfo,
            message: errorMessage || 'Bu qurilma nofaol. Faqat faol qurilma bilan login qilish mumkin. Iltimos, faol qurilma bilan kirish yoki yangi qurilmani tasdiqlash uchun SMS kod so\'rang',
            isInactiveDevice: true, // Flag to show different message
          };
        }
        
        // Return requiresDeviceVerification for new devices
        return {
          success: false,
          requiresDeviceVerification: true,
          phone: error.data?.phone,
          username: username, // Pass username for admin verification
          deviceId: deviceInfo?.deviceId,
          deviceInfo: deviceInfo,
          message: errorMessage || 'Qurilma tasdiqlash kerak',
        };
      }
      
      // Check if error message indicates inactive device (even without requiresDeviceVerification flag)
      const errorMessage = error.message || '';
      const isInactiveDevice = errorMessage.toLowerCase().includes('nofaol') || 
          errorMessage.toLowerCase().includes('inactive') ||
          errorMessage.toLowerCase().includes('faqat faol') ||
          errorMessage.toLowerCase().includes('qurilma topilmadi') ||
          errorMessage.toLowerCase().includes('qurilmani tasdiqlang');
      
      if (isInactiveDevice) {
        // Inactive device - allow device verification via SMS
        return {
          success: false,
          requiresDeviceVerification: true,
          phone: error.data?.phone,
          username: username, // Pass username for admin verification
          deviceId: deviceInfo?.deviceId,
          deviceInfo: deviceInfo,
          message: errorMessage || 'Bu qurilma nofaol. Faqat faol qurilma bilan login qilish mumkin. Iltimos, faol qurilma bilan kirish yoki yangi qurilmani tasdiqlash uchun SMS kod so\'rang',
          isInactiveDevice: true, // Flag to show different message
        };
      }
      
      throw error;
    }
  },
  
  getProfile: async () => {
    return apiRequest('/admins/me');
  },

  // Get all admins (no pagination in API docs)
  getAllAdmins: async (params = {}) => {
    // API returns { success: true, count: X, data: [...] }
    return apiRequest('/admins');
  },

  // Get admin by ID
  getAdminById: async (id) => {
    // API returns { success: true, data: {...} }
    return apiRequest(`/admins/${id}`);
  },

  // Create new admin
  // Expected fields: name, role, telefonRaqam, username, parol, status, permissions
  createAdmin: async (adminData) => {
    // Transform field names to match API
    const apiData = {
      name: adminData.name || adminData.fullname,
      role: adminData.role || 'general',
      telefonRaqam: adminData.telefonRaqam || adminData.phone,
      username: (adminData.username || '').toLowerCase(), // API requires lowercase
      parol: adminData.parol || adminData.password,
      status: adminData.status || 'active',
    };
    // Add permissions if provided
    if (adminData.permissions && Array.isArray(adminData.permissions) && adminData.permissions.length > 0) {
      apiData.permissions = adminData.permissions;
    }
    return apiRequest('/admins', {
      method: 'POST',
      body: JSON.stringify(apiData),
    });
  },

  // Update admin
  // All fields optional, use same field names as create
  updateAdmin: async (id, adminData) => {
    // Transform field names to match API
    const apiData = {};
    if (adminData.name !== undefined) apiData.name = adminData.name;
    if (adminData.fullname !== undefined) apiData.name = adminData.fullname;
    if (adminData.role !== undefined) apiData.role = adminData.role;
    if (adminData.telefonRaqam !== undefined) apiData.telefonRaqam = adminData.telefonRaqam;
    if (adminData.phone !== undefined) apiData.telefonRaqam = adminData.phone;
    if (adminData.username !== undefined) apiData.username = adminData.username.toLowerCase(); // API requires lowercase
    if (adminData.parol !== undefined) apiData.parol = adminData.parol;
    if (adminData.password !== undefined && adminData.password.trim() !== '') apiData.parol = adminData.password;
    if (adminData.status !== undefined) apiData.status = adminData.status;
    // Add permissions if provided
    if (adminData.permissions !== undefined) {
      if (Array.isArray(adminData.permissions) && adminData.permissions.length > 0) {
        apiData.permissions = adminData.permissions;
      } else {
        // Empty array means no permissions, but API will assign defaults
        apiData.permissions = adminData.permissions;
      }
    }
    
    return apiRequest(`/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiData),
    });
  },

  // Update admin status (via PUT endpoint)
  updateAdminStatus: async (id, status) => {
    return apiRequest(`/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Delete admin
  deleteAdmin: async (id) => {
    return apiRequest(`/admins/${id}`, {
      method: 'DELETE',
    });
  },
};

// Device Verification API functions
export const deviceVerificationAPI = {
  // Admin - Request verification code
  // Accepts either username, adminId, or phone
  requestAdminCode: async (identifier, deviceData, identifierType = 'username') => {
    const requestBody = {
      [identifierType]: identifier,
      ...deviceData,
    };
    
    return apiRequest('/device-verification/admin/request-code', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }, false); // No auth required
  },

  // Admin - Verify device
  // Accepts either username, adminId, or phone
  verifyAdminDevice: async (identifier, deviceId, code, deviceData, identifierType = 'username') => {
    const requestBody = {
      [identifierType]: identifier,
      deviceId,
      code,
      ...deviceData,
    };
    
    return apiRequest('/device-verification/admin/verify', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }, false); // No auth required
  },

  // Admin - Resend code
  // Accepts either username, adminId, or phone
  resendAdminCode: async (identifier, deviceId, identifierType = 'username') => {
    const requestBody = {
      [identifierType]: identifier,
      deviceId,
    };
    
    return apiRequest('/device-verification/admin/resend-code', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }, false); // No auth required
  },
};

// Admin Device Management API functions
export const adminDeviceAPI = {
  // Get all devices
  getAllDevices: async (params = {}) => {
    const { userModel, userId, page = 1, limit = 50 } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (userModel) queryParams.append('userModel', userModel);
    if (userId) queryParams.append('userId', userId);
    
    return apiRequest(`/admins/devices?${queryParams.toString()}`);
  },

  // Get device by ID
  getDeviceById: async (id) => {
    return apiRequest(`/admins/devices/${id}`);
  },

  // Get user's devices
  getUserDevices: async (userModel, userId) => {
    return apiRequest(`/admins/devices/user/${userModel}/${userId}`);
  },

  // Deactivate device
  deactivateDevice: async (id) => {
    return apiRequest(`/admins/devices/${id}/deactivate`, {
      method: 'PUT',
    });
  },

  // Activate device
  activateDevice: async (id) => {
    return apiRequest(`/admins/devices/${id}/activate`, {
      method: 'PUT',
    });
  },

  // Delete device
  deleteDevice: async (id) => {
    return apiRequest(`/admins/devices/${id}`, {
      method: 'DELETE',
    });
  },

  // Get device statistics
  getDeviceStatistics: async () => {
    return apiRequest('/admins/devices/statistics');
  },
};

// Shop Owner API functions
export const shopOwnerAPI = {
  // Get all shop owners with pagination and filters
  getAllShopOwners: async (params = {}) => {
    const { page = 1, limit = 10, status } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    
    return apiRequest(`/shop-owners?${queryParams.toString()}`);
  },

  // Get shop owner by ID
  getShopOwnerById: async (id) => {
    return apiRequest(`/shop-owners/${id}`);
  },

  // Create new shop owner
  createShopOwner: async (shopOwnerData) => {
    return apiRequest('/shop-owners', {
      method: 'POST',
      body: JSON.stringify(shopOwnerData),
    });
  },

  // Update shop owner
  updateShopOwner: async (id, shopOwnerData) => {
    return apiRequest(`/shop-owners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shopOwnerData),
    });
  },

  // Update shop owner status
  updateShopOwnerStatus: async (id, status) => {
    return apiRequest(`/shop-owners/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Delete shop owner
  deleteShopOwner: async (id) => {
    return apiRequest(`/shop-owners/${id}`, {
      method: 'DELETE',
    });
  },
};

// Shop API functions
export const shopAPI = {
  // Get all shops with pagination and filters
  getAllShops: async (params = {}) => {
    const { page = 1, limit = 10, status, owner } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (owner) queryParams.append('owner', owner);
    
    return apiRequest(`/shops?${queryParams.toString()}`);
  },

  // Get shop by ID
  getShopById: async (id) => {
    return apiRequest(`/shops/${id}`);
  },

  // Create new shop
  createShop: async (shopData) => {
    return apiRequest('/shops', {
      method: 'POST',
      body: JSON.stringify(shopData),
    });
  },

  // Update shop
  updateShop: async (id, shopData) => {
    return apiRequest(`/shops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shopData),
    });
  },

  // Update shop status
  updateShopStatus: async (id, status) => {
    return apiRequest(`/shops/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Delete shop
  deleteShop: async (id) => {
    return apiRequest(`/shops/${id}`, {
      method: 'DELETE',
    });
  },
};

// Region API functions
export const regionAPI = {
  // Get all regions with pagination and filters
  getAllRegions: async (params = {}) => {
    const { page = 1, limit = 10, status, type, parent } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (type) queryParams.append('type', type);
    if (parent !== undefined) queryParams.append('parent', parent === null ? 'null' : parent);
    
    const url = `/regions?${queryParams.toString()}`;
    console.log('🌐 regionAPI.getAllRegions - Request:', {
      url,
      params,
      queryString: queryParams.toString()
    });
    
    const response = await apiRequest(url);
    
    console.log('🌐 regionAPI.getAllRegions - Response:', {
      success: response.success,
      count: response.count,
      total: response.total,
      page: response.page,
      totalPages: response.totalPages,
      dataLength: response.data?.length,
      firstItem: response.data?.[0],
      fullResponse: response
    });
    
    return response;
  },

  // Get regions by type
  getRegionsByType: async (type, params = {}) => {
    const { status, parent } = params;
    const queryParams = new URLSearchParams();
    
    if (status) queryParams.append('status', status);
    if (parent !== undefined) queryParams.append('parent', parent === null ? 'null' : parent);
    
    const queryString = queryParams.toString();
    return apiRequest(`/regions/type/${type}${queryString ? `?${queryString}` : ''}`);
  },

  // Get region by ID
  getRegionById: async (id) => {
    return apiRequest(`/regions/${id}`);
  },

  // Get region children
  getRegionChildren: async (id, params = {}) => {
    const { status } = params;
    const queryParams = new URLSearchParams();
    
    if (status) queryParams.append('status', status);
    
    const queryString = queryParams.toString();
    return apiRequest(`/regions/${id}/children${queryString ? `?${queryString}` : ''}`);
  },

  // Create new region
  createRegion: async (regionData) => {
    return apiRequest('/regions', {
      method: 'POST',
      body: JSON.stringify(regionData),
    });
  },

  // Update region
  updateRegion: async (id, regionData) => {
    return apiRequest(`/regions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(regionData),
    });
  },

  // Update region status
  updateRegionStatus: async (id, status) => {
    return apiRequest(`/regions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Delete region
  deleteRegion: async (id) => {
    return apiRequest(`/regions/${id}`, {
      method: 'DELETE',
    });
  },
};

// Agent API functions
export const agentAPI = {
  // Login agent
  login: async (phone, password) => {
    return apiRequest('/agents/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  },

  // Get all agents with pagination and filters
  getAllAgents: async (params = {}) => {
    const { page = 1, limit = 10, status, viloyat, tuman, mfy, agentType } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (viloyat) queryParams.append('viloyat', viloyat);
    if (tuman) queryParams.append('tuman', tuman);
    if (mfy) queryParams.append('mfy', mfy);
    if (agentType) queryParams.append('agentType', agentType);
    
    return apiRequest(`/agents?${queryParams.toString()}`);
  },

  // Get agent by ID
  getAgentById: async (id) => {
    return apiRequest(`/agents/${id}`);
  },

  // Create new agent
  createAgent: async (agentData) => {
    return apiRequest('/agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
  },

  // Update agent
  updateAgent: async (id, agentData) => {
    return apiRequest(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agentData),
    });
  },

  // Delete agent
  deleteAgent: async (id) => {
    return apiRequest(`/agents/${id}`, {
      method: 'DELETE',
    });
  },
};

// Punkt API functions
export const punktAPI = {
  // Login punkt
  login: async (phone, password) => {
    return apiRequest('/punkts/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  },

  // Get all punkts with pagination and filters
  getAllPunkts: async (params = {}) => {
    const { page = 1, limit = 10, status, viloyat, tuman } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (viloyat) queryParams.append('viloyat', viloyat);
    if (tuman) queryParams.append('tuman', tuman);
    
    return apiRequest(`/punkts?${queryParams.toString()}`);
  },

  // Get punkt by ID
  getPunktById: async (id) => {
    return apiRequest(`/punkts/${id}`);
  },

  // Create new punkt
  createPunkt: async (punktData) => {
    return apiRequest('/punkts', {
      method: 'POST',
      body: JSON.stringify(punktData),
    });
  },

  // Update punkt
  updatePunkt: async (id, punktData) => {
    return apiRequest(`/punkts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(punktData),
    });
  },

  // Delete punkt
  deletePunkt: async (id) => {
    return apiRequest(`/punkts/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin Category Management API functions
export const categoryManagementAPI = {
  // Category Management
  // Create category
  createCategory: async (categoryData) => {
    return apiRequest('/admins/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  // Get all categories
  getAllCategories: async (params = {}) => {
    const { page = 1, limit = 50, status, censored } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (censored !== undefined) queryParams.append('censored', censored.toString());
    
    return apiRequest(`/admins/categories?${queryParams.toString()}`);
  },

  // Get category by ID
  getCategoryById: async (id) => {
    return apiRequest(`/admins/categories/${id}`);
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    return apiRequest(`/admins/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  // Update category status
  updateCategoryStatus: async (id, status) => {
    return apiRequest(`/admins/categories/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Delete category
  deleteCategory: async (id) => {
    return apiRequest(`/admins/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Subcategory Management
  // Create subcategory
  createSubcategory: async (subcategoryData) => {
    return apiRequest('/admins/categories/subcategories', {
      method: 'POST',
      body: JSON.stringify(subcategoryData),
    });
  },

  // Get all subcategories
  getAllSubcategories: async (params = {}) => {
    const { page = 1, limit = 50, status, censored, parent } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (censored !== undefined) queryParams.append('censored', censored.toString());
    if (parent) queryParams.append('parent', parent);
    
    return apiRequest(`/admins/categories/subcategories?${queryParams.toString()}`);
  },

  // Update subcategory
  updateSubcategory: async (id, subcategoryData) => {
    return apiRequest(`/admins/categories/subcategories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subcategoryData),
    });
  },

  // Update subcategory status
  updateSubcategoryStatus: async (id, status) => {
    return apiRequest(`/admins/categories/subcategories/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Delete subcategory
  deleteSubcategory: async (id) => {
    return apiRequest(`/admins/categories/subcategories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Base Products API functions (Templates/Shablonlar)
export const baseProductAPI = {
  // Get all base products
  getAllBaseProducts: async (params = {}) => {
    const { page = 1, limit = 20, status, category, subcategory, search } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (category) queryParams.append('category', category);
    if (subcategory) queryParams.append('subcategory', subcategory);
    if (search) queryParams.append('search', search);
    
    return apiRequest(`/admins/base-products?${queryParams.toString()}`);
  },

  // Get base product by ID
  getBaseProductById: async (id) => {
    return apiRequest(`/admins/base-products/${id}`);
  },

  // Create base product
  createBaseProduct: async (productData) => {
    return apiRequest('/admins/base-products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Update base product
  updateBaseProduct: async (id, productData) => {
    return apiRequest(`/admins/base-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  // Delete base product
  deleteBaseProduct: async (id) => {
    return apiRequest(`/admins/base-products/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin Maxalla Products API functions (Read-only)
export const maxallaProductsAPI = {
  // Get all maxalla products with pagination and filters
  getAllMaxallaProducts: async (params = {}) => {
    const { page = 1, limit = 20, status, category, subcategory, contragent, search } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (category) queryParams.append('category', category);
    if (subcategory) queryParams.append('subcategory', subcategory);
    if (contragent) queryParams.append('contragent', contragent);
    if (search) queryParams.append('search', search);
    
    return apiRequest(`/admins/maxalla-products?${queryParams.toString()}`);
  },
  
  // Get maxalla product by ID
  getMaxallaProductById: async (id) => {
    return apiRequest(`/admins/maxalla-products/${id}`);
  },
};

// Admin Product Moderation API functions
export const productModerationAPI = {
  // Get pending products
  getPendingProducts: async (params = {}) => {
    const { page = 1, limit = 50, contragent, category } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (contragent) queryParams.append('contragent', contragent);
    if (category) queryParams.append('category', category);
    
    return apiRequest(`/admins/products/moderation/pending?${queryParams.toString()}`);
  },

  // Get pending product by ID
  getPendingProductById: async (id) => {
    return apiRequest(`/admins/products/moderation/pending/${id}`);
  },

  // Get all products with moderation filter
  getAllProductsWithModeration: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      moderationStatus, 
      contragent, 
      category, 
      status 
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (moderationStatus) queryParams.append('moderationStatus', moderationStatus);
    if (contragent) queryParams.append('contragent', contragent);
    if (category) queryParams.append('category', category);
    if (status) queryParams.append('status', status);
    
    return apiRequest(`/admins/products/moderation?${queryParams.toString()}`);
  },

  // Approve product
  approveProduct: async (id) => {
    return apiRequest(`/admins/products/moderation/${id}/approve`, {
      method: 'POST',
    });
  },

  // Reject product
  rejectProduct: async (id, rejectionReason) => {
    return apiRequest(`/admins/products/moderation/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
  },

  // Update product
  updateProduct: async (id, data) => {
    return apiRequest(`/admins/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Admin Data API functions (GET only - for viewing categories, subcategories, and products)
export const adminDataAPI = {
  // Get all categories with subcategories
  getAllCategories: async (params = {}) => {
    const { page = 1, limit = 100, status, includeSubcategories } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (includeSubcategories) queryParams.append('includeSubcategories', 'true');
    
    return apiRequest(`/admins/data/categories?${queryParams.toString()}`);
  },

  // Get category by ID
  getCategoryById: async (id) => {
    return apiRequest(`/admins/data/categories/${id}`);
  },

  // Get all subcategories
  getAllSubcategories: async (params = {}) => {
    const { page = 1, limit = 100, status, parent } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (parent) queryParams.append('parent', parent);
    
    return apiRequest(`/admins/data/subcategories?${queryParams.toString()}`);
  },

  // Get all products with advanced filtering
  getAllProducts: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      category, 
      subcategory, 
      contragent,
      viloyat,
      tuman,
      minPrice,
      maxPrice,
      minQuantity,
      maxQuantity,
      unit,
      search
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (category) queryParams.append('category', category);
    if (subcategory) queryParams.append('subcategory', subcategory);
    if (contragent) queryParams.append('contragent', contragent);
    if (viloyat) queryParams.append('viloyat', viloyat);
    if (tuman) queryParams.append('tuman', tuman);
    if (minPrice) queryParams.append('minPrice', minPrice.toString());
    if (maxPrice) queryParams.append('maxPrice', maxPrice.toString());
    if (minQuantity) queryParams.append('minQuantity', minQuantity.toString());
    if (maxQuantity) queryParams.append('maxQuantity', maxQuantity.toString());
    if (unit) queryParams.append('unit', unit);
    if (search) queryParams.append('search', search);
    
    return apiRequest(`/admins/data/products?${queryParams.toString()}`);
  },

  // Get product by ID
  getProductById: async (id) => {
    return apiRequest(`/admins/data/products/${id}`);
  },

  // Get all SMS verifications
  getAllSMSVerifications: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      phone, 
      type, 
      isUsed, 
      startDate, 
      endDate 
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (phone) queryParams.append('phone', phone);
    if (type) queryParams.append('type', type);
    if (isUsed !== undefined) queryParams.append('isUsed', isUsed.toString());
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/data/sms-verifications?${queryParams.toString()}`);
  },

  // Get SMS verification by ID
  getSMSVerificationById: async (id) => {
    return apiRequest(`/admins/data/sms-verifications/${id}`);
  },

  // Get all marketplace users
  getAllMarketplaceUsers: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      viloyat, 
      tuman, 
      mfy, 
      isPhoneVerified, 
      gender, 
      search 
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (viloyat) queryParams.append('viloyat', viloyat);
    if (tuman) queryParams.append('tuman', tuman);
    if (mfy) queryParams.append('mfy', mfy);
    if (isPhoneVerified !== undefined) queryParams.append('isPhoneVerified', isPhoneVerified.toString());
    if (gender) queryParams.append('gender', gender);
    if (search) queryParams.append('search', search);
    
    return apiRequest(`/admins/data/marketplace-users?${queryParams.toString()}`);
  },

  // Get marketplace user by ID
  getMarketplaceUserById: async (id) => {
    return apiRequest(`/admins/data/marketplace-users/${id}`);
  },

  // Get all orders
  getAllOrders: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      paymentStatus, 
      paymentMethod, 
      user,
      orderNumber,
      search,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (paymentStatus) queryParams.append('paymentStatus', paymentStatus);
    if (paymentMethod) queryParams.append('paymentMethod', paymentMethod);
    if (user) queryParams.append('user', user);
    if (orderNumber) queryParams.append('orderNumber', orderNumber);
    if (search) queryParams.append('search', search);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (minTotalPrice) queryParams.append('minTotalPrice', minTotalPrice.toString());
    if (maxTotalPrice) queryParams.append('maxTotalPrice', maxTotalPrice.toString());
    
    return apiRequest(`/admins/data/orders?${queryParams.toString()}`);
  },

  // Get order by ID
  getOrderById: async (id) => {
    return apiRequest(`/admins/data/orders/${id}`);
  },

  // Get marketplace orders
  getMarketplaceOrders: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      paymentStatus, 
      paymentMethod, 
      startDate,
      endDate
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (paymentStatus) queryParams.append('paymentStatus', paymentStatus);
    if (paymentMethod) queryParams.append('paymentMethod', paymentMethod);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/data/orders/marketplace?${queryParams.toString()}`);
  },

  // Get orders confirmed by punkt
  getOrdersConfirmedByPunkt: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      startDate,
      endDate
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/data/orders/confirmed-by-punkt?${queryParams.toString()}`);
  },

  // Get orders requested to contragents
  getOrdersRequestedToContragents: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      startDate,
      endDate
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/data/orders/requested-to-contragents?${queryParams.toString()}`);
  },

  // Get orders delivered to punkt
  getOrdersDeliveredToPunkt: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      startDate,
      endDate
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/data/orders/delivered-to-punkt?${queryParams.toString()}`);
  },

  // Get orders assigned to agents
  getOrdersAssignedToAgents: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      startDate,
      endDate
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/data/orders/assigned-to-agents?${queryParams.toString()}`);
  },

  // Get orders confirmed by agents
  getOrdersConfirmedByAgents: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      startDate,
      endDate
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/data/orders/confirmed-by-agents?${queryParams.toString()}`);
  },

  // Get orders confirmed by customers
  getOrdersConfirmedByCustomers: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      startDate,
      endDate
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/data/orders/confirmed-by-customers?${queryParams.toString()}`);
  },

  // Get cancelled orders
  getCancelledOrders: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      startDate,
      endDate
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/data/orders/cancelled?${queryParams.toString()}`);
  },
};

// Archive API functions
export const archiveAPI = {
  // Get all archived punkts
  getArchivedPunkts: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      search,
      viloyat,
      tuman
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) queryParams.append('search', search);
    if (viloyat) queryParams.append('viloyat', viloyat);
    if (tuman) queryParams.append('tuman', tuman);
    
    return apiRequest(`/admins/archive/punkts?${queryParams.toString()}`);
  },

  // Get archived punkt with work history
  getArchivedPunktWorkHistory: async (id) => {
    return apiRequest(`/admins/archive/punkts/${id}/work`);
  },

  // Get all archived agents
  getArchivedAgents: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      search,
      viloyat,
      tuman,
      mfy,
      agentType
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) queryParams.append('search', search);
    if (viloyat) queryParams.append('viloyat', viloyat);
    if (tuman) queryParams.append('tuman', tuman);
    if (mfy) queryParams.append('mfy', mfy);
    if (agentType) queryParams.append('agentType', agentType);
    
    return apiRequest(`/admins/archive/agents?${queryParams.toString()}`);
  },

  // Get archived agent with work history
  getArchivedAgentWorkHistory: async (id) => {
    return apiRequest(`/admins/archive/agents/${id}/work`);
  },
};

// Legacy Category API functions (kept for backward compatibility)
export const categoryAPI = {
  // Get all categories
  getAllCategories: async (params = {}) => {
    const { page = 1, limit = 100, status, parent, includeSubcategories } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (parent !== undefined) queryParams.append('parent', parent === null ? 'null' : parent);
    if (includeSubcategories) queryParams.append('includeSubcategories', 'true');
    
    return apiRequest(`/category/list?${queryParams.toString()}`);
  },

  // Get category by ID
  getCategoryById: async (id) => {
    return apiRequest(`/category/${id}`);
  },
};

// Legacy Subcategory API functions (kept for backward compatibility)
export const subcategoryAPI = {
  // Get all subcategories
  getAllSubcategories: async (params = {}) => {
    const { page = 1, limit = 100, status, parent } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (parent) queryParams.append('parent', parent);
    
    return apiRequest(`/category/subcategory/list?${queryParams.toString()}`);
  },

  // Get subcategory by ID
  getSubcategoryById: async (id) => {
    return apiRequest(`/category/subcategory/${id}`);
  },
};

// Legacy Product API functions (kept for backward compatibility)
export const productAPI = {
  // Get all products
  getAllProducts: async (params = {}) => {
    const { page = 1, limit = 100, status, shop, category, subcategory } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (shop) queryParams.append('shop', shop);
    if (category) queryParams.append('category', category);
    if (subcategory) queryParams.append('subcategory', subcategory);
    
    return apiRequest(`/products/list?${queryParams.toString()}`);
  },

  // Get product by ID
  getProductById: async (id) => {
    return apiRequest(`/products/${id}`);
  },
};

// Interest Rate API functions
export const interestRateAPI = {
  // Initialize default interest rates
  initialize: async () => {
    return apiRequest('/admin/interest-rates/initialize', {
      method: 'POST',
    });
  },

  // Get all interest rates with pagination and filters
  getAllInterestRates: async (params = {}) => {
    const { page = 1, limit = 10, isActive, duration } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
    if (duration) queryParams.append('duration', duration.toString());
    
    return apiRequest(`/admin/interest-rates?${queryParams.toString()}`);
  },

  // Get active interest rates
  getActiveInterestRates: async () => {
    return apiRequest('/admin/interest-rates/active');
  },

  // Get interest rate by duration
  getInterestRateByDuration: async (duration) => {
    return apiRequest(`/admin/interest-rates/duration/${duration}`);
  },

  // Get interest rate by ID
  getInterestRateById: async (id) => {
    return apiRequest(`/admin/interest-rates/${id}`);
  },

  // Create new interest rate
  createInterestRate: async (data) => {
    return apiRequest('/admin/interest-rates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update interest rate
  updateInterestRate: async (id, data) => {
    return apiRequest(`/admin/interest-rates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete interest rate
  deleteInterestRate: async (id) => {
    return apiRequest(`/admin/interest-rates/${id}`, {
      method: 'DELETE',
    });
  },
};

// Contragent API functions
export const contragentAPI = {
  // Login contragent
  login: async (phone, password) => {
    return apiRequest('/contragents/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  },

  // Get all contragents with pagination and filters
  getAllContragents: async (params = {}) => {
    const { page = 1, limit = 10, status, viloyat, tuman, mfy, contragentLevel } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (viloyat) queryParams.append('viloyat', viloyat);
    if (tuman) queryParams.append('tuman', tuman);
    if (mfy) queryParams.append('mfy', mfy);
    if (contragentLevel) queryParams.append('contragentLevel', contragentLevel);
    
    return apiRequest(`/contragents?${queryParams.toString()}`);
  },

  // Get contragent by ID
  getContragentById: async (id) => {
    return apiRequest(`/contragents/${id}`);
  },

  // Create new contragent
  createContragent: async (contragentData) => {
    return apiRequest('/contragents', {
      method: 'POST',
      body: JSON.stringify(contragentData),
    });
  },

  // Update contragent
  updateContragent: async (id, contragentData) => {
    return apiRequest(`/contragents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contragentData),
    });
  },

  // Delete contragent
  deleteContragent: async (id) => {
    return apiRequest(`/contragents/${id}`, {
      method: 'DELETE',
    });
  },
};

// Contragent Type API functions
export const contragentTypeAPI = {
  // Get all contragent types
  getAllContragentTypes: async (params = {}) => {
    const { status } = params;
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    const queryString = queryParams.toString();
    return apiRequest(`/contragent-types${queryString ? `?${queryString}` : ''}`);
  },

  // Get contragent type by ID
  getContragentTypeById: async (id) => {
    return apiRequest(`/contragent-types/${id}`);
  },

  // Create new contragent type
  createContragentType: async (contragentTypeData) => {
    return apiRequest('/contragent-types', {
      method: 'POST',
      body: JSON.stringify(contragentTypeData),
    });
  },

  // Update contragent type
  updateContragentType: async (id, contragentTypeData) => {
    return apiRequest(`/contragent-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contragentTypeData),
    });
  },

  // Delete contragent type
  deleteContragentType: async (id) => {
    return apiRequest(`/contragent-types/${id}`, {
      method: 'DELETE',
    });
  },
};

// Order API functions
export const orderAPI = {
  // Get agent cash orders
  getAgentCashOrders: async (params = {}) => {
    const { page = 1, limit = 10, agentId, startDate, endDate, status } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (agentId) queryParams.append('agentId', agentId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (status) queryParams.append('status', status);
    
    return apiRequest(`/admins/orders/cash?${queryParams.toString()}`);
  },

  // Get agent installment orders
  getAgentInstallmentOrders: async (params = {}) => {
    const { page = 1, limit = 10, agentId, startDate, endDate, status, customerPhone, passportSeries } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (agentId) queryParams.append('agentId', agentId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (status) queryParams.append('status', status);
    if (customerPhone) queryParams.append('customerPhone', customerPhone);
    if (passportSeries) queryParams.append('passportSeries', passportSeries);
    
    return apiRequest(`/admins/orders/installment?${queryParams.toString()}`);
  },
};

// KPI Bonus API functions
export const kpiAPI = {
  // Get initial KPI defaults
  getInitialDistributionDefaults: async () => {
    return apiRequest('/admins/kpi/distributions/initial/defaults');
  },

  // Get all KPI distributions
  getAllDistributions: async (params = {}) => {
    const { page = 1, limit = 50, isActive } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
    
    return apiRequest(`/admins/kpi/distributions?${queryParams.toString()}`);
  },

  // Get KPI distribution by ID
  getDistributionById: async (id) => {
    return apiRequest(`/admins/kpi/distributions/${id}`);
  },

  // Create KPI distribution
  createDistribution: async (distributionData) => {
    return apiRequest('/admins/kpi/distributions', {
      method: 'POST',
      body: JSON.stringify(distributionData),
    });
  },

  // Update KPI distribution
  updateDistribution: async (id, distributionData) => {
    return apiRequest(`/admins/kpi/distributions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(distributionData),
    });
  },

  // Delete KPI distribution
  deleteDistribution: async (id) => {
    return apiRequest(`/admins/kpi/distributions/${id}`, {
      method: 'DELETE',
    });
  },

  // Get all KPI transactions
  getAllTransactions: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      orderId, 
      productId, 
      contragentId, 
      punktId, 
      agentId, 
      orderStatus, 
      isPaid, 
      startDate, 
      endDate 
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (orderId) queryParams.append('orderId', orderId);
    if (productId) queryParams.append('productId', productId);
    if (contragentId) queryParams.append('contragentId', contragentId);
    if (punktId) queryParams.append('punktId', punktId);
    if (agentId) queryParams.append('agentId', agentId);
    if (orderStatus) queryParams.append('orderStatus', orderStatus);
    if (isPaid !== undefined) queryParams.append('isPaid', isPaid.toString());
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/kpi/transactions?${queryParams.toString()}`);
  },

  // Get KPI transaction by ID
  getTransactionById: async (id) => {
    return apiRequest(`/admins/kpi/transactions/${id}`);
  },

  // Get KPI statistics
  getStatistics: async (params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admins/kpi/statistics${queryString ? `?${queryString}` : ''}`);
  },

  // Get viloyat agents KPI
  getViloyatAgentsKPI: async (params = {}) => {
    const { page = 1, limit = 50, viloyatId, agentId, isPaid, startDate, endDate } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (viloyatId) queryParams.append('viloyatId', viloyatId);
    if (agentId) queryParams.append('agentId', agentId);
    if (isPaid !== undefined) queryParams.append('isPaid', isPaid.toString());
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/kpi/data/viloyat-agents?${queryParams.toString()}`);
  },

  // Get tuman agents KPI
  getTumanAgentsKPI: async (params = {}) => {
    const { page = 1, limit = 50, viloyatId, tumanId, agentId, isPaid, startDate, endDate } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (viloyatId) queryParams.append('viloyatId', viloyatId);
    if (tumanId) queryParams.append('tumanId', tumanId);
    if (agentId) queryParams.append('agentId', agentId);
    if (isPaid !== undefined) queryParams.append('isPaid', isPaid.toString());
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/kpi/data/tuman-agents?${queryParams.toString()}`);
  },

  // Get MFY agents KPI
  getMfyAgentsKPI: async (params = {}) => {
    const { page = 1, limit = 50, viloyatId, tumanId, mfyId, agentId, isPaid, startDate, endDate } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (viloyatId) queryParams.append('viloyatId', viloyatId);
    if (tumanId) queryParams.append('tumanId', tumanId);
    if (mfyId) queryParams.append('mfyId', mfyId);
    if (agentId) queryParams.append('agentId', agentId);
    if (isPaid !== undefined) queryParams.append('isPaid', isPaid.toString());
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/kpi/data/mfy-agents?${queryParams.toString()}`);
  },

  // Get punkts KPI
  getPunktsKPI: async (params = {}) => {
    const { page = 1, limit = 50, viloyatId, tumanId, punktId, isPaid, startDate, endDate } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (viloyatId) queryParams.append('viloyatId', viloyatId);
    if (tumanId) queryParams.append('tumanId', tumanId);
    if (punktId) queryParams.append('punktId', punktId);
    if (isPaid !== undefined) queryParams.append('isPaid', isPaid.toString());
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/kpi/data/punkts?${queryParams.toString()}`);
  },

  // Get agent KPI details
  getAgentKPIDetails: async (agentId, params = {}) => {
    const { role, isPaid, startDate, endDate, page = 1, limit = 50 } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (role) queryParams.append('role', role);
    if (isPaid !== undefined) queryParams.append('isPaid', isPaid.toString());
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/kpi/data/agents/${agentId}?${queryParams.toString()}`);
  },

  // Get punkt KPI details
  getPunktKPIDetails: async (punktId, params = {}) => {
    const { isPaid, startDate, endDate, page = 1, limit = 50 } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (isPaid !== undefined) queryParams.append('isPaid', isPaid.toString());
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admins/kpi/data/punkts/${punktId}?${queryParams.toString()}`);
  },
};

// Notifications API functions
export const notificationAPI = {
  // Get all notifications
  getAllNotifications: async (params = {}) => {
    const { page = 1, limit = 20, targetType, type, isActive } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (targetType) queryParams.append('targetType', targetType);
    if (type) queryParams.append('type', type);
    if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
    
    return apiRequest(`/notifications?${queryParams.toString()}`);
  },

  // Get notification by ID
  getNotificationById: async (id) => {
    return apiRequest(`/notifications/${id}`);
  },

  // Create notification
  createNotification: async (notificationData) => {
    return apiRequest('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },

  // Update notification
  updateNotification: async (id, notificationData) => {
    return apiRequest(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(notificationData),
    });
  },

  // Delete notification
  deleteNotification: async (id) => {
    return apiRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  // Get notification statistics
  getStats: async () => {
    return apiRequest('/notifications/stats');
  },
};

// Sales Statistics API functions
export const salesStatsAPI = {
  // Get sales summary
  getSummary: async (params = {}) => {
    const { startDate, endDate, viloyatId, tumanId, mfyId, status } = params;
    const queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (viloyatId) queryParams.append('viloyatId', viloyatId);
    if (tumanId) queryParams.append('tumanId', tumanId);
    if (mfyId) queryParams.append('mfyId', mfyId);
    if (status) queryParams.append('status', status);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admins/stats/sales/summary${queryString ? `?${queryString}` : ''}`);
  },

  // Get sales by viloyats
  getByViloyats: async (params = {}) => {
    const { startDate, endDate, status } = params;
    const queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (status) queryParams.append('status', status);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admins/stats/sales/viloyats${queryString ? `?${queryString}` : ''}`);
  },

  // Get sales by tumans
  getByTumans: async (params = {}) => {
    const { viloyatId, startDate, endDate, status } = params;
    const queryParams = new URLSearchParams();
    
    if (viloyatId) queryParams.append('viloyatId', viloyatId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (status) queryParams.append('status', status);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admins/stats/sales/tumans${queryString ? `?${queryString}` : ''}`);
  },

  // Get sales by MFYs
  getByMfys: async (params = {}) => {
    const { viloyatId, tumanId, startDate, endDate, status } = params;
    const queryParams = new URLSearchParams();
    
    if (viloyatId) queryParams.append('viloyatId', viloyatId);
    if (tumanId) queryParams.append('tumanId', tumanId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (status) queryParams.append('status', status);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admins/stats/sales/mfys${queryString ? `?${queryString}` : ''}`);
  },

  // Get single viloyat statistics (returns tumans)
  getViloyatStats: async (viloyatId, params = {}) => {
    const { startDate, endDate, status } = params;
    const queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (status) queryParams.append('status', status);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admins/stats/sales/viloyats/${viloyatId}${queryString ? `?${queryString}` : ''}`);
  },

  // Get single tuman statistics (returns MFYs)
  getTumanStats: async (tumanId, params = {}) => {
    const { startDate, endDate, status } = params;
    const queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (status) queryParams.append('status', status);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admins/stats/sales/tumans/${tumanId}${queryString ? `?${queryString}` : ''}`);
  },

  // Get single MFY statistics
  getMfyStats: async (mfyId, params = {}) => {
    const { startDate, endDate, status } = params;
    const queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (status) queryParams.append('status', status);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admins/stats/sales/mfys/${mfyId}${queryString ? `?${queryString}` : ''}`);
  },
};

// Reviews API functions
export const reviewAPI = {
  // Comment Template Management
  // Create comment template
  createCommentTemplate: async (templateData) => {
    return apiRequest('/reviews/admin/comment-templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },

  // Get all comment templates
  getAllCommentTemplates: async (params = {}) => {
    const { isActive } = params;
    const queryParams = new URLSearchParams();
    if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
    
    const queryString = queryParams.toString();
    return apiRequest(`/reviews/admin/comment-templates${queryString ? `?${queryString}` : ''}`);
  },

  // Update comment template
  updateCommentTemplate: async (id, templateData) => {
    return apiRequest(`/reviews/admin/comment-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  },

  // Delete comment template
  deleteCommentTemplate: async (id) => {
    return apiRequest(`/reviews/admin/comment-templates/${id}`, {
      method: 'DELETE',
    });
  },

  // Create initial templates
  createInitialTemplates: async () => {
    return apiRequest('/reviews/admin/initial-templates', {
      method: 'POST',
    });
  },

  // Reviews Management
  // Get all reviews
  getAllReviews: async (params = {}) => {
    const { page = 1, limit = 20, rating, productId, orderId, isPositive } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (rating) queryParams.append('rating', rating.toString());
    if (productId) queryParams.append('productId', productId);
    if (orderId) queryParams.append('orderId', orderId);
    if (isPositive !== undefined && isPositive !== null) queryParams.append('isPositive', isPositive.toString());
    
    return apiRequest(`/reviews/admin?${queryParams.toString()}`);
  },

  // Get review by ID
  getReviewById: async (id) => {
    return apiRequest(`/reviews/admin/${id}`);
  },

  // Contact Management
  // Get all contacts
  getAllContacts: async (params = {}) => {
    const { page = 1, limit = 20, status, isPositive } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (isPositive !== undefined && isPositive !== null) queryParams.append('isPositive', isPositive.toString());
    
    return apiRequest(`/reviews/admin/contacts?${queryParams.toString()}`);
  },

  // Get positive contacts
  getPositiveContacts: async (params = {}) => {
    const { page = 1, limit = 20, status } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    
    return apiRequest(`/reviews/admin/contacts/positive?${queryParams.toString()}`);
  },

  // Get negative contacts
  getNegativeContacts: async (params = {}) => {
    const { page = 1, limit = 20, status } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    
    return apiRequest(`/reviews/admin/contacts/negative?${queryParams.toString()}`);
  },

  // Get contact statistics
  getContactStatistics: async () => {
    return apiRequest('/reviews/admin/contacts/statistics');
  },

  // Get contact by ID
  getContactById: async (id) => {
    return apiRequest(`/reviews/admin/contacts/${id}`);
  },

  // Update contact status
  updateContactStatus: async (id, statusData) => {
    return apiRequest(`/reviews/admin/contacts/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  },
};

// Partnership Request API functions
export const partnershipRequestAPI = {
  // Get all partnership requests with pagination and filters
  getAllPartnershipRequests: async (params = {}) => {
    const { page = 1, limit = 20, status } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    
    return apiRequest(`/admins/marketplace-partnership-requests?${queryParams.toString()}`);
  },

  // Get partnership request by ID
  getPartnershipRequestById: async (id) => {
    return apiRequest(`/admins/marketplace-partnership-requests/${id}`);
  },

  // Update status to reviewing
  updateStatusToReviewing: async (id) => {
    return apiRequest(`/admins/marketplace-partnership-requests/${id}/reviewing`, {
      method: 'PATCH',
    });
  },

  // Update status to contacted
  updateStatusToContacted: async (id, adminNotes = '') => {
    const body = {};
    if (adminNotes && adminNotes.trim() !== '') {
      body.adminNotes = adminNotes.trim();
    }
    return apiRequest(`/admins/marketplace-partnership-requests/${id}/contacted`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  // Approve partnership request
  approvePartnershipRequest: async (id, adminNotes = '') => {
    const body = {};
    if (adminNotes && adminNotes.trim() !== '') {
      body.adminNotes = adminNotes.trim();
    }
    return apiRequest(`/admins/marketplace-partnership-requests/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  // Reject partnership request
  rejectPartnershipRequest: async (id, adminNotes) => {
    if (!adminNotes || adminNotes.trim() === '') {
      throw new Error('Rad etish sababi (adminNotes) kiritilishi shart');
    }
    return apiRequest(`/admins/marketplace-partnership-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNotes: adminNotes.trim() }),
    });
  },

  // Convert partnership request to contragent
  convertToContragent: async (id) => {
    return apiRequest(`/admins/marketplace-partnership-requests/${id}/convert-to-contragent`, {
      method: 'POST',
    });
  },
};

// Featured Contragents API functions
export const featuredContragentAPI = {
  // Get all featured contragents (short view)
  getFeaturedContragents: async () => {
    return apiRequest('/admins/featured-contragents');
  },

  // Update featured contragents list
  updateFeaturedContragents: async (contragentIds) => {
    return apiRequest('/admins/featured-contragents', {
      method: 'PUT',
      body: JSON.stringify({ contragentIds }),
    });
  },
};

// Finance API functions
export const financeAPI = {
  // Reports
  // Daily report
  getDailyReport: async (params = {}) => {
    const { date } = params;
    const queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/reports/daily${queryString ? `?${queryString}` : ''}`);
  },

  // Weekly report
  getWeeklyReport: async () => {
    return apiRequest('/admin-finance/reports/weekly');
  },

  // Monthly report
  getMonthlyReport: async (params = {}) => {
    const { year, month } = params;
    const queryParams = new URLSearchParams();
    if (year) queryParams.append('year', year.toString());
    if (month) queryParams.append('month', month.toString());
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/reports/monthly${queryString ? `?${queryString}` : ''}`);
  },

  // Yearly report
  getYearlyReport: async (params = {}) => {
    const { year } = params;
    const queryParams = new URLSearchParams();
    if (year) queryParams.append('year', year.toString());
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/reports/yearly${queryString ? `?${queryString}` : ''}`);
  },

  // Custom date range report
  getCustomReport: async (params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/reports/custom${queryString ? `?${queryString}` : ''}`);
  },

  // Submissions
  // Get pending submissions
  getPendingSubmissions: async () => {
    return apiRequest('/admin-finance/submissions/pending');
  },

  // Confirm submission
  confirmSubmission: async (submissionId) => {
    return apiRequest(`/admin-finance/submissions/${submissionId}/confirm`, {
      method: 'POST',
    });
  },

  // Reject submission
  rejectSubmission: async (submissionId, rejectionReason) => {
    return apiRequest(`/admin-finance/submissions/${submissionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
  },

  // Transactions
  // Get all transactions
  getAllTransactions: async (params = {}) => {
    const { 
      status, 
      paymentMethod, 
      startDate, 
      endDate, 
      currentHolder, 
      page = 1, 
      limit = 50 
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (paymentMethod) queryParams.append('paymentMethod', paymentMethod);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (currentHolder) queryParams.append('currentHolder', currentHolder);
    
    return apiRequest(`/admin-finance/transactions?${queryParams.toString()}`);
  },

  // Statistics
  // Get general statistics
  getStatistics: async () => {
    return apiRequest('/admin-finance/statistics');
  },

  // Get region statistics
  getRegionStatistics: async () => {
    return apiRequest('/admin-finance/statistics/region');
  },

  // Get district statistics
  getDistrictStatistics: async (params = {}) => {
    const { regionId } = params;
    const queryParams = new URLSearchParams();
    if (regionId) queryParams.append('regionId', regionId);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/statistics/district${queryString ? `?${queryString}` : ''}`);
  },

  // Get MFY statistics
  getMfyStatistics: async (params = {}) => {
    const { districtId } = params;
    const queryParams = new URLSearchParams();
    if (districtId) queryParams.append('districtId', districtId);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/statistics/mfy${queryString ? `?${queryString}` : ''}`);
  },

  // Get agent performance statistics
  getAgentPerformanceStatistics: async (params = {}) => {
    const { agentType, startDate, endDate } = params;
    const queryParams = new URLSearchParams();
    if (agentType) queryParams.append('agentType', agentType);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/statistics/agent-performance${queryString ? `?${queryString}` : ''}`);
  },

  // Balance API functions
  // Get overall balance
  getBalance: async (params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/balance${queryString ? `?${queryString}` : ''}`);
  },

  // Get total received amount
  getTotalReceived: async (params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/balance/total-received${queryString ? `?${queryString}` : ''}`);
  },

  // Get total distributed amount
  getTotalDistributed: async (params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/balance/total-distributed${queryString ? `?${queryString}` : ''}`);
  },

  // Get finance KPI amount
  getFinanceKpi: async (params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/balance/finance-kpi${queryString ? `?${queryString}` : ''}`);
  },

  // Get total balance
  getTotalBalance: async (params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/balance/total-balance${queryString ? `?${queryString}` : ''}`);
  },

  // Get delivery service KPI amount
  getDeliveryServiceKpi: async (params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-finance/balance/delivery-service-kpi${queryString ? `?${queryString}` : ''}`);
  },
};

// KPI Payment Distribution API
export const kpiPaymentAPI = {
  // Get unpaid payments
  getUnpaidPayments: async (params = {}) => {
    const { 
      recipientType, 
      agentType, 
      viloyatId, 
      tumanId, 
      mfyId, 
      page = 1, 
      limit = 50 
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (recipientType) queryParams.append('recipientType', recipientType);
    if (agentType) queryParams.append('agentType', agentType);
    if (viloyatId) queryParams.append('viloyatId', viloyatId);
    if (tumanId) queryParams.append('tumanId', tumanId);
    if (mfyId) queryParams.append('mfyId', mfyId);
    
    return apiRequest(`/admin-kpi-payments/unpaid?${queryParams.toString()}`);
  },

  // Get unpaid payments (grouped)
  getUnpaidPaymentsGrouped: async (params = {}) => {
    const { recipientType, agentType } = params;
    const queryParams = new URLSearchParams();
    
    if (recipientType) queryParams.append('recipientType', recipientType);
    if (agentType) queryParams.append('agentType', agentType);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-kpi-payments/unpaid/grouped${queryString ? `?${queryString}` : ''}`);
  },

  // Mark payments as paid
  markAsPaid: async (paymentIds, notes) => {
    return apiRequest('/admin-kpi-payments/mark-as-paid', {
      method: 'POST',
      body: JSON.stringify({ paymentIds, notes }),
    });
  },

  // Get statistics
  getStatistics: async (params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-kpi-payments/statistics${queryString ? `?${queryString}` : ''}`);
  },

  // Get paid payments
  getPaidPayments: async (params = {}) => {
    const { 
      recipientType, 
      agentType, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (recipientType) queryParams.append('recipientType', recipientType);
    if (agentType) queryParams.append('agentType', agentType);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admin-kpi-payments/paid?${queryParams.toString()}`);
  },

  // Sync payments
  syncPayments: async () => {
    return apiRequest('/admin-kpi-payments/sync', {
      method: 'POST',
    });
  },
};

// Contragent Payment Distribution API functions
export const contragentPaymentAPI = {
  // Get unpaid payments
  getUnpaidPayments: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      contragentId,
      viloyatId,
      tumanId,
      mfyId,
      isOverdue
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (contragentId) queryParams.append('contragentId', contragentId);
    if (viloyatId) queryParams.append('viloyatId', viloyatId);
    if (tumanId) queryParams.append('tumanId', tumanId);
    if (mfyId) queryParams.append('mfyId', mfyId);
    // API expects string 'true' or 'false' for isOverdue
    if (isOverdue !== undefined && isOverdue !== '') {
      queryParams.append('isOverdue', isOverdue === true || isOverdue === 'true' ? 'true' : 'false');
    }
    
    return apiRequest(`/admin-contragent-payments/unpaid?${queryParams.toString()}`);
  },

  // Get unpaid payments grouped
  getUnpaidPaymentsGrouped: async (params = {}) => {
    const { isOverdue } = params;
    const queryParams = new URLSearchParams();
    
    // API expects string 'true' or 'false' for isOverdue
    if (isOverdue !== undefined && isOverdue !== '') {
      queryParams.append('isOverdue', isOverdue === true || isOverdue === 'true' ? 'true' : 'false');
    }
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-contragent-payments/unpaid/grouped${queryString ? `?${queryString}` : ''}`);
  },

  // Pay single payment
  paySinglePayment: async (paymentId, notes) => {
    return apiRequest(`/admin-contragent-payments/${paymentId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || null }),
    });
  },

  // Pay payments by date range
  payByDateRange: async (params) => {
    const { startDate, endDate, contragentId, isOverdue, notes } = params;
    return apiRequest('/admin-contragent-payments/pay-by-date-range', {
      method: 'POST',
      body: JSON.stringify({
        startDate,
        endDate,
        contragentId: contragentId || undefined,
        isOverdue: isOverdue || false,
        notes: notes || undefined,
      }),
    });
  },

  // Mark payments as paid
  markAsPaid: async (paymentIds, notes) => {
    return apiRequest('/admin-contragent-payments/mark-as-paid', {
      method: 'POST',
      body: JSON.stringify({ 
        paymentIds,
        notes: notes || undefined,
      }),
    });
  },

  // Get paid payments
  getPaidPayments: async (params = {}) => {
    const { 
      page = 1, 
      limit = 50, 
      contragentId,
      startDate,
      endDate
    } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (contragentId) queryParams.append('contragentId', contragentId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return apiRequest(`/admin-contragent-payments/paid?${queryParams.toString()}`);
  },

  // Get statistics
  getStatistics: async (params = {}) => {
    const { startDate, endDate } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin-contragent-payments/statistics${queryString ? `?${queryString}` : ''}`);
  },

  // Sync payments
  syncPayments: async (dueDateDays = 7) => {
    return apiRequest('/admin-contragent-payments/sync', {
      method: 'POST',
      body: JSON.stringify({ dueDateDays }),
    });
  },
};

// Dashboard Statistics API
export const dashboardAPI = {
  // Get general statistics
  getStatistics: async () => {
    return apiRequest('/admins/dashboard/statistics');
  },

  // Get daily statistics (for charts)
  getDailyStatistics: async (days = 30) => {
    const queryParams = new URLSearchParams();
    if (days) queryParams.append('days', days.toString());
    return apiRequest(`/admins/dashboard/statistics/daily?${queryParams.toString()}`);
  },

  // Get weekly statistics (for charts)
  getWeeklyStatistics: async (weeks = 12) => {
    const queryParams = new URLSearchParams();
    if (weeks) queryParams.append('weeks', weeks.toString());
    return apiRequest(`/admins/dashboard/statistics/weekly?${queryParams.toString()}`);
  },

  // Get monthly statistics (for charts)
  getMonthlyStatistics: async (months = 12) => {
    const queryParams = new URLSearchParams();
    if (months) queryParams.append('months', months.toString());
    return apiRequest(`/admins/dashboard/statistics/monthly?${queryParams.toString()}`);
  },

  // Get orders statistics
  getOrdersStatistics: async () => {
    return apiRequest('/admins/dashboard/statistics/orders');
  },

  // Get finance statistics
  getFinanceStatistics: async () => {
    return apiRequest('/admins/dashboard/statistics/finance');
  },

  // Get users statistics
  getUsersStatistics: async () => {
    return apiRequest('/admins/dashboard/statistics/users');
  },

  // Get products statistics
  getProductsStatistics: async () => {
    return apiRequest('/admins/dashboard/statistics/products');
  },
};

// Helper function to make Public API requests (no auth, different base URL)
const publicApiRequest = async (endpoint, options = {}) => {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${PUBLIC_API_BASE_URL}${endpoint}`, config);
    
    // Handle non-JSON responses
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      if (!response.ok) {
        throw new Error(`Server xatolik: ${response.status}`);
      }
      throw jsonError;
    }
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Certificate Integration API functions
export const certificateAPI = {
  // Public API - Get candidate data by certificate ID (no auth required)
  getCandidateByCertificateId: async (certificateId) => {
    return publicApiRequest(`/company-integration/certificate/${certificateId}`);
  },

  // Public API - Get candidate data by certificate number (no auth required)
  getCandidateByCertificateNumber: async (certificateNumber) => {
    return publicApiRequest(`/company-integration/certificate-number/${certificateNumber}`);
  },

  // Admin API - Assign certificate to position (auth required)
  // Note: Admin API uses http://localhost:5000/api (internal backend)
  // Public API uses http://localhost:3000/api (external/public API)
  assignCertificateToPosition: async (assignmentData) => {
    return apiRequest('/admin/certificate-assignment/assign', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  },
};

