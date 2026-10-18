// Мероприятия: чтение всем, правка — ступень 4+
const FB=()=>window.VPPKA_FB,F=()=>FB().F,db=()=>FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const can=()=>{const p=(FB()&&FB().power)||{};return (p.rank||0)>=1000||(p.tier||0)>=4};
const TZ='Europe/Volgograd';
const fmt=ms=>new Date(ms).toLocaleString('ru-RU',{timeZone:TZ,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',','');
const toLocal=ms=>new Date(ms+3*3600e3).toISOString().slice(0,16);
const fromLocal=v=>{const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);return m?Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5])-3*3600e3:NaN};
let EV=null,loading=null,editId=null;
async function load(force){if(EV&&!force)return EV;if(loading&&!force)return loading;
 const f=F();loading=f.getDocs(f.query(f.collection(db(),'events'),f.orderBy('at','desc'),f.limit(60))).then(s=>{EV=s.docs.map(d=>({id:d.id,...d.data()}));return EV}).catch(e=>{console.warn('events',e.code||e);EV=EV||[];return EV}).finally(()=>{loading=null});return loading}
const up=()=>{const n=Date.now()-3*3600e3;return (EV||[]).filter(e=>e.at>=n).sort((a,b)=>a.at-b.at)},past=()=>{const n=Date.now()-3*3600e3;return (EV||[]).filter(e=>e.at<n)};
const item=(e,adm)=>`<div class="ev-it" data-ev="${esc(e.id)}">${e.image?`<img class="ev-img" src="${esc(e.image)}" alt="" loading="lazy">`:''}<div class="ev-b"><div class="ev-d">${esc(fmt(e.at))} <small>UTC+3</small></div><h3>${esc(e.title)}</h3>${e.place?`<div class="ev-p">📍 ${esc(e.place)}</div>`:''}${e.desc?`<p>${esc(e.desc).replace(/\n/g,'<br>')}</p>`:''}${adm?`<div class="ev-adm"><button class="btn sm o" data-eved="${esc(e.id)}">Изменить</button> <button class="btn sm o ev-del" data-evdel="${esc(e.id)}">Удалить</button></div>`:''}</div></div>`;
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
${p.length?`<details class="blk ev-past"><summary>Прошедшие (${p.length})</summary><div class="ev-l">${p.map(e=>item(e,adm)).join('')}</div></details>`:''}`;
 return `<div class="crumbs"><a href="#home">Главная</a> / Мероприятия</div><div class="pg"><h1>Мероприятия</h1>${body}</div>`}
function side(){const u=up().slice(0,3);return `<div class="blk ev-side"><h2>Ближайшие мероприятия</h2>${EV===null?'<p class="ev-empty">Загрузка…</p>':u.length?`<ul class="ev-sl">${u.map(e=>`<li><a href="#events"><span class="ev-d">${esc(fmt(e.at))}</span><b>${esc(e.title)}</b>${e.place?`<small>📍 ${esc(e.place)}</small>`:''}</a></li>`).join('')}</ul>`:'<p class="ev-empty">Ближайших мероприятий пока нет.</p>'}<a class="btn o ev-all" href="#events">Все мероприятия</a></div>`}
const cur=()=>(location.hash.slice(1)||'home').split('/')[0];
const rr=()=>{const k=cur();if(k==='events'||k==='home'||!window.P[k])window.route()};
async function save(fd){const f=F(),at=fromLocal(fd.get('at')),title=String(fd.get('title')||'').trim();if(!title||!isFinite(at))throw new Error('Укажите название и дату');
 const d={title:title.slice(0,200),at:Math.round(at),updatedAt:Date.now()};for(const k of['place','desc','image']){const v=String(fd.get(k)||'').trim();if(v)d[k]=v.slice(0,k==='desc'?4000:k==='image'?2000:200)}
 if(d.image&&!/^https?:\/\//.test(d.image))throw new Error('Ссылка на изображение должна начинаться с http');
 if(editId){const old=EV.find(x=>x.id===editId)||{};if(old.createdBy)d.createdBy=old.createdBy;if(old.discordMessageId)d.discordMessageId=old.discordMessageId;await f.setDoc(f.doc(db(),'events',editId),d)}else{d.createdBy=FB().user.uid;await f.addDoc(f.collection(db(),'events'),d)}}
export function install(){window.VPPKA_EV_PAGE=page;window.VPPKA_EV_PREVIEW=a=>{EV=a;rr()};window.VPPKA_EV_SIDE=side;load().then(rr);
 let last=can();setInterval(()=>{const c=can();if(c!==last){last=c;if(cur()==='events')window.route()}},2000);
 document.addEventListener('click',async ev=>{const t=ev.target.closest('[data-evnew],[data-eved],[data-evdel],[data-evcancel]');if(!t||!can())return;ev.preventDefault();
  if(t.dataset.evnew!==undefined){editId='';window.route();return}
  if(t.dataset.evcancel!==undefined){editId=null;window.route();return}
  if(t.dataset.eved){editId=t.dataset.eved;window.route();return}
  if(t.dataset.evdel){if(!confirm('Удалить мероприятие?'))return;try{await F().deleteDoc(F().doc(db(),'events',t.dataset.evdel));await load(true);window.route()}catch(e){alert('Ошибка: '+(e.code||e.message))}}});
 document.addEventListener('submit',async ev=>{if(ev.target.id!=='evForm')return;ev.preventDefault();const er=ev.target.querySelector('.ev-err'),b=ev.target.querySelector('[type=submit]');b.disabled=true;
  try{await save(new FormData(ev.target));editId=null;await load(true);window.route()}catch(e){er.textContent=' '+(e.code==='permission-denied'?'Нет прав (нужна ступень 4+)':(e.message||e.code));b.disabled=false}});
}
