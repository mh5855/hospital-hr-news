'use client'
import { Priority } from '@/lib/types'
import { priorityColor, priorityLabel } from '@/lib/utils'

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${priorityColor(priority)}`}
    >
      {priority === 'urgent' && '🔴'}
      {priority === 'important' && '🟡'}
      {priority === 'reference' && '⚪'}
      {priorityLabel(priority)}
    </span>
  )
}
