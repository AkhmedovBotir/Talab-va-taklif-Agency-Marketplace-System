/**
 * Maxalla API Service
 */
/** REST va WebSocket (wss) uchun yagona host — endpointlar `/api/v1/...` bilan qo‘shiladi */
const API_BASE_URL = 'https://api.ttsa.uz';
/** Viloyat/tuman/MFY ro‘yxatlari (noauth regions) */
const REGIONS_BASE_URL = 'https://api.ttsa.uz/api';
const LOCAL_SHOPS_AUTH_BASE_PATH = '/api/v1/local-shops/auth';
const LOCAL_SHOPS_ME_BASE_PATH = '/api/v1/local-shops/me';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PasswordSetupStep1Request {
  phone: string;
}

export interface PasswordSetupStep2Request {
  phone: string;
  code: string;
}

export interface PasswordSetupStep3Request {
  phone: string;
  password: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  platform?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
}

export interface DeviceVerificationRequestCodeRequest {
  phone: string;
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  platform?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
}

export interface DeviceVerificationVerifyRequest {
  phone: string;
  deviceId: string;
  code: string;
  deviceName?: string;
  deviceType?: string;
  platform?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
}

export interface DeviceVerificationResendCodeRequest {
  phone: string;
  deviceId: string;
}

export interface WorkingHours {
  open: string | null;
  close: string | null;
}

export interface WorkingHourDay {
  weekday: number;
  is_off: boolean;
  open_time?: string;
  close_time?: string;
}

export interface ServiceAreas {
  tuman: Region | null;
  mfys: Region[];
}

export interface Contragent {
  _id: string;
  name: string;
  inn: string;
  phone: string;
  logo: string | null;
  viloyat: Region;
  tuman: Region;
  mfy: Region;
  activityType: ContragentType;
  contragentLevel: 'mfy';
  workingHours?: WorkingHours;
  serviceAreas?: ServiceAreas;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface LocalShop {
  id: number | string;
  name: string;
  phone: string;
  status: 'active' | 'inactive' | string;
  logo?: string | null;
  inn?: string;
  viloyat?: Region;
  tuman?: Region;
  mfy?: Region;
  activityType?: ContragentType;
  workingHours?: WorkingHours;
  serviceAreas?: ServiceAreas;
  createdAt?: string;
  updatedAt?: string;
}

export interface Region {
  _id: string;
  name: string;
  type: 'region' | 'district' | 'mfy';
  code: string;
  parent?: Region;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NoAuthCategoryItem {
  id: number;
  name: string;
  parent_id?: number | null;
}

export interface RegionsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Region[];
}

export interface ServiceAreaMfy {
  id: number;
  external_id?: string;
  district_id: number;
  name: string;
  code?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContragentType {
  _id: string;
  name: string;
  icon: string;
}

export interface DeliveryProvider {
  _id?: string;
  id: string | number;
  first_name: string;
  last_name: string;
  name: string;
  phone: string;
  note?: string | null;
  notes?: string | null;
  status?: 'active' | 'inactive';
  has_password?: boolean;
  password_setup_allowed?: boolean;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeliveryProviderRequest {
  first_name: string;
  last_name: string;
  phone: string;
  note?: string;
  password_setup_allowed?: boolean;
}

export interface UpdateDeliveryProviderRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  note?: string;
  password_setup_allowed?: boolean;
}

export interface DeliveryProviderPasswordSetupStep1Request {
  providerId: string;
  phone: string;
}

export interface DeliveryProviderPasswordSetupStep2Request {
  providerId: string;
  phone: string;
  code: string;
}

export interface DeliveryProviderPasswordSetupStep3Request {
  providerId: string;
  phone: string;
  newPassword: string;
  sessionToken: string;
}

export interface DeliveryProviderLoginRequest {
  providerId: string;
  phone: string;
  password: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
}

export interface BaseProduct {
  _id: string;
  name: string;
  description?: string;
  images?: string[];
  category: Category;
  subcategory?: Subcategory;
  unit: string;
  unitSize: number;
  status: 'active' | 'inactive';
}

export interface MaxallaProduct {
  _id: string;
  id?: string | number;
  baseProduct: BaseProduct;
  contragent: {
    _id: string;
    name: string;
    inn: string;
    phone: string;
  };
  quantity: number;
  price: number;
  originalPrice: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaxallaProductRequest {
  template_id: number;
  quantity: number;
  price: number;
  original_price: number;
}

export interface UpdateMaxallaProductRequest {
  template_id?: number;
  quantity?: number;
  price?: number;
  original_price?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface OrderPaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: T[];
}

export interface OrderUser {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface MarketplaceUserBasic {
  id: number;
  first_name: string;
  last_name: string;
}

export interface OrderProduct {
  _id: string;
  name: string;
  description?: string;
  images?: string[];
  price: number;
  originalPrice: number;
  quantity: number;
  unit: string;
  unitSize: number;
  category: {
    _id: string;
    name: string;
    slug: string;
    status?: string;
  };
  subcategory: {
    _id: string;
    name: string;
    slug: string;
    status?: string;
  };
  contragent?: {
    _id: string;
    name: string;
    phone: string;
    viloyat: { name: string; type: string; code: string };
    tuman: { name: string; type: string; code: string };
    mfy: { name: string; type: string; code: string };
  };
  productType: 'maxalla' | 'tuman';
}

export interface OrderItem {
  product: OrderProduct | string;
  quantity: number;
  price: number;
  originalPrice: number;
  productType: 'maxalla' | 'tuman';
  productModel?: string;
  kpiBonusPercent?: number | null;
}

export interface ContragentRequest {
  contragentId: {
    _id: string;
    name: string;
    phone: string;
    viloyat?: { name: string; type: string; code: string };
    tuman?: { name: string; type: string; code: string };
    mfy?: { name: string; type: string; code: string };
  };
  itemIds: number[];
  status: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
  requestedAt: string;
  respondedAt: string | null;
  deliveredToPunktAt: string | null;
  deliveryProvider: {
    _id: string;
    name: string;
    phone: string;
  } | null;
  sentToDeliveryProviderAt: string | null;
}

export interface OrderRegion {
  _id: string;
  name: string;
  type: string;
  code: string;
}

export interface Order {
  _id: string;
  localShopId?: number;
  userId?: number;
  orderNumber: string;
  user: OrderUser;
  canApprove?: boolean;
  canCancel?: boolean;
  canAssignCourier?: boolean;
  assignedCourierId?: number | null;
  courierAssignedAt?: string | null;
  paymentTransferredToShopAt?: string | null;
  shopPaymentAcceptedAt?: string | null;
  items: OrderItem[];
  totalPrice: number;
  totalOriginalPrice: number;
  itemCount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryViloyat: OrderRegion;
  deliveryTuman: OrderRegion | null;
  deliveryMfy: OrderRegion | null;
  deliveryNote: string;
  phoneNumber: string;
  contragentRequests: ContragentRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderAnalytics {
  from: string;
  to: string;
  total_orders: number;
  total_amount: number;
  delivered_amount: number;
  undelivered_amount: number;
  transferred_amount: number;
  untransferred_amount: number;
}

export interface SendOrderToDeliveryProviderRequest {
  deliveryProviderId: string;
}

export interface SendOrderToDeliveryProviderResponse {
  orderId: string;
  orderNumber: string;
  contragentRequest: ContragentRequest;
  deliveryProvider: {
    _id: string;
    name: string;
    phone: string;
  };
  sentAt: string;
}

export interface RespondToOrderRequestRequest {
  response: 'accepted' | 'rejected';
}

export interface RespondToOrderRequestResponse {
  _id: string;
  orderNumber: string;
  user: OrderUser;
  items: OrderItem[];
  status: string;
  contragentRequests: ContragentRequest[];
}

export interface LoginResponse {
  token: string;
  shop: LocalShop;
}

export interface DeviceVerificationResponse {
  deviceId: string;
  deviceName?: string;
  isPrimary: boolean;
  isVerified: boolean;
}

export interface LocalShopProfileResponse {
  shop: LocalShop;
}

export type LocalShopNotificationType =
  | 'info'
  | 'warning'
  | 'success'
  | 'error'
  | 'update'
  | 'announcement';

export type LocalShopNotificationTargetType = 'all' | 'localshops' | string;

export interface LocalShopNotification {
  id: number | string;
  title: string;
  message: string;
  type: LocalShopNotificationType | string;
  target_type: LocalShopNotificationTargetType;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalShopNotificationsListData {
  items: LocalShopNotification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

/** WebSocket for real-time notifications (same host as REST). */
export function getLocalShopNotificationsWebSocketUrl(token: string): string {
  const wsBase = API_BASE_URL.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://');
  return `${wsBase}${LOCAL_SHOPS_ME_BASE_PATH}/notifications/ws?token=${encodeURIComponent(token)}`;
}

class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'API xatosi yuz berdi',
        response.status,
        data
      );
    }

    return {
      success: typeof data?.success === 'boolean' ? data.success : true,
      message: data?.message || '',
      data: data?.data,
      ...data,
    };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network error
    throw new ApiError(
      error.message || 'Tarmoq xatosi yuz berdi',
      0,
      error
    );
  }
}

async function fetchApiWithAuth<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(
        data.message || 'API xatosi yuz berdi',
        response.status,
        data
      );
    }

    return {
      success: typeof data?.success === 'boolean' ? data.success : true,
      message: data?.message || '',
      data: data?.data,
      ...data,
    };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network error
    throw new ApiError(
      error.message || 'Tarmoq xatosi yuz berdi',
      0,
      error
    );
  }
}

function parseDeltaDescription(value: any): string {
  if (!value || typeof value !== 'string') return value || '';
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return value;
  }

  try {
    const parsed = JSON.parse(trimmed);
    const ops = Array.isArray(parsed) ? parsed : parsed?.ops;
    if (!Array.isArray(ops)) return value;

    const text = ops
      .map((op: any) => (typeof op?.insert === 'string' ? op.insert : ''))
      .join('')
      .replace(/\s+\n/g, '\n')
      .trim();

    return text || value;
  } catch {
    return value;
  }
}

export const apiService = {
  async getCategoryMaps(): Promise<{
    categoryNameById: Record<number, string>;
    subcategoryNameById: Record<number, string>;
  }> {
    const [categoriesRes, subcategoriesRes] = await Promise.all([
      fetchApi<{ items: NoAuthCategoryItem[] }>(
        '/api/v1/noauth/categories?page=1&limit=1000',
        { method: 'GET' }
      ).catch(() => ({ data: { items: [] } })),
      fetchApi<{ items: NoAuthCategoryItem[] }>(
        '/api/v1/noauth/subcategories?page=1&limit=1000',
        { method: 'GET' }
      ).catch(() => ({ data: { items: [] } })),
    ]);

    const categoriesItems =
      (categoriesRes as any).items || categoriesRes.data?.items || [];
    const subcategoriesItems =
      (subcategoriesRes as any).items || subcategoriesRes.data?.items || [];

    const categoryNameById: Record<number, string> = {};
    const subcategoryNameById: Record<number, string> = {};

    categoriesItems.forEach((item: NoAuthCategoryItem) => {
      categoryNameById[item.id] = item.name;
    });
    subcategoriesItems.forEach((item: NoAuthCategoryItem) => {
      subcategoryNameById[item.id] = item.name;
    });

    return { categoryNameById, subcategoryNameById };
  },

  normalizeProductTemplate(
    raw: any,
    categoryNameById?: Record<number, string>,
    subcategoryNameById?: Record<number, string>
  ): BaseProduct {
    const categoryId = Number(raw?.category_id ?? 0);
    const subcategoryId = Number(raw?.subcategory_id ?? 0);
    return {
      _id: String(raw?.id ?? raw?._id ?? ''),
      name: raw?.name || '',
      description: parseDeltaDescription(raw?.description || ''),
      images: Array.isArray(raw?.images) ? raw.images : [],
      category: {
        _id: String(raw?.category_id ?? ''),
        name:
          raw?.category_name ||
          (categoryId ? categoryNameById?.[categoryId] : undefined) ||
          `#${raw?.category_id ?? ''}`,
        slug: '',
      },
      subcategory: raw?.subcategory_id
        ? {
            _id: String(raw.subcategory_id),
            name:
              raw?.subcategory_name ||
              (subcategoryId ? subcategoryNameById?.[subcategoryId] : undefined) ||
              `#${raw.subcategory_id}`,
            slug: '',
          }
        : undefined,
      unit: raw?.unit || '',
      unitSize: Number(raw?.unit_size ?? 0),
      status: raw?.status || 'active',
    };
  },

  normalizeLocalShopProduct(
    raw: any,
    categoryNameById?: Record<number, string>,
    subcategoryNameById?: Record<number, string>
  ): MaxallaProduct {
    const template = raw?.template || {};
    const baseProduct = apiService.normalizeProductTemplate({
      id: template.id ?? raw?.template_id,
      name: template.name,
      description: template.description,
      images: template.images,
      category_id: template.category_id,
      subcategory_id: template.subcategory_id,
      unit: template.unit,
      unit_size: template.unit_size,
      status: template.status || 'active',
      category_name: template.category_name,
      subcategory_name: template.subcategory_name,
    }, categoryNameById, subcategoryNameById);

    return {
      _id: String(raw?.id ?? raw?._id ?? ''),
      id: raw?.id ?? raw?._id,
      baseProduct,
      contragent: {
        _id: '',
        name: '',
        inn: '',
        phone: '',
      },
      quantity: Number(raw?.quantity ?? 0),
      price: Number(raw?.price ?? 0),
      originalPrice: Number(raw?.original_price ?? raw?.originalPrice ?? 0),
      status: (raw?.status || 'active') as 'active' | 'inactive',
      createdAt: raw?.created_at || raw?.createdAt || '',
      updatedAt: raw?.updated_at || raw?.updatedAt || '',
    };
  },

  normalizeDeliveryProvider(raw: any): DeliveryProvider {
    const first_name = raw?.first_name || '';
    const last_name = raw?.last_name || '';
    return {
      ...raw,
      id: raw?.id ?? raw?._id ?? '',
      _id: raw?._id ?? String(raw?.id ?? ''),
      first_name,
      last_name,
      name: `${first_name} ${last_name}`.trim() || raw?.name || '',
      note: raw?.note ?? raw?.notes ?? null,
      notes: raw?.notes ?? raw?.note ?? null,
      createdAt: raw?.createdAt ?? raw?.created_at,
      updatedAt: raw?.updatedAt ?? raw?.updated_at,
    };
  },
  normalizeLocalShopOrder(raw: any): Order {
    const mappedStatus =
      raw?.status === 'approved'
        ? 'accepted'
        : raw?.status === 'cancelled'
          ? 'rejected'
          : 'pending';
    const userData = raw?.buyer || raw?.user || {};
    const items = Array.isArray(raw?.items)
      ? raw.items.map((item: any) => {
          const productId =
            item?.product ??
            item?.product_id ??
            item?.local_shop_product_id ??
            item?.template_id;
          const template = item?.template || {};
          const hasTemplateName = Boolean(template?.name || item?.product_name);
          return {
            product: hasTemplateName
              ? {
                  _id: String(productId ?? ''),
                  name: template?.name || item?.product_name || 'Mahsulot',
                  description: parseDeltaDescription(template?.description || ''),
                  images: Array.isArray(template?.images) ? template.images : [],
                  price: Number(item?.price ?? 0),
                  originalPrice: Number(item?.original_price ?? item?.price ?? 0),
                  quantity: Number(item?.quantity ?? 0),
                  unit: template?.unit || '',
                  unitSize: Number(template?.unit_size ?? 0),
                  category: {
                    _id: String(template?.category_id ?? ''),
                    name: template?.category_name || '',
                    slug: '',
                  },
                  subcategory: {
                    _id: String(template?.subcategory_id ?? ''),
                    name: template?.subcategory_name || '',
                    slug: '',
                  },
                  productType: 'maxalla' as const,
                }
              : String(productId ?? ''),
            quantity: Number(item?.quantity ?? 0),
            price: Number(item?.price ?? 0),
            originalPrice: Number(item?.original_price ?? item?.price ?? 0),
            productType: 'maxalla' as const,
          };
        })
      : [];
    const assignedCourier = raw?.assigned_courier || null;

    return {
      _id: String(raw?.id ?? ''),
      localShopId: Number(raw?.local_shop_id ?? 0) || undefined,
      userId: Number(raw?.user_id ?? userData?.id ?? 0) || undefined,
      orderNumber: `#${raw?.id ?? ''}`,
      user: {
        _id: String(userData?.id ?? raw?.user_id ?? ''),
        firstName: userData?.first_name || '',
        lastName: userData?.last_name || '',
        phone: userData?.phone || raw?.extra_phone || '',
      },
      canApprove: Boolean(raw?.can_approve),
      canCancel: Boolean(raw?.can_cancel),
      canAssignCourier: Boolean(raw?.can_assign_courier),
      assignedCourierId:
        raw?.assigned_courier_id === null || raw?.assigned_courier_id === undefined
          ? null
          : Number(raw?.assigned_courier_id),
      courierAssignedAt: raw?.courier_assigned_at || null,
      paymentTransferredToShopAt: raw?.payment_transferred_to_shop_at || null,
      shopPaymentAcceptedAt: raw?.shop_payment_accepted_at || null,
      items,
      totalPrice: Number(raw?.total_amount ?? 0),
      totalOriginalPrice: Number(raw?.total_amount ?? 0),
      itemCount: items.length,
      status: raw?.status || 'pending',
      paymentStatus: '',
      paymentMethod: '',
      deliveryViloyat: { _id: '', name: '', type: '', code: '' },
      deliveryTuman: null,
      deliveryMfy: null,
      deliveryNote: raw?.address_note || '',
      phoneNumber: raw?.extra_phone || '',
      contragentRequests: [
        {
          contragentId: { _id: '', name: '', phone: '' },
          itemIds: [],
          status: mappedStatus as 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt',
          requestedAt: raw?.created_at || '',
          respondedAt: null,
          deliveredToPunktAt: null,
          deliveryProvider: assignedCourier
            ? {
                _id: String(assignedCourier.id ?? ''),
                name: `${assignedCourier.first_name || ''} ${assignedCourier.last_name || ''}`.trim(),
                phone: assignedCourier.phone || '',
              }
            : null,
          sentToDeliveryProviderAt: raw?.courier_assigned_at || null,
        },
      ],
      createdAt: raw?.created_at || '',
      updatedAt: raw?.updated_at || '',
    };
  },
  async getNoAuthLocalShopProducts(params?: {
    page?: number;
    limit?: number;
    q?: string;
    district_id?: number;
    mfy_id?: number;
    local_shop_id?: number;
  }): Promise<PaginatedResponse<MaxallaProduct>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(params?.page ?? 1));
      queryParams.append('limit', String(params?.limit ?? 100));
      if (params?.q) queryParams.append('q', params.q);
      if (params?.district_id) queryParams.append('district_id', String(params.district_id));
      if (params?.mfy_id) queryParams.append('mfy_id', String(params.mfy_id));
      if (params?.local_shop_id) queryParams.append('local_shop_id', String(params.local_shop_id));

      const queryString = queryParams.toString();
      const response = await fetchApi<any>(
        `/api/v1/noauth/local-shop-products${queryString ? `?${queryString}` : ''}`,
        { method: 'GET' }
      );
      const payload = response as any;
      const dataBlock = payload.data || payload;
      const { categoryNameById, subcategoryNameById } = await apiService.getCategoryMaps();
      const items = (dataBlock.items || []).map((item: any) =>
        apiService.normalizeLocalShopProduct(item, categoryNameById, subcategoryNameById)
      );
      return {
        success: true,
        data: items,
        pagination: {
          page: dataBlock.page ?? 1,
          limit: dataBlock.limit ?? items.length ?? 0,
          total: dataBlock.total ?? items.length ?? 0,
          pages: dataBlock.total_pages ?? 1,
        },
      };
    } catch (error: any) {
      throw error;
    }
  },
  async getNoAuthMarketplaceUsers(params?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<PaginatedResponse<MarketplaceUserBasic>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(params?.page ?? 1));
      queryParams.append('limit', String(params?.limit ?? 100));
      if (params?.q) queryParams.append('q', params.q);

      const queryString = queryParams.toString();
      const response = await fetchApi<any>(
        `/api/v1/noauth/marketplace-users${queryString ? `?${queryString}` : ''}`,
        { method: 'GET' }
      );
      const payload = response as any;
      const dataBlock = payload.data || payload;
      const items = (dataBlock.items || []).map((user: any) => ({
        id: Number(user?.id ?? 0),
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
      }));
      return {
        success: true,
        data: items,
        pagination: {
          page: dataBlock.page ?? 1,
          limit: dataBlock.limit ?? items.length ?? 0,
          total: dataBlock.total ?? items.length ?? 0,
          pages: dataBlock.total_pages ?? 1,
        },
      };
    } catch (error: any) {
      throw error;
    }
  },
  /**
   * Password Setup Step 1: Request SMS Code
   * POST /api/maxalla-contragents/password-setup/step1
   */
  async passwordSetupStep1(request: PasswordSetupStep1Request): Promise<ApiResponse> {
    try {
      return await fetchApi(`${LOCAL_SHOPS_AUTH_BASE_PATH}/send-code`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Password Setup Step 2: Verify SMS Code
   * POST /api/maxalla-contragents/password-setup/step2
   */
  async passwordSetupStep2(request: PasswordSetupStep2Request): Promise<ApiResponse> {
    try {
      return await fetchApi(`${LOCAL_SHOPS_AUTH_BASE_PATH}/verify-code`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Password Setup Step 3: Set Password
   * POST /api/maxalla-contragents/password-setup/step3
   */
  async passwordSetupStep3(request: PasswordSetupStep3Request): Promise<ApiResponse> {
    try {
      return await fetchApi(`${LOCAL_SHOPS_AUTH_BASE_PATH}/set-password`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Login
   * POST /api/maxalla-contragents/login
   */
  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      return await fetchApi<LoginResponse>(`${LOCAL_SHOPS_AUTH_BASE_PATH}/login`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error: any) {
      // Check if device verification is required
      if (error.status === 403 && error.data?.requiresDeviceVerification) {
        throw error;
      }
      throw error;
    }
  },

  /**
   * Device Verification: Request Code
   * POST /api/maxalla-contragents/device-verification/request-code
   */
  async requestDeviceVerificationCode(
    request: DeviceVerificationRequestCodeRequest
  ): Promise<ApiResponse<{ phone: string; deviceId: string; expiresIn: number }>> {
    try {
      return await fetchApi(`${LOCAL_SHOPS_AUTH_BASE_PATH}/send-code`, {
        method: 'POST',
        body: JSON.stringify({ phone: request.phone }),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Device Verification: Verify Device
   * POST /api/maxalla-contragents/device-verification/verify
   */
  async verifyDevice(
    request: DeviceVerificationVerifyRequest
  ): Promise<ApiResponse<DeviceVerificationResponse>> {
    try {
      return await fetchApi<DeviceVerificationResponse>(
        `${LOCAL_SHOPS_AUTH_BASE_PATH}/verify-code`,
        {
          method: 'POST',
          body: JSON.stringify({ phone: request.phone, code: request.code }),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Device Verification: Resend Code
   * POST /api/maxalla-contragents/device-verification/resend-code
   */
  async resendDeviceVerificationCode(
    request: DeviceVerificationResendCodeRequest
  ): Promise<ApiResponse<{ phone: string; deviceId: string; expiresIn: number }>> {
    try {
      return await fetchApi(`${LOCAL_SHOPS_AUTH_BASE_PATH}/resend-code`, {
        method: 'POST',
        body: JSON.stringify({ phone: request.phone }),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get My Profile
   * GET /api/maxalla-contragents/me
   */
  async getMyProfile(token: string): Promise<ApiResponse<LocalShop>> {
    try {
      const response = await fetchApiWithAuth<LocalShop | LocalShopProfileResponse>(
        `${LOCAL_SHOPS_ME_BASE_PATH}/profile`,
        token,
        {
          method: 'GET',
        }
      );
      const normalizedData =
        response.data && 'shop' in (response.data as LocalShopProfileResponse)
          ? (response.data as LocalShopProfileResponse).shop
          : (response.data as LocalShop);

      return {
        ...response,
        data: normalizedData,
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Change Password
   * POST /api/v1/local-shops/me/change-password
   */
  async changePassword(
    token: string,
    payload: {
      old_password: string;
      new_password: string;
    }
  ): Promise<ApiResponse> {
    try {
      return await fetchApiWithAuth(`${LOCAL_SHOPS_ME_BASE_PATH}/change-password`, token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update Logo
   * PATCH /api/v1/local-shops/me/logo
   */
  async updateMyLogo(token: string, logo: string): Promise<ApiResponse<LocalShop>> {
    try {
      return await fetchApiWithAuth<LocalShop>(`${LOCAL_SHOPS_ME_BASE_PATH}/logo`, token, {
        method: 'PATCH',
        body: JSON.stringify({ logo }),
      });
    } catch (error: any) {
      throw error;
    }
  },

  async resendCode(request: PasswordSetupStep1Request): Promise<ApiResponse> {
    try {
      return await fetchApi(`${LOCAL_SHOPS_AUTH_BASE_PATH}/resend-code`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update My Profile
   * PUT /api/maxalla-contragents/me
   */
  async updateMyProfile(
    token: string,
    profileData: {
      name?: string;
      phone?: string;
      inn?: string;
      viloyat?: string;
      tuman?: string;
      mfy?: string;
      logo?: string;
      activityType?: string;
    }
  ): Promise<ApiResponse<Contragent>> {
    try {
      return await fetchApiWithAuth<Contragent>('/api/maxalla-contragents/me', token, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    } catch (error: any) {
      throw error;
    }
  },

  async getWorkingHours(
    token: string
  ): Promise<ApiResponse<{ working_hours: WorkingHourDay[] }>> {
    try {
      return await fetchApiWithAuth<{ working_hours: WorkingHourDay[] }>(
        '/api/v1/local-shops/me/working-hours',
        token,
        {
          method: 'GET',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  async updateWorkingHours(
    token: string,
    payload: {
      working_hours: WorkingHourDay[];
    }
  ): Promise<ApiResponse<{ working_hours: WorkingHourDay[] }>> {
    try {
      return await fetchApiWithAuth<{ working_hours: WorkingHourDay[] }>(
        '/api/v1/local-shops/me/working-hours',
        token,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update Service Areas
   * PATCH /api/maxalla-contragents/me/service-areas
   */
  async updateServiceAreas(
    token: string,
    serviceAreas: {
      tuman?: string;
      mfys?: string[];
    }
  ): Promise<ApiResponse<{ serviceAreas: ServiceAreas }>> {
    try {
      return await fetchApiWithAuth<{ serviceAreas: ServiceAreas }>(
        '/api/maxalla-contragents/me/service-areas',
        token,
        {
          method: 'PATCH',
          body: JSON.stringify(serviceAreas),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  async getServiceAreaMfys(
    token: string
  ): Promise<
    ApiResponse<{
      district_id: number;
      available_mfys: ServiceAreaMfy[];
      selected_mfy_ids: number[];
    }>
  > {
    try {
      return await fetchApiWithAuth<{
        district_id: number;
        available_mfys: ServiceAreaMfy[];
        selected_mfy_ids: number[];
      }>(
        '/api/v1/local-shops/me/service-areas/mfys',
        token,
        {
          method: 'GET',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  async updateServiceAreaMfys(
    token: string,
    payload: { mfy_ids: number[] }
  ): Promise<
    ApiResponse<{
      district_id: number;
      available_mfys: ServiceAreaMfy[];
      selected_mfy_ids: number[];
    }>
  > {
    try {
      return await fetchApiWithAuth<{
        district_id: number;
        available_mfys: ServiceAreaMfy[];
        selected_mfy_ids: number[];
      }>(
        '/api/v1/local-shops/me/service-areas/mfys',
        token,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Logout
   * POST /api/maxalla-contragents/logout
   */
  async logout(token: string, deviceId?: string): Promise<ApiResponse> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (deviceId) {
        headers['x-device-id'] = deviceId;
      }

      return await fetchApiWithAuth<{}>(
        '/api/maxalla-contragents/logout',
        token,
        {
          method: 'POST',
          headers,
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Create Delivery Provider
   * POST /api/maxalla-contragents/delivery-providers
   */
  async createDeliveryProvider(
    token: string,
    data: CreateDeliveryProviderRequest
  ): Promise<ApiResponse<DeliveryProvider>> {
    try {
      const response = await fetchApiWithAuth<any>(
        '/api/v1/local-shops/me/couriers',
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      const raw = response.data || (response as any);
      return {
        ...response,
        data: apiService.normalizeDeliveryProvider(raw),
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get All Delivery Providers
   * GET /api/maxalla-contragents/delivery-providers
   */
  async getDeliveryProviders(
    token: string,
    status?: 'active' | 'inactive'
  ): Promise<ApiResponse<DeliveryProvider[]>> {
    try {
      const response = await fetchApiWithAuth<any>(
        '/api/v1/local-shops/me/couriers?page=1&limit=100',
        token,
        {
          method: 'GET',
        }
      );
      const items = response.data?.items || (response as any).items || [];
      const normalized = items.map((item: any) => apiService.normalizeDeliveryProvider(item));
      const filtered = status
        ? normalized.filter((item: DeliveryProvider) => {
            const currentStatus = (item as any).status;
            if (!currentStatus) return true;
            return currentStatus === status;
          })
        : normalized;
      return {
        ...response,
        data: filtered,
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Delivery Provider by ID
   * GET /api/maxalla-contragents/delivery-providers/:id
   */
  async getDeliveryProviderById(
    token: string,
    id: string
  ): Promise<ApiResponse<DeliveryProvider>> {
    try {
      const response = await fetchApiWithAuth<any>(
        `/api/v1/local-shops/me/couriers/${id}`,
        token,
        {
          method: 'GET',
        }
      );
      const raw = response.data || (response as any);
      return {
        ...response,
        data: apiService.normalizeDeliveryProvider(raw),
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update Delivery Provider
   * PUT /api/maxalla-contragents/delivery-providers/:id
   */
  async updateDeliveryProvider(
    token: string,
    id: string,
    data: UpdateDeliveryProviderRequest
  ): Promise<ApiResponse<DeliveryProvider>> {
    try {
      const response = await fetchApiWithAuth<any>(
        `/api/v1/local-shops/me/couriers/${id}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      const raw = response.data || (response as any);
      return {
        ...response,
        data: apiService.normalizeDeliveryProvider(raw),
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete Delivery Provider
   * DELETE /api/maxalla-contragents/delivery-providers/:id
   */
  async deleteDeliveryProvider(
    token: string,
    id: string
  ): Promise<ApiResponse> {
    try {
      return await fetchApiWithAuth(
        `/api/v1/local-shops/me/couriers/${id}`,
        token,
        {
          method: 'DELETE',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delivery Provider Password Setup Step 1
   * POST /api/maxalla-contragents/delivery-providers/password-setup/step1
   */
  async deliveryProviderPasswordSetupStep1(
    token: string,
    data: DeliveryProviderPasswordSetupStep1Request
  ): Promise<ApiResponse> {
    try {
      return await fetchApiWithAuth(
        '/api/maxalla-contragents/delivery-providers/password-setup/step1',
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delivery Provider Password Setup Step 2
   * POST /api/maxalla-contragents/delivery-providers/password-setup/step2
   */
  async deliveryProviderPasswordSetupStep2(
    token: string,
    data: DeliveryProviderPasswordSetupStep2Request
  ): Promise<ApiResponse<{ sessionToken: string }>> {
    try {
      return await fetchApiWithAuth<{ sessionToken: string }>(
        '/api/maxalla-contragents/delivery-providers/password-setup/step2',
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delivery Provider Password Setup Step 3
   * POST /api/maxalla-contragents/delivery-providers/password-setup/step3
   */
  async deliveryProviderPasswordSetupStep3(
    token: string,
    data: DeliveryProviderPasswordSetupStep3Request
  ): Promise<ApiResponse<DeliveryProvider>> {
    try {
      return await fetchApiWithAuth<DeliveryProvider>(
        '/api/maxalla-contragents/delivery-providers/password-setup/step3',
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delivery Provider Login
   * POST /api/maxalla-contragents/delivery-providers/login
   */
  async deliveryProviderLogin(
    token: string,
    data: DeliveryProviderLoginRequest
  ): Promise<ApiResponse<{ token: string; deliveryProvider: DeliveryProvider }>> {
    try {
      return await fetchApiWithAuth<{ token: string; deliveryProvider: DeliveryProvider }>(
        '/api/maxalla-contragents/delivery-providers/login',
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Regions
   * GET /api/regions
   */
  async getRegions(params?: {
    type?: 'region' | 'district' | 'mfy';
    parent?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<RegionsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      let endpoint = '/v1/noauth/regions';
      if (params?.type === 'district') {
        if (params?.parent) queryParams.append('region_id', params.parent);
        endpoint = '/v1/noauth/districts';
      } else if (params?.type === 'mfy') {
        if (params?.parent) queryParams.append('district_id', params.parent);
        endpoint = '/v1/noauth/mfys';
      }

      const queryString = queryParams.toString();
      const fullEndpoint = `${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(`${REGIONS_BASE_URL}${fullEndpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(
          data.message || 'API xatosi yuz berdi',
          response.status,
          data
        );
      }

      const items = data.items || data.data || [];
      const mapped: Region[] = items.map((item: any) => ({
        _id: String(item.id ?? item._id),
        name: item.name,
        type: params?.type || item.type || 'region',
        code: item.code || '',
      }));

      return {
        success: true,
        count: mapped.length,
        total: data.total ?? mapped.length,
        page: data.page ?? 1,
        limit: data.limit ?? mapped.length,
        totalPages: data.total_pages ?? 1,
        data: mapped,
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Available Product Templates for Local Shop
   * GET /api/v1/local-shops/me/product-templates
   */
  async getAvailableBaseProducts(
    token: string,
    params?: {
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<BaseProduct>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(params?.page ?? 1));
      queryParams.append('limit', String(params?.limit ?? 100));

      const queryString = queryParams.toString();
      const endpoint = `/api/v1/local-shops/me/product-templates${queryString ? `?${queryString}` : ''}`;
      const response = await fetchApiWithAuth<any>(endpoint, token, {
        method: 'GET',
      });
      const payload = response as any;
      const dataBlock = payload.data || {};
      const rawItems = dataBlock.items || payload.items || [];

      const { categoryNameById, subcategoryNameById } = await apiService.getCategoryMaps();

      const items = rawItems.map((item: any) =>
        apiService.normalizeProductTemplate(item, categoryNameById, subcategoryNameById)
      );

      const search = params?.search?.trim().toLowerCase();
      const filteredItems = search
        ? items.filter((item: BaseProduct) => item.name.toLowerCase().includes(search))
        : items;

      return {
        success: true,
        data: filteredItems,
        pagination: {
          page: payload.page ?? 1,
          limit: dataBlock.limit ?? payload.limit ?? filteredItems.length ?? 0,
          total: dataBlock.total ?? payload.total ?? filteredItems.length ?? 0,
          pages: dataBlock.total_pages ?? payload.total_pages ?? 1,
        },
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Create Maxalla Product
   * POST /api/v1/local-shops/me/products
   */
  async createMaxallaProduct(
    token: string,
    data: CreateMaxallaProductRequest
  ): Promise<ApiResponse<MaxallaProduct>> {
    try {
      const response = await fetchApiWithAuth<any>(
        '/api/v1/local-shops/me/products',
        token,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      const payload = (response as any).data || response;
      return {
        ...response,
        data: apiService.normalizeLocalShopProduct(payload),
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get All Maxalla Products
   * GET /api/v1/local-shops/me/products
   */
  async getMaxallaProducts(
    token: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<MaxallaProduct>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(params?.page ?? 1));
      queryParams.append('limit', String(params?.limit ?? 100));

      const queryString = queryParams.toString();
      const endpoint = `/api/v1/local-shops/me/products${queryString ? `?${queryString}` : ''}`;
      const response = await fetchApiWithAuth<any>(endpoint, token, {
        method: 'GET',
      });
      const payload = response as any;
      const dataBlock = payload.data || payload;
      const { categoryNameById, subcategoryNameById } = await apiService.getCategoryMaps();
      const items = (dataBlock.items || []).map((item: any) =>
        apiService.normalizeLocalShopProduct(item, categoryNameById, subcategoryNameById)
      );
      return {
        success: true,
        data: items,
        pagination: {
          page: dataBlock.page ?? 1,
          limit: dataBlock.limit ?? items.length ?? 0,
          total: dataBlock.total ?? items.length ?? 0,
          pages: dataBlock.total_pages ?? 1,
        },
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Maxalla Product by ID
   * GET /api/v1/local-shops/me/products/:id
   */
  async getMaxallaProductById(
    token: string,
    id: string
  ): Promise<ApiResponse<MaxallaProduct>> {
    try {
      const response = await fetchApiWithAuth<any>(
        `/api/v1/local-shops/me/products/${id}`,
        token,
        {
          method: 'GET',
        }
      );
      const payload = (response as any).data || response;
      return {
        ...response,
        data: apiService.normalizeLocalShopProduct(payload),
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update Maxalla Product
   * PUT /api/v1/local-shops/me/products/:id
   */
  async updateMaxallaProduct(
    token: string,
    id: string,
    data: UpdateMaxallaProductRequest
  ): Promise<ApiResponse<MaxallaProduct>> {
    try {
      const response = await fetchApiWithAuth<any>(
        `/api/v1/local-shops/me/products/${id}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      const payload = (response as any).data || response;
      return {
        ...response,
        data: apiService.normalizeLocalShopProduct(payload),
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete Maxalla Product
   * DELETE /api/v1/local-shops/me/products/:id
   */
  async deleteMaxallaProduct(
    token: string,
    id: string
  ): Promise<ApiResponse> {
    try {
      return await fetchApiWithAuth(
        `/api/v1/local-shops/me/products/${id}`,
        token,
        {
          method: 'DELETE',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Orders
   * GET /api/maxalla-contragents/orders
   */
  async getOrders(
    token: string,
    params?: {
      status?: 'pending' | 'approved' | 'cancelled';
      page?: number;
      limit?: number;
    }
  ): Promise<OrderPaginatedResponse<Order>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = `/api/v1/local-shops/me/orders${queryString ? `?${queryString}` : ''}`;
      const response = await fetchApiWithAuth<any>(endpoint, token, {
        method: 'GET',
      });
      const payload = response as any;
      const dataBlock = payload.data || payload;
      const items = (dataBlock.items || []).map((item: any) => apiService.normalizeLocalShopOrder(item));
      return {
        success: true,
        count: items.length,
        total: dataBlock.total ?? items.length,
        page: dataBlock.page ?? 1,
        limit: dataBlock.limit ?? items.length,
        totalPages: dataBlock.total_pages ?? 1,
        data: items,
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Order by ID
   * GET /api/maxalla-contragents/orders/:id
   */
  async getOrderById(
    token: string,
    orderId: string
  ): Promise<ApiResponse<Order>> {
    try {
      const response = await fetchApiWithAuth<any>(
        `/api/v1/local-shops/me/orders/${orderId}`,
        token,
        {
          method: 'GET',
        }
      );
      const payload = (response as any).data || response;
      return {
        ...response,
        data: apiService.normalizeLocalShopOrder(payload),
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Respond to Order Request (Accept or Reject)
   * POST /api/maxalla-contragents/orders/:orderId/respond
   */
  async respondToOrderRequest(
    token: string,
    orderId: string,
    response: 'accepted' | 'rejected'
  ): Promise<ApiResponse<RespondToOrderRequestResponse>> {
    try {
      const endpoint =
        response === 'accepted'
          ? `/api/v1/local-shops/me/orders/${orderId}/approve`
          : `/api/v1/local-shops/me/orders/${orderId}/cancel`;
      return await fetchApiWithAuth<RespondToOrderRequestResponse>(
        endpoint,
        token,
        {
          method: 'PATCH',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Send Order to Delivery Provider
   * POST /api/maxalla-contragents/orders/:orderId/send-to-delivery-provider
   */
  async sendOrderToDeliveryProvider(
    token: string,
    orderId: string,
    data: SendOrderToDeliveryProviderRequest
  ): Promise<ApiResponse<SendOrderToDeliveryProviderResponse>> {
    try {
      return await fetchApiWithAuth<SendOrderToDeliveryProviderResponse>(
        `/api/v1/local-shops/me/orders/${orderId}/assign-courier`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({ courier_id: Number((data as any).deliveryProviderId) }),
        }
      );
    } catch (error: any) {
      throw error;
    }
  },
  async acceptOrderPayment(
    token: string,
    orderId: string
  ): Promise<ApiResponse> {
    try {
      return await fetchApiWithAuth(
        `/api/v1/local-shops/me/orders/${orderId}/accept-payment`,
        token,
        {
          method: 'PATCH',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },
  async getOrdersAnalytics(
    token: string,
    params?: {
      from?: string;
      to?: string;
    }
  ): Promise<ApiResponse<OrderAnalytics>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.from) queryParams.append('from', params.from);
      if (params?.to) queryParams.append('to', params.to);
      const queryString = queryParams.toString();
      return await fetchApiWithAuth<OrderAnalytics>(
        `/api/v1/local-shops/me/orders/analytics${queryString ? `?${queryString}` : ''}`,
        token,
        {
          method: 'GET',
        }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * GET /api/v1/local-shops/me/notifications
   */
  async getNotifications(
    token: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiResponse<LocalShopNotificationsListData>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    try {
      return await fetchApiWithAuth<LocalShopNotificationsListData>(
        `${LOCAL_SHOPS_ME_BASE_PATH}/notifications?${qs}`,
        token,
        { method: 'GET' }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * GET /api/v1/local-shops/me/notifications/unread-count
   */
  async getNotificationsUnreadCount(
    token: string
  ): Promise<ApiResponse<{ unread_count: number }>> {
    try {
      return await fetchApiWithAuth<{ unread_count: number }>(
        `${LOCAL_SHOPS_ME_BASE_PATH}/notifications/unread-count`,
        token,
        { method: 'GET' }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * PATCH /api/v1/local-shops/me/notifications/:id/read
   */
  async markNotificationRead(
    token: string,
    id: string | number
  ): Promise<ApiResponse> {
    try {
      return await fetchApiWithAuth(
        `${LOCAL_SHOPS_ME_BASE_PATH}/notifications/${id}/read`,
        token,
        { method: 'PATCH' }
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * PATCH /api/v1/local-shops/me/notifications/read-all
   */
  async markAllNotificationsRead(token: string): Promise<ApiResponse> {
    try {
      return await fetchApiWithAuth(
        `${LOCAL_SHOPS_ME_BASE_PATH}/notifications/read-all`,
        token,
        { method: 'PATCH' }
      );
    } catch (error: any) {
      throw error;
    }
  },
};
