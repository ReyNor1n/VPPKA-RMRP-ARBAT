// node --test tools/test/staging-isolation.test.js
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import { buildStaging } from '../build-staging.mjs';
import { prodNames, toDemo } from '../staging/demo.mjs';
import { MARKERS, PROD_HOSTS, assertBackend, blocked } from '../staging/policy.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const base = 'https://preview.example/';

const CASES = [
  ['/content.json', true, false],
  ['https://preview.example/app.js', true, false],
  ['https://firestore.googleapis.com/v1/projects/vppca-rmrp/databases/(default)/documents/users', true, true],
  ['https://firestore.googleapis.com/v1/projects/other/databases/(default)/documents/a', true, true],
  ['https://firestore.googleapis.com/v1/projects/other/databases/(default)/documents/a', false, false],
  ['https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyAkQy3J_73B9vwFBnZ0mS8xt2ZMG3Twn-8', false, true],
  ['https://discord.com/api/v10/channels/1/messages', false, true],
  ['https://discord.com/api/webhooks/1/token', true, true],
  ['https://discord.com/oauth2/authorize?client_id=1560986799927599205&redirect_uri=https%3A%2F%2Fvppka-arbat-rmrp.ru%2F', false, true],
  ['https://discord.com/oauth2/authorize?client_id=123456789012345678', false, false],
  ['https://discord.com/oauth2/authorize?client_id=123456789012345678', true, true],
  ['https://discord.gg/AMx3X6w8KJ', false, true],
  ['https://fcm.googleapis.com/fcm/send', false, true],
  ['https://fcmregistrations.googleapis.com/v1/projects/other/registrations', false, true],
  ['https://www.youtube.com/iframe_api', true, false],
  ['https://vppka-arbat-rmrp.ru/index.html', true, true],
  ['https://vppca-rmrp.firebaseapp.com/__/auth/handler', false, true],
];

function memStore(seed) {
  const map = new Map(seed || []);
  return {
    get length() { return map.size; },
    key(i) { return [...map.keys()][i] ?? null; },
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(String(k), String(v)); },
    removeItem(k) { map.delete(String(k)); },
    clear() { map.clear(); },
    map,
  };
}

function bootGuard(source, hostname) {
  const ls = memStore([['vppka-me', '{"uid":"prod"}'], ['vppka-vol', '1']]);
  const ss = memStore();
  const opened = [];
  const deleted = [];
  const fetched = [];
  const beacons = [];
  const idb = [];
  const assigned = [];
  const listeners = {};
  function XMLHttpRequest() { this.__stg = false; }
  XMLHttpRequest.prototype.open = function () {};
  XMLHttpRequest.prototype.send = function () { fetched.push('xhr-sent'); };
  function WebSocket(url) { this.url = url; }
  function EventSource(url) { this.url = url; }
  const sandbox = {
    URL, Promise, TypeError, Error, console,
    XMLHttpRequest, WebSocket, EventSource,
    location: {
      href: 'https://' + hostname + '/',
      origin: 'https://' + hostname,
      hostname,
      protocol: 'https:',
      assign(url) { assigned.push(['assign', url]); },
      replace(url) { assigned.push(['replace', url]); },
    },
    document: {
      readyState: 'complete',
      body: { innerHTML: '' },
      addEventListener(type, fn) { listeners[type] = fn; },
      getElementById() { return null; },
    },
    localStorage: ls,
    sessionStorage: ss,
    indexedDB: { open(name) { idb.push(name); return { name }; } },
    caches: {
      open: async name => { opened.push(name); return {}; },
      delete: async name => { deleted.push(name); return true; },
    },
    navigator: {
      sendBeacon(url) { beacons.push(url); return true; },
      serviceWorker: { register: async url => fetched.push('sw:' + url) },
    },
    fetch: async input => { fetched.push(String(typeof input === 'string' ? input : input.url)); return { ok: true }; },
    open() { return null; },
  };
  sandbox.window = sandbox;
  sandbox.navigator.sendBeacon = sandbox.navigator.sendBeacon.bind(sandbox.navigator);
  vm.runInNewContext(source, sandbox);
  return { sandbox, ls, opened, deleted, fetched, beacons, idb, assigned, listeners };
}

function bootSw(source, hostname) {
  const cache = source.match(/var CACHE="([^"]+)"/)[1];
  const deleted = [];
  const opened = [];
  const fetched = [];
  let claimed = false;
  let unregistered = false;
  const listeners = {};
  const self = {
    location: { hostname, origin: 'https://' + hostname },
    skipWaiting() {},
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    registration: { unregister: async () => { unregistered = true; } },
    clients: { claim: async () => { claimed = true; } },
  };
  const sandbox = {
    self, URL, Response, Promise, TypeError, console,
    clients: self.clients,
    caches: {
      async open(name) {
        opened.push(name);
        return { async addAll() {}, async put() {}, async keys() { return []; }, async delete() {} };
      },
      async keys() { return ['vppka-v235', 'vppka-banners', 'vppka-music', 'vppka-staging-old', cache, 'other']; },
      async delete(name) { deleted.push(name); return true; },
      async match() { return undefined; },
    },
    fetch: async input => {
      fetched.push(String(input && input.url || input));
      return { ok: true, clone() { return this; } };
    },
  };
  vm.runInNewContext(source, sandbox);
  return { cache, listeners, deleted, opened, fetched, get claimed() { return claimed; }, get unregistered() { return unregistered; } };
}

async function fire(list) {
  const pending = [];
  for (const fn of list || []) fn({ waitUntil(p) { pending.push(p); }, notification: { close() { this.closed = true; } } });
  await Promise.all(pending);
}

test('боевые исходники не переписаны под тест', async () => {
  const sw = await readFile(path.join(root, 'sw.js'), 'utf8');
  const cfg = await readFile(path.join(root, 'firebase-config.js'), 'utf8');
  const index = await readFile(path.join(root, 'index.html'), 'utf8');
  assert.match(sw, /const CACHE='vppka-v235'/);
  assert.match(sw, /n!==CACHE&&n!=='vppka-banners'&&n!=='vppka-music'/);
  assert.match(cfg, /projectId: "vppca-rmrp"/);
  assert.match(index, /https:\/\/\*\.googleapis\.com/);
  assert.match(index, /vppca-rmrp\.firebaseapp\.com/);
  assert.equal(await readFile(path.join(root, 'CNAME'), 'utf8'), 'vppka-arbat-rmrp.ru\n');
});

test('демо-сборка не содержит боевой backend и персональные данные', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'vppka-stg-'));
  try {
    const built = await buildStaging({ root, out: dir });
    assert.equal(built.demo, true);
    assert.match(built.cache, /^vppka-staging-v/);
    const index = await readFile(path.join(dir, 'index.html'), 'utf8');
    const content = JSON.parse(await readFile(path.join(dir, 'content.json'), 'utf8'));
    const firebase = await readFile(path.join(dir, 'firebase-config.js'), 'utf8');
    const sw = await readFile(path.join(dir, 'sw.js'), 'utf8');
    const net = await readFile(path.join(dir, 'staging-net.js'), 'utf8');
    const text = JSON.stringify(content);
    const prod = JSON.parse(await readFile(path.join(root, 'content.json'), 'utf8'));
    assert.match(index, /ТЕСТОВАЯ ВЕРСИЯ/);
    assert.ok(index.indexOf('staging-ui.js') < index.indexOf('src="app.js'), 'заглушки должны встать до app.js');
    assert.match(index, /noindex, nofollow/);
    assert.doesNotMatch(index, /googleapis/);
    assert.doesNotMatch(index, /vppca-rmrp/);
    assert.doesNotMatch(index, /vppka-arbat-rmrp\.ru/);
    assert.match(firebase, /PASTE_/);
    assert.match(firebase, /staging-local-demo/);
    assert.doesNotMatch(firebase, /vppca-rmrp/);
    assert.equal(content.news.length, 1);
    assert.equal(content.news[0].title, 'Тестовая новость');
    assert.equal(content.contacts.items[0].url, '');
    for (const name of prodNames(prod)) assert.equal(text.includes(name), false, name);
    for (const m of prod.leadership.members) {
      if (String(m.id || '').startsWith('p_')) assert.equal(text.includes(m.id), false, m.id);
    }
    assert.equal(text.includes('discordId'), false);
    assert.equal(text.includes('img/members'), false);
    assert.equal(text.includes('img/uploads'), false);
    assert.match(content.leadership.members.find(m => m.id === 'm1').name, /Тестов Иван Петрович/);
    await assert.rejects(access(path.join(dir, 'CNAME')));
    await assert.rejects(access(path.join(dir, 'img', 'members')));
    await assert.rejects(access(path.join(dir, 'tools')));
    assert.match(await readFile(path.join(dir, 'robots.txt'), 'utf8'), /Disallow: \//);
    assert.match(sw, new RegExp(built.cache));
    assert.doesNotMatch(sw, /vppka-banners/);
    assert.match(net, /vppca-rmrp/);
    for (const [url, demo, want] of CASES) {
      if (!demo) continue;
      assert.equal(blocked(url, base, true), want, url);
      const g = bootGuard(net, 'preview.example');
      assert.equal(g.sandbox.__VPPKA_STAGING_BLOCKED(url), want, 'script ' + url);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('хранилище и кэш страницы не пересекаются с боевыми ключами', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'vppka-stg-'));
  try {
    await buildStaging({ root, out: dir });
    const net = await readFile(path.join(dir, 'staging-net.js'), 'utf8');
    const g = bootGuard(net, 'preview.example');
    assert.equal(g.ls.getItem('vppka-me'), null);
    g.ls.setItem('vppka-me', '{"uid":"staging"}');
    g.ls.setItem('vppka-vol', '0.7');
    assert.equal(g.ls.map.get('vppka-me'), '{"uid":"prod"}');
    assert.equal(g.ls.map.get('vppka-vol'), '1');
    assert.equal(g.ls.map.get('vppka-staging:vppka-me'), '{"uid":"staging"}');
    assert.equal(g.ls.map.get('vppka-staging:vppka-vol'), '0.7');
    assert.equal(g.ls.getItem('vppka-me'), '{"uid":"staging"}');
    g.ls.clear();
    assert.equal(g.ls.map.get('vppka-me'), '{"uid":"prod"}');
    assert.equal(g.ls.map.has('vppka-staging:vppka-vol'), false);
    await g.sandbox.caches.open('vppka-banners');
    await g.sandbox.caches.open('vppka-music');
    assert.deepEqual(g.opened, ['vppka-staging-vppka-banners', 'vppka-staging-vppka-music']);
    assert.equal(await g.sandbox.caches.delete('vppka-v235'), false);
    assert.deepEqual(g.deleted, []);
    assert.equal(await g.sandbox.caches.delete('vppka-staging-v1'), true);
    assert.deepEqual(g.deleted, ['vppka-staging-v1']);
    g.sandbox.indexedDB.open('firebase-heartbeat-database');
    assert.deepEqual(g.idb, ['vppka-staging:firebase-heartbeat-database']);
    assert.throws(() => g.sandbox.indexedDB.open('firestore/vppca-rmrp/default'));
    await assert.rejects(g.sandbox.fetch('https://firestore.googleapis.com/v1/projects/vppca-rmrp/databases/(default)/documents/users'));
    await assert.rejects(g.sandbox.fetch('https://discord.com/api/webhooks/1/x'));
    const ok = await g.sandbox.fetch('/content.json');
    assert.equal(ok.ok, true);
    assert.deepEqual(g.fetched, ['/content.json']);
    const xhr = new g.sandbox.XMLHttpRequest();
    assert.throws(() => { xhr.open('POST', 'https://discord.com/api/v10/channels/1/messages'); xhr.send('{}'); });
    assert.throws(() => new g.sandbox.WebSocket('wss://gateway.discord.gg/?v=10'));
    assert.equal(g.sandbox.navigator.sendBeacon('https://fcm.googleapis.com/fcm/send', '1'), false);
    assert.deepEqual(g.beacons, []);
    g.sandbox.location.assign('https://discord.com/oauth2/authorize?client_id=1560986799927599205');
    assert.deepEqual(g.assigned, []);
    const a = { href: 'https://discord.gg/AMx3X6w8KJ', closest: null };
    const ev = { target: { closest: () => a }, preventDefault() { this.p = true; }, stopPropagation() { this.s = true; } };
    g.listeners.click(ev);
    assert.equal(ev.p, true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('service worker не удаляет боевые кэши и не ходит в боевой backend', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'vppka-stg-'));
  try {
    await buildStaging({ root, out: dir });
    const source = await readFile(path.join(dir, 'sw.js'), 'utf8');
    const sw = bootSw(source, 'preview.example');
    await fire(sw.listeners.activate);
    assert.deepEqual(sw.deleted, ['vppka-staging-old']);
    assert.equal(sw.claimed, true);
    assert.equal(sw.unregistered, false);
    let blockedRes;
    sw.listeners.fetch[0]({
      request: { method: 'GET', url: 'https://firestore.googleapis.com/v1/projects/vppca-rmrp/databases/(default)/documents/news', mode: 'cors' },
      respondWith(p) { blockedRes = p; },
    });
    assert.equal((await blockedRes).status, 403);
    let other;
    sw.listeners.fetch[0]({
      request: { method: 'GET', url: 'https://other-proj.firebaseio.com/users.json', mode: 'cors' },
      respondWith(p) { other = p; },
    });
    assert.equal((await other).status, 403);
    assert.deepEqual(sw.fetched, []);
    let local;
    sw.listeners.fetch[0]({
      request: { method: 'GET', url: 'https://preview.example/style.css', mode: 'no-cors' },
      respondWith(p) { local = p; },
    });
    await local;
    assert.deepEqual(sw.fetched, ['https://preview.example/style.css']);
    sw.listeners.push[0]({ waitUntil() {} });
    for (const host of PROD_HOSTS) {
      const prod = bootSw(source, host);
      await fire(prod.listeners.install);
      await fire(prod.listeners.activate);
      assert.equal(prod.unregistered, true, host);
      assert.deepEqual(prod.deleted, [], host);
      assert.equal(prod.claimed, false, host);
      assert.equal(prod.listeners.fetch, undefined, host);
      assert.equal(prod.opened.length, 0, host);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('на боевом домене тестовая страница ничего не запрашивает', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'vppka-stg-'));
  try {
    await buildStaging({ root, out: dir });
    const net = await readFile(path.join(dir, 'staging-net.js'), 'utf8');
    const g = bootGuard(net, 'vppka-arbat-rmrp.ru');
    await assert.rejects(g.sandbox.fetch('/content.json'));
    await assert.rejects(g.sandbox.fetch('https://firestore.googleapis.com/v1/projects/vppca-rmrp/databases/(default)/documents/a'));
    assert.match(g.sandbox.document.body.innerHTML, /ТЕСТОВАЯ ВЕРСИЯ/);
    assert.equal(g.ls.map.get('vppka-me'), '{"uid":"prod"}');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('отдельный backend принимается только без боевых идентификаторов', async () => {
  const bad = { firebaseConfig: { apiKey: 'x', authDomain: 'vppca-rmrp.firebaseapp.com', projectId: 'vppca-rmrp', storageBucket: 'b', messagingSenderId: '1', appId: 'a' }, discordOAuth: { clientId: '', redirect: '' } };
  assert.throws(() => assertBackend(bad));
  assert.throws(() => assertBackend({ firebaseConfig: { projectId: 'other-proj', apiKey: MARKERS[1], authDomain: 'other-proj.firebaseapp.com', storageBucket: 's', messagingSenderId: '1', appId: 'a' } }));
  const dir = await mkdtemp(path.join(tmpdir(), 'vppka-stg-'));
  const cfg = path.join(dir, 'backend.json');
  const out = path.join(dir, 'site');
  const backend = {
    firebaseConfig: {
      apiKey: 'AIzaSyDEMOKEY_NOT_PROD_000000000000',
      authDomain: 'vppka-staging-demo.firebaseapp.com',
      projectId: 'vppka-staging-demo',
      storageBucket: 'vppka-staging-demo.appspot.com',
      messagingSenderId: '123456789012',
      appId: '1:123456789012:web:abcdef1234567890',
    },
    appCheckSiteKey: '',
    discordOAuth: { clientId: '', redirect: 'https://preview.example/' },
  };
  await writeFile(cfg, JSON.stringify(backend));
  try {
    const built = await buildStaging({ root, out, backend: cfg });
    assert.equal(built.demo, false);
    const firebase = await readFile(path.join(out, 'firebase-config.js'), 'utf8');
    const index = await readFile(path.join(out, 'index.html'), 'utf8');
    const net = await readFile(path.join(out, 'staging-net.js'), 'utf8');
    assert.match(firebase, /vppka-staging-demo/);
    assert.doesNotMatch(firebase, /PASTE_/);
    assert.doesNotMatch(firebase, /vppca-rmrp/);
    assert.match(index, /ТЕСТОВАЯ ВЕРСИЯ/);
    assert.match(index, /https:\/\/vppka-staging-demo\.firebaseapp\.com/);
    assert.doesNotMatch(index, /vppca-rmrp/);
    const g = bootGuard(net, 'preview.example');
    assert.equal(g.sandbox.__VPPKA_STAGING_BLOCKED('https://firestore.googleapis.com/v1/projects/vppka-staging-demo/databases/(default)/documents/a'), false);
    assert.equal(g.sandbox.__VPPKA_STAGING_BLOCKED('https://firestore.googleapis.com/v1/projects/vppca-rmrp/databases/(default)/documents/users'), true);
    assert.equal(g.sandbox.__VPPKA_STAGING_BLOCKED('https://fcm.googleapis.com/fcm/send'), true);
    assert.equal(g.sandbox.__VPPKA_STAGING_BLOCKED('https://discord.com/api/webhooks/9/x'), true);
    for (const marker of MARKERS) assert.equal(firebase.includes(marker), false, marker);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('демо-данные не оставляют исходные ФИО', () => {
  const prod = { leadership: { members: [{ id: 'm1', name: 'Хлопов Лев Давыдович', discordId: '646280678736003073', photo: 'img/members/m1.jpg' }, { id: 'p_uidexample0123456789abcd', name: 'Вакансия' }] }, news: [{ title: 'Хлопов Лев Давыдович', text: 'секретно' }], home: { trio: [{ memberId: 'm1', name: 'Хлопов Лев Давыдович' }] }, contacts: { items: [{ url: 'https://discord.gg/AMx3X6w8KJ' }] } };
  const demo = toDemo(prod);
  const raw = JSON.stringify(demo);
  assert.equal(raw.includes('Хлопов'), false);
  assert.equal(raw.includes('646280678736003073'), false);
  assert.equal(raw.includes('discord.gg'), false);
  assert.equal(demo.leadership.members[0].name, 'Тестов Иван Петрович');
});
