// Раздел «Каналы Discord» админ-панели (только владелец сайта). Владелец выбирает, куда бот и сайт публикуют сообщения.
// config/discordChannels — выбор владельца (id каналов). config/discordGuild — пишет бот: список текстовых каналов
// сервера, статус проверки (есть ли у бота доступ) и канал, которым бот пользуется сейчас (active).
// Пустой или неверный выбор не ломает ничего: бот остаётся в прежнем канале и сообщает причину.
// v212: «свои строки» (config/discordChannels.custom = [{id,label,channel}]) — владелец добавляет их кнопкой «Добавить».
// Публикующие новости/созывы выбирают такую строку в «Куда отправить в Discord», бот отправляет туда (discordOut).
const FB=()=>window.VPPKA_FB,F=()=>FB()&&FB().F,db=()=>FB()&&FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const GUILD='1557758930959081502';
// [поле, вопрос, пояснение]
export const ROWS=[
 ['news','Куда выкладывать новости?','Новость, опубликованная на сайте, дублируется в этот канал (вебхук «Уведомление»).'],
 ['notices','Куда отправлять созывы и объявления?','Созывы, их отмена и объявления из колокольчика на сайте.'],
 ['appCards','Куда приходят заявки в партию?','Карточки заявок с кнопками «Принять» и «Отклонить». Нерассмотренные заявки бот перенесёт в новый канал.'],
 ['applyPanel','Где кнопка «Подать заявку»?','Панель с кнопкой анкеты. При смене канала бот опубликует панель там и удалит старую.'],
 ['leadRoster','Куда выкладывать состав руководства?','Карточки людей на руководящих местах. Бот опубликует их в новом канале, затем удалит из старого.'],
 ['partyRoster','Куда выкладывать состав партии?','Карточки рядовых членов партии. Бот опубликует их в новом канале, затем удалит из старого.']
];
// в этих каналах бот сам ведёт свои сообщения — каналы должны быть разными
const BOT_MSG=['appCards','applyPanel','leadRoster','partyRoster'];
const TITLE={appCards:'заявки в партию',applyPanel:'кнопка «Подать заявку»',leadRoster:'состав руководства',partyRoster:'состав партии'};
export const MAX_CUSTOM=20;
const newId=()=>'c_'+Math.random().toString(36).slice(2,10).replace(/[^a-z0-9]/g,'0').padEnd(8,'0');
const S={rows:[],loaded:false,loading:false,cfg:{},g:null,draft:{},custom:{},err:{},msg:'',ok:false,busy:false,un:null};
// ID канала из «1234…», «<#1234…>» или ссылки https://discord.com/channels/<сервер>/<канал>
export function parseChannel(v){v=String(v||'').trim();if(!v)return {id:''};
 let m=v.match(/^<#(\d{15,21})>$/)||v.match(/^(\d{15,21})$/);if(m)return {id:m[1]};
 m=v.match(/^https?:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/channels\/(\d{15,21})\/(\d{15,21})(?:\/\d+)?\/?$/);
 if(m)return m[1]===GUILD?{id:m[2]}:{err:'Ссылка ведёт на другой сервер Discord.'};
 return {err:'Вставьте ID канала (17–20 цифр) или ссылку вида https://discord.com/channels/…'}}
const chans=()=>(S.g&&Array.isArray(S.g.channels))?S.g.channels:[];
const chName=id=>{const c=chans().find(x=>x.id===id);return c?'#'+c.name:''};
const fmt=t=>{const d=new Date(t);return isNaN(d)?'':d.toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})};
export function validateAll(draft,list,rows){const err={};const ids=new Set((list||[]).map(c=>c.id));
 for(const r of rows||[]){const lb=String(r.label||'').trim(),v=draft[r.id]||'';if(lb.length<2)err[r.id]='Напишите подпись строки (например «Куда выкладывать мероприятия?»).';else if(lb.length>80)err[r.id]='Подпись — не длиннее 80 знаков.';else if((rows||[]).some(x=>x!==r&&String(x.label||'').trim().toLowerCase()===lb.toLowerCase()))err[r.id]='Такая подпись уже есть.';
  else if(!v)err[r.id]='Выберите канал.';else if(!/^\d{15,21}$/.test(v))err[r.id]='Неверный ID канала.';else if(ids.size&&!ids.has(v))err[r.id]='Такого текстового канала на сервере нет (или бот его ещё не видит).'}
 if((rows||[]).length>MAX_CUSTOM)err._rows='Не больше '+MAX_CUSTOM+' своих строк.';
 for(const [k] of ROWS){const v=draft[k];if(v==null||v==='')continue;if(!/^\d{15,21}$/.test(v)){err[k]='Неверный ID канала.';continue}
  if(ids.size&&!ids.has(v))err[k]='Такого текстового канала на сервере нет (или бот его ещё не видит).'}
 for(const a of BOT_MSG)for(const b of BOT_MSG)if(a<b&&draft[a]&&draft[a]===draft[b]){const t='Один канал нельзя выбрать и для «'+TITLE[a]+'», и для «'+TITLE[b]+'».';err[a]=err[a]||t;err[b]=err[b]||t}
 return err}
const savedRows=()=>Array.isArray(S.cfg.custom)?S.cfg.custom:[];
const savedOf=k=>/^c_/.test(k)?((savedRows().find(r=>r.id===k)||{}).channel||''):(S.cfg[k]||'');
const rowsOf=c=>(Array.isArray(c.custom)?c.custom:[]).map(r=>({id:String(r.id||''),label:String(r.label||'')})).filter(r=>/^c_[a-z0-9]{4,24}$/.test(r.id));
function resetDraft(){S.draft=Object.fromEntries(ROWS.map(([k])=>[k,String(S.cfg[k]||'')]));S.rows=rowsOf(S.cfg);for(const r of savedRows())S.draft[r.id]=String(r.channel||'');S.custom={};S.err={}}
function status(k){const st=(S.g&&S.g.status&&S.g.status[k])||null,want=savedOf(k),act=st&&st.active||'';
 if(/^c_/.test(k)&&!want)return `<span class="dch-st wait">Новая строка: выберите канал и нажмите «Сохранить».</span>`;
 if(!st)return `<span class="dch-st wait">⏳ Бот ещё не проверял этот канал.</span>`;
 const cur=act?`Сейчас бот публикует в <b>${esc(chName(act)||act)}</b>.`:'';
 if(want&&st.want!==want)return `<span class="dch-st wait">⏳ Сохранено, ждёт проверки ботом (до минуты). ${cur}</span>`;
 if(!st.ok)return `<span class="dch-st bad">⚠ ${esc(st.err||'нет доступа')}. ${want&&want!==act?'Бот остался в прежнем канале. ':''}${cur}</span>`;
 return `<span class="dch-st good">✓ Бот может публиковать. ${cur}</span>`}
function selectHTML(k){const v=S.draft[k]||'',list=chans(),known=list.some(c=>c.id===v),custom=S.custom[k]||(v&&!known);
 const groups=[];for(const c of list){let g=groups.find(x=>x.cat===c.cat);if(!g){g={cat:c.cat,items:[]};groups.push(g)}g.items.push(c)}
 const opt=c=>`<option value="${esc(c.id)}"${c.id===v&&!custom?' selected':''}>#${esc(c.name)}${c.view?'':' (бот не видит)'}</option>`;
 return `<select data-dch="${k}"><option value=""${!v&&!custom?' selected':''}>— не выбрано (оставить как есть) —</option>${groups.map(g=>g.cat?`<optgroup label="${esc(g.cat)}">${g.items.map(opt).join('')}</optgroup>`:g.items.map(opt).join('')).join('')}<option value="__custom"${custom?' selected':''}>Другой канал: вставить ID или ссылку…</option></select>
 ${custom?`<input type="text" data-dchid="${k}" placeholder="ID канала или ссылка https://discord.com/channels/…" value="${esc(S.custom[k]!=null&&S.custom[k]!==true?S.custom[k]:v)}" maxlength="120">`:''}`}
export function dchHTML(){
 if(!S.loaded)return '<p class="amut">Загрузка…</p>';
 const g=S.g,info=g&&g.at?`Список каналов и проверку обновляет Discord-бот, последний раз: ${esc(fmt(g.at))}.`:'Бот ещё не прислал список каналов — можно вставить ID или ссылку на канал.';
 const dirty=ROWS.some(([k])=>(S.draft[k]||'')!==(S.cfg[k]||''))||JSON.stringify(S.rows.map(r=>[r.id,r.label.trim(),S.draft[r.id]||'']))!==JSON.stringify(savedRows().map(r=>[r.id,String(r.label||'').trim(),r.channel||'']));
 const cus=S.rows.map(r=>`<div class="af-field dch-row dch-cus"><div class="dch-cl"><input type="text" data-dchlab="${esc(r.id)}" value="${esc(r.label)}" maxlength="80" placeholder="Подпись, например: Куда выкладывать мероприятия?"><button type="button" class="btn sm danger" data-dchdel="${esc(r.id)}" title="Удалить строку">🗑 Удалить</button></div>${selectHTML(r.id)}<small class="amut">Своя строка: при публикации новости или созыва её можно выбрать в «Куда отправить в Discord».</small>${S.err[r.id]?`<p class="aerr">${esc(S.err[r.id])}</p>`:''}<div>${status(r.id)}</div></div>`).join('');
 return `<p class="amut">Выберите, в какие каналы сервера Discord сайт и бот публикуют сообщения. ${info} Если у бота нет доступа к выбранному каналу, он продолжит работать в прежнем и покажет причину здесь.</p>
 <div class="dch">${ROWS.map(([k,q,hint])=>`<div class="af-field dch-row"><div class="af-l"><b>${esc(q)}</b></div>${selectHTML(k)}<small class="amut">${esc(hint)}</small>${S.err[k]?`<p class="aerr">${esc(S.err[k])}</p>`:''}<div>${status(k)}</div></div>`).join('')}</div>
 <h3 class="dch-h">Свои строки</h3><p class="amut">Добавьте свою строку с подписью и каналом. Встроенные строки выше удалить нельзя.</p>
 <div class="dch">${cus||'<p class="amut">Своих строк пока нет.</p>'}</div>${S.err._rows?`<p class="aerr">${esc(S.err._rows)}</p>`:''}
 <p><button type="button" class="btn sm o" id="dch-add"${S.rows.length>=MAX_CUSTOM?' disabled':''}>➕ Добавить</button></p>
 ${S.msg?`<p class="${S.ok?'af-ok':'aerr'}">${esc(S.msg)}</p>`:''}
 <div class="af-bar"><button type="button" class="btn sm" id="dch-save"${S.busy?' disabled':''}>Сохранить</button> <button type="button" class="btn sm o" id="dch-reset"${dirty?'':' disabled'}>Отменить изменения</button>${S.cfg.updatedAt&&S.cfg.updatedAt.toDate?` <small class="amut">Изменено: ${esc(fmt(S.cfg.updatedAt.toDate()))}</small>`:''}</div>`}
export async function dchLoad(refresh,force){if(S.loading)return;if(S.loaded&&S.un&&!force){refresh();return}S.loading=true;const f=F();
 try{const c=await f.getDoc(f.doc(db(),'config','discordChannels'));S.cfg=c.exists()?c.data():{};resetDraft();
  if(!S.un)S.un=f.onSnapshot(f.doc(db(),'config','discordGuild'),s=>{S.g=s.exists()?s.data():null;S.loaded=true;refresh()},e=>{console.warn('discordGuild',e);S.loaded=true;refresh()});
  else S.loaded=true}catch(e){S.msg=e.code==='permission-denied'?'Нет прав: раздел только для владельца сайта.':(e.message||String(e));S.ok=false;S.loaded=true}
 S.loading=false;refresh()}
export function dchStop(){if(S.un){try{S.un()}catch(e){}S.un=null}S.loaded=false}
export function dchChange(el,refresh){const k=el.dataset.dch;if(k){if(el.value==='__custom'){S.custom[k]=S.draft[k]||'';}else{delete S.custom[k];S.draft[k]=el.value;delete S.err[k]}S.msg='';refresh();return true}
 const kl=el.dataset.dchlab;if(kl){const r=S.rows.find(x=>x.id===kl);if(r){r.label=el.value;if(S.err[kl]&&el.value.trim().length>=2){delete S.err[kl];const n=el.closest('.dch-row')&&el.closest('.dch-row').querySelector('.aerr');if(n)n.remove()}}return true}
 const ki=el.dataset.dchid;if(ki){S.custom[ki]=el.value;const p=parseChannel(el.value);if(p.err){S.err[ki]=p.err}else{S.draft[ki]=p.id;delete S.err[ki]}const n=el.parentElement.querySelector('.aerr');if(n&&!S.err[ki])n.remove();return true}
 return false}
export async function dchClick(b,refresh){
 if(b.id==='dch-reset'){resetDraft();S.msg='';refresh();return true}
 if(b.id==='dch-add'){if(S.rows.length>=MAX_CUSTOM)return true;let id=newId();while(S.rows.some(r=>r.id===id))id=newId();S.rows.push({id,label:''});S.draft[id]='';S.msg='';refresh();const el=document.querySelector(`[data-dchlab="${id}"]`);if(el)el.focus();return true}
 if(b.dataset&&b.dataset.dchdel){const r=S.rows.find(x=>x.id===b.dataset.dchdel);if(!r)return true;if(!confirm('Удалить строку «'+(r.label.trim()||'без подписи')+'»? Новости и созывы туда больше нельзя будет отправить. Изменение вступит в силу после «Сохранить».'))return true;S.rows=S.rows.filter(x=>x!==r);delete S.draft[r.id];delete S.custom[r.id];delete S.err[r.id];S.msg='Строка удалена из списка — нажмите «Сохранить».';S.ok=true;refresh();return true}
 if(b.id!=='dch-save')return false;if(S.busy)return true;
 const pe={};for(const k of Object.keys(S.custom)){const p=parseChannel(S.custom[k]===true?'':S.custom[k]);if(p.err)pe[k]=p.err;else S.draft[k]=p.id}
 S.err={...validateAll(S.draft,chans(),S.rows),...pe};if(Object.keys(S.err).length){S.msg='Исправьте отмеченные строки.';S.ok=false;refresh();return true}
 S.busy=true;S.msg='Сохранение…';S.ok=true;refresh();
 try{const f=F(),body={updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()};for(const [k] of ROWS)body[k]=S.draft[k]||'';body.custom=S.rows.map(r=>({id:r.id,label:r.label.trim().slice(0,80),channel:S.draft[r.id]||''}));
  await f.setDoc(f.doc(db(),'config','discordChannels'),body);S.cfg={...body,updatedAt:{toDate:()=>new Date()}};resetDraft();S.msg='Сохранено. Бот применит выбор в течение минуты — статус обновится здесь.';S.ok=true}
 catch(e){S.msg=e.code==='permission-denied'?'Нет прав: менять каналы может только владелец сайта.':(e.message||String(e));S.ok=false}
 finally{S.busy=false;refresh()}return true}
