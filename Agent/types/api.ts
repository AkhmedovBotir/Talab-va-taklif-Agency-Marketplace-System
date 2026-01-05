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

// Agent Finance Types
export type PaymentTransactionStatus = 'pending' | 'collected' | 'submitted' | 'received' | 'confirmed' | 'rejected';
export type TransactionHolder = 'user' | 'mfy_agent' | 'district_agent' | 'province_agent' | 'finance';
export type FinanceSubmissionStatus = 'pending' | 'confirmed' | 'rejected';

export interface PaymentTransaction {
  _id: string;
  order: string | {
    _id: string;
    orderNumber: string;
    totalPrice: number;
    status?: OrderStatus;
    deliveryMfy?: string;
  };
  user: string | {
    _id: string;
    name: string;
    phone: string;
  };
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentTransactionStatus;
  collectedBy?: Agent | string;
  collectedAt?: string;
  currentHolder: TransactionHolder;
  currentHolderId?: string;
  transactionPath: any[];
  createdAt: string;
  updatedAt?: string;
  // Additional fields from API
  submittedToDistrict?: string | null;
  submittedToDistrictAt?: string | null;
  receivedByDistrict?: string | null;
  receivedByDistrictAt?: string | null;
  submittedToProvince?: string | null;
  submittedToProvinceAt?: string | null;
  receivedByProvince?: string | null;
  receivedByProvinceAt?: string | null;
  submittedToFinance?: string | null;
  receivedByFinance?: boolean;
  receivedByFinanceAt?: string | null;
  confirmedByFinance?: string | null;
  confirmedByFinanceAt?: string | null;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
}

export interface AgentDailyReport {
  _id?: string;
  id?: string;
  date: string;
  ordersCount: number;
  totalAmount: number;
  collectedAmount: number;
  submittedAmount: number;
  pendingAmount: number;
  cashAmount: number;
  cardAmount: number;
  isSubmitted?: boolean;
  submittedAt?: string | null;
  transactions?: PaymentTransaction[];
}

export interface FinanceSubmission {
  _id: string;
  id?: string;
  fromAgent: Agent;
  fromAgentType: AgentRole;
  toAgent?: Agent;
  toAgentType: 'tuman' | 'viloyat' | 'finance';
  amount: number;
  submissionDate: string;
  status: FinanceSubmissionStatus;
  transactions: string[] | PaymentTransaction[];
  cashAmount: number;
  cardAmount: number;
  transactionsCount: number;
  confirmedAt?: string;
  createdAt?: string;
}

// MFY Agent Finance Responses
export interface MFYDailyReportResponse {
  success: boolean;
  report: AgentDailyReport;
}

export interface MFYPendingPaymentsResponse {
  success: boolean;
  count: number;
  transactions: PaymentTransaction[];
}

export interface MFYCollectPaymentResponse {
  success: boolean;
  message: string;
  transaction: {
    id: string;
    status: PaymentTransactionStatus;
    collectedAt: string;
  };
}

export interface MFYSubmitToDistrictRequest {
  transactionIds: string[];
  notes?: string;
}

export interface MFYSubmitToDistrictResponse {
  success: boolean;
  message: string;
  submission: {
    id: string;
    amount: number;
    transactionsCount: number;
    submittedAt: string;
  };
}

export interface MFYStatisticsResponse {
  success: boolean;
  statistics: {
    period: {
      startDate: string;
      endDate: string;
    };
    totalOrders: number;
    totalAmount: number;
    collectedAmount: number;
    submittedAmount: number;
    pendingAmount: number;
    cashAmount: number;
    cardAmount: number;
  };
}

// Tuman Agent Finance Responses
export interface DistrictReportResponse {
  success: boolean;
  report: {
    date: string;
    submissionsCount: number;
    totalReceived: number;
    pendingAmount: number;
    submissions: FinanceSubmission[];
  };
}

export interface DistrictSubmissionsResponse {
  success: boolean;
  count: number;
  submissions: FinanceSubmission[];
}

export interface DistrictConfirmSubmissionResponse {
  success: boolean;
  message: string;
  submission: {
    id: string;
    status: FinanceSubmissionStatus;
    confirmedAt: string;
  };
}

export interface DistrictSubmitToProvinceRequest {
  transactionIds: string[];
  notes?: string;
}

export interface DistrictSubmitToProvinceResponse {
  success: boolean;
  message: string;
  submission: {
    id: string;
    amount: number;
    transactionsCount: number;
    submittedAt: string;
  };
}

export interface DistrictStatisticsResponse {
  success: boolean;
  statistics: {
    period: {
      startDate: string;
      endDate: string;
    };
    submissionsCount: number;
    totalReceived: number;
    pendingAmount: number;
  };
}

// Viloyat Agent Finance Responses
export interface ProvinceReportResponse {
  success: boolean;
  report: {
    date: string;
    submissionsCount: number;
    totalReceived: number;
    pendingAmount: number;
    submissions: FinanceSubmission[];
  };
}

export interface ProvinceSubmissionsResponse {
  success: boolean;
  count: number;
  submissions: FinanceSubmission[];
}

export interface ProvinceConfirmSubmissionResponse {
  success: boolean;
  message: string;
  submission: {
    id: string;
    status: FinanceSubmissionStatus;
    confirmedAt: string;
  };
}

export interface ProvinceSubmitToFinanceRequest {
  transactionIds: string[];
  notes?: string;
}

export interface ProvinceSubmitToFinanceResponse {
  success: boolean;
  message: string;
  submission: {
    id: string;
    amount: number;
    transactionsCount: number;
    submittedAt: string;
  };
}

export interface ProvinceStatisticsResponse {
  success: boolean;
  statistics: {
    period: {
      startDate: string;
      endDate: string;
    };
    submissionsCount: number;
    totalReceived: number;
    pendingAmount: number;
  };
}

export interface GetFinanceStatisticsParams {
  startDate?: string;
  endDate?: string;
}

