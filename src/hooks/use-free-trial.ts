// ============================================
// 무료 체험 훅
// ============================================

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface FreeTrialService {
  trial_service_id: string;
  service_id: string;
  service_name: string;
  price: number;
  trial_quantity: number;
  daily_limit: number;
  today_used: number;
  remaining_today: number;
  is_active: boolean;
  category_name: string | null;
  category_slug: string | null;
}

export interface FreeTrialRequest {
  id: string;
  user_id: string;
  service_id: string;
  link: string;
  quantity: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

// 쿼리 키
export const freeTrialKeys = {
  all: ['free-trials'] as const,
  services: ['free-trials', 'services'] as const,
  my: ['free-trials', 'my'] as const,
};

// 무료 체험 서비스 목록 조회
export function useFreeTrialServices() {
  return useQuery({
    queryKey: freeTrialKeys.services,
    queryFn: async () => {
      const response = await fetch('/api/free-trial');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data as FreeTrialService[];
    },
    staleTime: 60 * 1000, // 1분
  });
}

// 무료 체험 신청 뮤테이션
export function useRequestFreeTrial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceId,
      link,
    }: {
      serviceId: string;
      link: string;
    }) => {
      const response = await fetch('/api/free-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          link,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: freeTrialKeys.all });
      toast.success('무료 체험 신청 완료!', {
        description: `${data.quantity}개가 곧 배송됩니다.`,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || '무료 체험 신청에 실패했습니다.');
    },
  });
}

// 플랫폼별 무료 체험 서비스 필터
export function filterTrialsByPlatform(
  services: FreeTrialService[],
  platform: 'instagram' | 'youtube' | 'tiktok' | 'all'
): FreeTrialService[] {
  if (platform === 'all') return services;

  return services.filter((s) => {
    const name = s.service_name.toLowerCase();
    const category = (s.category_slug || '').toLowerCase();

    switch (platform) {
      case 'instagram':
        return name.includes('instagram') || name.includes('인스타') || category.includes('instagram');
      case 'youtube':
        return name.includes('youtube') || name.includes('유튜브') || category.includes('youtube');
      case 'tiktok':
        return name.includes('tiktok') || name.includes('틱톡') || category.includes('tiktok');
      default:
        return true;
    }
  });
}

