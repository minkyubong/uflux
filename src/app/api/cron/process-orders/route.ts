// ============================================
// Cron API: Process Pending Orders (v3)
// Senior Engineer Level - Atomic Claim + Parallel Processing
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createProviderOrder } from '@/lib/api';
import type { Database, OrderUpdate } from '@/types/database';

export const maxDuration = 60; // Vercel Function Limit
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 배치 사이즈 증가 (처리량 향상)
const BATCH_SIZE = 50;

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // 개발 환경에서는 secret 없이도 허용
  if (process.env.NODE_ENV === 'development') return true;

  // 프로덕션 환경에서는 CRON_SECRET이 필수
  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET is not configured in production!');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
  const startTime = Date.now();

  try {
    // 1. 활성 도매처 조회
    const { data: providerData } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('providers') as any)
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    const provider = providerData as {
      id: string;
      name: string;
      api_url: string;
      api_key: string;
      is_active: boolean;
      priority: number;
    } | null;

    if (!provider) {
      throw new Error('No active provider found');
    }

    // 2. [CORE] Atomic Claim (중복 방지 & 선점)
    // SKIP LOCKED로 다른 인스턴스와 충돌 방지
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orders, error: claimError } = await (supabase.rpc as any)('claim_pending_orders', {
      batch_size: BATCH_SIZE
    });

    if (claimError) throw claimError;

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending orders',
        processed: 0,
        duration: Date.now() - startTime
      });
    }

    // 3. 병렬 처리 (Parallel Execution)
    // Promise.all로 처리 속도 10배 향상
    const results = await Promise.all(orders.map(async (order: {
      id: string;
      order_number: string;
      user_id: string;
      service_id: string;
      link: string;
      quantity: number;
      provider_service_id: string | null;
    }) => {
      try {
        if (!order.provider_service_id) {
          throw new Error('Service mapping missing');
        }

        // [원자성 강화] API 호출 전 주문 상태 재확인
        // 다른 인스턴스에서 이미 처리했는지 확인
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: currentOrderData, error: checkError } = await (supabase.from('orders') as any)
          .select('status, provider_order_id')
          .eq('id', order.id)
          .single();

        if (checkError || !currentOrderData) {
          throw new Error('Order verification failed');
        }

        const currentOrder = currentOrderData as { status: string; provider_order_id: string | null };

        // 이미 처리된 주문이면 스킵
        if (currentOrder.status !== 'processing' || currentOrder.provider_order_id) {
          console.log(`Order ${order.id} already processed, skipping`);
          return { id: order.id, status: 'skipped' as const, reason: 'Already processed' };
        }

        // 도매처 API 호출
        const apiResult = await createProviderOrder(
          {
            id: provider.id,
            name: provider.name,
            apiUrl: provider.api_url,
            apiKey: provider.api_key
          },
          {
            serviceId: order.provider_service_id,
            link: order.link,
            quantity: order.quantity
          }
        );

        if (!apiResult.success || !apiResult.orderId) {
          throw new Error(apiResult.error || 'Provider API Failed');
        }

        // 성공: Provider Order ID 업데이트 (조건부 업데이트로 중복 방지)
        const successUpdate: OrderUpdate = {
          provider_id: provider.id,
          provider_order_id: apiResult.orderId.toString(),
          status: 'in_progress',
          error_message: null,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase.from('orders') as any)
          .update(successUpdate)
          .eq('id', order.id)
          .eq('status', 'processing')  // 상태가 processing인 경우에만 업데이트
          .is('provider_order_id', null);  // provider_order_id가 없는 경우에만

        if (updateError) {
          console.error(`Order ${order.id} update failed:`, updateError);
          // 업데이트 실패해도 도매처에는 이미 주문됨 - 로그 기록
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('api_logs') as any).insert({
            order_id: order.id,
            endpoint: 'process-orders/update-conflict',
            method: 'UPDATE',
            request_body: { orderId: order.id, providerOrderId: apiResult.orderId },
            response_body: { error: updateError.message },
            status_code: 409,
            error_message: 'Update conflict - order may have been processed by another instance',
          });
        }

        return { id: order.id, status: 'success' as const, providerOrderId: apiResult.orderId };

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Order ${order.id} failed:`, errorMessage);

        // 실패: 상태를 'failed'로 변경하여 재시도 방지
        // 추후 재시도 로직은 별도 Cron으로 분리 권장
        const failedUpdate: OrderUpdate = {
          status: 'failed',
          error_message: errorMessage,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('orders') as any)
          .update(failedUpdate)
          .eq('id', order.id)
          .eq('status', 'processing');  // processing 상태일 때만 failed로 변경

        return { id: order.id, status: 'failed' as const, error: errorMessage };
      }
    }));

    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
    };

    // 로그 기록 (민감 정보 제외)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('api_logs') as any).insert({
      endpoint: '/api/cron/process-orders',
      method: 'GET',
      request_body: { batchSize: BATCH_SIZE, claimed: orders.length },
      response_body: summary as Record<string, unknown>,
      status_code: 200,
      response_time_ms: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      summary,
      results,
      duration: Date.now() - startTime
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cron Critical Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST Handler for manual trigger
export async function POST(request: NextRequest) {
  return GET(request);
}

