"use client";

import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Gift, Zap, Shield, TrendingUp, Star, Clock, ChevronRight } from "lucide-react";
import { useGuestStore } from "@/stores/guest-store";

interface LoginPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: string; // 시도한 행동 (예: "주문하기", "충전하기")
  serviceName?: string; // 관심 서비스 이름
}

// 전환율 극대화 요소:
// 1. 맞춤형 메시지 - 사용자가 시도한 행동 기반
// 2. 혜택 강조 - 가입 시 받는 모든 혜택 나열
// 3. 긴급성 - 지금 가입해야 하는 이유
// 4. 간편함 강조 - 30초 가입
// 5. Social Proof - 이미 많은 사용자가 이용 중

export function LoginPromptModal({
  open,
  onOpenChange,
  action = "이 기능을 사용",
  serviceName,
}: LoginPromptModalProps) {
  const router = useRouter();
  const viewedServices = useGuestStore((state) => state.viewedServices);
  const getEngagementScore = useGuestStore((state) => state.getEngagementScore);
  const getMostViewedPlatform = useGuestStore((state) => state.getMostViewedPlatform);

  const engagementScore = getEngagementScore();
  const mostViewedPlatform = getMostViewedPlatform();

  // 참여도에 따른 맞춤 메시지
  const getPersonalizedMessage = () => {
    if (engagementScore >= 50) {
      return `${viewedServices.length}개의 서비스를 둘러보셨네요! 이제 직접 경험해보세요.`;
    }
    if (mostViewedPlatform) {
      const platformNames: Record<string, string> = {
        instagram: "인스타그램",
        youtube: "유튜브",
        tiktok: "틱톡",
        facebook: "페이스북",
        twitter: "트위터",
      };
      return `${platformNames[mostViewedPlatform] || mostViewedPlatform} 마케팅에 관심이 있으시군요!`;
    }
    return "UFLUX의 모든 서비스를 이용해보세요!";
  };

  const handleSignup = () => {
    onOpenChange(false);
    router.push("/login?tab=register");
  };

  const handleLogin = () => {
    onOpenChange(false);
    router.push("/login");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-primary" />
            회원 전용 기능입니다
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {/* 맞춤형 메시지 */}
            <p className="text-base text-foreground font-medium">
              {getPersonalizedMessage()}
            </p>

            {/* 시도한 행동 */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{action}</span>
                {serviceName && (
                  <>
                    {" "}
                    (<span className="text-primary">{serviceName}</span>)
                  </>
                )}
                하려면 로그인이 필요합니다.
              </span>
            </div>

            {/* 가입 혜택 - 핵심 전환 요소 */}
            <div className="bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-xl p-4 border border-primary/20">
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                30초 가입으로 받는 혜택
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Gift className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">가입 즉시 1,000P 지급</p>
                    <p className="text-xs text-muted-foreground">바로 사용 가능한 포인트</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">첫충전 20% 보너스</p>
                    <p className="text-xs text-muted-foreground">10,000원 충전 시 12,000P</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">무료 체험 서비스</p>
                    <p className="text-xs text-muted-foreground">가입 후 무료로 테스트</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 긴급성 요소 */}
            <div className="flex items-center justify-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/30 rounded-lg py-2">
              <Clock className="h-4 w-4" />
              <span>신규 가입 혜택은 <span className="font-bold">오늘까지만</span> 제공됩니다</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="sm:w-auto">
            계속 둘러보기
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSignup}
            className="btn-gradient sm:w-auto flex items-center gap-1"
          >
            무료 가입하기
            <ChevronRight className="h-4 w-4" />
          </AlertDialogAction>
        </AlertDialogFooter>

        {/* 기존 회원 링크 */}
        <div className="text-center text-sm text-muted-foreground border-t pt-3 mt-2">
          이미 계정이 있으신가요?{" "}
          <button
            onClick={handleLogin}
            className="text-primary hover:underline font-medium"
          >
            로그인
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

