import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (p) => readFile(new URL('../../' + p, import.meta.url), 'utf8');

// v283: helper-функции формы берутся прямо из panel.js (от MAXPH до newsComposer)
async function kit({ editNews = null, editAn = null, hash = '' } = {}) {
  const src = await read('panel.js');
  const a = src.indexOf('const MAXPH=4'), b = src.indexOf('function newsComposer(');
  assert.ok(a > 0 && b > a, 'блок v283 есть в panel.js');
  const ta = { value: '', selectionEnd: 0, focus() {}, setSelectionRange(x) { this.selectionEnd = x }, dispatchEvent() {} };
  const doc = { activeElement: null, getElementById: (id) => (id === 'pn-x' ? ta : null) };
  const uploads = [];
  const win = { VPPKA_PH: { up: async (d) => { uploads.push(d); return 'ph:up' + uploads.length } }, VPPKA_SAFE: { media: (u) => /^(https:|ph:|data:image\/)/.test(u) } };
  const f = new Function('document', 'window', 'location', 'editNews', 'editAn', 'v', 'msg', 'smallJpeg', 'PHA', 'esc',
    "function isAn(){return String(location.hash||'').split('/')[0]==='#announce'}" + src.slice(a, b) +
    ';return {pics,insAt,delPic,picsFinal,phUsed,picsHTML,ckey,picsReset}');
  const k = f(doc, win, { hash }, editNews, editAn, () => '', () => {}, async () => 'data:image/jpeg;base64,AAA', (u) => `src="${u}"`, (s) => String(s));
  return { ...k, ta, doc, uploads };
}

test('v283: «Вставить фото» ставит метку отдельным абзацем после строки с курсором', async () => {
  const k = await kit();
  k.ta.value = 'Первый абзац.\n\nВторой абзац.';
  k.doc.activeElement = k.ta; k.ta.selectionEnd = 5; // внутри первой строки
  k.insAt(k.ta, '[фото:1]');
  assert.equal(k.ta.value, 'Первый абзац.\n\n[фото:1]\n\nВторой абзац.');
  // в конце текста
  k.ta.selectionEnd = k.ta.value.length;
  k.insAt(k.ta, '[фото:2]');
  assert.equal(k.ta.value, 'Первый абзац.\n\n[фото:1]\n\nВторой абзац.\n\n[фото:2]\n\n');
  // пустое поле
  k.ta.value = ''; k.ta.selectionEnd = 0; k.insAt(k.ta, '[фото:1]');
  assert.equal(k.ta.value, '[фото:1]\n\n');
});

test('v283: × убирает фото и его метку, номера остальных сдвигаются', async () => {
  const k = await kit();
  k.pics().push('ph:a', 'ph:b', 'ph:c');
  k.ta.value = 'А\n\n[фото:1]\n\nБ\n\n[фото:2]\n\nВ\n\n[фото:3]';
  k.delPic(1);
  assert.deepEqual(k.pics(), ['ph:a', 'ph:c']);
  assert.equal(k.ta.value, 'А\n\n[фото:1]\n\nБ\n\nВ\n\n[фото:2]');
});

test('v283: при сохранении новые фото загружаются, метки пересчитываются под photos + image', async () => {
  // правка старой новости: https-картинка (image) стоит первой, затем новое фото
  const k = await kit({ editNews: { id: 'n1', photos: [], image: 'https://ex.com/a.jpg' } });
  assert.deepEqual(k.pics(), ['https://ex.com/a.jpg']);
  k.pics().push('data:image/jpeg;base64,BBB');
  const r = await k.picsFinal('Текст\n\n[фото:2]\n\nЕщё\n\n[фото:1]');
  assert.deepEqual(r.photos, ['ph:up1']);
  assert.equal(r.image, 'https://ex.com/a.jpg');
  // итог nph = photos + image = [ph:up1, https…] → бывшее «2» становится «1», бывшее «1» — «2»
  assert.equal(r.text, 'Текст\n\n[фото:1]\n\nЕщё\n\n[фото:2]');
  // повторное сохранение не загружает фото второй раз
  await k.picsFinal('x');
  assert.equal(k.uploads.length, 1);
});

test('v283: недопустимая ссылка фото не сохраняется', async () => {
  const k = await kit({ editNews: { id: 'n2', photos: ['javascript:alert(1)'] } });
  const r = await k.picsFinal('t');
  assert.equal(typeof r, 'string');
});

test('v283: черновики фото у новости и объявления раздельные', async () => {
  const n = await kit({ hash: '#news' });
  n.pics().push('ph:x');
  assert.equal(n.ckey(), 'n');
  const a = await kit({ hash: '#announce', editAn: { id: 'z', photos: ['ph:q'] } });
  assert.equal(a.ckey(), 'a:z');
  assert.deepEqual(a.pics(), ['ph:q']);
  assert.match(a.picsHTML('[фото:1]'), /в тексте/);
  assert.match(a.picsHTML(''), /в конце объявления/);
});

test('v283: форма — кнопка, предпросмотр, paste/drop; старой автодописки меток нет', async () => {
  const p = await read('panel.js');
  assert.match(p, /id="nw-ins"/);
  assert.match(p, /id="nw-pvb"/);
  assert.match(p, /addEventListener\('paste'/);
  assert.match(p, /addEventListener\('drop'/);
  assert.doesNotMatch(p, /n\.text\+='\\n\\n\[фото:'/);
  assert.doesNotMatch(p, /id="pn-f"/);
  // оба сохранения (новость и объявление) идут через picsFinal
  assert.equal((p.match(/await picsFinal\(n\.text\)/g) || []).length, 2);
  const app = await read('app.js');
  assert.match(app, /window\.VPPKA_NBODY=nbody/);
});

test('v283: рендер — фото на месте метки и не повторяется в конце; без меток как раньше', async () => {
  const app = await read('app.js');
  const a = app.indexOf('const nrich='), b = app.indexOf('const nts=');
  const f = new Function('esc', 'PHH', 'PHA', 'vemb', 'const window={};' + app.slice(a, b) + ';return nbody');
  const nbody = f((s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]), (u) => `href="${u}"`, (u) => `src="${u}"`, () => '');
  const h = nbody({ title: 't', text: 'Раз\n\n[фото:2]\n\nДва <b>', photos: ['ph:a', 'ph:b'] });
  assert.ok(h.indexOf('ph:b') > h.indexOf('Раз') && h.indexOf('ph:b') < h.indexOf('Два'));
  assert.equal(h.split('src="ph:b"').length - 1, 1, 'фото из текста не повторяется в галерее');
  assert.match(h, /Два &lt;b&gt;/);
  const old = nbody({ title: 't', text: 'Раз\n\nДва', photos: ['ph:a'], image: 'https://x/y.jpg' });
  assert.equal(old, '<p class="lead">Раз</p><p class="lead">Два</p><div class="nphotos big"><a href="ph:a" target="_blank"><img src="ph:a" alt="t" loading="lazy"></a><a href="https://x/y.jpg" target="_blank"><img src="https://x/y.jpg" alt="t" loading="lazy"></a></div>');
});

test('v283: метки не видны в колокольчике и на главной', async () => {
  const n = await read('notif.js');
  assert.match(n, /String\(x\.text\)\.replace\(\/\\\[фото:\\d\+\\\]\/gi,''\)/);
  const p = await read('panel.js');
  assert.match(p, /anTx=s=>esc\(String\(s\|\|''\)\.replace\(\/\^\[ \\t\]\*\\\[фото:/);
});
