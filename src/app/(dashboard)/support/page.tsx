// ============================================
// 고객센터 페이지
// 1:1 문의, FAQ, 공지사항
// ============================================

'use client';

import { useState, useEffect } from 'react';
import {
  MessageCircle,
  HelpCircle,
  Bell,
  Send,
  Loader2,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Phone,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { formatRelativeTime, cn } from '@/lib/utils';
import type { Announcement } from '@/types/database';

// ============================================
// FAQ 데이터
// ============================================
const FAQ_DATA = [
  {
    category: '주문',
    items: [
      {
        question: '주문 후 얼마나 걸리나요?',
        answer: '대부분의 서비스는 주문 후 즉시~24시간 내에 시작됩니다. 서비스별로 처리 시간이 다를 수 있으며, 주문 페이지에서 예상 시간을 확인하실 수 있습니다.',
      },
      {
        question: '주문을 취소할 수 있나요?',
        answer: '주문이 "대기 중" 상태일 때만 취소가 가능합니다. 이미 처리가 시작된 주문은 취소가 불가능하며, 부분 환불이 진행될 수 있습니다.',
      },
      {
        question: '주문 수량이 부족하게 들어왔어요.',
        answer: '일부 서비스는 자연 감소가 발생할 수 있습니다. 주문 수량의 10% 이상 부족한 경우 고객센터로 문의해 주시면 재처리 또는 환불 처리해 드립니다.',
      },
    ],
  },
  {
    category: '결제',
    items: [
      {
        question: '어떤 결제 방법을 지원하나요?',
        answer: '무통장 입금과 USDT(TRC-20) 암호화폐 결제를 지원합니다. 무통장 입금은 입금 확인 후 자동으로 충전되며, USDT는 블록체인 확인 후 충전됩니다.',
      },
      {
        question: '충전한 잔액을 환불받을 수 있나요?',
        answer: '충전된 잔액의 환불은 원칙적으로 불가능합니다. 단, 서비스 이용이 불가능한 특별한 사유가 있는 경우 고객센터로 문의해 주세요.',
      },
      {
        question: '입금했는데 충전이 안 됐어요.',
        answer: '입금자명이 다르거나 금액이 다른 경우 자동 충전이 되지 않을 수 있습니다. 입금 내역과 함께 고객센터로 문의해 주세요.',
      },
    ],
  },
  {
    category: '계정',
    items: [
      {
        question: '비밀번호를 잊어버렸어요.',
        answer: '로그인 페이지에서 "비밀번호 찾기"를 클릭하시면 가입하신 이메일로 비밀번호 재설정 링크가 발송됩니다.',
      },
      {
        question: '회원 등급은 어떻게 올라가나요?',
        answer: '누적 충전 금액에 따라 자동으로 등급이 상승합니다. VIP(50만원), 프리미엄(200만원), 엔터프라이즈(500만원) 등급별 할인 혜택이 제공됩니다.',
      },
    ],
  },
];

// ============================================
// 문의 유형
// ============================================
const INQUIRY_TYPES = [
  { value: 'order', label: '주문 관련 문의' },
  { value: 'payment', label: '결제/충전 문의' },
  { value: 'refund', label: '환불 요청' },
  { value: 'account', label: '계정 문의' },
  { value: 'service', label: '서비스 이용 문의' },
  { value: 'other', label: '기타 문의' },
];

// ============================================
// 메인 컴포넌트
// ============================================
export default function SupportPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('inquiry');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const isPageLoading = authLoading || isLoadingAnnouncements;

  // 문의 폼 상태
  const [inquiryType, setInquiryType] = useState('');
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 공지사항 로드
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setAnnouncements((data as Announcement[]) || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setIsLoadingAnnouncements(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // 문의 제출
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inquiryType || !inquiryTitle.trim() || !inquiryContent.trim()) {
      toast.error('모든 필드를 입력해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      // 실제로는 tickets 테이블에 저장하거나 이메일 발송
      // 현재는 토스트로 안내
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('문의가 접수되었습니다', {
        description: '빠른 시간 내에 답변 드리겠습니다.',
      });

      // 폼 초기화
      setInquiryType('');
      setInquiryTitle('');
      setInquiryContent('');
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error('문의 접수 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAnnouncementTypeConfig = (type: string) => {
    switch (type) {
      case 'important':
        return { label: '중요', className: 'bg-red-100 text-red-700 border-red-200' };
      case 'warning':
        return { label: '주의', className: 'bg-amber-100 text-amber-700 border-amber-200' };
      default:
        return { label: '안내', className: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
  };

  // 로딩 상태
  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">고객센터</h1>
        <p className="text-muted-foreground mt-1">
          무엇을 도와드릴까요?
        </p>
      </div>

      {/* 빠른 연락처 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => window.open('https://pf.kakao.com/_xgpUAX', '_blank')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="font-semibold">카카오톡 상담</p>
              <p className="text-sm text-muted-foreground">평일 09:00-18:00</p>
            </div>
            <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">이메일 문의</p>
              <p className="text-sm text-muted-foreground">support@UFLUX-lab.com</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold">응답 시간</p>
              <p className="text-sm text-muted-foreground">평균 2시간 이내</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 콘텐츠 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inquiry" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            1:1 문의
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            자주 묻는 질문
          </TabsTrigger>
          <TabsTrigger value="notice" className="gap-2">
            <Bell className="h-4 w-4" />
            공지사항
          </TabsTrigger>
        </TabsList>

        {/* 1:1 문의 */}
        <TabsContent value="inquiry" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>1:1 문의하기</CardTitle>
              <CardDescription>
                궁금한 점이나 불편한 사항을 남겨주시면 빠르게 답변 드리겠습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitInquiry} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>문의 유형</Label>
                    <Select value={inquiryType} onValueChange={setInquiryType}>
                      <SelectTrigger>
                        <SelectValue placeholder="문의 유형을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {INQUIRY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>회원 이메일</Label>
                    <Input
                      value={profile?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">제목</Label>
                  <Input
                    id="title"
                    placeholder="문의 제목을 입력하세요"
                    value={inquiryTitle}
                    onChange={(e) => setInquiryTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">문의 내용</Label>
                  <Textarea
                    id="content"
                    placeholder="문의 내용을 상세히 적어주세요. 주문 관련 문의 시 주문번호를 함께 기재해 주시면 빠른 처리가 가능합니다."
                    value={inquiryContent}
                    onChange={(e) => setInquiryContent(e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      접수 중...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      문의 접수하기
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="mt-6">
          <div className="space-y-6">
            {FAQ_DATA.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((item, index) => (
                      <AccordionItem key={index} value={`${category.category}-${index}`}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 공지사항 */}
        <TabsContent value="notice" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>공지사항</CardTitle>
              <CardDescription>
                서비스 관련 중요 안내사항을 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnnouncements ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.map((announcement) => {
                    const typeConfig = getAnnouncementTypeConfig(announcement.type);
                    return (
                      <div
                        key={announcement.id}
                        className={cn(
                          "p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer",
                          announcement.is_pinned && "border-primary/50 bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {announcement.is_pinned && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                  고정
                                </Badge>
                              )}
                              <Badge variant="outline" className={typeConfig.className}>
                                {typeConfig.label}
                              </Badge>
                              <span className="font-medium">{announcement.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {announcement.content}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(announcement.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>등록된 공지사항이 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

