import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (p) => readFile(new URL('../../' + p, import.meta.url), 'utf8');
const CITIZEN = '1560748959641632858', MEMBER = '1559635259635531947';
const NEWS = '1570718297790353459', FACTION = '1570718457681412217';
const OTHER = '1559666666666666601', EVERYONE = '1557758930959081502';

const RID = "const RID=x=>/^\\d{15,21}$/.test(String(x||'')),RCOL=c=>/^#[0-9a-f]{6}$/i.test(String(c||''))?String(c):'';";

async function slice() {
  const src = await read('panel.js');
  const start = src.indexOf("const NEWS_PING=");
  const end = src.indexOf('const roleOf=');
  assert.ok(start >= 0 && end > start, 'NEWS_PING…pingSelIds есть в panel.js');
  return src.slice(start, end);
}

async function constants() {
  const body = await slice();
  return new Function(RID + body + ';return {NEWS_PING,NEWS_ROLES,NEWS_ROLE_FALLBACK,newsRoleList}')();
}

async function pingSel(draft) {
  const body = await slice();
  return new Function('draft', 'MAXPING', RID + body + ';return pingSelIds()')(draft, 5);
}

test('v281: allowlist из четырёх id в нужном порядке', async () => {
  const { NEWS_PING, NEWS_ROLES, NEWS_ROLE_FALLBACK } = await constants();
  assert.equal(NEWS_PING, NEWS);
  assert.deepEqual(NEWS_ROLES, [CITIZEN, MEMBER, NEWS, FACTION]);
  assert.deepEqual(NEWS_ROLES.map(id => NEWS_ROLE_FALLBACK[id]),
    ['Гражданин', 'Член партии', 'Новости партии', 'Новости фракции ЗК']);
});

test('v281: из большого списка ролей остаются только четыре, подписи и цвета из discordRoles', async () => {
  const { newsRoleList } = await constants();
  const raw = [
    { id: OTHER, name: 'Председатель ЦК ВППКА', color: '#c20b0e' },
    { id: EVERYONE, name: '@everyone', color: '' },
    { id: 'here', name: '@here', color: '' },
    { id: FACTION, name: 'Новости фракции ЗК', color: '#11806a' },
    { id: NEWS, name: 'Новости партии', color: '#2ecc71' },
    { id: MEMBER, name: 'Член партии', color: '#1abc9c' },
    { id: CITIZEN, name: 'Гражданин', color: '' },
    { id: '1570716915008282734', name: 'Агитатор', color: '#3498db' },
  ];
  const L = newsRoleList(raw);
  assert.deepEqual(L.map(r => r.id), [CITIZEN, MEMBER, NEWS, FACTION]);
  assert.deepEqual(L.map(r => r.name), ['Гражданин', 'Член партии', 'Новости партии', 'Новости фракции ЗК']);
  assert.equal(L[1].color, '#1abc9c');
  assert.equal(L[2].color, '#2ecc71');
  assert.equal(L[3].color, '#11806a');
  assert.ok(!L.some(r => /everyone|here|Агитатор|Председатель/i.test(r.name)));
});

test('v281: нет discordRoles — запасные имена, все четыре всё равно в списке', async () => {
  const { newsRoleList } = await constants();
  const L = newsRoleList([]);
  assert.deepEqual(L, [
    { id: CITIZEN, name: 'Гражданин', color: '' },
    { id: MEMBER, name: 'Член партии', color: '' },
    { id: NEWS, name: 'Новости партии', color: '' },
    { id: FACTION, name: 'Новости фракции ЗК', color: '' },
  ]);
  // label из настроек сайта тоже подходит
  const fromCfg = newsRoleList([{ id: MEMBER, label: 'Член партии (настройки)' }]);
  assert.equal(fromCfg[1].name, 'Член партии (настройки)');
  assert.equal(fromCfg[0].name, 'Гражданин');
});

test('v281: переименование роли не ломает id, берётся живое имя', async () => {
  const { newsRoleList } = await constants();
  const L = newsRoleList([{ id: NEWS, name: 'Новости ЦК', color: '#00ff00' }]);
  assert.equal(L[2].id, NEWS);
  assert.equal(L[2].name, 'Новости ЦК');
  assert.equal(L[2].color, '#00ff00');
  assert.equal(L[3].name, 'Новости фракции ЗК');
});

test('v281: по умолчанию «Новости партии»; выбор и «Никого» не подменяются; чужие id отбрасываются', async () => {
  assert.deepEqual(await pingSel({}), [NEWS]);
  assert.deepEqual(await pingSel({ ping: [MEMBER] }), [MEMBER]);
  assert.deepEqual(await pingSel({ ping: [] }), []);
  assert.deepEqual(await pingSel({ ping: [MEMBER, OTHER, NEWS, EVERYONE, FACTION] }), [MEMBER, NEWS, FACTION]);
});

test('v281: в форме есть «Никого»; созывы/объявления не тронуты', async () => {
  const panel = await read('panel.js');
  assert.match(panel, /data-nwnone="1">Никого<\/button>/);
  assert.match(panel, /Никого не упоминать/);
  assert.match(panel, /@everyone и @here не упоминаются/);
  const an = await read('admin-an.js');
  assert.match(an, /roles:\(CFG\(\)\.discord\.defRoles\|\|\[\]\)\.map\(String\)/);
  assert.doesNotMatch(an, /1570718297790353459|1570718457681412217|NEWS_ROLES/);
});
