// v262: раздел #admin → «Объявления». Объявления и созывы (notifications type other|convocation) — те же, что в окне на главной:
// создать, изменить, удалить, закрепить, скрыть с главной; дата, время (МСК), место; по желанию — в Discord (бот, discordOut) с выбранными ролями.
// @everyone не упоминается никогда: бот берёт только роли из «Настроек сайта» → Discord.
import {loadTargets,targetSelect,sendVia} from './discord-targets.js?v=262';
const FB=()=>window.VPPKA_FB,F=()=>FB().F,db=()=>FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S={rows:null,edit:null,msg:'',ok:false,busy:false,T:null};
const AN=()=>window.VPPKA_AN;const CFG=()=>(window.VPPKA_CFG?window.VPPKA_CFG():{discord:{roles:[],defRoles:[]}});
const ms=v=>v&&typeof v.toMillis==='function'?v.toMillis():(typeof v==='number'?v:0);
const say=(t,ok)=>{S.msg=t||'';S.ok=!!ok};
const err=e=>e&&e.code==='permission-denied'?'Нет прав (нужна ступень 4+ и опубликованные firestore.rules).':(e&&(e.message||e.code))||String(e);
export async function anLoad(refresh){S.rows=null;S.edit=null;refresh();try{if(!AN())await import('./panel.js?v=262');const f=F();
 const s=await f.getDocs(f.query(f.collection(db(),'notifications'),f.where('type','in',['convocation','other'])));
 S.rows=s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>(!!b.pinned-!!a.pinned)||ms(b.createdAt)-ms(a.createdAt));S.T=await loadTargets()}catch(e){S.rows=[];say(err(e))}refresh()}
function status(x){const now=Date.now(),a=x.at||0;if(x.cancelled)return ['Отменён','off'];if(x.hidden)return ['Скрыто','off'];
 const H=(window.VPPKA_HN&&window.VPPKA_HN())||[];if(H.some(y=>y.id===x.id))return a&&a+3*3600e3<=now?['Состоялось · на главной','past']:['На главной','on'];return ['В архиве','past']}
function row(x){const a=x.at||0,an=AN(),[st,c]=status(x);const d=a?new Date(a+3*3600e3):null,M=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
 return `<div class="aan-r${x.hidden?' aan-dim':''}"><div class="aan-d">${d?`<b>${d.getUTCDate()}</b><span>${M[d.getUTCMonth()]}</span><i>${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}</i>`:'<b class="aan-st">☭</b>'}</div>
<div class="aan-m"><div class="aan-chips"><span class="aan-c">${x.type==='convocation'?'Созыв':'Объявление'}</span><span class="aan-c ${c}">${st}</span>${x.pinned?'<span class="aan-c pin">Закреплено</span>':''}</div>
<b class="aan-t">${esc(x.title)}</b><small class="amut">${esc([a&&an?an.when(a):x.when,x.place].filter(Boolean).join(' · '))}</small></div>
<div class="aan-b"><button type="button" class="btn sm o" data-aan="edit" data-id="${esc(x.id)}">Изменить</button><button type="button" class="btn sm o" data-aan="pin" data-id="${esc(x.id)}">${x.pinned?'Открепить':'Закрепить'}</button><button type="button" class="btn sm o" data-aan="hide" data-id="${esc(x.id)}">${x.hidden?'Показать':'Скрыть'}</button><button type="button" class="btn sm o kp-del" data-aan="del" data-id="${esc(x.id)}">Удалить</button></div></div>`}
function roleBox(sel){const R=CFG().discord.roles||[];return R.length?R.map(r=>`<label class="aan-ck"><input type="checkbox" data-aanrole="${esc(r.id)}"${sel.includes(String(r.id))?' checked':''}> @${esc(r.label)}</label>`).join(''):'<span class="amut">Роли для упоминания задаются в «Настройки сайта» → Discord.</span>'}
function form(){const e=S.edit,x=e.data,an=AN();const dc=e.discord;
 return `<div class="aan-f"><h3>${e.id?'Изменить':'Новое'} объявление</h3>
<div class="aan-g"><label>Тип<select id="aan-ty"${e.id?' disabled':''}><option value="other"${x.type!=='convocation'?' selected':''}>Объявление</option><option value="convocation"${x.type==='convocation'?' selected':''}>Созыв</option></select></label>
<label class="aan-w2">Заголовок *<input id="aan-ti" maxlength="200" value="${esc(x.title||'')}"></label>
<label>Дата и время (МСК)<input id="aan-at" type="datetime-local" value="${x.at&&an?an.toInput(x.at):''}"></label>
<label class="aan-w2">Место<input id="aan-pl" maxlength="120" value="${esc(x.place||'')}" placeholder="например: у памятника Жукову"></label></div>
<label>Текст (**жирный**, пустая строка — абзац)<textarea id="aan-tx" maxlength="2000" rows="7">${esc(x.text||'')}</textarea></label>
<div class="aan-opts"><label class="aan-ck"><input type="checkbox" id="aan-pin"${x.pinned?' checked':''}> Закрепить первым на главной</label><label class="aan-ck"><input type="checkbox" id="aan-hid"${x.hidden?' checked':''}> Скрыть с главной</label></div>
<fieldset class="aan-dc"><legend>Discord</legend><label class="aan-ck"><input type="checkbox" id="aan-dc"${dc.on?' checked':''}> ${e.id?'Отправить в Discord ещё раз':'Отправить в Discord'}</label>
<div class="aan-dcb">${targetSelect('aan-tg','notices',S.T,dc.tg)||'<span class="amut">Канал: «📃 обьявления» (как обычно)</span>'}<div class="aan-roles"><span class="amut">Упомянуть:</span>${roleBox(dc.roles)}</div><small class="amut">@everyone и @here не упоминаются никогда.</small></div></fieldset>
<div class="aan-act"><button type="button" class="btn sm" data-aan="save"${S.busy?' disabled':''}>${e.id?'Сохранить':'Опубликовать'}</button><button type="button" class="btn sm o" data-aan="cancel">Отмена</button></div></div>`}
export function anHTML(){const L=S.rows;
 return `<div class="aan"><div class="aan-top"><p class="amut">Окно «Объявления» на главной показывает до ${esc(CFG().home?CFG().home.announceMax:3)} записей: сначала закреплённые, потом новые. Прошедшее событие сутки помечено «Состоялось», затем уходит в архив (закреплённое остаётся).</p><button type="button" class="btn sm" data-aan="new">+ Новое объявление</button></div>
<p class="${S.ok?'af-ok':'aerr'}">${esc(S.msg)}</p>${S.edit?form():''}
${L==null?'<p>Загрузка…</p>':L.length?`<div class="aan-l">${L.map(row).join('')}</div>`:'<p class="amut">Объявлений пока нет.</p>'}</div>`}
function grab(){const e=S.edit;if(!e||!document.getElementById('aan-ti'))return;const v=i=>(document.getElementById(i)||{}).value||'',ck=i=>!!(document.getElementById(i)||{}).checked;
 Object.assign(e.data,{type:e.id?e.data.type:v('aan-ty'),title:v('aan-ti'),text:v('aan-tx'),place:v('aan-pl'),pinned:ck('aan-pin'),hidden:ck('aan-hid')});e.atIn=v('aan-at');
 e.discord={on:ck('aan-dc'),tg:v('aan-tg'),roles:[...document.querySelectorAll('[data-aanrole]')].filter(x=>x.checked).map(x=>x.dataset.aanrole)}}
async function save(refresh){const e=S.edit,f=F(),x=e.data,an=AN();const ti=String(x.title||'').trim();if(!ti){say('Введите заголовок.');return refresh()}
 const at=e.atIn?an.toMs(e.atIn):0;if(e.atIn&&!at){say('Неверная дата.');return refresh()}
 const pl=String(x.place||'').trim(),tx=String(x.text||'').trim();S.busy=true;refresh();
 try{let id=e.id;
  if(id){const d={title:ti,text:tx,place:pl||f.deleteField(),at:at||f.deleteField(),when:at?an.when(at):f.deleteField(),pinned:!!x.pinned,hidden:!!x.hidden,editedBy:FB().user.uid,editedAt:f.serverTimestamp()};
   await f.updateDoc(f.doc(db(),'notifications',id),d)}
  else{const d={type:x.type==='convocation'?'convocation':'other',title:ti,author:FB().user.uid,createdAt:f.serverTimestamp()};const nm=window.VPPKA_AUTHOR_NAME&&window.VPPKA_AUTHOR_NAME();if(nm)d.authorName=nm;
   if(tx)d.text=tx;if(pl)d.place=pl;if(at){d.at=at;d.when=an.when(at)}if(x.pinned)d.pinned=true;if(x.hidden)d.hidden=true;id=(await f.addDoc(f.collection(db(),'notifications'),d)).id}
  let m=e.id?'Сохранено.':'Опубликовано на сайте.';
  if(e.discord.on){const r=await sendVia('notice',id,e.discord.tg||'b_notices',e.discord.roles);m+=r===true?' Discord: отправлено.':' Discord: '+r}
  S.edit=null;say(m,true)}catch(er){say(err(er))}S.busy=false;await anLoad(refresh);}
export async function anClick(b,refresh){const k=b.dataset.aan;if(!k)return false;grab();const x=(S.rows||[]).find(r=>r.id===b.dataset.id),f=F();
 if(k==='new'){S.edit={id:'',data:{type:'other',pinned:false,hidden:false},discord:{on:true,tg:'',roles:(CFG().discord.defRoles||[]).map(String)}};say('');refresh();return true}
 if(k==='edit'&&x){S.edit={id:x.id,data:{...x},discord:{on:false,tg:'',roles:(CFG().discord.defRoles||[]).map(String)}};say('');refresh();scrollTo(0,0);return true}
 if(k==='cancel'){S.edit=null;say('');refresh();return true}
 if(k==='save'){await save(refresh);return true}
 if((k==='pin'||k==='hide')&&x){const key=k==='pin'?'pinned':'hidden';try{await f.updateDoc(f.doc(db(),'notifications',x.id),{[key]:!x[key],editedBy:FB().user.uid,editedAt:f.serverTimestamp()});say(k==='pin'?(x.pinned?'Откреплено.':'Закреплено.'):(x.hidden?'Снова на главной.':'Скрыто с главной.'),true)}catch(er){say(err(er))}await anLoad(refresh);return true}
 if(k==='del'&&x){if(!confirm('Удалить «'+x.title+'»? С сайта и из колокольчика оно исчезнет; сообщение в Discord останется.'))return true;try{await f.deleteDoc(f.doc(db(),'notifications',x.id));say('Удалено.',true)}catch(er){say(err(er))}await anLoad(refresh);return true}
 return false}
