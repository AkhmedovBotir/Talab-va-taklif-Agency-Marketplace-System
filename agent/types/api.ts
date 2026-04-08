// API Types and Interfaces

export type AgentRole = 'agent';

export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled'
  | 'confirmed_by_punkt'
  | 'requested_to_contragent'
  | 'accepted_by_contragent'
  | 'delivered_to_punkt'
  | 'assigned_to_agent'
  | 'confirmed_by_agent'
  | 'confirmed_by_customer';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'card';
export type PunktStatus = 'pending' | 'confirmed' | 'rejected' | 'requested';
export type ContragentRequestStatus = 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';
export type PunktToPunktRequestStatus = 'pending' | 'accepted' | 'rejected' | 'delivered';

export interface Region {
  _id: string;
  name: string;
  type: 'region' | 'district' | 'mfy';
  code: string;
}

export interface Agent {
  /** Legacy API */
  _id?: string;
  /** Go API (`agents` jadvali) */
  id?: number;
  name: string;
  phone: string;
  viloyat?: Region | null;
  tuman?: Region | null;
  mfy?: Region | null;
  viloyat_id?: number;
  tuman_id?: number;
  mfy_id?: number;
  status: string;
  agentType?: 'agent';
  password_setup_allowed?: boolean;
  has_password?: boolean;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Punkt {
  _id: string;
  name: string;
  phone: string;
}

export interface Contragent {
  _id: string;
  name: string;
  phone?: string;
}

export interface ContragentRequest {
  contragentId: Contragent;
  status: ContragentRequestStatus;
  requestedAt: string;
  respondedAt: string | null;
  deliveredToPunktAt: string | null;
}

export interface PunktToPunktRequest {
  fromPunktId: Punkt;
  toPunktId: Punkt;
  status: PunktToPunktRequestStatus;
  requestedAt: string;
  respondedAt: string | null;
  deliveredAt: string | null;
}

export interface User {
  _id: string;
  name?: string; // Optional, chunki ba'zida faqat phone keladi
  phone: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
}

export interface OrderItem {
  product: Product | string; // Product object yoki ID string bo'lishi mumkin
  productType?: string;
  productModel?: string;
  kpiBonusPercent?: number;
  quantity: number;
  price: number;
  originalPrice?: number;
}

export interface Order {
  _id: string;
  user: User;
  orderNumber: string;
  items: OrderItem[];
  totalPrice: number;
  totalOriginalPrice?: number;
  totalKpiPrice?: number;
  itemCount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryViloyat: Region;
  deliveryTuman: Region | null;
  deliveryMfy: Region | null;
  deliveryNote?: string;
  phoneNumber: string;
  punktRequests?: any[];
  confirmedByPunkt: Punkt | null;
  punktStatus: PunktStatus;
  assignedToAgent: Agent | null;
  assignedByPunkt: Punkt | null;
  assignedAt: string | null;
  confirmedByAgent: Agent | null;
  agentConfirmedAt: string | null;
  deliveredAt: string | null;
  contragentRequests?: ContragentRequest[];
  punktToPunktRequests?: PunktToPunktRequest[];
  customerConfirmed: boolean;
  customerConfirmedAt: string | null;
  currentPunkt: Punkt | string | null; // Object yoki string ID bo'lishi mumkin
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    agent: Agent;
    device?: {
      deviceId: string;
      deviceName?: string;
      isPrimary: boolean;
    };
  };
}

/** Auth endpoints sometimes return only `{ message }` on success */
export interface AuthMessageResponse {
  message: string;
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

export interface MarkDeliveredResponse {
  success: boolean;
  message: string;
  data: Order;
}

/** Standart API xato / muvaffaqiyat tanasi */
export interface ApiEnvelope<T = unknown> {
  message: string;
  data: T | null;
  error: string | null;
}

/** Agent `/agents/me/orders/*` — ro‘yxat va tarix */
export type AgentMarketplaceOrderStatus = 'pending' | 'delivered' | 'cancelled';

export interface AgentMeOrderListItem {
  id: number;
  marketplace_status: AgentMarketplaceOrderStatus;
  total_amount: number;
  assigned_punkt_id?: number;
  assigned_punkt?: {
    id: number;
    name: string;
    viloyat_id?: number;
    tuman_id?: number;
    phone?: string;
    status?: string;
    password_setup_allowed?: boolean;
    created_at?: string;
    updated_at?: string;
  } | null;
  routing_district_id?: number;
  created_at: string;
  items_count: number;
  address_mode?: string;
  snap_area_name?: string;
  snap_mfy_id?: number;
  primary_custom_address?: string;
  /** Agent punktda to‘laganini e’lon qilgan vaqt */
  agent_declared_payment_to_punkt_at?: string;
  punkt_confirmed_agent_payment_at?: string;
  punkt_post_payment_delivered_at?: string;
  /** To‘ldirilgach agent `deliver` qila oladi */
  punkt_contragent_remainder_handed_over_at?: string;
}

export interface AgentMeOrdersPageData {
  items: AgentMeOrderListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AgentOrdersAnalytics {
  from?: string;
  to?: string;
  total_orders: number;
  total_amount: number;
  delivered_orders: number;
  delivered_amount: number;
  pending_orders: number;
  pending_amount: number;
  declared_to_punkt_amount: number;
  confirmed_by_punkt_amount: number;
  unconfirmed_declared_amount: number;
}

export interface AgentMeOrderLineItem {
  product_id?: number;
  product_name?: string;
  name?: string;
  contragent?: {
    id?: number;
    name?: string;
    phone?: string;
  } | null;
  quantity: number;
  unit_price?: number;
  price?: number;
  line_total?: number;
  contragent_payout_percent?: number;
  contragent_payout_amount?: number;
  [key: string]: unknown;
}

export interface AgentMeOrderDetail extends AgentMeOrderListItem {
  user_id?: number;
  user?: {
    id?: number;
    phone?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
  } | null;
  user_phone?: string;
  contact_phones?: string[];
  extra_phone?: string;
  address_note?: string;
  snap_region_id?: number;
  snap_district_id?: number;
  items?: AgentMeOrderLineItem[];
}

/** Axios error.response.data */
export interface ApiError extends Partial<ApiEnvelope> {
  success?: false;
}

export interface GetOrdersParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  orderNumber?: string;
  startDate?: string;
  endDate?: string;
  minTotalPrice?: number;
  maxTotalPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetOrdersHistoryParams {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Agent KPI (`GET /agents/me/kpi/today`, `GET /agents/me/kpi/history`)
export interface AgentKpiToday {
  date_utc: string;
  allocation_note?: string;
  agent_kpi_total: number;
  total_kpi_pool: number;
  delivered_orders: number;
  paid_total_today: number;
  payout_entries_today?: number;
  unpaid_today: number;
}

export interface AgentKpiHistoryDay {
  date?: string;
  date_utc?: string;
  agent_kpi_accrued: number;
  total_kpi_pool: number;
  delivered_orders: number;
  paid_total: number;
  unpaid: number;
}

/** Eski UI bilan moslash uchun bugungi KPI (profil / ish navbati kartochkasi) */
export type KPISummary = {
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  totalTransactions: number;
};

export function agentKpiTodayToSummary(today: AgentKpiToday): KPISummary {
  return {
    totalAmount: today.agent_kpi_total,
    paidAmount: today.paid_total_today,
    unpaidAmount: today.unpaid_today,
    totalTransactions: today.delivered_orders,
  };
}

export interface AgentProfileResponse {
  success: boolean;
  data: Agent;
  message?: string;
}

// Agent Payment Types
export type PaymentTransactionType = 'income' | 'expense';
export type PaymentTransactionCategory = 'agent_paid_to_punkt' | 'agent_received_from_customer';
export type PaymentTransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface PaymentTransaction {
  id?: number;
  _id?: string;
  type: PaymentTransactionType;
  category: PaymentTransactionCategory;
  amount: number;
  order?: {
    id?: number;
    _id?: string;
    orderNumber: string;
    totalPrice: number;
  };
  description: string;
  fromUser: {
    userType: string;
    userId: string | Agent | User | Punkt;
  };
  toUser: {
    userType: string;
    userId: string | Agent | User | Punkt;
  };
  status: PaymentTransactionStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransactionsResponse {
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

export interface PaymentBalanceResponse {
  success: boolean;
  data: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    qarz: number;
    haq: number;
  };
}

export interface OrderForPayment {
  id?: number;
  _id?: string;
  orderNumber: string;
  totalPrice: number;
  status: OrderStatus;
  assignedToAgent: string;
  assignedAt: string;
  user: User;
  deliveryViloyat: Region;
  deliveryTuman: Region | null;
  assignedByPunkt: Punkt;
  paymentStatus: 'paid' | 'unpaid';
  paymentTransaction: PaymentTransaction | null;
}

export interface OrdersForPaymentResponse {
  success: boolean;
  count: number;
  data: OrderForPayment[];
}

export interface PayToPunktResponse {
  success: boolean;
  message: string;
  data: PaymentTransaction;
}

export interface GetPaymentTransactionsParams {
  type?: PaymentTransactionType;
  category?: PaymentTransactionCategory;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/** Agent Notifications API — `/agents/me/notifications` */
export type AgentNotificationType =
  | 'info'
  | 'warning'
  | 'success'
  | 'error'
  | 'update'
  | 'announcement'
  | string;

export interface AgentNotification {
  id: number;
  title: string;
  message: string;
  type: AgentNotificationType;
  target_type: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentNotificationsListData {
  items: AgentNotification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

/** WebSocket: `integration_notification_created` */
export interface IntegrationNotificationSocketPayload {
  event: string;
  notification?: {
    id: number;
    title: string;
    message: string;
    type: string;
    target_type: string;
    created_at: string;
    updated_at: string;
    is_read?: boolean;
    read_at?: string | null;
  };
  sent_at?: string;
}

