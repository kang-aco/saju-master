'use strict';

// ════════════════════════════════════════════
//  만세력 (萬歲曆) — 사주 자동 계산
// ════════════════════════════════════════════

const MR_CHUNGGAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const MR_JIJI     = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// 60간지 배열 생성
const GANJJI_60 = Array.from({length:60}, (_,i) => MR_CHUNGGAN[i%10] + MR_JIJI[i%12]);

// 절기 경계 [양력월, 양력일, 지지인덱스(子=0)]
const JEOLGI_BOUNDS = [
  [1, 6, 1],[2, 4, 2],[3, 6, 3],[4, 5, 4],[5, 6, 5],[6, 6, 6],
  [7, 7, 7],[8, 7, 8],[9, 8, 9],[10,8,10],[11,7,11],[12,7, 0],
];

function getYearPillar(year, month, day) {
  const y = (month < 2 || (month === 2 && day < 4)) ? year - 1 : year;
  return GANJJI_60[((y - 1984) % 60 + 60) % 60];
}

function getMonthJijiIdx(month, day) {
  let result = 0;
  for (const [m, d, j] of JEOLGI_BOUNDS) {
    if (month > m || (month === m && day >= d)) result = j;
  }
  return result;
}

function getMonthPillar(yearGanjji, month, day) {
  const yStemIdx = MR_CHUNGGAN.indexOf(yearGanjji[0]);
  const mJijiIdx = getMonthJijiIdx(month, day);
  const bases    = [2, 4, 6, 8, 0];
  const base     = bases[yStemIdx % 5];
  const offset   = (mJijiIdx - 2 + 12) % 12;
  return MR_CHUNGGAN[(base + offset) % 10] + MR_JIJI[mJijiIdx];
}

function getDayPillar(year, month, day) {
  const ref    = new Date(1900, 0, 1);
  const target = new Date(year, month - 1, day);
  const days   = Math.round((target - ref) / 86400000);
  return GANJJI_60[((10 + days) % 60 + 60) % 60];
}

function getHourPillar(dayGanjji, sijinIdx) {
  const dStemIdx = MR_CHUNGGAN.indexOf(dayGanjji[0]);
  const bases    = [0, 2, 4, 6, 8];
  const hStemIdx = (bases[dStemIdx % 5] + sijinIdx) % 10;
  return MR_CHUNGGAN[hStemIdx] + MR_JIJI[sijinIdx];
}

function calcSajuFromSolar(year, month, day, sijinIdx) {
  const yunju = getYearPillar(year, month, day);
  const wolju = getMonthPillar(yunju, month, day);
  const ilju  = getDayPillar(year, month, day);
  const siju  = sijinIdx >= 0 ? getHourPillar(ilju, sijinIdx) : null;
  return { yunju, wolju, ilju, siju };
}

// ════════════════════════════════════════════
//  음력 → 양력 변환
// ════════════════════════════════════════════

function getLunarLib() {
  // CDN 라이브러리가 로드됐는지 확인
  return window.KoreanLunarCalendar ?? null;
}

// 음력 날짜를 양력으로 변환, 실패 시 null 반환
function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeap) {
  const Lib = getLunarLib();
  if (!Lib) return null;
  try {
    const cal = new Lib();
    cal.setLunarDate(lunarYear, lunarMonth, lunarDay, !!isLeap);
    const s = cal.getSolarCalendar();
    if (!s || !s.year) return null;
    return { year: s.year, month: s.month, day: s.day };
  } catch {
    return null;
  }
}

// ════════════════════════════════════════════
//  UI 상태
// ════════════════════════════════════════════

let calType = 'solar'; // 'solar' | 'lunar'

function setCalType(type) {
  calType = type;

  document.getElementById('btn-solar').classList.toggle('active', type === 'solar');
  document.getElementById('btn-lunar').classList.toggle('active', type === 'lunar');

  // 윤달 체크박스 표시
  document.getElementById('leapRow').classList.toggle('hidden', type === 'solar');

  // 힌트 텍스트
  document.getElementById('calHint').textContent =
    type === 'lunar' ? '음력 날짜를 입력하면 양력으로 자동 변환합니다.' : '';

  // 일수 범위 (음력은 최대 30일)
  if (type === 'lunar') {
    const daySel = document.getElementById('birth_day');
    const prev   = parseInt(daySel.value, 10) || 1;
    daySel.innerHTML = '';
    for (let d = 1; d <= 30; d++) {
      const opt = document.createElement('option');
      opt.value = d; opt.textContent = d + '일';
      daySel.appendChild(opt);
    }
    daySel.value = Math.min(prev, 30);
  } else {
    updateDaySelect();
  }
  updatePreview();
}

// ════════════════════════════════════════════
//  UI 초기화
// ════════════════════════════════════════════

function initSelects() {
  const yearSel = document.getElementById('birth_year');
  const curYear = new Date().getFullYear();
  for (let y = 1920; y <= curYear; y++) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y + '년';
    if (y === 1990) opt.selected = true;
    yearSel.appendChild(opt);
  }

  const monthSel = document.getElementById('birth_month');
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m + '월';
    monthSel.appendChild(opt);
  }

  updateDaySelect();
}

function updateDaySelect() {
  if (calType === 'lunar') return; // 음력은 항상 30일 이하
  const year   = parseInt(document.getElementById('birth_year').value, 10);
  const month  = parseInt(document.getElementById('birth_month').value, 10);
  const daySel = document.getElementById('birth_day');
  const prev   = parseInt(daySel.value, 10) || 1;
  const maxDay = new Date(year, month, 0).getDate();

  daySel.innerHTML = '';
  for (let d = 1; d <= maxDay; d++) {
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = d + '일';
    daySel.appendChild(opt);
  }
  daySel.value = Math.min(prev, maxDay);
  updatePreview();
}

// ── 원국 미리보기 자동 업데이트 ─────────────
function updatePreview() {
  const year     = parseInt(document.getElementById('birth_year').value, 10);
  const month    = parseInt(document.getElementById('birth_month').value, 10);
  const day      = parseInt(document.getElementById('birth_day').value, 10);
  const sijinIdx = parseInt(document.getElementById('birth_hour').value, 10);
  const isLeap   = document.getElementById('isLeapMonth')?.checked ?? false;

  if (!year || !month || !day) return;

  let solarY = year, solarM = month, solarD = day;
  let badgeHtml = '';
  let noteText  = '';

  if (calType === 'lunar') {
    if (!getLunarLib()) {
      document.getElementById('previewNote').textContent =
        '⚠ 음력 변환 라이브러리 로딩 중… 잠시 후 다시 시도하세요.';
      return;
    }
    const conv = lunarToSolar(year, month, day, isLeap);
    if (!conv) {
      document.getElementById('previewNote').textContent =
        '⚠ 유효하지 않은 음력 날짜입니다.';
      clearPillars();
      return;
    }
    solarY = conv.year; solarM = conv.month; solarD = conv.day;
    badgeHtml = `<span class="lunar-badge">음력→양력 ${solarY}.${solarM}.${solarD}</span>`;
  }

  document.getElementById('previewCalBadge').innerHTML = badgeHtml;

  const { yunju, wolju, ilju, siju } = calcSajuFromSolar(solarY, solarM, solarD, sijinIdx);

  document.getElementById('yunju-gan').textContent = yunju[0];
  document.getElementById('yunju-ji').textContent  = yunju[1];
  document.getElementById('wolju-gan').textContent = wolju[0];
  document.getElementById('wolju-ji').textContent  = wolju[1];
  document.getElementById('ilju-gan').textContent  = ilju[0];
  document.getElementById('ilju-ji').textContent   = ilju[1];

  if (siju) {
    document.getElementById('siju-gan').textContent = siju[0];
    document.getElementById('siju-ji').textContent  = siju[1];
  } else {
    document.getElementById('siju-gan').textContent = '?';
    document.getElementById('siju-ji').textContent  = '?';
    noteText = '※ 시주는 태어난 시각을 알아야 계산됩니다.';
  }
  document.getElementById('previewNote').textContent = noteText;
}

function clearPillars() {
  ['yunju','wolju','ilju','siju'].forEach(p => {
    document.getElementById(p+'-gan').textContent = '—';
    document.getElementById(p+'-ji').textContent  = '—';
  });
}

// ════════════════════════════════════════════
//  이벤트 바인딩
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initSelects();
  document.getElementById('birth_year').addEventListener('change', updateDaySelect);
  document.getElementById('birth_month').addEventListener('change', updateDaySelect);
  document.getElementById('birth_day').addEventListener('change', updatePreview);
  document.getElementById('birth_hour').addEventListener('change', updatePreview);
  document.getElementById('isLeapMonth').addEventListener('change', updatePreview);
});

// ════════════════════════════════════════════
//  폼 제출 → API 호출
// ════════════════════════════════════════════
document.getElementById('sajuForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const year     = parseInt(document.getElementById('birth_year').value, 10);
  const month    = parseInt(document.getElementById('birth_month').value, 10);
  const day      = parseInt(document.getElementById('birth_day').value, 10);
  const sijinIdx = parseInt(document.getElementById('birth_hour').value, 10);
  const gender   = document.querySelector('input[name="gender"]:checked').value;
  const isLeap   = document.getElementById('isLeapMonth')?.checked ?? false;

  if (sijinIdx < 0) {
    showError('태어난 시각(시주)을 선택해 주세요. 시주는 사주 분석에 필수입니다.');
    return;
  }

  // 음력이면 양력으로 변환
  let solarY = year, solarM = month, solarD = day;
  if (calType === 'lunar') {
    if (!getLunarLib()) {
      showError('음력 변환 라이브러리가 로드되지 않았습니다. 페이지를 새로고침 후 시도하세요.');
      return;
    }
    const conv = lunarToSolar(year, month, day, isLeap);
    if (!conv) {
      showError('유효하지 않은 음력 날짜입니다. 날짜를 다시 확인해 주세요.');
      return;
    }
    solarY = conv.year; solarM = conv.month; solarD = conv.day;
  }

  const { yunju, wolju, ilju, siju } = calcSajuFromSolar(solarY, solarM, solarD, sijinIdx);

  const payload = {
    birth_year: solarY, birth_month: solarM, birth_day: solarD, gender,
    yunju, wolju, ilju, siju,
    // 입력 원본 정보 (참고용)
    input_cal_type: calType,
    input_year: year, input_month: month, input_day: day,
    ...(calType === 'lunar' && { is_leap_month: isLeap }),
  };

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  showLoading();

  try {
    const res  = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showError(data.error || '서버 오류가 발생했습니다.');
    } else {
      renderResult(data, payload);
    }
  } catch (err) {
    showError('네트워크 오류: ' + err.message);
  } finally {
    btn.disabled = false;
  }
});

// ════════════════════════════════════════════
//  화면 상태 전환
// ════════════════════════════════════════════
function showLoading() {
  hide('formSection'); hide('errorSection'); hide('resultSection');
  show('loadingSection');
}
function showError(msg) {
  hide('loadingSection');
  document.getElementById('errorMsg').textContent = msg;
  show('errorSection');
}
function resetForm() {
  hide('errorSection'); hide('resultSection'); hide('loadingSection');
  show('formSection');
}
function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

// ════════════════════════════════════════════
//  결과 렌더링
// ════════════════════════════════════════════
const OHENG_COLOR = { '木':'#4caf7d','火':'#e05c5c','土':'#c9a84c','金':'#9eb8e0','水':'#5b8dee' };

function renderResult(data, payload) {
  hide('loadingSection');
  renderSajuChart(data);
  renderGyuk(data);
  renderIlgan(data);
  renderDaewun(data, payload);
  renderJijiSinsul(data);
  renderAI(data.ai_interpretation);
  show('resultSection');
  document.getElementById('resultSection').scrollIntoView({ behavior:'smooth', block:'start' });
}

function renderSajuChart(data) {
  const chart   = data.saju_chart?.sipsung_chart ?? {};
  const pillars = [
    {key:'시주'}, {key:'일주', isIl:true}, {key:'월주'}, {key:'연주'}
  ];
  const ganRow = document.getElementById('sipsung-row');
  const gjRow  = document.getElementById('ganjji-row');
  const jiRow  = document.getElementById('sipsung-ji-row');
  ganRow.innerHTML = gjRow.innerHTML = jiRow.innerHTML = '';
  for (const p of pillars) {
    const c   = chart[p.key] ?? {};
    const cls = p.isIl ? ' class="ilju-col"' : '';
    ganRow.innerHTML += `<td${cls}>${c.천간십성??''}</td>`;
    gjRow.innerHTML  += `<td${cls}>${(c.천간??'')+(c.지지??'')}</td>`;
    jiRow.innerHTML  += `<td${cls}>${c.지지십성??''}</td>`;
  }
}

function renderGyuk(data) {
  const g  = data.gyuk_analysis ?? {};
  const y  = data.yongsin_analysis ?? {};
  const gy = y.격국용신 ?? {};
  const ey = y.억부용신 ?? {};
  const sp = g.성파격 ?? {};
  document.getElementById('gyukResult').innerHTML = `
    ${row('격국',    gy.격국 ?? g.격국판별?.격국 ?? '—', 'gold')}
    ${row('성파격',  `${sp.성파격??'—'} / ${sp.등급??'—'}`)}
    ${row('격국용신', gy.용신??'—', 'gold')}
    ${row('격국기신', gy.기신??'—', 'red')}
    ${row('억부용신', ey.용신??'—')}
    ${row('억부기신', ey.기신??'—', 'red')}
    ${row('조후용신', y.조후용신?.설명??'—')}
  `;
}

function renderIlgan(data) {
  const il     = data.ilgan_strength ?? {};
  const oh     = data.oheng_power ?? {};
  const ratios = oh.오행비율 ?? {};
  const bars   = Object.entries(ratios)
    .sort((a,b) => b[1]-a[1])
    .map(([name, pct]) => {
      const color = OHENG_COLOR[name] ?? '#888';
      return `<div class="oheng-bar-row">
        <span class="oheng-name">${name}</span>
        <div class="oheng-track"><div class="oheng-fill" style="width:${pct}%;background:${color}"></div></div>
        <span class="oheng-pct">${pct}%</span>
      </div>`;
    }).join('');
  document.getElementById('ilganResult').innerHTML = `
    ${row('신강신약', il.신강신약??'—', il.신강신약?.includes('신강')?'red':'green')}
    ${row('강도점수', `${il.총강도??'—'}점`)}
    ${row('필요요소', il.필요요소??'—')}
    <div class="section-label" style="margin-top:.8rem">오행 비율</div>
    <div class="oheng-bars">${bars}</div>
    <div style="font-size:.75rem;color:var(--muted);margin-top:.5rem">${oh.분석??''}</div>
  `;
}

function renderDaewun(data, payload) {
  const list   = data.daewun?.목록 ?? [];
  const flow   = data.daewun?.흐름요약 ?? [];
  const curAge = new Date().getFullYear() - payload.birth_year;
  const scoreMap = {};
  for (const f of flow) scoreMap[f.간지] = f;

  const items = list.map(dw => {
    const isCurrent = dw.나이 <= curAge && curAge < dw.나이 + 10;
    const f   = scoreMap[dw.간지] ?? {};
    const sc  = f.점수 ?? 0;
    const cls = sc > 0 ? 'score-pos' : sc < 0 ? 'score-neg' : 'score-neu';
    return `<div class="daewun-item${isCurrent?' current':''}">
      <div class="dw-age">${dw.나이}세${isCurrent?' ★':''}</div>
      <div class="dw-ganjji">${dw.간지}</div>
      <div class="dw-score"><span class="${cls}">${sc>0?'+':''}${sc}</span></div>
      <div class="dw-label">${(f.길흉??'').replace(/[🟢🔴⚪🟡🌟✅⛔🟠]/g,'').trim()}</div>
    </div>`;
  }).join('');
  document.getElementById('daewunResult').innerHTML = `<div class="daewun-list">${items}</div>`;
}

function renderJijiSinsul(data) {
  const rels     = data.jiji_relations ?? [];
  const sinsul   = data.sinsul ?? {};
  const samhap   = data.samhap ?? [];
  const banghap  = data.banghap ?? [];
  const gongmang = data.gongmang ?? {};
  let html = '';

  if (rels.length) {
    const tags = rels.map(r => {
      const txt = r.관계??'';
      const cls = txt.includes('합')?'hap':txt.includes('충')?'chung':txt.includes('형')?'hyung':'';
      return `<span class="rel-tag ${cls}">${r.ji1}·${r.ji2} ${txt}</span>`;
    }).join('');
    html += `<div class="section-label">지지 관계</div><div class="rel-list">${tags}</div>`;
  }
  if (samhap.length) {
    html += `<div class="section-label" style="margin-top:.7rem">삼합</div><div class="rel-list">` +
      samhap.map(s=>`<span class="rel-tag hap">${s.종류} (${s.오행})</span>`).join('') + '</div>';
  }
  if (banghap.length) {
    html += `<div class="section-label" style="margin-top:.7rem">방합</div><div class="rel-list">` +
      banghap.map(s=>`<span class="rel-tag hap">${s.종류} (${s.오행})</span>`).join('') + '</div>';
  }
  if (gongmang.설명) {
    html += `<div class="section-label" style="margin-top:.7rem">공망</div>
      <div style="font-size:.85rem;color:var(--muted)">${gongmang.설명}</div>`;
  }
  const active = Object.entries(sinsul).filter(([,v])=>v.length>0);
  if (active.length) {
    html += `<div class="section-label" style="margin-top:.7rem">신살</div><div class="sinsul-list">` +
      active.flatMap(([,arr])=>arr.map(s=>`<span class="sinsul-tag">${s.살??s.귀인??'신살'}</span>`)).join('') + '</div>';
  }
  if (!html) html = '<p style="color:var(--muted);font-size:.85rem">특이 사항 없음</p>';
  document.getElementById('jijiResult').innerHTML = html;
}

function renderAI(text) {
  if (!text) {
    document.getElementById('aiResult').innerHTML =
      '<p style="color:var(--muted)">AI 해석이 없습니다. CLAUDE_API_KEY 환경변수를 확인하세요.</p>';
    return;
  }
  const html = escapeHtml(text)
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  document.getElementById('aiResult').innerHTML = html;
}

function row(label, val, valCls='') {
  return `<div class="info-row">
    <span class="info-label">${label}</span>
    <span class="info-val${valCls?' '+valCls:''}">${val}</span>
  </div>`;
}
function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
