// sinsul.js — 십이운성·신살·공망·오행세력 계산 (JS 변환)

import {
  SIBI_UNSUNG, SIBI_UNSUNG_STRENGTH, CHUNGGAN_OHENG, JIJI_OHENG,
  JANGGAN, GANJJI_60, GANJJI_INDEX, getGongmang,
  YUKMA, DOHWA, HWAGAE, CHEONUL_GUIIN, MUNCHANG_GUIIN, YANGIN, GEUBSAL, GWIMUN
} from './tables.js';

const UNSUNG_MEANING = {
  '장생':'탄생·성장 시작, 희망과 발전의 기운',
  '목욕':'불안정·욕망, 풍류와 방탕의 기운',
  '관대':'발전·관직 취득, 자신감 상승',
  '건록':'일간 자신의 기운, 독립과 자수성가',
  '제왕':'최고의 힘, 절정과 권력',
  '쇠':'기운 약화 시작, 은퇴와 노련함',
  '병':'쇠약해짐, 건강 주의',
  '사':'기운 소진, 정지와 종결',
  '묘':'창고에 쌓임, 숨겨진 에너지',
  '절':'완전 소멸, 변신 직전',
  '태':'새로운 시작의 씨앗',
  '양':'양육받는 시기, 준비와 성장',
};

export function getSibiUnsung(chunggan, jiji) {
  const unsungTable = SIBI_UNSUNG[chunggan] ?? {};
  const unsung = unsungTable[jiji] ?? '?';
  const strength = SIBI_UNSUNG_STRENGTH[unsung] ?? 0;
  const meaning = UNSUNG_MEANING[unsung] ?? '';
  return {
    천간: chunggan, 지지: jiji, 운성: unsung, 강도: strength,
    의미: meaning,
    설명: `${chunggan}이 ${jiji}에서 ${unsung}(${strength}점) — ${meaning}`
  };
}

export function getAllSibiUnsung(ilgan, saju) {
  const results = {};
  for (const [pillarName, jiji] of Object.entries(saju)) {
    if (jiji) results[pillarName] = getSibiUnsung(ilgan, jiji);
  }
  return results;
}

export function calculateIlganStrength(ilgan, sajuJiji) {
  let totalStrength = 0;
  const details = [];
  const ilOheng = CHUNGGAN_OHENG[ilgan];
  for (const jiji of sajuJiji) {
    const usData = getSibiUnsung(ilgan, jiji);
    totalStrength += usData.강도;
    const detail = { 지지: jiji, 운성: usData.운성, 강도: usData.강도 };
    for (const [gan] of (JANGGAN[jiji] ?? [])) {
      if (CHUNGGAN_OHENG[gan] === ilOheng) {
        detail.통근 = `${jiji}중 ${gan} 통근(通根)`;
      }
    }
    details.push(detail);
  }
  let judgment, need;
  if (totalStrength >= 60) {
    judgment = '신강(身强) — 일간 에너지 강함, 설기·제화 필요';
    need = '관살·재성·식상으로 에너지 분산';
  } else if (totalStrength <= 30) {
    judgment = '신약(身弱) — 일간 에너지 약함, 생조 필요';
    need = '인성·비겁으로 일간 강화 필요';
  } else {
    judgment = '중화(中和) — 균형 상태';
    need = '오행 흐름에 따라 용신 결정';
  }
  return { 일간:ilgan, 총강도:totalStrength, 신강신약:judgment, 필요요소:need, 세부내역:details };
}

export function getGongmangForPillar(pillarGanjji) { return getGongmang(pillarGanjji); }

export function checkGongmangInSaju(sajuGanjji) {
  const ilju = sajuGanjji['일주'] ?? '';
  if (!ilju) return {};
  const [gm1, gm2] = getGongmang(ilju);
  const allJijis = Object.values(sajuGanjji).filter(gj => gj && gj.length === 2).map(gj => gj[1]);
  const gongmangFound = allJijis.filter(jiji => jiji === gm1 || jiji === gm2);
  return {
    일주: ilju, 공망지지: [gm1, gm2], 사주내_공망: gongmangFound,
    설명: `일주 ${ilju}의 공망은 ${gm1}·${gm2} — ${gongmangFound.length ? '공망 발견: ' + gongmangFound.join(', ') : '사주 내 공망 없음'}`
  };
}

function getYukma(baseJiji, checkJijis) {
  const yukmaJiji = YUKMA[baseJiji] ?? '';
  return checkJijis.filter(j => j === yukmaJiji).map(j => ({
    살:'역마살(驛馬殺)', 기준:baseJiji, 발견:j,
    의미:'이동·여행·변동·해외 관련 에너지, 활동적이고 바쁜 삶'
  }));
}
function getDohwa(baseJiji, checkJijis) {
  const dohwaJiji = DOHWA[baseJiji] ?? '';
  return checkJijis.filter(j => j === dohwaJiji).map(j => ({
    살:'도화살(桃花殺)', 기준:baseJiji, 발견:j, 의미:'매력·인기·풍류, 이성 관계 활발, 예술적 감수성'
  }));
}
function getHwagae(baseJiji, checkJijis) {
  const hwagaeJiji = HWAGAE[baseJiji] ?? '';
  return checkJijis.filter(j => j === hwagaeJiji).map(j => ({
    살:'화개살(華蓋殺)', 기준:baseJiji, 발견:j, 의미:'종교·학문·예술에 탁월, 고독·은둔 성향'
  }));
}
function getCheonulGuiin(ilgan, checkJijis) {
  const guiinJijis = CHEONUL_GUIIN[ilgan] ?? [];
  return checkJijis.filter(j => guiinJijis.includes(j)).map(j => ({
    귀인:'천을귀인(天乙貴人)', 일간:ilgan, 발견:j,
    의미:'귀인의 도움, 어려울 때 구원자 나타남, 명예와 길성'
  }));
}
function getMunchang(ilgan, checkJijis) {
  const mcJiji = MUNCHANG_GUIIN[ilgan] ?? '';
  return checkJijis.filter(j => j === mcJiji).map(j => ({
    귀인:'문창귀인(文昌貴人)', 일간:ilgan, 발견:j,
    의미:'학문·문서·교육에 탁월, 총명하고 학업 성취 좋음'
  }));
}
function getYanginSal(ilgan, checkJijis) {
  const yanginJiji = YANGIN[ilgan] ?? '';
  return checkJijis.filter(j => j === yanginJiji).map(j => ({
    살:'양인살(羊刃殺)', 일간:ilgan, 발견:j,
    의미:'강렬한 에너지, 날카로움·과격함, 편관과 배합 시 권위'
  }));
}
function getGeubsal(baseJiji, checkJijis) {
  const gsJiji = GEUBSAL[baseJiji] ?? '';
  return checkJijis.filter(j => j === gsJiji).map(j => ({
    살:'겁살(劫殺)', 기준:baseJiji, 발견:j,
    의미:'강제적 변화·겁탈·강도·사고, 주의 필요한 흉살'
  }));
}

// ── 귀문관살(鬼門關殺) ──────────────────────────────────────────────────────
// 원국 지지 4개 중 귀문 쌍이 있으면 감지
// 子酉·丑午·寅未·卯申·辰亥·巳戌
function getGwimunSal(jijiList) {
  const result = [];
  const PILLAR = ['연지','월지','일지','시지'];
  for (let i = 0; i < jijiList.length; i++) {
    for (let j = i + 1; j < jijiList.length; j++) {
      const j1 = jijiList[i], j2 = jijiList[j];
      if (!j1 || !j2) continue;
      if (GWIMUN[j1] === j2) {
        const iljiInvolved = (i === 2 || j === 2);
        result.push({
          살: '귀문관살(鬼門關殺)',
          지지1: j1, 지지2: j2,
          위치: `${PILLAR[i]}·${PILLAR[j]}`,
          일지관여: iljiInvolved,
          의미: '정신적 예민함과 탁월한 직감·영감을 나타냅니다. 예지몽, 육감, 신기(神氣)가 강하며 심리·철학·종교·예술 분야에서 두각을 나타낼 수 있습니다. 반면 신경과민, 스트레스, 정신적 불안정에 주의가 필요합니다.',
          특성: iljiInvolved
            ? '일지가 포함되어 내면 깊숙이 작용합니다. 배우자나 가까운 관계에서도 감성적 예민함이 강하게 드러납니다.'
            : '원국 내 귀문관살로, 타고난 직감과 감수성이 삶 전반에 영향을 줍니다.',
        });
      }
    }
  }
  return result;
}

export function getAllSinsul(ilgan, yunji, wolji, ilji, siji, extraJijis = []) {
  const allJijis = [yunji, wolji, ilji, siji, ...extraJijis].filter(Boolean);
  const result = { 역마살:[], 도화살:[], 화개살:[], 천을귀인:[], 문창귀인:[], 양인살:[], 겁살:[], 귀문관살:[] };
  for (const base of [yunji, ilji]) {
    if (!base) continue;
    result.역마살.push(...getYukma(base, allJijis));
    result.도화살.push(...getDohwa(base, allJijis));
    result.화개살.push(...getHwagae(base, allJijis));
    result.겁살.push(...getGeubsal(base, allJijis));
  }
  result.천을귀인 = getCheonulGuiin(ilgan, allJijis);
  result.문창귀인 = getMunchang(ilgan, allJijis);
  result.양인살 = getYanginSal(ilgan, allJijis);
  result.귀문관살 = getGwimunSal(allJijis.slice(0,4)); // 원국 4지지만
  // 중복 제거
  for (const key of Object.keys(result)) {
    const seen = new Set();
    result[key] = result[key].filter(item => {
      const marker = JSON.stringify(item);
      if (seen.has(marker)) return false;
      seen.add(marker);
      return true;
    });
  }
  return result;
}

export function analyzeOhengPower(sajuGans, sajuJijis) {
  const ohengScore = { '木':0,'火':0,'土':0,'金':0,'水':0 };
  const details = [];
  for (const gan of sajuGans) {
    if (gan && CHUNGGAN_OHENG[gan]) {
      const oh = CHUNGGAN_OHENG[gan];
      ohengScore[oh] += 10;
      details.push(`천간 ${gan}(${oh}) +10점`);
    }
  }
  for (const jiji of sajuJijis) {
    if (jiji && JANGGAN[jiji]) {
      for (const [gan, sunbun, ratio] of JANGGAN[jiji]) {
        const oh = CHUNGGAN_OHENG[gan] ?? '';
        if (oh) {
          const score = Math.floor(ratio * 0.1);
          ohengScore[oh] += score;
          details.push(`지지 ${jiji}중 ${gan}(${oh},${sunbun}) +${score}점`);
        }
      }
    }
  }
  const total = Object.values(ohengScore).reduce((a,b)=>a+b,0) || 1;
  const ohengRatio = {};
  for (const [oh, sc] of Object.entries(ohengScore)) {
    ohengRatio[oh] = Math.round(sc / total * 1000) / 10;
  }
  const strong = Object.entries(ohengRatio).filter(([,r])=>r>=30).map(([oh])=>oh);
  const weak = Object.entries(ohengRatio).filter(([,r])=>r<=5).map(([oh])=>oh);
  return {
    오행점수: ohengScore, 오행비율: ohengRatio,
    과다오행: strong, 부족오행: weak, 세부내역: details,
    분석: `과다 오행: ${strong.join(', ')||'없음'} | 부족 오행: ${weak.join(', ')||'없음'}`
  };
}
