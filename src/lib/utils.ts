import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Priority, HospitalScope } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function priorityLabel(priority: Priority): string {
  const map = { urgent: '긴급', important: '중요', reference: '참고' }
  return map[priority]
}

export function priorityColor(priority: Priority): string {
  const map = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    important: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    reference: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return map[priority]
}

export function priorityDot(priority: Priority): string {
  const map = {
    urgent: 'bg-red-500',
    important: 'bg-yellow-500',
    reference: 'bg-gray-400',
  }
  return map[priority]
}

export function scopeLabel(scope: HospitalScope): string {
  const map = {
    general_hospital: '종합병원 직접',
    all: '전체 의료기관',
    reference_only: '참고용',
  }
  return map[scope]
}

export function scopeColor(scope: HospitalScope): string {
  const map = {
    general_hospital: 'bg-blue-100 text-blue-700',
    all: 'bg-green-100 text-green-700',
    reference_only: 'bg-gray-100 text-gray-500',
  }
  return map[scope]
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
  return formatDate(dateStr)
}
