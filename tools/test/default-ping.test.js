import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (p) => readFile(new URL('../../' + p, import.meta.url), 'utf8');
const NEWS = '1570718297790353459', MEMBER = '1559635259635531947';

// Достаём из panel.js константу и pingSelIds и выполняем с подменёнными RL/draft/cfgRoles.
async function load() {
  const src = await read('panel.js');
  const c = src.match(/const NEWS_PING='(\d+)';/);
  const f = src.match(/function pingSelIds\(\)\{[^\n]*\}/);
  assert.ok(c && f, 'NEWS_PING и pingSelIds есть');
  return (RL, draft, def) => new Function('RL', 'draft', 'cfgRoles', 'MAXPING',
    `const NEWS_PING='${c[1]}';${f[0]};return pingSelIds()`)(RL, draft, () => ({ def }), 5);
}

test('v280: новость по умолчанию упоминает «Новости партии» (по id)', async () => {
  const sel = await load();
  const RL = [{ id: MEMBER }, { id: NEWS }, { id: '1560748959641632858' }];
  assert.deepEqual(sel(RL, {}, [MEMBER]), [NEWS]);
  assert.deepEqual(sel(null, {}, [MEMBER]), [NEWS], 'список ролей ещё грузится');
});

test('v280: выбор пользователя и «Никого» не подменяются', async () => {
  const sel = await load();
  const RL = [{ id: MEMBER }, { id: NEWS }];
  assert.deepEqual(sel(RL, { ping: [MEMBER] }, [MEMBER]), [MEMBER]);
  assert.deepEqual(sel(RL, { ping: [] }, [MEMBER]), []);
});

test('v280: роли «Новости партии» нет в списке — роли по умолчанию из настроек', async () => {
  const sel = await load();
  assert.deepEqual(sel([{ id: MEMBER }], {}, [MEMBER]), [MEMBER]);
});

test('v280: созывы/объявления по-прежнему берут defRoles из настроек', async () => {
  const an = await read('admin-an.js');
  assert.match(an, /roles:\(CFG\(\)\.discord\.defRoles\|\|\[\]\)\.map\(String\)/);
  assert.doesNotMatch(an, /1570718297790353459/);
});
