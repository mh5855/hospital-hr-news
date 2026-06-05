import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const [totalRes, urgentRes, importantRes, newRes, logRes] = await Promise.all([
    supabase.from('news_items').select('*', { count: 'exact', head: true }),
    supabase
      .from('news_items')
      .select('*', { count: 'exact', head: true })
      .eq('priority', 'urgent'),
    supabase
      .from('news_items')
      .select('*', { count: 'exact', head: true })
      .eq('priority', 'important'),
    supabase.from('news_items').select('*', { count: 'exact', head: true }).eq('is_new', true),
    supabase
      .from('collection_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  return NextResponse.json({
    total: totalRes.count ?? 0,
    urgent: urgentRes.count ?? 0,
    important: importantRes.count ?? 0,
    new_today: newRes.count ?? 0,
    last_collected: logRes.data?.completed_at ?? null,
    last_status: logRes.data?.status ?? null,
  })
}
