// ============================================
// 무료 체험 신청 페이지
// ============================================

'use client';

import { useState } from 'react';
import {
  Gift,
  Sparkles,
  Link as LinkIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useFreeTrialServices, useRequestFreeTrial } from '@/hooks/use-free-trial';
import { formatCurrency, cn } from '@/lib/utils';

// 플랫폼 아이콘 매핑
const platformIcons: Record<string, React.ElementType> = {
  instagram: FaInstagram,
  youtube: FaYoutube,
  tiktok: FaTiktok,
};

// 플랫폼 색상 매핑
const platformColors: Record<string, { bg: string; text: string; gradient: string }> = {
  instagram: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-600',
    gradient: 'from-pink-500 to-orange-500',
  },
  youtube: {
    bg: 'bg-red-500/10',
    text: 'text-red-600',
    gradient: 'from-red-500 to-red-600',
  },
  tiktok: {
    bg: 'bg-slate-800/10',
    text: 'text-slate-700',
    gradient: 'from-slate-600 to-slate-800',
  },
};

// 플랫폼 추출
function getPlatform(serviceName: string, categorySlug: string | null): string {
  const name = serviceName.toLowerCase();
  const slug = (categorySlug || '').toLowerCase();

  if (name.includes('instagram') || name.includes('인스타') || slug.includes('instagram')) {
    return 'instagram';
  }
  if (name.includes('youtube') || name.includes('유튜브') || slug.includes('youtube')) {
    return 'youtube';
  }
  if (name.includes('tiktok') || name.includes('틱톡') || slug.includes('tiktok')) {
    return 'tiktok';
  }
  return 'other';
}

export default function FreeTrialPage() {
  const { data: services, isLoading, refetch } = useFreeTrialServices();
  const requestTrial = useRequestFreeTrial();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [link, setLink] = useState('');

  const selectedService = services?.find((s) => s.service_id === selectedServiceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedServiceId || !link.trim()) return;

    requestTrial.mutate(
      { serviceId: selectedServiceId, link: link.trim() },
      {
        onSuccess: () => {
          setSelectedServiceId(null);
          setLink('');
          refetch();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" />
            무료 체험
          </h1>
          <p className="text-muted-foreground mt-1">
            매일 무료로 서비스를 체험해보세요
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* 안내 카드 */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">무료 체험 이용 안내</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 각 서비스별 하루 1회 무료 체험이 가능합니다</li>
                <li>• 일일 제공 수량이 소진되면 다음 날 다시 신청할 수 있습니다</li>
                <li>• 공개 계정에서만 이용 가능합니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 서비스 목록 */}
      {services && services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const platform = getPlatform(service.service_name, service.category_slug);
            const colors = platformColors[platform] || platformColors.instagram;
            const Icon = platformIcons[platform] || Gift;
            const remainingPercent = (service.remaining_today / service.daily_limit) * 100;
            const isSelected = selectedServiceId === service.service_id;
            const isSoldOut = service.remaining_today <= 0;

            return (
              <Card
                key={service.trial_service_id}
                className={cn(
                  'relative overflow-hidden transition-all duration-200 cursor-pointer',
                  isSelected && 'ring-2 ring-primary',
                  isSoldOut && 'opacity-60 cursor-not-allowed'
                )}
                onClick={() => !isSoldOut && setSelectedServiceId(service.service_id)}
              >
                {/* 무료 배지 */}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-accent text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    무료
                  </Badge>
                </div>

                <CardHeader className="pb-2">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-2', colors.bg)}>
                    <Icon className={cn('w-6 h-6', colors.text)} />
                  </div>
                  <CardTitle className="text-lg">{service.service_name}</CardTitle>
                  <CardDescription>
                    {formatCurrency(service.price)}/1K → 무료
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">체험 수량</span>
                    <span className="font-bold text-primary">
                      {service.trial_quantity.toLocaleString()}개
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>오늘 남은 수량</span>
                      <span>{service.remaining_today} / {service.daily_limit}</span>
                    </div>
                    <Progress value={remainingPercent} className="h-2" />
                  </div>

                  {isSoldOut && (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      오늘 소진됨 - 내일 다시 신청하세요
                    </div>
                  )}

                  {isSelected && !isSoldOut && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="h-4 w-4" />
                      선택됨
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="py-12">
          <div className="text-center">
            <Gift className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              현재 제공 중인 무료 체험 서비스가 없습니다
            </p>
          </div>
        </Card>
      )}

      {/* 신청 폼 */}
      {selectedService && (
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              무료 체험 신청
            </CardTitle>
            <CardDescription>
              {selectedService.service_name} - {selectedService.trial_quantity}개 무료
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  링크 입력
                </Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://instagram.com/p/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="h-11"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  게시물 또는 프로필 링크를 입력하세요 (공개 계정만 가능)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 btn-gradient"
                disabled={requestTrial.isPending || !link.trim()}
              >
                {requestTrial.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    신청 중...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-5 w-5" />
                    무료 체험 신청하기
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

