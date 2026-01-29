// ============================================
// 리뷰 도움이 됐어요 API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: 도움이 됐어요 토글
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
    const { review_id } = body;

    if (!review_id) {
      return NextResponse.json(
        { success: false, error: '리뷰 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 도움이 됐어요 토글
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: isHelpful, error } = await (supabase.rpc as any)(
      'toggle_review_helpful',
      { p_review_id: review_id }
    );

    if (error) {
      console.error('Toggle helpful error:', error);
      return NextResponse.json(
        { success: false, error: '처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        is_helpful: isHelpful,
        message: isHelpful ? '도움이 됐어요를 눌렀습니다.' : '도움이 됐어요를 취소했습니다.',
      },
    });
  } catch (error) {
    console.error('Toggle helpful error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

