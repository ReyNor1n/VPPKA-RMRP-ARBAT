import { firebaseConfig } from './firebase-config.js?v=75';
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
 const photoField=(id,cur)=>`<div class="fl phf">Фото персонажа из игры (необязательно)<div class="phrow"><img id="${id}-pv" class="phpv" alt="" src="${esc(cur||'')}"${cur?'':' hidden'}><div><label class="btn sm o phbtn"><input id="${id}" type="file" accept="image/*" style="display:none">Выбрать файл</label> <span class="phname" id="${id}-nm">Файл не выбран</span><p class="phnote">⚠ Фото персонажа <b>без головного убора</b>, лицо хорошо видно. JPG/PNG, будет уменьшено до ~800px.</p></div></div></div>`;
 const box=(title,body)=>`${crumbs(title)}<div class="pg"><div class="blk auth">${body}</div></div>`;
 P.login=()=>user?P.account():box('Вход',`<h2>Вход</h2>${field('a-d','Discord (ссылка на профиль или имя пользователя)','text','https://discord.com/users/123… или username')}${field('a-p','Пароль','password')}<p class="aerr" id="a-e"></p><button class="btn" id="a-go">Войти</button><p class="amut">Нет аккаунта? <a href="#register">Зарегистрироваться</a></p>`);
 P.register=()=>user?P.account():box('Регистрация',`<h2>Регистрация</h2>${field('r-d','Ссылка на профиль Discord или имя пользователя','text','https://discord.com/users/123… или username')}${field('r-n','Ник (необязательно)')}${field('r-p','Пароль (мин. 6 символов)','password')}${field('r-p2','Повторите пароль','password')}${photoField('r-ph')}${field('r-k','Ключ доступа (необязательно)','password','если выдан руководством')}<p class="aerr" id="a-e"></p><button class="btn" id="r-go">Зарегистрироваться</button><p class="amut">Уже есть аккаунт? <a href="#login">Войти</a></p>`);
 P.account=()=>{if(!user)return P.login();const p=profile||{};const dt=p.createdAt?.toDate?p.createdAt.toDate().toLocaleDateString('ru-RU'):'—';
  return box('Личный кабинет',`<h2>Личный кабинет</h2>${p.photo?`<img class="phacc" src="${esc(p.photo)}" alt="Фото персонажа">`:''}<table class="tbl">${p.displayName?`<tr><td>Ник</td><td>${esc(p.displayName)}</td></tr>`:''}<tr class="acc-row" onclick="document.getElementById('acc-ov').hidden=false"><td colspan="2">Данные аккаунта <span style="float:right;opacity:.6">›</span></td></tr><tr><td>Дата регистрации</td><td>${dt}</td></tr><tr><td>Статус</td><td>${power.rank>0?`<b style="color:var(--gold)">${esc(power.roleName)}</b> (уровень ${power.rank})`:(p.keyHash?'<span style="color:var(--red)">ключ аннулирован или недействителен</span>':'член сайта, без ключа')}</td></tr></table>
  ${power.rank>0?`<p class="amut" style="margin-top:16px">Ступень ключа: ${power.tier||0}${(power.tier||0)>=4?' — приём, повышение/понижение младших ступеней, новости':(power.tier||0)>=3?' — приём заявок':''}</p><p><a class="btn sm" href="#apps">Заявки в партию</a>${(power.tier||0)>=4?' <a class="btn sm o" href="#news">Новости</a>':''}${(power.tier||0)>=4||power.chair?' <a class="btn sm o" href="#leadership">Руководство</a>':''}${power.members||power.rank>=1000?' <a class="btn sm o" href="#members">Участники партии</a>':''}</p>`:''}
  <h3 style="margin-top:22px">Фото персонажа</h3>${photoField('p-ph',p.photo)}<button class="btn sm" id="p-go">Сохранить фото</button>${p.photo?' <button class="btn sm o" id="p-rm">Удалить фото</button>':''}<p class="aerr" id="p-e"></p>
  <h3 style="margin-top:22px">Ключ доступа</h3>${field('k-in','Введите ключ, выданный руководством','password')}<p class="aerr" id="a-e"></p><button class="btn sm" id="k-go">Применить ключ</button>${p.keyHash?' <button class="btn sm o" id="k-rm">Снять ключ</button>':''}<div class="acc-ov" id="acc-ov" hidden onclick="if(event.target===this)this.hidden=true"><div class="acc-md"><button class="acc-x" onclick="document.getElementById('acc-ov').hidden=true" aria-label="Закрыть">×</button><h3>Данные аккаунта</h3><table class="tbl"><tr><td>Discord</td><td>${/^https?:/.test(p.discordLink||'')?`<a href="${esc(p.discordLink)}" target="_blank" rel="noopener">${esc(p.discordLink)}</a>`:esc(p.discordLink||p.discordId||'')}</td></tr><tr><td>Discord ID</td><td>${esc(p.discordId||'')}</td></tr></table><details class="acc-pw"><summary>Сменить пароль</summary>${field('pw-c','Текущий пароль','password')}${field('pw-n','Новый пароль (мин. 6 символов)','password')}${field('pw-n2','Повторите новый пароль','password')}<p class="aerr" id="pw-e"></p><button class="btn sm" id="pw-go">Сменить пароль</button></details></div></div><p style="margin-top:20px"><button class="btn o" id="a-out">Выйти</button></p>`)};
 const err=t=>{const e=document.getElementById('a-e');if(e)e.textContent=t};
 document.addEventListener('click',async ev=>{const id=ev.target.id;const v=x=>(document.getElementById(x)||{}).value||'';
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
  if(id==='r-go'){const raw=v('r-d').trim(),d=did(raw),p=v('r-p');if(!d)return err('Неверный формат Discord. Укажите ссылку discord.com/users/… или имя пользователя.');
   if(p.length<6)return err('Пароль должен быть не короче 6 символов.');if(p!==v('r-p2'))return err('Пароли не совпадают.');
   ev.target.disabled=true;const ph=await photoData((document.getElementById('r-ph')||{}).files?.[0]).catch(e=>{err(e.message);return null});if(ph===null){ev.target.disabled=false;return;}
   const c=await A.createUserWithEmailAndPassword(auth,mail(d),p);
   profile={discordLink:raw.slice(0,200),discordId:d,displayName:v('r-n').trim().slice(0,40),createdAt:F.serverTimestamp()};if(ph)profile.photo=ph;
   let kmsg='';const kk=v('r-k').trim();if(kk){const r=await checkKey(kk,d);if(r.ok)Object.assign(profile,{keyHash:r.h,rank:r.rank,roleName:r.roleName});else kmsg='Ключ не принят: '+r.msg;}
   try{await F.setDoc(F.doc(db,'users',c.user.uid),profile);}catch(e){console.warn('Профиль не сохранён',e);if(profile.keyHash&&!profile.photo){const {keyHash,rank,roleName,...rest}=profile;try{await F.setDoc(F.doc(db,'users',c.user.uid),rest);delete profile.keyHash;delete profile.rank;delete profile.roleName;kmsg=(kmsg?kmsg+' ':'')+'Ключ не применился — введите его ещё раз в кабинете.';}catch(e2){}}if(profile.photo){const {photo,...rest}=profile;try{await F.setDoc(F.doc(db,'users',c.user.uid),rest);delete profile.photo;kmsg=(kmsg?kmsg+' ':'')+'Фото пока не сохранено — загрузите его позже в кабинете.';}catch(e2){}}}profile.createdAt={toDate:()=>new Date()};await refreshPower();
   location.hash='#account';if(kmsg)setTimeout(()=>err('Аккаунт создан. '+kmsg),50);}
  if(id==='k-go'){const kk=v('k-in').trim();if(!kk)return err('Введите ключ.');ev.target.disabled=true;const r=await checkKey(kk,profile.discordId);if(!r.ok){ev.target.disabled=false;return err(r.msg);}
   await F.updateDoc(F.doc(db,'users',user.uid),{keyHash:r.h,rank:r.rank,roleName:r.roleName});Object.assign(profile,{keyHash:r.h,rank:r.rank,roleName:r.roleName});await refreshPower();route();}
  if(id==='k-rm'){await F.updateDoc(F.doc(db,'users',user.uid),{keyHash:F.deleteField(),rank:F.deleteField(),roleName:F.deleteField()});delete profile.keyHash;delete profile.rank;delete profile.roleName;await refreshPower();route();}
  if(id==='p-go'||id==='p-rm'){const pe=t=>{const e=document.getElementById('p-e');if(e)e.textContent=t};let ph=null;
   if(id==='p-go'){try{ph=await photoData(document.getElementById('p-ph').files[0]);}catch(e){return pe(e.message)}if(!ph)return pe('Выберите файл.');}
   ev.target.disabled=true;try{await F.updateDoc(F.doc(db,'users',user.uid),{photo:ph?ph:F.deleteField()});if(ph)profile.photo=ph;else delete profile.photo;paintAuth();route();if(ph&&power.rank>0)syncPhoto().catch(e=>console.warn('автофото',e.code||e));}catch(e){ev.target.disabled=false;pe(e.code==='permission-denied'?'Сервер пока не принимает фото (правила базы не обновлены).':em(e));}return;}
  if(id==='a-out'){await A.signOut(auth);location.hash='#home';}
  }catch(e){err(em(e));ev.target.disabled=false;}
 });
 document.addEventListener('change',async ev=>{const t=ev.target;if(t.id!=='r-ph'&&t.id!=='p-ph')return;const nm=document.getElementById(t.id+'-nm');if(nm)nm.textContent=t.files[0]?.name||'Файл не выбран';const pv=document.getElementById(t.id+'-pv');try{const u=await photoData(t.files[0]);if(pv&&u){pv.src=u;pv.hidden=false;}}catch(e){err(e.message)}});
 paintAuth();
 if(['login','register','account'].includes(location.hash.slice(1)))route();
 const [{initializeApp},A_,F_]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
 A=A_;F=F_;const app=initializeApp(firebaseConfig);auth=A.getAuth(app);db=F.getFirestore(app);
 if(location.hostname==='localhost'&&/[?&]emu\b/.test(location.search)){A.connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});F.connectFirestoreEmulator(db,'127.0.0.1',8080);}
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest&&e.target.closest('.auth')){const b=document.querySelector('.auth .btn');b&&b.click();}});
 const fixU=u=>typeof u==='string'?u.replace(/^(?:https?:\/\/[^\/]+)?\/(?:vppka|VPPKA-RMRP-ARBAT)\/(?=img\/)/i,''):u;const fixD=o=>{if(o.image)o.image=fixU(o.image);if(o.photo)o.photo=fixU(o.photo);if(Array.isArray(o.photos))o.photos=o.photos.map(fixU);return o};
 async function loadData(){try{const [n,m]=await Promise.all([F.getDocs(F.collection(db,'news')),F.getDocs(F.collection(db,'members'))]);const D={};
  if(!n.empty)D.news=n.docs.map(d=>fixD({...d.data(),id:d.id}));if(!m.empty)D.members=m.docs.map(d=>fixD({...d.data(),id:d.id})).filter(x=>!VPPKA_HIDDEN(x)||['p_Xglv_ypsOH3s7mW2UTXD','m11'].includes(x.id)).sort((a,b)=>(b.rank-a.rank)||((a.order??99)-(b.order??99)));
  window.VPPKA_DATA=(D.news||D.members)?D:null;}catch(e){console.warn('Firestore данные недоступны, используется content.json',e)}}
 window.VPPKA_RELOAD=async()=>{await loadData();route();};
 let liveN=null,liveM=null,livePend=false,liveNew=new Set();
 const busy=()=>{const a=document.activeElement;return (a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))||document.querySelector('.asg-ov,.modal:not([hidden])')};
 const liveApply=()=>{if(!liveN&&!liveM)return;if(busy()){livePend=true;return}livePend=false;const D={...(window.VPPKA_DATA||{})};
  if(liveN&&!liveN.empty)D.news=liveN.docs.map(d=>fixD({...d.data(),id:d.id}));if(liveM&&!liveM.empty)D.members=liveM.docs.map(d=>fixD({...d.data(),id:d.id})).filter(x=>!VPPKA_HIDDEN(x)||['p_Xglv_ypsOH3s7mW2UTXD','m11'].includes(x.id)).sort((a,b)=>(b.rank-a.rank)||((a.order??99)-(b.order??99)));
  window.VPPKA_DATA=(D.news||D.members)?D:null;const y=scrollY;route();scrollTo(0,y);
  liveNew.forEach(id=>document.querySelectorAll('a[href="#news/'+id+'"]').forEach(a=>{const it=a.closest('.it,.card,div');it&&it.classList.add('fresh')}));liveNew.clear();};
 document.addEventListener('focusout',()=>setTimeout(()=>{if(livePend)liveApply()},300));
 function liveStart(){let fn=true,fm=true;
  F.onSnapshot(F.collection(db,'news'),s=>{if(fn){fn=false;liveN=s;return}s.docChanges().forEach(c=>{if(c.type==='added')liveNew.add(c.doc.id)});liveN=s;liveApply()},e=>console.warn('live news',e));
  F.onSnapshot(F.collection(db,'members'),s=>{if(fm){fm=false;liveM=s;return}liveM=s;liveApply()},e=>console.warn('live members',e));}
 window.VPPKA_AUTH={get user(){return user},get profile(){return profile},get power(){return power},async submitApplication(answers){const d={answers,status:'new',createdAt:F.serverTimestamp()};if(user){d.uid=user.uid;if(profile&&profile.discordId)d.discordId=profile.discordId;}await F.addDoc(F.collection(db,'applications'),d);}};
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
 async function syncPhoto(){const ph=profile&&profile.photo;if(!ph||!profile.discordId)return;const s=await F.getDocs(F.query(F.collection(db,'members'),F.where('discordId','==',profile.discordId)));let ch=false;
  for(const d of s.docs){if(d.data().photo!==ph){await F.updateDoc(d.ref,{photo:ph,updatedBy:user.uid,updatedAt:F.serverTimestamp()});ch=true;}}if(ch&&window.VPPKA_RELOAD)window.VPPKA_RELOAD();}

 function paintAuth(){
  if(!link)return;
  link.style.display='';
  if(!user){
   link.className='authlink';link.href='#login';link.title='';link.removeAttribute('aria-label');
   link.innerHTML='Войти';return;
  }
  const name=((profile&&profile.displayName)||'').trim()||'Кабинет';
  const ph=profile&&profile.photo;
  const ini=name==='Кабинет'?'':name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const person='<svg class="avic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>';
  const av=ph?`<img class="avimg" src="${esc(ph)}" alt="">`:(ini?`<span class="avini" aria-hidden="true">${esc(ini)}</span>`:person);
  link.className='authlink in';link.href='#account';link.title=name;link.setAttribute('aria-label',name);
  const did=profile&&profile.discordId;const mem=did&&((window.VPPKA_DATA||{}).members||[]).find(m=>m.discordId===did);
  const pos=(power.rank>0&&power.roleName)||(mem&&(mem.role||mem.roleName))||(profile&&profile.rank>0&&profile.roleName)||(mem?'Член партии':'');
  link.innerHTML=`<span class="av">${av}</span><span class="avtx"><span class="avname">${esc(name)}</span>${pos?`<span class="avpos">${esc(pos)}</span>`:''}</span>`;
 }

 await loadData();route();liveStart();import('./panel.js?v=75').then(m=>m.install()).catch(e=>console.error('panel',e));import('./notif.js?v=75').then(m=>m.install()).catch(e=>console.error('notif',e));import('./chat.js?v=75').then(m=>m.install()).catch(e=>console.error('chat',e));
 A.onAuthStateChanged(auth,async u=>{user=u;profile=null;
  if(u){try{const s=await F.getDoc(F.doc(db,'users',u.uid));profile=s.exists()?s.data():null;if(!s.exists()){const d0=String(u.email||'').split('@')[0];if(/^[\w.]{2,64}$/.test(d0)){const np={discordId:d0,createdAt:F.serverTimestamp()};if(/^\d{15,21}$/.test(d0))np.discordLink='https://discord.com/users/'+d0;try{await F.setDoc(F.doc(db,'users',u.uid),np);profile={...np,createdAt:{toDate:()=>new Date()}}}catch(e3){console.warn('Профиль не восстановлен',e3)}}}}catch(e){console.warn(e)}}await refreshPower();
  paintAuth();
  if(['login','register','account','join','news','leadership','apps','members','party','member','home',''].includes(location.hash.slice(1).split('/')[0]))route();});
}
