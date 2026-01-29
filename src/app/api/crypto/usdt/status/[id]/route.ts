// ============================================
// USDT 충전 상태 조회 API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 충전 요청 조회
    const { data: charge, error } = await (supabase as any)
      .from('usdt_charges')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !charge) {
      return NextResponse.json(
        { success: false, error: '충전 요청을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        request_id: charge.id,
        status: charge.status,
        krw_amount: charge.krw_amount,
        usdt_amount: charge.usdt_amount,
        wallet_type: charge.wallet_type,
        wallet_identifier: charge.wallet_identifier,
        created_at: charge.created_at,
        expires_at: charge.expires_at,
        transaction_hash: charge.transaction_hash,
        confirmed_at: charge.confirmed_at,
        points_added: charge.points_added || 0,
        completed_at: charge.completed_at,
      },
    });
  } catch (error: any) {
    console.error('[USDT] 상태 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
