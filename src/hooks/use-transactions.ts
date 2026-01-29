// ============================================
// Transactions Hook
// 거래 내역 조회 훅
// ============================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';
import type { Transaction } from '@/types/database';

export const transactionKeys = {
  all: ['transactions'] as const,
  list: () => [...transactionKeys.all, 'list'] as const,
  byType: (type: string) => [...transactionKeys.all, 'type', type] as const,
};

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: transactionKeys.list(),
    queryFn: async (): Promise<Transaction[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch transactions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1분
  });
}

