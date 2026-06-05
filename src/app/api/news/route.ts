import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const priority = searchParams.get('priority')
  const hospitalScope = searchParams.get('hospital_scope')
  const isNew = searchParams.get('is_new')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('news_items')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (priority) query = query.eq('priority', priority)
  if (hospitalScope) query = query.eq('hospital_scope', hospitalScope)
  if (isNew === 'true') query = query.eq('is_new', true)
  if (search) {
    // 제목·요약·HR영향·태그(JSONB→text) 전체 검색
    query = query.or(
      `title.ilike.%${search}%,summary.ilike.%${search}%,hr_impact.ilike.%${search}%,tags::text.ilike.%${search}%`
    )
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    items: data,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}
