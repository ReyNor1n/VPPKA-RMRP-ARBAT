// Раздел «Каналы Discord» админ-панели (только владелец сайта). Владелец выбирает, куда бот и сайт публикуют сообщения.
// config/discordChannels — выбор владельца (id каналов). config/discordGuild — пишет бот: список текстовых каналов
// сервера, статус проверки (есть ли у бота доступ) и канал, которым бот пользуется сейчас (active).
// Пустой или неверный выбор не ломает ничего: бот остаётся в прежнем канале и сообщает причину.
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
const S={loaded:false,loading:false,cfg:{},g:null,draft:{},custom:{},err:{},msg:'',ok:false,busy:false,un:null};
// ID канала из «1234…», «<#1234…>» или ссылки https://discord.com/channels/<сервер>/<канал>
export function parseChannel(v){v=String(v||'').trim();if(!v)return {id:''};
 let m=v.match(/^<#(\d{15,21})>$/)||v.match(/^(\d{15,21})$/);if(m)return {id:m[1]};
 m=v.match(/^https?:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/channels\/(\d{15,21})\/(\d{15,21})(?:\/\d+)?\/?$/);
 if(m)return m[1]===GUILD?{id:m[2]}:{err:'Ссылка ведёт на другой сервер Discord.'};
 return {err:'Вставьте ID канала (17–20 цифр) или ссылку вида https://discord.com/channels/…'}}
const chans=()=>(S.g&&Array.isArray(S.g.channels))?S.g.channels:[];
const chName=id=>{const c=chans().find(x=>x.id===id);return c?'#'+c.name:''};
const fmt=t=>{const d=new Date(t);return isNaN(d)?'':d.toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})};
export function validateAll(draft,list){const err={};const ids=new Set((list||[]).map(c=>c.id));
 for(const [k] of ROWS){const v=draft[k];if(v==null||v==='')continue;if(!/^\d{15,21}$/.test(v)){err[k]='Неверный ID канала.';continue}
  if(ids.size&&!ids.has(v))err[k]='Такого текстового канала на сервере нет (или бот его ещё не видит).'}
 for(const a of BOT_MSG)for(const b of BOT_MSG)if(a<b&&draft[a]&&draft[a]===draft[b]){const t='Один канал нельзя выбрать и для «'+TITLE[a]+'», и для «'+TITLE[b]+'».';err[a]=err[a]||t;err[b]=err[b]||t}
 return err}
function status(k){const st=(S.g&&S.g.status&&S.g.status[k])||null,want=S.cfg[k]||'',act=st&&st.active||'';
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
 const dirty=ROWS.some(([k])=>(S.draft[k]||'')!==(S.cfg[k]||''));
 return `<p class="amut">Выберите, в какие каналы сервера Discord сайт и бот публикуют сообщения. ${info} Если у бота нет доступа к выбранному каналу, он продолжит работать в прежнем и покажет причину здесь.</p>
 <div class="dch">${ROWS.map(([k,q,hint])=>`<div class="af-field dch-row"><div class="af-l"><b>${esc(q)}</b></div>${selectHTML(k)}<small class="amut">${esc(hint)}</small>${S.err[k]?`<p class="aerr">${esc(S.err[k])}</p>`:''}<div>${status(k)}</div></div>`).join('')}</div>
 ${S.msg?`<p class="${S.ok?'af-ok':'aerr'}">${esc(S.msg)}</p>`:''}
 <div class="af-bar"><button type="button" class="btn sm" id="dch-save"${S.busy?' disabled':''}>Сохранить</button> <button type="button" class="btn sm o" id="dch-reset"${dirty?'':' disabled'}>Отменить изменения</button>${S.cfg.updatedAt&&S.cfg.updatedAt.toDate?` <small class="amut">Изменено: ${esc(fmt(S.cfg.updatedAt.toDate()))}</small>`:''}</div>`}
export async function dchLoad(refresh,force){if(S.loading)return;if(S.loaded&&S.un&&!force){refresh();return}S.loading=true;const f=F();
 try{const c=await f.getDoc(f.doc(db(),'config','discordChannels'));S.cfg=c.exists()?c.data():{};S.draft=Object.fromEntries(ROWS.map(([k])=>[k,String(S.cfg[k]||'')]));S.custom={};S.err={};
  if(!S.un)S.un=f.onSnapshot(f.doc(db(),'config','discordGuild'),s=>{S.g=s.exists()?s.data():null;S.loaded=true;refresh()},e=>{console.warn('discordGuild',e);S.loaded=true;refresh()});
  else S.loaded=true}catch(e){S.msg=e.code==='permission-denied'?'Нет прав: раздел только для владельца сайта.':(e.message||String(e));S.ok=false;S.loaded=true}
 S.loading=false;refresh()}
export function dchStop(){if(S.un){try{S.un()}catch(e){}S.un=null}S.loaded=false}
export function dchChange(el,refresh){const k=el.dataset.dch;if(k){if(el.value==='__custom'){S.custom[k]=S.draft[k]||'';}else{delete S.custom[k];S.draft[k]=el.value;delete S.err[k]}S.msg='';refresh();return true}
 const ki=el.dataset.dchid;if(ki){S.custom[ki]=el.value;const p=parseChannel(el.value);if(p.err){S.err[ki]=p.err}else{S.draft[ki]=p.id;delete S.err[ki]}const n=el.parentElement.querySelector('.aerr');if(n&&!S.err[ki])n.remove();return true}
 return false}
export async function dchClick(b,refresh){
 if(b.id==='dch-reset'){S.draft=Object.fromEntries(ROWS.map(([k])=>[k,String(S.cfg[k]||'')]));S.custom={};S.err={};S.msg='';refresh();return true}
 if(b.id!=='dch-save')return false;if(S.busy)return true;
 const pe={};for(const k of Object.keys(S.custom)){const p=parseChannel(S.custom[k]===true?'':S.custom[k]);if(p.err)pe[k]=p.err;else S.draft[k]=p.id}
 S.err={...validateAll(S.draft,chans()),...pe};if(Object.keys(S.err).length){S.msg='Исправьте отмеченные строки.';S.ok=false;refresh();return true}
 S.busy=true;S.msg='Сохранение…';S.ok=true;refresh();
 try{const f=F(),body={updatedBy:FB().user.uid,updatedAt:f.serverTimestamp()};for(const [k] of ROWS)body[k]=S.draft[k]||'';
  await f.setDoc(f.doc(db(),'config','discordChannels'),body);S.cfg={...body,updatedAt:{toDate:()=>new Date()}};S.custom={};S.msg='Сохранено. Бот применит выбор в течение минуты — статус обновится здесь.';S.ok=true}
 catch(e){S.msg=e.code==='permission-denied'?'Нет прав: менять каналы может только владелец сайта.':(e.message||String(e));S.ok=false}
 finally{S.busy=false;refresh()}return true}
