import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') || ''

  if (q.trim().length < 2) {
    return NextResponse.json({ items: [] })
  }

  const { data, error } = await supabase
    .from('law_provisions')
    .select('*')
    .or(
      `article_title.ilike.%${q}%,content.ilike.%${q}%,summary.ilike.%${q}%,tags::text.ilike.%${q}%,law_name.ilike.%${q}%`
    )
    .order('law_name')
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}
