// ============================================
// Crypto Exchange Rate API
// USDT/KRW 실시간 환율 조회 (CoinGecko)
// ============================================

import { NextResponse } from 'next/server';

// 캐시 설정: 60초간 캐싱 (ISR)
export const revalidate = 60;

// ============================================
// 설정값
// ============================================
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';
const SPREAD_PERCENTAGE = 1.5; // 1.5% 수익 마진
const FALLBACK_RATE = 1450; // API 오류 시 기본값

// ============================================
// Types
// ============================================
interface ExchangeRateResponse {
  success: boolean;
  data: {
    marketRate: number;      // 시장 가격 (CoinGecko 원본)
    systemRate: number;      // 시스템 적용 환율 (마진 포함)
    spreadPercent: number;   // 적용된 마진 퍼센트
    currency: string;        // 통화 (KRW)
    source: 'coingecko' | 'fallback';
    updatedAt: string;       // 업데이트 시간
  };
  error?: string;
}

// ============================================
// CoinGecko API 호출
// ============================================
async function fetchCoinGeckoRate(): Promise<number | null> {
  try {
    const url = `${COINGECKO_API_URL}?ids=tether&vs_currencies=krw`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      // Next.js 캐싱 - 60초
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error('[Exchange Rate] CoinGecko API error:', response.status);
      return null;
    }

    const data = await response.json();

    // 응답 형식: { "tether": { "krw": 1400.12 } }
    const rate = data?.tether?.krw;

    if (typeof rate !== 'number' || rate <= 0) {
      console.error('[Exchange Rate] Invalid rate from CoinGecko:', data);
      return null;
    }

    return rate;
  } catch (error) {
    console.error('[Exchange Rate] Failed to fetch from CoinGecko:', error);
    return null;
  }
}

// ============================================
// 마진 적용 환율 계산
// ============================================
function calculateSystemRate(marketRate: number): number {
  // 1.5% 마진 추가: 고객이 더 많은 원화를 지불
  // 예: 시장가 1400원 → 시스템 환율 1421원 (1400 * 1.015)
  return Math.ceil(marketRate * (1 + SPREAD_PERCENTAGE / 100));
}

// ============================================
// GET Handler
// ============================================
export async function GET(): Promise<NextResponse<ExchangeRateResponse>> {
  try {
    // CoinGecko에서 실시간 환율 조회
    const marketRate = await fetchCoinGeckoRate();

    if (marketRate !== null) {
      // 성공: 시장 가격 + 마진 적용
      const systemRate = calculateSystemRate(marketRate);

      return NextResponse.json({
        success: true,
        data: {
          marketRate: Math.round(marketRate * 100) / 100, // 소수점 2자리
          systemRate,
          spreadPercent: SPREAD_PERCENTAGE,
          currency: 'KRW',
          source: 'coingecko',
          updatedAt: new Date().toISOString(),
        },
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      });
    }

    // 실패: Fallback 환율 사용
    console.warn('[Exchange Rate] Using fallback rate:', FALLBACK_RATE);

    return NextResponse.json({
      success: true,
      data: {
        marketRate: FALLBACK_RATE,
        systemRate: calculateSystemRate(FALLBACK_RATE),
        spreadPercent: SPREAD_PERCENTAGE,
        currency: 'KRW',
        source: 'fallback',
        updatedAt: new Date().toISOString(),
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });

  } catch (error) {
    console.error('[Exchange Rate] Unexpected error:', error);

    // 최종 Fallback
    return NextResponse.json({
      success: true,
      data: {
        marketRate: FALLBACK_RATE,
        systemRate: calculateSystemRate(FALLBACK_RATE),
        spreadPercent: SPREAD_PERCENTAGE,
        currency: 'KRW',
        source: 'fallback',
        updatedAt: new Date().toISOString(),
      },
      error: 'External API unavailable, using fallback rate',
    });
  }
}

