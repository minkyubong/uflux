-- ============================================
-- Sample Services Data
-- 테스트용 샘플 서비스 데이터
-- ============================================

-- Instagram 서비스 (category_id는 카테고리 테이블에서 가져옴)
INSERT INTO services (
  category_id,
  name,
  description,
  price,
  rate,
  min_quantity,
  max_quantity,
  average_time,
  quality,
  is_active,
  is_featured,
  sort_order
)
SELECT
  c.id,
  '인스타그램 팔로워 [한국인/실제]',
  '실제 한국인 계정으로 구성된 고품질 팔로워. 자연스러운 증가와 유지율 보장.',
  15,
  10,
  100,
  50000,
  '1-6시간',
  'premium',
  true,
  true,
  1
FROM categories c WHERE c.slug = 'instagram'
ON CONFLICT DO NOTHING;

INSERT INTO services (
  category_id,
  name,
  description,
  price,
  rate,
  min_quantity,
  max_quantity,
  average_time,
  quality,
  is_active,
  is_featured,
  sort_order
)
SELECT
  c.id,
  '인스타그램 좋아요 [한국인/고품질]',
  '실제 한국 계정에서 진행되는 고품질 좋아요. 빠른 시작.',
  8,
  5,
  50,
  10000,
  '0-1시간',
  'high_quality',
  true,
  true,
  2
FROM categories c WHERE c.slug = 'instagram'
ON CONFLICT DO NOTHING;

INSERT INTO services (
  category_id,
  name,
  description,
  price,
  rate,
  min_quantity,
  max_quantity,
  average_time,
  quality,
  is_active,
  is_featured,
  sort_order
)
SELECT
  c.id,
  '인스타그램 릴스 조회수',
  '릴스 영상 조회수 증가. 노출 알고리즘 최적화.',
  5,
  3,
  500,
  100000,
  '0-2시간',
  'high_quality',
  true,
  false,
  3
FROM categories c WHERE c.slug = 'instagram'
ON CONFLICT DO NOTHING;

-- YouTube 서비스
INSERT INTO services (
  category_id,
  name,
  description,
  price,
  rate,
  min_quantity,
  max_quantity,
  average_time,
  quality,
  is_active,
  is_featured,
  sort_order
)
SELECT
  c.id,
  '유튜브 조회수 [실제/글로벌]',
  '실제 시청으로 인정되는 고품질 조회수. 수익 창출 채널 가능.',
  12,
  8,
  1000,
  1000000,
  '1-24시간',
  'premium',
  true,
  true,
  1
FROM categories c WHERE c.slug = 'youtube'
ON CONFLICT DO NOTHING;

INSERT INTO services (
  category_id,
  name,
  description,
  price,
  rate,
  min_quantity,
  max_quantity,
  average_time,
  quality,
  is_active,
  is_featured,
  sort_order
)
SELECT
  c.id,
  '유튜브 구독자 [한국인/프리미엄]',
  '실제 한국인 구독자. 높은 유지율과 자연스러운 증가.',
  30,
  20,
  100,
  10000,
  '1-7일',
  'premium',
  true,
  true,
  2
FROM categories c WHERE c.slug = 'youtube'
ON CONFLICT DO NOTHING;

INSERT INTO services (
  category_id,
  name,
  description,
  price,
  rate,
  min_quantity,
  max_quantity,
  average_time,
  quality,
  is_active,
  is_featured,
  sort_order
)
SELECT
  c.id,
  '유튜브 좋아요',
  '영상 좋아요 증가. 추천 알고리즘 활성화.',
  10,
  6,
  50,
  50000,
  '0-6시간',
  'high_quality',
  true,
  false,
  3
FROM categories c WHERE c.slug = 'youtube'
ON CONFLICT DO NOTHING;

-- TikTok 서비스
INSERT INTO services (
  category_id,
  name,
  description,
  price,
  rate,
  min_quantity,
  max_quantity,
  average_time,
  quality,
  is_active,
  is_featured,
  sort_order
)
SELECT
  c.id,
  '틱톡 팔로워 [글로벌/실제]',
  '실제 활성 계정 팔로워. FYP 노출 최적화.',
  12,
  8,
  100,
  100000,
  '0-12시간',
  'high_quality',
  true,
  true,
  1
FROM categories c WHERE c.slug = 'tiktok'
ON CONFLICT DO NOTHING;

INSERT INTO services (
  category_id,
  name,
  description,
  price,
  rate,
  min_quantity,
  max_quantity,
  average_time,
  quality,
  is_active,
  is_featured,
  sort_order
)
SELECT
  c.id,
  '틱톡 조회수 [실제 시청]',
  '실제 시청으로 인정되는 조회수. 바이럴 효과.',
  3,
  2,
  1000,
  10000000,
  '0-1시간',
  'high_quality',
  true,
  true,
  2
FROM categories c WHERE c.slug = 'tiktok'
ON CONFLICT DO NOTHING;

INSERT INTO services (
  category_id,
  name,
  description,
  price,
  rate,
  min_quantity,
  max_quantity,
  average_time,
  quality,
  is_active,
  is_featured,
  sort_order
)
SELECT
  c.id,
  '틱톡 좋아요',
  '빠른 좋아요 증가. 댓글/공유 옵션 추가 가능.',
  5,
  3,
  100,
  500000,
  '0-2시간',
  'high_quality',
  true,
  false,
  3
FROM categories c WHERE c.slug = 'tiktok'
ON CONFLICT DO NOTHING;

-- Twitter/X 서비스
INSERT INTO services (
  category_id,
  name,
  description,
  price,
  rate,
  min_quantity,
  max_quantity,
  average_time,
  quality,
  is_active,
  is_featured,
  sort_order
)
SELECT
  c.id,
  'X(트위터) 팔로워 [글로벌]',
  '실제 계정 팔로워. 높은 유지율.',
  20,
  15,
  100,
  50000,
  '1-24시간',
  'high_quality',
  true,
  true,
  1
FROM categories c WHERE c.slug = 'twitter'
ON CONFLICT DO NOTHING;

INSERT INTO services (
  category_id,
  name,
  description,
  price,
  rate,
  min_quantity,
  max_quantity,
  average_time,
  quality,
  is_active,
  is_featured,
  sort_order
)
SELECT
  c.id,
  'X(트위터) 리트윗',
  '게시물 리트윗 증가. 바이럴 확산.',
  15,
  10,
  50,
  10000,
  '0-6시간',
  'high_quality',
  true,
  false,
  2
FROM categories c WHERE c.slug = 'twitter'
ON CONFLICT DO NOTHING;

