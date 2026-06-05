import Parser from 'rss-parser'
import { CollectedNewsItem, Priority, HospitalScope } from './types'

const YEAR = new Date().getFullYear()

const RSS_FEEDS = [
  { name: '의학신문', url: 'https://www.bosa.co.kr/rss/allArticle.xml' },
  { name: '청년의사', url: 'https://www.docdocdoc.co.kr/rss/rss.php' },
  { name: '메디게이트뉴스', url: 'https://www.medigatenews.com/rss/all' },
  { name: '헬스코리아뉴스', url: 'https://www.hkn24.com/rss/allArticle.xml' },
  { name: '데일리메디', url: 'https://www.dailymedi.com/rss/rss.php' },
  { name: '메디칼타임즈', url: 'https://www.medicaltimes.com/rss/allArticle.xml' },
  { name: '뉴시스 의료', url: 'https://www.newsis.com/RSS/health.xml' },
  { name: '연합뉴스 의료', url: 'https://www.yna.co.kr/rss/health.xml' },
]

const KEYWORDS = [
  '간호등급', '간호사', '간호조무사', 'PA간호사',
  '노무', '노동', '파업', '단체협약', '노사', '쟁의',
  '임금', '연차', '포괄임금', '통상임금', '최저임금', '퇴직금', '수당',
  '전공의', '당직', '근로시간', '근로기준', '근로계약',
  '4대보험', '건강보험', '국민연금', '고용보험',
  '채용', '이직', '인사', '해고', '징계',
  '의료기관', '병원 직원', '보건의료', '종합병원',
  '간호인력', '의료인력', '병원 노동',
]

const SYSTEM_PROMPT = `당신은 종합병원(100~500병상) 노무인사 전문 뉴스 분석 에이전트입니다.
제공된 뉴스 기사 목록 중 ${YEAR}년 기준으로 종합병원 HR 운영에 관련된 기사만 선별하고 요약하세요.

우선순위 분류:
- urgent: 간호등급제 변경, 보건의료노조 파업, 노동법 국회 통과, 대법원 판결
- important: PA간호사 법제화, 근로감독 예고, 임금 판례, 4대보험료 변경
- reference: 단체협약 사례, 해외 인력 정책, 중장기 정책 논의

hospital_scope:
- general_hospital: 종합병원에 직접 적용
- all: 전체 의료기관 적용
- reference_only: 상급종합병원 또는 참고용

수집 제외: 임상·치료 기술, 의약품, 개원가 단독 이슈, 6개월 이상 지난 정보

요약 원칙 (200~350자):
- 핵심내용 + 종합병원 영향(구체 수치) + 적용시점 + 즉시조치 포함
- 법 조항은 조문번호 병기
- ${YEAR}년 시행/변경 사항 우선 처리`

function isRelevant(title: string, content: string): boolean {
  const text = (title + ' ' + content).toLowerCase()
  return KEYWORDS.some((kw) => text.includes(kw.toLowerCase()))
}

interface RawArticle {
  title: string
  link: string
  pubDate: string
  content: string
  sourceName: string
}

async function fetchRssFeeds(): Promise<RawArticle[]> {
  const parser = new Parser({
    timeout: 10000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HospitalHRBot/1.0)' },
  })

  const articles: RawArticle[] = []

  await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const result = await parser.parseURL(feed.url)
        for (const item of result.items.slice(0, 30)) {
          const title = item.title || ''
          const content = item.contentSnippet || item.content || item.summary || ''
          if (isRelevant(title, content)) {
            articles.push({
              title,
              link: item.link || '',
              pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
              content: content.slice(0, 500),
              sourceName: feed.name,
            })
          }
        }
      } catch {
        // 피드 접근 실패 시 무시
      }
    })
  )

  const seen = new Set<string>()
  return articles
    .filter((a) => {
      if (!a.link || seen.has(a.link)) return false
      seen.add(a.link)
      return true
    })
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 40)
}

async function summarizeWithOpenRouter(articles: RawArticle[]): Promise<CollectedNewsItem[]> {
  if (articles.length === 0) return []

  const articleList = articles
    .map(
      (a, i) =>
        `[${i + 1}] 제목: ${a.title}\n출처: ${a.sourceName}\n날짜: ${a.pubDate}\nURL: ${a.link}\n내용: ${a.content}`
    )
    .join('\n\n---\n\n')

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://app-neon-psi-18.vercel.app',
      'X-Title': '병원 노무인사 뉴스',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      max_tokens: 8000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `다음 뉴스 기사들을 분석하여 종합병원 HR 관련 기사만 선별하고 JSON 배열로 반환하세요.
${YEAR}년에 변경되었거나 시행된 내용을 우선적으로 포함하세요.

${articleList}

각 항목의 JSON 스키마:
{
  "title": "뉴스 제목",
  "summary": "핵심 내용 요약 (200~350자, 종합병원 HR 관점, ${YEAR}년 기준)",
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

JSON 배열만 반환하세요. 관련 없는 기사는 포함하지 마세요.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} ${errText}`)
  }

  const data = await response.json()
  const text: string = data.choices?.[0]?.message?.content || ''

  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []

  const items = JSON.parse(match[0]) as CollectedNewsItem[]
  return items
    .filter((item) => item.title && item.summary && item.source_url)
    .map((item) => ({
      ...item,
      priority: validatePriority(item.priority),
      hospital_scope: validateScope(item.hospital_scope),
      action_checklist: Array.isArray(item.action_checklist) ? item.action_checklist : [],
      tags: Array.isArray(item.tags) ? item.tags : [],
      job_type: Array.isArray(item.job_type) ? item.job_type : [],
      cost_impact: Boolean(item.cost_impact),
      action_required: Boolean(item.action_required),
      apply_date: item.apply_date || null,
    }))
}

export async function collectNews(): Promise<{
  items: CollectedNewsItem[]
  errors: string[]
}> {
  const errors: string[] = []

  const rawArticles = await fetchRssFeeds()

  if (rawArticles.length === 0) {
    errors.push('RSS 피드에서 관련 기사를 찾지 못했습니다')
    return { items: [], errors }
  }

  const BATCH_SIZE = 15
  const allItems: CollectedNewsItem[] = []

  for (let i = 0; i < rawArticles.length; i += BATCH_SIZE) {
    const batch = rawArticles.slice(i, i + BATCH_SIZE)
    try {
      const items = await summarizeWithOpenRouter(batch)
      allItems.push(...items)
    } catch (err) {
      errors.push(
        `배치 ${Math.floor(i / BATCH_SIZE) + 1} 처리 실패: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  const seen = new Set<string>()
  const deduped = allItems.filter((item) => {
    if (!item.source_url || seen.has(item.source_url)) return false
    seen.add(item.source_url)
    return true
  })

  return { items: deduped, errors }
}

function validatePriority(p: unknown): Priority {
  if (p === 'urgent' || p === 'important' || p === 'reference') return p
  return 'reference'
}

function validateScope(s: unknown): HospitalScope {
  if (s === 'general_hospital' || s === 'all' || s === 'reference_only') return s
  return 'all'
}
