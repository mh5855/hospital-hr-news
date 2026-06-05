'use client'
import { useEffect } from 'react'
import { NewsItem } from '@/lib/types'
import { PriorityBadge } from './PriorityBadge'
import { ScopeBadge } from './ScopeBadge'
import { formatDate } from '@/lib/utils'

interface NewsModalProps {
  item: NewsItem
  onClose: () => void
}

export function NewsModal({ item, onClose }: NewsModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-3 rounded-t-2xl">
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
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 제목 + 날짜 */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-snug mb-1">{item.title}</h2>
            <p className="text-xs text-gray-400">{formatDate(item.published_at)}</p>
          </div>

          {/* 요약 */}
          {item.summary && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">핵심 내용</p>
              <p className="text-sm text-gray-700 leading-relaxed">{item.summary}</p>
            </div>
          )}

          {/* 종합병원 영향 */}
          {item.hr_impact && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-2">🏥 종합병원 HR 영향</p>
              <p className="text-sm text-blue-800 leading-relaxed">{item.hr_impact}</p>
            </div>
          )}

          {/* 즉시 조치사항 */}
          {item.action_checklist && item.action_checklist.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-2">📋 즉시 조치사항</p>
              <ul className="space-y-1.5">
                {item.action_checklist.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                    <span className="mt-0.5 w-4 h-4 flex-shrink-0 rounded border border-amber-400 bg-white" />
                    {action.replace(/^□\s*/, '')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 시행일 */}
          {item.apply_date && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">⏰ 시행일</span>
              <span className="font-semibold text-gray-800">{formatDate(item.apply_date)}</span>
            </div>
          )}

          {/* 태그 */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md">#{tag}</span>
              ))}
            </div>
          )}

          {/* 출처 */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">출처: {item.source || '-'}</span>
            {item.source_url && (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                원문 보기
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
