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

test('пустой список не рисует блок', () => {
  assert.equal(block({}), '');
  assert.equal(block({ awards: [] }), '');
  assert.equal(block({ awards: [{ title: '  ' }] }), '');
});

test('название экранируется, без документа иконка не кнопка', () => {
  const html = block({ awards: [{ title: '<img src=x onerror=alert(1)>', image: 'javascript:alert(1)' }] });
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
  const html = block({ awards: items });
  assert.equal((html.match(/<button/g) || []).length, 1);
  assert.match(html, /data-aw="0"/);
  const dlg = view(items[0], { name: 'Технический Демон Александрович', pass: '000-001' });
  assert.match(dlg, /УДОСТОВЕРЕНИЕ/);
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
  assert.match(css, /\.aw-book\.open \.aw-cover\{transform:rotateY\(-178deg\)\}/);
  assert.match(css, /transition:transform \.8s/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /--sheet:min\(980px/);
  assert.match(css, /height:calc\(var\(--sheet\) \/ 2\.8\)/);
  assert.doesNotMatch(css, /\.aw-spread\{grid-template-columns:1fr\}/);
  assert.doesNotMatch(css, /\.aw-cover\{[^}]*animation:\s*[^;]*infinite/);
});
