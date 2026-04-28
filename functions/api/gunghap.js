// functions/api/gunghap.js
// 두 사람 사주 궁합 분석 API + Claude AI 종합 해석

import { analyzeGunghap } from '../_lib/gunghap.js';
import { callAI, getAvailableProviders } from '../_lib/ai_provider.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};

// ── Claude AI 궁합 해석 프롬프트 ────────────────────────────────────────
function buildGunghapPrompt(gunghap, personA, personB) {
  const fmtCat = (name) => {
    const c = gunghap.카테고리[name];
    if (!c) return '';
    const evs = (c.이벤트 ?? []).map(e => `  - ${e.종류}: ${e.효과 ?? ''} ${e.설명 ?? ''} [${e.길흉 ?? ''}]`).join('\n');
    return `### ${name} (점수: ${c.점수 >= 0 ? '+' : ''}${c.점수})\n${evs || '  (특이사항 없음)'}`;
  };

  return `당신은 자평진전(子平眞詮)에 능통한 명리학 전문가입니다.
다음은 두 사람의 사주 궁합 자동 분석 결과입니다.
이를 바탕으로 7개 영역에 대한 종합 해석을 작성하세요.

# 입력 정보

## A: ${personA.name || '본인'} (${personA.gender})
- 일주: ${personA.ilju}
- 일간: ${personA.ilgan} (${personA.gender})
- 일지(배우자궁): ${personA.ilji}
- 사주: ${personA.yunju}년 ${personA.wolju}월 ${personA.ilju}일 ${personA.siju || '(시 모름)'}

## B: ${personB.name || '상대'} (${personB.gender})
- 일주: ${personB.ilju}
- 일간: ${personB.ilgan} (${personB.gender})
- 일지(배우자궁): ${personB.ilji}
- 사주: ${personB.yunju}년 ${personB.wolju}월 ${personB.ilju}일 ${personB.siju || '(시 모름)'}

# 자동 분석 결과
- **총점**: ${gunghap.총점}점
- **등급**: ${gunghap.등급}
- **요약**: ${gunghap.등급요약}

${fmtCat('일주 천간')}
${fmtCat('일주 지지')}
${fmtCat('일간 십성')}
${fmtCat('일지 암합')}
${fmtCat('오행 보완')}
${fmtCat('지지 교차')}
${fmtCat('띠 궁합')}

# 해석 작성 지침

다음 7개 섹션을 ### 마크다운 헤딩으로 작성하세요:

### 1. 첫인상과 끌림
두 사람이 처음 만났을 때의 끌림 정도와 첫인상. 일간합·암합·일지귀문 등이 강하면 "운명적" 표현 사용.

### 2. 가치관과 소통
일간 십성 관계로 본 가치관 차이와 소통 방식. 일간충이면 의견 충돌, 일간합이면 깊은 공감.

### 3. 정서적 안정 (배우자궁)
일지 관계 중심으로 함께 살 때의 정서적 안정도. 일지충은 거주지 변동·이별 가능성, 일지합은 화목.

### 4. 부족함을 채우는 보완
오행 보완 관계로 본 시너지. 서로 부족한 점을 채워주는지, 같은 단점이 증폭되는지.

### 5. 갈등 요소와 주의점
원진·귀문·충 요소를 정직하게 짚어줌. 어떤 상황에서 갈등이 폭발할 수 있는지 구체적으로.

### 6. 관계 발전 가능성
연애·결혼·동업·친구 등 어떤 관계로 발전했을 때 좋을지. 단기 vs 장기 관점 차이.

### 7. 종합 조언
구체적인 행동 조언. 어떤 점을 조심하고 어떤 점을 활용하면 좋은지. 점수가 낮아도 극복 방법 제시.

# 작성 원칙
- 각 섹션 4-6줄로 작성 (너무 짧거나 길지 않게)
- 용어 뒤에 한자 병기 (예: 일주(日柱), 정관(正官))
- 구체적인 사주 글자(${personA.ilgan}·${personB.ilji} 등)를 인용해 신뢰감 부여
- 단순 길흉 판정보다 "왜 그런가"를 설명
- 점수가 낮아도 절망적으로 쓰지 말고 극복 방법 제시
- 한국어로 작성, 자연스러운 존댓말 사용`;
}

// (Claude/NVIDIA 호출은 _lib/ai_provider.js의 callAI 사용)

// ── 메인 핸들러 ────────────────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST 요청만 허용됩니다' }), {
      status: 405, headers: CORS_HEADERS,
    });
  }

  try {
    const data = await request.json();
    const { personA, personB } = data;

    if (!personA || !personB) {
      return new Response(JSON.stringify({ error: 'personA, personB가 필요합니다' }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    // 필수 필드 검증
    for (const [tag, p] of [['A', personA], ['B', personB]]) {
      if (!p.ilgan || !p.ilji || !p.chungganList || !p.jijiList || !p.gender) {
        return new Response(JSON.stringify({
          error: `${tag} 정보 누락 (ilgan, ilji, chungganList, jijiList, gender 필수)`
        }), { status: 400, headers: CORS_HEADERS });
      }
    }

    // 궁합 분석 실행
    const gunghap = analyzeGunghap(personA, personB);

    // AI 해석 — provider 선택 (claude / nvidia)
    const aiProvider = (data.ai_provider || 'claude').toLowerCase();
    const available  = getAvailableProviders(env);
    let aiInterpretation = '';
    let usedProvider = aiProvider;
    if (available.claude || available.nvidia) {
      const prompt = buildGunghapPrompt(gunghap, personA, personB);
      aiInterpretation = await callAI(aiProvider, env, prompt, 5000);
      if (aiProvider === 'claude' && !available.claude && available.nvidia) usedProvider = 'nvidia';
      if (aiProvider === 'nvidia' && !available.nvidia && available.claude) usedProvider = 'claude';
    } else {
      aiInterpretation = '※ AI API 키가 설정되지 않아 자동 분석 결과만 표시됩니다.';
    }

    return new Response(JSON.stringify({
      success: true,
      gunghap,
      ai_interpretation: aiInterpretation,
      ai_provider: usedProvider,
      ai_available: available,
    }), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message ?? String(err),
    }), { status: 500, headers: CORS_HEADERS });
  }
}
