'use strict';

// ════════════════════════════════════════════
//  만세력 (萬歲曆) — 사주 자동 계산
// ════════════════════════════════════════════

const MR_CHUNGGAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const MR_JIJI     = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// 60간지 배열 생성
const GANJJI_60 = Array.from({length:60}, (_,i) => MR_CHUNGGAN[i%10] + MR_JIJI[i%12]);

// 시진 이름
const SIJIN_NAMES = ['子時','丑時','寅時','卯時','辰時','巳時','午時','未時','申時','酉時','戌時','亥時'];

// ── 연주 계산 ──────────────────────────────
// 1984 = 甲子년(index 0). 입춘(立春) ≈ 2월 4일 이전이면 전년도 사용
function getYearPillar(year, month, day) {
  const y = (month < 2 || (month === 2 && day < 4)) ? year - 1 : year;
  return GANJJI_60[((y - 1984) % 60 + 60) % 60];
}

// ── 절기 기준 월지 계산 ───────────────────
// 절기 경계 [양력월, 양력일, 지지인덱스(子=0)]
const JEOLGI_BOUNDS = [
  [1, 6, 1],  // 소한 → 丑月
  [2, 4, 2],  // 입춘 → 寅月
  [3, 6, 3],  // 경칩 → 卯月
  [4, 5, 4],  // 청명 → 辰月
  [5, 6, 5],  // 입하 → 巳月
  [6, 6, 6],  // 망종 → 午月
  [7, 7, 7],  // 소서 → 未月
  [8, 7, 8],  // 입추 → 申月
  [9, 8, 9],  // 백로 → 酉月
  [10,8, 10], // 한로 → 戌月
  [11,7, 11], // 입동 → 亥月
  [12,7, 0],  // 대설 → 子月
];

function getMonthJijiIdx(month, day) {
  let result = 0; // 대설 이후 ~ 소한 이전 = 子月
  for (const [m, d, j] of JEOLGI_BOUNDS) {
    if (month > m || (month === m && day >= d)) result = j;
  }
  return result;
}

// ── 월주 계산 ──────────────────────────────
// 연간에 따른 寅月 천간 기준: 甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲
function getMonthPillar(yearGanjji, month, day) {
  const yStemIdx  = MR_CHUNGGAN.indexOf(yearGanjji[0]);
  const mJijiIdx  = getMonthJijiIdx(month, day);
  const bases     = [2, 4, 6, 8, 0]; // 丙戊庚壬甲 for 寅月
  const base      = bases[yStemIdx % 5];
  const offset    = (mJijiIdx - 2 + 12) % 12;
  const mStemIdx  = (base + offset) % 10;
  return MR_CHUNGGAN[mStemIdx] + MR_JIJI[mJijiIdx];
}

// ── 일주 계산 ──────────────────────────────
// 기준: 1900-01-01 = 甲戌(index 10)
function getDayPillar(year, month, day) {
  const ref    = new Date(1900, 0, 1);
  const target = new Date(year, month - 1, day);
  const days   = Math.round((target - ref) / 86400000);
  return GANJJI_60[((10 + days) % 60 + 60) % 60];
}

// ── 시주 계산 ──────────────────────────────
// sijinIdx: 子=0,丑=1,...,亥=11
// 일간에 따른 子時 천간 기준: 甲己→甲, 乙庚→丙, 丙辛→戊, 丁壬→庚, 戊癸→壬
function getHourPillar(dayGanjji, sijinIdx) {
  const dStemIdx = MR_CHUNGGAN.indexOf(dayGanjji[0]);
  const bases    = [0, 2, 4, 6, 8]; // 甲丙戊庚壬
  const base     = bases[dStemIdx % 5];
  const hStemIdx = (base + sijinIdx) % 10;
  return MR_CHUNGGAN[hStemIdx] + MR_JIJI[sijinIdx];
}

// ── 전체 사주 계산 ─────────────────────────
function calcSaju(year, month, day, sijinIdx) {
  const yunju  = getYearPillar(year, month, day);
  const wolju  = getMonthPillar(yunju, month, day);
  const ilju   = getDayPillar(year, month, day);
  const siju   = sijinIdx >= 0 ? getHourPillar(ilju, sijinIdx) : null;
  return { yunju, wolju, ilju, siju };
}

// ════════════════════════════════════════════
//  UI 초기화
// ════════════════════════════════════════════

function initSelects() {
  // 년도 (1920–2010)
  const yearSel = document.getElementById('birth_year');
  const curYear = new Date().getFullYear();
  for (let y = 1920; y <= curYear; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y + '년';
    if (y === 1990) opt.selected = true;
    yearSel.appendChild(opt);
  }

  // 월 (1–12)
  const monthSel = document.getElementById('birth_month');
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m + '월';
    monthSel.appendChild(opt);
  }

  updateDaySelect();
}

function updateDaySelect() {
  const year  = parseInt(document.getElementById('birth_year').value, 10);
  const month = parseInt(document.getElementById('birth_month').value, 10);
  const daySel = document.getElementById('birth_day');
  const prevDay = parseInt(daySel.value, 10) || 1;

  const maxDay = new Date(year, month, 0).getDate();
  daySel.innerHTML = '';
  for (let d = 1; d <= maxDay; d++) {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d + '일';
    daySel.appendChild(opt);
  }
  daySel.value = Math.min(prevDay, maxDay);
  updatePreview();
}

// ── 원국 미리보기 자동 업데이트 ────────────
function updatePreview() {
  const year     = parseInt(document.getElementById('birth_year').value, 10);
  const month    = parseInt(document.getElementById('birth_month').value, 10);
  const day      = parseInt(document.getElementById('birth_day').value, 10);
  const sijinIdx = parseInt(document.getElementById('birth_hour').value, 10);

  if (!year || !month || !day) return;

  const { yunju, wolju, ilju, siju } = calcSaju(year, month, day, sijinIdx);

  document.getElementById('yunju-gan').textContent = yunju[0];
  document.getElementById('yunju-ji').textContent  = yunju[1];
  document.getElementById('wolju-gan').textContent = wolju[0];
  document.getElementById('wolju-ji').textContent  = wolju[1];
  document.getElementById('ilju-gan').textContent  = ilju[0];
  document.getElementById('ilju-ji').textContent   = ilju[1];

  if (siju) {
    document.getElementById('siju-gan').textContent = siju[0];
    document.getElementById('siju-ji').textContent  = siju[1];
    document.getElementById('previewNote').textContent = '';
  } else {
    document.getElementById('siju-gan').textContent = '?';
    document.getElementById('siju-ji').textContent  = '?';
    document.getElementById('previewNote').textContent =
      '※ 시주는 태어난 시각을 알아야 계산됩니다.';
  }
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

  const { yunju, wolju, ilju, siju } = calcSaju(year, month, day, sijinIdx);

  if (!siju) {
    showError('태어난 시각(시주)을 선택해 주세요. 시주는 사주 분석에 필수입니다.');
    return;
  }

  const payload = {
    birth_year: year, birth_month: month, birth_day: day, gender,
    yunju, wolju, ilju, siju,
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

// ── 사주 원국 표 ───────────────────────────
function renderSajuChart(data) {
  const chart   = data.saju_chart?.sipsung_chart ?? {};
  const pillars = [
    { key:'시주' }, { key:'일주', isIl:true }, { key:'월주' }, { key:'연주' }
  ];
  const ganRow = document.getElementById('sipsung-row');
  const gjRow  = document.getElementById('ganjji-row');
  const jiRow  = document.getElementById('sipsung-ji-row');
  ganRow.innerHTML = gjRow.innerHTML = jiRow.innerHTML = '';

  for (const p of pillars) {
    const c   = chart[p.key] ?? {};
    const cls = p.isIl ? ' class="ilju-col"' : '';
    ganRow.innerHTML += `<td${cls}>${c.천간십성 ?? ''}</td>`;
    gjRow.innerHTML  += `<td${cls}>${(c.천간??'') + (c.지지??'')}</td>`;
    jiRow.innerHTML  += `<td${cls}>${c.지지십성 ?? ''}</td>`;
  }
}

// ── 격국·용신 ──────────────────────────────
function renderGyuk(data) {
  const g  = data.gyuk_analysis ?? {};
  const y  = data.yongsin_analysis ?? {};
  const gy = y.격국용신 ?? {};
  const ey = y.억부용신 ?? {};
  const sp = g.성파격 ?? {};
  document.getElementById('gyukResult').innerHTML = `
    ${row('격국',    gy.격국 ?? g.격국판별?.격국 ?? '—', 'gold')}
    ${row('성파격',  `${sp.성파격??'—'} / ${sp.등급??'—'}`)}
    ${row('격국용신', gy.용신 ?? '—', 'gold')}
    ${row('격국기신', gy.기신 ?? '—', 'red')}
    ${row('억부용신', ey.용신 ?? '—')}
    ${row('억부기신', ey.기신 ?? '—', 'red')}
    ${row('조후용신', y.조후용신?.설명 ?? '—')}
  `;
}

// ── 일간강약·오행 ──────────────────────────
function renderIlgan(data) {
  const il     = data.ilgan_strength ?? {};
  const oh     = data.oheng_power ?? {};
  const ratios = oh.오행비율 ?? {};

  const bars = Object.entries(ratios)
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
    ${row('신강신약', il.신강신약 ?? '—', il.신강신약?.includes('신강') ? 'red' : 'green')}
    ${row('강도점수', `${il.총강도 ?? '—'}점`)}
    ${row('필요요소', il.필요요소 ?? '—')}
    <div class="section-label" style="margin-top:.8rem">오행 비율</div>
    <div class="oheng-bars">${bars}</div>
    <div style="font-size:.75rem;color:var(--muted);margin-top:.5rem">${oh.분석 ?? ''}</div>
  `;
}

// ── 대운 흐름 ──────────────────────────────
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
    return `<div class="daewun-item${isCurrent ? ' current' : ''}">
      <div class="dw-age">${dw.나이}세${isCurrent?' ★':''}</div>
      <div class="dw-ganjji">${dw.간지}</div>
      <div class="dw-score"><span class="${cls}">${sc>0?'+':''}${sc}</span></div>
      <div class="dw-label">${(f.길흉??'').replace(/[🟢🔴⚪🟡🌟✅⛔🟠]/g,'').trim()}</div>
    </div>`;
  }).join('');

  document.getElementById('daewunResult').innerHTML =
    `<div class="daewun-list">${items}</div>`;
}

// ── 지지 관계·신살 ─────────────────────────
function renderJijiSinsul(data) {
  const rels    = data.jiji_relations ?? [];
  const sinsul  = data.sinsul ?? {};
  const samhap  = data.samhap ?? [];
  const banghap = data.banghap ?? [];
  const gongmang = data.gongmang ?? {};
  let html = '';

  if (rels.length) {
    const tags = rels.map(r => {
      const txt = r.관계 ?? '';
      const cls = txt.includes('합') ? 'hap' : txt.includes('충') ? 'chung' : txt.includes('형') ? 'hyung' : '';
      return `<span class="rel-tag ${cls}">${r.ji1}·${r.ji2} ${txt}</span>`;
    }).join('');
    html += `<div class="section-label">지지 관계</div><div class="rel-list">${tags}</div>`;
  }
  if (samhap.length) {
    const tags = samhap.map(s => `<span class="rel-tag hap">${s.종류} (${s.오행})</span>`).join('');
    html += `<div class="section-label" style="margin-top:.7rem">삼합</div><div class="rel-list">${tags}</div>`;
  }
  if (banghap.length) {
    const tags = banghap.map(s => `<span class="rel-tag hap">${s.종류} (${s.오행})</span>`).join('');
    html += `<div class="section-label" style="margin-top:.7rem">방합</div><div class="rel-list">${tags}</div>`;
  }
  if (gongmang.설명) {
    html += `<div class="section-label" style="margin-top:.7rem">공망</div>
      <div style="font-size:.85rem;color:var(--muted)">${gongmang.설명}</div>`;
  }
  const activeSinsul = Object.entries(sinsul).filter(([,v]) => v.length > 0);
  if (activeSinsul.length) {
    const tags = activeSinsul.flatMap(([,arr]) =>
      arr.map(s => `<span class="sinsul-tag">${s.살 ?? s.귀인 ?? '신살'}</span>`)
    ).join('');
    html += `<div class="section-label" style="margin-top:.7rem">신살</div><div class="sinsul-list">${tags}</div>`;
  }
  if (!html) html = '<p style="color:var(--muted);font-size:.85rem">특이 사항 없음</p>';
  document.getElementById('jijiResult').innerHTML = html;
}

// ── AI 해석 ────────────────────────────────
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

// ── 유틸 ───────────────────────────────────
function row(label, val, valCls = '') {
  return `<div class="info-row">
    <span class="info-label">${label}</span>
    <span class="info-val${valCls?' '+valCls:''}">${val}</span>
  </div>`;
}
function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
