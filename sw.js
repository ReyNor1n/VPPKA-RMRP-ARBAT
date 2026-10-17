const CACHE='vppka-v12';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','style.css','app.js','content.json','img/emblem.png']).catch(()=>{})))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||/admin\.html$/.test(u.pathname))return;
 const net=fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c))}return res});
 if(/\.(png|jpe?g|webp|gif|svg)$/i.test(u.pathname)){e.respondWith(caches.match(r).then(m=>m?(net.catch(()=>{}),m):net));return}
 e.respondWith(net.catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):Response.error()))))});
