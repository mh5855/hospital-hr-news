'use client'

interface Stats {
  total: number
  urgent: number
  important: number
  new_today: number
  last_collected: string | null
  last_status: string | null
}

export function StatsBar({ stats }: { stats: Stats }) {
  const cards = [
    { label: '전체 뉴스', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50' },
    { label: '긴급', value: stats.urgent, color: 'text-red-600', bg: 'bg-red-50' },
    { label: '중요', value: stats.important, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: '오늘 신규', value: stats.new_today, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => (
        <div key={card.label} className={`${card.bg} rounded-xl p-4`}>
          <p className="text-xs text-gray-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
