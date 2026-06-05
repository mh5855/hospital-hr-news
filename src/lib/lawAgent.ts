// 병원 HR에 관련된 근로기준법·노동관련법 주요 조문을 수집·저장합니다.

const LAW_QUERIES = [
  {
    law_name: '근로기준법',
    query: `근로기준법에서 다음 조문들의 정확한 전문(조문 번호, 제목, 내용)을 JSON 배열로 반환해주세요:
제17조(근로조건의 명시), 제36조(금품 청산), 제43조(임금 지급), 제46조(휴업수당),
제50조(근로시간), 제51조(탄력적 근로시간제), 제52조(선택적 근로시간제),
제53조(연장 근로의 제한), 제54조(휴게), 제55조(휴일), 제56조(연장·야간 및 휴일 근로),
제59조(근로시간 및 휴게시간의 특례-의료업 포함), 제60조(연차 유급휴가),
제61조(연차 유급휴가의 사용 촉진), 제62조(유급휴가의 대체),
제74조(임산부의 보호),제93조(취업규칙의 작성·신고), 제109조(벌칙)`,
  },
  {
    law_name: '최저임금법',
    query: `최저임금법에서 다음 조문들의 정확한 전문을 JSON 배열로 반환해주세요:
제5조(최저임금의 결정), 제6조(최저임금의 효력), 제8조(최저임금의 적용),
제11조(주지 의무), 제28조(벌칙). 2025~2026년 적용 최저임금액도 포함해주세요.`,
  },
  {
    law_name: '노동조합 및 노동관계조정법',
    query: `노동조합 및 노동관계조정법에서 병원·의료기관 HR 담당자에게 중요한 조문들의 전문을 JSON 배열로 반환해주세요:
제29조(교섭 등의 권한), 제30조(교섭 등의 원칙), 제33조(기준의 효력),
제38조(쟁의행위의 제한과 금지 - 의료기관 필수유지업무 포함),
제42조의2(필수유지업무), 제44조(쟁의행위 기간 중의 임금 지급 요청의 금지),
제81조(부당노동행위)`,
  },
  {
    law_name: '근로기준법',
    query: `근로기준법 퇴직금·해고 관련 조문 전문을 JSON 배열로 반환해주세요:
제23조(해고 등의 제한), 제26조(해고의 예고), 제28조(부당해고 등의 구제신청),
제34조(퇴직급여 제도). 또한 근로자퇴직급여 보장법 제8조(퇴직금제도의 설정 등)도 포함해주세요.`,
  },
]

interface LawProvision {
  law_name: string
  article_number: string
  article_title: string
  content: string
  summary: string
  tags: string[]
  hospital_relevant: boolean
  effective_date: string | null
}

function safeParseJsonArray(text: string): LawProvision[] {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    return JSON.parse(match[0])
  } catch {
    try {
      const truncated = match[0].replace(/,?\s*\{[^}]*$/, '') + ']'
      return JSON.parse(truncated)
    } catch {
      return []
    }
  }
}

export async function seedLawProvisions(): Promise<{
  inserted: number
  errors: string[]
}> {
  const results: LawProvision[] = []
  const errors: string[] = []

  for (const q of LAW_QUERIES) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://app-neon-psi-18.vercel.app',
          'X-Title': 'Hospital HR Law DB',
        },
        body: JSON.stringify({
          model: 'perplexity/sonar',
          max_tokens: 4000,
          messages: [
            {
              role: 'system',
              content: '당신은 한국 노동법 전문가입니다. 요청된 법령 조문의 정확한 내용을 JSON 배열로 반환하세요.',
            },
            {
              role: 'user',
              content: `${q.query}

각 조문을 다음 JSON 스키마로 반환하세요:
{
  "law_name": "${q.law_name}",
  "article_number": "제XX조",
  "article_title": "조문 제목",
  "content": "조문 전체 내용 (항·호 포함)",
  "summary": "병원 HR 담당자 관점 1~2줄 요약",
  "tags": ["관련키워드"],
  "hospital_relevant": true,
  "effective_date": "YYYY-MM-DD 또는 null"
}

JSON 배열만 반환하세요.`,
            },
          ],
        }),
      })

      if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)

      const data = await response.json()
      const text: string = data.choices?.[0]?.message?.content || ''
      const items = safeParseJsonArray(text)

      for (const item of items) {
        if (!item.article_number || !item.content) continue
        results.push({
          ...item,
          law_name: item.law_name || q.law_name,
          tags: Array.isArray(item.tags) ? item.tags : [],
          hospital_relevant: item.hospital_relevant !== false,
          effective_date: item.effective_date || null,
        })
      }
    } catch (err) {
      errors.push(`[${q.law_name}] 수집 실패: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { inserted: results.length, errors, ...({ _items: results } as object) } as {
    inserted: number
    errors: string[]
    _items: LawProvision[]
  }
}
