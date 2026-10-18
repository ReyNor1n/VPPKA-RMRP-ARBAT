// Внутрипартийные голосования: голосуют члены партии, создают ступень 5+, кто как голосовал — ступень 4+
const FB=()=>window.VPPKA_FB,F=()=>FB().F,db=()=>FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pw=()=>(FB()&&FB().power)||{},tier=()=>pw().owner?9:(pw().tier||0),c5=()=>tier()>=5,c4=()=>tier()>=4;
const TZ='Europe/Volgograd',fmt=ms=>new Date(ms).toLocaleString('ru-RU',{timeZone:TZ,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',','');
const fromLocal=v=>{const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);return m?Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5])-3*3600e3:NaN};
const TYPES={decision:'Решение',candidates:'Кандидаты',amendment:'Поправка к уставу'};
let V=null,state='',my={},who={},creating=false,uidSeen;
async function load(){const fb=FB();if(!fb||!fb.user){V=[];state='guest';return}const f=F();
 try{const s=await f.getDocs(f.query(f.collection(db(),'votes'),f.orderBy('createdAt','desc'),f.limit(40)));V=s.docs.map(d=>({id:d.id,...d.data()}));state='ok';
  my={};await Promise.all(V.map(async v=>{try{const b=await f.getDoc(f.doc(db(),'votes',v.id,'ballots',fb.user.uid));if(b.exists())my[v.id]=b.data().opt}catch(e){}}))}
 catch(e){V=[];state=e.code==='permission-denied'?'denied':'err';console.warn('votes',e.code||e)}}
const open=v=>!v.closed&&Date.now()<v.deadline;
function card(v){const o=open(v),t=v.total||0,mine=my[v.id];
 const rows=v.options.map((x,i)=>{const n=(v.counts||{})[i]||0,p=t?Math.round(n*100/t):0;return `<div class="vt-o${mine===i?' mine':''}">${o&&mine===undefined?`<label><input type="radio" name="vt-${esc(v.id)}" value="${i}"> ${esc(x)}</label>`:`<span>${esc(x)}${mine===i?' <small>· ваш голос</small>':''}</span>`}<span class="vt-n">${n} · ${p}%</span><div class="vt-bar"><i style="width:${p}%"></i></div></div>`}).join('');
 return `<div class="blk vt" data-vt="${esc(v.id)}"><div class="vt-top"><span class="vt-ty">${esc(TYPES[v.type]||v.type)}</span><span class="vt-st ${o?'on':''}">${o?'идёт до '+esc(fmt(v.deadline)):'завершено'}</span></div><h3>${esc(v.title)}</h3>${v.desc?`<p class="vt-d">${esc(v.desc).replace(/\n/g,'<br>')}</p>`:''}
 <div class="vt-ol">${rows}</div><div class="vt-f"><span>Голосов: <b>${t}</b></span>${o&&mine===undefined?`<button class="btn sm" data-vtgo="${esc(v.id)}">Проголосовать</button>`:''}${c4()?`<button class="btn sm o" data-vtwho="${esc(v.id)}">Кто как голосовал</button>`:''}${c5()&&o?`<button class="btn sm o" data-vtclose="${esc(v.id)}">Закрыть</button>`:''}${c5()?`<button class="btn sm o" data-vtdel="${esc(v.id)}">Удалить</button>`:''}<span class="ev-err"></span></div>
 ${who[v.id]?`<div class="vt-who">${who[v.id].length?who[v.id].map(b=>`<div><b>${esc(b.n||b.id)}</b> → ${esc(v.options[b.opt]??'?')}</div>`).join(''):'<div>Пока никто не голосовал.</div>'}</div>`:''}</div>`}
const form=()=>`<form class="blk ev-form" id="vtForm"><h2>Новое голосование</h2><label>Тип<select name="type">${Object.entries(TYPES).map(([k,x])=>`<option value="${k}">${x}</option>`).join('')}</select></label>
<label>Вопрос<input name="title" maxlength="200" required></label><label>Описание<textarea name="desc" rows="3" maxlength="4000"></textarea></label>
<label>Варианты (каждый с новой строки, 2–10)<textarea name="options" rows="4" required>За\nПротив\nВоздержался</textarea></label>
<label>Окончание (UTC+3)<input name="deadline" type="datetime-local" required></label><div class="ev-adm"><button class="btn sm" type="submit">Создать</button> <button class="btn sm o" type="button" data-vtcancel>Отмена</button><span class="ev-err"></span></div></form>`;
function page(){let b;if(V===null)b='<p class="ev-empty">Загрузка…</p>';else if(state==='guest')b='<div class="blk"><p class="ev-empty">Голосования доступны только членам партии. Войдите на сайт.</p></div>';
 else if(state==='denied')b='<div class="blk"><p class="ev-empty">Голосования доступны только членам партии.</p></div>';else if(state==='err')b='<div class="blk"><p class="ev-empty">Не удалось загрузить голосования.</p></div>';
 else{const a=V.filter(open),c=V.filter(v=>!open(v));b=`${c5()?(creating?form():'<p><button class="btn sm" data-vtnew>+ Новое голосование</button></p>'):''}${a.length?a.map(card).join(''):'<div class="blk"><p class="ev-empty">Сейчас активных голосований нет.</p></div>'}${c.length?`<details class="blk ev-past"><summary>Завершённые (${c.length})</summary>${c.map(card).join('')}</details>`:''}`}
 return `<div class="crumbs"><a href="#home">Главная</a> / Голосования</div><div class="pg"><h1>Голосования</h1><p class="ev-empty">Один член партии — один голос. Итоги видны всем членам партии; кто как голосовал — только руководству (ступень 4+).</p>${b}</div>`}
const cur=()=>(location.hash.slice(1)||'home').split('/')[0],rr=()=>{if(cur()==='votes')window.route()};
async function vote(id,opt){const f=F(),u=FB().user,v=V.find(x=>x.id===id),p=(window.VPPKA_AUTH||{}).profile||{};const b=f.writeBatch(db());
 b.set(f.doc(db(),'votes',id,'ballots',u.uid),{opt,at:f.serverTimestamp(),n:String(p.displayName||'').slice(0,120)});
 b.update(f.doc(db(),'votes',id),new f.FieldPath('counts',String(opt)),f.increment(1),'total',f.increment(1));await b.commit()}
export function install(){window.VPPKA_VT_PAGE=page;window.VPPKA_VT_PREVIEW=(a,m,w)=>{V=a;state='ok';my=m||{};who=w||{};rr()};
 const re=()=>load().then(rr);setInterval(()=>{const u=FB()&&FB().user?FB().user.uid+':'+tier():'';if(u!==uidSeen){uidSeen=u;V=null;re()}},1500);
 addEventListener('hashchange',()=>{if(cur()==='votes'&&state==='ok')re()});
 document.addEventListener('click',async ev=>{const t=ev.target.closest('[data-vtnew],[data-vtcancel],[data-vtgo],[data-vtwho],[data-vtclose],[data-vtdel]');if(!t)return;ev.preventDefault();const er=t.closest('.vt,form')?.querySelector('.ev-err'),E=e=>{if(er)er.textContent=' '+(e.code==='permission-denied'?'Нет прав':(e.message||e.code))};
  try{if(t.dataset.vtnew!==undefined){creating=true;rr()}else if(t.dataset.vtcancel!==undefined){creating=false;rr()}
  else if(t.dataset.vtgo){const id=t.dataset.vtgo,r=document.querySelector(`input[name="vt-${CSS.escape(id)}"]:checked`);if(!r)throw new Error('Выберите вариант');t.disabled=true;await vote(id,+r.value);await re()}
  else if(t.dataset.vtwho){const id=t.dataset.vtwho;if(who[id]){delete who[id];rr();return}const s=await F().getDocs(F().collection(db(),'votes',id,'ballots'));who[id]=s.docs.map(d=>({id:d.id,...d.data()}));rr()}
  else if(t.dataset.vtclose){if(!confirm('Закрыть голосование?'))return;await F().updateDoc(F().doc(db(),'votes',t.dataset.vtclose),{closed:true});await re()}
  else if(t.dataset.vtdel){if(!confirm('Удалить голосование?'))return;await F().deleteDoc(F().doc(db(),'votes',t.dataset.vtdel));await re()}}catch(e){t.disabled=false;E(e)}});
 document.addEventListener('submit',async ev=>{if(ev.target.id!=='vtForm')return;ev.preventDefault();const fd=new FormData(ev.target),er=ev.target.querySelector('.ev-err');
  try{const opts=String(fd.get('options')).split('\n').map(x=>x.trim()).filter(Boolean).map(x=>x.slice(0,200));if(opts.length<2||opts.length>10)throw new Error('Нужно 2–10 вариантов');
   const dl=fromLocal(fd.get('deadline'));if(!isFinite(dl)||dl<Date.now())throw new Error('Окончание должно быть в будущем');
   const d={title:String(fd.get('title')).trim().slice(0,200),type:fd.get('type'),options:opts,deadline:Math.round(dl),closed:false,createdBy:FB().user.uid,createdAt:Date.now(),counts:Object.fromEntries(opts.map((_,i)=>[String(i),0])),total:0};
   const ds=String(fd.get('desc')||'').trim();if(ds)d.desc=ds.slice(0,4000);await F().addDoc(F().collection(db(),'votes'),d);creating=false;await re()}catch(e){er.textContent=' '+(e.code==='permission-denied'?'Нет прав (ступень 5+)':(e.message||e.code))}});
}
