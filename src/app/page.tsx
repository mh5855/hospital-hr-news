'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { NewsItem } from '@/lib/types'
import { NewsCard } from '@/components/NewsCard'
import { LawCard } from '@/components/LawCard'
import { StatsBar } from '@/components/StatsBar'
import { FilterBar } from '@/components/FilterBar'
import { CollectButton } from '@/components/CollectButton'
import { timeAgo } from '@/lib/utils'

interface Stats {
  total: number; urgent: number; important: number
  new_today: number; last_collected: string | null; last_status: string | null
}
interface NewsResponse { items: NewsItem[]; total: number; page: number; totalPages: number }
interface LawProvision {
  id: string; law_name: string; article_number: string; article_title: string
  content: string; summary: string | null; tags: string[]; effective_date: string | null
}

function matchesSearch(item: NewsItem, term: string): boolean {
  if (!term.trim()) return true
  const q = term.trim().toLowerCase()
  return !!(
    item.title?.toLowerCase().includes(q) ||
    item.summary?.toLowerCase().includes(q) ||
    item.hr_impact?.toLowerCase().includes(q) ||
    (Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(q))) ||
    (Array.isArray(item.job_type) && item.job_type.some((t) => t.toLowerCase().includes(q))) ||
    item.source?.toLowerCase().includes(q)
  )
}

export default function HomePage() {
  const [allNews, setAllNews] = useState<NewsItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [lawResults, setLawResults] = useState<LawProvision[]>([])
  const [lawLoading, setLawLoading] = useState(false)
  const [stats, setStats] = useState<Stats>({
    total: 0, urgent: 0, important: 0, new_today: 0,
    last_collected: null, last_status: null,
  })
  const [serverFilters, setServerFilters] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const lawDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  const fetchNews = useCallback(async (filters: Record<string, unknown>) => {
    setLoading(true)
    const params = new URLSearchParams({ page: '1', limit: '200' })
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== false) params.set(k, String(v))
    })
    const res = await fetch(`/api/news?${params}`)
    if (res.ok) setAllNews((await res.json() as NewsResponse).items)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
    fetchNews({})
  }, [fetchStats, fetchNews])

  // 법령 검색 (300ms debounce, 2자 이상)
  useEffect(() => {
    if (lawDebounce.current) clearTimeout(lawDebounce.current)
    if (searchTerm.trim().length < 2) {
      setLawResults([])
      return
    }
    lawDebounce.current = setTimeout(async () => {
      setLawLoading(true)
      const res = await fetch(`/api/laws?q=${encodeURIComponent(searchTerm.trim())}`)
      if (res.ok) setLawResults((await res.json()).items || [])
      setLawLoading(false)
    }, 300)
    return () => { if (lawDebounce.current) clearTimeout(lawDebounce.current) }
  }, [searchTerm])

  const displayedNews = useMemo(
    () => allNews.filter((item) => matchesSearch(item, searchTerm)),
    [allNews, searchTerm]
  )

  const handleServerFilterChange = (filters: Record<string, unknown>) => {
    setServerFilters(filters)
    fetchNews(filters)
  }

  const handleCollectSuccess = () => {
    setTimeout(() => { fetchStats(); fetchNews(serverFilters) }, 1000)
  }

  const hasSearch = searchTerm.trim().length >= 2

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
                  <span className="ml-2 text-gray-400">· 마지막 수집: {timeAgo(stats.last_collected)}</span>
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

        {/* 법령 검색 결과 */}
        {hasSearch && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-indigo-700">⚖️ 관련 법령</h2>
              {lawLoading && <span className="text-xs text-gray-400">검색 중...</span>}
              {!lawLoading && (
                <span className="text-xs text-gray-400">
                  {lawResults.length > 0 ? `${lawResults.length}개 조문` : '해당 조문 없음'}
                </span>
              )}
            </div>
            {lawResults.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {lawResults.map((item) => <LawCard key={item.id} item={item} />)}
              </div>
            ) : !lawLoading && (
              <p className="text-xs text-gray-400 py-3 px-1">
                &ldquo;{searchTerm}&rdquo; 관련 조문이 없습니다. 법령 DB를 먼저 구축해주세요.
              </p>
            )}
          </div>
        )}

        {/* 뉴스 결과 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            {hasSearch && <h2 className="text-sm font-bold text-gray-700">📰 관련 뉴스</h2>}
            <p className="text-sm text-gray-500">
              {loading ? '불러오는 중...'
                : hasSearch
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
            <div className="text-center py-16">
              <p className="text-4xl mb-4">{hasSearch ? '🔍' : '📭'}</p>
              <p className="text-gray-500 text-lg font-medium">
                {hasSearch ? `"${searchTerm}"에 해당하는 뉴스가 없습니다` : '수집된 뉴스가 없습니다'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {hasSearch ? '다른 단어로 검색해보세요' : '우측 상단의 "뉴스 수집" 버튼을 클릭해 첫 수집을 시작하세요'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedNews.map((item) => <NewsCard key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
