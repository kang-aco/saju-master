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
