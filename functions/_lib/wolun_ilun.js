// wolun_ilun.js — 세운(年運) · 월운(月運) · 일운(日運) · 복음(伏吟) · 반음(返吟) 분석

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  복음(伏吟) · 반음(返吟) 판별
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
//  복음(伏吟): 대운·세운 간지가 원국의 어떤 주(柱)와 같을 때
//             → 해당 기운 과잉 중복, 집착·정체·반복
//
//  반음(返吟): 대운·세운 간지가 원국의 어떤 주(柱)와 충(冲)할 때
//             → 급격한 변화·충격·전환, 이별·이동·손재
//
//  강도 기준:
//    ★★★ 강 — 일주·월주와 겹치거나 충 (격의 뿌리 또는 일간 본체)
//    ★★  중 — 연주·시주와 겹치거나 충

const CHUNGGAN_CHUNG_MAP = {
  '甲':'庚','庚':'甲','乙':'辛','辛':'乙',
  '丙':'壬','壬':'丙','丁':'癸','癸':'丁',
};
const JIJI_CHUNG_MAP = {
  '子':'午','午':'子','丑':'未','未':'丑',
  '寅':'申','申':'寅','卯':'酉','酉':'卯',
  '辰':'戌','戌':'辰','巳':'亥','亥':'巳',
};
const PILLAR_NAMES = ['연주','월주','일주','시주'];

/**
 * @param {string} targetGanjji  — 대운 or 세운 간지 (2글자)
 * @param {string[]} wonkukGans  — 원국 천간 4개 [연간, 월간, 일간, 시간]
 * @param {string[]} wonkukJijis — 원국 지지 4개 [연지, 월지, 일지, 시지]
 * @returns {{ 종류, 대상, 해석, 강도, 유형 }[]}
 */
export function checkBokyumBanyum(targetGanjji, wonkukGans, wonkukJijis) {
  const tGan = targetGanjji[0];
  const tJi  = targetGanjji[1];
  const found = [];

  // ── 천간 복음 ──────────────────────────────────────────────────────────
  wonkukGans.forEach((g, i) => {
    if (!g || g !== tGan) return;
    found.push({
      유형:  '복음',
      종류:  '천간복음 (天干伏吟)',
      대상:  `${PILLAR_NAMES[i]} ${g}`,
      강도:  i === 2 ? '★★★ 강' : '★★ 중',
      해석:  `${tGan} 천간이 원국 ${PILLAR_NAMES[i]}와 겹칩니다. ` +
             `해당 십성의 기운이 과도하게 쌓여 집착·정체·반복 상황이 나타날 수 있습니다. ` +
             (i === 2 ? '일간 자체와 겹치므로 자아·건강에도 영향을 줍니다.' :
              i === 1 ? '격국(格局)의 용신 구조에 영향을 미칩니다.' : ''),
    });
  });

  // ── 지지 복음 ──────────────────────────────────────────────────────────
  wonkukJijis.forEach((j, i) => {
    if (!j || j !== tJi) return;
    found.push({
      유형:  '복음',
      종류:  '지지복음 (地支伏吟)',
      대상:  `${PILLAR_NAMES[i]} ${j}`,
      강도:  (i === 1 || i === 2) ? '★★★ 강' : '★★ 중',
      해석:  `${tJi} 지지가 원국 ${PILLAR_NAMES[i]}와 같습니다. ` +
             `같은 에너지가 눌려 반복되며 변화가 막히는 시기입니다. ` +
             (i === 1 ? '월지(格의 뿌리)와 겹쳐 직업·신분 변화가 제한됩니다.' :
              i === 2 ? '일지와 겹쳐 건강·배우자 관계가 정체되는 경향이 있습니다.' : ''),
    });
  });

  // ── 천간 반음 ──────────────────────────────────────────────────────────
  const tGanChung = CHUNGGAN_CHUNG_MAP[tGan];
  if (tGanChung) {
    wonkukGans.forEach((g, i) => {
      if (!g || g !== tGanChung) return;
      found.push({
        유형:  '반음',
        종류:  '천간반음 (天干返吟)',
        대상:  `${PILLAR_NAMES[i]} ${g}`,
        강도:  i === 2 ? '★★★ 강' : '★★ 중',
        해석:  `${tGan}이 원국 ${PILLAR_NAMES[i]} ${g}과 충(冲)합니다. ` +
               `해당 십성이 관장하는 분야에서 급격한 갈등·이별·전환이 발생할 수 있습니다. ` +
               (i === 2 ? '일간을 직접 충격하므로 건강·의지력에 큰 부담이 옵니다.' : ''),
      });
    });
  }

  // ── 지지 반음 ──────────────────────────────────────────────────────────
  const tJiChung = JIJI_CHUNG_MAP[tJi];
  if (tJiChung) {
    wonkukJijis.forEach((j, i) => {
      if (!j || j !== tJiChung) return;
      found.push({
        유형:  '반음',
        종류:  '지지반음 (地支返吟)',
        대상:  `${PILLAR_NAMES[i]} ${j}`,
        강도:  (i === 1 || i === 2) ? '★★★ 강' : '★★ 중',
        해석:  i === 1
          ? `${tJi}가 월지(格의 뿌리) ${j}를 충합니다. 직업·신분·격국이 근본적으로 흔들리는 시기로, 이직·이사·신분 변동이 강하게 일어납니다.`
          : i === 2
          ? `${tJi}가 일지 ${j}를 충합니다. 건강·배우자·거주지에 급격한 변화가 예상되며 주의가 필요합니다.`
          : `${tJi}가 ${PILLAR_NAMES[i]} ${j}를 충합니다. 관련 분야에서 급격한 변동이 발생합니다.`,
      });
    });
  }

  return found;
}
