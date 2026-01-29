// ============================================
// 무료 체험 API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 무료 체험 서비스 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('available_free_trials')
      .select('*');

    if (error) {
      console.error('Fetch free trials error:', error);
      return NextResponse.json(
        { success: false, error: '무료 체험 서비스를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Free trial API error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 무료 체험 신청
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
    const { service_id, link } = body;

    // 유효성 검사
    if (!service_id || !link) {
      return NextResponse.json(
        { success: false, error: '서비스 ID와 링크가 필요합니다.' },
        { status: 400 }
      );
    }

    // URL 유효성 검사
    try {
      new URL(link);
    } catch {
      return NextResponse.json(
        { success: false, error: '유효한 URL을 입력해주세요.' },
        { status: 400 }
      );
    }

    // IP 주소 가져오기
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || '';

    // 체험 가능 여부 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: availability, error: availError } = await (supabase.rpc as any)(
      'check_trial_availability',
      { p_user_id: user.id, p_service_id: service_id }
    );

    if (availError) {
      console.error('Check availability error:', availError);
      return NextResponse.json(
        { success: false, error: '체험 가능 여부를 확인할 수 없습니다.' },
        { status: 500 }
      );
    }

    if (!availability?.available) {
      return NextResponse.json(
        { success: false, error: availability?.message || '무료 체험을 사용할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 무료 체험 신청
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: trialId, error: trialError } = await (supabase.rpc as any)(
      'request_free_trial',
      {
        p_user_id: user.id,
        p_service_id: service_id,
        p_link: link,
        p_ip_address: ip,
        p_user_agent: userAgent,
      }
    );

    if (trialError) {
      console.error('Request trial error:', trialError);
      return NextResponse.json(
        { success: false, error: trialError.message || '체험 신청 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        trial_id: trialId,
        quantity: availability.quantity,
        message: '무료 체험이 신청되었습니다! 곧 처리가 시작됩니다.',
      },
    });
  } catch (error) {
    console.error('Free trial request error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

