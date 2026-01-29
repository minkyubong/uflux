// ============================================
// API Provider 잔액 확인 API
// SMM Panel API의 balance 확인
// ============================================

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { provider_id, api_url, api_key } = await request.json();

    if (!api_url || !api_key) {
      return NextResponse.json(
        { success: false, error: 'API URL과 Key가 필요합니다' },
        { status: 400 }
      );
    }

    // SMM Panel 표준 API - balance 조회
    const formData = new URLSearchParams();
    formData.append('key', api_key);
    formData.append('action', 'balance');

    const response = await fetch(api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    // SMM Panel 표준 응답: { balance: "123.45", currency: "USD" }
    if (data.balance !== undefined) {
      return NextResponse.json({
        success: true,
        balance: parseFloat(data.balance),
        currency: data.currency || 'USD',
        raw: data,
      });
    }

    // 에러 응답
    return NextResponse.json({
      success: false,
      error: data.error || 'Unknown error',
      raw: data,
    });
  } catch (error: any) {
    console.error('Balance check error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

