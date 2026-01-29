"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { Mail, Globe, Phone, MapPin } from "lucide-react";
import { FaInstagram, FaYoutube, FaTwitter, FaTiktok } from "react-icons/fa";
import { RiKakaoTalkFill } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const footerLinks = {
  services: siteConfig.services,
  support: [
    { name: "자주 묻는 질문", href: "/faq" },
    { name: "이용 가이드", href: "/guide" },
    { name: "API 문서", href: "/api-docs" },
    { name: "고객센터", href: "/support" },
  ],
  legal: [
    { name: "이용약관", href: siteConfig.legal.terms },
    { name: "개인정보처리방침", href: siteConfig.legal.privacy },
    { name: "환불정책", href: siteConfig.legal.refund },
  ],
};

const socialLinks = [
  { name: "Instagram", href: siteConfig.social.instagram, icon: FaInstagram, color: "hover:text-[#E1306C]" },
  { name: "Youtube", href: siteConfig.social.youtube, icon: FaYoutube, color: "hover:text-[#FF0000]" },
  { name: "KakaoTalk", href: siteConfig.social.kakao, icon: RiKakaoTalkFill, color: "hover:text-[#FEE500]" },
  { name: "TikTok", href: "#", icon: FaTiktok, color: "hover:text-white" },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Logo size="lg" linkTo="/" />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Global Social Media Marketing Platform powered by Loopcell.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              유튜브, 인스타그램, 틱톡 등 모든 SNS 채널의 성장을 위한
              최고의 마케팅 솔루션을 제공합니다.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground transition-all duration-200",
                    "hover:bg-muted/80 hover:scale-110",
                    item.color
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">서비스</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">고객지원</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">법적 고지</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider - 법적 정보 (전자상거래법 필수 표기사항) */}
        <div className="border-t mt-12 pt-8">
          {/* Company Info */}
          <div className="text-sm text-muted-foreground space-y-3">
            {/* 사업자 기본 정보 */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span className="font-medium text-foreground">{siteConfig.company.name}</span>
              <span className="text-muted-foreground/50">|</span>
              <span>대표: {siteConfig.company.ceo}</span>
              <span className="text-muted-foreground/50 hidden sm:inline">|</span>
              <span>사업자등록번호: {siteConfig.company.businessNumber}</span>
            </div>

            {/* 통신판매업 및 주소 */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span>통신판매업신고: {siteConfig.company.salesRegistration}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{siteConfig.company.address}</span>
            </div>

            {/* 연락처 정보 */}
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {siteConfig.company.phone ? (
                <a
                  href={`tel:${String(siteConfig.company.phone).replace(/-/g, '')}`}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>고객센터: {siteConfig.company.phone}</span>
                </a>
              ) : null}
              <a
                href={`mailto:${siteConfig.company.email}`}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>{siteConfig.company.email}</span>
              </a>
            </div>

            {/* 운영 시간 */}
            <div className="text-xs text-muted-foreground/70">
              운영시간: {siteConfig.serviceHours.support} (주말/공휴일 휴무) | 시스템: {siteConfig.serviceHours.system}
            </div>
          </div>

          {/* Copyright & Legal Links */}
          <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} {siteConfig.company.name}. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                본 사이트의 모든 콘텐츠는 저작권법의 보호를 받습니다.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href={siteConfig.legal.terms} className="hover:text-foreground transition-colors">
                이용약관
              </Link>
              <Link href={siteConfig.legal.privacy} className="hover:text-foreground transition-colors">
                개인정보처리방침
              </Link>
              <Link href={siteConfig.legal.refund} className="hover:text-foreground transition-colors">
                환불정책
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

