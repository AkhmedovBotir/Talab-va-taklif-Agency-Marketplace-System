// API Types and Interfaces

export type AgentRole = 'viloyat' | 'tuman' | 'mfy';

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
  _id: string;
  name: string;
  phone: string;
  viloyat: Region;
  tuman: Region | null;
  mfy: Region | null;
  status: string;
  agentType: AgentRole;
  createdAt: string;
  updatedAt: string;
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
  name: string;
  phone: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
}

export interface OrderItem {
  product: Product;
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
  currentPunkt: Punkt | null;
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
    role: AgentRole;
    agent: Agent;
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

// KPI Bonus Types
export interface KPISummary {
  totalTransactions: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

export interface KPISummaryResponse {
  success: boolean;
  data: {
    agent: Agent;
    summary: KPISummary;
  };
}

export interface KPITransaction {
  _id: string;
  order: {
    _id: string;
    orderNumber: string;
    status: OrderStatus;
    totalPrice: number;
  };
  orderItem: {
    product: Product;
    quantity: number;
    price: number;
    kpiBonusPercent: number;
  };
  distributionConfig: {
    _id: string;
    name: string;
  };
  orderStatus: OrderStatus;
  isPaid: boolean;
  agentAmount: number;
  createdAt: string;
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

export interface KPIDailyBalance {
  date: string;
  totals: {
    totalTransactions: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    paidTransactions: number;
    unpaidTransactions: number;
  };
}

export interface KPIDailyBalanceResponse {
  success: boolean;
  data: KPIDailyBalance;
}

export interface KPIDailyReportItem {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  paidTransactions: number;
  unpaidTransactions: number;
}

export interface KPIDailyReportResponse {
  success: boolean;
  data: {
    range: {
      startDate: string;
      endDate: string;
    };
    report: KPIDailyReportItem[];
  };
}

export interface GetKPIParams {
  startDate?: string;
  endDate?: string;
  isPaid?: boolean;
  page?: number;
  limit?: number;
  date?: string; // For daily balance (YYYY-MM-DD format)
}

