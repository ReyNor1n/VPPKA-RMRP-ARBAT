// Панели для обладателей ключей. Все права дополнительно проверяются правилами Firestore.
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FB=()=>window.VPPKA_FB, F=()=>FB().F, db=()=>FB().db, rank=()=>(FB().power||{}).rank||0, chair=()=>!!(FB().power||{}).chair, tier=()=>(FB().power||{}).tier||0, mt=m=>m.tier||0, maxR=()=>rank()>=1000?999:99, isCh=m=>(m.rank??0)===100&&chair()&&mt(m)>=tier();
const D=()=>window.VPPKA_DATA||{};
const STATUS={new:'Новая',accepted:'Принята',rejected:'Отклонена',member:'Принята, в составе'};
const AQ=[['fio','ФИО'],['passport','Паспорт'],['discord','Discord'],['source','Откуда узнали'],['reason','Почему наша партия'],['bio','Биография']];
const MFIELDS=[['name','Имя *'],['role','Должность'],['group','Партийный орган'],['joined','Дата вступления'],['birth','Возраст / дата рождения'],['city','Город / район'],['discord','Discord'],['forum','Форум'],['quote','Цитата'],['bio','Биография','ta'],['achievements','Достижения','ta']];
let apps=null,editNews=null,editMem=null;
const msg=t=>{const e=document.getElementById('pmsg');if(e)e.textContent=t;else alert(t)};
// Звания. applications.partyRank: 1 = «Член партии» … 5 = «Почётный член партии» (индекс в PR = partyRank−1). «Кандидат» упразднён.
const PR=['Член партии','Активист','Старший член партии','Ветеран партии','Почётный член партии'];const prn=r=>{r=r|0;return r<1?PR[0]:(PR[r-1]||('Звание '+r))};const prIx=r=>Math.max(0,Math.min(PR.length-1,(r|0)-1));
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
<div id="pn-preview" style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;"></div>
<small class="amut">Фото сразу появятся ниже. В тексте можно вставить [фото:1], [фото:2] и т.д. на отдельной строке.</small>
 ${(n.photos||[]).length||n.image?`<div class="nphotos">${(n.photos||[]).concat(n.image?[n.image]:[]).map(u=>`<img src="${esc(u)}" alt="">`).join('')}</div><label class="fl kp-chk"><input id="pn-keep" type="checkbox" checked> оставить текущие фото</label>`:''}
 <label class="fl">Видео — ссылки, по одной в строке (YouTube, VK Видео, Rutube или прямой .mp4)<textarea id="pn-v" rows="3" placeholder="https://youtu.be/…">${esc((n.videos||[]).join('\n'))}</textarea></label>

 <div id="pn-dt"></div>${(setTimeout(()=>import('./discord-targets.js?v=212').then(m=>m.fillTarget('pn-dt','pn-dtsel','news')).catch(()=>{}),0),'')}
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
 const row2=x=>{let h=row(x);if((coreSeat(x.id)&&!isSuper())||occupiedSeat(x))h=h.replace('<button class="kl-i kl-x" data-mx="'+esc(x.id)+'" title="Удалить">🗑</button>','');return h};
 return `<h3>Руководство (доступные вам)</h3>${(rank()>=90||(FB().user&&(FB().user.email||'').includes('arseniynit')||(FB().power||{}).owner))?'<button class="btn sm o" id="add-vac">+ Добавить вакансию</button> ':''}<div class="kl">${L.map(row2).join('')||(V.length||M.length?'':'<div class="kl-r">Нет участников ниже вашего уровня.</div>')}</div>${V.length?`<details class="kl-g"><summary>Вакансии (${V.length})</summary><div class="kl">${V.map(row2).join('')}</div></details>`:''}${M.length?`<details class="kl-g"><summary>Члены партии (${M.length})</summary><div class="kl">${M.map(row2).join('')}</div></details>`:''}`})():'<p class="amut">Состав пока берётся из content.json; после переноса в базу его можно будет править здесь.</p>'}</div>`;}

window.VPPKA_APPS_RESET=()=>{apps=null};window.VPPKA_ROSTER_SYNC=()=>rosterSync();
function appsPage(){const c=`<div class="crumbs"><a href="#home">Главная</a> / Заявки в партию</div>`;
 if(tier()<3&&rank()<1000)return c+`<div class="pg"><h1>Нет доступа</h1><p>Раздел доступен ключам ступени 3 и выше.</p></div>`;
 if(!apps){loadApps();return c+`<div class="pg"><h1>Заявки в партию</h1><p>Загрузка…</p></div>`;}
 const T=tier();return c+`<div class="pg"><h1>Заявки в партию</h1>${T<3?'<p class="amut">Принимать заявки могут ключи ступени 3 и выше.</p>':''}<p class="aerr" id="pmsg"></p>${apps.length?'':'<p>Заявок нет.</p>'}${apps.map(a=>{const x=a.answers||{};return `<div class="blk kapp" id="app-${esc(a.id)}"><div class="kp-h"><span>// ${esc(a.createdAt?.toDate?a.createdAt.toDate().toLocaleString('ru-RU'):'')} · ${esc(STATUS[a.status]||a.status)}</span><h2>${esc(x.fio)}</h2></div><table class="tbl">${AQ.map(([k,l])=>`<tr><td>${l}</td><td>${esc(x[k])}</td></tr>`).join('')}</table>
 ${T>=3?`<div class="kp-row"><button class="btn sm" data-aa="${a.id}">Принять</button> <button class="btn sm o kp-del" data-ar="${a.id}">Отклонить</button>${T>=4?` <span class="kp-in">в руководство: должность <input id="ar-${a.id}" value="Член партии"> уровень <input id="ak-${a.id}" type="number" min="0" max="${maxR()}" value="10"></span> <button class="btn sm" data-am="${a.id}">Принять и назначить в руководство</button>`:''}</div>`:''}
 ${['accepted','member'].includes(a.status)?`<div class="kp-row"><span class="kp-in">Звание в партии: <b>${esc(prn(a.partyRank||0))}</b></span>${T>=4?` <button class="btn sm o" data-pu="${a.id}" title="Повысить">▲ Повысить</button> <button class="btn sm o" data-pd="${a.id}" title="Понизить">▼ Понизить</button>`:''}</div>`:''}</div>`}).join('')}</div>`;}
async function loadApps(){try{const s=await F().getDocs(F().query(F().collection(db(),'applications'),F().orderBy('createdAt','desc')));apps=s.docs.map(d=>({...d.data(),id:d.id})).filter(a=>(!a.status||a.status==='new'||((a.reviewedAt?.toMillis?.()||0)>Date.now()-12*3600e3))).filter(a=>!window.VPPKA_HIDDEN({discordId:a.discordId,uid:a.uid})||a.uid===FB().user?.uid);}catch(e){apps=[];setTimeout(()=>msg('Ошибка загрузки: '+(e.code||e.message)),0)}if(location.hash==='#apps')window.route();}

// ---------- Участники партии (только ключи с canViewMembers и владельцы) ----------
let mlist=null;
const canM=()=>{const p=FB().power||{};return !!p.members||(p.rank||0)>=1000};
const dlink=x=>{const s=String(x||'');const id=s.match(/(\d{15,21})/);return id?`<a href="https://discord.com/users/${id[1]}" target="_blank" rel="noopener">${esc(/^https?:/.test(s)?s:'discord.com/users/'+id[1])}</a>`:esc(s)};
const fdt=t=>t&&t.toDate?t.toDate().toLocaleDateString('ru-RU'):(t||'—');
let mq='',mf='all',ms='new';
const dsh=x=>{const s=String(x||'');const id=s.match(/(\d{15,21})/);const ic='<svg class="ml-dc" viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M20 5.3A19 19 0 0 0 15.4 4l-.6 1.2a17 17 0 0 0-5.6 0L8.6 4A19 19 0 0 0 4 5.3C1.1 9.6.3 13.8.7 18A19 19 0 0 0 6.4 21l1.2-1.9-1.9-.9.5-.4a13 13 0 0 0 11.6 0l.5.4-1.9.9 1.2 1.9a19 19 0 0 0 5.7-2.9c.5-4.9-.8-9.1-3.3-12.7ZM8.5 15.4c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3Zm7 0c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3Z"/></svg>';
 if(id)return `<a href="https://discord.com/users/${id[1]}" target="_blank" rel="noopener" title="${esc(s)}">${ic}${id[1].slice(0,4)}…${id[1].slice(-4)}</a>`;return s?`<span title="${esc(s)}">${ic}@${esc(s.replace(/^@/,''))}</span>`:'—'};
const KL={lead:'Руководство',cand:'Члены партии',reg:'Зарегистрированные',out:'Вне состава'};
const canPP=()=>{const p=FB().power||{};return (p.rank||0)>=1000||!!p.owner};
function mlRows(){const q=mq.trim().toLowerCase();let l=mlist.filter(m=>(mf==='all'||m.k===mf)&&(!q||[m.name,m.discord,m.status,m.pp].join(' ').toLowerCase().includes(q)));
 l=l.slice().sort(ms==='az'?(a,b)=>String(a.name).localeCompare(String(b.name),'ru'):(a,b)=>b.t-a.t);
 return l.map(m=>`<div class="ml-r"><span class="ml-p${window.isLdr&&window.isLdr(m.name)?' ldr-av'+(window.LT?window.LT(m.name):''):''}">${m.photo?`<img src="${esc(m.photo)}" alt="${esc(m.name||'')}">`:'<i></i>'}</span><span class="ml-n"><b>${esc(m.name||'—')}</b>${m.acc?'<span class="ml-ic" title="Аккаунт на сайте">◉</span>':''}${m.app?'<span class="ml-ic" title="Подана заявка">✉</span>':''}</span><span class="ml-d">${dsh(m.discord)}</span>${mlPP?`<span class="ml-pp" title="Статик (паспорт)">${esc(m.pp||'—')}</span>`:''}<span class="ml-s ml-${m.k==='out'?'reg':m.k}" title="${esc(m.tip||m.status)}">${esc(m.status)}</span><span class="ml-t">${esc(m.date)}</span></div>`).join('')||'<div class="ml-r">Никого не найдено.</div>'}
window.VPPKA_ML=(k,v)=>{if(k==='q')mq=v;if(k==='f')mf=v;if(k==='s')ms=ms==='az'?'new':'az';const e=document.getElementById('ml-l');if(e)e.innerHTML=mlRows();document.querySelectorAll('.ml-c').forEach(b=>b.classList.toggle('on',b.dataset.f===mf));const sb=document.getElementById('ml-sort');if(sb)sb.textContent=ms==='az'?'А–Я':'Новые';};
function membersPage(){const c=`<div class="crumbs"><a href="#home">Главная</a> / Участники партии</div>`;
 if(!canM())return c+`<div class="pg"><h1>Нет доступа</h1><p>Раздел доступен только по специальному разрешению ключа.</p></div>`;
 if(!mlist){loadMembers();return c+`<div class="pg"><h1>Участники партии</h1><p>Загрузка…</p></div>`;}
 const n=k=>mlist.filter(m=>k==='all'||m.k===k).length,ks=['all','lead','cand','reg'].concat(n('out')?['out']:[]);if(!ks.includes(mf))mf='all';
 return c+`<div class="pg"><h1>Участники партии</h1><p class="amut">Закрытый список: состав партии (руководство и карточки членов партии), а также аккаунты на сайте без членства. Один человек — одна строка. Всего: ${mlist.length}.</p><p class="aerr" id="pmsg"></p>
 <div class="ml-bar"><input id="ml-q" placeholder="Поиск: имя, Discord, статус${mlPP?', статик':''}" value="${esc(mq)}" oninput="VPPKA_ML('q',this.value)">${ks.map(k=>`<button class="ml-c${mf===k?' on':''}" data-f="${k}" onclick="VPPKA_ML('f','${k}')">${k==='all'?'Все':KL[k]} <small>${n(k)}</small></button>`).join('')}<button class="ml-c" id="ml-sort" title="Сортировка" onclick="VPPKA_ML('s')">${ms==='az'?'А–Я':'Новые'}</button></div>
 <div class="ml${mlPP?' pp':''}" id="ml-l">${mlRows()}</div></div>`;}
// Источник истины — коллекция members (то же, что состав на сайте и ростер в Discord):
//  • руководство — занятые места (не «Члены партии», не «Вакансия»), статус = должность(и);
//  • члены партии — карточки p_*, статус = звание (role карточки);
// к человеку (по Discord ID, иначе по ФИО) привязываются аккаунт и все его заявки (по ID заявки = p_<id>, Discord ID, uid, нику или ФИО).
// Аккаунт без членства — «Зарегистрирован»; принятая заявка без карточки и места — «Вне состава» (не «Принята»).
let mlPP=false;
const mlNz=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const mlHk=h=>{const s=String(h||'').trim();if(/\d{15,21}/.test(s))return '';return s.replace(/^https?:\/\/\S*\//,'').replace(/^@/,'').toLowerCase()};
const mlDid=x=>{const m=String(x||'').match(/(\d{15,21})/);return m?m[1]:''};
const mlMs=t=>t&&t.toMillis?t.toMillis():(t&&t.seconds?t.seconds*1000:(typeof t==='string'?(Date.parse(t)||0):0));
const mlJoin=s=>{const m=String(s||'').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);return m?Date.UTC(+m[3],+m[2]-1,+m[1],12):0};
async function loadMembers(){let er='';const f=F(),me=FB().user&&FB().user.uid,myDid=myDidP();
 const get=async(c,lab)=>{try{return (await f.getDocs(f.collection(db(),c))).docs.map(d=>({...d.data(),id:d.id}))}catch(e){er+=(er?' ':'')+lab+': '+(e.code==='permission-denied'?'нет доступа (правила базы не обновлены или нет разрешения).':(e.code||e.message));return []}};
 const [mem,users,apps]=await Promise.all([get('members','Состав'),get('users','Аккаунты'),get('applications','Заявки')]);
 const hid=x=>window.VPPKA_HIDDEN&&window.VPPKA_HIDDEN(x)&&!(x.discordId&&x.discordId===myDid)&&!(x.uid&&x.uid===me)&&!(x.id&&x.id===me);
 const P=new Map(),byKey=k=>P.get(k);
 const add=m=>{const did=String(m.discordId||'')||mlDid(m.discord),k=did?'d:'+did:'n:'+mlNz(m.name);let p=byKey(k);
  if(!p&&!did){for(const x of P.values())if(mlNz(x.name)===mlNz(m.name)){p=x;break}}
  if(!p){p={key:k,did,name:m.name,seats:[],card:null,user:null,apps:[],photo:''};P.set(k,p)}return p};
 for(const m of mem){if(!m.name||isVacName(m.name))continue;const party=String(m.id).startsWith('p_')||m.group===window.VPPKA_PG;const p=add(m);
  if(party){if(!p.card)p.card=m}else p.seats.push(m);if(m.photo&&!p.photo)p.photo=m.photo}
 const people=[...P.values()];
 const findP=(did,nm)=>(did&&people.find(p=>p.did===did))||null;
 const guests=[];
 for(const u0 of users){const u={...u0,uid:u0.id};if(/^keymaster\./i.test(u.displayName||'')||/^keymaster\./i.test(u.discordId||''))continue;
  const p=findP(String(u.discordId||''))||people.find(p=>p.card&&p.card.id==='p_'+u.id);if(p&&!p.user){p.user=u;if(!p.did&&u.discordId)p.did=u.discordId}else if(!p)guests.push({user:u,apps:[]})}
 const hkOf=p=>[p.user&&p.user.displayName,p.user&&p.user.discordLink,...p.apps.map(a=>(a.answers||{}).discord)].map(mlHk).filter(Boolean);
 const order=apps.slice().sort((a,b)=>(a.discordId?0:1)-(b.discordId?0:1));
 const loose=[];
 for(const a of order){const x=a.answers||{},did=String(a.discordId||'')||mlDid(x.discord),hk=mlHk(x.discord);
  let p=people.find(q=>q.card&&q.card.id==='p_'+a.id)||(did&&people.find(q=>q.did===did))||(a.uid&&people.find(q=>q.user&&q.user.uid===a.uid))||(hk&&people.find(q=>hkOf(q).includes(hk)));
  if(!p&&x.fio){const c=people.filter(q=>mlNz(q.name)===mlNz(x.fio));if(c.length===1)p=c[0]}
  if(p){p.apps.push(a);continue}
  const g=guests.find(g=>(did&&String(g.user.discordId||'')===did)||(a.uid&&g.user.uid===a.uid)||(hk&&mlHk(g.user.displayName)===hk));if(g){g.apps.push(a);continue}
  loose.push(a)}
 const out=[];
 for(const p of people){if(hid({discordId:p.did,uid:p.user&&p.user.uid}))continue;
  const seats=p.seats.slice().sort((a,b)=>(Number(b.rank)||0)-(Number(a.rank)||0)),rk=(p.card&&p.card.role)||'Член партии';
  const t=Math.max(0,...[...seats,p.card].filter(Boolean).map(m=>mlJoin(m.joined)))||Math.max(0,...p.apps.filter(a=>['accepted','member'].includes(a.status)).map(a=>mlMs(a.reviewedAt||a.createdAt)))||mlMs(p.user&&p.user.createdAt);
  const okApp=p.apps.filter(a=>['accepted','member'].includes(a.status)).sort((a,b)=>mlMs(b.createdAt)-mlMs(a.createdAt))[0];
  out.push({name:(seats[0]||p.card||{}).name||p.name,discord:p.did||(okApp&&(okApp.answers||{}).discord)||'',did:p.did,uid:p.user&&p.user.uid,photo:p.photo||(p.user&&p.user.photo)||'',
   status:seats.length?seats.map(m=>m.role).join(', '):rk,tip:seats.length?seats.map(m=>m.role).join(', ')+' · звание: '+rk:'Звание: '+rk,k:seats.length?'lead':'cand',
   acc:p.user?1:0,app:p.apps.length?1:0,date:t?new Date(t).toLocaleDateString('ru-RU'):'—',t})}
 for(const g of guests){const u=g.user;if(hid(u))continue;const ok=g.apps.some(a=>['accepted','member'].includes(a.status));
  out.push({name:u.fio||(g.apps[0]&&(g.apps[0].answers||{}).fio)||u.displayName||u.discordId,discord:u.discordLink||u.discordId,did:u.discordId,uid:u.uid,photo:u.photo,
   status:ok?'Заявка принята, нет в составе':'Зарегистрирован',tip:ok?'Принятая заявка есть, но карточки в составе нет (снят, исключён или карточка удалена)':'Аккаунт на сайте, в составе партии нет',k:ok?'out':'reg',acc:1,app:g.apps.length?1:0,date:fdt(u.createdAt),t:mlMs(u.createdAt)})}
 const seenL=new Set();
 for(const a of loose){if(!['accepted','member'].includes(a.status)||hid(a))continue;const x=a.answers||{},k=String(a.discordId||'')||mlHk(x.discord)||mlNz(x.fio);if(seenL.has(k))continue;seenL.add(k);const t=mlMs(a.reviewedAt||a.createdAt);
  out.push({name:x.fio,discord:a.discordId||x.discord,status:'Заявка принята, нет в составе',tip:'Принятая заявка без карточки в составе и без аккаунта',k:'out',app:1,date:t?new Date(t).toLocaleDateString('ru-RU'):'—',t})}
 mlPP=canPP();
 if(mlPP)await Promise.all(out.filter(o=>o.uid).map(async o=>{try{const s=await f.getDoc(f.doc(db(),'users',o.uid,'priv','p'));if(s.exists())o.pp=s.data().passport||''}catch(e){}}));
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
 const card=x=>`<div class="pm-card gcard" data-q="${esc((x.name+' гость '+x.st).toLowerCase())}"><span class="pm-av${x.photo?'':' noph'}">${x.photo?`<img src="${esc(x.photo)}" alt="${esc(x.name||'')}" loading="lazy">`:`<b>${esc(gIni(x.name))}</b>`}</span><span class="pm-n">${esc(x.name)}</span><span class="pm-r g-st${x.pend?' pend':''}${x.xp?' xp':''}">${esc(x.st)}</span>${x.discord?`<span class="pm-j g-d">${dlink(x.discord)}</span>`:''}<span class="pm-j">рег. ${esc(x.date)}</span>${gCanDel()?`<div class="g-mn"><button class="g-dots" aria-label="Действия" aria-haspopup="true" onclick="VPPKA_GMENU(event,this)">⋮</button><div class="g-dd" hidden role="menu"><button role="menuitem" onclick="VPPKA_CHAT&&VPPKA_CHAT.open('${esc(x.uid)}')">Написать</button><button role="menuitem" class="g-dd-del" onclick="VPPKA_GDEL('${esc(x.uid)}')">Удалить гостя</button></div></div>`:''}</div>`;
 return `<div class="blk gst"><h2>Гости <span class="g-cnt">${g.length}</span></h2><p class="amut">Зарегистрировались на сайте, но пока не приняты в партию. Раздел виден только по разрешению ключа.</p><div class="pm-grid">${g.map(card).join('')||'<p class="amut">Гостей нет.</p>'}</div></div>`;}

// ---------- «Уволить» из партии: владелец и ступень 5; только записи со ступенью ниже своей, не председатель ----------
const xMem=()=>(window.VPPKA_DATA&&window.VPPKA_DATA.members)||[];
const canX=m=>!!m&&tier()>=5&&mt(m)<tier()&&(m.rank??0)<(rank()>=1000?1000:100)&&!window.VPPKA_HIDDEN(m)&&m.name&&m.name!=='Вакансия'&&!(m.discordId&&m.discordId===((window.VPPKA_AUTH||{}).profile||{}).discordId);
const OWNER_IDS=['p_Xglv_ypsOH3s7mW2UTXD','m11'];
// уведомление в раздел чата «Повышения и понижения» (по Discord ID цели — дойдёт и до тех, кто ещё не зарегистрирован)
const myDidP=()=>String(((window.VPPKA_AUTH||{}).profile||{}).discordId||'');
const actorName=()=>{const did=myDidP(),ms=(D().members||[]).filter(x=>did&&x.discordId===did&&!String(x.id).startsWith('p_')&&x.name&&!/^Вакансия/i.test(x.name)).sort((a,b)=>(Number(b.rank)||0)-(Number(a.rank)||0));const me=ms[0]||(D().members||[]).find(x=>did&&x.discordId===did);const role=(me&&me.role)||(FB().power||{}).roleName||'';const nm=(me&&me.name)||((window.VPPKA_AUTH||{}).profile||{}).displayName||'';return [role,nm].filter(Boolean).join(' ')};
async function rankNote(did,kind,text){did=String(did||'');if(!did||did===myDidP())return;const f=F();try{await f.addDoc(f.collection(db(),'rankNotes'),{did,kind,text:String(text).slice(0,300),by:FB().user.uid,byName:actorName().slice(0,160),at:f.serverTimestamp(),read:false})}catch(e){console.warn('rankNote',e.code||e)}}
window.VPPKA_RANKNOTE=rankNote;window.VPPKA_ACTOR=actorName;
// ---------- звание члена партии: кнопка + выбор (только Председатель ЦК, его заместители и владелец сайта) ----------
const RK_OWNER_DID='646280678736003073',RK_SEATS=['m1','m4','m5','m12'];
const rkAdminDids=()=>[RK_OWNER_DID,...RK_SEATS.map(s=>String(((xMem().find(x=>x.id===s))||{}).discordId||'')).filter(Boolean)];
const rkAdmin=()=>{const u=(FB()||{}).user,did=myDidP();return !!u&&!!did&&rkAdminDids().includes(did)};
// обладатели мест руководства (не «Члены партии», не вакансия) — по Discord ID и по ФИО
const rkNz=x=>String(x||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const rkLdr=m=>xMem().some(x=>!String(x.id||'').startsWith('p_')&&x.group&&x.group!==window.VPPKA_PG&&x.name&&!/^Вакансия/i.test(x.name)&&((m.discordId&&x.discordId&&String(x.discordId)===String(m.discordId))||rkNz(x.name)===rkNz(m.name)));
// кнопка звания — только у рядовых членов партии (не у руководства и не у распорядителей званий)
const rkTarget=m=>!!m&&String(m.id||'').startsWith('p_')&&PR.includes(String(m.role||''))&&m.name&&m.name!=='Вакансия'&&!window.VPPKA_HIDDEN(m)&&!(m.discordId&&rkAdminDids().includes(String(m.discordId)))&&!rkLdr(m);
const rkBtn=m=>rkAdmin()&&rkTarget(m)?`<span class="rk-btn" role="button" tabindex="0" data-rk="${esc(m.id)}" title="Изменить звание"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.6l1.6 3.6 3.9.4-2.9 2.6.8 3.9L8 10.1 4.6 12.1l.8-3.9L2.5 5.6l3.9-.4z"/></svg><b>${esc(m.role)}</b><i>▾</i></span>`:'';
window.VPPKA_RKBTN=rkBtn;
function rkClose(){const o=document.getElementById('rk-ov');if(o){o.remove();document.body.classList.remove('asg-lock')}}
function rkOpen(id){const m=xMem().find(x=>x.id===id);if(!rkAdmin()||!rkTarget(m))return;rkClose();const cur=PR.indexOf(String(m.role));
 const o=document.createElement('div');o.id='rk-ov';o.className='rk-ov';
 o.innerHTML=`<div class="rk-box" role="dialog" aria-modal="true"><div class="rk-hd"><div><span>// ЗВАНИЕ</span><h3>${esc(m.name)}</h3><small>Сейчас: ${esc(m.role)}</small></div><button class="rk-x" aria-label="Закрыть">✕</button></div>
 <ol class="rk-l">${PR.map((r,i)=>i).reverse().map(i=>`<li><button class="rk-it${i===cur?' cur':''}" data-rki="${i}" ${i===cur?'disabled':''}><span class="rk-n">${i+1}</span><span class="rk-t">${esc(PR[i])}</span>${i===cur?'<em>текущее</em>':i>cur?'<em class="up">▲ повысить</em>':'<em class="dn">▼ понизить</em>'}</button></li>`).join('')}</ol>
 <div class="rk-cf" hidden><p class="rk-q"></p><input class="rk-why" maxlength="300" placeholder="Причина (необязательно)"><div class="rk-bt"><button class="btn sm rk-ok">Подтвердить</button><button class="btn sm o rk-no">Отмена</button></div><p class="aerr rk-e"></p></div></div>`;
 let pick=-1;const cf=o.querySelector('.rk-cf');
 o.addEventListener('click',async e=>{if(e.target===o||e.target.closest('.rk-x'))return rkClose();const it=e.target.closest('[data-rki]');
  if(it){pick=+it.dataset.rki;o.querySelectorAll('.rk-it').forEach(b=>b.classList.toggle('sel',b===it));cf.hidden=false;cf.querySelector('.rk-q').innerHTML=`${pick>cur?'Повысить':'Понизить'} до звания <b>${esc(PR[pick])}</b>?<br><small>${esc(PR[cur])} → ${esc(PR[pick])}</small>`;cf.querySelector('.rk-why').focus();return}
  if(e.target.closest('.rk-no')){pick=-1;cf.hidden=true;o.querySelectorAll('.rk-it').forEach(b=>b.classList.remove('sel'));return}
  if(e.target.closest('.rk-ok')&&pick>=0){const bt=e.target.closest('.rk-ok');bt.disabled=true;try{await rkSet(m,cur,pick,cf.querySelector('.rk-why').value.trim());rkClose()}catch(er){bt.disabled=false;cf.querySelector('.rk-e').textContent='Не удалось: '+(er.code==='permission-denied'?'нет прав (правила базы).':(er.code||er.message))}}});
 document.body.appendChild(o);document.body.classList.add('asg-lock');o.querySelector('.rk-x').focus()}
async function rkSet(m,cur,nr,why){if(nr===cur||nr<0||nr>=PR.length)return;const f=F(),d=db(),aid=m.id.slice(2),me=FB().user.uid,dir=nr>cur?1:-1;
 const ar=f.doc(d,'applications',aid);let a={};try{const as=await f.getDoc(ar);if(as.exists()){a=as.data();await f.updateDoc(ar,{partyRank:nr+1,partyRole:PR[nr],rankedBy:me,rankedAt:f.serverTimestamp()})}}catch(e){if(e.code!=='permission-denied')throw e;console.warn('application',e.code)}
 await f.updateDoc(f.doc(d,'members',m.id),{role:PR[nr],updatedBy:me,updatedAt:f.serverTimestamp()});
 const did=a.discordId||m.discordId;await rankNote(did,dir>0?'up':'down',`Вы ${dir>0?'повышены':'понижены'}: ${PR[cur]} → ${PR[nr]}`);
 window.VPPKA_RH&&window.VPPKA_RH(did,dir>0?'up':'down',PR[cur],PR[nr],m.name,why).catch(e=>console.warn('rankHist',e.code||e));
 msg(`${m.name}: ${PR[nr]}.`);window.VPPKA_RELOAD&&await window.VPPKA_RELOAD()}
(function(){const hit=e=>{const b=e.target.closest&&e.target.closest('[data-rk]');if(!b)return;e.preventDefault();e.stopPropagation();rkOpen(b.dataset.rk)};
 document.addEventListener('click',hit,true);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('rk-ov'))rkClose();else if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[data-rk]'))hit(e)},true);addEventListener('hashchange',rkClose)})();
const canP=m=>!!m&&rkAdmin()&&rkTarget(m)&&PR.includes(String(m.role||''))&&String(m.id||'').startsWith('p_')&&!OWNER_IDS.includes(m.id)&&mt(m)<tier()&&m.name&&m.name!=='Вакансия'&&!(m.discordId&&m.discordId===((window.VPPKA_AUTH||{}).profile||{}).discordId);
const pIdx=m=>{const i=PR.indexOf(String(m.role||''));return i<0?0:i};
const xMenu=m=>{const p=canP(m),x=canX(m),i=pIdx(m),st='event.preventDefault();event.stopPropagation();';if(!p&&!x)return '';
 return `<div class="g-mn"><button class="g-dots" aria-label="Действия" aria-haspopup="true" onclick="VPPKA_GMENU(event,this)">⋮</button><div class="g-dd" hidden role="menu">${p&&i<PR.length-1?`<button role="menuitem" onclick="${st}VPPKA_PROMO('${esc(m.id)}',1)">▲ Повысить → ${esc(PR[i+1])}</button>`:''}${p&&i>0?`<button role="menuitem" onclick="${st}VPPKA_PROMO('${esc(m.id)}',-1)">▼ Понизить → ${esc(PR[i-1])}</button>`:''}${x?`<button role="menuitem" class="g-dd-del" onclick="${st}VPPKA_EXPEL('${esc(m.id)}')">Уволить</button>`:''}</div></div>`};
window.VPPKA_PROMO=async(id,dir)=>{const m=xMem().find(x=>x.id===id);if(!canP(m))return msg('Нет прав менять звание этого человека.');
 const f=F(),d=db(),aid=id.slice(2);try{const ar=f.doc(d,'applications',aid),as=await f.getDoc(ar);if(!as.exists())return msg('Не найдена заявка этого члена партии.');
  const a=as.data(),cur=a.partyRank!=null?prIx(a.partyRank):pIdx(m),nr=cur+dir;if(nr<0||nr>=PR.length)return;
  const why=prompt(`${dir>0?'Повысить':'Понизить'} «${m.name}»?\n${PR[cur]} → ${PR[nr]}\n\nПричина (необязательно):`,'');if(why===null)return;
  await f.updateDoc(ar,{partyRank:nr+1,partyRole:PR[nr],rankedBy:FB().user.uid,rankedAt:f.serverTimestamp()});
  await f.updateDoc(f.doc(d,'members',id),{role:PR[nr],updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()}).catch(e=>console.warn('member',e.code||e));
  await rankNote(a.discordId||m.discordId,dir>0?'up':'down',`Вы ${dir>0?'повышены':'понижены'}: ${PR[cur]} → ${PR[nr]}`);
  window.VPPKA_RH&&window.VPPKA_RH(a.discordId||m.discordId,dir>0?'up':'down',PR[cur],PR[nr],m.name,why).catch(e=>console.warn('rankHist',e.code||e));
  msg(`${m.name}: ${PR[nr]}.`);window.VPPKA_RELOAD&&window.VPPKA_RELOAD()}
 catch(e){msg('Не удалось: '+(e.code==='permission-denied'?'нет прав (правила базы).':(e.code||e.message)))}};
window.VPPKA_EXPEL=async id=>{const m=xMem().find(x=>x.id===id);if(!canX(m))return msg('Этого человека уволить нельзя.');
 const r=prompt(`Уволить «${m.name}» из партии?\n\nЗапись уберётся из «Членов партии»`+(m.group!==window.VPPKA_PG?' и должность станет вакансией':'')+`, а человек перейдёт в «Гости».\n\nПричина (необязательно):`,'');if(r===null)return;
 const f=F(),d=db(),me=FB().user.uid,now=f.serverTimestamp(),reason=r.trim().slice(0,500);
 const recs=m.discordId?xMem().filter(x=>x.discordId===m.discordId):[m];
 const gone=new Set(),vacated=new Set();
 try{for(const x of recs){if(!canX(x))continue;
   if(x.group===window.VPPKA_PG||String(x.id||'').startsWith('p_')){await deletePartyCard(x);gone.add(x.id);continue}
   if(!canTouch(x))continue;
   const ref=f.doc(d,'members',x.id);
   const v={name:'Вакансия',rank:x.rank??0,tier:0,updatedBy:me,updatedAt:now};['role','group','order','reportsTo','duties'].forEach(k=>{if(x[k]!==undefined)v[k]=x[k]});await f.setDoc(ref,v);vacated.add(x.id)}
  if(vacated.size){try{await writeLdrSeats(xMem().filter(x=>!gone.has(x.id)).map(x=>vacated.has(x.id)?{...x,name:'Вакансия',discordId:''}:x))}catch(e){console.warn('ldrSeats',e.code||e)}}
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
export function install(){const P=window.P,op=P.party;const oh=P.home;P.home=(...a)=>{hnStart();return seatBtns(oh(...a).replace(/(<div class="blk"><h2>Документы<\/h2>[\s\S]*?<\/ul><\/div>)/,'$1<div id="hnote">'+hnHtml()+'</div>'))};if(/^#?(home)?$/.test(location.hash))window.route();P.party=()=>{const h0=op().replace(/(<a class="pm-card[^"]*" href="#member\/([^"/]+)(?:\/[^"]*)?"[^>]*>[\s\S]*?)<\/a>/g,(s,body,id)=>body+rkBtn(xMem().find(x=>x.id===id))+'</a>');const h=tier()>=4?h0.replace(/<a class="pm-card" href="#member\/([^"/]+)(?:\/[^"]*)?"([^>]*)>/g,(s,id)=>{const m=xMem().find(x=>x.id===id);return s+xMenu(m)}):h0;const pw=FB().power||{},ab=[(pw.rank>0)&&'<a class="btn sm o" href="#apps">Заявки в партию</a>',(pw.members||rank()>=1000)&&'<a class="btn sm o" href="#members">Участники партии</a>'].filter(Boolean).join(' ');const hx=ab?h.replace(/(<h1>[^<]*<\/h1>)/,'$1<div class="adm-bar">'+ab+'</div>'):h;const g=appBlock()+guestBlock();return g?hx.replace(/<\/div>(\s*)$/,g+'</div>$1'):hx};const on=P.news,ol=P.leadership;installAssign();
 P.news=id=>{const h=on(id);return id===undefined&&tier()>=4?h.replace(/<\/div>$/,newsPanel()+'</div>'):h};
 P.leadership=()=>{let h=seatBtns(ol());const extra=(tier()>=4||chair()||isSuper()?memPanel():'')+postPanel();return extra?h.replace(/<\/div>$/,extra+'</div>'):h};
 P.apps=appsPage;P.members=membersPage;const omb=P.member;P.member=(id,from)=>{const h=omb(id,from),b=rkBtn(xMem().find(x=>x.id===id));return b?h.replace('</table>','</table><div class="rk-row">'+b+'</div>'):h};
 document.addEventListener('change',async ev=>{if(ev.target.id==='pn-f'){const prev=document.getElementById('pn-preview');if(!prev)return;prev.innerHTML='';const files=[...ev.target.files].slice(0,4);for(const f of files){try{const u=await smallJpeg(f);const img=document.createElement('img');img.src=u;img.style.cssText='width:80px;height:80px;object-fit:cover;border-radius:4px;border:1px solid #333';prev.appendChild(img);}catch(e){}}if(files.length){const ta=document.getElementById('pn-x');if(ta&&!/\[фото:\d+\]/i.test(ta.value)){for(let i=1;i<=files.length;i++)ta.value+='\n\n[фото:'+i+']';}}}});
document.addEventListener('click',async ev=>{const b=ev.target.closest('button');if(!b)return;const d=b.dataset,id=b.id,f=F();
  const done=async t=>{await window.VPPKA_RELOAD();msg(t)};
  try{
  if(id==='pn-cancel'){editNews=null;window.route();}
  if(d.ne){editNews=(D().news||[]).find(x=>x.id===d.ne);window.route();}
  if(d.nd&&confirm('Удалить новость?')){await f.deleteDoc(f.doc(db(),'news',d.nd));await done('Новость удалена.');}
  if(id==='pn-save'){const o=editNews||{};let nid='';const n={title:v('pn-t').trim(),text:v('pn-x').trim(),date:v('pn-d'),updatedAt:f.serverTimestamp()};
// auto-insert unused photo tags if none present
if(!/\[фото:\d+\]/i.test(n.text)){const fl=document.getElementById('pn-f');if(fl&&fl.files.length){for(let i=1;i<=fl.files.length;i++)n.text+='\n\n[фото:'+i+']';}}
   if(!n.title||!n.text||!n.date)return msg('Заполните заголовок, текст и дату.');b.disabled=true;const fl=[...(document.getElementById('pn-f').files||[])];const keep=document.getElementById('pn-keep');let ph=keep&&keep.checked?(o.photos||[]).concat(o.image?[o.image]:[]):[];
   if(ph.length+fl.length>4){b.disabled=false;return msg('Не больше 4 фото в новости.');}for(const f of fl)ph.push(await smallJpeg(f));
   const legacy=ph.filter(u=>!String(u).startsWith('data:'));ph=ph.filter(u=>String(u).startsWith('data:'));if(legacy[0])n.image=legacy[0];if(ph.length)n.photos=ph;
   const vids=v('pn-v').split(/\s+/).map(x=>x.trim()).filter(Boolean);const bad=vids.filter(x=>!VOK(x)||x.length>300);if(bad.length){b.disabled=false;return msg('Неподдерживаемая ссылка на видео: '+bad[0]);}if(vids.length>5){b.disabled=false;return msg('Не больше 5 видео.');}if(vids.length)n.videos=vids;
   if(JSON.stringify(n).length>950000){b.disabled=false;return msg('Новость слишком большая — уберите одно фото.');}
   if(o.id){if(o.align)n.align=o.align;if(o.author)n.author=o.author;if(o.createdAt)n.createdAt=o.createdAt;await f.setDoc(f.doc(db(),'news',o.id),(o.likeCount?{...n,likeCount:o.likeCount}:n));nid=o.id;}else{n.author=FB().user.uid;n.createdAt=f.serverTimestamp();nid=(await f.addDoc(f.collection(db(),'news'),n)).id;}
   // Отправка в Discord: своя строка из «Каналы Discord» — через бота (discordOut); иначе вебхук новостей, как раньше
   let dtNote='';const dt=document.getElementById('pn-dtsel')&&document.getElementById('pn-dtsel').value;
   if(dt&&/^c_[a-z0-9]{4,24}$/.test(dt)){try{const m=await import('./discord-targets.js?v=212');msg('Сохранено на сайте. Отправка в Discord…');const r=await m.sendVia('news',nid,dt);dtNote=r===true?' Отправлено в Discord.':' Discord: '+r}catch(e){dtNote=' Discord: '+(e.message||e)}}
   else try{const c=await f.getDoc(f.doc(db(),'config','discord'));const w=c.exists()&&c.data().webhook;if(w){const PING='1559635259635531947';const body={username:'ВППКА «Коммунисты Арбата»',content:'<@&'+PING+'>',allowed_mentions:{parse:[],roles:[PING]},embeds:[{title:('📰 Новость: '+n.title).slice(0,256),description:(n.text||'').replace(/\[фото:\d+\]/gi,'').slice(0,4000)||undefined,url:'https://vppka-arbat-rmrp.ru/#news',color:0xE32B2B,footer:{text:'vppka-arbat-rmrp.ru'},timestamp:new Date().toISOString()}]};await fetch(w,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});} }catch(e){console.warn('discord news',e)}
   editNews=null;await done('Сохранено.'+dtNote);}
  if(id==='pm-cancel'){editMem=null;window.route();}
  if(d.me){editMem=(D().members||[]).find(x=>x.id===d.me);window.route();scrollTo(0,document.querySelector('.kpanel').offsetTop);}
  if(d.mx){const m=(D().members||[]).find(x=>x.id===d.mx);if(!m)return;
   if(coreSeat(m.id)&&!isSuper())return msg('Должности председателя и его заместителей может удалить только владелец сайта.');
   if(occupiedSeat(m))return msg('Занятое место нельзя удалить. Снимите человека с должности — место останется вакантным.');
   if(!confirm(isVacName(m.name)?`Удалить вакансию «${m.role||m.name}»?\n\nМесто исчезнет из состава.`:'Удалить участника из состава?'))return;
   if(String(m.id).startsWith('p_')||m.group==='Члены партии')await deletePartyCard(m);
   else{await f.deleteDoc(f.doc(db(),'members',m.id));if(isLdrPost(m)){try{await writeLdrSeats((D().members||[]).filter(x=>x.id!==m.id))}catch(e){console.warn('ldrSeats',e.code||e)}}}
   await done('Удалено.');}
  if(d.mu||d.md){const m=(D().members||[]).find(x=>x.id===(d.mu||d.md));const r=(m.rank??0)+(d.mu?10:-10);const nr=Math.max(0,Math.min(maxR(),r));
   const {id:_,...rest}=m;await f.setDoc(f.doc(db(),'members',m.id),{...rest,rank:nr,updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()});await done(`${m.name}: уровень ${nr}.`);}
  if(id==='add-vac'){const f=F();await f.addDoc(f.collection(db(),'members'),{name:'Вакансия',role:'Вакансия',group:'Центральный Комитет',rank:0,tier:0,updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()});await done('Вакансия добавлена.');}
  if(id==='pm-save'){const o=editMem||{};const m={};MFIELDS.forEach(([k])=>{const x=v('pm-'+k).trim();if(x)m[k]=x});if(!m.name)return msg('Укажите имя.');
   if(o.id&&isCh(o)){m.rank=o.rank;if(o.tier!=null)m.tier=o.tier;}else{m.rank=parseInt(v('pm-rank'),10);const t=parseInt(v('pm-tier')||'0',10);if(!(t>=0&&t<tier()))return msg(`Ступень должна быть от 0 до ${tier()-1}.`);if(t)m.tier=t;}if(!(o.id&&isCh(o))&&!(m.rank>=0&&m.rank<=maxR()))return msg(`Уровень должен быть от 0 до ${maxR()}.`);const ord=parseInt(v('pm-order'),10);if(!isNaN(ord))m.order=ord;
   b.disabled=true;const ph=await imgVal('pm-photo','pm-file',o.photo);if(ph)m.photo=ph;m.updatedBy=FB().user.uid;m.updatedAt=f.serverTimestamp();
   if(!o.id){const dup=m.name!=='Вакансия'&&partyDup(m.name,'');if(dup){b.disabled=false;return msg('Такой человек уже есть в составе ('+dup.name+', '+dup.id+'). Новую карточку создавать не нужно — измените существующую.')}}
   if(o.id){const wasParty=String(o.id).startsWith('p_')||o.group==='Члены партии'||m.group==='Члены партии';
    if(wasParty)await savePartyEdit(o,m);else{await f.setDoc(f.doc(db(),'members',o.id),m);try{await writeLdrSeats((D().members||[]).map(x=>x.id===o.id?{...x,...m,id:o.id}:x))}catch(e){console.warn('ldrSeats',e.code||e)}}}
   else if(m.group==='Члены партии')await createPartyCard('p_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),m);else await f.addDoc(f.collection(db(),'members'),m);editMem=null;await done('Сохранено.');}
  if(d.aa||d.ar||d.am){const aid=d.aa||d.ar||d.am,a=apps.find(x=>x.id===aid),st=d.aa?'accepted':d.ar?'rejected':'member';
   if(d.am){const r=parseInt(v('ak-'+aid),10);if(!(r>=0&&r<=maxR()))return msg(`Уровень должен быть от 0 до ${maxR()}.`);
    const fio=String(a.answers.fio||'').trim().replace(/\s+/g,' ').slice(0,100);const dup=partyDup(fio,a.discordId)||(a.uid&&(D().members||[]).find(x=>x.id==='p_'+a.uid));const pid=dup?dup.id:(a.uid?'p_'+a.uid:'p_'+aid);
    const card={name:fio,role:v('ar-'+aid).trim().slice(0,120)||'Член партии',group:'Члены партии',discord:String(a.answers.discord||'').slice(0,200),joined:new Date().toLocaleDateString('ru-RU'),rank:r,updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()};if(a.discordId)card.discordId=String(a.discordId).slice(0,64);
    if(dup)await f.setDoc(f.doc(db(),'members',pid),{...(dup.photo?{photo:dup.photo}:{}),...card});else await createPartyCard(pid,card);await window.VPPKA_RELOAD();}
   await f.updateDoc(f.doc(db(),'applications',aid),{status:st,reviewedBy:FB().user.uid,reviewedAt:f.serverTimestamp(),reviewerRole:String(FB().power.roleName||'').slice(0,60)});
   a.status=st;window.route();msg('Статус заявки: '+STATUS[st]);rosterSync().catch(e=>console.warn('roster',e.code||e));}
  if(d.pu||d.pd){const aid=d.pu||d.pd,a=apps.find(x=>x.id===aid),nr=Math.max(1,Math.min(PR.length,(a.partyRank||1)+(d.pu?1:-1)));
   await f.updateDoc(f.doc(db(),'applications',aid),{partyRank:nr,partyRole:prn(nr),rankedBy:FB().user.uid,rankedAt:f.serverTimestamp()});const _c=a.partyRank||1;a.partyRank=nr;a.partyRole=prn(nr);if(nr!==_c){rankNote(a.discordId,nr>_c?'up':'down',`Вы ${nr>_c?'повышены':'понижены'}: ${prn(_c)} → ${prn(nr)}`);const why=prompt('Причина изменения звания (необязательно):','')||'';window.VPPKA_RH&&window.VPPKA_RH(a.discordId,nr>_c?'up':'down',prn(_c),prn(nr),(a.answers||{}).fio,why).catch(e=>console.warn('rankHist',e.code||e))}window.route();msg(`${(a.answers||{}).fio}: ${prn(nr)}.`);rosterSync().catch(e=>console.warn('roster',e.code||e));}
  }catch(e){console.error(e);b.disabled=false;msg('Ошибка: '+(e.code==='permission-denied'?'нет прав (правила Firestore отклонили действие).':(e.code||e.message)));}
 });
 window.route();if(tier()>=4)rosterSync().catch(e=>console.warn('roster',e.code||e));}

// ---------- Назначение на должность ----------
// Суперпользователь = владелец сайта (config/owners). Это же Начальник технического отдела.
const isOwnerP=()=>rank()>=1000||!!(FB().power&&FB().power.owner);
const isSuper=()=>isOwnerP();
const myDidA=()=>String(((window.VPPKA_AUTH||{}).profile||{}).discordId||((FB().user&&FB().user.email)||'').split('@')[0]||'');
const seatDid=id=>String((((D().members)||[]).find(x=>x.id===id)||{}).discordId||'');
// Председатель ЦК = discord на members/m1, замы = m4 и m5, зам. начальника техотдела = m12. Начальник техотдела = владелец (isSuper).
const isPostAdmin=()=>{if(isSuper())return true;const did=myDidA();return !!did&&['m1','m4','m5','m12'].some(s=>seatDid(s)===did)};
// Только зам. начальника техотдела (m12, без мест m1/m4/m5): не меняет своё место и места владельца (как в firestore.rules).
const isTechDepOnly=()=>{if(isSuper())return false;const did=myDidA();return !!did&&seatDid('m12')===did&&!['m1','m4','m5'].some(s=>seatDid(s)===did)};
const isChairP=()=>isSuper()||(!!myDidA()&&seatDid('m1')===myDidA());
const isLdrPost=m=>!!m&&m.group!=='Члены партии'&&!String(m.id||'').startsWith('p_');
function isVacName(name){return /^вакансия$/i.test(String(name||'').trim())}
function occupiedSeat(m){return isLdrPost(m)&&!!String(m.name||'').trim()&&!isVacName(m.name)}
const isTechPost=m=>!!m&&(m.id==='m11'||m.role==='Начальник технического отдела');
const coreSeat=id=>id==='m1'||id==='m4'||id==='m5';
// Места замов (m4, m5) переназначает только председатель (m1) или владелец. m1/m4/m5 не удаляет никто, кроме владельца.
const canTouch=m=>{if(!isLdrPost(m))return false;if(isSuper())return true;if(isTechPost(m)||(m.rank??0)>=100)return false;if(isTechDepOnly()&&(m.id==='m12'||String(m.discordId||'')===RK_OWNER_DID))return false;if(coreSeat(m.id))return isChairP();return isPostAdmin()||chair()||tier()>=5};
const canAssign=m=>canTouch(m);
const nzName=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
function claimKey(name){const s=String(name||'').trim().replace(/\s+/g,' ');if(!s||s.length>100||/[\\/]/.test(s)||s==='.'||s==='..')return '';return s}
function partyDup(name,did){const n=nzName(name),ms=D().members||[];return ms.find(m=>String(m.id||'').startsWith('p_')&&(m.group===window.VPPKA_PG||m.group==='Члены партии')&&((did&&String(m.discordId||'')===String(did))||(n&&nzName(m.name)===n)))}
async function createPartyCard(id,data){const f=F(),key=claimKey(data.name);if(!key)throw new Error('Некорректное имя');if(data.name!==key)data={...data,name:key};const b=f.writeBatch(db());b.set(f.doc(db(),'members',id),data);b.set(f.doc(db(),'memClaim',key),{name:data.name,memberId:id,by:FB().user.uid});await b.commit()}
// Удаление карточки члена партии. Замок memClaim снимается только если он есть и указывает на эту карточку.
// У старых карточек замка нет: тогда удаляется только members, и пачка не падает.
async function deletePartyCard(m){const f=F(),id=m.id,key=claimKey(m.name);const b=f.writeBatch(db());b.delete(f.doc(db(),'members',id));
 if(key){const c=await f.getDoc(f.doc(db(),'memClaim',key));if(c.exists()&&c.data()&&c.data().memberId===id)b.delete(c.ref)}
 await b.commit();await archiveApps(m)}
// Карточку удалили — принятые заявки этого человека переводим в «expelled» (архив), иначе Discord-бот и сайт
// считают его членом партии, а rosterSync пересоздаёт карточку. Если у него осталась другая карточка или место — не трогаем.
async function archiveApps(m){try{const f=F(),d=db(),did=String(m&&m.discordId||''),id=String(m&&m.id||''),me=FB().user&&FB().user.uid;if(!me||!id)return 0;
 if(did&&(D().members||[]).some(x=>x.id!==id&&x.name&&!isVacName(x.name)&&String(x.discordId||'')===did))return 0;
 const refs=new Map();if(/^\d{15,21}$/.test(did)){const q=await f.getDocs(f.query(f.collection(d,'applications'),f.where('discordId','==',did)));q.docs.forEach(x=>refs.set(x.id,x))}
 if(id.startsWith('p_')){try{const s=await f.getDoc(f.doc(d,'applications',id.slice(2)));if(s.exists())refs.set(s.id,s)}catch(e){}}
 let n=0;for(const s of refs.values()){if(!['accepted','member'].includes((s.data()||{}).status))continue;try{await f.updateDoc(s.ref,{status:'expelled',expelledBy:me,expelledAt:f.serverTimestamp()});n++}catch(e){console.warn('archiveApps',s.id,e.code||e)}}return n}
 catch(e){console.warn('archiveApps',e.code||e);return 0}}
window.VPPKA_ARCHIVE_APPS=archiveApps;
// Правка уже существующей карточки замок не создаёт. Если замок был и ФИО сменилось — переносим его, чтобы старое имя снова можно было принять.
async function savePartyEdit(o,data){const f=F();const oldKey=claimKey(o.name),leaving=data.group!=='Члены партии',newKey=leaving?'':claimKey(data.name);
 if(oldKey&&(leaving||(newKey&&oldKey!==newKey))){const cref=f.doc(db(),'memClaim',oldKey);const c=await f.getDoc(cref);
  if(c.exists()&&c.data()&&c.data().memberId===o.id){if(!leaving&&!newKey)throw new Error('Некорректное имя');const body=!leaving&&newKey?{...data,name:newKey}:data;const b=f.writeBatch(db());b.set(f.doc(db(),'members',o.id),body);b.delete(cref);if(newKey)b.set(f.doc(db(),'memClaim',newKey),{name:newKey,memberId:o.id,by:FB().user.uid});await b.commit();return}}
 await f.setDoc(f.doc(db(),'members',o.id),data)}
function ldrDids(list){const s=new Set();for(const m of list||[]){if(!isLdrPost(m)||!m.name||/^Вакансия/i.test(m.name))continue;const d=String(m.discordId||'');if(/^\d{15,21}$/.test(d))s.add(d)}return [...s]}
async function writeLdrSeats(list){const f=F();await f.setDoc(f.doc(db(),'config','ldrSeats'),{dids:ldrDids(list)},{merge:true})}
window.VPPKA_SYNC_SEATS=writeLdrSeats;
function whoLabel(){const did=myDidA();if(window.VPPKA_HIDDEN&&window.VPPKA_HIDDEN({uid:FB().user&&FB().user.uid,discordId:did}))return 'Начальник технического отдела';return actorName()||'Руководство партии'}
async function seatNote(m,kind,text){const did=String(m&&m.discordId||'');if(!/^\d{15,21}$/.test(did)||!m.id)return;const f=F();await f.addDoc(f.collection(db(),'notifications'),{type:kind,title:(kind==='recall'?'Снятие: ':'Назначение: ')+String(m.role||'должность').slice(0,80),text:String(text).slice(0,300),to:did,seat:String(m.id).slice(0,40),author:FB().user.uid,authorName:whoLabel().slice(0,160),createdAt:f.serverTimestamp()})}
let asgUsers=null,asgPos=null,asgBusy=false;
function asgClose(){const o=document.getElementById('asg-ov');if(o)o.remove();document.body.classList.remove('asg-lock')}
// Уже занимает любое место руководства (не «Вакансия»): Discord, uid или ФИО (ё→е).
function seatHeld(u){const did=String(u.discordId||''),uid=String(u.id||'').startsWith('m:')?'':String(u.id||''),nm=nzName(u.displayName);
 return (D().members||[]).some(m=>{if(!occupiedSeat(m))return false;const md=String(m.discordId||'');if(did&&md&&did===md)return true;if(uid&&(String(m.uid||'')===uid||m.id===uid||m.id==='p_'+uid))return true;if(nm&&nzName(m.name)===nm&&!(did&&md&&did!==md))return true;return false})}
function asgList(q){const ms=D().members||[];q=(q||'').toLowerCase();const show=asgBusy&&isOwnerP();
 const hit=u=>!q||(u.displayName||'').toLowerCase().includes(q)||String(u.discordId).toLowerCase().includes(q);
 const all=(asgUsers||[]).filter(hit),list=all.filter(u=>show||!seatHeld(u));
 if(!list.length)return '<p class="amut">'+(all.length?'Все подходящие люди уже занимают руководящие должности.':'Никого не найдено.')+'</p>';
 return list.map(u=>{const curs=ms.filter(m=>occupiedSeat(m)&&((u.discordId&&String(m.discordId||'')===String(u.discordId))||(!u.discordId&&nzName(m.name)===nzName(u.displayName))));const here=curs.some(m=>m.id===asgPos.id);
  return `<button class="asg-it" data-asg="${esc(u.id)}"><span class="asg-av">${u.photo?`<img src="${esc(u.photo)}" alt="">`:esc((u.displayName||u.discordId||'?')[0])}</span><span class="asg-tx"><b>${esc(u.displayName||u.discordId)}</b><small>${curs.length?esc(curs.map(m=>m.role).join(', '))+(here?' (уже на этой должности)':''):(u.roleName?esc(u.roleName):'Без должности')}</small></span></button>`}).join('')}
async function asgOpen(pid){asgPos=(D().members||[]).find(m=>m.id===pid);if(!canAssign(asgPos))return;asgClose();asgBusy=false;
 const tog=isOwnerP()?'<label class="asg-tog"><input type="checkbox" id="asg-busy"> показать занятых</label>':'';
 const o=document.createElement('div');o.id='asg-ov';o.className='asg-ov';o.innerHTML=`<div class="asg-box" role="dialog" aria-modal="true"><div class="asg-h"><div><span>// НАЗНАЧЕНИЕ</span><h3>${esc(asgPos.role)}</h3></div><button class="asg-x" id="asg-x" aria-label="Закрыть">✕</button></div><input id="asg-q" class="asg-q" placeholder="Поиск по имени или Discord">${tog}<div id="asg-l" class="asg-l"><p class="amut">Загрузка членов партии…</p></div><p class="aerr" id="asg-e"></p></div>`;
 document.body.appendChild(o);document.body.classList.add('asg-lock');
 o.addEventListener('click',e=>{if(e.target===o)asgClose()});document.getElementById('asg-q').oninput=e=>{document.getElementById('asg-l').innerHTML=asgList(e.target.value)};
 const busy=document.getElementById('asg-busy');if(busy)busy.onchange=e=>{asgBusy=!!e.target.checked;const q=document.getElementById('asg-q');document.getElementById('asg-l').innerHTML=asgList(q?q.value:'')};
 try{if(!asgUsers){let us=[];try{const s=await F().getDocs(F().collection(db(),'users'));us=s.docs.map(d=>({id:d.id,...d.data()})).filter(u=>!window.VPPKA_HIDDEN(u))}catch(e){if(e.code!=='permission-denied')throw e}
  // Только члены партии: принятые заявки (p_*) и действующие обладатели должностей. Просто зарегистрированные не попадают.
  const nz=x=>String(x||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
  // Один человек — одна строка. Несколько руководящих мест у него остаются: назначение на новое место их не снимает.
  const seen=new Set(),out=[];for(const m of (D().members||[])){if(!m.name||/^Вакансия/i.test(m.name))continue;const isP=(String(m.id||'').startsWith('p_')||m.group===window.VPPKA_PG)&&!window.VPPKA_HIDDEN(m);const isL=isLdrPost(m);if(!isP&&!isL)continue;
   const key=m.discordId?'d:'+m.discordId:'n:'+nz(m.name);if(seen.has(key))continue;seen.add(key);
   const u=m.discordId&&us.find(x=>x.discordId===m.discordId);const ldrs=(D().members||[]).filter(x=>isLdrPost(x)&&!/^Вакансия/i.test(x.name||'')&&((m.discordId&&x.discordId===m.discordId)||(!m.discordId&&nz(x.name)===nz(m.name)))).sort((a,b)=>(Number(b.rank)||0)-(Number(a.rank)||0));
   out.push({id:u?u.id:'m:'+m.id,displayName:m.name||(u&&u.displayName)||m.discordId,discordId:m.discordId||'',photo:(u&&u.photo)||m.photo||'',roleName:ldrs.length?ldrs.map(x=>x.role).join(', '):m.role,ldrId:ldrs[0]&&ldrs[0].id})}
  asgUsers=out.sort((a,b)=>String(a.displayName).localeCompare(String(b.displayName),'ru'))}
  document.getElementById('asg-l').innerHTML=asgList('')}catch(e){document.getElementById('asg-l').innerHTML='';document.getElementById('asg-e').textContent=e.code==='permission-denied'?'Нет доступа к списку членов партии: правила Firestore не разрешают чтение. Владельцу нужно опубликовать актуальный firestore.rules в консоли Firebase.':'Не удалось загрузить список: '+(e.code||e.message)}}
const KEEP=['role','group','rank','tier','order','reportsTo','duties'];
const pick=(m,ks)=>Object.fromEntries(ks.filter(k=>m[k]!=null).map(k=>[k,m[k]]));
async function asgDo(uid){const u=(asgUsers||[]).find(x=>x.id===uid),p=asgPos;if(!u||!p)return;const f=F(),ms=D().members||[];
 const same=p.discordId&&u.discordId&&p.discordId===u.discordId;if(same){const el=document.getElementById('asg-e');if(el)el.textContent='Этот человек уже на этой должности.';return}
 const held=ms.filter(m=>m.id!==p.id&&isLdrPost(m)&&!/^Вакансия/i.test(m.name||'')&&u.discordId&&m.discordId===u.discordId);
 const displaced=p.discordId&&p.discordId!==u.discordId&&p.name&&!/^Вакансия/i.test(p.name)?p:null;const nm=u.displayName||u.discordId;const who=whoLabel();
 if(!confirm(`Назначить «${nm}» на должность «${p.role}»?`+(held.length?`\nДругие должности сохраняются: ${held.map(x=>x.role).join(', ')}.`:'')+(displaced?`\nТекущий обладатель (${p.name}) будет снят и получит уведомление.`:'')))return;
 const meta={updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()};let noteErr='';
 const note=async(m,kind,text)=>{try{await seatNote(m,kind,text)}catch(e){noteErr=e.code||e.message;console.warn('seatNote',noteErr)}};
 try{if(!canAssign(p))throw new Error('нет прав на эту должность');
  if(displaced)await note(displaced,'recall',`Вас сняли с должности «${p.role}». Решение: ${who}.`);
  const d={...pick(p,KEEP),name:String(nm).slice(0,100),discordId:u.discordId||'',discord:/^\d{15,21}$/.test(u.discordId)?'https://discord.com/users/'+u.discordId:'',joined:new Date().toLocaleDateString('ru-RU'),...meta};
  if(u.photo)d.photo=u.photo;
  await f.setDoc(f.doc(db(),'members',p.id),d);
  if(displaced){rankNote(displaced.discordId,'down',`Вы сняты с должности «${p.role}». Решение: ${who}.`);window.VPPKA_RH&&window.VPPKA_RH(displaced.discordId,'down',p.role,'Снят(а) с должности',displaced.name,'').catch(()=>{})}
  try{await writeLdrSeats(ms.map(x=>x.id===p.id?{...x,name:String(nm).slice(0,100),discordId:u.discordId||''}:x))}catch(e){noteErr=noteErr||(e.code||e.message);console.warn('ldrSeats',e.code||e)}
  await note({id:p.id,role:p.role,discordId:u.discordId},'appoint',`Вас назначили на должность «${p.role}». Назначил: ${who}.`);
  rankNote(u.discordId,'assign',`Вас назначили на должность «${p.role}». Назначил: ${who}.`);
  window.VPPKA_RH&&window.VPPKA_RH(u.discordId,'assign','',p.role,nm,held.length?`Другие должности сохранены: ${held.map(x=>x.role).join(', ')}`:'').catch(e=>console.warn('rankHist',e.code||e));
  asgClose();await window.VPPKA_RELOAD();location.hash='#member/'+p.id;window.route();
  alert(`«${nm}» назначен(а): ${p.role}.`+(noteErr?' Уведомление или список должностей не записались ('+noteErr+') — опубликуйте firestore.rules.':'')+(mt(p)?` Ступень ключа по должности: ${mt(p)} — выдайте или обновите ключ, если нужно.`:''))}
 catch(e){const el=document.getElementById('asg-e');if(el)el.textContent='Ошибка: '+(e.code==='permission-denied'?'недостаточно прав':(e.message||e.code))}}
function postPanel(){if(!(isPostAdmin()||tier()>=5||chair()))return '';const ms=(D().members||[]).filter(canTouch);
 return `<div class="kpanel kpm"><div class="kp-h"><span>// ДОЛЖНОСТИ</span><h2>Назначения и вакансии</h2></div><div class="kp-f"><p class="amut">Назначить члена партии на руководящую должность или снять человека с занятого места: место остаётся, другие должности этого человека сохраняются. Удалить можно только пустую вакансию.</p>
 <label class="fl">Новая вакансия — название должности<input id="vac-role" maxlength="120" placeholder="Например: Член ЦК"></label>
 <label class="fl">Орган<select id="vac-group"><option>Центральный Комитет</option><option>Контрольно-ревизионная комиссия</option><option>Отделения</option><option>Технический отдел</option></select></label>
 <p class="aerr" id="vac-msg"></p><button class="btn" id="vac-add">Добавить вакансию</button></div>
 ${ms.map(m=>{const vac=isVacName(m.name),del=vac&&(isSuper()||!coreSeat(m.id))?` <button class="btn sm o" data-postdel="${esc(m.id)}">Удалить</button>`:'',off=!vac?` <button type="button" class="btn sm danger" data-unseat="${esc(m.id)}">Снять с должности</button>`:'';
  return `<div class="kl-r${vac?' kl-v':''}"><span class="kl-n"><b>${esc(m.name)}</b> <small>${esc(m.role)}</small> <small>${esc(m.group||'')}</small></span><span class="kl-a"><button class="btn sm" data-asgopen="${esc(m.id)}">Назначить</button>${off}${del}</span></div>`}).join('')}</div>`}
async function addVacancy(){const role=(document.getElementById('vac-role').value||'').trim().replace(/\s+/g,' ');const group=document.getElementById('vac-group').value;const el=document.getElementById('vac-msg');
 if(!role){el.textContent='Укажите название должности.';return}if(role==='Начальник технического отдела'){el.textContent='Эту должность может занять только владелец сайта.';return}
 const orders=(D().members||[]).map(m=>Number(m.order)).filter(n=>Number.isFinite(n));const order=Math.round((orders.length?Math.max(...orders):0)+1);
 const f=F();await f.addDoc(f.collection(db(),'members'),{name:'Вакансия',role:role.slice(0,120),group,bio:'Должность вакантна.',rank:0,tier:0,order,updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()});
 el.textContent='Вакансия добавлена.';await window.VPPKA_RELOAD()}
async function deletePost(id){const m=(D().members||[]).find(x=>x.id===id);if(!m||!canTouch(m))return;if(coreSeat(id)&&!isSuper())return;
 if(occupiedSeat(m))return msg('Занятую должность нельзя удалить. Снимите человека с должности — место останется вакантным.');
 if(!confirm(`Удалить вакансию «${m.role}»?`))return;
 const f=F();let noteErr='';
 await f.deleteDoc(f.doc(db(),'members',id));
 try{await writeLdrSeats((D().members||[]).filter(x=>x.id!==id))}catch(e){noteErr=noteErr||(e.code||e.message);console.warn('ldrSeats',e.code||e)}
 await window.VPPKA_RELOAD();alert(noteErr?'Должность удалена. Список должностей или уведомление не записались ('+noteErr+').':'Должность удалена.')}
function seatBtns(html){return String(html||'').replace(/<a class="card mcard[\s\S]*?<\/a>/g,a=>{const hm=a.match(/href="#member\/([^"/]+)/);if(!hm)return a;let id=hm[1];try{id=decodeURIComponent(id)}catch(e){}
 const m=(D().members||[]).find(x=>x.id===id);if(!occupiedSeat(m)||!canAssign(m))return a;
 return `<div class="ldr-seat">${a}<button type="button" class="btn sm danger unseat" data-unseat="${esc(id)}">Снять с должности</button></div>`})}
let unseatBusy=false;
async function unseat(id){if(unseatBusy)return;const m=(D().members||[]).find(x=>x.id===id);
 if(!occupiedSeat(m)||!canAssign(m))return msg('Эту должность снять нельзя.');
 const role=m.role||'должность',who=whoLabel();
 if(!confirm(`Снять «${m.name}» с должности «${role}»?\n\nМесто снова станет вакантным. Другие должности этого человека сохраняются.`))return;
 unseatBusy=true;const f=F();let noteErr='';
 try{if(/^\d{15,21}$/.test(String(m.discordId||''))){try{await seatNote(m,'recall',`Вас сняли с должности «${role}». Решение: ${who}.`)}catch(e){noteErr=e.code||e.message;console.warn('seatNote',noteErr)}
  }
  await f.setDoc(f.doc(db(),'members',m.id),{...pick(m,KEEP),name:'Вакансия',bio:'Должность вакантна.',updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()});
  // Личное сообщение и история — только после того, как место действительно освобождено (иначе при отказе человеку приходит ложное «Вы сняты»).
  if(/^\d{15,21}$/.test(String(m.discordId||''))){rankNote(m.discordId,'down',`Вы сняты с должности «${role}». Решение: ${who}.`);window.VPPKA_RH&&window.VPPKA_RH(m.discordId,'down',role,'Снят(а) с должности',m.name,'').catch(()=>{})}
  try{await writeLdrSeats((D().members||[]).map(x=>x.id===m.id?{...x,name:'Вакансия',discordId:''}:x))}catch(e){noteErr=noteErr||(e.code||e.message);console.warn('ldrSeats',e.code||e)}
  if(window.VPPKA_RELOAD)await window.VPPKA_RELOAD();msg(`«${m.name}» снят(а) с должности «${role}».`+(noteErr?' Уведомление или список должностей не записались ('+noteErr+') — опубликуйте firestore.rules.':''))}
 catch(e){msg('Не удалось снять: '+(e.code==='permission-denied'?'нет прав (опубликуйте новые правила базы).':(e.code||e.message)))}
 finally{unseatBusy=false}}
function installAssign(){const P=window.P,om=P.member;
 P.member=(id,fr)=>{const h=om(id,fr),m=(D().members||[]).find(x=>x.id===id);return canAssign(m)?h.replace(/<\/div>$/,`<div class="asg-bar"><button class="btn" data-asgopen="${esc(id)}">Назначить</button><small class="amut">${m.discordId?'Сейчас: '+esc(m.name):'Должность вакантна'}</small></div></div>`):h};
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-unseat]');if(!b)return;e.preventDefault();e.stopPropagation();unseat(b.dataset.unseat)},true);
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.asgopen){e.preventDefault();asgOpen(b.dataset.asgopen)}else if(b.id==='asg-x')asgClose();else if(b.dataset.asg)asgDo(b.dataset.asg);else if(b.id==='vac-add')addVacancy().catch(err=>{const el=document.getElementById('vac-msg');if(el)el.textContent='Ошибка: '+(err.code==='permission-denied'?'недостаточно прав':(err.message||err.code))});else if(b.dataset.postdel)deletePost(b.dataset.postdel).catch(err=>alert('Ошибка: '+(err.code==='permission-denied'?'недостаточно прав':(err.message||err.code))))});
 addEventListener('keydown',e=>{if(e.key==='Escape')asgClose()});}

// ---------- Публичный список членов партии: принятые заявки → members/p_<id> (group «Члены партии»), ступень 4+ ----------
let rsBusy=false;
function isPartyDoc(x){return !!x&&String(x.id||'').startsWith('p_')&&(x.group===window.VPPKA_PG||x.group==='Члены партии')}
function findParty(cur,a,fio){const list=Object.values(cur).filter(isPartyDoc),did=String(a.discordId||''),uid=String(a.uid||'');
 if(uid&&isPartyDoc(cur['p_'+uid]))return cur['p_'+uid];
 if(did){const m=list.find(x=>x.discordId===did);if(m)return m}
 const n=nzName(fio);if(n){const m=list.find(x=>nzName(x.name)===n);if(m)return m}
 return null}
async function rosterSync(){if(rsBusy||tier()<4)return;rsBusy=true;try{const f=F();const qs=await f.getDocs(f.collection(db(),'applications'));const cur=Object.fromEntries((D().members||[]).map(m=>[m.id,m]));
 for(const d of qs.docs){const a=d.data();if(!['accepted','member'].includes(a.status)||window.VPPKA_HIDDEN(a))continue;
  const fio=String((a.answers||{}).fio||'Товарищ').trim().replace(/\s+/g,' ').slice(0,100);
  const have=findParty(cur,a,fio);
  // У человека уже есть карточка (пусть даже под другим id) — вторую не создаём и старую роль не затираем.
  if(have){if(a.discordId&&!have.discordId){await f.updateDoc(f.doc(db(),'members',have.id),{discordId:String(a.discordId).slice(0,64),updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()});have.discordId=String(a.discordId)}continue}
  // Уже есть руководящее место с этим Discord — вторую рядовую карточку не создаём и само место не трогаем.
  if(a.discordId&&Object.values(cur).some(x=>!String(x.id).startsWith('p_')&&x.group!=='Члены партии'&&x.discordId===a.discordId&&x.name&&!/^Вакансия/i.test(x.name)))continue;
  const id=a.uid?'p_'+a.uid:'p_'+d.id;if(cur[id])continue;
  const ts=a.reviewedAt||a.createdAt;const dt=ts&&ts.toDate?ts.toDate():null;
  const m={name:fio,role:String(PR.includes(a.partyRole)?a.partyRole:prn(a.partyRank||1)).slice(0,120),group:'Члены партии',rank:0,joined:dt?dt.toLocaleDateString('ru-RU'):new Date().toLocaleDateString('ru-RU')};
  if(a.discordId)m.discordId=String(a.discordId).slice(0,64);
  if(a.uid){try{const u=await f.getDoc(f.doc(db(),'users',a.uid));if(u.exists()){const x=u.data();if(x.photo)m.photo=x.photo;if(!m.discordId&&x.discordId)m.discordId=String(x.discordId).slice(0,64)}}catch(e){}}
  m.updatedBy=FB().user.uid;m.updatedAt=f.serverTimestamp();await createPartyCard(id,m);cur[id]={...m,id}}
 }finally{rsBusy=false}}
