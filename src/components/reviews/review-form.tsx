// ============================================
// 리뷰 작성 폼 컴포넌트
// ============================================

'use client';

import { useState } from 'react';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StarRating } from './review-card';
import { useCreateReview } from '@/hooks/use-reviews';

interface ReviewFormProps {
  orderId: string;
  serviceName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ReviewForm({
  orderId,
  serviceName,
  trigger,
  onSuccess,
}: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');

  const createReview = useCreateReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    createReview.mutate(
      { orderId, rating, content },
      {
        onSuccess: () => {
          setOpen(false);
          setRating(5);
          setContent('');
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            리뷰 작성
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>리뷰 작성</DialogTitle>
          <DialogDescription>
            {serviceName} 서비스에 대한 리뷰를 작성해주세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* 별점 */}
          <div className="space-y-3">
            <Label>만족도</Label>
            <div className="flex items-center gap-4">
              <StarRating value={rating} onChange={setRating} size="lg" />
              <span className="text-sm text-muted-foreground">
                {rating === 5 && '최고예요!'}
                {rating === 4 && '좋아요'}
                {rating === 3 && '보통이에요'}
                {rating === 2 && '아쉬워요'}
                {rating === 1 && '별로예요'}
              </span>
            </div>
          </div>

          {/* 내용 */}
          <div className="space-y-3">
            <Label htmlFor="content">리뷰 내용 (선택)</Label>
            <Textarea
              id="content"
              placeholder="서비스 이용 경험을 자유롭게 작성해주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/500
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createReview.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={createReview.isPending}>
              {createReview.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  리뷰 등록
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

