import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (p) => readFile(new URL('../../' + p, import.meta.url), 'utf8');
const GOOD = ['Иванов Иван Иванович', 'Римский-Корсаков Николай Андреевич', 'Алиев Рашид Ахмед оглы', 'Smith John Paul'];
const BAD = ['Иванов Иван', 'Павел Семенов', 'Иванов', 'Иванов Иван 1', 'Иванов/Иван Иванович', 'А Б В Г Д', 'Иванов  Иван-  Иванович'];

const reFrom = (src, name) => {
  const m = src.match(new RegExp('const ' + name + '=/(.+?)/;'));
  assert.ok(m, name + ' не найден');
  return new RegExp(m[1]);
};

test('регистрация и «завершить регистрацию»: ФИО из трёх-четырёх слов', async () => {
  const auth = await read('auth.js');
  const re = reFrom(auth, 'FIO_RE');
  for (const g of GOOD) assert.ok(re.test(g), g);
  for (const b of BAD) assert.ok(!re.test(b), b);
  assert.match(auth, /window\.VPPKA_FIO=\{norm:normFio,err:FIO_ERR\}/);
  assert.match(auth, /Укажите ФИО персонажа полностью: Фамилия Имя Отчество \(три слова\)/);
});

test('заявка в партию: та же проверка ФИО (и запасная без auth.js)', async () => {
  const app = await read('app.js');
  const auth = await read('auth.js');
  const re = reFrom(app, 'FIO_RE3');
  assert.equal(re.source, reFrom(auth, 'FIO_RE').source);
  assert.match(app, /if\(q\.k==='fio'&&v\)\{const f=fioOk\(v\);if\(!f\)\{e\.textContent=FIO_ERR3\(\);ok=false\}/);
  assert.match(auth, /async submitApplication\(answers\)\{if\(answers&&answers\.fio!==undefined\)\{const f=normFio\(answers\.fio\);if\(!f\)throw new Error\(FIO_ERR\)/);
});

test('кабинет: старое ФИО из двух слов не мешает сохранить статик, новое — только полное', async () => {
  const auth = await read('auth.js');
  assert.match(auth, /const was=String\(p0\.fio\|\|''\)\.trim\(\)\.replace\(\/\\s\+\/g,' '\);if\(fio!==was\)\{if\(!fio&&was\)return ce\(FIO_ERR\);if\(fio&&!normFio\(fio\)\)return ce\(FIO_ERR\)\}/);
  assert.match(auth, /fio-short/);
});

test('правила v286: ФИО в заявке и в профиле — 3–4 слова', async () => {
  const r = await read('tools/firestore-v286.rules');
  const n = (r.match(/\{2,3\}\$'\)/g) || []).length;
  assert.equal(n, 2);
  assert.ok(!r.includes("{1,3}$')"));
  assert.match(r, /affectedKeys\(\)\.hasAny\(\['fio'\]\) \|\| validFio\(request\.resource\.data\)/);
});

test('версия 286, кэш vppka-v258', async () => {
  const v = JSON.parse(await read('version.json'));
  assert.equal(v.v, '286');
  assert.equal(v.cache, 'vppka-v258');
  assert.match(await read('sw.js'), /const CACHE='vppka-v258'/);
});
