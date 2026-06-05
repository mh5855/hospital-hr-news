'use client'

interface FilterBarProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  onFilterChange: (filters: Record<string, unknown>) => void
}

export function FilterBar({ searchTerm, onSearchChange, onFilterChange }: FilterBarProps) {
  const buildServerFilters = (overrides: Record<string, unknown> = {}) =>
    Object.fromEntries(
      Object.entries(overrides).filter(([, v]) => v !== '' && v !== undefined && v !== false)
    )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
      {/* 검색창 */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="키워드 입력 — 제목·요약·태그 즉시 검색"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 서버 필터 */}
      <div className="px-4 py-3 flex flex-wrap gap-3 items-center">
        <select
          defaultValue=""
          onChange={(e) => onFilterChange(buildServerFilters({ priority: e.target.value }))}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">전체 우선순위</option>
          <option value="urgent">🔴 긴급</option>
          <option value="important">🟡 중요</option>
          <option value="reference">⚪ 참고</option>
        </select>

        <select
          defaultValue=""
          onChange={(e) => onFilterChange(buildServerFilters({ hospital_scope: e.target.value }))}
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
            onChange={(e) =>
              onFilterChange(buildServerFilters({ is_new: e.target.checked || undefined }))
            }
            className="rounded text-blue-500"
          />
          <span className="text-gray-600">신규만</span>
        </label>
      </div>
    </div>
  )
}
