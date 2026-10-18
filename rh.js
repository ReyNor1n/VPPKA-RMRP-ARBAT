// История званий в профиле (видна членам партии). Запись — при смене звания в панели (ступень 4+).
const FB=()=>window.VPPKA_FB,F=()=>FB().F,db=()=>FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ms=t=>!t?0:t.toMillis?t.toMillis():typeof t==='number'?t:(t.seconds||0)*1000;
const fd=t=>ms(t)?new Date(ms(t)).toLocaleDateString('ru-RU',{timeZone:'Europe/Volgograd'}):'';
const cache={};let busy='',pv=false;
async function get(did){if(cache[did])return cache[did];const f=F(),s=await f.getDocs(f.query(f.collection(db(),'rankHist'),f.where('did','==',did),f.limit(50)));return cache[did]=s.docs.map(d=>d.data()).sort((a,b)=>ms(b.at)-ms(a.at))}
async function fill(){const [k,id]=(location.hash.slice(1)||'').split('/');if(k!=='member'||!id)return;const app=document.getElementById('app'),prof=app&&app.querySelector('.prof');if(!prof||app.querySelector('.rh'))return;
 const m=((window.VPPKA_DATA&&window.VPPKA_DATA.members)||[]).find(x=>x.id===id)||((window.VPPKA_C&&window.VPPKA_C().leadership.members)||[]).find(x=>x.id===id);if(!m||!m.discordId||(!pv&&(!FB()||!FB().user)))return;
 const key=id+location.hash;if(busy===key)return;busy=key;
 try{const L=await get(m.discordId);if(app.querySelector('.rh')||!app.contains(prof))return;const box=document.createElement('div');box.className='blk rh';
  box.innerHTML=`<h2>История званий</h2>${L.length?`<ul class="rh-l">${L.map(x=>`<li class="${x.kind==='down'?'dn':x.kind==='up'?'up':'as'}"><span class="rh-d">${esc(fd(x.at))}</span><div><b>${x.kind==='down'?'▼':x.kind==='up'?'▲':'★'} ${x.from?esc(x.from)+' → ':''}${esc(x.to||'')}</b>${x.reason?`<p>${esc(x.reason)}</p>`:''}${x.byName?`<small>Решение: ${esc(x.byName)}</small>`:''}</div></li>`).join('')}</ul>`:'<p class="ev-empty">Изменений звания пока нет.</p>'}`;
  prof.after(box)}catch(e){if(e.code!=='permission-denied')console.warn('rankHist',e.code||e)}finally{busy=''}}
export async function record(did,kind,from,to,name,reason){const f=F();const p=(window.VPPKA_AUTH||{}).profile||{};
 await f.addDoc(f.collection(db(),'rankHist'),{did:String(did).slice(0,64),kind,from:String(from||'').slice(0,80),to:String(to||'').slice(0,80),name:String(name||'').slice(0,160),reason:String(reason||'').slice(0,300),by:FB().user.uid,byName:String(window.VPPKA_ACTOR?window.VPPKA_ACTOR():p.displayName||'').slice(0,160),at:f.serverTimestamp()});delete cache[did]}
// личные данные (дата рождения, паспорт) на странице члена партии — только членам партии (правила priv)
let pvBusy=false;async function privFill(){const [k,id]=(location.hash.slice(1)||'').split('/');if(k!=='member'||!id||!FB()||!FB().user)return;const app=document.getElementById('app'),prof=app&&app.querySelector('.prof');if(!prof||app.querySelector('.pvx')||pvBusy)return;
 const m=((window.VPPKA_DATA&&window.VPPKA_DATA.members)||[]).find(x=>x.id===id);if(!m||!m.discordId)return;const pm=(window.VPPKA_PUBMAP&&window.VPPKA_PUBMAP())||{};const uid=Object.keys(pm).find(u=>pm[u].did===m.discordId);if(!uid)return;
 pvBusy=true;try{const f=F(),d=await f.getDoc(f.doc(db(),'users',uid,'priv','p'));if(!d.exists()||app.querySelector('.pvx')||!app.contains(prof))return;const x=d.data();if(!x.birth&&!x.passport)return;
  const b=document.createElement('div');b.className='blk pvx';b.innerHTML=`<h2>Личные данные</h2><table class="tbl">${x.birth?`<tr><td>Дата рождения</td><td>${esc(x.birth)}</td></tr>`:''}${x.passport?`<tr><td>Номер паспорта</td><td>${esc(x.passport)}</td></tr>`:''}</table><p class="ev-empty" style="margin:6px 0 0;font-size:12px">Видно только членам партии.</p>`;prof.after(b)}catch(e){}finally{pvBusy=false}}
export function install(){{const ap=document.getElementById('app');let t2;new MutationObserver(()=>{clearTimeout(t2);t2=setTimeout(privFill,250)}).observe(ap,{childList:true});}window.VPPKA_RH=record;window.VPPKA_RH_PREVIEW=(did,L)=>{cache[did]=L;pv=true;const o=document.querySelector('.rh');if(o)o.remove();fill()};const app=document.getElementById('app');let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(fill,150)}).observe(app,{childList:true});fill()}
