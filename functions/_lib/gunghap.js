// gunghap.js — 두 사람 사주 궁합(宮合) 종합 분석 엔진
//
// 분석 차원 (총 7개):
//   ① 일주 천간 관계   — 합·충·생극
//   ② 일주 지지 관계   — 합·충·원진·귀문
//   ③ 일간 교차 십성   — A→B, B→A 십성 (성격 보완)
//   ④ 일지 암합 교차   — 지장간 암합 (숨겨진 끌림)
//   ⑤ 오행 보완        — A의 부족을 B가 채우는가
//   ⑥ 전체 지지 교차   — 4×4 = 16조합
//   ⑦ 띠(年支) 궁합    — 삼합·육합·충

import {
  CHUNGGAN_OHENG, JIJI_OHENG, JANGGAN,
  CHUNGGAN_HAP, CHUNGGAN_HAP_HWA, CHUNGGAN_CHUNG,
  YUKHAP, YUKCHUNG, WONJIN, GWIMUN, SAMHAP, pairKey
} from './tables.js';
import { chungganSipsung, analyzeJijiRelation, analyzeChungganRelation } from './relations.js';
import { analyzeOhengPower } from './sinsul.js';

// ── 유틸 ────────────────────────────────────────────────────────────────
function getJonggi(jiji) {
  const found = (JANGGAN[jiji] || []).find(([, s]) => s === '정기');
  return found ? found[0] : null;
}

function gradeFromScore(score) {
  if (score >= 60) return { 등급: '천생연분 (天生緣分)', 색상: 'gold',  요약: '극상의 길합. 서로의 부족함을 채우며 깊이 있는 조화를 이루는 인연.' };
  if (score >= 35) return { 등급: '대길합 (大吉合)',     색상: 'green', 요약: '매우 좋은 궁합. 함께하면 발전과 안정을 동시에 누리는 관계.' };
  if (score >= 15) return { 등급: '길합 (吉合)',         색상: 'blue',  요약: '서로에게 도움이 되는 관계. 작은 갈등은 있으나 극복 가능.' };
  if (score >= -5) return { 등급: '평합 (平合)',         색상: 'gray',  요약: '평범한 관계. 노력 여하에 따라 좋아질 수도, 멀어질 수도 있음.' };
  if (score >= -25)return { 등급: '주의 (注意)',         색상: 'orange',요약: '갈등 요소가 많은 관계. 깊은 이해와 양보가 필요.' };
  return             { 등급: '충돌 (衝突)',         색상: 'red',   요약: '근본적인 충돌이 강한 관계. 함께하려면 큰 인내와 노력이 요구됨.' };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ① 일주 천간 관계
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function analyzeIljuGan(ganA, ganB) {
  const result = { 점수: 0, 이벤트: [] };
  if (CHUNGGAN_HAP[ganA] === ganB) {
    const hwa = CHUNGGAN_HAP_HWA[pairKey(ganA, ganB)] ?? '';
    result.점수 += 12;
    result.이벤트.push({
      종류: '일간 천간합 (天干合)',
      효과: '+12',
      설명: `${ganA}·${ganB} 합화${hwa} — 두 사람의 일간이 합을 이룹니다. 강한 끌림과 정신적 결합, 운명적 인연의 표상입니다.`,
      길흉: '★★★ 대길',
    });
  }
  if (CHUNGGAN_CHUNG[ganA] === ganB) {
    result.점수 -= 10;
    result.이벤트.push({
      종류: '일간 천간충 (天干冲)',
      효과: '-10',
      설명: `${ganA}·${ganB} 충 — 가치관·신념의 정면 충돌이 잦습니다. 자존심 대결, 의견 대립이 자주 발생합니다.`,
      길흉: '⛔ 주의',
    });
  }
  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ② 일주 지지 관계 (배우자궁 ↔ 배우자궁)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function analyzeIljuJi(jiA, jiB) {
  const result = { 점수: 0, 이벤트: [] };
  if (jiA === jiB) {
    result.점수 += 5;
    result.이벤트.push({ 종류: '일지 동합 (同合)', 효과: '+5', 설명: `같은 일지 ${jiA} — 비슷한 성향과 가치관, 동지적 유대.`, 길흉: '○ 길' });
  }
  if (YUKHAP[jiA] === jiB) {
    result.점수 += 10;
    result.이벤트.push({ 종류: '일지 육합 (六合)', 효과: '+10', 설명: `${jiA}·${jiB} 육합 — 배우자궁 직접 결합. 깊은 정서적 안정과 화합, 부부 인연의 핵심.`, 길흉: '★★★ 대길' });
  }
  if (YUKCHUNG[jiA] === jiB) {
    result.점수 -= 12;
    result.이벤트.push({ 종류: '일지 충 (冲)', 효과: '-12', 설명: `${jiA}·${jiB} 일지충 — 배우자궁 정면 충돌. 거주지 변동·이별·갈등 빈발. 가장 주의할 흉합.`, 길흉: '⛔ 대흉' });
  }
  if (WONJIN[jiA] === jiB) {
    result.점수 -= 8;
    result.이벤트.push({ 종류: '일지 원진 (怨嗔)', 효과: '-8', 설명: `${jiA}·${jiB} 원진 — 이유 없이 거슬리고 미워지는 관계. 사소한 일에도 자주 다툼.`, 길흉: '🔻 주의' });
  }
  if (GWIMUN[jiA] === jiB) {
    result.점수 -= 4;
    result.이벤트.push({ 종류: '일지 귀문 (鬼門)', 효과: '-4', 설명: `${jiA}·${jiB} 귀문 — 신비롭고 강렬한 끌림. 정신적·영적 교감은 깊으나 신경 과민과 집착이 위험.`, 길흉: '⚠ 양면' });
  }
  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ③ 일간 교차 십성 (성격 보완)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function analyzeIlganSipsung(ilganA, genderA, ilganB, genderB) {
  const result = { 점수: 0, 이벤트: [] };
  // A 입장에서 B 일간이 어떤 십성인가
  const ssAtoB = chungganSipsung(ilganA, ilganB);
  const ssBtoA = chungganSipsung(ilganB, ilganA);

  const goodForLove = ['정관','편관','정재','편재','정인'];
  const cautionForLove = ['겁재','상관','편인'];

  // A의 배우자 십성 (남=재성, 여=관성) 체크
  const expectedForA = (genderA === '남') ? ['정재','편재'] : ['정관','편관'];
  const expectedForB = (genderB === '남') ? ['정재','편재'] : ['정관','편관'];

  if (expectedForA.includes(ssAtoB)) {
    result.점수 += 10;
    result.이벤트.push({
      종류: 'A의 배우자 십성 적중',
      효과: '+10',
      설명: `B의 일간(${ilganB})이 A에게 ${ssAtoB} — A의 ${genderA === '남' ? '아내' : '남편'} 자리에 정확히 들어맞는 인연.`,
      길흉: '★★ 길',
    });
  } else if (goodForLove.includes(ssAtoB)) {
    result.점수 += 4;
    result.이벤트.push({ 종류: 'A→B 길성 십성', 효과: '+4', 설명: `B의 일간이 A에게 ${ssAtoB} — 좋은 영향을 주는 관계.`, 길흉: '○ 길' });
  } else if (cautionForLove.includes(ssAtoB)) {
    result.점수 -= 3;
    result.이벤트.push({ 종류: 'A→B 흉성 십성', 효과: '-3', 설명: `B의 일간이 A에게 ${ssAtoB} — 갈등·손재 가능성.`, 길흉: '🔻 주의' });
  }

  if (expectedForB.includes(ssBtoA)) {
    result.점수 += 10;
    result.이벤트.push({
      종류: 'B의 배우자 십성 적중',
      효과: '+10',
      설명: `A의 일간(${ilganA})이 B에게 ${ssBtoA} — B의 ${genderB === '남' ? '아내' : '남편'} 자리에 정확히 들어맞는 인연.`,
      길흉: '★★ 길',
    });
  } else if (goodForLove.includes(ssBtoA)) {
    result.점수 += 4;
    result.이벤트.push({ 종류: 'B→A 길성 십성', 효과: '+4', 설명: `A의 일간이 B에게 ${ssBtoA} — 좋은 영향을 주는 관계.`, 길흉: '○ 길' });
  } else if (cautionForLove.includes(ssBtoA)) {
    result.점수 -= 3;
    result.이벤트.push({ 종류: 'B→A 흉성 십성', 효과: '-3', 설명: `A의 일간이 B에게 ${ssBtoA} — 갈등·손재 가능성.`, 길흉: '🔻 주의' });
  }

  return { ...result, AtoB: ssAtoB, BtoA: ssBtoA };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ④ 일지 암합 교차 (지장간 정기끼리의 합)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function analyzeIljiAmhap(ilganA, iljiA, ilganB, iljiB) {
  const result = { 점수: 0, 이벤트: [] };

  // A의 일간 ↔ B의 일지 정기
  const jonggiB = getJonggi(iljiB);
  if (jonggiB && CHUNGGAN_HAP[ilganA] === jonggiB) {
    result.점수 += 7;
    result.이벤트.push({
      종류: '암합 (A일간 ↔ B일지)',
      효과: '+7',
      설명: `A의 ${ilganA}이 B의 일지 ${iljiB}(지장간 ${jonggiB})와 암합 — 드러나지 않는 깊은 끌림. 은밀한 인연.`,
      길흉: '♥ 끌림',
    });
  }
  // B의 일간 ↔ A의 일지 정기
  const jonggiA = getJonggi(iljiA);
  if (jonggiA && CHUNGGAN_HAP[ilganB] === jonggiA) {
    result.점수 += 7;
    result.이벤트.push({
      종류: '암합 (B일간 ↔ A일지)',
      효과: '+7',
      설명: `B의 ${ilganB}이 A의 일지 ${iljiA}(지장간 ${jonggiA})와 암합 — 드러나지 않는 깊은 끌림. 은밀한 인연.`,
      길흉: '♥ 끌림',
    });
  }
  // 두 일지 정기끼리 합
  if (jonggiA && jonggiB && CHUNGGAN_HAP[jonggiA] === jonggiB) {
    result.점수 += 5;
    result.이벤트.push({
      종류: '지지암합 (일지 ↔ 일지)',
      효과: '+5',
      설명: `A·B 일지의 지장간(${jonggiA}·${jonggiB})끼리 암합 — 무의식적 끌림과 운명적 친밀감.`,
      길흉: '♥ 끌림',
    });
  }

  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⑤ 오행 보완 (서로의 부족 오행을 채워주는가)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function analyzeOhengComplement(personA, personB) {
  const result = { 점수: 0, 이벤트: [], 보완내역: [] };
  const ohA = analyzeOhengPower(personA.chungganList, personA.jijiList);
  const ohB = analyzeOhengPower(personB.chungganList, personB.jijiList);

  // A가 부족한 오행을 B가 가졌는가
  for (const lack of ohA.부족오행) {
    if ((ohB.오행비율[lack] ?? 0) >= 15) {
      result.점수 += 5;
      result.보완내역.push(`B가 A의 부족 오행 ${lack}을(를) 채워줍니다.`);
    }
  }
  for (const lack of ohB.부족오행) {
    if ((ohA.오행비율[lack] ?? 0) >= 15) {
      result.점수 += 5;
      result.보완내역.push(`A가 B의 부족 오행 ${lack}을(를) 채워줍니다.`);
    }
  }

  // 둘 다 같은 오행이 과다하면 -
  for (const oh of ohA.과다오행) {
    if (ohB.과다오행.includes(oh)) {
      result.점수 -= 4;
      result.보완내역.push(`A·B 모두 ${oh} 과다 — 같은 단점이 증폭될 위험.`);
    }
  }

  if (result.보완내역.length > 0) {
    result.이벤트.push({
      종류: '오행 보완',
      효과: result.점수 >= 0 ? `+${result.점수}` : `${result.점수}`,
      설명: result.보완내역.join(' '),
      길흉: result.점수 > 0 ? '○ 길' : result.점수 < 0 ? '🔻 주의' : '',
    });
  }
  return { ...result, A오행: ohA.오행비율, B오행: ohB.오행비율 };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⑥ 전체 지지 4×4 교차
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function analyzeAllJijiCross(jijiA, jijiB) {
  const PILLARS = ['연지','월지','일지','시지'];
  const result = { 점수: 0, 이벤트: [], 카운트: { 합:0, 충:0, 형:0, 원진:0, 귀문:0 } };

  for (let i = 0; i < jijiA.length; i++) {
    for (let j = 0; j < jijiB.length; j++) {
      const a = jijiA[i], b = jijiB[j];
      if (!a || !b) continue;
      if (a === b) continue;

      if (YUKHAP[a] === b) {
        result.점수 += 3; result.카운트.합++;
        result.이벤트.push({ 종류: `${PILLARS[i]}↔${PILLARS[j]} 육합`, 글자:`${a}·${b}`, 효과:'+3', 길흉:'○ 길' });
      }
      if (YUKCHUNG[a] === b) {
        result.점수 -= 4; result.카운트.충++;
        result.이벤트.push({ 종류: `${PILLARS[i]}↔${PILLARS[j]} 충`, 글자:`${a}·${b}`, 효과:'-4', 길흉:'⛔ 흉' });
      }
      if (WONJIN[a] === b) {
        result.점수 -= 3; result.카운트.원진++;
        result.이벤트.push({ 종류: `${PILLARS[i]}↔${PILLARS[j]} 원진`, 글자:`${a}·${b}`, 효과:'-3', 길흉:'🔻 주의' });
      }
      if (GWIMUN[a] === b) {
        result.카운트.귀문++;
        // 점수 영향 미미 (귀문은 양면적)
        result.이벤트.push({ 종류: `${PILLARS[i]}↔${PILLARS[j]} 귀문`, 글자:`${a}·${b}`, 효과:'0', 길흉:'⚠ 양면' });
      }
    }
  }
  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⑦ 띠 궁합 (年支)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function analyzeTtiCompat(yunjiA, yunjiB) {
  const result = { 점수: 0, 이벤트: [] };
  if (!yunjiA || !yunjiB) return result;

  // 삼합 그룹 동일 여부
  for (const { chars, oheng, name } of SAMHAP) {
    if (chars.has(yunjiA) && chars.has(yunjiB) && yunjiA !== yunjiB) {
      result.점수 += 6;
      result.이벤트.push({ 종류:'띠 삼합 (三合)', 효과:'+6', 설명:`${yunjiA}·${yunjiB} ${name} — 띠가 삼합을 이루어 사회적 협력 좋음.`, 길흉:'○ 길' });
    }
  }
  if (YUKHAP[yunjiA] === yunjiB) {
    result.점수 += 4;
    result.이벤트.push({ 종류:'띠 육합', 효과:'+4', 설명:`${yunjiA}·${yunjiB} 육합 — 띠 단위에서도 화합.`, 길흉:'○ 길' });
  }
  if (YUKCHUNG[yunjiA] === yunjiB) {
    result.점수 -= 5;
    result.이벤트.push({ 종류:'띠 충', 효과:'-5', 설명:`${yunjiA}·${yunjiB} 충 — 전통적으로 "띠가 안 맞는다" 일컫는 조합.`, 길흉:'⛔ 흉' });
  }
  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  메인: 종합 궁합 분석
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/**
 * @param {object} A — { ilgan, ilji, chungganList, jijiList, gender, ilju, name? }
 * @param {object} B — 동일 구조
 */
export function analyzeGunghap(A, B) {
  const ilju    = analyzeIljuGan(A.ilgan, B.ilgan);
  const iljuJi  = analyzeIljuJi(A.ilji, B.ilji);
  const sipsung = analyzeIlganSipsung(A.ilgan, A.gender, B.ilgan, B.gender);
  const amhap   = analyzeIljiAmhap(A.ilgan, A.ilji, B.ilgan, B.ilji);
  const oheng   = analyzeOhengComplement(A, B);
  const cross   = analyzeAllJijiCross(A.jijiList, B.jijiList);
  const tti     = analyzeTtiCompat(A.jijiList[0], B.jijiList[0]);

  const totalScore =
    ilju.점수 + iljuJi.점수 + sipsung.점수 + amhap.점수 +
    oheng.점수 + cross.점수 + tti.점수;

  const grade = gradeFromScore(totalScore);

  // 카테고리별 점수 정리
  const categories = {
    '일주 천간':  { 점수: ilju.점수,    이벤트: ilju.이벤트 },
    '일주 지지':  { 점수: iljuJi.점수,  이벤트: iljuJi.이벤트 },
    '일간 십성':  { 점수: sipsung.점수, 이벤트: sipsung.이벤트, AtoB: sipsung.AtoB, BtoA: sipsung.BtoA },
    '일지 암합':  { 점수: amhap.점수,   이벤트: amhap.이벤트 },
    '오행 보완':  { 점수: oheng.점수,   이벤트: oheng.이벤트, A오행: oheng.A오행, B오행: oheng.B오행 },
    '지지 교차':  { 점수: cross.점수,   이벤트: cross.이벤트, 카운트: cross.카운트 },
    '띠 궁합':    { 점수: tti.점수,     이벤트: tti.이벤트 },
  };

  // 핵심 하이라이트 (점수 영향 ±5 이상 이벤트)
  const highlights = [];
  for (const cat of Object.values(categories)) {
    for (const ev of (cat.이벤트 ?? [])) {
      const eff = parseInt(ev.효과 ?? '0');
      if (Math.abs(eff) >= 5) highlights.push(ev);
    }
  }

  return {
    총점: totalScore,
    등급: grade.등급,
    등급색상: grade.색상,
    등급요약: grade.요약,
    카테고리: categories,
    하이라이트: highlights,
    A_정보: { ilgan: A.ilgan, ilji: A.ilji, ilju: A.ilju, gender: A.gender },
    B_정보: { ilgan: B.ilgan, ilji: B.ilji, ilju: B.ilju, gender: B.gender },
  };
}
