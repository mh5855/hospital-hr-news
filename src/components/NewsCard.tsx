'use client'
import { NewsItem } from '@/lib/types'
import { PriorityBadge } from './PriorityBadge'
import { ScopeBadge } from './ScopeBadge'
import { formatDate } from '@/lib/utils'

interface NewsCardProps {
  item: NewsItem
}

export function NewsCard({ item }: NewsCardProps) {
  const borderColor = {
    urgent: 'border-l-red-500',
    important: 'border-l-yellow-400',
    reference: 'border-l-gray-300',
  }[item.priority]

  return (
    <article
      className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderColor} p-5 hover:shadow-md transition-shadow`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-1.5">
          <PriorityBadge priority={item.priority} />
          <ScopeBadge scope={item.hospital_scope} />
          {item.is_new && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500 text-white">
              NEW
            </span>
          )}
          {item.cost_impact && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
              💰 비용영향
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
          {formatDate(item.published_at)}
        </span>
      </div>

      {/* 제목 */}
      <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2">
        {item.source_url ? (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
          >
            {item.title}
          </a>
        ) : (
          item.title
        )}
      </h3>

      {/* 요약 */}
      {item.summary && (
        <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">{item.summary}</p>
      )}

      {/* 종합병원 영향 */}
      {item.hr_impact && (
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-blue-700 mb-1">🏥 종합병원 HR 영향</p>
          <p className="text-sm text-blue-800 leading-relaxed">{item.hr_impact}</p>
        </div>
      )}

      {/* 즉시 조치사항 */}
      {item.action_checklist && item.action_checklist.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 mb-1.5">📋 즉시 조치사항</p>
          <ul className="space-y-1">
            {item.action_checklist.map((action, i) => (
              <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                <span className="text-gray-400 flex-shrink-0">•</span>
                {action.replace(/^□\s*/, '')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 시행일 */}
      {item.apply_date && (
        <div className="mb-3">
          <span className="text-xs text-gray-500">
            ⏰ 시행일:{' '}
            <span className="font-medium text-gray-700">{formatDate(item.apply_date)}</span>
          </span>
        </div>
      )}

      {/* 태그 */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 출처 */}
      {item.source && (
        <div className="pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">출처: {item.source}</span>
        </div>
      )}
    </article>
  )
}
