import { NextRequest, NextResponse } from 'next/server'
import { seedLawProvisions } from '@/lib/lawAgent'
import { createServiceClient } from '@/lib/supabase'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const isInternal = req.headers.get('x-internal') === 'true'
  if (!isInternal) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await seedLawProvisions() as { inserted: number; errors: string[]; _items: object[] }

  if (result._items.length === 0) {
    return NextResponse.json({ success: false, errors: result.errors })
  }

  const db = createServiceClient()

  // 기존 데이터 초기화 후 재삽입
  await db.from('law_provisions').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { error } = await db.from('law_provisions').insert(result._items)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    inserted: result._items.length,
    errors: result.errors,
  })
}
