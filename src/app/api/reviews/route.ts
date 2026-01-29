// ============================================
// 리뷰 API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 리뷰 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const serviceId = searchParams.get('service_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('reviews')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          tier
        ),
        services:service_id (
          id,
          name
        )
      `)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Fetch reviews error:', error);
      return NextResponse.json(
        { success: false, error: '리뷰를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 서비스 평점 통계 조회 (특정 서비스인 경우)
    let stats = null;
    if (serviceId) {
      const { data: ratingData } = await supabase
        .from('service_ratings')
        .select('*')
        .eq('service_id', serviceId)
        .single();

      stats = ratingData;
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews: data || [],
        stats,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 리뷰 작성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { order_id, rating, content } = body;

    // 유효성 검사
    if (!order_id) {
      return NextResponse.json(
        { success: false, error: '주문 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: '별점은 1-5 사이여야 합니다.' },
        { status: 400 }
      );
    }

    // 리뷰 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reviewId, error: reviewError } = await (supabase.rpc as any)(
      'create_review',
      {
        p_order_id: order_id,
        p_rating: rating,
        p_content: content || null,
      }
    );

    if (reviewError) {
      console.error('Create review error:', reviewError);
      return NextResponse.json(
        { success: false, error: reviewError.message || '리뷰 작성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        review_id: reviewId,
        message: '리뷰가 작성되었습니다. 감사합니다!',
      },
    });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

