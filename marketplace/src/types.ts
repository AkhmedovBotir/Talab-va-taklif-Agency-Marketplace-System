export interface User {
  id: string;
  phone: string;
  first_name: string;
  last_name: string;
  gender: 'erkak' | 'ayol';
  region_id: number;
  district_id: number;
  mfy_id: number;
  birth_date: string;
}

export interface Product {
  id: string;
  product_code: number;
  contragent_id: number;
  name: string;
  description: string; // JSON string
  price: number;
  original_price: number;
  images: string[];
  category_id: number;
  subcategory_id: number;
  quantity: number;
  unit: string;
  unit_size: string;
  status: 'active' | 'inactive';
  kpi_bonus_percent: number;
  kpi_bonus_amount: number;
  moderation_status: 'approved' | 'pending' | 'rejected';
  rejection_reason: string;
  delivery_areas: {
    region_ids: number[];
    district_ids: number[];
  };
  created_at: string;
  updated_at: string;
}

export interface LocalShopInfo {
  id: number;
  name: string;
  region_id?: number;
  district_id?: number;
  mfy_id?: number;
  phone?: string;
}

export interface LocalShopDeliveryArea {
  mfy_id: number;
  mfy_name: string;
}

export interface LocalShopProduct extends Product {
  local_shop?: LocalShopInfo;
  local_delivery_areas?: LocalShopDeliveryArea[];
}

export interface LocalShopCartItem extends LocalShopProduct {
  quantity: number;
  availableStock: number;
  cartLineId: number;
}

export interface Address {
  id: string | number;
  name: string;
  description?: string;
  region_id: number;
  district_id: number;
  mfy_id: number;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Region {
  id: number;
  name: string;
}

export interface District {
  id: number;
  region_id: number;
  name: string;
}

export interface MFY {
  id: number;
  district_id: number;
  name: string;
}

export type ActiveStatus = 'active' | 'inactive' | string;

export interface Category {
  id: number;
  name: string;
  slug?: string;
  image?: string;
  censored?: boolean;
  external_id?: string;
  created_at?: string;
  updated_at?: string;
  status?: ActiveStatus;
}

export interface Subcategory {
  id: number;
  parent_id?: number;
  name: string;
  slug?: string;
  image?: string;
  censored?: boolean;
  external_id?: string;
  created_at?: string;
  updated_at?: string;
  status?: ActiveStatus;
}

/** `/marketplace/search` — kategoriya qatori */
export interface SearchCategoryHit {
  id: number;
  name: string;
  slug?: string;
  image?: string | null;
}

/** `/marketplace/search` — subkategoriya qatori */
export interface SearchSubcategoryHit {
  id: number;
  name: string;
  slug?: string;
  image?: string | null;
  parent_id?: number;
}

/** `/marketplace/search` — kontragent qatori */
export interface ContragentSearchHit {
  id: number;
  name: string;
  inn?: string;
  phone?: string;
  logo?: string | null;
  region_id?: number;
  district_id?: number;
  mfy_id?: number;
  delivery_areas?: { region_ids: number[]; district_ids: number[] };
}

/** `/marketplace/search` javobi */
export interface UnifiedSearchResponse {
  query: string;
  limit_per_type: number;
  products: Product[];
  categories: SearchCategoryHit[];
  subcategories: SearchSubcategoryHit[];
  contragents: ContragentSearchHit[];
}

export interface ContragentBrowseItem {
  id: number;
  name: string;
  inn?: string;
  phone?: string;
  logo?: string;
  activity_type_id?: number;
  activity_type_name?: string;
  status?: string;
  region_id?: number;
  district_id?: number;
  mfy_id?: number;
  delivery_areas?: { region_ids: number[]; district_ids: number[] };
  products?: Product[];
  category_branches?: Array<{ category: Category; subcategories: Subcategory[] }>;
}

export interface ContragentBanner {
  id: number;
  contragent_id: number;
  contragent_name: string;
  contragent_logo?: string;
  start_at: string;
  end_at: string;
}

export interface ContragentsListResponse {
  items: ContragentBrowseItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ActivityType {
  id: number;
  name: string;
}

export interface CommentTemplate {
  id: number;
  comment: string;
  sort_order?: number;
}

export interface PartnerRequestPayload {
  company_name: string;
  inn: string;
  mfo: string;
  account_number: string;
  activity_type_id: number;
  region_id: number;
  district_id: number;
  mfy_id: number;
  phone: string;
}

export interface PartnerRequest {
  id: number;
  company_name: string;
  inn: string;
  mfo: string;
  account_number: string;
  activity_type_id: number;
  activity_type_name?: string;
  region_id: number;
  district_id: number;
  mfy_id: number;
  phone: string;
  status?: string;
  created_at?: string;
}

/** Buyurtma holati (marketplace orders API) */
export type MarketplaceOrderStatus = 'pending' | 'cancelled' | 'delivered' | string;

export interface MarketplaceOrderItemLine {
  order_item_id?: number;
  product_id: number;
  local_shop_product_id?: number;
  template_id?: number;
  contragent_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  unit: string;
  /** Masalan "1" yoki "0.5" — API `unit_size` / ichma-ich `product` */
  unit_size?: string;
  line_total: number;
  /** Birinchi rasm URL (`image_url`, `images`, `product.images` va hokazo) */
  image_url?: string;
  /** Mahsulot kodi (API `product_code`) */
  product_code?: number;
}

export interface OrderRatingItemPayload {
  order_item_id: number;
  score: number;
  comment_template_id?: number;
  note?: string;
}

export interface ProductRatingItem {
  id: number;
  order_id: number;
  order_item_id: number;
  score: number;
  comment_template_id?: number;
  comment_template?: string;
  note?: string;
  created_at?: string;
}

export interface ProductRatingsResponse {
  product_id: number;
  average_score: number;
  total_ratings: number;
  score_breakdown: Record<string, number>;
  items: ProductRatingItem[];
  page: number;
  limit: number;
  total_pages: number;
}

export interface MarketplaceOrderAddress {
  type: string;
  delivery_area_id?: number;
  area_name?: string;
  region_id?: number;
  district_id?: number;
  mfy_id?: number;
  custom_text?: string;
}

export interface MarketplaceOrderRoadmapStep {
  done: boolean;
  at?: string;
}

export interface MarketplaceOrderRoadmap {
  created?: MarketplaceOrderRoadmapStep;
  punkt_assigned?: MarketplaceOrderRoadmapStep;
  punkt_accepted?: MarketplaceOrderRoadmapStep;
  punkt_rejected?: MarketplaceOrderRoadmapStep;
  contragent_requests_created?: MarketplaceOrderRoadmapStep;
  punkt_collected?: MarketplaceOrderRoadmapStep;
  punkt_ready?: MarketplaceOrderRoadmapStep;
  agent_assigned?: MarketplaceOrderRoadmapStep;
  agent_declared_payment_to_punkt?: MarketplaceOrderRoadmapStep;
  punkt_confirmed_agent_payment?: MarketplaceOrderRoadmapStep;
  punkt_post_payment_delivered?: MarketplaceOrderRoadmapStep;
  punkt_remainder_handed_over?: MarketplaceOrderRoadmapStep;
  delivered?: MarketplaceOrderRoadmapStep;
  cancelled?: MarketplaceOrderRoadmapStep;
  current_stage?: string;
  [key: string]: MarketplaceOrderRoadmapStep | string | undefined;
}

export interface MarketplaceOrder {
  id: number;
  market?: 'bozor' | 'mahalla';
  local_shop_id?: number;
  status: MarketplaceOrderStatus;
  /** `pending` bo‘lsa bekor qilish mumkin (API `can_cancel` yoki `status` bo‘yicha) */
  can_cancel: boolean;
  total_amount: number;
  extra_phone?: string;
  address_note?: string;
  address: MarketplaceOrderAddress;
  roadmap?: MarketplaceOrderRoadmap;
  items: MarketplaceOrderItemLine[];
  created_at: string;
  updated_at: string;
}

export type CreateOrderAddressPayload =
  | { type: 'default' }
  | { type: 'delivery_area'; delivery_area_id: number }
  | { type: 'extra'; text: string };

export interface CreateOrderPayload {
  items: { product_id: number; quantity: number }[];
  address: CreateOrderAddressPayload;
  extra_phone?: string;
  address_note?: string;
}

export interface OrdersListResult {
  items: MarketplaceOrder[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export type MarketplaceNotificationType =
  | 'info'
  | 'warning'
  | 'success'
  | 'error'
  | 'update'
  | 'announcement';

export interface MarketplaceNotification {
  id: string | number;
  title: string;
  message: string;
  type: MarketplaceNotificationType | string;
  target_type: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceNotificationsListResult {
  items: MarketplaceNotification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  total_pages: number;
}
