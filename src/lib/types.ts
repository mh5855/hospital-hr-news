export type Priority = 'urgent' | 'important' | 'reference'
export type HospitalScope = 'general_hospital' | 'all' | 'reference_only'
export type SourceStatus = 'ok' | 'error'

export interface NewsItem {
  id: string
  title: string
  summary: string | null
  hr_impact: string | null
  action_checklist: string[]
  source: string | null
  source_url: string | null
  published_at: string | null
  priority: Priority
  tags: string[]
  job_type: string[]
  hospital_scope: HospitalScope
  apply_date: string | null
  cost_impact: boolean
  action_required: boolean
  is_new: boolean
  is_summarized: boolean
  source_status: SourceStatus
  error_reason: string | null
  created_at: string
  updated_at: string
}

export interface CollectionLog {
  id: string
  started_at: string
  completed_at: string | null
  items_collected: number
  items_skipped: number
  status: 'running' | 'completed' | 'failed'
  error_message: string | null
  trigger_type: 'manual' | 'cron' | 'api'
}

export interface NewsFilters {
  priority?: Priority
  hospital_scope?: HospitalScope
  is_new?: boolean
  tags?: string[]
  search?: string
  date_from?: string
  date_to?: string
}

export interface CollectedNewsItem {
  title: string
  summary: string
  hr_impact: string
  action_checklist: string[]
  source: string
  source_url: string
  published_at: string
  priority: Priority
  tags: string[]
  job_type: string[]
  hospital_scope: HospitalScope
  apply_date: string | null
  cost_impact: boolean
  action_required: boolean
}
