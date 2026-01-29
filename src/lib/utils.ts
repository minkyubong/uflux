import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 클래스 병합 유틸리티
 * clsx와 tailwind-merge를 결합하여 조건부 클래스와 중복 클래스를 처리
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 통화 포맷팅 (한국 원화)
 * @example formatCurrency(10000) => "10,000원"
 * @example formatCurrency(10000, { symbol: '$', locale: 'en-US' }) => "$10,000"
 */
export function formatCurrency(
  amount: number | null | undefined,
  options?: {
    symbol?: string;
    locale?: string;
    decimals?: number;
  }
): string {
  const { symbol = "원", locale = "ko-KR", decimals = 0 } = options ?? {};

  // null, undefined, NaN 처리
  const safeAmount = amount == null || isNaN(amount) ? 0 : amount;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safeAmount);

  // 원화는 뒤에, 다른 통화는 앞에 표시
  if (symbol === "원") {
    return `${formatted}원`;
  }
  return `${symbol}${formatted}`;
}

/**
 * 숫자 포맷팅 (천 단위 콤마)
 * @example formatNumber(1234567) => "1,234,567"
 */
export function formatNumber(num: number | null | undefined, locale: string = "ko-KR"): string {
  const safeNum = num == null || isNaN(num) ? 0 : num;
  return new Intl.NumberFormat(locale).format(safeNum);
}

/**
 * 숫자 축약 포맷팅 (K, M, B)
 * @example formatCompactNumber(1500) => "1.5K"
 * @example formatCompactNumber(1500000) => "1.5M"
 */
export function formatCompactNumber(num: number | null | undefined): string {
  const safeNum = num == null || isNaN(num) ? 0 : num;
  if (safeNum >= 1_000_000_000) {
    return `${(safeNum / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (safeNum >= 1_000_000) {
    return `${(safeNum / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (safeNum >= 1_000) {
    return `${(safeNum / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return safeNum.toString();
}

/**
 * 퍼센트 포맷팅
 * @example formatPercent(0.156) => "15.6%"
 */
export function formatPercent(
  value: number,
  decimals: number = 1
): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 상대 시간 포맷팅
 * @example formatRelativeTime(new Date(Date.now() - 60000)) => "1분 전"
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;

  return target.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * 날짜 포맷팅
 * @example formatDate(new Date()) => "2026. 1. 17."
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const target = typeof date === "string" ? new Date(date) : date;
  return target.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

/**
 * URL 유효성 검사
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 이메일 유효성 검사
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 문자열 자르기 (말줄임표 추가)
 * @example truncate("Hello World", 5) => "Hello..."
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

/**
 * 랜덤 ID 생성
 */
export function generateId(prefix: string = "id"): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 딜레이 유틸리티 (async/await용)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 디바운스 함수
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * 클립보드 복사
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

