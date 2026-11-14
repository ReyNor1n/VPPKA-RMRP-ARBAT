import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (p) => readFile(new URL('../../' + p, import.meta.url), 'utf8');
const NEWS = '1570718297790353459', MEMBER = '1559635259635531947';
const RID = "const RID=x=>/^\\d{15,21}$/.test(String(x||'')),RCOL=c=>/^#[0-9a-f]{6}$/i.test(String(c||''))?String(c):'';";

async function pingSel(draft) {
  const src = await read('panel.js');
  const start = src.indexOf("const NEWS_PING=");
  const end = src.indexOf('const roleOf=');
  assert.ok(start >= 0 && end > start, 'NEWS_PING и pingSelIds есть');
  return new Function('draft', 'MAXPING', RID + src.slice(start, end) + ';return pingSelIds()')(draft, 5);
}

test('v280: новость по умолчанию упоминает «Новости партии» (по id)', async () => {
  const src = await read('panel.js');
  assert.match(src, /const NEWS_PING='1570718297790353459';/);
  assert.deepEqual(await pingSel({}), [NEWS]);
});

test('v280: выбор пользователя и «Никого» не подменяются', async () => {
  assert.deepEqual(await pingSel({ ping: [MEMBER] }), [MEMBER]);
  assert.deepEqual(await pingSel({ ping: [] }), []);
});

test('v280: созывы/объявления по-прежнему берут defRoles из настроек', async () => {
  const an = await read('admin-an.js');
  assert.match(an, /roles:\(CFG\(\)\.discord\.defRoles\|\|\[\]\)\.map\(String\)/);
  assert.doesNotMatch(an, /1570718297790353459/);
});
