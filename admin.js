// Раздел #admin. Только владелец сайта (config/owners → power.owner). admin.html — отдельная публикация на GitHub, её не заменяет.
const FB=()=>window.VPPKA_FB,F=()=>FB()&&FB().F,db=()=>FB()&&FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const superOn=()=>!!(window.VPPKA_SUPER&&window.VPPKA_SUPER())||!!((FB()&&FB().power)||{}).owner;
const SECTIONS=['site','home','about','program','charter','legal','contacts'];
const LISTS=[['news','Новости'],['events','Мероприятия'],['members','Состав'],['users','Пользователи'],['applications','Заявки'],['votes','Голосования'],['notifications','Уведомления'],['chats','Чаты']];
let tab='texts',edit=null,busy=false;
function page(title,body){return `<div class="crumbs"><a href="#home">Главная</a> / Администрирование</div><div class="pg"><h1>${esc(title)}</h1>${body}</div>`}
function plain(v){if(v&&typeof v.toDate==='function')return {_time:v.toDate().toISOString()};if(Array.isArray(v))return v.map(plain);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,plain(x)]));return v}
function revive(v,f){if(Array.isArray(v))return v.map(x=>revive(x,f));if(v&&typeof v==='object'){if(typeof v._time==='string'&&Object.keys(v).length===1)return f.Timestamp.fromDate(new Date(v._time));return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,revive(x,f)]))}return v}
function label(x){return x.title||x.name||x.role||(x.answers&&x.answers.fio)||x.displayName||x.fio||x.type||''}
function tabs(){const all=[['texts','Тексты'],...LISTS,['raw','Коллекция']];return `<div class="adm-tabs">${all.map(([id,t])=>`<button type="button" data-adtab="${id}" class="${tab===id?'on':''}">${esc(t)}</button>`).join('')}</div>`}
function texts(){return `${tabs()}<div class="blk"><p class="amut">Тексты страниц читаются из базы (content/…). Если документа нет — остаётся content.json. Руководство и новости здесь не сидируются: места живут в members, новости — в news.</p>
<p class="aerr" id="ad-msg"></p><button class="btn" id="ad-seed" type="button">Записать текущий content.json в базу</button>
${SECTIONS.map(id=>`<details class="blk" style="margin-top:12px"><summary>${esc(id)}</summary><textarea class="adm-json" id="ad-sec-${id}" spellcheck="false" placeholder="Загрузка…"></textarea><button class="btn sm" type="button" data-sec="${id}">Сохранить ${esc(id)}</button></details>`).join('')}</div>`}
function listView(){return `${tabs()}<div class="blk"><p class="amut">Правка документа как JSON. Удаление спрашивает подтверждение. Назначать на должности удобнее в «Руководстве».</p><p class="aerr" id="ad-msg"></p><div id="ad-list"><p class="amut">Загрузка…</p></div>
${edit?`<h3>Документ ${esc(edit.col)}/${esc(edit.id||'новый')}</h3><textarea class="adm-json" id="ad-json" spellcheck="false">${esc(edit.text)}</textarea><p><button class="btn sm" id="ad-save" type="button">Сохранить</button> <button class="btn sm o" id="ad-cancel" type="button">Закрыть</button></p>`:''}</div>`}
function rawView(){return `${tabs()}<div class="blk"><p class="amut">Любая коллекция и документ. config/owners с сайта не перезаписывайте: из него берётся право владельца.</p>
<label class="fl">Коллекция<input id="ad-col" maxlength="80" placeholder="members"></label>
<label class="fl">Идентификатор документа<input id="ad-id" maxlength="200" placeholder="m18"></label>
<textarea class="adm-json" id="ad-raw" spellcheck="false" placeholder="{ }"></textarea>
<p class="aerr" id="ad-msg"></p>
<p><button class="btn sm" id="ad-col-load" type="button">Прочитать</button> <button class="btn sm" id="ad-col-save" type="button">Сохранить</button> <button class="btn sm o" id="ad-col-del" type="button">Удалить</button></p></div>`}
function render(){const fb=FB();if(!fb||fb.user===undefined)return page('Администрирование','<p>Проверка доступа…</p>');if(!fb.user)return page('Нет доступа','<p>Войдите на сайт. Раздел откроется, если учётка есть в config/owners.</p>');if(!superOn())return page('Нет доступа','<p>Раздел только для владельца сайта.</p>');
 if(tab==='texts')return page('Администрирование',texts());if(tab==='raw')return page('Администрирование',rawView());return page('Администрирование',listView())}
async function fillTexts(){if(tab!=='texts'||!superOn())return;const f=F();for(const id of SECTIONS){const el=document.getElementById('ad-sec-'+id);if(!el||el.value)continue;try{const s=await f.getDoc(f.doc(db(),'content',id));el.value=JSON.stringify(s.exists()?plain(s.data()):{},null,2)}catch(e){el.value='';const m=document.getElementById('ad-msg');if(m)m.textContent='Не удалось прочитать content/'+id+': '+(e.code||e.message)}}}
async function fillList(){if(!LISTS.some(([id])=>id===tab)||!superOn())return;const host=document.getElementById('ad-list');if(!host)return;const f=F();
 try{const s=await f.getDocs(f.query(f.collection(db(),tab),f.limit(40)));const rows=s.docs.map(d=>{const x=plain(d.data());const t=label(x);return `<div class="adm-row"><span><b>${esc(t||d.id)}</b> <small>${esc(d.id)}</small></span><span><button class="btn sm" type="button" data-adedit="${esc(tab)}" data-adid="${esc(d.id)}">Изменить</button> <button class="btn sm o" type="button" data-addel="${esc(tab)}" data-adid="${esc(d.id)}">Удалить</button></span></div>`});
  host.innerHTML=rows.join('')||'<p class="amut">Пусто.</p>'}catch(e){host.innerHTML='';const m=document.getElementById('ad-msg');if(m)m.textContent=e.code==='permission-denied'?'Нет доступа: опубликуйте firestore.rules.':(e.code||e.message)}}
function say(t){const m=document.getElementById('ad-msg');if(m)m.textContent=t}
async function onClick(e){const b=e.target.closest('button');if(!b||!superOn())return;const f=F();
 if(b.dataset.adtab){tab=b.dataset.adtab;edit=null;window.route();setTimeout(()=>{fillTexts();fillList()},0);return}
 if(b.id==='ad-cancel'){edit=null;window.route();setTimeout(fillList,0);return}
 if(b.dataset.adedit){const s=await f.getDoc(f.doc(db(),b.dataset.adedit,b.dataset.adid));edit={col:b.dataset.adedit,id:b.dataset.adid,text:JSON.stringify(plain(s.exists()?s.data():{}),null,2)};window.route();setTimeout(fillList,0);return}
 if(b.dataset.addel){if(!confirm('Удалить '+b.dataset.addel+'/'+b.dataset.adid+'? Это нельзя отменить кнопкой «назад».'))return;try{await f.deleteDoc(f.doc(db(),b.dataset.addel,b.dataset.adid));say('Удалено.');fillList()}catch(err){say(err.code==='permission-denied'?'Нет прав. Опубликуйте firestore.rules.':(err.code||err.message))}return}
 if(b.dataset.sec){let obj;try{obj=JSON.parse(document.getElementById('ad-sec-'+b.dataset.sec).value)}catch(err){return say('JSON: '+err.message)}if(!obj||typeof obj!=='object'||Array.isArray(obj))return say('Нужен объект JSON.');
  try{await f.setDoc(f.doc(db(),'content',b.dataset.sec),revive(obj,f));if(window.VPPKA_APPLY_CONTENT){const part={};part[b.dataset.sec]=obj;window.VPPKA_APPLY_CONTENT(part)}say('Сохранено: '+b.dataset.sec+'.')}catch(err){say(err.code==='permission-denied'?'Нет прав. Опубликуйте firestore.rules.':(err.code||err.message))}return}
 if(b.id==='ad-seed'){if(!confirm('Записать в базу тексты из content.json (site, home, about, program, charter, legal, contacts)? Руководство и новости не затрагиваются.'))return;if(busy)return;busy=true;
  try{const c=await (await fetch('content.json?'+Date.now())).json();for(const id of SECTIONS){if(!c[id])continue;await f.setDoc(f.doc(db(),'content',id),c[id]);const el=document.getElementById('ad-sec-'+id);if(el)el.value=JSON.stringify(c[id],null,2)}
   window.VPPKA_APPLY_CONTENT&&window.VPPKA_APPLY_CONTENT(c);say('Тексты записаны в content/.')}catch(err){say(err.code==='permission-denied'?'Нет прав. Сначала опубликуйте firestore.rules.':(err.code||err.message))}finally{busy=false}return}
 if(b.id==='ad-save'&&edit){let obj;try{obj=JSON.parse(document.getElementById('ad-json').value)}catch(err){return say('JSON: '+err.message)}if(!obj||typeof obj!=='object'||Array.isArray(obj))return say('Нужен объект JSON.');
  try{await f.setDoc(f.doc(db(),edit.col,edit.id),revive(obj,f));say('Сохранено.');if(edit.col==='members'&&window.VPPKA_RELOAD)window.VPPKA_RELOAD()}catch(err){say(err.code==='permission-denied'?'Нет прав. Опубликуйте firestore.rules.':(err.code||err.message))}return}
 if(b.id==='ad-col-load'||b.id==='ad-col-save'||b.id==='ad-col-del'){const col=(document.getElementById('ad-col').value||'').trim(),id=(document.getElementById('ad-id').value||'').trim();if(!/^[A-Za-z0-9_-]{1,80}$/.test(col)||!id||id.length>200||/[\\/]/.test(id))return say('Укажите коллекцию латиницей и идентификатор документа без «/».');
  if((col==='config'&&id==='owners')&&b.id!=='ad-col-load')return say('config/owners с сайта не меняется: иначе можно потерять право владельца.');
  try{if(b.id==='ad-col-load'){const s=await f.getDoc(f.doc(db(),col,id));document.getElementById('ad-raw').value=JSON.stringify(plain(s.exists()?s.data():{}),null,2);say(s.exists()?'Прочитано.':'Документа нет. Пустой объект.')}
   else if(b.id==='ad-col-del'){if(!confirm('Удалить '+col+'/'+id+'?'))return;await f.deleteDoc(f.doc(db(),col,id));say('Удалено.')}
   else{let obj;try{obj=JSON.parse(document.getElementById('ad-raw').value||'{}')}catch(err){return say('JSON: '+err.message)}if(!obj||typeof obj!=='object'||Array.isArray(obj))return say('Нужен объект JSON.');await f.setDoc(f.doc(db(),col,id),revive(obj,f));say('Сохранено.')}}
  catch(err){say(err.code==='permission-denied'?'Нет прав. Опубликуйте firestore.rules.':(err.code||err.message))}}}
export function install(){const P=window.P;if(!P)return;P.admin=render;document.addEventListener('click',onClick);
 const kick=()=>{if((location.hash.slice(1)||'').split('/')[0]!=='admin')return;fillTexts();fillList()};
 kick();addEventListener('hashchange',()=>setTimeout(kick,0));if((location.hash.slice(1)||'').split('/')[0]==='admin'&&window.route)window.route()}
