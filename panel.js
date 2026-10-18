// Панели для обладателей ключей. Все права дополнительно проверяются правилами Firestore.
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FB=()=>window.VPPKA_FB, F=()=>FB().F, db=()=>FB().db, rank=()=>(FB().power||{}).rank||0, chair=()=>!!(FB().power||{}).chair, tier=()=>(FB().power||{}).tier||0, mt=m=>m.tier||0, maxR=()=>rank()>=1000?999:99, isCh=m=>(m.rank??0)===100&&chair()&&mt(m)>=tier();
const D=()=>window.VPPKA_DATA||{};
const STATUS={new:'Новая',accepted:'Принята',rejected:'Отклонена',member:'Принята, в составе'};
const AQ=[['fio','ФИО'],['passport','Паспорт'],['discord','Discord'],['source','Откуда узнали'],['reason','Почему наша партия'],['bio','Биография']];
const MFIELDS=[['name','Имя *'],['role','Должность'],['group','Партийный орган'],['joined','Дата вступления'],['birth','Возраст / дата рождения'],['city','Город / район'],['discord','Discord'],['forum','Форум'],['quote','Цитата'],['bio','Биография','ta'],['achievements','Достижения','ta']];
let apps=null,editNews=null,editMem=null;
const msg=t=>{const e=document.getElementById('pmsg');if(e)e.textContent=t;else alert(t)};
const PR=['Кандидат','Член партии','Активист','Старший член партии','Ветеран партии','Почётный член партии'];const prn=r=>PR[r]||('Звание '+r);
// фото для новостей: до 1000px, JPEG q≈0.88 ≤ ~190 КБ (в документе до 4 фото, лимит Firestore 1 МБ)
function smallJpeg(f){return new Promise((res,rej)=>{if(!/^image\//.test(f.type))return rej(new Error('Не изображение: '+f.name));const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{let s=1000,q=.88,u='';for(let i=0;i<10;i++){const k=Math.min(1,s/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);u=c.toDataURL('image/jpeg',q);if(u.length<=190000)return res(u);if(q>.55)q=Math.max(.55,+(q-.08).toFixed(2));else s=Math.round(s*.8);}rej(new Error('Фото слишком большое: '+f.name))};im.onerror=()=>rej(new Error('Не удалось открыть '+f.name));im.src=r.result};r.readAsDataURL(f)});}
const VOK=u=>/^https:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com|vk\.com|vkvideo\.ru|rutube\.ru)\//i.test(u)||/^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i.test(u);
const today=()=>new Date().toISOString().slice(0,10);
function fileToData(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1000/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,0,0,c.width,c.height);let q=.88,u=c.toDataURL('image/jpeg',q);while(u.length>850000&&q>.3){q-=.1;u=c.toDataURL('image/jpeg',q);}u.length>850000?rej(new Error('Изображение слишком большое')):res(u)};im.onerror=rej;im.src=r.result};r.readAsDataURL(f)});}
async function imgVal(urlId,fileId,old){const f=document.getElementById(fileId).files[0];if(f)return fileToData(f);return document.getElementById(urlId).value.trim()||old||'';}
const v=id=>(document.getElementById(id)||{}).value||'';
const head=(t,sub)=>`<div class="kpanel"><div class="kp-h"><span>// ПАНЕЛЬ: ${esc((FB().power||{}).roleName||'')}</span><h2>${t}</h2>${sub||''}</div>`;

function newsPanel(){const n=editNews||{};const list=(D().news||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 return head(editNews?'Редактировать новость':'Добавить новость')+`<div class="kp-f"><label class="fl">Заголовок *<input id="pn-t" maxlength="200" value="${esc(n.title)}"></label>
 <label class="fl">Дата *<input id="pn-d" type="date" value="${esc(n.date||today())}"></label>
 <label class="fl">Текст *<textarea id="pn-x" rows="6" maxlength="20000">${esc(n.text)}</textarea></label>
 <label class="fl">Фото (до 4 шт., уменьшаются автоматически)<input id="pn-f" type="file" accept="image/*" multiple></label>
 ${(n.photos||[]).length||n.image?`<div class="nphotos">${(n.photos||[]).concat(n.image?[n.image]:[]).map(u=>`<img src="${esc(u)}" alt="">`).join('')}</div><label class="fl kp-chk"><input id="pn-keep" type="checkbox" checked> оставить текущие фото</label>`:''}
 <label class="fl">Видео — ссылки, по одной в строке (YouTube, VK Видео, Rutube или прямой .mp4)<textarea id="pn-v" rows="3" placeholder="https://youtu.be/…">${esc((n.videos||[]).join('\n'))}</textarea></label>

 <p class="aerr" id="pmsg"></p><button class="btn" id="pn-save">${editNews?'Сохранить':'Опубликовать'}</button>${editNews?' <button class="btn o" id="pn-cancel">Отмена</button>':''}</div>
 ${D().news?`<h3>Опубликованные</h3><table class="tbl">${list.map(x=>`<tr><td>${esc(window.VPPKA_FD(x.date))}</td><td>${esc(x.title)}</td><td class="kp-a"><button class="btn sm o" data-ne="${esc(x.id)}">Изменить</button> <button class="btn sm o kp-del" data-nd="${esc(x.id)}">Удалить</button></td></tr>`).join('')}</table>`:'<p class="amut">Новости пока берутся из content.json; после переноса в базу их можно будет править здесь.</p>'}</div>`;}

function memPanel(){const T=tier(),R=maxR()+1,ms=D().members||[],low=ms.filter(m=>(T>=4&&mt(m)<T&&(m.rank??0)<R)||isCh(m)),m=editMem||{rank:10};
 return `<div class="kpanel kpm"><div class="kp-h"><span>// ПАНЕЛЬ</span> <a class="kpm-apps" href="#apps">Заявки в партию →</a></div><details class="kpm-d"${editMem?' open':''}><summary>${editMem&&editMem.id?'✎ Редактировать участника':'+ Добавить участника'}</summary>`+
 `<div class="kp-f kp-grid">${MFIELDS.map(([k,l,t])=>t?`<label class="fl kp-w">${l}<textarea id="pm-${k}" rows="3">${esc(m[k])}</textarea></label>`:`<label class="fl${['joined','birth'].includes(k)?' kp-s':''}">${l}<input id="pm-${k}" value="${esc(m[k])}"></label>`).join('')}
 <label class="fl kp-s">Уровень (0–${R-1}) *<input id="pm-rank" type="number" min="0" max="${R-1}" value="${esc(m.rank??0)}"${isCh(m)?' disabled':''}></label><label class="fl kp-s">Ступень (0–${Math.max(0,T-1)})<input id="pm-tier" type="number" min="0" max="${Math.max(0,T-1)}" value="${esc(mt(m))}"${isCh(m)?' disabled':''}></label><label class="fl kp-s">Порядок<input id="pm-order" type="number" value="${esc(m.order??'')}"></label>
 <label class="fl">Фото — ссылка<input id="pm-photo" value="${esc(m.photo&&!String(m.photo).startsWith('data:')?m.photo:'')}"></label><label class="fl kp-s">или файл<input id="pm-file" type="file" accept="image/*"></label>
 <div class="kp-w"><p class="aerr" id="pmsg"></p><button class="btn" id="pm-save">${m.id?'Сохранить':'Добавить в состав'}</button>${editMem?' <button class="btn o" id="pm-cancel">Отмена</button>':''}</div></div></details>
 ${D().members?(()=>{const row=x=>`<div class="kl-r${/^вакансия$/i.test(String(x.name).trim())?' kl-v':''}"><span class="kl-n"><b>${esc(x.name)}</b> <small>${esc(x.role)}</small></span><span class="kl-b">ур. ${x.rank??0} · ст. ${mt(x)}</span><span class="kl-a">${isCh(x)?`<button class="kl-i" data-me="${esc(x.id)}" title="Изменить">✎</button>`:`<button class="kl-i" data-mu="${esc(x.id)}" title="Повысить">▲</button><button class="kl-i" data-md="${esc(x.id)}" title="Понизить">▼</button><button class="kl-i" data-me="${esc(x.id)}" title="Изменить">✎</button><button class="kl-i kl-x" data-mx="${esc(x.id)}" title="Удалить">🗑</button>`}</span></div>`;
 const isV=x=>/^вакансия$/i.test(String(x.name).trim()),L=low.filter(x=>!isV(x)&&(x.rank??0)>0),V=low.filter(isV),M=low.filter(x=>!isV(x)&&!((x.rank??0)>0));
 return `<h3>Руководство (доступные вам)</h3><div class="kl">${L.map(row).join('')||(V.length||M.length?'':'<div class="kl-r">Нет участников ниже вашего уровня.</div>')}</div>${V.length?`<details class="kl-g"><summary>Вакансии (${V.length})</summary><div class="kl">${V.map(row).join('')}</div></details>`:''}${M.length?`<details class="kl-g"><summary>Члены партии и кандидаты (${M.length})</summary><div class="kl">${M.map(row).join('')}</div></details>`:''}`})():'<p class="amut">Состав пока берётся из content.json; после переноса в базу его можно будет править здесь.</p>'}</div>`;}

window.VPPKA_APPS_RESET=()=>{apps=null};window.VPPKA_ROSTER_SYNC=()=>rosterSync();
function appsPage(){const c=`<div class="crumbs"><a href="#home">Главная</a> / Заявки в партию</div>`;
 if(tier()<3&&rank()<1000)return c+`<div class="pg"><h1>Нет доступа</h1><p>Раздел доступен ключам ступени 3 и выше.</p></div>`;
 if(!apps){loadApps();return c+`<div class="pg"><h1>Заявки в партию</h1><p>Загрузка…</p></div>`;}
 const T=tier();return c+`<div class="pg"><h1>Заявки в партию</h1>${T<3?'<p class="amut">Принимать заявки могут ключи ступени 3 и выше.</p>':''}<p class="aerr" id="pmsg"></p>${apps.length?'':'<p>Заявок нет.</p>'}${apps.map(a=>{const x=a.answers||{};return `<div class="blk kapp" id="app-${esc(a.id)}"><div class="kp-h"><span>// ${esc(a.createdAt?.toDate?a.createdAt.toDate().toLocaleString('ru-RU'):'')} · ${esc(STATUS[a.status]||a.status)}</span><h2>${esc(x.fio)}</h2></div><table class="tbl">${AQ.map(([k,l])=>`<tr><td>${l}</td><td>${esc(x[k])}</td></tr>`).join('')}</table>
 ${T>=3?`<div class="kp-row"><button class="btn sm" data-aa="${a.id}">Принять</button> <button class="btn sm o kp-del" data-ar="${a.id}">Отклонить</button>${T>=4?` <span class="kp-in">в руководство: должность <input id="ar-${a.id}" value="Член партии"> уровень <input id="ak-${a.id}" type="number" min="0" max="${maxR()}" value="10"></span> <button class="btn sm" data-am="${a.id}">Принять и назначить в руководство</button>`:''}</div>`:''}
 ${['accepted','member'].includes(a.status)?`<div class="kp-row"><span class="kp-in">Звание в партии: <b>${esc(prn(a.partyRank||0))}</b></span>${T>=4?` <button class="btn sm o" data-pu="${a.id}" title="Повысить">▲ Повысить</button> <button class="btn sm o" data-pd="${a.id}" title="Понизить">▼ Понизить</button>`:''}</div>`:''}</div>`}).join('')}</div>`;}
async function loadApps(){try{const s=await F().getDocs(F().query(F().collection(db(),'applications'),F().orderBy('createdAt','desc')));apps=s.docs.map(d=>({...d.data(),id:d.id})).filter(a=>!window.VPPKA_HIDDEN({discordId:a.discordId,uid:a.uid})||a.uid===FB().user?.uid);}catch(e){apps=[];setTimeout(()=>msg('Ошибка загрузки: '+(e.code||e.message)),0)}if(location.hash==='#apps')window.route();}

// ---------- Участники партии (только ключи с canViewMembers и владельцы) ----------
let mlist=null;
const canM=()=>{const p=FB().power||{};return !!p.members||(p.rank||0)>=1000};
const dlink=x=>{const s=String(x||'');const id=s.match(/(\d{15,21})/);return id?`<a href="https://discord.com/users/${id[1]}" target="_blank" rel="noopener">${esc(/^https?:/.test(s)?s:'discord.com/users/'+id[1])}</a>`:esc(s)};
const fdt=t=>t&&t.toDate?t.toDate().toLocaleDateString('ru-RU'):(t||'—');
let mq='',mf='all',ms='new';
const dsh=x=>{const s=String(x||'');const id=s.match(/(\d{15,21})/);const ic='<svg class="ml-dc" viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M20 5.3A19 19 0 0 0 15.4 4l-.6 1.2a17 17 0 0 0-5.6 0L8.6 4A19 19 0 0 0 4 5.3C1.1 9.6.3 13.8.7 18A19 19 0 0 0 6.4 21l1.2-1.9-1.9-.9.5-.4a13 13 0 0 0 11.6 0l.5.4-1.9.9 1.2 1.9a19 19 0 0 0 5.7-2.9c.5-4.9-.8-9.1-3.3-12.7ZM8.5 15.4c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3Zm7 0c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3Z"/></svg>';
 if(id)return `<a href="https://discord.com/users/${id[1]}" target="_blank" rel="noopener" title="${esc(s)}">${ic}${id[1].slice(0,4)}…${id[1].slice(-4)}</a>`;return s?`<span title="${esc(s)}">${ic}@${esc(s.replace(/^@/,''))}</span>`:'—'};
const KL={lead:'Руководство',cand:'Кандидат',reg:'Зарегистрирован'};
function mlRows(){const q=mq.trim().toLowerCase();let l=mlist.filter(m=>(mf==='all'||m.k===mf)&&(!q||[m.name,m.discord,m.status].join(' ').toLowerCase().includes(q)));
 l=l.slice().sort(ms==='az'?(a,b)=>String(a.name).localeCompare(String(b.name),'ru'):(a,b)=>b.t-a.t);
 return l.map(m=>`<div class="ml-r"><span class="ml-p">${m.photo?`<img src="${esc(m.photo)}" alt="">`:'<i></i>'}</span><span class="ml-n"><b>${esc(m.name||'—')}</b>${m.acc?'<span class="ml-ic" title="Аккаунт на сайте">◉</span>':''}${m.app?'<span class="ml-ic" title="Подана заявка">✉</span>':''}</span><span class="ml-d">${dsh(m.discord)}</span><span class="ml-s ml-${m.k}" title="${esc(m.status)}">${esc(m.status)}</span><span class="ml-t">${esc(m.date)}</span></div>`).join('')||'<div class="ml-r">Никого не найдено.</div>'}
window.VPPKA_ML=(k,v)=>{if(k==='q')mq=v;if(k==='f')mf=v;if(k==='s')ms=ms==='az'?'new':'az';const e=document.getElementById('ml-l');if(e)e.innerHTML=mlRows();document.querySelectorAll('.ml-c').forEach(b=>b.classList.toggle('on',b.dataset.f===mf));const sb=document.getElementById('ml-sort');if(sb)sb.textContent=ms==='az'?'А–Я':'Новые';};
function membersPage(){const c=`<div class="crumbs"><a href="#home">Главная</a> / Участники партии</div>`;
 if(!canM())return c+`<div class="pg"><h1>Нет доступа</h1><p>Раздел доступен только по специальному разрешению ключа.</p></div>`;
 if(!mlist){loadMembers();return c+`<div class="pg"><h1>Участники партии</h1><p>Загрузка…</p></div>`;}
 const n=k=>mlist.filter(m=>k==='all'||m.k===k).length;
 return c+`<div class="pg"><h1>Участники партии</h1><p class="amut">Закрытый список: аккаунты на сайте и принятые по заявкам. Всего: ${mlist.length}.</p><p class="aerr" id="pmsg"></p>
 <div class="ml-bar"><input id="ml-q" placeholder="Поиск: имя, Discord, статус" value="${esc(mq)}" oninput="VPPKA_ML('q',this.value)">${['all','lead','cand','reg'].map(k=>`<button class="ml-c${mf===k?' on':''}" data-f="${k}" onclick="VPPKA_ML('f','${k}')">${k==='all'?'Все':k==='lead'?'Руководство':k==='cand'?'Кандидаты':'Зарегистрированные'} <small>${n(k)}</small></button>`).join('')}<button class="ml-c" id="ml-sort" title="Сортировка" onclick="VPPKA_ML('s')">${ms==='az'?'А–Я':'Новые'}</button></div>
 <div class="ml" id="ml-l">${mlRows()}</div></div>`;}
async function loadMembers(){const out=[],seen=new Set();let er='';
 try{const s=await F().getDocs(F().collection(db(),'users'));s.docs.forEach(d=>{const u={...d.data(),uid:d.id};if(window.VPPKA_HIDDEN(u)&&d.id!==FB().user?.uid)return;seen.add(u.discordId);if(/^keymaster\./i.test(u.displayName||'')||/^keymaster\./i.test(u.discordId||''))return;out.push({name:u.fio||u.displayName||u.discordId,discord:u.discordLink||u.discordId,did:u.discordId,photo:u.photo,status:u.rank?u.roleName:'Зарегистрирован',k:u.rank?'lead':'reg',date:fdt(u.createdAt),acc:1,t:u.createdAt?.toMillis?.()||0});});}catch(e){er='Аккаунты: '+(e.code==='permission-denied'?'нет доступа (правила базы не обновлены или нет разрешения).':(e.code||e.message));}
 try{const s=await F().getDocs(F().collection(db(),'applications'));s.docs.forEach(d=>{const a=d.data();if(!['accepted','member'].includes(a.status)||window.VPPKA_HIDDEN(a))return;const x=a.answers||{};const dup=a.discordId&&seen.has(a.discordId);
  const t=a.reviewedAt||a.createdAt,st=STATUS[a.status]+' · '+prn(a.partyRank||0),hk=h=>String(h||'').trim().replace(/^@/,'').toLowerCase(),ex=out.find(o=>o.acc&&!o.app&&((a.discordId&&o.did===a.discordId)||(hk(x.discord)&&(hk(o.discord)===hk(x.discord)||hk(o.did)===hk(x.discord)))));if(ex){ex.app=1;if(x.fio)ex.name=x.fio;if(ex.k!=='lead'){ex.status=st;ex.k='cand'}return;}out.push({name:x.fio,discord:x.discord,status:st,k:'cand',app:1,date:fdt(t),t:t?.toMillis?.()||0});});}catch(e){er+=(er?' ':'')+'Заявки: '+(e.code||e.message);}
 mlist=out.sort((a,b)=>b.t-a.t);if(location.hash==='#members'){window.route();if(er)msg(er);}}


// ---------- Гости: зарегистрированы на сайте, но не приняты в партию (та же аудитория, что «Участники») ----------
const KEYMASTER='ZpVGAXbbg1a9I8kRsNEm0OU8QAt2';let gU=null,gA=null,gSub=null,gT=0,gX={};
const gIni=n=>String(n||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
function gStart(){if(gSub)return;const f=F(),d=db();gSub=[];
 const rr=()=>{clearTimeout(gT);gT=setTimeout(()=>{if((location.hash||'')==='#party'){const q=document.getElementById('pm-q'),v=q&&q.value,y=scrollY;window.route();const q2=document.getElementById('pm-q');if(q2&&v){q2.value=v;window.VPPKA_PQ(v)}scrollTo(0,y)}},120)};
 gSub.push(f.onSnapshot(f.collection(d,'users'),s=>{gU=s.docs.map(x=>({...x.data(),uid:x.id}));rr()},e=>{console.warn('guests users',e.code);gU=gU||[];rr()}));
 if(tier()>=4)gSub.push(f.onSnapshot(f.collection(d,'expulsions'),s=>{gX={};s.docs.forEach(x=>gX[x.id]=x.data());rr()},e=>console.warn('expulsions',e.code)));
 gSub.push(f.onSnapshot(f.collection(d,'applications'),s=>{gA=s.docs.map(x=>({...x.data(),id:x.id}));rr()},e=>{console.warn('guests apps',e.code);gA=gA||[];rr()}));}
function guests(){const mem=(window.VPPKA_DATA&&window.VPPKA_DATA.members)||(window.VPPKA_C&&window.VPPKA_C().leadership.members)||[];
 const md=new Set(mem.map(m=>String(m.discordId||'')).filter(Boolean)),apps=gA||[];
 const acc=a=>['accepted','member'].includes(a.status);const ts=t=>t?.toMillis?.()||0;
 return (gU||[]).filter(u=>!window.VPPKA_HIDDEN(u)&&u.uid!==KEYMASTER&&!u.keyHash&&!md.has(String(u.discordId||''))
   &&!apps.some(a=>acc(a)&&((a.uid&&a.uid===u.uid)||(a.discordId&&a.discordId===u.discordId))))
  .map(u=>{const my=apps.filter(a=>(a.uid&&a.uid===u.uid)||(a.discordId&&a.discordId===u.discordId)).sort((a,b)=>ts(b.createdAt)-ts(a.createdAt))[0];
   const xp=tier()>=4&&(gX[u.discordId]||(my&&my.status==='expelled'&&{}));const st=xp?'уволен'+(xp.reason?': '+xp.reason:''):(!my||my.status==='expelled')?'заявка не подана':my.status==='new'?'заявка на рассмотрении':my.status==='rejected'?'заявка отклонена':'заявка: '+(STATUS[my.status]||my.status);
   return {name:u.displayName||u.discordId||'Гость',discord:u.discordLink||u.discordId,photo:u.photo,date:fdt(u.createdAt),st,pend:my&&my.status==='new',xp:!!xp,uid:u.uid,did:u.discordId,apps:apps.filter(a=>((a.uid&&a.uid===u.uid)||(a.discordId&&a.discordId===u.discordId))&&['new','rejected','expelled'].includes(a.status)).map(a=>a.id),t:ts(u.createdAt)}}).sort((a,b)=>b.t-a.t);}
const gCanDel=()=>(FB().power?.rank||0)>=1000||tier()>=4;let gList=[];
window.VPPKA_GDEL=async uid=>{const x=gList.find(g=>g.uid===uid);if(!x||!gCanDel())return;
 if(uid===KEYMASTER||window.VPPKA_HIDDEN({uid,discordId:x.did})||(gU||[]).find(u=>u.uid===uid)?.keyHash)return msg('Этого пользователя удалять нельзя.');
 if(!confirm(`Удалить гостя «${x.name}»?\n\nБудет удалена его запись на сайте`+(x.apps.length?` и заявки (${x.apps.length})`:'')+`. Если он снова войдёт через Discord, появится заново как новый гость.`))return;
 const f=F(),d=db();try{for(const id of x.apps)await f.deleteDoc(f.doc(d,'applications',id));await f.deleteDoc(f.doc(d,'users',uid));msg('Гость удалён.')}
 catch(e){msg('Не удалось удалить: '+(e.code==='permission-denied'?'нет прав (опубликуйте новые правила базы).':(e.code||e.message)))}};
const gClose=()=>document.querySelectorAll('.g-dd:not([hidden])').forEach(d=>{d.hidden=true;d.previousElementSibling.setAttribute('aria-expanded','false')});
window.VPPKA_GMENU=(e,b)=>{e.preventDefault();e.stopPropagation();const d=b.nextElementSibling,was=!d.hidden;gClose();if(!was){d.hidden=false;b.setAttribute('aria-expanded','true')}};
document.addEventListener('click',e=>{if(e.target.closest('.g-mn')&&e.target.closest('a'))e.preventDefault();if(!e.target.closest('.g-mn'))gClose();else if(e.target.closest('.g-dd button'))gClose()});document.addEventListener('keydown',e=>{if(e.key==='Escape')gClose()});
function guestBlock(){if(!canM())return '';gStart();
 if(!gU)return `<div class="blk gst"><h2>Гости</h2><p class="amut">Загрузка…</p></div>`;const g=guests();gList=g;
 const card=x=>`<div class="pm-card gcard" data-q="${esc((x.name+' гость '+x.st).toLowerCase())}"><span class="pm-av${x.photo?'':' noph'}">${x.photo?`<img src="${esc(x.photo)}" alt="" loading="lazy">`:`<b>${esc(gIni(x.name))}</b>`}</span><span class="pm-n">${esc(x.name)}</span><span class="pm-r g-st${x.pend?' pend':''}${x.xp?' xp':''}">${esc(x.st)}</span>${x.discord?`<span class="pm-j g-d">${dlink(x.discord)}</span>`:''}<span class="pm-j">рег. ${esc(x.date)}</span>${gCanDel()?`<div class="g-mn"><button class="g-dots" aria-label="Действия" aria-haspopup="true" onclick="VPPKA_GMENU(event,this)">⋮</button><div class="g-dd" hidden role="menu"><button role="menuitem" onclick="VPPKA_CHAT&&VPPKA_CHAT.open('${esc(x.uid)}')">Написать</button><button role="menuitem" class="g-dd-del" onclick="VPPKA_GDEL('${esc(x.uid)}')">Удалить гостя</button></div></div>`:''}</div>`;
 return `<div class="blk gst"><h2>Гости <span class="g-cnt">${g.length}</span></h2><p class="amut">Зарегистрировались на сайте, но пока не приняты в партию. Раздел виден только по разрешению ключа.</p><div class="pm-grid">${g.map(card).join('')||'<p class="amut">Гостей нет.</p>'}</div></div>`;}

// ---------- «Уволить» из партии: владелец и ступень 5; только записи со ступенью ниже своей, не председатель ----------
const xMem=()=>(window.VPPKA_DATA&&window.VPPKA_DATA.members)||[];
const canX=m=>!!m&&tier()>=5&&mt(m)<tier()&&(m.rank??0)<(rank()>=1000?1000:100)&&!window.VPPKA_HIDDEN(m)&&m.name&&m.name!=='Вакансия'&&!(m.discordId&&m.discordId===((window.VPPKA_AUTH||{}).profile||{}).discordId);
const OWNER_IDS=['p_Xglv_ypsOH3s7mW2UTXD','m11'];
// уведомление в раздел чата «Повышения и понижения» (по Discord ID цели — дойдёт и до тех, кто ещё не зарегистрирован)
const myDidP=()=>String(((window.VPPKA_AUTH||{}).profile||{}).discordId||'');
const actorName=()=>{const did=myDidP(),me=(D().members||[]).find(x=>did&&x.discordId===did&&!String(x.id).startsWith('p_'))||(D().members||[]).find(x=>did&&x.discordId===did);const role=(me&&me.role)||(FB().power||{}).roleName||'';const nm=(me&&me.name)||((window.VPPKA_AUTH||{}).profile||{}).displayName||'';return [role,nm].filter(Boolean).join(' ')};
async function rankNote(did,kind,text){did=String(did||'');if(!did||did===myDidP())return;const f=F();try{await f.addDoc(f.collection(db(),'rankNotes'),{did,kind,text:String(text).slice(0,300),by:FB().user.uid,byName:actorName().slice(0,160),at:f.serverTimestamp(),read:false})}catch(e){console.warn('rankNote',e.code||e)}}
window.VPPKA_RANKNOTE=rankNote;
const canP=m=>!!m&&tier()>=4&&PR.includes(String(m.role||''))&&String(m.id||'').startsWith('p_')&&!OWNER_IDS.includes(m.id)&&mt(m)<tier()&&m.name&&m.name!=='Вакансия'&&!(m.discordId&&m.discordId===((window.VPPKA_AUTH||{}).profile||{}).discordId);
const pIdx=m=>{const i=PR.indexOf(String(m.role||''));return i<0?0:i};
const xMenu=m=>{const p=canP(m),x=canX(m),i=pIdx(m),st='event.preventDefault();event.stopPropagation();';if(!p&&!x)return '';
 return `<div class="g-mn"><button class="g-dots" aria-label="Действия" aria-haspopup="true" onclick="VPPKA_GMENU(event,this)">⋮</button><div class="g-dd" hidden role="menu">${p&&i<PR.length-1?`<button role="menuitem" onclick="${st}VPPKA_PROMO('${esc(m.id)}',1)">▲ Повысить → ${esc(PR[i+1])}</button>`:''}${p&&i>0?`<button role="menuitem" onclick="${st}VPPKA_PROMO('${esc(m.id)}',-1)">▼ Понизить → ${esc(PR[i-1])}</button>`:''}${x?`<button role="menuitem" class="g-dd-del" onclick="${st}VPPKA_EXPEL('${esc(m.id)}')">Уволить</button>`:''}</div></div>`};
window.VPPKA_PROMO=async(id,dir)=>{const m=xMem().find(x=>x.id===id);if(!canP(m))return msg('Нет прав менять звание этого человека.');
 const f=F(),d=db(),aid=id.slice(2);try{const ar=f.doc(d,'applications',aid),as=await f.getDoc(ar);if(!as.exists())return msg('Не найдена заявка этого члена партии.');
  const a=as.data(),cur=a.partyRank??pIdx(m),nr=cur+dir;if(nr<0||nr>=PR.length)return;
  if(!confirm(`${dir>0?'Повысить':'Понизить'} «${m.name}»?\n\n${prn(cur)} → ${prn(nr)}`))return;
  await f.updateDoc(ar,{partyRank:nr,partyRole:prn(nr),rankedBy:FB().user.uid,rankedAt:f.serverTimestamp()});
  await f.updateDoc(f.doc(d,'members',id),{role:prn(nr),updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()}).catch(e=>console.warn('member',e.code||e));
  await rankNote(a.discordId||m.discordId,dir>0?'up':'down',`Вы ${dir>0?'повышены':'понижены'}: ${prn(cur)} → ${prn(nr)}`);
  msg(`${m.name}: ${prn(nr)}.`);window.VPPKA_RELOAD&&window.VPPKA_RELOAD()}
 catch(e){msg('Не удалось: '+(e.code==='permission-denied'?'нет прав (правила базы).':(e.code||e.message)))}};
window.VPPKA_EXPEL=async id=>{const m=xMem().find(x=>x.id===id);if(!canX(m))return msg('Этого человека уволить нельзя.');
 const r=prompt(`Уволить «${m.name}» из партии?\n\nЗапись уберётся из «Членов партии»`+(m.group!==window.VPPKA_PG?' и должность станет вакансией':'')+`, а человек перейдёт в «Гости».\n\nПричина (необязательно):`,'');if(r===null)return;
 const f=F(),d=db(),me=FB().user.uid,now=f.serverTimestamp(),reason=r.trim().slice(0,500);
 const recs=m.discordId?xMem().filter(x=>x.discordId===m.discordId):[m];
 try{for(const x of recs){if(!canX(x))continue;const ref=f.doc(d,'members',x.id);
   if(x.group===window.VPPKA_PG)await f.deleteDoc(ref);
   else{const v={name:'Вакансия',rank:x.rank??0,tier:0,updatedBy:me,updatedAt:now};['role','group','order'].forEach(k=>{if(x[k]!==undefined)v[k]=x[k]});await f.setDoc(ref,v)}}
  if(m.discordId){const q=await f.getDocs(f.query(f.collection(d,'applications'),f.where('discordId','==',m.discordId)));
   for(const a of q.docs)if(['accepted','member'].includes(a.data().status))await f.updateDoc(a.ref,{status:'expelled',expelledBy:me,expelledAt:now});
   const e={name:String(m.name).slice(0,100),by:me,at:now};if(reason)e.reason=reason;await f.setDoc(f.doc(d,'expulsions',m.discordId),e)}
  msg('Уволен: '+m.name+'.');window.VPPKA_RELOAD&&window.VPPKA_RELOAD()}
 catch(e){msg('Не удалось уволить: '+(e.code==='permission-denied'?'нет прав (опубликуйте новые правила базы).':(e.code||e.message)))}};
// ---------- Баннер созывов/объявлений на главной (под «Документами») ----------
const DCH='https://discord.com/channels/1557758930959081502/1560401813856059553';let hn=[],hnSub=null;
function hnWhen(w,y0){const m=String(w||'').match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?(?:[^\d]+(\d{1,2})[:.](\d{2}))?/);if(!m)return null;let y=m[3]?+m[3]:y0;if(y<100)y+=2000;
 return new Date(y,+m[2]-1,+m[1],m[4]!==undefined?+m[4]:23,m[5]!==undefined?+m[5]:59)}
function hnActive(){const now=Date.now(),D=864e5;return hn.filter(x=>{const c=x.createdAt?.toMillis?.()||now;if(x.cancelled)return now-(x.cancelledAt?.toMillis?.()||c)<D;
 if(x.type==='convocation'){const w=hnWhen(x.when,new Date(c).getFullYear());return w?w.getTime()+3*36e5>now:now-c<14*D}return now-c<7*D}).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0))}
function hnHtml(){const L=hnActive();if(!L.length)return '';const fd=t=>{const d=t?.toDate?.();return d?d.toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''};const cd=tier()>=4;
 const it=x=>`<div class="hn-it${x.cancelled?' off':''}">${cd?`<button class="hn-del" data-id="${esc(x.id)}" data-ty="${x.type}" title="Удалить" aria-label="Удалить">×</button>`:''}${x.cancelled?'<span class="hn-x">Отменён</span>':''}<b>${esc(x.title)}</b>${x.when?`<span class="hn-w">🕒 ${esc(x.when)}</span>`:''}${(()=>{const a=x.authorName||(window.VPPKA_HIDDEN&&window.VPPKA_HIDDEN({uid:x.author})?'Начальник технического отдела':'');return a?`<span class="hn-a">✍ ${esc(a)}</span>`:''})()}${x.text?`<p>${esc(x.text.length>160?x.text.slice(0,157)+'…':x.text)}</p>`:''}${x.cancelled&&x.reason?`<p class="hn-r">Причина: ${esc(x.reason)}</p>`:''}<small>опубл. ${fd(x.createdAt)}</small></div>`;
 const blk=(t,A)=>A.length?`<div class="blk hnote"><h2><a href="${DCH}" target="_blank" rel="noopener">${t}</a></h2>${A.map(it).join('')}</div>`:'';
 return blk('Созывы',L.filter(x=>x.type==='convocation').slice(0,1))+blk('Объявления',L.filter(x=>x.type!=='convocation').slice(0,4))}
document.addEventListener('click',async e=>{const b=e.target.closest?.('.hn-del');if(!b)return;e.preventDefault();if(tier()<4)return;
 if(!confirm(b.dataset.ty==='convocation'?'Удалить этот созыв?':'Удалить это объявление?'))return;b.disabled=true;
 try{const f=F();await f.deleteDoc(f.doc(db(),'notifications',b.dataset.id));hn=hn.filter(x=>x.id!==b.dataset.id);hnPaint()}
 catch(er){b.disabled=false;alert('Не удалось удалить: '+(er.code==='permission-denied'?'нет прав.':(er.code||er.message)))}});
window.VPPKA_HN=()=>{hnStart();return hnActive()};function hnPaint(){const e=document.getElementById('hnote');if(e)e.innerHTML=hnHtml()}
function hnStart(){if(hnSub||!FB()||!F())return;const f=F();hnSub=f.onSnapshot(f.query(f.collection(db(),'notifications'),f.where('type','in',['convocation','other'])),s=>{hn=s.docs.map(x=>({...x.data(),id:x.id}));hnPaint()},e=>{console.warn('home notices',e.code);hnSub=null})}
setInterval(()=>{if(!hnSub)hnStart();hnPaint()},60000);

// ---------- «Заявки на вступление» на вкладке «Члены партии» (ступень 3+, как в панели заявок) ----------
let aqSub=null,aqA=null,aqT=0;
function aqStart(){if(aqSub)return;const f=F();aqSub=f.onSnapshot(f.collection(db(),'applications'),s=>{aqA=s.docs.map(x=>({...x.data(),id:x.id}));clearTimeout(aqT);aqT=setTimeout(()=>{if(location.hash==='#party'){const y=scrollY;window.route();scrollTo(0,y)}},120)},e=>{console.warn('aq',e.code);aqA=aqA||[]})}
const aqFio=a=>{const f=String((a.answers||{}).fio||'Без имени').trim();return f};
function appBlock(){if(tier()<3)return '';aqStart();if(!aqA)return `<div class="blk gst"><h2>Заявки на вступление</h2><p class="amut">Загрузка…</p></div>`;
 const L=aqA.filter(a=>(!a.status||a.status==='new')&&!window.VPPKA_HIDDEN({discordId:a.discordId,uid:a.uid})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
 const card=a=>{const n=aqFio(a),dt=a.createdAt?.toDate?a.createdAt.toDate().toLocaleDateString('ru-RU'):'';return `<div class="pm-card gcard aqcard" data-aqopen="${esc(a.id)}" role="button" tabindex="0"><span class="pm-av noph"><b>${esc(gIni(n))}</b></span><span class="pm-n">${esc(n)}</span><span class="pm-r g-st pend">Новая заявка</span>${(a.answers||{}).discord?`<span class="pm-j g-d">${esc(String(a.answers.discord).slice(0,60))}</span>`:''}<span class="pm-j">подана ${esc(dt)}</span><div class="aq-b"><button class="btn sm" data-aqok="${esc(a.id)}">Принять</button><button class="btn sm o kp-del" data-aqno="${esc(a.id)}">Отказать</button></div></div>`};
 return `<div class="blk gst aqs"><h2>Заявки на вступление <span class="g-cnt">${L.length}</span></h2><p class="aerr" id="aq-msg"></p><div class="pm-grid">${L.map(card).join('')||'<p class="amut">Нет новых заявок.</p>'}</div></div>`}
document.addEventListener('click',async e=>{const ok=e.target.closest('[data-aqok]'),no=e.target.closest('[data-aqno]'),op=e.target.closest('[data-aqopen]');
 if(ok||no){e.preventDefault();e.stopPropagation();const id=(ok||no).dataset.aqok||(ok||no).dataset.aqno,a=(aqA||[]).find(x=>x.id===id);if(!a||tier()<3)return;const st=ok?'accepted':'rejected',n=aqFio(a);
  if(!confirm(ok?`Принять заявку «${n}» в партию?`:`Отказать «${n}» во вступлении?`))return;const m=document.getElementById('aq-msg');(ok||no).disabled=true;
  try{const f=F();await f.updateDoc(f.doc(db(),'applications',id),{status:st,reviewedBy:FB().user.uid,reviewedAt:f.serverTimestamp(),reviewerRole:String(FB().power.roleName||'').slice(0,60)});
   window.VPPKA_APPS_RESET&&window.VPPKA_APPS_RESET();if(m)m.textContent=(ok?'Принят(а): ':'Отказано: ')+n;rosterSync().catch(x=>console.warn('roster',x.code||x))}
  catch(x){(ok||no).disabled=false;if(m)m.textContent='Ошибка: '+(x.code==='permission-denied'?'нет прав.':(x.code||x.message))}return}
 if(op){location.hash='#apps';let i=0;const t=setInterval(()=>{const el=document.getElementById('app-'+op.dataset.aqopen);if(el||++i>40){clearInterval(t);if(el){el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.add('aq-hl');setTimeout(()=>el.classList.remove('aq-hl'),2500)}}},150)}});
export function install(){const P=window.P,op=P.party;const oh=P.home;P.home=(...a)=>{hnStart();return oh(...a).replace(/(<div class="blk"><h2>Документы<\/h2>[\s\S]*?<\/ul><\/div>)/,'$1<div id="hnote">'+hnHtml()+'</div>')};if(/^#?(home)?$/.test(location.hash))window.route();P.party=()=>{const h0=op();const h=tier()>=4?h0.replace(/<a class="pm-card" href="#member\/([^"]*)"([^>]*)>/g,(s,id)=>{const m=xMem().find(x=>x.id===id);return s+xMenu(m)}):h0;const pw=FB().power||{},ab=[(pw.rank>0)&&'<a class="btn sm o" href="#apps">Заявки в партию</a>',(pw.members||rank()>=1000)&&'<a class="btn sm o" href="#members">Участники партии</a>'].filter(Boolean).join(' ');const hx=ab?h.replace(/(<h1>[^<]*<\/h1>)/,'$1<div class="adm-bar">'+ab+'</div>'):h;const g=appBlock()+guestBlock();return g?hx.replace(/<\/div>(\s*)$/,g+'</div>$1'):hx};const on=P.news,ol=P.leadership;installAssign();
 P.news=id=>{const h=on(id);return id===undefined&&tier()>=4?h.replace(/<\/div>$/,newsPanel()+'</div>'):h};
 P.leadership=()=>{const h=ol();return tier()>=4||chair()?h.replace(/<\/div>$/,memPanel()+'</div>'):h};
 P.apps=appsPage;P.members=membersPage;
 document.addEventListener('click',async ev=>{const b=ev.target.closest('button');if(!b)return;const d=b.dataset,id=b.id,f=F();
  const done=async t=>{await window.VPPKA_RELOAD();msg(t)};
  try{
  if(id==='pn-cancel'){editNews=null;window.route();}
  if(d.ne){editNews=(D().news||[]).find(x=>x.id===d.ne);window.route();}
  if(d.nd&&confirm('Удалить новость?')){await f.deleteDoc(f.doc(db(),'news',d.nd));await done('Новость удалена.');}
  if(id==='pn-save'){const o=editNews||{};const n={title:v('pn-t').trim(),text:v('pn-x').trim(),date:v('pn-d'),updatedAt:f.serverTimestamp()};
   if(!n.title||!n.text||!n.date)return msg('Заполните заголовок, текст и дату.');b.disabled=true;const fl=[...(document.getElementById('pn-f').files||[])];const keep=document.getElementById('pn-keep');let ph=keep&&keep.checked?(o.photos||[]).concat(o.image?[o.image]:[]):[];
   if(ph.length+fl.length>4){b.disabled=false;return msg('Не больше 4 фото в новости.');}for(const f of fl)ph.push(await smallJpeg(f));
   const legacy=ph.filter(u=>!String(u).startsWith('data:'));ph=ph.filter(u=>String(u).startsWith('data:'));if(legacy[0])n.image=legacy[0];if(ph.length)n.photos=ph;
   const vids=v('pn-v').split(/\s+/).map(x=>x.trim()).filter(Boolean);const bad=vids.filter(x=>!VOK(x)||x.length>300);if(bad.length){b.disabled=false;return msg('Неподдерживаемая ссылка на видео: '+bad[0]);}if(vids.length>5){b.disabled=false;return msg('Не больше 5 видео.');}if(vids.length)n.videos=vids;
   if(JSON.stringify(n).length>950000){b.disabled=false;return msg('Новость слишком большая — уберите одно фото.');}
   if(o.id){if(o.author)n.author=o.author;if(o.createdAt)n.createdAt=o.createdAt;await f.setDoc(f.doc(db(),'news',o.id),n);}else{n.author=FB().user.uid;n.createdAt=f.serverTimestamp();await f.addDoc(f.collection(db(),'news'),n);}
   editNews=null;await done('Сохранено.');}
  if(id==='pm-cancel'){editMem=null;window.route();}
  if(d.me){editMem=(D().members||[]).find(x=>x.id===d.me);window.route();scrollTo(0,document.querySelector('.kpanel').offsetTop);}
  if(d.mx&&confirm('Удалить участника из состава?')){await f.deleteDoc(f.doc(db(),'members',d.mx));await done('Удалено.');}
  if(d.mu||d.md){const m=(D().members||[]).find(x=>x.id===(d.mu||d.md));const r=(m.rank??0)+(d.mu?10:-10);const nr=Math.max(0,Math.min(maxR(),r));
   const {id:_,...rest}=m;await f.setDoc(f.doc(db(),'members',m.id),{...rest,rank:nr,updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()});await done(`${m.name}: уровень ${nr}.`);}
  if(id==='pm-save'){const o=editMem||{};const m={};MFIELDS.forEach(([k])=>{const x=v('pm-'+k).trim();if(x)m[k]=x});if(!m.name)return msg('Укажите имя.');
   if(o.id&&isCh(o)){m.rank=o.rank;if(o.tier!=null)m.tier=o.tier;}else{m.rank=parseInt(v('pm-rank'),10);const t=parseInt(v('pm-tier')||'0',10);if(!(t>=0&&t<tier()))return msg(`Ступень должна быть от 0 до ${tier()-1}.`);if(t)m.tier=t;}if(!(o.id&&isCh(o))&&!(m.rank>=0&&m.rank<=maxR()))return msg(`Уровень должен быть от 0 до ${maxR()}.`);const ord=parseInt(v('pm-order'),10);if(!isNaN(ord))m.order=ord;
   b.disabled=true;const ph=await imgVal('pm-photo','pm-file',o.photo);if(ph)m.photo=ph;m.updatedBy=FB().user.uid;m.updatedAt=f.serverTimestamp();
   if(o.id)await f.setDoc(f.doc(db(),'members',o.id),m);else await f.addDoc(f.collection(db(),'members'),m);editMem=null;await done('Сохранено.');}
  if(d.aa||d.ar||d.am){const aid=d.aa||d.ar||d.am,a=apps.find(x=>x.id===aid),st=d.aa?'accepted':d.ar?'rejected':'member';
   if(d.am){const r=parseInt(v('ak-'+aid),10);if(!(r>=0&&r<=maxR()))return msg(`Уровень должен быть от 0 до ${maxR()}.`);
    await f.setDoc(f.doc(db(),'members','p_'+aid),{name:String(a.answers.fio).slice(0,100),role:v('ar-'+aid).trim().slice(0,120)||'Член партии',group:'Члены партии',discord:String(a.answers.discord).slice(0,200),joined:new Date().toLocaleDateString('ru-RU'),rank:r,updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()});await window.VPPKA_RELOAD();}
   await f.updateDoc(f.doc(db(),'applications',aid),{status:st,reviewedBy:FB().user.uid,reviewedAt:f.serverTimestamp(),reviewerRole:String(FB().power.roleName||'').slice(0,60)});
   a.status=st;window.route();msg('Статус заявки: '+STATUS[st]);rosterSync().catch(e=>console.warn('roster',e.code||e));}
  if(d.pu||d.pd){const aid=d.pu||d.pd,a=apps.find(x=>x.id===aid),nr=Math.max(0,Math.min(PR.length-1,(a.partyRank||0)+(d.pu?1:-1)));
   await f.updateDoc(f.doc(db(),'applications',aid),{partyRank:nr,partyRole:prn(nr),rankedBy:FB().user.uid,rankedAt:f.serverTimestamp()});const _c=a.partyRank||0;a.partyRank=nr;a.partyRole=prn(nr);if(nr!==_c)rankNote(a.discordId,nr>_c?'up':'down',`Вы ${nr>_c?'повышены':'понижены'}: ${prn(_c)} → ${prn(nr)}`);window.route();msg(`${(a.answers||{}).fio}: ${prn(nr)}.`);rosterSync().catch(e=>console.warn('roster',e.code||e));}
  }catch(e){console.error(e);b.disabled=false;msg('Ошибка: '+(e.code==='permission-denied'?'нет прав (правила Firestore отклонили действие).':(e.code||e.message)));}
 });
 window.route();if(tier()>=4)rosterSync().catch(e=>console.warn('roster',e.code||e));}

// ---------- Назначение на должность (владелец и ступень 5) ----------
const isOwnerP=()=>rank()>=1000;
const canAssign=m=>!!m&&m.group!=='Члены партии'&&!String(m.id||'').startsWith('p_')&&(isOwnerP()||(tier()>=5&&mt(m)<5&&(m.rank??0)<100));
let asgUsers=null,asgPos=null;
function asgClose(){const o=document.getElementById('asg-ov');if(o)o.remove();document.body.classList.remove('asg-lock')}
function asgList(q){const ms=D().members||[];q=(q||'').toLowerCase();
 return (asgUsers||[]).filter(u=>!q||(u.displayName||'').toLowerCase().includes(q)||String(u.discordId).toLowerCase().includes(q)).map(u=>{const cur=ms.find(m=>m.discordId&&m.discordId===u.discordId);
  return `<button class="asg-it" data-asg="${esc(u.id)}"><span class="asg-av">${u.photo?`<img src="${esc(u.photo)}" alt="">`:esc((u.displayName||u.discordId||'?')[0])}</span><span class="asg-tx"><b>${esc(u.displayName||u.discordId)}</b><small>${cur?esc(cur.role)+(cur.id===asgPos.id?' (уже здесь)':''):(u.roleName?esc(u.roleName):'Без должности')}</small></span></button>`}).join('')||'<p class="amut">Никого не найдено.</p>'}
async function asgOpen(pid){asgPos=(D().members||[]).find(m=>m.id===pid);if(!canAssign(asgPos))return;asgClose();
 const o=document.createElement('div');o.id='asg-ov';o.className='asg-ov';o.innerHTML=`<div class="asg-box" role="dialog" aria-modal="true"><div class="asg-h"><div><span>// НАЗНАЧЕНИЕ</span><h3>${esc(asgPos.role)}</h3></div><button class="asg-x" id="asg-x" aria-label="Закрыть">✕</button></div><input id="asg-q" class="asg-q" placeholder="Поиск по имени или Discord"><div id="asg-l" class="asg-l"><p class="amut">Загрузка членов партии…</p></div><p class="aerr" id="asg-e"></p></div>`;
 document.body.appendChild(o);document.body.classList.add('asg-lock');
 o.addEventListener('click',e=>{if(e.target===o)asgClose()});document.getElementById('asg-q').oninput=e=>{document.getElementById('asg-l').innerHTML=asgList(e.target.value)};
 try{if(!asgUsers){let us=[];try{const s=await F().getDocs(F().collection(db(),'users'));us=s.docs.map(d=>({id:d.id,...d.data()})).filter(u=>!window.VPPKA_HIDDEN(u))}catch(e){if(e.code!=='permission-denied')throw e}
  // Только члены партии: принятые заявки (p_*) и действующие обладатели должностей. Просто зарегистрированные не попадают.
  const seen=new Set(),out=[];for(const m of (D().members||[])){if(window.VPPKA_HIDDEN(m))continue;const isP=String(m.id||'').startsWith('p_');if(!isP&&(!m.name||/^Вакансия/i.test(m.name)))continue;
   const key=m.discordId?'d:'+m.discordId:'n:'+String(m.name).toLowerCase().trim();if(seen.has(key))continue;seen.add(key);
   const u=m.discordId&&us.find(x=>x.discordId===m.discordId);
   out.push({id:u?u.id:'m:'+m.id,displayName:m.name||(u&&u.displayName)||m.discordId,discordId:m.discordId||'',photo:(u&&u.photo)||m.photo||'',roleName:m.role})}
  asgUsers=out.sort((a,b)=>String(a.displayName).localeCompare(String(b.displayName),'ru'))}
  document.getElementById('asg-l').innerHTML=asgList('')}catch(e){document.getElementById('asg-l').innerHTML='';document.getElementById('asg-e').textContent=e.code==='permission-denied'?'Нет доступа к списку членов партии: правила Firestore не разрешают чтение. Владельцу нужно опубликовать актуальный firestore.rules в консоли Firebase.':'Не удалось загрузить список: '+(e.code||e.message)}}
const KEEP=['role','group','rank','tier','order'];
const pick=(m,ks)=>Object.fromEntries(ks.filter(k=>m[k]!=null).map(k=>[k,m[k]]));
async function asgDo(uid){const u=(asgUsers||[]).find(x=>x.id===uid),p=asgPos;if(!u||!p)return;const f=F(),ms=D().members||[];
 const old=ms.find(m=>m.id!==p.id&&!String(m.id).startsWith('p_')&&(u.discordId?m.discordId===u.discordId:(!m.discordId&&m.name===u.displayName))),nm=u.displayName||u.discordId;
 if(!confirm(`Назначить «${nm}» на должность «${p.role}»?`+(old?`\nДолжность «${old.role}» станет вакантной.`:'')+(p.discordId&&p.discordId!==u.discordId||(!p.discordId&&p.name&&!/^Вакансия/i.test(p.name)&&p.name!==u.displayName)?`\nТекущий обладатель (${p.name}) будет снят.`:'')))return;
 const meta={updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()};
 try{if(old&&!canAssign(old))throw new Error(`нет прав освободить прежнюю должность «${old.role}»`);
  if(old)await f.setDoc(f.doc(db(),'members',old.id),{...pick(old,KEEP),name:'Вакансия',bio:'Должность вакантна.',...meta});
  const d={...pick(p,KEEP),name:String(nm).slice(0,100),discordId:u.discordId||'',discord:/^\d{15,21}$/.test(u.discordId)?'https://discord.com/users/'+u.discordId:'',joined:new Date().toLocaleDateString('ru-RU'),...meta};
  if(u.photo)d.photo=u.photo;
  await f.setDoc(f.doc(db(),'members',p.id),d);rankNote(u.discordId,'assign',`Вы назначены на должность: ${p.role}`+(old?` (прежняя: ${old.role})`:''));asgClose();await window.VPPKA_RELOAD();location.hash='#member/'+p.id;window.route();
  alert(`«${nm}» назначен(а): ${p.role}.`+(mt(p)?` Ступень ключа по должности: ${mt(p)} — выдайте/обновите ключ, если нужно.`:''))}
 catch(e){const el=document.getElementById('asg-e');if(el)el.textContent='Ошибка: '+(e.code==='permission-denied'?'недостаточно прав':(e.message||e.code))}}
function installAssign(){const P=window.P,om=P.member;
 P.member=(id,fr)=>{const h=om(id,fr),m=(D().members||[]).find(x=>x.id===id);return canAssign(m)?h.replace(/<\/div>$/,`<div class="asg-bar"><button class="btn" data-asgopen="${esc(id)}">Назначить</button><small class="amut">${m.discordId?'Сейчас: '+esc(m.name):'Должность вакантна'}</small></div></div>`):h};
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.asgopen)asgOpen(b.dataset.asgopen);else if(b.id==='asg-x')asgClose();else if(b.dataset.asg)asgDo(b.dataset.asg)});
 addEventListener('keydown',e=>{if(e.key==='Escape')asgClose()});}

// ---------- Публичный список членов партии: принятые заявки → members/p_<id> (group «Члены партии»), ступень 4+ ----------
let rsBusy=false;
async function rosterSync(){if(rsBusy||tier()<4)return;rsBusy=true;try{const f=F();const qs=await f.getDocs(f.collection(db(),'applications'));const cur=Object.fromEntries((D().members||[]).map(m=>[m.id,m]));
 for(const d of qs.docs){const a=d.data();if(!['accepted','member'].includes(a.status)||window.VPPKA_HIDDEN(a))continue;const id='p_'+d.id,o=cur[id]||{};if(!cur[id]&&a.discordId&&(D().members||[]).some(x=>x.discordId===a.discordId&&!String(x.id).startsWith('p_')))continue;
  const ts=a.reviewedAt||a.createdAt;const dt=ts&&ts.toDate?ts.toDate():null;
  const m={name:String((a.answers||{}).fio||'Товарищ').trim().replace(/\s+/g,' ').slice(0,100),role:String(a.partyRole||PR[a.partyRank||0]||'Кандидат').slice(0,120),group:'Члены партии',rank:0,
   joined:o.joined||(dt?dt.toLocaleDateString('ru-RU'):new Date().toLocaleDateString('ru-RU'))};
  if(a.discordId)m.discordId=String(a.discordId).slice(0,64);if(o.discordId&&!m.discordId)m.discordId=o.discordId;
  let ph=o.photo;if(a.uid){try{const u=await f.getDoc(f.doc(db(),'users',a.uid));if(u.exists()){const x=u.data();if(x.photo)ph=x.photo;if(!m.discordId&&x.discordId)m.discordId=x.discordId}}catch(e){}}
  if(ph)m.photo=ph;['bio','quote','city','birth','achievements','discord','forum','contact'].forEach(k=>{if(o[k])m[k]=o[k]});
  if(o.id&&['name','role','joined','photo','discordId'].every(k=>(o[k]||'')===(m[k]||''))&&o.group===m.group)continue;
  m.updatedBy=FB().user.uid;m.updatedAt=f.serverTimestamp();await f.setDoc(f.doc(db(),'members',id),m);}
 }finally{rsBusy=false}}
