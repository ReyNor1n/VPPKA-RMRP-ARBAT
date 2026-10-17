import { firebaseConfig } from './firebase-config.js?v=20';
const V='10.12.2', B=`https://www.gstatic.com/firebasejs/${V}/`;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ready=!Object.values(firebaseConfig).some(v=>String(v).includes('PASTE_'));
const link=document.getElementById('authlink');
if(ready){init().catch(e=>console.error('Firebase',e));}
async function init(){
 let A,F,auth,db,user=null,profile=null;
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
 P.register=()=>user?P.account():box('Регистрация',`<h2>Регистрация</h2>${field('r-d','Ссылка на профиль Discord или имя пользователя','text','https://discord.com/users/123… или username')}${field('r-n','Ник (необязательно)')}${field('r-p','Пароль (мин. 6 символов)','password')}${field('r-p2','Повторите пароль','password')}<p class="aerr" id="a-e"></p><button class="btn" id="r-go">Зарегистрироваться</button><p class="amut">Уже есть аккаунт? <a href="#login">Войти</a></p>`);
 P.account=()=>{if(!user)return P.login();const p=profile||{};const dt=p.createdAt?.toDate?p.createdAt.toDate().toLocaleDateString('ru-RU'):'—';
  return box('Личный кабинет',`<h2>Личный кабинет</h2><table class="tbl">${p.displayName?`<tr><td>Ник</td><td>${esc(p.displayName)}</td></tr>`:''}<tr><td>Discord</td><td>${/^https?:/.test(p.discordLink||'')?`<a href="${esc(p.discordLink)}" target="_blank" rel="noopener">${esc(p.discordLink)}</a>`:esc(p.discordLink||p.discordId||'')}</td></tr><tr><td>Discord ID</td><td>${esc(p.discordId||'')}</td></tr><tr><td>Дата регистрации</td><td>${dt}</td></tr></table><p style="margin-top:20px"><button class="btn o" id="a-out">Выйти</button></p>`)};
 const err=t=>{const e=document.getElementById('a-e');if(e)e.textContent=t};
 document.addEventListener('click',async ev=>{const id=ev.target.id;const v=x=>(document.getElementById(x)||{}).value||'';
  try{
  if(['a-go','r-go','a-out'].includes(id)&&!auth)return err('Подключение к серверу… попробуйте через секунду.');
  if(id==='a-go'){const d=did(v('a-d'));if(!d)return err('Неверный формат Discord. Укажите ссылку discord.com/users/… или имя пользователя.');if(!v('a-p'))return err('Введите пароль.');
   ev.target.disabled=true;await A.signInWithEmailAndPassword(auth,mail(d),v('a-p'));location.hash='#account';}
  if(id==='r-go'){const raw=v('r-d').trim(),d=did(raw),p=v('r-p');if(!d)return err('Неверный формат Discord. Укажите ссылку discord.com/users/… или имя пользователя.');
   if(p.length<6)return err('Пароль должен быть не короче 6 символов.');if(p!==v('r-p2'))return err('Пароли не совпадают.');
   ev.target.disabled=true;const c=await A.createUserWithEmailAndPassword(auth,mail(d),p);
   profile={discordLink:raw,discordId:d,displayName:v('r-n').trim().slice(0,40),createdAt:F.serverTimestamp()};
   try{await F.setDoc(F.doc(db,'users',c.user.uid),profile);}catch(e){console.warn('Профиль не сохранён',e);}profile.createdAt={toDate:()=>new Date()};location.hash='#account';}
  if(id==='a-out'){await A.signOut(auth);location.hash='#home';}
  }catch(e){err(em(e));ev.target.disabled=false;}
 });
 if(link)link.style.display='';
 if(['login','register','account'].includes(location.hash.slice(1)))route();
 const [{initializeApp},A_,F_]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
 A=A_;F=F_;const app=initializeApp(firebaseConfig);auth=A.getAuth(app);db=F.getFirestore(app);
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest&&e.target.closest('.auth')){const b=document.querySelector('.auth .btn');b&&b.click();}});
 window.VPPKA_AUTH={get user(){return user},get profile(){return profile},async saveApplication(answers){if(!user)return;await F.setDoc(F.doc(db,'applications',user.uid),{answers,discordId:(profile&&profile.discordId)||'',createdAt:F.serverTimestamp()});}};
 A.onAuthStateChanged(auth,async u=>{user=u;profile=null;
  if(u){try{const s=await F.getDoc(F.doc(db,'users',u.uid));profile=s.exists()?s.data():null;}catch(e){console.warn(e)}}
  if(link){link.style.display='';link.textContent=u?((profile&&profile.displayName)||'Кабинет'):'Войти';link.href=u?'#account':'#login';}
  if(['login','register','account','join'].includes(location.hash.slice(1)))route();});
}
