// Мероприятия: чтение всем, правка — ступень 4+
const FB=()=>window.VPPKA_FB,F=()=>FB().F,db=()=>FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const can=()=>{const p=(FB()&&FB().power)||{};return (p.rank||0)>=1000||!!p.owner||(p.tier||0)>=4};
const ended=e=>!!(e&&e.status==='ended');
// удаление — только через корзину eventsArchive; завершённое с отметками удаляет только владелец (остальным — «Скрыть»).
const isOwn=()=>{const p=(FB()&&FB().power)||{};return !!p.owner||(p.rank||0)>=1000};
const hasAtt=e=>!!(e&&Array.isArray(e.att)&&e.att.length);
const locked=e=>ended(e)&&hasAtt(e);
const canDel=e=>can()&&(isOwn()||!locked(e));
const vis=e=>!e.hidden||can();
const canEnd=e=>{const p=(FB()&&FB().power)||{};if(!e)return false;if((p.rank||0)>=1000||!!p.owner||(p.tier||0)>=4)return true;const u=FB()&&FB().user;return !!(e.createdBy&&u&&e.createdBy===u.uid)};
const TZ='Europe/Volgograd';
const fmt=ms=>new Date(ms).toLocaleString('ru-RU',{timeZone:TZ,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',','');
const toLocal=ms=>new Date(ms+3*3600e3).toISOString().slice(0,16);
const fromLocal=v=>{const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);return m?Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5])-3*3600e3:NaN};
let EV=null,loading=null,editId=null,markId=null;
const pastOrNow=e=>e.at<=Date.now()+3*3600e3;
const PL=()=>(window.VPPKA_PARTY?window.VPPKA_PARTY():[]);
const nrmN=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const ini=n=>String(n||'').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
function memAll(){const d=window.VPPKA_DATA&&window.VPPKA_DATA.members;if(d&&d.length)return d;const c=window.VPPKA_C&&window.VPPKA_C();return (c&&c.leadership&&c.leadership.members)||[]}
// Все места и карточки одного человека: Discord, uid, id документа или ФИО (ё→е).
function kin(m){const all=memAll(),did=String(m&&m.discordId||''),has=/^\d{15,21}$/.test(did),nm=nrmN(m&&m.name),out=[],seen=new Set();
 const push=x=>{if(!x)return;const id=x.id||'';if(id&&seen.has(id))return;if(id)seen.add(id);out.push(x)};push(m);
 for(const x of all){if(!x||!x.name||x.name==='Вакансия')continue;const xd=String(x.discordId||''),xh=/^\d{15,21}$/.test(xd);
  if(has&&xh){if(xd===did)push(x)}else if(nm&&nrmN(x.name)===nm)push(x)}return out}
function idents(m){const set=new Set(),add=v=>{v=String(v||'').trim();if(v)set.add(v)};
 for(const x of kin(m)){add(x.id);const d=String(x.discordId||'');if(/^\d{15,21}$/.test(d)){add(d);add('d'+d)}
  const raw=String(x.name||'').toLowerCase().replace(/\s+/g,' ').trim(),nn=nrmN(x.name);if(raw&&raw!=='вакансия'){add('n'+raw);if(nn)add('n'+nn)}
  const id=String(x.id||'');if(id.startsWith('p_')&&id.length>22){const uid=id.slice(2);add(uid);add('u'+uid)}
  if(x.uid){add(String(x.uid));add('u'+x.uid)}}return set}
function hitTok(set,tok){const t=String(tok||'').trim();if(!t)return false;if(set.has(t))return true;if(t.startsWith('id:')&&set.has(t.slice(3)))return true;if(t.includes('|'))return t.split('|').some(p=>p&&hitTok(set,p));return false}
function marked(m,att){const set=idents(m);return (att||[]).some(t=>hitTok(set,t))}
// Новая отметка: стабильный Discord или uid и нормализованное ФИО, плюс id всех карточек.
function attKey(m){const xs=kin(m);const did=xs.map(x=>String(x.discordId||'')).find(d=>/^\d{15,21}$/.test(d))||'';let uid='';
 for(const x of xs){if(x.uid){uid=String(x.uid);break}const id=String(x.id||'');if(id.startsWith('p_')&&id.length>22){uid=id.slice(2);break}}
 const name=nrmN((xs.find(x=>nrmN(x.name)&&x.name!=='Вакансия')||m||{}).name);const parts=[];
 if(did)parts.push('d'+did);else if(uid)parts.push('u'+uid);if(name)parts.push('n'+name);
 for(const x of xs)if(x.id)parts.push('id:'+x.id);return parts.join('|').slice(0,400)}
function joinMs(m){let best=null;for(const x of kin(m)){const jm=String(x.joined||'').match(/(\d{2})\.(\d{2})\.(\d{4})/);if(!jm)continue;const t=Date.UTC(+jm[3],+jm[2]-1,+jm[1])-3*3600e3;if(best===null||t<best)best=t}return best===null?0:best}
function people(){const seen=new Set(),out=[];for(const m of PL().slice().sort((a,b)=>(Number(b.rank)||0)-(Number(a.rank)||0))){const k=(attKey(m).split('|')[0])||m.id;if(!k||seen.has(k))continue;seen.add(k);out.push(m)}return out}
function attCount(a){a=a||[];const P=people(),used=new Set();let n=0;for(const m of P){if(!marked(m,a))continue;n++;const set=idents(m);for(const t of a)if(hitTok(set,t))used.add(t)}return n+new Set(a.filter(t=>t&&!used.has(t))).size}
function attLine(e,adm){const a=e.att||[];if(ended(e)){const n=attCount(a);return n?`<div class="at-ln">👥 Присутствовало: <b>${n}</b></div>`:''}if(markId===e.id&&adm){const P=people();return `<div class="at-mk" data-atev="${esc(e.id)}"><div class="at-mh"><span>Отмечено: <b class="at-cnt">${P.filter(m=>marked(m,a)).length}</b> из ${P.length}</span><button class="btn sm o" type="button" data-atall>Отметить всех</button></div><div class="mark">${P.map(m=>{const on=marked(m,a);return `<label class="${on?'on':''}"><input type="checkbox" value="${esc(attKey(m))}"${on?' checked':''}><span class="cmav${window.isLdr&&window.isLdr(m.name)?' g':''}">${m.photo?`<img ${PHA(m.photo,'t')} alt="${esc(m.name||'')}">`:esc(ini(m.name))}</span>${esc(m.name)}</label>`}).join('')}</div><button class="btn sm" type="button" data-atsave>Сохранить отметки</button> <button class="btn sm o" type="button" data-atcancel>Отмена</button><span class="ev-err"></span></div>`}
 return `<div class="at-ln">👥 Присутствовало: <b>${attCount(a)}</b>${adm?` <button class="btn sm o" data-atmark="${esc(e.id)}">Отметить посещаемость</button>`:''}</div>`}
function activity(m){const n=Date.now(),j0=joinMs(m);
 const past=(EV||[]).filter(e=>e.at<=n&&(e.at>=j0||marked(m,e.att))).sort((a,b)=>b.at-a.at),was=past.filter(e=>marked(m,e.att)),pc=past.length?Math.round(was.length*100/past.length):0;
 const lv=was.length>=10&&pc>=70?'Ветеран':was.length>=5&&pc>=50?'Активист':was.length>=2?'Участник':'Новичок';const fd=ms=>new Date(ms).toLocaleDateString('ru-RU',{timeZone:TZ,day:'2-digit',month:'2-digit'});
 return `<div class="blk act"><h2>Активность</h2><div class="act-top"><span>${esc(m.name)}</span><span class="badge">★ ${lv}</span></div><div class="at-grid"><div class="at-st"><b>${was.length}</b><span>посещено</span></div><div class="at-st"><b>${pc}%</b><span>явка</span></div><div class="at-st"><b>${past.length}</b><span>всего</span></div><div class="at-st"><b class="sm">${was[0]?fd(was[0].at):'—'}</b><span>последнее</span></div></div><div class="at-bar"><i style="width:${pc}%"></i></div>${past.length?`<div class="cm-h">Последние мероприятия</div><ul class="at-rl">${past.slice(0,5).map(e=>`<li><span>${esc(e.title)} · ${new Date(e.at).toLocaleDateString('ru-RU',{timeZone:TZ})}</span>${marked(m,e.att)?'<span class="y">✔ был</span>':'<span class="n">— не был</span>'}</li>`).join('')}</ul>`:'<p class="ev-empty">Прошедших мероприятий пока нет.</p>'}</div>`}
const isMem=()=>{const p=(FB()&&FB().power)||{},pr=((window.VPPKA_AUTH||{}).profile)||{};return (p.rank||0)>0||p.owner||!!(pr.discordId&&PL().some(m=>m.discordId===pr.discordId))};
let actPv=false,actBusy=false;
async function actFill(){const [k,id]=(location.hash.slice(1)||'').split('/');if(k!=='member'||!id)return;const app=document.getElementById('app'),prof=app&&app.querySelector('.prof');if(!prof||app.querySelector('.act'))return;if(!actPv&&!isMem())return;
 if(actBusy)return;actBusy=true;try{await load();const m=PL().find(x=>x.id===id)||((window.VPPKA_DATA&&window.VPPKA_DATA.members)||[]).find(x=>x.id===id);if(!m||app.querySelector('.act')||!app.contains(prof))return;const d=document.createElement('div');d.innerHTML=activity(m);prof.after(d.firstChild)}finally{actBusy=false}}
async function load(force){if(EV&&!force)return EV;if(loading&&!force)return loading;
 const f=F();loading=f.getDocs(f.query(f.collection(db(),'events'),f.orderBy('at','desc'),f.limit(60))).then(s=>{EV=s.docs.map(d=>({id:d.id,...d.data()}));return EV}).catch(e=>{console.warn('events',e.code||e);EV=EV||[];return EV}).finally(()=>{loading=null});return loading}
const up=()=>{const n=Date.now()-3*3600e3;return (EV||[]).filter(e=>vis(e)&&!ended(e)&&e.at>=n).sort((a,b)=>a.at-b.at)},past=()=>{const n=Date.now()-3*3600e3;return (EV||[]).filter(e=>vis(e)&&(ended(e)||e.at<n))};
const item=(e,adm)=>{const mine=canEnd(e),off=ended(e),acts=[];if(adm){acts.push(`<button class="btn sm o" data-eved="${esc(e.id)}">Изменить</button>`);acts.push(`<button class="btn sm o" data-evhide="${esc(e.id)}">${e.hidden?'Показать':'Скрыть'}</button>`);if(canDel(e))acts.push(`<button class="btn sm o ev-del" data-evdel="${esc(e.id)}">Удалить</button>`)}
 if(mine&&!off)acts.push(`<button type="button" class="btn sm o" data-evend="${esc(e.id)}">Завершить мероприятие</button>`);
 if(mine&&off&&(isOwn()||!hasAtt(e)))acts.push(`<button type="button" class="btn sm o" data-evresume="${esc(e.id)}">Возобновить</button>`);
 return `<div class="ev-it${off?' ended':''}" data-ev="${esc(e.id)}">${e.image?`<img class="ev-img" src="${esc(e.image)}" alt="${esc(e.title||'')}" loading="lazy">`:''}<div class="ev-b"><div class="ev-d">${esc(fmt(e.at))} <small>UTC+3</small></div><h3>${esc(e.title)}${off?' <span class="ev-end">Завершено</span>':''}${e.hidden?' <span class="ev-end ev-hid">Скрыто</span>':''}</h3>${e.place?`<div class="ev-p">📍 ${esc(e.place)}</div>`:''}${e.desc?`<p>${esc(e.desc).replace(/\n/g,'<br>')}</p>`:''}${off||pastOrNow(e)?attLine(e,adm&&!off):''}${acts.length?`<div class="ev-adm">${acts.join(' ')}</div>`:''}</div></div>`};
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
${p.length?`<details class="blk ev-past"${p.some(e=>e.id===markId)?' open':''}><summary>Прошедшие (${p.length})</summary><div class="ev-l">${p.map(e=>item(e,adm)).join('')}</div></details>`:''}${trash()}`;
 return `<div class="crumbs"><a href="#home">Главная</a> / Мероприятия</div><div class="pg"><h1>Мероприятия</h1>${window.VPPKA_SUBTABS?window.VPPKA_SUBTABS('events'):''}${body}</div>`}
function side(){const u=up().filter(e=>!e.hidden).slice(0,3);return `<div class="blk ev-side"><h2>Ближайшие мероприятия</h2>${EV===null?'<p class="ev-empty">Загрузка…</p>':u.length?`<ul class="ev-sl">${u.map(e=>`<li><a href="#events"><span class="ev-d">${esc(fmt(e.at))}</span><b>${esc(e.title)}</b>${e.place?`<small>📍 ${esc(e.place)}</small>`:''}</a></li>`).join('')}</ul>`:'<p class="ev-empty">Ближайших мероприятий пока нет.</p>'}</div>`}
const cur=()=>(location.hash.slice(1)||'home').split('/')[0];
const rr=()=>{const k=cur();if(k==='events'||k==='home'||!window.P[k])window.route()};
async function save(fd){const f=F(),at=fromLocal(fd.get('at')),title=String(fd.get('title')||'').trim();if(!title||!isFinite(at))throw new Error('Укажите название и дату');
 const d={title:title.slice(0,200),at:Math.round(at),updatedAt:Date.now()};for(const k of['place','desc','image']){const v=String(fd.get(k)||'').trim();if(v)d[k]=v.slice(0,k==='desc'?4000:k==='image'?2000:200)}
 if(d.image&&!/^https?:\/\//.test(d.image))throw new Error('Ссылка на изображение должна начинаться с http');
 if(editId){const old=EV.find(x=>x.id===editId)||{};if(old.createdBy)d.createdBy=old.createdBy;if(old.discordMessageId)d.discordMessageId=old.discordMessageId;if(old.att)d.att=old.att;if(old.hidden){d.hidden=true;if(old.hiddenBy)d.hiddenBy=old.hiddenBy;if(old.hiddenAt)d.hiddenAt=old.hiddenAt}if(old.status==='ended'){d.status='ended';if(old.endedBy)d.endedBy=old.endedBy;if(old.endedAt)d.endedAt=old.endedAt}await f.setDoc(f.doc(db(),'events',editId),d)}else{d.createdBy=FB().user.uid;await f.addDoc(f.collection(db(),'events'),d)}}
// Корзина: перед удалением точная копия документа уходит в eventsArchive/{id} (та же пачка — правила проверяют копию).
async function evDelete(id){const f=F(),d=db();try{const s=await f.getDoc(f.doc(d,'events',id));if(!s.exists()){alert('Мероприятие уже удалено.');return false}const e={id,...s.data()};
 if(!canDel(e)){alert('Завершённое мероприятие с отметками посещаемости может удалить только владелец сайта. Его можно скрыть — посещаемость в «Активности» сохранится.');return false}
 const n=(e.att||[]).length;const typed=prompt(`Удалить мероприятие «${e.title}»?\n\n`+(n?`Отметок посещаемости: ${n} — они пропадут из «Активности» участников.\n`:'')+`Мероприятие попадёт в корзину; вернуть его может владелец сайта.\n\nЧтобы подтвердить, введите название мероприятия:`,'');
 if(typed===null)return false;if(typed.trim().replace(/\s+/g,' ')!==String(e.title).trim().replace(/\s+/g,' ')){alert('Название не совпало — мероприятие не удалено.');return false}
 const b=f.writeBatch(d);b.set(f.doc(d,'eventsArchive',id),{ev:s.data(),by:FB().user.uid,at:f.serverTimestamp(),title:s.data().title});b.delete(f.doc(d,'events',id));await b.commit();ARC=null;return true}
 catch(err){alert('Ошибка: '+(err.code==='permission-denied'?'нет прав (или в корзине уже есть копия с этим id — владелец может её очистить).':(err.code||err.message)));return false}}
async function evHide(e){if(!e||!can())return;const f=F(),del=f.deleteField();try{await f.updateDoc(f.doc(db(),'events',e.id),e.hidden?{hidden:del,hiddenBy:del,hiddenAt:del}:{hidden:true,hiddenBy:FB().user.uid,hiddenAt:f.serverTimestamp()});await load(true);window.route()}
 catch(err){alert('Ошибка: '+(err.code==='permission-denied'?'нет прав (опубликуйте новые правила базы).':(err.code||err.message)))}}
let ARC=null,arcBusy=false;
async function arcLoad(){if(arcBusy||!isOwn())return;arcBusy=true;try{const f=F(),s=await f.getDocs(f.collection(db(),'eventsArchive'));ARC=s.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>((b.at&&b.at.toMillis&&b.at.toMillis())||0)-((a.at&&a.at.toMillis&&a.at.toMillis())||0));if(cur()==='events')window.route()}catch(e){ARC=[];console.warn('eventsArchive',e.code||e)}finally{arcBusy=false}}
function trash(){if(!isOwn())return '';if(ARC===null){arcLoad();return ''}if(!ARC.length)return '';const who=window.VPPKA_PUBMAP?window.VPPKA_PUBMAP():{};
 return `<details class="blk ev-past ev-trash"><summary>Корзина (${ARC.length})</summary><p class="ev-empty">Удалённые мероприятия. Видно только владельцу; «Восстановить» возвращает мероприятие вместе с посещаемостью.</p><div class="ev-l">${ARC.map(a=>{const e=a.ev||{};const t=a.at&&a.at.toDate?a.at.toDate():null;return `<div class="ev-it ended"><div class="ev-b"><div class="ev-d">${esc(fmt(e.at))} <small>UTC+3</small></div><h3>${esc(e.title||a.title)}</h3><div class="ev-p">Удалено${t?' '+esc(t.toLocaleString('ru-RU',{timeZone:TZ})):''}${who[a.by]&&who[a.by].n?' · '+esc(who[a.by].n):''} · отметок: ${(e.att||[]).length}</div><div class="ev-adm"><button type="button" class="btn sm" data-evrestore="${esc(a.id)}">Восстановить</button></div></div></div>`}).join('')}</div></details>`}
async function evRestore(id){if(!isOwn())return;const a=(ARC||[]).find(x=>x.id===id);if(!a||!a.ev)return;if(!confirm(`Восстановить «${a.ev.title||a.title}»?`))return;const f=F(),d=db();
 try{const ex=await f.getDoc(f.doc(d,'events',id));if(ex.exists()){alert('Мероприятие с этим id уже есть.');return}const b=f.writeBatch(d);b.set(f.doc(d,'events',id),a.ev);b.delete(f.doc(d,'eventsArchive',id));await b.commit();ARC=null;await load(true);window.route()}
 catch(err){alert('Ошибка: '+(err.code==='permission-denied'?'нет прав (опубликуйте новые правила базы).':(err.code||err.message)))}}
window.VPPKA_EV_DEL=evDelete;
export function install(){const ap=document.getElementById('app');let at_;new MutationObserver(()=>{clearTimeout(at_);at_=setTimeout(actFill,200)}).observe(ap,{childList:true});setInterval(actFill,3000);window.VPPKA_ACT_PREVIEW=a=>{EV=a;actPv=true;const o=document.querySelector('.act');if(o)o.remove();actFill()};
 document.addEventListener('change',ev=>{const w=ev.target.closest('.at-mk');if(!w||ev.target.type!=='checkbox')return;ev.target.closest('label').classList.toggle('on',ev.target.checked);w.querySelector('.at-cnt').textContent=w.querySelectorAll('input:checked').length});
 document.addEventListener('click',async ev=>{const t=ev.target.closest('[data-atmark],[data-atall],[data-atsave],[data-atcancel]');if(!t||!can())return;ev.preventDefault();const w=t.closest('.at-mk');
  if(t.dataset.atmark){const evn=(EV||[]).find(x=>x.id===t.dataset.atmark);if(ended(evn))return;markId=t.dataset.atmark;window.route();return}if(t.dataset.atcancel!==undefined){markId=null;window.route();return}
  if(t.dataset.atall!==undefined){const bs=[...w.querySelectorAll('input')],all=bs.every(b=>b.checked);bs.forEach(b=>{b.checked=!all;b.closest('label').classList.toggle('on',!all)});w.querySelector('.at-cnt').textContent=w.querySelectorAll('input:checked').length;return}
  if(t.dataset.atsave!==undefined){t.disabled=true;const att=[...new Set([...w.querySelectorAll('input:checked')].map(b=>b.value))].slice(0,150);try{await F().updateDoc(F().doc(db(),'events',w.dataset.atev),{att});markId=null;await load(true);window.route()}catch(e){t.disabled=false;w.querySelector('.ev-err').textContent=' '+(e.code==='permission-denied'?'Нет прав (ступень 4+)':(e.message||e.code))}}});
window.VPPKA_EV_PAGE=page;window.VPPKA_EV_PREVIEW=(a,mk)=>{EV=a;if(mk!==undefined)markId=mk;rr()};window.VPPKA_EV_SIDE=side;load().then(rr);
 let last=can();setInterval(()=>{const c=can();if(c!==last){last=c;if(cur()==='events')window.route()}},2000);
 document.addEventListener('click',ev=>{const t=ev.target.closest('[data-evrestore]');if(!t)return;ev.preventDefault();evRestore(t.dataset.evrestore)});
 document.addEventListener('click',async ev=>{const t=ev.target.closest('[data-evnew],[data-eved],[data-evdel],[data-evcancel],[data-evend],[data-evresume],[data-evhide]');if(!t)return;
  const eid=t.dataset.evend||t.dataset.evresume||t.dataset.eved||t.dataset.evdel||t.dataset.evhide,e=(EV||[]).find(x=>x.id===eid);
  if(t.dataset.evend||t.dataset.evresume){if(!canEnd(e))return;ev.preventDefault();const f=F();
   if(t.dataset.evend){if(ended(e)||!confirm(`Завершить мероприятие «${e.title}»?\n\nОно останется в списке и перейдёт в прошедшие. Отметки посещаемости закроются.`))return;
    try{await f.updateDoc(f.doc(db(),'events',e.id),{status:'ended',endedAt:f.serverTimestamp(),endedBy:FB().user.uid});if(markId===e.id)markId=null;await load(true);window.route()}catch(err){alert('Ошибка: '+(err.code==='permission-denied'?'нет прав (опубликуйте новые правила базы).':(err.code||err.message)))}}
   else{if(!ended(e)||!confirm(`Возобновить мероприятие «${e.title}»?`))return;const del=f.deleteField();
    try{await f.updateDoc(f.doc(db(),'events',e.id),{status:del,endedAt:del,endedBy:del});await load(true);window.route()}catch(err){alert('Ошибка: '+(err.code==='permission-denied'?'нет прав (опубликуйте новые правила базы).':(err.code||err.message)))}}
   return}
  if(!can())return;ev.preventDefault();
  if(t.dataset.evnew!==undefined){editId='';window.route();return}
  if(t.dataset.evcancel!==undefined){editId=null;window.route();return}
  if(t.dataset.eved){editId=t.dataset.eved;window.route();return}
  if(t.dataset.evdel){if(await evDelete(t.dataset.evdel)){await load(true);window.route()}return}
  if(t.dataset.evhide){await evHide(e)}});
 document.addEventListener('submit',async ev=>{if(ev.target.id!=='evForm')return;ev.preventDefault();const er=ev.target.querySelector('.ev-err'),b=ev.target.querySelector('[type=submit]');b.disabled=true;
  try{await save(new FormData(ev.target));editId=null;await load(true);window.route()}catch(e){er.textContent=' '+(e.code==='permission-denied'?'Нет прав (нужна ступень 4+)':(e.message||e.code));b.disabled=false}});
}
