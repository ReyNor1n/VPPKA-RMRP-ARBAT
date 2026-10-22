// v230: раздел «Ключи доступа» админ-панели — только ступень 7+ (владелец сайта = ступень 9).
// Ключ (4 цифры) владелец вводит сам. На сайте и в базе ключ не хранится: id документа = sha256(ключ), как при входе по ключу (auth.js checkKey).
// После выпуска поле ключа очищается, ключ больше нигде не показывается. В списке нет ни ключей, ни хэшей (хэш остаётся только в памяти страницы для кнопок).
// Защита — firestore.rules (accessKeys: create/update/list только myTier() >= 7); здесь только интерфейс.
const FB=()=>window.VPPKA_FB,F=()=>FB()&&FB().F,db=()=>FB()&&FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pw=()=>(FB()&&FB().power)||{};
export const keysAllowed=()=>{const p=pw();return !!(FB()&&FB().user)&&(p.owner||(p.tier|0)>=7)};
const myTierV=()=>pw().owner?9:(pw().tier|0),myRankV=()=>pw().owner?1000:(pw().rank|0);
const S={rows:[],loaded:false,loading:false,msg:'',ok:false,busy:false,form:null,rep:-1,err:{}};
const blankForm=()=>({did:'',label:'',tier:'',roleName:'',rank:'',chair:false,members:false});
async function sha(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const fmt=t=>{const d=t&&t.toDate?t.toDate():null;return d&&!isNaN(d)?d.toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'};
const mem=()=>(((window.VPPKA_DATA||{}).members)||[]).filter(m=>/^\d{15,21}$/.test(String(m.discordId||''))&&m.name&&!/^вакансия$/i.test(String(m.name).trim()));
const holderName=did=>{const m=mem().find(x=>String(x.discordId)===String(did));return m?m.name:''};
// проверка формы: ключ — ровно 4 цифры; остальное — как в firestore.rules
export function validateKey(key,f,myTier,myRank){const e={};
 if(!/^\d{4}$/.test(String(key||'')))e.key='Ключ — ровно 4 цифры.';
 if(!/^\d{15,21}$/.test(String(f.did||'')))e.did='Выберите участника или впишите Discord ID (15–21 цифра).';
 const t=Number(f.tier);if(!Number.isInteger(t)||t<1||t>Math.min(7,myTier))e.tier='Ступень от 1 до '+Math.min(7,myTier)+'.';
 const r=String(f.roleName||'').trim();if(!r||r.length>60)e.roleName='Должность: от 1 до 60 знаков.';
 const k=Number(f.rank);if(!Number.isInteger(k)||k<1||k>=myRank)e.rank='Уровень — целое число от 1 до '+(myRank-1)+'.';
 if(String(f.label||'').length>100)e.label='Подпись — не длиннее 100 знаков.';
 return e}
export function keysHTML(){
 if(!keysAllowed())return '<p class="aerr">Раздел только для ступени доступа 7.</p>';
 if(!S.loaded)return '<p class="amut">Загрузка…</p>';
 const f=S.form||(S.form=blankForm()),e=S.err,er=k=>e[k]?`<p class="aerr">${esc(e[k])}</p>`:'';
 const roles=[...new Set(S.rows.map(r=>r.roleName).filter(Boolean))];
 const rows=S.rows.map((r,i)=>`<tr class="${r.revoked?'kx-off':''}"><td>${esc(r.label||'—')}</td><td>${esc(holderName(r.discordId)||'—')}<br><small class="amut">${esc(r.discordId||'')}</small></td><td>${esc(r.tier??'—')}</td><td>${esc(r.roleName||'')}<br><small class="amut">уровень ${esc(r.rank??'—')}${r.canEditChairman?' · председатель':''}${r.canViewMembers?' · список участников':''}</small></td><td>${r.revoked?'<span class="aerr">отозван</span>':'<span class="af-ok">действует</span>'}</td><td>${esc(fmt(r.createdAt))}</td>
<td>${(r.rank|0)<myRankV()?(r.revoked?`<button type="button" class="btn sm o" data-kact="restore" data-ki="${i}">Вернуть</button>`:`<button type="button" class="btn sm danger" data-kact="revoke" data-ki="${i}">Отозвать</button>`)+` <button type="button" class="btn sm o" data-kact="replace" data-ki="${i}">Заменить</button>`:''}</td></tr>`).join('');
 const opts=mem().map(m=>`<option value="${esc(m.discordId)}"${String(f.did)===String(m.discordId)?' selected':''}>${esc(m.name)} — ${esc(m.role||m.title||'')}</option>`).join('');
 const rep=S.rep>=0&&S.rows[S.rep];
 return `<p class="amut">Ключ выдаётся одному человеку (по Discord ID). Ключ вы придумываете сами: 4 цифры. На сайте и в базе он не хранится и после выпуска нигде не показывается — сообщите его человеку лично, он вводит его в личном кабинете.</p>
<div class="tblw"><table class="tbl kx-tbl"><tr><th>Подпись</th><th>Кому выдан</th><th>Ступень</th><th>Должность</th><th>Статус</th><th>Выдан</th><th></th></tr>${rows||'<tr><td colspan="7" class="amut">Ключей нет.</td></tr>'}</table></div>
<h3 class="dch-h" id="kx-form">${rep?'Замена ключа: '+esc(rep.label||holderName(rep.discordId)||''):'Новый ключ'}</h3>
${rep?'<p class="amut">После выпуска нового ключа старый будет отозван.</p>':''}
<div class="af-field"><label class="fl">Ключ (4 цифры)<input id="kx-key" type="password" inputmode="numeric" maxlength="4" autocomplete="off" spellcheck="false" placeholder="••••"></label>${er('key')}</div>
<div class="af-field"><label class="fl">Кому (участник)<select id="kx-mem"><option value="">— выберите —</option>${opts}</select></label>
<label class="fl">или Discord ID<input id="kx-did" data-kf="did" inputmode="numeric" maxlength="21" value="${esc(f.did)}"></label>${er('did')}</div>
<div class="af-field"><label class="fl">Подпись (кто это)<input data-kf="label" maxlength="100" value="${esc(f.label)}" placeholder="Фамилия Имя, должность"></label>${er('label')}</div>
<div class="af-field"><label class="fl">Ступень доступа<select data-kf="tier"><option value="">—</option>${[1,2,3,4,5,6,7].filter(t=>t<=myTierV()).map(t=>`<option value="${t}"${String(f.tier)===String(t)?' selected':''}>${t}</option>`).join('')}</select></label>${er('tier')}</div>
<div class="af-field"><label class="fl">Должность<input data-kf="roleName" maxlength="60" list="kx-roles" value="${esc(f.roleName)}"></label><datalist id="kx-roles">${roles.map(r=>`<option value="${esc(r)}">`).join('')}</datalist>${er('roleName')}</div>
<div class="af-field"><label class="fl">Уровень (rank, 1–${myRankV()-1})<input data-kf="rank" type="number" min="1" max="${myRankV()-1}" value="${esc(f.rank)}"></label>${er('rank')}</div>
<div class="af-field"><label class="af-sw"><input type="checkbox" data-kf="chair"${f.chair?' checked':''}> Может править запись председателя</label> <label class="af-sw"><input type="checkbox" data-kf="members"${f.members?' checked':''}> Видит список участников</label></div>
${S.msg?`<p class="${S.ok?'af-ok':'aerr'}" id="kx-msg">${esc(S.msg)}</p>`:''}
<div class="af-bar"><button type="button" class="btn sm" id="kx-save"${S.busy?' disabled':''}>${rep?'Выпустить замену':'Выпустить ключ'}</button>${rep||S.form&&JSON.stringify(S.form)!==JSON.stringify(blankForm())?' <button type="button" class="btn sm o" id="kx-reset">Очистить</button>':''}</div>`}
export async function keysLoad(refresh,force){if(S.loading||!keysAllowed())return;if(S.loaded&&!force)return;S.loading=true;const f=F();
 try{const q=await f.getDocs(f.collection(db(),'accessKeys'));const L=[];q.forEach(d=>{const x=d.data();L.push({_h:d.id,label:x.label||'',discordId:x.discordId||'',tier:x.tier,roleName:x.roleName||'',rank:x.rank,revoked:x.revoked===true,createdAt:x.createdAt||null,canEditChairman:x.canEditChairman===true,canViewMembers:x.canViewMembers===true})});
  L.sort((a,b)=>(a.revoked-b.revoked)||((b.tier|0)-(a.tier|0))||String(a.label).localeCompare(String(b.label),'ru'));S.rows=L}
 catch(e){S.msg=e.code==='permission-denied'?'Нет прав: раздел только для ступени 7.':(e.message||String(e));S.ok=false}
 S.loaded=true;S.loading=false;refresh()}
export function keysInput(el){if(!S.form)S.form=blankForm();
 if(el.id==='kx-mem'){S.form.did=el.value;const m=mem().find(x=>String(x.discordId)===el.value);if(m&&!S.form.label)S.form.label=m.name;const d=document.getElementById('kx-did');if(d)d.value=el.value;const lb=document.querySelector('[data-kf=label]');if(lb&&!lb.value&&m)lb.value=m.name;return}
 const k=el.dataset&&el.dataset.kf;if(!k)return;S.form[k]=el.type==='checkbox'?el.checked:el.value;
 if(k==='did'){const s=document.getElementById('kx-mem');if(s)s.value=mem().some(x=>String(x.discordId)===el.value)?el.value:''}}
export async function keysClick(b,refresh){if(!keysAllowed())return;const f=F();
 if(b.id==='kx-reset'){S.form=blankForm();S.rep=-1;S.err={};S.msg='';refresh();return}
 if(b.dataset.kact){const r=S.rows[Number(b.dataset.ki)];if(!r)return;
  if(b.dataset.kact==='replace'){S.rep=Number(b.dataset.ki);S.form={did:r.discordId,label:r.label,tier:String(r.tier??''),roleName:r.roleName,rank:String(r.rank??''),chair:r.canEditChairman,members:r.canViewMembers};S.err={};S.msg='';refresh();const h=document.getElementById('kx-form');if(h)h.scrollIntoView({block:'start'});const k=document.getElementById('kx-key');if(k)k.focus();return}
  const off=b.dataset.kact==='revoke';if(!confirm((off?'Отозвать ключ: ':'Вернуть ключ: ')+(r.label||holderName(r.discordId)||r.discordId)+'?'))return;
  try{await f.updateDoc(f.doc(db(),'accessKeys',r._h),{revoked:off,revokedAt:f.serverTimestamp()});S.msg=off?'Ключ отозван.':'Ключ снова действует.';S.ok=true}catch(e){S.msg='Не удалось: '+(e.code==='permission-denied'?'нет прав.':(e.code||e.message));S.ok=false}
  await keysLoad(refresh,true);return}
 if(b.id!=='kx-save'||S.busy)return;
 const kin=document.getElementById('kx-key');const fm=S.form||blankForm();
 S.err=validateKey(kin?kin.value:'',fm,myTierV(),myRankV());if(Object.keys(S.err).length){S.msg='Проверьте поля.';S.ok=false;refresh();return}
 S.busy=true;S.msg='';const rep=S.rep>=0?S.rows[S.rep]:null;
 try{const h=await sha(kin.value);if(kin)kin.value='';const ref=f.doc(db(),'accessKeys',h),uid=FB().user.uid;
  await f.runTransaction(db(),async tx=>{const s=await tx.get(ref);if(s.exists())throw Object.assign(new Error('dup'),{dup:1});
   const d={rank:Number(fm.rank),tier:Number(fm.tier),roleName:String(fm.roleName).trim(),discordId:String(fm.did),revoked:false,createdBy:uid,createdAt:f.serverTimestamp()};
   const lb=String(fm.label||'').trim();if(lb)d.label=lb;if(fm.chair)d.canEditChairman=true;if(fm.members)d.canViewMembers=true;tx.set(ref,d)});
  let note='';if(rep&&!rep.revoked){try{await f.updateDoc(f.doc(db(),'accessKeys',rep._h),{revoked:true,revokedAt:f.serverTimestamp()})}catch(e){note=' Старый ключ отозвать не удалось — отзовите его кнопкой «Отозвать».'}}
  S.msg=(rep?'Новый ключ выпущен'+(rep.revoked?'.':', старый отозван.'):'Ключ выпущен.')+' Сообщите его человеку лично: он вводит ключ в личном кабинете.'+note;S.ok=!note;S.form=blankForm();S.rep=-1;S.err={}}
 catch(e){S.msg=e.dup?'Такой ключ уже есть — придумайте другие 4 цифры.':'Не удалось выпустить ключ: '+(e.code==='permission-denied'?'нет прав.':(e.code||e.message));S.ok=false;if(kin)kin.value=''}
 S.busy=false;await keysLoad(refresh,true)}
export function keysReset(){S.loaded=false;S.rows=[]}
