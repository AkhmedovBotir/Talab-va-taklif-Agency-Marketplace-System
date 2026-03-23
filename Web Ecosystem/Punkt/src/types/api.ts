export interface Region {
  _id: string;
  name: string;
  type: string;
  code: string;
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
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: { token: string; punkt: Punkt };
}

export interface OrderItem {
  product: { _id: string; name: string; price: number; originalPrice?: number; contragent?: unknown; category?: { name: string }; deliveryRegions?: Array<{ viloyat: Region; tuman: Region }> } | string;
  quantity: number;
  price: number;
  originalPrice?: number;
}

export interface Agent {
  _id: string;
  name: string;
  phone: string;
}

export interface PunktRequest {
  punktId: Punkt | string;
  status: string;
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

export interface Contragent {
  _id: string;
  name: string;
  inn?: string;
  phone?: string;
  viloyat?: Region;
  tuman?: Region | null;
  products?: Array<{ _id: string; name: string; quantity: number; price: number }>;
  hasRequest?: boolean;
  requestStatus?: string | null;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: { _id: string; name: string; phone: string };
  items: OrderItem[];
  totalPrice: number;
  totalOriginalPrice?: number;
  itemCount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryViloyat: Region;
  deliveryTuman: Region | null;
  deliveryMfy?: Region | null;
  deliveryNote?: string;
  phoneNumber: string;
  punktRequests: PunktRequest[];
  punktToPunktRequests?: PunktToPunktRequest[];
  contragentRequests?: Array<{ contragentId: Contragent | string; status: string; requestedAt: string; _id?: string; zakladPaid?: boolean }>;
  confirmedByPunkt: Punkt | null;
  punktStatus: string;
  assignedToAgent: Agent | null;
  assignedAt: string | null;
  currentPunkt?: string | Punkt | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  page: number;
  totalPages: number;
  count?: number;
  total?: number;
  limit?: number;
}

export interface OrderResponse {
  success: boolean;
  data: Order;
}

export interface KpiSummaryResponse {
  success: boolean;
  data: {
    summary: {
      totalTransactions: number;
      totalAmount: number;
      paidAmount: number;
      unpaidAmount: number;
    };
  };
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

export interface KpiTransaction {
  _id: string;
  order: { _id: string; orderNumber: string; status: string; totalPrice: number };
  orderItem: {
    product: { _id?: string; name: string; price?: number; productCode?: string };
    quantity: number;
    price: number;
    originalPrice?: number;
    kpiBonusPercent: number;
  };
  amounts?: { punkt?: number; agent?: number; manager?: number; finance?: number; deliveryService?: number };
  totalKpiAmount?: number;
  isPaid: boolean;
  punktAmount?: number;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface KpiTransactionsResponse {
  success: boolean;
  data: KpiTransaction[];
  page: number;
  totalPages: number;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  page: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  success: boolean;
  data: { unreadCount: number };
}

export interface BalanceResponse {
  success: boolean;
  data: {
    balance: number;
    totalIncome: number;
    totalExpense: number;
    qarz: number;
    haq: number;
  };
}

export interface PaymentTransaction {
  _id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  order?: { orderNumber: string };
  fromUser: { userType: string; userId: string | { name: string } };
  toUser: { userType: string; userId: string | { name: string } };
  createdAt: string;
}

export interface TransactionsResponse {
  success: boolean;
  data: PaymentTransaction[];
  page: number;
  totalPages: number;
}

export interface GetOrderContragentsResponse {
  success: boolean;
  data: { contragents: Contragent[] };
}

export interface PunktSelection {
  _id: string;
  name: string;
  phone: string;
  viloyat: Region;
  tuman: Region | null;
  status: string;
}

export interface AgentSelection {
  _id: string;
  name: string;
  phone: string;
}

export interface PointToPunktRequestsResponse {
  success: boolean;
  data: Order[];
  page: number;
  totalPages: number;
}
