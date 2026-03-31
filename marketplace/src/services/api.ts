import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  User,
  Product,
  Address,
  Region,
  District,
  MFY,
  Category,
  Subcategory,
  UnifiedSearchResponse,
  ContragentsListResponse,
  ContragentBrowseItem,
  CreateOrderPayload,
  MarketplaceOrder,
  MarketplaceOrderItemLine,
  OrdersListResult,
} from '../types';
import { normalizeMarketplaceProduct } from './normalizeProduct';

// Mock Data
export const MOCK_REGIONS: Region[] = [
  { id: 1, name: 'Toshkent shahri' },
  { id: 2, name: 'Toshkent viloyati' },
  { id: 3, name: 'Samarqand viloyati' },
  { id: 4, name: 'Farg\'ona viloyati' },
  { id: 5, name: 'Andijon viloyati' },
];

export const MOCK_DISTRICTS: District[] = [
  { id: 10, region_id: 1, name: 'Yunusobod tumani' },
  { id: 11, region_id: 1, name: 'Chilonzor tumani' },
  { id: 12, region_id: 1, name: 'Mirzo Ulug\'bek tumani' },
  { id: 20, region_id: 2, name: 'Zangiota tumani' },
  { id: 21, region_id: 2, name: 'Qibray tumani' },
];

export const MOCK_MFYS: MFY[] = [
  { id: 100, district_id: 10, name: 'Minor MFY' },
  { id: 101, district_id: 10, name: 'Bodomzor MFY' },
  { id: 110, district_id: 11, name: 'Oqtepa MFY' },
  { id: 111, district_id: 11, name: 'Qatortol MFY' },
];

// Mock Data - Categories / Subcategories
export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Elektronika', status: 'active' },
  { id: 2, name: 'Aksessuarlar', status: 'active' },
];

export const MOCK_SUBCATEGORIES: Subcategory[] = [
  { id: 11, parent_id: 1, name: 'Telefonlar', status: 'active' },
  { id: 12, parent_id: 1, name: 'Noutbuklar', status: 'active' },
  { id: 21, parent_id: 2, name: 'Quloqchinlar', status: 'active' },
];

const API_BASE_CANDIDATES =
  Platform.OS === 'web'
    ? ['http://localhost:8081/api/v1', 'http://192.168.1.6:8081/api/v1', '/api/v1']
    : ['http://192.168.1.6:8081/api/v1', 'http://10.0.2.2:8081/api/v1'];

/** Korzinka `product_id` uchun musbat butun son (aks holda `null`). */
export function parsePositiveProductId(raw: string | number): number | null {
  const s = String(raw).trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 1) return null;
  const id = Math.trunc(n);
  return id >= 1 ? id : null;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type AuthFailureHandler = () => void;

let authFailureHandler: AuthFailureHandler | null = null;

export function setAuthFailureHandler(handler: AuthFailureHandler | null) {
  authFailureHandler = handler;
}

async function getMarketplaceToken(): Promise<string | null> {
  /** Brauzerda AsyncStorage ba'zan localStorage bilan sinxron bo‘lmasligi mumkin — token yo‘qolmasligi uchun avvalo localStorage. */
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const ls = localStorage.getItem('token');
    if (ls) return ls;
  }
  return AsyncStorage.getItem('token');
}

async function clearMarketplaceToken() {
  await AsyncStorage.removeItem('token');
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem('token');
  }
}

async function request<T>(path: string, method: HttpMethod = 'GET', body?: unknown, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = await getMarketplaceToken();
    if (!token) {
      throw new Error("Savat uchun kirish kerak. Iltimos, avval tizimga kiring yoki sahifani yangilang.");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response | null = null;
  let networkError: unknown = null;
  for (const base of API_BASE_CANDIDATES) {
    try {
      res = await fetch(`${base}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      break;
    } catch (e) {
      networkError = e;
    }
  }

  if (!res) {
    throw new Error((networkError as Error | undefined)?.message || 'Network xatoligi');
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new Error(
        res.ok
          ? 'Server javobi JSON emas — backend ishlayotganini va api.ts dagi API_BASE manzillarini tekshiring.'
          : `Server xatoligi (${res.status})`
      );
    }
  }

  if (!res.ok) {
    if (auth && (res.status === 401 || res.status === 403)) {
      await clearMarketplaceToken();
      authFailureHandler?.();
    }
    const errBody = data as { message?: string; detail?: string } | null;
    const message = errBody?.message || errBody?.detail || 'Server xatoligi';
    throw new Error(typeof message === 'string' ? message : 'Server xatoligi');
  }

  return data as T;
}

function extractArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function unwrapData<T = any>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}

function extractProfile(payload: any): User | undefined {
  if (!payload) return undefined;
  const data = unwrapData(payload);
  return data?.profile || data?.user || payload?.profile || payload?.user;
}

type AuthEntryResponse = {
  flow: 'login' | 'register';
  profile?: User;
};

type EntryVerifyResponse = {
  flow?: 'login' | 'register';
  token?: string;
  status?: string;
  next_step?: string;
};

type RegisterPayload = {
  phone: string;
  first_name: string;
  last_name: string;
  gender: 'erkak' | 'ayol';
  region_id: number;
  district_id: number;
  mfy_id: number;
  birth_date: string;
};

type UpdateProfilePayload = {
  first_name: string;
  last_name: string;
  gender: 'erkak' | 'ayol';
  region_id: number;
  district_id: number;
  mfy_id: number;
  birth_date: string;
};

type AvatarPayload = {
  avatar: string;
};

type AvatarResponse = {
  has_avatar: boolean;
  avatar: string;
};

type DeliveryAreaPayload = {
  name: string;
  region_id: number;
  district_id: number;
  mfy_id: number;
  is_default?: boolean;
};

/** `/marketplace/me/cart` javobi — qatorlar + mahsulot (`quantity` — qatordagi dona, `availableStock` — ombor) */
export type MarketplaceCartItemRow = Omit<Product, 'quantity'> & {
  quantity: number;
  availableStock: number;
  /** `PUT/DELETE .../cart/items/{id}` — qator `id` si, mahsulot `id` emas */
  cartLineId: number;
};

/**
 * Backend tipik javob: `{ "message": "...", "data": { "items": [...], "total_lines": n } }`
 * (POST/PUT/GET korzinka — bir xil `data` tuzilmasi).
 */
export type MarketplaceCartLineApi = {
  id: number;
  quantity: number;
  product: Record<string, unknown>;
};

export type MarketplaceCartDataApi = {
  items: MarketplaceCartLineApi[];
  total_lines: number;
};

function cartPayloadToDataBlock(payload: unknown): MarketplaceCartDataApi | null {
  if (payload == null || typeof payload !== 'object') return null;
  const first = unwrapData<any>(payload);
  if (first && typeof first === 'object' && Array.isArray(first.items)) {
    return first as MarketplaceCartDataApi;
  }
  /** Juda kam uchraydigan: `data` ichida yana `data` */
  if (first?.data && typeof first.data === 'object' && Array.isArray(first.data.items)) {
    return first.data as MarketplaceCartDataApi;
  }
  /** Javobda `data` to'g'ridan-to'g'ri qatorlar massivi */
  if (Array.isArray(first)) {
    return { items: first as MarketplaceCartLineApi[], total_lines: first.length };
  }
  return null;
}

function parseMarketplaceCartResponse(raw: unknown): MarketplaceCartItemRow[] {
  const block = cartPayloadToDataBlock(raw);
  const lines = block?.items ?? [];
  const out: MarketplaceCartItemRow[] = [];
  for (const row of lines) {
    const lineId = Number((row as any)?.id ?? (row as any)?.line_id ?? (row as any)?.cart_item_id);
    if (!Number.isFinite(lineId) || lineId < 1) continue;
    const product = normalizeMarketplaceProduct((row as any)?.product ?? row ?? {});
    const lineQty = Number(row?.quantity ?? 1);
    const stock = Number((row as any)?.product?.quantity ?? product.quantity ?? 0);
    out.push({
      ...product,
      quantity: lineQty,
      availableStock: stock,
      cartLineId: lineId,
    });
  }
  return out;
}

function normalizeAddress(payload: any): Address {
  return {
    id: payload?.id,
    name: payload?.name || payload?.description || 'Hudud',
    description: payload?.description,
    region_id: Number(payload?.region_id),
    district_id: Number(payload?.district_id),
    mfy_id: Number(payload?.mfy_id),
    is_default: !!payload?.is_default,
    created_at: payload?.created_at,
    updated_at: payload?.updated_at,
  };
}

function pickOrderLineImageUrl(row: any): string | undefined {
  const pick = (v: unknown) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s || undefined;
  };
  const fromProduct = () => {
    const p = row?.product;
    if (!p || typeof p !== 'object') return undefined;
    if (Array.isArray(p.images) && p.images[0]) return pick(p.images[0]);
    return pick(p.image);
  };
  return (
    pick(row?.image_url) ??
    pick(row?.thumbnail_url) ??
    pick(row?.image) ??
    (Array.isArray(row?.images) && row.images[0] ? pick(row.images[0]) : undefined) ??
    fromProduct()
  );
}

function normalizeOrderItemLine(row: any): MarketplaceOrderItemLine {
  const p = row?.product;
  const rawCode = row?.product_code ?? p?.product_code;
  const codeNum = rawCode != null ? Number(rawCode) : NaN;
  const rawUnitSize = row?.unit_size ?? p?.unit_size;
  const unitSizeStr = rawUnitSize != null && String(rawUnitSize).trim() !== '' ? String(rawUnitSize).trim() : undefined;
  const nameFromRow = String(row?.product_name ?? '').trim();
  const nameFromProduct = p && typeof p === 'object' ? String(p.name ?? '').trim() : '';
  return {
    product_id: Number(row?.product_id ?? p?.id ?? p?.product_id ?? 0),
    contragent_id: Number(row?.contragent_id ?? p?.contragent_id ?? 0),
    product_name: nameFromRow || nameFromProduct,
    unit_price: Number(row?.unit_price ?? 0),
    quantity: Number(row?.quantity ?? 0),
    unit: String(row?.unit ?? p?.unit ?? 'dona'),
    unit_size: unitSizeStr,
    line_total: Number(row?.line_total ?? 0),
    image_url: pickOrderLineImageUrl(row),
    product_code: Number.isFinite(codeNum) && codeNum > 0 ? codeNum : undefined,
  };
}

function normalizeMarketplaceOrder(raw: any): MarketplaceOrder {
  const row = raw && typeof raw === 'object' && 'id' in raw ? raw : unwrapData<any>(raw);
  const addr = row?.address ?? {};
  const statusStr = String(row?.status ?? 'pending');
  const canCancel =
    typeof row?.can_cancel === 'boolean' ? row.can_cancel : statusStr === 'pending';
  const rawRoadmap = row?.roadmap && typeof row.roadmap === 'object' ? row.roadmap : undefined;
  const roadmap =
    rawRoadmap == null
      ? undefined
      : {
          ...rawRoadmap,
          current_stage:
            rawRoadmap.current_stage != null ? String(rawRoadmap.current_stage) : undefined,
        };
  return {
    id: Number(row?.id),
    status: statusStr,
    can_cancel: canCancel,
    total_amount: Number(row?.total_amount ?? 0),
    extra_phone: row?.extra_phone ? String(row.extra_phone) : undefined,
    address_note: row?.address_note ? String(row.address_note) : undefined,
    address: {
      type: String(addr?.type ?? 'default'),
      delivery_area_id: addr?.delivery_area_id != null ? Number(addr.delivery_area_id) : undefined,
      area_name: addr?.area_name != null ? String(addr.area_name) : undefined,
      region_id: addr?.region_id != null ? Number(addr.region_id) : undefined,
      district_id: addr?.district_id != null ? Number(addr.district_id) : undefined,
      mfy_id: addr?.mfy_id != null ? Number(addr.mfy_id) : undefined,
      custom_text: addr?.custom_text != null ? String(addr.custom_text) : undefined,
    },
    roadmap,
    items: Array.isArray(row?.items) ? row.items.map(normalizeOrderItemLine) : [],
    created_at: String(row?.created_at ?? ''),
    updated_at: String(row?.updated_at ?? ''),
  };
}

// API Service
export const api = {
  // Auth
  auth: {
    entry: async (phone: string): Promise<{ flow: 'login' | 'register'; profile?: User }> => {
      const raw = await request<any>('/marketplace/auth/entry', 'POST', { phone });
      const data = unwrapData<any>(raw);
      const profile = extractProfile(raw);
      const flow = (data?.flow || (profile ? 'login' : 'register')) as 'login' | 'register';
      return {
        flow,
        profile,
      };
    },
    phoneCheck: async (phone: string): Promise<{ exists: boolean; profile?: User }> => {
      const raw = await request<any>('/marketplace/auth/phone/check', 'POST', { phone });
      const data = unwrapData<any>(raw);
      const profile = extractProfile(raw);
      const exists = typeof data?.exists === 'boolean' ? data.exists : !!profile;
      return { exists, profile };
    },
    entryVerify: async (phone: string, code: string): Promise<EntryVerifyResponse> => {
      const raw = await request<any>('/marketplace/auth/entry/verify', 'POST', { phone, code });
      const data = unwrapData<any>(raw);
      const token = data?.token || data?.access_token;
      const inferredFlow =
        data?.flow ||
        (data?.needs_registration || data?.status === 'register_needed' || data?.next_step === 'register'
          ? 'register'
          : undefined) ||
        (token ? 'login' : undefined);
      return {
        flow: inferredFlow,
        token,
        status: data?.status,
        next_step: data?.next_step,
      };
    },
    sendCode: async (phone: string, purpose: 'login' | 'register') =>
      request('/marketplace/auth/send-code', 'POST', { phone, purpose }),
    verifyCode: async (phone: string, code: string, purpose: 'login' | 'register') =>
      request('/marketplace/auth/verify-code', 'POST', { phone, code, purpose }),
    resendCode: async (phone: string, purpose: 'login' | 'register') =>
      request('/marketplace/auth/resend-code', 'POST', { phone, purpose }),
    login: async (phone: string): Promise<{ token?: string; access_token?: string }> => {
      const raw = await request<any>('/marketplace/auth/login', 'POST', { phone });
      const data = unwrapData<any>(raw);
      return { token: data?.token || data?.access_token, access_token: data?.access_token };
    },
    register: async (data: RegisterPayload): Promise<{ token: string }> => {
      const raw = await request<any>('/marketplace/auth/register', 'POST', data);
      const res = unwrapData<any>(raw);
      return { token: res?.token || res?.access_token };
    },
    getProfile: async (): Promise<User> => {
      const raw = await request<any>('/marketplace/me/profile', 'GET', undefined, true);
      return unwrapData<User>(raw);
    },
  },

  profile: {
    get: async (): Promise<User> => {
      const raw = await request<any>('/marketplace/me/profile', 'GET', undefined, true);
      return unwrapData<User>(raw);
    },
    update: async (payload: UpdateProfilePayload): Promise<User> => {
      const raw = await request<any>('/marketplace/me/profile', 'PUT', payload, true);
      return unwrapData<User>(raw);
    },
    getAvatar: async (): Promise<AvatarResponse> => {
      const raw = await request<any>('/marketplace/me/avatar', 'GET', undefined, true);
      const data = unwrapData<any>(raw);
      return {
        has_avatar: !!data?.has_avatar,
        avatar: typeof data?.avatar === 'string' ? data.avatar : '',
      };
    },
    updateAvatar: async (payload: AvatarPayload): Promise<AvatarResponse> => {
      const raw = await request<any>('/marketplace/me/avatar', 'PUT', payload, true);
      const data = unwrapData<any>(raw);
      return {
        has_avatar: !!data?.has_avatar,
        avatar: typeof data?.avatar === 'string' ? data.avatar : payload.avatar,
      };
    },
    deleteAvatar: async (): Promise<boolean> => {
      await request<any>('/marketplace/me/avatar', 'DELETE', undefined, true);
      return true;
    },
  },

  // Regions
  regions: {
    getRegions: async () => {
      try {
        const raw = await request<any>('/noauth/regions');
        const data = unwrapData<any>(raw);
        const list = extractArray<Region>(data);
        return list.length ? list : MOCK_REGIONS;
      } catch {
        return MOCK_REGIONS;
      }
    },
    getDistricts: async (regionId?: number) => {
      try {
        const query = regionId ? `?region_id=${regionId}` : '';
        const raw = await request<any>(`/noauth/districts${query}`);
        const data = unwrapData<any>(raw);
        const list = extractArray<District>(data);
        if (!list.length) return regionId ? MOCK_DISTRICTS.filter((d) => d.region_id === regionId) : MOCK_DISTRICTS;
        return list;
      } catch {
        return regionId ? MOCK_DISTRICTS.filter((d) => d.region_id === regionId) : MOCK_DISTRICTS;
      }
    },
    getMFYs: async (districtId?: number) => {
      try {
        const query = districtId ? `?district_id=${districtId}` : '';
        const raw = await request<any>(`/noauth/mfys${query}`);
        const data = unwrapData<any>(raw);
        const list = extractArray<MFY>(data);
        if (!list.length) return districtId ? MOCK_MFYS.filter((m) => m.district_id === districtId) : MOCK_MFYS;
        return list;
      } catch {
        return districtId ? MOCK_MFYS.filter((m) => m.district_id === districtId) : MOCK_MFYS;
      }
    },
  },

  // Products
  products: {
    /** Jami mahsulot soni (API `total` yoki ro‘yxat uzunligi, min-so‘rov uchun limit=1). */
    count: async (params?: { category_id?: number; subcategory_id?: number }): Promise<number> => {
      try {
        const qs = [
          'page=1',
          'limit=1',
          params?.category_id != null ? `category_id=${params.category_id}` : null,
          params?.subcategory_id != null ? `subcategory_id=${params.subcategory_id}` : null,
        ]
          .filter(Boolean)
          .join('&');
        const raw = await request<any>(`/noauth/products?${qs}`);
        const data = unwrapData<any>(raw);
        const total = Number(data?.total);
        if (Number.isFinite(total) && total >= 0) return total;
        return extractArray<Product>(data).length;
      } catch {
        return 0;
      }
    },
    list: async (params?: { q?: string; category_id?: number; subcategory_id?: number; page?: number; limit?: number }) => {
      try {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 50;
        const qs = [
          `page=${page}`,
          `limit=${limit}`,
          params?.q ? `q=${encodeURIComponent(params.q)}` : null,
          params?.category_id ? `category_id=${params.category_id}` : null,
          params?.subcategory_id ? `subcategory_id=${params.subcategory_id}` : null,
        ]
          .filter(Boolean)
          .join('&');

        const raw = await request<any>(`/noauth/products?${qs}`);
        const data = unwrapData<any>(raw);
        const list = extractArray<any>(data).map((row) => normalizeMarketplaceProduct(row));
        return list;
      } catch {
        return [];
      }
    },
    get: async (id: string) => {
      try {
        const raw = await request<any>(`/noauth/products/${id}`);
        const data = unwrapData<any>(raw);
        return (data?.data ? data.data : data) as Product;
      } catch {
        return undefined;
      }
    },
  },

  // Categories
  categories: {
    list: async (params?: { page?: number; limit?: number }) => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 10;
      try {
        const raw = await request<any>(`/noauth/categories?page=${page}&limit=${limit}`);
        const data = unwrapData<any>(raw);
        const total = Number(data?.total);
        const list = extractArray<Category>(data).filter((c) => (c.status ?? 'inactive') === 'active');

        // total bo'lsa limitni totalga tenglab qayta so'raymiz (1 sahifada hammasi kelsin)
        if (total && total > limit) {
          const rawAll = await request<any>(`/noauth/categories?page=1&limit=${total}`);
          const dataAll = unwrapData<any>(rawAll);
          const listAll = extractArray<Category>(dataAll).filter((c) => (c.status ?? 'inactive') === 'active');
          return listAll.length ? listAll : list;
        }

        return list.length ? list : MOCK_CATEGORIES;
      } catch {
        return MOCK_CATEGORIES.filter((c) => (c.status ?? 'inactive') === 'active');
      }
    },
    getOne: async (id: number) => {
      try {
        const raw = await request<any>(`/noauth/categories/${id}`);
        const data = unwrapData<any>(raw);
        const category = (data?.data ? data.data : data) as Category;
        if (category?.id) return category;
      } catch {
        // ignore
      }
      return MOCK_CATEGORIES.find((c) => c.id === id) || ({} as Category);
    },
  },

  // Subcategories
  subcategories: {
    list: async (params?: { page?: number; limit?: number; parent_id?: number }) => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 10;
      const parent = params?.parent_id;
      try {
        const query = parent ? `&parent_id=${parent}` : '';
        const raw = await request<any>(`/noauth/subcategories?page=${page}&limit=${limit}${query}`);
        const data = unwrapData<any>(raw);
        const total = Number(data?.total);
        const list = extractArray<Subcategory>(data).filter((s) => (s.status ?? 'inactive') === 'active');

        if (total && total > limit) {
          const rawAll = await request<any>(`/noauth/subcategories?page=1&limit=${total}${query}`);
          const dataAll = unwrapData<any>(rawAll);
          const listAll = extractArray<Subcategory>(dataAll).filter((s) => (s.status ?? 'inactive') === 'active');
          return listAll.length ? listAll : list;
        }

        return list.length
          ? list
          : parent
            ? MOCK_SUBCATEGORIES.filter((s) => s.parent_id === parent && (s.status ?? 'inactive') === 'active')
            : MOCK_SUBCATEGORIES;
      } catch {
        const base = parent ? MOCK_SUBCATEGORIES.filter((s) => s.parent_id === parent) : MOCK_SUBCATEGORIES;
        return base.filter((s) => (s.status ?? 'inactive') === 'active');
      }
    },
    getOne: async (id: number) => {
      try {
        const raw = await request<any>(`/noauth/subcategories/${id}`);
        const data = unwrapData<any>(raw);
        const sub = (data?.data ? data.data : data) as Subcategory;
        if (sub?.id) return sub;
      } catch {
        // ignore
      }
      return MOCK_SUBCATEGORIES.find((s) => s.id === id) || ({} as Subcategory);
    },
  },

  // Unified search (mahsulotlar, kategoriyalar, subkategoriyalar, kontragentlar)
  search: {
    unified: async (params: {
      q: string;
      limit_per_type?: number;
      types?: string;
    }): Promise<UnifiedSearchResponse> => {
      const limit = Math.min(50, Math.max(1, params.limit_per_type ?? 10));
      const qs = [
        `q=${encodeURIComponent(params.q ?? '')}`,
        `limit_per_type=${limit}`,
        params.types ? `types=${encodeURIComponent(params.types)}` : null,
      ]
        .filter(Boolean)
        .join('&');
      try {
        let raw: any;
        try {
          raw = await request<any>(`/noauth/search?${qs}`);
        } catch {
          raw = await request<any>(`/marketplace/search?${qs}`);
        }
        const data = unwrapData<any>(raw);
        const productsRaw = Array.isArray(data?.products) ? data.products : [];
        const products = productsRaw.map(normalizeMarketplaceProduct);
        return {
          query: String(data?.query ?? params.q ?? ''),
          limit_per_type: Number(data?.limit_per_type ?? limit),
          products,
          categories: Array.isArray(data?.categories) ? data.categories : [],
          subcategories: Array.isArray(data?.subcategories) ? data.subcategories : [],
          contragents: Array.isArray(data?.contragents) ? data.contragents : [],
        };
      } catch {
        return {
          query: params.q ?? '',
          limit_per_type: limit,
          products: [],
          categories: [],
          subcategories: [],
          contragents: [],
        };
      }
    },
  },

  contragents: {
    list: async (params?: {
      page?: number;
      limit?: number;
      q?: string;
      include?: string;
      nested_limit?: number;
    }): Promise<ContragentsListResponse> => {
      const page = params?.page ?? 1;
      const limit = Math.min(100, Math.max(1, params?.limit ?? 10));
      const qs = [
        `page=${page}`,
        `limit=${limit}`,
        params?.q ? `q=${encodeURIComponent(params.q)}` : null,
        params?.include ? `include=${encodeURIComponent(params.include)}` : null,
        params?.nested_limit != null ? `nested_limit=${Math.min(100, params.nested_limit)}` : null,
      ]
        .filter(Boolean)
        .join('&');
      try {
        const raw = await request<any>(`/noauth/contragents?${qs}`);
        const data = unwrapData<any>(raw);
        const items = (Array.isArray(data?.items) ? data.items : extractArray<any>(data)).map(
          (row: any): ContragentBrowseItem => ({
            ...row,
            products: Array.isArray(row?.products) ? row.products.map(normalizeMarketplaceProduct) : undefined,
          })
        );
        return {
          items,
          total: Number(data?.total ?? items.length),
          page: Number(data?.page ?? page),
          limit: Number(data?.limit ?? limit),
          total_pages: Number(data?.total_pages ?? 1),
        };
      } catch {
        return { items: [], total: 0, page: 1, limit, total_pages: 0 };
      }
    },
  },

  /** Faqat marketplace JWT (`Authorization: Bearer`) bilan */
  cart: {
    get: async (): Promise<MarketplaceCartItemRow[]> => {
      const raw = await request<any>('/marketplace/me/cart', 'GET', undefined, true);
      return parseMarketplaceCartResponse(raw);
    },
    addItem: async (productId: number, quantity: number): Promise<MarketplaceCartItemRow[]> => {
      const raw = await request<any>('/marketplace/me/cart/items', 'POST', { product_id: productId, quantity }, true);
      return parseMarketplaceCartResponse(raw);
    },
    setLineQuantity: async (lineId: number | string, quantity: number): Promise<MarketplaceCartItemRow[]> => {
      const raw = await request<any>(`/marketplace/me/cart/items/${lineId}`, 'PUT', { quantity }, true);
      return parseMarketplaceCartResponse(raw);
    },
    removeLine: async (lineId: number | string): Promise<MarketplaceCartItemRow[]> => {
      const raw = await request<any>(`/marketplace/me/cart/items/${lineId}`, 'DELETE', undefined, true);
      return parseMarketplaceCartResponse(raw);
    },
    clear: async (): Promise<MarketplaceCartItemRow[]> => {
      const raw = await request<any>('/marketplace/me/cart', 'DELETE', undefined, true);
      return parseMarketplaceCartResponse(raw);
    },
  },

  orders: {
    create: async (payload: CreateOrderPayload): Promise<MarketplaceOrder> => {
      const raw = await request<any>('/marketplace/me/orders', 'POST', payload, true);
      return normalizeMarketplaceOrder(unwrapData<any>(raw));
    },
    list: async (params?: { page?: number; limit?: number }): Promise<OrdersListResult> => {
      const page = params?.page ?? 1;
      const limit = Math.min(params?.limit ?? 10, 100);
      const raw = await request<any>(`/marketplace/me/orders?page=${page}&limit=${limit}`, 'GET', undefined, true);
      const data = unwrapData<any>(raw);
      const items = Array.isArray(data?.items) ? data.items.map(normalizeMarketplaceOrder) : [];
      return {
        items,
        total: Number(data?.total ?? items.length),
        page: Number(data?.page ?? page),
        limit: Number(data?.limit ?? limit),
        total_pages: Number(data?.total_pages ?? 1),
      };
    },
    get: async (id: string | number): Promise<MarketplaceOrder> => {
      const raw = await request<any>(`/marketplace/me/orders/${id}`, 'GET', undefined, true);
      return normalizeMarketplaceOrder(unwrapData<any>(raw));
    },
    cancel: async (id: string | number): Promise<MarketplaceOrder> => {
      const raw = await request<any>(`/marketplace/me/orders/${id}/cancel`, 'PATCH', undefined, true);
      return normalizeMarketplaceOrder(unwrapData<any>(raw));
    },
  },

  // Addresses
  addresses: {
    list: async (): Promise<Address[]> => {
      try {
        const raw = await request<any>('/marketplace/me/delivery-areas', 'GET', undefined, true);
        const list = extractArray<any>(unwrapData(raw)).map(normalizeAddress);
        return list;
      } catch {
        return [
          {
            id: 'a1',
            name: 'Uy atrofi',
            description: 'Yunusobod 4-kvartal, 12-uy, 45-xonadon',
            region_id: 1,
            district_id: 10,
            mfy_id: 100,
            is_default: true,
          },
          {
            id: 'a2',
            name: 'Ish joyi',
            description: 'Chilonzor 2-kvartal, 5-uy',
            region_id: 1,
            district_id: 11,
            mfy_id: 110,
            is_default: false,
          },
        ];
      }
    },
    add: async (data: DeliveryAreaPayload): Promise<Address> => {
      const raw = await request<any>('/marketplace/me/delivery-areas', 'POST', data, true);
      return normalizeAddress(unwrapData(raw));
    },
    update: async (id: string | number, data: DeliveryAreaPayload): Promise<Address> => {
      const raw = await request<any>(`/marketplace/me/delivery-areas/${id}`, 'PUT', data, true);
      return normalizeAddress(unwrapData(raw));
    },
    delete: async (id: string | number): Promise<boolean> => {
      await request<any>(`/marketplace/me/delivery-areas/${id}`, 'DELETE', undefined, true);
      return true;
    },
    setDefault: async (id: string | number): Promise<boolean> => {
      await request<any>(`/marketplace/me/delivery-areas/${id}/set-default`, 'PATCH', {}, true);
      return true;
    },
  },
};
