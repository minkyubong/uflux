// ============================================
// Reseller Landing Page
// 리셀러/대리점 모집 랜딩 페이지
// ============================================

import Link from 'next/link';
import { Metadata } from 'next';
import {
  Zap,
  TrendingUp,
  DollarSign,
  Shield,
  Users,
  Globe,
  Code,
  Headphones,
  Check,
  ArrowRight,
  Star,
  Building2,
  Percent,
  Clock,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: '리셀러 파트너 모집 | UFLUX - SMM Panel 도매 API',
  description: 'UFLUX SMM Panel 리셀러가 되어 수익을 창출하세요. 업계 최저가 도매가, 무료 API 제공, 24시간 자동화 시스템.',
  keywords: ['SMM Panel 리셀러', 'SMM 도매', 'SNS 마케팅 API', '인스타 팔로워 도매', '유튜브 구독자 도매'],
};

// 혜택 데이터
const benefits = [
  {
    icon: Percent,
    title: '업계 최저 도매가',
    description: '소매가 대비 최대 40% 할인된 도매가로 높은 마진 확보',
    highlight: '최대 40% 할인',
  },
  {
    icon: Code,
    title: '무료 API 제공',
    description: 'SMM Panel 표준 API v2 완벽 지원. 자동화 시스템 구축 가능',
    highlight: 'API 무료',
  },
  {
    icon: Clock,
    title: '24시간 자동 처리',
    description: '주문 접수 즉시 자동 처리. 새벽에도 주문이 진행됩니다',
    highlight: '24/7 자동화',
  },
  {
    icon: Headphones,
    title: '전담 매니저 배정',
    description: '리셀러 전용 카카오톡 그룹 및 전담 매니저 1:1 지원',
    highlight: '1:1 지원',
  },
  {
    icon: Shield,
    title: '30일 리필 보장',
    description: '이탈 발생 시 30일 이내 무료 리필. 안심하고 판매하세요',
    highlight: '리필 보장',
  },
  {
    icon: Globe,
    title: '글로벌 서비스',
    description: '유튜브, 인스타, 틱톡 등 전 세계 모든 SNS 플랫폼 지원',
    highlight: '500+ 서비스',
  },
];

// 수익 시뮬레이션
const earningsTable = [
  { volume: '100만원', discount: '10%', margin: '15%', monthlyProfit: '15만원' },
  { volume: '300만원', discount: '15%', margin: '20%', monthlyProfit: '60만원' },
  { volume: '500만원', discount: '20%', margin: '25%', monthlyProfit: '125만원' },
  { volume: '1,000만원', discount: '25%', margin: '30%', monthlyProfit: '300만원' },
  { volume: '3,000만원+', discount: '30%', margin: '35%', monthlyProfit: '1,000만원+' },
];

// FAQ
const faqs = [
  {
    q: '리셀러가 되려면 어떤 조건이 필요한가요?',
    a: '특별한 조건 없이 누구나 가입 가능합니다. 사업자등록증이 없어도 됩니다.',
  },
  {
    q: '초기 비용이 있나요?',
    a: '가입비나 월정액 없이 완전 무료입니다. 사용한 만큼만 결제하세요.',
  },
  {
    q: 'API는 어떻게 연동하나요?',
    a: 'SMM Panel 표준 API v2를 지원합니다. 가입 후 대시보드에서 API 키를 발급받고, 제공되는 문서를 참고하세요.',
  },
  {
    q: '최소 주문 금액이 있나요?',
    a: '최소 주문 금액은 없습니다. 소량 주문도 가능합니다.',
  },
  {
    q: '정산은 어떻게 되나요?',
    a: '선불 충전 방식입니다. 충전한 금액에서 주문 금액이 차감됩니다.',
  },
];

export default function ResellerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#0064FF]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#00C896]/20 rounded-full blur-[120px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <Badge className="mb-6 bg-gradient-to-r from-[#0064FF]/20 to-[#00C896]/20 text-white border-[#0064FF]/30 px-4 py-2 text-sm">
              <Star className="w-4 h-4 mr-2 text-yellow-400" />
              리셀러 파트너 모집 중
            </Badge>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0064FF] to-[#00C896]">
                UFLUX
              </span>{' '}
              리셀러가 되어
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C896] to-[#0064FF]">
                월 1,000만원
              </span>{' '}
              수익 창출
            </h1>

            {/* Subheading */}
            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              업계 최저 도매가 + 무료 API + 24시간 자동화
              <br className="hidden sm:block" />
              초기 비용 0원으로 지금 바로 시작하세요
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-[#0064FF] to-[#00C896] hover:opacity-90 text-lg h-14 px-8"
              >
                <Link href="/login">
                  지금 가입하고 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 text-lg h-14 px-8"
              >
                <Link href="https://pf.kakao.com/_xgpUAX" target="_blank">
                  카카오톡 문의
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-white/50 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00C896]" />
                가입비 무료
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00C896]" />
                월정액 없음
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00C896]" />
                사업자 불필요
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00C896]" />
                당일 승인
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              리셀러 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0064FF] to-[#00C896]">혜택</span>
            </h2>
            <p className="text-white/50">
              UFLUX 리셀러만의 특별한 혜택을 확인하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="bg-white/5 border-white/10 hover:border-[#0064FF]/50 transition-all hover:translate-y-[-4px]"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0064FF]/20 to-[#00C896]/20 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-[#00C896]" />
                    </div>
                    <div>
                      <Badge className="mb-2 bg-[#00C896]/20 text-[#00C896] border-0 text-xs">
                        {benefit.highlight}
                      </Badge>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-white/50">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Table Section */}
      <section className="py-20 relative bg-gradient-to-b from-transparent via-[#0064FF]/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              예상 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0064FF] to-[#00C896]">수익</span> 시뮬레이션
            </h2>
            <p className="text-white/50">
              거래량에 따른 할인율과 예상 수익을 확인하세요
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">월 거래량</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">도매 할인율</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">예상 마진</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">월 수익</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsTable.map((row, index) => (
                      <tr
                        key={index}
                        className={`border-b border-white/5 ${index === earningsTable.length - 1 ? 'bg-gradient-to-r from-[#0064FF]/10 to-[#00C896]/10' : ''}`}
                      >
                        <td className="px-6 py-4 text-white font-medium">{row.volume}</td>
                        <td className="px-6 py-4 text-[#00C896]">{row.discount}</td>
                        <td className="px-6 py-4 text-white">{row.margin}</td>
                        <td className="px-6 py-4">
                          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0064FF] to-[#00C896]">
                            {row.monthlyProfit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <p className="text-center text-white/40 text-sm mt-4">
              * 실제 수익은 판매 가격 설정에 따라 달라질 수 있습니다
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              시작하는 방법
            </h2>
            <p className="text-white/50">
              3단계로 간단하게 리셀러 비즈니스를 시작하세요
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: 1, title: '회원가입', desc: '무료로 가입하고 이메일 인증을 완료하세요' },
                { step: 2, title: 'API 발급', desc: '대시보드에서 API 키를 발급받으세요' },
                { step: 3, title: '판매 시작', desc: 'API를 연동하고 판매를 시작하세요' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0064FF] to-[#00C896] flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white/50">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              자주 묻는 질문
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Q. {faq.q}
                  </h3>
                  <p className="text-white/60">
                    A. {faq.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Card className="bg-gradient-to-br from-[#0064FF]/20 to-[#00C896]/20 border-[#0064FF]/30 p-8 sm:p-12">
              <Award className="w-16 h-16 text-[#00C896] mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                지금 바로 시작하세요
              </h2>
              <p className="text-white/60 mb-8">
                초기 비용 0원, 리스크 0%
                <br />
                오늘 가입하면 내일부터 수익 창출 가능
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-[#0064FF] to-[#00C896] hover:opacity-90 text-lg h-14 px-8"
                >
                  <Link href="/login">
                    무료로 시작하기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 text-lg h-14 px-8"
                >
                  <Link href="https://pf.kakao.com/_xgpUAX" target="_blank">
                    상담 문의
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-4 text-center text-white/40 text-sm">
          <p>&copy; {new Date().getFullYear()} 루프셀앤미디어. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
            <Link href="/" className="hover:text-white transition-colors">홈으로</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

