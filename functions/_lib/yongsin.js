// yongsin.js — 용신 도출 (JS 변환)

import { CHUNGGAN_OHENG, JIJI_OHENG, OHENG_SAENG, OHENG_GEUK, OHENG_SAENG_REVERSE, OHENG_GEUK_REVERSE, WOLJI_SEASON, GYUK_YONGSIN_TABLE, JANGGAN } from './tables.js';
import { chungganSipsung } from './relations.js';
import { analyzeOhengPower, calculateIlganStrength } from './sinsul.js';

const JOHU_TABLE = {
  '木_겨울':{ 조후:['火'], 이유:'목이 차가워 火로 온기 필요' },
  '木_여름':{ 조후:['水'], 이유:'목이 건조해 水로 자양 필요' },
  '木_가을':{ 조후:['水','火'], 이유:'숙살의 기운, 水火로 보완' },
  '木_봄':  { 조후:[], 이유:'봄의 목 — 조후 필요 적음' },
  '火_겨울':{ 조후:['木'], 이유:'화기 약화, 木으로 생화 필요' },
  '火_여름':{ 조후:['水'], 이유:'화기 과다, 水로 조절 필요' },
  '火_가을':{ 조후:['木'], 이유:'화기 설기, 木으로 생조' },
  '火_봄':  { 조후:['木'], 이유:'봄의 화 — 木으로 뿌리 강화' },
  '土_겨울':{ 조후:['火'], 이유:'토가 냉습, 火로 건조 필요' },
  '土_여름':{ 조후:['水','木'], 이유:'토가 건조, 水木으로 윤택' },
  '土_가을':{ 조후:['火','木'], 이유:'토가 쇠, 생기 필요' },
  '土_봄':  { 조후:['火'], 이유:'봄의 토 — 火로 따뜻하게' },
  '金_겨울':{ 조후:['火'], 이유:'금이 한랭, 火로 제련 필요' },
  '金_여름':{ 조후:['水'], 이유:'금이 녹을 위험, 水로 냉각' },
  '金_가을':{ 조후:['水','土'], 이유:'가을 금 왕성, 水로 설기' },
  '金_봄':  { 조후:['火','土'], 이유:'금이 약, 火土로 생금' },
  '水_겨울':{ 조후:['火'], 이유:'수가 범람 우려, 火로 조절' },
  '水_여름':{ 조후:['金'], 이유:'수가 부족, 金으로 생수' },
  '水_가을':{ 조후:['戊己'], 이유:'수 범람 우려, 土로 제방' },
  '水_봄':  { 조후:['戊己'], 이유:'봄 수 — 土로 제방 필요' },
};

export function getGyukYongsin(gyukName, ilgan, chungganList, jijiList) {
  let matchedKey = null;
  for (const k of Object.keys(GYUK_YONGSIN_TABLE)) {
    if (k.includes(gyukName.replace(/[()]/g,'').slice(0,2)) || gyukName.includes(k)) {
      matchedKey = k; break;
    }
  }
  if (!matchedKey) {
    return { 용신:'불명', 희신:'불명', 기신:'불명', 구신:'불명', 설명:`${gyukName} 격 용신 테이블 미등록` };
  }
  const base = GYUK_YONGSIN_TABLE[matchedKey];
  const sungyukData = base.성격 ?? base;
  const ohengPower = analyzeOhengPower(chungganList, jijiList);
  const ilStrength = calculateIlganStrength(ilgan, jijiList);
  return {
    격국: gyukName,
    용신: sungyukData.용신 ?? '격국 보호 요소',
    희신: sungyukData.희신 ?? '',
    기신: sungyukData.기신 ?? '',
    구신: sungyukData.구신 ?? '',
    설명: sungyukData.설명 ?? '',
    일간강약: ilStrength.신강신약,
    오행분포: ohengPower.오행비율,
  };
}

export function getEokbuYongsin(ilgan, chungganList, jijiList) {
  const ilStrength = calculateIlganStrength(ilgan, jijiList);
  const ohengPower = analyzeOhengPower(chungganList, jijiList);
  const ilganOheng = CHUNGGAN_OHENG[ilgan];
  const totalScore = ilStrength.총강도;

  if (totalScore >= 60) {
    const geukMe = OHENG_GEUK_REVERSE[ilganOheng] ?? '';
    const saengByMe = OHENG_SAENG[ilganOheng] ?? '';
    const saengMe = OHENG_SAENG_REVERSE[ilganOheng] ?? '';
    return {
      방법:'억부법(抑扶法) — 신강 억제',
      용신:`${geukMe}(관살) — 일간 제어`,
      희신:`${saengByMe}(식상) — 설기(洩氣)`,
      기신:`${saengMe}(인성) — 일간 더 강화 금지`,
      구신:`${ilganOheng}(비겁) — 일간 더 강화 금지`,
      일간강도: totalScore, 신강신약: ilStrength.신강신약, 오행분포: ohengPower.오행비율
    };
  } else {
    const saengMe = OHENG_SAENG_REVERSE[ilganOheng] ?? '';
    const geukMe = OHENG_GEUK_REVERSE[ilganOheng] ?? '';
    return {
      방법:'억부법(抑扶法) — 신약 부조',
      용신:`${saengMe}(인성) — 일간 생조`,
      희신:`${ilganOheng}(비겁) — 일간 도움`,
      기신:`${geukMe}(관살) — 일간 더 약화 금지`,
      구신:`${OHENG_GEUK[ilganOheng]??''}(재성) — 인성 극제 금지`,
      일간강도: totalScore, 신강신약: ilStrength.신강신약, 오행분포: ohengPower.오행비율
    };
  }
}

export function getJohuYongsin(ilgan, wolji) {
  const ilganOheng = CHUNGGAN_OHENG[ilgan];
  const season = WOLJI_SEASON[wolji] ?? '';
  const johuData = JOHU_TABLE[`${ilganOheng}_${season}`];
  if (!johuData) return { 조후용신:[], 설명:'조후 특별 보완 불필요' };
  return {
    계절: season, 월지: wolji, 일간오행: ilganOheng,
    조후용신: johuData.조후,
    이유: johuData.이유,
    설명: `${ilgan}(${ilganOheng}) ${season}생 — ${johuData.이유}`
  };
}

export function fullYongsinAnalysis(ilgan, wolji, gyukName, chungganList, jijiList) {
  const gyukYs = getGyukYongsin(gyukName, ilgan, chungganList, jijiList);
  const eokbuYs = getEokbuYongsin(ilgan, chungganList, jijiList);
  const johuYs = getJohuYongsin(ilgan, wolji);

  const allGans = chungganList.filter(Boolean);
  const yongsinOhengList = allGans.map(gan => ({
    글자: gan, 오행: CHUNGGAN_OHENG[gan], 십성: chungganSipsung(ilgan, gan)
  }));

  const yongsinText = gyukYs.용신 ?? '';
  const gisinText = gyukYs.기신 ?? '';
  const yongsinFound = [];
  const gisinFound = [];
  for (const item of yongsinOhengList) {
    if (!item.십성) continue;
    const ssShort = item.십성.replace(/[()]/g,'');
    if (yongsinText && ssShort.split('').some(c => yongsinText.includes(c))) {
      yongsinFound.push(`${item.글자}(${item.십성})`);
    }
    if (gisinText && ssShort.split('').some(c => gisinText.includes(c))) {
      gisinFound.push(`${item.글자}(${item.십성})`);
    }
  }

  const summaryLines = [
    `▶ 격국: ${gyukName}`,
    `▶ 격국용신: ${gyukYs.용신}`,
    `▶ 기신: ${gyukYs.기신}`,
    `▶ ${eokbuYs.방법}`,
    `  - 억부용신: ${eokbuYs.용신}`,
    `  - 억부기신: ${eokbuYs.기신}`,
  ];
  if (johuYs.조후용신?.length) summaryLines.push(`▶ 조후보완: ${johuYs.설명}`);
  if (yongsinFound.length) summaryLines.push(`▶ 원국 내 용신 글자: ${yongsinFound.join(', ')}`);
  if (gisinFound.length) summaryLines.push(`▶ 원국 내 기신 글자: ${gisinFound.join(', ')}`);

  return {
    격국용신: gyukYs, 억부용신: eokbuYs, 조후용신: johuYs,
    원국내_용신글자: yongsinFound, 원국내_기신글자: gisinFound,
    종합요약: summaryLines.join('\n'),
  };
}
