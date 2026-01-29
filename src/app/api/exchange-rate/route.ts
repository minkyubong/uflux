// ============================================
// 실시간 환율 조회 API
// USD to KRW 환율을 가져옴
// ============================================

import { NextResponse } from 'next/server';

// 캐시된 환율과 마지막 업데이트 시간
let cachedRate: number | null = null;
let lastFetched: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1시간 캐시

export async function GET() {
  try {
    const now = Date.now();

    // 캐시가 유효하면 캐시된 값 반환
    if (cachedRate && now - lastFetched < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        rate: cachedRate,
        cached: true,
        updated_at: new Date(lastFetched).toISOString(),
      });
    }

    // 여러 API 시도 (하나 실패시 다음 API 사용)
    let rate: number | null = null;

    // 1. Exchange Rate API (무료)
    try {
      const response = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD',
        { next: { revalidate: 3600 } }
      );
      if (response.ok) {
        const data = await response.json();
        rate = data.rates?.KRW;
      }
    } catch (e) {
      console.log('Exchange Rate API failed, trying next...');
    }

    // 2. Fixer.io 대체 (Open Exchange Rates 무료 대체)
    if (!rate) {
      try {
        const response = await fetch(
          'https://open.er-api.com/v6/latest/USD',
          { next: { revalidate: 3600 } }
        );
        if (response.ok) {
          const data = await response.json();
          rate = data.rates?.KRW;
        }
      } catch (e) {
        console.log('Open ER API failed');
      }
    }

    // 3. 기본값 사용
    if (!rate) {
      rate = 1450; // 기본 환율
    }

    // 캐시 업데이트
    cachedRate = rate;
    lastFetched = now;

    return NextResponse.json({
      success: true,
      rate,
      cached: false,
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Exchange rate error:', error);

    // 에러시에도 기본값 반환
    return NextResponse.json({
      success: true,
      rate: cachedRate || 1450,
      cached: true,
      error: error.message,
    });
  }
}

