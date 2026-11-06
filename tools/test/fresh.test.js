import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (p) => readFile(new URL('../../' + p, import.meta.url), 'utf8');

test('онлайн-путь не рисует состав и новости из файла, пока нет снимка', async () => {
  const app = await read('app.js');
  assert.match(app, /VPPKA_FRESH=navigator\.onLine\?'wait':'file'/);
  assert.match(app, /VPPKA_FRESH==='wait'\?\[\]:C\.leadership\.members/);
  assert.match(app, /VPPKA_FRESH==='wait'\?\[\]:\(C\.news/);
  assert.match(app, /pendM\(\)/);
  assert.match(app, /Загрузка…/);
  assert.match(app, /data-build/);
  assert.match(app, /String\(ver\)===String\(build\)/);
});

test('объявление не говорит «нет», пока снимок не пришёл', async () => {
  const panel = await read('panel.js');
  assert.match(panel, /if\(!hnReady\)return/);
  assert.match(panel, /an-wait/);
  assert.doesNotMatch(panel, /if\(\/\^#\?\(home\)\?\$\/\.test\(location\.hash\)\)window\.route\(\)/);
});

test('guard сверяет сборку до показа и не зацикливает reload', async () => {
  const guard = await read('guard.js');
  assert.match(guard, /version\.json\?t=/);
  assert.match(guard, /vppka-reload-at/);
  assert.match(guard, /searchParams\.set\('_r'/);
  assert.match(guard, /15000/);
  assert.match(guard, /!navigator\.onLine/);
});

test('bump обновляет lastmod карты сайта', async () => {
  const bump = await read('tools/bump.mjs');
  assert.match(bump, /sitemap\.xml/);
  assert.match(bump, /<lastmod>/);
});
