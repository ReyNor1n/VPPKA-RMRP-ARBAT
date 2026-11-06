// v262: редактирование раскладки прямо на странице (только владелец). Без зависимостей.
// «✎ Редактировать страницу» в верхней строке → блоки можно перетаскивать (мышью сразу, пальцем — долгим нажатием),
// менять размер (⇲ — тянуть вправо/влево, S/M/L), ширину правой колонки (полоса ⇔ у её левого края), скрывать (👁).
// Модель та же: content/settings.layout[страница] (см. LAYOUT_DEF в app.js). Сохранение — запись владельца (правило content: isSuper).
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const owner=()=>!!(window.VPPKA_SUPER&&window.VPPKA_SUPER())||!!(((window.VPPKA_FB||{}).power)||{}).owner;
const DEF=()=>window.VPPKA_LAYOUT_DEF||{},key=()=>window.VPPKA_LAYKEY?window.VPPKA_LAYKEY():'';
const SZ=['s','m','l'],SZL={s:'S — компактный',m:'M — обычный',l:'L — крупный'};
const SIDEW={s:'узкая 260 px',m:'300 px',l:'360 px',w:'треть ширины',h:'почти половина'};
let LE=null; // {pg, draft:{side,blocks}, base, drag, pend}
const clone=o=>JSON.parse(JSON.stringify(o));
// ===== шаблоны карточек: свободная раскладка — элемент стоит там, куда его поставили (общая для всех карточек типа) =====
// content/settings.tpl[тип] = {w:{W,it:{id:{x,y,s,z,h}}}|null, n:{…}|null}: w — компьютер, n — телефон (≤860px).
// W — ширина карточки, при которой её раскладывали. Карточка всегда раскладывается на W px и масштабируется (CSS zoom) под своё место —
// поэтому на любой ширине и у любого посетителя элементы стоят ровно там, где их поставили (пропорции сохраняются).
// x,y — сдвиг элемента от обычного места в px этой ширины W, s — масштаб, z — слой, h — скрыт (место остаётся).
// Телефон: своя раскладка n, если её делали; иначе раскладка компьютера, если уменьшение не сильнее 0,6 (у профиля — только своя), иначе обычный вид.
// Нет сохранённого шаблона — DOM не трогаем (вид по умолчанию 1:1). Применяется к нарисованному DOM (MutationObserver на #app).
// item: [id, подпись, селектор внутри карточки, селектор «хвоста» — соседа, который ходит вместе]; id 'row' — каждая строка таблицы отдельно
const TPL_DEF={
 pcard:{title:'Карточка члена партии',root:'a.pm-card:not(.ldr-pc)',items:[['av','Фото','.pm-av'],['inf','Плашка с именем','.pm-inf'],['n','ФИО','.pm-n'],['r','Должность','.pm-r']]},
 pldr:{title:'Карточка руководителя в списке членов',root:'a.pm-card.ldr-pc',items:[['av','Фото','.pm-av'],['inf','Плашка с именем','.pm-inf'],['n','ФИО','.pm-n'],['r','Должность','.pm-r']]},
 lcard:{title:'Карточка руководителя',root:'a.lc',items:[['ph','Фото','.lc-ph'],['inf','Плашка с именем','.lc-inf'],['n','ФИО','.lc-n'],['r','Должность','.lc-r']]},
 lplate:{title:'Плашка руководителя',root:'.lc-pl',items:[['n','ФИО','.lc-pn'],['r','Должность','.lc-pr'],['q','Цитата','.lc-pq']]},
 news:{title:'Карточка новости',root:'.nl>.it',items:[['d','Дата','.d'],['bd','Текст новости (весь)',':scope>div:not(.d)'],['ph','Фото','a:has(>.nthumb)'],['t','Заголовок','h3'],['x','Начало текста',':scope>div:not(.d)>p'],['meta','Фото/видео — счётчик','.nmeta'],['like','Отметка «нравится»','.nlike']]},
 an:{title:'Карточка объявления',root:'article.an-it:not(.an-ed)',items:[['dt','Дата (плитка)','.an-dt'],['bd','Текст объявления (весь)','.an-bd'],['hd','Метки и кнопки','.an-hd'],['t','Заголовок','h3'],['meta','Время и место','.an-meta'],['tx','Текст','.an-tx','.an-more'],['r','Причина отмены','.an-r'],['ft','Автор и дата публикации','.an-ft']]},
 prof:{title:'Профиль участника',root:'.mpg>.prof',narrowOwn:1,items:[['badge','Знак «Руководство партии»','.ldr-badge'],['ph','Фото','.prof-ph'],['stamp','Печать на фото','.prof-stamp'],['info','Сведения (все)',':scope>div:not(.prof-ph):not(.ldr-badge)'],['role','Группа','.role'],['n','ФИО','.prof-n'],['rk','Должность','.prof-r'],['q','Цитата','.quote'],['tbl','Таблица сведений (вся)','.tbl'],['row','Строка таблицы','.tbl tr'],['duty','Кнопка «Обязанности»','.duty-btn'],['txt','О себе и достижения','.prof-txt','.ptx-more']]}};
window.VPPKA_TPL_DEF=TPL_DEF;
const NARROW=matchMedia('(max-width:860px)'),mode=()=>NARROW.matches?'n':'w',KMIN=.6;
const num=(v,a,b,d)=>{v=+v;return Number.isFinite(v)?Math.min(b,Math.max(a,Math.round(v*100)/100)):d};
const rowId=tr=>{const c=tr.querySelector('th,td');return 'row:'+((c&&c.textContent)||'').trim().replace(/\s+/g,' ').slice(0,40)};
const okId=(ty,id)=>TPL_DEF[ty].items.some(d=>d[0]===id)||(id.startsWith('row:')&&TPL_DEF[ty].items.some(d=>d[0]==='row'));
function cleanMap(ty,m){if(!m||typeof m!=='object'||Array.isArray(m))return null;const W=num(m.W,80,4000,0);if(!W)return null;const it={},src=m.it&&typeof m.it==='object'?m.it:{};
 for(const id in src){const v=src[id];if(!v||typeof v!=='object'||!okId(ty,id))continue;
  const e={x:num(v.x,-3*W,3*W,0),y:num(v.y,-6*W,6*W,0),s:num(v.s,.3,3,1),z:Math.round(num(v.z,-2,20,0)),h:v.h===true};
  if(e.x||e.y||e.s!==1||e.z||e.h)it[id]=e}return {W,it}}
// старый формат v262 ({слот:[…]}) не переносится: шаблонов в нём не сохранено
function tplOf(ty,sv){const ok=sv&&typeof sv==='object'&&!Array.isArray(sv);let w=cleanMap(ty,ok&&sv.w);const n=cleanMap(ty,ok&&sv.n);
 if(w&&!Object.keys(w.it).length)w=null;return {w,n}}
const savedTpl=()=>{const s=(((window.VPPKA_C&&window.VPPKA_C())||{}).settings||{}).tpl;return s&&typeof s==='object'?s:{}};
const tplJ=T=>JSON.stringify(T),defJ=()=>tplJ({w:null,n:null});
const visW=r=>r.getBoundingClientRect().width;
// раскладка, которая действует для этой карточки сейчас
const effFor=(root,ty,T)=>{if(mode()==='w')return T.w;if(T.n)return T.n;const w=T.w;return w&&!TPL_DEF[ty].narrowOwn&&visW(root)/w.W>=KMIN?w:null};
// элементы одной карточки: [{id,label,el,tail}]
function itemsOf(root,ty){const out=[];for(const [id,label,sel,tail] of TPL_DEF[ty].items){
  const els=id==='row'?[...root.querySelectorAll(sel)]:[root.querySelector(sel)].filter(Boolean);
  for(const el of els){const t=tail&&el.nextElementSibling&&el.nextElementSibling.matches(tail)?el.nextElementSibling:null;
   const rid=id==='row'?rowId(el):id;out.push({id:rid,label:id==='row'?'Строка «'+rid.slice(4)+'»':label,el,tail:t})}}return out}
function styleEl(k,e,edit){const st=k.style;
 if(!e){if(k.dataset.tpf){st.translate=st.scale=st.zIndex=st.transformOrigin='';if(k.dataset.tpf==='p')st.position='';delete k.dataset.tpf}k.classList.remove('tp-hide','tp-off');return}
 st.translate=e.x||e.y?`${e.x}px ${e.y}px`:'';st.scale=e.s!==1?String(e.s):'';st.transformOrigin=e.s!==1?'0 0':'';
 // сдвинутый элемент — над несдвинутыми (у фото z-index 2): z-index 3+слой; position:relative, если был static
 const mv=e.x||e.y||e.z;if(mv&&k.dataset.tpf!=='p'&&getComputedStyle(k).position==='static'){st.position='relative';k.dataset.tpf='p'}st.zIndex=mv?String(3+e.z):'';
 if(!k.dataset.tpf)k.dataset.tpf='1';k.classList.toggle('tp-hide',e.h&&!edit);k.classList.toggle('tp-off',e.h&&!!edit)}
// масштаб карточки: ширина в потоке прежняя (auto), внутри — W px; ResizeObserver подгоняет при смене ширины
const fitZoom=r=>{const W=+r.dataset.tpw;if(!W)return;r.style.zoom='';const k=Math.round(visW(r)/W*10000)/10000;if(k&&Math.abs(k-1)>.0005)r.style.zoom=String(k)};
const RO=new ResizeObserver(es=>{for(const x of es)if(x.target.dataset.tpw&&!(LE&&(LE.td||LE.sz)))fitZoom(x.target)});
// Строка «Создатель сайта» не входит в сохранённый сдвиг строк таблицы. Соседние строки уезжают вверх (translate),
// а она остаётся в потоке — между ними дыра, карточка выше, чем нужно. Подтягиваем только её, чужие x/y не трогаем.
function tightenCreator(root){const cr=root.querySelector('tr.creator-r');if(!cr)return;cr.style.marginTop='';if(cr.dataset.tpf)return;
 const rows=[...root.querySelectorAll('.tbl tr')].filter(tr=>tr!==cr);if(!rows.length)return;
 const bottom=Math.max(...rows.map(tr=>tr.getBoundingClientRect().bottom)),top=cr.getBoundingClientRect().top,gap=top-bottom;if(gap<=28)return;
 const zoom=parseFloat(getComputedStyle(root).zoom)||1;cr.style.marginTop=Math.round(-(gap-10)/zoom)+'px'}
// Сдвиги строк сохранены на узкой таблице (одна колонка, вторая колонка — это x). На широкой таблице CSS уже ставит две колонки, и те же x/y накладывают поля. Там строки остаются в сетке; явно заданные x/y узкой карточки не меняются.
function splitTable(root){const tb=root.querySelector('.tbl tbody');if(!tb)return false;return getComputedStyle(tb).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length>1}
function applyCard(root,ty,m,edit){
 if(m){if(root.dataset.tpw!==String(m.W)){root.dataset.tpw=m.W;RO.observe(root)}fitZoom(root)}else if(root.dataset.tpw){delete root.dataset.tpw;root.style.zoom='';RO.unobserve(root)}
 const wide=!edit&&splitTable(root);
 for(const {id,el,tail} of itemsOf(root,ty)){let e=m&&m.it[id]||null;if(e&&wide&&id.startsWith('row:'))e=null;for(const k of [el,tail])k&&styleEl(k,e,edit);
  const tag=ty+'|'+id;if(edit){if(el.dataset.tpi!==tag)el.dataset.tpi=tag}else if(el.dataset.tpi)delete el.dataset.tpi}
 if(ty==='prof'){if(edit){const cr=root.querySelector('tr.creator-r');if(cr)cr.style.marginTop=''}else tightenCreator(root)}}
let MO=null;
function applyAll(){const app=document.getElementById('app');if(!app)return;if(LE&&(LE.drag||LE.td||LE.sz))return;const sv=savedTpl(),edit=!!LE;
 if(MO)MO.disconnect();
 try{for(const ty in TPL_DEF){const T=edit?LE.tpl[ty]:tplOf(ty,sv[ty]),roots=app.querySelectorAll(TPL_DEF[ty].root);if(!roots.length)continue;
   if(!edit&&!T.w&&!T.n&&!app.querySelector(TPL_DEF[ty].root+'[data-tpw],'+TPL_DEF[ty].root+' [data-tpf]'))continue;roots.forEach(r=>applyCard(r,ty,effFor(r,ty,T),edit))}
  if(!edit)app.querySelectorAll('[data-tpi],.tp-off,.tp-sel').forEach(e=>{delete e.dataset.tpi;e.classList.remove('tp-off','tp-sel')})}
 finally{if(MO){MO.takeRecords();MO.observe(app,{childList:true,subtree:true})}}
 if(LE&&LE.sel&&!LE.sel.el.isConnected)reselect();else hud()}
NARROW.addEventListener('change',()=>{if(LE)select(null);applyAll()});
const hasCards=()=>{const app=document.getElementById('app');return !!app&&Object.values(TPL_DEF).some(d=>app.querySelector(d.root))};
const lbl=(pg,id)=>((DEF()[pg].blocks.find(b=>b[0]===id)||[])[1])||id;
// --- отрисовка в режиме правки: все блоки (и скрытые, и пока пустые), зоны всегда на месте ---
function render(parts){const pg=LE.pg,{side,blocks}=LE.draft,Z={top:[],main:[],side:[],bot:[]};let cols=false;
 for(const b of blocks){if(b.col==='full')Z[cols?'bot':'top'].push(b);else{cols=true;Z[b.col].push(b)}}
 const blk=b=>`<div class="lb lb-${b.size} le-b${b.show?'':' le-off'}" data-lb="${b.id}" data-size="${b.size}" data-show="${b.show?1:0}">
<div class="le-h"><span class="le-g" aria-hidden="true">⠿</span><b class="le-t">${esc(lbl(pg,b.id))}</b><button type="button" class="le-eye" data-le="eye" title="${b.show?'Скрыть блок':'Показать блок'}" aria-pressed="${b.show}">${b.show?'👁':'⊘'}</button></div>
${parts[b.id]||'<div class="blk le-empty">Сейчас пусто — блок появится на странице, когда будет содержимое.</div>'}
<div class="le-f"><span class="le-sz">Размер: ${SZL[b.size]}</span><span class="le-rs" data-le="rs" title="Тянуть вправо — крупнее, влево — компактнее; нажатие — следующий размер">⇲ ${b.size.toUpperCase()}</span></div></div>`;
 const zone=(z,t)=>`<div class="le-z le-full" data-z="${z}" data-t="${t}">${Z[z].map(blk).join('')}</div>`;
 return zone('top','Сюда — на всю ширину, над колонками')+`<div class="grid lay lay-${side} le-cols"><div class="lay-main le-z" data-z="main" data-t="Левая колонка">${Z.main.map(blk).join('')}</div><div class="side lay-side le-z" data-z="side" data-t="Правая колонка"><span class="le-sw" data-le="sw" title="Ширина правой колонки — тянуть влево/вправо">⇔ ${SIDEW[side]}</span>${Z.side.map(blk).join('')}</div></div>`+zone('bot','Сюда — на всю ширину, под колонками')}
window.VPPKA_LE=pg=>LE&&LE.pg&&LE.pg===pg?render:null;
// во время перетаскивания страницу не перерисовываем (живые обновления ждут отпускания)
const r0=window.route;if(r0)window.route=function(){if(LE&&LE.drag){LE.pend=1;return}const y=scrollY,h=location.hash,r=r0.apply(this,arguments);if(LE&&h===LE.h)scrollTo(0,y);if(LE)LE.h=h;return r};
const rerender=()=>{window.route&&window.route();bar()};
function grabDraft(){if(!LE.pg)return;const L=[];for(const z of ['top','main','side','bot']){const host=document.querySelector(`.le-z[data-z="${z}"]`);if(!host)continue;
  host.querySelectorAll(':scope>.le-b').forEach(e=>L.push({id:e.dataset.lb,col:z==='top'||z==='bot'?'full':z,size:e.dataset.size,show:e.dataset.show==='1'}))}
 if(L.length)LE.draft.blocks=L}
const normT=()=>{const o={};for(const ty in TPL_DEF)o[ty]=tplOf(ty,LE.tpl[ty]);return o};
const snap=()=>JSON.stringify({d:LE.draft,t:normT()}),dirty=()=>!!LE&&snap()!==LE.base;
// --- панель внизу и кнопка в верхней строке ---
function bar(){let b=document.getElementById('le-bar');if(!LE){b&&b.remove();document.body.classList.remove('le-on');document.body.style.removeProperty('--le-bar-h');return}
 document.body.classList.add('le-on');if(!b){b=document.createElement('div');b.id='le-bar';b.setAttribute('role','toolbar');document.body.appendChild(b)}
 const NT=normT(),isDef=(!LE.pg||JSON.stringify(LE.draft)===JSON.stringify(window.VPPKA_LAYOUT(LE.pg,{})))&&Object.keys(TPL_DEF).every(ty=>tplJ(NT[ty])===defJ()),S=LE.sel;
 let row='';if(S&&S.el.isConnected){const r=rootOf(S.el),it=r&&itemsOf(r,S.ty).find(i=>i.id===S.id),m=r&&effFor(r,S.ty,LE.tpl[S.ty]),e=m&&m.it[S.id]||{x:0,y:0,s:1,z:0,h:false},ph=mode()==='n',pc=v=>m?Math.round(v/m.W*1000)/10:0;
  const cardDef=ph?!LE.tpl[S.ty].n:!LE.tpl[S.ty].w;
  row=`<div class="w le-bw le-sel"><span class="le-info"><b>${esc(TPL_DEF[S.ty].title)} → ${esc(it?it.label:S.id)}</b><small><span class="le-pos">${ph?'Телефон':'Компьютер'} · X ${pc(e.x)}% Y ${pc(e.y)}% · ×${e.s} · слой ${e.z}</span><span class="le-hint"> · во всех таких карточках. Тянуть — куда угодно (сетка 2%, Alt — без сетки), ◢ — размер, стрелки — точнее.</span></small></span>
<span class="le-act"><button type="button" class="btn sm o" data-le="tshow">${e.h?'Показать':'Скрыть'}</button><span class="le-szb" role="group" aria-label="Размер">${[['S',.85],['M',1],['L',1.2]].map(([n,v])=>`<button type="button" class="${e.s===v?'on':''}" data-le="tsize" data-v="${v}">${n}</button>`).join('')}</span><span class="le-szb" role="group" aria-label="Слой"><button type="button" data-le="tz" data-v="1" title="Выше других">▲</button><button type="button" data-le="tz" data-v="-1" title="Ниже других">▼</button></span>${S.up?'<button type="button" class="btn sm o" data-le="tup">↑ Внешний элемент</button>':''}<button type="button" class="btn sm o" data-le="tback"${m&&m.it[S.id]?'':' disabled'}>На место</button><button type="button" class="btn sm o" data-le="treset"${cardDef?' disabled':''}>Сброс карточки</button><button type="button" class="btn sm o" data-le="tnone" title="Снять выбор">✕</button></span></div>`}
 b.innerHTML=row+`<div class="w le-bw"><span class="le-info"><b>Правка: ${esc(LE.pg?DEF()[LE.pg].title:'карточки на странице')}</b><small>${LE.msg?esc(LE.msg):dirty()?'Есть несохранённые изменения':isDef?'Как по умолчанию':'Сохранено'} · ${LE.pg?'блок — тянуть за заголовок; ':''}элемент карточки — нажать (выбрать) и тянуть куда угодно; пальцем — удерживать</small></span>
<span class="le-act"><button type="button" class="btn sm" data-le="save"${LE.busy||!dirty()?' disabled':''}>Сохранить</button><button type="button" class="btn sm o" data-le="cancel">Отмена</button><button type="button" class="btn sm o" data-le="reset"${isDef?' disabled':''}>Сброс</button></span></div>`;
 document.body.style.setProperty('--le-bar-h',b.offsetHeight+'px')}
function tog(){const on=owner()&&(!!key()||!!LE||hasCards()),w=document.querySelector('.util .w'),app=document.getElementById('app');
 // компьютер — в верхней строке; телефон (верхняя строка скрыта) — отдельной полосой над страницей, в потоке
 for(const [id,host,before] of [['le-tog',w,null],['le-tog2',app&&app.parentNode,app]]){let t=document.getElementById(id);
  if(!on||!host){t&&(id==='le-tog2'?t.parentNode.remove():t.remove());continue}
  if(!t){t=document.createElement('button');t.type='button';t.id=id;t.className='le-tog';t.dataset.le='toggle';
   if(before){const d=document.createElement('div');d.className='w le-top';d.appendChild(t);host.insertBefore(d,before)}else host.appendChild(t)}
  t.textContent=LE?'✕ Закончить правку':'✎ Редактировать страницу';t.setAttribute('aria-pressed',LE?'true':'false')}}
function enter(pg){if(!owner())return;pg=DEF()[pg]?pg:'';const d=pg?window.VPPKA_LAYOUT(pg):null,sv=savedTpl(),T={};for(const ty in TPL_DEF)T[ty]=tplOf(ty,sv[ty]);
 LE={pg,draft:d&&clone(d),tpl:T,drag:null,td:null,sz:null,sel:null,msg:''};LE.base=snap();rerender();applyAll();tog()}
function exit(){LE=null;noGuides();rerender();applyAll();tog()}
async function save(){if(!LE||LE.busy)return;LE.busy=true;LE.msg='Сохраняю…';bar();const pg=LE.pg,draft=pg&&clone(LE.draft),sv=savedTpl(),tpl={};
 // шаблоны: пишем только изменённые типы целиком (mergeFields — иначе merge оставил бы удалённые ключи); вернули к виду по умолчанию — null
 const NT=normT();for(const ty in TPL_DEF){const j=tplJ(NT[ty]);if(j!==tplJ(tplOf(ty,sv[ty])))tpl[ty]=j===defJ()?null:clone(NT[ty])}
 const body={},fields=[];if(pg){body.layout={[pg]:draft};fields.push('layout.'+pg)}if(Object.keys(tpl).length){body.tpl=tpl;for(const ty in tpl)fields.push('tpl.'+ty)}
 try{const fb=window.VPPKA_FB,F=fb.F;await Promise.race([F.setDoc(F.doc(fb.db,'content','settings'),body,{mergeFields:fields}),new Promise((_,j)=>setTimeout(()=>j({code:'timeout'}),15000))]);
  const cur=((window.VPPKA_C&&window.VPPKA_C())||{}).settings||{},nt={...(cur.tpl||{})};for(const ty in tpl){if(tpl[ty])nt[ty]=tpl[ty];else delete nt[ty]}
  LE.base=snap();LE.msg='Сохранено — действует для всех посетителей.';LE.busy=false;
  window.VPPKA_APPLY_CONTENT&&window.VPPKA_APPLY_CONTENT({settings:{...cur,...(pg?{layout:{...(cur.layout||{}),[pg]:draft}}:{}),tpl:nt}})}
 catch(e){LE.busy=false;LE.msg=e&&e.code==='permission-denied'?'Нет прав: менять вид страниц может только владелец.':e&&e.code==='timeout'?'Сервер не ответил за 15 с — не сохранено (проверьте связь).':'Не сохранено: '+((e&&e.message)||e)}bar()}
// --- элементы карточек: выбрать, поставить куда угодно внутри карточки, размер (уголок ◢), слой, скрыть — в панели ---
const tpOf=el=>{const [ty,id]=el.dataset.tpi.split('|');return {ty,id}};
const rootOf=el=>{const {ty}=tpOf(el);return el.closest(TPL_DEF[ty].root)};
// раскладка текущего вида (компьютер/телефон) для правки; root — заводит раскладку при первой правке (W = нынешняя ширина карточки)
function curMap(ty,root){const T=LE.tpl[ty],k=mode(),m=root?effFor(root,ty,T):(k==='w'?T.w:T.n||T.w);if(!root)return m;
 if(k==='w'){if(!T.w)T.w={W:Math.round(visW(root)*10)/10,it:{}};return T.w}
 if(!T.n)T.n=m?clone(m):{W:Math.round(visW(root)*10)/10,it:{}};return T.n}
const ent=(ty,id,root)=>{const m=curMap(ty,root);return m.it[id]||(m.it[id]={x:0,y:0,s:1,z:0,h:false})};
const zk=r=>+r.style.zoom||1;
const live=(ty,id,e)=>document.querySelectorAll(`[data-tpi="${CSS.escape(ty+'|'+id)}"]`).forEach(el=>{styleEl(el,e,true);const t=el.nextElementSibling;
 const d=TPL_DEF[ty].items.find(i=>i[0]===id);if(d&&d[3]&&t&&t.matches(d[3]))styleEl(t,e,true)});
function select(el){document.querySelectorAll('.tp-sel').forEach(e=>e.classList.remove('tp-sel'));if(!el||!el.isConnected){LE.sel=null;bar();hud();return}
 const k=tpOf(el),r=rootOf(el),u=el.parentElement&&el.parentElement.closest('[data-tpi]');LE.sel={...k,el,up:u&&r&&r.contains(u)?u:null};
 document.querySelectorAll(`[data-tpi="${CSS.escape(el.dataset.tpi)}"]`).forEach(e=>e.classList.add('tp-sel'));bar();hud()}
function reselect(){const S=LE.sel;if(!S)return;if(!S.el.isConnected){const n=document.querySelector(`[data-tpi="${CSS.escape(S.ty+'|'+S.id)}"]`);select(n)}else{bar();hud()}}
// уголок размера у выбранного элемента и линии выравнивания — поверх страницы (fixed)
const ov=id=>{let d=document.getElementById(id);if(!d){d=document.createElement('div');d.id=id;d.className='tp-ov';document.body.appendChild(d)}return d};
function hud(){const S=LE&&LE.sel,h=document.getElementById('tp-hd');if(!S||!S.el.isConnected||LE.drag||LE.td){h&&h.remove();return}
 const r=S.el.getBoundingClientRect(),d=ov('tp-hd');d.textContent='◢';d.title='Тянуть — размер элемента';d.style.left=(r.right-11)+'px';d.style.top=(r.bottom-11)+'px'}
function guide(id,v,a,b,vert){const g=ov(id);if(v==null){g.hidden=true;return}g.hidden=false;
 Object.assign(g.style,vert?{left:v+'px',top:a+'px',width:'0',height:(b-a)+'px'}:{left:a+'px',top:v+'px',width:(b-a)+'px',height:'0'})}
const noGuides=()=>{for(const id of ['tp-gx','tp-gy'])document.getElementById(id)?.remove()};
function tdStart(el,x,y){const {ty,id}=tpOf(el),root=rootOf(el);if(!root)return;const e=ent(ty,id,root);applyCard(root,ty,curMap(ty,root),true);const rr=root.getBoundingClientRect();
 // линии выравнивания: края и середина карточки и других элементов (кроме своих предков и потомков)
 const lx=[rr.left,rr.left+rr.width/2,rr.right],ly=[rr.top,rr.top+rr.height/2,rr.bottom];
 root.querySelectorAll('[data-tpi]').forEach(o=>{if(o===el||o.contains(el)||el.contains(o))return;const q=o.getBoundingClientRect();if(!q.width||!q.height)return;
  lx.push(q.left,q.left+q.width/2,q.right);ly.push(q.top,q.top+q.height/2,q.bottom)});
 LE.td={el,ty,id,root,rr,r0:el.getBoundingClientRect(),x0:e.x,y0:e.y,sx:x,sy:y,k:zk(root),lx,ly,moved:false};el.classList.add('tp-moving');document.body.classList.add('le-dragging');hud();navigator.vibrate&&navigator.vibrate(12)}
function fit(p,len,lines,lo,hi,grid,alt){ // p — левый/верхний край (px экрана); прижим к линиям ±6px, иначе сетка; внутри карточки
 if(len<=hi-lo)p=Math.min(hi-len,Math.max(lo,p));if(alt)return [p,null];let best=null;
 for(const L of lines)for(const k of [0,.5,1]){const d=L-(p+len*k);if(Math.abs(d)<=6&&(!best||Math.abs(d)<Math.abs(best[0])))best=[d,L]}
 if(best)return [p+best[0],best[1]];return [lo+Math.round((p-lo)/grid)*grid,null]}
function tdMove(x,y,alt){const D=LE.td;if(!D||!D.el.isConnected)return;const {rr,r0}=D;D.moved=true;
 const [L,gx]=fit(r0.left+x-D.sx,r0.width,D.lx,rr.left,rr.right,rr.width/50,alt),[T,gy]=fit(r0.top+y-D.sy,r0.height,D.ly,rr.top,rr.bottom,rr.width/50,alt);
 const e=ent(D.ty,D.id,D.root);e.x=Math.round((D.x0+(L-r0.left)/D.k)*2)/2;e.y=Math.round((D.y0+(T-r0.top)/D.k)*2)/2;live(D.ty,D.id,e);
 guide('tp-gx',gx,rr.top,rr.bottom,true);guide('tp-gy',gy,rr.left,rr.right,false)}
function tdEnd(){const D=LE.td;LE.td=null;document.body.classList.remove('le-dragging');noGuides();if(!D)return;D.el.classList.remove('tp-moving');if(D.moved)LE.msg='';
 applyAll();select(D.el.isConnected?D.el:null)}
function szStart(x,y){const S=LE.sel;if(!S)return;const root=rootOf(S.el),e=ent(S.ty,S.id,root),r=S.el.getBoundingClientRect();
 LE.sz={ty:S.ty,id:S.id,root,s0:e.s,ox:r.left,oy:r.top,d0:Math.max(8,Math.hypot(x-r.left,y-r.top))};document.body.classList.add('le-dragging')}
function szMove(x,y,alt){const Z=LE.sz;if(!Z)return;let s=Z.s0*Math.hypot(x-Z.ox,y-Z.oy)/Z.d0;s=Math.min(3,Math.max(.3,alt?s:Math.round(s*20)/20));
 const e=ent(Z.ty,Z.id,Z.root);e.s=Math.round(s*100)/100;live(Z.ty,Z.id,e);hud()}
function szEnd(){LE.sz=null;document.body.classList.remove('le-dragging');LE.msg='';applyAll();reselect()}
// --- перетаскивание блоков (FLIP-анимация соседей, автопрокрутка у краёв окна) ---
function flip(fn){const els=[...document.querySelectorAll('.le-b:not(.le-drag),.le-ph')],r0=new Map(els.map(e=>[e,e.getBoundingClientRect()]));fn();
 for(const e of els){const a=r0.get(e),b=e.getBoundingClientRect(),dx=a.left-b.left,dy=a.top-b.top;if(!dx&&!dy)continue;
  e.style.transition='none';e.style.transform=`translate(${dx}px,${dy}px)`;e.getBoundingClientRect();e.style.transition='transform .18s ease';e.style.transform='';setTimeout(()=>{e.style.transition=''},200)}}
function startDrag(el,x,y){const r=el.getBoundingClientRect(),ph=document.createElement('div');ph.className='le-ph';ph.style.height=Math.min(r.height,320)+'px';el.before(ph);
 Object.assign(el.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px'});el.classList.add('le-drag');
 LE.drag={el,ph,dx:x-r.left,dy:Math.min(y-r.top,40),x,y};document.body.classList.add('le-dragging');navigator.vibrate&&navigator.vibrate(12);moveDrag(x,y);loop()}
function moveDrag(x,y){const D=LE&&LE.drag;if(!D)return;if(!D.el.isConnected){endDrag(true);return}D.x=x;D.y=y;D.el.style.transform=`translate(${x-D.dx-parseFloat(D.el.style.left)}px,${y-D.dy-parseFloat(D.el.style.top)}px)`;
 const hit=document.elementFromPoint(x,y),z=hit&&hit.closest&&hit.closest('.le-z');if(!z)return;
 const kids=[...z.querySelectorAll(':scope>.le-b:not(.le-drag)')];let before=null;for(const k of kids){const b=k.getBoundingClientRect();if(y<b.top+b.height/2){before=k;break}}
 if(before?D.ph.nextElementSibling===before&&D.ph.parentNode===z:D.ph.parentNode===z&&!kids.some(k=>D.ph.compareDocumentPosition(k)&Node.DOCUMENT_POSITION_FOLLOWING))return;
 flip(()=>{before?z.insertBefore(D.ph,before):z.appendChild(D.ph)})}
function loop(){const D=LE&&LE.drag;if(!D)return;const e=48;let v=0;if(D.y<e)v=-Math.ceil((e-D.y)/4);else if(D.y>innerHeight-e)v=Math.ceil((D.y-innerHeight+e)/4);if(v){scrollBy(0,v);moveDrag(D.x,D.y)}requestAnimationFrame(loop)}
function endDrag(abort){const D=LE&&LE.drag;if(!D)return;LE.drag=null;document.body.classList.remove('le-dragging');
 if(D.el.isConnected&&D.ph.isConnected&&!abort){D.ph.replaceWith(D.el)}else D.ph.remove();D.el.classList.remove('le-drag');Object.assign(D.el.style,{left:'',top:'',width:'',transform:''});
 grabDraft();LE.msg='';rerender();LE.pend=0}
// --- размер блока (S/M/L) и ширина правой колонки: тянуть с привязкой ---
function startRs(el,x){LE.rs={el,x,i:SZ.indexOf(el.dataset.size),moved:false}}
function moveRs(x){const R=LE.rs;if(Math.abs(x-R.x)>6)R.moved=true;const i=Math.max(0,Math.min(2,R.i+Math.round((x-R.x)/70))),s=SZ[i];if(s===R.el.dataset.size)return;
 flip(()=>{R.el.classList.remove('lb-s','lb-m','lb-l');R.el.classList.add('lb-'+s);R.el.dataset.size=s;R.el.querySelector('.le-rs').textContent='⇲ '+s.toUpperCase();R.el.querySelector('.le-sz').textContent='Размер: '+SZL[s]})}
function endRs(){const R=LE.rs;LE.rs=null;if(!R.moved){const s=SZ[(SZ.indexOf(R.el.dataset.size)+1)%3];R.el.dataset.size=s}grabDraft();rerender()}
function startSw(x){const g=document.querySelector('.le-cols');if(!g||innerWidth<861)return;LE.sw={g,side:LE.draft.side}}
function moveSw(x){const S=LE.sw,r=S.g.getBoundingClientRect(),want=r.right-x,W=r.width;
 const opt={s:260,m:300,l:360,w:(W-24)/3,h:(W-20)*1.2/2.2};let best='m',d=1e9;for(const k in opt){const v=Math.abs(opt[k]-want);if(v<d){d=v;best=k}}
 if(best===S.side)return;S.side=best;flip(()=>{S.g.className=S.g.className.replace(/\blay-[smlwh]\b/,'lay-'+best)});const t=S.g.querySelector('.le-sw');if(t)t.textContent='⇔ '+SIDEW[best]}
function endSw(){const S=LE.sw;LE.sw=null;LE.draft.side=S.side;grabDraft();rerender()}
// --- ввод: мышь — сразу (после сдвига на 4px), палец/перо — долгое нажатие 350 мс; иначе обычная прокрутка ---
let P=null;
document.addEventListener('pointerdown',e=>{if(!LE||e.button>0)return;const t=e.target;
 const rs=t.closest&&t.closest('.le-rs');if(rs){e.preventDefault();startRs(rs.closest('.le-b'),e.clientX);P={id:e.pointerId,k:'rs'};return}
 if(t.closest&&t.closest('.le-sw')){e.preventDefault();startSw(e.clientX);if(LE.sw)P={id:e.pointerId,k:'sw'};return}
 if(t.closest&&t.closest('#tp-hd')){e.preventDefault();szStart(e.clientX,e.clientY);if(LE.sz)P={id:e.pointerId,k:'tsz'};return}
 let tp=t.closest&&t.closest('[data-tpi]');const sl=LE.sel&&LE.sel.el;if(tp&&sl&&sl!==tp&&sl.isConnected&&sl.contains(tp))tp=sl; // выбран внешний — тянется он
 if(tp&&!t.closest('.le-h,.le-f')){if(e.pointerType==='mouse')e.preventDefault();P={id:e.pointerId,k:'tpend',el:tp,x:e.clientX,y:e.clientY,touch:e.pointerType!=='mouse'};
  if(P.touch){tp.classList.add('le-hold');P.timer=setTimeout(()=>{if(P&&P.k==='tpend'){tp.classList.remove('le-hold');P.k='td';select(tp);tdStart(tp,P.x,P.y)}},350)}return}
 const b=t.closest&&t.closest('.le-b');if(!b||t.closest('button,a,input,select,textarea,label,summary')&&!t.closest('.le-h'))return;if(t.closest('.le-eye'))return;
 P={id:e.pointerId,k:'pend',b,x:e.clientX,y:e.clientY,touch:e.pointerType!=='mouse'};
 if(P.touch){b.classList.add('le-hold');P.timer=setTimeout(()=>{if(P&&P.k==='pend'){b.classList.remove('le-hold');P.k='drag';startDrag(b,P.x,P.y)}},350)}else e.preventDefault()},true);
document.addEventListener('pointermove',e=>{if(!P||e.pointerId!==P.id)return;
 if(P.k==='tpend'){const d=Math.hypot(e.clientX-P.x,e.clientY-P.y);if(P.touch){if(d>8){clearTimeout(P.timer);P.el.classList.remove('le-hold');P=null}return}
  if(d>4){P.k='td';select(P.el);tdStart(P.el,P.x,P.y)}return}
 if(P.k==='pend'){const d=Math.hypot(e.clientX-P.x,e.clientY-P.y);if(P.touch){if(d>8){clearTimeout(P.timer);P.b.classList.remove('le-hold');P=null}else{P.x=e.clientX;P.y=e.clientY}return}
  if(d>4){P.k='drag';startDrag(P.b,e.clientX,e.clientY)}return}
 e.preventDefault();if(P.k==='drag')moveDrag(e.clientX,e.clientY);else if(P.k==='rs')moveRs(e.clientX);else if(P.k==='sw')moveSw(e.clientX);else if(P.k==='td')tdMove(e.clientX,e.clientY,e.altKey);else if(P.k==='tsz')szMove(e.clientX,e.clientY,e.altKey)},{passive:false});
const up=e=>{if(!P||e.pointerId!==P.id)return;const k=P.k;clearTimeout(P.timer);P.b&&P.b.classList.remove('le-hold');const pe=P.el;pe&&pe.classList.remove('le-hold');P=null;if(k==='tpend'){if(e.type==='pointerup')select(pe);return}if(k==='td')tdEnd();else if(k==='tsz')szEnd();else if(k==='drag')endDrag(e.type==='pointercancel');else if(k==='rs')endRs();else if(k==='sw')endSw()};
document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
// пока блок «в руке», страница пальцем не прокручивается (автопрокрутка — у краёв окна)
document.addEventListener('touchmove',e=>{if(P&&P.k!=='pend'&&P.k!=='tpend')e.preventDefault()},{passive:false});
document.addEventListener('contextmenu',e=>{if(LE&&e.target.closest&&e.target.closest('.le-b,[data-tpi]'))e.preventDefault()});
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-le]');
 if(LE&&e.target.closest&&e.target.closest('.le-b,[data-tpi]')&&!b){e.preventDefault();e.stopPropagation();return}
 if(!b)return;const k=b.dataset.le;
 if(k==='toggle'){e.preventDefault();LE?(!dirty()||confirm('Выйти без сохранения изменений?'))&&exit():enter(key());return}
 if(!LE)return;e.preventDefault();e.stopPropagation();
 if(k==='eye'){const el=b.closest('.le-b');el.dataset.show=el.dataset.show==='1'?'0':'1';grabDraft();rerender()}
 else if(k==='save')save();else if(k==='cancel'){if(!dirty()||confirm('Отменить несохранённые изменения?'))exit()}
 else if(k==='reset'){if(LE.pg)LE.draft=clone(window.VPPKA_LAYOUT(LE.pg,{}));for(const ty in TPL_DEF)LE.tpl[ty]={w:null,n:null};select(null);LE.msg='Сброшено к виду по умолчанию (страница и карточки) — нажмите «Сохранить».';rerender();applyAll()}
 else if(k[0]==='t'&&LE.sel){const S=LE.sel;if(k==='tnone'){select(null);return}if(k==='tup'){S.up&&select(S.up);return}
  const R=rootOf(S.el);if(!R)return;
  if(k==='treset'){LE.tpl[S.ty][mode()]=null}else if(k==='tback')delete curMap(S.ty,R).it[S.id];
  else{const e=ent(S.ty,S.id,R);if(k==='tshow')e.h=!e.h;else if(k==='tsize')e.s=+b.dataset.v;else if(k==='tz')e.z=Math.max(-2,Math.min(20,e.z+ +b.dataset.v))}
  LE.msg='';applyAll();reselect()}},true);
// стрелки — сдвиг выбранного элемента на 1 px (Shift — на 10 px)
document.addEventListener('keydown',e=>{if(!LE||!LE.sel||LE.td||!/^Arrow/.test(e.key)||e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]'))return;
 e.preventDefault();const S=LE.sel,R=rootOf(S.el);if(!R)return;const v=e.shiftKey?10:1,x=ent(S.ty,S.id,R);if(e.key==='ArrowLeft')x.x-=v;else if(e.key==='ArrowRight')x.x+=v;else if(e.key==='ArrowUp')x.y-=v;else x.y+=v;
 LE.msg='';applyAll();reselect()});
addEventListener('scroll',()=>LE&&LE.sel&&hud(),{passive:true});addEventListener('resize',()=>LE&&LE.sel&&hud());
// смена страницы — выход из правки; вход по ссылке из #admin (sessionStorage vppka_le)
addEventListener('hashchange',()=>{if(LE&&key()!==LE.pg){ // другая страница: черновик раскладки сбрасывается, правка карточек продолжается
  const pg=DEF()[key()]?key():'',sv=savedTpl(),B={};for(const ty in TPL_DEF)B[ty]=tplOf(ty,sv[ty]);
  LE.pg=pg;LE.draft=pg?clone(window.VPPKA_LAYOUT(pg)):null;LE.sel=null;LE.msg='';LE.base=JSON.stringify({d:LE.draft,t:B});setTimeout(rerender,0)}setTimeout(()=>{tog();const w=sessionStorage.getItem('vppka_le');if(w&&w===key()&&owner()){sessionStorage.removeItem('vppka_le');enter(w)}},0)});
let n=0;const boot=()=>{tog();const w=sessionStorage.getItem('vppka_le');if(w&&w===key()&&owner()){sessionStorage.removeItem('vppka_le');enter(w)}if(++n<60&&!owner())setTimeout(boot,1000)};setTimeout(boot,300);
// шаблоны карточек — для всех посетителей: после каждой перерисовки #app
const startMO=()=>{const app=document.getElementById('app');if(!app||MO)return;MO=new MutationObserver(()=>applyAll());MO.observe(app,{childList:true,subtree:true});applyAll()};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',startMO):startMO();
window.VPPKA_LAY_READY=true;window.VPPKA_LAYEDIT={enter,exit,state:()=>LE,applyAll};
if(window.VPPKA_TPL_READY&&(location.hash.slice(1)||'').split('/')[0]==='member'&&document.querySelector('.mpg-skel'))window.route&&window.route();
})();
