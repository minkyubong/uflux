// ============================================
// 카카오페이 결제 준비 API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const KAKAOPAY_HOST = 'https://kapi.kakao.com';
const KAKAOPAY_CID = process.env.KAKAOPAY_CID || 'TC0ONETIME'; // 테스트용 CID
const KAKAOPAY_SECRET = process.env.KAKAOPAY_SECRET_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount } = body;

    // 금액 검증
    if (!amount || amount < 1000 || amount > 10000000) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 금액입니다. (1,000원 ~ 10,000,000원)' },
        { status: 400 }
      );
    }

    // Supabase에 결제 준비 레코드 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prepareData, error: prepareError } = await (supabase.rpc as any)(
      'prepare_kakaopay_payment',
      { p_user_id: user.id, p_amount: amount }
    );

    if (prepareError) {
      console.error('Prepare payment error:', prepareError);
      return NextResponse.json(
        { success: false, error: '결제 준비 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const partnerOrderId = prepareData.partner_order_id;
    const paymentId = prepareData.payment_id;

    // 카카오페이 API 호출
    const origin = request.headers.get('origin') || 'https://UFLUX-lab.com';

    const kakaopayParams = new URLSearchParams({
      cid: KAKAOPAY_CID,
      partner_order_id: partnerOrderId,
      partner_user_id: user.id,
      item_name: 'UFLUX 잔액 충전',
      quantity: '1',
      total_amount: amount.toString(),
      tax_free_amount: '0',
      approval_url: `${origin}/api/kakaopay/approve?payment_id=${paymentId}`,
      cancel_url: `${origin}/dashboard/deposit?status=canceled`,
      fail_url: `${origin}/dashboard/deposit?status=failed`,
    });

    const response = await fetch(`${KAKAOPAY_HOST}/v1/payment/ready`, {
      method: 'POST',
      headers: {
        'Authorization': `KakaoAK ${KAKAOPAY_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: kakaopayParams.toString(),
    });

    const kakaopayData = await response.json();

    if (!response.ok) {
      console.error('Kakaopay API error:', kakaopayData);

      // 결제 취소 처리
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('cancel_kakaopay_payment', {
        p_payment_id: paymentId,
        p_reason: kakaopayData.msg || 'API Error',
      });

      return NextResponse.json(
        { success: false, error: '카카오페이 결제 준비에 실패했습니다.' },
        { status: 500 }
      );
    }

    // TID 저장
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('kakaopay_payments') as any)
      .update({
        tid: kakaopayData.tid,
        next_redirect_pc_url: kakaopayData.next_redirect_pc_url,
        next_redirect_mobile_url: kakaopayData.next_redirect_mobile_url,
        next_redirect_app_url: kakaopayData.next_redirect_app_url,
      })
      .eq('id', paymentId);

    return NextResponse.json({
      success: true,
      data: {
        payment_id: paymentId,
        tid: kakaopayData.tid,
        next_redirect_pc_url: kakaopayData.next_redirect_pc_url,
        next_redirect_mobile_url: kakaopayData.next_redirect_mobile_url,
        next_redirect_app_url: kakaopayData.next_redirect_app_url,
      },
    });
  } catch (error) {
    console.error('Kakaopay ready error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

