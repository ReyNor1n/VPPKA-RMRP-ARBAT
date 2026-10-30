// Музыка профиля (v256: у каждого вошедшего — своя, одна на аккаунт): ldrMusic/{uid} — ссылка YouTube (только звук), прямая ссылка на аудио
// или файл до 10 МБ частями в ldrMusic/{uid}/chunks/{sl}_{i} (два слота a/b: новый файл пишется в свободный, старый удаляется).
// mid — карточка владельца трека (правила проверяют, что её Discord ID = логин). Играет фоном в профиле, громкость 5%.
const FB=()=>window.VPPKA_FB,F=()=>FB().F,db=()=>FB().db;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nrm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const MAX=10*1024*1024,CH=900000,VOL=0.05;
// аудиофайлы: расширение → тип (в правилах — ^audio/(mpeg|ogg|mp4|aac|wav|webm|flac)$)
const EXT={mp3:'audio/mpeg',mpga:'audio/mpeg',ogg:'audio/ogg',oga:'audio/ogg',opus:'audio/ogg',m4a:'audio/mp4',mp4:'audio/mp4',aac:'audio/aac',wav:'audio/wav',weba:'audio/webm',webm:'audio/webm',flac:'audio/flac'};
const ACC='audio/*,.mp3,.ogg,.oga,.opus,.m4a,.aac,.wav,.weba,.flac';
const mimeOf=f=>{const e=(String(f.name||'').match(/\.([a-z0-9]+)$/i)||[])[1];const x=e&&EXT[e.toLowerCase()];if(x)return x;const t=String(f.type||'').toLowerCase().replace('audio/mp3','audio/mpeg').replace('audio/x-m4a','audio/mp4').replace('audio/x-wav','audio/wav').replace('audio/wave','audio/wav').replace('audio/x-flac','audio/flac');return /^audio\/(mpeg|ogg|mp4|aac|wav|webm|flac)$/.test(t)?t:''};
const YT=()=>window.VPPKA_YT;const ytOf=u=>YT()&&u?YT().parse(u):null;
let T=null,loading=null;const blobs={};
// Ссылка на музыку — https и сам аудиофайл. Страница myinstants.com/instant/… это HTML, не звук.
const MI_PAGE=/^https?:\/\/(www\.)?myinstants\.com\/([a-z]{2}\/)?instant\//i;
const urlOk=u=>/^https:\/\/[^\s"'<>\\]+$/i.test(String(u||''))&&!MI_PAGE.test(String(u||''));
// проверка, что браузер может играть ссылку как аудио (без CORS — обычный <audio>)
const probe=u=>new Promise(res=>{const a=new Audio();let done=false;const fin=ok=>{if(done)return;done=true;clearTimeout(tm);a.removeAttribute('src');try{a.load()}catch(e){}res(ok)};
 const tm=setTimeout(()=>fin(null),12000);a.preload='metadata';a.addEventListener('loadedmetadata',()=>fin(true),{once:true});a.addEventListener('error',()=>fin(false),{once:true});a.src=u});
async function load(){if(T)return T;if(!FB()||!FB().db)return null;if(loading)return loading;loading=(async()=>{const s=await F().getDocs(F().collection(db(),'ldrMusic'));T={};s.forEach(d=>T[d.id]=d.data());return T})().catch(e=>{console.warn('ldrMusic',e.code||e);return null}).finally(()=>loading=null);return loading}
// какой трек относится к текущей странице
const MS=()=>(window.VPPKA_DATA&&window.VPPKA_DATA.members)||[];
// карточка → трек: 1) mid = эта карточка; 2) mid — другая карточка того же человека (discordId, у гостей — pk);
// 3) старые записи руководства без mid — по ФИО места или Discord ID из справочника
function trackFor(h){if(!T)return null;const [k,id]=h.replace(/^#/,'').split('/');if(k==='user'&&T[id])return [id,'user/'+id];
 if(k==='member'&&id){const ms=MS(),m=ms.find(x=>x.id===id);if(!m)return null;const E=Object.entries(T),key='member/'+id;
  let r=E.find(([,t])=>t.mid===m.id);if(r)return [r[0],key];
  if(m.discordId){r=E.find(([,t])=>{const c=t.mid&&ms.find(x=>x.id===t.mid);return c&&String(c.discordId||'')===String(m.discordId)});if(r)return [r[0],key]}
  const pm=(window.VPPKA_PUBMAP&&window.VPPKA_PUBMAP())||{};r=E.find(([uid,t])=>!t.mid&&((t.name&&nrm(t.name)===nrm(m.name))||(m.discordId&&pm[uid]&&pm[uid].did===m.discordId)));if(r)return [r[0],key]}return null}
const cid=(t,i)=>(t.sl||t.ver)+'_'+i
async function srcOf(uid){const t=T[uid];if(t.url){if(ytOf(t.url))throw new Error('youtube');if(!urlOk(t.url))throw new Error('ссылка не на аудиофайл: '+t.url);return t.url}if(blobs[uid+t.ver])return blobs[uid+t.ver];
 // файл до 10 МБ: части тянем параллельно, готовый трек кладём в Cache Storage (повторно — без загрузки из базы)
 const key=location.origin+'/__vm/'+uid+'/'+t.ver;let blob=null;try{const c=await caches.open('vppka-music');const r=await c.match(key);if(r)blob=await r.blob()}catch(e){}
 if(!blob){const parts=await Promise.all(Array.from({length:t.n},async(_,i)=>{const d=await F().getDoc(F().doc(db(),'ldrMusic',uid,'chunks',cid(t,i)));if(!d.exists())throw new Error('нет части '+i);return d.data().d}));
  const bin=atob(parts.join(''));const u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);blob=new Blob([u8],{type:t.mime||'audio/mpeg'});
  try{const c=await caches.open('vppka-music');for(const r of await c.keys())if(r.url.includes('/__vm/'+uid+'/'))await c.delete(r);await c.put(key,new Response(blob,{headers:{'content-type':t.mime||'audio/mpeg'}}))}catch(e){}}
 return blobs[uid+t.ver]=URL.createObjectURL(blob)}
// YouTube: только звук. Скрытый плеер IFrame API (за краем экрана, видео не видно) с интерфейсом Audio —
// его включает общий движок музыки страниц (app.js): та же кнопка-звезда, общий выключатель, автозапуск по правилам браузера, стоп при уходе
let apiP=null;
const ytApi=()=>apiP||(apiP=new Promise((res,rej)=>{if(window.YT&&window.YT.Player)return res(window.YT);const prev=window.onYouTubeIframeAPIReady;
 window.onYouTubeIframeAPIReady=()=>{try{prev&&prev()}catch(e){}res(window.YT)};const sc=document.createElement('script');sc.src='https://www.youtube.com/iframe_api';sc.async=true;
 sc.onerror=()=>{apiP=null;rej(new Error('YouTube API не загрузился'))};document.head.appendChild(sc)}));
function ytPlayer(p){const box=document.createElement('div');box.className='ytbg';box.setAttribute('aria-hidden','true');
 box.style.cssText='position:fixed;left:-10000px;top:0;width:200px;height:200px;overflow:hidden;opacity:0;pointer-events:none';
 const host=document.createElement('div');box.appendChild(host);document.body.appendChild(box);
 let P=null,ready=false,want=false,vol=VOL,seek=p.start||0,ps=false,dead=false;const ev={};
 const fire=t=>(ev[t]||[]).splice(0).forEach(f=>{try{f()}catch(e){}});
 const o={paused:true,readyState:0,loop:true,
  get volume(){return vol},set volume(v){vol=v;if(ready)P.setVolume(Math.round(v*100))},
  // seekTo у незапущенного ролика сам включает звук — до play() только запоминаем позицию
  get currentTime(){return ready?P.getCurrentTime():seek},set currentTime(t){seek=t||0;const s=ready?P.getPlayerState():-1;if(ready&&(want||s===1||s===2))P.seekTo(seek,true);else ps=true},
  get ytVolume(){return ready?P.getVolume():null},
  get state(){return ready?P.getPlayerState():-2},
  addEventListener(t,f){(ev[t]=ev[t]||[]).push(f)},removeEventListener(){},
  play(){want=true;if(ready){P.unMute();P.setVolume(Math.round(vol*100));if(ps){ps=false;P.seekTo(seek,true)}P.playVideo()}return Promise.resolve()},
  pause(){want=false;o.paused=true;if(ready)P.pauseVideo()},
  destroy(){dead=true;want=false;try{P&&P.destroy()}catch(e){}box.remove()}};
 const pv={autoplay:0,controls:0,disablekb:1,fs:0,iv_load_policy:3,playsinline:1,rel:0,origin:location.origin};
 if(p.start)pv.start=p.start;if(p.list){pv.listType='playlist';pv.list=p.list;pv.loop=1}else{pv.loop=1;pv.playlist=p.id}
 ytApi().then(Y=>{if(dead)return;P=new Y.Player(host,{width:200,height:200,host:'https://www.youtube-nocookie.com',videoId:p.id||undefined,playerVars:pv,
  events:{onReady:()=>{ready=true;o.readyState=4;P.setVolume(Math.round(vol*100));fire('loadedmetadata');if(want)o.play()},
   onStateChange:e=>{const st=e.data;o.paused=st!==1;
    // одиночное видео: по окончании — снова с таймкода (loop в API работает не всегда)
    if(st===0&&want){P.seekTo(p.start||0,true);P.playVideo()}
    // ушли со страницы, а плеер успел стартовать — глушим
    if(st===1&&!want)P.pauseVideo()},
   onError:e=>console.warn('музыка профиля: YouTube, ошибка',e.data)}});
  const fr=P.getIframe&&P.getIframe();if(fr){fr.setAttribute('allow','autoplay; encrypted-media');fr.setAttribute('tabindex','-1');fr.title='Музыка профиля'}}).catch(e=>console.warn('музыка профиля',e));
 return o}
let busy='';async function apply(){const h=location.hash;if(!/^#(member|user)\//.test(h))return;await load();const r=trackFor(h);if(!r)return;const [uid,key]=r,M=window.VPPKA_MUSIC;
 const t=T[uid],sig=uid+(t.ver||t.url);if(M[key]&&M[key].sig===sig)return;const yp=t.url&&ytOf(t.url);
 if(yp){M[key]={player:()=>ytPlayer(yp),start:yp.start||0,vol:VOL,sig,btn:1};window.VPPKA_MUSIC_SYNC&&window.VPPKA_MUSIC_SYNC();return}if(busy===key)return;busy=key;
 try{const src=await srcOf(uid);if(location.hash.replace(/^#/,'').split('/').slice(0,2).join('/')!==key)return;M[key]={src,start:0,vol:VOL,sig,btn:1};window.VPPKA_MUSIC_SYNC&&window.VPPKA_MUSIC_SYNC()}catch(e){console.warn('музыка профиля',e)}finally{busy=''}}
// настройки — у каждого вошедшего (ЛК → Настройки), только своя музыка
function setHtml(t){const cur=t?esc(t.title||(t.url?(ytOf(t.url)?'YouTube':'ссылка'):'файл')):'';return `<div class="phc" id="mus-box"><h4 class="phc-h">Музыка профиля</h4><small class="phc-hint">Играет фоном, когда открывают вашу карточку или профиль (громкость 5%), как в профиле Быкова: видео не показывается, только звук, выключается общей кнопкой музыки. Подходит любая ссылка YouTube (видео, Shorts, трансляция, YouTube Music, плейлист, с таймкодом — с него и начнётся), файл до 10 МБ (mp3, ogg, m4a, aac, wav, flac, opus) или прямая https-ссылка на аудиофайл.${t?`<br>Сейчас: <b>${cur}</b>`:''}</small>
<label class="phc-l" for="mus-u" style="display:block;margin-top:8px">Ссылка YouTube или файл до 10 МБ</label>
<div class="phc-btns" style="margin-top:4px;flex-wrap:wrap"><input id="mus-u" class="inp" placeholder="https://youtu.be/… или https://…/track.mp3" style="flex:1;min-width:180px" value="${esc(t&&t.url||'')}"><label class="btn sm o"><input id="mus-f" type="file" accept="${ACC}" style="display:none">Файл до 10 МБ</label></div><small class="phc-hint" id="mus-fn"></small>
<div class="phc-btns" style="margin-top:8px"><input id="mus-t" class="inp" maxlength="100" placeholder="Название трека (необязательно)" style="flex:1" value="${esc(t&&t.title||'')}"><button class="btn sm" id="mus-go">Сохранить</button>${t?'<button class="btn sm o" id="mus-rm">Убрать</button>':''}</div><p class="aerr" id="mus-e"></p></div>`}
async function inject(){if(!document.getElementById('mus-slot'))return;const u=FB()&&FB().user;if(!u)return;await load();const sl=document.getElementById('mus-slot');if(!sl)return;
 sl.outerHTML=setHtml(T&&T[u.uid])}
// своя карточка: место руководства, иначе любая карточка с моим Discord ID (видна членам партии; гостям-зеркалу — нет)
function myCard(){const did=String((((window.VPPKA_AUTH||{}).profile)||{}).discordId||'');if(!did)return null;const s=window.VPPKA_SEATS&&window.VPPKA_SEATS(did);if(s&&s[0])return s[0];
 return MS().find(m=>String(m.discordId||'')===did&&m.name&&m.name!=='Вакансия')||null}
async function save(rm){const pe=t=>{const e=document.getElementById('mus-e');if(e)e.textContent=t};const f=F(),u=FB()&&FB().user;if(!u)return pe('Войдите через Discord.');
 const ref=f.doc(db(),'ldrMusic',u.uid),old=T&&T[u.uid];const delChunks=async o=>{if(o&&o.n)for(let i=0;i<o.n;i++)await f.deleteDoc(f.doc(db(),'ldrMusic',u.uid,'chunks',cid(o,i))).catch(()=>{})};
 try{if(rm){await f.deleteDoc(ref);await delChunks(old);delete T[u.uid];pe('Музыка убрана.');return}
  const file=document.getElementById('mus-f').files[0],url=document.getElementById('mus-u').value.trim(),title=document.getElementById('mus-t').value.trim().slice(0,100);
  const mc=myCard(),d={t:f.serverTimestamp()};if(mc){d.mid=mc.id;d.name=String(mc.name).slice(0,160)}if(title)d.title=title;
  if(file){const mime=mimeOf(file);if(!mime)return pe('Нужен аудиофайл: mp3, ogg, m4a, aac, wav, flac или opus.');if(file.size>MAX)return pe('Файл '+(file.size/1048576).toFixed(1)+' МБ — максимум 10 МБ.');
   pe('Загрузка…');const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(file)});
   const ver=String(Date.now()),n=Math.ceil(b64.length/CH),sl=old&&old.sl==='a'?'b':'a';for(let i=0;i<n;i++){await f.setDoc(f.doc(db(),'ldrMusic',u.uid,'chunks',sl+'_'+i),{d:b64.slice(i*CH,(i+1)*CH)});pe('Загрузка… '+Math.round((i+1)/n*100)+'%')}
   Object.assign(d,{ver,n,mime,size:file.size,sl})}
  else if(url&&ytOf(url)){d.url=YT().canon(ytOf(url))}
  else if(url&&/(^|[\/.])(youtube\.com|youtu\.be|youtube-nocookie\.com)([\/?#:]|$)/i.test(url))return pe('В ссылке YouTube не нашлось видео или плейлиста. Подходит ссылка на видео, Shorts, трансляцию, YouTube Music или плейлист (кнопка «Поделиться» → «Копировать»). Ссылка на канал не подойдёт.');
  else if(url){if(MI_PAGE.test(url))return pe('Это страница myinstants.com, а не сам аудиофайл. Откройте её, нажмите правой кнопкой на «Скачать» (Download) → «Копировать адрес ссылки» и вставьте ссылку вида https://www.myinstants.com/media/sounds/….mp3');
   if(!/^https:\/\/[^\s"'<>\\]+$/i.test(url))return pe('Ссылка должна начинаться с https:// (http:, javascript:, data: и т. п. не допускаются).');if(url.length>600)return pe('Ссылка длиннее 600 символов.');
   if(!old||old.url!==url){pe('Проверяю ссылку…');const ok=await probe(url);if(ok===false)return pe('По этой ссылке не аудиофайл — браузер не может его воспроизвести. Нужна прямая ссылка на .mp3/.ogg (открывается в браузере как плеер), а не на страницу сайта.')}
   d.url=url}
  else if(old&&title!==undefined){Object.assign(d,Object.fromEntries(Object.entries(old).filter(([k])=>['url','ver','n','mime','size','sl'].includes(k))))}
  else return pe('Выберите файл или вставьте ссылку.');
  await f.setDoc(ref,d);if(old&&old.n&&(old.sl||old.ver)!==(d.sl||d.ver))await delChunks(old);T=null;await load();pe('Сохранено.')}
 catch(e){pe(e.code==='permission-denied'?'Нет прав: войдите через Discord (аккаунт должен быть привязан к Discord).':(e.message||String(e)))}}
export function install(){const go=()=>{inject();apply()};new MutationObserver(()=>{clearTimeout(install.t);install.t=setTimeout(go,200)}).observe(document.body,{childList:true,subtree:true});addEventListener('hashchange',()=>setTimeout(apply,50));
 document.addEventListener('change',e=>{if(e.target&&e.target.id==='mus-f'){const f=e.target.files[0],n=document.getElementById('mus-fn');if(n)n.textContent=f?'Файл: '+f.name+' — '+(f.size/1048576).toFixed(1)+' МБ'+(f.size>MAX?' (больше 10 МБ — не подойдёт)':''):''}});
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='mus-go'){e.preventDefault();save(false)}if(b.id==='mus-rm'){e.preventDefault();save(true)}});go()}
