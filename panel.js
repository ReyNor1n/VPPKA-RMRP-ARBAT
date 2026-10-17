// Панели для обладателей ключей. Все права дополнительно проверяются правилами Firestore.
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FB=()=>window.VPPKA_FB, F=()=>FB().F, db=()=>FB().db, rank=()=>(FB().power||{}).rank||0, chair=()=>!!(FB().power||{}).chair, tier=()=>(FB().power||{}).tier||0, mt=m=>m.tier||0, maxR=()=>rank()>=1000?999:99, isCh=m=>(m.rank??0)===100&&chair()&&mt(m)>=tier();
const D=()=>window.VPPKA_DATA||{};
const STATUS={new:'Новая',accepted:'Принята',rejected:'Отклонена',member:'Принята, в составе'};
const AQ=[['fio','ФИО'],['passport','Паспорт'],['discord','Discord'],['source','Откуда узнали'],['reason','Почему наша партия'],['bio','Биография']];
const MFIELDS=[['name','Имя *'],['role','Должность'],['group','Партийный орган'],['joined','Дата вступления'],['birth','Возраст / дата рождения'],['city','Город / район'],['discord','Discord'],['forum','Форум'],['quote','Цитата'],['bio','Биография','ta'],['achievements','Достижения','ta']];
let apps=null,editNews=null,editMem=null;
const msg=t=>{const e=document.getElementById('pmsg');if(e)e.textContent=t};
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
 return head(editMem&&editMem.id?'Редактировать участника':'Добавить участника',`<p class="amut">Ступень вашего ключа: ${T}. ${T>=4?`Вы можете добавлять, повышать и понижать тех, чья ступень ниже ${T} (без ключа — 0).`:'Вам доступна только правка записи председателя.'} <a href="#apps">Заявки в партию →</a></p>`)+
 `<div class="kp-f kp-grid">${MFIELDS.map(([k,l,t])=>t?`<label class="fl kp-w">${l}<textarea id="pm-${k}" rows="3">${esc(m[k])}</textarea></label>`:`<label class="fl">${l}<input id="pm-${k}" value="${esc(m[k])}"></label>`).join('')}
 <label class="fl">Уровень (0–${R-1}) *<input id="pm-rank" type="number" min="0" max="${R-1}" value="${esc(m.rank??0)}"${isCh(m)?' disabled':''}></label><label class="fl">Ступень ключа человека (0–${Math.max(0,T-1)})<input id="pm-tier" type="number" min="0" max="${Math.max(0,T-1)}" value="${esc(mt(m))}"${isCh(m)?' disabled':''}></label><label class="fl">Порядок<input id="pm-order" type="number" value="${esc(m.order??'')}"></label>
 <label class="fl">Фото — ссылка<input id="pm-photo" value="${esc(m.photo&&!String(m.photo).startsWith('data:')?m.photo:'')}"></label><label class="fl">или загрузить<input id="pm-file" type="file" accept="image/*"></label>
 <div class="kp-w"><p class="aerr" id="pmsg"></p><button class="btn" id="pm-save">${m.id?'Сохранить':'Добавить в состав'}</button>${editMem?' <button class="btn o" id="pm-cancel">Отмена</button>':''}</div></div>
 ${D().members?`<h3>Руководство (доступные вам)</h3><table class="tbl">${low.map(x=>`<tr><td>${esc(x.name)}<br><small>${esc(x.role)}</small></td><td>ур. ${x.rank??0} · ступ. ${mt(x)}</td><td class="kp-a">${isCh(x)?`<button class="btn sm o" data-me="${esc(x.id)}">Изменить</button>`:`<button class="btn sm o" data-mu="${esc(x.id)}" title="Повысить">▲</button> <button class="btn sm o" data-md="${esc(x.id)}" title="Понизить">▼</button> <button class="btn sm o" data-me="${esc(x.id)}">Изменить</button> <button class="btn sm o kp-del" data-mx="${esc(x.id)}">Удалить</button>`}</td></tr>`).join('')||'<tr><td>Нет участников ниже вашего уровня.</td></tr>'}</table>`:'<p class="amut">Состав пока берётся из content.json; после переноса в базу его можно будет править здесь.</p>'}</div>`;}

function appsPage(){const c=`<div class="crumbs"><a href="#home">Главная</a> / Заявки в партию</div>`;
 if(rank()<1)return c+`<div class="pg"><h1>Нет доступа</h1><p>Раздел доступен только обладателям действующего ключа.</p></div>`;
 if(!apps){loadApps();return c+`<div class="pg"><h1>Заявки в партию</h1><p>Загрузка…</p></div>`;}
 const T=tier();return c+`<div class="pg"><h1>Заявки в партию</h1>${T<3?'<p class="amut">Принимать заявки могут ключи ступени 3 и выше.</p>':''}<p class="aerr" id="pmsg"></p>${apps.length?'':'<p>Заявок нет.</p>'}${apps.map(a=>{const x=a.answers||{};return `<div class="blk kapp"><div class="kp-h"><span>// ${esc(a.createdAt?.toDate?a.createdAt.toDate().toLocaleString('ru-RU'):'')} · ${esc(STATUS[a.status]||a.status)}</span><h2>${esc(x.fio)}</h2></div><table class="tbl">${AQ.map(([k,l])=>`<tr><td>${l}</td><td>${esc(x[k])}</td></tr>`).join('')}</table>
 ${T>=3?`<div class="kp-row"><button class="btn sm" data-aa="${a.id}">Принять</button> <button class="btn sm o kp-del" data-ar="${a.id}">Отклонить</button>${T>=4?` <span class="kp-in">в руководство: должность <input id="ar-${a.id}" value="Член партии"> уровень <input id="ak-${a.id}" type="number" min="0" max="${maxR()}" value="10"></span> <button class="btn sm" data-am="${a.id}">Принять и назначить в руководство</button>`:''}</div>`:''}
 ${['accepted','member'].includes(a.status)?`<div class="kp-row"><span class="kp-in">Звание в партии: <b>${esc(prn(a.partyRank||0))}</b></span>${T>=4?` <button class="btn sm o" data-pu="${a.id}" title="Повысить">▲ Повысить</button> <button class="btn sm o" data-pd="${a.id}" title="Понизить">▼ Понизить</button>`:''}</div>`:''}</div>`}).join('')}</div>`;}
async function loadApps(){try{const s=await F().getDocs(F().query(F().collection(db(),'applications'),F().orderBy('createdAt','desc')));apps=s.docs.map(d=>({...d.data(),id:d.id})).filter(a=>!window.VPPKA_HIDDEN({discordId:a.discordId,uid:a.uid})||a.uid===FB().user?.uid);}catch(e){apps=[];setTimeout(()=>msg('Ошибка загрузки: '+(e.code||e.message)),0)}if(location.hash==='#apps')window.route();}

// ---------- Участники партии (только ключи с canViewMembers и владельцы) ----------
let mlist=null;
const canM=()=>{const p=FB().power||{};return !!p.members||(p.rank||0)>=1000};
const dlink=x=>{const s=String(x||'');const id=s.match(/(\d{15,21})/);return id?`<a href="https://discord.com/users/${id[1]}" target="_blank" rel="noopener">${esc(/^https?:/.test(s)?s:'discord.com/users/'+id[1])}</a>`:esc(s)};
const fdt=t=>t&&t.toDate?t.toDate().toLocaleDateString('ru-RU'):(t||'—');
function membersPage(){const c=`<div class="crumbs"><a href="#home">Главная</a> / Участники партии</div>`;
 if(!canM())return c+`<div class="pg"><h1>Нет доступа</h1><p>Раздел доступен только по специальному разрешению ключа.</p></div>`;
 if(!mlist){loadMembers();return c+`<div class="pg"><h1>Участники партии</h1><p>Загрузка…</p></div>`;}
 const row=m=>`<tr><td>${m.photo?`<img class="phmini" src="${esc(m.photo)}" alt="">`:'<span class="phmini ph0"></span>'}</td><td><b>${esc(m.name||'—')}</b>${m.src?`<br><small>${esc(m.src)}</small>`:''}</td><td>${dlink(m.discord)}</td><td>${esc(m.status)}</td><td>${esc(m.date)}</td></tr>`;
 return c+`<div class="pg"><h1>Участники партии</h1><p class="amut">Закрытый список: зарегистрированные на сайте и принятые по заявкам. Всего: ${mlist.length}.</p><p class="aerr" id="pmsg"></p>
 <table class="tbl kmem"><tr><th></th><th>Имя</th><th>Discord</th><th>Статус / должность</th><th>Дата</th></tr>${mlist.map(row).join('')||'<tr><td colspan="5">Пока никого.</td></tr>'}</table></div>`;}
async function loadMembers(){const out=[],seen=new Set();let er='';
 try{const s=await F().getDocs(F().collection(db(),'users'));s.docs.forEach(d=>{const u={...d.data(),uid:d.id};if(window.VPPKA_HIDDEN(u)&&d.id!==FB().user?.uid)return;seen.add(u.discordId);out.push({name:u.displayName||u.discordId,discord:u.discordLink||u.discordId,photo:u.photo,status:u.rank?`${u.roleName} (ур. ${u.rank})`:'Зарегистрирован',date:fdt(u.createdAt),src:'аккаунт на сайте',t:u.createdAt?.toMillis?.()||0});});}catch(e){er='Аккаунты: '+(e.code==='permission-denied'?'нет доступа (правила базы не обновлены или нет разрешения).':(e.code||e.message));}
 try{const s=await F().getDocs(F().collection(db(),'applications'));s.docs.forEach(d=>{const a=d.data();if(!['accepted','member'].includes(a.status)||window.VPPKA_HIDDEN(a))return;const x=a.answers||{};const dup=a.discordId&&seen.has(a.discordId);
  const t=a.reviewedAt||a.createdAt;out.push({name:x.fio,discord:x.discord,status:STATUS[a.status]+' · '+prn(a.partyRank||0)+(dup?' · есть аккаунт':''),date:fdt(t),src:'заявка',t:t?.toMillis?.()||0});});}catch(e){er+=(er?' ':'')+'Заявки: '+(e.code||e.message);}
 mlist=out.sort((a,b)=>b.t-a.t);if(location.hash==='#members'){window.route();if(er)msg(er);}}

export function install(){const P=window.P,on=P.news,ol=P.leadership;installAssign();
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
   await f.updateDoc(f.doc(db(),'applications',aid),{partyRank:nr,partyRole:prn(nr),rankedBy:FB().user.uid,rankedAt:f.serverTimestamp()});a.partyRank=nr;a.partyRole=prn(nr);window.route();msg(`${(a.answers||{}).fio}: ${prn(nr)}.`);rosterSync().catch(e=>console.warn('roster',e.code||e));}
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
  await f.setDoc(f.doc(db(),'members',p.id),d);asgClose();await window.VPPKA_RELOAD();location.hash='#member/'+p.id;window.route();
  alert(`«${nm}» назначен(а): ${p.role}.`+(mt(p)?` Ступень ключа по должности: ${mt(p)} — выдайте/обновите ключ, если нужно.`:''))}
 catch(e){const el=document.getElementById('asg-e');if(el)el.textContent='Ошибка: '+(e.code==='permission-denied'?'недостаточно прав':(e.message||e.code))}}
function installAssign(){const P=window.P,om=P.member;
 P.member=(id,fr)=>{const h=om(id,fr),m=(D().members||[]).find(x=>x.id===id);return canAssign(m)?h.replace(/<\/div>$/,`<div class="asg-bar"><button class="btn" data-asgopen="${esc(id)}">Назначить</button><small class="amut">${m.discordId?'Сейчас: '+esc(m.name):'Должность вакантна'}</small></div></div>`):h};
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.asgopen)asgOpen(b.dataset.asgopen);else if(b.id==='asg-x')asgClose();else if(b.dataset.asg)asgDo(b.dataset.asg)});
 addEventListener('keydown',e=>{if(e.key==='Escape')asgClose()});}

// ---------- Публичный список членов партии: принятые заявки → members/p_<id> (group «Члены партии»), ступень 4+ ----------
let rsBusy=false;
async function rosterSync(){if(rsBusy||tier()<4)return;rsBusy=true;try{const f=F();const qs=await f.getDocs(f.collection(db(),'applications'));const cur=Object.fromEntries((D().members||[]).map(m=>[m.id,m]));
 for(const d of qs.docs){const a=d.data();if(!['accepted','member'].includes(a.status)||window.VPPKA_HIDDEN(a))continue;const id='p_'+d.id,o=cur[id]||{};
  const ts=a.reviewedAt||a.createdAt;const dt=ts&&ts.toDate?ts.toDate():null;
  const m={name:String((a.answers||{}).fio||'Товарищ').slice(0,100),role:String(a.partyRole||PR[a.partyRank||0]||'Кандидат').slice(0,120),group:'Члены партии',rank:0,
   joined:o.joined||(dt?dt.toLocaleDateString('ru-RU'):new Date().toLocaleDateString('ru-RU'))};
  if(a.discordId)m.discordId=String(a.discordId).slice(0,64);if(o.discordId&&!m.discordId)m.discordId=o.discordId;
  let ph=o.photo;if(a.uid){try{const u=await f.getDoc(f.doc(db(),'users',a.uid));if(u.exists()){const x=u.data();if(x.photo)ph=x.photo;if(!m.discordId&&x.discordId)m.discordId=x.discordId}}catch(e){}}
  if(ph)m.photo=ph;['bio','quote','city','birth','achievements','discord','forum','contact'].forEach(k=>{if(o[k])m[k]=o[k]});
  if(o.id&&['name','role','joined','photo','discordId'].every(k=>(o[k]||'')===(m[k]||''))&&o.group===m.group)continue;
  m.updatedBy=FB().user.uid;m.updatedAt=f.serverTimestamp();await f.setDoc(f.doc(db(),'members',id),m);}
 }finally{rsBusy=false}}
