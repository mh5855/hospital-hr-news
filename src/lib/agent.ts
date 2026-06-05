import Anthropic from '@anthropic-ai/sdk'
import { CollectedNewsItem, Priority, HospitalScope } from './types'

const SYSTEM_PROMPT = `당신은 종합병원 노무인사 전문 뉴스 수집 에이전트입니다.

핵심 임무:
- 100~500병상 규모 종합병원의 HR 운영에 직접 영향을 미치는 노무·인사 관련 최신 정보를 수집·요약
- 법령 변화와 판례를 조기 포착하여 종합병원 특유의 리스크를 선제 관리
- 간호등급, 당직의·전공의 근무, 간호조무사 혼용 등 종합병원 구조에 맞는 정보 우선 선별

수집 대상 소스:
- 고용노동부(moel.go.kr), 보건복지부(mohw.go.kr), 건강보험심사평가원(hira.or.kr)
- 대한병원협회(kha.or.kr), 중앙노동위원회(nlrc.go.kr), 전국보건의료산업노동조합
- 의학신문, 청년의사, 메디게이트뉴스, 헬스코리아뉴스, 데일리메디
- 법률신문, 노동법률, 대법원 종합법률정보

우선순위 분류:
- urgent(긴급): 간호등급제 산정기준 변경, 보건의료노조 파업, 노동법 개정 본회의 통과, 대법원 판결
- important(중요): PA간호사 법제화, 근로감독 예고, 임금피크제 판례, 4대보험료 변경
- reference(참고): 단체협약 타결, 해외 사례, 중장기 정책 논의

수집 제외:
- 임상·치료 기술, 의약품·의료기기 산업, 개원가 단독 이슈
- 6개월 이상 지난 정보, 출처 불명 SNS 게시글

요약 작성 원칙:
- 종합병원 HR 관점 5대 항목: 핵심내용, 종합병원영향, 적용시점, 즉시조치사항, 원문출처
- 간호등급(1~7등급), 병상수, 진료과목 수 등 구체 수치 병기
- 상급종합 vs 종합병원 적용 차이 반드시 구분
- 법 조항은 조문번호 + 쉬운 설명 병기

오늘 날짜 기준 최근 7일 이내의 뉴스를 수집하세요.`

const SEARCH_QUERIES = [
  '종합병원 간호등급 변경 2025',
  '보건의료노조 파업 2025',
  '병원 포괄임금 근로기준법 개정 2025',
  '의료기관 노동법 판례 2025',
  '간호조무사 PA간호사 제도화 2025',
  '종합병원 인력기준 고시 변경',
  '병원 최저임금 연차수당 2025',
  '당직의 전공의 근로시간 규제 2025',
  '4대보험료 변경 의료기관 2025',
  '대법원 의료기관 통상임금 판결',
]

export async function collectNews(): Promise<{
  items: CollectedNewsItem[]
  errors: string[]
}> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const collected: CollectedNewsItem[] = []
  const errors: string[] = []
  const seenUrls = new Set<string>()

  // 검색 쿼리를 배치로 나눠 실행 (API 부하 분산)
  const batches = [SEARCH_QUERIES.slice(0, 5), SEARCH_QUERIES.slice(5)]

  for (const batch of batches) {
    const queryList = batch.map((q, i) => `${i + 1}. ${q}`).join('\n')

    try {
      const response = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
        messages: [
          {
            role: 'user',
            content: `다음 검색어들로 최근 7일 이내 종합병원 노무인사 관련 뉴스를 검색하고, 각 뉴스를 아래 JSON 배열 형식으로 반환하세요.

검색어 목록:
${queryList}

각 뉴스 항목은 반드시 아래 JSON 스키마를 준수하세요:
{
  "title": "뉴스 제목",
  "summary": "핵심 내용 요약 (200~350자, 종합병원 HR 관점)",
  "hr_impact": "종합병원 HR 영향 및 구체적 수치",
  "action_checklist": ["□ 체크항목1", "□ 체크항목2"],
  "source": "출처명",
  "source_url": "원문 URL",
  "published_at": "YYYY-MM-DD",
  "priority": "urgent | important | reference",
  "tags": ["주제태그"],
  "job_type": ["직종태그"],
  "hospital_scope": "general_hospital | all | reference_only",
  "apply_date": "YYYY-MM-DD 또는 null",
  "cost_impact": true/false,
  "action_required": true/false
}

응답은 JSON 배열만 반환하세요. 수집된 뉴스가 없으면 빈 배열 []을 반환하세요.
수집 제외 기준(임상기술, 의약품, 6개월 이상 지난 정보)에 해당하는 뉴스는 포함하지 마세요.`,
          },
        ],
      })

      // 응답에서 JSON 추출
      const textContent = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as { type: 'text'; text: string }).text)
        .join('')

      const jsonMatch = textContent.match(/\[[\s\S]*\]/)
      if (!jsonMatch) continue

      const items = JSON.parse(jsonMatch[0]) as CollectedNewsItem[]

      for (const item of items) {
        if (!item.source_url || seenUrls.has(item.source_url)) continue
        if (!item.title || !item.summary) continue

        seenUrls.add(item.source_url)
        collected.push({
          ...item,
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
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`배치 검색 실패 (${batch[0]}...): ${msg}`)
    }
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
