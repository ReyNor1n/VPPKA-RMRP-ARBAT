import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (p) => readFile(new URL('../../' + p, import.meta.url), 'utf8');

test('шапка и кабинет ищут карточку члена и по p_{uid}', async () => {
  const auth = await read('auth.js');
  assert.match(auth, /m\.id==='p_'\+user\.uid/);
  assert.match(auth, /L\.find\(m=>m\.id==='p_'\+user\.uid\)/);
});

test('повторная заявка: члену предлагают править кабинет, без карточки — можно подать снова', async () => {
  const auth = await read('auth.js');
  assert.match(auth, /Вы уже в составе партии — новая заявка не нужна/);
  assert.match(auth, /Если сменили статик или ФИО, обновите их в настройках кабинета/);
  assert.match(auth, /st==='accepted'\|\|st==='member'/);
  assert.match(auth, /F\.doc\(db,'members','p_'\+user\.uid\)/);
  assert.match(auth, /Заявка уже рассмотрена/);
  assert.match(auth, /Ваша заявка уже подана и ждёт рассмотрения/);
});

test('сохранение статика и ФИО пишет историю и не затирает priv целиком', async () => {
  const auth = await read('auth.js');
  assert.match(auth, /setDoc\(pref,pd,\{merge:true\}\)/);
  assert.match(auth, /passportHist/);
  assert.match(auth, /nameHist/);
  assert.match(auth, /hist\.slice\(-5\)/);
  assert.doesNotMatch(auth, /setDoc\(F\.doc\(db,'users',user\.uid,'priv','p'\),pd\);priv=pd;/);
});
