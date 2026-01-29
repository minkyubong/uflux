-- ============================================
-- Phase 2: Performance Tuning - Index Optimization
-- Author: Universe #1 Architect
-- Date: 2026-01-18
-- Purpose: Handle 10,000+ orders/minute without breaking a sweat
-- ============================================

-- ============================================
-- 1. Cron Job 성능 최적화 (가장 중요)
-- 'pending' 상태이면서 오래된 순서대로 가져올 때 Full Scan 방지
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_status_created
ON orders(status, created_at);

-- Partial index for pending orders (더 효율적)
CREATE INDEX IF NOT EXISTS idx_orders_pending_only
ON orders(created_at)
WHERE status = 'pending';

-- Partial index for processing orders
CREATE INDEX IF NOT EXISTS idx_orders_processing_only
ON orders(created_at)
WHERE status = 'processing';

-- ============================================
-- 2. 서비스 조회 및 필터링 속도 향상
-- ============================================
-- 카테고리별 조회 및 활성 상태 체크용
CREATE INDEX IF NOT EXISTS idx_services_category_active
ON services(category_id, is_active);

-- 도매처 서비스 ID 매핑 조회용 (유니크 인덱스로 데이터 무결성까지 확보)
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_provider_mapping
ON services(provider_id, provider_service_id)
WHERE provider_id IS NOT NULL AND provider_service_id IS NOT NULL;

-- Featured services 빠른 조회
CREATE INDEX IF NOT EXISTS idx_services_featured
ON services(is_featured, sort_order)
WHERE is_active = true;

-- ============================================
-- 3. 유저별 주문/입금 내역 조회 최적화 (대시보드 로딩 속도)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_user_created
ON orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deposits_user_created
ON deposits(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_created
ON transactions(user_id, created_at DESC);

-- ============================================
-- 4. 관리자용 검색 최적화 (주문번호, 입금자명)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_order_number
ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_deposits_depositor_name
ON deposits(depositor_name);

-- Provider order ID lookup (상태 동기화 시 사용)
CREATE INDEX IF NOT EXISTS idx_orders_provider_order_id
ON orders(provider_order_id)
WHERE provider_order_id IS NOT NULL;

-- ============================================
-- 5. 프로필 조회 최적화
-- ============================================
-- Admin users 빠른 조회
CREATE INDEX IF NOT EXISTS idx_profiles_admin
ON profiles(is_admin)
WHERE is_admin = true;

-- ============================================
-- 6. API 로그 정리용 인덱스 (오래된 로그 삭제 시)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_api_logs_created
ON api_logs(created_at);

-- ============================================
-- 7. 카테고리 정렬 최적화
-- ============================================
CREATE INDEX IF NOT EXISTS idx_categories_sort
ON categories(sort_order, is_active);

-- ============================================
-- Performance Tuning Complete
-- Expected improvement: 10x ~ 100x faster queries
-- ============================================

