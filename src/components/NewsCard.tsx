'use client'
import { useState } from 'react'
import { NewsItem } from '@/lib/types'
import { PriorityBadge } from './PriorityBadge'
import { ScopeBadge } from './ScopeBadge'
import { NewsModal } from './NewsModal'
import { formatDate } from '@/lib/utils'

export function NewsCard({ item }: { item: NewsItem }) {
  const [open, setOpen] = useState(false)

  const borderColor = {
    urgent: 'border-l-red-500',
    important: 'border-l-yellow-400',
    reference: 'border-l-gray-300',
  }[item.priority]

  return (
    <>
      <article
        onClick={() => setOpen(true)}
        className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderColor} p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}
      >
        {/* 배지 + 날짜 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-1.5">
            <PriorityBadge priority={item.priority} />
            <ScopeBadge scope={item.hospital_scope} />
            {item.is_new && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500 text-white">NEW</span>
            )}
            {item.cost_impact && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">💰 비용영향</span>
            )}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{formatDate(item.published_at)}</span>
        </div>

        {/* 제목 */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 line-clamp-2">
          {item.title}
        </h3>

        {/* 요약 미리보기 */}
        {item.summary && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{item.summary}</p>
        )}

        {/* 태그 */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-md">#{tag}</span>
            ))}
            {item.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-400">+{item.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* 출처 */}
        {item.source && (
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">{item.source}</span>
            <span className="text-xs text-blue-400">자세히 보기 →</span>
          </div>
        )}
      </article>

      {open && <NewsModal item={item} onClose={() => setOpen(false)} />}
    </>
  )
}
