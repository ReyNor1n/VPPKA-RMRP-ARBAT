import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (p) => readFile(new URL('../../' + p, import.meta.url), 'utf8');
const CITIZEN = '1560748959641632858', MEMBER = '1559635259635531947';
const NEWS = '1570718297790353459', FACTION = '1570718457681412217';
const RID = "const RID=x=>/^\\d{15,21}$/.test(String(x||'')),RCOL=c=>/^#[0-9a-f]{6}$/i.test(String(c||''))?String(c):'';";

async function helpers() {
  const src = await read('panel.js');
  const start = src.indexOf("const NEWS_PING=");
  const end = src.indexOf('const roleOf=');
  assert.ok(start >= 0 && end > start, 'NEWS_PING…roleOf есть в panel.js');
  return RID + src.slice(start, end);
}

async function pingSel(hash, draft, adraft) {
  const body = await helpers();
  return new Function('location', 'draft', 'adraft', 'MAXPING', body + ';return {ids:pingSelIds(), def:pingDef(), an:isAn(), tabs:newsTabs("announce")} ')({hash: hash || ''}, draft || {}, adraft || {}, 5);
}

test('v282: во вкладке «Новости» есть подвкладки Новости | Объявления', async () => {
  const panel = await read('panel.js');
  const app = await read('app.js');
  assert.match(panel, /function newsTabs\(cur\)/);
  assert.match(panel, /href="#news"/);
  assert.match(panel, /href="#announce"/);
  assert.match(panel, />Новости<\/a>/);
  assert.match(panel, />Объявления<\/a>/);
  assert.match(panel, /class="subtabs"/);
  assert.match(app, /key==='announce'\?'news'/);
  assert.match(app, /k==='announce'&&id!==undefined\?'announcement'/);
  assert.match(app, /announce\(id\)\{/);
  assert.match(app, /href="#announce"/);
});

test('v282: объявление по умолчанию никого не упоминает; новость — «Новости партии»', async () => {
  const news = await pingSel('#news', {});
  const an = await pingSel('#announce', {}, {});
  assert.equal(news.an, false);
  assert.equal(an.an, true);
  assert.deepEqual(news.ids, [NEWS]);
  assert.deepEqual(an.ids, []);
  assert.equal(news.def, NEWS);
  assert.equal(an.def, '');
  assert.deepEqual(await pingSel('#announce', {}, {ping: []}).then(r => r.ids), []);
  assert.deepEqual(await pingSel('#announce', {}, {ping: [CITIZEN, FACTION]}).then(r => r.ids), [CITIZEN, FACTION]);
  const panel = await read('panel.js');
  assert.match(panel, /Никого не упоминать/);
  assert.doesNotMatch(panel, /const AN_PING=/);
});

test('v282: форма объявления — те же 4 роли, «Никого», без @everyone; канал обьявлений', async () => {
  const panel = await read('panel.js');
  assert.match(panel, /Написать объявление/);
  assert.match(panel, /newsComposer\(/);
  assert.match(panel, /fillTarget\('pn-dt','pn-dtsel',an\?'notices':'news'\)/);
  assert.match(panel, /sendVia\('announcement'/);
  assert.match(panel, /type:'other'/);
  assert.match(panel, /data-nwnone="1">Никого<\/button>/);
  assert.match(panel, /@everyone и @here не упоминаются/);
  assert.match(panel, /📃 обьявления|📃<\/span> обьявления|обьявления/);
  const an = await read('admin-an.js');
  assert.match(an, /roles:\(CFG\(\)\.discord\.defRoles\|\|\[\]\)\.map\(String\)/);
  assert.doesNotMatch(an, /NEWS_ROLES|AN_PING/);
});

test('v282: скрытые импортированные записи не показываются; объявления — other и convocation', async () => {
  const app = await read('app.js');
  assert.match(app, /src\.filter\(n=>n&&!n\.hidden\)/);
  assert.match(app, /ANNOUNCE=\(\)=>\{/);
  assert.match(app, /x\.type==='other'\|\|x\.type==='convocation'/);
  assert.match(app, /!x\.hidden/);
  assert.match(app, /window\.VPPKA_NOTICES/);
  // логика фильтра
  const NEWS = (src) => src.filter(n => n && !n.hidden).map((n, i) => ({...n, i: n.id ?? i}));
  const ANNOUNCE = (src) => src.filter(x => x && (x.type === 'other' || x.type === 'convocation') && !x.hidden);
  assert.deepEqual(NEWS([{id: 'a'}, {id: 'b', hidden: true}]).map(n => n.id), ['a']);
  assert.deepEqual(ANNOUNCE([
    {id: '1', type: 'other'},
    {id: '2', type: 'convocation'},
    {id: '3', type: 'other', hidden: true},
    {id: '4', type: 'appoint'},
  ]).map(x => x.id), ['1', '2']);
});

test('v282: главная, админка и колокольчик объявлений не переписаны', async () => {
  const panel = await read('panel.js');
  assert.match(panel, /function hnStart/);
  assert.match(panel, /window\.VPPKA_HN_START/);
  const notif = await read('notif.js');
  assert.match(notif, /canPost/);
  const an = await read('admin-an.js');
  assert.match(an, /notifications/);
});
