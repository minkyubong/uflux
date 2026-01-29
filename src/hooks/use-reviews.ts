// ============================================
// 리뷰 훅
// ============================================

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Review {
  id: string;
  user_id: string;
  service_id: string;
  order_id: string | null;
  rating: number;
  content: string | null;
  is_verified: boolean;
  is_featured: boolean;
  helpful_count: number;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    tier: string;
  };
  services: {
    id: string;
    name: string;
  };
}

export interface ServiceRatingStats {
  service_id: string;
  service_name: string;
  review_count: number;
  avg_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

// 리뷰 쿼리 키
export const reviewKeys = {
  all: ['reviews'] as const,
  service: (serviceId: string) => ['reviews', 'service', serviceId] as const,
  user: (userId: string) => ['reviews', 'user', userId] as const,
};

// 서비스별 리뷰 조회 훅
export function useServiceReviews(serviceId: string | null, options?: { limit?: number }) {
  return useQuery({
    queryKey: reviewKeys.service(serviceId || ''),
    queryFn: async () => {
      if (!serviceId) return { reviews: [], stats: null };

      const response = await fetch(
        `/api/reviews?service_id=${serviceId}&limit=${options?.limit || 10}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data as { reviews: Review[]; stats: ServiceRatingStats | null };
    },
    enabled: !!serviceId,
  });
}

// 전체 리뷰 조회 (최근순)
export function useRecentReviews(limit: number = 10) {
  return useQuery({
    queryKey: [...reviewKeys.all, 'recent', limit],
    queryFn: async () => {
      const response = await fetch(`/api/reviews?limit=${limit}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data.reviews as Review[];
    },
  });
}

// 내 리뷰 조회
export function useMyReviews() {
  return useQuery({
    queryKey: [...reviewKeys.all, 'my'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          services:service_id (id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
  });
}

// 리뷰 작성 뮤테이션
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      rating,
      content,
    }: {
      orderId: string;
      rating: number;
      content?: string;
    }) => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          rating,
          content,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      toast.success('리뷰가 작성되었습니다!');
    },
    onError: (error: Error) => {
      toast.error(error.message || '리뷰 작성에 실패했습니다.');
    },
  });
}

// 도움이 됐어요 토글 뮤테이션
export function useToggleHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await fetch('/api/reviews/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || '처리에 실패했습니다.');
    },
  });
}

// 별점 표시용 유틸
export function getStarDisplay(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// 평점 등급 라벨
export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return '최고';
  if (rating >= 4.0) return '훌륭함';
  if (rating >= 3.0) return '좋음';
  if (rating >= 2.0) return '보통';
  return '개선 필요';
}

