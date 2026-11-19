// v287: в кабинете только «Аватар»; он же фото карточки и руководства. node --test tools/test/avatar-only.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const R = new URL('../../', import.meta.url);
const read = f => readFile(new URL(f, R), 'utf8');
test('в настройках нет «Фото для карточки» и «Фото для раздела «Руководство»»', async () => {
  const a = await read('auth.js');
  assert.ok(!a.includes('<h4 class="phc-h">Фото для карточки</h4>'));
  assert.ok(!a.includes('<h4 class="phc-h">Фото для раздела «Руководство»</h4>'));
  assert.ok(a.includes('<h4 class="phc-h">Аватар</h4>'));
  assert.ok(a.includes('Используется везде: в карточке, списках, чате, шапке и разделе «Руководство».'));
  assert.ok(a.includes('<li>Лицо полностью открыто: без масок, капюшонов, головных уборов и предметов, закрывающих лицо.</li>'));
  assert.ok(a.includes('<li>Запрещены символика, цвета, лозунги, названия и любые другие отсылки к сторонним партиям.</li>'));
  assert.ok(!/очков/.test(a));
  assert.ok(!a.includes('Головной убор можно') && !a.includes('головной убор можно'));
});
test('аватар в приоритете, прежнее фото карточки — запасной вариант', async () => {
  const a = await read('auth.js');
  assert.ok(a.includes('const ph=profile&&(profile.avatar||profile.photo)'));
  assert.ok(a.includes("{avatar:ph?ph:F.deleteField(),photo:ph?ph:F.deleteField()}"));
  assert.ok(a.includes("ph=p.avatar||(lead&&lead.photo)||p.photo||''"));
  assert.ok(!(await read('app.js')).includes('if(LP[k])return LP[k];'));
});
