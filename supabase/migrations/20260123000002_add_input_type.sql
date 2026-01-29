-- ============================================
-- 서비스 입력 타입 및 서브카테고리 추가
-- ============================================

-- 입력 타입 컬럼 추가 (TEXT로 유연하게)
ALTER TABLE services ADD COLUMN IF NOT EXISTS input_type TEXT DEFAULT 'link';

-- 서브카테고리 컬럼 추가
ALTER TABLE services ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_services_input_type ON services(input_type);
CREATE INDEX IF NOT EXISTS idx_services_subcategory ON services(subcategory);

-- 입력 타입 설명:
-- link: 링크만 필요 (기본)
-- link_comments: 링크 + 커스텀 댓글
-- link_usernames: 링크 + 사용자 목록
-- link_hashtags: 링크 + 해시태그
-- link_keywords: 링크 + 키워드 (SEO)
-- link_usernames_hashtags: 링크 + 사용자 + 해시태그
-- link_answer: 링크 + 투표 답변

