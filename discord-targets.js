// «Куда отправить в Discord» при публикации новости или созыва/объявления.
// Строки — «свои строки» владельца из раздела «Каналы Discord». Публикующим (ступень 4+) бот выкладывает только их
// id, подпись, готовность и имя канала в config/discordTargets — вебхуки публикующим не видны.
// Отправка: сайт создаёт discordOut/{id} = {kind, ref, target, by, at}; бот берёт текст из самого документа
// (news/{ref} или notifications/{ref}), отправляет и пишет в discordOut итог (status sent|error, err).
const FB=()=>window.VPPKA_FB,F=()=>FB()&&FB().F,db=()=>FB()&&FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cache=null,t0=0;
export async function loadTargets(fresh){if(cache&&!fresh&&Date.now()-t0<60000)return cache;
 try{const s=await F().getDoc(F().doc(db(),'config','discordTargets'));cache=s.exists()?s.data():{}}catch(e){cache={}}t0=Date.now();return cache}
// Пусто, если своих строк нет: тогда форма выглядит как раньше
export function targetSelect(id,kind,T,val){const rows=(T&&Array.isArray(T.rows))?T.rows:[];if(!rows.length)return '';const def=((T&&T.builtin)||{})[kind];
 return `<label class="fl dt-l">Куда отправить в Discord<select id="${id}"><option value="">Как обычно${def?': #'+esc(def):''}</option>${rows.map(r=>`<option value="${esc(r.id)}"${r.ok?'':' disabled'}${r.ok&&r.id===val?' selected':''}>${esc(r.label)}${r.name?' — #'+esc(r.name):''}${r.ok?'':' (канал не готов)'}</option>`).join('')}</select></label>`}
export async function fillTarget(hostId,selId,kind,val){const T=await loadTargets();const h=document.getElementById(hostId);if(h)h.innerHTML=targetSelect(selId,kind,T,val)}
export const pickedTarget=selId=>{const el=document.getElementById(selId);return el&&/^c_[a-z0-9]{4,24}$/.test(el.value)?el.value:''};
// В какую свою строку ушёл созыв (для отмены): бот запоминает в config/discordTargets.sent
export async function sentTarget(ref){const T=await loadTargets(true);return (T&&T.sent&&T.sent[ref])||''}
// -> true | текст ошибки
export async function sendVia(kind,ref,target){const f=F();try{
 const r=await f.addDoc(f.collection(db(),'discordOut'),{kind,ref,target,by:FB().user.uid,at:f.serverTimestamp()});
 return await new Promise(res=>{let un=()=>{};const to=setTimeout(()=>{un();res('бот ещё не ответил — сообщение уйдёт, когда он обработает очередь.')},45000);
  un=f.onSnapshot(r,s=>{const d=s.data()||{};if(d.status==='sent'){clearTimeout(to);un();res(true)}else if(d.status==='error'){clearTimeout(to);un();res(String(d.err||'ошибка'))}},()=>{})})}
 catch(e){return e.code==='permission-denied'?'нет прав на отправку.':(e.message||String(e))}}
