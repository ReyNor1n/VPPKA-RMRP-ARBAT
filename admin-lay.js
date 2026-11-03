// v262: #admin → «Раскладка страниц» (только владелец). Сама правка — прямо на странице (layedit.js):
// здесь только пояснение и ссылки, открывающие нужную страницу сразу в режиме правки.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C=()=>(window.VPPKA_C&&window.VPPKA_C())||{};
const href=pg=>{if(pg!=='article')return '#'+pg;const N=C().news||[];return N.length?'#news/'+(N[0].id??0):''};
export async function layLoad(refresh){refresh()}
export function layHTML(){const D=window.VPPKA_LAYOUT_DEF||{},L=(C().settings||{}).layout||{};
 return `<div class="alay"><p class="amut">Блоки страниц переставляются прямо на сайте: откройте страницу и нажмите «✎ Редактировать страницу» в верхней строке (видно только вам).
Тяните блок мышью (на телефоне — удерживайте палец, затем тяните) в левую или правую колонку либо на всю ширину; «⇲» — размер S/M/L, «⇔» — ширина правой колонки, 👁 — скрыть/показать.
Внизу — «Сохранить», «Отмена», «Сброс».</p>
<div class="alay-list">${Object.entries(D).map(([pg,d])=>{const h=href(pg);return `<div class="alay-row"><b>${esc(d.title)}</b><span class="amut">${L[pg]?'своя раскладка':'по умолчанию'}</span>${h?`<button type="button" class="btn sm" data-lya="go" data-pg="${pg}" data-h="${esc(h)}">Открыть и править</button>`:'<span class="amut">нет новостей</span>'}</div>`}).join('')}</div></div>`}
export async function layClick(b){if(b.dataset.lya!=='go')return false;sessionStorage.setItem('vppka_le',b.dataset.pg);location.hash=b.dataset.h;return true}
