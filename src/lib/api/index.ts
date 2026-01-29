// ============================================
// API Module Exports
// ============================================

// Types
export type {
  ProviderConfig,
  JAPAction,
  JAPService,
  JAPOrderResponse,
  JAPOrderStatus,
  JAPOrderStatusType,
  JAPBalanceResponse,
  JAPErrorResponse,
  NormalizedService,
  NormalizedOrderStatus,
  OrderStatusType,
  CreateOrderParams,
  CreateOrderResult,
  APIClientOptions,
} from './types';

export { DEFAULT_API_OPTIONS } from './types';

// Provider API Client
export {
  ProviderAPIClient,
  createProviderClient,
  fetchProviderServices,
  createProviderOrder,
  getProviderOrderStatus,
  getProviderBalance,
} from './provider';

// Mock Data (for testing)
export {
  MOCK_JAP_SERVICES,
  MOCK_BALANCE,
  generateMockOrderId,
  simulateOrderProgress,
} from './mock-data';

