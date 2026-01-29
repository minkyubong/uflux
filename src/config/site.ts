// ============================================
// Site Configuration
// 사이트 전역 설정 및 법적 정보
// ============================================

export const siteConfig = {
  // 기본 정보
  name: "UFLUX",
  nameKorean: "유플렉스",
  url: "https://www.uflux-lab.com",

  // 회사 정보 (전자상거래법 필수 표기)
  company: {
    name: "루프셀앤미디어",
    ceo: "봉민규",
    businessNumber: "420-50-00984",
    salesRegistration: "신고 준비중", // TODO: 발급 후 실제 번호로 교체
    address: "서울특별시 도봉구 도봉로 133길 41, 5층",
    email: "support@uflux-lab.com",
    phone: "", // 고객센터 번호 없음
    kakaoChannel: "@uflux",
  },

  // 서비스 운영 시간
  serviceHours: {
    support: "평일 10:00 - 18:00",
    system: "24시간 자동화 운영",
  },

  // 소셜 링크
  social: {
    kakao: "https://pf.kakao.com/_xgpUAX",
    instagram: "https://instagram.com/uflux_kr",
    youtube: "https://youtube.com/@uflux_kr",
  },

  // 법적 페이지 링크
  legal: {
    terms: "/terms",
    privacy: "/privacy",
    refund: "/refund-policy",
  },

  // 서비스 카테고리
  services: [
    { name: "유튜브", href: "/services/youtube" },
    { name: "인스타그램", href: "/services/instagram" },
    { name: "틱톡", href: "/services/tiktok" },
    { name: "페이스북", href: "/services/facebook" },
    { name: "텔레그램", href: "/services/telegram" },
  ],

  // 메뉴 링크
  navigation: {
    main: [
      { name: "서비스", href: "/order" },
      { name: "가격표", href: "/order" },
      { name: "인사이트", href: "/blog" },
      { name: "고객센터", href: "/support" },
    ],
    footer: [
      { name: "이용약관", href: "/terms" },
      { name: "개인정보처리방침", href: "/privacy" },
      { name: "환불정책", href: "/refund-policy" },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;

