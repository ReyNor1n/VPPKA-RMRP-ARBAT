const CACHE='vppka-v202';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','style.css','ph.js','app.js','content.json','img/emblem.png']).catch(()=>{})))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE&&n!=='vppka-banners').map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||/\.(mp3|ogg|m4a|wav)$/i.test(u.pathname)||r.headers.has('range')||/admin\.html$/.test(u.pathname)||/\/(robots\.txt|sitemap\.xml|favicon\.ico)$/.test(u.pathname))return;
 const img=/\.(png|jpe?g|webp|gif|svg)$/i.test(u.pathname);if(/version\.json$/.test(u.pathname))return;const net=fetch(img?r:new Request(r,{cache:'no-cache'})).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c))}return res});
 if(img){e.respondWith(caches.match(r).then(m=>m?(net.catch(()=>{}),m):net));return}
 e.respondWith(net.catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):Response.error()))))});
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){d={body:e.data&&e.data.text()}}
 e.waitUntil(self.registration.showNotification(d.title||'Новое сообщение',{body:d.body||'',icon:'img/icons/icon-192.png',badge:'img/icons/icon-192.png',tag:d.tag||'vppka-chat',renotify:true,data:{u:d.u||'',h:d.h||''}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const u=(e.notification.data||{}).u||'',h=(e.notification.data||{}).h||'';if(h){e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{const c=l.find(x=>new URL(x.url).origin===location.origin);if(c){c.postMessage({t:'openHash',h});return c.focus()}return clients.openWindow('./'+h)}));return}
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{const c=l.find(x=>new URL(x.url).origin===location.origin);if(c){c.postMessage({t:'openChat',u});return c.focus()}return clients.openWindow('./'+(u?'#chat/'+u:''))}))});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
