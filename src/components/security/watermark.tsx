'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

/**
 * Watermark Component
 * 로그인한 사용자의 정보를 워터마크로 표시
 * 스크린샷/화면녹화 시 사용자 추적 가능
 */
export function Watermark() {
  const { user, profile } = useAuth();
  const [watermarkText, setWatermarkText] = useState<string>('');

  useEffect(() => {
    if (user?.email || profile?.username) {
      // 이메일 또는 사용자명 + 현재 시간
      const identifier = profile?.username || user?.email || '';
      const timestamp = new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      setWatermarkText(`${identifier} | ${timestamp}`);
    }
  }, [user, profile]);

  // 로그인하지 않은 경우 워터마크 표시 안함
  if (!watermarkText) return null;

  return (
    <>
      {/* 워터마크 오버레이 */}
      <div
        className="watermark-overlay"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999,
          overflow: 'hidden',
          opacity: 0.03,
        }}
      >
        {/* 대각선 패턴으로 워터마크 반복 */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            display: 'flex',
            flexWrap: 'wrap',
            transform: 'rotate(-30deg)',
          }}
        >
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '400px',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 500,
                color: 'currentColor',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              {watermarkText}
            </div>
          ))}
        </div>
      </div>

      {/* CSS로 워터마크 보호 - 개발자 도구로 숨기기 어렵게 */}
      <style jsx global>{`
        .watermark-overlay {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* 인쇄 시에도 워터마크 표시 */
        @media print {
          .watermark-overlay {
            opacity: 0.1 !important;
            display: block !important;
            visibility: visible !important;
          }
        }
      `}</style>
    </>
  );
}

/**
 * 더 강력한 워터마크 (Canvas 기반)
 * DOM에서 쉽게 제거할 수 없음
 */
export function CanvasWatermark() {
  const { user, profile } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || (!user?.email && !profile?.username)) return;

    const identifier = profile?.username || user?.email || '';
    const timestamp = new Date().toLocaleString('ko-KR');
    const text = `${identifier} | ${timestamp}`;

    // Canvas 생성
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px Pretendard, sans-serif';
      ctx.fillStyle = 'rgba(128, 128, 128, 0.15)';
      ctx.rotate(-20 * Math.PI / 180);
      ctx.fillText(text, 20, 80);
    }

    // 배경 이미지로 설정
    const dataUrl = canvas.toDataURL('image/png');

    // 기존 워터마크 제거
    const existing = document.getElementById('canvas-watermark-style');
    if (existing) existing.remove();

    // 스타일 추가
    const style = document.createElement('style');
    style.id = 'canvas-watermark-style';
    style.textContent = `
      body::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 99999;
        background-image: url('${dataUrl}');
        background-repeat: repeat;
        opacity: 1;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById('canvas-watermark-style');
      if (el) el.remove();
    };
  }, [mounted, user, profile]);

  return null;
}

