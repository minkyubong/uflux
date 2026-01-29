// ============================================
// 공급자 서비스 캐시 조회 API
// GET: 캐시된 서비스 목록 조회
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: providerId } = await params;
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터
    const platform = searchParams.get('platform');
    const type = searchParams.get('type');
    const region = searchParams.get('region');
    const search = searchParams.get('search');
    const imported = searchParams.get('imported');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 쿼리 빌드
    let query = supabase
      .from('provider_services_cache')
      .select('*', { count: 'exact' })
      .eq('provider_id', providerId)
      .order('service_id', { ascending: true });

    // 필터 적용
    if (platform && platform !== 'all') {
      query = query.eq('detected_platform', platform);
    }
    if (type && type !== 'all') {
      query = query.eq('detected_type', type);
    }
    if (region && region !== 'all') {
      query = query.eq('detected_region', region);
    }
    if (imported === 'true') {
      query = query.eq('is_imported', true);
    } else if (imported === 'false') {
      query = query.eq('is_imported', false);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      services: data || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
