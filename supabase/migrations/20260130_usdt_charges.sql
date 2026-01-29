-- =============================================
-- USDT 자동 충전 시스템 테이블
-- =============================================

-- USDT 충전 요청 테이블
CREATE TABLE IF NOT EXISTS usdt_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 지갑 정보
  wallet_type TEXT NOT NULL, -- personal, bithumb, upbit, coinone, binance, etc.
  wallet_identifier TEXT NOT NULL, -- 개인지갑: 끝3자리, 거래소: 거래소명
  
  -- 금액 정보
  krw_amount INTEGER NOT NULL,
  usdt_amount DECIMAL(18, 6) NOT NULL,
  exchange_rate_at_request DECIMAL(12, 2) NOT NULL,
  
  -- 상태 관리
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, failed, expired, cancelled
  
  -- 트랜잭션 정보
  transaction_hash TEXT,
  
  -- 포인트 충전 정보
  points_added INTEGER DEFAULT 0,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- 오류 정보
  error_message TEXT,
  failure_reason TEXT,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_usdt_charges_user_id ON usdt_charges(user_id);
CREATE INDEX idx_usdt_charges_status ON usdt_charges(status);
CREATE INDEX idx_usdt_charges_transaction_hash ON usdt_charges(transaction_hash);
CREATE INDEX idx_usdt_charges_created_at ON usdt_charges(created_at DESC);
CREATE INDEX idx_usdt_charges_user_status ON usdt_charges(user_id, status);

-- RLS 정책
ALTER TABLE usdt_charges ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 충전 내역만 조회
CREATE POLICY "Users can view own usdt charges"
  ON usdt_charges FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 충전 요청만 생성
CREATE POLICY "Users can create own usdt charges"
  ON usdt_charges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 충전 요청만 업데이트 (취소용)
CREATE POLICY "Users can update own usdt charges"
  ON usdt_charges FOR UPDATE
  USING (auth.uid() = user_id);

-- 관리자는 모든 충전 내역 조회
CREATE POLICY "Admins can view all usdt charges"
  ON usdt_charges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 관리자는 모든 충전 내역 관리
CREATE POLICY "Admins can manage all usdt charges"
  ON usdt_charges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- updated_at 자동 갱신
CREATE TRIGGER update_usdt_charges_updated_at
  BEFORE UPDATE ON usdt_charges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
