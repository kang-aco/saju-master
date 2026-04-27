// analyzer.js — 대운 × 원국 교차 분석 (JS 변환)

import { CHUNGGAN_OHENG, JIJI_OHENG, JANGGAN, SIBI_UNSUNG } from './tables.js';
import { analyzeJijiRelation, analyzeChungganRelation, chungganSipsung, jijiSamhap, jijiBanghap } from './relations.js';
import { getSibiUnsung, calculateIlganStrength } from './sinsul.js';
import { classifyRole } from './role_classifier.js';
import { OHENG_SAENG } from './tables.js';

export function getWonkukExistingHap(wonkukJijis) {
  const wj = wonkukJijis.filter(Boolean);
  const existing = new Set();
  for (const sh of jijiSamhap(wj)) existing.add(sh.오행);
  for (const bh of jijiBanghap(wj)) existing.add(bh.오행);
  return existing;
}

function newHapOnly(hapList, existingSet) {
  return hapList.filter(h => !existingSet.has(h.오행));
}

export function ohengRoleScore(oheng, ilgan, gyukName, isSinkang) {
  const oh2Gan = { '木':'甲','火':'丙','土':'戊','金':'庚','水':'壬' };
  const repGan = oh2Gan[oheng] ?? '';
  if (!repGan) return 0;
  const r = classifyRole(repGan, ilgan, gyukName, isSinkang, false);
  return r.점수 ?? 0;
}

function scoreLabel(score, prefix) {
  if (score >= 3) return `🔴 ${prefix} 길운`;
  if (score >= 1) return `🟠 ${prefix} 준길운`;
  if (score === 0) return `⚪ ${prefix} 평운`;
  if (score >= -2) return `🔵 ${prefix} 준흉운`;
  return `⛔ ${prefix} 흉운`;
}

export function scoreToOverall(score) {
  if (score >= 5) return '✅ 최길운(最吉運) — 인생 황금기!';
  if (score >= 3) return '🟢 길운(吉運) — 발전과 성취';
  if (score >= 1) return '🟡 준길운 — 좋으나 주의';
  if (score === 0) return '⚪ 평운(平運) — 큰 변화 없음';
  if (score >= -2) return '🟠 준흉운 — 어려움 있으나 감당 가능';
  if (score >= -4) return '🔴 흉운(凶運) — 주의와 대비 필요';
  return '⛔ 대흉운(大凶運) — 최대한 신중하게';
}

function lifeImpact(ganSs, jiSs, ganSc, jiSc) {
  const domainMap = {
    '정관':'직업·명예·법·조직','편관':'권력·투쟁·군경법',
    '정재':'재물·저축·배우자','편재':'투자·사업·아버지',
    '식신':'자녀·건강·의식주','상관':'예술·기술·창의',
    '정인':'학문·모친·문서','편인':'종교·의료·이단',
    '비견':'동업·경쟁·형제','겁재':'투쟁·손재·변화',
  };
  function dom(ss) {
    for (const [k, v] of Object.entries(domainMap)) {
      if (ss.includes(k)) return v;
    }
    return '전반적 삶';
  }
  return {
    전반5년_주영역: `${dom(ganSs)} — ${ganSc > 0 ? '발전↑' : ganSc < 0 ? '주의↓' : '평탄'}`,
    후반5년_주영역: `${dom(jiSs)} — ${jiSc > 0 ? '발전↑' : jiSc < 0 ? '주의↓' : '평탄'}`,
  };
}

export function analyzeSingleDaewun(daewunGanjji, daewunAge, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, yongsinResult) {
  if (daewunGanjji.length !== 2) return { 오류:'간지 형식 오류' };
  const dwGan = daewunGanjji[0];
  const dwJi  = daewunGanjji[1];

  const ilStrength = calculateIlganStrength(ilgan, wonkukJijis);
  const isSinkang = ilStrength.총강도 >= 45;
  const existingHap = getWonkukExistingHap(wonkukJijis);

  // 천간 분석
  const ganRole = classifyRole(dwGan, ilgan, gyukName, isSinkang, false);
  let ganBase = ganRole.점수 ?? 0;
  const ganDetails = [];
  let ganBonus = 0;
  for (const wg of wonkukGans) {
    if (!wg) continue;
    const rel = analyzeChungganRelation(dwGan, wg);
    const wgRole = classifyRole(wg, ilgan, gyukName, isSinkang, false);
    if (rel['합']) {
      if ((ganRole.역할 ?? '').includes('용신'))       { ganBonus -= 1; ganDetails.push(`  ⚠️ ${dwGan}·${wg} 합거 — 용신 합거 주의`); }
      else if ((wgRole.역할 ?? '').includes('기신'))   { ganBonus += 1; ganDetails.push(`  ✅ ${dwGan}·${wg} 합거 — 기신 제거`); }
      else ganDetails.push(`  〽 ${dwGan}·${wg} 합(${rel['합'].화오행 ?? ''}화)`);
    }
    if (rel['충']) {
      if ((wgRole.역할 ?? '').includes('용신'))        { ganBonus -= 1; ganDetails.push(`  ⚡ ${dwGan}·${wg} 충 — 원국 용신 충격`); }
      else if ((wgRole.역할 ?? '').includes('기신'))   { ganBonus += 1; ganDetails.push(`  ✅ ${dwGan}·${wg} 충 — 기신 충거`); }
      else ganDetails.push(`  ⚡ ${dwGan}·${wg} 충`);
    }
  }
  const ganTotal = ganBase + ganBonus;

  // 지지 분석
  const jiRole = classifyRole(dwJi, ilgan, gyukName, isSinkang, true);
  let jiBase = jiRole.점수 ?? 0;
  const jiDetails = [];
  let jiBonus = 0;
  let woljiChung = false;
  for (const wj of wonkukJijis) {
    if (!wj) continue;
    const rel = analyzeJijiRelation(dwJi, wj);
    const wjRole = classifyRole(wj, ilgan, gyukName, isSinkang, true);
    if (rel['충']) {
      if (wj === wolji) {
        woljiChung = true; jiBonus -= 2;
        jiDetails.push(`  🚨 월지 ${wolji} 충! 격의 뿌리 — 직업·이사 대변화 주의`);
      } else if ((jiRole.역할 ?? '').includes('용신')) {
        jiBonus -= 1; jiDetails.push(`  ⚡ ${dwJi}·${wj} 충 — 용신 지지 약화`);
      } else if ((wjRole.역할 ?? '').includes('기신')) {
        jiBonus += 1; jiDetails.push(`  ✅ ${dwJi}·${wj} 충 — 기신 지지 충거`);
      } else jiDetails.push(`  ⚡ ${dwJi}·${wj} 충`);
    }
    if (rel['합']) {
      const hwa = rel['합'].화오행 ?? '';
      if ((jiRole.역할 ?? '').includes('용신'))        { jiBonus -= 1; jiDetails.push(`  ⚠️ ${dwJi}·${wj} 합거(${hwa}화) — 용신 합거`); }
      else if ((wjRole.역할 ?? '').includes('기신'))   { jiBonus += 1; jiDetails.push(`  ✅ ${dwJi}·${wj} 합거 — 기신 제거`); }
      else jiDetails.push(`  〽 ${dwJi}·${wj} 합(${hwa}화)`);
    }
    if (rel['형']) {
      jiDetails.push(`  ⚠️ ${dwJi}·${wj} ${rel['형'].형}`);
    }
  }

  const allJijis = wonkukJijis.filter(Boolean).concat([dwJi]);
  const newSamhap = newHapOnly(jijiSamhap(allJijis), existingHap);
  const newBanghap = newHapOnly(jijiBanghap(allJijis), existingHap);
  for (const sh of newSamhap) {
    const rs = ohengRoleScore(sh.오행, ilgan, gyukName, isSinkang);
    jiBonus += rs;
    if (rs > 0) jiDetails.push(`  ✨ ${sh.종류} 신규 형성! (${sh.오행}오행 강화) +${rs}`);
    else if (rs < 0) jiDetails.push(`  ⚠️ ${sh.종류} 신규 형성 (${sh.오행}오행, 주의) ${rs}`);
    else jiDetails.push(`  〽 ${sh.종류} 형성 (중립)`);
  }
  for (const bh of newBanghap) {
    const rs = ohengRoleScore(bh.오행, ilgan, gyukName, isSinkang);
    jiBonus += rs;
    if (rs > 0) jiDetails.push(`  ✨ ${bh.종류} 신규 형성! +${rs}`);
    else if (rs < 0) jiDetails.push(`  ⚠️ ${bh.종류} 신규 형성 (주의) ${rs}`);
  }

  const jiTotal = jiBase + jiBonus;
  const dwUnsung = getSibiUnsung(ilgan, dwJi);
  const totalScore = ganTotal + jiTotal;
  const overall = scoreToOverall(totalScore);
  const ganGiljung = scoreLabel(ganTotal, '전반5년');
  const jiGiljung  = scoreLabel(jiTotal,  '후반5년');
  const life = lifeImpact(ganRole.십성 ?? '', jiRole.십성 ?? '', ganTotal, jiTotal);

  return {
    대운: daewunGanjji, 나이: daewunAge,
    천간분석: { 글자:dwGan, 십성:ganRole.십성??'', 역할:ganRole.역할??'', 점수:ganTotal, 길흉:ganGiljung, 세부:ganDetails },
    지지분석: {
      글자:dwJi, 십성:jiRole.십성??'', 역할:jiRole.역할??'', 점수:jiTotal, 길흉:jiGiljung, 세부:jiDetails,
      월지충여부: woljiChung, 삼합발생: newSamhap, 방합발생: newBanghap, 일간운성: dwUnsung,
      특별경고: jiDetails.filter(d => d.includes('🚨') || d.includes('⚠️')),
    },
    총점수: totalScore, 종합길흉: overall, 삶의영역: life,
  };
}

export function analyzeAllDaewun(daewunList, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, yongsinResult) {
  return daewunList.map(dw => analyzeSingleDaewun(
    dw.간지, dw.나이, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, yongsinResult
  ));
}

export function getDaewunFlowSummary(dwAnalyses) {
  const lines = ['전체 대운 흐름 요약', '나이 | 간지 | 점수 | 길흉'];
  for (const da of dwAnalyses) {
    const bar = da.총점수 !== 0 ? '█'.repeat(Math.abs(da.총점수)) : '─';
    lines.push(`${String(da.나이).padStart(3)}세  ${da.대운}   ${da.총점수 >= 0 ? '+' : ''}${da.총점수}  ${bar.slice(0,6)}  ${da.종합길흉}`);
  }
  return lines.join('\n');
}
