'use strict';

const OHENG_COLOR = { '木':'#4caf7d','火':'#e05c5c','土':'#c9a84c','金':'#9eb8e0','水':'#5b8dee' };

// ─── Form Submit ───────────────────────────────────────────────────────────
document.getElementById('sajuForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');

  const payload = {
    birth_year:  parseInt(document.getElementById('birth_year').value, 10),
    birth_month: parseInt(document.getElementById('birth_month').value, 10),
    birth_day:   parseInt(document.getElementById('birth_day').value, 10),
    gender:      document.querySelector('input[name="gender"]:checked').value,
    yunju:       document.getElementById('yunju').value.trim(),
    wolju:       document.getElementById('wolju').value.trim(),
    ilju:        document.getElementById('ilju').value.trim(),
    siju:        document.getElementById('siju').value.trim(),
  };

  showLoading();
  btn.disabled = true;

  try {
    const res = await fetch('/api/analyze', {
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

// ─── State Helpers ─────────────────────────────────────────────────────────
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

// ─── Render ────────────────────────────────────────────────────────────────
function renderResult(data, payload) {
  hide('loadingSection');

  renderSajuChart(data, payload);
  renderGyuk(data);
  renderIlgan(data);
  renderDaewun(data, payload);
  renderJijiSinsul(data);
  renderAI(data.ai_interpretation);

  show('resultSection');
  document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Saju Chart ───────────────────────────────────────────────────────────
function renderSajuChart(data, payload) {
  const chart = data.saju_chart?.sipsung_chart ?? {};
  const pillars = [
    { key: '시주', id: 'siju' },
    { key: '일주', id: 'ilju', isIl: true },
    { key: '월주', id: 'wolju' },
    { key: '연주', id: 'yunju' },
  ];

  const ganRow  = document.getElementById('sipsung-row');
  const gjRow   = document.getElementById('ganjji-row');
  const jiRow   = document.getElementById('sipsung-ji-row');
  ganRow.innerHTML = gjRow.innerHTML = jiRow.innerHTML = '';

  for (const p of pillars) {
    const c = chart[p.key] ?? {};
    const cls = p.isIl ? ' class="ilju-col"' : '';
    ganRow.innerHTML += `<td${cls}>${c.천간십성 ?? ''}</td>`;
    gjRow.innerHTML  += `<td${cls}>${(c.천간 ?? '') + (c.지지 ?? '')}</td>`;
    jiRow.innerHTML  += `<td${cls}>${c.지지십성 ?? ''}</td>`;
  }
}

// ─── Gyuk / Yongsin ────────────────────────────────────────────────────────
function renderGyuk(data) {
  const g  = data.gyuk_analysis ?? {};
  const y  = data.yongsin_analysis ?? {};
  const gy = y.격국용신 ?? {};
  const ey = y.억부용신 ?? {};
  const sp = g.성파격 ?? {};

  document.getElementById('gyukResult').innerHTML = `
    ${row('격국', gy.격국 ?? g.격국판별?.격국 ?? '—', 'gold')}
    ${row('성파격', `${sp.성파격 ?? '—'} / ${sp.등급 ?? '—'}`)}
    ${row('격국용신', gy.용신 ?? '—', 'gold')}
    ${row('격국기신', gy.기신 ?? '—', 'red')}
    ${row('억부용신', ey.용신 ?? '—')}
    ${row('억부기신', ey.기신 ?? '—', 'red')}
    ${row('조후용신', y.조후용신?.설명 ?? '—')}
  `;
}

// ─── Ilgan Strength + Oheng ───────────────────────────────────────────────
function renderIlgan(data) {
  const il = data.ilgan_strength ?? {};
  const oh = data.oheng_power ?? {};
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

// ─── Daewun ───────────────────────────────────────────────────────────────
function renderDaewun(data, payload) {
  const list  = data.daewun?.목록 ?? [];
  const flow  = data.daewun?.흐름요약 ?? [];
  const currentYear = new Date().getFullYear();
  const currentAge  = currentYear - payload.birth_year;

  const scoreMap = {};
  for (const f of flow) scoreMap[f.간지] = f;

  const items = list.map(dw => {
    const isCurrent = dw.나이 <= currentAge && currentAge < dw.나이 + 10;
    const f = scoreMap[dw.간지] ?? {};
    const score = f.점수 ?? 0;
    const scoreCls = score > 0 ? 'score-pos' : score < 0 ? 'score-neg' : 'score-neu';
    const scoreSign = score > 0 ? '+' : '';
    return `<div class="daewun-item${isCurrent ? ' current' : ''}">
      <div class="dw-age">${dw.나이}세${isCurrent ? ' ★' : ''}</div>
      <div class="dw-ganjji">${dw.간지}</div>
      <div class="dw-score"><span class="${scoreCls}">${scoreSign}${score}</span></div>
      <div class="dw-label">${(f.길흉 ?? '').replace(/[🟢🔴⚪🟡🌟✅]/g,'').trim()}</div>
    </div>`;
  }).join('');

  document.getElementById('daewunResult').innerHTML =
    `<div class="daewun-list">${items}</div>`;
}

// ─── Jiji Relations + Sinsul ───────────────────────────────────────────────
function renderJijiSinsul(data) {
  const rels   = data.jiji_relations ?? [];
  const sinsul = data.sinsul ?? {};
  const samhap = data.samhap ?? [];
  const banghap = data.banghap ?? [];
  const gongmang = data.gongmang ?? {};

  let html = '';

  if (rels.length) {
    const tags = rels.map(r => {
      const txt = r.관계 ?? `${r.ji1}·${r.ji2}`;
      const cls = txt.includes('합') ? 'hap' : txt.includes('충') ? 'chung' : txt.includes('형') ? 'hyung' : '';
      return `<span class="rel-tag ${cls}">${r.ji1}·${r.ji2} ${r.관계 ?? ''}</span>`;
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
    const tags = activeSinsul.flatMap(([k, arr]) =>
      arr.map(s => `<span class="sinsul-tag">${s.살 ?? s.귀인 ?? k}</span>`)
    ).join('');
    html += `<div class="section-label" style="margin-top:.7rem">신살</div><div class="sinsul-list">${tags}</div>`;
  }

  if (!html) html = '<p style="color:var(--muted);font-size:.85rem">특이 사항 없음</p>';
  document.getElementById('jijiResult').innerHTML = html;
}

// ─── AI Interpretation ────────────────────────────────────────────────────
function renderAI(text) {
  if (!text) {
    document.getElementById('aiResult').innerHTML =
      '<p style="color:var(--muted)">AI 해석이 없습니다. CLAUDE_API_KEY 환경변수를 확인하세요.</p>';
    return;
  }
  // Convert markdown ### headings to styled h3
  const html = escapeHtml(text)
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  document.getElementById('aiResult').innerHTML = html;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function row(label, val, valCls = '') {
  return `<div class="info-row">
    <span class="info-label">${label}</span>
    <span class="info-val${valCls ? ' '+valCls : ''}">${val}</span>
  </div>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
