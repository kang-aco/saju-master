// functions/api/analyze.js
// Cloudflare Pages Function — 사주 분석 API + Claude AI 해석

import { CHUNGGAN, JIJI, JANGGAN, CHUNGGAN_OHENG, JIJI_OHENG, SIBI_UNSUNG } from '../_lib/tables.js';
import { chungganSipsung, jijiSamhap, jijiBanghap, analyzeJijiRelation } from '../_lib/relations.js';
import { calculateIlganStrength, analyzeOhengPower, checkGongmangInSaju, getAllSinsul } from '../_lib/sinsul.js';
import { fullGyukAnalysis } from '../_lib/gyukguk.js';
import { fullYongsinAnalysis } from '../_lib/yongsin.js';
import { calculateDaewun } from '../_lib/calculator.js';
import { analyzeAllDaewun } from '../_lib/analyzer.js';
import { getSegunGanjji, analyzeYearsRange } from '../_lib/segun_linker.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function validateInput({ birth_year, birth_month, birth_day, gender, yunju, wolju, ilju, siju }) {
  const errors = [];
  if (!birth_year || birth_year < 1900 || birth_year > 2100) errors.push('출생 연도가 올바르지 않습니다 (1900-2100)');
  if (!birth_month || birth_month < 1 || birth_month > 12) errors.push('출생 월이 올바르지 않습니다 (1-12)');
  if (!birth_day || birth_day < 1 || birth_day > 31) errors.push('출생 일이 올바르지 않습니다 (1-31)');
  if (!['남','여'].includes(gender)) errors.push("성별은 '남' 또는 '여'여야 합니다");
  for (const [name, val] of [['연주',yunju],['월주',wolju],['일주',ilju],['시주',siju]]) {
    if (!val || val.length !== 2) errors.push(`${name}가 올바르지 않습니다 (2글자 간지)`);
    else if (!CHUNGGAN.includes(val[0])) errors.push(`${name} 천간(${val[0]})이 올바르지 않습니다`);
    else if (!JIJI.includes(val[1])) errors.push(`${name} 지지(${val[1]})가 올바르지 않습니다`);
  }
  return errors;
}

function buildClaudePrompt(data) {
  const { saju, ilgan, wolji, gyukResult, yongsinResult, daewunResult, ilStrength, ohengPower, sinsul, gongmang, currentYear } = data;

  const gyukName = gyukResult.격국판별.격국;
  const gyukYs   = yongsinResult.격국용신;
  const eokbuYs  = yongsinResult.억부용신;
  const daewunList = daewunResult.대운목록;

  // 현재 나이의 대운 찾기
  const currentAge = currentYear - saju.birth_year;
  let currentDw = null;
  for (const dw of daewunList) {
    if (dw.나이 <= currentAge) currentDw = dw;
    else break;
  }

  // 신살 목록
  const activeSinsul = Object.entries(sinsul)
    .filter(([,v]) => v.length > 0)
    .map(([k,v]) => `${k}: ${v.map(s => s.살||s.귀인).join(', ')}`)
    .join(' | ');

  // 오행 비율 정리
  const ohengStr = Object.entries(ohengPower.오행비율)
    .sort((a,b)=>b[1]-a[1])
    .map(([oh,r]) => `${oh}:${r}%`)
    .join(', ');

  return `당신은 자평진전(子平眞詮)을 완벽히 숙지한 30년 경력의 역리학자입니다.
다음은 컴퓨터가 계산한 사주 분석 데이터입니다. 이를 바탕으로 실제 역리학자처럼 따뜻하고 이해하기 쉬운 한국어로 종합 해석을 작성해 주세요.

## 사주 원국
- 연주: ${saju.yunju} | 월주: ${saju.wolju} | 일주: ${saju.ilju} | 시주: ${saju.siju}
- 생년월일: ${saju.birth_year}년 ${saju.birth_month}월 ${saju.birth_day}일 (${saju.gender}자)
- 일간: ${ilgan} (${CHUNGGAN_OHENG[ilgan]}) | 월지: ${wolji} (${JIJI_OHENG[wolji]})

## 격국·용신
- 격국: ${gyukName} (${gyukResult.성파격.성파격}/${gyukResult.성파격.등급})
- 격국 판별 근거: ${gyukResult.격국판별.판별근거}
- 격국용신: ${gyukYs.용신} | 기신: ${gyukYs.기신}
- 억부용신: ${eokbuYs.용신} | 억부기신: ${eokbuYs.기신}
- 조후용신: ${yongsinResult.조후용신.설명}

## 일간 강약
- ${ilStrength.신강신약} (총강도: ${ilStrength.총강도}점)
- 필요요소: ${ilStrength.필요요소}

## 오행 세력
- ${ohengStr}
- ${ohengPower.분석}

## 공망
- ${gongmang.설명}

## 신살
- ${activeSinsul || '특별 신살 없음'}

## 대운 흐름 (상위 5개)
${daewunList.slice(0,5).map(dw => {
  const ganSs = chungganSipsung(ilgan, dw.천간);
  const jiJg = (JANGGAN[dw.지지]||[]).find(([,s])=>s==='정기')?.[0]||'?';
  const jiSs = jiJg !== '?' ? chungganSipsung(ilgan, jiJg) : '?';
  return `  ${dw.나이}세: ${dw.간지} (天:${ganSs} / 地:${jiSs})`;
}).join('\n')}

## 현재 대운 (${currentYear}년 기준, 현재 ${currentAge}세)
${currentDw ? `- 대운: ${currentDw.간지} (${currentDw.나이}세~)` : '- 대운 데이터 없음'}

---

위 데이터를 바탕으로 아래 형식으로 종합 해석을 작성해 주세요. 각 섹션은 2~4문장으로 구체적이고 실용적으로 작성하세요. 전문 용어 사용 후 괄호 안에 쉬운 설명을 추가하세요.

### 1. 명조(命造) 총론
이 분의 사주 전체적인 성격과 핵심 특성을 설명해 주세요.

### 2. 격국·용신 해석
격국의 의미와 용신을 실생활에 어떻게 활용할지 설명해 주세요.

### 3. 성격과 재능
일간과 격국 기준으로 성격, 재능, 강점을 설명해 주세요.

### 4. 직업·재물 운
적합한 직업 분야와 재물 운의 특성을 설명해 주세요.

### 5. 대인관계·결혼운
대인관계 패턴과 결혼/이성 관계 운을 설명해 주세요.

### 6. 대운 흐름과 현재 운세
현재 대운의 의미와 앞으로의 흐름을 설명해 주세요.

### 7. 조언과 주의사항
이 사주를 가진 분이 특히 주의해야 할 점과 행운을 강화하는 방법을 실용적으로 조언해 주세요.

마지막에 한 줄 요약을 넣어주세요: "✨ 핵심 한 줄: ..."`;
}

async function callClaudeAPI(apiKey, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API 오류: ${response.status} ${errText}`);
  }
  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST 요청만 허용됩니다' }), { status: 405, headers: CORS_HEADERS });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: '올바른 JSON 형식이 아닙니다' }), { status: 400, headers: CORS_HEADERS });
  }

  const { birth_year, birth_month, birth_day, gender, yunju, wolju, ilju, siju } = body;
  const errors = validateInput(body);
  if (errors.length > 0) {
    return new Response(JSON.stringify({ error: errors.join(', ') }), { status: 400, headers: CORS_HEADERS });
  }

  try {
    // 기본 정보 추출
    const ilgan = ilju[0];
    const wolji = wolju[1];
    const chungganList = [yunju[0], wolju[0], ilju[0], siju[0]];
    const jijiList     = [yunju[1], wolju[1], ilju[1], siju[1]];
    const sajuGanjji   = { 연주: yunju, 월주: wolju, 일주: ilju, 시주: siju };

    // 각종 분석 실행
    const ilStrength  = calculateIlganStrength(ilgan, jijiList);
    const ohengPower  = analyzeOhengPower(chungganList, jijiList);
    const gyukResult  = fullGyukAnalysis(ilgan, wolji, chungganList, jijiList);
    const gyukName    = gyukResult.격국판별.격국;
    const yongsinResult = fullYongsinAnalysis(ilgan, wolji, gyukName, chungganList, jijiList);
    const daewunResult  = calculateDaewun(birth_year, birth_month, birth_day, gender, wolju, 10);
    const daewunAnalyses = analyzeAllDaewun(daewunResult.대운목록, ilgan, wolji, chungganList, jijiList, gyukName, yongsinResult);
    const gongmang    = checkGongmangInSaju(sajuGanjji);
    const sinsul      = getAllSinsul(ilgan, jijiList[0], wolji, jijiList[2], jijiList[3]);

    // 십성 차트 생성
    const sipsung_chart = {};
    for (const [pillar, gj] of [['연주',yunju],['월주',wolju],['일주',ilju],['시주',siju]]) {
      const gan = gj[0], ji = gj[1];
      const ganSs = chungganSipsung(ilgan, gan);
      const jiJg  = (JANGGAN[ji] || []).find(([,s])=>s==='정기')?.[0] ?? '?';
      const jiSs  = jiJg !== '?' ? chungganSipsung(ilgan, jiJg) : '?';
      sipsung_chart[pillar] = { 천간: gan, 지지: ji, 천간십성: ganSs, 지지십성: jiSs };
    }

    // 지지 관계 분석
    const jijiRelations = [];
    for (let i = 0; i < jijiList.length; i++) {
      for (let j = i + 1; j < jijiList.length; j++) {
        const rel = analyzeJijiRelation(jijiList[i], jijiList[j]);
        if (rel['합'] || rel['충'] || rel['형'] || rel['파'] || rel['해']) {
          jijiRelations.push({ ji1: jijiList[i], ji2: jijiList[j], 관계: rel['총평'] ?? '' });
        }
      }
    }

    // 삼합·방합
    const samhap = jijiSamhap(jijiList);
    const banghap = jijiBanghap(jijiList);

    // 대운 흐름 요약 데이터
    const daewunSummary = daewunAnalyses.map(da => ({
      나이: da.나이, 간지: da.대운, 점수: da.총점수, 길흉: da.종합길흉,
      전반: da.천간분석.길흉, 후반: da.지지분석.길흉,
    }));

    // Claude AI 해석 (API 키 없으면 스킵)
    let aiInterpretation = '';
    const currentYear = new Date().getFullYear();
    if (env.CLAUDE_API_KEY) {
      const prompt = buildClaudePrompt({
        saju: { birth_year, birth_month, birth_day, gender, yunju, wolju, ilju, siju },
        ilgan, wolji, gyukResult, yongsinResult, daewunResult, ilStrength, ohengPower, sinsul, gongmang, currentYear
      });
      aiInterpretation = await callClaudeAPI(env.CLAUDE_API_KEY, prompt);
    } else {
      aiInterpretation = '※ Claude API 키가 설정되지 않았습니다. Cloudflare Pages 환경변수에 CLAUDE_API_KEY를 설정해 주세요.';
    }

    const result = {
      success: true,
      input: { birth_year, birth_month, birth_day, gender, yunju, wolju, ilju, siju, ilgan, wolji },
      saju_chart: { chungganList, jijiList, sipsung_chart },
      ilgan_strength: ilStrength,
      oheng_power: ohengPower,
      jiji_relations: jijiRelations,
      samhap, banghap,
      gongmang,
      sinsul,
      gyuk_analysis: gyukResult,
      yongsin_analysis: yongsinResult,
      daewun: { 기본정보: { 요약: daewunResult.요약, 순역행: daewunResult.순역행, 절기정보: daewunResult.절기정보, 대운시작: daewunResult.대운시작 }, 목록: daewunResult.대운목록, 흐름요약: daewunSummary },
      ai_interpretation: aiInterpretation,
    };

    return new Response(JSON.stringify(result), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    console.error('Analysis error:', err);
    return new Response(JSON.stringify({ error: `분석 중 오류가 발생했습니다: ${err.message}` }), { status: 500, headers: CORS_HEADERS });
  }
}
