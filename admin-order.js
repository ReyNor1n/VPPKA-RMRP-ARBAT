// v262: #admin — порядок разделов и групп перетаскиванием (только владелец). content/settings.adminTabs = [{n:'Группа', ids:['an',…]}].
// Мышь — тянуть сразу; палец — удерживать 0,35 с, затем тянуть. Раздел можно перенести и в другую группу.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FB=()=>window.VPPKA_FB;
const S={on:false,draft:null,base:'',msg:'',busy:false};
const saved=()=>(((window.VPPKA_C&&window.VPPKA_C())||{}).settings||{}).adminTabs;
// нормализация: каждый известный раздел — ровно один раз; новые разделы — в свою группу по умолчанию
export function ordGroups(DEF){const sv=Array.isArray(saved())?saved():null;if(!sv)return DEF.map(([n,ids])=>[n,ids.slice()]);
 const known=new Set(DEF.flatMap(g=>g[1])),seen=new Set(),out=[];
 for(const g of sv){if(!g||typeof g.n!=='string'||!Array.isArray(g.ids))continue;const ids=g.ids.filter(id=>known.has(id)&&!seen.has(id));ids.forEach(id=>seen.add(id));
  const d=DEF.find(x=>x[0]===g.n);if(d||ids.length)out.push([g.n.slice(0,40),ids])}
 for(const [n,ids] of DEF){const miss=ids.filter(id=>!seen.has(id));if(!miss.length&&out.some(g=>g[0]===n))continue;let g=out.find(x=>x[0]===n);if(!g){g=[n,[]];out.push(g)}g[1].push(...miss)}
 return out}
export const ordOn=()=>S.on;
export function ordBar(DEF,owner){if(!owner)return '';if(!S.on)return `<div class="adm-ordb"><button type="button" class="btn sm o" data-adord="on" title="Перетащить разделы и группы мышью или пальцем">⇅ Порядок разделов</button></div>`;
 const isDef=JSON.stringify(S.draft)===JSON.stringify(DEF.map(([n,ids])=>[n,ids.slice()]));
 return `<div class="adm-ordb on"><span class="amut">${esc(S.msg||'Тяните раздел (на телефоне — удерживайте) или группу за её название. Раздел можно перенести в другую группу.')}</span>
<span class="adm-orda"><button type="button" class="btn sm" data-adord="save"${S.busy||JSON.stringify(S.draft)===S.base?' disabled':''}>Сохранить</button><button type="button" class="btn sm o" data-adord="cancel">Отмена</button><button type="button" class="btn sm o" data-adord="reset"${isDef?' disabled':''}>Сброс</button></span></div>`}
export const ordDraft=DEF=>S.on?S.draft:ordGroups(DEF);
export async function ordClick(b,DEF,refresh){const k=b.dataset.adord;
 if(k==='on'){S.on=true;S.draft=ordGroups(DEF);S.base=JSON.stringify(S.draft);S.msg='';refresh();return}
 if(k==='cancel'){S.on=false;S.draft=null;refresh();return}
 if(k==='reset'){S.draft=DEF.map(([n,ids])=>[n,ids.slice()]);S.msg='Сброшено к порядку по умолчанию — нажмите «Сохранить».';refresh();return}
 if(k==='save'){if(S.busy)return;S.busy=true;S.msg='Сохраняю…';refresh();const v=S.draft.map(([n,ids])=>({n,ids}));
  try{const F=FB().F;await Promise.race([F.setDoc(F.doc(FB().db,'content','settings'),{adminTabs:v},{merge:true}),new Promise((_,j)=>setTimeout(()=>j({code:'timeout'}),15000))]);
   const cur=((window.VPPKA_C&&window.VPPKA_C())||{}).settings||{};S.on=false;S.draft=null;S.busy=false;S.msg='';window.VPPKA_APPLY_CONTENT&&window.VPPKA_APPLY_CONTENT({settings:{...cur,adminTabs:v}})}
  catch(e){S.busy=false;S.msg=e&&e.code==='permission-denied'?'Нет прав: порядок меняет только владелец.':e&&e.code==='timeout'?'Сервер не ответил за 15 с — не сохранено.':'Не сохранено: '+((e&&e.message)||e)}refresh()}}
// --- перетаскивание (FLIP: соседи плавно сдвигаются) ---
function flip(host,fn){const els=[...host.querySelectorAll('.adm-tg,.adm-tgb>button')],r0=new Map(els.map(e=>[e,e.getBoundingClientRect()]));fn();
 for(const e of els){const a=r0.get(e),b=e.getBoundingClientRect(),dx=a.left-b.left,dy=a.top-b.top;if(!dx&&!dy)continue;e.style.transition='none';e.style.transform=`translate(${dx}px,${dy}px)`;e.getBoundingClientRect();e.style.transition='transform .18s ease';e.style.transform='';setTimeout(()=>{e.style.transition=''},200)}}
function grab(nav){S.draft=[...nav.querySelectorAll(':scope>.adm-tg')].map(g=>[g.dataset.g,[...g.querySelectorAll('.adm-tgb>button[data-adtab]')].map(b=>b.dataset.adtab)])}
let P=null,refreshFn=null;export const ordRefresh=f=>{refreshFn=f};
function begin(){P.k='drag';P.el.classList.add('adm-mv');document.body.classList.add('le-dragging');navigator.vibrate&&navigator.vibrate(12)}
function move(x,y){const el=P.el,nav=el.closest('.adm-tabs');if(!nav)return;
 if(P.g){const gs=[...nav.querySelectorAll(':scope>.adm-tg')],hit=gs.find(g=>{if(g===el)return false;const r=g.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom});if(!hit)return;
  const r=hit.getBoundingClientRect(),after=Math.abs(r.top-el.getBoundingClientRect().top)<r.height/2?x>r.left+r.width/2:y>r.top+r.height/2,ref=after?hit.nextElementSibling:hit;if(ref===el||(!after&&el.nextElementSibling===hit))return;
  flip(nav,()=>nav.insertBefore(el,ref));return}
 const box=document.elementFromPoint(x,y),tgEl=box&&box.closest&&box.closest('.adm-tg');if(!tgEl||!nav.contains(tgEl))return;const host=tgEl.querySelector('.adm-tgb');
 const bs=[...host.querySelectorAll(':scope>button')].filter(b=>b!==el);let ref=null;
 for(const b of bs){const r=b.getBoundingClientRect();if(y<r.top)break;if(y<=r.bottom&&x<r.left+r.width/2){ref=b;break}if(y<=r.bottom)continue}
 if(!ref){const after=bs.filter(b=>b.getBoundingClientRect().top>y);ref=after[0]||null}
 if(el.parentElement===host&&(el.nextElementSibling===ref||(ref===null&&el===host.lastElementChild)))return;
 flip(nav,()=>host.insertBefore(el,ref))}
document.addEventListener('pointerdown',e=>{if(!S.on||e.button>0)return;const t=e.target.closest&&e.target.closest('.adm-tabs.adm-ord button[data-adtab], .adm-tabs.adm-ord .adm-tgl');if(!t)return;
 const g=t.classList.contains('adm-tgl'),el=g?t.closest('.adm-tg'):t;P={id:e.pointerId,k:'pend',el,g,x:e.clientX,y:e.clientY,touch:e.pointerType!=='mouse'};
 if(P.touch){el.classList.add('adm-hold');P.timer=setTimeout(()=>{if(P&&P.k==='pend'){el.classList.remove('adm-hold');begin()}},350)}else e.preventDefault()},true);
document.addEventListener('pointermove',e=>{if(!P||e.pointerId!==P.id)return;const d=Math.hypot(e.clientX-P.x,e.clientY-P.y);
 if(P.k==='pend'){if(P.touch){if(d>8){clearTimeout(P.timer);P.el.classList.remove('adm-hold');P=null}return}if(d>4)begin();else return}
 e.preventDefault();move(e.clientX,e.clientY)},{passive:false});
const up=e=>{if(!P||e.pointerId!==P.id)return;clearTimeout(P.timer);const was=P.k,el=P.el;el.classList.remove('adm-hold','adm-mv');document.body.classList.remove('le-dragging');P=null;
 if(was==='drag'){const nav=el.closest('.adm-tabs');if(nav){grab(nav);S.msg='';refreshFn&&refreshFn()}}};
document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
document.addEventListener('touchmove',e=>{if(P&&P.k==='drag')e.preventDefault()},{passive:false});
document.addEventListener('contextmenu',e=>{if(S.on&&e.target.closest&&e.target.closest('.adm-tabs.adm-ord'))e.preventDefault()});
