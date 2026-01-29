-- ============================================
-- YTReseller Korea/Global Services Import
-- Generated: 2026-01-22T11:32:22.961Z
-- Total Services: 76
-- ============================================

-- ============================================
-- 1. Add Missing Categories
-- ============================================
INSERT INTO categories (name, slug, sort_order, is_active) VALUES
('Twitch', 'twitch', 7, true),
('CoinMarketCap', 'coinmarketcap', 8, true),
('기타 플랫폼', 'other', 99, true)
ON CONFLICT (slug) DO UPDATE SET
  is_active = true;

-- ============================================
-- 2. Insert Services
-- ============================================

-- TWITTER Services (5)
INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'twitter' LIMIT 1),
  '7892',
  'X(트위터) 팔로워 [글로벌] ♻️보충',
  'X / Twitter Followers   , 100% Global Accounts , Cancel Enable , Low Drop , 30 Days  , Instant Start , Day 200 / 400',
  'twitter',
  20010.71,
  30017,
  10,
  50000,
  true,
  true,
  true,
  30,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '7892'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'twitter' LIMIT 1),
  '7897',
  'X(트위터) 좋아요 [글로벌] ♻️보충',
  'X / Twitter Likes   , 100% Global Accounts , Cancel Enable , Low Drop , 30 Days  , Instant Start , Day 400',
  'twitter',
  10005.35,
  15009,
  20,
  10000,
  true,
  true,
  true,
  30,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '7897'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'twitter' LIMIT 1),
  '7229',
  'X(트위터) 조회수 [한국]',
  'X / Twitter Tweet Views   , Cancel Enable , Non Drop , Instant Start , Day 100M',
  'twitter',
  6.48,
  10,
  100,
  10000000,
  true,
  false,
  true,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '7229'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'twitter' LIMIT 1),
  '6637',
  'X(트위터) 노출 [한국]',
  'Twitter - Impressions , South Korea , Max 50M , Speed 50M/Day',
  'twitter',
  162.03,
  244,
  100,
  10000000,
  true,
  false,
  true,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '6637'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'twitter' LIMIT 1),
  '6651',
  'X(트위터) 조회수 [한국]',
  'Twitter - Video Views , South Korea , Max 50M , Speed 50M/Day',
  'twitter',
  6.48,
  10,
  100,
  10000000,
  true,
  false,
  true,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '6651'
);


-- FACEBOOK Services (7)
INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'facebook' LIMIT 1),
  '7813',
  '페이스북 그룹 멤버 [글로벌]',
  'Facebook Group Members  , 100% Global Accounts , Cancel Enable , Low Drop , No Refill  , Instant Start , Day 20K',
  'facebook',
  371.49,
  558,
  50,
  30000,
  true,
  false,
  true,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '7813'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'facebook' LIMIT 1),
  '7814',
  '페이스북 그룹 멤버 [글로벌] ♻️보충',
  'Facebook Group Members  , 100% Global Accounts , Cancel Enable , Low Drop , 30 Days  , Instant Start , Day 50K',
  'facebook',
  501.11,
  752,
  10,
  100000,
  true,
  true,
  true,
  30,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '7814'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'facebook' LIMIT 1),
  '7815',
  '페이스북 그룹 멤버 [글로벌] ♻️보충',
  'Facebook Group Members  , 100% Global Accounts , Cancel Enable , Low Drop , 365 Days   , Instant Start , Day 50K',
  'facebook',
  532.05,
  799,
  10,
  100000,
  true,
  true,
  true,
  30,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '7815'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'facebook' LIMIT 1),
  '6985',
  '페이스북 그룹 멤버 [글로벌]',
  'Facebook Group Members  , 100% Global Accounts , Cancel Enable , Non Drop , No Refill  , Instant Start , Day 50K',
  'facebook',
  483.44,
  726,
  10,
  100000,
  true,
  false,
  true,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '6985'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'facebook' LIMIT 1),
  '6986',
  '페이스북 그룹 멤버 [글로벌] ♻️보충',
  'Facebook Group Members  , 100% Global Accounts , Cancel Enable , Non Drop , 30 Days  , Instant Start , Day 50K',
  'facebook',
  501.11,
  752,
  10,
  100000,
  true,
  true,
  true,
  30,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '6986'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'facebook' LIMIT 1),
  '6987',
  '페이스북 그룹 멤버 [글로벌] ♻️보충',
  'Facebook Group Members  , 100% Global Accounts , Cancel Enable , Non Drop , 365 Days  , Instant Start , Day 50K',
  'facebook',
  532.93,
  800,
  10,
  100000,
  true,
  true,
  true,
  30,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '6987'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'facebook' LIMIT 1),
  '6988',
  '페이스북 그룹 멤버 [글로벌] ♻️보충',
  'Facebook Group Members  , 100% Global Accounts , Cancel Enable , Non Drop , Lifetime  , Instant Start , Day 50K',
  'facebook',
  551.20,
  827,
  10,
  100000,
  true,
  true,
  true,
  30,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '6988'
);


-- YOUTUBE Services (60)
INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '7527',
  '유튜브 조회수 [한국]',
  'YouTube SEO Views   , Source: Suggest from Similar Content Video Genarated by AI , Retention: 1-10 Minutes , No Refill  , Start: 0-15 Minutes , Day 100K',
  'youtube',
  1385.36,
  2079,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '7527'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '7246',
  '유튜브 조회수 [한국]',
  'YouTube Native Ads Views   , 100% Real Views , Drop 0% , Lifetime  , Start: 0-1 Hour , Day 2K / 5K',
  'youtube',
  4156.07,
  6235,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '7246'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '6054',
  '유튜브 댓글 [한국]',
  'YouTube - Custom Comments , Korea , Max 100K , HQ , Speed 5K/Day , Account KR have Avatar ,  30 Days Refill',
  'youtube',
  8020.49,
  12031,
  10,
  1000000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '6054'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '2692',
  '유튜브 댓글 [한국]',
  'YouTube - Custom Reply Comments , Korea , Account KR have Avatar',
  'youtube',
  19302.63,
  28954,
  5,
  10000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '2692'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '2696',
  '유튜브 댓글 [한국]',
  'YouTube - Custom Comments + Custom Reply Comments , Korea , Account KR have Avatar',
  'youtube',
  19302.63,
  28954,
  5,
  10000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '2696'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '2700',
  '유튜브 댓글 [한국]',
  'YouTube - Comments Created by AI , Korea , Auto-Generate Comments Based on Video Content , Account KR have Avatar',
  'youtube',
  9506.59,
  14260,
  5,
  10000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '2700'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '5008',
  '유튜브 댓글 [한국]',
  'YouTube - Comments Created by AI , Korea , Auto-Generate Comments Based on Video Content , Max 10K , Speed 10K/Day ,  30 Days Refill',
  'youtube',
  17499.24,
  26249,
  10,
  10000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '5008'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '5018',
  '유튜브 댓글 [한국]',
  'YouTube - Replys Created by AI , Korea , Auto-Generate Replys Based on Comment Content , Max 10K , Speed 10K/Day ,  30 Days Refill',
  'youtube',
  17499.24,
  26249,
  5,
  10000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '5018'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '5014',
  '유튜브 댓글 [한국]',
  'YouTube - Custom Comments , Korea , Max 10K , Speed 10K/Day ,  30 Days Refill',
  'youtube',
  17499.24,
  26249,
  5,
  10000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '5014'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '5022',
  '유튜브 댓글 [한국]',
  'YouTube - Custom Reply Comments , Korea , Max 10K , Speed 10K/Day ,  30 Days Refill',
  'youtube',
  17499.24,
  26249,
  5,
  10000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '5022'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '119',
  '유튜브 좋아요 [한국] ♻️보충',
  'YouTube - Likes , South Korea , Max 100K , HQ , Speed 100K/Day ,  Lifetime Refill',
  'youtube',
  1031.10,
  1547,
  20,
  100000,
  true,
  true,
  false,
  30,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '119'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4725',
  '유튜브 조회수 [한국]',
  'YouTube - Suggest Views By AI , Korea  , Auto Generate Suggest Views From Videos With Similar Content , Retention : 1-2 Minutes , Max 100K , Speed 100K/Day ,  No Refill',
  'youtube',
  1283.28,
  1925,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4725'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4726',
  '유튜브 조회수 [한국]',
  'YouTube - Suggest Views By AI , Korea  , Auto Generate Suggest Views From Videos With Similar Content , Retention : 2-5 Minutes , Max 100K , Speed 100K/Day ,  No Refill',
  'youtube',
  2114.49,
  3172,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4726'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4727',
  '유튜브 조회수 [한국]',
  'YouTube - Suggest Views By AI , Korea  , Auto Generate Suggest Views From Videos With Similar Content , Retention : 7-10 Minutes , Max 100K , Speed 100K/Day ,  No Refill',
  'youtube',
  3718.59,
  5578,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4727'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4728',
  '유튜브 조회수 [한국]',
  'YouTube - Suggest Views By AI , Korea  , Auto Generate Suggest Views From Videos With Similar Content , Retention : 12-15 Minutes , Max 100K , Speed 100K/Day ,  No Refill',
  'youtube',
  5031.03,
  7547,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4728'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4729',
  '유튜브 조회수 [한국]',
  'YouTube - Suggest Views By AI , Korea  , Auto Generate Suggest Views From Videos With Similar Content , Retention : 15-20 Minutes , Max 100K , Speed 100K/Day ,  No Refill',
  'youtube',
  7072.61,
  10609,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4729'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4849',
  '유튜브 조회수 [한국]',
  'YouTube - Suggest Views By AI , Korea , Auto Generate Suggest Views From Videos With Similar Content , Retention : 1-2 Minutes , Max 100K , Speed 100K/Day ,  No Refill',
  'youtube',
  1232.02,
  1849,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4849'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4850',
  '유튜브 조회수 [한국]',
  'YouTube - Suggest Views By AI , Korea , Auto Generate Suggest Views From Videos With Similar Content , Retention : 2-5 Minutes , Max 100K , Speed 100K/Day ,  No Refill',
  'youtube',
  2029.94,
  3045,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4850'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4851',
  '유튜브 조회수 [한국]',
  'YouTube - Suggest Views By AI , Korea , Auto Generate Suggest Views From Videos With Similar Content , Retention : 7-10 Minutes , Max 100K , Speed 100K/Day ,  No Refill',
  'youtube',
  3569.96,
  5355,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4851'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4852',
  '유튜브 조회수 [한국]',
  'YouTube - Suggest Views By AI , Korea , Auto Generate Suggest Views From Videos With Similar Content , Retention : 12-15 Minutes , Max 100K , Speed 100K/Day ,  No Refill',
  'youtube',
  4829.82,
  7245,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4852'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4853',
  '유튜브 조회수 [한국]',
  'YouTube - Suggest Views By AI , Korea , Auto Generate Suggest Views From Videos With Similar Content , Retention : 15-20 Minutes , Max 100K , Speed 100K/Day ,  No Refill',
  'youtube',
  6789.79,
  10185,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4853'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '1446',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea ,  YouTube Search / Browse Features , Retention : 1-2 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  962.46,
  1444,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '1446'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '1447',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views ,  Korea  , YouTube Suggest (Trending / Random) , Retention : 1-2 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  1283.28,
  1925,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '1447'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '1448',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Random (Suggest / Search / Browse Features) By Keywords , Retention : 1-2 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  1604.10,
  2407,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '1448'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '1449',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Search By Keywords , Retention : 1-2 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  1604.10,
  2407,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '1449'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '1450',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Random (Suggest / Search / Browse Features) By Keywords , Retention : 2-5 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  2406.15,
  3610,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '1450'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '1451',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Random (Suggest / Search / Browse Features) , Retention : 2-5 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  2406.15,
  3610,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '1451'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '1452',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Search / Browse Features , Retention : 7-10 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  3208.19,
  4813,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '1452'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '1453',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Random (Suggest / Search / Browse Features) By Keywords , Retention : 7-10 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  3208.19,
  4813,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '1453'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '1454',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Random (Suggest / Search / Browse Features) , Retention : 7-10 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  3208.19,
  4813,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '1454'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '1455',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Suggest (Trending / Random) , Retention : 7-10 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  3208.19,
  4813,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '1455'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4906',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Search / Browse Features , Retention : 1-2 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  924.01,
  1387,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4906'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4907',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Search / Browse Features , Retention : 2-5 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  1570.81,
  2357,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4907'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4908',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Search / Browse Features , Retention : 7-10 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  3079.90,
  4620,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4908'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4909',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Search / Browse Features , Retention : 12-15 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  4311.91,
  6468,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4909'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4910',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Search / Browse Features , Retention : 15-20 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  6467.80,
  9702,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4910'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '5033',
  '유튜브 서비스',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  'youtube',
  1473000.00,
  2209500,
  1,
  1,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '5033'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4911',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Suggest (Trending / Random) , Retention : 1-2 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  1232.02,
  1849,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4911'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4912',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Suggest (Trending / Random) , Retention : 2-5 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  1971.17,
  2957,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4912'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4913',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Suggest (Trending / Random) , Retention : 7-10 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  3079.90,
  4620,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4913'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4914',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Suggest (Trending / Random) , Retention : 12-15 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  4311.91,
  6468,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4914'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4915',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Suggest (Trending / Random) , Retention : 15-20 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  6467.80,
  9702,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4915'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '5034',
  '유튜브 서비스',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  'youtube',
  1473000.00,
  2209500,
  1,
  1,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '5034'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4916',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Search By Keywords , Retention : 1-2 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  1540.02,
  2311,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4916'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4917',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Search By Keywords , Retention : 2-5 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  2617.96,
  3927,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4917'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4918',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Search By Keywords , Retention : 7-10 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  3849.83,
  5775,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4918'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4919',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Search By Keywords , Retention : 12-15 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  5389.85,
  8085,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4919'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4920',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Search By Keywords , Retention : 15-20 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  7545.74,
  11319,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4920'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '5035',
  '유튜브 서비스',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  'youtube',
  1473000.00,
  2209500,
  1,
  1,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '5035'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4921',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Random (Suggest / Search / Browse Features) By Keywords , Retention : 1-2 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  1540.02,
  2311,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4921'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4922',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Random (Suggest / Search / Browse Features) By Keywords , Retention : 2-5 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  2309.96,
  3465,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4922'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4923',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Random (Suggest / Search / Browse Features) By Keywords , Retention : 7-10 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  3079.90,
  4620,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4923'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4924',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Random (Suggest / Search / Browse Features) By Keywords , Retention : 12-15 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  4311.91,
  6468,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4924'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4925',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Random (Suggest / Search / Browse Features) By Keywords , Retention : 15-20 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  6467.80,
  9702,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4925'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '5041',
  '유튜브 서비스',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  'youtube',
  1473000.00,
  2209500,
  1,
  1,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '5041'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4926',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Random (Suggest / Search / Browse Features) , Retention : 2-5 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  2309.96,
  3465,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4926'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '4927',
  '유튜브 조회수 [한국]',
  'YouTube - Video Views , Korea , YouTube Random (Suggest / Search / Browse Features) , Retention : 7-10 Minutes , Max 100K , Speed 10K/Day ,  No Refill',
  'youtube',
  3079.90,
  4620,
  1000,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '4927'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '1843',
  '유튜브 조회수 [한국]',
  'YouTube - Video / Shorts Views , South Korea , RAV-GS / Real &amp; Active Views , Max 100K , Speed 500/Day ,  90 Days Refill',
  'youtube',
  9802.82,
  14705,
  500,
  100000,
  true,
  false,
  true,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '1843'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '1938',
  '유튜브 조회수 [한국]',
  'YouTube - Video / Shorts Views , South Korea , RAV / Real &amp; Active Views , Max 100K , Speed 500/Day ,  90 Days Refill',
  'youtube',
  9981.05,
  14972,
  500,
  100000,
  true,
  false,
  true,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '1938'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'youtube' LIMIT 1),
  '2034',
  '유튜브 조회수 [한국]',
  'YouTube - Video / Shorts Views , South Korea , RAV-MTS / High Monetization Views , Max 100K , Speed 500/Day ,  90 Days Refill',
  'youtube',
  14258.64,
  21388,
  500,
  100000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '2034'
);


-- OTHER Services (1)
INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'other' LIMIT 1),
  '5735',
  '기타 박수 [글로벌]',
  'Medium - Claps , Global , Max 2K , HQ , Speed 2K/Day ,  No Refill',
  'other',
  4234.88,
  6353,
  500,
  2000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '5735'
);


-- INSTAGRAM Services (2)
INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'instagram' LIMIT 1),
  '5275',
  '인스타그램 좋아요 [한국]',
  'Instagram - Likes , Korea , Max 200K , HQ - Real , Speed 1K/10 Minutes ,  No Refill',
  'instagram',
  1314.65,
  1972,
  20,
  200000,
  true,
  false,
  true,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '5275'
);

INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'instagram' LIMIT 1),
  '5276',
  '인스타그램 좋아요 [한국] ♻️보충',
  'Instagram - Likes , Korea , Max 1M , HQ - Real , Speed 1K/10 Minutes ,  365 Days Refill',
  'instagram',
  1546.65,
  2320,
  20,
  1000000,
  true,
  true,
  true,
  30,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '5276'
);


-- TIKTOK Services (1)
INSERT INTO services (
  provider_id, category_id, provider_service_id, name, description, platform,
  rate, price, min_quantity, max_quantity, is_active, is_refill, is_cancel, refill_days, sort_order
) SELECT
  '493b3f2e-d90a-41af-9df0-ae7453cc238e',
  (SELECT id FROM categories WHERE slug = 'tiktok' LIMIT 1),
  '2317',
  '틱톡 댓글 [한국]',
  'TikTok - Custom Live Chat Comments ,  South Korea  ,',
  'tiktok',
  1620.30,
  2431,
  5,
  5000,
  true,
  false,
  false,
  0,
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services)
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE provider_service_id = '2317'
);


-- ============================================
-- 3. Update Featured Services
-- ============================================
UPDATE services SET is_featured = true, sort_order = 1
WHERE name LIKE '%유튜브%조회수%한국%';

UPDATE services SET is_featured = true, sort_order = 2
WHERE name LIKE '%인스타그램%좋아요%한국%';

UPDATE services SET is_featured = true, sort_order = 3
WHERE name LIKE '%트위터%한국%';

-- ============================================
-- Import Complete
-- ============================================

