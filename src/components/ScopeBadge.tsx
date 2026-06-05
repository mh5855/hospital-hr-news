'use client'
import { HospitalScope } from '@/lib/types'
import { scopeColor, scopeLabel } from '@/lib/utils'

export function ScopeBadge({ scope }: { scope: HospitalScope }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${scopeColor(scope)}`}
    >
      {scopeLabel(scope)}
    </span>
  )
}
