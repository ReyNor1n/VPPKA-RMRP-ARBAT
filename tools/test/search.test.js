import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ctx = { document: undefined };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('../../search.js', import.meta.url), 'utf8'), ctx);
const find = ctx.VPPKA_FIND;
const content = JSON.parse(fs.readFileSync(new URL('../../content.json', import.meta.url), 'utf8'));
ctx.VPPKA_C = () => content;
ctx.VPPKA_FRESH = 'file';

const empty = { people: [], news: [], events: [], anns: [], docs: { charter: [], program: [], legal: [] } };

test('ё и е — одно и то же, часть слова находится', () => {
  const g = find('елк', { ...empty, people: [{ id: 'm1', name: 'Ёлкин Пётр', role: 'Член партии', group: 'Члены партии' }] });
  assert.equal(g[0].name, 'Руководители и члены партии');
  assert.equal(g[0].items[0].href, '#member/m1');
  assert.match(g[0].items[0].title, /Ёлкин/);
});

test('Романов находится по фамилии, Discord не попадает в выдачу', () => {
  ctx.VPPKA_PARTY = () => [{ id: 'm12', name: 'Романов Александр Николаевич', title: 'Заместитель начальника технического отдела', group: 'Технический отдел', discordId: '123456789012345678', statik: '198-527', bio: 'секрет' }];
  const g = find('романов');
  const hit = g.find(x => x.name.startsWith('Руководители')).items[0];
  assert.match(hit.title, /Романов/);
  assert.match(hit.snip, /технического отдела/i);
  assert.equal(hit.href, '#member/m12');
  const blob = JSON.stringify(g);
  assert.equal(blob.includes('123456789012345678'), false);
  assert.equal(blob.includes('198-527'), false);
  assert.equal(blob.includes('секрет'), false);
  ctx.VPPKA_PARTY = null;
});

test('«членство» открывает статью устава', () => {
  const g = find('членство');
  const ch = g.find(x => x.name === 'Устав');
  assert.ok(ch && ch.items.length);
  assert.match(ch.items[0].href, /^#charter\/ca-\d+-\d+$/);
  assert.match(ch.items[0].title + ch.items[0].snip, /ленств/i);
});

test('доп. должность ищется, казначей из списка не берётся', () => {
  ctx.VPPKA_SUBPOS = ['Начальник пресс-службы', 'Пресс-секретарь', 'Корреспондент', 'Редактор новостей', 'Агитатор'];
  ctx.VPPKA_PARTY = () => [{ id: 'p1', name: 'Иванов Иван Иванович', role: 'Член партии', group: 'Члены партии', subPositions: ['Пресс-секретарь', 'Казначей'] }];
  const g = find('пресс-секретарь');
  const hit = g.find(x => x.name.startsWith('Руководители')).items[0];
  assert.match(hit.title, /Иванов/);
  assert.match(hit.snip.replace(/<[^>]+>/g, ''), /Пресс-секретарь/);
  assert.equal(hit.snip.includes('Казначей'), false);
  const treas = find('казначей').find(x => x.name.startsWith('Руководители'));
  assert.equal(treas, undefined);
  ctx.VPPKA_PARTY = null;
});

test('пустой запрос и запрос ни о чём', () => {
  assert.equal(find('   '), null);
  assert.equal(find('ыыыыыыыы').length, 0);
});

test('обрывок разметки в тексте не вставляется как HTML', () => {
  const g = find('тест', { ...empty, news: [{ id: 'n1', title: 'Тест <script>', text: 'слово <img src=x>' }] });
  assert.match(g[0].items[0].snip, /&lt;img/);
  assert.equal(g[0].items[0].snip.includes('<img'), false);
});
