'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ShareButtonClient() {
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 복사되었습니다');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 border-white/20 text-white/60 hover:text-white hover:bg-white/10"
      onClick={handleShare}
    >
      <Share2 className="w-4 h-4" />
      공유하기
    </Button>
  );
}
