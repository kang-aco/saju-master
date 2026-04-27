// gyukguk.js — 격국 판별 (JS 변환)

import { JANGGAN, getJangganJunggi, SIBI_UNSUNG, YANGIN, CHUNGGAN_OHENG, JIJI_OHENG } from './tables.js';
import { chungganSipsung, jijiSipsung } from './relations.js';
import { analyzeOhengPower, calculateIlganStrength } from './sinsul.js';
import { OHENG_SAENG, OHENG_GEUK } from './tables.js';

const GYUK_DESCRIPTIONS = {
  '정관격(正官格)':'관이 맑고 바른 격 — 명예·직위·법질서를 주관, 안정적 사회생활',
  '편관격(偏官格)':'칠살(七殺)이 격 — 강한 의지와 투쟁력, 군인·경찰·검사 적합',
  '정재격(正財格)':'정직한 재물의 격 — 성실과 노력으로 재물 축적, 사업·재무 분야',
  '편재격(偏財格)':'편재가 격 — 활동적 재물 추구, 투자·무역·사업 적성',
  '식신격(食神格)':'의식주와 재능의 격 — 풍요롭고 여유있는 삶, 음식·예술·교육',
  '상관격(傷官格)':'관을 상하게 하는 격 — 창의성·예술성·자유로움, 기술과 재능',
  '정인격(正印格)':'바른 인성의 격 — 학문·교육·종교, 모성적 배려와 지혜',
  '편인격(偏印格)':'편인이 격 — 이단·기술·의료·예술, 독특한 재능과 직관력',
  '건록격(建祿格)':'일간이 월령을 얻은 격 — 독립심 강하고 자수성가, 개성적 삶',
  '양인격(羊刃格)':'날카로운 칼날의 격 — 강렬한 에너지, 전문직·권력직 적합',
};

function sipsung2GyukName(sipsung) {
  const map = {
    '정관(正官)':'정관격(正官格)','편관(偏官)':'편관격(偏官格)',
    '정재(正財)':'정재격(正財格)','편재(偏財)':'편재격(偏財格)',
    '식신(食神)':'식신격(食神格)','상관(傷官)':'상관격(傷官格)',
    '정인(正印)':'정인격(正印格)','편인(偏印)':'편인격(偏印格)',
    '비견(比肩)':'건록격(建祿格)','겁재(劫財)':'양인격(羊刃格)',
  };
  return map[sipsung] ?? `${sipsung}격`;
}

function buildGyukResult(gyukName, sipsung, wolji, source, toechulGan, ilgan, reason) {
  return {
    격국: gyukName, 격십성: sipsung, 월지: wolji, 격출처: source,
    투출천간: toechulGan, 일간: ilgan, 판별근거: reason,
    격국설명: GYUK_DESCRIPTIONS[gyukName] ?? '',
  };
}

export function judgeGyukguk(ilgan, wolji, chungganList) {
  const jangganList = JANGGAN[wolji] ?? [];
  const jangganSorted = [...jangganList].sort((a, b) => {
    const order = { '정기':0,'중기':1,'여기':2 };
    return order[a[1]] - order[b[1]];
  });

  const sibiUs = SIBI_UNSUNG[ilgan] ?? {};
  const woljiUnsung = sibiUs[wolji] ?? '';

  if (woljiUnsung === '건록') {
    return buildGyukResult('건록격(建祿格)', '비견(比肩)', wolji, '정기', null, ilgan, '비겁이 월령을 차지 — 건록격');
  }
  if (woljiUnsung === '제왕' && YANGIN[ilgan] === wolji) {
    return buildGyukResult('양인격(羊刃格)', '겁재(劫財)', wolji, '정기', null, ilgan, '월지가 일간의 양인지(제왕지) — 양인격');
  }

  let toechulResult = null;
  for (const [gan, sunbun] of jangganSorted) {
    if (gan === ilgan) continue;
    if (chungganList.includes(gan)) {
      const sipsung = chungganSipsung(ilgan, gan);
      toechulResult = [gan, sunbun, sipsung];
      break;
    }
  }

  if (toechulResult) {
    const [gan, sunbun, sipsung] = toechulResult;
    const gyukName = sipsung2GyukName(sipsung);
    return buildGyukResult(gyukName, sipsung, wolji, sunbun, gan, ilgan,
      `월지 ${wolji} 장간 ${gan}(${sunbun})이 천간에 투출 — ${gyukName}`);
  }

  const junggiGan = getJangganJunggi(wolji);
  if (junggiGan === ilgan) {
    return buildGyukResult('건록격(建祿格)', '비견(比肩)', wolji, '정기', null, ilgan,
      `월지 ${wolji} 정기 ${junggiGan}이 일간과 동일 — 건록격`);
  }
  const sipsung = chungganSipsung(ilgan, junggiGan);
  const gyukName = sipsung2GyukName(sipsung);
  return buildGyukResult(gyukName, sipsung, wolji, '정기(투출없음)', null, ilgan,
    `투출 없어 월지 ${wolji} 정기 ${junggiGan} 기준 — ${gyukName}`);
}

export function judgeSungyuk(gyukName, ilgan, chungganList, jijiList) {
  const gyukKishin = {
    '정관격(正官格)':['상관(傷官)'],
    '편관격(偏官格)':['재성'],
    '정재격(正財格)':['비겁(比肩)','겁재(劫財)'],
    '편재격(偏財格)':['비겁(比肩)','겁재(劫財)'],
    '식신격(食神格)':['편인(偏印)'],
    '상관격(傷官格)':['정관(正官)'],
    '정인격(正印格)':['재성'],
    '편인격(偏印格)':['식신(食神)'],
    '건록격(建祿格)':[],
    '양인격(羊刃格)':[],
  };
  const gyukYongsin = {
    '정관격(正官格)':['정관(正官)','정재(正財)','편재(偏財)'],
    '편관격(偏官格)':['식신(食神)'],
    '정재격(正財格)':['정관(正官)','식신(食神)'],
    '편재격(偏財格)':['식신(食神)','상관(傷官)'],
    '식신격(食神格)':['편재(偏財)','정재(正財)'],
    '상관격(傷官格)':['정재(正財)','편재(偏財)','정인(正印)'],
    '정인격(正印格)':['정관(正官)','편관(偏官)'],
    '편인격(偏印格)':['정재(正財)','편재(偏財)'],
    '건록격(建祿格)':['정관(正官)','편관(偏官)','정재(正財)','식신(食神)'],
    '양인격(羊刃格)':['편관(偏官)','정관(正官)'],
  };

  const kishinList = gyukKishin[gyukName] ?? [];
  const yongsinList = gyukYongsin[gyukName] ?? [];
  const allSipsung = [];
  for (const gan of chungganList) {
    if (gan) allSipsung.push(chungganSipsung(ilgan, gan));
  }
  for (const jiji of jijiList) {
    if (jiji) {
      for (const item of jijiSipsung(ilgan, jiji)) allSipsung.push(item.십성);
    }
  }

  const foundKishin = kishinList.filter(ks => allSipsung.some(ss => ss.includes(ks)));
  const foundYongsin = yongsinList.filter(ys => allSipsung.some(ss => ss.includes(ys)));

  let judgment, explanation, level;
  if (foundKishin.length && !foundYongsin.length) {
    judgment = '파격(破格)'; level = '하격(下格)';
    explanation = `기신 ${foundKishin.join(', ')} 존재, 용신 없음 — 격이 손상됨`;
  } else if (foundKishin.length && foundYongsin.length) {
    judgment = '반성반파(半成半破)'; level = '중격(中格)';
    explanation = `기신 ${foundKishin.join(', ')} 있으나 용신 ${foundYongsin.join(', ')}이 제어 — 중간 수준`;
  } else if (!foundKishin.length && foundYongsin.length) {
    judgment = '성격(成格)'; level = '상격(上格)';
    explanation = `용신 ${foundYongsin.join(', ')} 온전, 기신 없음 — 격이 완성됨`;
  } else {
    judgment = '평격(平格)'; level = '중격(中格)';
    explanation = '용신·기신 모두 미약 — 평범한 격';
  }
  return { 성파격:judgment, 등급:level, 발견기신:foundKishin, 발견용신:foundYongsin, 원국십성목록:[...new Set(allSipsung)], 설명:explanation };
}

export function judgeOegyuk(ilgan, chungganList, jijiList) {
  const ilStrength = calculateIlganStrength(ilgan, jijiList);
  const ohengPower = analyzeOhengPower(chungganList, jijiList);
  const ilganOheng = CHUNGGAN_OHENG[ilgan];
  const ilganScore = ohengPower.오행점수[ilganOheng] ?? 0;
  const total = Object.values(ohengPower.오행점수).reduce((a,b)=>a+b,0) || 1;
  const ilganRatio = ilganScore / total;

  if (ilganRatio >= 0.6) {
    return {
      외격:'종강격(從强格)',
      설명:`일간 ${ilgan}(${ilganOheng}) 오행이 ${(ilganRatio*100).toFixed(0)}%로 압도 — 종강격`,
      용신:`${ilganOheng} 오행 전체 (비겁·인성)`,
      기신:`${ilganOheng}을 극하는 오행`,
    };
  }
  const saengOheng = OHENG_SAENG[ilganOheng] ?? '';
  const saengScore = ohengPower.오행점수[saengOheng] ?? 0;
  if (saengScore / total >= 0.5 && ilganScore / total <= 0.15) {
    return {
      외격:'종아격(從兒格)',
      설명:`식상 오행 ${saengOheng}이 ${(saengScore/total*100).toFixed(0)}%로 압도, 일간 약 — 종아격`,
      용신:`${saengOheng} 오행`, 기신:'인성·비겁 (종아 방해)',
    };
  }
  const geukOheng = OHENG_GEUK[ilganOheng] ?? '';
  const geukScore = ohengPower.오행점수[geukOheng] ?? 0;
  if (geukScore / total >= 0.5 && ilganScore / total <= 0.15) {
    return {
      외격:'종재격(從財格)',
      설명:`재성 오행 ${geukOheng}이 ${(geukScore/total*100).toFixed(0)}%로 압도 — 종재격`,
      용신:`${geukOheng} 오행`, 기신:'비겁 (재를 쟁탈)',
    };
  }
  return null;
}

export function fullGyukAnalysis(ilgan, wolji, chungganList, jijiList) {
  const oegyuk = judgeOegyuk(ilgan, chungganList, jijiList);
  const gyukResult = judgeGyukguk(ilgan, wolji, chungganList);
  const gyukName = gyukResult.격국;
  const sungPa = judgeSungyuk(gyukName, ilgan, chungganList, jijiList);
  let jonghap;
  if (oegyuk) {
    jonghap = `【외격】${oegyuk.외격} — ${oegyuk.설명}\n용신: ${oegyuk.용신} | 기신: ${oegyuk.기신}`;
  } else {
    jonghap = `【내격】${gyukName} (${sungPa.성파격}/${sungPa.등급})\n판별근거: ${gyukResult.판별근거}\n${sungPa.설명}`;
  }
  return { 격국판별:gyukResult, 성파격:sungPa, 외격여부:oegyuk, 종합판단:jonghap };
}
