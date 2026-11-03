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
// ===== шаблоны карточек: порядок / размер / видимость элементов внутри карточки — общий для всех карточек типа =====
// content/settings.tpl[тип] = {слот:[{id,show,size}]}. Нет сохранённого шаблона — DOM не трогаем (вид по умолчанию 1:1).
// Применяется к уже нарисованному DOM (MutationObserver на #app), поэтому рендеры страниц не меняются.
// item: [id, подпись, селектор прямого потомка, размеры ('sml' | 'sm' | ''), селектор «хвоста» — соседа, который ходит вместе]
const TPL_DEF={
 // карточки членов и руководства (pm-card, ldr-pc, lc) — имя поверх фото: там переставляется только текст, фото остаётся на месте
 pcard:{title:'Карточка члена партии',root:'a.pm-card:not(.ldr-pc)',slots:{inf:[':scope>.pm-inf',[['n','ФИО','.pm-n','sml'],['r','Должность','.pm-r','sml']]]}},
 pldr:{title:'Карточка руководителя в списке членов',root:'a.pm-card.ldr-pc',slots:{inf:[':scope>.pm-inf',[['n','ФИО','.pm-n','sml'],['r','Должность','.pm-r','sml']]]}},
 lcard:{title:'Карточка руководителя',root:'a.lc',slots:{inf:[':scope>.lc-inf',[['n','ФИО','.lc-n','sml'],['r','Должность','.lc-r','sml']]]}},
 lplate:{title:'Плашка руководителя',root:'.lc-pl',slots:{pl:[':scope',[['n','ФИО','.lc-pn','sml'],['r','Должность','.lc-pr','sml'],['q','Цитата','.lc-pq','sml']]]}},
 news:{title:'Карточка новости',root:'.nl>.it',slots:{card:[':scope',[['d','Дата','.d','sml'],['bd','Текст новости','div:not(.d)','']]],bd:[':scope>div:not(.d)',[['ph','Фото','a:has(>.nthumb)','sm'],['t','Заголовок','h3','sml'],['x','Начало текста','p','sml'],['meta','Фото/видео — счётчик','.nmeta','sml'],['like','Отметка «нравится»','.nlike','']]]}},
 an:{title:'Карточка объявления',root:'article.an-it:not(.an-ed)',slots:{card:[':scope',[['dt','Дата (плитка)','.an-dt','sm'],['bd','Текст объявления','.an-bd','']]],bd:[':scope>.an-bd',[['hd','Метки и кнопки','.an-hd',''],['t','Заголовок','h3','sml'],['meta','Время и место','.an-meta','sml'],['tx','Текст','.an-tx','sml','.an-more'],['r','Причина отмены','.an-r','sml'],['ft','Автор и дата публикации','.an-ft','sml']]]}},
 prof:{title:'Профиль участника',root:'.mpg>.prof',slots:{card:[':scope',[['badge','Знак «Руководство партии»','.ldr-badge',''],['ph','Фото','.prof-ph','sm'],['info','Сведения','div:not(.prof-ph):not(.ldr-badge)','']]],info:[':scope>div:not(.prof-ph):not(.ldr-badge)',[['role','Группа','.role','sml'],['n','ФИО','.prof-n','sml'],['q','Цитата','.quote','sml'],['tbl','Таблица сведений','.tbl','sml'],['duty','Кнопка «Обязанности»','.duty-btn',''],['txt','О себе и достижения','.prof-txt','sml','.ptx-more']]]}}};
window.VPPKA_TPL_DEF=TPL_DEF;
const tplDefault=ty=>{const o={};for(const s in TPL_DEF[ty].slots)o[s]=TPL_DEF[ty].slots[s][1].map(([id])=>({id,show:true,size:'m'}));return o};
function tplOf(ty,sv){const o=tplDefault(ty);if(!sv||typeof sv!=='object')return o;
 for(const s in o){const L=Array.isArray(sv[s])?sv[s]:null;if(!L)continue;const D=TPL_DEF[ty].slots[s][1],seen=new Set(),out=[];
  for(const x of L){const d=x&&D.find(i=>i[0]===x.id);if(!d||seen.has(x.id))continue;seen.add(x.id);const sz=(d[3]||'m').includes(x.size)?x.size:'m';out.push({id:x.id,show:x.show!==false,size:sz})}
  for(const it of o[s])if(!seen.has(it.id))out.push(it);o[s]=out}return o}
window.VPPKA_TPL=tplOf;
const savedTpl=()=>{const s=(((window.VPPKA_C&&window.VPPKA_C())||{}).settings||{}).tpl;return s&&typeof s==='object'?s:{}};
const defJ=ty=>JSON.stringify(tplDefault(ty));
function applyCard(root,ty,T,edit){const SL=TPL_DEF[ty].slots;
 for(const s in SL){const [hs,D]=SL[s],host=hs===':scope'?root:root.querySelector(hs);if(!host)continue;const kids=[...host.children],used=new Set(),units=[];
  for(const it of T[s]){const d=D.find(i=>i[0]===it.id);const el=kids.find(k=>!used.has(k)&&k.matches(d[2]));if(!el)continue;used.add(el);
   const tail=d[4]&&el.nextElementSibling&&el.nextElementSibling.matches(d[4])?el.nextElementSibling:null;units.push({el,tail,it})}
  // порядок: на места найденных элементов ставим их в порядке шаблона (прочие дети остаются где были)
  const inDom=units.slice().sort((a,b)=>a.el.compareDocumentPosition(b.el)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
  if(inDom.some((u,i)=>u!==units[i])){const marks=inDom.map(u=>{const m=document.createComment('tp');host.insertBefore(m,u.el);return m});
   units.forEach((u,i)=>{marks[i].replaceWith(u.el);if(u.tail)u.el.after(u.tail)})}
  for(const {el,tail,it} of units){const hide=!it.show,ks=[el,tail].filter(Boolean);
   for(const k of ks){k.classList.toggle('tp-hide',hide&&!edit);k.classList.toggle('tp-off',hide&&!!edit)}
   el.classList.toggle('tp-s',it.size==='s');el.classList.toggle('tp-l',it.size==='l');
   const tag=ty+'|'+s+'|'+it.id;if(edit){if(el.dataset.tpi!==tag)el.dataset.tpi=tag}else if(el.dataset.tpi)delete el.dataset.tpi}}}
let MO=null;
function applyAll(){const app=document.getElementById('app');if(!app)return;if(LE&&(LE.drag||LE.td))return;const sv=savedTpl(),edit=!!LE;
 if(MO)MO.disconnect();
 try{for(const ty in TPL_DEF){const T=edit?LE.tpl[ty]:sv[ty]?tplOf(ty,sv[ty]):null;if(!T)continue;app.querySelectorAll(TPL_DEF[ty].root).forEach(r=>applyCard(r,ty,T,edit))}
  // выход из правки/сброс: снять метки, если шаблона больше нет
  if(!edit)app.querySelectorAll('[data-tpi],.tp-off').forEach(e=>{delete e.dataset.tpi;e.classList.remove('tp-off','tp-sel')})}
 finally{if(MO){MO.takeRecords();MO.observe(app,{childList:true,subtree:true})}}}
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
const snap=()=>JSON.stringify({d:LE.draft,t:LE.tpl}),dirty=()=>!!LE&&snap()!==LE.base;
// --- панель внизу и кнопка в верхней строке ---
function bar(){let b=document.getElementById('le-bar');if(!LE){b&&b.remove();document.body.classList.remove('le-on');return}
 document.body.classList.add('le-on');if(!b){b=document.createElement('div');b.id='le-bar';b.setAttribute('role','toolbar');document.body.appendChild(b)}
 const isDef=(!LE.pg||JSON.stringify(LE.draft)===JSON.stringify(window.VPPKA_LAYOUT(LE.pg,{})))&&Object.keys(TPL_DEF).every(ty=>JSON.stringify(LE.tpl[ty])===defJ(ty));
 const S=LE.sel,sd=S&&TPL_DEF[S.ty].slots[S.s][1].find(i=>i[0]===S.id),si=S&&LE.tpl[S.ty][S.s].find(i=>i.id===S.id);
 const row=S&&sd&&si?`<div class="w le-bw le-sel"><span class="le-info"><b>${esc(TPL_DEF[S.ty].title)} → ${esc(sd[1])}</b><small>Меняется во всех таких карточках. Тянуть элемент — переставить внутри карточки.</small></span>
<span class="le-act"><button type="button" class="btn sm o" data-le="tshow">${si.show?'Скрыть':'Показать'}</button>${(sd[3]||'').length>1?`<span class="le-szb" role="group" aria-label="Размер">${[...sd[3]].map(z=>`<button type="button" class="${si.size===z?'on':''}" data-le="tsize" data-v="${z}">${z.toUpperCase()}</button>`).join('')}</span>`:''}${S.up?'<button type="button" class="btn sm o" data-le="tup">↑ Внешний элемент</button>':''}<button type="button" class="btn sm o" data-le="treset"${JSON.stringify(LE.tpl[S.ty])===defJ(S.ty)?' disabled':''}>Сброс карточки</button><button type="button" class="btn sm o" data-le="tnone" title="Снять выбор">✕</button></span></div>`:'';
 b.innerHTML=row+`<div class="w le-bw"><span class="le-info"><b>Правка: ${esc(LE.pg?DEF()[LE.pg].title:'карточки на странице')}</b><small>${LE.msg?esc(LE.msg):dirty()?'Есть несохранённые изменения':isDef?'Как по умолчанию':'Сохранено'} · ${LE.pg?'блок — тянуть за заголовок; ':''}элемент карточки — нажать (выбрать) и тянуть; пальцем — удерживать</small></span>
<span class="le-act"><button type="button" class="btn sm" data-le="save"${LE.busy||!dirty()?' disabled':''}>Сохранить</button><button type="button" class="btn sm o" data-le="cancel">Отмена</button><button type="button" class="btn sm o" data-le="reset"${isDef?' disabled':''}>Сброс</button></span></div>`}
function tog(){const on=owner()&&(!!key()||!!LE||hasCards()),w=document.querySelector('.util .w'),app=document.getElementById('app');
 // компьютер — в верхней строке; телефон (верхняя строка скрыта) — отдельной полосой над страницей, в потоке
 for(const [id,host,before] of [['le-tog',w,null],['le-tog2',app&&app.parentNode,app]]){let t=document.getElementById(id);
  if(!on||!host){t&&(id==='le-tog2'?t.parentNode.remove():t.remove());continue}
  if(!t){t=document.createElement('button');t.type='button';t.id=id;t.className='le-tog';t.dataset.le='toggle';
   if(before){const d=document.createElement('div');d.className='w le-top';d.appendChild(t);host.insertBefore(d,before)}else host.appendChild(t)}
  t.textContent=LE?'✕ Закончить правку':'✎ Редактировать страницу';t.setAttribute('aria-pressed',LE?'true':'false')}}
function enter(pg){if(!owner())return;pg=DEF()[pg]?pg:'';const d=pg?window.VPPKA_LAYOUT(pg):null,sv=savedTpl(),T={};for(const ty in TPL_DEF)T[ty]=tplOf(ty,sv[ty]);
 LE={pg,draft:d&&clone(d),tpl:T,drag:null,td:null,sel:null,msg:''};LE.base=snap();rerender();applyAll();tog()}
function exit(){LE=null;rerender();applyAll();tog()}
async function save(){if(!LE||LE.busy)return;LE.busy=true;LE.msg='Сохраняю…';bar();const pg=LE.pg,draft=pg&&clone(LE.draft),sv=savedTpl(),tpl={};
 // шаблоны: пишем только изменённые типы; вернули к виду по умолчанию — пишем null (= нет шаблона)
 for(const ty in TPL_DEF){const j=JSON.stringify(LE.tpl[ty]),was=JSON.stringify(tplOf(ty,sv[ty]));if(j!==was)tpl[ty]=j===defJ(ty)?null:clone(LE.tpl[ty])}
 const body={};if(pg)body.layout={[pg]:draft};if(Object.keys(tpl).length)body.tpl=tpl;
 try{const fb=window.VPPKA_FB,F=fb.F;await Promise.race([F.setDoc(F.doc(fb.db,'content','settings'),body,{merge:true}),new Promise((_,j)=>setTimeout(()=>j({code:'timeout'}),15000))]);
  const cur=((window.VPPKA_C&&window.VPPKA_C())||{}).settings||{},nt={...(cur.tpl||{})};for(const ty in tpl){if(tpl[ty])nt[ty]=tpl[ty];else delete nt[ty]}
  LE.base=snap();LE.msg='Сохранено — действует для всех посетителей.';LE.busy=false;
  window.VPPKA_APPLY_CONTENT&&window.VPPKA_APPLY_CONTENT({settings:{...cur,...(pg?{layout:{...(cur.layout||{}),[pg]:draft}}:{}),tpl:nt}})}
 catch(e){LE.busy=false;LE.msg=e&&e.code==='permission-denied'?'Нет прав: менять вид страниц может только владелец.':e&&e.code==='timeout'?'Сервер не ответил за 15 с — не сохранено (проверьте связь).':'Не сохранено: '+((e&&e.message)||e)}bar()}
// --- элементы карточек: выбрать, перетащить внутри карточки (соседи сдвигаются), размер/скрытие — в панели ---
const tpOf=el=>{const [ty,s,id]=el.dataset.tpi.split('|');return {ty,s,id}};
function select(el){document.querySelectorAll('.tp-sel').forEach(e=>e.classList.remove('tp-sel'));if(!el){LE.sel=null;bar();return}
 const k=tpOf(el),up=el.parentElement&&el.parentElement.closest('[data-tpi]');LE.sel={...k,up:up?up.dataset.tpi:''};
 document.querySelectorAll(`[data-tpi="${el.dataset.tpi}"]`).forEach(e=>e.classList.add('tp-sel'));bar()}
const sibs=el=>[...el.parentElement.children].filter(k=>k.dataset.tpi&&k.dataset.tpi.split('|').slice(0,2).join('|')===el.dataset.tpi.split('|').slice(0,2).join('|'));
function tdStart(el){LE.td={el,moved:false};el.classList.add('tp-moving');document.body.classList.add('le-dragging');navigator.vibrate&&navigator.vibrate(12)}
function tdMove(x,y){const D=LE.td;if(!D||!D.el.isConnected)return;const el=D.el,host=el.parentElement,S=sibs(el);
 const hit=S.find(s=>{if(s===el)return false;const r=s.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom});if(!hit)return;
 const a=el.getBoundingClientRect(),b=hit.getBoundingClientRect(),row=Math.abs(a.top-b.top)<Math.min(a.height,b.height)/2;
 const after=row?x>b.left+b.width/2:y>b.top+b.height/2,tailOf=e=>{const n=e.nextElementSibling;return n&&!n.dataset.tpi&&(n.matches('.an-more,.ptx-more'))?n:null};
 const tl=tailOf(el),ref=after?(tailOf(hit)||hit).nextSibling:hit;if(ref===el||(tl&&ref===tl)||(!after&&el.nextElementSibling===hit&&!tl)||(!after&&tl&&tl.nextElementSibling===hit))return;
 const els=[...host.children],r0=new Map(els.map(e=>[e,e.getBoundingClientRect()]));host.insertBefore(el,ref);if(tl)el.after(tl);D.moved=true;
 for(const e of els){const p=r0.get(e),q=e.getBoundingClientRect(),dx=p.left-q.left,dy=p.top-q.top;if(!dx&&!dy)continue;e.style.transition='none';e.style.transform=`translate(${dx}px,${dy}px)`;e.getBoundingClientRect();e.style.transition='transform .18s ease';e.style.transform='';setTimeout(()=>{e.style.transition=''},200)}}
function tdEnd(){const D=LE.td;LE.td=null;document.body.classList.remove('le-dragging');if(!D)return;D.el.classList.remove('tp-moving');
 if(D.moved&&D.el.isConnected){const {ty,s}=tpOf(D.el),present=sibs(D.el).map(e=>tpOf(e).id),L=LE.tpl[ty][s];let i=0;
  LE.tpl[ty][s]=L.map(it=>{if(!present.includes(it.id))return it;const id=present[i++];return L.find(z=>z.id===id)});LE.msg=''}
 applyAll();select(D.el.isConnected?D.el:null)}
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
 const tp=t.closest&&t.closest('[data-tpi]');if(tp&&!t.closest('.le-h,.le-f')){if(e.pointerType==='mouse')e.preventDefault();P={id:e.pointerId,k:'tpend',el:tp,x:e.clientX,y:e.clientY,touch:e.pointerType!=='mouse'};
  if(P.touch){tp.classList.add('le-hold');P.timer=setTimeout(()=>{if(P&&P.k==='tpend'){tp.classList.remove('le-hold');P.k='td';select(tp);tdStart(tp)}},350)}return}
 const b=t.closest&&t.closest('.le-b');if(!b||t.closest('button,a,input,select,textarea,label,summary')&&!t.closest('.le-h'))return;if(t.closest('.le-eye'))return;
 P={id:e.pointerId,k:'pend',b,x:e.clientX,y:e.clientY,touch:e.pointerType!=='mouse'};
 if(P.touch){b.classList.add('le-hold');P.timer=setTimeout(()=>{if(P&&P.k==='pend'){b.classList.remove('le-hold');P.k='drag';startDrag(b,P.x,P.y)}},350)}else e.preventDefault()},true);
document.addEventListener('pointermove',e=>{if(!P||e.pointerId!==P.id)return;
 if(P.k==='tpend'){const d=Math.hypot(e.clientX-P.x,e.clientY-P.y);if(P.touch){if(d>8){clearTimeout(P.timer);P.el.classList.remove('le-hold');P=null}return}
  if(d>4){P.k='td';select(P.el);tdStart(P.el)}return}
 if(P.k==='pend'){const d=Math.hypot(e.clientX-P.x,e.clientY-P.y);if(P.touch){if(d>8){clearTimeout(P.timer);P.b.classList.remove('le-hold');P=null}else{P.x=e.clientX;P.y=e.clientY}return}
  if(d>4){P.k='drag';startDrag(P.b,e.clientX,e.clientY)}return}
 e.preventDefault();if(P.k==='drag')moveDrag(e.clientX,e.clientY);else if(P.k==='rs')moveRs(e.clientX);else if(P.k==='sw')moveSw(e.clientX);else if(P.k==='td')tdMove(e.clientX,e.clientY)},{passive:false});
const up=e=>{if(!P||e.pointerId!==P.id)return;const k=P.k;clearTimeout(P.timer);P.b&&P.b.classList.remove('le-hold');const pe=P.el;pe&&pe.classList.remove('le-hold');P=null;if(k==='tpend'){if(e.type==='pointerup')select(pe);return}if(k==='td')tdEnd();else if(k==='drag')endDrag(e.type==='pointercancel');else if(k==='rs')endRs();else if(k==='sw')endSw()};
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
 else if(k==='reset'){if(LE.pg)LE.draft=clone(window.VPPKA_LAYOUT(LE.pg,{}));for(const ty in TPL_DEF)LE.tpl[ty]=tplDefault(ty);LE.sel=null;LE.msg='Сброшено к виду по умолчанию (страница и карточки) — нажмите «Сохранить».';rerender();applyAll()}
 else if(k[0]==='t'&&LE.sel){const S=LE.sel,L=LE.tpl[S.ty][S.s],it=L.find(i=>i.id===S.id);
  if(k==='tshow'&&it)it.show=!it.show;else if(k==='tsize'&&it)it.size=b.dataset.v;else if(k==='treset'){LE.tpl[S.ty]=tplDefault(S.ty)}
  else if(k==='tup'){const [ty,s,id]=S.up.split('|');LE.sel={ty,s,id,up:''};const u=document.querySelector(`[data-tpi="${S.up}"]`);u&&select(u);return}else if(k==='tnone'){select(null);return}
  LE.msg='';applyAll();const sel=document.querySelector(`[data-tpi="${S.ty}|${S.s}|${S.id}"]`);sel?select(sel):bar()}},true);
// смена страницы — выход из правки; вход по ссылке из #admin (sessionStorage vppka_le)
addEventListener('hashchange',()=>{if(LE&&key()!==LE.pg){ // другая страница: черновик раскладки сбрасывается, правка карточек продолжается
  const pg=DEF()[key()]?key():'',sv=savedTpl(),B={};for(const ty in TPL_DEF)B[ty]=tplOf(ty,sv[ty]);
  LE.pg=pg;LE.draft=pg?clone(window.VPPKA_LAYOUT(pg)):null;LE.sel=null;LE.msg='';LE.base=JSON.stringify({d:LE.draft,t:B});setTimeout(rerender,0)}setTimeout(()=>{tog();const w=sessionStorage.getItem('vppka_le');if(w&&w===key()&&owner()){sessionStorage.removeItem('vppka_le');enter(w)}},0)});
let n=0;const boot=()=>{tog();const w=sessionStorage.getItem('vppka_le');if(w&&w===key()&&owner()){sessionStorage.removeItem('vppka_le');enter(w)}if(++n<60&&!owner())setTimeout(boot,1000)};setTimeout(boot,300);
// шаблоны карточек — для всех посетителей: после каждой перерисовки #app
const startMO=()=>{const app=document.getElementById('app');if(!app||MO)return;MO=new MutationObserver(()=>applyAll());MO.observe(app,{childList:true,subtree:true});applyAll()};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',startMO):startMO();
window.VPPKA_LAYEDIT={enter,exit,state:()=>LE,applyAll};
})();
