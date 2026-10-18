// Музыка профиля руководства: трек (файл частями в ldrMusic/{uid}/chunks или прямая ссылка), играет на карточке/профиле, громкость 5%
const FB=()=>window.VPPKA_FB,F=()=>FB().F,db=()=>FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nrm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const MAX=5*1024*1024,CH=600000,VOL=0.05;
let T=null,loading=null;const blobs={};
async function load(){if(T)return T;if(!FB()||!FB().db)return null;if(loading)return loading;loading=(async()=>{const s=await F().getDocs(F().collection(db(),'ldrMusic'));T={};s.forEach(d=>T[d.id]=d.data());return T})().catch(e=>{console.warn('ldrMusic',e.code||e);return null}).finally(()=>loading=null);return loading}
// какой трек относится к текущей странице
function trackFor(h){if(!T)return null;const [k,id]=h.replace(/^#/,'').split('/');if(k==='user'&&T[id])return [id,'user/'+id];
 if(k==='member'&&id){const ms=(window.VPPKA_DATA&&window.VPPKA_DATA.members)||[],m=ms.find(x=>x.id===id);if(!m)return null;
  const pm=(window.VPPKA_PUBMAP&&window.VPPKA_PUBMAP())||{};for(const [uid,t] of Object.entries(T)){if(nrm(t.name)===nrm(m.name)||(m.discordId&&pm[uid]&&pm[uid].did===m.discordId))return [uid,'member/'+id]}}return null}
async function srcOf(uid){const t=T[uid];if(t.url)return t.url;if(blobs[uid+t.ver])return blobs[uid+t.ver];
 const parts=[];for(let i=0;i<t.n;i++){const d=await F().getDoc(F().doc(db(),'ldrMusic',uid,'chunks',t.ver+'_'+i));if(!d.exists())throw new Error('нет части '+i);parts.push(d.data().d)}
 const bin=atob(parts.join(''));const u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);return blobs[uid+t.ver]=URL.createObjectURL(new Blob([u8],{type:t.mime||'audio/mpeg'}))}
let busy='';async function apply(){const h=location.hash;if(!/^#(member|user)\//.test(h))return;await load();const r=trackFor(h);if(!r)return;const [uid,key]=r,M=window.VPPKA_MUSIC;
 const t=T[uid],sig=uid+(t.ver||t.url);if(M[key]&&M[key].sig===sig){title(t);return}if(busy===key)return;busy=key;
 try{const src=await srcOf(uid);if(location.hash.replace(/^#/,'').split('/').slice(0,2).join('/')!==key)return;M[key]={src,start:0,vol:VOL,sig};window.VPPKA_MUSIC_SYNC&&window.VPPKA_MUSIC_SYNC();title(t)}catch(e){console.warn('музыка профиля',e)}finally{busy=''}}
function title(t){if(!t.title)return;const h=document.querySelector('.pg h1');if(!h||document.querySelector('.pmus-t'))return;const s=document.createElement('div');s.className='pmus-t';s.textContent=/^(https?:|www\.)|\.(mp3|ogg|wav)(\?|$)/i.test(String(t.title).trim())?'♪':'♪ '+t.title;h.after(s)}
// ---- настройки (только руководство) ----
function setHtml(t){return `<div class="phc" id="mus-box"><h4 class="phc-h">Музыка профиля</h4><small class="phc-hint">Играет, когда открывают вашу карточку (громкость 5%). Файл mp3/ogg до 5 МБ или прямая https-ссылка на аудио.${t?`<br>Сейчас: <b>${esc(t.title||(t.url?'ссылка':'файл'))}</b>`:''}</small>
<div class="phc-btns" style="margin-top:8px;flex-wrap:wrap"><label class="btn sm o"><input id="mus-f" type="file" accept="audio/mpeg,audio/ogg,.mp3,.ogg" style="display:none">Файл</label><input id="mus-u" class="inp" placeholder="или https://…/track.mp3" style="flex:1;min-width:180px" value="${esc(t&&t.url||'')}"></div>
<div class="phc-btns" style="margin-top:8px"><input id="mus-t" class="inp" maxlength="100" placeholder="Название трека (необязательно)" style="flex:1" value="${esc(t&&t.title||'')}"><button class="btn sm" id="mus-go">Сохранить</button>${t?'<button class="btn sm o" id="mus-rm">Убрать</button>':''}</div><p class="aerr" id="mus-e"></p></div>`}
async function inject(){const ld=document.getElementById('ld-e');if(!ld||document.getElementById('mus-box'))return;const u=FB()&&FB().user;if(!u||!(window.VPPKA_MYLDR&&window.VPPKA_MYLDR()))return;await load();if(document.getElementById('mus-box'))return;
 ld.closest('.phc').insertAdjacentHTML('afterend',setHtml(T[u.uid]))}
async function save(rm){const pe=t=>{const e=document.getElementById('mus-e');if(e)e.textContent=t};const f=F(),u=FB().user,name=window.VPPKA_MYLDR&&window.VPPKA_MYLDR();if(!name)return pe('Вы не в составе руководства.');
 const ref=f.doc(db(),'ldrMusic',u.uid),old=T&&T[u.uid];const delChunks=async o=>{if(o&&o.n)for(let i=0;i<o.n;i++)await f.deleteDoc(f.doc(db(),'ldrMusic',u.uid,'chunks',o.ver+'_'+i)).catch(()=>{})};
 try{if(rm){await f.deleteDoc(ref);await delChunks(old);delete T[u.uid];pe('Музыка убрана.');return}
  const file=document.getElementById('mus-f').files[0],url=document.getElementById('mus-u').value.trim(),title=document.getElementById('mus-t').value.trim().slice(0,100);
  const d={name:name.slice(0,160),t:f.serverTimestamp()};if(title)d.title=title;
  if(file){if(!/^audio\/(mpeg|ogg|mp3)$/.test(file.type)&&!/\.(mp3|ogg)$/i.test(file.name))return pe('Нужен файл mp3 или ogg.');if(file.size>MAX)return pe('Файл '+(file.size/1048576).toFixed(1)+' МБ — максимум 5 МБ.');
   pe('Загрузка…');const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(file)});
   const ver=String(Date.now()),n=Math.ceil(b64.length/CH);for(let i=0;i<n;i++){await f.setDoc(f.doc(db(),'ldrMusic',u.uid,'chunks',ver+'_'+i),{d:b64.slice(i*CH,(i+1)*CH)});pe('Загрузка… '+Math.round((i+1)/n*100)+'%')}
   Object.assign(d,{ver,n,mime:/ogg/i.test(file.type+file.name)?'audio/ogg':'audio/mpeg',size:file.size})}
  else if(url){if(!/^https:\/\/\S+$/.test(url)||url.length>600)return pe('Ссылка должна начинаться с https://');d.url=url}
  else if(old&&title!==undefined){Object.assign(d,Object.fromEntries(Object.entries(old).filter(([k])=>['url','ver','n','mime','size'].includes(k))))}
  else return pe('Выберите файл или вставьте ссылку.');
  await f.setDoc(ref,d);if(old&&old.ver&&old.ver!==d.ver)await delChunks(old);T=null;await load();pe('Сохранено.')}
 catch(e){pe(e.code==='permission-denied'?'Нет прав (нужен ключ доступа руководства).':(e.message||String(e)))}}
export function install(){const go=()=>{inject();apply()};new MutationObserver(()=>{clearTimeout(install.t);install.t=setTimeout(go,200)}).observe(document.body,{childList:true,subtree:true});addEventListener('hashchange',()=>setTimeout(apply,50));
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='mus-go'){e.preventDefault();save(false)}if(b.id==='mus-rm'){e.preventDefault();save(true)}});go()}
