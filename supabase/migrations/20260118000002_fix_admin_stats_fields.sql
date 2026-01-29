-- ============================================
-- get_admin_dashboard_stats RPC Function (수정)
-- 프론트엔드와 필드명 일치시키기 (camelCase)
-- ============================================

DROP FUNCTION IF EXISTS get_admin_dashboard_stats();

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    -- 오늘 매출
    'todaySales', (SELECT COALESCE(SUM(charge), 0) FROM orders WHERE created_at >= CURRENT_DATE AND status != 'cancelled'),
    -- 어제 매출
    'yesterdaySales', (SELECT COALESCE(SUM(charge), 0) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE AND status != 'cancelled'),
    -- 오늘 주문 수
    'todayOrders', (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE),
    -- 전체 회원 수
    'totalUsers', (SELECT COUNT(*) FROM profiles),
    -- 오늘 가입한 회원 수
    'newUsersToday', (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE),
    -- 대기 중인 입금 건수
    'pendingDeposits', (SELECT COUNT(*) FROM deposits WHERE status = 'pending'),
    -- 대기 중인 입금 총액
    'pendingDepositAmount', (SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE status = 'pending'),
    -- 처리 중인 주문 건수
    'processingOrders', (SELECT COUNT(*) FROM orders WHERE status = 'processing' OR status = 'in_progress')
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 권한 설정
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;

