// ============================================
// Guide Page
// 처음 오신 분들을 위한 가이드
// ============================================

"use client";

import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  CreditCard,
  ShoppingCart,
  Clock,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Gift,
  ArrowRight,
  Sparkles,
  MessageCircle,
  AlertTriangle,
  ThumbsUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================
// FAQ Data
// ============================================
const faqData = [
  {
    question: "UFLUX는 어떤 서비스인가요?",
    answer:
      "UFLUX는 유튜브, 인스타그램, 틱톡, 페이스북, 텔레그램 등 다양한 SNS 플랫폼의 성장을 돕는 마케팅 자동화 플랫폼입니다. 구독자, 팔로워, 조회수, 좋아요 등을 안전하고 빠르게 늘릴 수 있습니다.",
  },
  {
    question: "계정이 정지되거나 페널티를 받지 않나요?",
    answer:
      "UFLUX는 각 플랫폼의 정책을 준수하는 안전한 방식으로 서비스를 제공합니다. 급격한 증가가 아닌 자연스러운 점진적 증가 방식을 사용하며, 10년 이상 운영하면서 단 한 건의 계정 정지 사례도 없습니다.",
  },
  {
    question: "주문 후 얼마나 빨리 시작되나요?",
    answer:
      "대부분의 서비스는 주문 후 1~24시간 이내에 시작됩니다. 조회수와 같은 일부 서비스는 거의 즉시 시작되며, 구독자/팔로워 서비스는 1~6시간 내에 시작됩니다. 실시간으로 진행 상황을 확인할 수 있습니다.",
  },
  {
    question: "구독자/팔로워가 이탈하면 어떻게 되나요?",
    answer:
      "30일 이내 자연 이탈이 발생하면 무료로 리필해 드립니다. 일반적으로 5~10% 정도의 자연 이탈률이 있을 수 있으며, 이는 모든 서비스에서 무료 보충됩니다.",
  },
  {
    question: "어떤 결제 방법을 지원하나요?",
    answer:
      "계좌이체(무통장입금)와 USDT(TRC-20) 암호화폐 결제를 지원합니다. 계좌이체는 신청 후 관리자 확인 후 충전되며, USDT는 자동으로 충전됩니다.",
  },
  {
    question: "최소 주문 금액이 있나요?",
    answer:
      "최소 충전 금액은 10,000원입니다. 각 서비스별 최소 주문 수량이 있으며, 서비스 선택 시 확인할 수 있습니다.",
  },
  {
    question: "환불은 어떻게 하나요?",
    answer:
      "충전 후 미사용 금액은 100% 환불 가능합니다. 진행 중인 주문은 남은 수량에 대해 부분 환불이 가능합니다. 고객센터를 통해 환불을 요청해 주세요.",
  },
  {
    question: "비공개 계정에도 서비스가 가능한가요?",
    answer:
      "팔로워/구독자 서비스는 비공개 계정에서도 가능합니다. 단, 좋아요, 조회수, 댓글 서비스는 콘텐츠가 공개되어 있어야 합니다.",
  },
];

// ============================================
// Step Card Component
// ============================================
function StepCard({
  step,
  icon: Icon,
  title,
  description,
  color,
}: {
  step: number;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Card className="relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
      <div className={cn("absolute top-0 left-0 w-1 h-full", color)} />
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
              color.replace("bg-", "bg-").replace("-500", "-500/20")
            )}
          >
            <Icon className={cn("w-6 h-6", color.replace("bg-", "text-"))} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn("text-xs", color.replace("bg-", "text-").replace("-500", "-600"))}>
                STEP {step}
              </Badge>
            </div>
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// FAQ Item Component
// ============================================
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left hover:text-primary transition-colors"
      >
        <span className="font-medium pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-5 text-muted-foreground text-sm leading-relaxed animate-in slide-in-from-top-2">
          {answer}
        </div>
      )}
    </div>
  );
}

// ============================================
// Page Component
// ============================================
export default function GuidePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0064FF]/10 via-[#00C896]/10 to-[#4D9FFF]/10 border border-[#0064FF]/20 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00C896]/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#0064FF] to-[#00C896]">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-gradient-to-r from-[#0064FF] to-[#00C896] text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              신규 회원 필독
            </Badge>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            처음 오신 분들을 위한
            <span className="bg-gradient-to-r from-[#0064FF] to-[#00C896] bg-clip-text text-transparent">
              {" "}완벽 가이드
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            UFLUX를 처음 이용하시는 분들을 위해 준비했습니다.
            아래 가이드를 따라하시면 쉽고 빠르게 서비스를 이용하실 수 있습니다.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button asChild className="bg-gradient-to-r from-[#0064FF] to-[#00C896] hover:from-[#0052D4] hover:to-[#00B085]">
              <Link href="/deposit">
                <CreditCard className="w-4 h-4 mr-2" />
                충전하고 시작하기
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/support">
                <MessageCircle className="w-4 h-4 mr-2" />
                1:1 문의하기
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            빠른 시작 가이드
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StepCard
            step={1}
            icon={CreditCard}
            title="포인트 충전하기"
            description="계좌이체 또는 USDT로 포인트를 충전합니다. 충전하기 메뉴에서 원하는 금액을 입금하면 잔액에 반영됩니다."
            color="bg-blue-500"
          />
          <StepCard
            step={2}
            icon={ShoppingCart}
            title="서비스 선택 및 주문"
            description="새 주문 메뉴에서 원하는 플랫폼과 서비스를 선택합니다. 링크 입력 후 수량을 정하고 주문을 완료합니다."
            color="bg-[#00C896]"
          />
          <StepCard
            step={3}
            icon={Clock}
            title="자동 처리 대기"
            description="주문이 완료되면 자동으로 처리가 시작됩니다. 주문 내역에서 실시간 진행 상황을 확인할 수 있습니다."
            color="bg-pink-500"
          />
          <StepCard
            step={4}
            icon={CheckCircle2}
            title="완료 및 확인"
            description="서비스가 완료되면 해당 SNS 계정에서 결과를 확인하세요. 문제가 있으면 고객센터로 문의해 주세요."
            color="bg-green-500"
          />
        </CardContent>
      </Card>

      {/* Important Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Shield className="w-5 h-5" />
              안전하게 이용하기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <ThumbsUp className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>비밀번호는 절대 요구하지 않습니다. 링크만 입력하세요.</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <ThumbsUp className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>점진적 증가 방식으로 계정 안전을 보장합니다.</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <ThumbsUp className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>30일 무료 리필 보장으로 안심하세요.</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <ThumbsUp className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>실시간 고객센터 운영으로 빠른 지원을 받으세요.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              주문 전 확인사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <span>올바른 링크를 입력했는지 다시 확인하세요.</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <span>조회수/좋아요 서비스는 콘텐츠가 공개되어야 합니다.</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <span>진행 중인 주문이 있으면 완료 후 재주문하세요.</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <span>서비스별 최소/최대 주문 수량을 확인하세요.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Benefits */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#00C896]" />
            UFLUX만의 특별한 혜택
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <div className="text-3xl font-bold text-primary mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">무중단 자동화</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <div className="text-3xl font-bold text-primary mb-1">30일</div>
              <div className="text-sm text-muted-foreground">무료 리필 보장</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <div className="text-3xl font-bold text-primary mb-1">99.9%</div>
              <div className="text-sm text-muted-foreground">서비스 성공률</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <div className="text-3xl font-bold text-primary mb-1">최저가</div>
              <div className="text-sm text-muted-foreground">업계 최저 가격</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            자주 묻는 질문 (FAQ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {faqData.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="border-0 bg-gradient-to-r from-[#0064FF] to-[#00C896] text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">준비되셨나요?</h2>
          <p className="text-white/80 mb-6">
            지금 바로 충전하고 채널 성장을 시작하세요!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-white text-[#0064FF] hover:bg-white/90"
            >
              <Link href="/deposit">
                <CreditCard className="w-4 h-4 mr-2" />
                충전하기
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Link href="/order">
                <ShoppingCart className="w-4 h-4 mr-2" />
                서비스 둘러보기
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

