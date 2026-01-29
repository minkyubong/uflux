'use client';

import { useEffect } from 'react';

/**
 * CopyProtection Component - 강화된 보안
 * - 우클릭 방지
 * - 개발자 도구 차단 (F12, Ctrl+Shift+I/J/C)
 * - 소스보기/저장/인쇄 차단
 * - 텍스트 선택/복사 방지 (입력창 제외)
 * - 개발자 도구 감지
 * - 콘솔 경고
 */
export function CopyProtection() {
  useEffect(() => {
    // 프로덕션 환경에서만 보안 적용
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. 우클릭 방지
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // 2. 키보드 단축키 방지 (강화)
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // F12 개발자 도구 차단
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl + Shift 조합 (개발자도구)
      if (e.ctrlKey && e.shiftKey) {
        const devToolsKeys = ['i', 'j', 'c', 'k', 'm'];
        if (devToolsKeys.includes(key)) {
          e.preventDefault();
          return false;
        }
      }

      // Ctrl 조합
      if (e.ctrlKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        // 입력창에서는 Ctrl+C/V/X/A 허용
        if (isInputField) {
          const allowedInInput = ['c', 'v', 'x', 'a', 'z', 'y'];
          if (allowedInInput.includes(key)) {
            return true;
          }
        }

        // u: 소스보기, s: 저장, p: 인쇄, c: 복사(본문), a: 전체선택(본문)
        const blockedKeys = ['u', 's', 'p'];
        if (blockedKeys.includes(key)) {
          e.preventDefault();
          return false;
        }

        // 본문에서 복사/전체선택 차단
        if (!isInputField && ['c', 'a'].includes(key)) {
          e.preventDefault();
          return false;
        }
      }

      // PrintScreen 차단
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        navigator.clipboard.writeText('').catch(() => {});
        return false;
      }
    };

    // 3. 드래그 방지
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
      return true;
    };

    // 4. 텍스트 선택 방지
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
          target.isContentEditable || target.closest('[contenteditable="true"]')) {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // 5. 복사/붙여넣기 방지 (입력창 제외)
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // 6. 개발자 도구 감지 (타이밍 기반)
    const detectDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (widthDiff > threshold || heightDiff > threshold) {
        // 개발자 도구 열림 감지 시 경고만 표시 (페이지 차단하면 UX 저하)
        console.clear();
        console.log('%c⚠️ 보안 경고', 'color: red; font-size: 30px; font-weight: bold;');
        console.log('%c이 사이트의 콘텐츠는 저작권법으로 보호됩니다.', 'font-size: 16px;');
        console.log('%c무단 복제, 배포 시 법적 책임을 질 수 있습니다.', 'font-size: 14px; color: orange;');
      }
    };

    // 7. iframe 삽입 방지
    if (window.self !== window.top) {
      window.top?.location.replace(window.self.location.href);
    }

    // 8. view-source 프로토콜 차단
    if (typeof window !== 'undefined' && window.location.protocol === 'view-source:') {
      window.location.href = 'about:blank';
    }

    // 9. 콘솔 경고 메시지 (프로덕션에서만)
    if (isProduction) {
      console.log('%c⛔ 접근 금지', 'color: red; font-size: 40px; font-weight: bold;');
      console.log('%c이 콘솔을 사용하면 보안 위험에 노출될 수 있습니다.', 'font-size: 14px;');
      console.log('%cUFLUX의 모든 콘텐츠는 저작권법으로 보호됩니다.', 'font-size: 12px; color: gray;');
    }

    // 이벤트 리스너 등록
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('cut', handleCopy, true);

    // 개발자 도구 감지 (2초마다)
    const devToolsInterval = isProduction ? setInterval(detectDevTools, 2000) : null;

    // CSS로 선택 방지
    const style = document.createElement('style');
    style.id = 'copy-protection-style';
    style.textContent = `
      body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
        pointer-events: none;
      }
      @media print {
        body { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('cut', handleCopy, true);
      if (devToolsInterval) clearInterval(devToolsInterval);
      const styleEl = document.getElementById('copy-protection-style');
      if (styleEl) styleEl.remove();
    };
  }, []);

  return null;
}

/**
 * 이미지 보호 컴포넌트
 * CSS로 이미지 드래그/저장 방지 (hydration 문제 없음)
 */
export function ImageProtection() {
  // CSS만 사용하여 hydration 문제 방지
  // DOM 속성 직접 수정하지 않음
  return null;
}

