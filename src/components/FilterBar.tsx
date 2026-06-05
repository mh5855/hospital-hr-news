'use client'
import { useState, useRef } from 'react'

interface FilterBarProps {
  onFilterChange: (filters: Record<string, unknown>) => void
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('')
  const [scope, setScope] = useState('')
  const [isNew, setIsNew] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const buildFilters = (overrides: Record<string, unknown> = {}) => {
    const base: Record<string, unknown> = {
      priority,
      hospital_scope: scope,
      is_new: isNew || undefined,
      search,
    }
    const merged = { ...base, ...overrides }
    return Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== '' && v !== undefined && v !== false)
    )
  }

  const applySearch = (value: string) => {
    onFilterChange(buildFilters({ search: value }))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') applySearch(search)
    if (e.key === 'Escape') {
      setSearch('')
      applySearch('')
    }
  }

  const handleReset = () => {
    setSearch('')
    setPriority('')
    setScope('')
    setIsNew(false)
    onFilterChange({})
    inputRef.current?.focus()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
      {/* 검색창 */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="키워드 검색 — 제목, 요약, 태그 전체 검색 (Enter)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); applySearch('') }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => applySearch(search)}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            검색
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="px-4 py-3 flex flex-wrap gap-3 items-center">
        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value)
            onFilterChange(buildFilters({ priority: e.target.value }))
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">전체 우선순위</option>
          <option value="urgent">🔴 긴급</option>
          <option value="important">🟡 중요</option>
          <option value="reference">⚪ 참고</option>
        </select>

        <select
          value={scope}
          onChange={(e) => {
            setScope(e.target.value)
            onFilterChange(buildFilters({ hospital_scope: e.target.value }))
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">전체 범위</option>
          <option value="general_hospital">종합병원 직접</option>
          <option value="all">전체 의료기관</option>
          <option value="reference_only">참고용</option>
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isNew}
            onChange={(e) => {
              setIsNew(e.target.checked)
              onFilterChange(buildFilters({ is_new: e.target.checked || undefined }))
            }}
            className="rounded text-blue-500"
          />
          <span className="text-gray-600">신규만</span>
        </label>

        {(search || priority || scope || isNew) && (
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            초기화
          </button>
        )}
      </div>
    </div>
  )
}
