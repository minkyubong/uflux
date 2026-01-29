-- =============================================
-- USDT 자동 충전 함수
-- =============================================

-- USDT 충전 확정 및 포인트 지급
CREATE OR REPLACE FUNCTION confirm_and_credit_usdt_charge(
  p_charge_id UUID,
  p_transaction_hash TEXT
)
RETURNS JSON AS $$
DECLARE
  v_charge RECORD;
  v_points_to_add INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- 충전 요청 조회 및 lock
  SELECT * INTO v_charge
  FROM usdt_charges
  WHERE id = p_charge_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Charge not found');
  END IF;

  -- 이미 처리된 경우
  IF v_charge.status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Already completed');
  END IF;

  -- 포인트 계산 (KRW 1원 = 1포인트)
  v_points_to_add := v_charge.krw_amount;

  -- 사용자 잔액 업데이트
  UPDATE profiles
  SET balance = balance + v_points_to_add,
      updated_at = NOW()
  WHERE id = v_charge.user_id
  RETURNING balance INTO v_new_balance;

  -- 충전 요청 상태 업데이트
  UPDATE usdt_charges
  SET status = 'completed',
      transaction_hash = p_transaction_hash,
      confirmed_at = NOW(),
      completed_at = NOW(),
      points_added = v_points_to_add,
      updated_at = NOW()
  WHERE id = p_charge_id;

  -- 거래 내역 추가
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    description,
    status,
    metadata
  ) VALUES (
    v_charge.user_id,
    'deposit',
    v_points_to_add,
    'USDT (TRC-20) 자동 충전',
    'completed',
    json_build_object(
      'charge_id', p_charge_id,
      'transaction_hash', p_transaction_hash,
      'usdt_amount', v_charge.usdt_amount,
      'exchange_rate', v_charge.exchange_rate_at_request
    )::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'charge_id', p_charge_id,
    'points_added', v_points_to_add,
    'new_balance', v_new_balance
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;
