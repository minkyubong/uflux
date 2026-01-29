// ============================================
// A/B 테스트 훅
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

interface ABTestResult {
  variant: string;
  isLoading: boolean;
}

// 익명 사용자 ID 생성/조회
function getAnonymousId(): string {
  if (typeof window === 'undefined') return '';

  let anonymousId = localStorage.getItem('uflux_anonymous_id');
  if (!anonymousId) {
    anonymousId = 'anon_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('uflux_anonymous_id', anonymousId);
  }
  return anonymousId;
}

// A/B 테스트 변형 가져오기 훅
export function useABTest(testKey: string): ABTestResult {
  const { profile } = useAuth();
  const [variant, setVariant] = useState<string>('control');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchVariant() {
      try {
        const userId = profile?.id || null;
        const anonymousId = userId ? null : getAnonymousId();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('get_ab_test_variant', {
          p_test_key: testKey,
          p_user_id: userId,
          p_anonymous_id: anonymousId,
        });

        if (error) {
          console.error('AB test fetch error:', error);
          setVariant('control');
        } else {
          setVariant(data || 'control');
        }
      } catch (error) {
        console.error('AB test error:', error);
        setVariant('control');
      } finally {
        setIsLoading(false);
      }
    }

    fetchVariant();
  }, [testKey, profile?.id]);

  return { variant, isLoading };
}

// A/B 테스트 이벤트 추적 훅
export function useABTestTracker() {
  const { profile } = useAuth();

  const trackEvent = useCallback(
    async (
      testKey: string,
      eventType: 'view' | 'click' | 'conversion' | 'revenue',
      eventValue: number = 1,
      eventData: Record<string, unknown> = {}
    ) => {
      try {
        const userId = profile?.id || null;
        const anonymousId = userId ? null : getAnonymousId();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.rpc as any)('track_ab_test_event', {
          p_test_key: testKey,
          p_event_type: eventType,
          p_user_id: userId,
          p_anonymous_id: anonymousId,
          p_event_value: eventValue,
          p_event_data: eventData,
        });
      } catch (error) {
        console.error('AB test track error:', error);
      }
    },
    [profile?.id]
  );

  return { trackEvent };
}

// 특정 테스트의 변형에 따라 컴포넌트 렌더링
export function ABTestVariant({
  testKey,
  control,
  variants,
  fallback = null,
}: {
  testKey: string;
  control: React.ReactNode;
  variants: Record<string, React.ReactNode>;
  fallback?: React.ReactNode;
}) {
  const { variant, isLoading } = useABTest(testKey);

  if (isLoading) {
    return fallback;
  }

  if (variant === 'control') {
    return control;
  }

  return variants[variant] || control;
}

// 테스트별 프리셋 훅들
export function useLandingHeroTest() {
  return useABTest('landing_hero');
}

export function usePricingDisplayTest() {
  return useABTest('pricing_display');
}

export function useCheckoutFlowTest() {
  return useABTest('checkout_flow');
}

