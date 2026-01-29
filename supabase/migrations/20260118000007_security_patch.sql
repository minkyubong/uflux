-- ============================================
-- P0 Security Patch: Critical Vulnerability Fix
-- Author: Universe #1 Architect
-- Date: 2026-01-18
-- Risk Level: P0 (Financial Loss Prevention)
-- ============================================

-- ============================================
-- 1. Atomic Order Claim with SKIP LOCKED
-- Purpose: Prevent duplicate order processing
-- ============================================
DROP FUNCTION IF EXISTS claim_pending_orders(INTEGER);

CREATE OR REPLACE FUNCTION claim_pending_orders(batch_size INTEGER)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  user_id UUID,
  service_id UUID,
  link TEXT,
  quantity INTEGER,
  provider_service_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  UPDATE orders
  SET status = 'processing',
      updated_at = NOW()
  WHERE orders.id IN (
    SELECT o.id
    FROM orders o
    WHERE o.status = 'pending'
    ORDER BY o.created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED -- Critical: Skip rows locked by other processes
  )
  RETURNING
    orders.id,
    orders.order_number,
    orders.user_id,
    orders.service_id,
    orders.link,
    orders.quantity,
    (SELECT s.provider_service_id FROM services s WHERE s.id = orders.service_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION claim_pending_orders(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION claim_pending_orders(INTEGER) TO authenticated;

COMMENT ON FUNCTION claim_pending_orders IS
'Atomically claims pending orders using SKIP LOCKED to prevent race conditions.
Critical for preventing duplicate order processing in concurrent cron executions.';

-- ============================================
-- 2. Minimum Deposit Amount Constraint
-- Purpose: Prevent micro-deposit attacks
-- ============================================
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_min_deposit_amount'
  ) THEN
    ALTER TABLE deposits
    ADD CONSTRAINT check_min_deposit_amount CHECK (amount >= 10000);

    RAISE NOTICE 'Added minimum deposit constraint: 10,000 KRW';
  ELSE
    RAISE NOTICE 'Minimum deposit constraint already exists';
  END IF;
END $$;

-- ============================================
-- 3. Enhanced process_order with URL Validation
-- Purpose: Prevent invalid URL injection attacks
-- ============================================
CREATE OR REPLACE FUNCTION process_order(
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
  v_unit_price NUMERIC;
  v_new_order_id UUID;
  v_order_number TEXT;
  v_category_slug TEXT;
BEGIN
  -- ==========================================
  -- [Security 1] Input Validation
  -- ==========================================
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION '수량은 1 이상이어야 합니다.';
  END IF;

  IF p_link IS NULL OR LENGTH(TRIM(p_link)) < 5 THEN
    RAISE EXCEPTION '유효한 링크를 입력해주세요.';
  END IF;

  -- ==========================================
  -- [Security 2] Service Lookup & Validation
  -- ==========================================
  SELECT s.price, s.min_quantity, s.max_quantity, s.is_active, c.slug
  INTO v_service_price, v_service_min, v_service_max, v_service_active, v_category_slug
  FROM services s
  JOIN categories c ON s.category_id = c.id
  WHERE s.id = p_service_id;

  IF v_service_price IS NULL THEN
    RAISE EXCEPTION '존재하지 않는 서비스입니다.';
  END IF;

  IF NOT v_service_active THEN
    RAISE EXCEPTION '현재 이용할 수 없는 서비스입니다.';
  END IF;

  -- ==========================================
  -- [Security 3] URL Regex Validation by Platform
  -- ==========================================

  -- YouTube: youtube.com or youtu.be required
  IF v_category_slug = 'youtube' AND NOT (p_link ~* 'youtu\.?be') THEN
    RAISE EXCEPTION '올바른 유튜브 링크 형식이 아닙니다. (youtube.com 또는 youtu.be)';
  END IF;

  -- Instagram: instagram.com required
  IF v_category_slug = 'instagram' AND NOT (p_link ~* 'instagram\.com') THEN
    RAISE EXCEPTION '올바른 인스타그램 링크 형식이 아닙니다. (instagram.com)';
  END IF;

  -- TikTok: tiktok.com required
  IF v_category_slug = 'tiktok' AND NOT (p_link ~* 'tiktok\.com') THEN
    RAISE EXCEPTION '올바른 틱톡 링크 형식이 아닙니다. (tiktok.com)';
  END IF;

  -- Twitter/X: twitter.com or x.com required
  IF v_category_slug = 'twitter' AND NOT (p_link ~* '(twitter\.com|x\.com)') THEN
    RAISE EXCEPTION '올바른 트위터/X 링크 형식이 아닙니다. (twitter.com 또는 x.com)';
  END IF;

  -- ==========================================
  -- [Security 4] Quantity Range Validation
  -- ==========================================
  IF p_quantity < v_service_min THEN
    RAISE EXCEPTION '최소 주문 수량은 %개 입니다.', v_service_min;
  END IF;

  IF p_quantity > v_service_max THEN
    RAISE EXCEPTION '최대 주문 수량은 %개 입니다.', v_service_max;
  END IF;

  -- ==========================================
  -- [Core] Server-side Price Calculation
  -- Price is per 1000 units
  -- ==========================================
  v_unit_price := v_service_price / 1000;
  v_total_price := CEIL(v_unit_price * p_quantity);

  -- ==========================================
  -- [Transaction 1] Lock & Verify Balance
  -- FOR UPDATE ensures atomic balance check
  -- ==========================================
  SELECT balance INTO v_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION '사용자를 찾을 수 없습니다.';
  END IF;

  IF v_balance < v_total_price THEN
    RAISE EXCEPTION '잔액이 부족합니다. (필요: %원, 보유: %원)', v_total_price, v_balance;
  END IF;

  -- Generate order number
  v_order_number := generate_order_number();

  -- ==========================================
  -- [Transaction 2] Create Order Record
  -- ==========================================
  INSERT INTO orders (
    order_number,
    user_id,
    service_id,
    link,
    quantity,
    charge,
    unit_price,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_order_number,
    p_user_id,
    p_service_id,
    p_link,
    p_quantity,
    v_total_price,
    v_unit_price,
    'pending',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_order_id;

  -- ==========================================
  -- [Transaction 3] Deduct Balance & Update Stats
  -- ==========================================
  UPDATE profiles
  SET
    balance = balance - v_total_price,
    total_spent = COALESCE(total_spent, 0) + v_total_price,
    total_orders = COALESCE(total_orders, 0) + 1,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- ==========================================
  -- [Transaction 4] Log Transaction Record
  -- ==========================================
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
  )
  VALUES (
    p_user_id,
    'order',
    -v_total_price,
    v_balance,
    v_balance - v_total_price,
    '서비스 주문: ' || v_order_number,
    v_new_order_id,
    'order',
    'approved',
    jsonb_build_object(
      'service_id', p_service_id,
      'quantity', p_quantity,
      'unit_price', v_unit_price,
      'link', p_link
    ),
    NOW()
  );

  RETURN v_new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION process_order(UUID, UUID, TEXT, INTEGER) TO authenticated;

COMMENT ON FUNCTION process_order IS
'Secure order processing with:
- Input validation (quantity, link length)
- Platform-specific URL regex validation (YouTube, Instagram, TikTok, Twitter)
- Server-side price calculation (prevents client manipulation)
- Atomic balance lock (FOR UPDATE)
- Transaction logging';

-- ============================================
-- 4. Add Index for Order Processing Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_pending_status
ON orders (status, created_at)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_orders_processing_status
ON orders (status, created_at)
WHERE status = 'processing';

-- ============================================
-- Security Patch Complete
-- ============================================

