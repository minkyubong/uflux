// ============================================
// 주문 처리 API (Fallback 로직 포함)
// POST /api/orders/process
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/server';
import { processOrderWithFallback } from '@/lib/api-fallback';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseRouteClient();

    // 1. 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 2. 요청 데이터 파싱
    const body = await request.json();
    const { product_id, link, quantity, comments, usernames } = body;

    if (!product_id || !link || !quantity) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 3. 상품 정보 조회
    const { data: product, error: productError } = await (supabase as any)
      .from('admin_products')
      .select(`
        *,
        category:admin_categories(*)
      `)
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: '상품을 찾을 수 없거나 비활성화되었습니다' },
        { status: 404 }
      );
    }

    // 4. 수량 검증
    if (quantity < product.min_quantity || quantity > product.max_quantity) {
      return NextResponse.json(
        {
          success: false,
          error: `수량은 ${product.min_quantity} ~ ${product.max_quantity} 사이여야 합니다`,
        },
        { status: 400 }
      );
    }

    // 5. 사용자 잔액 확인
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: '사용자 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 6. 가격 계산
    const unitPrice = product.price_per_1000 / 1000;
    const totalPrice = Math.ceil(unitPrice * quantity);

    if (profile.balance < totalPrice) {
      return NextResponse.json(
        {
          success: false,
          error: `잔액이 부족합니다. 필요: ${totalPrice.toLocaleString()}원, 보유: ${profile.balance.toLocaleString()}원`,
        },
        { status: 400 }
      );
    }

    // 7. 주문번호 생성
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `INF-${dateStr}-${randomStr}`;

    // 8. 주문 생성
    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        service_id: product_id,
        link: link,
        quantity,
        charge: totalPrice,
        unit_price: unitPrice,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { success: false, error: '주문 생성 실패' },
        { status: 500 }
      );
    }

    // 9. 잔액 차감
    const { error: balanceError } = await (supabase as any)
      .from('profiles')
      .update({ balance: profile.balance - totalPrice })
      .eq('id', user.id);

    if (balanceError) {
      // 잔액 차감 실패 시 주문 취소
      await (supabase as any).from('orders').update({ status: 'failed' }).eq('id', order.id);
      return NextResponse.json(
        { success: false, error: '잔액 차감 실패' },
        { status: 500 }
      );
    }

    // 9. API Fallback 로직으로 주문 처리
    const apiResult = await processOrderWithFallback({
      product_id,
      link,
      quantity,
      user_id: user.id,
      order_id: order.id,
      comments,
      usernames,
    });

    // 10. 주문 상태 업데이트
    if (apiResult.success) {
      await (supabase as any)
        .from('orders')
        .update({
          status: 'processing',
          provider_order_id: apiResult.provider_order_id,
          provider_id: apiResult.provider_id,
        })
        .eq('id', order.id);

      return NextResponse.json({
        success: true,
        order_id: order.id,
        provider_order_id: apiResult.provider_order_id,
        message: '주문이 성공적으로 처리되었습니다',
      });
    } else {
      // API 실패 시 - 주문은 생성되었지만 API 전송 실패
      await (supabase as any)
        .from('orders')
        .update({
          status: 'failed',
          error_message: apiResult.error,
        })
        .eq('id', order.id);

      // 잔액 환불
      await (supabase as any)
        .from('profiles')
        .update({ balance: profile.balance })
        .eq('id', user.id);

      return NextResponse.json(
        {
          success: false,
          error: apiResult.error || 'API 처리 실패',
          order_id: order.id,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Order processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

