// segun_linker.js — 세운 연동 분석 (JS 변환)

import { GANJJI_60, JIJI_OHENG, JANGGAN } from './tables.js';
import { analyzeJijiRelation, analyzeChungganRelation, jijiSamhap, jijiBanghap } from './relations.js';
import { getSibiUnsung, getAllSinsul, calculateIlganStrength } from './sinsul.js';
import { classifyRole } from './role_classifier.js';
import { getWonkukExistingHap, ohengRoleScore, analyzeSingleDaewun, scoreToOverall } from './analyzer.js';

export function getSegunGanjji(year) {
  const idx = ((year - 1984) % 60 + 60) % 60;
  return GANJJI_60[idx];
}

export function getSegunGanjjiRange(start, end) {
  const results = [];
  for (let y = start; y <= end; y++) results.push({ 연도:y, 세운: getSegunGanjji(y) });
  return results;
}

function newHapOnly(hapList, existingSet) {
  return hapList.filter(h => !existingSet.has(h.오행));
}

export function analyzeSegunAlone(segunGanjji, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, isSinkang) {
  const sgGan = segunGanjji[0];
  const sgJi  = segunGanjji[1];

  const sgGanRole = classifyRole(sgGan, ilgan, gyukName, isSinkang, false);
  const sgJiRole  = classifyRole(sgJi,  ilgan, gyukName, isSinkang, true);

  let sgBase = (sgGanRole.점수 ?? 0) + (sgJiRole.점수 ?? 0);
  let sgBonus = 0;
  const specialEvents = [];
  const existingHap = getWonkukExistingHap(wonkukJijis);

  for (const wj of wonkukJijis) {
    if (!wj) continue;
    const rel = analyzeJijiRelation(sgJi, wj);
    const wjRole = classifyRole(wj, ilgan, gyukName, isSinkang, true);
    if (rel['충']) {
      if (wj === wolji) {
        sgBonus -= 2;
        specialEvents.push({ 종류:'월지충(月支冲)', 내용:`세운 ${sgJi}이 월지 ${wolji}를 충 — 格 흔들림`, 영향:'직업변동·이사·사고·이별 등 대변화', 심각도:'⛔ 심각' });
      } else if ((sgJiRole.역할 ?? '').includes('용신')) {
        sgBonus -= 1;
      } else if ((wjRole.역할 ?? '').includes('기신')) {
        sgBonus += 1;
        specialEvents.push({ 종류:'기신충거', 내용:`${sgJi}이 ${wj}(기신)를 충거`, 심각도:'✅ 길조' });
      }
    }
    if (rel['합']) {
      if ((sgJiRole.역할 ?? '').includes('용신')) {
        sgBonus -= 1;
        specialEvents.push({ 종류:'용신합거', 내용:`${sgJi}·${wj} 합거`, 심각도:'⚠️ 주의' });
      }
    }
  }

  for (const wg of wonkukGans) {
    if (!wg) continue;
    const rel = analyzeChungganRelation(sgGan, wg);
    const wgRole = classifyRole(wg, ilgan, gyukName, isSinkang, false);
    if (rel['합']) {
      if ((sgGanRole.역할 ?? '').includes('용신')) sgBonus -= 1;
      else if ((wgRole.역할 ?? '').includes('기신')) sgBonus += 1;
    }
  }

  const allJijis = wonkukJijis.filter(Boolean).concat([sgJi]);
  const newSamhap = newHapOnly(jijiSamhap(allJijis), existingHap);
  const newBanghap = newHapOnly(jijiBanghap(allJijis), existingHap);
  for (const sh of newSamhap) {
    const r = ohengRoleScore(sh.오행, ilgan, gyukName, isSinkang);
    sgBonus += r;
    specialEvents.push({ 종류:`${sh.종류} 형성`, 내용:sh.오행, 심각도: r > 0 ? '✨ 길조' : '⚠️ 주의' });
  }

  const sgTotal = sgBase + sgBonus;
  let giljung;
  if (sgTotal >= 3) giljung = '🌟 최길년';
  else if (sgTotal >= 1) giljung = '🟢 길년';
  else if (sgTotal === 0) giljung = '⚪ 평년';
  else if (sgTotal >= -2) giljung = '🔴 흉년';
  else giljung = '⛔ 대흉년';

  return {
    세운: segunGanjji, 천간:sgGan, 지지:sgJi,
    천간십성: sgGanRole.십성 ?? '', 지지십성: sgJiRole.십성 ?? '',
    길흉: giljung, 점수: sgTotal, 특별사건: specialEvents,
  };
}

export function analyzeDaewunSegun(daewunGanjji, daewunAge, segunGanjji, targetYear, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, yongsinResult) {
  const ilStrength = calculateIlganStrength(ilgan, wonkukJijis);
  const isSinkang = ilStrength.총강도 >= 45;

  const dwAnalysis = analyzeSingleDaewun(daewunGanjji, daewunAge, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, yongsinResult);
  const sgAnalysis = analyzeSegunAlone(segunGanjji, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, isSinkang);

  const dwGan = daewunGanjji[0], dwJi = daewunGanjji[1];
  const sgGan = segunGanjji[0],  sgJi = segunGanjji[1];

  const dwSgGan = analyzeChungganRelation(dwGan, sgGan);
  const dwSgJi  = analyzeJijiRelation(dwJi, sgJi);

  let interBonus = 0;
  const interNotes = [];
  if (dwSgGan['합']) interNotes.push(`대운천간(${dwGan})·세운천간(${sgGan}) 합`);
  if (dwSgGan['충']) { interBonus -= 1; interNotes.push(`⚡ 대운천간(${dwGan})·세운천간(${sgGan}) 충 — 불안정`); }
  if (dwSgJi['합']) interNotes.push(`대운지지(${dwJi})·세운지지(${sgJi}) 합`);
  if (dwSgJi['충']) { interBonus -= 1; interNotes.push(`⚡ 대운지지(${dwJi})·세운지지(${sgJi}) 충 — 불안정`); }

  const existingHap = getWonkukExistingHap(wonkukJijis);
  const all3 = wonkukJijis.filter(Boolean).concat([dwJi, sgJi]);
  const new3Samhap = newHapOnly(jijiSamhap(all3), existingHap);

  const dwScore = dwAnalysis.총점수;
  const sgScore = sgAnalysis.점수;
  const combined = dwScore + sgScore + interBonus;

  let final, level;
  if      (dwScore > 0 && sgScore > 0) { final='⭐ 대운·세운 모두 길 — 최상의 해! 목표 달성 절정'; level=1; }
  else if (dwScore > 0 && sgScore === 0) { final='🟢 대운 길 + 세운 평 — 안정적 발전'; level=2; }
  else if (dwScore > 0 && sgScore < 0) { final='🟡 대운 길 + 세운 흉 — 작은 어려움, 큰 틀 유지'; level=3; }
  else if (dwScore === 0 && sgScore > 0) { final='🟡 대운 평 + 세운 길 — 일시적 호재'; level=3; }
  else if (dwScore === 0 && sgScore === 0) { final='⚪ 대운·세운 모두 평 — 무난한 한 해'; level=4; }
  else if (dwScore < 0 && sgScore > 0) { final='🟠 대운 흉 + 세운 길 — 잠깐 호전, 근본은 어려움'; level=5; }
  else if (dwScore < 0 && sgScore === 0) { final='🔴 대운 흉 + 세운 평 — 어려운 시기'; level=6; }
  else { final='⛔ 대운·세운 모두 흉 — 최대한 신중히!'; level=7; }

  const sinsul = getAllSinsul(
    ilgan, wonkukJijis[0]||'', wolji, wonkukJijis[2]||'', wonkukJijis[3]||'', [dwJi, sgJi]
  );
  const activeSinsul = Object.fromEntries(Object.entries(sinsul).filter(([,v])=>v.length>0));

  return {
    연도: targetYear, 대운: daewunGanjji, 세운: segunGanjji,
    대운분석: dwAnalysis, 세운분석: sgAnalysis,
    대운세운관계: { 간섭점수: interBonus, 주요사항: interNotes },
    '3자합국': new3Samhap,
    종합판단: final, 종합점수: combined, 등급: level,
    핵심이벤트: sgAnalysis.특별사건.map(e => e.내용),
    활성신살: activeSinsul,
  };
}

export function analyzeYearsRange(startYear, endYear, daewunList, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, yongsinResult, birthYear) {
  const results = [];
  for (let year = startYear; year <= endYear; year++) {
    const sgGj = getSegunGanjji(year);
    const age = year - birthYear;
    let currentDw = null;
    for (const dw of daewunList) {
      if (dw.나이 <= age) currentDw = dw;
      else break;
    }
    if (!currentDw) continue;
    const ya = analyzeDaewunSegun(currentDw.간지, currentDw.나이, sgGj, year, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, yongsinResult);
    results.push(ya);
  }
  return results;
}

export function getYearsFlowSummary(yearAnalyses) {
  const lines = ['연도별 운세 흐름', '연도 | 세운 | 대운 | 점수 | 종합판단'];
  for (const ya of yearAnalyses) {
    const sc = ya.종합점수;
    const bar = sc !== 0 ? '█'.repeat(Math.abs(sc)) : '─';
    lines.push(`${ya.연도}  ${ya.세운}  ${ya.대운}  ${sc >= 0 ? '+' : ''}${sc}  ${bar.slice(0,5)}  ${ya.종합판단.slice(0,26)}`);
  }
  return lines.join('\n');
}
