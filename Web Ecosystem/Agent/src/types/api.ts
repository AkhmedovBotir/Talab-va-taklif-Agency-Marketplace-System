// API Types – Agent mobil bilan bir xil
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

export interface Region {
  _id: string;
  name: string;
  type: 'region' | 'district' | 'mfy';
  code: string;
}

/**

  idInt: Number;
  firstName: String;
  deviceType: String;
  X-Device-Id: String;

  Market X-detector - platform

  X-Browser - Type
  X-OS - Type
  X-User-Agent - Type

**/

export interface Agent {
  _id: string;
  name: string;
  phone: string;
  viloyat: Region | null;
  tuman: Region | null;
  mfy: Region | null;
  status: string;
  agentType: 'agent';
  createdAt: string;
  updatedAt: string;
}

export interface Punkt {
  _id: string;
  name: string;
  phone: string;
}

export interface User {
  _id: string;
  name?: string;
  phone: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
}

export interface OrderItem {
  product: Product | string;
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
  confirmedByPunkt: Punkt | null;
  assignedToAgent: Agent | null;
  assignedByPunkt: Punkt | null;
  assignedAt: string | null;
  confirmedByAgent: Agent | null;
  agentConfirmedAt: string | null;
  deliveredAt: string | null;
  customerConfirmed: boolean;
  customerConfirmedAt: string | null;
  currentPunkt: Punkt | string | null;
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
    device?: { deviceId: string; deviceName?: string; isPrimary: boolean };
  };
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

export interface ApiError {
  success: false;
  message: string;
  error?: string;
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

export interface KPISummaryResponse {
  success: boolean;
  data: {
    totalTransactions?: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    startDate?: string;
    endDate?: string;
    summary?: {
      totalAmount: number;
      paidAmount: number;
      unpaidAmount: number;
    };
  };
}

export type KPISummary = KPISummaryResponse['data'];

export interface KPITransaction {
  _id: string;
  order: { _id: string; orderNumber: string; totalPrice?: number; status?: string };
  /** Agent uchun KPI summasi (agent ulushi) */
  agentAmount?: number;
  /** Jami KPI summasi */
  totalKpiAmount?: number;
  orderItem?: { product?: { name?: string }; quantity: number; price: number; kpiBonusPercent?: number };
  amounts?: { punkt?: number; agent?: number; manager?: number; finance?: number; deliveryService?: number };
  orderStatus?: string;
  isPaid: boolean;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface KPITransactionsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: KPITransaction[];
}

export interface GetKPIParams {
  startDate?: string;
  endDate?: string;
  isPaid?: boolean;
  page?: number;
  limit?: number;
  date?: string;
}

export interface AgentProfileResponse {
  success: boolean;
  data: Agent;
}

export type PaymentTransactionType = 'income' | 'expense';
export type PaymentTransactionCategory = 'agent_paid_to_punkt' | 'agent_received_from_customer';
export type PaymentTransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface PaymentTransaction {
  _id: string;
  type: PaymentTransactionType;
  category: PaymentTransactionCategory;
  amount: number;
  order?: { _id: string; orderNumber: string; totalPrice: number };
  description: string;
  fromUser: { userType: string; userId: unknown };
  toUser: { userType: string; userId: unknown };
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
  _id: string;
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
