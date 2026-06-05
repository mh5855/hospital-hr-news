import { CollectedNewsItem, Priority, HospitalScope } from './types'

// 2026년 노동법·근로기준법 변경사항 중심 검색 쿼리
const SEARCH_QUERIES = [
  '2026년 근로기준법 개정 시행 병원 의료기관',
  '2026년 노동법 변경사항 종합병원 적용',
  '2026년 최저임금 인상 의료기관 병원',
  '2026년 4대보험 요율 변경 사업주 부담',
  '2026년 포괄임금제 금지 확대 병원',
  '2026년 연차휴가 수당 근로기준법 판례',
  '2026년 간호등급제 변경 종합병원',
  '2026년 보건의료노조 단체협약 임금협상',
  '2026년 전공의 당직의 근로시간 규제 시행',
  '2026년 PA간호사 간호조무사 제도 변경',
]

const SYSTEM_PROMPT = `당신은 종합병원(100~500병상) 노무인사 전문 뉴스 분석 에이전트입니다.

2026년에 시행되었거나 변경된 노동법·근로기준법 관련 내용을 종합병원 HR 관점으로 요약하세요.

우선순위 분류:
- urgent: 간호등급제 변경, 보건의료노조 파업, 노동법 개정 시행, 대법원 판결
- important: PA간호사 법제화, 근로감독 예고, 임금·판례 변경, 4대보험료 변경
- reference: 단체협약 사례, 중장기 정책 논의

hospital_scope:
- general_hospital: 종합병원에 직접 적용
- all: 전체 의료기관 적용
- reference_only: 상급종합병원 또는 참고용

요약 원칙 (200~350자):
- 2026년 시행일·변경 내용 명시
- 종합병원 HR 영향 구체 수치 포함
- 법 조항 조문번호 병기 (예: 근로기준법 제50조)
- 즉시 조치사항 1~3개 제시`

async function searchWithPerplexity(query: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://app-neon-psi-18.vercel.app',
      'X-Title': 'Hospital HR News 2026',
    },
    body: JSON.stringify({
      model: 'perplexity/sonar',
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `다음 주제로 2026년 기준 최신 정보를 검색하고, 종합병원 노무인사 담당자에게 필요한 핵심 내용을 JSON 형식으로 정리하세요.

검색 주제: ${query}

반드시 아래 JSON 배열 형식으로만 응답하세요 (관련 없으면 빈 배열 []):
[
  {
    "title": "뉴스/변경사항 제목",
    "summary": "핵심 내용 요약 (200~350자, 2026년 기준, 종합병원 HR 관점)",
    "hr_impact": "종합병원 HR 영향 및 구체적 수치",
    "action_checklist": ["□ 체크항목1", "□ 체크항목2"],
    "source": "출처명",
    "source_url": "원문 URL (없으면 관련 공식 사이트 URL)",
    "published_at": "YYYY-MM-DD",
    "priority": "urgent | important | reference",
    "tags": ["노동법", "근로기준법"],
    "job_type": ["전체직종"],
    "hospital_scope": "general_hospital | all | reference_only",
    "apply_date": "2026년 시행일 또는 null",
    "cost_impact": true,
    "action_required": true
  }
]`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter error ${response.status}: ${err}`)
  }

  const data = await response.json()
  // max_tokens 초과로 잘린 경우 content에 불완전한 JSON이 올 수 있음
  return data.choices?.[0]?.message?.content || ''
}

function safeParseJsonArray(text: string): CollectedNewsItem[] {
  // 완전한 JSON 배열 추출 시도
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    return JSON.parse(match[0])
  } catch {
    // 잘린 JSON 복구: 마지막 완전한 객체까지만 파싱
    try {
      const truncated = match[0].replace(/,?\s*\{[^}]*$/, '') + ']'
      return JSON.parse(truncated)
    } catch {
      return []
    }
  }
}

export async function collectNews(): Promise<{
  items: CollectedNewsItem[]
  errors: string[]
}> {
  const collected: CollectedNewsItem[] = []
  const errors: string[] = []
  const seenUrls = new Set<string>()

  // 쿼리를 2개씩 병렬 처리
  const BATCH_SIZE = 2
  for (let i = 0; i < SEARCH_QUERIES.length; i += BATCH_SIZE) {
    const batch = SEARCH_QUERIES.slice(i, i + BATCH_SIZE)

    await Promise.allSettled(
      batch.map(async (query) => {
        try {
          const text = await searchWithPerplexity(query)
          const items = safeParseJsonArray(text) as CollectedNewsItem[]
          for (const item of items) {
            if (!item.title || !item.summary) continue
            // URL 없으면 제목 기준 중복 체크
            const key = item.source_url || item.title
            if (seenUrls.has(key)) continue
            seenUrls.add(key)

            collected.push({
              ...item,
              source_url: item.source_url || null,
              priority: validatePriority(item.priority),
              hospital_scope: validateScope(item.hospital_scope),
              action_checklist: Array.isArray(item.action_checklist) ? item.action_checklist : [],
              tags: Array.isArray(item.tags) ? item.tags : [],
              job_type: Array.isArray(item.job_type) ? item.job_type : [],
              cost_impact: Boolean(item.cost_impact),
              action_required: Boolean(item.action_required),
              apply_date: item.apply_date || null,
            })
          }
        } catch (err) {
          errors.push(
            `검색 실패 [${query}]: ${err instanceof Error ? err.message : String(err)}`
          )
        }
      })
    )
  }

  return { items: collected, errors }
}

function validatePriority(p: unknown): Priority {
  if (p === 'urgent' || p === 'important' || p === 'reference') return p
  return 'reference'
}

function validateScope(s: unknown): HospitalScope {
  if (s === 'general_hospital' || s === 'all' || s === 'reference_only') return s
  return 'all'
}
