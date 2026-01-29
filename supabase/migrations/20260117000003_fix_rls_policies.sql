-- ============================================
-- Fix RLS Policies - Infinite Recursion Issue
-- ============================================

-- Admin 체크 함수 생성 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage providers" ON providers;
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
DROP POLICY IF EXISTS "Admins can manage services" ON services;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins have full access to orders" ON orders;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins have full access to transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own deposits" ON deposits;
DROP POLICY IF EXISTS "Users can create own deposits" ON deposits;
DROP POLICY IF EXISTS "Admins have full access to deposits" ON deposits;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can view api logs" ON api_logs;
DROP POLICY IF EXISTS "System can insert api logs" ON api_logs;

-- ========== PROFILES 정책 ==========
-- 본인 프로필 조회
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id OR is_admin());

-- 본인 프로필 수정
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Admin은 모든 프로필에 대해 INSERT/DELETE 가능
CREATE POLICY "Admins can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (is_admin() OR auth.uid() = id);

CREATE POLICY "Admins can delete profiles"
    ON profiles FOR DELETE
    USING (is_admin());

-- ========== PROVIDERS 정책 (Admin Only) ==========
CREATE POLICY "Admins can manage providers"
    ON providers FOR ALL
    USING (is_admin());

-- ========== CATEGORIES 정책 ==========
-- 누구나 활성 카테고리 조회 가능
CREATE POLICY "Anyone can view active categories"
    ON categories FOR SELECT
    USING (is_active = TRUE OR is_admin());

-- Admin 관리
CREATE POLICY "Admins can manage categories"
    ON categories FOR ALL
    USING (is_admin());

-- ========== SERVICES 정책 ==========
-- 누구나 활성 서비스 조회 가능 (익명 포함)
CREATE POLICY "Anyone can view active services"
    ON services FOR SELECT
    USING (is_active = TRUE OR is_admin());

-- Admin 관리
CREATE POLICY "Admins can manage services"
    ON services FOR ALL
    USING (is_admin());

-- ========== ORDERS 정책 ==========
-- 본인 주문 조회
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id OR is_admin());

-- 본인 주문 생성
CREATE POLICY "Users can create own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin은 주문 수정/삭제 가능
CREATE POLICY "Admins can update orders"
    ON orders FOR UPDATE
    USING (is_admin());

CREATE POLICY "Admins can delete orders"
    ON orders FOR DELETE
    USING (is_admin());

-- ========== TRANSACTIONS 정책 ==========
-- 본인 거래내역 조회
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id OR is_admin());

-- 시스템만 거래내역 생성 (RPC 함수 통해)
CREATE POLICY "System can insert transactions"
    ON transactions FOR INSERT
    WITH CHECK (true);

-- Admin 관리
CREATE POLICY "Admins can manage transactions"
    ON transactions FOR ALL
    USING (is_admin());

-- ========== DEPOSITS 정책 ==========
-- 본인 입금요청 조회
CREATE POLICY "Users can view own deposits"
    ON deposits FOR SELECT
    USING (auth.uid() = user_id OR is_admin());

-- 본인 입금요청 생성
CREATE POLICY "Users can create own deposits"
    ON deposits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin 수정/삭제
CREATE POLICY "Admins can update deposits"
    ON deposits FOR UPDATE
    USING (is_admin());

CREATE POLICY "Admins can delete deposits"
    ON deposits FOR DELETE
    USING (is_admin());

-- ========== COUPONS 정책 ==========
-- 활성 쿠폰 조회
CREATE POLICY "Anyone can view active coupons"
    ON coupons FOR SELECT
    USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- Admin 관리
CREATE POLICY "Admins can manage coupons"
    ON coupons FOR ALL
    USING (is_admin());

-- ========== ANNOUNCEMENTS 정책 ==========
-- 활성 공지 조회 (익명 포함)
CREATE POLICY "Anyone can view active announcements"
    ON announcements FOR SELECT
    USING (is_active = TRUE OR is_admin());

-- Admin 관리
CREATE POLICY "Admins can manage announcements"
    ON announcements FOR ALL
    USING (is_admin());

-- ========== API_LOGS 정책 (Admin Only) ==========
CREATE POLICY "Admins can view api logs"
    ON api_logs FOR SELECT
    USING (is_admin());

CREATE POLICY "System can insert api logs"
    ON api_logs FOR INSERT
    WITH CHECK (TRUE);

