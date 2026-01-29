// ============================================
// Theme Toggle Component
// 다크모드/라이트모드 전환 스위치
// ============================================

'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted">
        <Sun className="h-4 w-4 text-muted-foreground" />
        <div className="w-10 h-5 bg-muted-foreground/20 rounded-full" />
        <Moon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  const handleToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    console.log('[UFLUX] Theme:', theme, '→', newTheme);
    setTheme(newTheme);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border hover:bg-muted transition-colors cursor-pointer"
      type="button"
    >
      <Sun className={cn(
        "h-4 w-4 transition-colors",
        !isDark ? "text-orange-500" : "text-muted-foreground"
      )} />
      <div className={cn(
        "w-10 h-5 rounded-full relative transition-colors",
        isDark ? "bg-slate-700" : "bg-orange-400"
      )}>
        <div className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
          isDark ? "translate-x-5" : "translate-x-0.5"
        )} />
      </div>
      <Moon className={cn(
        "h-4 w-4 transition-colors",
        isDark ? "text-yellow-400" : "text-muted-foreground"
      )} />
    </button>
  );
}

// 간단한 토글 버튼
export function ThemeToggleSimple() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  const handleToggle = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
  };

  return (
    <Switch
      checked={isDark}
      onCheckedChange={handleToggle}
      className="data-[state=checked]:bg-slate-700"
    />
  );
}

