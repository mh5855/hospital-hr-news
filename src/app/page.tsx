'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { NewsItem } from '@/lib/types'
import { NewsCard } from '@/components/NewsCard'
import { StatsBar } from '@/components/StatsBar'
import { FilterBar } from '@/components/FilterBar'
import { CollectButton } from '@/components/CollectButton'
import { timeAgo } from '@/lib/utils'

interface Stats {
  total: number
  urgent: number
  important: number
  new_today: number
  last_collected: string | null
  last_status: string | null
}

interface NewsResponse {
  items: NewsItem[]
  total: number
  page: number
  totalPages: number
}

// 단어가 기사의 어느 필드에든 포함되는지 검사
function matchesSearch(item: NewsItem, term: string): boolean {
  if (!term.trim()) return true
  const q = term.trim().toLowerCase()
  return (
    item.title?.toLowerCase().includes(q) ||
    item.summary?.toLowerCase().includes(q) ||
    item.hr_impact?.toLowerCase().includes(q) ||
    (Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(q))) ||
    (Array.isArray(item.job_type) && item.job_type.some((t) => t.toLowerCase().includes(q))) ||
    item.source?.toLowerCase().includes(q) ||
    false
  )
}

export default function HomePage() {
  const [allNews, setAllNews] = useState<NewsItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<Stats>({
    total: 0, urgent: 0, important: 0, new_today: 0,
    last_collected: null, last_status: null,
  })
  // 서버 필터: priority / hospital_scope / is_new
  const [serverFilters, setServerFilters] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  // 서버에서 최대 200건 한 번에 가져옴 (검색은 클라이언트에서)
  const fetchNews = useCallback(async (filters: Record<string, unknown>) => {
    setLoading(true)
    const params = new URLSearchParams({ page: '1', limit: '200' })
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== false) params.set(k, String(v))
    })
    const res = await fetch(`/api/news?${params}`)
    if (res.ok) {
      const data: NewsResponse = await res.json()
      setAllNews(data.items)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
    fetchNews({})
  }, [fetchStats, fetchNews])

  // 클라이언트 필터링: 검색어로 즉시 필터
  const displayedNews = useMemo(
    () => allNews.filter((item) => matchesSearch(item, searchTerm)),
    [allNews, searchTerm]
  )

  const handleServerFilterChange = (filters: Record<string, unknown>) => {
    setServerFilters(filters)
    fetchNews(filters)
  }

  const handleCollectSuccess = () => {
    setTimeout(() => {
      fetchStats()
      fetchNews(serverFilters)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900">🏥 병원 노무인사 뉴스</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                종합병원(100~500병상) 특화 HR 정보
                {stats.last_collected && (
                  <span className="ml-2 text-gray-400">
                    · 마지막 수집: {timeAgo(stats.last_collected)}
                  </span>
                )}
              </p>
            </div>
            <CollectButton onSuccess={handleCollectSuccess} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <StatsBar stats={stats} />

        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onFilterChange={handleServerFilterChange}
        />

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading
              ? '불러오는 중...'
              : searchTerm
              ? `"${searchTerm}" 검색 결과 ${displayedNews.length}건 / 전체 ${allNews.length}건`
              : `전체 ${allNews.length}건`}
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
                <div className="flex gap-2 mb-3">
                  <div className="h-5 w-16 bg-gray-200 rounded-full" />
                  <div className="h-5 w-20 bg-gray-200 rounded-full" />
                </div>
                <div className="h-5 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-100 rounded mb-1" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : displayedNews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">{searchTerm ? '🔍' : '📭'}</p>
            <p className="text-gray-500 text-lg font-medium">
              {searchTerm ? `"${searchTerm}"에 해당하는 기사가 없습니다` : '수집된 뉴스가 없습니다'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm ? '다른 단어로 검색해보세요' : '우측 상단의 "뉴스 수집" 버튼을 클릭해 첫 수집을 시작하세요'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedNews.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
