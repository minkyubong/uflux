-- ============================================
-- Phase 6: Seed Products (Merchandising)
-- Author: Universe #1 Architect
-- Date: 2026-01-18
-- Purpose: Initial product catalog for store opening
-- Note: YTResellers provider already configured with real API
-- ============================================

-- ============================================
-- 1. 도매처(Provider) - YTResellers 이미 등록됨
-- Provider ID: 493b3f2e-d90a-41af-9df0-ae7453cc238e
-- API: https://ytresellers.com/api/v2
-- ============================================

-- 백업용 JustAnotherPanel 등록 (비활성 상태)
INSERT INTO providers (name, api_url, api_key, is_active, priority)
VALUES (
  'JustAnotherPanel',
  'https://justanotherpanel.com/api/v2',
  'YOUR_JAP_API_KEY_HERE',
  false,  -- 비활성 (YTResellers 우선 사용)
  0       -- 낮은 우선순위
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. 카테고리 보강 (이미 존재하는 것은 무시)
-- ============================================
INSERT INTO categories (name, slug, sort_order, is_active) VALUES
('추천 상품', 'featured', 0, true),
('Instagram', 'instagram', 1, true),
('YouTube', 'youtube', 2, true),
('TikTok', 'tiktok', 3, true),
('Twitter/X', 'twitter', 4, true),
('Facebook', 'facebook', 5, true),
('Telegram', 'telegram', 6, true)
ON CONFLICT (slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- ============================================
-- 3. 서비스 Featured 플래그 업데이트
-- 인기 상품을 추천 상품으로 표시
-- ============================================
UPDATE services SET is_featured = true, sort_order = 1
WHERE name LIKE '%유튜브 조회수%';

UPDATE services SET is_featured = true, sort_order = 2
WHERE name LIKE '%인스타그램 팔로워%';

UPDATE services SET is_featured = true, sort_order = 3
WHERE name LIKE '%틱톡 조회수%';

UPDATE services SET is_featured = true, sort_order = 4
WHERE name LIKE '%틱톡 팔로워%';

-- ============================================
-- 4. 서비스 설명 보강 (마케팅용)
-- ============================================
UPDATE services SET description = '⚡ 즉시 시작 | 하루 최대 1,000만 | 이탈률 0% | 실제 시청 기반'
WHERE name LIKE '%틱톡 조회수%';

UPDATE services SET description = '🌍 글로벌 팔로워 | 즉시 시작 | 하루 10만 처리 | 높은 유지율'
WHERE name LIKE '%틱톡 팔로워%';

UPDATE services SET description = '❤️ 고품질 좋아요 | 최대 500만 | 빠른 처리 | 자연스러운 증가'
WHERE name LIKE '%틱톡 좋아요%';

UPDATE services SET description = '🇰🇷 한국 트래픽 | SEO 최적화 | 7-10분 시청 유지 | 검색/추천 노출'
WHERE name LIKE '%유튜브 조회수%';

UPDATE services SET description = '📈 구독자 증가 | 최대 100만 | 빠른 처리 | 채널 성장'
WHERE name LIKE '%유튜브 구독자%';

UPDATE services SET description = '👍 고품질 좋아요 | 최대 50만 | 초고속 처리 | 영상 홍보'
WHERE name LIKE '%유튜브 좋아요%';

UPDATE services SET description = '👥 HQ 팔로워 | 취소 가능 | Drop 40% | 꾸준한 성장'
WHERE name LIKE '%인스타그램 팔로워%';

UPDATE services SET description = '❤️ 고품질 좋아요 | 최대 100만 | 빠른 처리 | 게시물 홍보'
WHERE name LIKE '%인스타그램 좋아요%';

UPDATE services SET description = '👁️ 릴스/비디오 조회수 | 무제한 | 하루 100만 처리'
WHERE name LIKE '%인스타그램 릴스%';

UPDATE services SET description = '🐦 HQ 팔로워 | 최대 10만 | 빠른 처리 | 계정 성장'
WHERE name LIKE '%트위터%팔로워%';

UPDATE services SET description = '🔄 리트윗 + 노출 | 최대 100만 | 30일 보충'
WHERE name LIKE '%트위터%리트윗%';

-- ============================================
-- 5. Admin Stats 재동기화 (새 데이터 반영)
-- ============================================
UPDATE admin_stats SET
    total_users = (SELECT COUNT(*) FROM profiles),
    total_orders = (SELECT COUNT(*) FROM orders),
    total_revenue = (SELECT COALESCE(SUM(charge), 0) FROM orders WHERE status != 'canceled'),
    pending_orders = (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
    pending_deposits = (SELECT COUNT(*) FROM deposits WHERE status = 'pending'),
    updated_at = NOW()
WHERE id = 1;

-- ============================================
-- Seed Products Complete
-- Store is ready for business! 🎉
-- ============================================

