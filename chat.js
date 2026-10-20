// ---------- Личные сообщения: chats/{a_b} + messages, справочник pub/{uid} ----------
const FB=()=>window.VPPKA_FB,F=()=>FB().F,db=()=>FB().db;
const OWNER='t3t4KPD2bDasFw1gPLWAA0W8jCL2',KEYMASTER='ZpVGAXbbg1a9I8kRsNEm0OU8QAt2',MAX=2000;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ini=n=>String(n||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';
const ms=t=>t?.toMillis?.()||0;
let rn=[],rnDid='',me=null,isOwn=false,subs=[],msub=null,pub={},chats={},msgs=[],view='list',cur=null,open=false,q='',draft={},sent=0;
const cid=(a,b)=>[a,b].sort().join('_');
const other=c=>c.participants.find(x=>x!==me);
// ФИО собеседника (по Discord ID из справочника pub — его нельзя подделать, см. правила pub):
// 1) карточка состава/«Члены партии» — публичные данные; 2) ФИО из принятой заявки — только тем, кому правила дают читать заявки (ступень 3+);
// 3) имя профиля из справочника. Хранимые сообщения не переписываются — имя подставляется при показе.
const OWNER_DID='646280678736003073';
const MEMS=()=>(window.VPPKA_DATA&&window.VPPKA_DATA.members)||(window.VPPKA_C&&window.VPPKA_C().leadership&&window.VPPKA_C().leadership.members)||[];
const realName=n=>!!n&&!/^вакансия$/i.test(String(n).trim());
function cardName(did){did=String(did||'');if(!did)return '';const L=MEMS().filter(m=>String(m.discordId||'')===did&&realName(m.name));const m=L.find(x=>String(x.id||'').startsWith('p_'))||L[0];return m?String(m.name).trim().replace(/\s+/g,' '):''}
let appFio={},appKey='';
async function loadAppFio(){const pw=FB().power||{},k=me+':'+(pw.owner?9:(pw.tier|0));if(k===appKey)return;appKey=k;appFio={};if(!(pw.owner||(pw.tier|0)>=3))return;
 try{const f=F(),s=await f.getDocs(f.query(f.collection(db(),'applications'),f.where('status','in',['accepted','member'])));const m={};s.docs.forEach(d=>{const a=d.data(),n=a.answers&&a.answers.fio;if(a.discordId&&n)m[String(a.discordId)]=String(n).trim().replace(/\s+/g,' ').slice(0,100)});appFio=m;repaint()}catch(e){console.warn('chat fio',e.code||e)}}
const didOf=u=>u===OWNER?OWNER_DID:String((pub[u]&&pub[u].did)||'');
const fio=u=>{const d=didOf(u);return d?(cardName(d)||appFio[d]||''):''};
const person=(u,c)=>{const p=pub[u],f=fio(u);if(p)return {n:f||p.n||'Пользователь',ph:p.ph};const n=c&&c.names&&c.names[u];return {n:f||n||'Пользователь',ph:''}};
function repaint(){const p=document.getElementById('chPanel');if(p)p.dataset.v='';paint()}
const av=(p,cls='')=>`<span class="ch-av ${cls}${window.isLdr&&window.isLdr(p.n)?' ldr-av'+(window.LT?window.LT(p.n):''):''}${p.ph?'':' noph'}">${p.ph?`<img src="${esc(p.ph)}" alt="${esc(p.n||'')}">`:`<b>${esc(ini(p.n))}</b>`}</span>`;
function ft(t,full){const d=t?.toDate?.();if(!d)return '';const n=new Date(),hm=d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
 if(d.toDateString()===n.toDateString())return hm;const dm=d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'});return full?dm+' '+hm:dm}
const unreadTotal=()=>Object.values(chats).filter(c=>((c.unread||{})[me]||0)>0).length+(rn.some(x=>!x.read)?1:0);
// миниатюра для справочника (≈96px), чтобы не тянуть полные фото
function thumb(src){return new Promise(r=>{if(!src)return r('');const im=new Image();im.onload=()=>{const k=160/Math.max(im.width,im.height,160),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',.8))};im.onerror=()=>r('');im.src=src})}
window.VPPKA_PUBMAP=()=>pub;window.VPPKA_PUBSELF=()=>pubSelf();
async function pubSelf(){const a=window.VPPKA_AUTH,pf=a&&a.profile;if(!pf||isOwn||me===KEYMASTER||window.VPPKA_HIDDEN({uid:me,discordId:pf.discordId}))return;
 const n=(cardName(pf.discordId)||pf.displayName||pf.discordId||'').slice(0,40),ph=(()=>{const g=pf.avatar||pf.photo||'';return /^data:image\/gif;/.test(g)&&g.length<=100000?g:null})()||await thumb(pf.avatar||pf.photo),old=pub[me];if(old&&old.n===n&&(old.ph||'')===ph&&old.did===pf.discordId)return;
 const d={n,did:String(pf.discordId||'').slice(0,64),t:F().serverTimestamp()};if(ph)d.ph=ph;try{await F().setDoc(F().doc(db(),'pub',me),d)}catch(e){console.warn('pub',e.code||e)}}
// владелец/ступень 5 дополняют справочник теми, кто ещё не заходил после обновления
async function backfill(){const pw=FB().power||{};if(!(pw.owner||(pw.tier||0)>=5))return;try{const s=await F().getDocs(F().collection(db(),'users'));
 for(const d of s.docs){const u=d.data();if(pub[d.id]||d.id===me||d.id===KEYMASTER||window.VPPKA_HIDDEN({uid:d.id,discordId:u.discordId})||!u.discordId)continue;
  const x={n:(cardName(u.discordId)||u.displayName||u.discordId).slice(0,40),did:String(u.discordId).slice(0,64),t:F().serverTimestamp()};const ph=await thumb(u.photo);if(ph)x.ph=ph;
  await F().setDoc(F().doc(db(),'pub',d.id),x).catch(e=>console.warn('pub fill',e.code))}}catch(e){}}
function start(){const f=F(),d=db();let first=true;
 subs.push(f.onSnapshot(f.collection(d,'pub'),s=>{pub={};s.docs.forEach(x=>{if(x.id!==OWNER&&x.id!==KEYMASTER)pub[x.id]=x.data()});if(first){first=false;pubSelf();rnStart();setTimeout(rnStart,5000);setTimeout(backfill,3000);if(['party','member'].includes(location.hash.slice(1).split('/')[0])&&window.route){const y=scrollY;window.route();scrollTo(0,y)}}paint()},e=>console.warn('pub',e.code)));
 subs.push(f.onSnapshot(f.query(f.collection(d,'chats'),f.where('participants','array-contains',me)),s=>{chats={};s.docs.forEach(x=>chats[x.id]={...x.data({serverTimestamps:'estimate'}),id:x.id});if(cur&&chats[cur.id]&&!msub&&!s.docs.find(x=>x.id===cur.id).metadata.hasPendingWrites)subMsgs();if(open&&view==='conv'&&cur&&((chats[cur.id]||{}).unread||{})[me])markRead();paint()},e=>console.warn('chats',e.code)));}
function rnStart(){const did=String(((window.VPPKA_AUTH||{}).profile||{}).discordId||'');if(!did||did===rnDid)return;rnDid=did;const f=F();
 subs.push(f.onSnapshot(f.query(f.collection(db(),'rankNotes'),f.where('did','==',did)),s=>{rn=s.docs.map(x=>({...x.data({serverTimestamps:'estimate'}),id:x.id})).sort((a,b)=>ms(b.at)-ms(a.at));if(open&&view==='sys')rnRead();paint()},e=>console.warn('rankNotes',e.code)))}
async function rnRead(){for(const x of rn)if(!x.read){x.read=true;try{await F().updateDoc(F().doc(db(),'rankNotes',x.id),{read:true})}catch(e){}}}
function stop(){subs.forEach(u=>u());subs=[];rn=[];rnDid='';if(msub)msub();msub=null;pub={};chats={};msgs=[];cur=null;open=false;view='list'}
function subMsgs(){if(msub)msub();msgs=[];const f=F();msub=f.onSnapshot(f.query(f.collection(db(),'chats',cur.id,'messages'),f.orderBy('at'),f.limitToLast(300)),s=>{msgs=s.docs.map(x=>({...x.data({serverTimestamps:'estimate'}),id:x.id}));paint(true)},e=>{console.warn('msgs',e.code);msub=null})}
async function markRead(){if(!cur||!chats[cur.id])return;try{await F().updateDoc(F().doc(db(),'chats',cur.id),{['unread.'+me]:0})}catch(e){}}
function openConv(uid){if(!uid||uid===me)return;if(!isOwn&&(uid===OWNER||uid===KEYMASTER)&&!chats[cid(me,uid)])return;if(uid===KEYMASTER)return;
 const id=cid(me,uid);if(msub)msub();msub=null;msgs=[];cur={id,uid};view='conv';open=true;if(chats[id]){subMsgs();markRead()}paint();setTimeout(()=>{const t=document.getElementById('ch-in');t&&t.focus()},50)}
async function send(){const t=document.getElementById('ch-in');if(!t||!cur)return;const text=t.value.trim();if(!text)return;if(text.length>MAX)return alert('Сообщение длиннее '+MAX+' символов.');
 if(Date.now()-sent<400)return;sent=Date.now();const f=F(),d=db(),ref=f.doc(d,'chats',cur.id),now=f.serverTimestamp(),o=cur.uid;t.value='';draft[cur.id]='';
 const b=f.writeBatch(d),lm={text:text.slice(0,140),from:me,at:now};
 if(!chats[cur.id]){const c={participants:[me,o].sort(),createdBy:me,updatedAt:now,lastMessage:lm,unread:{[me]:0,[o]:1}};if(isOwn){const pf=(window.VPPKA_AUTH||{}).profile||{};c.names={[me]:String(pf.displayName||'Пользователь').slice(0,40)}}b.set(ref,c)}
 else b.update(ref,{updatedAt:now,lastMessage:lm,['unread.'+o]:f.increment(1),['unread.'+me]:0});
 b.set(f.doc(f.collection(d,'chats',cur.id,'messages')),{from:me,text,at:now});
 try{await b.commit()}catch(e){t.value=text;alert('Не отправлено: '+(e.code==='permission-denied'?'нет прав (правила базы не обновлены?)':(e.code||e.message)))}}
const IC='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8.5L4 21.5V18a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 6.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm5 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm5 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/></svg>';
function els(){let b=document.getElementById('chBtn'),p=document.getElementById('chPanel');
 if(!b){b=document.createElement('button');b.id='chBtn';b.className='ch-btn';b.setAttribute('aria-label','Сообщения');b.innerHTML=IC+'<span class="ch-bdg" hidden></span>';b.onclick=()=>{open=!open;if(open&&view==='conv'&&cur&&chats[cur.id])markRead();paint()};document.body.appendChild(b)}
 if(!p){p=document.createElement('div');p.id='chPanel';p.className='ch-p';p.hidden=true;document.body.appendChild(p);
  p.addEventListener('click',e=>{const x=e.target.closest('[data-a]');if(!x)return;const a=x.dataset.a;
   if(a==='close'){open=false;paint()}else if(a==='new'){view='new';q='';paint();setTimeout(()=>{const i=document.getElementById('ch-q');i&&i.focus()},30)}
   else if(a==='back'){if(msub)msub();msub=null;cur=null;view='list';paint()}else if(a==='open')openConv(x.dataset.u);else if(a==='send')send();else if(a==='push')pushOn();else if(a==='sys'){view='sys';rnRead();paint()}});
  p.addEventListener('input',e=>{if(e.target.id==='ch-q'){q=e.target.value;paintPeople()}if(e.target.id==='ch-in'&&cur){draft[cur.id]=e.target.value;const c=document.getElementById('ch-cnt');if(c){const n=e.target.value.length;c.textContent=n>MAX-200?n+'/'+MAX:'';c.classList.toggle('over',n>MAX)}}});
  p.addEventListener('keydown',e=>{if(e.target.id==='ch-in'&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}if(e.key==='Escape'){open=false;paint()}})}
 return {b,p}}
function people(){const s=q.trim().toLowerCase();return Object.entries(pub).map(([u,p])=>[u,{...p,n:fio(u)||p.n}]).filter(([u,p])=>u!==me&&(!s||(p.n||'').toLowerCase().includes(s)||(pub[u].n||'').toLowerCase().includes(s)||(p.did||'').toLowerCase().includes(s))).sort((a,b)=>(a[1].n||'').localeCompare(b[1].n||'','ru')).slice(0,60)}
function paintPeople(){const l=document.getElementById('ch-pl');if(!l)return;const L=people();l.innerHTML=L.map(([u,p])=>`<button class="ch-row" data-a="open" data-u="${esc(u)}">${av(p)}<span class="ch-rt"><span class="ch-nm">${esc(p.n)}</span><span class="ch-lm">${chats[cid(me,u)]?'есть переписка':'начать чат'}</span></span></button>`).join('')||'<p class="ch-empty">Никого не найдено.</p>'}
function paint(msgOnly){if(!me){const b=document.getElementById('chBtn'),p=document.getElementById('chPanel');if(b)b.hidden=true;if(p)p.hidden=true;document.body.classList.remove('ch-open');return}
 const {b,p}=els();b.hidden=false;const n=unreadTotal(),bd=b.querySelector('.ch-bdg');bd.hidden=!n;bd.textContent=n>99?'99+':n;b.title=n?'Непрочитанных чатов: '+n:'Сообщения';b.classList.toggle('on',open);
 p.hidden=!open;document.body.classList.toggle('ch-open',open);if(!open)return;
 if(view==='conv'&&cur){const c=chats[cur.id],o=person(cur.uid,c),box=document.getElementById('ch-msgs');
  if(msgOnly&&box&&p.dataset.v==='conv:'+cur.id){const nearEnd=box.scrollHeight-box.scrollTop-box.clientHeight<80;box.innerHTML=msgHtml();if(nearEnd||msgs.at(-1)?.from===me)box.scrollTop=box.scrollHeight;return}
  if(p.dataset.v==='conv:'+cur.id&&box){box.innerHTML=msgHtml();return}
  p.dataset.v='conv:'+cur.id;p.innerHTML=`<div class="ch-hd"><button class="ch-ib" data-a="back" aria-label="Назад">‹</button>${av(o,'sm')}<span class="ch-tt">${esc(o.n)}</span><button class="ch-ib" data-a="close" aria-label="Закрыть">×</button></div>
<div class="ch-msgs" id="ch-msgs">${msgHtml()}</div><div class="ch-f"><textarea id="ch-in" rows="1" maxlength="${MAX+100}" placeholder="Сообщение…">${esc(draft[cur.id]||'')}</textarea><span id="ch-cnt" class="ch-cnt"></span><button class="ch-send" data-a="send" aria-label="Отправить">➤</button></div>`;
  const m=document.getElementById('ch-msgs');m.scrollTop=m.scrollHeight;return}
 if(view==='new'){if(p.dataset.v==='new'){paintPeople();return}p.dataset.v='new';p.innerHTML=`<div class="ch-hd"><button class="ch-ib" data-a="back" aria-label="Назад">‹</button><span class="ch-tt">Новый чат</span><button class="ch-ib" data-a="close" aria-label="Закрыть">×</button></div><div class="ch-s"><input id="ch-q" placeholder="Поиск по имени или Discord" value="${esc(q)}"></div><div class="ch-list" id="ch-pl"></div>`;paintPeople();return}
 if(view==='sys'){p.dataset.v='sys';p.innerHTML=`<div class="ch-hd"><button class="ch-ib" data-a="back" aria-label="Назад">‹</button><span class="ch-tt">📢 Повышения и понижения</span><button class="ch-ib" data-a="close" aria-label="Закрыть">×</button></div><div class="ch-msgs">${rn.slice().reverse().map(x=>`<div class="ch-sys ${x.kind==='down'?'dn':'up'}"><b>${x.kind==='down'?'▼':x.kind==='up'?'▲':'★'} ${esc(x.text)}</b><small>${esc(x.byName||'')}${x.byName?' · ':''}${esc(ft(x.at))}</small></div>`).join('')||'<p class="ch-empty">Уведомлений о повышениях и понижениях пока нет.</p>'}</div><div class="ch-f ch-ro">Системный раздел — только для чтения</div>`;const m=p.querySelector('.ch-msgs');m.scrollTop=m.scrollHeight;return}
 p.dataset.v='list';const rk=rn.filter(x=>!x.read).length,r0=rn[0];const sysRow=`<button class="ch-row ch-pin${rk?' unr':''}" data-a="sys"><span class="ch-av ch-sysav">📢</span><span class="ch-rt"><span class="ch-nm">Повышения и понижения<span class="ch-tm">${r0?esc(ft(r0.at)):''}</span></span><span class="ch-lm">${r0?esc(r0.text):'Системные уведомления'}${rk?`<span class="ch-k">${rk}</span>`:''}</span></span></button>`;const L=Object.values(chats).sort((a,b)=>ms(b.updatedAt)-ms(a.updatedAt));
 p.innerHTML=`<div class="ch-hd"><span class="ch-tt">Сообщения</span><button class="ch-ib ch-plus" data-a="new" aria-label="Новый чат" title="Новый чат">＋</button><button class="ch-ib" data-a="close" aria-label="Закрыть">×</button></div>${pushBar()}<div class="ch-list">${sysRow}${L.map(c=>{const u=other(c),o=person(u,c),k=(c.unread||{})[me]||0,lm=c.lastMessage||{};
  return `<button class="ch-row${k?' unr':''}" data-a="open" data-u="${esc(u)}">${av(o)}<span class="ch-rt"><span class="ch-nm">${esc(o.n)}<span class="ch-tm">${esc(ft(c.updatedAt))}</span></span><span class="ch-lm">${lm.from===me?'Вы: ':''}${esc(lm.text||'')}${k?`<span class="ch-k">${k}</span>`:''}</span></span></button>`}).join('')||'<p class="ch-empty">Личных чатов пока нет.<br><button class="btn o" data-a="new">Начать чат</button></p>'}</div>`}
function msgHtml(){if(!chats[cur.id])return '<p class="ch-empty">Напишите первое сообщение.</p>';let last='',prev='';const c=chats[cur.id];
 return msgs.map(m=>{const d=m.at?.toDate?.(),day=d?d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'}):'';const sep=day&&day!==last?`<div class="ch-day">${esc(day)}</div>`:'';last=day||last;
  const who=m.from!==me&&(sep||prev!==m.from)?`<span class="ch-au">${esc(person(m.from,c).n)}</span>`:'';prev=m.from;
  return `${sep}<div class="ch-m${m.from===me?' me':''}"><div class="ch-bb">${who}${esc(m.text).replace(/\n/g,'<br>')}<span class="ch-mt">${esc(ft(m.at))}</span></div></div>`}).join('')}
// «Написать»: профиль участника и карточки «Членов партии» (по discordId → pub)
const uidByDid=did=>did&&Object.keys(pub).find(u=>pub[u].did===String(did));
function hookPages(){const P=window.P;if(!P||P.__ch)return;P.__ch=1;const om=P.member,op=P.party;const MEM=()=>(window.VPPKA_DATA&&window.VPPKA_DATA.members)||(window.VPPKA_C&&window.VPPKA_C().leadership.members)||[];
 P.member=(id,from)=>{const h=om(id,from);const m=MEM().find(x=>x.id===id),u=me&&m&&uidByDid(m.discordId);return u&&u!==me?h.replace(/(<div class="prof-r">[\s\S]*?<\/div>)/,`$1<button class="btn ch-write" onclick="VPPKA_CHAT.open('${esc(u)}')">✉ Написать</button>`):h};
 P.party=(...a)=>{let h=op(...a);if(!me)return h;return h.replace(/<a class="pm-card" href="#member\/([^"/]+)(?:\/[^"]*)?"([^>]*)>/g,(s,id)=>{const m=MEM().find(x=>x.id===id),u=m&&uidByDid(m.discordId);return u&&u!==me?s+`<button class="ch-w" title="Написать" aria-label="Написать" onclick="event.preventDefault();event.stopPropagation();VPPKA_CHAT.open('${esc(u)}')">✉</button>`:s})}}

// ---------- Push-уведомления (Web Push, VAPID): pushSubs/{uid}, рассылает служба на сервере ----------
const VAPID='BIfgn4PZruBuQrwMaZEpJS9DYi-9f8W3f9kkiqqtm9JHz7dkwnVaMeuxTOqD_-MmbGzdOyJOjB9hnCiJGrOEzLA';
const pushOk=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
const isIOS=()=>/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let pushState='';
function pushBar(){if(!pushOk())return isIOS()&&!standalone()?'<div class="ch-push">🔔 Чтобы получать уведомления на iPhone, добавьте сайт на экран «Домой» (Поделиться → «На экран Домой») и откройте его оттуда.</div>':'';
 if(Notification.permission==='denied')return '<div class="ch-push">🔕 Уведомления запрещены в настройках браузера для этого сайта.</div>';
 if(Notification.permission==='granted'&&pushState==='on')return '';
 return `<div class="ch-push"><button class="btn ch-pbtn" data-a="push">🔔 Включить уведомления</button>${pushState==='err'?'<span>Не получилось, попробуйте ещё раз.</span>':''}</div>`}
const b64=s=>{const p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(r,c=>c.charCodeAt(0))};
async function saveSub(sub){const j=sub.toJSON();await F().setDoc(F().doc(db(),'pushSubs',me),{subs:{[sha(j.endpoint)]:{endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,ua:navigator.userAgent.slice(0,120)}},t:F().serverTimestamp()},{merge:true})}
const sha=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return 'e'+(h>>>0).toString(36)};
async function pushOn(){try{if(await Notification.requestPermission()!=='granted'){paintList();return}const r=await navigator.serviceWorker.ready;
 let sub=await r.pushManager.getSubscription();if(!sub)sub=await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(VAPID)});await saveSub(sub);pushState='on'}catch(e){console.warn('push',e);pushState='err'}paintList()}
function paintList(){const p=document.getElementById('chPanel');if(p&&view==='list'){p.dataset.v='';paint()}}
async function pushSync(){if(!pushOk()||Notification.permission!=='granted')return;try{const r=await navigator.serviceWorker.ready,sub=await r.pushManager.getSubscription();if(sub){await saveSub(sub);pushState='on';paintList()}}catch(e){console.warn('push sync',e.code||e)}}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.t==='openChat'&&e.data.u)openConv(e.data.u)});
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.t==='openHash'&&e.data.h)location.hash=e.data.h});
function hashChat(){const m=location.hash.match(/^#chat\/(.+)$/);if(m&&me){history.replaceState(null,'',location.pathname+location.search);setTimeout(()=>openConv(m[1]),800)}}
window.VPPKA_CHAT={open:openConv};
let pubKey='',fioSig='';
export function install(){let key='';const tick=()=>{const fb=FB();if(!fb||!fb.F)return;hookPages();const u=fb.user,k=u?u.uid+':'+!!(fb.power||{}).owner:'';
 if(k!==key){key=k;stop();me=u?u.uid:null;isOwn=!!(fb.power||{}).owner;if(me){start();pushSync();hashChat()}paint()}
 if(me){loadAppFio();const sg=MEMS().map(m=>m.discordId+'='+m.name).join('|').length+':'+Object.keys(appFio).length;if(sg!==fioSig){fioSig=sg;if(open)repaint()}}
 const pf=(window.VPPKA_AUTH||{}).profile,pk=pf?(cardName(pf.discordId)||pf.displayName||'')+(pf.photo||'').length:'';if(me&&pk!==pubKey&&Object.keys(pub).length){pubKey=pk;pubSelf()}};
 tick();setInterval(tick,1000)}
