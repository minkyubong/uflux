-- ============================================
-- Migration: Atomic Order Claim RPC
-- Race Condition 방지를 위한 SKIP LOCKED 패턴
-- ============================================

-- Drop if exists for idempotency
DROP FUNCTION IF EXISTS claim_pending_orders(INTEGER);

-- ============================================
-- claim_pending_orders: Atomic Order Claim
--
-- CRITICAL: FOR UPDATE SKIP LOCKED 사용
-- - 동시에 여러 cron 인스턴스가 실행되어도 안전
-- - 이미 잠긴 행은 건너뜀 (대기하지 않음)
-- - UPDATE ... RETURNING으로 단일 트랜잭션에서 처리
-- ============================================
CREATE OR REPLACE FUNCTION claim_pending_orders(batch_size INTEGER DEFAULT 50)
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
  UPDATE orders o
  SET
    status = 'processing',
    updated_at = NOW()
  WHERE o.id IN (
    SELECT sub.id
    FROM orders sub
    WHERE sub.status = 'pending'
      AND sub.provider_order_id IS NULL  -- 아직 도매처에 전송되지 않은 주문만
    ORDER BY sub.created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED  -- 핵심: 이미 잠긴 행은 건너뜀
  )
  RETURNING
    o.id,
    o.order_number,
    o.user_id,
    o.service_id,
    o.link,
    o.quantity,
    (SELECT s.provider_service_id FROM services s WHERE s.id = o.service_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role (cron uses service role key)
GRANT EXECUTE ON FUNCTION claim_pending_orders(INTEGER) TO service_role;

-- Comment for documentation
COMMENT ON FUNCTION claim_pending_orders IS
'Atomically claims pending orders for processing using SKIP LOCKED pattern.
Prevents race conditions when multiple cron instances run simultaneously.
Returns claimed orders with their service mapping information.';

