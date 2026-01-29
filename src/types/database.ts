// ============================================
// UFLUX Database Types
// Supabase 스키마 기반 TypeScript 타입 정의
// ============================================

// ============================================
// ENUM Types
// ============================================
export type UserTier = 'basic' | 'vip' | 'premium' | 'enterprise';
export type ServiceType = 'default' | 'package' | 'subscription';
export type OrderStatus = 'pending' | 'processing' | 'in_progress' | 'completed' | 'partial' | 'canceled' | 'refunded' | 'failed';
export type TransactionType = 'deposit' | 'refund' | 'order' | 'bonus' | 'adjustment';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'canceled';

// ============================================
// Table Types
// ============================================

export interface Profile {
  id: string;
  email: string;
  username?: string | null;
  full_name: string | null;
  phone: string | null;
  balance: number;
  total_spent: number;
  total_orders: number;
  tier: UserTier;
  referral_code: string | null;
  referred_by: string | null;
  is_admin: boolean;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  balance: number | null;
  currency: string;
  rate_multiplier: number;
  is_active: boolean;
  priority: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  platform: string | null;
  icon: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  provider_id: string | null;
  category_id: string | null;
  provider_service_id: string | null;
  name: string;
  description: string | null;
  platform: string | null;
  type?: ServiceType;
  rate?: number;
  price: number;
  margin?: number;
  min_quantity: number;
  max_quantity: number;
  is_active: boolean;
  is_featured?: boolean | null;
  is_drip_feed?: boolean;
  is_refill?: boolean;
  is_cancel?: boolean;
  average_time: string | null;
  refill_days?: number;
  quality?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceWithCategory extends Service {
  category_name: string | null;
  category_slug: string | null;
  category_icon: string | null;
}

export interface Order {
  id: string;
  order_number?: string;
  user_id: string;
  service_id: string | null;
  provider_id?: string | null;
  link: string;
  quantity: number;
  amount: number;
  charge?: number;
  unit_price?: number;
  start_count?: number | null;
  remains?: number | null;
  status: OrderStatus;
  provider_order_id: string | null;
  error_message?: string | null;
  refund_amount?: number;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface OrderWithService extends Order {
  service?: Service | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  status: PaymentStatus;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type PaymentMethod = 'bank_transfer' | 'crypto' | 'kakaopay';

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  depositor_name: string;
  bank_name: string | null;
  account_number: string | null;
  receipt_url: string | null;
  status: PaymentStatus;
  admin_note: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // 암호화폐 결제 지원 필드
  payment_method: PaymentMethod;
  tx_id: string | null;           // 블록체인 거래 해시
  exchange_rate: number | null;   // 적용된 환율 (1 USDT = X KRW)
  crypto_amount: number | null;   // 보낸 USDT 수량
  crypto_currency: string | null; // 암호화폐 종류 (USDT)
  network: string | null;         // 네트워크 (TRC-20)
}

export interface Coupon {
  id: string;
  code: string;
  type: 'fixed' | 'percent';
  value: number;
  min_amount: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'important';
  is_pinned: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiLog {
  id: string;
  provider_id: string | null;
  order_id: string | null;
  endpoint: string;
  method: string;
  request_body: Record<string, unknown> | null;
  response_body: Record<string, unknown> | null;
  status_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  created_at: string;
}

// ============================================
// Dashboard Stats
// ============================================
export interface DashboardStats {
  total_users: number;
  today_orders: number;
  today_revenue: number;
  pending_orders: number;
  pending_deposits: number;
}

// ============================================
// Insert/Update Types
// ============================================
export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'referral_code'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'email'>>;

export type ProviderInsert = Omit<Provider, 'id' | 'created_at' | 'updated_at'>;
export type ProviderUpdate = Partial<Omit<Provider, 'id' | 'created_at' | 'updated_at'>>;

export type CategoryInsert = Omit<Category, 'id' | 'created_at'>;
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'created_at'>>;

export type ServiceInsert = Omit<Service, 'id' | 'created_at' | 'updated_at'>;
export type ServiceUpdate = Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>;

export type OrderInsert = Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'completed_at'>;
export type OrderUpdate = Partial<Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>>;

export type TransactionInsert = Omit<Transaction, 'id' | 'created_at'>;

export type DepositInsert = Omit<Deposit, 'id' | 'created_at' | 'updated_at' | 'approved_at' | 'approved_by'>;
export type DepositUpdate = Partial<Omit<Deposit, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type CouponInsert = Omit<Coupon, 'id' | 'created_at' | 'used_count'>;
export type CouponUpdate = Partial<Omit<Coupon, 'id' | 'created_at'>>;

export type AnnouncementInsert = Omit<Announcement, 'id' | 'created_at' | 'updated_at'>;
export type AnnouncementUpdate = Partial<Omit<Announcement, 'id' | 'created_at' | 'updated_at'>>;

// ============================================
// Supabase Database Type
// ============================================
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      providers: {
        Row: Provider;
        Insert: ProviderInsert;
        Update: ProviderUpdate;
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      services: {
        Row: Service;
        Insert: ServiceInsert;
        Update: ServiceUpdate;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: never;
      };
      deposits: {
        Row: Deposit;
        Insert: DepositInsert;
        Update: DepositUpdate;
      };
      coupons: {
        Row: Coupon;
        Insert: CouponInsert;
        Update: CouponUpdate;
      };
      announcements: {
        Row: Announcement;
        Insert: AnnouncementInsert;
        Update: AnnouncementUpdate;
      };
      api_logs: {
        Row: ApiLog;
        Insert: Omit<ApiLog, 'id' | 'created_at'>;
        Update: never;
      };
    };
    Views: {
      dashboard_stats: {
        Row: DashboardStats;
      };
      services_with_category: {
        Row: ServiceWithCategory;
      };
    };
    Functions: {
      generate_order_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      generate_referral_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      deduct_balance: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_description: string;
          p_reference_id?: string;
          p_reference_type?: string;
        };
        Returns: boolean;
      };
      add_balance: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_type: TransactionType;
          p_description: string;
          p_reference_id?: string;
          p_reference_type?: string;
        };
        Returns: boolean;
      };
      process_order: {
        Args: {
          p_user_id: string;
          p_service_id: string;
          p_link: string;
          p_quantity: number;
          // p_amount 제거됨 - 서버에서 직접 계산 (보안)
        };
        Returns: string;
      };
    };
    Enums: {
      user_tier: UserTier;
      service_type: ServiceType;
      order_status: OrderStatus;
      transaction_type: TransactionType;
      payment_status: PaymentStatus;
    };
  };
}

// ============================================
// New Feature Types
// ============================================

// 리뷰 시스템
export interface Review {
  id: string;
  user_id: string;
  service_id: string;
  order_id: string | null;
  rating: number;
  content: string | null;
  is_verified: boolean;
  is_featured: boolean;
  is_visible: boolean;
  helpful_count: number;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

// 무료 체험 서비스
export interface FreeTrialService {
  id: string;
  service_id: string;
  trial_quantity: number;
  daily_limit: number;
  today_used: number;
  is_active: boolean;
  created_at: string;
}

// 무료 체험 신청
export interface FreeTrial {
  id: string;
  user_id: string;
  service_id: string;
  trial_service_id: string;
  link: string;
  quantity: number;
  status: OrderStatus;
  provider_order_id: string | null;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  completed_at: string | null;
}

// A/B 테스트
export interface ABTest {
  id: string;
  name: string;
  description: string | null;
  test_key: string;
  variants: string[];
  traffic_allocation: Record<string, number>;
  status: 'draft' | 'running' | 'paused' | 'completed';
  started_at: string | null;
  ended_at: string | null;
  target_audience: Record<string, unknown>;
  winner_variant: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// 카카오페이 결제
export interface KakaopayPayment {
  id: string;
  user_id: string;
  deposit_id: string | null;
  tid: string | null;
  partner_order_id: string;
  partner_user_id: string;
  total_amount: number;
  tax_free_amount: number;
  vat_amount: number;
  status: 'ready' | 'approved' | 'canceled' | 'failed';
  approved_at: string | null;
  canceled_at: string | null;
  payment_method_type: string | null;
  card_info: Record<string, unknown> | null;
  next_redirect_pc_url: string | null;
  next_redirect_mobile_url: string | null;
  next_redirect_app_url: string | null;
  error_code: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// 타겟팅 옵션
export interface TargetingOptions {
  id: string;
  service_id: string;
  supports_gender_targeting: boolean;
  gender_options: string[];
  gender_price_multiplier: number;
  supports_age_targeting: boolean;
  age_ranges: string[];
  age_price_multiplier: number;
  supports_country_targeting: boolean;
  countries: string[];
  country_price_multiplier: number;
  supports_language_targeting: boolean;
  languages: string[];
  created_at: string;
  updated_at: string;
}

// Drip-feed 로그
export interface DripFeedLog {
  id: string;
  order_id: string;
  run_number: number;
  quantity: number;
  provider_order_id: string | null;
  status: OrderStatus;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

// ============================================
// Helper Types
// ============================================

// 주문 상태별 한글 라벨
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '대기 중',
  processing: '처리 중',
  in_progress: '진행 중',
  completed: '완료',
  partial: '부분 완료',
  canceled: '취소됨',
  refunded: '환불됨',
  failed: '실패',
};

// 주문 상태별 색상 클래스
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'badge-warning',
  processing: 'badge-info',
  in_progress: 'badge-info',
  completed: 'badge-success',
  partial: 'badge-warning',
  canceled: 'badge-error',
  refunded: 'badge-error',
  failed: 'badge-error',
};

// 거래 유형별 한글 라벨
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  deposit: '충전',
  refund: '환불',
  order: '주문',
  bonus: '보너스',
  adjustment: '조정',
};

// 사용자 등급별 한글 라벨
export const USER_TIER_LABELS: Record<UserTier, string> = {
  basic: '일반',
  vip: 'VIP',
  premium: '프리미엄',
  enterprise: '엔터프라이즈',
};

// 사용자 등급별 할인율
export const USER_TIER_DISCOUNTS: Record<UserTier, number> = {
  basic: 0,
  vip: 0.05,      // 5% 할인
  premium: 0.10,  // 10% 할인
  enterprise: 0.15, // 15% 할인
};

