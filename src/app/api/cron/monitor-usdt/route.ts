// ============================================
// USDT 충전 자동 모니터링 Cron
// TronScan API로 트랜잭션 자동 확인 및 포인트 충전
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_WALLET = process.env.USDT_ADMIN_WALLET || 'TFwFDgYUJpUu6L7DcmLPY1FQh5Vwc5ewgS';
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TRONSCAN_API_KEY = process.env.TRONSCAN_API_KEY;

export async function GET(request: NextRequest) {
  try {
    // Cron Secret 검증 (Vercel Cron에서만 호출 가능)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[USDT Cron] Starting monitoring...');

    // 5분 이내 pending 상태인 요청 조회
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const { data: pendingCharges, error: fetchError } = await (supabase as any)
      .from('usdt_charges')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', fiveMinutesAgo.toISOString())
      .lte('expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('[USDT Cron] Error fetching pending charges:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!pendingCharges || pendingCharges.length === 0) {
      console.log('[USDT Cron] No pending charges to process');
      return NextResponse.json({ success: true, processed: 0 });
    }

    console.log(`[USDT Cron] Found ${pendingCharges.length} pending charges`);

    // TronScan에서 최근 거래 조회
    const transactions = await getTronScanTransactions(ADMIN_WALLET);
    console.log(`[USDT Cron] Found ${transactions.length} transactions from TronScan`);

    let processedCount = 0;
    let expiredCount = 0;

    for (const charge of pendingCharges) {
      try {
        const createdTime = new Date(charge.created_at).getTime();
        const expiresTime = new Date(charge.expires_at).getTime();
        const now = Date.now();

        // 만료 체크
        if (now > expiresTime) {
          await (supabase as any)
            .from('usdt_charges')
            .update({
              status: 'expired',
              expired_at: new Date().toISOString(),
              failure_reason: 'Timeout - no transaction found within 5 minutes',
            })
            .eq('id', charge.id);
          expiredCount++;
          console.log(`[USDT Cron] Expired charge: ${charge.id}`);
          continue;
        }

        // 거래 매칭
        const matchedTx = findMatchingTransaction(
          transactions,
          charge,
          createdTime,
          expiresTime
        );

        if (matchedTx) {
          console.log(`[USDT Cron] Match found for ${charge.id}: ${matchedTx.hash}`);

          // 거래 중복 확인
          const { data: existing } = await (supabase as any)
            .from('usdt_charges')
            .select('id')
            .eq('transaction_hash', matchedTx.hash)
            .limit(1)
            .single();

          if (existing && existing.id !== charge.id) {
            console.log(`[USDT Cron] Transaction already used by ${existing.id}`);
            continue;
          }

          // 상태 업데이트 및 포인트 충전
          await confirmAndCreditCharge(charge.id, matchedTx.hash);
          processedCount++;
        }
      } catch (error: any) {
        console.error(`[USDT Cron] Error processing charge ${charge.id}:`, error);
      }
    }

    console.log(`[USDT Cron] Complete - Processed: ${processedCount}, Expired: ${expiredCount}`);

    return NextResponse.json({
      success: true,
      processed: processedCount,
      expired: expiredCount,
      total: pendingCharges.length,
    });
  } catch (error: any) {
    console.error('[USDT Cron] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// TronScan API 호출
async function getTronScanTransactions(walletAddress: string) {
  try {
    const response = await axios.get(
      'https://apilist.tronscanapi.com/api/token_trc20/transfers',
      {
        params: {
          contract_address: USDT_CONTRACT,
          toAddress: walletAddress,
          limit: 20,
          start: 0,
        },
        headers: TRONSCAN_API_KEY ? { 'TRON-PRO-API-KEY': TRONSCAN_API_KEY } : {},
        timeout: 8000,
      }
    );

    const transfers = response.data.token_transfers || [];
    return transfers.map((tx: any) => ({
      hash: tx.transaction_id,
      from: tx.from_address,
      to: tx.to_address,
      tokenAmount: parseFloat(tx.quant) / Math.pow(10, 6),
      timestamp: tx.block_ts,
      confirmed: tx.confirmed,
    }));
  } catch (error: any) {
    console.error('[TronScan] API error:', error.message);
    return [];
  }
}

// 거래 매칭 로직
function findMatchingTransaction(
  transactions: any[],
  charge: any,
  createdTime: number,
  expiresTime: number
) {
  for (const tx of transactions) {
    const txTime = tx.timestamp > 100000000000 ? tx.timestamp : tx.timestamp * 1000;

    // 시간 범위 체크
    if (txTime < createdTime || txTime > expiresTime) {
      continue;
    }

    // 금액 체크 (±0.1 USDT 허용)
    const amountDiff = Math.abs(tx.tokenAmount - charge.usdt_amount);
    if (amountDiff > 0.1) {
      continue;
    }

    // 지갑 검증
    let walletMatch = false;
    if (charge.wallet_type === 'personal') {
      const fromLast3 = tx.from.slice(-3).toLowerCase();
      const userLast3 = charge.wallet_identifier.toLowerCase();
      walletMatch = fromLast3 === userLast3;
    } else {
      const exchangeNames: Record<string, string[]> = {
        bithumb: ['bithumb'],
        upbit: ['upbit'],
        coinone: ['coinone'],
        binance: ['binance', 'binance-hot'],
        bingx: ['bingx'],
        lbank: ['lbank'],
        huobi: ['huobi'],
        okx: ['okx'],
      };
      const searchTerms = exchangeNames[charge.wallet_type] || [];
      walletMatch = searchTerms.some((term) => tx.from.toLowerCase().includes(term));
    }

    if (walletMatch) {
      return tx;
    }
  }

  return null;
}

// 충전 확정 및 포인트 지급
async function confirmAndCreditCharge(chargeId: string, txHash: string) {
  try {
    await supabase.rpc('confirm_and_credit_usdt_charge', {
      p_charge_id: chargeId,
      p_transaction_hash: txHash,
    });
    console.log(`[USDT Cron] Credited points for charge: ${chargeId}`);
  } catch (error: any) {
    console.error(`[USDT Cron] Credit error for ${chargeId}:`, error);
    throw error;
  }
}
