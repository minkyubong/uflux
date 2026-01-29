// ============================================
// 추천인/리퍼럴 페이지
// 추천 코드 공유 및 보상 확인
// ============================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Gift,
  Copy,
  Share2,
  CheckCircle,
  TrendingUp,
  Award,
  Link as LinkIcon,
  MessageCircle,
  Twitter,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================
// 리퍼럴 보상 설정
// ============================================
const REFERRAL_REWARD = {
  referrer: 3000, // 추천인 보상
  referred: 2000, // 피추천인 보상
  minDeposit: 10000, // 최소 충전 금액 조건
};

// ============================================
// 타입 정의
// ============================================
interface ReferralStats {
  totalReferrals: number;
  totalRewards: number;
  pendingReferrals: number;
}

interface ReferredUser {
  id: string;
  email: string;
  created_at: string;
  status: 'pending' | 'completed';
}

// ============================================
// 메인 컴포넌트
// ============================================
export default function ReferralPage() {
  const { profile, isLoading: authLoading, refreshProfile } = useAuth();
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const referralCode = profile?.referral_code || '';
  const referralLink = `https://www.UFLUX-lab.com/login?ref=${referralCode}`;
  const isLoading = authLoading || dataLoading;

  // 추천 코드 생성 함수
  const generateReferralCode = async (userId: string) => {
    const code = 'INF' + Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ referral_code: code } as never)
        .eq('id', userId);

      if (!error) {
        await refreshProfile();
        toast.success('추천 코드가 생성되었습니다!');
      }
    } catch (err) {
      console.error('Failed to generate referral code:', err);
    }
  };

  // 추천 통계 로드
  useEffect(() => {
    const loadReferralData = async () => {
      if (authLoading) return; // 인증 로딩 중이면 대기

      // 추천 코드가 없으면 자동 생성
      if (profile?.id && !profile?.referral_code) {
        await generateReferralCode(profile.id);
        return;
      }

      if (!profile?.referral_code) {
        setDataLoading(false);
        return;
      }

      try {
        // 이 사용자를 추천인으로 가입한 사용자들 조회
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, created_at, total_spent')
          .eq('referred_by', profile.referral_code)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // 상태 계산 (최소 충전 금액 달성 여부)
        interface ProfileData {
          id: string;
          email: string;
          created_at: string;
          total_spent: number | null;
        }
        const users = ((data || []) as ProfileData[]).map(user => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          status: (user.total_spent || 0) >= REFERRAL_REWARD.minDeposit ? 'completed' : 'pending',
        })) as ReferredUser[];

        setReferredUsers(users);
      } catch (error) {
        console.error('Error loading referral data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadReferralData();
  }, [profile?.referral_code, authLoading]);

  // 통계 계산
  const stats: ReferralStats = useMemo(() => {
    const completed = referredUsers.filter(u => u.status === 'completed');
    return {
      totalReferrals: referredUsers.length,
      totalRewards: completed.length * REFERRAL_REWARD.referrer,
      pendingReferrals: referredUsers.filter(u => u.status === 'pending').length,
    };
  }, [referredUsers]);

  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast.success('추천 링크가 복사되었습니다');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다');
    }
  };

  // 코드 복사
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast.success('추천 코드가 복사되었습니다');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다');
    }
  };

  // SNS 공유
  const handleShare = (platform: string) => {
    const text = `UFLUX에서 SNS 마케팅을 시작하세요! 내 추천 코드로 가입하면 ${formatCurrency(REFERRAL_REWARD.referred)} 보너스!`;
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`,
      kakao: `https://story.kakao.com/share?url=${encodeURIComponent(referralLink)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          친구 추천
        </h1>
        <p className="text-muted-foreground mt-1">
          친구를 초대하고 함께 혜택을 받으세요
        </p>
      </div>

      {/* 보상 안내 배너 */}
      <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">친구 추천 보상</h3>
                <p className="text-sm text-muted-foreground">
                  친구가 {formatCurrency(REFERRAL_REWARD.minDeposit)} 이상 충전하면 보상 지급!
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">나의 보상</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(REFERRAL_REWARD.referrer)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">친구 보상</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(REFERRAL_REWARD.referred)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 추천 수</p>
                <p className="text-2xl font-bold">{stats.totalReferrals}명</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">받은 보상</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalRewards)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">대기 중</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingReferrals}명</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 추천 코드 & 링크 */}
      <Card>
        <CardHeader>
          <CardTitle>내 추천 코드</CardTitle>
          <CardDescription>
            아래 코드나 링크를 친구에게 공유하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 추천 코드 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">추천 코드</label>
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="font-mono text-lg font-bold tracking-wider bg-muted"
              />
              <Button
                variant="outline"
                onClick={handleCopyCode}
                className={cn(copiedCode && 'bg-green-50 border-green-300')}
              >
                {copiedCode ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 추천 링크 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">추천 링크</label>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm bg-muted"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className={cn(copiedLink && 'bg-green-50 border-green-300')}
              >
                {copiedLink ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 공유 버튼 */}
          <div className="pt-4">
            <label className="text-sm font-medium block mb-3">SNS 공유</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleShare('kakao')}
                className="bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
              >
                <MessageCircle className="mr-2 h-4 w-4 text-yellow-600" />
                카카오톡
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('twitter')}
                className="bg-blue-50 border-blue-300 hover:bg-blue-100"
              >
                <Twitter className="mr-2 h-4 w-4 text-blue-500" />
                트위터
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyLink}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                링크 복사
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 추천 내역 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            추천 내역
            {referredUsers.length > 0 && (
              <Badge variant="outline">{referredUsers.length}명</Badge>
            )}
          </CardTitle>
          <CardDescription>
            내가 추천한 친구 목록입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">아직 추천한 친구가 없습니다</h3>
              <p className="text-sm text-muted-foreground">
                위의 추천 코드를 친구에게 공유해보세요!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>가입자</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>보상</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <span className="font-medium">
                          {user.email.split('@')[0].substring(0, 3)}***@{user.email.split('@')[1]}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            user.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {user.status === 'completed' ? '완료' : '대기'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.status === 'completed' ? (
                          <span className="font-medium text-emerald-600">
                            {formatCurrency(REFERRAL_REWARD.referrer)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {formatCurrency(REFERRAL_REWARD.minDeposit)} 충전 시 지급
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이용 안내 */}
      <Card>
        <CardHeader>
          <CardTitle>이용 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-medium">추천 코드 공유</p>
              <p className="text-sm text-muted-foreground">
                친구에게 내 추천 코드나 링크를 공유합니다.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-medium">친구 가입</p>
              <p className="text-sm text-muted-foreground">
                친구가 추천 코드를 입력하고 회원가입합니다.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-medium">충전 완료</p>
              <p className="text-sm text-muted-foreground">
                친구가 {formatCurrency(REFERRAL_REWARD.minDeposit)} 이상 충전하면 보상이 지급됩니다.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium">보상 지급</p>
              <p className="text-sm text-muted-foreground">
                나와 친구 모두에게 보너스가 지급됩니다!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

