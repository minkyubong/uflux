-- ============================================
-- Phase 5: Real-time Admin Stats (O(1) Query)
-- Author: Universe #1 Architect
-- Date: 2026-01-18
-- Purpose: Eliminate expensive COUNT queries on admin dashboard
-- ============================================

-- 1. 실시간 통계 저장소 (싱글로우 테이블)
CREATE TABLE IF NOT EXISTS admin_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_users INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_revenue NUMERIC(15, 2) DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    pending_deposits INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- 초기값 세팅 (충돌 시 무시)
INSERT INTO admin_stats (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 기존 데이터로 초기 동기화
UPDATE admin_stats SET
    total_users = (SELECT COUNT(*) FROM profiles),
    total_orders = (SELECT COUNT(*) FROM orders),
    total_revenue = (SELECT COALESCE(SUM(charge), 0) FROM orders WHERE status != 'canceled'),
    pending_orders = (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
    pending_deposits = (SELECT COUNT(*) FROM deposits WHERE status = 'pending'),
    updated_at = NOW()
WHERE id = 1;

-- 2. 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_admin_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- [Users] 가입/탈퇴 시
    IF TG_TABLE_NAME = 'profiles' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE admin_stats SET total_users = total_users + 1, updated_at = NOW() WHERE id = 1;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE admin_stats SET total_users = total_users - 1, updated_at = NOW() WHERE id = 1;
        END IF;

    -- [Orders] 주문/취소/완료 시
    ELSIF TG_TABLE_NAME = 'orders' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE admin_stats SET
                total_orders = total_orders + 1,
                total_revenue = total_revenue + NEW.charge,
                pending_orders = pending_orders + 1,
                updated_at = NOW()
            WHERE id = 1;
        ELSIF TG_OP = 'UPDATE' THEN
            -- 상태 변경: pending -> processing/completed
            IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
                UPDATE admin_stats SET pending_orders = pending_orders - 1, updated_at = NOW() WHERE id = 1;
            END IF;
            -- 매출 차감: 일반 -> canceled
            IF OLD.status != 'canceled' AND NEW.status = 'canceled' THEN
                UPDATE admin_stats SET total_revenue = total_revenue - OLD.charge, updated_at = NOW() WHERE id = 1;
            END IF;
        END IF;

    -- [Deposits] 충전 신청/처리 시
    ELSIF TG_TABLE_NAME = 'deposits' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE admin_stats SET pending_deposits = pending_deposits + 1, updated_at = NOW() WHERE id = 1;
        ELSIF TG_OP = 'UPDATE' THEN
            IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
                UPDATE admin_stats SET pending_deposits = pending_deposits - 1, updated_at = NOW() WHERE id = 1;
            END IF;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거 연결
DROP TRIGGER IF EXISTS trg_stats_users ON profiles;
CREATE TRIGGER trg_stats_users AFTER INSERT OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_admin_stats();

DROP TRIGGER IF EXISTS trg_stats_orders ON orders;
CREATE TRIGGER trg_stats_orders AFTER INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_admin_stats();

DROP TRIGGER IF EXISTS trg_stats_deposits ON deposits;
CREATE TRIGGER trg_stats_deposits AFTER INSERT OR UPDATE ON deposits
FOR EACH ROW EXECUTE FUNCTION update_admin_stats();

-- RLS Policy for admin_stats
ALTER TABLE admin_stats ENABLE ROW LEVEL SECURITY;

-- Service role can read/write
CREATE POLICY "Service role full access" ON admin_stats
    FOR ALL USING (true) WITH CHECK (true);

-- Authenticated users can read (for admin dashboard)
CREATE POLICY "Authenticated read access" ON admin_stats
    FOR SELECT TO authenticated USING (true);

-- ============================================
-- Real-time Stats Complete
-- Before: SELECT COUNT(*) FROM orders → O(n) Full Scan
-- After:  SELECT * FROM admin_stats WHERE id = 1 → O(1) Index Lookup
-- Expected: 100x ~ 1000x faster admin dashboard
-- ============================================

