import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const code = await readFile(new URL('../../awards.js', import.meta.url), 'utf8');
const window = {};
const document = {
  addEventListener() {},
  body: { classList: { add() {}, remove() {} }, appendChild() {} },
};
vm.runInNewContext(code, { window, document });
const list = window.VPPKA_AWARD_LIST;
const block = window.VPPKA_AWARDS;
const view = window.VPPKA_AWARD_VIEW;

test('своя награда видна у любого профиля, образец без записи — только у m11', () => {
  const other = block({ id: 'm1', name: 'Другой', awards: [{ title: 'Медаль', cert: true, image: 'img/demo/medal-109.webp', medal: 'oct-109' }] });
  assert.match(other, /Награды/);
  assert.match(other, /medal-109/);
  assert.match(other, /<button/);
  assert.equal(other.includes('Выдать награду'), false);
  const empty = block({ id: 'm2', name: 'Пусто' });
  assert.match(empty, /Наград пока нет/);
  assert.equal(empty.includes('medal-109'), false);
  const html = block({ id: 'm11' });
  assert.match(html, /medal-109\.webp/);
  assert.match(html, /Награды/);
  assert.equal(html.includes('Наград пока нет'), false);
  const dlg = view(list([{ title: '«109 лет Октябрьской революции»', no: '001', full: true, cert: true, spread: 'img/awards/m11-109.webp', coverTo: 'к юбилейной медали', years: '1917 — 2026' }])[0]);
  assert.match(dlg, /aw-half-l/);
  assert.match(dlg, /aw-half-r/);
  assert.equal(dlg.includes('Технический Демон'), false);
});

test('пустой список не рисует блок', () => {
  assert.equal(block({}), '');
  assert.equal(block({ awards: [] }), '');
  assert.equal(block({ awards: [{ title: '  ' }] }), '');
});

test('название экранируется, без документа иконка не кнопка', () => {
  const html = block({ id: 'm11', awards: [{ title: '<img src=x onerror=alert(1)>', image: 'javascript:alert(1)' }] });
  assert.match(html, /Награды/);
  assert.equal(html.includes('<button'), false);
  assert.equal(html.includes('javascript:'), false);
  assert.equal(html.includes('<img src=x'), false);
  assert.match(html, /&lt;img/);
});

test('книжечка только при удостоверении и с надписью на корочке', () => {
  const items = list([
    { title: 'Медаль «109 лет»', date: '07.11.2026', image: 'img/demo/medal-109.svg', cert: true, note: 'Образец' },
    { title: 'Без корочки', image: 'javascript:alert(1)' },
  ]);
  assert.equal(items[0].cert, true);
  assert.equal(items[1].cert, false);
  assert.equal(items[1].image, '');
  assert.equal(list([{ title: 'Сеть', image: 'https://cdn.example/m.svg' }])[0].image, 'https://cdn.example/m.svg');
  const html = block({ id: 'm11', awards: items });
  assert.equal((html.match(/<button/g) || []).length, 1);
  assert.match(html, /data-aw="0"/);
  const dlg = view(items[0], { name: 'Технический Демон Александрович', pass: '000-001' });
  assert.match(dlg, /УДОСТОВЕРЕНИЕ/);
  assert.match(dlg, /КОММУНИСТЫ АРБАТА/);
  assert.match(dlg, /Центральный комитет/);
  assert.equal(dlg.includes('aw-star'), false);
  assert.match(dlg, /Медаль «109 лет»/);
  assert.match(dlg, /Технический Демон Александрович/);
  assert.match(dlg, /000-001/);
  assert.match(dlg, /ОБРАЗЕЦ/);
  assert.match(dlg, /\(подпись\)/);
  assert.equal(dlg.includes('<script'), false);
  assert.equal(dlg.includes('Ульянов'), false);
  assert.equal(dlg.includes('707-932'), false);
  assert.equal(dlg.includes('Хлопов'), false);
});

test('чужой адрес и битая ссылка не становятся файлом', () => {
  const items = list([
    { title: 'Файл', pdf: 'javascript:alert(1)', doc: 'https://files.example/secret.html', cert: true },
    { title: 'Бумага', pdf: 'https://files.example/blank.pdf', cert: true },
  ]);
  assert.equal(items[0].pdf, '');
  assert.equal(items[1].pdf, 'https://files.example/blank.pdf');
  assert.match(view(items[1]), /href="https:\/\/files\.example\/blank\.pdf"/);
  assert.equal(view(items[0]).includes('javascript:'), false);
});

test('в вёрстке корочка откидывается трансформом и уважает reduced-motion', async () => {
  const css = await readFile(new URL('../../style.css', import.meta.url), 'utf8');
  assert.match(css, /\.aw-book\.open \.aw-cover\{transform:rotateY\(-180deg\)\}/);
  assert.match(css, /\.aw-cover\{[^}]*right:0/);
  assert.match(css, /transition:transform \.8s/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /@media\(max-width:860px\)\{\.aw-view\{background:#100c0a\}/);
  assert.match(code, /hashchange/);
  assert.match(code, /p\[1\] !== viewId/);
  assert.match(css, /--sheet:min\(980px/);
  assert.match(css, /height:calc\(var\(--sheet\) \* 409 \/ 1118\)/);
  assert.doesNotMatch(css, /\.aw-book\.open:after/);
  assert.match(css, /\.aw-book:not\(\.aw-settled\) \.aw-cert/);
  assert.doesNotMatch(css, /\.aw-spread\{grid-template-columns:1fr\}/);
  assert.match(css, /drop-shadow\(0 3px 3px/);
  assert.match(css, /hover:hover\) and \(pointer:fine\)/);
  assert.doesNotMatch(css, /\.aw-img\{[^}]*animation:[^;]*infinite/);
  assert.doesNotMatch(css, /\.aw-cover\{[^}]*animation:\s*[^;]*infinite/);
});

test('v273: запись наград без undefined; medal из каталога (старая строка с id вместо medal)', () => {
  const pack = window.VPPKA_AWARD_PACK;
  const md = window.VPPKA_MEDALS[0];
  const legacy = Object.assign({}, md, { date: '12.11.2026', no: '2', basis: 'Приказ о награждении № 2 от 12.11.2026', grant: '-', note: '-' });
  const fresh = { medal: 'oct-109', title: md.title, date: '12.11.2026', no: '2', basis: 'x' };
  for (const row of [legacy, fresh]) {
    const [o] = pack([row]);
    assert.equal(o.medal, 'oct-109');
    for (const [k, v] of Object.entries(o)) assert.notEqual(v, undefined, k);
    assert.ok(!('id' in o));
    assert.equal(o.image, 'img/demo/medal-109.webp');
  }
  assert.throws(() => pack([{ title: 'Чужая', date: '1', no: '1' }]));
  assert.equal(pack([Object.assign({}, fresh, { note: 'x'.repeat(400) })])[0].note.length, 300);
});

test('v274: в удостоверении (бланк-картинка) — данные награждённого, а не m11', () => {
  const md = window.VPPKA_MEDALS[0];
  window.VPPKA_DATA = { members: [
    { id: 'm4', name: 'Быков Виталий Андреевич', role: 'Заместитель Председателя ЦК', discordId: '111111111111111111' },
    { id: 'p_x', name: 'Быков Виталий Андреевич', role: 'Активист', discordId: '111111111111111111', statik: '504-426' },
    { id: 'p_y', name: 'Иванова Анна Петровна', role: 'Член партии' },
  ] };
  const aw = { medal: md.id, head: md.head, coverTo: md.coverTo, title: md.title, years: md.years, image: md.image, spread: md.spread, full: true, cert: true, date: '12.11.2026', no: '2', basis: 'Приказ о награждении № 2 от 12.11.2026', grant: '-' };
  const who = window.VPPKA_AWARD_HOLDER(window.VPPKA_DATA.members[0]);
  assert.equal(JSON.stringify(who), JSON.stringify({ name: 'Быков Виталий Андреевич', pass: '504-426', rank: 'Активист', post: 'Заместитель Председателя ЦК' }));
  const [it] = list([aw]);
  const html = view(it, who);
  assert.match(html, /Быков Виталий Андреевич/);
  assert.doesNotMatch(html, /Ульянов/);
  assert.match(html, /№ 002/);
  assert.match(html, /Звание: Активист/);
  assert.match(html, /Должность: Заместитель Председателя ЦК/);
  assert.match(html, /награждён юбилейной медалью «109 лет Октябрьской революции»/);
  assert.match(html, /Дата выдачи: 12\.11\.2026/);
  assert.doesNotMatch(html, /за -/);
  const her = window.VPPKA_AWARD_HOLDER(window.VPPKA_DATA.members[2]);
  assert.match(view(list([{ ...aw, grant: 'активную работу' }])[0], her), /награждена[\s\S]*за активную работу/);
});
