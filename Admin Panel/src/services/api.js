const API_BASE_URL = 'https://api.ttsa.uz/api';

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
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
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
      
      // Handle validation errors (400) with detailed error messages
      if (response.status === 400 && data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map(err => err.message || `${err.field}: ${err.message}`).join(', ');
        throw new Error(errorMessages || data.message || 'Validatsiya xatosi');
      }
      
      throw new Error(data.message || 'Something went wrong');
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
  login: async (username, password) => {
    return apiRequest('/admins/login', {
      method: 'POST',
      body: JSON.stringify({ username, parol: password }),
    });
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
  // Expected fields: name, role, telefonRaqam, username, parol, status
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
    
    return apiRequest(`/regions?${queryParams.toString()}`);
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
    const { page = 1, limit = 10, status, viloyat, tuman, mfy } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (viloyat) queryParams.append('viloyat', viloyat);
    if (tuman) queryParams.append('tuman', tuman);
    if (mfy) queryParams.append('mfy', mfy);
    
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

  // Get single viloyat statistics
  getViloyatStats: async (viloyatId, params = {}) => {
    const { groupBy, startDate, endDate, status } = params;
    const queryParams = new URLSearchParams();
    
    if (groupBy) queryParams.append('groupBy', groupBy);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (status) queryParams.append('status', status);
    
    const queryString = queryParams.toString();
    return apiRequest(`/admins/stats/sales/viloyats/${viloyatId}${queryString ? `?${queryString}` : ''}`);
  },

  // Get single tuman statistics
  getTumanStats: async (tumanId, params = {}) => {
    const { groupBy, startDate, endDate, status } = params;
    const queryParams = new URLSearchParams();
    
    if (groupBy) queryParams.append('groupBy', groupBy);
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
    const { page = 1, limit = 20, status, contactStatus } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (contactStatus) queryParams.append('contactStatus', contactStatus);
    
    return apiRequest(`/admins/partnership-requests?${queryParams.toString()}`);
  },

  // Get partnership request by ID
  getPartnershipRequestById: async (id) => {
    return apiRequest(`/admins/partnership-requests/${id}`);
  },

  // Update contact status
  updateContactStatus: async (id, contactStatus) => {
    return apiRequest(`/admins/partnership-requests/${id}/contact-status`, {
      method: 'PATCH',
      body: JSON.stringify({ contactStatus }),
    });
  },

  // Update request status
  updateRequestStatus: async (id, statusData) => {
    return apiRequest(`/admins/partnership-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },

  // Convert partnership request to contragent
  convertToContragent: async (id) => {
    return apiRequest(`/admins/partnership-requests/${id}/convert-to-contragent`, {
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

// Vacancy API functions
export const vacancyAPI = {
  // Get all vacancies with pagination and filters
  getAllVacancies: async (params = {}) => {
    const { page = 1, limit = 20, target, type, search } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (target) queryParams.append('target', target);
    if (type) queryParams.append('type', type);
    if (search) queryParams.append('search', search);
    
    return apiRequest(`/admins/vacancies?${queryParams.toString()}`);
  },

  // Get vacancy by ID
  getVacancyById: async (id) => {
    return apiRequest(`/admins/vacancies/${id}`);
  },

  // Create new vacancy
  createVacancy: async (vacancyData) => {
    return apiRequest('/admins/vacancies', {
      method: 'POST',
      body: JSON.stringify(vacancyData),
    });
  },

  // Delete vacancy
  deleteVacancy: async (id) => {
    return apiRequest(`/admins/vacancies/${id}`, {
      method: 'DELETE',
    });
  },

  // Update vacancy
  updateVacancy: async (id, vacancyData) => {
    return apiRequest(`/admins/vacancies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vacancyData),
    });
  },
};

// Vacancy Application API functions
export const vacancyApplicationAPI = {
  // Get applications by vacancy ID
  getApplicationsByVacancy: async (vacancyId, params = {}) => {
    const { page = 1, limit = 20, status } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) queryParams.append('status', status);
    
    return apiRequest(`/admins/vacancies/${vacancyId}/applications?${queryParams.toString()}`);
  },

  // Get application by ID
  getApplicationById: async (id) => {
    return apiRequest(`/admins/applications/${id}`);
  },

  // Decide on application (accept/reject)
  decideApplication: async (id, decisionData) => {
    return apiRequest(`/admins/applications/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify(decisionData),
    });
  },

  // Add interview stage
  addInterviewStage: async (id, stageData) => {
    return apiRequest(`/admins/applications/${id}/interview-stages`, {
      method: 'POST',
      body: JSON.stringify(stageData),
    });
  },

  // Get interview stage by ID
  getInterviewStage: async (id, stageId) => {
    return apiRequest(`/admins/applications/${id}/interview-stages/${stageId}`);
  },

  // Update interview stage
  updateInterviewStage: async (id, stageId, stageData) => {
    return apiRequest(`/admins/applications/${id}/interview-stages/${stageId}`, {
      method: 'PUT',
      body: JSON.stringify(stageData),
    });
  },

  // Submit interview stage result
  submitInterviewStageResult: async (id, stageId, resultData) => {
    return apiRequest(`/admins/applications/${id}/interview-stages/${stageId}/result`, {
      method: 'POST',
      body: JSON.stringify(resultData),
    });
  },

  // Delete interview stage
  deleteInterviewStage: async (id, stageId) => {
    return apiRequest(`/admins/applications/${id}/interview-stages/${stageId}`, {
      method: 'DELETE',
    });
  },

  // Make final decision
  makeFinalDecision: async (id, decisionData) => {
    return apiRequest(`/admins/applications/${id}/final-decision`, {
      method: 'POST',
      body: JSON.stringify(decisionData),
    });
  },
};

