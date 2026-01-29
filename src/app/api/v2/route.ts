// ============================================
// UFLUX Reseller API v2
// SMM Panel 표준 API 형식
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client (서비스 역할)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// Types
// ============================================
interface APIResponse {
  [key: string]: unknown;
}

interface ServiceResponse {
  service: number;
  name: string;
  type: string;
  rate: string;
  min: string;
  max: string;
  category: string;
  refill: boolean;
  cancel: boolean;
  dripfeed: boolean;
}

// ============================================
// Helper: API 키 검증
// ============================================
async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  userId?: string;
  apiKeyId?: string;
  error?: string;
}> {
  if (!apiKey) {
    return { valid: false, error: 'API key is required' };
  }

  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active, rate_limit, allowed_ips, expires_at, total_requests')
    .eq('api_key', apiKey)
    .single();

  if (error || !keyData) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (!keyData.is_active) {
    return { valid: false, error: 'API key is disabled' };
  }

  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // API 키 사용 기록 업데이트
  await supabase
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      total_requests: keyData.total_requests + 1,
    })
    .eq('id', keyData.id);

  return {
    valid: true,
    userId: keyData.user_id,
    apiKeyId: keyData.id,
  };
}

// ============================================
// Helper: 에러 응답
// ============================================
function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// ============================================
// Helper: 사용자 잔액 조회
// ============================================
async function getUserBalance(userId: string): Promise<number> {
  const { data } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single();

  return data?.balance || 0;
}

// ============================================
// Action: services - 서비스 목록
// ============================================
async function handleServices(): Promise<APIResponse> {
  const { data: services, error } = await supabase
    .from('services')
    .select(`
      id,
      provider_service_id,
      name,
      type,
      price,
      min_quantity,
      max_quantity,
      refill_days,
      category:categories(name)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch services');
  }

  // SMM Panel 표준 형식으로 변환
  const formattedServices: ServiceResponse[] = services.map((s: any, index: number) => ({
    service: index + 1, // 내부 서비스 ID
    name: s.name,
    type: s.type === 'default' ? 'Default' : s.type === 'package' ? 'Package' : 'Subscription',
    rate: s.price.toFixed(4),
    min: String(s.min_quantity),
    max: String(s.max_quantity),
    category: s.category?.name || 'Other',
    refill: (s.refill_days && s.refill_days > 0) || false,
    cancel: false, // 기본값
    dripfeed: false, // 기본값
  }));

  return formattedServices as unknown as APIResponse;
}

// ============================================
// Action: balance - 잔액 조회
// ============================================
async function handleBalance(userId: string): Promise<APIResponse> {
  const balance = await getUserBalance(userId);

  return {
    balance: balance.toFixed(2),
    currency: 'KRW',
  };
}

// ============================================
// Action: add - 주문 생성
// ============================================
async function handleAddOrder(
  userId: string,
  params: {
    service: string;
    link: string;
    quantity: string;
    runs?: string;
    interval?: string;
  }
): Promise<APIResponse> {
  const { service, link, quantity, runs, interval } = params;

  // 필수 파라미터 검증
  if (!service || !link || !quantity) {
    throw new Error('Missing required parameters: service, link, quantity');
  }

  const serviceIndex = parseInt(service, 10);
  const orderQuantity = parseInt(quantity, 10);

  if (isNaN(serviceIndex) || serviceIndex < 1) {
    throw new Error('Invalid service ID');
  }

  if (isNaN(orderQuantity) || orderQuantity < 1) {
    throw new Error('Invalid quantity');
  }

  // 서비스 조회 (index 기반)
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (!services || serviceIndex > services.length) {
    throw new Error('Invalid service');
  }

  const selectedService = services[serviceIndex - 1];

  // 수량 검증
  if (orderQuantity < selectedService.min_quantity) {
    throw new Error(`Minimum quantity is ${selectedService.min_quantity}`);
  }

  if (orderQuantity > selectedService.max_quantity) {
    throw new Error(`Maximum quantity is ${selectedService.max_quantity}`);
  }

  // 금액 계산
  const totalAmount = (selectedService.price / 1000) * orderQuantity;

  // 잔액 확인
  const balance = await getUserBalance(userId);
  if (balance < totalAmount) {
    throw new Error('Insufficient balance');
  }

  // 트랜잭션: 잔액 차감 + 주문 생성
  // 1. 잔액 차감
  const { error: balanceError } = await supabase
    .from('profiles')
    .update({
      balance: balance - totalAmount,
      total_spent: supabase.rpc('increment', { x: totalAmount }),
      total_orders: supabase.rpc('increment', { x: 1 }),
    })
    .eq('id', userId);

  if (balanceError) {
    throw new Error('Failed to process payment');
  }

  // 2. 주문 생성
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      service_id: selectedService.id,
      provider_id: selectedService.provider_id,
      link: link,
      quantity: orderQuantity,
      amount: totalAmount,
      status: 'pending',
      start_count: 0,
      remains: orderQuantity,
      source: 'api', // API를 통한 주문 표시
    })
    .select('id')
    .single();

  if (orderError || !order) {
    // 롤백: 잔액 복구
    await supabase
      .from('profiles')
      .update({ balance: balance })
      .eq('id', userId);

    throw new Error('Failed to create order');
  }

  // 3. 거래 내역 기록
  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'order',
    amount: -totalAmount,
    balance_after: balance - totalAmount,
    description: `API 주문: ${selectedService.name}`,
    reference_id: order.id,
  });

  return {
    order: order.id,
  };
}

// ============================================
// Action: status - 주문 상태 조회
// ============================================
async function handleStatus(
  userId: string,
  params: { order?: string; orders?: string }
): Promise<APIResponse> {
  const { order, orders } = params;

  if (!order && !orders) {
    throw new Error('Missing required parameter: order or orders');
  }

  // 단일 주문 조회
  if (order) {
    const { data: orderData, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order)
      .eq('user_id', userId)
      .single();

    if (error || !orderData) {
      throw new Error('Order not found');
    }

    return {
      charge: orderData.amount.toFixed(4),
      start_count: String(orderData.start_count || 0),
      status: formatStatus(orderData.status),
      remains: String(orderData.remains || 0),
      currency: 'KRW',
    };
  }

  // 다중 주문 조회
  const orderIds = orders!.split(',').map((id) => id.trim());

  if (orderIds.length > 100) {
    throw new Error('Maximum 100 orders per request');
  }

  const { data: ordersData, error } = await supabase
    .from('orders')
    .select('*')
    .in('id', orderIds)
    .eq('user_id', userId);

  if (error) {
    throw new Error('Failed to fetch orders');
  }

  const result: Record<string, any> = {};
  for (const o of ordersData || []) {
    result[o.id] = {
      charge: o.amount.toFixed(4),
      start_count: String(o.start_count || 0),
      status: formatStatus(o.status),
      remains: String(o.remains || 0),
      currency: 'KRW',
    };
  }

  return result;
}

// ============================================
// Action: refill - 리필 요청
// ============================================
async function handleRefill(
  userId: string,
  params: { order: string }
): Promise<APIResponse> {
  const { order } = params;

  if (!order) {
    throw new Error('Missing required parameter: order');
  }

  // 주문 조회
  const { data: orderData, error } = await supabase
    .from('orders')
    .select('*, service:services(*)')
    .eq('id', order)
    .eq('user_id', userId)
    .single();

  if (error || !orderData) {
    throw new Error('Order not found');
  }

  if (!orderData.service?.refill_days || orderData.service.refill_days <= 0) {
    throw new Error('This service does not support refill');
  }

  if (orderData.status !== 'completed' && orderData.status !== 'partial') {
    throw new Error('Order is not eligible for refill');
  }

  // 리필 상태로 변경
  await supabase
    .from('orders')
    .update({
      status: 'pending',
      refill_requested_at: new Date().toISOString(),
    })
    .eq('id', order);

  return {
    refill: order,
  };
}

// ============================================
// Action: cancel - 주문 취소
// ============================================
async function handleCancel(
  userId: string,
  params: { orders: string }
): Promise<APIResponse> {
  const { orders } = params;

  if (!orders) {
    throw new Error('Missing required parameter: orders');
  }

  const orderIds = orders.split(',').map((id) => id.trim());
  const result: Record<string, { cancel: number; error?: string }> = {};

  for (const orderId of orderIds) {
    const { data: orderData, error } = await supabase
      .from('orders')
      .select('*, service:services(*)')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error || !orderData) {
      result[orderId] = { cancel: 0, error: 'Order not found' };
      continue;
    }

    if (orderData.status !== 'pending') {
      result[orderId] = { cancel: 0, error: 'Order cannot be canceled' };
      continue;
    }

    // 주문 취소 및 환불
    const { error: cancelError } = await supabase
      .from('orders')
      .update({ status: 'canceled' })
      .eq('id', orderId);

    if (cancelError) {
      result[orderId] = { cancel: 0, error: 'Failed to cancel' };
      continue;
    }

    // 환불 처리
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ balance: profile.balance + orderData.amount })
        .eq('id', userId);

      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'refund',
        amount: orderData.amount,
        balance_after: profile.balance + orderData.amount,
        description: `API 주문 취소 환불`,
        reference_id: orderId,
      });
    }

    result[orderId] = { cancel: 1 };
  }

  return result;
}

// ============================================
// Helper: 상태 포맷팅
// ============================================
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    in_progress: 'In progress',
    completed: 'Completed',
    partial: 'Partial',
    canceled: 'Canceled',
    refunded: 'Refunded',
    failed: 'Failed',
  };
  return statusMap[status] || 'Pending';
}

// ============================================
// Main Handler
// ============================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Form data 파싱
    const formData = await request.formData();
    const key = formData.get('key') as string;
    const action = formData.get('action') as string;

    // API 키 검증
    const validation = await validateApiKey(key);
    if (!validation.valid) {
      return errorResponse(validation.error!, 401);
    }

    const userId = validation.userId!;
    const apiKeyId = validation.apiKeyId!;

    // Action 처리
    let response: APIResponse;

    switch (action) {
      case 'services':
        response = await handleServices();
        break;

      case 'balance':
        response = await handleBalance(userId);
        break;

      case 'add':
        response = await handleAddOrder(userId, {
          service: formData.get('service') as string,
          link: formData.get('link') as string,
          quantity: formData.get('quantity') as string,
          runs: formData.get('runs') as string | undefined,
          interval: formData.get('interval') as string | undefined,
        });

        // 주문 수 업데이트
        await supabase
          .from('api_keys')
          .update({ total_orders: supabase.rpc('increment', { x: 1 }) })
          .eq('id', apiKeyId);
        break;

      case 'status':
        response = await handleStatus(userId, {
          order: formData.get('order') as string | undefined,
          orders: formData.get('orders') as string | undefined,
        });
        break;

      case 'refill':
        response = await handleRefill(userId, {
          order: formData.get('order') as string,
        });
        break;

      case 'cancel':
        response = await handleCancel(userId, {
          orders: formData.get('orders') as string,
        });
        break;

      default:
        return errorResponse('Invalid action');
    }

    // 요청 로그 기록 (선택적)
    const executionTime = Date.now() - startTime;
    await supabase.from('api_request_logs').insert({
      api_key_id: apiKeyId,
      user_id: userId,
      action: action,
      request_data: Object.fromEntries(formData.entries()),
      response_data: response,
      status_code: 200,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      execution_time_ms: executionTime,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message);
  }
}

// GET 요청도 지원 (일부 패널에서 GET 사용)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // URL 파라미터를 FormData로 변환
  const formData = new FormData();
  searchParams.forEach((value, key) => {
    formData.append(key, value);
  });

  // POST와 동일한 처리를 위해 새 Request 생성
  const newRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
  });

  // formData를 직접 설정할 수 없으므로, POST 핸들러 로직을 직접 호출
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: formData,
    })
  );
}

