// ============================================
// USDT (TRC20) 자동 충전 API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';

const ADMIN_WALLET = process.env.USDT_ADMIN_WALLET || 'TFwFDgYUJpUu6L7DcmLPY1FQh5Vwc5ewgS';
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT TRC20
const TRONSCAN_API_KEY = process.env.TRONSCAN_API_KEY;
const CONFIRMATION_TIMEOUT = 5 * 60 * 1000; // 5분

// 실시간 환율 (전역 변수)
let currentExchangeRate = 1300;

// ===== 환율 조회 =====
async function getUsdtKrwRate() {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=krw',
      { timeout: 5000 }
    );
    const rate = response.data.tether.krw;
    currentExchangeRate = rate;
    console.log(`[USDT] 환율 업데이트: ${rate} KRW/USDT`);
    return rate;
  } catch (error) {
    console.error('[USDT] 환율 조회 실패:', error);
    return currentExchangeRate;
  }
}

// 초기 환율 조회
getUsdtKrwRate();
setInterval(getUsdtKrwRate, 10 * 60 * 1000); // 10분마다 업데이트

// ===== 충전 신청 =====
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { krwAmount, walletType, walletIdentifier, fixedUsdtAmount, exchangeRate } = body;

    // 입력 검증
    if (!krwAmount || !walletType || !walletIdentifier) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 부족합니다' },
        { status: 400 }
      );
    }

    // 지갑 타입 검증
    const validWalletTypes = ['personal', 'bithumb', 'upbit', 'coinone', 'binance', 'bingx', 'lbank', 'huobi', 'okx'];
    if (!validWalletTypes.includes(walletType)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 지갑 타입입니다' },
        { status: 400 }
      );
    }

    // 개인지갑 검증
    if (walletType === 'personal' && (walletIdentifier.length !== 3 || !/^[a-zA-Z0-9]{3}$/.test(walletIdentifier))) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 지갑 주소 끝 3자리입니다' },
        { status: 400 }
      );
    }

    // 금액 검증
    const MIN_KRW = 10000;
    const MAX_KRW = 5000000;
    if (krwAmount < MIN_KRW || krwAmount > MAX_KRW) {
      return NextResponse.json(
        { success: false, error: `충전 금액은 ${MIN_KRW.toLocaleString()}원~${MAX_KRW.toLocaleString()}원 사이여야 합니다` },
        { status: 400 }
      );
    }

    // USDT 수량 계산
    const finalExchangeRate = exchangeRate || currentExchangeRate;
    const usdtAmount = fixedUsdtAmount || parseFloat((krwAmount / finalExchangeRate).toFixed(6));

    // 중복 요청 확인
    const { data: existingPending } = await (supabase as any)
      .from('usdt_charges')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (existingPending) {
      const expiresAt = new Date(existingPending.expires_at);
      const remainSeconds = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { 
          success: false, 
          error: `이미 진행 중인 충전 요청이 있습니다. ${remainSeconds}초 후 다시 시도해주세요`,
          existingRequest: {
            request_id: existingPending.id,
            usdt_amount: existingPending.usdt_amount,
            expires_in: remainSeconds,
          }
        },
        { status: 400 }
      );
    }

    // 충전 요청 생성
    const expiresAt = new Date(Date.now() + CONFIRMATION_TIMEOUT);
    const { data: charge, error: chargeError } = await (supabase as any)
      .from('usdt_charges')
      .insert({
        user_id: user.id,
        wallet_type: walletType,
        wallet_identifier: walletIdentifier,
        krw_amount: krwAmount,
        usdt_amount: usdtAmount,
        exchange_rate_at_request: finalExchangeRate,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (chargeError || !charge) {
      console.error('Charge creation error:', chargeError);
      return NextResponse.json(
        { success: false, error: '충전 신청 처리 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    console.log(`[USDT] 충전 신청: ${charge.id}`);
    console.log(`       금액: ${krwAmount} KRW | 환율: ${finalExchangeRate} | USDT: ${usdtAmount.toFixed(6)}`);

    return NextResponse.json({
      success: true,
      message: '충전 신청이 완료되었습니다. 5분 이내에 USDT를 전송해주세요',
      data: {
        request_id: charge.id,
        admin_wallet: ADMIN_WALLET,
        wallet_type: walletType,
        wallet_identifier: walletIdentifier,
        usdt_amount: usdtAmount,
        krw_amount: krwAmount,
        exchange_rate: finalExchangeRate,
        expires_at: expiresAt,
        waiting_minutes: 5,
      },
    });
  } catch (error: any) {
    console.error('[USDT] 충전 신청 실패:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// ===== 환율 조회 =====
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      krw_per_usdt: currentExchangeRate,
      updated_at: new Date(),
    },
  });
}
