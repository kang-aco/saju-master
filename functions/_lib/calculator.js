// calculator.js — 대운 계산 (JS 변환)

import { GANJJI_60, GANJJI_INDEX, CHUNGGAN_UMYANG, JEOLGI_APPROX } from './tables.js';

export function judgeSunYeok(birthYear, gender) {
  const chungganList = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const chungganIdx = ((birthYear - 4) % 10 + 10) % 10;
  const yearGan = chungganList[chungganIdx];
  const yearUmyang = CHUNGGAN_UMYANG[yearGan];
  const isYangYear = (yearUmyang === '양');
  const isMale = (gender === '남');
  let direction, reason;
  if (isYangYear && isMale)      { direction='순행(順行)'; reason=`${birthYear}년 천간 ${yearGan}(양년) + 남자 → 순행`; }
  else if (isYangYear && !isMale){ direction='역행(逆行)'; reason=`${birthYear}년 천간 ${yearGan}(양년) + 여자 → 역행`; }
  else if (!isYangYear && isMale){ direction='역행(逆行)'; reason=`${birthYear}년 천간 ${yearGan}(음년) + 남자 → 역행`; }
  else                            { direction='순행(順行)'; reason=`${birthYear}년 천간 ${yearGan}(음년) + 여자 → 순행`; }
  return { 방향:direction, 연간:yearGan, 연도음양:yearUmyang, 성별:gender, 이유:reason, 순행여부:direction==='순행(順行)' };
}

function getJeolgiDate(year, month) {
  const approx = JEOLGI_APPROX[month] ?? [6,7];
  const day = Math.floor((approx[0] + approx[1]) / 2);
  return new Date(year, month - 1, day);
}

function getPrevJeolgiDate(birthDate) {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const currentJeolgi = getJeolgiDate(year, month);
  if (birthDate >= currentJeolgi) return currentJeolgi;
  const prevMonth = month > 1 ? month - 1 : 12;
  const prevYear  = month > 1 ? year : year - 1;
  return getJeolgiDate(prevYear, prevMonth);
}

function getNextJeolgiDate(birthDate) {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const currentJeolgi = getJeolgiDate(year, month);
  if (birthDate < currentJeolgi) return currentJeolgi;
  const nextMonth = month < 12 ? month + 1 : 1;
  const nextYear  = month < 12 ? year : year + 1;
  return getJeolgiDate(nextYear, nextMonth);
}

function daysBetween(d1, d2) {
  return Math.floor(Math.abs(d2 - d1) / 86400000);
}

function calculateDaysToJeolgi(birthDate, isSunhaeng) {
  if (isSunhaeng) {
    const jeolgiDate = getNextJeolgiDate(birthDate);
    return { 날수: daysBetween(birthDate, jeolgiDate), 절기날짜: jeolgiDate, 방향:'다음 절기 (순행)' };
  } else {
    const jeolgiDate = getPrevJeolgiDate(birthDate);
    return { 날수: daysBetween(jeolgiDate, birthDate), 절기날짜: jeolgiDate, 방향:'이전 절기 (역행)' };
  }
}

function calculateStartAge(days) {
  const years = Math.floor(days / 3);
  const remainderDays = days % 3;
  const months = remainderDays * 4;
  return {
    시작나이: Math.max(1, years), 잉여개월: months, 총날수: days,
    계산식: `${days}일 ÷ 3 = ${years}세 ${months}개월`,
    설명: `첫 대운은 만 ${Math.max(1,years)}세 ${months}개월에 시작`
  };
}

function getDaewunSequence(wolju, isSunhaeng, count = 10) {
  if (GANJJI_INDEX[wolju] === undefined) return [];
  const idx = GANJJI_INDEX[wolju];
  const sequence = [];
  for (let i = 1; i <= count; i++) {
    if (isSunhaeng) {
      sequence.push(GANJJI_60[(idx + i) % 60]);
    } else {
      sequence.push(GANJJI_60[((idx - i) % 60 + 60) % 60]);
    }
  }
  return sequence;
}

function buildDaewunList(startAge, daewunGanjjiList) {
  const list = [];
  let currentAge = startAge;
  for (let i = 0; i < daewunGanjjiList.length; i++) {
    const ganjji = daewunGanjjiList[i];
    if (ganjji.length !== 2) continue;
    list.push({
      순번: i + 1, 나이: currentAge, 나이표시: `${currentAge}세`,
      간지: ganjji, 천간: ganjji[0], 지지: ganjji[1],
      전반5년: `${currentAge}~${currentAge+4}세 — ${ganjji[0]}(천간) 위주`,
      후반5년: `${currentAge+5}~${currentAge+9}세 — ${ganjji[1]}(지지) 위주`,
    });
    currentAge += 10;
  }
  return list;
}

export function calculateDaewun(birthYear, birthMonth, birthDay, gender, wolju, count = 10) {
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  const sunYeok = judgeSunYeok(birthYear, gender);
  const isSunhaeng = sunYeok.순행여부;
  const jeolgiInfo = calculateDaysToJeolgi(birthDate, isSunhaeng);
  const days = jeolgiInfo.날수;
  const startInfo = calculateStartAge(days);
  const startAge = startInfo.시작나이;
  const daewunGanjji = getDaewunSequence(wolju, isSunhaeng, count);
  const daewunList = buildDaewunList(startAge, daewunGanjji);

  const jeolgiDateStr = jeolgiInfo.절기날짜 instanceof Date
    ? `${jeolgiInfo.절기날짜.getFullYear()}-${String(jeolgiInfo.절기날짜.getMonth()+1).padStart(2,'0')}-${String(jeolgiInfo.절기날짜.getDate()).padStart(2,'0')}`
    : String(jeolgiInfo.절기날짜);

  return {
    생년월일: `${birthYear}년 ${birthMonth}월 ${birthDay}일`,
    성별: gender, 월주: wolju,
    순역행: sunYeok,
    절기정보: { 방향: jeolgiInfo.방향, 절기날짜: jeolgiDateStr, 날수: days },
    대운시작: startInfo,
    대운목록: daewunList,
    요약: `${birthYear}년생 ${gender}자 (${sunYeok.연간} 천간) → ${sunYeok.방향} | 만 ${startAge}세 ${startInfo.잉여개월}개월에 첫 대운 시작\n대운: ${daewunList.slice(0,5).map(d=>d.간지).join(' → ')} ...`
  };
}

export function getCurrentDaewun(daewunList, currentAge) {
  let current = null;
  for (const dw of daewunList) {
    if (dw.나이 <= currentAge) current = dw;
    else break;
  }
  return current;
}

export function getDaewunByYear(daewunResult, targetYear, birthYear) {
  const currentAge = targetYear - birthYear;
  return getCurrentDaewun(daewunResult.대운목록, currentAge);
}
