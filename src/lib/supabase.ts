import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

// 브라우저/서버 공용 읽기 전용 클라이언트 (지연 초기화)
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars not configured')
    _supabase = createClient(url, key)
  }
  return _supabase
}

// 편의 프록시: import { supabase } 로 사용 가능
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient]
  },
})

// 서버 전용 쓰기 클라이언트 (service_role)
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
