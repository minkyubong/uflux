// ============================================
// 서비스 대량 가져오기 API
// 선택한 서비스를 admin_products로 가져오기
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// USD to KRW 환율 (실제로는 API에서 가져오는 것이 좋음)
const USD_TO_KRW = 1400;

interface ImportRequest {
  service_ids: string[];
  settings: {
    [platform: string]: {
      category_id: string;
      category_name?: string; // 새 카테고리 생성 시
      margin_type: 'percent' | 'fixed';
      margin_value: number;
      name_prefix?: string;
      name_suffix?: string;
      auto_translate?: boolean;
    };
  };
}

// 간단한 영->한 번역 매핑
const TRANSLATE_MAP: Record<string, string> = {
  'followers': '팔로워',
  'follower': '팔로워',
  'likes': '좋아요',
  'like': '좋아요',
  'views': '조회수',
  'view': '조회수',
  'comments': '댓글',
  'comment': '댓글',
  'shares': '공유',
  'share': '공유',
  'subscribers': '구독자',
  'subscriber': '구독자',
  'saves': '저장',
  'save': '저장',
  'members': '멤버',
  'member': '멤버',
  'korean': '한국인',
  'real': '리얼',
  'instant': '즉시',
  'fast': '빠른',
  'slow': '느린',
  'hq': '고품질',
  'high quality': '고품질',
  'premium': '프리미엄',
  'cheap': '저렴한',
  'instagram': '인스타',
  'youtube': '유튜브',
  'tiktok': '틱톡',
  'facebook': '페이스북',
  'twitter': '트위터',
  'telegram': '텔레그램',
};

function translateServiceName(name: string): string {
  let translated = name.toLowerCase();

  // 키워드 번역
  for (const [en, ko] of Object.entries(TRANSLATE_MAP)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, ko);
  }

  // 대괄호 내용 정리
  translated = translated.replace(/\[([^\]]+)\]/g, '[$1]');

  // 첫 글자 대문자화 제거 및 정리
  translated = translated.trim();

  return translated;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: providerId } = await params;
    const body: ImportRequest = await request.json();
    const { service_ids, settings } = body;

    if (!service_ids || service_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '가져올 서비스를 선택해주세요' },
        { status: 400 }
      );
    }

    // 1. 선택된 서비스 조회
    const { data: services, error: servicesError } = await supabase
      .from('provider_services_cache')
      .select('*')
      .eq('provider_id', providerId)
      .in('service_id', service_ids);

    if (servicesError || !services) {
      return NextResponse.json(
        { success: false, error: '서비스를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 2. 새로 생성해야 할 카테고리 확인 및 생성
    const newCategories: Record<string, string> = {};

    for (const [platform, platformSettings] of Object.entries(settings)) {
      if (platformSettings.category_name && !platformSettings.category_id) {
        // 새 카테고리 생성
        const slug = platformSettings.category_name
          .toLowerCase()
          .replace(/[가-힣]/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') || `category-${Date.now()}`;

        const { data: newCat, error: catError } = await supabase
          .from('admin_categories')
          .insert({
            platform,
            name: platformSettings.category_name,
            slug,
            is_active: true,
            sort_order: 0,
          })
          .select()
          .single();

        if (newCat) {
          newCategories[platform] = newCat.id;
        }
      }
    }

    // 3. 상품 생성
    const createdProducts: any[] = [];
    const errors: string[] = [];

    for (const service of services) {
      const platform = service.detected_platform || 'other';
      const platformSettings = settings[platform];

      if (!platformSettings) {
        errors.push(`${service.name}: 플랫폼 설정 없음`);
        continue;
      }

      // 카테고리 ID 결정
      const categoryId = platformSettings.category_id || newCategories[platform];
      if (!categoryId) {
        errors.push(`${service.name}: 카테고리 없음`);
        continue;
      }

      // 가격 계산 (USD -> KRW + 마진)
      let priceKrw = service.rate * USD_TO_KRW;
      if (platformSettings.margin_type === 'percent') {
        priceKrw = priceKrw * (1 + platformSettings.margin_value / 100);
      } else {
        priceKrw = priceKrw + platformSettings.margin_value;
      }
      // 100원 단위로 반올림
      priceKrw = Math.ceil(priceKrw / 100) * 100;

      // 상품명 생성
      let productName = service.name;
      if (platformSettings.auto_translate) {
        productName = translateServiceName(productName);
      }
      if (platformSettings.name_prefix) {
        productName = `${platformSettings.name_prefix} ${productName}`;
      }
      if (platformSettings.name_suffix) {
        productName = `${productName} ${platformSettings.name_suffix}`;
      }

      // 상품 생성
      const { data: product, error: productError } = await supabase
        .from('admin_products')
        .insert({
          category_id: categoryId,
          name: productName,
          description: service.description,
          price_per_1000: priceKrw,
          min_quantity: service.min_quantity,
          max_quantity: service.max_quantity,
          primary_provider_id: providerId,
          primary_service_id: service.service_id,
          input_type: 'link',
          refill_days: service.refill ? 30 : 0,
          is_active: true,
          is_recommended: false,
          sort_order: 0,
        })
        .select()
        .single();

      if (productError) {
        errors.push(`${service.name}: ${productError.message}`);
      } else if (product) {
        createdProducts.push(product);

        // 서비스 캐시 업데이트 (imported 상태)
        await supabase
          .from('provider_services_cache')
          .update({
            is_imported: true,
            imported_product_id: product.id,
          })
          .eq('id', service.id);
      }
    }

    return NextResponse.json({
      success: true,
      created: createdProducts.length,
      errors: errors.length > 0 ? errors : undefined,
      new_categories: Object.keys(newCategories).length,
      message: `${createdProducts.length}개 상품이 생성되었습니다`,
    });
  } catch (error: any) {
    console.error('Import services error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
