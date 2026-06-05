'use client'
import { useState, useEffect, useCallback } from 'react'
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

export default function HomePage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0, urgent: 0, important: 0, new_today: 0,
    last_collected: null, last_status: null,
  })
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  const fetchNews = useCallback(async (currentFilters: Record<string, unknown>, currentPage: number) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(currentPage))
    params.set('limit', '12')
    Object.entries(currentFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v))
    })
    const res = await fetch(`/api/news?${params}`)
    if (res.ok) {
      const data: NewsResponse = await res.json()
      setNews(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
    fetchNews({}, 1)
  }, [fetchStats, fetchNews])

  const handleFilterChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    setPage(1)
    fetchNews(newFilters, 1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchNews(filters, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCollectSuccess = () => {
    setTimeout(() => {
      fetchStats()
      fetchNews(filters, page)
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
        <FilterBar onFilterChange={handleFilterChange} />

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading ? '검색 중...' : `총 ${total.toLocaleString()}건`}
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
        ) : news.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-gray-500 text-lg font-medium">수집된 뉴스가 없습니다</p>
            <p className="text-gray-400 text-sm mt-2">
              우측 상단의 &ldquo;뉴스 수집&rdquo; 버튼을 클릭해 첫 수집을 시작하세요
            </p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  이전
                </button>
                <span className="text-sm text-gray-600 px-3">{page} / {totalPages}</span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
