// v262: раздел #admin → «Настройки сайта» (только владелец; content/settings, правило content: запись isSuper).
// Значения по умолчанию — VPPKA_CFG_DEF из app.js (прежний вид сайта): пока ничего не изменено, сайт выглядит как раньше.
const FB=()=>window.VPPKA_FB,F=()=>FB().F,db=()=>FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
// [группа, заголовок, [[ключ, подпись, тип, min, max]]] — тип: n (число), s (строка), t (текст), l (ссылки: «Подпись | #адрес или https://…», по строке). Видимость и место блоков — раздел «Раскладка страниц».
const SCHEMA=[
 ['home','Главная: содержимое блоков',[['announceMax','Объявлений в окне','n',1,3],['newsCount','Новостей на главной','n',1,10],['membersNew','«Новые члены партии»: сколько показать','n',0,10],
  ['joinTitle','Заголовок блока вступления','s'],['joinText','Текст блока вступления','t'],['joinBtn','Надпись на кнопке','s']]],
 ['music','Музыка',[['volume','Громкость по умолчанию, % (пока посетитель не двигал ползунок)','n',0,100],['aboutSrc','Трек страницы «О партии» (файл или https-ссылка)','s'],['aboutVol','Громкость трека «О партии», %','n',0,100],['profileVol','Громкость музыки в профилях, %','n',0,100],['sfxVol','Громкость звуков интерфейса (щелчки), %','n',0,100]]],
 ['footer','Подвал: колонки ссылок',[['t1','Заголовок 1-й колонки','s'],['l1','Ссылки 1-й колонки','l'],['t2','Заголовок 2-й колонки','s'],['l2','Ссылки 2-й колонки','l'],['t3','Заголовок колонки «Связь» (ссылки — из раздела «Контакты»)','s']]],
 ['discord','Discord',[]]
];
// Что настраивается в других разделах — подсказка, чтобы «всё» находилось с одного места
const MAP=[['Порядок, размер и видимость блоков — перетаскиванием на самой странице','lay'],['Объявления','an'],['Название, лозунг, девиз, герб, баннер, текст подвала','site'],['Главная: заголовок и текст вступления, цитаты руководителей','home'],['О партии, Программа, Устав, Правовая база, Контакты','about'],['Руководство: состав, порядок, звания','members'],['Баннеры','banners'],['Новости, Мероприятия, Голосования','news'],['Каналы Discord (вебхуки — только владелец)','dch'],['Ключи доступа (ступень 7+)','keys']];
const S={data:null,base:null,msg:'',ok:false,busy:false};
const DEF=()=>window.VPPKA_CFG_DEF||{};
const say=(t,ok)=>{S.msg=t||'';S.ok=!!ok};
export async function cfgLoad(refresh){S.data=null;refresh();let s={};try{const d=await F().getDoc(F().doc(db(),'content','settings'));if(d.exists())s=d.data()}catch(e){say(e.code==='permission-denied'?'Нет прав.':e.message)}
 const D=DEF(),o={};for(const g in D)o[g]={...clone(D[g]),...(s[g]&&typeof s[g]==='object'&&!Array.isArray(s[g])?clone(s[g]):{})};S.data=o;S.base=JSON.stringify(o);refresh()}
function field(g,[k,l,t,mn,mx]){const v=S.data[g][k],d=DEF()[g][k],ch=JSON.stringify(v)!==JSON.stringify(d),id=`cf-${g}-${k}`,mark=ch?'<i class="acf-ch" title="Изменено">●</i>':'';
 if(t==='n')return `<label class="acf-r"><span>${esc(l)}${mark}</span><input type="number" id="${id}" data-cf="${g}.${k}" data-ct="n" min="${mn}" max="${mx}" value="${esc(v)}"></label>`;
 if(t==='l')return `<label class="acf-r acf-w"><span>${esc(l)}${mark}</span><textarea id="${id}" data-cf="${g}.${k}" data-ct="l" rows="${Math.max(3,(v||[]).length+1)}" placeholder="Подпись | #адрес">${esc((v||[]).map(x=>x.label+' | '+x.href).join('\n'))}</textarea></label>`;
 if(t==='t')return `<label class="acf-r acf-w"><span>${esc(l)}${mark}</span><textarea id="${id}" data-cf="${g}.${k}" data-ct="s" rows="3">${esc(v)}</textarea></label>`;
 return `<label class="acf-r acf-w"><span>${esc(l)}${mark}</span><input id="${id}" data-cf="${g}.${k}" data-ct="s" value="${esc(v)}"></label>`}
function discordHTML(){const d=S.data.discord,R=Array.isArray(d.roles)?d.roles:[],dr=(d.defRoles||[]).map(String);
 return `<p class="amut">Роли, которые можно упомянуть при отправке объявления в Discord. @everyone и @here бот не упоминает никогда. Отмеченные «по умолчанию» уже выбраны в форме.</p>
<div class="acf-roles">${R.map((r,i)=>`<div class="acf-role"><input data-crole="${i}" data-ck="label" maxlength="40" value="${esc(r.label)}" placeholder="Подпись"><input data-crole="${i}" data-ck="id" maxlength="21" value="${esc(r.id)}" placeholder="ID роли" inputmode="numeric"><label class="aan-ck"><input type="checkbox" data-crdef="${esc(r.id)}"${dr.includes(String(r.id))?' checked':''}> по умолчанию</label><button type="button" class="btn sm o kp-del" data-cfa="rdel" data-i="${i}">✕</button></div>`).join('')}</div>
<button type="button" class="btn sm o" data-cfa="radd">+ Роль</button>`}
export function cfgHTML(){if(!S.data)return '<p>Загрузка…</p>';const dirty=JSON.stringify(S.data)!==S.base;
 return `<div class="acf"><div class="acf-top"><p class="amut">Изменённые значения отмечены <i class="acf-ch">●</i>. По умолчанию — как сейчас на сайте.</p><span class="acf-act"><button type="button" class="btn sm" data-cfa="save"${S.busy?' disabled':''}>Сохранить${dirty?' *':''}</button><button type="button" class="btn sm o" data-cfa="reload">Отменить правки</button></span></div>
<p class="${S.ok?'af-ok':'aerr'}">${esc(S.msg)}</p>
${SCHEMA.map(([g,t,fs],i)=>`<details class="acf-g"${i<2?' open':''}><summary>${esc(t)}</summary><div class="acf-b2">${g==='discord'?discordHTML():fs.map(f=>field(g,f)).join('')}</div><div class="acf-ft"><button type="button" class="btn sm o" data-cfa="reset" data-g="${g}">Сбросить «${esc(t)}» по умолчанию</button></div></details>`).join('')}
<details class="acf-g"><summary>Где настраивается остальное</summary><ul class="acf-map">${MAP.map(([t,tab])=>`<li><button type="button" class="acf-lnk" data-adtab="${tab}">${esc(t)} →</button></li>`).join('')}</ul></details></div>`}
function grab(){if(!S.data)return;document.querySelectorAll('[data-cf]').forEach(el=>{const [g,k]=el.dataset.cf.split('.');const t=el.dataset.ct;
  S.data[g][k]=t==='l'?el.value.split('\n').map(s=>{const i=s.lastIndexOf('|');return i<0?null:{label:s.slice(0,i).trim().slice(0,60),href:s.slice(i+1).trim().slice(0,300)}}).filter(x=>x&&x.label&&/^(#[\w\/-]*|https:\/\/\S+)$/.test(x.href)).slice(0,12):t==='n'?(el.value===''?DEF()[g][k]:Math.min(+el.max,Math.max(+el.min,Math.round(+el.value)))):el.value});
 const R=S.data.discord.roles=(S.data.discord.roles||[]).map(r=>({...r}));document.querySelectorAll('[data-crole]').forEach(el=>{const r=R[+el.dataset.crole];if(r)r[el.dataset.ck]=el.value.trim()});
 if(document.querySelector('[data-crdef]')||!R.length)S.data.discord.defRoles=[...document.querySelectorAll('[data-crdef]')].filter(x=>x.checked).map(x=>x.dataset.crdef)}
export async function cfgClick(b,refresh){const k=b.dataset.cfa;if(!k)return false;grab();
 if(k==='reload'){say('');await cfgLoad(refresh);return true}
 if(k==='reset'){S.data[b.dataset.g]=clone(DEF()[b.dataset.g]);say('Сброшено — нажмите «Сохранить».',true);refresh();return true}
 if(k==='radd'){S.data.discord.roles.push({id:'',label:''});refresh();return true}
 if(k==='rdel'){S.data.discord.roles.splice(+b.dataset.i,1);refresh();return true}
 if(k==='save'){const R=S.data.discord.roles.filter(r=>r.id||r.label);if(R.some(r=>!/^\d{15,21}$/.test(r.id)||!r.label)){say('У каждой роли нужны подпись и ID (15–21 цифра).');refresh();return true}
  S.data.discord.roles=R;S.data.discord.defRoles=(S.data.discord.defRoles||[]).filter(id=>R.some(r=>r.id===id));
  if(!String(S.data.home.joinTitle).trim()||!String(S.data.home.joinBtn).trim()){say('Заголовок и надпись кнопки вступления не могут быть пустыми.');refresh();return true}
  S.busy=true;refresh();try{await F().setDoc(F().doc(db(),'content','settings'),S.data,{merge:true});S.base=JSON.stringify(S.data);window.VPPKA_APPLY_CONTENT&&window.VPPKA_APPLY_CONTENT({settings:{...((window.VPPKA_C&&window.VPPKA_C()||{}).settings||{}),...clone(S.data)}});say('Сохранено. На сайте — сразу.',true)}
  catch(e){say(e.code==='permission-denied'?'Нет прав: настройки меняет только владелец.':e.message)}S.busy=false;refresh();return true}
 return false}
