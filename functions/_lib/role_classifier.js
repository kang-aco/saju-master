// role_classifier.js — 대운·세운 역할 분류 (JS 변환)

import { CHUNGGAN_OHENG, JIJI_OHENG, JANGGAN, OHENG_SAENG, OHENG_GEUK } from './tables.js';
import { chungganSipsung } from './relations.js';

export const GYUK_ROLE_MAP = {
  '정관격(正官格)': { 용신:['정관','정재','편재'], 희신:['편재','정재'], 기신:['상관'], 구신:['편인','정인'] },
  '편관격(偏官格)': { 용신:['식신'], 희신:['편인','정인'], 기신:['정재','편재'], 구신:['상관'] },
  '정재격(正財格)': { 용신:['정관','편관'], 희신:['식신','상관'], 기신:['비견','겁재'], 구신:['편인','정인'] },
  '편재격(偏財格)': { 용신:['식신','상관'], 희신:['정관','편관'], 기신:['비견','겁재'], 구신:['편인','정인'] },
  '식신격(食神格)': { 용신:['정재','편재'], 희신:['정관','편관'], 기신:['편인'], 구신:['편관'] },
  '상관격(傷官格)': { 용신:['정재','편재'], 희신:['편인','정인'], 기신:['정관','편관'], 구신:['비견','겁재'] },
  '정인격(正印格)': { 용신:['정관','편관'], 희신:['정재','편재'], 기신:['정재','편재'], 구신:['식신','상관'] },
  '편인격(偏印格)': { 용신:['정재','편재'], 희신:['정관','편관'], 기신:['식신'], 구신:['상관'] },
  '건록격(建祿格)': { 용신:['정관','편관','정재','편재','식신','상관'], 희신:['정재','편재'], 기신:['비견','겁재'], 구신:['편인','정인'] },
  '양인격(羊刃格)': { 용신:['편관'], 희신:['정관','정재','편재'], 기신:['비견','겁재'], 구신:['식신','상관'] },
};

function getEokbuRoleMap(ilgan, isSinkang) {
  const ilOh = CHUNGGAN_OHENG[ilgan];
  let geukMeOh = null;
  for (const [oh, target] of Object.entries(OHENG_GEUK)) {
    if (target === ilOh) { geukMeOh = oh; break; }
  }
  const saengByMeOh = OHENG_SAENG[ilOh];
  const geukByMeOh = OHENG_GEUK[ilOh];
  let saengMeOh = null;
  for (const [oh, target] of Object.entries(OHENG_SAENG)) {
    if (target === ilOh) { saengMeOh = oh; break; }
  }
  if (isSinkang) {
    return { 용신_오행:[geukMeOh], 희신_오행:[saengByMeOh, geukByMeOh], 기신_오행:[saengMeOh], 구신_오행:[ilOh] };
  } else {
    return { 용신_오행:[saengMeOh], 희신_오행:[ilOh], 기신_오행:[geukMeOh], 구신_오행:[geukByMeOh] };
  }
}

export function classifyRole(targetChar, ilgan, gyukName, isSinkang, isJiji = false) {
  if (!targetChar) return {};
  let oheng, sipsung;
  if (isJiji) {
    oheng = JIJI_OHENG[targetChar] ?? '';
    const jgList = JANGGAN[targetChar] ?? [];
    const junggiEntry = jgList.find(([,s]) => s === '정기');
    const junggiGan = junggiEntry?.[0] ?? '';
    sipsung = junggiGan ? chungganSipsung(ilgan, junggiGan) : '불명';
  } else {
    oheng = CHUNGGAN_OHENG[targetChar] ?? '';
    sipsung = chungganSipsung(ilgan, targetChar);
  }
  const ssCode = sipsung.includes('(') ? sipsung.split('(')[0] : sipsung;

  const gyukRoles = GYUK_ROLE_MAP[gyukName];
  let role, score;
  if (gyukRoles) {
    if (gyukRoles.용신.includes(ssCode))      { role = '용신(用神)'; score = +3; }
    else if (gyukRoles.희신.includes(ssCode)) { role = '희신(喜神)'; score = +2; }
    else if (gyukRoles.기신.includes(ssCode)) { role = '기신(忌神)'; score = -3; }
    else if (gyukRoles.구신.includes(ssCode)) { role = '구신(仇神)'; score = -4; }
    else                                       { role = '한신(閑神)'; score =  0; }
  } else {
    const eokbu = getEokbuRoleMap(ilgan, isSinkang);
    if (eokbu.용신_오행.includes(oheng))      { role = '용신(用神)'; score = +3; }
    else if (eokbu.희신_오행.includes(oheng)) { role = '희신(喜神)'; score = +2; }
    else if (eokbu.기신_오행.includes(oheng)) { role = '기신(忌神)'; score = -3; }
    else if (eokbu.구신_오행.includes(oheng)) { role = '구신(仇神)'; score = -4; }
    else                                       { role = '한신(閑神)'; score =  0; }
  }
  return { 글자:targetChar, 오행:oheng, 십성:sipsung, 역할:role, 점수:score, 분류:`${role} — ${ssCode}(${oheng})` };
}
