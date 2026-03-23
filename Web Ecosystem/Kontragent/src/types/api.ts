export interface Contragent {
  _id: string;
  name: string;
  inn: string;
  viloyat?: { _id: string; name: string; type?: string; code?: string };
  tuman?: { _id: string; name: string; type?: string; code?: string };
  mfy?: { _id: string; name: string; type?: string; code?: string };
  phone: string;
  status: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  requiresDeviceVerification?: boolean;
  data?: {
    token?: string;
    contragent?: Contragent;
    phone?: string;
    deviceId?: string;
  };
}

export interface OrderItem {
  product: { _id: string; name: string; images?: string[]; productCode?: string; price?: number };
  quantity: number;
  price: number;
  originalPrice?: number;
  kpiBonusPercent?: number;
}

export interface ContragentRequest {
  _id?: string;
  status: string;
  requestedAt: string;
  respondedAt?: string | null;
  deliveredToPunktAt?: string | null;
  itemIds?: number[];
}

export interface Order {
  _id: string;
  orderNumber: string;
  contragentRequests: ContragentRequest[];
  currentPunkt: { _id: string; name: string; phone?: string };
  items: OrderItem[];
  phoneNumber: string;
  deliveryViloyat?: { _id: string; name: string };
  deliveryTuman?: { _id: string; name: string };
  deliveryMfy?: { _id: string; name: string };
  paymentMethod: string;
  paymentStatus: string;
  totalPrice: number;
  totalOriginalPrice: number;
  totalKpiPrice: number;
  status: string;
  createdAt?: string;
}

export interface OrderListResponse {
  success: boolean;
  data: Order[];
  page?: number;
  totalPages?: number;
  total?: number;
}

export interface OrderResponse {
  success: boolean;
  data: Order;
  message?: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface ContragentPayment {
  _id: string;
  amount: number;
  status: string;
  paidAt?: string | null;
  paidBy?: { name: string; phone?: string };
  orders?: Array<{ orderNumber: string; totalPrice: number }>;
  dueDate: string;
  isOverdue?: boolean;
  createdAt: string;
}

export interface StatisticsSummary {
  totalOrders?: number;
  acceptedOrders?: number;
  rejectedOrders?: number;
  pendingOrders?: number;
  deliveredOrders?: number;
  totalItems?: number;
  totalRevenue?: number;
  acceptanceRate?: string | number;
}

export interface MonthlyStatistics {
  year: number;
  month: number;
  orders: number;
  revenue: number;
}

export interface StatisticsData {
  summary: StatisticsSummary;
  monthly?: MonthlyStatistics[];
}
