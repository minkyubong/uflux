// ============================================
// API Fallback 주문 처리 로직
// Primary → Fallback1 → Fallback2 순으로 시도
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ApiProvider {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
}

interface Product {
  id: string;
  name: string;
  primary_provider_id: string | null;
  primary_service_id: string | null;
  fallback1_provider_id: string | null;
  fallback1_service_id: string | null;
  fallback2_provider_id: string | null;
  fallback2_service_id: string | null;
}

interface OrderRequest {
  product_id: string;
  link: string;
  quantity: number;
  user_id: string;
  order_id: string; // Internal order ID
  comments?: string; // For comment services
  usernames?: string; // For username services
}

interface ApiOrderResult {
  success: boolean;
  provider_order_id?: string;
  error?: string;
  provider_id?: string;
  attempt_number?: number;
}

// SMM Panel 표준 API로 주문 전송
async function sendOrderToProvider(
  provider: ApiProvider,
  serviceId: string,
  link: string,
  quantity: number,
  comments?: string,
  usernames?: string
): Promise<{ success: boolean; order_id?: string; error?: string }> {
  try {
    const formData = new URLSearchParams();
    formData.append('key', provider.api_key);
    formData.append('action', 'add');
    formData.append('service', serviceId);
    formData.append('link', link);
    formData.append('quantity', quantity.toString());

    // Optional fields
    if (comments) {
      formData.append('comments', comments);
    }
    if (usernames) {
      formData.append('usernames', usernames);
    }

    const response = await fetch(provider.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    // SMM Panel 표준 응답: { order: 12345 } or { error: "..." }
    if (data.order) {
      return { success: true, order_id: data.order.toString() };
    }

    return { success: false, error: data.error || 'Unknown error' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

// 주문 로그 기록
async function logOrderAttempt(
  orderId: string,
  productId: string,
  providerId: string,
  serviceId: string,
  attemptNumber: number,
  status: 'pending' | 'success' | 'failed',
  providerOrderId?: string,
  errorMessage?: string,
  responseData?: any
) {
  await supabase.from('order_api_logs').insert({
    order_id: orderId,
    product_id: productId,
    provider_id: providerId,
    provider_service_id: serviceId,
    provider_order_id: providerOrderId || null,
    attempt_number: attemptNumber,
    status,
    error_message: errorMessage || null,
    response_data: responseData || null,
  });
}

// Fallback 로직으로 주문 처리
export async function processOrderWithFallback(
  request: OrderRequest
): Promise<ApiOrderResult> {
  // 1. 상품 정보 조회
  const { data: product, error: productError } = await supabase
    .from('admin_products')
    .select('*')
    .eq('id', request.product_id)
    .single();

  if (productError || !product) {
    return { success: false, error: '상품을 찾을 수 없습니다' };
  }

  // 2. API Provider 목록 조회
  const { data: providers } = await supabase
    .from('api_providers')
    .select('*')
    .eq('is_active', true);

  if (!providers || providers.length === 0) {
    return { success: false, error: '활성화된 API 공급자가 없습니다' };
  }

  const providerMap = new Map(providers.map((p) => [p.id, p]));

  // 3. Fallback 순서대로 시도
  const attempts: Array<{
    provider_id: string | null;
    service_id: string | null;
    attempt: number;
  }> = [
    {
      provider_id: product.primary_provider_id,
      service_id: product.primary_service_id,
      attempt: 1,
    },
    {
      provider_id: product.fallback1_provider_id,
      service_id: product.fallback1_service_id,
      attempt: 2,
    },
    {
      provider_id: product.fallback2_provider_id,
      service_id: product.fallback2_service_id,
      attempt: 3,
    },
  ];

  for (const { provider_id, service_id, attempt } of attempts) {
    if (!provider_id || !service_id) continue;

    const provider = providerMap.get(provider_id);
    if (!provider) continue;

    console.log(
      `[Order ${request.order_id}] Attempt ${attempt}: ${provider.name} (Service: ${service_id})`
    );

    // 주문 시도
    const result = await sendOrderToProvider(
      provider,
      service_id,
      request.link,
      request.quantity,
      request.comments,
      request.usernames
    );

    if (result.success && result.order_id) {
      // 성공 로그 기록
      await logOrderAttempt(
        request.order_id,
        request.product_id,
        provider_id,
        service_id,
        attempt,
        'success',
        result.order_id,
        undefined,
        result
      );

      console.log(
        `[Order ${request.order_id}] Success with ${provider.name} - Provider Order: ${result.order_id}`
      );

      return {
        success: true,
        provider_order_id: result.order_id,
        provider_id: provider_id,
        attempt_number: attempt,
      };
    }

    // 실패 로그 기록
    await logOrderAttempt(
      request.order_id,
      request.product_id,
      provider_id,
      service_id,
      attempt,
      'failed',
      undefined,
      result.error,
      result
    );

    console.log(
      `[Order ${request.order_id}] Failed with ${provider.name}: ${result.error}`
    );

    // 다음 Fallback 시도
  }

  return {
    success: false,
    error: '모든 API 공급자 시도 실패',
  };
}

// 주문 상태 확인 (Provider API)
export async function checkOrderStatus(
  providerId: string,
  providerOrderId: string
): Promise<{
  status: string;
  start_count?: number;
  remains?: number;
  error?: string;
}> {
  const { data: provider } = await supabase
    .from('api_providers')
    .select('*')
    .eq('id', providerId)
    .single();

  if (!provider) {
    return { status: 'error', error: 'Provider not found' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('key', provider.api_key);
    formData.append('action', 'status');
    formData.append('order', providerOrderId);

    const response = await fetch(provider.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    // SMM Panel 표준 응답
    // { status: "Pending|Processing|In progress|Completed|Partial|Canceled", charge: "0.27", start_count: "1000", remains: "50" }
    if (data.status) {
      return {
        status: data.status,
        start_count: data.start_count ? parseInt(data.start_count) : undefined,
        remains: data.remains ? parseInt(data.remains) : undefined,
      };
    }

    return { status: 'error', error: data.error || 'Unknown error' };
  } catch (error: any) {
    return { status: 'error', error: error.message };
  }
}

// 주문 취소 (Provider API)
export async function cancelOrder(
  providerId: string,
  providerOrderId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: provider } = await supabase
    .from('api_providers')
    .select('*')
    .eq('id', providerId)
    .single();

  if (!provider) {
    return { success: false, error: 'Provider not found' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('key', provider.api_key);
    formData.append('action', 'cancel');
    formData.append('order', providerOrderId);

    const response = await fetch(provider.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    // SMM Panel 표준 응답: { cancel: 1 } or { error: "..." }
    if (data.cancel) {
      return { success: true };
    }

    return { success: false, error: data.error || 'Cancel failed' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 주문 리필 요청 (Provider API)
export async function refillOrder(
  providerId: string,
  providerOrderId: string
): Promise<{ success: boolean; refill_id?: string; error?: string }> {
  const { data: provider } = await supabase
    .from('api_providers')
    .select('*')
    .eq('id', providerId)
    .single();

  if (!provider) {
    return { success: false, error: 'Provider not found' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('key', provider.api_key);
    formData.append('action', 'refill');
    formData.append('order', providerOrderId);

    const response = await fetch(provider.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    // SMM Panel 표준 응답: { refill: "1" } or { error: "..." }
    if (data.refill) {
      return { success: true, refill_id: data.refill.toString() };
    }

    return { success: false, error: data.error || 'Refill failed' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

