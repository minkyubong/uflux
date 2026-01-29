// ============================================
// Mock Data for Development
// MOCK_API=true 일 때 사용되는 가짜 데이터
// ============================================

import type {
  JAPService,
  JAPOrderResponse,
  JAPOrderStatus,
  JAPBalanceResponse,
} from './types';

// ============================================
// Mock Services (도매처 서비스 목록)
// ============================================
export const MOCK_JAP_SERVICES: JAPService[] = [
  // Instagram
  {
    service: '1',
    name: 'Instagram Followers [High Quality] [30 Days Refill]',
    type: 'Default',
    rate: '0.50',
    min: '100',
    max: '100000',
    dripfeed: true,
    refill: true,
    cancel: false,
    category: 'Instagram Followers',
    desc: 'High quality followers with 30 days refill guarantee',
    average_time: '1-2 hours',
  },
  {
    service: '2',
    name: 'Instagram Likes [Real] [Instant]',
    type: 'Default',
    rate: '0.30',
    min: '50',
    max: '50000',
    dripfeed: false,
    refill: false,
    cancel: true,
    category: 'Instagram Likes',
    desc: 'Real likes from active accounts',
    average_time: '0-30 minutes',
  },
  {
    service: '3',
    name: 'Instagram Views [Reels/IGTV]',
    type: 'Default',
    rate: '0.10',
    min: '100',
    max: '1000000',
    dripfeed: true,
    refill: false,
    cancel: true,
    category: 'Instagram Views',
    average_time: '0-1 hour',
  },
  {
    service: '4',
    name: 'Instagram Comments [Custom] [Mixed]',
    type: 'Custom Comments',
    rate: '5.00',
    min: '10',
    max: '1000',
    dripfeed: false,
    refill: false,
    cancel: false,
    category: 'Instagram Comments',
    average_time: '1-6 hours',
  },

  // YouTube
  {
    service: '10',
    name: 'YouTube Views [Real] [Retention 70%+]',
    type: 'Default',
    rate: '1.50',
    min: '500',
    max: '1000000',
    dripfeed: true,
    refill: false,
    cancel: true,
    category: 'YouTube Views',
    desc: 'High retention views, safe for monetization',
    average_time: '0-6 hours',
  },
  {
    service: '11',
    name: 'YouTube Subscribers [Lifetime Guaranteed]',
    type: 'Default',
    rate: '3.00',
    min: '100',
    max: '100000',
    dripfeed: true,
    refill: true,
    cancel: false,
    category: 'YouTube Subscribers',
    average_time: '12-48 hours',
  },
  {
    service: '12',
    name: 'YouTube Likes [Instant Start]',
    type: 'Default',
    rate: '1.00',
    min: '50',
    max: '50000',
    dripfeed: false,
    refill: false,
    cancel: true,
    category: 'YouTube Likes',
    average_time: '0-2 hours',
  },
  {
    service: '13',
    name: 'YouTube Watch Time [4000 Hours Package]',
    type: 'Package',
    rate: '150.00',
    min: '1',
    max: '10',
    dripfeed: false,
    refill: false,
    cancel: false,
    category: 'YouTube Watch Time',
    desc: 'Safe for monetization, gradual delivery',
    average_time: '7-30 days',
  },

  // TikTok
  {
    service: '20',
    name: 'TikTok Followers [High Quality]',
    type: 'Default',
    rate: '0.80',
    min: '100',
    max: '500000',
    dripfeed: true,
    refill: true,
    cancel: false,
    category: 'TikTok Followers',
    average_time: '0-4 hours',
  },
  {
    service: '21',
    name: 'TikTok Likes [Real] [Instant]',
    type: 'Default',
    rate: '0.20',
    min: '100',
    max: '100000',
    dripfeed: false,
    refill: false,
    cancel: true,
    category: 'TikTok Likes',
    average_time: '0-1 hour',
  },
  {
    service: '22',
    name: 'TikTok Views [Real]',
    type: 'Default',
    rate: '0.05',
    min: '1000',
    max: '10000000',
    dripfeed: true,
    refill: false,
    cancel: true,
    category: 'TikTok Views',
    average_time: '0-1 hour',
  },

  // Twitter/X
  {
    service: '30',
    name: 'Twitter/X Followers [HQ]',
    type: 'Default',
    rate: '2.00',
    min: '100',
    max: '100000',
    dripfeed: true,
    refill: true,
    cancel: false,
    category: 'Twitter Followers',
    average_time: '0-12 hours',
  },
  {
    service: '31',
    name: 'Twitter/X Likes',
    type: 'Default',
    rate: '0.50',
    min: '50',
    max: '50000',
    dripfeed: false,
    refill: false,
    cancel: true,
    category: 'Twitter Likes',
    average_time: '0-2 hours',
  },
  {
    service: '32',
    name: 'Twitter/X Retweets',
    type: 'Default',
    rate: '0.80',
    min: '50',
    max: '50000',
    dripfeed: false,
    refill: false,
    cancel: true,
    category: 'Twitter Retweets',
    average_time: '0-2 hours',
  },

  // Telegram
  {
    service: '40',
    name: 'Telegram Channel Members [Real]',
    type: 'Default',
    rate: '1.50',
    min: '500',
    max: '100000',
    dripfeed: true,
    refill: false,
    cancel: false,
    category: 'Telegram Members',
    average_time: '0-24 hours',
  },
  {
    service: '41',
    name: 'Telegram Post Views',
    type: 'Default',
    rate: '0.05',
    min: '500',
    max: '1000000',
    dripfeed: false,
    refill: false,
    cancel: true,
    category: 'Telegram Views',
    average_time: '0-1 hour',
  },
];

// ============================================
// Mock Order Counter (for generating IDs)
// ============================================
let mockOrderCounter = 1000000;

export function generateMockOrderId(): number {
  return ++mockOrderCounter;
}

// ============================================
// Mock Order Status Storage (in-memory)
// ============================================
const mockOrderStatuses = new Map<string, JAPOrderStatus>();

export function setMockOrderStatus(orderId: string, status: JAPOrderStatus): void {
  mockOrderStatuses.set(orderId, status);
}

export function getMockOrderStatus(orderId: string): JAPOrderStatus | null {
  // Check stored status first
  const stored = mockOrderStatuses.get(orderId);
  if (stored) return stored;

  // Generate random status for unknown orders
  const statuses: JAPOrderStatus['status'][] = [
    'Pending',
    'In progress',
    'Processing',
    'Completed',
    'Partial',
  ];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  const mockStatus: JAPOrderStatus = {
    charge: (Math.random() * 100).toFixed(2),
    start_count: Math.floor(Math.random() * 10000).toString(),
    status: randomStatus,
    remains: randomStatus === 'Completed' ? '0' : Math.floor(Math.random() * 1000).toString(),
    currency: 'USD',
  };

  return mockStatus;
}

// ============================================
// Mock Balance
// ============================================
export const MOCK_BALANCE: JAPBalanceResponse = {
  balance: '1250.75',
  currency: 'USD',
};

// ============================================
// Mock Response Generators
// ============================================
export function generateMockServicesResponse(): JAPService[] {
  // Add some random delay simulation
  return MOCK_JAP_SERVICES;
}

export function generateMockOrderResponse(
  serviceId: string | number,
  quantity: number
): JAPOrderResponse {
  const orderId = generateMockOrderId();

  // Store initial status
  setMockOrderStatus(orderId.toString(), {
    charge: (parseFloat(MOCK_JAP_SERVICES.find(s => s.service.toString() === serviceId.toString())?.rate || '1') * quantity / 1000).toFixed(2),
    start_count: '0',
    status: 'Pending',
    remains: quantity.toString(),
    currency: 'USD',
  });

  return { order: orderId };
}

export function generateMockStatusResponse(orderId: string): JAPOrderStatus {
  const status = getMockOrderStatus(orderId);
  if (!status) {
    throw new Error(`Order ${orderId} not found`);
  }
  return status;
}

export function generateMockBalanceResponse(): JAPBalanceResponse {
  return MOCK_BALANCE;
}

// ============================================
// Simulate Progress (for testing)
// ============================================
export function simulateOrderProgress(orderId: string): void {
  const status = mockOrderStatuses.get(orderId);
  if (!status) return;

  const progressMap: Record<string, JAPOrderStatus['status']> = {
    'Pending': 'Processing',
    'Processing': 'In progress',
    'In progress': 'Completed',
  };

  const nextStatus = progressMap[status.status];
  if (nextStatus) {
    mockOrderStatuses.set(orderId, {
      ...status,
      status: nextStatus,
      remains: nextStatus === 'Completed' ? '0' : status.remains,
    });
  }
}

