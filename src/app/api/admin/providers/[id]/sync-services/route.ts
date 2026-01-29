// ============================================
// API 공급자 서비스 동기화 API
// 공급자 API에서 서비스 목록을 가져와 캐시에 저장
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: providerId } = await params;

    // 1. 공급자 정보 조회
    const { data: provider, error: providerError } = await supabase
      .from('api_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { success: false, error: '공급자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 2. 공급자 API에서 서비스 목록 가져오기
    const formData = new URLSearchParams();
    formData.append('key', provider.api_key);
    formData.append('action', 'services');

    const response = await fetch(provider.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const services = await response.json();

    if (!Array.isArray(services)) {
      return NextResponse.json({
        success: false,
        error: services.error || '서비스 목록을 가져올 수 없습니다',
      });
    }

    // 3. 기존 캐시된 서비스의 imported 상태 보존을 위해 먼저 조회
    const { data: existingServices } = await supabase
      .from('provider_services_cache')
      .select('service_id, is_imported, imported_product_id')
      .eq('provider_id', providerId);

    const existingMap = new Map(
      existingServices?.map((s) => [s.service_id, s]) || []
    );

    // 4. 서비스 데이터 변환 및 upsert
    const servicesToUpsert = services.map((service: any) => {
      const existing = existingMap.get(String(service.service));
      return {
        provider_id: providerId,
        service_id: String(service.service),
        name: service.name || '',
        category: service.category || null,
        rate: parseFloat(service.rate) || 0,
        min_quantity: parseInt(service.min) || 10,
        max_quantity: parseInt(service.max) || 100000,
        description: service.desc || service.description || null,
        refill: service.refill === true || service.refill === 'true',
        cancel: service.cancel === true || service.cancel === 'true',
        // 기존 imported 상태 보존
        is_imported: existing?.is_imported || false,
        imported_product_id: existing?.imported_product_id || null,
        last_synced_at: new Date().toISOString(),
      };
    });

    // 5. 배치로 upsert (한번에 100개씩)
    const batchSize = 100;
    let totalUpserted = 0;

    for (let i = 0; i < servicesToUpsert.length; i += batchSize) {
      const batch = servicesToUpsert.slice(i, i + batchSize);
      const { error: upsertError } = await supabase
        .from('provider_services_cache')
        .upsert(batch, {
          onConflict: 'provider_id,service_id',
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
      } else {
        totalUpserted += batch.length;
      }
    }

    // 6. 공급자의 마지막 동기화 시간 업데이트
    await supabase
      .from('api_providers')
      .update({ last_balance_check: new Date().toISOString() })
      .eq('id', providerId);

    return NextResponse.json({
      success: true,
      total_services: services.length,
      synced: totalUpserted,
      message: `${totalUpserted}개 서비스가 동기화되었습니다`,
    });
  } catch (error: any) {
    console.error('Sync services error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
