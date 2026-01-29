"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  linkTo?: string;
}

const sizeMap = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 44, text: "text-2xl" },
};

export function Logo({
  className,
  size = "md",
  showText = true,
  linkTo = "/",
}: LogoProps) {
  const { icon, text } = sizeMap[size];

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      {/* 실제 로고 이미지 */}
      <Image
        src="/logo-uflux.svg"
        alt="UFLUX"
        width={icon}
        height={icon}
        className="flex-shrink-0"
        priority
      />

      {/* Text Logo */}
      {showText && (
        <span className={cn("font-bold tracking-tight", text)}>
          <span className="bg-gradient-to-r from-[#0064FF] to-[#00C896] bg-clip-text text-transparent">
            UFLUX
          </span>
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export function LogoIcon({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div className={className}>
      <Image
        src="/logo-uflux.svg"
        alt="UFLUX"
        width={size}
        height={size}
        className="flex-shrink-0"
      />
    </div>
  );
}

