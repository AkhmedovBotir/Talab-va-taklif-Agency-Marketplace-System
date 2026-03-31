import { Platform } from 'react-native';

/** Web: brauzer `localhost` da ochilganda */
const API_HOST_WEB = 'http://localhost:8081';
/** Mobil qurilma: kompyuter IP (tarmoqda backend) */
const API_HOST_NATIVE = 'http://192.168.1.6:8081';

export function getApiBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    // LAN orqali (masalan http://192.168.1.6:8084) — API ham shu mashinada, 8081
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:8081/api/v1`;
    }
    // Ba’zi dev sozlamalarda frontend boshqa portda — baribir backend 8081
    if (port && port !== '8081') {
      return `${protocol}//${hostname}:8081/api/v1`;
    }
  }
  const host = Platform.OS === 'web' ? API_HOST_WEB : API_HOST_NATIVE;
  return `${host}/api/v1`;
}

/** Global snackbar: server `message` maydoni (xatoliklar uchun) */
export type ApiErrorNotifier = (message: string, status: number) => void;

let apiErrorNotifier: ApiErrorNotifier | null = null;

export function setApiErrorNotifier(fn: ApiErrorNotifier | null) {
  apiErrorNotifier = fn;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  data: {
    token: string;
    punkt: Punkt;
  };
}

export interface PunktAuthMessageResponse {
  message: string;
}

export interface PunktAuthSetPasswordResponse {
  message: string;
  data: {
    token: string;
    punkt: Punkt;
  };
}

export interface PunktMeProfileResponse {
  message?: string;
  data: {
    punkt: Punkt;
  };
}

/** `/punkts/me/orders` — markaziy yig‘uvchi (marketplace) */
export type PunktAcceptanceStatus =
  | 'none'
  | 'no_punkt'
  | 'inbox'
  | 'rejected'
  | 'contragent_requests_created';

/** GET buyurtmada `orderembed` — tayinlangan agent kartasi */
export interface PunktMeAssignedAgent {
  id: number;
  name: string;
  viloyat_id?: number;
  tuman_id?: number;
  mfy_id?: number;
  phone?: string;
  status?: string;
  password_setup_allowed?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Qator / so‘rovda joylashgan kontragent (GET embed) */
export interface PunktMeEmbeddedContragent {
  id: number;
  name?: string;
  inn?: string;
  region_id?: number;
  district_id?: number;
  mfy_id?: number;
  phone?: string;
  logo?: string | null;
  activity_type_id?: number | null;
  status?: string;
}

export interface PunktMeOrderListItem {
  id: number;
  marketplace_status: string;
  punkt_acceptance_status: PunktAcceptanceStatus | string;
  total_amount: number;
  routing_district_id: number;
  created_at: string;
  items_count: number;
  /** ISO8601 yoki bo‘sh qator */
  punkt_collected_at?: string;
  punkt_ready_at?: string;
  /** Yangi API: to‘liq agent obyekti */
  assigned_agent?: PunktMeAssignedAgent | null;
  /** Eski / qo‘shimcha maydon */
  assigned_agent_id?: number | null;
  agent_declared_payment_to_punkt_at?: string;
  punkt_confirmed_agent_payment_at?: string;
  punkt_post_payment_delivered_at?: string;
  punkt_contragent_remainder_handed_over_at?: string;
}

/** Tayinlangan agent `id` — avvalo `assigned_agent.id`, keyin `assigned_agent_id` */
export function punktOrderAssignedAgentId(order: {
  assigned_agent?: PunktMeAssignedAgent | null;
  assigned_agent_id?: number | null;
}): number | null {
  const fromEmbed = order.assigned_agent?.id;
  if (typeof fromEmbed === 'number' && !Number.isNaN(fromEmbed) && fromEmbed > 0) {
    return fromEmbed;
  }
  const legacy = order.assigned_agent_id;
  if (legacy != null && Number(legacy) > 0) return Number(legacy);
  return null;
}

export function punktOrderHasAssignedAgent(order: {
  assigned_agent?: PunktMeAssignedAgent | null;
  assigned_agent_id?: number | null;
}): boolean {
  return punktOrderAssignedAgentId(order) != null;
}

/** Batafsil / ro‘yxat — agent qatori matni */
export function punktOrderAssignedAgentDisplay(order: {
  assigned_agent?: PunktMeAssignedAgent | null;
  assigned_agent_id?: number | null;
}): string {
  const id = punktOrderAssignedAgentId(order);
  if (id == null) return '—';
  const a = order.assigned_agent;
  if (a?.name) {
    const parts: string[] = [a.name];
    if (a.phone) parts.push(a.phone);
    parts.push(`ID ${id}`);
    return parts.join(' · ');
  }
  return `ID ${id}`;
}

export function punktLineItemContragentLabel(item: PunktMeOrderLineItem): string | null {
  const c = item.contragent;
  if (c && typeof c === 'object') {
    if (typeof c.name === 'string' && c.name.trim()) {
      return `${c.name.trim()} (#${c.id})`;
    }
    if (typeof c.id === 'number') {
      return `Kontragent #${c.id}`;
    }
  }
  if (item.contragent_id != null) {
    return `Kontragent ${item.contragent_id}`;
  }
  return null;
}

export function punktContragentRequestLabel(r: PunktMeContragentLineRequest): string {
  const c = r.contragent;
  if (c && typeof c === 'object') {
    if (typeof c.name === 'string' && c.name.trim()) {
      return `${c.name.trim()} (#${c.id})`;
    }
    if (typeof c.id === 'number') {
      return `Kontragent #${c.id}`;
    }
  }
  if (r.contragent_id != null) {
    return String(r.contragent_id);
  }
  return '—';
}

export interface PunktMeOrdersPage {
  items: PunktMeOrderListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PunktMeOrdersListResponse {
  message?: string;
  data: PunktMeOrdersPage;
}

export type PunktMeContragentLineRequestStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'delivered'
  | 'rejected'
  | string;

export interface PunktMeContragentLineRequest {
  id: number;
  order_item_id: number;
  contragent?: PunktMeEmbeddedContragent | null;
  contragent_id?: number;
  routing_district_id: number;
  status: PunktMeContragentLineRequestStatus;
}

export type PunktMeOrderLineItem = {
  id: number;
  product_id?: number;
  contragent?: PunktMeEmbeddedContragent | null;
  contragent_id?: number;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  line_total?: number;
  contragent_payout_percent?: number | null;
  contragent_payout_amount?: number | null;
} & Record<string, unknown>;

export interface PunktMeOrderDetail extends PunktMeOrderListItem {
  user_id?: number;
  address_mode?: string;
  snap_area_name?: string;
  snap_region_id?: number;
  snap_district_id?: number;
  snap_mfy_id?: number;
  primary_custom_address?: string;
  extra_phone?: string;
  address_note?: string;
  items?: PunktMeOrderLineItem[];
  contragent_line_requests?: PunktMeContragentLineRequest[];
}

export interface PunktMeContragentPayoutItem {
  order_item_id: number;
  contragent_payout_percent: number;
}

export interface PunktMeContragentPayoutsBody {
  items: PunktMeContragentPayoutItem[];
}

export interface PunktMeAssignAgentBody {
  agent_id: number;
}

export interface PunktMeAgentListItem {
  id: number;
  name: string;
  viloyat_id: number;
  tuman_id: number;
  mfy_id: number;
  phone: string;
  status: string;
}

export interface PunktMeAgentsResponse {
  message?: string;
  data: PunktMeAgentListItem[];
}

export interface PunktMeOrderDetailResponse {
  message?: string;
  data: PunktMeOrderDetail;
}

export interface Punkt {
  _id: string;
  name: string;
  phone: string;
  viloyat: Region;
  tuman: Region;
  status: string;
  createdAt: string;
  updatedAt: string;
  id?: number;
  viloyat_id?: number;
  tuman_id?: number;
  password_setup_allowed?: boolean;
  has_password?: boolean;
}

export interface PunktSelection {
  _id: string;
  id?: number;
  name: string;
  phone: string;
  viloyat: Region;
  tuman: Region | null;
  viloyat_id?: number;
  tuman_id?: number;
  status: 'active' | 'inactive';
}

export interface Agent {
  _id: string;
  name: string;
  phone: string;
  viloyat?: Region;
  tuman?: Region | null;
  mfy?: Region | null;
  status: string;
}

export interface AgentSelection {
  _id: string;
  id?: number;
  name: string;
  phone: string;
  viloyat?: Region;
  tuman?: Region | null;
  mfy?: Region | null;
  viloyat_id?: number;
  tuman_id?: number;
  mfy_id?: number;
  status: 'active' | 'inactive';
}

export interface Region {
  _id: string;
  name: string;
  type: string;
  code: string;
}

/** Backend `id` / `viloyat_id` / `tuman_id` qaytsa, ilova ichidagi `Punkt` shakliga aylantiradi */
export function normalizePunktFromApi(raw: Record<string, unknown> | null | undefined): Punkt {
  if (!raw || typeof raw !== 'object') {
    return {
      _id: '',
      name: '',
      phone: '',
      viloyat: { _id: '', name: '—', type: 'viloyat', code: '' },
      tuman: { _id: '', name: '—', type: 'tuman', code: '' },
      status: '',
      createdAt: '',
      updatedAt: '',
    };
  }
  const r = raw as Record<string, unknown>;
  const hasNestedRegions =
    typeof r.viloyat === 'object' &&
    r.viloyat !== null &&
    typeof (r.viloyat as Region)._id === 'string' &&
    (r.viloyat as Region)._id !== '';
  if (r._id != null && hasNestedRegions) {
    return r as unknown as Punkt;
  }
  const id = r.id ?? r._id;
  const vid = r.viloyat_id;
  const tid = r.tuman_id;
  const vObj = r.viloyat as Record<string, unknown> | undefined;
  const tObj = r.tuman as Record<string, unknown> | undefined;
  const viloyatName =
    typeof vObj === 'object' && vObj && typeof vObj.name === 'string' ? vObj.name : '';
  const tumanName =
    typeof tObj === 'object' && tObj && typeof tObj.name === 'string' ? tObj.name : '';

  return {
    _id: String(id ?? ''),
    id: typeof r.id === 'number' ? r.id : undefined,
    name: String(r.name ?? ''),
    phone: String(r.phone ?? ''),
    viloyat:
      typeof vObj === 'object' && vObj && vObj._id != null
        ? (vObj as unknown as Region)
        : {
            _id: String(vid ?? ''),
            name: viloyatName || (vid != null ? `Viloyat #${vid}` : '—'),
            type: 'viloyat',
            code: '',
          },
    tuman:
      typeof tObj === 'object' && tObj && tObj._id != null
        ? (tObj as unknown as Region)
        : {
            _id: String(tid ?? ''),
            name: tumanName || (tid != null ? `Tuman #${tid}` : '—'),
            type: 'tuman',
            code: '',
          },
    status: String(r.status ?? ''),
    createdAt: String(r.created_at ?? r.createdAt ?? ''),
    updatedAt: String(r.updated_at ?? r.updatedAt ?? ''),
    password_setup_allowed: r.password_setup_allowed as boolean | undefined,
    has_password: r.has_password as boolean | undefined,
    viloyat_id: typeof vid === 'number' ? vid : undefined,
    tuman_id: typeof tid === 'number' ? tid : undefined,
  };
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    name: string;
    phone: string;
  };
  items: OrderItem[];
  totalPrice: number;
  totalOriginalPrice: number;
  totalKpiPrice: number;
  itemCount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'confirmed_by_punkt' | 'requested_to_contragent' | 'accepted_by_contragent' | 'delivered_to_punkt' | 'assigned_to_agent' | 'confirmed_by_agent' | 'confirmed_by_customer';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cash' | 'card';
  deliveryViloyat: Region;
  deliveryTuman: Region | null;
  deliveryMfy: Region | null;
  deliveryNote: string;
  phoneNumber: string;
  punktRequests: PunktRequest[];
  punktToPunktRequests?: PunktToPunktRequest[];
  contragentRequests?: Array<{
    contragentId: Contragent | string;
    status: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
    requestedAt: string;
  }>;
  confirmedByPunkt: Punkt | null;
  punktStatus: 'pending' | 'confirmed' | 'rejected' | 'requested';
  assignedToAgent: Agent | null;
  assignedByPunkt: Punkt | null;
  assignedAt: string | null;
  currentPunkt?: string | Punkt | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    originalPrice: number;
    contragent?: {
      _id: string;
      name: string;
      inn?: string;
      phone?: string;
      status?: string;
      contragentLevel?: string;
      logo?: string;
      viloyat?: Region;
      tuman?: Region | null;
      mfy?: Region | null;
    };
    category?: {
      _id: string;
      name: string;
      slug: string;
    };
    deliveryRegions?: Array<{
      viloyat: Region;
      tuman: Region;
    }>;
  } | string; // Product object yoki ID (string) bo'lishi mumkin (backward compatibility)
  quantity: number;
  price: number;
  originalPrice: number;
  productModel?: string; // Agar product string bo'lsa (backward compatibility)
  productType?: string; // Agar product string bo'lsa (backward compatibility)
}

export interface PunktRequest {
  punktId: Punkt | string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  respondedAt: string | null;
}

export interface PunktToPunktRequest {
  fromPunktId: Punkt | string;
  toPunktId: Punkt | string;
  status: 'pending' | 'accepted' | 'rejected' | 'delivered';
  requestedAt: string;
  respondedAt: string | null;
  deliveredAt: string | null;
}

export interface OrdersResponse {
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
  data: Order;
}

export interface ConfirmOrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface RequestToPunktsRequest {
  tumanIds: string[];
}

export interface RequestToPunktsResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    orderNumber: string;
    requestedPunkts: Punkt[];
    punktRequests: PunktRequest[];
  };
}

export interface RequestsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Order[];
}

export interface RespondToRequestRequest {
  response: 'accepted' | 'rejected';
}

export interface RespondToRequestResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

export interface PunktsSelectionResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: PunktSelection[];
}

export interface AgentsSelectionResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: AgentSelection[];
}

interface NoauthPaginatedResponse<T> {
  message?: string;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  error?: unknown;
}

interface NoauthPunktItem {
  id: number;
  name: string;
  viloyat_id?: number;
  tuman_id?: number;
  status?: 'active' | 'inactive' | string;
}

interface NoauthAgentItem {
  id: number;
  name: string;
  phone?: string;
  viloyat_id?: number;
  tuman_id?: number;
  mfy_id?: number;
  status?: 'active' | 'inactive' | string;
}

interface NoauthArrayResponse<T> {
  message?: string;
  data: T[];
  error?: unknown;
}

interface NoauthRegionRef {
  id: number;
  name: string;
}

interface NoauthDistrictRef {
  id: number;
  name: string;
  region_id?: number;
}

interface NoauthMfyRef {
  id: number;
  name: string;
  district_id?: number;
}

interface NoauthMarketplaceUserRef {
  id: number;
  first_name?: string;
  last_name?: string;
}

export interface AssignToAgentRequest {
  agentId: string;
}

export interface AssignToAgentResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface Contragent {
  _id: string;
  name: string;
  inn?: string;
  phone?: string;
  viloyat?: Region;
  tuman?: Region | null;
  mfy?: Region | null;
  status?: string;
  isInRegion?: boolean;
  products?: Array<{
    _id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  hasRequest?: boolean;
  requestStatus?: string | null;
  requestedAt?: string | null;
}

export interface RequestToContragentRequest {
  contragentId: string;
}

export interface RequestToContragentResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    contragentRequests: Array<{
      contragentId: Contragent;
      status: string;
      requestedAt: string;
    }>;
  };
}

export interface RequestToPunktRequest {
  toPunktId: string;
}

export interface RequestToPunktResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface ReceiveFromPunktResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface SendToPunktRequest {
  toPunktId: string;
}

export interface SendToPunktResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface ReceiveFromContragentResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface PunktToPunktRequestsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Order[];
}

export interface RespondToPunktRequestRequest {
  response: 'accepted' | 'rejected';
}

export interface RespondToPunktRequestResponse {
  success: boolean;
  message: string;
  data: Order;
}

export type PunktTransferStatus =
  | 'sent'
  | 'accepted_by_target'
  | 'returned_to_source'
  | 'received_by_source';

export interface PunktTransfer {
  id: number;
  order_id: number;
  source_punkt_id: number;
  target_punkt_id: number;
  status: PunktTransferStatus;
  note?: string;
  order_item_ids: number[];
  sent_at?: string;
  target_accepted_at?: string;
  target_returned_at?: string;
  source_received_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PunktTransfersListResponse {
  message?: string;
  data: {
    items: PunktTransfer[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface PunktTransferResponse {
  message?: string;
  data: PunktTransfer;
}

export interface CreatePunktTransferBody {
  target_punkt_id: number;
  note?: string;
  order_item_ids?: number[];
}

export interface PunktTransferActionResponse {
  message?: string;
  data?: PunktTransfer;
}

export interface GetOrderContragentsResponse {
  success: boolean;
  data: {
    orderId: string;
    orderNumber: string;
    contragents: Contragent[];
  };
}

export interface AutoRouteOrderResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    orderNumber: string;
    analysis: {
      ownTumanContragents: Array<{
        contragent: Contragent;
        products: Array<{
          _id: string;
          name: string;
          quantity: number;
          price: number;
        }>;
      }>;
      otherTumanPunkts: Array<{
        tuman: Region;
        contragents: Array<{
          contragent: Contragent;
          products: Array<{
            _id: string;
            name: string;
            quantity: number;
            price: number;
          }>;
        }>;
      }>;
      allProductsCovered: boolean;
    };
    routingResults: {
      ownTumanRequests: Array<{
        contragentId: string;
        contragentName: string;
        status: string;
      }>;
      otherTumanRequests: Array<{
        tumanId: string;
        tumanName: string;
        punktId: string;
        punktName: string;
        status: string;
      }>;
      errors: string[];
    };
    order: Order;
  };
}

// KPI Bonus Interfaces
export interface KpiSummaryResponse {
  success: boolean;
  data: {
    punkt: {
      _id: string;
      name: string;
      phone: string;
    };
    summary: {
      totalTransactions: number;
      totalAmount: number;
      paidAmount: number;
      unpaidAmount: number;
    };
  };
}

export interface KpiTransaction {
  _id: string;
  order: {
    _id: string;
    orderNumber: string;
    status: string;
    totalPrice: number;
  };
  orderItem: {
    product: {
      _id: string;
      name: string;
      price: number;
      productCode: string;
    };
    quantity: number;
    price: number;
    kpiBonusPercent: number;
  };
  distributionConfig: {
    _id: string;
    name: string;
  };
  recipients: {
    fromPunkt?: {
      _id: string;
      name: string;
    };
    toPunkt?: {
      _id: string;
      name: string;
    };
  };
  orderStatus: string;
  isPaid: boolean;
  punktAmount: number;
  bonusType: 'regular' | 'from_punkt' | 'to_punkt';
  createdAt: string;
}

export interface KpiTransactionsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: KpiTransaction[];
}

export interface KpiBalanceResponse {
  success: boolean;
  data: {
    date: string;
    totals: {
      totalTransactions: number;
      totalAmount: number;
      paidAmount: number;
      unpaidAmount: number;
      paidTransactions: number;
      unpaidTransactions: number;
    };
  };
}

export interface KpiDailyReportItem {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  paidTransactions: number;
  unpaidTransactions: number;
}

export interface KpiDailyReportResponse {
  success: boolean;
  data: {
    range: {
      startDate: string;
      endDate: string;
    };
    report: KpiDailyReportItem[];
  };
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  targetType: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Notification[];
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
}

// Payment Interfaces
export interface PayZakladRequest {
  orderId: string;
  contragentRequestId: string;
  zakladPercentage: number;
}

export interface PaymentTransaction {
  _id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  order?: {
    _id: string;
    orderNumber: string;
    totalPrice: number;
  };
  contragentRequest?: string;
  zakladPercentage?: number;
  fromUser: {
    userType: string;
    userId: string | {
      _id: string;
      name: string;
      phone?: string;
      inn?: string;
    };
  };
  toUser: {
    userType: string;
    userId: string | {
      _id: string;
      name: string;
      phone?: string;
      inn?: string;
    };
  };
  status: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayZakladResponse {
  success: boolean;
  message: string;
  data: {
    punktTransaction: PaymentTransaction;
    contragentTransaction: PaymentTransaction;
  };
}

export interface PayFinalPaymentRequest {
  orderId: string;
  contragentRequestId: string;
}

export interface PayFinalPaymentResponse {
  success: boolean;
  message: string;
  data: PaymentTransaction;
}

export interface PayProfitRequest {
  orderId: string;
  contragentRequestId: string;
}

export interface PayProfitResponse {
  success: boolean;
  message: string;
  data: PaymentTransaction;
}

export interface TransactionsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    qarz: number;
    haq: number;
  };
  data: PaymentTransaction[];
}

export interface BalanceResponse {
  success: boolean;
  data: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    qarz: number;
    haq: number;
  };
}

// Orders for Zaklad
export interface ContragentRequestForZaklad {
  _id: string;
  contragentId: {
    _id: string;
    name: string;
    inn: string;
    phone: string;
  };
  status: string;
  deliveredToPunktAt: string;
  potentialZakladAmount: number;
}

export interface OrderForZaklad {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  totalOriginalPrice: number;
  status: string;
  contragentRequestsForZaklad: ContragentRequestForZaklad[];
}

export interface OrdersForZakladResponse {
  success: boolean;
  count: number;
  data: OrderForZaklad[];
}

class ApiService {
  private token: string | null = null;
  private onDeviceErrorCallback: (() => void) | null = null;
  private isLoggingOut: boolean = false;
  private isValidatingToken: boolean = false;
  private noauthRegionsCache: NoauthRegionRef[] | null = null;
  private noauthDistrictsCache: NoauthDistrictRef[] | null = null;
  private noauthMfysCache: NoauthMfyRef[] | null = null;
  private noauthRegionsPromise: Promise<NoauthRegionRef[]> | null = null;
  private noauthDistrictsPromise: Promise<NoauthDistrictRef[]> | null = null;
  private noauthMfysPromise: Promise<NoauthMfyRef[]> | null = null;
  private noauthMarketplaceUsersCache: NoauthMarketplaceUserRef[] | null = null;
  private noauthMarketplaceUsersPromise: Promise<NoauthMarketplaceUserRef[]> | null = null;

  setOnDeviceError(callback: () => void) {
    this.onDeviceErrorCallback = callback;
  }

  private getToken(): string | null {
    return this.token;
  }

  private async getNoauthRegions(): Promise<NoauthRegionRef[]> {
    if (this.noauthRegionsCache) return this.noauthRegionsCache;
    if (this.noauthRegionsPromise) return this.noauthRegionsPromise;
    this.noauthRegionsPromise = this.request<NoauthArrayResponse<NoauthRegionRef>>('/noauth/regions')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        this.noauthRegionsCache = list;
        return list;
      })
      .finally(() => {
        this.noauthRegionsPromise = null;
      });
    return this.noauthRegionsPromise;
  }

  private async getNoauthDistricts(): Promise<NoauthDistrictRef[]> {
    if (this.noauthDistrictsCache) return this.noauthDistrictsCache;
    if (this.noauthDistrictsPromise) return this.noauthDistrictsPromise;
    this.noauthDistrictsPromise = this.request<NoauthArrayResponse<NoauthDistrictRef>>('/noauth/districts')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        this.noauthDistrictsCache = list;
        return list;
      })
      .finally(() => {
        this.noauthDistrictsPromise = null;
      });
    return this.noauthDistrictsPromise;
  }

  private async getNoauthMfys(): Promise<NoauthMfyRef[]> {
    if (this.noauthMfysCache) return this.noauthMfysCache;
    if (this.noauthMfysPromise) return this.noauthMfysPromise;
    this.noauthMfysPromise = this.request<NoauthArrayResponse<NoauthMfyRef>>('/noauth/mfys')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        this.noauthMfysCache = list;
        return list;
      })
      .finally(() => {
        this.noauthMfysPromise = null;
      });
    return this.noauthMfysPromise;
  }

  private async getNoauthMarketplaceUsers(): Promise<NoauthMarketplaceUserRef[]> {
    if (this.noauthMarketplaceUsersCache) return this.noauthMarketplaceUsersCache;
    if (this.noauthMarketplaceUsersPromise) return this.noauthMarketplaceUsersPromise;

    this.noauthMarketplaceUsersPromise = (async () => {
      const all: NoauthMarketplaceUserRef[] = [];
      let page = 1;
      const limit = 200;
      let totalPages = 1;

      while (page <= totalPages) {
        const res = await this.request<NoauthPaginatedResponse<NoauthMarketplaceUserRef>>(
          `/noauth/marketplace-users?page=${page}&limit=${limit}`
        );
        const items = Array.isArray(res.data.items) ? res.data.items : [];
        all.push(...items);
        totalPages = Number(res.data.total_pages || 1);
        page += 1;
      }

      this.noauthMarketplaceUsersCache = all;
      return all;
    })().finally(() => {
      this.noauthMarketplaceUsersPromise = null;
    });

    return this.noauthMarketplaceUsersPromise;
  }

  async getNoauthRegionNameById(regionId?: number | null): Promise<string | null> {
    if (typeof regionId !== 'number' || regionId <= 0) return null;
    try {
      const regions = await this.getNoauthRegions();
      const match = regions.find((r) => r.id === regionId);
      return match?.name || null;
    } catch {
      return null;
    }
  }

  async getNoauthDistrictNameById(districtId?: number | null): Promise<string | null> {
    if (typeof districtId !== 'number' || districtId <= 0) return null;
    try {
      const districts = await this.getNoauthDistricts();
      const match = districts.find((d) => d.id === districtId);
      return match?.name || null;
    } catch {
      return null;
    }
  }

  async getNoauthMfyNameById(mfyId?: number | null): Promise<string | null> {
    if (typeof mfyId !== 'number' || mfyId <= 0) return null;
    try {
      const mfys = await this.getNoauthMfys();
      const match = mfys.find((m) => m.id === mfyId);
      return match?.name || null;
    } catch {
      return null;
    }
  }

  async getNoauthMarketplaceUserNameById(userId?: number | null): Promise<string | null> {
    if (typeof userId !== 'number' || userId <= 0) return null;
    try {
      const users = await this.getNoauthMarketplaceUsers();
      const user = users.find((u) => u.id === userId);
      if (!user) return null;
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      return fullName || null;
    } catch {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    ctx?: { skipErrorNotifier?: boolean }
  ): Promise<T> {
    // If already logging out, don't make new requests
    if (this.isLoggingOut) {
      const error: any = new Error('Logging out...');
      error.status = 401;
      throw error;
    }

    const token = this.getToken();
    const url = `${getApiBaseUrl()}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const rawText = await response.text();
      let data: Record<string, unknown> = {};
      try {
        if (rawText) {
          data = JSON.parse(rawText) as Record<string, unknown>;
        }
      } catch {
        data = {};
      }

      if (!response.ok) {
        const dataMsg = data.data as Record<string, unknown> | undefined;
        const errorMessage =
          (typeof data.message === 'string' && data.message) ||
          (typeof data.error === 'string' && data.error) ||
          (dataMsg && typeof dataMsg.message === 'string' && dataMsg.message) ||
          '';
        
        // Check if it's a device-related error (403 with device message)
        if (response.status === 403 && errorMessage && 
            (errorMessage.toLowerCase().includes('qurilma') || 
             errorMessage.toLowerCase().includes('device') ||
             errorMessage.toLowerCase().includes('nofaol'))) {
          // Don't trigger logout for login endpoint or device verification endpoints
          const isLoginEndpoint =
            endpoint.includes('/punkts/auth/') ||
            endpoint.includes('/login') ||
            endpoint.includes('/password-setup') ||
            endpoint.includes('/device-verification');
          if (!isLoginEndpoint && this.onDeviceErrorCallback && !this.isLoggingOut) {
            this.isLoggingOut = true;
            // Trigger logout callback immediately (synchronously if possible)
            try {
              this.onDeviceErrorCallback();
            } catch (error) {
              console.error('Error in logout callback:', error);
            }
            // Don't throw error after logout is triggered
            const error: any = new Error('Logging out...');
            error.status = 403;
            throw error;
          }
        }
        
        // Check if it's an authentication error (401) - like "Punkt topilmadi" or "Token topilmadi"
        if (response.status === 401) {
          // Don't trigger logout for login endpoint or password setup endpoints
          const isAuthEndpoint =
            endpoint.includes('/punkts/auth/') ||
            endpoint.includes('/punkts/me/change-password') ||
            endpoint.includes('/login') ||
            endpoint.includes('/password-setup') ||
            endpoint.includes('/device-verification');
          
          // Don't trigger logout during token validation (app startup)
          // This allows token validation during app startup without triggering logout
          if (!isAuthEndpoint && !this.isValidatingToken && this.onDeviceErrorCallback && !this.isLoggingOut) {
            this.isLoggingOut = true;
            // Trigger logout callback immediately (synchronously if possible)
            try {
              this.onDeviceErrorCallback();
            } catch (error) {
              console.error('Error in logout callback:', error);
            }
            // Don't throw error after logout is triggered
            const error: any = new Error('Logging out...');
            error.status = 401;
            throw error;
          }
        }

        const userMessage =
          (typeof errorMessage === 'string' && errorMessage.trim()) ||
          `So'rov bajarilmadi (${response.status})`;

        const shouldNotifySnack =
          !!userMessage &&
          userMessage !== 'Logging out...' &&
          !this.isLoggingOut &&
          !this.isValidatingToken &&
          !ctx?.skipErrorNotifier;
        if (shouldNotifySnack) {
          apiErrorNotifier?.(userMessage, response.status);
        }

        const error: any = new Error(userMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data as T;
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      const hasHttpStatus = typeof err?.status === 'number';
      if (
        !this.isLoggingOut &&
        !this.isValidatingToken &&
        !hasHttpStatus &&
        error instanceof Error &&
        error.message !== 'Logging out...'
      ) {
        apiErrorNotifier?.(
          'Serverga ulanib bo\'lmadi. Internet yoki manzilni tekshiring.',
          0
        );
      }
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await this.request<LoginResponse>('/punkts/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.data?.punkt) {
      res.data.punkt = normalizePunktFromApi(res.data.punkt as unknown as Record<string, unknown>);
    }
    return res;
  }

  async punktAuthSendCode(body: { phone: string }): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>('/punkts/auth/send-code', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async punktAuthVerifyCode(body: { phone: string; code: string }): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>('/punkts/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async punktAuthResendCode(body: { phone: string }): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>('/punkts/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async punktAuthSetPassword(body: { phone: string; password: string }): Promise<PunktAuthSetPasswordResponse> {
    const res = await this.request<PunktAuthSetPasswordResponse>('/punkts/auth/set-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.data?.punkt) {
      res.data.punkt = normalizePunktFromApi(res.data.punkt as unknown as Record<string, unknown>);
    }
    return res;
  }

  async getPunktMeProfile(): Promise<PunktMeProfileResponse> {
    const res = await this.request<PunktMeProfileResponse>('/punkts/me/profile', { method: 'GET' });
    if (res.data?.punkt) {
      res.data.punkt = normalizePunktFromApi(res.data.punkt as unknown as Record<string, unknown>);
    }
    return res;
  }

  async changePunktPassword(body: { old_password: string; new_password: string }): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>('/punkts/me/change-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getPunktMeOrdersToday(params?: { page?: number; limit?: number }): Promise<PunktMeOrdersListResponse> {
    const queryParams = new URLSearchParams();
    const page = params?.page ?? 1;
    const limit = Math.min(params?.limit ?? 20, 100);
    queryParams.append('page', String(page));
    queryParams.append('limit', String(limit));
    return this.request<PunktMeOrdersListResponse>(
      `/punkts/me/orders/today?${queryParams.toString()}`
    );
  }

  async getPunktMeOrdersHistory(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PunktMeOrdersListResponse> {
    const queryParams = new URLSearchParams();
    const page = params?.page ?? 1;
    const limit = Math.min(params?.limit ?? 20, 100);
    queryParams.append('page', String(page));
    queryParams.append('limit', String(limit));
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    return this.request<PunktMeOrdersListResponse>(
      `/punkts/me/orders/history?${queryParams.toString()}`
    );
  }

  async getPunktMeOrderById(orderId: string | number): Promise<PunktMeOrderDetailResponse> {
    return this.request<PunktMeOrderDetailResponse>(`/punkts/me/orders/${orderId}`, {
      method: 'GET',
    });
  }

  async acceptPunktMeOrder(orderId: string | number): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>(`/punkts/me/orders/${orderId}/accept`, {
      method: 'POST',
    });
  }

  async rejectPunktMeOrder(orderId: string | number): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>(`/punkts/me/orders/${orderId}/reject`, {
      method: 'PATCH',
    });
  }

  async punktMeOrderCollected(orderId: string | number): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>(
      `/punkts/me/orders/${orderId}/punkt-collected`,
      { method: 'POST' }
    );
  }

  async punktMeOrderReady(orderId: string | number): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>(`/punkts/me/orders/${orderId}/punkt-ready`, {
      method: 'POST',
    });
  }

  async setPunktMeOrderContragentPayouts(
    orderId: string | number,
    body: PunktMeContragentPayoutsBody
  ): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>(
      `/punkts/me/orders/${orderId}/contragent-payouts`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );
  }

  async assignPunktMeOrderAgent(
    orderId: string | number,
    body: PunktMeAssignAgentBody
  ): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>(
      `/punkts/me/orders/${orderId}/assign-agent`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  }

  async confirmPunktMeOrderAgentPayment(
    orderId: string | number
  ): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>(
      `/punkts/me/orders/${orderId}/confirm-agent-payment`,
      { method: 'POST' }
    );
  }

  async punktMeOrderPostPaymentDelivered(
    orderId: string | number
  ): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>(
      `/punkts/me/orders/${orderId}/post-payment-delivered`,
      { method: 'POST' }
    );
  }

  async punktMeOrderHandoverRemainderToContragents(
    orderId: string | number
  ): Promise<PunktAuthMessageResponse> {
    return this.request<PunktAuthMessageResponse>(
      `/punkts/me/orders/${orderId}/handover-remainder-to-contragents`,
      { method: 'POST' }
    );
  }

  async getPunktMeAgents(mfyId?: number): Promise<PunktMeAgentsResponse> {
    const q = new URLSearchParams();
    if (mfyId != null && mfyId > 0) {
      q.append('mfy_id', String(mfyId));
    }
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return this.request<PunktMeAgentsResponse>(`/punkts/me/agents${suffix}`, {
      method: 'GET',
    });
  }

  async getOrders(params?: {
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    orderNumber?: string;
    startDate?: string;
    endDate?: string;
    minTotalPrice?: number;
    maxTotalPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<OrdersResponse>(`/punkt/orders${query ? `?${query}` : ''}`);
  }

  async getTodayOrders(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<OrdersResponse>(`/punkt/orders/today${query ? `?${query}` : ''}`);
  }

  async getOrdersHistory(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<OrdersResponse>(`/punkt/orders/history${query ? `?${query}` : ''}`);
  }

  async getOrderById(id: string): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/punkt/orders/${id}`);
  }

  async confirmOrder(id: string): Promise<ConfirmOrderResponse> {
    return this.request<ConfirmOrderResponse>(`/punkt/orders/${id}/confirm`, {
      method: 'POST',
    });
  }

  async autoRouteOrder(id: string): Promise<AutoRouteOrderResponse> {
    return this.request<AutoRouteOrderResponse>(`/punkt/orders/${id}/auto-route`, {
      method: 'POST',
    });
  }

  async requestToPunkts(
    id: string,
    data: RequestToPunktsRequest
  ): Promise<RequestToPunktsResponse> {
    return this.request<RequestToPunktsResponse>(
      `/punkt/orders/${id}/request-to-punkts`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getRequests(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<RequestsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<RequestsResponse>(`/punkt/requests${query ? `?${query}` : ''}`);
  }

  async respondToRequest(
    orderId: string,
    data: RespondToRequestRequest
  ): Promise<RespondToRequestResponse> {
    return this.request<RespondToRequestResponse>(
      `/punkt/requests/${orderId}/respond`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getPunktsForSelection(params?: {
    status?: 'active' | 'inactive';
    viloyat?: string;
    tuman?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PunktsSelectionResponse> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 100;
    const queryText = params?.search?.trim() || undefined;

    const q = new URLSearchParams();
    q.append('page', String(page));
    q.append('limit', String(limit));
    if (queryText) q.append('q', queryText);

    const res = await this.request<NoauthPaginatedResponse<NoauthPunktItem>>(
      `/noauth/punkts?${q.toString()}`
    );

    let mapped: PunktSelection[] = res.data.items.map((item) => ({
      _id: String(item.id),
      id: item.id,
      name: item.name ?? '',
      phone: '',
      viloyat_id: item.viloyat_id,
      tuman_id: item.tuman_id,
      viloyat: {
        _id: String(item.viloyat_id ?? ''),
        name: item.viloyat_id != null ? `Viloyat #${item.viloyat_id}` : '—',
        type: 'viloyat',
        code: '',
      },
      tuman:
        item.tuman_id != null
          ? {
              _id: String(item.tuman_id),
              name: `Tuman #${item.tuman_id}`,
              type: 'tuman',
              code: '',
            }
          : null,
      status: item.status === 'inactive' ? 'inactive' : 'active',
    }));

    // `/noauth/punkts` viloyat/tuman query filterni qo'llab-quvvatlamaydi,
    // shuning uchun bu filtrni client tomonda qo'llaymiz.
    if (params?.viloyat) {
      mapped = mapped.filter((p) => String(p.viloyat_id ?? '') === String(params.viloyat));
    }
    if (params?.tuman) {
      mapped = mapped.filter((p) => String(p.tuman_id ?? '') === String(params.tuman));
    }
    if (params?.status) {
      mapped = mapped.filter((p) => p.status === params.status);
    }

    return {
      success: true,
      count: mapped.length,
      total: res.data.total,
      page: res.data.page,
      limit: res.data.limit,
      totalPages: res.data.total_pages,
      data: mapped,
    };
  }

  async getAgentsForSelection(params?: {
    status?: 'active' | 'inactive';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AgentsSelectionResponse> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 100;
    const queryText = params?.search?.trim() || undefined;

    const q = new URLSearchParams();
    q.append('page', String(page));
    q.append('limit', String(limit));
    if (queryText) q.append('q', queryText);

    const res = await this.request<NoauthPaginatedResponse<NoauthAgentItem>>(
      `/noauth/agents?${q.toString()}`
    );

    let mapped: AgentSelection[] = res.data.items.map((item) => ({
      _id: String(item.id),
      id: item.id,
      name: item.name ?? '',
      phone: item.phone ?? '',
      viloyat_id: item.viloyat_id,
      tuman_id: item.tuman_id,
      mfy_id: item.mfy_id,
      viloyat:
        item.viloyat_id != null
          ? {
              _id: String(item.viloyat_id),
              name: `Viloyat #${item.viloyat_id}`,
              type: 'viloyat',
              code: '',
            }
          : undefined,
      tuman:
        item.tuman_id != null
          ? {
              _id: String(item.tuman_id),
              name: `Tuman #${item.tuman_id}`,
              type: 'tuman',
              code: '',
            }
          : null,
      mfy:
        item.mfy_id != null
          ? {
              _id: String(item.mfy_id),
              name: `MFY #${item.mfy_id}`,
              type: 'mfy',
              code: '',
            }
          : null,
      status: item.status === 'inactive' ? 'inactive' : 'active',
    }));

    if (params?.status) {
      mapped = mapped.filter((a) => a.status === params.status);
    }

    return {
      success: true,
      count: mapped.length,
      total: res.data.total,
      page: res.data.page,
      limit: res.data.limit,
      totalPages: res.data.total_pages,
      data: mapped,
    };
  }

  async assignOrderToAgent(
    id: string,
    data: AssignToAgentRequest
  ): Promise<AssignToAgentResponse> {
    return this.request<AssignToAgentResponse>(`/punkt/orders/${id}/assign-to-agent`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestToContragent(
    id: string,
    data: RequestToContragentRequest
  ): Promise<RequestToContragentResponse> {
    const endpoint = `/punkt/orders/${id}/request-to-contragent`;
    
    try {
      const response = await this.request<RequestToContragentResponse>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return response;
    } catch (error) {
      console.error('API Error in requestToContragent:', error);
      throw error;
    }
  }

  async requestToPunkt(
    id: string,
    data: RequestToPunktRequest
  ): Promise<RequestToPunktResponse> {
    return this.request<RequestToPunktResponse>(`/punkt/orders/${id}/request-to-punkt`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async receiveFromPunkt(id: string): Promise<ReceiveFromPunktResponse> {
    return this.request<ReceiveFromPunktResponse>(`/punkt/orders/${id}/receive-from-punkt`, {
      method: 'POST',
    });
  }

  async sendToPunkt(
    id: string,
    data: SendToPunktRequest
  ): Promise<SendToPunktResponse> {
    return this.request<SendToPunktResponse>(`/punkt/orders/${id}/send-to-punkt`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async receiveFromContragent(id: string): Promise<ReceiveFromContragentResponse> {
    return this.request<ReceiveFromContragentResponse>(
      `/punkt/orders/${id}/receive-from-contragent`,
      {
        method: 'POST',
      }
    );
  }

  async getPunktToPunktRequests(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PunktToPunktRequestsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<PunktToPunktRequestsResponse>(
      `/punkt/punkt-to-punkt-requests${query ? `?${query}` : ''}`
    );
  }

  async respondToPunktRequest(
    orderId: string,
    data: RespondToPunktRequestRequest
  ): Promise<RespondToPunktRequestResponse> {
    return this.request<RespondToPunktRequestResponse>(
      `/punkt/punkt-to-punkt-requests/${orderId}/respond`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async createPunktTransfer(
    orderId: string | number,
    body: CreatePunktTransferBody
  ): Promise<PunktTransferResponse> {
    return this.request<PunktTransferResponse>(`/punkts/me/orders/${orderId}/transfers`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getPunktTransfersOutgoing(params?: {
    page?: number;
    limit?: number;
  }): Promise<PunktTransfersListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('limit', String(Math.min(params?.limit ?? 20, 100)));
    return this.request<PunktTransfersListResponse>(
      `/punkts/me/transfers/outgoing?${queryParams.toString()}`
    );
  }

  async getPunktTransfersIncoming(params?: {
    page?: number;
    limit?: number;
  }): Promise<PunktTransfersListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('limit', String(Math.min(params?.limit ?? 20, 100)));
    return this.request<PunktTransfersListResponse>(
      `/punkts/me/transfers/incoming?${queryParams.toString()}`
    );
  }

  async getPunktTransferById(transferId: string | number): Promise<PunktTransferResponse> {
    return this.request<PunktTransferResponse>(`/punkts/me/transfers/${transferId}`);
  }

  async acceptPunktTransfer(transferId: string | number): Promise<PunktTransferActionResponse> {
    return this.request<PunktTransferActionResponse>(`/punkts/me/transfers/${transferId}/accept`, {
      method: 'POST',
    });
  }

  async returnPunktTransfer(transferId: string | number): Promise<PunktTransferActionResponse> {
    return this.request<PunktTransferActionResponse>(`/punkts/me/transfers/${transferId}/return`, {
      method: 'POST',
    });
  }

  async confirmPunktTransferReceived(
    transferId: string | number
  ): Promise<PunktTransferActionResponse> {
    return this.request<PunktTransferActionResponse>(
      `/punkts/me/transfers/${transferId}/confirm-received`,
      {
        method: 'POST',
      }
    );
  }

  async getOrderContragents(id: string): Promise<GetOrderContragentsResponse> {
    return this.request<GetOrderContragentsResponse>(`/punkt/orders/${id}/contragents`);
  }

  // KPI Bonus Methods
  async getKpiSummary(params?: {
    startDate?: string;
    endDate?: string;
    isPaid?: boolean;
  }): Promise<KpiSummaryResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<KpiSummaryResponse>(
      `/punkt/kpi/summary${query ? `?${query}` : ''}`,
      {},
      { skipErrorNotifier: true }
    );
  }

  async getKpiTransactions(params?: {
    startDate?: string;
    endDate?: string;
    isPaid?: boolean;
    page?: number;
    limit?: number;
  }): Promise<KpiTransactionsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<KpiTransactionsResponse>(
      `/punkt/kpi/transactions${query ? `?${query}` : ''}`,
      {},
      { skipErrorNotifier: true }
    );
  }

  async getKpiBalance(date?: string): Promise<KpiBalanceResponse> {
    const queryParams = new URLSearchParams();
    if (date) {
      queryParams.append('date', date);
    }
    const query = queryParams.toString();
    return this.request<KpiBalanceResponse>(
      `/punkt/kpi/balance${query ? `?${query}` : ''}`,
      {},
      { skipErrorNotifier: true }
    );
  }

  async getKpiDailyReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<KpiDailyReportResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<KpiDailyReportResponse>(
      `/punkt/kpi/reports/daily${query ? `?${query}` : ''}`,
      {},
      { skipErrorNotifier: true }
    );
  }

  async getNotifications(params?: {
    page?: number;
    limit?: number;
    read?: boolean;
  }): Promise<NotificationsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<NotificationsResponse>(`/punkts/notifications/list${query ? `?${query}` : ''}`);
  }

  async getUnreadNotificationsCount(): Promise<UnreadCountResponse> {
    return this.request<UnreadCountResponse>('/punkts/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId: string): Promise<MarkReadResponse> {
    return this.request<MarkReadResponse>(`/punkts/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead(): Promise<MarkReadResponse> {
    return this.request<MarkReadResponse>('/punkts/notifications/read-all', {
      method: 'POST',
    });
  }

  // Payment Methods
  async payZaklad(data: PayZakladRequest): Promise<PayZakladResponse> {
    return this.request<PayZakladResponse>('/punkts/payments/pay-zaklad', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransactions(params?: {
    type?: 'income' | 'expense';
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<TransactionsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return this.request<TransactionsResponse>(`/punkts/payments/transactions${query ? `?${query}` : ''}`);
  }

  async getBalance(): Promise<BalanceResponse> {
    return this.request<BalanceResponse>('/punkts/payments/balance');
  }

  async getOrdersForZaklad(): Promise<OrdersForZakladResponse> {
    return this.request<OrdersForZakladResponse>('/punkts/payments/orders-for-zaklad');
  }

  async payFinalPayment(data: PayFinalPaymentRequest): Promise<PayFinalPaymentResponse> {
    return this.request<PayFinalPaymentResponse>('/punkts/payments/pay-final-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async payProfit(data: PayProfitRequest): Promise<PayProfitResponse> {
    return this.request<PayProfitResponse>('/punkts/payments/pay-profit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  setToken(token: string | null) {
    this.token = token;
    // Reset logging out flag when setting a new token (login)
    if (token) {
      this.isLoggingOut = false;
    }
  }

  setValidatingToken(isValidating: boolean) {
    this.isValidatingToken = isValidating;
  }
}

export const apiService = new ApiService();

