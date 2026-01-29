// ============================================
// Authentication Hook
// 인증 상태 관리 훅
// ============================================

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithKakao: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Race Condition 방지를 위한 ref
  const isInitialized = useRef(false);
  const isLoadingProfile = useRef(false);
  const currentUserId = useRef<string | null>(null);

  // 프로필 로드 (중복 호출 방지)
  const loadProfile = useCallback(async (userId: string) => {
    // 이미 같은 사용자의 프로필을 로드 중이면 스킵
    if (isLoadingProfile.current && currentUserId.current === userId) {
      return;
    }

    isLoadingProfile.current = true;
    currentUserId.current = userId;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 = Row not found (프로필 없음 - 정상적인 상황일 수 있음)
        if (error.code === 'PGRST116') {
          console.log('[Auth] Profile not found, waiting for creation...');
          setProfile(null);
          return;
        }
        throw error;
      }
      setProfile(data);
    } catch (error) {
      console.error('[Auth] Failed to load profile:', error);
      setProfile(null);
    } finally {
      isLoadingProfile.current = false;
    }
  }, []);

  // 초기화 및 세션 리스너
  useEffect(() => {
    // 이미 초기화되었으면 스킵 (Strict Mode에서 중복 실행 방지)
    if (isInitialized.current) {
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
      } finally {
        setIsLoading(false);
        isInitialized.current = true;
      }
    };

    initAuth();

    // 세션 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // 초기화 완료 전에는 리스너 이벤트 무시 (중복 처리 방지)
        if (!isInitialized.current) {
          return;
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          await loadProfile(newSession.user.id);
          router.refresh();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          currentUserId.current = null;
          router.push('/login');
          router.refresh();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile, router]);

  // 이메일 로그인
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // 이메일 회원가입
  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Google 로그인
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Kakao 로그인
  const signInWithKakao = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      // 로컬 상태 초기화
      setUser(null);
      setSession(null);
      setProfile(null);

      // Supabase 세션 종료 (scope: 'global'로 모든 기기에서 로그아웃)
      await supabase.auth.signOut({ scope: 'global' });

      // 로컬 스토리지에서 Supabase 관련 데이터 삭제
      if (typeof window !== 'undefined') {
        // Supabase 세션 관련 모든 키 삭제
        const keysToRemove = Object.keys(localStorage).filter(key =>
          key.startsWith('sb-') || key.includes('supabase')
        );
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // 세션 스토리지도 정리
        const sessionKeysToRemove = Object.keys(sessionStorage).filter(key =>
          key.startsWith('sb-') || key.includes('supabase')
        );
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      }

      // 로그인 페이지로 강제 이동 (전체 페이지 새로고침)
      window.location.href = '/login';
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      // 에러가 발생해도 스토리지 정리 후 로그인 페이지로 이동
      if (typeof window !== 'undefined') {
        const keysToRemove = Object.keys(localStorage).filter(key =>
          key.startsWith('sb-') || key.includes('supabase')
        );
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      window.location.href = '/login';
    }
  };

  // 프로필 새로고침
  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  return {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithKakao,
    signOut,
    refreshProfile,
  };
}

