/* Награды профиля. Сайт только показывает поле awards и ничего не записывает.
   Элемент: { title, date?, image?, cert?, note?, spread?, pdf? }
   cert/spread/pdf — есть книжечка. Без них иконка не открывается.
   spread — картинка разворота (img/ или https), целиком, без обрезки.
   pdf — необязательный файл .pdf, ссылка появляется только внутри открытой книжечки. */
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function src(u) {
    let s = String(u || '').trim().replace(/^(?:https?:\/\/[^/]+)?\/(?:vppka|VPPKA-RMRP-ARBAT)\/(?=img\/)/i, '');
    if (!s || s.length > 500 || /[\s"'<>\\]/.test(s) || s.includes('..')) return '';
    if (s.startsWith('img/')) return s;
    if (/^https:\/\/[a-z0-9.-]+(?::\d+)?\/[^\s]*$/i.test(s)) return s;
    return '';
  }
  function image(u) {
    const s = src(u);
    return s && /\.(png|jpe?g|webp|svg)(\?|#|$)/i.test(s) ? s : '';
  }
  function pdf(u) {
    const s = src(u);
    return s && /\.pdf(\?|#|$)/i.test(s) ? s : '';
  }
  function list(raw) {
    const a = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? Object.values(raw) : []);
    const out = [];
    for (const x of a) {
      if (!x || typeof x !== 'object') continue;
      const title = String(x.title || x.name || '').replace(/\s+/g, ' ').trim().slice(0, 200);
      if (!title) continue;
      const cert = x.cert === true || x.cert === 'true' || x.cert === 1 || x.cert === '1';
      const spread = image(x.spread);
      const file = pdf(x.pdf || x.doc);
      out.push({
        title,
        head: String(x.head || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        years: String(x.years || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        date: String(x.date || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        no: (String(x.no || x.num || '000').replace(/[^\dA-Za-zА-Яа-яЁё\-]/g, '').slice(0, 12)) || '000',
        basis: String(x.basis || '').replace(/\s+/g, ' ').trim().slice(0, 200),
        grant: String(x.grant || '').replace(/[^\S\n]+/g, ' ').trim().slice(0, 400),
        coverTo: String(x.coverTo || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        full: x.full === true || x.full === 'true' || x.full === 1 || x.full === '1',
        image: image(x.image || x.icon),
        plate: image(x.plate) || image(x.image || x.icon),
        note: String(x.note || '').replace(/\s+/g, ' ').trim().slice(0, 300),
        cert: cert || !!spread || !!file,
        spread,
        pdf: file,
      });
      if (out.length >= 12) break;
    }
    return out;
  }
  let shown = [];
  let holder = { name: 'не указано', pass: '' };
  function icon(it) {
    return it.image
      ? `<img class="aw-img" src="${esc(it.image)}" alt="" width="56" height="56" loading="lazy" decoding="async">`
      : '<span class="aw-miss" aria-hidden="true">★</span>';
  }
  const M11 = [{
    head: 'Юбилейная медаль',
    coverTo: 'к юбилейной медали',
    title: '«109 лет Октябрьской революции»',
    years: '1917 — 2026',
    date: '07.11.2026',
    no: '001',
    basis: 'Приказ о награждении № 1 от 07.11.2026',
    image: 'img/demo/medal-109.webp',
    spread: 'img/awards/m11-109.webp',
    full: true,
    cert: true
  }];
  function block(m) {
    if (!m || m.id !== 'm11') return '';
    const own = list(m.awards);
    const items = own.length ? own : list(M11);
    if (!items.length) return '';
    shown = items;
    holder = {
      name: String((m && m.name) || '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'не указано',
      pass: String((m && (m.statik || m.passport)) || '').replace(/\s+/g, ' ').trim().slice(0, 32),
    };
    const cells = items.map((it, i) => {
      const tip = esc(it.date ? it.title + ', ' + it.date : it.title);
      const face = icon(it);
      if (!it.cert) return `<span class="aw-hold" title="${tip}" role="img" aria-label="${tip}">${face}</span>`;
      return `<button type="button" class="aw-btn" data-aw="${i}" title="${tip}" aria-label="${tip}. Открыть удостоверение">${face}</button>`;
    }).join('');
    return `<div class="mpg-side"><section class="blk awards"><h2>Награды</h2><div class="aw-grid">${cells}</div></section></div>`;
  }
  const SEAL = '<svg class="aw-seal" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36" fill="none" stroke="#2a4f86" stroke-width="2"/><circle cx="40" cy="40" r="30" fill="none" stroke="#2a4f86" stroke-width="1"/><text x="40" y="36" text-anchor="middle" font-size="11" fill="#2a4f86" font-family="Times New Roman,Times,serif">ОБРАЗЕЦ</text><text x="40" y="52" text-anchor="middle" font-size="8" fill="#2a4f86" font-family="Times New Roman,Times,serif">НЕ ПЕЧАТЬ</text></svg>';
  const RULE = '<span class="aw-cv-rule" aria-hidden="true"><i></i><b></b><i></i></span>';
  const RULEB = '<span class="aw-cv-rule aw-cv-rule-b" aria-hidden="true"><i></i></span>';
  function leftPage(it) {
    const head = esc(it.head || 'Медаль');
    const award = esc(it.title);
    const years = it.years ? `<div class="aw-years">${esc(it.years)}</div>` : '';
    const plate = it.plate ? `<div class="aw-plate-box"><img class="aw-plate" src="${esc(it.plate)}" alt=""></div>` : '<div class="aw-plate aw-plate-miss" aria-hidden="true">★</div>';
    return `<div class="aw-col aw-col-l"><div class="aw-kicker">${head}</div><div class="aw-sub">${award}</div>${years}${plate}</div>`;
  }
  function rightPage(it, person) {
    const who = person || holder;
    const pass = who.pass ? esc(who.pass) : 'не указан';
    const lines = String(it.grant || ('награждён ' + (it.head ? it.head + ' ' : '') + it.title + (it.years ? ' (' + it.years + ')' : '') + '.')).split('\n').map(s => s.trim()).filter(Boolean);
    const body = `<p>статик / № паспорта: ${pass}</p>` + lines.map(l => `<p>${esc(l)}</p>`).join('')
      + (it.basis ? `<p>${esc(it.basis)}</p>` : '')
      + (it.date ? `<p>Дата выдачи: ${esc(it.date)}</p>` : '')
      + '<p>Председатель ЦК ВППКА</p>';
    const file = it.pdf ? `<p class="aw-file"><a href="${esc(it.pdf)}" target="_blank" rel="noopener">Файл PDF</a></p>` : '';
    return `<div class="aw-col aw-col-r"><div class="aw-rh"><span class="aw-doc">УДОСТОВЕРЕНИЕ</span><span class="aw-num">№ ${esc(it.no)}</span></div><p class="aw-that">Настоящим удостоверяется, что</p><div class="aw-fio">${esc(who.name)}</div><div class="aw-cap">(фамилия, имя, отчество)</div><div class="aw-body">${body}</div><div class="aw-sign"><div class="aw-sig"><div class="aw-script">образец</div><div class="aw-cap">(подпись)</div></div>${SEAL}</div>${file}</div>`;
  }
  function coverFace(it) {
    const sub = esc(it.coverTo || (it.head ? 'к ' + it.head.charAt(0).toLowerCase() + it.head.slice(1) : ''));
    const years = it.years ? `<span class="aw-cv-years">${esc(it.years)}</span>` : '';
    return `<span class="aw-face"><span class="aw-cv-top">ВППКА «КОММУНИСТЫ АРБАТА»</span>${RULE}<span class="aw-cv-mid"><span class="aw-cv-title">УДОСТОВЕРЕНИЕ</span>${sub ? `<span class="aw-cv-sub">${sub}</span>` : ''}<span class="aw-cv-name">${esc(it.title)}</span>${years}</span>${RULEB}<span class="aw-cv-bot">Центральный комитет</span></span>`;
  }
  function viewHtml(it, person) {
    if (it.full && it.spread) {
      const src = esc(it.spread);
      const bar = `<div class="aw-bar"><button type="button" data-awz="out" aria-label="Мельче">−</button><button type="button" data-awz="fit">Уместить</button><button type="button" data-awz="in" aria-label="Крупнее">+</button><button type="button" class="aw-back" hidden>Назад</button><button type="button" class="aw-x">Закрыть</button></div>`;
      return `${bar}<div class="aw-scene"><div class="aw-fit"><div class="aw-book"><div class="aw-spread aw-half aw-half-r" style="background-image:url('${src}')" role="img" aria-label="Удостоверение № ${esc(it.no)}"></div><button type="button" class="aw-cover" aria-expanded="false" aria-label="УДОСТОВЕРЕНИЕ. Открыть книжечку"><span class="aw-skin">${coverFace(it)}<span class="aw-face-in aw-half aw-half-l" style="background-image:url('${src}')"></span></span></button></div></div></div>`;
    }
    const left = leftPage(it);
    return `<div class="aw-bar"><button type="button" data-awz="out" aria-label="Мельче">−</button><button type="button" data-awz="fit">Уместить</button><button type="button" data-awz="in" aria-label="Крупнее">+</button><button type="button" class="aw-back" hidden>Назад</button><button type="button" class="aw-x">Закрыть</button></div><div class="aw-scene"><div class="aw-fit"><div class="aw-book"><div class="aw-spread" aria-hidden="true">${rightPage(it, person)}</div><button type="button" class="aw-cover" aria-expanded="false" aria-label="УДОСТОВЕРЕНИЕ. Открыть книжечку"><span class="aw-skin">${coverFace(it)}<span class="aw-face-in">${left}</span></span></button><p class="aw-foot">Внутриигровой документ. Образец бланка, не печать.</p></div></div></div>`;
  }
  let backEl = null;
  let scale = 1;
  function applyZoom(z) {
    const fit = dialog() && dialog().querySelector('.aw-fit');
    if (!fit) return;
    scale = Math.min(2.8, Math.max(0.35, z));
    fit.style.transform = 'scale(' + scale + ')';
  }
  // Масштаб считается по открытому листу 210×75. Корочка — та же высота и половина ширины, без повторной подгонки при раскрытии.
  function place() {
    const v = dialog();
    if (!v) return;
    const scene = v.querySelector('.aw-scene');
    const frame = v.querySelector('.aw-fit');
    if (!scene || !frame) return;
    const availW = Math.max(120, scene.clientWidth - 24);
    const availH = Math.max(120, scene.clientHeight - 16);
    applyZoom(Math.min(availW / frame.offsetWidth, availH / frame.offsetHeight));
  }
  function dialog() { return document.getElementById('aw-view'); }
  function closeView() {
    const v = dialog();
    if (!v) return;
    v.remove();
    document.body.classList.remove('aw-lock');
    if (backEl && backEl.focus) backEl.focus();
    backEl = null;
  }
  function book() { const v = dialog(); return v && v.querySelector('.aw-book'); }
  function fold() {
    const b = book();
    if (!b || !b.classList.contains('open')) return;
    b.classList.remove('open');
    const spread = b.querySelector('.aw-spread');
    if (spread) spread.setAttribute('aria-hidden', 'true');
    const cover = b.querySelector('.aw-cover');
    if (cover) { cover.setAttribute('aria-expanded', 'false'); cover.tabIndex = 0; cover.focus(); }
    const back = dialog().querySelector('.aw-back');
    if (back) back.hidden = true;
  }
  function unfold() {
    const b = book();
    if (!b || b.classList.contains('open')) return;
    b.classList.add('open');
    const spread = b.querySelector('.aw-spread');
    if (spread) spread.setAttribute('aria-hidden', 'false');
    const cover = b.querySelector('.aw-cover');
    if (cover) cover.setAttribute('aria-expanded', 'true');
    const back = dialog().querySelector('.aw-back');
    if (back) { back.hidden = false; back.focus(); }
  }
  function openAt(i, from) {
    const it = shown[i];
    if (!it || !it.cert || dialog()) return;
    backEl = from || null;
    const v = document.createElement('div');
    v.id = 'aw-view';
    v.className = 'aw-view';
    v.setAttribute('role', 'dialog');
    v.setAttribute('aria-modal', 'true');
    v.setAttribute('aria-label', 'Удостоверение');
    v.innerHTML = viewHtml(it);
    document.body.classList.add('aw-lock');
    document.body.appendChild(v);
    const cover = v.querySelector('.aw-cover');
    if (cover) cover.focus();
    place();
  }
  function focusables(v) {
    return [...v.querySelectorAll('button,a[href]')].filter(el => !el.disabled && !el.hidden && el.tabIndex !== -1);
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('[data-aw]');
    if (btn) { e.preventDefault(); openAt(+btn.dataset.aw, btn); return; }
    const v = dialog();
    if (!v) return;
    const zoom = e.target.closest && e.target.closest('[data-awz]');
    if (zoom) {
      e.preventDefault();
      if (zoom.dataset.awz === 'fit') place();
      else applyZoom(scale + (zoom.dataset.awz === 'in' ? 0.25 : -0.25));
      return;
    }
    if (e.target.closest('.aw-cover')) { e.preventDefault(); unfold(); return; }
    if (e.target.closest('.aw-back')) { e.preventDefault(); fold(); return; }
    if (e.target.closest('.aw-x') || e.target === v || e.target.classList.contains('aw-scene')) { e.preventDefault(); closeView(); }
  });
  document.addEventListener('keydown', e => {
    const v = dialog();
    if (!v) return;
    if (e.key === 'Escape') { e.preventDefault(); if (book() && book().classList.contains('open')) fold(); else closeView(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(v);
    if (!f.length) return;
    const a = f[0], b = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
    else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
  });
  document.addEventListener('error', e => {
    const img = e.target;
    if (!img || !img.classList || !img.classList.contains('aw-img')) return;
    const ph = document.createElement('span');
    ph.className = 'aw-miss';
    ph.setAttribute('aria-hidden', 'true');
    ph.textContent = '★';
    img.replaceWith(ph);
  }, true);
  window.VPPKA_AWARDS = block;
  window.VPPKA_AWARD_LIST = list;
  window.VPPKA_AWARD_VIEW = viewHtml;
})();
