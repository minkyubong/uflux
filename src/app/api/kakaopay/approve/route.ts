// ============================================
// 카카오페이 결제 승인 API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const KAKAOPAY_HOST = 'https://kapi.kakao.com';
const KAKAOPAY_CID = process.env.KAKAOPAY_CID || 'TC0ONETIME';
const KAKAOPAY_SECRET = process.env.KAKAOPAY_SECRET_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pgToken = searchParams.get('pg_token');
    const paymentId = searchParams.get('payment_id');

    if (!pgToken || !paymentId) {
      return NextResponse.redirect(
        new URL('/dashboard/deposit?status=failed&error=invalid_params', request.url)
      );
    }

    const supabase = await createClient();

    // 결제 정보 조회
    const { data: payment, error: paymentError } = await supabase
      .from('kakaopay_payments')
      .select('*')
      .eq('id', paymentId)
      .single() as { data: { id: string; tid: string; partner_order_id: string; partner_user_id: string; total_amount: number; status: string; user_id: string } | null; error: unknown };

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return NextResponse.redirect(
        new URL('/dashboard/deposit?status=failed&error=payment_not_found', request.url)
      );
    }

    if (payment.status !== 'ready') {
      return NextResponse.redirect(
        new URL('/dashboard/deposit?status=failed&error=already_processed', request.url)
      );
    }

    // 카카오페이 결제 승인 요청
    const kakaopayParams = new URLSearchParams({
      cid: KAKAOPAY_CID,
      tid: payment.tid,
      partner_order_id: payment.partner_order_id,
      partner_user_id: payment.partner_user_id,
      pg_token: pgToken,
    });

    const response = await fetch(`${KAKAOPAY_HOST}/v1/payment/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `KakaoAK ${KAKAOPAY_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: kakaopayParams.toString(),
    });

    const kakaopayData = await response.json();

    if (!response.ok) {
      console.error('Kakaopay approve error:', kakaopayData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('kakaopay_payments') as any)
        .update({
          status: 'failed',
          error_code: kakaopayData.code?.toString(),
          error_message: kakaopayData.msg,
        })
        .eq('id', paymentId);

      return NextResponse.redirect(
        new URL(`/dashboard/deposit?status=failed&error=${encodeURIComponent(kakaopayData.msg || 'approve_failed')}`, request.url)
      );
    }

    // 결제 승인 처리 (잔액 충전 및 보너스 적용)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: approveError } = await (supabase.rpc as any)('approve_kakaopay_payment', {
      p_payment_id: paymentId,
      p_tid: payment.tid,
      p_payment_method_type: kakaopayData.payment_method_type,
      p_card_info: kakaopayData.card_info || null,
    });

    if (approveError) {
      console.error('Approve payment error:', approveError);
      return NextResponse.redirect(
        new URL('/dashboard/deposit?status=failed&error=approve_error', request.url)
      );
    }

    // 성공 리다이렉트
    return NextResponse.redirect(
      new URL(`/dashboard/deposit?status=success&amount=${payment.total_amount}`, request.url)
    );
  } catch (error) {
    console.error('Kakaopay approve error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/deposit?status=failed&error=server_error', request.url)
    );
  }
}

