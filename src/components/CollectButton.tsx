'use client'
import { useState } from 'react'

interface CollectButtonProps {
  onSuccess?: () => void
}

export function CollectButton({ onSuccess }: CollectButtonProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleCollect = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'hospital_news_cron_2024'}`,
          'x-internal': 'true',
        },
      })
      const data = await res.json()
      if (res.ok) {
        setResult(`✅ 수집 완료: ${data.collected}건 저장, ${data.skipped}건 스킵`)
        onSuccess?.()
      } else {
        setResult(`❌ 오류: ${data.error}`)
      }
    } catch (e) {
      setResult(`❌ 요청 실패: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleCollect}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            수집 중...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            뉴스 수집
          </>
        )}
      </button>
      {result && (
        <span className="text-xs text-gray-600">{result}</span>
      )}
    </div>
  )
}
