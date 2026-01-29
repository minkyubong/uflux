// ============================================
// JAP (JustAnotherPanel) API Types
// SMM Panel 표준 API 타입 정의
// ============================================

// ============================================
// Provider Configuration
// ============================================
export interface ProviderConfig {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  currency?: string;
  rateMultiplier?: number;
}

// ============================================
// API Request Types
// ============================================
export type JAPAction =
  | 'services'
  | 'add'
  | 'status'
  | 'balance'
  | 'refill'
  | 'cancel'
  | 'orders';

export interface JAPBaseRequest {
  key: string;
  action: JAPAction;
}

export interface JAPServicesRequest extends JAPBaseRequest {
  action: 'services';
}

export interface JAPAddOrderRequest extends JAPBaseRequest {
  action: 'add';
  service: string | number;
  link: string;
  quantity: number;
  runs?: number;       // Drip-feed runs
  interval?: number;   // Drip-feed interval (minutes)
  comments?: string;   // For comment services
  usernames?: string;  // For mention services
}

export interface JAPStatusRequest extends JAPBaseRequest {
  action: 'status';
  order: string | number;
}

export interface JAPMultiStatusRequest extends JAPBaseRequest {
  action: 'status';
  orders: string;  // Comma-separated order IDs
}

export interface JAPBalanceRequest extends JAPBaseRequest {
  action: 'balance';
}

export interface JAPRefillRequest extends JAPBaseRequest {
  action: 'refill';
  order: string | number;
}

export interface JAPCancelRequest extends JAPBaseRequest {
  action: 'cancel';
  orders: string;  // Comma-separated order IDs
}

// ============================================
// API Response Types
// ============================================
export interface JAPService {
  service: string | number;
  name: string;
  type: string;
  rate: string;
  min: string;
  max: string;
  dripfeed?: boolean;
  refill?: boolean;
  cancel?: boolean;
  category: string;
  desc?: string;
  average_time?: string;
}

export interface JAPOrderResponse {
  order: number;
}

export interface JAPOrderStatus {
  charge: string;
  start_count: string;
  status: JAPOrderStatusType;
  remains: string;
  currency?: string;
}

export type JAPOrderStatusType =
  | 'Pending'
  | 'In progress'
  | 'Processing'
  | 'Completed'
  | 'Partial'
  | 'Canceled'
  | 'Refunded'
  | 'Failed';

export interface JAPBalanceResponse {
  balance: string;
  currency: string;
}

export interface JAPRefillResponse {
  refill: string | number;  // Refill ID or status
}

export interface JAPCancelResponse {
  [orderId: string]: {
    cancel: string | number;  // 1 = success, error message otherwise
    error?: string;
  };
}

export interface JAPErrorResponse {
  error: string;
}

// ============================================
// Normalized Types (Internal Use)
// ============================================
export interface NormalizedService {
  providerId: string;
  providerServiceId: string;
  name: string;
  type: 'default' | 'package' | 'subscription';
  rate: number;           // 원가 (USD 기준)
  min: number;
  max: number;
  category: string;
  description?: string;
  hasDripfeed: boolean;
  hasRefill: boolean;
  hasCancel: boolean;
  averageTime?: string;
}

export interface NormalizedOrderStatus {
  orderId: string;
  charge: number;
  startCount: number;
  status: OrderStatusType;
  remains: number;
  currency: string;
}

export type OrderStatusType =
  | 'pending'
  | 'processing'
  | 'in_progress'
  | 'completed'
  | 'partial'
  | 'canceled'
  | 'refunded'
  | 'failed';

export interface CreateOrderParams {
  serviceId: string | number;
  link: string;
  quantity: number;
  runs?: number;
  interval?: number;
  comments?: string;
  usernames?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: number;
  error?: string;
}

// ============================================
// API Client Options
// ============================================
export interface APIClientOptions {
  timeout?: number;        // Request timeout (ms)
  maxRetries?: number;     // Max retry attempts
  baseDelay?: number;      // Base delay for exponential backoff (ms)
  mockMode?: boolean;      // Use mock responses
}

export const DEFAULT_API_OPTIONS: Required<APIClientOptions> = {
  timeout: 5000,
  maxRetries: 3,
  baseDelay: 1000,
  mockMode: false,
};

