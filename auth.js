import { firebaseConfig } from './firebase-config.js?v=21';
const V='10.12.2', B=`https://www.gstatic.com/firebasejs/${V}/`;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ready=!Object.values(firebaseConfig).some(v=>String(v).includes('PASTE_'));
const link=document.getElementById('authlink');
if(ready){init().catch(e=>console.error('Firebase',e));}
async function init(){
 let A,F,auth,db,user=null,profile=null,power={rank:0,roleName:''};
 const crumbs=t=>`<div class="crumbs"><a href="#home">Главная</a> / ${t}</div>`;
 const ERR={'auth/invalid-credential':'Неверный Discord или пароль.','auth/wrong-password':'Неверный пароль.','auth/user-not-found':'Пользователь с таким Discord не зарегистрирован.','auth/email-already-in-use':'Этот Discord уже зарегистрирован. Войдите.','auth/weak-password':'Пароль слишком простой (минимум 6 символов).','auth/too-many-requests':'Слишком много попыток. Попробуйте позже.','auth/network-request-failed':'Нет соединения с сервером.','permission-denied':'Нет доступа к профилю.'};
 const em=e=>ERR[e.code]||('Ошибка: '+(e.code||e.message));
 // discord.com/users/<id> | discordapp.com/users/<id> | @username | username
 function did(raw){const s=String(raw||'').trim();let m=s.match(/^(?:https?:\/\/)?(?:www\.)?(?:discord(?:app)?\.com)\/users\/(\d{15,21})\/?$/i);if(m)return m[1];
  m=s.replace(/^@/,'').toLowerCase();if(/^(?!.*\.\.)[a-z0-9_.]{2,32}$/.test(m))return m;return null;}
 const mail=id=>`${id}@vppka.local`;
 const field=(id,l,t='text',ph='')=>`<label class="fl">${l}<input id="${id}" type="${t}" placeholder="${ph}" autocomplete="${t==='password'?'current-password':'username'}"></label>`;
 const box=(title,body)=>`${crumbs(title)}<div class="pg"><div class="blk auth">${body}</div></div>`;
 P.login=()=>user?P.account():box('Вход',`<h2>Вход</h2>${field('a-d','Discord (ссылка на профиль или имя пользователя)','text','https://discord.com/users/123… или username')}${field('a-p','Пароль','password')}<p class="aerr" id="a-e"></p><button class="btn" id="a-go">Войти</button><p class="amut">Нет аккаунта? <a href="#register">Зарегистрироваться</a></p>`);
 P.register=()=>user?P.account():box('Регистрация',`<h2>Регистрация</h2>${field('r-d','Ссылка на профиль Discord или имя пользователя','text','https://discord.com/users/123… или username')}${field('r-n','Ник (необязательно)')}${field('r-p','Пароль (мин. 6 символов)','password')}${field('r-p2','Повторите пароль','password')}${field('r-k','Ключ доступа (необязательно)','password','если выдан руководством')}<p class="aerr" id="a-e"></p><button class="btn" id="r-go">Зарегистрироваться</button><p class="amut">Уже есть аккаунт? <a href="#login">Войти</a></p>`);
 P.account=()=>{if(!user)return P.login();const p=profile||{};const dt=p.createdAt?.toDate?p.createdAt.toDate().toLocaleDateString('ru-RU'):'—';
  return box('Личный кабинет',`<h2>Личный кабинет</h2><table class="tbl">${p.displayName?`<tr><td>Ник</td><td>${esc(p.displayName)}</td></tr>`:''}<tr><td>Discord</td><td>${/^https?:/.test(p.discordLink||'')?`<a href="${esc(p.discordLink)}" target="_blank" rel="noopener">${esc(p.discordLink)}</a>`:esc(p.discordLink||p.discordId||'')}</td></tr><tr><td>Discord ID</td><td>${esc(p.discordId||'')}</td></tr><tr><td>Дата регистрации</td><td>${dt}</td></tr><tr><td>Статус</td><td>${power.rank>0?`<b style="color:var(--gold)">${esc(power.roleName)}</b> (уровень ${power.rank})`:(p.keyHash?'<span style="color:var(--red)">ключ аннулирован или недействителен</span>':'член сайта, без ключа')}</td></tr></table>
  ${power.rank>0?`<p style="margin-top:16px"><a class="btn sm" href="#apps">Заявки в партию</a> <a class="btn sm o" href="#news">Новости</a> <a class="btn sm o" href="#leadership">Руководство</a></p>`:''}
  <h3 style="margin-top:22px">Ключ доступа</h3>${field('k-in','Введите ключ, выданный руководством','password')}<p class="aerr" id="a-e"></p><button class="btn sm" id="k-go">Применить ключ</button>${p.keyHash?' <button class="btn sm o" id="k-rm">Снять ключ</button>':''}<p style="margin-top:20px"><button class="btn o" id="a-out">Выйти</button></p>`)};
 const err=t=>{const e=document.getElementById('a-e');if(e)e.textContent=t};
 document.addEventListener('click',async ev=>{const id=ev.target.id;const v=x=>(document.getElementById(x)||{}).value||'';
  try{
  if(['a-go','r-go','a-out','k-go','k-rm'].includes(id)&&!auth)return err('Подключение к серверу… попробуйте через секунду.');
  if(id==='a-go'){const d=did(v('a-d'));if(!d)return err('Неверный формат Discord. Укажите ссылку discord.com/users/… или имя пользователя.');if(!v('a-p'))return err('Введите пароль.');
   ev.target.disabled=true;await A.signInWithEmailAndPassword(auth,mail(d),v('a-p'));location.hash='#account';}
  if(id==='r-go'){const raw=v('r-d').trim(),d=did(raw),p=v('r-p');if(!d)return err('Неверный формат Discord. Укажите ссылку discord.com/users/… или имя пользователя.');
   if(p.length<6)return err('Пароль должен быть не короче 6 символов.');if(p!==v('r-p2'))return err('Пароли не совпадают.');
   ev.target.disabled=true;const c=await A.createUserWithEmailAndPassword(auth,mail(d),p);
   profile={discordLink:raw.slice(0,200),discordId:d,displayName:v('r-n').trim().slice(0,40),createdAt:F.serverTimestamp()};
   let kmsg='';const kk=v('r-k').trim();if(kk){const r=await checkKey(kk,d);if(r.ok)Object.assign(profile,{keyHash:r.h,rank:r.rank,roleName:r.roleName});else kmsg=r.msg;}
   try{await F.setDoc(F.doc(db,'users',c.user.uid),profile);}catch(e){console.warn('Профиль не сохранён',e);}profile.createdAt={toDate:()=>new Date()};await refreshPower();
   location.hash='#account';if(kmsg)setTimeout(()=>err('Аккаунт создан, но ключ не принят: '+kmsg),50);}
  if(id==='k-go'){const kk=v('k-in').trim();if(!kk)return err('Введите ключ.');ev.target.disabled=true;const r=await checkKey(kk,profile.discordId);if(!r.ok){ev.target.disabled=false;return err(r.msg);}
   await F.updateDoc(F.doc(db,'users',user.uid),{keyHash:r.h,rank:r.rank,roleName:r.roleName});Object.assign(profile,{keyHash:r.h,rank:r.rank,roleName:r.roleName});await refreshPower();route();}
  if(id==='k-rm'){await F.updateDoc(F.doc(db,'users',user.uid),{keyHash:F.deleteField(),rank:F.deleteField(),roleName:F.deleteField()});delete profile.keyHash;delete profile.rank;delete profile.roleName;await refreshPower();route();}
  if(id==='a-out'){await A.signOut(auth);location.hash='#home';}
  }catch(e){err(em(e));ev.target.disabled=false;}
 });
 if(link)link.style.display='';
 if(['login','register','account'].includes(location.hash.slice(1)))route();
 const [{initializeApp},A_,F_]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
 A=A_;F=F_;const app=initializeApp(firebaseConfig);auth=A.getAuth(app);db=F.getFirestore(app);
 if(location.hostname==='localhost'&&/[?&]emu\b/.test(location.search)){A.connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});F.connectFirestoreEmulator(db,'127.0.0.1',8080);}
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest&&e.target.closest('.auth')){const b=document.querySelector('.auth .btn');b&&b.click();}});
 async function loadData(){try{const [n,m]=await Promise.all([F.getDocs(F.collection(db,'news')),F.getDocs(F.collection(db,'members'))]);const D={};
  if(!n.empty)D.news=n.docs.map(d=>({...d.data(),id:d.id}));if(!m.empty)D.members=m.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>(b.rank-a.rank)||((a.order??99)-(b.order??99)));
  window.VPPKA_DATA=(D.news||D.members)?D:null;}catch(e){console.warn('Firestore данные недоступны, используется content.json',e)}}
 window.VPPKA_RELOAD=async()=>{await loadData();route();};
 window.VPPKA_AUTH={get user(){return user},get profile(){return profile},get power(){return power},async submitApplication(answers){const d={answers,status:'new',createdAt:F.serverTimestamp()};if(user){d.uid=user.uid;if(profile&&profile.discordId)d.discordId=profile.discordId;}await F.addDoc(F.collection(db,'applications'),d);}};
 window.VPPKA_FB={get F(){return F},get db(){return db},get user(){return user},get power(){return power}};
 async function sha(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
 async function checkKey(k,discordId){const h=await sha(k);let s;try{s=await F.getDoc(F.doc(db,'accessKeys',h));}catch(e){return{ok:false,msg:'ключ не найден.'}}
  if(!s.exists())return{ok:false,msg:'ключ не найден.'};const x=s.data();if(x.revoked)return{ok:false,msg:'ключ аннулирован.'};if(x.discordId!==discordId)return{ok:false,msg:'ключ выдан другому пользователю Discord.'};return{ok:true,h,rank:x.rank,roleName:x.roleName};}
 // Живая проверка полномочий: владелец (config/owners) или действующий ключ, привязанный к этому Discord
 async function refreshPower(){power={rank:0,roleName:''};if(!user)return;
  try{const o=await F.getDoc(F.doc(db,'config','owners'));if(o.exists()&&(o.data().uids||[]).includes(user.uid)){power={rank:1000,roleName:'Владелец'};return;}}catch(e){}
  const h=profile&&profile.keyHash;if(!h)return;try{const s=await F.getDoc(F.doc(db,'accessKeys',h));const x=s.exists()&&s.data();if(x&&!x.revoked&&x.discordId===profile.discordId&&user.email===profile.discordId+'@vppka.local')power={rank:x.rank,roleName:x.roleName};}catch(e){}}
 await loadData();route();import('./panel.js?v=21').then(m=>m.install()).catch(e=>console.error('panel',e));
 A.onAuthStateChanged(auth,async u=>{user=u;profile=null;
  if(u){try{const s=await F.getDoc(F.doc(db,'users',u.uid));profile=s.exists()?s.data():null;}catch(e){console.warn(e)}}await refreshPower();
  if(link){link.style.display='';link.textContent=u?((profile&&profile.displayName)||'Кабинет'):'Войти';link.href=u?'#account':'#login';}
  if(['login','register','account','join','news','leadership','apps'].includes(location.hash.slice(1).split('/')[0]))route();});
}
