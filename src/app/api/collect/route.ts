import { NextRequest, NextResponse } from 'next/server'
import { collectNews } from '@/lib/agent'
import { createServiceClient } from '@/lib/supabase'

export const maxDuration = 300

async function runCollect(triggerType: 'manual' | 'cron' | 'api') {
  const db = createServiceClient()

  const { data: log, error: logError } = await db
    .from('collection_logs')
    .insert({ trigger_type: triggerType, status: 'running' })
    .select()
    .single()

  if (logError) throw new Error('Failed to create log')

  try {
    const { items, errors } = await collectNews()
    let collected = 0
    let skipped = 0

    for (const item of items) {
      if (item.source_url) {
        // URL 있으면 upsert (중복 방지)
        const { error } = await db.from('news_items').upsert(
          { ...item, is_new: true, is_summarized: true, source_status: 'ok' },
          { onConflict: 'source_url', ignoreDuplicates: true }
        )
        if (error) skipped++
        else collected++
      } else {
        // URL 없으면 제목 중복 체크 후 insert
        const { data: existing } = await db
          .from('news_items')
          .select('id')
          .eq('title', item.title)
          .single()
        if (existing) { skipped++; continue }
        const { error } = await db
          .from('news_items')
          .insert({ ...item, is_new: true, is_summarized: true, source_status: 'ok' })
        if (error) skipped++
        else collected++
      }
    }

    // 24시간 이전 뉴스 is_new = false
    await db
      .from('news_items')
      .update({ is_new: false })
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    await db
      .from('collection_logs')
      .update({
        completed_at: new Date().toISOString(),
        items_collected: collected,
        items_skipped: skipped,
        status: 'completed',
        error_message: errors.length > 0 ? errors.join('; ') : null,
      })
      .eq('id', log.id)

    return { success: true, collected, skipped, errors }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db
      .from('collection_logs')
      .update({ completed_at: new Date().toISOString(), status: 'failed', error_message: message })
      .eq('id', log.id)
    throw err
  }
}

// Vercel Cron 자동 수집 (매일 오전 8시)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runCollect('cron')
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

// 수동 트리거
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isInternal = req.headers.get('x-internal') === 'true'

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !isInternal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runCollect('manual')
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
