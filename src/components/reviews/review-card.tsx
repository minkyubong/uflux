// ============================================
// 리뷰 카드 컴포넌트
// ============================================

'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Star, ThumbsUp, CheckCircle, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Review } from '@/hooks/use-reviews';
import { useToggleHelpful } from '@/hooks/use-reviews';
import { useAuth } from '@/hooks/use-auth';

interface ReviewCardProps {
  review: Review;
  showService?: boolean;
}

// 등급별 배지 색상
const tierColors: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-700',
  vip: 'bg-amber-100 text-amber-700',
  premium: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-blue-100 text-blue-700',
};

export function ReviewCard({ review, showService = false }: ReviewCardProps) {
  const { profile } = useAuth();
  const [isHelpful, setIsHelpful] = useState(false);
  const toggleHelpful = useToggleHelpful();

  const handleHelpful = () => {
    if (!profile) return;

    toggleHelpful.mutate(review.id, {
      onSuccess: (data) => {
        setIsHelpful(data.is_helpful);
      },
    });
  };

  const userName = review.profiles?.full_name || '익명';
  const maskedName = userName.length > 2
    ? userName.slice(0, 1) + '*'.repeat(userName.length - 2) + userName.slice(-1)
    : userName;

  return (
    <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {userName.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{maskedName}</span>
              {review.is_verified && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-0.5" />
                  구매 인증
                </Badge>
              )}
              {review.profiles?.tier && review.profiles.tier !== 'basic' && (
                <Badge className={cn('text-[10px] px-1.5 py-0', tierColors[review.profiles.tier])}>
                  <Crown className="h-3 w-3 mr-0.5" />
                  {review.profiles.tier.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {/* 별점 */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-3.5 w-3.5',
                      star <= review.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <span>·</span>
              <span>
                {formatDistanceToNow(new Date(review.created_at), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 서비스 표시 */}
      {showService && review.services && (
        <Badge variant="outline" className="text-xs">
          {review.services.name}
        </Badge>
      )}

      {/* 내용 */}
      {review.content && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {review.content}
        </p>
      )}

      {/* 관리자 답변 */}
      {review.reply && (
        <div className="ml-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="text-[10px] px-1.5 py-0 bg-primary text-white">
              관리자 답변
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{review.reply}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'text-xs gap-1.5',
            isHelpful && 'text-primary'
          )}
          onClick={handleHelpful}
          disabled={!profile || toggleHelpful.isPending}
        >
          <ThumbsUp className={cn('h-3.5 w-3.5', isHelpful && 'fill-primary')} />
          도움이 됐어요
          {review.helpful_count > 0 && (
            <span className="ml-1 text-muted-foreground">({review.helpful_count})</span>
          )}
        </Button>
      </div>
    </div>
  );
}

// 별점 입력 컴포넌트
export function StarRating({
  value,
  onChange,
  size = 'default',
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'default' | 'lg';
}) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              sizes[size],
              'transition-colors',
              star <= (hoverValue || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}

// 평점 요약 컴포넌트
export function RatingSummary({
  stats,
}: {
  stats: {
    avg_rating: number;
    review_count: number;
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
  };
}) {
  const total = stats.review_count || 1;
  const bars = [
    { label: '5', count: stats.five_star, color: 'bg-green-500' },
    { label: '4', count: stats.four_star, color: 'bg-lime-500' },
    { label: '3', count: stats.three_star, color: 'bg-yellow-500' },
    { label: '2', count: stats.two_star, color: 'bg-orange-500' },
    { label: '1', count: stats.one_star, color: 'bg-red-500' },
  ];

  return (
    <div className="flex items-start gap-6">
      {/* 평균 점수 */}
      <div className="text-center">
        <div className="text-4xl font-bold">{stats.avg_rating.toFixed(1)}</div>
        <div className="flex items-center justify-center gap-0.5 my-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'h-4 w-4',
                star <= Math.round(stats.avg_rating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              )}
            />
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          {stats.review_count.toLocaleString()}개 리뷰
        </div>
      </div>

      {/* 별점 분포 */}
      <div className="flex-1 space-y-1.5">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-4">{bar.label}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full', bar.color)}
                style={{ width: `${(bar.count / total) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">
              {bar.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

