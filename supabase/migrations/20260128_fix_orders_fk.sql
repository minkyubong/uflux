-- ============================================
-- Migration: Fix orders.service_id foreign key
-- orders 테이블의 service_id FK 제약 제거
-- admin_products를 사용하기 위함
-- ============================================

-- 1. 기존 FK 제약 제거 (있는 경우)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_id_fkey;

-- 2. service_id 컬럼은 유지하되 FK 없이 사용
-- (admin_products.id를 저장할 수 있게 됨)

-- 확인: orders 테이블 구조
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders';

