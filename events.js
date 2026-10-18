// Мероприятия: чтение всем, правка — ступень 4+
const FB=()=>window.VPPKA_FB,F=()=>FB().F,db=()=>FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const can=()=>{const p=(FB()&&FB().power)||{};return (p.rank||0)>=1000||(p.tier||0)>=4};
const TZ='Europe/Volgograd';
const fmt=ms=>new Date(ms).toLocaleString('ru-RU',{timeZone:TZ,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',','');
const toLocal=ms=>new Date(ms+3*3600e3).toISOString().slice(0,16);
const fromLocal=v=>{const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);return m?Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5])-3*3600e3:NaN};
let EV=null,loading=null,editId=null,markId=null;
const pastOrNow=e=>e.at<=Date.now()+3*3600e3;
const AK=m=>window.VPPKA_AKEY(m),PL=()=>(window.VPPKA_PARTY?window.VPPKA_PARTY():[]);
const ini=n=>String(n||'').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
function attLine(e,adm){const a=e.att||[];if(markId===e.id&&adm){const P=PL(),set=new Set(a);return `<div class="at-mk" data-atev="${esc(e.id)}"><div class="at-mh"><span>Отмечено: <b class="at-cnt">${P.filter(m=>set.has(AK(m))).length}</b> из ${P.length}</span><button class="btn sm o" type="button" data-atall>Отметить всех</button></div><div class="mark">${P.map(m=>`<label class="${set.has(AK(m))?'on':''}"><input type="checkbox" value="${esc(AK(m))}"${set.has(AK(m))?' checked':''}><span class="cmav${window.isLdr&&window.isLdr(m.name)?' g':''}">${m.photo?`<img src="${esc(m.photo)}" alt="">`:esc(ini(m.name))}</span>${esc(m.name)}</label>`).join('')}</div><button class="btn sm" type="button" data-atsave>Сохранить отметки</button> <button class="btn sm o" type="button" data-atcancel>Отмена</button><span class="ev-err"></span></div>`}
 return `<div class="at-ln">👥 Присутствовало: <b>${a.length}</b>${adm?` <button class="btn sm o" data-atmark="${esc(e.id)}">Отметить посещаемость</button>`:''}</div>`}
function activity(m){const k=AK(m),n=Date.now();const jm=String(m.joined||'').match(/(\d{2})\.(\d{2})\.(\d{4})/),j0=jm?Date.UTC(+jm[3],jm[2]-1,+jm[1])-3*3600e3:0;
 const past=(EV||[]).filter(e=>e.at<=n&&e.at>=j0).sort((a,b)=>b.at-a.at),was=past.filter(e=>(e.att||[]).includes(k)),pc=past.length?Math.round(was.length*100/past.length):0;
 const lv=was.length>=10&&pc>=70?'Ветеран':was.length>=5&&pc>=50?'Активист':was.length>=2?'Участник':'Новичок';const fd=ms=>new Date(ms).toLocaleDateString('ru-RU',{timeZone:TZ,day:'2-digit',month:'2-digit'});
 return `<div class="blk act"><h2>Активность</h2><div class="act-top"><span>${esc(m.name)}</span><span class="badge">★ ${lv}</span></div><div class="at-grid"><div class="at-st"><b>${was.length}</b><span>посещено</span></div><div class="at-st"><b>${pc}%</b><span>явка</span></div><div class="at-st"><b>${past.length}</b><span>всего</span></div><div class="at-st"><b class="sm">${was[0]?fd(was[0].at):'—'}</b><span>последнее</span></div></div><div class="at-bar"><i style="width:${pc}%"></i></div>${past.length?`<div class="cm-h">Последние мероприятия</div><ul class="at-rl">${past.slice(0,5).map(e=>`<li><span>${esc(e.title)} · ${new Date(e.at).toLocaleDateString('ru-RU',{timeZone:TZ})}</span>${(e.att||[]).includes(k)?'<span class="y">✔ был</span>':'<span class="n">— не был</span>'}</li>`).join('')}</ul>`:'<p class="ev-empty">Прошедших мероприятий пока нет.</p>'}</div>`}
const isMem=()=>{const p=(FB()&&FB().power)||{},pr=((window.VPPKA_AUTH||{}).profile)||{};return (p.rank||0)>0||p.owner||!!(pr.discordId&&PL().some(m=>m.discordId===pr.discordId))};
let actPv=false,actBusy=false;
async function actFill(){const [k,id]=(location.hash.slice(1)||'').split('/');if(k!=='member'||!id)return;const app=document.getElementById('app'),prof=app&&app.querySelector('.prof');if(!prof||app.querySelector('.act'))return;if(!actPv&&!isMem())return;
 if(actBusy)return;actBusy=true;try{await load();const m=PL().find(x=>x.id===id)||((window.VPPKA_DATA&&window.VPPKA_DATA.members)||[]).find(x=>x.id===id);if(!m||app.querySelector('.act')||!app.contains(prof))return;const d=document.createElement('div');d.innerHTML=activity(m);prof.after(d.firstChild)}finally{actBusy=false}}
async function load(force){if(EV&&!force)return EV;if(loading&&!force)return loading;
 const f=F();loading=f.getDocs(f.query(f.collection(db(),'events'),f.orderBy('at','desc'),f.limit(60))).then(s=>{EV=s.docs.map(d=>({id:d.id,...d.data()}));return EV}).catch(e=>{console.warn('events',e.code||e);EV=EV||[];return EV}).finally(()=>{loading=null});return loading}
const up=()=>{const n=Date.now()-3*3600e3;return (EV||[]).filter(e=>e.at>=n).sort((a,b)=>a.at-b.at)},past=()=>{const n=Date.now()-3*3600e3;return (EV||[]).filter(e=>e.at<n)};
const item=(e,adm)=>`<div class="ev-it" data-ev="${esc(e.id)}">${e.image?`<img class="ev-img" src="${esc(e.image)}" alt="" loading="lazy">`:''}<div class="ev-b"><div class="ev-d">${esc(fmt(e.at))} <small>UTC+3</small></div><h3>${esc(e.title)}</h3>${e.place?`<div class="ev-p">📍 ${esc(e.place)}</div>`:''}${e.desc?`<p>${esc(e.desc).replace(/\n/g,'<br>')}</p>`:''}${pastOrNow(e)?attLine(e,adm):''}${adm?`<div class="ev-adm"><button class="btn sm o" data-eved="${esc(e.id)}">Изменить</button> <button class="btn sm o ev-del" data-evdel="${esc(e.id)}">Удалить</button></div>`:''}</div></div>`;
function form(e){e=e||{};return `<form class="blk ev-form" id="evForm"><h2>${e.id?'Изменить':'Новое'} мероприятие</h2>
<label>Название<input name="title" maxlength="200" required value="${esc(e.title)}"></label>
<label>Дата и время (UTC+3)<input name="at" type="datetime-local" required value="${e.at?toLocal(e.at):''}"></label>
<label>Место<input name="place" maxlength="200" value="${esc(e.place)}"></label>
<label>Описание<textarea name="desc" maxlength="4000" rows="4">${esc(e.desc)}</textarea></label>
<label>Ссылка на изображение (необязательно)<input name="image" maxlength="2000" value="${esc(e.image)}"></label>
<div class="ev-adm"><button class="btn sm" type="submit">Сохранить</button> <button class="btn sm o" type="button" data-evcancel>Отмена</button><span class="ev-err"></span></div></form>`}
function page(){const adm=can(),u=up(),p=past();
 const body=EV===null?'<p class="ev-empty">Загрузка…</p>':`${adm?(editId!==null?form(editId?EV.find(x=>x.id===editId):null):'<p><button class="btn sm" data-evnew>+ Добавить мероприятие</button></p>'):''}
<div class="blk"><h2>Ближайшие</h2>${u.length?`<div class="ev-l">${u.map(e=>item(e,adm)).join('')}</div>`:'<p class="ev-empty">Пока нет запланированных мероприятий.</p>'}</div>
${p.length?`<details class="blk ev-past"${p.some(e=>e.id===markId)?' open':''}><summary>Прошедшие (${p.length})</summary><div class="ev-l">${p.map(e=>item(e,adm)).join('')}</div></details>`:''}`;
 return `<div class="crumbs"><a href="#home">Главная</a> / Мероприятия</div><div class="pg"><h1>Мероприятия</h1>${window.VPPKA_SUBTABS?window.VPPKA_SUBTABS('events'):''}${body}</div>`}
function side(){const u=up().slice(0,3);return `<div class="blk ev-side"><h2>Ближайшие мероприятия</h2>${EV===null?'<p class="ev-empty">Загрузка…</p>':u.length?`<ul class="ev-sl">${u.map(e=>`<li><a href="#events"><span class="ev-d">${esc(fmt(e.at))}</span><b>${esc(e.title)}</b>${e.place?`<small>📍 ${esc(e.place)}</small>`:''}</a></li>`).join('')}</ul>`:'<p class="ev-empty">Ближайших мероприятий пока нет.</p>'}</div>`}
const cur=()=>(location.hash.slice(1)||'home').split('/')[0];
const rr=()=>{const k=cur();if(k==='events'||k==='home'||!window.P[k])window.route()};
async function save(fd){const f=F(),at=fromLocal(fd.get('at')),title=String(fd.get('title')||'').trim();if(!title||!isFinite(at))throw new Error('Укажите название и дату');
 const d={title:title.slice(0,200),at:Math.round(at),updatedAt:Date.now()};for(const k of['place','desc','image']){const v=String(fd.get(k)||'').trim();if(v)d[k]=v.slice(0,k==='desc'?4000:k==='image'?2000:200)}
 if(d.image&&!/^https?:\/\//.test(d.image))throw new Error('Ссылка на изображение должна начинаться с http');
 if(editId){const old=EV.find(x=>x.id===editId)||{};if(old.createdBy)d.createdBy=old.createdBy;if(old.discordMessageId)d.discordMessageId=old.discordMessageId;if(old.att)d.att=old.att;await f.setDoc(f.doc(db(),'events',editId),d)}else{d.createdBy=FB().user.uid;await f.addDoc(f.collection(db(),'events'),d)}}
export function install(){const ap=document.getElementById('app');let at_;new MutationObserver(()=>{clearTimeout(at_);at_=setTimeout(actFill,200)}).observe(ap,{childList:true});setInterval(actFill,3000);window.VPPKA_ACT_PREVIEW=a=>{EV=a;actPv=true;const o=document.querySelector('.act');if(o)o.remove();actFill()};
 document.addEventListener('change',ev=>{const w=ev.target.closest('.at-mk');if(!w||ev.target.type!=='checkbox')return;ev.target.closest('label').classList.toggle('on',ev.target.checked);w.querySelector('.at-cnt').textContent=w.querySelectorAll('input:checked').length});
 document.addEventListener('click',async ev=>{const t=ev.target.closest('[data-atmark],[data-atall],[data-atsave],[data-atcancel]');if(!t||!can())return;ev.preventDefault();const w=t.closest('.at-mk');
  if(t.dataset.atmark){markId=t.dataset.atmark;window.route();return}if(t.dataset.atcancel!==undefined){markId=null;window.route();return}
  if(t.dataset.atall!==undefined){const bs=[...w.querySelectorAll('input')],all=bs.every(b=>b.checked);bs.forEach(b=>{b.checked=!all;b.closest('label').classList.toggle('on',!all)});w.querySelector('.at-cnt').textContent=w.querySelectorAll('input:checked').length;return}
  if(t.dataset.atsave!==undefined){t.disabled=true;const att=[...w.querySelectorAll('input:checked')].map(b=>b.value).slice(0,150);try{await F().updateDoc(F().doc(db(),'events',w.dataset.atev),{att});markId=null;await load(true);window.route()}catch(e){t.disabled=false;w.querySelector('.ev-err').textContent=' '+(e.code==='permission-denied'?'Нет прав (ступень 4+)':(e.message||e.code))}}});
window.VPPKA_EV_PAGE=page;window.VPPKA_EV_PREVIEW=(a,mk)=>{EV=a;if(mk!==undefined)markId=mk;rr()};window.VPPKA_EV_SIDE=side;load().then(rr);
 let last=can();setInterval(()=>{const c=can();if(c!==last){last=c;if(cur()==='events')window.route()}},2000);
 document.addEventListener('click',async ev=>{const t=ev.target.closest('[data-evnew],[data-eved],[data-evdel],[data-evcancel]');if(!t||!can())return;ev.preventDefault();
  if(t.dataset.evnew!==undefined){editId='';window.route();return}
  if(t.dataset.evcancel!==undefined){editId=null;window.route();return}
  if(t.dataset.eved){editId=t.dataset.eved;window.route();return}
  if(t.dataset.evdel){if(!confirm('Удалить мероприятие?'))return;try{await F().deleteDoc(F().doc(db(),'events',t.dataset.evdel));await load(true);window.route()}catch(e){alert('Ошибка: '+(e.code||e.message))}}});
 document.addEventListener('submit',async ev=>{if(ev.target.id!=='evForm')return;ev.preventDefault();const er=ev.target.querySelector('.ev-err'),b=ev.target.querySelector('[type=submit]');b.disabled=true;
  try{await save(new FormData(ev.target));editId=null;await load(true);window.route()}catch(e){er.textContent=' '+(e.code==='permission-denied'?'Нет прав (нужна ступень 4+)':(e.message||e.code));b.disabled=false}});
}
