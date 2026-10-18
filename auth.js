import { firebaseConfig } from './firebase-config.js?v=122';
const V='10.12.2', B=`https://www.gstatic.com/firebasejs/${V}/`;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ready=!Object.values(firebaseConfig).some(v=>String(v).includes('PASTE_'));
const link=document.getElementById('authlink');
if(ready){init().catch(e=>console.error('Firebase',e));}
async function init(){
 // Скрытые от других аккаунты (владелец пока не показывается на сайте)
const HID=['646280678736003073','t3t4KPD2bDasFw1gPLWAA0W8jCL2'];window.VPPKA_HIDDEN=x=>!!x&&(HID.includes(String(x.discordId||''))||HID.includes(String(x.uid||''))||HID.includes(String(x.id||'')));
let A,F,auth,db,user=null,profile=null,power={rank:0,roleName:''};
 const crumbs=t=>`<div class="crumbs"><a href="#home">Главная</a> / ${t}</div>`;
 const ERR={'auth/invalid-credential':'Неверный Discord или пароль.','auth/wrong-password':'Неверный пароль.','auth/user-not-found':'Пользователь с таким Discord не зарегистрирован.','auth/email-already-in-use':'Этот Discord уже зарегистрирован. Войдите.','auth/weak-password':'Пароль слишком простой (минимум 6 символов).','auth/too-many-requests':'Слишком много попыток. Попробуйте позже.','auth/network-request-failed':'Нет соединения с сервером.','permission-denied':'Нет доступа к профилю.'};
 const em=e=>ERR[e.code]||('Ошибка: '+(e.code||e.message));
 // discord.com/users/<id> | discordapp.com/users/<id> | @username | username
 function did(raw){const s=String(raw||'').trim();let m=s.match(/^(?:https?:\/\/)?(?:www\.)?(?:discord(?:app)?\.com)\/users\/(\d{15,21})\/?$/i);if(m)return m[1];
  m=s.replace(/^@/,'').toLowerCase();if(/^(?!.*\.\.)[a-z0-9_.]{2,32}$/.test(m))return m;return null;}
 const mail=id=>`${id}@vppka.local`;
 const field=(id,l,t='text',ph='')=>`<label class="fl">${l}<input id="${id}" type="${t}" placeholder="${ph}" autocomplete="${t==='password'?'current-password':'username'}"></label>`;
 // Фото персонажа: до 800px, JPEG q≈0.88, адаптивно ≤ ~190 КБ (лимит в правилах — 200 000 символов)
 function photoData(f){return new Promise((res,rej)=>{if(!f)return res('');if(!/^image\//.test(f.type))return rej(new Error('Выберите файл изображения.'));const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{let s=800,q=.88,u='';for(let i=0;i<10;i++){const k=Math.min(1,s/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);u=c.toDataURL('image/jpeg',q);if(u.length<=190000)return res(u);if(q>.55)q=Math.max(.55,+(q-.08).toFixed(2));else s=Math.round(s*.85);}rej(new Error('Изображение слишком большое.'))};im.onerror=()=>rej(new Error('Не удалось прочитать изображение.'));im.src=r.result};r.readAsDataURL(f);});}
 const photoField=(id,cur)=>`<div class="fl phf">Фото персонажа из игры (необязательно)<div class="phrow"><img id="${id}-pv" class="phpv" alt="" ${cur?`src="${esc(cur)}"`:'hidden'}><div><label class="btn sm o phbtn"><input id="${id}" type="file" accept="image/*" style="display:none">Выбрать файл</label> <span class="phname" id="${id}-nm">Файл не выбран</span><p class="phnote">⚠ Лицо должно быть хорошо видно. Головной убор можно, если не закрывает лицо. JPG/PNG, до ~800px.</p></div></div></div>`;
 const box=(title,body)=>`${crumbs(title)}<div class="pg"><div class="blk auth">${body}</div></div>`;
 P.login=()=>user?P.account():box('Вход',`<h2>Вход</h2>${field('a-d','Discord (ссылка на профиль или имя пользователя)','text','https://discord.com/users/123… или username')}${field('a-p','Пароль','password')}<p class="aerr" id="a-e"></p><button class="btn" id="a-go">Войти</button><p class="amut">Нет аккаунта? <a href="#register">Зарегистрироваться</a></p>`);
 P.register=()=>user?P.account():box('Регистрация',`<h2>Регистрация</h2>${field('r-d','Discord ID или ссылка на профиль','text','https://discord.com/users/123… или 123456789012345678')}<div class="vc-row"><button class="btn sm o" id="r-vreq">Получить код в Discord</button><small class="phc-hint" id="r-vst">Бот ВППКА пришлёт код в личные сообщения. Вы должны быть на нашем Discord-сервере и не запрещать ЛС от участников сервера.</small></div>${field('r-vc','Код из Discord','text','XXXXXXXX')}${field('r-n','Ник (необязательно)')}${field('r-p','Пароль (мин. 6 символов)','password')}${field('r-p2','Повторите пароль','password')}${photoField('r-ph')}${field('r-k','Ключ доступа (необязательно)','password','если выдан руководством')}<p class="aerr" id="a-e"></p><button class="btn" id="r-go">Зарегистрироваться</button><p class="amut">Уже есть аккаунт? <a href="#login">Войти</a></p>`);
 let myApp=null,myAppT=0;async function loadMyApp(){if(myAppT&&Date.now()-myAppT<60000)return;myAppT=Date.now();try{const q=await F.getDocs(F.query(F.collection(db,'applications'),F.where('uid','==',user.uid)));const L=q.docs.map(d=>d.data()).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));myApp=L.find(a=>['accepted','member'].includes(a.status))||L[0]||{};}catch(e){myApp={}}if(location.hash==='#account')window.route()}
 const fv=(id,l,val,ph='')=>`<label class="fl">${l}<input id="${id}" type="text" placeholder="${ph}" value="${esc(val||'')}"></label>`;
 window.VPPKA_SETOPEN=()=>{document.querySelectorAll('body>#set-ov').forEach(x=>x.remove());const o=document.getElementById('set-ov');if(!o)return;document.body.appendChild(o);o.hidden=false};addEventListener('hashchange',()=>document.querySelectorAll('body>#set-ov').forEach(x=>x.remove()));
 const fmtD=t=>t&&t.toDate?t.toDate().toLocaleDateString('ru-RU'):'';
 let priv=null,privT=0;const AV={},PV={};
 // полноразмерная аватарка для больших профилей: avatars/{uid} = avatar||photo (до 800px)
 async function syncAv(){try{const d=profile&&(profile.avatar||profile.photo);if(d)await F.setDoc(F.doc(db,'avatars',user.uid),{d});else await F.deleteDoc(F.doc(db,'avatars',user.uid))}catch(e){console.warn('avatars',e.code||e)}}
 P.account=()=>{if(!user)return P.login();const p=profile||{};if(!myApp)loadMyApp();const ap=myApp||{},ans=ap.answers||{};
  const mem=((window.VPPKA_DATA&&window.VPPKA_DATA.members)||[]).filter(m=>m.discordId&&m.discordId===p.discordId);const lead=mem.find(m=>!String(m.id).startsWith('p_'))||mem[0];
  if(!privT){privT=1;F.getDoc(F.doc(db,'users',user.uid,'priv','p')).then(x=>{priv=x.exists()?x.data():{};if(location.hash==='#account')window.route()}).catch(()=>{priv={}})}const pv=priv||{};const fio=p.fio||ans.fio||'',birth=pv.birth||p.birth||ans.birth||'',pass=pv.passport||p.passport||ans.passport||'';
  const joined=(['accepted','member'].includes(ap.status)&&fmtD(ap.reviewedAt))||(lead&&lead.joined)||(power.rank>0?fmtD(p.createdAt):'')||'';
  const NA='<span class="amut">не указано</span>',row=(k,v)=>`<tr><td>${k}</td><td>${v?esc(v):NA}</td></tr>`;
  const set=`<div class="acc-ov" id="set-ov" hidden onclick="if(event.target===this)this.hidden=true"><div class="acc-md set-md"><button class="acc-x" onclick="document.getElementById('set-ov').hidden=true" aria-label="Закрыть">×</button><h3>Настройки</h3>
  <div class="set-s"><h4 class="phc-h">Данные персонажа</h4>${fv('c-fio','ФИО (фамилия имя отчество)',fio,'Иванов Иван Иванович')}${fv('c-birth','Дата рождения',birth,'дд.мм.гггг')}${fv('c-pass','Номер паспорта (статик)',pass,'000-000')}<p class="aerr" id="c-e"></p><button class="btn sm" id="c-go">Сохранить</button></div>
  <div class="phc"><h4 class="phc-h">Аватар</h4><div class="phc-row"><img id="p-av-pv" class="phc-pv phc-round" alt="" ${p.avatar||p.photo?`src="${esc(p.avatar||p.photo)}"`:'hidden'}><div class="phc-ctl"><div class="phc-btns"><label class="btn sm o"><input id="p-av" type="file" accept="image/*" style="display:none">Выбрать</label><button class="btn sm" id="av-go">Сохранить</button>${p.avatar?'<button class="btn sm o" id="av-rm">Удалить</button>':''}</div><small class="phc-hint"><span id="p-av-nm"></span> Маленькая круглая картинка в списках, чате и шапке.${p.avatar?'':' Сейчас используется фото карточки.'}</small></div></div><p class="aerr" id="av-e"></p></div><div class="phc"><h4 class="phc-h">Фото для карточки</h4><div class="phc-row"><img id="p-ph-pv" class="phc-pv" alt="" ${p.photo?`src="${esc(p.photo)}"`:'hidden'}><div class="phc-ctl"><div class="phc-btns"><label class="btn sm o"><input id="p-ph" type="file" accept="image/*" style="display:none">Выбрать</label><button class="btn sm" id="p-go">Сохранить</button>${p.photo?'<button class="btn sm o" id="p-rm">Удалить</button>':''}</div><small class="phc-hint"><span id="p-ph-nm"></span> Фото персонажа в карточке участника. Лицо видно; головной убор можно, если не закрывает лицо.</small></div></div><p class="aerr" id="p-e"></p></div><div id="vb-slot"></div>
  <div class="set-s"><h4 class="phc-h">Данные аккаунта</h4><table class="tbl"><tr><td>Discord</td><td>${/^https?:/.test(p.discordLink||'')?`<a href="${esc(p.discordLink)}" target="_blank" rel="noopener">${esc(p.discordLink)}</a>`:esc(p.discordLink||p.discordId||'')}</td></tr><tr><td>Discord ID</td><td>${esc(p.discordId||'')}</td></tr></table><details class="acc-pw"><summary>Сменить пароль</summary>${field('pw-c','Текущий пароль','password')}${field('pw-n','Новый пароль (мин. 6 символов)','password')}${field('pw-n2','Повторите новый пароль','password')}<p class="aerr" id="pw-e"></p><button class="btn sm" id="pw-go">Сменить пароль</button></details><details class="acc-pw"><summary>Ключ доступа</summary>${field('k-in','Ключ, выданный руководством','password')}<p class="aerr" id="a-e"></p><div class="phc-btns"><button class="btn sm" id="k-go">Применить ключ</button>${p.keyHash?'<button class="btn sm o" id="k-rm">Снять ключ</button>':''}</div></details></div></div></div>`;
  return box('Личный кабинет',`<h2 class="acc-h2">Личный кабинет<button class="acc-gear" onclick="VPPKA_SETOPEN()" aria-label="Настройки" title="Настройки">⚙</button></h2><div class="phead${p.avatar||p.photo?'':' noav'}"><div id="vb-prev" class="phead-bn"></div>${p.avatar||p.photo?`<img class="phacc" src="${esc(p.avatar||p.photo)}" alt="Аватар">`:''}</div><table class="tbl">${row('ФИО',fio)}${row('Дата рождения',birth)}${row('Номер паспорта',pass)}${row('Дата вступления',joined)}<tr><td>Должность</td><td>${power.rank>0?`<b style="color:var(--gold)">${esc(power.roleName)}</b>`:(p.keyHash?'<span style="color:var(--red)">ключ аннулирован или недействителен</span>':'член сайта, без ключа')}</td></tr></table>${set}<p style="margin-top:20px"><button class="btn o" id="a-out">Выйти</button></p>`)};
 P.user=(uid,mid)=>{if(user&&uid===user.uid){location.replace('#account');return P.account()}
  const ms=(window.VPPKA_DATA&&window.VPPKA_DATA.members)||[],pb=((window.VPPKA_PUBMAP&&window.VPPKA_PUBMAP())||{})[uid];
  const m=ms.find(x=>x.id===mid)||(pb&&pb.did&&ms.find(x=>x.discordId===pb.did));
  if(!m&&!pb)return box('Профиль',user?'<h2>Профиль</h2><p>Загрузка… или профиль не найден.</p>':'<h2>Профиль</h2><p>Профили участников видны после входа.</p>');
  if(user&&AV[uid]===undefined){AV[uid]=null;F.getDoc(F.doc(db,'avatars',uid)).then(x=>{AV[uid]=x.exists()?x.data().d:'';if(location.hash.startsWith('#user/'))window.route()}).catch(()=>{AV[uid]=''})}
  if(user&&PV[uid]===undefined){PV[uid]=null;F.getDoc(F.doc(db,'users',uid,'priv','p')).then(x=>{PV[uid]=x.exists()?x.data():{};if(location.hash.startsWith('#user/'))window.route()}).catch(()=>{PV[uid]=false})}const pr=PV[uid];
  const av=AV[uid]||(m&&m.photo)||(pb&&pb.ph)||'',NA='<span class="amut">не указано</span>',row=(k,v)=>`<tr><td>${k}</td><td>${v?esc(v):NA}</td></tr>`;
  return box('Профиль',`<h2 class="acc-h2">Профиль</h2><div class="phead${av?'':' noav'}"><div id="vb-prev" class="phead-bn" data-uid="${esc(uid)}"></div>${av?`<img class="phacc" src="${esc(av)}" alt="Аватар">`:''}</div><table class="tbl">${row('ФИО',(m&&m.name)||(pb&&pb.n))}${pr?row('Дата рождения',pr.birth)+row('Номер паспорта',pr.passport):''}${row('Дата вступления',m&&m.joined)}${row('Должность',m&&m.role)}</table>`)};
 const err=t=>{const e=document.getElementById('a-e');if(e)e.textContent=t};
 document.addEventListener('click',async ev=>{const id=ev.target.id;const v=x=>(document.getElementById(x)||{}).value||'';
  if(id==='c-go'){const p0=profile||{};const ce=t=>{const e=document.getElementById('c-e');if(e)e.textContent=t};const fio=v('c-fio').trim().replace(/\s+/g,' '),birth=v('c-birth').trim();let pass=v('c-pass').replace(/\s/g,'');
   if(fio&&(fio.length>100||fio.split(' ').length<2))return ce('ФИО: фамилия имя (отчество), до 100 символов.');if(birth&&!/^\d{2}\.\d{2}\.\d{4}$/.test(birth))return ce('Дата рождения в формате дд.мм.гггг.');{const dg=pass.replace(/\D/g,'');if(pass&&dg.length!==6)return ce('Номер паспорта — 6 цифр в формате 000-000.');if(pass)pass=dg.slice(0,3)+'-'+dg.slice(3)}
   const d={fio,birth,passport:pass};const del=F.deleteField();const u={fio:fio||del};if(p0.birth)u.birth=del;if(p0.passport)u.passport=del;const pd={};if(birth)pd.birth=birth;if(pass)pd.passport=pass;try{await F.setDoc(F.doc(db,'users',user.uid,'priv','p'),pd);priv=pd;}catch(e){return ce('Не удалось сохранить личные данные: '+(e.code==='permission-denied'?'нет прав (нужно опубликовать правила базы).':(e.code||e.message)))}
   try{ev.target.disabled=true;await F.updateDoc(F.doc(db,'users',user.uid),u);profile={...(profile||{}),fio};delete profile.birth;delete profile.passport;ce('Сохранено.');setTimeout(()=>{window.route();window.VPPKA_SETOPEN()},300)}catch(e){ev.target.disabled=false;ce('Не удалось: '+(e.code==='permission-denied'?'нет прав (нужно опубликовать правила базы).':(e.code||e.message)))}return}
  if(id==='pw-go'){const pe=t=>{const e=document.getElementById('pw-e');if(e){e.style.color='';e.textContent=t}};
   if(!auth||!user)return pe('Подключение к серверу… попробуйте через секунду.');
   const c=v('pw-c'),n=v('pw-n'),n2=v('pw-n2');if(!c)return pe('Введите текущий пароль.');if(n.length<6)return pe('Новый пароль должен быть не короче 6 символов.');if(n!==n2)return pe('Новые пароли не совпадают.');if(n===c)return pe('Новый пароль совпадает с текущим.');
   ev.target.disabled=true;try{const u=auth.currentUser;await A.reauthenticateWithCredential(u,A.EmailAuthProvider.credential(u.email,c));await A.updatePassword(u,n);['pw-c','pw-n','pw-n2'].forEach(x=>{const el=document.getElementById(x);if(el)el.value=''});pe('Пароль изменён.');document.getElementById('pw-e').style.color='var(--gold)';}
   catch(e){const k=e&&e.code||'';pe(/wrong-password|invalid-credential|invalid-login/.test(k)?'Неверный текущий пароль.':/too-many-requests/.test(k)?'Слишком много попыток. Попробуйте позже.':/weak-password/.test(k)?'Слишком простой новый пароль.':/requires-recent-login/.test(k)?'Выйдите и войдите заново, затем повторите.':/network/.test(k)?'Нет связи с сервером.':'Не удалось сменить пароль: '+(k||e.message));}
   finally{ev.target.disabled=false;}return;}
  try{
  if(['a-go','r-go','a-out','k-go','k-rm'].includes(id)&&!auth)return err('Подключение к серверу… попробуйте через секунду.');
  if(id==='a-go'){const d=did(v('a-d'));if(!d)return err('Неверный формат Discord. Укажите ссылку discord.com/users/… или имя пользователя.');if(!v('a-p'))return err('Введите пароль.');
   ev.target.disabled=true;await A.signInWithEmailAndPassword(auth,mail(d),v('a-p'));location.hash='#account';}
  if(id==='r-vreq'){const d=did(v('r-d'));const st=t=>{const e=document.getElementById('r-vst');if(e){e.textContent=t;e.style.color='var(--gold)'}};if(!d||!/^\d{15,21}$/.test(d))return err('Для подтверждения нужен числовой Discord ID или ссылка discord.com/users/… (Discord → Настройки → Расширенные → Режим разработчика → ПКМ по себе → «Копировать ID»).');err('');
   ev.target.disabled=true;st('Отправляем запрос…');try{const r=await F.addDoc(F.collection(db,'verifyReq'),{did:d,status:'new',t:F.serverTimestamp()});let done=false;
    const un=F.onSnapshot(r,x=>{const s2=(x.data()||{}).status;if(s2==='sent'){done=true;un();st('Код отправлен в личные сообщения Discord. Он действует 15 минут.');ev.target.disabled=false}else if(s2==='dm_failed'){done=true;un();st('');err('Бот не смог написать вам в ЛС. Проверьте, что вы на сервере ВППКА и личные сообщения от участников сервера разрешены, затем повторите.');ev.target.disabled=false}else if(s2==='rate'){done=true;un();st('');err('Код уже отправлялся недавно. Подождите минуту.');ev.target.disabled=false}});
    setTimeout(()=>{if(!done){un();st('');err('Бот не ответил. Возможно, он временно недоступен — попробуйте позже.');ev.target.disabled=false}},90000);}catch(e){ev.target.disabled=false;st('');err('Не удалось запросить код: '+(e.code||e.message))}return;}
  if(id==='r-go'){const raw=v('r-d').trim(),d=did(raw),p=v('r-p'),vc=v('r-vc').trim().toUpperCase();if(!d||!/^\d{15,21}$/.test(d))return err('Укажите числовой Discord ID или ссылку discord.com/users/….');if(!/^[A-Z0-9]{8}$/.test(vc))return err('Введите 8-значный код из Discord (кнопка «Получить код»).');
   if(p.length<6)return err('Пароль должен быть не короче 6 символов.');if(p!==v('r-p2'))return err('Пароли не совпадают.');
   ev.target.disabled=true;const ph=await photoData((document.getElementById('r-ph')||{}).files?.[0]).catch(e=>{err(e.message);return null});if(ph===null){ev.target.disabled=false;return;}
   const c=await A.createUserWithEmailAndPassword(auth,mail(d),p);
   profile={discordLink:raw.slice(0,200),discordId:d,displayName:v('r-n').trim().slice(0,40),createdAt:F.serverTimestamp(),vcode:vc};if(ph)profile.photo=ph;
   let kmsg='';const kk=v('r-k').trim();if(kk){const r=await checkKey(kk,d);if(r.ok)Object.assign(profile,{keyHash:r.h,rank:r.rank,roleName:r.roleName});else kmsg='Ключ не принят: '+r.msg;}
   try{await F.setDoc(F.doc(db,'users',c.user.uid),profile);}catch(e){console.warn('Профиль не сохранён',e);if(profile.keyHash&&!profile.photo){const {keyHash,rank,roleName,...rest}=profile;try{await F.setDoc(F.doc(db,'users',c.user.uid),rest);delete profile.keyHash;delete profile.rank;delete profile.roleName;kmsg=(kmsg?kmsg+' ':'')+'Ключ не применился — введите его ещё раз в кабинете.';}catch(e2){}}if(profile.photo){const {photo,...rest}=profile;try{await F.setDoc(F.doc(db,'users',c.user.uid),rest);delete profile.photo;kmsg=(kmsg?kmsg+' ':'')+'Фото пока не сохранено — загрузите его позже в кабинете.';}catch(e2){}}}try{const chk=await F.getDoc(F.doc(db,'users',c.user.uid));if(!chk.exists()){await c.user.delete().catch(()=>{});profile=null;ev.target.disabled=false;return err('Неверный или просроченный код подтверждения. Запросите новый код.');}}catch(e){}profile.createdAt={toDate:()=>new Date()};await refreshPower();
   location.hash='#account';if(kmsg)setTimeout(()=>err('Аккаунт создан. '+kmsg),50);}
  if(id==='k-go'){const kk=v('k-in').trim();if(!kk)return err('Введите ключ.');ev.target.disabled=true;const r=await checkKey(kk,profile.discordId);if(!r.ok){ev.target.disabled=false;return err(r.msg);}
   await F.updateDoc(F.doc(db,'users',user.uid),{keyHash:r.h,rank:r.rank,roleName:r.roleName});Object.assign(profile,{keyHash:r.h,rank:r.rank,roleName:r.roleName});await refreshPower();route();}
  if(id==='k-rm'){await F.updateDoc(F.doc(db,'users',user.uid),{keyHash:F.deleteField(),rank:F.deleteField(),roleName:F.deleteField()});delete profile.keyHash;delete profile.rank;delete profile.roleName;await refreshPower();route();}
  if(id==='av-go'||id==='av-rm'){const pe=t=>{const e=document.getElementById('av-e');if(e)e.textContent=t};let ph=null;
   if(id==='av-go'){try{ph=await photoData(document.getElementById('p-av').files[0]);}catch(e){return pe(e.message)}if(!ph)return pe('Выберите файл.');}
   ev.target.disabled=true;try{await F.updateDoc(F.doc(db,'users',user.uid),{avatar:ph?ph:F.deleteField()});if(ph)profile.avatar=ph;else delete profile.avatar;paintAuth();route();syncAv();window.VPPKA_PUBSELF&&window.VPPKA_PUBSELF();}catch(e){ev.target.disabled=false;pe(e.code==='permission-denied'?'Сервер пока не принимает аватар (правила базы не обновлены).':em(e));}return;}
  if(id==='p-go'||id==='p-rm'){const pe=t=>{const e=document.getElementById('p-e');if(e)e.textContent=t};let ph=null;
   if(id==='p-go'){try{ph=await photoData(document.getElementById('p-ph').files[0]);}catch(e){return pe(e.message)}if(!ph)return pe('Выберите файл.');}
   ev.target.disabled=true;try{await F.updateDoc(F.doc(db,'users',user.uid),{photo:ph?ph:F.deleteField()});if(ph)profile.photo=ph;else delete profile.photo;paintAuth();route();syncAv();window.VPPKA_PUBSELF&&window.VPPKA_PUBSELF();if(ph&&power.rank>0)syncPhoto().catch(e=>console.warn('автофото',e.code||e));}catch(e){ev.target.disabled=false;pe(e.code==='permission-denied'?'Сервер пока не принимает фото (правила базы не обновлены).':em(e));}return;}
  if(id==='a-out'){await A.signOut(auth);location.hash='#home';}
  }catch(e){err(em(e));ev.target.disabled=false;}
 });
 document.addEventListener('change',async ev=>{const t=ev.target;if(!['r-ph','p-ph','p-av'].includes(t.id))return;const nm=document.getElementById(t.id+'-nm');if(nm)nm.textContent=t.files[0]?.name||'Файл не выбран';const pv=document.getElementById(t.id+'-pv');try{const u=await photoData(t.files[0]);if(pv&&u){pv.src=u;pv.hidden=false;}}catch(e){err(e.message)}});
 paintAuth();
 if(['login','register','account'].includes(location.hash.slice(1)))route();
 const [{initializeApp},A_,F_]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
 A=A_;F=F_;const app=initializeApp(firebaseConfig);auth=A.getAuth(app);db=F.getFirestore(app);
 if(location.hostname==='localhost'&&/[?&]emu\b/.test(location.search)){A.connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});F.connectFirestoreEmulator(db,'127.0.0.1',8080);}
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest&&e.target.closest('.auth')){const b=document.querySelector('.auth .btn');b&&b.click();}});
 const fixU=u=>typeof u==='string'?u.replace(/^(?:https?:\/\/[^\/]+)?\/(?:vppka|VPPKA-RMRP-ARBAT)\/(?=img\/)/i,''):u;const fixD=o=>{if(o.image)o.image=fixU(o.image);if(o.photo)o.photo=fixU(o.photo);if(Array.isArray(o.photos))o.photos=o.photos.map(fixU);return o};
 // одна подписка вместо getDocs+onSnapshot: первый снимок используется как начальная загрузка (экономия чтений)
 let liveOn=false,liveRes=null;
 async function loadData(){if(liveOn){return}liveOn=true;await new Promise(res=>{liveRes=res;setTimeout(res,8000);liveSubs()});}
 const toD=()=>{const D={...(window.VPPKA_DATA||{})};if(liveN&&!liveN.empty)D.news=liveN.docs.map(d=>fixD({...d.data(),id:d.id}));if(liveM&&!liveM.empty)D.members=liveM.docs.map(d=>fixD({...d.data(),id:d.id})).filter(x=>!VPPKA_HIDDEN(x)||['p_Xglv_ypsOH3s7mW2UTXD','m11'].includes(x.id)).sort((a,b)=>(b.rank-a.rank)||((a.order??99)-(b.order??99)));window.VPPKA_DATA=(D.news||D.members)?D:null};
 window.VPPKA_RELOAD=async()=>{await loadData();toD();route();};
 let liveN=null,liveM=null,livePend=false,liveNew=new Set();
 const busy=()=>{const a=document.activeElement;return (a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))||document.querySelector('.asg-ov,.modal:not([hidden])')};
 const liveApply=()=>{if(!liveN&&!liveM)return;if(busy()){livePend=true;return}livePend=false;const D={...(window.VPPKA_DATA||{})};
  if(liveN&&!liveN.empty)D.news=liveN.docs.map(d=>fixD({...d.data(),id:d.id}));if(liveM&&!liveM.empty)D.members=liveM.docs.map(d=>fixD({...d.data(),id:d.id})).filter(x=>!VPPKA_HIDDEN(x)||['p_Xglv_ypsOH3s7mW2UTXD','m11'].includes(x.id)).sort((a,b)=>(b.rank-a.rank)||((a.order??99)-(b.order??99)));
  window.VPPKA_DATA=(D.news||D.members)?D:null;const y=scrollY;route();scrollTo(0,y);
  liveNew.forEach(id=>document.querySelectorAll('a[href="#news/'+id+'"]').forEach(a=>{const it=a.closest('.it,.card,div');it&&it.classList.add('fresh')}));liveNew.clear();};
 document.addEventListener('focusout',()=>setTimeout(()=>{if(livePend)liveApply()},300));
 function liveSubs(){let fn=true,fm=true;const ready=()=>{if(!fn&&!fm&&liveRes){toD();const r=liveRes;liveRes=null;r()}};
  F.onSnapshot(F.collection(db,'news'),s=>{if(fn){fn=false;liveN=s;ready();return}s.docChanges().forEach(c=>{if(c.type==='added')liveNew.add(c.doc.id)});liveN=s;liveApply()},e=>{console.warn('live news',e);fn=false;ready()});
  F.onSnapshot(F.collection(db,'members'),s=>{if(fm){fm=false;liveM=s;ready();return}liveM=s;liveApply()},e=>{console.warn('live members',e);fm=false;ready()});}
 function liveStart(){}
 window.VPPKA_AUTH={get user(){return user},get profile(){return profile},get power(){return power},async submitApplication(answers){if(!user)throw new Error('Чтобы подать заявку, войдите или зарегистрируйтесь на сайте.');const ref=F.doc(db,'applications',user.uid);
  let ex=null;try{ex=await F.getDoc(ref)}catch(e){}if(ex&&ex.exists()){const st=ex.data().status;if(st==='rejected')await F.deleteDoc(ref);else throw new Error(st==='new'?'Ваша заявка уже подана и ждёт рассмотрения.':'Заявка уже рассмотрена.')}
  const d={answers,status:'new',createdAt:F.serverTimestamp(),uid:user.uid};if(profile&&profile.discordId)d.discordId=profile.discordId;await F.setDoc(ref,d);}};
 window.VPPKA_FB={get F(){return F},get db(){return db},get user(){return user},get power(){return power}};
 async function sha(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
 async function checkKey(k,discordId){const h=await sha(k);let s;try{s=await F.getDoc(F.doc(db,'accessKeys',h));}catch(e){return{ok:false,msg:'ключ не найден.'}}
  if(!s.exists())return{ok:false,msg:'ключ не найден.'};const x=s.data();if(x.revoked)return{ok:false,msg:'ключ аннулирован.'};if(x.discordId!==discordId)return{ok:false,msg:'ключ выдан другому пользователю Discord.'};return{ok:true,h,rank:x.rank,roleName:x.roleName};}
 // Живая проверка полномочий: владелец (config/owners) или действующий ключ, привязанный к этому Discord
 async function refreshPower(){power={rank:0,roleName:''};if(!user)return;
  try{const o=await F.getDoc(F.doc(db,'config','owners'));if(o.exists()&&(o.data().uids||[]).includes(user.uid)){power={rank:1000,tier:9,roleName:(profile&&profile.roleName)||'Владелец',members:true,owner:true};return;}}catch(e){}
  const h=profile&&profile.keyHash;if(!h)return;try{const s=await F.getDoc(F.doc(db,'accessKeys',h));const x=s.exists()&&s.data();if(x&&!x.revoked&&x.discordId===profile.discordId&&user.email===profile.discordId+'@vppka.local')power={rank:x.rank,tier:x.tier||0,roleName:x.roleName,chair:x.canEditChairman===true,members:x.canViewMembers===true};}catch(e){}
  if(power.rank>0)syncPhoto().catch(e=>console.warn('автофото',e.code||e));}
 // Автофото: фото из профиля копируется в запись руководства с тем же discordId
 async function syncPhoto(){const ph=profile&&(profile.photo||profile.avatar);if(!ph||!profile.discordId)return;const s=await F.getDocs(F.query(F.collection(db,'members'),F.where('discordId','==',profile.discordId)));let ch=false;
  for(const d of s.docs){if(d.data().photo!==ph){await F.updateDoc(d.ref,{photo:ph,updatedBy:user.uid,updatedAt:F.serverTimestamp()});ch=true;}}if(ch&&window.VPPKA_RELOAD)window.VPPKA_RELOAD();}

 function paintAuth(){
  if(!link)return;
  link.style.display='';
  if(!user){
   link.className='authlink';link.href='#login';link.title='';link.removeAttribute('aria-label');
   link.innerHTML='Войти';return;
  }
  const name=((profile&&profile.displayName)||'').trim()||'Кабинет';
  const ph=profile&&(profile.avatar||profile.photo);
  const ini=name==='Кабинет'?'':name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const person='<svg class="avic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>';
  const av=ph?`<img class="avimg" src="${esc(ph)}" alt="">`:(ini?`<span class="avini" aria-hidden="true">${esc(ini)}</span>`:person);
  link.className='authlink in';link.href='#account';link.title=name;link.setAttribute('aria-label',name);
  const did=profile&&profile.discordId;const mem=did&&((window.VPPKA_DATA||{}).members||[]).find(m=>m.discordId===did);
  const pos=(power.rank>0&&power.roleName)||(mem&&(mem.role||mem.roleName))||(profile&&profile.rank>0&&profile.roleName)||(mem?'Член партии':'');
  link.innerHTML=`<span class="av">${av}</span><span class="avtx"><span class="avname">${esc(name)}</span>${pos?`<span class="avpos">${esc(pos)}</span>`:''}</span>`;
 }

 await loadData();route();liveStart();import('./panel.js?v=122').then(m=>m.install()).catch(e=>console.error('panel',e));import('./notif.js?v=122').then(m=>m.install()).catch(e=>console.error('notif',e));import('./chat.js?v=122').then(m=>m.install()).catch(e=>console.error('chat',e));
 A.onAuthStateChanged(auth,async u=>{user=u;profile=null;
  if(u){try{const s=await F.getDoc(F.doc(db,'users',u.uid));profile=s.exists()?s.data():null;if(!s.exists()){const d0=String(u.email||'').split('@')[0];if(/^[\w.]{2,64}$/.test(d0)){const np={discordId:d0,createdAt:F.serverTimestamp()};if(/^\d{15,21}$/.test(d0))np.discordLink='https://discord.com/users/'+d0;try{await F.setDoc(F.doc(db,'users',u.uid),np);profile={...np,createdAt:{toDate:()=>new Date()}}}catch(e3){console.warn('Профиль не восстановлен',e3)}}}}catch(e){console.warn(e)}}await refreshPower();
  paintAuth();
  if(['login','register','account','join','news','leadership','apps','members','party','member','home',''].includes(location.hash.slice(1).split('/')[0]))route();});
}

document.addEventListener('input',e=>{const t=e.target;if(t&&t.id==='c-pass'){const d=t.value.replace(/\D/g,'').slice(0,6);t.value=d.length>3?d.slice(0,3)+'-'+d.slice(3):d}});
