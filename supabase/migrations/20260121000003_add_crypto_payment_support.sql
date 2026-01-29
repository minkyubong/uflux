-- ============================================
-- Migration: Add Crypto Payment Support
-- deposits 테이블에 USDT 결제 지원 컬럼 추가
-- ============================================

-- ============================================
-- 1. 결제 수단 ENUM 타입 생성
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('bank_transfer', 'crypto');
  END IF;
END $$;

-- ============================================
-- 2. deposits 테이블에 새 컬럼 추가
-- ============================================

-- payment_method: 결제 수단 (무통장입금 / 암호화폐)
ALTER TABLE deposits
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'bank_transfer';

-- tx_id: 블록체인 거래 해시 (TXID)
ALTER TABLE deposits
ADD COLUMN IF NOT EXISTS tx_id TEXT;

-- exchange_rate: 당시 적용된 환율 (KRW per USDT)
ALTER TABLE deposits
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12, 4);

-- crypto_amount: 고객이 보낸 암호화폐 수량 (USDT)
ALTER TABLE deposits
ADD COLUMN IF NOT EXISTS crypto_amount NUMERIC(20, 8);

-- crypto_currency: 암호화폐 종류 (향후 확장성)
ALTER TABLE deposits
ADD COLUMN IF NOT EXISTS crypto_currency TEXT DEFAULT 'USDT';

-- network: 블록체인 네트워크 (TRC-20, ERC-20 등)
ALTER TABLE deposits
ADD COLUMN IF NOT EXISTS network TEXT DEFAULT 'TRC-20';

-- ============================================
-- 3. 인덱스 추가
-- ============================================

-- tx_id 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_deposits_tx_id
ON deposits(tx_id)
WHERE tx_id IS NOT NULL;

-- payment_method별 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_deposits_payment_method
ON deposits(payment_method);

-- ============================================
-- 4. 코멘트 추가 (문서화)
-- ============================================
COMMENT ON COLUMN deposits.payment_method IS '결제 수단: bank_transfer(무통장), crypto(암호화폐)';
COMMENT ON COLUMN deposits.tx_id IS '블록체인 거래 해시 (TXID) - 암호화폐 결제 시';
COMMENT ON COLUMN deposits.exchange_rate IS '적용된 환율 (1 USDT = X KRW)';
COMMENT ON COLUMN deposits.crypto_amount IS '보낸 암호화폐 수량 (예: 10.5 USDT)';
COMMENT ON COLUMN deposits.crypto_currency IS '암호화폐 종류 (USDT, BTC 등)';
COMMENT ON COLUMN deposits.network IS '블록체인 네트워크 (TRC-20, ERC-20 등)';

-- ============================================
-- 5. 기존 데이터 마이그레이션
-- 기존 모든 deposits는 bank_transfer로 설정
-- ============================================
UPDATE deposits
SET payment_method = 'bank_transfer'
WHERE payment_method IS NULL;

-- ============================================
-- 6. Constraint 추가: tx_id 유니크 (중복 방지)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'deposits_tx_id_unique'
  ) THEN
    ALTER TABLE deposits
    ADD CONSTRAINT deposits_tx_id_unique UNIQUE (tx_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- 이미 존재하면 무시
END $$;

-- ============================================
-- 7. 검증용 뷰: crypto_deposits
-- ============================================
CREATE OR REPLACE VIEW crypto_deposits AS
SELECT
  d.id,
  d.user_id,
  d.amount AS krw_amount,
  d.crypto_amount,
  d.crypto_currency,
  d.exchange_rate,
  d.tx_id,
  d.network,
  d.status,
  d.created_at,
  d.updated_at,
  p.email AS user_email
FROM deposits d
LEFT JOIN profiles p ON d.user_id = p.id
WHERE d.payment_method = 'crypto'
ORDER BY d.created_at DESC;

-- 뷰 권한 설정
GRANT SELECT ON crypto_deposits TO authenticated;
GRANT SELECT ON crypto_deposits TO service_role;

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Crypto payment support migration completed';
  RAISE NOTICE '   - Added columns: payment_method, tx_id, exchange_rate, crypto_amount, crypto_currency, network';
  RAISE NOTICE '   - Created indexes for tx_id and payment_method';
  RAISE NOTICE '   - Created crypto_deposits view';
END $$;

