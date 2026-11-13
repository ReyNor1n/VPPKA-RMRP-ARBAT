import assert from 'node:assert/strict';
import test from 'node:test';
globalThis.window = { VPPKA_DATA: { members: [
  { id: 'm4', name: 'Быков Виталий Андреевич', role: 'Заместитель Председателя ЦК', discordId: '111111111111111111', awards: [] },
  { id: 'm13', name: 'Админов Админ Админович', role: 'Администратор сайта', discordId: '100000000000000013', rank: 70 },
  { id: 'p_x', name: 'Иванов Иван Иванович', role: 'Член партии', discordId: '222222222222222222' },
], news: [{ id: 'n1', title: 'Старая', pinned: false }] } };
const { summary, wanted, wrapF } = await import('../../audit.js');

test('v276: сводки журнала', () => {
  const m4 = window.VPPKA_DATA.members[0];
  assert.match(summary('members', 'm4', 'update', { awards: [{ title: '«109 лет Октябрьской революции»' }] }, m4), /награда «109 лет Октябрьской революции» выдана: Быков/);
  assert.match(summary('members', 'm18', 'update', { name: 'Вакансия', discordId: '' }, { name: 'Циммерман В.', role: 'Член ЦК', discordId: '333333333333333333' }), /снят с места «Член ЦК»: Циммерман/);
  assert.match(summary('members', 'm18', 'update', { name: 'Петров П.', discordId: '444444444444444444' }, { name: 'Вакансия', role: 'Член ЦК', discordId: '' }), /назначен на «Член ЦК»: Петров/);
  assert.match(summary('members', 'p_x', 'update', { role: 'Активист' }, window.VPPKA_DATA.members[2]), /звание Иванов Иван Иванович: Член партии → Активист/);
  assert.match(summary('news', 'n1', 'update', { title: 'Старая', pinned: true }, { title: 'Старая', pinned: false }), /закреплена «Старая»/);
  assert.match(summary('applications', 'u1', 'update', { status: 'accepted' }, null), /заявка принята — u1/);
  assert.match(summary('notifications', 'x', 'create', { type: 'other', title: 'Сбор' }, null), /объявление «Сбор»/);
});

test('v276: что не пишется в журнал', () => {
  assert.equal(wanted('news', 'n1', 'update', { likeCount: 3 }, 'u'), false);
  assert.equal(wanted('votes', 'v', 'update', { counts: {}, total: 1 }, 'u'), false);
  assert.equal(wanted('members', 'm4', 'update', { photo: 'ph:x', updatedBy: 'u', updatedAt: 1 }, 'u'), false);
  assert.equal(wanted('users', 'u', 'update', { fio: 'x' }, 'u'), false);
  assert.equal(wanted('users', 'g', 'delete', null, 'u'), true);
  assert.equal(wanted('likes', 'x', 'create', {}, 'u'), false);
  assert.equal(wanted('config', 'owners', 'update', {}, 'u'), false);
  assert.equal(wanted('members', 'm4', 'update', { awards: [] }, 'u'), true);
});

test('v276: обёртка пишет запись после успеха и не пишет после ошибки', async () => {
  const log = [];
  const ref = p => ({ path: p });
  const F0 = {
    serverTimestamp: () => 'TS', collection: (db, c) => ({ c }),
    addDoc: async (col, d) => { if (col.c === 'auditLog') log.push(d); return ref(col.c + '/new1'); },
    setDoc: async () => {}, updateDoc: async (r) => { if (r.path === 'news/bad') throw new Error('permission-denied'); },
    deleteDoc: async () => {}, writeBatch: () => ({ set() {}, update() {}, delete() {}, commit: async () => {} }),
  };
  const F = wrapF(F0, () => ({ user: { uid: 'U13' }, profile: { discordId: '100000000000000013' }, power: {}, db: {} }));
  await F.updateDoc(ref('members/m4'), { awards: [{ title: 'Медаль' }], updatedBy: 'U13' });
  await assert.rejects(F.updateDoc(ref('news/bad'), { title: 'x' }));
  await F.updateDoc(ref('news/n1'), { likeCount: 1 });
  const b = F.writeBatch({}); b.delete(ref('members/p_x')); await b.commit();
  await new Promise(r => setTimeout(r, 0));
  assert.equal(log.length, 2);
  assert.equal(log[0].by, 'U13'); assert.equal(log[0].did, '100000000000000013'); assert.equal(log[0].seat, 'm13');
  assert.equal(log[0].sec, 'members'); assert.equal(log[0].act, 'update'); assert.equal(log[0].at, 'TS');
  assert.match(log[0].sum, /награда «Медаль» выдана: Быков/);
  assert.equal(log[1].act, 'delete'); assert.match(log[1].sum, /удалена карточка: Иванов/);
  for (const e of log) assert.deepEqual(Object.keys(e).sort(), ['act', 'at', 'by', 'did', 'name', 'ref', 'seat', 'sec', 'sum']);
});
