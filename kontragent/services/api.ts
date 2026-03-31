import AsyncStorage from '@react-native-async-storage/async-storage';
import { getContragentV1BaseUrl, getLegacyApiBaseUrl } from './apiConfig';

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface PasswordSetupStep1Request {
  phone: string;
}

export interface PasswordSetupStep1Response {
  success: boolean;
  message: string;
}

export interface PasswordSetupStep2Request {
  phone: string;
  code: string;
}

export interface PasswordSetupStep2Response {
  success: boolean;
  message: string;
}

export interface PasswordSetupStep3Request {
  phone: string;
  newPassword: string;
}

export interface PasswordSetupStep3Response {
  success: boolean;
  message: string;
  data?: {
    token: string;
    contragent: Contragent;
  };
}

export interface Contragent {
  _id: string;
  id?: number;
  name: string;
  inn?: string;
  viloyat?: {
    _id: string;
    name: string;
    type: string;
    code: string;
  };
  tuman?: {
    _id: string;
    name: string;
    type: string;
    code: string;
  };
  mfy?: {
    _id: string;
    name: string;
    type: string;
    code: string;
  };
  phone?: string;
  status?: string;
  logo?: string;
  has_logo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token?: string;
    contragent?: Contragent;
  };
}

export interface GetMeResponse {
  success: boolean;
  data: Contragent;
}

export interface ContragentResponse {
  success: boolean;
  message?: string;
  data: Contragent;
}

export interface ContragentUpdateRequest {
  name?: string;
  phone?: string;
  inn?: string;
  viloyat?: string;
  tuman?: string;
  mfy?: string;
  logo?: string;
}

// Category interfaces
export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string | null;
  censored?: boolean;
  parent: Category | null | string;
  status: 'active' | 'inactive';
  createdBy?: {
    _id: string;
    name: string;
    phone?: string;
    username?: string;
  };
  createdByModel?: string;
  subcategories?: Array<{
    _id: string;
    name: string;
    slug: string;
    parent: string;
    status: 'active' | 'inactive';
    id?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Category[];
}

export interface CategoryResponse {
  success: boolean;
  message?: string;
  data: Category;
}

export interface CategoryCreateRequest {
  name: string;
}

export interface CategoryUpdateRequest {
  name: string;
}

export interface CategoryStatusRequest {
  status: 'active' | 'inactive';
}

// Region interfaces
export interface Region {
  _id: string;
  name: string;
  type: 'region' | 'district' | 'mfy';
  parent?: {
    _id: string;
    name: string;
    type: string;
    code: string;
  } | null;
  code: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface RegionListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Region[];
}

// Product interfaces
export interface DeliveryRegion {
  viloyat: string;
  tuman?: string | null;
}

/** v1: yetkazib berish hududlari (PUT/GET delivery-areas) */
export interface ContragentDeliveryAreasPayload {
  region_ids: number[];
  district_ids: number[];
}

export interface ContragentAreaRegion {
  id: number;
  name: string;
  code?: string;
}

export interface ContragentAreaDistrict {
  id: number;
  name: string;
  region_id?: number;
}

export interface ContragentDeliveryAreaRow {
  regionId: number;
  districtId: number;
  regionName: string;
  districtName: string;
}

export interface DeltaFormat {
  ops: Array<{
    insert: string;
    attributes?: Record<string, any>;
  }>;
}

export interface Product {
  _id: string;
  name: string;
  description?: DeltaFormat | null;
  price: number;
  originalPrice: number;
  images: string[];
  category: Category;
  subcategory: Category | null;
  quantity: number;
  unit: 'dona' | 'litr' | 'kg';
  unitSize?: number | null;
  length?: number | null;
  width?: number | null;
  weight?: number | null;
  status: 'active' | 'inactive' | 'archived';
  censored?: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderatedBy?: {
    _id: string;
    name: string;
    username?: string;
  } | null;
  moderatedAt?: string | null;
  rejectionReason?: string | null;
  contragent?: {
    _id: string;
    name: string;
    inn: string;
    phone: string;
  };
  deliveryRegions?: Array<{
    viloyat: {
      _id: string;
      name: string;
      type: string;
      code: string;
    };
    tuman?: {
      _id: string;
      name: string;
      type: string;
      code: string;
    } | null;
  }>;
  kpiBonusPercent: number;
  productCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Product[];
}

export interface ProductResponse {
  success: boolean;
  message?: string;
  data: Product;
}

export interface ProductCreateRequest {
  name: string;
  description?: DeltaFormat | null;
  price: number;
  originalPrice: number;
  images?: string[];
  category: string;
  subcategory?: string | null;
  quantity: number;
  unit: 'dona' | 'litr' | 'kg';
  unitSize?: number | null;
  length?: number | null;
  width?: number | null;
  weight?: number | null;
  status?: 'active' | 'inactive' | 'archived';
  kpiBonusPercent: number;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: DeltaFormat | null;
  price?: number;
  originalPrice?: number;
  images?: string[];
  category?: string;
  subcategory?: string | null;
  quantity?: number;
  unit?: 'dona' | 'litr' | 'kg';
  unitSize?: number | null;
  length?: number | null;
  width?: number | null;
  weight?: number | null;
  status?: 'active' | 'inactive' | 'archived';
  kpiBonusPercent?: number;
}

export interface ProductStatusRequest {
  status: 'active' | 'inactive' | 'archived';
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Contragent Order interfaces
export interface ContragentRequest {
  _id?: string;
  contragentId: {
    _id: string;
    name: string;
    inn: string;
    phone?: string;
  };
  itemIds: number[];
  status: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
  requestedAt: string;
  respondedAt?: string | null;
  deliveredToPunktAt?: string | null;
}

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    images?: string[];
    productCode?: string;
    price?: number;
    contragent?: {
      _id: string;
      name: string;
    };
  };
  quantity: number;
  price: number;
  originalPrice?: number;
  kpiBonusPercent?: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  contragentRequests: ContragentRequest[];
  currentPunkt: {
    _id: string;
    name: string;
    phone?: string;
    tuman?: string;
    viloyat?: string;
  };
  items: OrderItem[];
  itemCount: number;
  phoneNumber: string;
  deliveryViloyat?: {
    _id: string;
    name: string;
    code: string;
    type: string;
  };
  deliveryTuman?: {
    _id: string;
    name: string;
    code: string;
    type: string;
  };
  deliveryMfy?: {
    _id: string;
    name: string;
    code: string;
    type: string;
  };
  deliveryNote?: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  totalPrice: number;
  totalOriginalPrice: number;
  totalKpiPrice: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Order[];
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  data: Order;
}

export interface OrderRespondRequest {
  response: 'accepted' | 'rejected';
}

/** Punkt → kontragent qator so‘rovlari (`/contragents/me/punkt-line-requests`) */
export type PunktLineRequestStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'delivered'
  | 'rejected';

export interface PunktLineRequest {
  id: number;
  orderId: number;
  orderItemId: number;
  punktId: number;
  punktName?: string;
  assignedAgentId?: number;
  assignedAgentName?: string;
  routingDistrictId: number;
  status: PunktLineRequestStatus;
  orderStatus: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
  productId?: number;
  orderTotalAmount?: number;
}

export interface PunktLineRequestListResult {
  items: PunktLineRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NoAuthPunkt {
  id: number;
  name: string;
  viloyatId?: number;
  tumanId?: number;
  status?: string;
}

export interface NoAuthRegion {
  id: number;
  name: string;
  code?: string;
}

export interface NoAuthDistrict {
  id: number;
  name: string;
  regionId?: number;
}

function parsePunktLineRequestStatus(s: unknown): PunktLineRequestStatus {
  const v = String(s ?? '');
  if (
    v === 'pending' ||
    v === 'accepted' ||
    v === 'preparing' ||
    v === 'delivered' ||
    v === 'rejected'
  ) {
    return v;
  }
  return 'pending';
}

function parseNoAuthPaginatedList(
  raw: Record<string, unknown>
): { items: unknown[]; total: number; page: number; limit: number; totalPages: number } {
  const d =
    raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
      ? (raw.data as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const items = Array.isArray(d.items)
    ? d.items
    : Array.isArray(raw.items)
      ? (raw.items as unknown[])
      : Array.isArray(raw.data)
        ? (raw.data as unknown[])
        : [];
  const total = Number(d.total ?? raw.total ?? items.length);
  const page = Number(d.page ?? raw.page ?? 1);
  const limit = Number(d.limit ?? raw.limit ?? 10);
  const totalPages = Number(
    d.total_pages ??
      d.totalPages ??
      raw.total_pages ??
      raw.totalPages ??
      Math.max(1, Math.ceil((total || items.length) / (limit || 10)))
  );
  return {
    items,
    total: Number.isFinite(total) ? total : items.length,
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 10,
    totalPages: Number.isFinite(totalPages) ? totalPages : 1,
  };
}

function parsePunktLineRequestRow(
  row: Record<string, unknown>,
  detail?: boolean
): PunktLineRequest {
  const r = row;
  const punkt =
    r.punkt && typeof r.punkt === 'object' && !Array.isArray(r.punkt)
      ? (r.punkt as Record<string, unknown>)
      : undefined;
  const assignedAgent =
    r.assigned_agent && typeof r.assigned_agent === 'object' && !Array.isArray(r.assigned_agent)
      ? (r.assigned_agent as Record<string, unknown>)
      : r.assignedAgent && typeof r.assignedAgent === 'object' && !Array.isArray(r.assignedAgent)
        ? (r.assignedAgent as Record<string, unknown>)
        : undefined;
  const order =
    r.order && typeof r.order === 'object' && !Array.isArray(r.order)
      ? (r.order as Record<string, unknown>)
      : undefined;
  const out: PunktLineRequest = {
    id: Number(r.id ?? 0),
    orderId: Number(r.order_id ?? r.orderId ?? order?.id ?? 0),
    orderItemId: Number(r.order_item_id ?? r.orderItemId ?? 0),
    punktId: Number(r.punkt_id ?? r.punktId ?? punkt?.id ?? order?.assigned_punkt_id ?? 0),
    punktName:
      (punkt?.name != null ? String(punkt.name) : undefined) ??
      (r.punkt_name != null ? String(r.punkt_name) : undefined),
    assignedAgentId: Number(
      r.assigned_agent_id ?? r.assignedAgentId ?? assignedAgent?.id ?? order?.assigned_agent_id ?? 0
    ),
    assignedAgentName:
      (assignedAgent?.name != null ? String(assignedAgent.name) : undefined) ??
      (r.assigned_agent_name != null ? String(r.assigned_agent_name) : undefined),
    routingDistrictId: Number(
      r.routing_district_id ?? r.routingDistrictId ?? punkt?.tuman_id ?? order?.routing_district_id ?? 0
    ),
    status: parsePunktLineRequestStatus(r.status),
    orderStatus: String(r.order_status ?? r.orderStatus ?? order?.status ?? ''),
    productName: String(r.product_name ?? r.productName ?? ''),
    quantity: Number(r.quantity ?? 0),
    unit: String(r.unit ?? 'dona'),
    unitPrice: Number(r.unit_price ?? r.unitPrice ?? 0),
    createdAt: String(r.created_at ?? r.createdAt ?? ''),
    updatedAt: String(r.updated_at ?? r.updatedAt ?? ''),
  };
  if (detail) {
    const pid = r.product_id ?? r.productId;
    if (pid != null && pid !== '') out.productId = Number(pid);
    const ota = r.order_total_amount ?? r.orderTotalAmount ?? order?.total_amount;
    if (ota != null && ota !== '') out.orderTotalAmount = Number(ota);
  }
  if (!Number.isFinite(out.assignedAgentId as number) || (out.assignedAgentId as number) <= 0) {
    delete out.assignedAgentId;
  }
  return out;
}

function normalizeContragent(raw: Record<string, unknown>): Contragent {
  const idVal = raw._id ?? raw.id;
  const _id =
    typeof idVal === 'string' ? idVal : idVal != null ? String(idVal) : '';
  return {
    ...(raw as unknown as Contragent),
    _id,
  };
}

function parseV1AreaList(raw: Record<string, unknown>): unknown[] {
  const data = raw.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    for (const key of [
      'regions',
      'region_list',
      'districts',
      'district_list',
      'mfys',
      'items',
      'list',
      'rows',
      'results',
      'content',
    ]) {
      const arr = d[key];
      if (Array.isArray(arr)) return arr;
    }
    for (const v of Object.values(d)) {
      if (Array.isArray(v) && v.length > 0) return v;
    }
  }
  for (const key of ['regions', 'districts']) {
    const arr = raw[key];
    if (Array.isArray(arr)) return arr;
  }
  return [];
}

function toContragentRegion(x: unknown): ContragentAreaRegion {
  const o = (x || {}) as Record<string, unknown>;
  return {
    id: Number(o.id),
    name: String(o.name ?? ''),
    code: o.code != null ? String(o.code) : undefined,
  };
}

function toContragentDistrict(x: unknown): ContragentAreaDistrict {
  const o = (x || {}) as Record<string, unknown>;
  return {
    id: Number(o.id),
    name: String(o.name ?? ''),
    region_id: o.region_id != null ? Number(o.region_id) : undefined,
  };
}

function contragentFromProfilePayload(body: Record<string, unknown>): Contragent {
  const data = body.data as Record<string, unknown> | undefined;
  const nested =
    data?.contragent ??
    body.contragent ??
    (typeof data === 'object' && data && !('token' in data) ? data : undefined);
  if (nested && typeof nested === 'object') {
    return normalizeContragent(nested as Record<string, unknown>);
  }
  return normalizeContragent(body);
}

/** `me/profile` yoki logo: plain base64 yoki `data:image/...` — `<Image source={{ uri }} />` uchun */
export function contragentLogoToImageUri(logo?: string | null): string | undefined {
  if (logo == null || typeof logo !== 'string') return undefined;
  const t = logo.trim();
  if (!t) return undefined;
  if (/^data:image\//i.test(t)) return t;
  const clean = t.replace(/\s/g, '');
  if (clean.length < 24) return undefined;
  if (clean.startsWith('iVBOR')) return `data:image/png;base64,${clean}`;
  if (clean.startsWith('/9j')) return `data:image/jpeg;base64,${clean}`;
  if (clean.startsWith('R0lGOD')) return `data:image/gif;base64,${clean}`;
  return `data:image/png;base64,${clean}`;
}

/** ---- Contragent v1: categories / subcategories / products (8081 /api/v1) ---- */

function extractV1ListPayload(raw: Record<string, unknown>): unknown[] {
  const d = raw.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object') {
    const o = d as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.rows)) return o.rows;
    if (Array.isArray(o.categories)) return o.categories;
    if (Array.isArray(o.products)) return o.products;
    if (Array.isArray(o.subcategories)) return o.subcategories;
  }
  if (Array.isArray(raw.items)) return raw.items as unknown[];
  return [];
}

function extractV1Meta(
  raw: Record<string, unknown>,
  fallbackLen: number
): { total: number; page: number; limit: number; totalPages: number } {
  const d = raw.data;
  let meta: Record<string, unknown> | null = null;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const o = d as Record<string, unknown>;
    if (o.pagination && typeof o.pagination === 'object') {
      meta = o.pagination as Record<string, unknown>;
    } else if (o.total != null || o.total_pages != null || o.totalPages != null) {
      meta = o;
    }
  }
  if (!meta && raw.pagination && typeof raw.pagination === 'object') {
    meta = raw.pagination as Record<string, unknown>;
  }
  if (!meta) {
    return { total: fallbackLen, page: 1, limit: fallbackLen, totalPages: 1 };
  }
  const total = Number(meta.total ?? fallbackLen);
  const page = Number(meta.page ?? meta.current_page ?? 1);
  const limit = Number(meta.limit ?? meta.per_page ?? 10);
  const totalPages = Number(
    meta.total_pages ??
      meta.totalPages ??
      Math.max(1, Math.ceil((Number.isFinite(total) ? total : fallbackLen) / (limit || 10)))
  );
  return {
    total: Number.isFinite(total) ? total : fallbackLen,
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 10,
    totalPages: Number.isFinite(totalPages) ? totalPages : 1,
  };
}

function extractV1SingleRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const d = raw.data;
  if (d && typeof d === 'object' && !Array.isArray(d)) return d as Record<string, unknown>;
  return raw;
}

function normalizeV1CategoryRow(row: Record<string, unknown>): Category {
  const id = row.id ?? row._id;
  const idStr = id != null ? String(id) : '';
  const st = row.status === 'inactive' ? 'inactive' : 'active';
  return {
    _id: idStr,
    name: String(row.name ?? ''),
    slug: String(row.slug ?? idStr),
    image: row.image != null ? String(row.image) : null,
    censored: row.censored === true,
    parent: row.parent_id != null ? String(row.parent_id) : null,
    status: st,
    subcategories: undefined,
    createdAt: String(row.created_at ?? row.createdAt ?? ''),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? ''),
  };
}

function stubCategory(idNum: number, name: string): Category {
  const idStr = String(idNum);
  return {
    _id: idStr,
    name,
    slug: idStr,
    parent: null,
    status: 'active',
    createdAt: '',
    updatedAt: '',
  };
}

function parseV1Description(desc: unknown): DeltaFormat | null {
  if (desc == null) return null;
  if (typeof desc === 'object' && desc && 'ops' in (desc as object)) return desc as DeltaFormat;
  if (typeof desc === 'string' && desc.trim()) {
    try {
      const p = JSON.parse(desc) as DeltaFormat;
      if (p && Array.isArray(p.ops)) return p;
    } catch {
      return { ops: [{ insert: desc }] };
    }
  }
  return null;
}

function pickNumCat(r: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    if (r[k] != null && r[k] !== '' && Number.isFinite(Number(r[k]))) return Number(r[k]);
  }
  return 0;
}

function normalizeV1ProductRow(row: Record<string, unknown>): Product {
  const idRaw = row.id ?? row._id;
  const categoryNested = row.category as Record<string, unknown> | undefined;
  const subNested = row.subcategory as Record<string, unknown> | undefined;
  const cid = categoryNested ? pickNumCat(categoryNested, 'id', '_id') : pickNumCat(row, 'category_id');
  const hasSubId = row.subcategory_id != null && row.subcategory_id !== '';
  const sidRaw = subNested ? pickNumCat(subNested, 'id', '_id') : hasSubId ? pickNumCat(row, 'subcategory_id') : 0;

  const category =
    categoryNested != null
      ? normalizeV1CategoryRow(categoryNested)
      : stubCategory(cid || 0, String(row.category_name ?? 'Kategoriya'));
  const subcategory: Category | null =
    subNested != null
      ? normalizeV1CategoryRow(subNested)
      : sidRaw > 0
        ? stubCategory(sidRaw, String(row.subcategory_name ?? 'Subkategoriya'))
        : null;

  const imagesRaw = row.images;
  const images = Array.isArray(imagesRaw)
    ? (imagesRaw as unknown[]).map((x) => String(x))
    : [];

  const mod = row.moderation_status ?? row.moderationStatus;
  const moderationStatus =
    mod === 'approved' || mod === 'rejected' || mod === 'pending' ? mod : undefined;

  const unitRaw = row.unit;
  const unit: Product['unit'] =
    unitRaw === 'litr' || unitRaw === 'kg' || unitRaw === 'dona' ? unitRaw : 'dona';

  const us = row.unit_size ?? row.unitSize;
  let unitSize: number | null = null;
  if (typeof us === 'number' && Number.isFinite(us)) unitSize = us;
  else if (typeof us === 'string') {
    const n = parseFloat(us);
    unitSize = Number.isFinite(n) ? n : null;
  }

  const st = row.status;
  const status: Product['status'] =
    st === 'inactive' || st === 'archived' || st === 'active' ? st : 'active';

  return {
    _id: idRaw != null ? String(idRaw) : '',
    name: String(row.name ?? ''),
    description: parseV1Description(row.description),
    price: pickNumCat(row, 'price'),
    originalPrice: pickNumCat(row, 'original_price', 'originalPrice'),
    images,
    category,
    subcategory,
    quantity: pickNumCat(row, 'quantity'),
    unit,
    unitSize,
    length: row.length != null ? Number(row.length) : null,
    width: row.width != null ? Number(row.width) : null,
    weight: row.weight != null ? Number(row.weight) : null,
    status,
    censored: row.censored === true,
    moderationStatus,
    moderatedBy: null,
    moderatedAt: row.moderated_at != null ? String(row.moderated_at) : null,
    rejectionReason: row.rejection_reason != null ? String(row.rejection_reason) : null,
    contragent: undefined,
    deliveryRegions: undefined,
    kpiBonusPercent: pickNumCat(row, 'kpi_bonus_percent', 'kpiBonusPercent'),
    productCode: String(row.product_code ?? row.productCode ?? ''),
    createdAt: String(row.created_at ?? row.createdAt ?? ''),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? ''),
  };
}

function descriptionToV1JsonString(desc: DeltaFormat | null | undefined): string {
  if (desc == null) return JSON.stringify({ ops: [{ insert: '' }] });
  return JSON.stringify(desc);
}

function buildV1ProductWriteBody(data: {
  name: string;
  description: DeltaFormat | null | undefined;
  price: number;
  originalPrice: number;
  images: string[];
  categoryId: number;
  subcategoryId: number | null;
  quantity: number;
  unit: 'dona' | 'litr' | 'kg';
  unitSize: string | null;
  status: 'active' | 'inactive' | 'archived';
  kpiBonusPercent: number;
}): Record<string, unknown> {
  const apiStatus = data.status === 'archived' ? 'inactive' : data.status;
  const body: Record<string, unknown> = {
    name: data.name,
    description: descriptionToV1JsonString(data.description),
    price: data.price,
    original_price: data.originalPrice,
    images: data.images,
    category_id: data.categoryId,
    quantity: data.quantity,
    unit: data.unit,
    unit_size:
      data.unitSize && data.unitSize.trim().length > 0 ? data.unitSize.trim() : String(data.unit),
    status: apiStatus,
    kpi_bonus_percent: data.kpiBonusPercent,
  };
  if (data.subcategoryId != null && data.subcategoryId > 0) {
    body.subcategory_id = data.subcategoryId;
  }
  return body;
}

class ApiService {
  private baseUrl: string;
  private contragentV1Base: string;

  constructor() {
    this.baseUrl = getLegacyApiBaseUrl();
    this.contragentV1Base = getContragentV1BaseUrl();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const token = await this.getToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const text = await response.text();
      const data = text ? (JSON.parse(text) as Record<string, unknown>) : ({} as Record<string, unknown>);

      if (!response.ok) {
        throw {
          status: response.status,
          message: (data.message as string) || 'An error occurred',
          errors: data.errors,
        };
      }

      return data as T;
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status) {
        throw error;
      }
      throw {
        status: 500,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  private async contragentV1Request<T>(
    endpoint: string,
    options: RequestInit & { skipAuth?: boolean } = {}
  ): Promise<T> {
    const { skipAuth, ...fetchOpts } = options;
    const url = `${this.contragentV1Base}${endpoint}`;

    const controller = new AbortController();
    const timeoutMs = 30_000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const config: RequestInit = {
      ...fetchOpts,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(fetchOpts.headers || {}),
      },
    };

    if (!skipAuth) {
      const token = await this.getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);
      const text = await response.text();
      const data = text ? (JSON.parse(text) as Record<string, unknown>) : ({} as Record<string, unknown>);

      if (!response.ok) {
        throw {
          status: response.status,
          message: (data.message as string) || 'An error occurred',
          errors: data.errors,
        };
      }

      return data as T;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          status: 408,
          message:
            'So‘rov vaqti tugadi. Kompyuter IP (192.168.x) va server (8081) ni tekshiring.',
        };
      }
      const err = error as { status?: number };
      if (err.status) {
        throw error;
      }
      throw {
        status: 500,
        message: 'Network error. Please check your connection.',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const raw = await this.contragentV1Request<{
      message: string;
      data?: { token?: string; contragent?: Record<string, unknown> };
    }>('/contragents/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
    return {
      success: true,
      message: raw.message,
      data: {
        token: raw.data?.token,
        contragent: raw.data?.contragent
          ? normalizeContragent(raw.data.contragent)
          : undefined,
      },
    };
  }

  async passwordSetupStep1(data: PasswordSetupStep1Request): Promise<PasswordSetupStep1Response> {
    const raw = await this.contragentV1Request<{ message: string }>('/contragents/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone: data.phone }),
      skipAuth: true,
    });
    return { success: true, message: raw.message || 'SMS kodi yuborildi' };
  }

  async passwordSetupResendCode(data: PasswordSetupStep1Request): Promise<PasswordSetupStep1Response> {
    const raw = await this.contragentV1Request<{ message: string }>('/contragents/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ phone: data.phone }),
      skipAuth: true,
    });
    return { success: true, message: raw.message || 'SMS kodi qayta yuborildi' };
  }

  async passwordSetupStep2(data: PasswordSetupStep2Request): Promise<PasswordSetupStep2Response> {
    const raw = await this.contragentV1Request<{ message: string }>('/contragents/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone: data.phone, code: data.code }),
      skipAuth: true,
    });
    return { success: true, message: raw.message || 'Kod tasdiqlandi' };
  }

  async passwordSetupStep3(data: PasswordSetupStep3Request): Promise<PasswordSetupStep3Response> {
    const raw = await this.contragentV1Request<{
      message: string;
      data?: { token: string; contragent: Record<string, unknown> };
    }>('/contragents/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ phone: data.phone, password: data.newPassword }),
      skipAuth: true,
    });
    return {
      success: true,
      message: raw.message || 'Parol o\'rnatildi',
      data: raw.data
        ? {
            token: raw.data.token,
            contragent: normalizeContragent(raw.data.contragent),
          }
        : undefined,
    };
  }

  async getMe(): Promise<GetMeResponse> {
    const raw = await this.contragentV1Request<Record<string, unknown>>('/contragents/me/profile', {
      method: 'GET',
    });
    return {
      success: true,
      data: contragentFromProfilePayload(raw),
    };
  }

  async changePassword(body: { old_password: string; new_password: string }): Promise<{ message: string }> {
    return this.contragentV1Request('/contragents/me/change-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateProfile(data: ContragentUpdateRequest): Promise<ContragentResponse> {
    return this.request<ContragentResponse>('/api/contragents/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateLogo(data: { logo: string }): Promise<ContragentResponse> {
    const raw = await this.contragentV1Request<Record<string, unknown>>('/contragents/me/logo', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const contragent = contragentFromProfilePayload(raw);
    return {
      success: true,
      message: (raw.message as string) || '',
      data: contragent,
    };
  }

  async getContragentRegions(): Promise<ContragentAreaRegion[]> {
    const raw = await this.contragentV1Request<Record<string, unknown>>('/contragents/me/regions', {
      method: 'GET',
    });
    return parseV1AreaList(raw).map((x) => toContragentRegion(x));
  }

  async getContragentDistricts(regionId?: number): Promise<ContragentAreaDistrict[]> {
    const q =
      regionId != null && Number.isFinite(Number(regionId))
        ? `?region_id=${encodeURIComponent(String(Number(regionId)))}`
        : '';
    const raw = await this.contragentV1Request<Record<string, unknown>>(
      `/contragents/me/districts${q}`,
      { method: 'GET' }
    );
    return parseV1AreaList(raw).map((x) => toContragentDistrict(x));
  }

  async getContragentDeliveryAreas(): Promise<{
    message: string;
    data: ContragentDeliveryAreasPayload;
  }> {
    const raw = await this.contragentV1Request<Record<string, unknown>>(
      '/contragents/me/delivery-areas',
      { method: 'GET' }
    );
    const data = raw.data as Record<string, unknown> | undefined;
    const region_ids = Array.isArray(data?.region_ids)
      ? (data!.region_ids as number[]).map((n) => Number(n))
      : [];
    const district_ids = Array.isArray(data?.district_ids)
      ? (data!.district_ids as number[]).map((n) => Number(n))
      : [];
    return {
      message: (raw.message as string) || '',
      data: { region_ids, district_ids },
    };
  }

  async putContragentDeliveryAreas(
    body: ContragentDeliveryAreasPayload
  ): Promise<{ message: string }> {
    return this.contragentV1Request<{ message: string }>(
      '/contragents/me/delivery-areas',
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );
  }

  async resolveContragentDeliveryAreaRows(
    payload: ContragentDeliveryAreasPayload
  ): Promise<ContragentDeliveryAreaRow[]> {
    if (payload.region_ids.length === 0 || payload.district_ids.length === 0) {
      return [];
    }
    const regions = await this.getContragentRegions();
    const rmap = new Map(regions.map((r) => [r.id, r.name]));
    const rows: ContragentDeliveryAreaRow[] = [];
    const wantDistricts = new Set(payload.district_ids);
    for (const rid of payload.region_ids) {
      const districts = await this.getContragentDistricts(rid);
      for (const d of districts) {
        if (wantDistricts.has(d.id)) {
          rows.push({
            regionId: rid,
            districtId: d.id,
            regionName: rmap.get(rid) || `Viloyat #${rid}`,
            districtName: d.name,
          });
        }
      }
    }
    return rows;
  }

  async getDeliveryRegions(): Promise<{
    success: boolean;
    data: {
      deliveryRegions: Array<{
        viloyat: {
          _id: string;
          name: string;
          type: string;
          code: string;
        };
        tuman: {
          _id: string;
          name: string;
          type: string;
          code: string;
        } | null;
      }>;
    };
  }> {
    return this.request('/api/contragents/me/delivery-regions', {
      method: 'GET',
    });
  }

  async updateDeliveryRegions(data: {
    deliveryRegions: DeliveryRegion[];
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      deliveryRegions: Array<{
        viloyat: {
          _id: string;
          name: string;
          type: string;
          code: string;
        };
        tuman: {
          _id: string;
          name: string;
          type: string;
          code: string;
        } | null;
      }>;
    };
  }> {
    return this.request('/api/contragents/me/delivery-regions', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Category methods
  async createCategory(data: CategoryCreateRequest): Promise<CategoryResponse> {
    return this.request<CategoryResponse>('/api/category/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCategories(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive';
  }): Promise<CategoryListResponse> {
    const want = Math.min(params?.limit ?? 1000, 1000);
    const pageSize = 100;
    const all: Category[] = [];
    let page = 1;
    let meta = { total: 0, page: 1, limit: pageSize, totalPages: 1 };

    while (page <= 50 && all.length < want) {
      const raw = await this.contragentV1Request<Record<string, unknown>>(
        `/contragents/me/categories?page=${page}&limit=${pageSize}`,
        { method: 'GET' }
      );
      const list = extractV1ListPayload(raw);
      meta = extractV1Meta(raw, list.length);
      for (const x of list) {
        all.push(normalizeV1CategoryRow(x as Record<string, unknown>));
      }
      if (list.length === 0 || page >= meta.totalPages) break;
      page += 1;
    }

    let data = all;
    if (params?.status) {
      data = data.filter((c) => c.status === params.status);
    }

    return {
      success: true,
      count: data.length,
      total: data.length,
      page: 1,
      limit: want,
      totalPages: Math.max(1, Math.ceil(data.length / (want || 1))),
      data,
    };
  }

  async getCategoryById(id: string): Promise<CategoryResponse> {
    const raw = await this.contragentV1Request<Record<string, unknown>>(
      `/contragents/me/categories/${encodeURIComponent(String(Number(id)))}`,
      { method: 'GET' }
    );
    return {
      success: true,
      data: normalizeV1CategoryRow(extractV1SingleRecord(raw)),
    };
  }

  async updateCategory(
    id: string,
    data: CategoryUpdateRequest
  ): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(`/api/category/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateCategoryStatus(
    id: string,
    data: CategoryStatusRequest
  ): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(`/api/category/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/category/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Subcategory methods
  async createSubcategory(data: {
    name: string;
    parent: string;
  }): Promise<CategoryResponse> {
    return this.request<CategoryResponse>('/api/category/subcategory/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSubcategories(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive';
    parent?: string;
  }): Promise<CategoryListResponse> {
    if (params?.parent == null || params.parent === '') {
      return {
        success: true,
        count: 0,
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        data: [],
      };
    }

    const parentIdNum = Number(params.parent);
    const want = Math.min(params?.limit ?? 1000, 1000);
    const pageSize = 100;
    const all: Category[] = [];
    let page = 1;
    let meta = { total: 0, page: 1, limit: pageSize, totalPages: 1 };

    while (page <= 50 && all.length < want) {
      const qp = new URLSearchParams();
      qp.set('parent_id', String(parentIdNum));
      qp.set('page', String(page));
      qp.set('limit', String(pageSize));
      const raw = await this.contragentV1Request<Record<string, unknown>>(
        `/contragents/me/subcategories?${qp}`,
        { method: 'GET' }
      );
      const list = extractV1ListPayload(raw);
      meta = extractV1Meta(raw, list.length);
      for (const x of list) {
        all.push(normalizeV1CategoryRow(x as Record<string, unknown>));
      }
      if (list.length === 0 || page >= meta.totalPages) break;
      page += 1;
    }

    let data = all;
    if (params?.status) {
      data = data.filter((c) => c.status === params.status);
    }

    return {
      success: true,
      count: data.length,
      total: data.length,
      page: 1,
      limit: want,
      totalPages: Math.max(1, Math.ceil(data.length / (want || 1))),
      data,
    };
  }

  async updateSubcategory(
    id: string,
    data: CategoryUpdateRequest
  ): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(`/api/category/subcategory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateSubcategoryStatus(
    id: string,
    data: CategoryStatusRequest
  ): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(
      `/api/category/subcategory/${id}/status`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteSubcategory(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/category/subcategory/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Product methods (Contragent v1)
  async createProduct(data: ProductCreateRequest): Promise<ProductResponse> {
    const images = data.images ?? [];
    const body = buildV1ProductWriteBody({
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      originalPrice: data.originalPrice,
      images,
      categoryId: Number(data.category),
      subcategoryId: data.subcategory != null && data.subcategory !== '' ? Number(data.subcategory) : null,
      quantity: data.quantity,
      unit: data.unit,
      unitSize: data.unitSize != null ? String(data.unitSize) : null,
      status: data.status ?? 'active',
      kpiBonusPercent: data.kpiBonusPercent,
    });
    const raw = await this.contragentV1Request<Record<string, unknown>>('/contragents/me/products', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return {
      success: true,
      message: (raw.message as string) || '',
      data: normalizeV1ProductRow(extractV1SingleRecord(raw)),
    };
  }

  async getMyProducts(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive' | 'archived';
    category?: string;
    subcategory?: string;
  }): Promise<ProductListResponse> {
    const wantLimit = params?.limit ?? 1000;
    const pageSize = 100;

    if (params?.page != null) {
      const qp = new URLSearchParams();
      qp.set('page', String(params.page));
      qp.set('limit', String(Math.min(params.limit ?? 10, 100)));
      if (params.status) qp.set('status', params.status);
      const raw = await this.contragentV1Request<Record<string, unknown>>(
        `/contragents/me/products?${qp}`,
        { method: 'GET' }
      );
      const list = extractV1ListPayload(raw);
      const meta = extractV1Meta(raw, list.length);
      const items = list.map((x) => normalizeV1ProductRow(x as Record<string, unknown>));
      return {
        success: true,
        count: items.length,
        total: meta.total,
        page: meta.page,
        limit: meta.limit,
        totalPages: meta.totalPages,
        data: items,
      };
    }

    let page = 1;
    const all: Product[] = [];
    let lastMeta = { total: 0, page: 1, limit: pageSize, totalPages: 1 };

    while (page <= 50 && all.length < wantLimit) {
      const qp = new URLSearchParams();
      qp.set('page', String(page));
      qp.set('limit', String(pageSize));
      if (params?.status) qp.set('status', params.status);

      const raw = await this.contragentV1Request<Record<string, unknown>>(
        `/contragents/me/products?${qp}`,
        { method: 'GET' }
      );
      const list = extractV1ListPayload(raw);
      lastMeta = extractV1Meta(raw, list.length);
      for (const x of list) {
        all.push(normalizeV1ProductRow(x as Record<string, unknown>));
        if (all.length >= wantLimit) break;
      }
      if (list.length === 0 || page >= lastMeta.totalPages) break;
      page += 1;
    }

    return {
      success: true,
      count: all.length,
      total: lastMeta.total || all.length,
      page: 1,
      limit: wantLimit,
      totalPages: lastMeta.totalPages,
      data: all,
    };
  }

  async getAllProducts(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive' | 'archived';
    category?: string;
    subcategory?: string;
    contragent?: string;
    viloyat?: string;
    tuman?: string;
  }): Promise<ProductListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.subcategory) queryParams.append('subcategory', params.subcategory);
    if (params?.contragent) queryParams.append('contragent', params.contragent);
    if (params?.viloyat) queryParams.append('viloyat', params.viloyat);
    if (params?.tuman) queryParams.append('tuman', params.tuman);

    const query = queryParams.toString();
    return this.request<ProductListResponse>(
      `/api/product/list${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getProductById(id: string): Promise<ProductResponse> {
    const raw = await this.contragentV1Request<Record<string, unknown>>(
      `/contragents/me/products/${encodeURIComponent(String(Number(id)))}`,
      { method: 'GET' }
    );
    return {
      success: true,
      message: (raw.message as string) || '',
      data: normalizeV1ProductRow(extractV1SingleRecord(raw)),
    };
  }

  async updateProduct(id: string, data: ProductUpdateRequest): Promise<ProductResponse> {
    const images = data.images ?? [];
    const body = buildV1ProductWriteBody({
      name: data.name ?? '',
      description: data.description ?? null,
      price: data.price ?? 0,
      originalPrice: data.originalPrice ?? 0,
      images,
      categoryId: Number(data.category ?? 0),
      subcategoryId:
        data.subcategory != null && data.subcategory !== '' ? Number(data.subcategory) : null,
      quantity: data.quantity ?? 0,
      unit: (data.unit ?? 'dona') as 'dona' | 'litr' | 'kg',
      unitSize: data.unitSize != null ? String(data.unitSize) : null,
      status: data.status ?? 'active',
      kpiBonusPercent: data.kpiBonusPercent ?? 0,
    });
    const raw = await this.contragentV1Request<Record<string, unknown>>(
      `/contragents/me/products/${encodeURIComponent(String(Number(id)))}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );
    return {
      success: true,
      message: (raw.message as string) || '',
      data: normalizeV1ProductRow(extractV1SingleRecord(raw)),
    };
  }

  async updateProductStatus(id: string, data: ProductStatusRequest): Promise<ProductResponse> {
    const raw = await this.contragentV1Request<Record<string, unknown>>(
      `/contragents/me/products/${encodeURIComponent(String(Number(id)))}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: data.status === 'archived' ? 'inactive' : data.status }),
      }
    );
    return {
      success: true,
      message: (raw.message as string) || '',
      data: normalizeV1ProductRow(extractV1SingleRecord(raw)),
    };
  }

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    const raw = await this.contragentV1Request<Record<string, unknown>>(
      `/contragents/me/products/${encodeURIComponent(String(Number(id)))}`,
      {
        method: 'DELETE',
      }
    );
    return {
      success: true,
      message: (raw.message as string) || 'O\'chirildi',
    };
  }

  // Contragent Order methods
  async getTodayOrders(params?: {
    status?: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
    page?: number;
    limit?: number;
  }): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<OrderListResponse>(
      `/api/contragent/today${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getOrdersHistory(params?: {
    status?: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<OrderListResponse>(
      `/api/contragent/history${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getContragentOrders(params?: {
    status?: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
    page?: number;
    limit?: number;
  }): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<OrderListResponse>(
      `/api/contragent/orders${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getContragentOrderById(id: string): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/api/contragent/orders/${id}`, {
      method: 'GET',
    });
  }

  async respondToOrder(orderId: string, data: OrderRespondRequest): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/api/contragent/orders/${orderId}/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deliverOrderToPunkt(orderId: string): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/api/contragent/orders/${orderId}/deliver-to-punkt`, {
      method: 'POST',
    });
  }

  /** Kontragent v1: punkt yuborgan qator so‘rovlari */
  async getPunktLineRequests(params?: {
    page?: number;
    limit?: number;
    status?: PunktLineRequestStatus;
  }): Promise<PunktLineRequestListResult> {
    const page = params?.page ?? 1;
    const limit = Math.min(Math.max(1, params?.limit ?? 10), 100);
    const qp = new URLSearchParams();
    qp.set('page', String(page));
    qp.set('limit', String(limit));
    if (params?.status) qp.set('status', params.status);

    const raw = await this.contragentV1Request<Record<string, unknown>>(
      `/contragents/me/punkt-line-requests?${qp}`,
      { method: 'GET' }
    );
    const data =
      raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
        ? (raw.data as Record<string, unknown>)
        : ({} as Record<string, unknown>);
    const itemsRaw = Array.isArray(data.items) ? data.items : [];
    const items = itemsRaw.map((x) => parsePunktLineRequestRow(x as Record<string, unknown>));
    const total = Number(data.total ?? items.length);
    const p = Number(data.page ?? page);
    const l = Number(data.limit ?? limit);
    const totalPages = Number(
      data.total_pages ??
        data.totalPages ??
        Math.max(1, Math.ceil((Number.isFinite(total) ? total : items.length) / (l || 10)))
    );
    return {
      items,
      total: Number.isFinite(total) ? total : items.length,
      page: Number.isFinite(p) ? p : page,
      limit: Number.isFinite(l) ? l : limit,
      totalPages: Number.isFinite(totalPages) ? totalPages : 1,
    };
  }

  async getPunktLineRequestById(id: number): Promise<PunktLineRequest> {
    const raw = await this.contragentV1Request<Record<string, unknown>>(
      `/contragents/me/punkt-line-requests/${encodeURIComponent(String(id))}`,
      { method: 'GET' }
    );
    return parsePunktLineRequestRow(extractV1SingleRecord(raw), true);
  }

  async acceptPunktLineRequest(id: number): Promise<{ message: string }> {
    return this.contragentV1Request<{ message: string }>(
      `/contragents/me/punkt-line-requests/${encodeURIComponent(String(id))}/accept`,
      { method: 'POST' }
    );
  }

  async preparingPunktLineRequest(id: number): Promise<{ message: string }> {
    return this.contragentV1Request<{ message: string }>(
      `/contragents/me/punkt-line-requests/${encodeURIComponent(String(id))}/preparing`,
      { method: 'POST' }
    );
  }

  async deliverPunktLineRequest(id: number): Promise<{ message: string }> {
    return this.contragentV1Request<{ message: string }>(
      `/contragents/me/punkt-line-requests/${encodeURIComponent(String(id))}/deliver`,
      { method: 'POST' }
    );
  }

  /** NoAuth: punktlar ro‘yxati (token talab qilinmaydi) */
  async getNoAuthPunkts(params?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{
    items: NoAuthPunkt[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const qp = new URLSearchParams();
    qp.set('page', String(params?.page ?? 1));
    qp.set('limit', String(Math.min(Math.max(1, params?.limit ?? 100), 100)));
    if (params?.q?.trim()) qp.set('q', params.q.trim());
    const raw = await this.contragentV1Request<Record<string, unknown>>(
      `/noauth/punkts?${qp}`,
      { method: 'GET', skipAuth: true }
    );
    const p = parseNoAuthPaginatedList(raw);
    return {
      ...p,
      items: p.items.map((x) => {
        const o = x as Record<string, unknown>;
        return {
          id: Number(o.id),
          name: String(o.name ?? ''),
          viloyatId:
            o.viloyat_id != null && o.viloyat_id !== '' ? Number(o.viloyat_id) : undefined,
          tumanId: o.tuman_id != null && o.tuman_id !== '' ? Number(o.tuman_id) : undefined,
          status: o.status != null ? String(o.status) : undefined,
        };
      }),
    };
  }

  async getNoAuthRegions(): Promise<NoAuthRegion[]> {
    const raw = await this.contragentV1Request<Record<string, unknown>>('/noauth/regions', {
      method: 'GET',
      skipAuth: true,
    });
    const d = raw.data;
    const list = Array.isArray(d)
      ? d
      : Array.isArray((d as Record<string, unknown>)?.items)
        ? ((d as Record<string, unknown>).items as unknown[])
        : Array.isArray(raw.items)
          ? (raw.items as unknown[])
          : [];
    return list.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        id: Number(o.id),
        name: String(o.name ?? ''),
        code: o.code != null ? String(o.code) : undefined,
      };
    });
  }

  async getNoAuthDistricts(regionId?: number): Promise<NoAuthDistrict[]> {
    const qp = new URLSearchParams();
    if (regionId != null && Number.isFinite(regionId)) qp.set('region_id', String(regionId));
    const raw = await this.contragentV1Request<Record<string, unknown>>(
      `/noauth/districts${qp.toString() ? `?${qp}` : ''}`,
      { method: 'GET', skipAuth: true }
    );
    const d = raw.data;
    const list = Array.isArray(d)
      ? d
      : Array.isArray((d as Record<string, unknown>)?.items)
        ? ((d as Record<string, unknown>).items as unknown[])
        : Array.isArray(raw.items)
          ? (raw.items as unknown[])
          : [];
    return list.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        id: Number(o.id),
        name: String(o.name ?? ''),
        regionId: o.region_id != null && o.region_id !== '' ? Number(o.region_id) : undefined,
      };
    });
  }

  async getNoAuthProductNameById(productId: number): Promise<string | null> {
    if (!Number.isFinite(productId)) return null;
    try {
      const raw = await this.contragentV1Request<Record<string, unknown>>(
        `/noauth/products/${encodeURIComponent(String(productId))}`,
        { method: 'GET', skipAuth: true }
      );
      const d =
        raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
          ? (raw.data as Record<string, unknown>)
          : ({} as Record<string, unknown>);
      const n = d.name;
      return typeof n === 'string' && n.trim().length > 0 ? n : null;
    } catch {
      return null;
    }
  }

  async getNoAuthPunktNameById(punktId: number): Promise<string | null> {
    if (!Number.isFinite(punktId)) return null;
    try {
      let pageNum = 1;
      while (pageNum <= 50) {
        const res = await this.getNoAuthPunkts({ page: pageNum, limit: 100 });
        const row = res.items.find((p) => p.id === punktId);
        if (row?.name) return row.name;
        if (pageNum >= res.totalPages || res.items.length === 0) break;
        pageNum += 1;
      }
      return null;
    } catch {
      return null;
    }
  }

  async getNoAuthDistrictNameById(districtId: number): Promise<string | null> {
    if (!Number.isFinite(districtId)) return null;
    try {
      const rows = await this.getNoAuthDistricts();
      const row = rows.find((d) => d.id === districtId);
      return row?.name ?? null;
    } catch {
      return null;
    }
  }

  // Region methods
  async getRegions(params?: {
    page?: number;
    limit?: number;
    type?: 'region' | 'district' | 'mfy';
    parent?: string;
    status?: 'active' | 'inactive';
  }): Promise<RegionListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.parent) queryParams.append('parent', params.parent);
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request<RegionListResponse>(
      `/api/regions${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@auth_token');
    } catch (error) {
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('@auth_token', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@auth_token');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Statistics
  async getStatistics(params?: StatisticsParams): Promise<StatisticsResponse> {
    const query = params ? new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined) as [string, string][]
    ).toString() : '';
    
    return this.request<StatisticsResponse>(
      `/api/contragent/statistics${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  // Notification methods
  async getNotifications(params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificationListResponse> {
    // Vaqtincha o'chirilgan: notification API ga chiqmaymiz.
    return {
      success: true,
      data: [],
      pagination: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        total: 0,
        pages: 0,
      },
    };

    /*
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<NotificationListResponse>(
      `/api/contragents/notifications/list${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
    */
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    // Vaqtincha o'chirilgan: doim 0 qaytaramiz.
    return {
      success: true,
      data: { unreadCount: 0 },
    };

    /*
    return this.request<UnreadCountResponse>(
      '/api/contragents/notifications/unread-count',
      { method: 'GET' }
    );
    */
  }

  async markNotificationRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    void notificationId;
    return { success: true, message: 'Notification API vaqtincha o‘chirilgan' };

    /*
    return this.request<{ success: boolean; message: string }>(
      `/api/contragents/notifications/${notificationId}/read`,
      { method: 'POST' }
    );
    */
  }

  async markAllNotificationsRead(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Notification API vaqtincha o‘chirilgan' };

    /*
    return this.request<{ success: boolean; message: string }>(
      '/api/contragents/notifications/read-all',
      { method: 'POST' }
    );
    */
  }

  // Payment methods
  async getPaidPayments(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PaidPaymentsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const query = queryParams.toString();
    return this.request<PaidPaymentsResponse>(
      `/api/contragents/payments/paid${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async getUnpaidPayments(params?: {
    page?: number;
    limit?: number;
    isOverdue?: string;
  }): Promise<UnpaidPaymentsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isOverdue) queryParams.append('isOverdue', params.isOverdue);
    
    const query = queryParams.toString();
    return this.request<UnpaidPaymentsResponse>(
      `/api/contragents/payments/unpaid${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async getPaymentStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PaymentStatisticsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const query = queryParams.toString();
    return this.request<PaymentStatisticsResponse>(
      `/api/contragents/payments/statistics${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async getPaymentById(paymentId: string): Promise<PaymentDetailResponse> {
    return this.request<PaymentDetailResponse>(
      `/api/contragents/payments/${paymentId}`,
      { method: 'GET' }
    );
  }

  // Finance (New Finance System) APIs
  async getFinanceTransactions(params?: {
    type?: 'income' | 'expense';
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<FinanceTransactionsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<FinanceTransactionsResponse>(
      `/api/contragents/finance/transactions${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }

  async getFinanceBalance(): Promise<FinanceBalanceResponse> {
    return this.request<FinanceBalanceResponse>(
      `/api/contragents/finance/balance`,
      { method: 'GET' }
    );
  }

  async getZakladInfo(params?: {
    orderId?: string;
    contragentRequestId?: string;
  }): Promise<ZakladInfoResponse> {
    const queryParams = new URLSearchParams();
    if (params?.orderId) queryParams.append('orderId', params.orderId);
    if (params?.contragentRequestId) queryParams.append('contragentRequestId', params.contragentRequestId);
    
    const query = queryParams.toString();
    return this.request<ZakladInfoResponse>(
      `/api/contragents/finance/zaklad-info${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  }
}

// Statistics interfaces
export interface StatisticsSummary {
  totalOrders: number;
  pendingOrders: number;
  acceptedOrders: number;
  rejectedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  totalItems: number;
  acceptanceRate: string;
}

export interface MonthlyStatistics {
  year: number;
  month: number;
  orders: number;
  revenue: number;
}

export interface StatisticsData {
  summary: StatisticsSummary;
  monthly: MonthlyStatistics[];
}

export interface StatisticsResponse {
  success: boolean;
  data: StatisticsData;
}

export interface StatisticsParams {
  startDate?: string;
  endDate?: string;
}

// Notification interfaces
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'announcement' | 'promotion' | 'update';
  targetType: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

// Payment interfaces
export interface PaymentOrder {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  totalKpiPrice: number;
  createdAt: string;
}

export interface PaidBy {
  _id: string;
  name: string;
  phone: string;
}

export interface ContragentPayment {
  _id: string;
  contragent: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt: string | null;
  paidBy: PaidBy | null;
  notes: string | null;
  orders: PaymentOrder[];
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaidPaymentsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalAmount: number;
  totalPaidAmount: number;
  data: ContragentPayment[];
}

export interface UnpaidPaymentsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalAmount: number;
  totalUnpaidAmount: number;
  overdue: {
    totalAmount: number;
    count: number;
  };
  data: ContragentPayment[];
}

export interface PaymentStatisticsData {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  unpaid: {
    totalAmount: number;
    count: number;
  };
  paid: {
    totalAmount: number;
    count: number;
  };
  overdue: {
    totalAmount: number;
    count: number;
  };
}

export interface PaymentStatisticsResponse {
  success: boolean;
  data: PaymentStatisticsData;
}

export interface PaymentDetailResponse {
  success: boolean;
  data: ContragentPayment;
}

// Finance (New Finance System) interfaces
export interface FinanceTransactionOrder {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  totalOriginalPrice?: number;
}

export interface FinanceTransactionFromUser {
  userType: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
  } | string;
}

export interface FinanceTransactionToUser {
  userType: string;
  userId: string;
}

export interface FinanceTransaction {
  _id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  order?: FinanceTransactionOrder;
  contragentRequest?: string;
  zakladPercentage?: number;
  description: string;
  fromUser?: FinanceTransactionFromUser;
  toUser?: FinanceTransactionToUser;
  status: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransactionsSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  qarz: number;
  haq: number;
}

export interface FinanceTransactionsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: FinanceTransactionsSummary;
  data: FinanceTransaction[];
}

export interface FinanceBalanceData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  qarz: number;
  haq: number;
}

export interface FinanceBalanceResponse {
  success: boolean;
  data: FinanceBalanceData;
}

// Zaklad Info interfaces
export interface ZakladTransaction {
  _id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  order: {
    _id: string;
    orderNumber: string;
    totalPrice: number;
    totalOriginalPrice: number;
  };
  contragentRequest: string;
  zakladPercentage: number;
  fromUser: {
    userType: string;
    userId: {
      _id: string;
      name: string;
      phone: string;
    };
  };
  status: string;
  completedAt: string;
}

export interface PendingZaklad {
  orderId: string;
  orderNumber: string;
  contragentRequestId: string;
  potentialZakladAmount: number;
  deliveredAt: string;
}

export interface ZakladInfoSummary {
  totalZakladReceived: number;
  pendingZakladCount: number;
  pendingZakladTotal: number;
}

export interface ZakladInfoData {
  zakladTransactions: ZakladTransaction[];
  zakladTotal: number;
  pendingZaklads: PendingZaklad[];
  summary: ZakladInfoSummary;
}

export interface ZakladInfoResponse {
  success: boolean;
  data: ZakladInfoData;
}

export const apiService = new ApiService();




