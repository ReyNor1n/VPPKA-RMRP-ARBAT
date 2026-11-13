// v276: раздел #admin → «Журнал изменений» (auditLog). Видят владелец, «Администратор сайта» (m13) и зам. начальника техотдела (m12).
// Последние записи — сначала новые, по 100 за раз («Показать ещё»); фильтр по человеку и разделу, поиск по тексту.
const FB=()=>window.VPPKA_FB,F=()=>FB().F,db=()=>FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PAGE=100;
const SEC={news:'Новости',events:'Мероприятия',votes:'Голосования',notifications:'Уведомления и объявления',members:'Состав',applications:'Заявки',users:'Пользователи',accessKeys:'Ключи доступа',content:'Тексты страниц',config:'Настройки',discordOut:'Discord',expulsions:'Исключения',banners:'Баннеры'};
const ACT={create:'создание',update:'изменение',delete:'удаление'};
const S={rows:null,last:null,more:false,busy:false,msg:'',who:'',sec:'',q:''};
const ms=v=>v&&typeof v.toMillis==='function'?v.toMillis():(typeof v==='number'?v:0);
export const TZ='Europe/Warsaw';
export function fmtTime(t){const m=ms(t);if(!m)return '—';return new Date(m).toLocaleString('ru-RU',{timeZone:TZ,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
const OWNER_DID='646280678736003073';
const seatDid=s=>String(((((window.VPPKA_DATA||{}).members)||[]).find(m=>m.id===s)||{}).discordId||'');
export function logAllowed(){const fb=FB(),p=(fb&&fb.power)||{};if(p.owner)return true;const did=String(((window.VPPKA_AUTH||{}).profile||{}).discordId||'');return !!did&&(seatDid('m13')===did||seatDid('m12')===did)}
const err=e=>e&&e.code==='permission-denied'?'Нет прав: журнал видят только владелец, администратор сайта (m13) и зам. начальника техотдела (m12).':(e&&e.code==='failed-precondition'?'Нужен индекс Firestore (auditLog, at по убыванию).':(e&&(e.message||e.code))||String(e));
async function page(refresh){const f=F();S.busy=true;refresh();
 try{const parts=[f.collection(db(),'auditLog'),f.orderBy('at','desc')];if(S.last)parts.push(f.startAfter(S.last));parts.push(f.limit(PAGE));
  const s=await f.getDocs(f.query(...parts));const rows=s.docs.map(d=>({id:d.id,...d.data()}));S.rows=(S.rows||[]).concat(rows);S.last=s.docs.length?s.docs[s.docs.length-1]:S.last;S.more=s.docs.length===PAGE;S.msg=''}
 catch(e){S.msg=err(e);if(!S.rows)S.rows=[]}finally{S.busy=false;refresh()}}
export async function logLoad(refresh){S.rows=null;S.last=null;S.more=false;S.msg='';if(!logAllowed()){S.rows=[];S.msg=err({code:'permission-denied'});refresh();return}await page(refresh)}
const whoKey=r=>String(r.did||r.by||'');
const whoName=r=>(r.name||'без имени')+(r.seat?' · '+(r.seat==='owner'?'владелец':r.seat):'')+(r.did?' · '+r.did:'');
function filtered(){const q=S.q.trim().toLowerCase();return (S.rows||[]).filter(r=>(!S.who||whoKey(r)===S.who)&&(!S.sec||r.sec===S.sec)&&(!q||[r.sum,r.ref,r.name,r.did,SEC[r.sec],ACT[r.act]].join(' ').toLowerCase().includes(q)))}
export function rowsHTML(){const L=filtered();if(!L.length)return `<p class="amut">${S.rows&&S.rows.length?'Ничего не найдено.':'Записей пока нет.'}</p>`;
 return `<ul class="alog">${L.map(r=>`<li class="alog-r alog-${esc(r.act)}"><div class="alog-h"><time>${esc(fmtTime(r.at))}</time><span class="alog-s">${esc(SEC[r.sec]||r.sec)}</span><span class="alog-a">${esc(ACT[r.act]||r.act)}</span></div><div class="alog-sum">${esc(r.sum||'')}</div><div class="alog-m"><span class="alog-who">${esc(whoName(r))}</span><code>${esc(r.ref||'')}</code></div></li>`).join('')}</ul>`}
export function logHTML(){
 if(S.rows==null)return '<p class="amut">Загрузка журнала…</p>';
 const people=new Map();(S.rows||[]).forEach(r=>{const k=whoKey(r);if(k&&!people.has(k))people.set(k,whoName(r))});
 const secs=[...new Set((S.rows||[]).map(r=>r.sec))].filter(Boolean);
 return `<p class="amut">Последние изменения на сайте: кто, когда (время — ${esc(TZ)}), что. Видят только владелец, администратор сайта (m13) и зам. начальника техотдела (m12). Записи нельзя изменить; действия бота Discord здесь не отражаются.</p>
 <div class="alog-f"><select id="alog-who" aria-label="Человек"><option value="">Все люди</option>${[...people].map(([k,n])=>`<option value="${esc(k)}"${S.who===k?' selected':''}>${esc(n)}</option>`).join('')}</select>
 <select id="alog-sec" aria-label="Раздел"><option value="">Все разделы</option>${secs.map(s=>`<option value="${esc(s)}"${S.sec===s?' selected':''}>${esc(SEC[s]||s)}</option>`).join('')}</select>
 <input id="alog-q" type="search" placeholder="Поиск по журналу" value="${esc(S.q)}" aria-label="Поиск по журналу"><button type="button" class="btn sm o" id="alog-reload">Обновить</button></div>
 ${S.msg?`<p class="aerr">${esc(S.msg)}</p>`:''}<div id="alog-list">${rowsHTML()}</div>
 ${S.more?`<p><button type="button" class="btn sm o" id="alog-more"${S.busy?' disabled':''}>Показать ещё ${PAGE}</button></p>`:''}${S.busy?'<p class="amut">Загрузка…</p>':''}`}
export async function logClick(b,refresh){if(b.id==='alog-more'&&!S.busy){await page(refresh)}else if(b.id==='alog-reload'){await logLoad(refresh)}}
export function logChange(e,refresh){const t=e.target;if(t.id==='alog-who'){S.who=t.value;refresh()}else if(t.id==='alog-sec'){S.sec=t.value;refresh()}}
export function logInput(e){if(e.target.id!=='alog-q')return false;S.q=e.target.value;const h=document.getElementById('alog-list');if(h)h.innerHTML=rowsHTML();return true}
