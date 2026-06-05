'use client'
import { useState } from 'react'

interface LawProvision {
  id: string
  law_name: string
  article_number: string
  article_title: string
  content: string
  summary: string | null
  tags: string[]
  effective_date: string | null
}

export function LawCard({ item }: { item: LawProvision }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-600 text-white">
            ⚖️ 법령
          </span>
          <span className="text-xs text-indigo-600 font-semibold">{item.law_name}</span>
        </div>
        {item.effective_date && (
          <span className="text-xs text-gray-400 whitespace-nowrap">{item.effective_date} 시행</span>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 text-sm mb-1">
        {item.article_number} ({item.article_title})
      </h3>

      {item.summary && (
        <p className="text-xs text-indigo-800 mb-2 leading-relaxed">{item.summary}</p>
      )}

      <div className={`text-xs text-gray-700 leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-3' : ''}`}>
        {item.content}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
      >
        {expanded ? '접기 ▲' : '전문 보기 ▼'}
      </button>

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-600 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
