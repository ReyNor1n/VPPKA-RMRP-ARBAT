// Раздел #admin. Владелец сайта (config/owners → power.owner) видит всё.
// Администратор (действующий ключ, ступень 5+) видит сокращённую панель: только разделы, которые ему разрешают firestore.rules.
// Формы строятся по схемам admin-form.js; «Экспертный режим (JSON)» остаётся запасным путём.
import {CONTENT,COLS,HIST_N,blank,clone,errMap,fieldAt,fromLocal,hiddenNote,isContent,isProtected,kindOf,listTemplates,needsTechConfirm,newItem,newPartyId,nextSeatId,normalize,preview,renderForm,rowLabel,templateData,templateMeta,validate} from './admin-form.js?v=205';
const FB=()=>window.VPPKA_FB,F=()=>FB()&&FB().F,db=()=>FB()&&FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const superOn=()=>!!(window.VPPKA_SUPER&&window.VPPKA_SUPER())||!!((FB()&&FB().power)||{}).owner;
const onAdmin=()=>(location.hash.slice(1)||'').split('/')[0]==='admin';
const ALL_TABS=[...CONTENT,...COLS.map(([id,t])=>[id,t]),['raw','Коллекция']];
// Сокращённая панель (ступень 5+, не владелец). Права — по firestore.rules: правила остаются единственной защитой, здесь только интерфейс.
// add — создать, edit — сохранить правку, del — удалить; без edit документ открывается только для просмотра.
const LITE={
 news:{add:1,edit:1,del:1},
 events:{add:1,edit:1,del:1},
 members:{add:1,edit:1,del:1,hint:'Можно менять карточки со ступенью ниже вашей и уровнем ниже 100. Места m1, m4, m5 и m11 меняет только владелец.'},
 votes:{add:1,edit:1,del:1},
 notifications:{add:1,del:1,hint:'Новое уведомление: тип «Новость», «Созыв» или «Объявление». Готовые уведомления не редактируются, их можно удалить.'},
 applications:{del:1,hint:'Принять, отклонить или уволить — на странице «Заявки в партию». Удалить можно только новую, отклонённую или архивную заявку гостя без ключа.'},
 users:{del:1,hint:'Только просмотр. Удалить можно гостя без ключа доступа (не владельца).'}
};
const OWNER_CAPS={add:1,edit:1,del:1};
const pw=()=>(FB()&&FB().power)||{};
// Права зрителя сокращённой панели — зеркало firestore.rules (защищают только правила, здесь — что показывать).
// ra — распорядитель (сидит на m1, m4, m5 или m12): назначает/снимает на руководящих местах и меняет звания p_*.
// td — заместитель начальника техотдела (m12) без мест m1/m4/m5: не трогает своё место и места владельца.
const OWNER_DID='646280678736003073';
const myDidV=()=>String(((window.VPPKA_AUTH||{}).profile||{}).discordId||'');
const seatDidV=s=>String((((((window.VPPKA_DATA||{}).members)||[]).find(m=>m.id===s))||{}).discordId||'');
function viewer(){const did=myDidV(),on=s=>!!did&&seatDidV(s)===did,ra=['m1','m4','m5','m12'].some(on);
 return {tier:pw().tier|0,ra,chair:on('m1'),td:on('m12')&&!['m1','m4','m5'].some(on)}}
function liteCaps(tab){const c=LITE[tab];if(!c||tab!=='members')return c;const v=viewer();if(!v.ra&&v.tier<=5)return c;
 return {...c,hint:`Можно менять карточки со ступенью ниже ${v.tier} и уровнем ниже 100.`+(v.ra?' Вы назначаете и снимаете людей на руководящих местах и меняете звания членов партии (только из списка званий).':'')+(v.td?' Своё место m12 и места владельца (m11, m17) меняет только владелец.':'')+` Места m1${v.chair?'':', m4, m5'} и m11 меняет только владелец${v.chair?'':' или Председатель ЦК'}.`}}
// Можно ли сохранить/удалить конкретную карточку состава (как в правилах members: tierUpdOk, seatAssignOk, delete).
function memberCaps(id,d){d=d||{};if(superOn())return OWNER_CAPS;const v=viewer(),party=String(id).startsWith('p_')||d.group==='Члены партии';
 if(id==='m11'||d.role==='Начальник технического отдела'||(d.rank|0)>=100)return {};
 if(['m1','m4','m5'].includes(id)&&!v.chair)return {}; // места председателя и замов — только председатель/владелец (как в панели)
 const tierOk=(d.tier|0)<v.tier&&v.tier>=4;
 const raOk=v.ra&&!party&&(!['m4','m5'].includes(id)||v.chair)&&!(v.td&&(id==='m12'||String(d.discordId||'')===OWNER_DID));
 const vac=/^вакансия$/i.test(String(d.name||'').trim());
 const delOk=!['m1','m4','m5','m12'].includes(id)&&(party||vac)&&(tierOk||(v.ra&&!party));
 return {edit:tierOk||raOk?1:0,del:delOk?1:0}}
const liteOn=()=>!superOn()&&!!(FB()&&FB().user)&&(pw().tier|0)>=5&&(pw().rank|0)>0;
const canAdmin=()=>superOn()||liteOn();
const TABS_NOW=()=>superOn()?ALL_TABS:ALL_TABS.filter(([id])=>LITE[id]);
const caps=tab=>superOn()?OWNER_CAPS:(liteCaps(tab)||{});
const rowCaps=(col,id,d)=>{const c=caps(col);if(superOn()||col!=='members')return c;const m=memberCaps(id,d);return {...c,edit:c.edit&&m.edit,del:c.del&&m.del}};
function fixTab(){const t=TABS_NOW();if(!t.some(([id])=>id===state.tab)){state.tab=t[0][0];state.rows=null;state.edit=null}}
const AUTO_ID=new Set(['news','events','votes','notifications']);
const state={tab:'site',edit:null,rows:null,hist:[],tpls:{},q:'',msg:'',msgOk:false,dirty:false,expert:false,loading:false,busy:false,fieldErr:{},seq:0,previewOpen:null,booted:false};
function plain(v){if(v&&typeof v.toDate==='function')return {_time:v.toDate().toISOString()};if(Array.isArray(v))return v.map(plain);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,plain(x)]));return v}
function revive(v,f){if(Array.isArray(v))return v.map(x=>revive(x,f));if(v&&typeof v==='object'){if(typeof v._time==='string'&&Object.keys(v).length===1&&v._time)return f.Timestamp.fromDate(new Date(v._time));return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,revive(x,f)]))}return v}
function strip(v){if(Array.isArray(v))return v.map(strip);if(v&&typeof v==='object'){if(typeof v._time==='string')return v;const o={};for(const [k,x] of Object.entries(v))if(x!==undefined)o[k]=strip(x);return o}return v}
function errText(e){if(!e)return 'Ошибка';if(e.code==='permission-denied')return 'Нет прав. Опубликуйте firestore.rules.';return e.message||e.code||String(e)}
function say(t,ok){state.msg=t||'';state.msgOk=!!ok}
function page(title,body){return `<div class="crumbs"><a href="#home">Главная</a> / Администрирование</div><div class="pg"><h1>${esc(title)}</h1>${body}</div>`}
function tabs(){return `<div class="adm-tabs">${TABS_NOW().map(([id,t])=>`<button type="button" data-adtab="${id}" class="${state.tab===id?'on':''}">${esc(t)}</button>`).join('')}</div>`}
function msgLine(){return `<p class="${state.msgOk?'af-ok':'aerr'}" id="ad-msg">${esc(state.msg||'')}</p>`}
function siteNow(){try{return (window.VPPKA_C&&window.VPPKA_C()||{}).site||{}}catch(e){return {}}}
function editor(){
 const e=state.edit;if(!e)return '';
 const heavy=e.kind==='charter'||e.kind==='legal'||e.kind==='program';
 const open=state.previewOpen==null?!heavy:state.previewOpen;
 const note=e.kind==='seat'?`<p class="amut">Места <b>m1</b>, <b>m4</b>, <b>m5</b> и <b>m11</b> защищены. Порядок — число. Новая карточка члена партии создаётся с замком memClaim. После правки руководящего места обновляется список должностей.</p>`:'';
 const idBox=e.col==='content'?'':`<label class="af-field"><div class="af-l">Идентификатор документа</div><input id="ad-docid" maxlength="200" value="${esc(e.id||'')}"${e.isNew?'':' readonly'}><small class="amut">${AUTO_ID.has(e.col)&&e.isNew?'Можно оставить пустым — база выдаст идентификатор.':e.col==='members'?'Латиница, цифры, _ и -. Карточка члена партии начинается с p_.':''}</small></label>`;
 const body=state.expert?`<textarea id="ad-json" class="adm-json" spellcheck="false">${esc(JSON.stringify(e.data,null,2))}</textarea>`:renderForm(e.kind,e.data,{errors:state.fieldErr,customs:state.tpls});
 const hn=hiddenNote(e.kind);
 const tpls=listTemplates(e.kind,state.tpls);
 const lite=!superOn(),cp=e.isNew?caps(e.col):rowCaps(e.col,e.id,e.base),canSave=e.isNew?!!cp.add:!!cp.edit;
 const asTpl=e.col!=='content'&&!lite?`<button type="button" class="btn sm o" id="ad-as-tpl">Сохранить как шаблон</button>`:'';
 const ro=lite&&!canSave?`<p class="amut">Только просмотр: ${e.col==='members'&&caps('members').edit?'эту карточку вы не меняете (ступень, защищённое место или место владельца).':'изменить этот документ можно только владельцу.'}</p>`:'';
 return `<div class="af-top">${lite?'':`<label class="af-sw"><input type="checkbox" id="ad-expert"${state.expert?' checked':''}><span>Экспертный режим (JSON)</span></label>`}<span class="af-dirty" id="ad-dirty"${state.dirty&&canSave?'':' hidden'}>● есть несохранённые изменения</span></div>
 ${ro}${note}${idBox}${hn?`<p class="amut">${esc(hn)}</p>`:''}${body}
 <details class="adm-live" id="ad-live"${open?' open':''}><summary>Как это выглядит на сайте</summary><div id="ad-prev">${preview(e.kind,e.data,siteNow())}</div></details>
 ${lite?'':histHTML()}${tpls.length&&e.col!=='content'&&!lite?`<p class="amut">Свои шаблоны хранятся в config/adminTemplates и видны только владельцу.</p>`:''}
 <div class="af-bar">${canSave?`<button type="button" class="btn sm" id="ad-save">Сохранить</button> <button type="button" class="btn sm o" id="ad-cancel">Отменить</button>`:`<button type="button" class="btn sm o" id="ad-close">Закрыть</button>`} ${asTpl}</div>`;
}
function histHTML(){
 const hs=state.hist||[];if(!hs.length)return '<p class="amut">История изменений пока пуста. После сохранения здесь появятся последние версии.</p>';
 return `<details class="af-hist"><summary>История изменений (${hs.length})</summary>${hs.map((h,i)=>`<div class="adm-row"><span>${esc(new Date(h.at).toLocaleString('ru-RU'))}</span><button type="button" class="btn sm o" data-afact="revert" data-hi="${i}">Вернуть</button></div>`).join('')}</details>`;
}
function rowsHTML(){
 const q=state.q.trim().toLowerCase();
 const rows=(state.rows||[]).filter(r=>{if(!q)return true;return (rowLabel(r.data,r.id)+' '+r.id).toLowerCase().includes(q)});
 if(!rows.length)return '<p class="amut">Пусто.</p>';
 return rows.map(r=>{const cp=rowCaps(state.tab,r.id,r.data);return `<div class="adm-row"><span><b>${esc(rowLabel(r.data,r.id))}</b> <small>${esc(r.id)}</small></span><span><button type="button" class="btn sm" data-adedit="${esc(state.tab)}" data-adid="${esc(r.id)}">${cp.edit?'Изменить':'Открыть'}</button>${cp.del?` <button type="button" class="btn sm danger" data-addel="${esc(state.tab)}" data-adid="${esc(r.id)}">🗑 Удалить</button>`:''}</span></div>`}).join('');
}
function listHTML(){
 const kind=kindOf(state.tab),tpls=listTemplates(kind,state.tpls),cp=caps(state.tab),hint=!superOn()&&cp.hint?`<p class="amut">${esc(cp.hint)}</p>`:'',apps=!superOn()&&state.tab==='applications'?'<p><a class="btn sm o" href="#apps">Заявки в партию →</a></p>':'';
 const create=!cp.add?hint+apps:hint+`<div class="af-acts"><button type="button" class="btn sm" id="ad-add">➕ Добавить</button>${tpls.length?`<select id="ad-newtpl">${tpls.map(t=>`<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('')}</select><button type="button" class="btn sm o" id="ad-fromtpl">Создать по шаблону</button>`:''}</div>`;
 return `${create}<input id="ad-q" class="af-q" type="search" placeholder="Поиск" value="${esc(state.q)}">${(state.rows||[]).length>=120?'<p class="amut">Показаны первые 120 документов.</p>':''}<div id="ad-list">${state.loading?'<p class="amut">Загрузка…</p>':rowsHTML()}</div>${state.edit?`<h2>Правка</h2>${editor()}`:''}`;
}
function rawHTML(){const r=state.raw||{col:'',id:'',text:'{}'};return `<div class="blk"><p class="amut">Любая коллекция и документ. config/owners с сайта не перезаписывайте: из него берётся право владельца.</p>
<label class="fl">Коллекция<input id="ad-col" maxlength="80" value="${esc(r.col)}" placeholder="members"></label>
<label class="fl">Идентификатор документа<input id="ad-id" maxlength="200" value="${esc(r.id)}" placeholder="m18"></label>
<textarea class="adm-json" id="ad-raw" spellcheck="false">${esc(r.text||'')}</textarea>
<p><button class="btn sm" id="ad-col-load" type="button">Прочитать</button> <button class="btn sm" id="ad-col-save" type="button">Сохранить</button> <button class="btn sm danger" id="ad-col-del" type="button">🗑 Удалить</button></p></div>`;}
function textsHTML(){
 return `<p class="amut">Тексты читаются из базы (content/…). Если документа нет — в форму подставляется content.json. Состав и новости живут в своих вкладках.</p>
 <p><button class="btn sm o" id="ad-seed" type="button">Записать текущий content.json в базу</button></p>
 ${state.loading&&!state.edit?'<p class="amut">Загрузка…</p>':''}${state.edit?editor():''}`;
}
function render(){
 const fb=FB();if(!fb||fb.user===undefined)return page('Администрирование','<p>Проверка доступа…</p>');
 if(!fb.user)return page('Нет доступа','<p>Войдите на сайт. Раздел откроется владельцу сайта или администратору с ключом ступени 5 и выше.</p>');
 if(!canAdmin())return page('Нет доступа','<p>Раздел только для владельца сайта и администраторов (ключ ступени 5 и выше).</p>');
 fixTab();
 const lite=!superOn();
 const head=lite?`<p class="amut">Сокращённая панель: ${esc(pw().roleName||'администратор')}, ступень ${esc(pw().tier)}. Тексты страниц, ключи доступа, настройки сайта и Discord меняет только владелец.</p><style>.adm-lite [data-afact=savetpl],.adm-lite [data-afact=deltpl]{display:none}</style>`:'';
 const body=state.tab==='raw'?rawHTML():isContent(state.tab)?textsHTML():listHTML();
 return page('Администрирование',`${head}${tabs()}${msgLine()}<div class="blk af-wrap${lite?' adm-lite':''}">${body}</div>`);
}
function refresh(){if(!onAdmin())return;const y=scrollY,focus=document.activeElement,af=focus&&focus.dataset&&focus.dataset.af||'',sel=focus&&focus.selectionStart,id=focus&&focus.id;const app=document.getElementById('app');if(!app)return;app.innerHTML=render();scrollTo(0,y);
 if(af){const el=[...document.querySelectorAll('[data-af]')].find(x=>x.dataset.af===af);if(el){el.focus();if(sel!=null&&el.setSelectionRange)try{el.setSelectionRange(sel,sel)}catch(e){}}}
 else if(id){const el=document.getElementById(id);if(el)el.focus()}}
function touch(){if(!state.edit)return;state.dirty=!state.edit.base||JSON.stringify(state.edit.data)!==JSON.stringify(state.edit.base);const d=document.getElementById('ad-dirty');if(d)d.hidden=!state.dirty}
function setPath(obj,path,value){let cur=obj;for(let i=0;i<path.length-1;i++){const k=path[i],n=path[i+1];if(cur[k]==null||typeof cur[k]!=='object')cur[k]=typeof n==='number'?[]:{};cur=cur[k]}cur[path[path.length-1]]=value}
function readControl(el){const t=el.dataset.aft;if(t==='bool')return el.checked;if(t==='number')return el.value;if(t==='select')return el.dataset.num?(el.value===''?'':Number(el.value)):el.value;if(t==='datetime')return fromLocal(el.value);if(t==='time'){const ms=fromLocal(el.value);return Number.isFinite(ms)?{_time:new Date(ms).toISOString()}:{_time:''}}return el.value}
let prevT=0;
function schedulePreview(){clearTimeout(prevT);prevT=setTimeout(()=>{const el=document.getElementById('ad-prev');if(!el||!state.edit||state.expert)return;try{el.innerHTML=preview(state.edit.kind,state.edit.data,siteNow())}catch(e){el.textContent='Предпросмотр недоступен.'}},150)}
function fileToData(file){return new Promise((res,rej)=>{if(!/^image\//.test(file.type))return rej(new Error('Нужен файл изображения.'));const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1000/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,0,0,c.width,c.height);let q=.88,u=c.toDataURL('image/jpeg',q);while(u.length>850000&&q>.3){q-=.1;u=c.toDataURL('image/jpeg',q)}u.length>850000?rej(new Error('Изображение слишком большое')):res(u)};im.onerror=()=>rej(new Error('Не удалось открыть изображение.'));im.src=r.result};r.onerror=()=>rej(new Error('Не удалось прочитать файл.'));r.readAsDataURL(file)})}
let contentCache=null;
async function contentFile(){if(!contentCache)contentCache=await (await fetch('content.json?'+Date.now())).json();return contentCache}
async function loadSection(id){const f=F();let data=null;try{const s=await f.getDoc(f.doc(db(),'content',id));if(s.exists())data=plain(s.data())}catch(e){if(e.code==='permission-denied')throw e}
 const empty=!data||typeof data!=='object'||Array.isArray(data)||!Object.keys(data).length||(id==='leadership'&&!String(data.intro||'').trim());
 if(empty){const c=await contentFile();data=id==='leadership'?{intro:(c.leadership&&c.leadership.intro)||''}:(clone(c[id])||{})}
 if(id==='leadership')return {intro:String((data&&data.intro)||'')};return data}
function histKey(col,id){return (col+'__'+String(id)).replace(/[^A-Za-z0-9_-]/g,'_').slice(0,700)}
async function loadHist(col,id){try{const f=F();const s=await f.getDoc(f.doc(db(),'adminHist',histKey(col,id)));return s.exists()&&Array.isArray(s.data().items)?s.data().items:[]}catch(e){return []}}
async function pushHist(col,id,data){const f=F(),ref=f.doc(db(),'adminHist',histKey(col,id));const snap={at:Date.now(),by:(FB().user&&FB().user.uid)||'',data:clone(data)};if(JSON.stringify(snap).length>800000)return false;let items=[];try{const s=await f.getDoc(ref);if(s.exists()&&Array.isArray(s.data().items))items=s.data().items}catch(e){}items=items.concat([snap]);while(items.length>HIST_N)items.shift();while(items.length>1&&JSON.stringify(items).length>700000)items.shift();await f.setDoc(ref,{col,id:String(id),items});return true}
async function loadTpls(){try{const f=F();const s=await f.getDoc(f.doc(db(),'config','adminTemplates'));state.tpls=(s.exists()&&s.data().items)||{}}catch(e){state.tpls={}}}
async function openContent(id){const seq=++state.seq;state.loading=true;state.edit=null;refresh();try{const data=await loadSection(id);if(seq!==state.seq)return;state.edit={col:'content',id,isNew:false,kind:id,data,base:clone(data)};state.hist=await loadHist('content',id);state.dirty=false;state.fieldErr={};state.expert=false;state.loading=false}catch(e){state.loading=false;say(errText(e))}if(seq===state.seq)refresh()}
async function openList(col){const seq=++state.seq;state.loading=true;state.edit=null;refresh();try{const f=F();const s=await f.getDocs(f.query(f.collection(db(),col),f.limit(120)));if(seq!==state.seq)return;state.rows=s.docs.map(d=>({id:d.id,data:plain(d.data())}));state.loading=false}catch(e){state.loading=false;state.rows=[];say(errText(e))}if(seq===state.seq)refresh()}
async function openDoc(col,id){const f=F();const s=await f.getDoc(f.doc(db(),col,id));const data=plain(s.exists()?s.data():{});const kind=kindOf(col);state.edit={col,id,isNew:false,kind,data,base:clone(data)};state.hist=await loadHist(col,id);state.dirty=false;state.fieldErr={};state.expert=false;state.msg='';refresh()}
function newDoc(tplId){const col=state.tab,kind=kindOf(col);const meta=tplId?templateMeta(kind,tplId):null;const data=tplId?templateData(kind,tplId,state.tpls):blank(kind);if(!data)return say('Шаблон не найден.');let id='';const party=!!(meta&&meta.party)||data.group==='Члены партии';if(col==='members')id=party?newPartyId():nextSeatId((state.rows||[]).map(r=>r.id));state.edit={col,id,isNew:true,kind,data,base:null,party};state.hist=[];state.dirty=true;state.fieldErr={};state.expert=false;state.msg='';refresh()}
function claimKey(name){const s=String(name||'').trim().replace(/\s+/g,' ');if(!s||s.length>100||/[\\/]/.test(s)||s==='.'||s==='..')return '';return s}
function ldrDoc(id,data){return !!data&&data.group!=='Члены партии'&&!String(id||'').startsWith('p_')}
function ldrDids(list){const s=[],seen=new Set();for(const m of list||[]){if(!ldrDoc(m.id,m)||!m.name||/^Вакансия/i.test(m.name))continue;const d=String(m.discordId||'');if(!/^\d{15,21}$/.test(d)||seen.has(d))continue;seen.add(d);s.push(d)}return s}
function withMember(id,data,removed){const base=[...(((window.VPPKA_DATA||{}).members)||[])];if(!base.length)return null;const i=base.findIndex(m=>m.id===id);if(removed){if(i>=0)base.splice(i,1);return base}const row={...(i>=0?base[i]:{}),...(data||{}),id};if(i>=0)base[i]=row;else base.push(row);return base}
function seatList(id,data,removed){const live=withMember(id,data,removed);if(live)return live;if(!state.rows||!state.rows.length)return null;const base=state.rows.map(r=>({...r.data,id:r.id}));if(removed)return base.filter(m=>m.id!==id);const i=base.findIndex(m=>m.id===id);const row={...(i>=0?base[i]:{}),...(data||{}),id};if(i>=0)base[i]=row;else base.push(row);return base}
async function syncSeats(list){if(!list)return;const f=F();if(window.VPPKA_SYNC_SEATS){await window.VPPKA_SYNC_SEATS(list);return}await f.setDoc(f.doc(db(),'config','ldrSeats'),{dids:ldrDids(list)},{merge:true})}
async function putMember(f,id,data){const ref=f.doc(db(),'members',id);const prev=await f.getDoc(ref);const was=prev.exists()?prev.data():null;const party=x=>!!x&&(x.group==='Члены партии'||String(id).startsWith('p_'));
 if(!prev.exists()&&(data.group==='Члены партии'||String(id).startsWith('p_'))){const key=claimKey(data.name);if(!key||data.group!=='Члены партии'||!String(id).startsWith('p_'))throw new Error('Карточка члена партии: идентификатор p_…, группа «Члены партии» и ФИО без «/».');
  const body={...data,name:key};const b=f.writeBatch(db());b.set(ref,body);b.set(f.doc(db(),'memClaim',key),{name:key,memberId:id,by:FB().user.uid});await b.commit()}
 else if(was&&party(was)||party(data)){const oldKey=claimKey(was&&was.name),leaving=data.group!=='Члены партии',newKey=leaving?'':claimKey(data.name);let moved=false;
  if(oldKey&&(leaving||(newKey&&oldKey!==newKey))){const cref=f.doc(db(),'memClaim',oldKey);const c=await f.getDoc(cref);
   if(c.exists()&&c.data()&&c.data().memberId===id){if(!leaving&&!newKey)throw new Error('Некорректное имя');const body=!leaving&&newKey?{...data,name:newKey}:data;const b=f.writeBatch(db());b.set(ref,body);b.delete(cref);if(newKey)b.set(f.doc(db(),'memClaim',newKey),{name:newKey,memberId:id,by:FB().user.uid});await b.commit();moved=true}}
  if(!moved)await f.setDoc(ref,data)}
 else await f.setDoc(ref,data);
 return ldrDoc(id,data)||ldrDoc(id,was)}
async function removeMember(f,id){const ref=f.doc(db(),'members',id);const prev=await f.getDoc(ref);const was=prev.exists()?prev.data():null;
 if(was&&(String(id).startsWith('p_')||was.group==='Члены партии')){const key=claimKey(was.name);const b=f.writeBatch(db());b.delete(ref);if(key){const c=await f.getDoc(f.doc(db(),'memClaim',key));if(c.exists()&&c.data()&&c.data().memberId===id)b.delete(c.ref)}await b.commit();if(window.VPPKA_ARCHIVE_APPS)await window.VPPKA_ARCHIVE_APPS({...was,id})}
 else await f.deleteDoc(ref);return ldrDoc(id,was)}
function guardDelete(col,id,data){
 if(col==='members'&&isProtected(id)){const why=id==='m11'?'начальник технического отдела':id==='m1'?'председатель ЦК':'заместитель председателя ЦК';return confirm('Место '+id+' защищено ('+why+'). Удалить его может только владелец. Удалить?')}
 if(col==='members'&&data&&data.role==='Начальник технического отдела')return confirm('Это должность начальника технического отдела. Удалить?');
 return confirm('Удалить '+col+'/'+id+'?');
}
async function save(){
 const e=state.edit;if(!e||state.busy)return;
 const lite=!superOn();if(lite){const cp=e.isNew?caps(e.col):rowCaps(e.col,e.id,e.base);if(e.col==='content'||!(e.isNew?cp.add:cp.edit)){say('Нет прав на это действие.');refresh();return}}
 if(state.expert&&!lite){let obj;try{obj=JSON.parse(document.getElementById('ad-json').value)}catch(err){say('JSON: '+err.message);refresh();return}if(!obj||typeof obj!=='object'||Array.isArray(obj)){say('Нужен объект JSON.');refresh();return}e.data=obj}
 let id=e.col==='content'?e.id:(document.getElementById('ad-docid')?document.getElementById('ad-docid').value.trim():e.id);
 if(e.col!=='content'&&id&&!/^[A-Za-z0-9_-]{1,200}$/.test(id)){say('Идентификатор: латиница, цифры, _ и -, без «/».');refresh();return}
 const body=normalize(e.kind,e.data);
 const errs=validate(e.kind,body,{id,isNew:e.isNew});
 if(errs.length){state.fieldErr=errMap(errs);state.expert=false;say(errs[0].msg);refresh();return}
 if(needsTechConfirm(body,id)&&!confirm('Место m11 закреплено за начальником технического отдела. Сменить должность?'))return;
 if(e.col==='members'&&e.isNew&&isProtected(id)&&!confirm('Идентификатор '+id+' — защищённое место. Перезаписать документ?'))return;
 state.busy=true;say('Сохранение…');refresh();
 try{const f=F();
  let note='';
  if(e.base&&!lite){const ok=await pushHist(e.col,id||e.id,e.base);if(!ok)note+=' Снимок истории не записан: документ слишком большой.'}
  if(e.col==='content'){
   if(e.kind==='leadership'){await f.setDoc(f.doc(db(),'content','leadership'),{intro:body.intro},{merge:true});window.VPPKA_APPLY_CONTENT&&window.VPPKA_APPLY_CONTENT({leadership:{intro:body.intro}})}
   else{await f.setDoc(f.doc(db(),'content',e.id),revive(strip(body),f));const part={};part[e.id]=body;window.VPPKA_APPLY_CONTENT&&window.VPPKA_APPLY_CONTENT(part)}
  }else if(e.col==='members'){
   if(!id)throw new Error('Укажите идентификатор документа.');
   const payload={...body,updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()};
   const ldr=await putMember(f,id,payload);
   if(ldr){const list=seatList(id,body,false);if(!list)note+=' Список должностей не обновлён: состав ещё не загружен.';else if(lite){try{await syncSeats(list)}catch(err){note+=' Список должностей обновит Председатель ЦК, его заместитель или владелец.'}}else await syncSeats(list)}
   if(window.VPPKA_RELOAD)window.VPPKA_RELOAD();
  }else{
   const rev=revive(strip(body),f);
   if(e.col==='events'){if(rev.status==='ended'){if(!e.base||e.base.status!=='ended'){rev.endedAt=f.serverTimestamp();rev.endedBy=FB().user.uid}else{if(e.base.endedAt)rev.endedAt=revive(e.base.endedAt,f);if(e.base.endedBy)rev.endedBy=e.base.endedBy}}rev.updatedAt=Date.now();if(e.isNew)rev.createdBy=FB().user.uid}
   if(e.col==='news'&&e.isNew&&!rev.author)rev.author=FB().user.uid;
   if(e.col==='votes'&&e.isNew){rev.createdBy=FB().user.uid;if(rev.createdAt==null)rev.createdAt=Date.now()}
   if(e.col==='notifications'&&e.isNew&&lite){rev.author=FB().user.uid;rev.createdAt=f.serverTimestamp();for(const k of ['to','seat','when','authorName'])if(rev[k]===''||rev[k]==null)delete rev[k];if(pw().roleName&&!rev.authorName)rev.authorName=String(pw().roleName).slice(0,120)}
   if(e.isNew&&!id){if(!AUTO_ID.has(e.col))throw new Error('Укажите идентификатор документа.');const ref=await f.addDoc(f.collection(db(),e.col),rev);id=ref.id}
   else{if(!id)throw new Error('Укажите идентификатор документа.');await f.setDoc(f.doc(db(),e.col,id),rev)}
   if(e.col==='news'&&window.VPPKA_RELOAD)window.VPPKA_RELOAD();
  }
  e.id=id;e.isNew=false;e.data=clone(body);e.base=clone(body);state.dirty=false;state.fieldErr={};state.hist=await loadHist(e.col,id);
  if(e.col!=='content'){const i=(state.rows||[]).findIndex(r=>r.id===id);const row={id,data:clone(body)};if(i>=0)state.rows[i]=row;else if(state.rows)state.rows.unshift(row)}
  say('Сохранено.'+note,true);
 }catch(err){say(errText(err))}finally{state.busy=false;refresh()}
}
async function delDoc(col,id){
 const row=(state.rows||[]).find(r=>r.id===id);const data=row?row.data:(state.edit&&state.edit.id===id?state.edit.data:null);
 if(!superOn()&&!rowCaps(col,id,data).del){say('Нет прав на удаление.');refresh();return}
 if(!guardDelete(col,id,data))return;const f=F();
 try{if(data&&superOn())await pushHist(col,id,data);let ldr=false;if(col==='members'){ldr=await removeMember(f,id);if(ldr){const list=seatList(id,null,true);if(list){if(superOn())await syncSeats(list);else try{await syncSeats(list)}catch(err){}}}}else await f.deleteDoc(f.doc(db(),col,id));
  if(state.rows)state.rows=state.rows.filter(r=>r.id!==id);if(state.edit&&state.edit.id===id){state.edit=null;state.dirty=false}say('Удалено.',true);if((col==='members'||col==='news')&&window.VPPKA_RELOAD)window.VPPKA_RELOAD()}
 catch(err){say(errText(err))}refresh()}
function parentOf(path){const idx=path[path.length-1];let cur=state.edit.data;for(let i=0;i<path.length-1;i++){cur=cur==null?null:cur[path[i]]}return {arr:cur,idx}}
function mutateList(path,fn){const {arr,idx}=parentOf(path);if(!Array.isArray(arr))return;fn(arr,idx);touch();refresh()}
async function onTplSave(kind,data){const title=prompt('Название шаблона','Мой шаблон');if(!title)return;const id='c'+Date.now().toString(36);const item={kind,title:String(title).slice(0,80),data:clone(data),at:Date.now()};
 try{const f=F(),ref=f.doc(db(),'config','adminTemplates');const s=await f.getDoc(ref);const items=(s.exists()&&s.data().items)||{};items[id]=item;await f.setDoc(ref,{items,updatedAt:Date.now()});state.tpls=items;say('Шаблон сохранён.',true)}catch(err){say(errText(err))}refresh()}
async function onTplDel(kind,sel){const id=sel&&sel.value;const cur=id&&state.tpls[id];if(!cur||cur.kind!==kind){say('Выберите свой шаблон. Встроенный удалить нельзя.');refresh();return}if(!confirm('Удалить шаблон «'+(cur.title||'')+'»?'))return;
 try{const f=F(),ref=f.doc(db(),'config','adminTemplates');const s=await f.getDoc(ref);const items=(s.exists()&&s.data().items)||{};delete items[id];await f.setDoc(ref,{items,updatedAt:Date.now()});state.tpls=items;say('Шаблон удалён.',true)}catch(err){say(errText(err))}refresh()}
function leave(next){if(state.dirty&&!confirm('Есть несохранённые изменения. Уйти без сохранения?'))return false;state.dirty=false;state.edit=null;state.fieldErr={};state.msg='';return true}
async function onClick(e){
 const a=e.target.closest&&e.target.closest('#ad-prev a, #ad-live a');if(a){e.preventDefault()}
 const b=e.target.closest&&e.target.closest('button');if(!b||!onAdmin()||!canAdmin())return;
 const owner=superOn();
 if(b.id==='ad-close'){state.edit=null;state.dirty=false;state.msg='';refresh();return}
 if(b.dataset.adtab){if(!TABS_NOW().some(([id])=>id===b.dataset.adtab))return;if(!leave())return;state.tab=b.dataset.adtab;state.rows=null;state.q='';refresh();if(isContent(state.tab))openContent(state.tab);else if(state.tab!=='raw')openList(state.tab);return}
 if(b.id==='ad-save'){save();return}
 if(b.id==='ad-cancel'){if(!state.edit)return;if(state.edit.isNew||!state.edit.base){state.edit=null;state.dirty=false;state.msg='Изменения отменены.';refresh();return}state.edit.data=clone(state.edit.base);state.dirty=false;state.fieldErr={};state.expert=false;say('Изменения отменены.');refresh();return}
 if((b.id==='ad-add'||b.id==='ad-fromtpl')&&!caps(state.tab).add)return;
 if(b.id==='ad-add'||b.id==='ad-fromtpl'){if(state.dirty&&!confirm('Есть несохранённые изменения. Уйти без сохранения?'))return;if(b.id==='ad-add')newDoc('');else{const sel=document.getElementById('ad-newtpl');newDoc(sel&&sel.value)}return}
 if(b.id==='ad-as-tpl'&&state.edit&&owner){onTplSave(state.edit.kind,state.edit.data);return}
 if(b.dataset.adedit){if(state.dirty&&state.edit&&state.edit.id!==b.dataset.adid&&!confirm('Есть несохранённые изменения. Уйти без сохранения?'))return;openDoc(b.dataset.adedit,b.dataset.adid);return}
 if(b.dataset.addel&&caps(b.dataset.addel).del){delDoc(b.dataset.addel,b.dataset.adid);return}
 if(b.dataset.afact){const act=b.dataset.afact;if(act==='revert'){const h=state.hist[+b.dataset.hi];if(!h||!state.edit)return;if(state.dirty&&!confirm('Есть несохранённые правки. Они пропадут. Вернуть выбранную версию?'))return;if(!confirm('Вернуть версию от '+new Date(h.at).toLocaleString('ru-RU')+' на сайт?'))return;state.expert=false;state.edit.data=clone(h.data);save();return}
  if(!state.edit)return;let path=[];try{path=JSON.parse(b.dataset.path||'[]')}catch(err){return}
  if(act==='add'){const field=fieldAt(state.edit.kind,state.edit.data,path);let cur=state.edit.data;for(const k of path){if(cur[k]==null)cur[k]=[];cur=cur[k]}if(!Array.isArray(cur))return;cur.push(newItem(field));touch();refresh();return}
  if(act==='del'){if(!confirm('Удалить этот элемент?'))return;mutateList(path,(arr,idx)=>arr.splice(idx,1));return}
  if(act==='dup'){mutateList(path,(arr,idx)=>arr.splice(idx+1,0,clone(arr[idx])));return}
  if(act==='up'){mutateList(path,(arr,idx)=>{if(idx<=0)return;const t=arr[idx-1];arr[idx-1]=arr[idx];arr[idx]=t});return}
  if(act==='down'){mutateList(path,(arr,idx)=>{if(idx>=arr.length-1)return;const t=arr[idx+1];arr[idx+1]=arr[idx];arr[idx]=t});return}
  if(act==='fromtpl'){const sel=b.parentElement.querySelector('select[data-tplsel]');const data=templateData(b.dataset.kind,sel&&sel.value,state.tpls);if(!data){say('Шаблон не найден.');refresh();return}let cur=state.edit.data;for(const k of path){if(cur[k]==null)cur[k]=[];cur=cur[k]}if(!Array.isArray(cur))return;cur.push(data);touch();refresh();return}
  if((act==='savetpl'||act==='deltpl')&&!owner)return;
  if(act==='savetpl'){const {arr,idx}=parentOf(path);if(!arr)return;onTplSave(b.dataset.kind,arr[idx]);return}
  if(act==='deltpl'){onTplDel(b.dataset.kind,b.parentElement.querySelector('select[data-tplsel]'));return}
 }
 if((b.id==='ad-seed'||b.id==='ad-col-load'||b.id==='ad-col-save'||b.id==='ad-col-del')&&!owner)return;
 if(b.id==='ad-seed'){if(!confirm('Записать в базу тексты из content.json (сайт, главная, о партии, программа, устав, право, контакты и вступление руководства)? Состав и новости не затрагиваются.'))return;if(state.busy)return;state.busy=true;
  try{const f=F(),c=await contentFile();contentCache=null;const ids=CONTENT.map(x=>x[0]);for(const id of ids){if(id==='leadership'){await f.setDoc(f.doc(db(),'content','leadership'),{intro:(c.leadership&&c.leadership.intro)||''},{merge:true});continue}if(!c[id])continue;await f.setDoc(f.doc(db(),'content',id),c[id])}
   window.VPPKA_APPLY_CONTENT&&window.VPPKA_APPLY_CONTENT(c);say('Тексты записаны в content/.',true);state.edit=null;openContent(isContent(state.tab)?state.tab:'site')}catch(err){say(errText(err));refresh()}finally{state.busy=false}return}
 if(b.id==='ad-col-load'||b.id==='ad-col-save'||b.id==='ad-col-del'){const col=(document.getElementById('ad-col').value||'').trim(),id=(document.getElementById('ad-id').value||'').trim();state.raw={col,id,text:document.getElementById('ad-raw').value};if(!/^[A-Za-z0-9_-]{1,80}$/.test(col)||!id||id.length>200||/[\\/]/.test(id)){say('Укажите коллекцию латиницей и идентификатор документа без «/».');refresh();return}
  if(col==='config'&&id==='owners'&&b.id!=='ad-col-load'){say('config/owners с сайта не меняется: иначе можно потерять право владельца.');refresh();return}
  const f=F();
  try{if(b.id==='ad-col-load'){const s=await f.getDoc(f.doc(db(),col,id));state.raw.text=JSON.stringify(plain(s.exists()?s.data():{}),null,2);say(s.exists()?'Прочитано.':'Документа нет. Пустой объект.',true)}
   else if(b.id==='ad-col-del'){if(!guardDelete(col,id,null))return;if(col==='members'){const ldr=await removeMember(f,id);if(ldr){const list=seatList(id,null,true);if(list)await syncSeats(list)}}else await f.deleteDoc(f.doc(db(),col,id));say('Удалено.',true)}
   else{let obj;try{obj=JSON.parse(state.raw.text||'{}')}catch(err){say('JSON: '+err.message);refresh();return}if(!obj||typeof obj!=='object'||Array.isArray(obj)){say('Нужен объект JSON.');refresh();return}const body=revive(obj,f);if(col==='members'){const ldr=await putMember(f,id,body);if(ldr){const list=seatList(id,plain(body),false);if(list)await syncSeats(list)}}else await f.setDoc(f.doc(db(),col,id),body);say('Сохранено.',true)}}
  catch(err){say(errText(err))}refresh()}
}
function onInput(e){if(!onAdmin()||!canAdmin())return;
 if(e.target.id==='ad-q'){state.q=e.target.value;const host=document.getElementById('ad-list');if(host)host.innerHTML=rowsHTML();return}
 if(e.target.id==='ad-docid'&&state.edit){state.edit.id=e.target.value;return}
 if(e.target.id==='ad-json'&&state.edit){try{const obj=JSON.parse(e.target.value);if(!obj||typeof obj!=='object'||Array.isArray(obj))throw new Error('x');state.edit.data=obj;state.msg='';touch();schedulePreview()}catch(err){state.msg='JSON: '+err.message;const m=document.getElementById('ad-msg');if(m){m.textContent=state.msg;m.className='aerr'}}return}
 if(e.target.id==='ad-col'||e.target.id==='ad-id'||e.target.id==='ad-raw'){state.raw={col:(document.getElementById('ad-col')||{}).value||'',id:(document.getElementById('ad-id')||{}).value||'',text:(document.getElementById('ad-raw')||{}).value||''};return}
 const el=e.target.closest&&e.target.closest('[data-af]');if(!el||!state.edit||el.readOnly)return;let path;try{path=JSON.parse(el.dataset.af)}catch(err){return}
 if(el.dataset.aft==='json'){try{setPath(state.edit.data,path,el.value.trim()?JSON.parse(el.value):null);state.msg=''}catch(err){const m=document.getElementById('ad-msg');state.msg='JSON: '+err.message;if(m){m.textContent=state.msg;m.className='aerr'}return}}
 else setPath(state.edit.data,path,readControl(el));
 if(el.dataset.aft==='textarea'){const lb=el.parentElement&&el.parentElement.querySelector('.af-lb');if(lb)lb.textContent=el.value}
 if(el.dataset.aft==='image'){const img=el.parentElement&&el.parentElement.querySelector('.af-prev');const v=el.value.trim();if(img){if(v){img.hidden=false;img.src=v}else img.remove()}else if(v){el.insertAdjacentHTML('afterend',`<img class="af-prev" src="${esc(v)}" alt="">`)}}
 touch();schedulePreview()}
async function onChange(e){if(!onAdmin()||!canAdmin())return;
 if(e.target.id==='ad-expert'){if(!superOn())return;if(!state.edit)return;if(e.target.checked){state.expert=true;refresh();return}try{const obj=JSON.parse(document.getElementById('ad-json').value);if(!obj||typeof obj!=='object'||Array.isArray(obj))throw new Error('Нужен объект JSON.');state.edit.data=obj;state.expert=false;state.fieldErr={};touch();refresh()}catch(err){say('JSON: '+err.message);refresh()}return}
 const file=e.target.closest&&e.target.closest('[data-affile]');if(!file||!file.files||!file.files[0]||!state.edit)return;
 try{const url=await fileToData(file.files[0]);setPath(state.edit.data,JSON.parse(file.dataset.affile),url);touch();refresh();schedulePreview()}catch(err){say(err.message||String(err));refresh()}}
async function ensure(){if(!onAdmin()||!canAdmin())return;fixTab();if(!state.booted){state.booted=true;if(superOn())loadTpls()}if(isContent(state.tab)){if(!state.edit&&!state.loading)openContent(state.tab)}else if(state.tab!=='raw'){if(!state.rows&&!state.loading)openList(state.tab)}}
// auth.js вызывает route() после refreshPower, уже после install(). Пока power.owner ещё не выставлен, ensure выходит сразу — ждём флаг и грузим раздел, не затирая открытую правку.
let armToken=0;
function armEnsure(){const token=++armToken,t0=Date.now();const tick=()=>{if(token!==armToken||!onAdmin())return;if(canAdmin()){ensure();return}if(Date.now()-t0>20000)return;setTimeout(tick,400)};tick()}
export function install(){const P=window.P;if(!P)return;P.admin=render;document.addEventListener('click',onClick);document.addEventListener('input',onInput);document.addEventListener('change',onChange);
 document.addEventListener('toggle',e=>{if(e.target&&e.target.id==='ad-live')state.previewOpen=e.target.open},true);
 addEventListener('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue=''}});
 armEnsure();addEventListener('hashchange',()=>armEnsure());if(onAdmin()&&window.route)window.route()}
