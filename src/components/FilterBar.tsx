'use client'
import { useState } from 'react'

interface FilterBarProps {
  onFilterChange: (filters: {
    priority?: string
    hospital_scope?: string
    is_new?: boolean
    search?: string
  }) => void
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('')
  const [scope, setScope] = useState('')
  const [isNew, setIsNew] = useState(false)

  const apply = (overrides: Record<string, unknown> = {}) => {
    const base: Record<string, unknown> = {
      priority,
      hospital_scope: scope,
      is_new: isNew || undefined,
      search,
    }
    const merged = { ...base, ...overrides }
    onFilterChange(
      Object.fromEntries(
        Object.entries(merged).filter(([, v]) => v !== '' && v !== undefined && v !== false)
      )
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-wrap gap-3 items-center">
        {/* 검색 */}
        <div className="flex-1 min-w-48">
          <input
            type="text"
            placeholder="뉴스 제목 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              apply({ search: e.target.value })
            }}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* 우선순위 필터 */}
        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value)
            apply({ priority: e.target.value })
          }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">전체 우선순위</option>
          <option value="urgent">🔴 긴급</option>
          <option value="important">🟡 중요</option>
          <option value="reference">⚪ 참고</option>
        </select>

        {/* 적용 범위 필터 */}
        <select
          value={scope}
          onChange={(e) => {
            setScope(e.target.value)
            apply({ hospital_scope: e.target.value })
          }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">전체 범위</option>
          <option value="general_hospital">종합병원 직접</option>
          <option value="all">전체 의료기관</option>
          <option value="reference_only">참고용</option>
        </select>

        {/* 신규 필터 */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isNew}
            onChange={(e) => {
              setIsNew(e.target.checked)
              apply({ is_new: e.target.checked || undefined })
            }}
            className="rounded text-blue-500"
          />
          <span className="text-gray-600">신규만</span>
        </label>

        {/* 초기화 */}
        <button
          onClick={() => {
            setSearch('')
            setPriority('')
            setScope('')
            setIsNew(false)
            onFilterChange({})
          }}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          초기화
        </button>
      </div>
    </div>
  )
}
