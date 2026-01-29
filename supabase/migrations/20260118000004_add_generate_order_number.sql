-- ============================================
-- generate_order_number 함수 생성
-- 주문번호 생성을 위한 헬퍼 함수
-- ============================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_order_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- 주문번호 형식: ORD + 날짜(YYMMDD) + 랜덤 6자리
    v_order_number := 'ORD' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- 중복 확인
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = v_order_number) INTO v_exists;

    -- 중복이 없으면 반환
    IF NOT v_exists THEN
      RETURN v_order_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 권한 설정
GRANT EXECUTE ON FUNCTION generate_order_number() TO authenticated;

-- ============================================
-- process_order 함수 재생성 (의존성 해결 후)
-- ============================================

DROP FUNCTION IF EXISTS process_order(UUID, UUID, TEXT, INTEGER);

CREATE FUNCTION process_order(
  p_user_id UUID,
  p_service_id UUID,
  p_link TEXT,
  p_quantity INTEGER
) RETURNS UUID AS $$
DECLARE
  v_balance NUMERIC;
  v_service_price NUMERIC;
  v_service_min INTEGER;
  v_service_max INTEGER;
  v_service_active BOOLEAN;
  v_total_price NUMERIC;
  v_new_order_id UUID;
  v_order_number TEXT;
BEGIN
  -- [보안 1] 수량 유효성 검사
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION '수량은 1 이상이어야 합니다.';
  END IF;

  -- [보안 2] 서비스 정보 조회
  SELECT price, min_quantity, max_quantity, is_active
  INTO v_service_price, v_service_min, v_service_max, v_service_active
  FROM services
  WHERE id = p_service_id;

  IF v_service_price IS NULL THEN
    RAISE EXCEPTION '존재하지 않는 서비스입니다.';
  END IF;

  -- [보안 3] 서비스 활성화 상태 확인
  IF NOT v_service_active THEN
    RAISE EXCEPTION '현재 이용할 수 없는 서비스입니다.';
  END IF;

  -- [보안 4] 최소/최대 수량 검증
  IF p_quantity < v_service_min THEN
    RAISE EXCEPTION '최소 주문 수량은 %개 입니다.', v_service_min;
  END IF;

  IF p_quantity > v_service_max THEN
    RAISE EXCEPTION '최대 주문 수량은 %개 입니다.', v_service_max;
  END IF;

  -- [보안 5] 링크 유효성 검사
  IF p_link IS NULL OR LENGTH(TRIM(p_link)) < 5 THEN
    RAISE EXCEPTION '유효한 링크를 입력해주세요.';
  END IF;

  -- [핵심] 서버 사이드 가격 계산
  v_total_price := v_service_price * p_quantity;

  -- [트랜잭션 1] 사용자 잔액 잠금 및 조회
  SELECT balance INTO v_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION '사용자를 찾을 수 없습니다.';
  END IF;

  -- [트랜잭션 2] 잔액 부족 체크
  IF v_balance < v_total_price THEN
    RAISE EXCEPTION '잔액이 부족합니다. (필요: %원, 보유: %원)', v_total_price, v_balance;
  END IF;

  -- 주문 번호 생성
  v_order_number := generate_order_number();

  -- [트랜잭션 3] 주문 생성
  INSERT INTO orders (
    order_number, user_id, service_id, link, quantity,
    charge, unit_price, status, created_at, updated_at
  ) VALUES (
    v_order_number, p_user_id, p_service_id, p_link, p_quantity,
    v_total_price, v_service_price, 'pending', NOW(), NOW()
  ) RETURNING id INTO v_new_order_id;

  -- [트랜잭션 4] 잔액 차감
  UPDATE profiles
  SET
    balance = balance - v_total_price,
    total_spent = COALESCE(total_spent, 0) + v_total_price,
    total_orders = COALESCE(total_orders, 0) + 1,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- [트랜잭션 5] 트랜잭션 로그 기록
  INSERT INTO transactions (
    user_id, type, amount, balance_before, balance_after,
    description, reference_id, reference_type, status,
    metadata, created_at
  ) VALUES (
    p_user_id, 'order', -v_total_price, v_balance, v_balance - v_total_price,
    '서비스 주문: ' || v_order_number, v_new_order_id, 'order', 'approved',
    jsonb_build_object(
      'service_id', p_service_id,
      'quantity', p_quantity,
      'unit_price', v_service_price,
      'link', p_link
    ),
    NOW()
  );

  RETURN v_new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 권한 설정
GRANT EXECUTE ON FUNCTION process_order(UUID, UUID, TEXT, INTEGER) TO authenticated;

