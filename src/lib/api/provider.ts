// ============================================
// JAP (JustAnotherPanel) API Client
// SMM Panel 표준 API 통신 모듈
// ============================================

import {
  ProviderConfig,
  JAPService,
  JAPOrderResponse,
  JAPOrderStatus,
  JAPBalanceResponse,
  JAPErrorResponse,
  NormalizedService,
  NormalizedOrderStatus,
  OrderStatusType,
  CreateOrderParams,
  CreateOrderResult,
  APIClientOptions,
  DEFAULT_API_OPTIONS,
} from './types';

import {
  generateMockServicesResponse,
  generateMockOrderResponse,
  generateMockStatusResponse,
  generateMockBalanceResponse,
} from './mock-data';

// ============================================
// Environment Check
// ============================================
const isMockMode = (): boolean => {
  return process.env.NEXT_PUBLIC_MOCK_API === 'true' ||
         process.env.MOCK_API === 'true';
};

// ============================================
// Utility: Sleep (for delays)
// ============================================
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// Utility: Fetch with Timeout
// ============================================
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// ============================================
// Utility: Retry with Exponential Backoff
// ============================================
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Required<APIClientOptions>
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (lastError.message.includes('Invalid API key') ||
          lastError.message.includes('Invalid service')) {
        throw lastError;
      }

      // Last attempt - don't wait, just throw
      if (attempt === options.maxRetries - 1) {
        break;
      }

      // Exponential backoff: baseDelay * 2^attempt (1s, 2s, 4s, ...)
      const delay = options.baseDelay * Math.pow(2, attempt);
      console.warn(
        `[Provider API] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        lastError.message
      );
      await sleep(delay);
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// ============================================
// JAP API Client Class
// ============================================
export class ProviderAPIClient {
  private config: ProviderConfig;
  private options: Required<APIClientOptions>;

  constructor(config: ProviderConfig, options?: APIClientOptions) {
    this.config = config;
    this.options = { ...DEFAULT_API_OPTIONS, ...options };

    // Override mock mode from environment
    if (isMockMode()) {
      this.options.mockMode = true;
    }
  }

  /**
   * Make API request to provider
   */
  private async request<T>(params: Record<string, unknown>): Promise<T> {
    // Mock mode check
    if (this.options.mockMode) {
      return this.handleMockRequest<T>(params);
    }

    const body = new URLSearchParams();
    body.append('key', this.config.apiKey);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        body.append(key, String(value));
      }
    }

    const makeRequest = async (): Promise<T> => {
      const response = await fetchWithTimeout(
        this.config.apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        },
        this.options.timeout
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check for API error response
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error((data as JAPErrorResponse).error);
      }

      return data as T;
    };

    return retryWithBackoff(makeRequest, this.options);
  }

  /**
   * Handle mock requests
   */
  private async handleMockRequest<T>(params: Record<string, unknown>): Promise<T> {
    // Simulate network delay (100-500ms)
    await sleep(100 + Math.random() * 400);

    const action = params.action as string;

    switch (action) {
      case 'services':
        return generateMockServicesResponse() as T;

      case 'add':
        return generateMockOrderResponse(
          params.service as string,
          params.quantity as number
        ) as T;

      case 'status':
        if (params.orders) {
          // Multi-status request
          const orderIds = (params.orders as string).split(',');
          const result: Record<string, JAPOrderStatus> = {};
          for (const id of orderIds) {
            result[id] = generateMockStatusResponse(id.trim());
          }
          return result as T;
        }
        return generateMockStatusResponse(params.order as string) as T;

      case 'balance':
        return generateMockBalanceResponse() as T;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  // ============================================
  // Public API Methods
  // ============================================

  /**
   * 서비스 목록 가져오기
   */
  async fetchServices(): Promise<NormalizedService[]> {
    const services = await this.request<JAPService[]>({ action: 'services' });

    return services.map(service => this.normalizeService(service));
  }

  /**
   * 주문 생성
   */
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    try {
      const response = await this.request<JAPOrderResponse>({
        action: 'add',
        service: params.serviceId,
        link: params.link,
        quantity: params.quantity,
        ...(params.runs && { runs: params.runs }),
        ...(params.interval && { interval: params.interval }),
        ...(params.comments && { comments: params.comments }),
        ...(params.usernames && { usernames: params.usernames }),
      });

      return {
        success: true,
        orderId: response.order,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 단일 주문 상태 조회
   */
  async getOrderStatus(orderId: string | number): Promise<NormalizedOrderStatus> {
    const status = await this.request<JAPOrderStatus>({
      action: 'status',
      order: orderId,
    });

    return this.normalizeOrderStatus(String(orderId), status);
  }

  /**
   * 다중 주문 상태 조회 (최대 100개)
   */
  async getMultipleOrderStatus(
    orderIds: (string | number)[]
  ): Promise<Record<string, NormalizedOrderStatus>> {
    if (orderIds.length === 0) {
      return {};
    }

    if (orderIds.length > 100) {
      throw new Error('Maximum 100 orders per request');
    }

    const response = await this.request<Record<string, JAPOrderStatus>>({
      action: 'status',
      orders: orderIds.join(','),
    });

    const result: Record<string, NormalizedOrderStatus> = {};
    for (const [orderId, status] of Object.entries(response)) {
      result[orderId] = this.normalizeOrderStatus(orderId, status);
    }

    return result;
  }

  /**
   * 잔액 조회
   */
  async getBalance(): Promise<{ balance: number; currency: string }> {
    const response = await this.request<JAPBalanceResponse>({ action: 'balance' });

    return {
      balance: parseFloat(response.balance),
      currency: response.currency,
    };
  }

  /**
   * 주문 리필 요청
   */
  async requestRefill(orderId: string | number): Promise<boolean> {
    try {
      await this.request<{ refill: string | number }>({
        action: 'refill',
        order: orderId,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 주문 취소 요청
   */
  async cancelOrders(orderIds: (string | number)[]): Promise<Record<string, boolean>> {
    const response = await this.request<Record<string, { cancel: string | number }>>({
      action: 'cancel',
      orders: orderIds.join(','),
    });

    const result: Record<string, boolean> = {};
    for (const [orderId, data] of Object.entries(response)) {
      result[orderId] = data.cancel === 1 || data.cancel === '1';
    }

    return result;
  }

  // ============================================
  // Normalization Methods
  // ============================================

  /**
   * JAP 서비스 → 정규화된 서비스
   */
  private normalizeService(service: JAPService): NormalizedService {
    const typeMap: Record<string, NormalizedService['type']> = {
      'Default': 'default',
      'Package': 'package',
      'Subscription': 'subscription',
      'Custom Comments': 'default',
      'Custom Comments Package': 'package',
    };

    return {
      providerId: this.config.id,
      providerServiceId: String(service.service),
      name: service.name,
      type: typeMap[service.type] || 'default',
      rate: parseFloat(service.rate),
      min: parseInt(service.min, 10),
      max: parseInt(service.max, 10),
      category: service.category,
      description: service.desc,
      hasDripfeed: service.dripfeed === true,
      hasRefill: service.refill === true,
      hasCancel: service.cancel === true,
      averageTime: service.average_time,
    };
  }

  /**
   * JAP 주문 상태 → 정규화된 상태
   */
  private normalizeOrderStatus(
    orderId: string,
    status: JAPOrderStatus
  ): NormalizedOrderStatus {
    const statusMap: Record<string, OrderStatusType> = {
      'Pending': 'pending',
      'In progress': 'in_progress',
      'Processing': 'processing',
      'Completed': 'completed',
      'Partial': 'partial',
      'Canceled': 'canceled',
      'Refunded': 'refunded',
      'Failed': 'failed',
    };

    return {
      orderId,
      charge: parseFloat(status.charge),
      startCount: parseInt(status.start_count, 10),
      status: statusMap[status.status] || 'pending',
      remains: parseInt(status.remains, 10),
      currency: status.currency || 'USD',
    };
  }
}

// ============================================
// Factory Function
// ============================================
export function createProviderClient(
  config: ProviderConfig,
  options?: APIClientOptions
): ProviderAPIClient {
  return new ProviderAPIClient(config, options);
}

// ============================================
// Default Export for Common Use Cases
// ============================================
export async function fetchProviderServices(
  provider: ProviderConfig
): Promise<NormalizedService[]> {
  const client = createProviderClient(provider);
  return client.fetchServices();
}

export async function createProviderOrder(
  provider: ProviderConfig,
  params: CreateOrderParams
): Promise<CreateOrderResult> {
  const client = createProviderClient(provider);
  return client.createOrder(params);
}

export async function getProviderOrderStatus(
  provider: ProviderConfig,
  orderId: string | number
): Promise<NormalizedOrderStatus> {
  const client = createProviderClient(provider);
  return client.getOrderStatus(orderId);
}

export async function getProviderBalance(
  provider: ProviderConfig
): Promise<{ balance: number; currency: string }> {
  const client = createProviderClient(provider);
  return client.getBalance();
}

