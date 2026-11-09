// Общие запреты тестовой сборки. Боевые исходники этот модуль не меняет.
export const MARKERS = [
  'vppca-rmrp',
  'AIzaSyAkQy3J_73B9vwFBnZ0mS8xt2ZMG3Twn-8',
  '6LfzMPotAAAAAFmBLMLPxIiVYpbIPuxHT7rUdZnn',
  '1560986799927599205',
  '446917562781',
];

// Хосты, на которых тестовая сборка обязана отказаться работать.
export const PROD_HOSTS = [
  'vppka-arbat-rmrp.ru',
  'www.vppka-arbat-rmrp.ru',
  'reynor1n.github.io',
  'vppca-rmrp.firebaseapp.com',
  'vppca-rmrp.web.app',
  'vppca-rmrp.firebasestorage.app',
];

const SECRET_FILES = new Set(['staging-net.js', 'sw.js']);

export function assertBackend(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new Error('Файл backend пустой.');
  const blob = JSON.stringify(cfg);
  for (const marker of MARKERS) {
    if (blob.includes(marker)) throw new Error('В тестовый backend попал боевой идентификатор (' + marker.slice(0, 12) + '…). Сборка остановлена.');
  }
  if (blob.includes('vppka-arbat-rmrp.ru') || blob.includes('discord.gg/AMx3X6w8KJ')) {
    throw new Error('Нельзя указывать боевой домен или боевое приглашение Discord.');
  }
  const id = cfg.firebaseConfig && cfg.firebaseConfig.projectId;
  if (!id || !/^[a-z0-9-]{6,30}$/.test(id)) throw new Error('Нужен отдельный firebase projectId (не боевой).');
  const dc = cfg.discordOAuth && cfg.discordOAuth.clientId;
  if (dc && !/^\d{17,21}$/.test(String(dc))) throw new Error('discordOAuth.clientId должен быть id отдельного приложения Discord или пустым.');
  return cfg;
}

export function auditDist(files) {
  const errors = [];
  for (const [rel, text] of files) {
    if (SECRET_FILES.has(rel)) continue;
    for (const marker of MARKERS) {
      if (text.includes(marker)) errors.push(rel + ' содержит боевой идентификатор');
    }
    if (rel === 'content.json' && /discord\.gg|discord\.com\/api|googleapis\.com/i.test(text)) {
      errors.push('content.json ссылается на Discord API или Google API');
    }
  }
  const net = files.get('staging-net.js') || '';
  const sw = files.get('sw.js') || '';
  if (!net.includes('vppca-rmrp') || !sw.includes('vppca-rmrp')) errors.push('блокировка боевого проекта не вшита в staging-net.js и sw.js');
  if (!/vppka-staging-/.test(sw)) errors.push('service worker без префикса кэша vppka-staging-');
  if (/n!==CACHE&&n!=='vppka-banners'/.test(sw)) errors.push('service worker удаляет чужие кэши, как боевой');
  return errors;
}

export function scrubText(text) {
  return String(text)
    .replaceAll(MARKERS[1], '')
    .replaceAll(MARKERS[2], '')
    .replaceAll(MARKERS[3], '')
    .replaceAll(MARKERS[4], '')
    .replaceAll(MARKERS[0], 'staging-blocked')
    .replaceAll('https://discord.gg/AMx3X6w8KJ', 'https://staging.invalid/no-discord')
    .replaceAll('t3t4KPD2bDasFw1gPLWAA0W8jCL2', 'staging-redacted-user')
    .replaceAll('ZpVGAXbbg1a9I8kRsNEm0OU8QAt2', 'staging-redacted-user-2')
    .replace(/\b\d{17,21}\b/g, m => '0'.repeat(m.length));
}

function hostBlocked(host, href, demo) {
  host = String(host || '').toLowerCase();
  href = String(href || '');
  for (const marker of MARKERS) if (href.includes(marker)) return true;
  if (PROD_HOSTS.includes(host)) return true;
  if (host === 'fcm.googleapis.com' || host === 'fcmregistrations.googleapis.com' || host === 'updates.push.services.mozilla.com') return true;
  const discord = /(^|\.)discord(app)?\.com$/.test(host) || host === 'discord.gg' || host.endsWith('.discord.gg') || host === 'discord.media' || host.endsWith('.discord.media');
  if (demo) {
    if (host === 'googleapis.com' || host.endsWith('.googleapis.com')) return true;
    if (host === 'gstatic.com' || host.endsWith('.gstatic.com')) return true;
    if (host === 'google.com' || host.endsWith('.google.com')) return true;
    if (host === 'firebaseio.com' || host.endsWith('.firebaseio.com')) return true;
    if (host === 'firebaseapp.com' || host.endsWith('.firebaseapp.com')) return true;
    if (discord) return true;
    return false;
  }
  if (discord) {
    try {
      const u = new URL(href);
      if (/\/api(\/|$)/.test(u.pathname) || /webhook/i.test(u.pathname)) return true;
    } catch { return true; }
    if (host === 'discord.gg' || host.endsWith('.discord.gg')) return true;
  }
  return false;
}

// Та же проверка, что во вшитом скрипте: тесты вызывают её, а сборка вставляет списки в браузерный файл.
export function blocked(url, base, demo) {
  const s = String(url || '');
  if (!s || s.startsWith('data:') || s.startsWith('blob:') || s.startsWith('#')) return false;
  let u;
  try { u = new URL(s, base || 'https://staging.local/'); } catch { return true; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:' && u.protocol !== 'ws:' && u.protocol !== 'wss:') return false;
  const origin = new URL(base || 'https://staging.local/').origin;
  if (u.origin === origin) return false;
  return hostBlocked(u.hostname, u.href, demo !== false);
}

export function renderNet(demo) {
  return `/* Тестовая сборка: сеть, хранилище и service worker отделены от боевого сайта. */
(function(window){
'use strict';
var DEMO=${demo ? 'true' : 'false'};
var MARKERS=${JSON.stringify(MARKERS)};
var PROD=${JSON.stringify(PROD_HOSTS)};
var P='vppka-staging:';
var location=window.location, document=window.document;
function prodHost(h){h=String(h||'').toLowerCase();for(var i=0;i<PROD.length;i++)if(h===PROD[i])return true;return false}
function blocked(url){
  var s=String(url==null?'':url);
  if(!s||s.indexOf('data:')===0||s.indexOf('blob:')===0)return false;
  var u;try{u=new URL(s,location.href)}catch(e){return true}
  if(u.protocol!=='http:'&&u.protocol!=='https:'&&u.protocol!=='ws:'&&u.protocol!=='wss:')return false;
  if(u.origin===location.origin)return false;
  var host=u.hostname.toLowerCase(),href=u.href,i;
  function ends(h,b){return h===b||h.endsWith('.'+b)}
  for(i=0;i<MARKERS.length;i++)if(href.indexOf(MARKERS[i])!==-1)return true;
  for(i=0;i<PROD.length;i++)if(host===PROD[i])return true;
  if(ends(host,'fcm.googleapis.com')||ends(host,'fcmregistrations.googleapis.com')||host==='updates.push.services.mozilla.com')return true;
  var discord=/(^|\\.)discord(app)?\\.com$/.test(host)||ends(host,'discord.gg')||ends(host,'discord.media');
  if(DEMO){
    if(ends(host,'googleapis.com')||ends(host,'gstatic.com')||ends(host,'google.com')||ends(host,'firebaseio.com')||ends(host,'firebaseapp.com')||discord)return true;
    return false;
  }
  if(discord){
    if(/\\/api(\\/|$)/.test(u.pathname)||/webhook/i.test(u.pathname))return true;
    if(host==='discord.gg'||host.slice(-11)==='.discord.gg')return true;
  }
  return false;
}
window.__VPPKA_STAGING_BLOCKED=blocked;
if(prodHost(location.hostname)){
  window.fetch=function(){return Promise.reject(new TypeError('Тестовая сборка не запускается на боевом домене'))};
  var show=function(){if(document.body)document.body.innerHTML='<p id="vppka-test">ТЕСТОВАЯ ВЕРСИЯ не открывается на боевом домене.</p>'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show);else show();
  return;
}
var origFetch=window.fetch;
window.fetch=function(input,init){
  var url=typeof input==='string'?input:(input&&input.url);
  if(blocked(url))return Promise.reject(new TypeError('Тестовая версия: запрос к боевому серверу заблокирован'));
  return origFetch.apply(window,arguments);
};
if(window.XMLHttpRequest){
  var xo=XMLHttpRequest.prototype.open,xs=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(m,url){this.__stg=blocked(url);return xo.apply(this,arguments)};
  XMLHttpRequest.prototype.send=function(){if(this.__stg)throw new TypeError('Тестовая версия: запрос к боевому серверу заблокирован');return xs.apply(this,arguments)};
}
if(window.WebSocket){
  var WS=window.WebSocket;
  window.WebSocket=function(url,proto){if(blocked(url))throw new TypeError('Тестовая версия: сокет к боевому серверу заблокирован');return proto===undefined?new WS(url):new WS(url,proto)};
  window.WebSocket.prototype=WS.prototype;
}
if(window.EventSource){
  var ES=window.EventSource;
  window.EventSource=function(url,opts){if(blocked(url))throw new TypeError('Тестовая версия: поток к боевому серверу заблокирован');return new ES(url,opts)};
}
if(navigator.sendBeacon){
  var sb=navigator.sendBeacon.bind(navigator);
  navigator.sendBeacon=function(url,data){if(blocked(url))return false;return sb(url,data)};
}
var assign=location.assign&&location.assign.bind(location),replace=location.replace&&location.replace.bind(location);
if(assign)location.assign=function(url){if(blocked(url))return;return assign(url)};
if(replace)location.replace=function(url){if(blocked(url))return;return replace(url)};
if(window.open){
  var op=window.open.bind(window);
  window.open=function(url){if(url&&blocked(url))return null;return op.apply(window,arguments)};
}
document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest&&e.target.closest('a[href]');
  if(!a||!blocked(a.href))return;
  e.preventDefault();e.stopPropagation();
},true);
function wrapStore(store){
  if(!store||store.__stg)return;
  var get=store.getItem.bind(store),set=store.setItem.bind(store),rem=store.removeItem.bind(store),key=store.key&&store.key.bind(store);
  store.getItem=function(k){return get(P+k)};
  store.setItem=function(k,v){return set(P+k,v)};
  store.removeItem=function(k){return rem(P+k)};
  store.clear=function(){if(!key)return;var ks=[],i;for(i=0;i<store.length;i++)ks.push(key(i));ks.forEach(function(k){if(k&&k.indexOf(P)===0)rem(k)})};
  try{store.__stg=1}catch(e){}
}
try{wrapStore(window.localStorage);wrapStore(window.sessionStorage)}catch(e){}
if(window.indexedDB&&indexedDB.open){
  var iopen=indexedDB.open.bind(indexedDB);
  indexedDB.open=function(name,version){
    var n=String(name||'');
    if(n.indexOf('vppca-rmrp')!==-1)throw new TypeError('Тестовая версия: боевая база заблокирована');
    if(n.indexOf(P)!==0)n=P+n;
    return version===undefined?iopen(n):iopen(n,version);
  };
}
if(window.caches&&caches.open){
  var copen=caches.open.bind(caches),cdel=caches.delete.bind(caches);
  caches.open=function(name){var n=String(name||'');if(n.indexOf('vppka-staging-')!==0)n='vppka-staging-'+n;return copen(n)};
  caches.delete=function(name){if(String(name||'').indexOf('vppka-staging-')!==0)return Promise.resolve(false);return cdel(name)};
}
if(navigator.serviceWorker&&navigator.serviceWorker.register){
  var reg=navigator.serviceWorker.register.bind(navigator.serviceWorker);
  navigator.serviceWorker.register=function(url,opts){
    if(prodHost(location.hostname))return Promise.reject(new TypeError('service worker тестовой сборки на боевом домене не ставится'));
    return reg(url,opts);
  };
}
})(window);
`;
}

export function renderSw(cacheName, demo) {
  return `/* Тестовый service worker. Чужие кэши (боевой сайт, музыка, баннеры) не удаляет. */
var CACHE=${JSON.stringify(cacheName)};
var DEMO=${demo ? 'true' : 'false'};
var MARKERS=${JSON.stringify(MARKERS)};
var PROD=${JSON.stringify(PROD_HOSTS)};
function prodHost(){var h=String(self.location.hostname||'').toLowerCase();for(var i=0;i<PROD.length;i++)if(h===PROD[i])return true;return false}
function bad(url){
  try{
    var u=new URL(url),host=u.hostname.toLowerCase(),href=u.href,i;
    function ends(h,b){return h===b||h.endsWith('.'+b)}
    for(i=0;i<MARKERS.length;i++)if(href.indexOf(MARKERS[i])!==-1)return true;
    for(i=0;i<PROD.length;i++)if(host===PROD[i])return true;
    if(ends(host,'fcm.googleapis.com')||ends(host,'fcmregistrations.googleapis.com')||host==='updates.push.services.mozilla.com')return true;
    var discord=/(^|\\.)discord(app)?\\.com$/.test(host)||ends(host,'discord.gg')||ends(host,'discord.media');
    if(DEMO){
      if(ends(host,'googleapis.com')||ends(host,'gstatic.com')||ends(host,'google.com')||ends(host,'firebaseio.com')||ends(host,'firebaseapp.com')||discord)return true;
      return false;
    }
    if(discord&&(/\\/api(\\/|$)/.test(u.pathname)||/webhook/i.test(u.pathname)||host==='discord.gg'))return true;
    return false;
  }catch(e){return true}
}
if(prodHost()){
  self.addEventListener('install',function(e){e.waitUntil(self.skipWaiting())});
  self.addEventListener('activate',function(e){e.waitUntil(self.registration.unregister())});
}else{
  self.addEventListener('install',function(e){
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(['./','index.html','staging-net.js','guard.js','style.css','app.js','search.js','content.json','img/emblem.png']).catch(function(){})}));
  });
  self.addEventListener('activate',function(e){
    e.waitUntil(caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(n){return n.indexOf('vppka-staging-')===0&&n!==CACHE}).map(function(n){return caches.delete(n)}));
    }).then(function(){return self.clients.claim()}));
  });
  self.addEventListener('fetch',function(e){
    var r=e.request,u;try{u=new URL(r.url)}catch(err){return}
    if(bad(r.url)){e.respondWith(new Response('',{status:403,statusText:'staging blocked'}));return}
    if(r.method!=='GET'||u.origin!==self.location.origin)return;
    if(/\\.(mp3|ogg|m4a|wav)$/i.test(u.pathname))return;
    var net=fetch(r).then(function(res){if(res&&res.ok){var c=res.clone();caches.open(CACHE).then(function(box){box.put(r,c)})}return res});
    e.respondWith(net.catch(function(){return caches.match(r).then(function(m){return m||(r.mode==='navigate'?caches.match('index.html'):Promise.reject(new TypeError('network')))})}));
  });
  self.addEventListener('push',function(){});
  self.addEventListener('notificationclick',function(e){if(e.notification&&e.notification.close)e.notification.close()});
}
self.addEventListener('message',function(e){if(!prodHost()&&e.data==='skip')self.skipWaiting()});
`;
}
