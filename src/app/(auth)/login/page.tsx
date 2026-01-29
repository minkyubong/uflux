"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, Home, UserCircle, Gift, Zap, Shield } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useGuestStore } from "@/stores/guest-store";
import { toast } from "sonner";

// 소셜 로그인 아이콘
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}


function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const enterGuestMode = useGuestStore((state) => state.enterGuestMode);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");

  // 비회원 모드 쿠키 삭제 함수
  const clearGuestModeCookie = () => {
    document.cookie = 'UFLUX_guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: signInError } = await signInWithEmail(loginEmail, loginPassword);

      if (signInError) {
        // 에러 메시지 한글화
        if (signInError.message.includes('Invalid login credentials')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('이메일 인증이 필요합니다. 이메일을 확인해주세요.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      // 로그인 성공 시 비회원 모드 쿠키 삭제
      clearGuestModeCookie();

      toast.success('로그인 성공!');
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 처리
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // 비밀번호 길이 체크
    if (registerPassword.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      setIsLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await signUpWithEmail(
        registerEmail,
        registerPassword,
        registerUsername || registerEmail.split('@')[0]
      );

      if (signUpError) {
        // 에러 메시지 한글화
        if (signUpError.message.includes('already registered')) {
          setError('이미 등록된 이메일입니다.');
        } else if (signUpError.message.includes('valid email')) {
          setError('유효한 이메일 주소를 입력해주세요.');
        } else if (signUpError.message.includes('Password')) {
          setError('비밀번호가 보안 요구사항을 충족하지 않습니다.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      toast.success('회원가입 성공!', {
        description: '이메일 인증 후 로그인해주세요.',
      });

      // 로그인 탭으로 전환
      setActiveTab('login');
      setLoginEmail(registerEmail);
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Google 로그인
  const handleGoogleLogin = async () => {
    setError(null);
    // Google 로그인 시도 전 비회원 모드 쿠키 삭제
    clearGuestModeCookie();
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError('Google 로그인에 실패했습니다.');
    }
  };

  // 비회원으로 둘러보기 - form submit으로 API 호출
  const handleGuestMode = () => {
    // 클라이언트 상태도 업데이트
    enterGuestMode();
    toast.success('비회원 모드로 둘러보기를 시작합니다!', {
      description: '모든 기능을 체험해보고 회원가입하세요.',
    });

    // form을 통해 API 라우트 호출 (쿠키 설정 + 리다이렉트)
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/guest-mode';
    document.body.appendChild(form);
    form.submit();
  };


  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 gradient-hero" />

        {/* Decorative Elements */}
        <div className="absolute inset-0">
          {/* Floating circles */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#00C896]/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-[#0064FF]/15 rounded-full blur-2xl animate-float" style={{ animationDelay: "2s" }} />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {/* Icon */}
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none" className="drop-shadow-lg">
              <path d="M35 85V35H50V85H35Z" fill="url(#loginGrad)" />
              <path d="M25 35H60V50H25V35Z" fill="url(#loginGrad)" />
              <path d="M42 15L75 48L64 59L31 26L42 15Z" fill="url(#loginGrad)" />
              <path d="M60 20H80V35H65V50H50V35H60V20Z" fill="url(#loginGrad)" />
              <defs>
                <linearGradient id="loginGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0064FF" />
                  <stop offset="100%" stopColor="#00C896" />
                </linearGradient>
              </defs>
            </svg>
            {/* Text */}
            <span className="text-4xl font-black tracking-tight text-white drop-shadow-lg">
              UFLUX
            </span>
          </div>

          {/* Main Message */}
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              SNS 채널 성장의
              <br />
              <span className="text-blue-200">새로운 기준</span>
            </h1>
            <p className="text-lg text-white/80 max-w-md">
              유튜브, 인스타그램, 틱톡 등 모든 소셜 미디어 채널의
              성장을 24시간 자동화 시스템으로 지원합니다.
            </p>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-white/60 text-sm">활성 사용자</div>
              </div>
              <div>
                <div className="text-3xl font-bold">1M+</div>
                <div className="text-white/60 text-sm">처리된 주문</div>
              </div>
              <div>
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-white/60 text-sm">서비스 안정성</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/60 text-sm">
            © 2026 UFLUX by Loopcell & Media
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col p-6 sm:p-12 bg-background">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            홈으로
          </Link>
          <div className="lg:hidden">
            <Logo size="sm" />
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo - Hidden since we have it in nav */}
          <div className="lg:hidden flex justify-center mb-8 hidden">
            <Logo size="lg" />
          </div>

          {/* Welcome Text */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">
              {activeTab === "login" ? "다시 만나서 반갑습니다!" : "UFLUX 시작하기"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {activeTab === "login"
                ? "계정에 로그인하여 서비스를 이용하세요"
                : "무료로 가입하고 SNS 마케팅을 시작하세요"}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setError(null); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="login" className="text-base">
                로그인
              </TabsTrigger>
              <TabsTrigger value="register" className="text-base">
                회원가입
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10 h-12"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">비밀번호</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      비밀번호 찾기
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-12"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base btn-gradient"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      로그인 중...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      로그인
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reg-username">사용자 이름 (선택)</Label>
                  <Input
                    id="reg-username"
                    type="text"
                    placeholder="사용자 이름"
                    className="h-12"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10 h-12"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">비밀번호</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="최소 8자 이상"
                      className="pl-10 pr-10 h-12"
                      required
                      minLength={8}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 h-4 w-4 rounded border-input"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    <Link href="/terms" className="text-primary hover:underline">
                      이용약관
                    </Link>
                    {" "}및{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      개인정보처리방침
                    </Link>
                    에 동의합니다
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base btn-gradient"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      가입 중...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      무료로 시작하기
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                또는 소셜 계정으로
              </span>
            </div>
          </div>

          {/* Social Login */}
          <Button
            variant="outline"
            className="w-full h-12 gap-2"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <GoogleIcon className="h-5 w-5" />
            Google로 계속하기
          </Button>

          {/* 비회원 둘러보기 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                가입 전 둘러보기
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full h-12 gap-2 border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
            type="button"
            onClick={handleGuestMode}
          >
            <UserCircle className="h-5 w-5" />
            비회원으로 둘러보기
          </Button>

          {/* 가입 혜택 미리보기 - 전환율 요소 */}
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
            <p className="text-sm font-medium text-center mb-3">
              지금 가입하면 받는 혜택
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Gift className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-xs font-bold text-yellow-600">1,000P</span>
                <span className="text-[10px] text-muted-foreground">가입 즉시</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs font-bold text-green-600">+20%</span>
                <span className="text-[10px] text-muted-foreground">첫충전 보너스</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-blue-600">무료</span>
                <span className="text-[10px] text-muted-foreground">체험 서비스</span>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-center text-sm text-muted-foreground">
            문제가 있으신가요?{" "}
            <Link href="/support" className="text-primary hover:underline">
              고객센터
            </Link>
            로 문의해주세요
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback
function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// Export wrapped with Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}

