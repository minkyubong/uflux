// ============================================
// Orders Hook
// 주문 생성 및 조회
// ============================================

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { createProviderOrder, getProviderOrderStatus } from '@/lib/api';
import type { Order, Service, Provider, OrderInsert, OrderUpdate } from '@/types/database';
import type { NormalizedOrderStatus } from '@/lib/api/types';
import { toast } from 'sonner';

// ============================================
// Query Keys
// ============================================
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
  stats: () => [...orderKeys.all, 'stats'] as const,
};

// ============================================
// Types
// ============================================
export interface OrderFilters {
  status?: string;
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface OrderWithDetails extends Order {
  service?: Service;
}

export interface CreateOrderInput {
  serviceId: string;
  link: string;
  quantity: number;
}

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  totalSpent: number;
}

// ============================================
// Fetch Functions
// ============================================
async function fetchOrders(filters: OrderFilters): Promise<OrderWithDetails[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      service:admin_products(*)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as OrderWithDetails[];
}

async function fetchOrderById(id: string): Promise<OrderWithDetails | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      service:services(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as OrderWithDetails;
}

async function fetchOrderStats(): Promise<OrderStats> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('status, amount');

  if (error) throw error;

  const stats: OrderStats = {
    total: orders?.length || 0,
    pending: 0,
    processing: 0,
    completed: 0,
    totalSpent: 0,
  };

  if (orders) {
    for (const order of orders as { status: string; amount: number }[]) {
      stats.totalSpent += order.amount || 0;

      switch (order.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'processing':
        case 'in_progress':
          stats.processing++;
          break;
        case 'completed':
          stats.completed++;
          break;
      }
    }
  }

  return stats;
}

// ============================================
// Hooks
// ============================================
export function useOrders(filters: OrderFilters = {}, enabled: boolean = true) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => fetchOrders(filters),
    enabled,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => fetchOrderById(id),
    enabled: !!id,
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: orderKeys.stats(),
    queryFn: fetchOrderStats,
    staleTime: 30 * 1000, // 30초
  });
}

// ============================================
// Create Order Mutation
// ============================================
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      // 1. 서비스 정보 조회
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select(`
          *,
          provider:providers(*)
        `)
        .eq('id', input.serviceId)
        .single();

      if (serviceError || !serviceData) throw new Error('서비스를 찾을 수 없습니다.');

      const service = serviceData as Service & { provider: Provider | null };
      const provider = service.provider;
      if (!provider) throw new Error('공급업체 정보가 없습니다.');

      // 2. 금액 계산
      const amount = (service.price / 1000) * input.quantity;

      // 3. 잔액 확인
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .single();

      if (profileError || !profileData) throw new Error('사용자 정보를 가져올 수 없습니다.');

      const profile = profileData as { balance: number | null };
      const currentBalance = profile.balance ?? 0;
      if (currentBalance < amount) throw new Error('잔액이 부족합니다.');

      // 4. 도매처 API 주문
      const providerResult = await createProviderOrder(
        {
          id: provider.id,
          name: provider.name,
          apiUrl: provider.api_url,
          apiKey: provider.api_key,
        },
        {
          serviceId: service.provider_service_id || '',
          link: input.link,
          quantity: input.quantity,
        }
      );

      if (!providerResult.success) {
        throw new Error(providerResult.error || '주문 생성에 실패했습니다.');
      }

      // 5. 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      // 6. 주문 레코드 생성
      const orderPayload: OrderInsert = {
        user_id: user.id,
        service_id: input.serviceId,
        provider_id: provider.id,
        provider_order_id: providerResult.orderId?.toString() || null,
        link: input.link,
        quantity: input.quantity,
        amount,
        status: 'pending',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: orderData, error: orderError } = await (supabase.from('orders') as any)
        .insert(orderPayload)
        .select()
        .single();

      if (orderError) throw new Error('주문 저장에 실패했습니다.');

      const order = orderData as Order;

      // 7. 거래 기록 생성
      const transactionPayload = {
        user_id: user.id,
        type: 'order' as const,
        amount: -amount,
        balance_before: currentBalance,
        balance_after: currentBalance - amount,
        description: `${service.name} 주문`,
        reference_id: order.id,
        reference_type: 'order',
        status: 'approved' as const,
        metadata: {},
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('transactions') as any).insert(transactionPayload);

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('주문이 성공적으로 생성되었습니다!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================
// Sync Order Status
// ============================================
export function useSyncOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      // 1. 주문 정보 조회
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          provider:providers(*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) throw new Error('주문을 찾을 수 없습니다.');

      const order = orderData as Order & { provider: Provider | null };
      const provider = order.provider;
      if (!provider) throw new Error('공급업체 정보가 없습니다.');
      if (!order.provider_order_id) throw new Error('도매처 주문 ID가 없습니다.');

      // 2. 도매처 API에서 상태 조회
      const status: NormalizedOrderStatus = await getProviderOrderStatus(
        {
          id: provider.id,
          name: provider.name,
          apiUrl: provider.api_url,
          apiKey: provider.api_key,
        },
        order.provider_order_id
      );

      // 3. 주문 상태 업데이트
      const updatePayload: OrderUpdate = {
        status: status.status,
        start_count: status.startCount,
        remains: status.remains,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('orders') as any)
        .update(updatePayload)
        .eq('id', orderId);

      if (updateError) throw new Error('상태 업데이트에 실패했습니다.');

      return status;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(`상태 동기화 실패: ${error.message}`);
    },
  });
}

