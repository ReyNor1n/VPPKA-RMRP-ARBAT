// v225: фото отдельно от карточек. В карточке (members.photo, users.photo/avatar, ldrPhotos.d, avatars.d, news.photos)
// вместо base64 лежит ссылка «ph:<id>»: полный размер — photos/{id}.d, миниатюра для списков — photoThumbs/{id}.d.
// Списки берут миниатюру, когда картинка подъезжает к экрану; профиль — полный размер только при открытии.
// Старые base64 и обычные ссылки (img/…, https://…) показываются как раньше.
(()=>{
const RE=/^ph:([A-Za-z0-9]{20})$/,BLANK='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T=new Map(),FU=new Map(),LS='vpph1:';
const idOf=s=>{const m=RE.exec(String(s||''));return m?m[1]:''};
const lsGet=id=>{try{return localStorage.getItem(LS+id)||''}catch(e){return ''}};
const lsPut=(id,d)=>{try{localStorage.setItem(LS+id,d)}catch(e){try{Object.keys(localStorage).filter(k=>k.startsWith(LS)).forEach(k=>localStorage.removeItem(k));localStorage.setItem(LS+id,d)}catch(x){}}};
const thumbOf=id=>{let d=T.get(id);if(!d){d=lsGet(id);if(d)T.set(id,d)}return d||''};
// что уже есть в памяти: k='t' миниатюра, k='f' полный размер (нет полного — миниатюра как временная)
const known=(id,k)=>k==='f'?(FU.get(id)||''):(thumbOf(id)||FU.get(id)||'');
const fb=()=>new Promise((res,rej)=>{const t0=Date.now();const go=()=>{const x=window.VPPKA_FB;if(x&&x.F&&x.db)return res(x);if(Date.now()-t0>30000)return rej(new Error('Firestore не загрузился'));setTimeout(go,120)};go()});
const P=new Map();
async function fetchOne(col,id){const {F,db}=await fb();const s=await F.getDoc(F.doc(db,col,id));const d=s.exists()&&s.data().d;return typeof d==='string'&&/^data:image\//.test(d)?d:''}
function load(id,k){const key=k+id;if(P.has(key))return P.get(key);
 const p=(async()=>{if(k==='f'){if(FU.get(id))return FU.get(id);let d=await fetchOne('photos',id).catch(()=>'');if(d){FU.set(id,d);return d}return thumbOf(id)||await load(id,'t')}
  const c=thumbOf(id);if(c)return c;let d=await fetchOne('photoThumbs',id).catch(()=>'');if(d){T.set(id,d);lsPut(id,d);return d}
  return FU.get(id)||await fetchOne('photos',id).then(x=>{if(x)FU.set(id,x);return x}).catch(()=>'')})();
 P.set(key,p);p.then(d=>{if(!d)P.delete(key)});return p}
function paint(id,k,d){document.querySelectorAll('img[data-ph="'+id+'"]').forEach(i=>{const ik=i.dataset.pk||'t';if(ik===k||(k==='t'&&ik==='f'&&!i.dataset.phd&&i.src===BLANK)){i.src=d||BLANK;if(ik===k){i.dataset.phd=d?'1':'x';i.dispatchEvent(new Event('phload'))}}})}
function want(i){if(i.dataset.phq)return;i.dataset.phq='1';const id=i.dataset.ph,k=i.dataset.pk||'t';
 if(k==='t'&&!i.dataset.phd){const c=thumbOf(id);if(c)paint(id,'t',c)}
 load(id,k).then(d=>paint(id,k,d)).catch(()=>paint(id,k,''))}
const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);want(e.target)}}),{rootMargin:'400px 0px'}):null;
function scan(root){(root.querySelectorAll?root:document).querySelectorAll('img[data-ph]:not([data-phs])').forEach(i=>{i.dataset.phs='1';if(i.dataset.phd)return;if(i.dataset.pk==='f'||!io)want(i);else io.observe(i)})}
new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1){if(n.matches&&n.matches('img[data-ph]'))scan(n.parentNode||document);else if(n.querySelector&&n.querySelector('img[data-ph]'))scan(n)}}).observe(document.documentElement,{childList:true,subtree:true});
// атрибут src для <img>: PHA(значение, 't' | 'f')
window.PHA=(s,k)=>{s=String(s||'');k=k==='f'?'f':'t';const id=idOf(s);if(!id)return /^\s*(javascript|vbscript|data(?!:image\/)):/i.test(s)?`src="${BLANK}"`:`src="${E(s)}"`;
 const d=known(id,k);if(d)return `src="${E(d)}" data-ph="${id}" data-pk="${k}" data-phd="1" data-phs="1"`;
 const tmp=k==='f'?thumbOf(id):'';return `src="${E(tmp||BLANK)}" data-ph="${id}" data-pk="${k}"`};
// значение для href ссылки «открыть фото» (полный размер открывается по клику — см. обработчик ниже)
// v227: ссылки — только обычные https://. Свои картинки: «ph:<id>», data:image/…, относительный путь img/….
// Всё прочее (javascript:, data:text/html, vbscript:, http: и т. п.) ссылкой не становится.
const SAFE_HTTPS=s=>/^https:\/\/[^\s"'<>\\]+$/i.test(String(s||''));
const SAFE_MEDIA=s=>{s=String(s||'');return !!idOf(s)||SAFE_HTTPS(s)||/^data:image\/(png|jpe?g|gif|webp|bmp|avif);base64,[A-Za-z0-9+\/=\s]*$/i.test(s)||/^img\/[^:\s"'<>\\]+$/.test(s)};
window.VPPKA_SAFE={https:SAFE_HTTPS,media:SAFE_MEDIA};
window.PHH=s=>{s=String(s||'');return idOf(s)?`href="#" data-phopen="${E(s)}"`:SAFE_MEDIA(s)?`href="${E(s)}"`:`data-badurl="1"`};
const VP=window.VPPKA_PH={isRef:s=>!!idOf(s),BLANK,
 src:(s,k)=>{const id=idOf(s);return id?(known(id,k==='f'?'f':'t')||''):String(s||'')},
 // данные картинки (data:…) по ссылке; обычные значения возвращаются как есть
 get:async(s,k)=>{const id=idOf(s);if(!id)return String(s||'');return await load(id,k==='f'?'f':'t')},
 // догрузить все ожидающие картинки сейчас (снимки карточек для Discord)
 flush:()=>Promise.all([...document.querySelectorAll('img[data-ph]')].filter(i=>!i.dataset.phd).map(i=>{if(io)io.unobserve(i);i.dataset.phs='1';const id=i.dataset.ph,k=i.dataset.pk||'t';return load(id,k).then(d=>paint(id,k,d),()=>paint(id,k,''))})).then(()=>1),
 thumb:d=>mkThumb(d),
 // загрузка: base64 → photos/{id} + photoThumbs/{id}, возвращает «ph:<id>». Не вышло — исходный base64 (как раньше).
 up:async(d,uid)=>{d=String(d||'');if(!/^data:image\//.test(d))return d;try{const {F,db,user}=await fb();const by=uid||(user&&user.uid);if(!by)throw new Error('нет входа');
   const t=await mkThumb(d),ref=F.doc(F.collection(db,'photos')),id=ref.id;const b=F.writeBatch(db);
   b.set(ref,{d,by,at:F.serverTimestamp()});b.set(F.doc(db,'photoThumbs',id),{d:t,by,at:F.serverTimestamp()});await b.commit();
   FU.set(id,d);T.set(id,t);lsPut(id,t);return 'ph:'+id}catch(e){console.warn('фото: отдельное хранение не удалось, сохраняю как раньше',e.code||e);return d}}};
// миниатюра: до 400 px по длинной стороне, JPEG 0.8; GIF до 120 000 символов остаётся анимированным
function mkThumb(d){return new Promise(res=>{if(/^data:image\/gif;/.test(d)&&d.length<=120000)return res(d);const im=new Image();
 im.onload=()=>{const k=Math.min(1,400/Math.max(im.width,im.height,1)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
  const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,0,0,c.width,c.height);let u=c.toDataURL('image/jpeg',.8);
  if(u.length>60000)u=c.toDataURL('image/jpeg',.6);res(u.length<d.length?u:d.length<=60000?d:u)};im.onerror=()=>res('');im.src=d})}
document.addEventListener('click',async e=>{const a=e.target.closest&&e.target.closest('a[data-phopen]');if(!a)return;e.preventDefault();e.stopPropagation();
 const w=window.open('','_blank');try{const d=await VP.get(a.dataset.phopen,'f');if(!d){w&&w.close();return}const b=await (await fetch(d)).blob(),u=URL.createObjectURL(b);if(w)w.location.href=u;else location.href=u}catch(x){w&&w.close()}},true);
})();
