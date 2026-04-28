// wolun_ilun.js — 세운(年運) · 월운(月運) · 일운(日運) 분석

import { calculateIlganStrength } from './sinsul.js';
import { analyzeSegunAlone, getSegunGanjji } from './segun_linker.js';

const CHUNGGAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const JIJI     = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const GANJJI_60 = Array.from({length:60}, (_,i) => CHUNGGAN[i%10] + JIJI[i%12]);

// ── 월 간지 계산 (세운 천간 × 절기 지지) ─────────────────────────────────
// 甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲 (寅月 기준)
function getMonthGanjji(segunGanjji, jijiIdx) {
  const yStemIdx = CHUNGGAN.indexOf(segunGanjji[0]);
  const bases    = [2, 4, 6, 8, 0];
  const offset   = (jijiIdx - 2 + 12) % 12;
  return CHUNGGAN[(bases[yStemIdx % 5] + offset) % 10] + JIJI[jijiIdx];
}

// ── 일 간지 계산 (1900-01-01 = 甲戌, index 10) ────────────────────────────
function getDayGanjji(year, month, day) {
  const ref  = new Date(1900, 0, 1);
  const days = Math.round((new Date(year, month - 1, day) - ref) / 86400000);
  return GANJJI_60[((10 + days) % 60 + 60) % 60];
}

// ── 공통 분석 래퍼 ─────────────────────────────────────────────────────────
// analyzeSegunAlone 재사용: 세운 자리에 월/일 간지를 넣어 동일 로직으로 분석
function analyzeGanjji(ganjji, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, isSinkang) {
  return analyzeSegunAlone(ganjji, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, isSinkang);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  세운 분석 (연도 범위)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function analyzeSegunList(startYear, endYear, ilgan, wolji, wonkukGans, wonkukJijis, gyukName) {
  const isSinkang = calculateIlganStrength(ilgan, wonkukJijis).총강도 >= 45;
  const results = [];
  for (let year = startYear; year <= endYear; year++) {
    const gj = getSegunGanjji(year);
    const r  = analyzeGanjji(gj, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, isSinkang);
    results.push({
      연도: year,
      간지: gj,
      천간십성: r.천간십성,
      지지십성: r.지지십성,
      점수: r.점수,
      길흉: r.길흉,
      특별사건: r.특별사건 ?? [],
    });
  }
  return results;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  월운 분석 (해당 세운연도 12개 사주월)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 사주 월은 寅月(2월 입춘)부터 丑月(다음해 1월 소한)까지 12개
const MONTH_DEFS = [
  { label:'2월',  jijiIdx:2,  solarMonth:2  },
  { label:'3월',  jijiIdx:3,  solarMonth:3  },
  { label:'4월',  jijiIdx:4,  solarMonth:4  },
  { label:'5월',  jijiIdx:5,  solarMonth:5  },
  { label:'6월',  jijiIdx:6,  solarMonth:6  },
  { label:'7월',  jijiIdx:7,  solarMonth:7  },
  { label:'8월',  jijiIdx:8,  solarMonth:8  },
  { label:'9월',  jijiIdx:9,  solarMonth:9  },
  { label:'10월', jijiIdx:10, solarMonth:10 },
  { label:'11월', jijiIdx:11, solarMonth:11 },
  { label:'12월', jijiIdx:0,  solarMonth:12 },
  { label:'1월',  jijiIdx:1,  solarMonth:1  }, // 다음해 소한~입춘
];

export function analyzeWolunOfYear(year, ilgan, wolji, wonkukGans, wonkukJijis, gyukName) {
  const isSinkang  = calculateIlganStrength(ilgan, wonkukJijis).총강도 >= 45;
  const segunGanjji = getSegunGanjji(year);

  return MONTH_DEFS.map(({ label, jijiIdx, solarMonth }) => {
    const monthGj = getMonthGanjji(segunGanjji, jijiIdx);
    const r = analyzeGanjji(monthGj, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, isSinkang);
    return {
      월: label,
      solarMonth,
      간지: monthGj,
      천간십성: r.천간십성,
      지지십성: r.지지십성,
      점수: r.점수,
      길흉: r.길흉,
      특별사건: r.특별사건 ?? [],
    };
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  일운 분석 (해당 연월의 전체 일수)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function analyzeIlunOfMonth(year, month, ilgan, wolji, wonkukGans, wonkukJijis, gyukName) {
  const isSinkang  = calculateIlganStrength(ilgan, wonkukJijis).총강도 >= 45;
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day   = i + 1;
    const dayGj = getDayGanjji(year, month, day);
    const r     = analyzeGanjji(dayGj, ilgan, wolji, wonkukGans, wonkukJijis, gyukName, isSinkang);
    return {
      날짜: `${month}/${day}`,
      day,
      간지: dayGj,
      천간십성: r.천간십성,
      지지십성: r.지지십성,
      점수: r.점수,
      길흉: r.길흉,
      특별사건: r.특별사건 ?? [],
    };
  });
}
