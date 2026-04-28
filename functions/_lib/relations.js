// relations.js — 생극합충형파해원진 관계 판별 (JS 변환)

import {
  CHUNGGAN_OHENG, JIJI_OHENG, CHUNGGAN_UMYANG,
  OHENG_SAENG, OHENG_GEUK, OHENG_SAENG_REVERSE, OHENG_GEUK_REVERSE,
  CHUNGGAN_HAP, CHUNGGAN_HAP_HWA, CHUNGGAN_CHUNG,
  YUKHAP, YUKHAP_HWA, SAMHAP, BANGHAP,
  YUKCHUNG, SAMHYUNG_GROUPS, SANG_HYUNG, JAHYUNG,
  PAHA, HAE, WONJIN, JANGGAN, pairKey
} from './tables.js';

export function chungganHap(g1, g2) {
  if (CHUNGGAN_HAP[g1] === g2) {
    const hwa = CHUNGGAN_HAP_HWA[pairKey(g1, g2)] ?? '불화(不化)';
    return { 합: true, 화오행: hwa, 설명: `${g1}${g2}합화${hwa}(合化${hwa})` };
  }
  return null;
}

export function chungganChung(g1, g2) {
  if (CHUNGGAN_CHUNG[g1] === g2) {
    return { 충: true, 설명: `${g1}${g2}충(沖) — ${CHUNGGAN_OHENG[g1]}극${CHUNGGAN_OHENG[g2]} 충돌` };
  }
  return null;
}

export function ohengSaengGeuk(g1, g2, isJiji = false) {
  const table = isJiji ? JIJI_OHENG : CHUNGGAN_OHENG;
  const o1 = table[g1] ?? '';
  const o2 = table[g2] ?? '';
  if (!o1 || !o2) return { 관계:'무관계', 설명:`${g1}→${g2}: 오행 불명` };
  if (o1 === o2) return { 관계:'비화(比和)', 설명:`${o1}=${o2} 같은 오행 — 강화` };
  if (OHENG_SAENG[o1] === o2) return { 관계:'상생(相生)', 설명:`${o1}생${o2} — ${g1}이 ${g2}를 도와줌` };
  if (OHENG_SAENG_REVERSE[o1] === o2) return { 관계:'피생(被生)', 설명:`${o2}생${o1} — ${g1}이 ${g2}의 도움을 받음` };
  if (OHENG_GEUK[o1] === o2) return { 관계:'상극(相剋)', 설명:`${o1}극${o2} — ${g1}이 ${g2}를 공격함` };
  if (OHENG_GEUK_REVERSE[o1] === o2) return { 관계:'피극(被剋)', 설명:`${o2}극${o1} — ${g1}이 ${g2}의 공격을 받음` };
  return { 관계:'무관계', 설명:'' };
}

export function chungganSipsung(ilgan, target) {
  if (ilgan === target) return '비견(比肩)';
  const oIl = CHUNGGAN_OHENG[ilgan];
  const oTg = CHUNGGAN_OHENG[target];
  const uyIl = CHUNGGAN_UMYANG[ilgan];
  const uyTg = CHUNGGAN_UMYANG[target];
  const same = (uyIl === uyTg);
  if (oIl === oTg) return same ? '비견(比肩)' : '겁재(劫財)';
  if (OHENG_SAENG[oIl] === oTg) return same ? '식신(食神)' : '상관(傷官)';
  if (OHENG_GEUK[oIl] === oTg) return same ? '편재(偏財)' : '정재(正財)';
  if (OHENG_GEUK[oTg] === oIl) return same ? '편관(偏官)' : '정관(正官)';
  if (OHENG_SAENG[oTg] === oIl) return same ? '편인(偏印)' : '정인(正印)';
  return '?';
}

export function jijiSipsung(ilgan, jiji) {
  return (JANGGAN[jiji] || []).map(([gan, sunbun]) => ({
    천간: gan, 성분: sunbun, 십성: chungganSipsung(ilgan, gan)
  }));
}

export function jijiYukhap(j1, j2) {
  if (YUKHAP[j1] === j2) {
    const hwa = YUKHAP_HWA[pairKey(j1, j2)] ?? '불화';
    return { 합:'육합(六合)', 화오행: hwa, 설명: `${j1}${j2}합화${hwa}` };
  }
  return null;
}

export function jijiSamhap(jijis) {
  const jijiSet = new Set(jijis);
  const results = [];
  const wangJijis = new Set(['午','子','卯','酉']);
  for (const { chars, oheng, name } of SAMHAP) {
    const matched = [...chars].filter(j => jijiSet.has(j));
    if (matched.length === 3) {
      results.push({ 종류:`삼합(三合) ${name}`, 오행:oheng, 글자:matched });
    } else if (matched.length === 2) {
      if (matched.some(j => wangJijis.has(j))) {
        results.push({ 종류:`반삼합(半三合) ${name}`, 오행:oheng, 글자:matched });
      }
    }
  }
  return results;
}

export function jijiBanghap(jijis) {
  const jijiSet = new Set(jijis);
  const results = [];
  for (const { chars, oheng, name } of BANGHAP) {
    if ([...chars].every(j => jijiSet.has(j))) {
      results.push({ 종류:`방합(方合) ${name}`, 오행:oheng, 글자:[...chars] });
    }
  }
  return results;
}

export function jijiYukchung(j1, j2) {
  if (YUKCHUNG[j1] === j2) {
    return { 충:'육충(六冲)', 설명:`${j1}${j2}충 — ${JIJI_OHENG[j1]}↔${JIJI_OHENG[j2]} 정면 충돌` };
  }
  return null;
}

export function jijiHyung(j1, j2) {
  if (SANG_HYUNG[j1] === j2) return { 형:'상형(相刑)', 설명:`${j1}${j2}형 — 무례지형(無禮之刑)` };
  for (const { chars, name, desc } of SAMHYUNG_GROUPS) {
    if (chars.includes(j1) && chars.includes(j2) && j1 !== j2) {
      return { 형:`삼형(三刑) ${name}`, 설명:`${j1}${j2}형 — ${desc}` };
    }
  }
  if (j1 === j2 && JAHYUNG.includes(j1)) return { 형:'자형(自刑)', 설명:`${j1}${j1}자형` };
  return null;
}

export function jijiPaha(j1, j2) {
  if (PAHA[j1] === j2) return { 파:'파(破)', 설명:`${j1}${j2}파 — 합을 방해하는 관계` };
  return null;
}

export function jijiHae(j1, j2) {
  if (HAE[j1] === j2) return { 해:'해(害)·천(穿)', 설명:`${j1}${j2}해 — 합을 깨뜨리는 관계` };
  return null;
}

export function jijiWonjin(j1, j2) {
  if (WONJIN[j1] === j2) return { 원진:'원진(怨嗔)', 설명:`${j1}${j2}원진 — 서로 미워하는 관계` };
  return null;
}

export function analyzeJijiRelation(j1, j2) {
  const result = {};
  const hap = jijiYukhap(j1, j2);
  if (hap) result['합'] = hap;
  const chung = jijiYukchung(j1, j2);
  if (chung) result['충'] = chung;
  const hyung = jijiHyung(j1, j2);
  if (hyung) result['형'] = hyung;
  const pa = jijiPaha(j1, j2);
  if (pa) result['파'] = pa;
  const h = jijiHae(j1, j2);
  if (h) result['해'] = h;
  const wj = jijiWonjin(j1, j2);
  if (wj) result['원진'] = wj;
  result['생극'] = ohengSaengGeuk(j1, j2, true);
  if (!result['합'] && !result['충'] && !result['형']) {
    result['총평'] = '직접적 충합 없음';
  } else {
    const tags = [];
    if (result['합']) tags.push(result['합']['합']);
    if (result['충']) tags.push(result['충']['충']);
    if (result['형']) tags.push(result['형']['형']);
    result['총평'] = tags.join(' · ') || '관계없음';
  }
  return result;
}

export function analyzeChungganRelation(g1, g2) {
  const result = {};
  const hap = chungganHap(g1, g2);
  if (hap) result['합'] = hap;
  const chung = chungganChung(g1, g2);
  if (chung) result['충'] = chung;
  result['생극'] = ohengSaengGeuk(g1, g2);
  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  암합(暗合) 분석
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
//  명합(明合): 천간끼리의 공개된 합 → 이미 chungganHap으로 처리
//  암합(暗合): 천간 또는 지지가 지지 속의 지장간(정기)과 이루는 숨겨진 합
//
//  두 가지 유형:
//    ① 천간-지장간 암합: 원국 천간이 다른 지지의 지장간 정기와 천간합
//    ② 지지-지지 암합:  두 지지의 지장간 정기끼리 천간합 (지지암합)
//
//  해석 포인트:
//    - 일지(배우자궁) 관련 암합 → 이성·배우자 관계, 은밀한 인연
//    - 드러나지 않는 합이므로 겉으로는 보이지 않는 관계·재물·기회

function getJonggiStem(jiji) {
  const found = (JANGGAN[jiji] || []).find(([, s]) => s === '정기');
  return found ? found[0] : null;
}

const PILLAR_NAMES = ['연주', '월주', '일주', '시주'];

/**
 * @param {string[]} chungganList  — 원국 천간 4개 [연, 월, 일, 시]
 * @param {string[]} jijiList      — 원국 지지 4개 [연, 월, 일, 시]
 * @returns {{ 종류, 설명, 화오행, 위치, 강도, 이성관련 }[]}
 */
export function analyzeAmhap(chungganList, jijiList) {
  const results = [];

  // ── ① 천간-지장간 암합 ──────────────────────────────────────────────────
  for (let gi = 0; gi < chungganList.length; gi++) {
    const gan = chungganList[gi];
    if (!gan) continue;
    const hapTarget = CHUNGGAN_HAP[gan];           // 이 천간과 합하는 천간
    if (!hapTarget) continue;

    for (let ji = 0; ji < jijiList.length; ji++) {
      if (gi === ji) continue;                     // 같은 주는 제외
      const jiji = jijiList[ji];
      if (!jiji) continue;
      const jonggi = getJonggiStem(jiji);
      if (!jonggi || jonggi !== hapTarget) continue;

      const hwa = CHUNGGAN_HAP_HWA[pairKey(gan, jonggi)] ?? '불화';
      const iljiRelated = (ji === 2) || (gi === 2); // 일주 관련 여부
      const woljiRelated = (ji === 1) || (gi === 1);

      results.push({
        종류:   '천간-지장간 암합',
        설명:   `${PILLAR_NAMES[gi]} ${gan} ↔ ${PILLAR_NAMES[ji]} ${jiji}(${jonggi}) 암합 — ${gan}${jonggi}합화${hwa}(合化${hwa})`,
        화오행: hwa,
        위치:   `${PILLAR_NAMES[gi]}天·${PILLAR_NAMES[ji]}地`,
        글자:   `${gan}·${jiji}(${jonggi})`,
        강도:   iljiRelated ? '★★★ 강' : woljiRelated ? '★★ 중' : '★ 약',
        이성관련: iljiRelated,
        해석:   iljiRelated
          ? `일주(배우자궁)가 관여하는 암합입니다. 드러나지 않는 이성 인연이나 내면의 감정이 은밀히 작용하며, 비밀스러운 관계·숨겨진 감정·배우자와의 깊은 연결을 나타냅니다.`
          : woljiRelated
          ? `월주(格의 뿌리)가 관여합니다. 직업·신분과 연결된 숨겨진 기회나 암묵적 인연이 작용합니다.`
          : `${PILLAR_NAMES[gi]}과 ${PILLAR_NAMES[ji]}의 기운이 내부적으로 끌어당깁니다. 표면에 드러나지 않는 인연·재물·기회가 있습니다.`,
      });
    }
  }

  // ── ② 지지-지지 암합 ────────────────────────────────────────────────────
  for (let i = 0; i < jijiList.length; i++) {
    for (let j = i + 1; j < jijiList.length; j++) {
      const j1 = jijiList[i];
      const j2 = jijiList[j];
      if (!j1 || !j2) continue;
      const jg1 = getJonggiStem(j1);
      const jg2 = getJonggiStem(j2);
      if (!jg1 || !jg2) continue;
      if (CHUNGGAN_HAP[jg1] !== jg2) continue;

      const hwa = CHUNGGAN_HAP_HWA[pairKey(jg1, jg2)] ?? '불화';
      const iljiRelated = (i === 2 || j === 2);
      const woljiRelated = (i === 1 || j === 1);

      results.push({
        종류:   '지지-지지 암합',
        설명:   `${PILLAR_NAMES[i]} ${j1}(${jg1}) ↔ ${PILLAR_NAMES[j]} ${j2}(${jg2}) 지지암합 — ${jg1}${jg2}합화${hwa}(合化${hwa})`,
        화오행: hwa,
        위치:   `${PILLAR_NAMES[i]}地·${PILLAR_NAMES[j]}地`,
        글자:   `${j1}(${jg1})·${j2}(${jg2})`,
        강도:   iljiRelated ? '★★★ 강' : woljiRelated ? '★★ 중' : '★ 약',
        이성관련: iljiRelated,
        해석:   iljiRelated
          ? `일지(배우자궁)가 관여하는 지지암합입니다. 지장간끼리의 은밀한 끌림으로, 숨겨진 이성 인연이나 배우자와의 깊은 내면적 결합을 나타냅니다.`
          : woljiRelated
          ? `월지와 관련한 지지암합으로, 직업·신분의 변화가 겉으로 드러나지 않고 내부적으로 작용합니다.`
          : `${PILLAR_NAMES[i]}지와 ${PILLAR_NAMES[j]}지의 내부 기운이 서로 끌어당깁니다. 표면에 드러나지 않는 인연이나 기회가 숨겨져 있습니다.`,
      });
    }
  }

  return results;
}
