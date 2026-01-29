import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CopyProtection, ImageProtection } from "@/components/security/copy-protection";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1120" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "UFLUX(인플럭스) - 글로벌 1위 SNS 성장/마케팅 자동화 솔루션",
    template: "%s | UFLUX",
  },
  description:
    "크리에이터를 위한 올인원 SNS 마케팅 플랫폼. 유튜브·인스타·틱톡 24시간 자동 성장 시스템.",
  keywords: [
    "인플럭스",
    "SMM 패널",
    "유튜브 구독자 늘리기",
    "인스타 팔로워 구매",
    "SNS 마케팅",
    "유튜브 수익창출",
    "틱톡 조회수",
    "유튜브 트래픽 분석",
    "유튜브 트래픽 업체",
    "유튜브 조회수 늘리기",
    "소셜미디어 마케팅",
    "SMM Panel",
    "Social Media Marketing",
  ],
  verification: {
    google: "cZUHSTGI0c7z861Bjl-22lvjAQtuoTv64XdPsReKOcU",
    other: {
      "naver-site-verification": "4978d263a7ce773c9844990957aa62ed0264686e",
    },
  },
  authors: [{ name: "Loopcell & Media" }],
  creator: "Loopcell & Media",
  publisher: "UFLUX",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.UFLUX-lab.com"),
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/ko",
      "en-US": "/en",
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://www.UFLUX-lab.com",
    title: "UFLUX(인플럭스) - 글로벌 1위 SNS 성장/마케팅 자동화 솔루션",
    description:
      "크리에이터를 위한 올인원 SNS 마케팅 플랫폼. 유튜브·인스타·틱톡 24시간 자동 성장 시스템.",
    siteName: "UFLUX - 인플럭스",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "UFLUX - Global SNS Marketing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UFLUX(인플럭스) - 글로벌 1위 SNS 성장/마케팅 자동화 솔루션",
    description:
      "크리에이터를 위한 올인원 SNS 마케팅 플랫폼. 유튜브·인스타·틱톡 24시간 자동 성장 시스템.",
    images: ["/og-image.png"],
    creator: "@UFLUX_kr",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Preconnect for faster font loading */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="min-h-screen bg-background antialiased" suppressHydrationWarning>
        {/* 보안: 복사/우클릭/개발자도구 방지 */}
        <CopyProtection />
        <ImageProtection />

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="UFLUX-theme"
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              className: "font-sans",
              style: {
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              },
            }}
          />
        </ThemeProvider>
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        )}
      </body>
    </html>
  );
}

