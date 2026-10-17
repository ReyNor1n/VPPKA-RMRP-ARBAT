// Колокольчик уведомлений: новости, созывы/объявления (notifications), заявки (ступень 3+ и владелец)
const FB=()=>window.VPPKA_FB,F=()=>FB().F,db=()=>FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tier=()=>(FB().power||{}).tier||0, isOwner=()=>((FB().power||{}).rank||0)>=1000;
const canApps=()=>isOwner()||tier()>=3, canPost=()=>isOwner()||tier()>=4;
const TYPES={news:'Новость',convocation:'Созыв',other:'Объявление'};
let uid=null,unsub=[],news=[],notes=[],apps=[],tab='n',open=false;
const ms=t=>t&&t.toMillis?t.toMillis():(t&&t.seconds?t.seconds*1000:(typeof t==='string'?Date.parse(t)||0:0));
const fdt=t=>{const m=ms(t);return m?new Date(m).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''};
const sk=k=>`vppka-seen-${k}-${uid}`, seen=k=>+localStorage.getItem(sk(k))||0, setSeen=k=>localStorage.setItem(sk(k),Date.now());
function items(){return [...news.map(n=>({t:ms(n.createdAt)||ms(n.date),type:'news',title:n.title,href:'#news/'+n.id})),
 ...notes.map(n=>({t:Math.max(ms(n.createdAt),ms(n.cancelledAt)),id:n.id,type:n.type||'other',title:n.title,text:n.text,when:n.when,cancelled:n.cancelled===true,reason:n.reason}))].sort((a,b)=>b.t-a.t).slice(0,40)}
function unread(){const s1=seen('n'),s2=seen('a');return items().filter(x=>x.t>s1).length+(canApps()?apps.filter(a=>ms(a.createdAt)>s2).length:0)}
function el(){let b=document.getElementById('nbell');const rt=document.querySelector('.hd .rt');if(!rt)return null;
 if(!b){b=document.createElement('div');b.id='nbell';b.className='nbell';b.innerHTML=`<button class="nb-btn" aria-label="Уведомления"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 22a2.4 2.4 0 0 0 2.4-2.4H9.6A2.4 2.4 0 0 0 12 22zm7.2-6V11c0-3.4-1.8-6.2-5-7V3.3a2.2 2.2 0 0 0-4.4 0V4c-3.2.8-5 3.6-5 7v5L2.4 18.4v1.2h19.2v-1.2z"/></svg><span class="nb-c"></span></button>`;
  rt.insertBefore(b,document.getElementById('authlink'));const pp=document.createElement('div');pp.className='nb-p';pp.id='nb-p';pp.hidden=true;document.body.appendChild(pp);
  b.querySelector('.nb-btn').onclick=e=>{e.stopPropagation();open=!open;if(open)markTab();paint()};
  pp.addEventListener('click',onPanel);document.addEventListener('click',e=>{if(open&&!b.contains(e.target)&&!e.composedPath().includes(pp)){open=false;paint()}})}
 return b}
function markTab(){setSeen(tab==='a'?'a':'n')}
function panelHtml(){const A=canApps(),s1=seen('n');
 const tabs=`<div class="nb-tabs"><button data-tab="n" class="${tab==='n'?'on':''}">Уведомления</button>${A?`<button data-tab="a" class="${tab==='a'?'on':''}">Заявки${apps.length?` <b>${apps.length}</b>`:''}</button>`:''}</div>`;
 if(tab==='a'&&A)return tabs+`<div class="nb-l">${apps.map(a=>{const x=a.answers||{};return `<a class="nb-it" href="#apps" data-app="${esc(a.id)}"><span class="nb-av">${a.photo?`<img src="${esc(a.photo)}" alt="">`:esc((x.fio||'?')[0])}</span><span class="nb-tx"><b>${esc(x.fio||'Без имени')}</b><small>Заявка · ${fdt(a.createdAt)}${a.source==='discord'?' · из Discord':''}</small><span class="nb-acts"><button class="btn sm" data-acc="${esc(a.id)}">Принять</button> <button class="btn sm o" data-rej="${esc(a.id)}">Отклонить</button></span></span></a>`}).join('')||'<p class="nb-e">Новых заявок нет.</p>'}</div>`;
 const form=canPost()?`<details class="nb-f"><summary>+ Созыв / объявление</summary><select id="nb-ty"><option value="convocation">Созыв (съезд, заседание)</option><option value="other">Объявление</option></select><input id="nb-ti" maxlength="200" placeholder="Заголовок"><input id="nb-wh" maxlength="100" placeholder="Когда (напр. 20.10, 19:00)"><textarea id="nb-tx" maxlength="2000" rows="2" placeholder="Текст (необязательно)"></textarea><button class="btn sm" id="nb-send">Отправить всем</button><small id="nb-er" class="aerr"></small></details>`:'';
 return tabs+form+`<div class="nb-l">${items().map(x=>`<${x.href?`a href="${x.href}"`:'div'} class="nb-it${x.t>s1?' new':''}"><span class="nb-tg nb-${x.cancelled?'cancel':x.type}">${x.cancelled?'Отменён':(TYPES[x.type]||'Объявление')}</span><span class="nb-tx"><b class="${x.cancelled?'nb-strike':''}">${esc(x.title)}</b>${x.cancelled?`<small class="nb-cr">❌ Созыв отменён${x.reason?': '+esc(x.reason):''}</small>`:''}${x.when?`<small>Когда: ${esc(x.when)}</small>`:''}${x.text?`<small>${esc(x.text)}</small>`:''}<small>${fdt(x.t?{seconds:x.t/1000}:null)}</small>${x.type==='convocation'&&!x.cancelled&&canPost()?`<button class="btn sm o nb-cx" data-cancel="${esc(x.id)}">Отменить</button>`:''}</span></${x.href?'a':'div'}>`).join('')||'<p class="nb-e">Уведомлений пока нет.</p>'}</div>`}
// Отправка созыва/объявления в Discord (вебхук хранится в config/discord, читают ступень 4+ и владелец)
async function toDiscord(d,cancel){try{const c=await F().getDoc(F().doc(db(),'config','discord'));const w=c.exists()&&c.data().webhook;if(!w)return 'вебхук не настроен.';
 const fl=[];if(d.when)fl.push({name:'Когда',value:String(d.when).slice(0,1000)});
 const body=cancel?{username:'ВППКА «Коммунисты Арбата»',allowed_mentions:{parse:[]},embeds:[{title:('❌ Созыв отменён: '+d.title).slice(0,256),description:d.reason?('Причина: '+d.reason).slice(0,4000):undefined,url:'https://vppka-arbat-rmrp.ru/',color:0x7A7A7A,fields:fl,footer:{text:'vppka-arbat-rmrp.ru'},timestamp:new Date().toISOString()}]}:{username:'ВППКА «Коммунисты Арбата»',allowed_mentions:{parse:[]},embeds:[{title:((d.type==='convocation'?'📢 Созыв: ':'📣 Объявление: ')+d.title).slice(0,256),description:(d.text||'').slice(0,4000)||undefined,url:'https://vppka-arbat-rmrp.ru/',color:0xE32B2B,fields:fl,footer:{text:'vppka-arbat-rmrp.ru'},timestamp:new Date().toISOString()}]};
 const r=await fetch(w,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return r.ok?true:'ошибка '+r.status+'.'}
 catch(x){return x.code==='permission-denied'?'нет доступа к настройке вебхука (опубликуйте firestore.rules).':'не удалось отправить.'}}
async function cancelConv(id){const n=notes.find(x=>x.id===id);if(!n||!confirm(`Отменить созыв «${n.title}»?`))return;
 const reason=(prompt('Причина отмены (необязательно):','')||'').trim().slice(0,500);
 try{const d={cancelled:true,cancelledAt:F().serverTimestamp()};if(reason)d.reason=reason;await F().updateDoc(F().doc(db(),'notifications',id),d);
  const r=await toDiscord({...n,reason},true);alert(r===true?'Созыв отменён, сообщение отправлено в Discord.':'Созыв отменён на сайте. Discord: '+r)}
 catch(x){alert('Ошибка: '+(x.code==='permission-denied'?'нет прав (опубликуйте firestore.rules).':(x.code||x.message)))}}
async function decideApp(id,st){const a=apps.find(x=>x.id===id);if(!a)return;const fio=(a.answers||{}).fio||'заявителя';
 if(!confirm(`${st==='accepted'?'Принять':'Отклонить'} заявку «${fio}»?`))return;let reason='';if(st==='rejected')reason=(prompt('Причина отказа (необязательно):','')||'').trim().slice(0,500);
 try{const d={status:st,reviewedBy:FB().user.uid,reviewedAt:F().serverTimestamp(),reviewerRole:String((FB().power||{}).roleName||'').slice(0,60)};if(reason)d.rejectReason=reason;
  await F().updateDoc(F().doc(db(),'applications',id),d);window.VPPKA_APPS_RESET&&window.VPPKA_APPS_RESET();if(st==='accepted'&&window.VPPKA_ROSTER_SYNC)window.VPPKA_ROSTER_SYNC().catch(()=>{})}
 catch(x){alert('Ошибка: '+(x.code==='permission-denied'?'нет прав.':(x.code||x.message)))}}
async function onPanel(e){const ac=e.target.closest('[data-acc],[data-rej]');if(ac){e.preventDefault();e.stopPropagation();decideApp(ac.dataset.acc||ac.dataset.rej,ac.dataset.acc?'accepted':'rejected');return}
const cx=e.target.closest('[data-cancel]');if(cx){e.preventDefault();cancelConv(cx.dataset.cancel);return}
 const t=e.target.closest('[data-tab]');if(t){tab=t.dataset.tab;markTab();paint();return}
 const ap=e.target.closest('[data-app]');if(ap){e.preventDefault();open=false;paint();window.VPPKA_APPS_RESET&&window.VPPKA_APPS_RESET();location.hash='#apps';window.route&&window.route();const id=ap.dataset.app;let n=0;const go=()=>{const x=document.getElementById('app-'+id);if(x){x.scrollIntoView({block:'center'});x.classList.add('nb-hl')}else if(n++<40)setTimeout(go,150)};go();return}
 if(e.target.closest('.nb-it[href]')){open=false;paint();return}
 if(e.target.id==='nb-send'){const v=i=>document.getElementById(i).value.trim(),er=document.getElementById('nb-er');const ti=v('nb-ti');if(!ti){er.textContent='Введите заголовок.';return}
  e.target.disabled=true;try{const d={type:v('nb-ty'),title:ti,author:FB().user.uid,createdAt:F().serverTimestamp()};if(v('nb-tx'))d.text=v('nb-tx');if(v('nb-wh'))d.when=v('nb-wh');await F().addDoc(F().collection(db(),'notifications'),d);er.textContent='Опубликовано на сайте.';
   const dr=await toDiscord(d);er.textContent=dr===true?'Опубликовано на сайте и в Discord.':'Опубликовано на сайте. Discord: '+dr;['nb-ti','nb-wh','nb-tx'].forEach(i=>{const x=document.getElementById(i);if(x)x.value=''});}
  catch(x){er.textContent='Ошибка: '+(x.code==='permission-denied'?'нет прав (опубликуйте firestore.rules).':(x.code||x.message))}e.target.disabled=false}}
function paint(){const b=el();if(!b)return;b.style.display=uid?'':'none';if(!uid){document.getElementById('nb-p').hidden=true;return}
 const u=unread(),c=b.querySelector('.nb-c');c.textContent=u>99?'99+':u;c.hidden=!u;
 const p=document.getElementById('nb-p');p.hidden=!open;if(open){const r=b.getBoundingClientRect();if(innerWidth>768){p.style.top=(r.bottom+8)+'px';p.style.right=Math.max(8,innerWidth-r.right)+'px';p.style.left='auto'}else{p.style.top=(r.bottom+10)+'px';p.style.left='8px';p.style.right='8px'}const f=p.querySelector('details[open]'),keep=f&&{ti:p.querySelector('#nb-ti').value,wh:p.querySelector('#nb-wh').value,tx:p.querySelector('#nb-tx').value};p.innerHTML=panelHtml();
  if(keep&&p.querySelector('details')){const d=p.querySelector('details');d.open=true;p.querySelector('#nb-ti').value=keep.ti;p.querySelector('#nb-wh').value=keep.wh;p.querySelector('#nb-tx').value=keep.tx}}}
function stop(){unsub.forEach(f=>{try{f()}catch(e){}});unsub=[];news=[];notes=[];apps=[]}
function start(){const f=F(),d=db();
 unsub.push(f.onSnapshot(f.query(f.collection(d,'news'),f.orderBy('createdAt','desc'),f.limit(20)),s=>{news=s.docs.map(x=>({...x.data(),id:x.id}));if(open)markTab();paint()},e=>console.warn('notif news',e.code)));
 unsub.push(f.onSnapshot(f.query(f.collection(d,'notifications'),f.orderBy('createdAt','desc'),f.limit(30)),s=>{notes=s.docs.map(x=>({...x.data(),id:x.id}));if(open&&tab==='n')markTab();paint()},e=>console.warn('notif notes',e.code)));
 if(canApps())unsub.push(f.onSnapshot(f.query(f.collection(d,'applications'),f.where('status','==','new')),async s=>{const H=window.VPPKA_HIDDEN||(()=>false);
  apps=s.docs.map(x=>({...x.data(),id:x.id})).filter(a=>!H({discordId:a.discordId,uid:a.uid})).sort((a,b)=>ms(b.createdAt)-ms(a.createdAt));
  for(const a of apps)if(a.uid&&a.photo===undefined){try{const u=await f.getDoc(f.doc(d,'users',a.uid));a.photo=u.exists()&&u.data().photo||''}catch(e){a.photo=''}}
  if(open&&tab==='a')markTab();paint()},e=>console.warn('notif apps',e.code)))}
export function install(){let key='';const tick=()=>{const fb=FB();if(!fb)return;const u=fb.user,k=u?u.uid+':'+tier()+':'+isOwner():'';
 if(k!==key){key=k;stop();uid=u?u.uid:null;tab='n';open=false;if(u)start()}if(!document.getElementById('nbell')||document.getElementById('nbell').style.display!==(uid?'':'none'))paint()};
 tick();setInterval(tick,1000)}
