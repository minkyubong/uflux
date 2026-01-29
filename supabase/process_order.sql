-- ============================================
-- process_order RPC Function (v2 - 보안 강화)
-- 주문 처리 함수 (원자성 보장 + 서버 측 가격 계산)
-- ============================================
--
-- 이 함수는 다음을 하나의 트랜잭션으로 처리합니다:
-- 1. 서비스 정보 조회 및 검증
-- 2. 서버 측 가격 계산 (클라이언트 조작 방지)
-- 3. 사용자 잔액 확인
-- 4. 잔액 차감
-- 5. 주문 생성
-- 6. 트랜잭션 기록
--
-- 모두 성공하거나 모두 실패합니다 (ACID)
--
-- ⚠️ 보안 변경사항 (v2):
-- - p_amount 파라미터 제거됨
-- - 가격은 services 테이블에서 직접 조회하여 계산
-- - 클라이언트가 가격을 조작할 수 없음
-- ============================================

-- 기존 함수 삭제 (모든 오버로드 버전)
DROP FUNCTION IF EXISTS process_order(UUID, UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS process_order(UUID, UUID, TEXT, INTEGER);

-- 주문 처리 함수 생성 (보안 강화 버전)
CREATE OR REPLACE FUNCTION process_order(
  p_user_id UUID,
  p_service_id UUID,
  p_link TEXT,
  p_quantity INTEGER
) RETURNS UUID AS $$
DECLARE
  v_balance NUMERIC(12, 2);
  v_service_price NUMERIC(12, 4);
  v_service_min INTEGER;
  v_service_max INTEGER;
  v_service_active BOOLEAN;
  v_service_provider_id UUID;
  v_calculated_amount NUMERIC(12, 2);
  v_order_id UUID;
  v_order_number TEXT;
BEGIN
  -- ============================================
  -- 1. 서비스 정보 조회 및 검증
  -- ============================================
  SELECT
    price,
    min_quantity,
    max_quantity,
    is_active,
    provider_id
  INTO
    v_service_price,
    v_service_min,
    v_service_max,
    v_service_active,
    v_service_provider_id
  FROM services
  WHERE id = p_service_id;

  -- 서비스 존재 여부 확인
  IF v_service_price IS NULL THEN
    RAISE EXCEPTION 'Service not found: %', p_service_id;
  END IF;

  -- 서비스 활성 상태 확인
  IF NOT v_service_active THEN
    RAISE EXCEPTION 'Service is not active: %', p_service_id;
  END IF;

  -- 수량 범위 검증
  IF p_quantity < v_service_min OR p_quantity > v_service_max THEN
    RAISE EXCEPTION 'Quantity out of range. Min: %, Max: %, Requested: %',
      v_service_min, v_service_max, p_quantity;
  END IF;

  -- ============================================
  -- 2. 서버 측 가격 계산 (핵심 보안 포인트)
  -- price는 1000개당 가격이므로 (price / 1000) * quantity
  -- ============================================
  v_calculated_amount := CEIL((v_service_price / 1000.0) * p_quantity);

  -- ============================================
  -- 3. 사용자 잔액 확인 (FOR UPDATE로 락)
  -- ============================================
  SELECT balance INTO v_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- 잔액 확인
  IF v_balance < v_calculated_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Required: %, Available: %',
      v_calculated_amount, v_balance;
  END IF;

  -- ============================================
  -- 4. 주문 번호 생성
  -- ============================================
  v_order_number := 'INF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  -- ============================================
  -- 5. 주문 생성
  -- ============================================
  INSERT INTO orders (
    user_id,
    service_id,
    provider_id,
    order_number,
    link,
    quantity,
    charge,
    unit_price,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_service_id,
    v_service_provider_id,
    v_order_number,
    p_link,
    p_quantity,
    v_calculated_amount,
    v_service_price,
    'pending',
    NOW(),
    NOW()
  ) RETURNING id INTO v_order_id;

  -- ============================================
  -- 6. 잔액 차감 및 통계 업데이트
  -- ============================================
  UPDATE profiles
  SET
    balance = balance - v_calculated_amount,
    total_spent = COALESCE(total_spent, 0) + v_calculated_amount,
    total_orders = COALESCE(total_orders, 0) + 1,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- ============================================
  -- 7. 트랜잭션 기록
  -- ============================================
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
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    'order',
    -v_calculated_amount,
    v_balance,
    v_balance - v_calculated_amount,
    '주문 결제: ' || v_order_number,
    v_order_id,
    'order',
    'approved',
    jsonb_build_object(
      'service_id', p_service_id,
      'quantity', p_quantity,
      'unit_price', v_service_price,
      'calculated_amount', v_calculated_amount,
      'link', p_link
    ),
    NOW()
  );

  -- ============================================
  -- 8. 주문 ID 반환
  -- ============================================
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 권한 설정 (authenticated 사용자만 호출 가능)
GRANT EXECUTE ON FUNCTION process_order(UUID, UUID, TEXT, INTEGER) TO authenticated;

-- 문서화
COMMENT ON FUNCTION process_order(UUID, UUID, TEXT, INTEGER) IS
'주문 처리 함수 (보안 강화 버전 v2)
- 클라이언트에서 금액을 받지 않음 (조작 방지)
- 서버에서 services 테이블의 price를 직접 조회하여 계산
- 서비스 활성 상태 및 수량 범위 검증
- 잔액 차감, 주문 생성, 트랜잭션 기록을 원자적으로 처리

파라미터:
- p_user_id: 주문하는 사용자 UUID
- p_service_id: 서비스 UUID
- p_link: 주문 링크 (Instagram URL 등)
- p_quantity: 주문 수량

반환값:
- 생성된 주문의 UUID

사용 예시:
SELECT process_order(
  ''user-uuid-here'',
  ''service-uuid-here'',
  ''https://instagram.com/example'',
  1000
);';

