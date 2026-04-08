import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  User,
  Product,
  LocalShopProduct,
  LocalShopCartItem,
  Address,
  Region,
  District,
  MFY,
  Category,
  Subcategory,
  UnifiedSearchResponse,
  ContragentsListResponse,
  ContragentBrowseItem,
  ContragentBanner,
  ActivityType,
  CommentTemplate,
  PartnerRequest,
  PartnerRequestPayload,
  CreateOrderPayload,
  MarketplaceOrder,
  MarketplaceOrderItemLine,
  OrderRatingItemPayload,
  ProductRatingsResponse,
  OrdersListResult,
  MarketplaceNotification,
  MarketplaceNotificationsListResult,
} from '../types';
import { normalizeLocalShopProduct, normalizeMarketplaceProduct } from './normalizeProduct';
import {
  PARTNER_PHONE_RE,
  PARTNER_INN_RE,
  PARTNER_MFO_RE,
  PARTNER_ACCOUNT_RE,
  normalizePartnerRequestPayload,
  validatePartnerRequestPayload,
} from '../lib/partnerRequestForm';
import { MARKETPLACE_API_BASE } from '../config/marketplaceApi';

export { buildMarketplaceNotificationsWsUrl } from '../config/marketplaceApi';

const API_BASE_CANDIDATES = [MARKETPLACE_API_BASE];

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

/** UI tomonidan auth talab qilinganda (masalan, guest savatga bosganda) chaqiriladi. */
export function requestAuthLogin() {
  authFailureHandler?.();
}

export async function getMarketplaceToken(): Promise<string | null> {
  /** Brauzerda AsyncStorage ba'zan localStorage bilan sinxron bo‘lmasligi mumkin — token yo‘qolmasligi uchun avvalo localStorage. */
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const ls = localStorage.getItem('token');
    if (ls) return ls;
  }
  return AsyncStorage.getItem('token');
}

/** Guest rejimda auth endpointlarini chaqirmaslik uchun. */
export async function hasMarketplaceSession(): Promise<boolean> {
  return !!(await getMarketplaceToken());
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
      // Sessiya yo'q bo'lsa UI darhol login oynasiga o'tishi kerak.
      authFailureHandler?.();
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

export type LocalShopCartLineApi = {
  id: number;
  quantity: number;
  local_shop_product: Record<string, unknown>;
};

export type LocalShopCartDataApi = {
  items: LocalShopCartLineApi[];
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

function localShopCartPayloadToDataBlock(payload: unknown): LocalShopCartDataApi | null {
  if (payload == null || typeof payload !== 'object') return null;
  const first = unwrapData<any>(payload);
  if (first && typeof first === 'object' && Array.isArray(first.items)) {
    return first as LocalShopCartDataApi;
  }
  if (first?.data && typeof first.data === 'object' && Array.isArray(first.data.items)) {
    return first.data as LocalShopCartDataApi;
  }
  if (Array.isArray(first)) {
    return { items: first as LocalShopCartLineApi[], total_lines: first.length };
  }
  return null;
}

function parseLocalShopCartResponse(raw: unknown): LocalShopCartItem[] {
  const block = localShopCartPayloadToDataBlock(raw);
  const lines = block?.items ?? [];
  const out: LocalShopCartItem[] = [];
  for (const row of lines) {
    const lineId = Number((row as any)?.id ?? (row as any)?.line_id ?? (row as any)?.cart_item_id);
    if (!Number.isFinite(lineId) || lineId < 1) continue;
    const productRaw =
      (row as any)?.local_shop_product ??
      (row as any)?.localShopProduct ??
      (row as any)?.product ??
      (row as any)?.item ??
      row ??
      {};
    const product = normalizeLocalShopProduct(productRaw);
    const lineQty = Number(row?.quantity ?? 1);
    const stock = Number(
      (productRaw as any)?.quantity ??
      (row as any)?.local_shop_product?.quantity ??
      (row as any)?.localShopProduct?.quantity ??
      product.quantity ??
      0
    );
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

function normalizePartnerRequest(payload: any): PartnerRequest {
  return {
    id: Number(payload?.id ?? 0),
    company_name: String(payload?.company_name ?? ''),
    inn: String(payload?.inn ?? ''),
    mfo: String(payload?.mfo ?? ''),
    account_number: String(payload?.account_number ?? ''),
    activity_type_id: Number(payload?.activity_type_id ?? 0),
    activity_type_name: payload?.activity_type_name ? String(payload.activity_type_name) : undefined,
    region_id: Number(payload?.region_id ?? 0),
    district_id: Number(payload?.district_id ?? 0),
    mfy_id: Number(payload?.mfy_id ?? 0),
    phone: String(payload?.phone ?? ''),
    status: payload?.status ? String(payload.status) : undefined,
    created_at: payload?.created_at ? String(payload.created_at) : undefined,
  };
}

function normalizeMarketplaceNotification(row: any): MarketplaceNotification {
  return {
    id: row?.id ?? '',
    title: String(row?.title ?? ''),
    message: String(row?.message ?? ''),
    type: String(row?.type ?? 'info'),
    target_type: String(row?.target_type ?? ''),
    is_read: !!row?.is_read,
    read_at: row?.read_at != null ? String(row.read_at) : null,
    created_at: String(row?.created_at ?? ''),
    updated_at: String(row?.updated_at ?? ''),
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
    order_item_id: Number(row?.order_item_id ?? row?.id ?? 0) || undefined,
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

function normalizeLocalShopOrderItemLine(row: any): MarketplaceOrderItemLine {
  const template = row?.template ?? row?.local_shop_product?.template ?? row?.localShopProduct?.template ?? {};
  const fromArray = (arr: unknown): string | undefined => {
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    const first = arr[0];
    return first != null ? String(first) : undefined;
  };
  const imageUrl =
    (row?.image_url != null ? String(row.image_url) : undefined) ??
    (row?.image != null ? String(row.image) : undefined) ??
    fromArray(row?.images) ??
    (row?.local_shop_product?.image != null ? String(row.local_shop_product.image) : undefined) ??
    fromArray(row?.local_shop_product?.images) ??
    (template?.image != null ? String(template.image) : undefined) ??
    fromArray(template?.images);
  const safeName =
    String(row?.product_name ?? '').trim() ||
    String(template?.name ?? '').trim() ||
    `Mahsulot #${row?.local_shop_product_id ?? row?.template_id ?? ''}`;

  return {
    order_item_id: Number(row?.order_item_id ?? row?.id ?? 0) || undefined,
    product_id: Number(row?.template_id ?? template?.id ?? 0),
    local_shop_product_id: Number(row?.local_shop_product_id ?? 0) || undefined,
    template_id: Number(row?.template_id ?? template?.id ?? 0) || undefined,
    contragent_id: Number(row?.local_shop_id ?? 0),
    product_name: safeName,
    unit_price: Number(row?.unit_price ?? 0),
    quantity: Number(row?.quantity ?? 0),
    unit: String(row?.unit ?? template?.unit ?? 'dona'),
    unit_size: row?.unit_size != null ? String(row.unit_size) : template?.unit_size != null ? String(template.unit_size) : undefined,
    line_total: Number(row?.line_total ?? 0),
    image_url: imageUrl,
    product_code: Number(row?.template_id ?? template?.id ?? 0) || undefined,
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

function normalizeLocalShopOrder(raw: any): MarketplaceOrder {
  const row = raw && typeof raw === 'object' && 'id' in raw ? raw : unwrapData<any>(raw);
  const addr = row?.address ?? {};
  const statusStr = String(row?.status ?? 'pending');
  const canCancel =
    typeof row?.can_cancel === 'boolean' ? row.can_cancel : statusStr === 'pending';
  return {
    id: Number(row?.id),
    market: 'mahalla',
    local_shop_id: row?.local_shop_id != null ? Number(row.local_shop_id) : undefined,
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
    roadmap: undefined,
    items: Array.isArray(row?.items) ? row.items.map(normalizeLocalShopOrderItemLine) : [],
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
        return extractArray<Region>(data);
      } catch {
        return [];
      }
    },
    getDistricts: async (regionId?: number) => {
      try {
        const query = regionId ? `?region_id=${regionId}` : '';
        const raw = await request<any>(`/noauth/districts${query}`);
        const data = unwrapData<any>(raw);
        return extractArray<District>(data);
      } catch {
        return [];
      }
    },
    getMFYs: async (districtId?: number) => {
      try {
        const query = districtId ? `?district_id=${districtId}` : '';
        const raw = await request<any>(`/noauth/mfys${query}`);
        const data = unwrapData<any>(raw);
        return extractArray<MFY>(data);
      } catch {
        return [];
      }
    },
  },

  activityTypes: {
    list: async (): Promise<ActivityType[]> => {
      try {
        const raw = await request<any>('/noauth/activity-types');
        const data = unwrapData<any>(raw);
        const list = extractArray<any>(data).map((row): ActivityType => ({
          id: Number(row?.id ?? 0),
          name: String(row?.name ?? ''),
        }));
        return list.filter((it) => it.id > 0 && it.name);
      } catch {
        return [];
      }
    },
  },

  commentTemplates: {
    list: async (): Promise<CommentTemplate[]> => {
      try {
        const raw = await request<any>('/noauth/comment-templates');
        const data = unwrapData<any>(raw);
        return extractArray<any>(data)
          .map((row): CommentTemplate => ({
            id: Number(row?.id ?? 0),
            comment: String(row?.comment ?? ''),
            sort_order: Number(row?.sort_order ?? 0) || undefined,
          }))
          .filter((it) => it.id > 0 && it.comment);
      } catch {
        return [];
      }
    },
  },

  productRatings: {
    get: async (productId: number, params?: { page?: number; limit?: number }): Promise<ProductRatingsResponse> => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 10;
      const raw = await request<any>(`/noauth/product-ratings?product_id=${productId}&page=${page}&limit=${limit}`);
      const data = unwrapData<any>(raw) ?? {};
      return {
        product_id: Number(data?.product_id ?? productId),
        average_score: Number(data?.average_score ?? 0),
        total_ratings: Number(data?.total_ratings ?? 0),
        score_breakdown: data?.score_breakdown && typeof data.score_breakdown === 'object' ? data.score_breakdown : {},
        items: Array.isArray(data?.items)
          ? data.items.map((row: any) => ({
              id: Number(row?.id ?? 0),
              order_id: Number(row?.order_id ?? 0),
              order_item_id: Number(row?.order_item_id ?? 0),
              score: Number(row?.score ?? 0),
              comment_template_id: Number(row?.comment_template_id ?? 0) || undefined,
              comment_template: row?.comment_template ? String(row.comment_template) : undefined,
              note: row?.note ? String(row.note) : undefined,
              created_at: row?.created_at ? String(row.created_at) : undefined,
            }))
          : [],
        page: Number(data?.page ?? page),
        limit: Number(data?.limit ?? limit),
        total_pages: Number(data?.total_pages ?? 1),
      };
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

        return list;
      } catch {
        return [];
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
      return {} as Category;
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

        return list;
      } catch {
        return [];
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
      return {} as Subcategory;
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

  localShopProducts: {
    list: async (params?: {
      page?: number;
      limit?: number;
      q?: string;
      district_id?: number;
      mfy_id?: number;
      local_shop_id?: number;
    }): Promise<LocalShopProduct[]> => {
      const page = params?.page ?? 1;
      const limit = Math.min(100, Math.max(1, params?.limit ?? 24));
      const qs = [
        `page=${page}`,
        `limit=${limit}`,
        params?.q ? `q=${encodeURIComponent(params.q)}` : null,
        params?.district_id != null ? `district_id=${params.district_id}` : null,
        params?.mfy_id != null ? `mfy_id=${params.mfy_id}` : null,
        params?.local_shop_id != null ? `local_shop_id=${params.local_shop_id}` : null,
      ]
        .filter(Boolean)
        .join('&');

      try {
        const raw = await request<any>(`/noauth/local-shop-products?${qs}`);
        const data = unwrapData<any>(raw);
        const items = Array.isArray(data?.items) ? data.items : extractArray<any>(data);
        return items.map(normalizeLocalShopProduct);
      } catch {
        return [];
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
    banners: async (): Promise<ContragentBanner[]> => {
      try {
        const raw = await request<any>('/noauth/contragent-banners');
        const data = unwrapData<any>(raw);
        const items = extractArray<any>(data);
        return items.map((row: any): ContragentBanner => ({
          id: Number(row?.id ?? 0),
          contragent_id: Number(row?.contragent_id ?? 0),
          contragent_name: String(row?.contragent_name ?? ''),
          contragent_logo: typeof row?.contragent_logo === 'string' ? row.contragent_logo : undefined,
          start_at: String(row?.start_at ?? ''),
          end_at: String(row?.end_at ?? ''),
        }));
      } catch {
        return [];
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

  localShopCart: {
    get: async (): Promise<LocalShopCartItem[]> => {
      const raw = await request<any>('/marketplace/me/local-shop-cart', 'GET', undefined, true);
      return parseLocalShopCartResponse(raw);
    },
    addItem: async (localShopProductId: number, quantity: number): Promise<LocalShopCartItem[]> => {
      const raw = await request<any>(
        '/marketplace/me/local-shop-cart/items',
        'POST',
        { local_shop_product_id: localShopProductId, quantity },
        true
      );
      return parseLocalShopCartResponse(raw);
    },
    setLineQuantity: async (lineId: number | string, quantity: number): Promise<LocalShopCartItem[]> => {
      const raw = await request<any>(`/marketplace/me/local-shop-cart/items/${lineId}`, 'PUT', { quantity }, true);
      return parseLocalShopCartResponse(raw);
    },
    removeLine: async (lineId: number | string): Promise<LocalShopCartItem[]> => {
      const raw = await request<any>(`/marketplace/me/local-shop-cart/items/${lineId}`, 'DELETE', undefined, true);
      return parseLocalShopCartResponse(raw);
    },
    clear: async (): Promise<LocalShopCartItem[]> => {
      const raw = await request<any>('/marketplace/me/local-shop-cart', 'DELETE', undefined, true);
      return parseLocalShopCartResponse(raw);
    },
  },

  localShopOrders: {
    create: async (payload: {
      local_shop_id: number;
      address: { type: 'default' } | { type: 'delivery_area'; delivery_area_id: number } | { type: 'extra'; text: string };
      extra_phone?: string;
      address_note?: string;
    }): Promise<MarketplaceOrder> => {
      const raw = await request<any>('/marketplace/me/local-shop-orders', 'POST', payload, true);
      return normalizeLocalShopOrder(unwrapData<any>(raw));
    },
    list: async (params?: { page?: number; limit?: number }): Promise<OrdersListResult> => {
      const page = params?.page ?? 1;
      const limit = Math.min(params?.limit ?? 10, 100);
      const raw = await request<any>(`/marketplace/me/local-shop-orders?page=${page}&limit=${limit}`, 'GET', undefined, true);
      const data = unwrapData<any>(raw);
      const items = Array.isArray(data?.items) ? data.items.map(normalizeLocalShopOrder) : [];
      return {
        items,
        total: Number(data?.total ?? items.length),
        page: Number(data?.page ?? page),
        limit: Number(data?.limit ?? limit),
        total_pages: Number(data?.total_pages ?? 1),
      };
    },
    get: async (id: string | number): Promise<MarketplaceOrder> => {
      const raw = await request<any>(`/marketplace/me/local-shop-orders/${id}`, 'GET', undefined, true);
      return normalizeLocalShopOrder(unwrapData<any>(raw));
    },
    cancel: async (id: string | number): Promise<MarketplaceOrder> => {
      const raw = await request<any>(`/marketplace/me/local-shop-orders/${id}/cancel`, 'PATCH', undefined, true);
      return normalizeLocalShopOrder(unwrapData<any>(raw));
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
    rate: async (id: string | number, items: OrderRatingItemPayload[]): Promise<boolean> => {
      await request<any>(`/marketplace/me/orders/${id}/ratings`, 'POST', { items }, true);
      return true;
    },
  },

  notifications: {
    list: async (params?: { page?: number; limit?: number }): Promise<MarketplaceNotificationsListResult> => {
      const page = params?.page ?? 1;
      const limit = Math.min(params?.limit ?? 10, 100);
      const raw = await request<any>(`/marketplace/me/notifications?page=${page}&limit=${limit}`, 'GET', undefined, true);
      const data = unwrapData<any>(raw);
      const items = Array.isArray(data?.items) ? data.items.map(normalizeMarketplaceNotification) : [];
      return {
        items,
        total: Number(data?.total ?? items.length),
        unread_count: Number(data?.unread_count ?? 0),
        page: Number(data?.page ?? page),
        limit: Number(data?.limit ?? limit),
        total_pages: Number(data?.total_pages ?? 1),
      };
    },
    unreadCount: async (): Promise<number> => {
      const raw = await request<any>('/marketplace/me/notifications/unread-count', 'GET', undefined, true);
      const data = unwrapData<any>(raw);
      return Number(data?.unread_count ?? 0);
    },
    markRead: async (id: string | number): Promise<void> => {
      await request<any>(`/marketplace/me/notifications/${id}/read`, 'PATCH', undefined, true);
    },
    markAllRead: async (): Promise<void> => {
      await request<any>('/marketplace/me/notifications/read-all', 'PATCH', undefined, true);
    },
  },

  partnerRequests: {
    list: async (params?: { page?: number; limit?: number }): Promise<PartnerRequest[]> => {
      try {
        const page = params?.page ?? 1;
        const limit = Math.min(100, Math.max(1, params?.limit ?? 10));
        const raw = await request<any>(
          `/marketplace/me/partner-requests?page=${page}&limit=${limit}`,
          'GET',
          undefined,
          true
        );
        const data = unwrapData<any>(raw);
        const items = Array.isArray(data?.items) ? data.items : extractArray<any>(data);
        return items.map(normalizePartnerRequest);
      } catch {
        return [];
      }
    },
    create: async (payload: PartnerRequestPayload): Promise<PartnerRequest> => {
      const normalized = normalizePartnerRequestPayload(payload);
      const validationError = validatePartnerRequestPayload(normalized);
      if (validationError) throw new Error(validationError);
      const raw = await request<any>('/marketplace/me/partner-requests', 'POST', normalized, true);
      const data = unwrapData<any>(raw);
      return normalizePartnerRequest(data);
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
