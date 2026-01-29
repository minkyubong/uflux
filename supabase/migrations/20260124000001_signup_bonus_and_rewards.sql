-- ============================================
-- 회원가입 보너스 + 첫충전 보너스 + 적립금 시스템
-- ============================================

-- ============================================
-- 1. profiles 테이블에 보너스 관련 컬럼 추가
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_bonus_received BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_deposit_bonus_received BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points_earned NUMERIC(12, 2) DEFAULT 0;

-- ============================================
-- 2. 회원가입 시 1,000P 자동 지급하도록 트리거 수정
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
  v_signup_bonus NUMERIC := 1000; -- 회원가입 보너스 1,000원
BEGIN
  -- 고유 추천인 코드 생성
  v_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));

  -- 프로필 생성 (회원가입 보너스 포함)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    balance,
    total_spent,
    total_orders,
    tier,
    referral_code,
    is_admin,
    is_active,
    signup_bonus_received,
    first_deposit_bonus_received,
    total_points_earned,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    v_signup_bonus, -- 1,000원 보너스 지급
    0,
    0,
    'basic',
    v_referral_code,
    FALSE,
    TRUE,
    TRUE, -- 가입 보너스 받음
    FALSE, -- 첫충전 보너스 아직 안받음
    0,
    NOW(),
    NOW()
  );

  -- 보너스 지급 거래 내역 기록
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    status,
    metadata
  )
  VALUES (
    NEW.id,
    'bonus',
    v_signup_bonus,
    0,
    v_signup_bonus,
    '회원가입 축하 보너스',
    'approved',
    jsonb_build_object('bonus_type', 'signup', 'amount', v_signup_bonus)
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 3. 첫충전 20% 보너스 함수
-- ============================================
CREATE OR REPLACE FUNCTION apply_first_deposit_bonus(
  p_user_id UUID,
  p_deposit_amount NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  v_is_first_deposit BOOLEAN;
  v_bonus_rate NUMERIC := 0.20; -- 20% 보너스
  v_bonus_amount NUMERIC;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- 첫충전 여부 확인
  SELECT NOT first_deposit_bonus_received INTO v_is_first_deposit
  FROM profiles
  WHERE id = p_user_id;

  IF NOT v_is_first_deposit THEN
    RETURN 0; -- 이미 첫충전 보너스를 받음
  END IF;

  -- 보너스 계산
  v_bonus_amount := FLOOR(p_deposit_amount * v_bonus_rate);

  -- 현재 잔액 조회
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  v_new_balance := v_current_balance + v_bonus_amount;

  -- 잔액 및 보너스 상태 업데이트
  UPDATE profiles
  SET balance = v_new_balance,
      first_deposit_bonus_received = TRUE,
      total_points_earned = total_points_earned + v_bonus_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- 거래 내역 기록
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    status,
    metadata
  )
  VALUES (
    p_user_id,
    'bonus',
    v_bonus_amount,
    v_current_balance,
    v_new_balance,
    '첫충전 20% 보너스',
    'approved',
    jsonb_build_object('bonus_type', 'first_deposit', 'deposit_amount', p_deposit_amount, 'bonus_rate', v_bonus_rate)
  );

  RETURN v_bonus_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. 주문 적립금 함수 (5만원 이상 5% 적립)
-- ============================================
CREATE OR REPLACE FUNCTION apply_order_points(
  p_user_id UUID,
  p_order_amount NUMERIC,
  p_order_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_min_amount NUMERIC := 50000; -- 최소 5만원 이상
  v_points_rate NUMERIC := 0.05; -- 5% 적립
  v_points_amount NUMERIC;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- 5만원 이상만 적립
  IF p_order_amount < v_min_amount THEN
    RETURN 0;
  END IF;

  -- 적립금 계산
  v_points_amount := FLOOR(p_order_amount * v_points_rate);

  -- 현재 잔액 조회
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  v_new_balance := v_current_balance + v_points_amount;

  -- 잔액 및 적립금 업데이트
  UPDATE profiles
  SET balance = v_new_balance,
      total_points_earned = total_points_earned + v_points_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- 거래 내역 기록
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    reference_id,
    reference_type,
    status,
    metadata
  )
  VALUES (
    p_user_id,
    'bonus',
    v_points_amount,
    v_current_balance,
    v_new_balance,
    '주문 적립금 (5%)',
    p_order_id,
    'order',
    'approved',
    jsonb_build_object('bonus_type', 'order_points', 'order_amount', p_order_amount, 'points_rate', v_points_rate)
  );

  RETURN v_points_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VIP 등급별 추가 적립 (선택적)
-- ============================================
CREATE OR REPLACE FUNCTION get_tier_bonus_rate(p_tier user_tier)
RETURNS NUMERIC AS $$
BEGIN
  CASE p_tier
    WHEN 'basic' THEN RETURN 0;
    WHEN 'vip' THEN RETURN 0.01; -- +1%
    WHEN 'premium' THEN RETURN 0.02; -- +2%
    WHEN 'enterprise' THEN RETURN 0.03; -- +3%
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 권한 부여
-- ============================================
GRANT EXECUTE ON FUNCTION apply_first_deposit_bonus(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_order_points(UUID, NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tier_bonus_rate(user_tier) TO authenticated;

