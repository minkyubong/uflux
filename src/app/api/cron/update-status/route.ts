// ============================================
// Cron API: Update Order Status
// 주문 상태 자동 업데이트 API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProviderOrderStatus } from '@/lib/api';
import type { Database, Order, Provider } from '@/types/database';

// Supabase Admin Client (서비스 역할 키 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

// Lazy initialization to avoid build-time errors
let supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}

// ============================================
// Types
// ============================================
interface OrderWithProvider extends Order {
  provider: Provider | null;
}

interface UpdateResult {
  orderId: string;
  status: 'updated' | 'refunded' | 'error' | 'skipped';
  oldStatus?: string;
  newStatus?: string;
  refundAmount?: number;
  error?: string;
}

// ============================================
// Cron Secret Verification
// ============================================
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // 개발 환경에서는 secret 없이도 허용
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // 프로덕션 환경에서는 CRON_SECRET이 필수
  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET is not configured in production!');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// ============================================
// Calculate Refund for Partial Completion
// ============================================
function calculateRefund(order: Order): number {
  if (!order.remains || order.remains <= 0) return 0;
  if (!order.quantity || order.quantity <= 0) return 0;

  // 단가 계산: 총 금액 / 주문 수량
  const unitPrice = order.amount / order.quantity;

  // 환불 금액: 단가 * 남은 수량
  const refundAmount = Math.floor(unitPrice * order.remains);

  return refundAmount;
}

// ============================================
// Process Single Order
// ============================================
async function processOrder(order: OrderWithProvider): Promise<UpdateResult> {
  const result: UpdateResult = {
    orderId: order.id,
    status: 'skipped',
    oldStatus: order.status,
  };

  try {
    // 공급업체 정보 확인
    if (!order.provider) {
      result.status = 'error';
      result.error = 'Provider not found';
      return result;
    }

    // 도매처 주문 ID 확인
    if (!order.provider_order_id) {
      result.status = 'error';
      result.error = 'Provider order ID not found';
      return result;
    }

    // 도매처 API에서 상태 조회
    const providerStatus = await getProviderOrderStatus(
      {
        id: order.provider.id,
        name: order.provider.name,
        apiUrl: order.provider.api_url,
        apiKey: order.provider.api_key,
      },
      order.provider_order_id
    );

    // 상태가 동일하면 스킵
    if (providerStatus.status === order.status) {
      return result;
    }

    result.newStatus = providerStatus.status;

    // 업데이트할 데이터 준비
    const updateData: Partial<Order> = {
      status: providerStatus.status,
      start_count: providerStatus.startCount,
      remains: providerStatus.remains,
      updated_at: new Date().toISOString(),
    };

    // 완료 상태인 경우 완료 시간 기록
    if (providerStatus.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // 부분 완료(Partial) 처리 - 자동 환불 로직
    if (providerStatus.status === 'partial' && providerStatus.remains && providerStatus.remains > 0) {
      const refundAmount = calculateRefund({
        ...order,
        remains: providerStatus.remains,
      });

      if (refundAmount > 0) {
        // 환불 금액 기록
        updateData.refund_amount = refundAmount;

        // 사용자 잔액에 환불 추가 (RPC 함수 사용)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: refundError } = await (getSupabaseAdmin().rpc as any)('add_balance', {
          p_user_id: order.user_id,
          p_amount: refundAmount,
          p_type: 'refund',
          p_description: `주문 부분 완료 환불 (남은 수량: ${providerStatus.remains})`,
          p_reference_id: order.id,
          p_reference_type: 'order',
        });

        if (refundError) {
          console.error('Refund error for order:', order.id, refundError);
          result.status = 'error';
          result.error = `Refund failed: ${refundError.message}`;
          return result;
        }

        result.status = 'refunded';
        result.refundAmount = refundAmount;
      }
    }

    // 취소(Canceled) 처리 - 전액 환불
    if (providerStatus.status === 'canceled' || providerStatus.status === 'refunded') {
      const refundAmount = order.amount;

      if (refundAmount > 0 && !order.refund_amount) {
        updateData.refund_amount = refundAmount;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: refundError } = await (getSupabaseAdmin().rpc as any)('add_balance', {
          p_user_id: order.user_id,
          p_amount: refundAmount,
          p_type: 'refund',
          p_description: `주문 취소 환불`,
          p_reference_id: order.id,
          p_reference_type: 'order',
        });

        if (refundError) {
          console.error('Refund error for order:', order.id, refundError);
          result.status = 'error';
          result.error = `Refund failed: ${refundError.message}`;
          return result;
        }

        result.status = 'refunded';
        result.refundAmount = refundAmount;
      }
    }

    // 주문 상태 업데이트
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (getSupabaseAdmin().from('orders') as any)
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      result.status = 'error';
      result.error = `Update failed: ${updateError.message}`;
      return result;
    }

    if (result.status !== 'refunded') {
      result.status = 'updated';
    }

    return result;
  } catch (error) {
    result.status = 'error';
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

// ============================================
// GET Handler - Cron Job Entry Point
// ============================================
export async function GET(request: NextRequest) {
  // Cron 시크릿 검증
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const results: UpdateResult[] = [];

  try {
    // 진행 중인 주문 조회 (pending, processing, in_progress)
    const { data: orders, error: fetchError } = await getSupabaseAdmin()
      .from('orders')
      .select(`
        *,
        provider:providers(*)
      `)
      .in('status', ['pending', 'processing', 'in_progress'])
      .not('provider_order_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(100); // 한 번에 최대 100개 처리

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders to process',
        processed: 0,
        duration: Date.now() - startTime,
      });
    }

    // 각 주문 처리
    for (const order of orders) {
      const result = await processOrder(order as OrderWithProvider);
      results.push(result);

      // API Rate Limiting - 각 요청 사이에 딜레이
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // 결과 집계
    const summary = {
      total: results.length,
      updated: results.filter((r) => r.status === 'updated').length,
      refunded: results.filter((r) => r.status === 'refunded').length,
      errors: results.filter((r) => r.status === 'error').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      totalRefundAmount: results.reduce((sum, r) => sum + (r.refundAmount || 0), 0),
    };

    // API 로그 기록
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (getSupabaseAdmin().from('api_logs') as any).insert({
      endpoint: '/api/cron/update-status',
      method: 'GET',
      request_body: { ordersProcessed: orders.length },
      response_body: summary as Record<string, unknown>,
      status_code: 200,
      response_time_ms: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      summary,
      results: results.filter((r) => r.status !== 'skipped'), // 변경된 것만 반환
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Cron job error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST Handler - Manual Trigger (Admin Only)
// ============================================
export async function POST(request: NextRequest) {
  // Cron 시크릿 검증
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // GET과 동일한 로직 실행
  return GET(request);
}

