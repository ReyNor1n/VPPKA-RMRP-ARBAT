// Разбор любой ссылки YouTube → {id, list, start}; встраивание через youtube-nocookie.com. Общий для музыки профиля и видео в новостях.
// Понимает: watch?v= (с любыми &t= &list= &si= &feature= &pp= …), youtu.be/ID, shorts/ live/ embed/ v/ e/ vi/ watch/,
// m. / music. / gaming. / www. / без www, http/https/без протокола, youtube-nocookie.com, playlist?list=, embed/videoseries?list=,
// attribution_link?u=…, oembed?url=…, consent.youtube.com?continue=…, #t=…, старые #!v=, голый 11-символьный ID.
(function(root){
 const ID=/^[\w-]{11}$/,LIST=/^[\w-]{12,64}$/;
 const HOST=/^(?:[\w-]+\.)*(?:youtube\.com|youtube-nocookie\.com|youtube\.googleapis\.com|youtu\.be)$/i;
 // таймкод: 90 | 90s | 1m30s | 1h2m3s | 1:30 | 1:02:03
 function secs(v){v=String(v||'').trim().toLowerCase();if(!v)return 0;let m;
  if(/^\d+(\.\d+)?s?$/.test(v))return Math.floor(parseFloat(v));
  if((m=v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/))&&(m[1]||m[2]||m[3]))return (+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0);
  if(/^\d+(:\d{1,2}){1,2}$/.test(v))return v.split(':').reduce((a,x)=>a*60+(+x),0);
  return 0}
 function params(s){const o={};String(s||'').replace(/^[?#!\/]+/,'').split(/[&?#]/).forEach(kv=>{if(!kv)return;const i=kv.indexOf('=');const k=(i<0?kv:kv.slice(0,i)).toLowerCase();let v=i<0?'':kv.slice(i+1);try{v=decodeURIComponent(v.replace(/\+/g,' '))}catch(e){}if(!(k in o))o[k]=v});return o}
 function parse(input,depth){depth=depth||0;if(depth>3)return null;let s=String(input==null?'':input).trim().replace(/^[<"'(\[]+|[>"')\].,;]+$/g,'');
  if(!s||s.length>2000)return null;if(ID.test(s))return {id:s,list:'',start:0};
  if(/^\/\//.test(s))s='https:'+s;else if(!/^[a-z][a-z0-9+.-]*:/i.test(s))s='https://'+s;
  let u;try{u=new URL(s)}catch(e){return null}
  if(!/^https?:$/i.test(u.protocol))return null;const host=u.hostname.toLowerCase().replace(/\.$/,'');if(!HOST.test(host))return null;
  const q=params(u.search),h=params(u.hash),path=u.pathname.replace(/\/{2,}/g,'/');
  // переадресации: attribution_link?u=/watch?v=…, oembed?url=…, consent.youtube.com/…?continue=…
  if(/^\/(attribution_link|oembed|redirect)\/?$/i.test(path)||/^consent\./.test(host))for(const k of ['u','url','continue','next']){if(q[k]&&q[k].length>1){const r=parse(/^\//.test(q[k])?'https://www.youtube.com'+q[k]:q[k],depth+1);if(r)return r}}
  // старые ссылки вида youtube.com/#/watch?v=… или watch#!v=…
  if(!q.v&&u.hash&&/v=/.test(u.hash)){const hp=params(u.hash.replace(/^#!?\/?(watch)?\??/,''));if(hp.v)Object.assign(q,hp)}
  let id='',m;
  if(/(^|\.)youtu\.be$/.test(host)){m=path.match(/^\/([\w-]{11})(?:[\/?#]|$)/);if(m)id=m[1]}
  else if((m=path.match(/^\/(?:shorts|live|embed|v|e|vi|watch|movie)\/([\w-]{11})(?:[\/?#&;]|$)/i)))id=m[1];
  else if(q.v&&/^[\w-]{11}(?![\w-])/.test(q.v))id=q.v.slice(0,11);
  else if(q.vi&&ID.test(q.vi))id=q.vi;
  else if(q.video_ids){const f=q.video_ids.split(',')[0];if(ID.test(f))id=f}
  if(/^videoseries$/i.test(id))id='';
  let list=q.list||'';if(!LIST.test(list)||/^(WL|LL)$/i.test(list))list='';
  if(!id&&!list)return null;
  // плейлист-«миксы» RD… без видео встроить нельзя
  if(!id&&/^RD/.test(list))return null;
  const start=secs(q.t||h.t||q.start||q.time_continue||'');
  return {id,list,start}}
 function embed(p,o){o=o||{};if(!p)return '';const a=new URLSearchParams();
  let base='https://www.youtube-nocookie.com/embed/';if(p.id){base+=p.id;if(p.list)a.set('list',p.list)}else{base+='videoseries';a.set('list',p.list)}
  if(p.start)a.set('start',String(p.start));a.set('rel','0');a.set('playsinline','1');
  if(o.autoplay)a.set('autoplay','1');if(o.loop&&p.id&&!p.list){a.set('loop','1');a.set('playlist',p.id)}
  if(o.api){a.set('enablejsapi','1');if(o.origin)a.set('origin',o.origin)}
  return base+'?'+a.toString()}
 function canon(p){if(!p)return '';if(!p.id)return 'https://www.youtube.com/playlist?list='+p.list;return 'https://www.youtube.com/watch?v='+p.id+(p.list?'&list='+p.list:'')+(p.start?'&t='+p.start+'s':'')}
 const api={parse,embed,canon,secs,isYT:s=>!!parse(s)};
 if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VPPKA_YT=api})(typeof window!=='undefined'?window:null);
