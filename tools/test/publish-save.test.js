import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (p) => readFile(new URL('../../' + p, import.meta.url), 'utf8');

test('v282: при публикации живые снимки не перерисовывают форму; ошибка сохраняется', async () => {
  const auth = await read('auth.js');
  assert.match(auth, /window\.VPPKA_SAVING/);
  assert.match(auth, /window\.VPPKA_LIVEFLUSH=\(\)=>\{if\(livePend\)liveApply\(\)\}/);

  const panel = await read('panel.js');
  assert.match(panel, /let nwOpen=false,nwStatus=null,nwSaving=false/);
  assert.match(panel, /const nwSave=on=>\{nwSaving=on;window\.VPPKA_SAVING=on/);
  assert.match(panel, /id="pn-save"\$\{nwSaving\?' disabled':''\}/);
  assert.match(panel, /nwSaving\?'Публикация…'/);
  assert.match(panel, /if\(nwSaving\)return;b\.disabled=true;nwSave\(true\)/);
  // оба обработчика: новость и объявление
  assert.equal((panel.match(/nwSave\(true\)/g) || []).length, 2);
  assert.match(panel, /Новость не опубликована:/);
  assert.match(panel, /Объявление не опубликовано:/);
  assert.match(panel, /Текст сохранён — проверьте и нажмите «Опубликовать» ещё раз/);
  assert.match(panel, /finally\{if\(nwSaving\)\{nwSave\(false\)/);
});
