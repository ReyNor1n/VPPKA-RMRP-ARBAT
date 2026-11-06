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
        date: String(x.date || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        image: image(x.image || x.icon),
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
  const STAR = '<svg class="aw-star" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,1.6 14.6,8.7 22.1,8.9 16.2,13.6 18.3,20.9 12,16.7 5.7,20.9 7.8,13.6 1.9,8.9 9.4,8.7" fill="#a5141f" stroke="#e6c97f" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  function icon(it) {
    return it.image
      ? `<img class="aw-img" src="${esc(it.image)}" alt="" width="56" height="56" loading="lazy" decoding="async">`
      : '<span class="aw-miss" aria-hidden="true">★</span>';
  }
  function block(m) {
    const items = list(m && m.awards);
    if (!items.length) return '';
    shown = items;
    const cells = items.map((it, i) => {
      const tip = esc(it.date ? it.title + ', ' + it.date : it.title);
      const face = icon(it);
      if (!it.cert) return `<span class="aw-hold" title="${tip}" role="img" aria-label="${tip}">${face}</span>`;
      return `<button type="button" class="aw-btn" data-aw="${i}" title="${tip}" aria-label="${tip}. Открыть удостоверение">${face}</button>`;
    }).join('');
    return `<div class="mpg-side"><section class="blk awards"><h2>Награды</h2><div class="aw-grid">${cells}</div></section></div>`;
  }
  function pages(it) {
    if (it.spread) return `<div class="aw-pg aw-pg-img"><img src="${esc(it.spread)}" alt="Разворот удостоверения: ${esc(it.title)}"></div>`;
    const note = esc(it.note || 'Образец. Данные участника не заполнены.');
    const file = it.pdf ? `<p class="aw-file"><a href="${esc(it.pdf)}" target="_blank" rel="noopener">Файл PDF</a></p>` : '';
    return `<div class="aw-pg"><div class="aw-k">ВППКА</div><h3 class="aw-h">Удостоверение</h3><p class="aw-medal">${esc(it.title)}</p>${it.date ? `<p class="aw-dt">Дата: ${esc(it.date)}</p>` : ''}<p class="aw-note">${note}</p></div><div class="aw-pg"><p>Фамилия, имя, отчество</p><p class="aw-blank">не заполнено</p><p>Должность</p><p class="aw-blank">не заполнено</p><p class="aw-note">Подпись и печать не ставятся: это пустой образец, не документ участника.</p>${file}</div>`;
  }
  function viewHtml(it) {
    return `<div class="aw-bar"><button type="button" class="aw-back" hidden>Назад</button><button type="button" class="aw-x">Закрыть</button></div><div class="aw-scene"><div class="aw-book"><div class="aw-spread" aria-hidden="true">${pages(it)}</div><button type="button" class="aw-cover" aria-expanded="false" aria-label="УДОСТОВЕРЕНИЕ. Открыть книжечку"><span class="aw-skin"><span class="aw-face">${STAR}<span class="aw-word">УДОСТОВЕРЕНИЕ</span><span class="aw-party">ВППКА</span></span><span class="aw-face-in" aria-hidden="true"><span class="aw-party">ВППКА</span></span></span></button></div></div>`;
  }
  let backEl = null;
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
  }
  function focusables(v) {
    return [...v.querySelectorAll('button,a[href]')].filter(el => !el.disabled && !el.hidden && el.tabIndex !== -1);
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('[data-aw]');
    if (btn) { e.preventDefault(); openAt(+btn.dataset.aw, btn); return; }
    const v = dialog();
    if (!v) return;
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
