// v276: «Журнал изменений». После каждой успешной записи с сайта в «значимые» коллекции пишется запись auditLog:
// кто (uid, Discord ID, имя, место), что (раздел, документ, действие, короткая сводка), когда (время сервера).
// Записи неизменяемы; читают их только владелец, «Администратор сайта» (m13) и зам. начальника техотдела (m12) — firestore.rules.
// Запись журнала — после успеха основной записи и «в фоне»: ошибка журнала никогда не ломает сохранение.
const SECS = ['news', 'events', 'votes', 'notifications', 'members', 'applications', 'users', 'accessKeys', 'content', 'config', 'discordOut', 'expulsions', 'banners'];
const SKIP_CONFIG = ['owners', 'adminTemplates', 'ldrSeats'];
const META = new Set(['updatedBy', 'updatedAt', 'editedBy', 'editedAt']);
const nt = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const cut = (s, n) => { s = nt(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
function memCache(id) {
  const ms = (window.VPPKA_DATA && window.VPPKA_DATA.members) || [];
  const m = ms.find(x => x && x.id === id);
  return m ? JSON.parse(JSON.stringify(m)) : null;
}
const listCache = (k, id) => { const a = (window.VPPKA_DATA && window.VPPKA_DATA[k]) || []; const x = a.find(y => y && y.id === id); return x ? { ...x } : null; };
function prevOf(sec, id) {
  if (sec === 'members') return memCache(id);
  if (sec === 'news') return listCache('news', id);
  if (sec === 'events') return listCache('events', id);
  return null;
}
// «updateDoc(ref, 'a.b', v, ...)» → объект; обычный вызов — объект как есть
function updObj(a) {
  if (a.length === 1 && a[0] && typeof a[0] === 'object') return a[0];
  const o = {};
  for (let i = 0; i + 1 < a.length; i += 2) o[String(a[i])] = a[i + 1];
  return o;
}
const plainKeys = o => Object.keys(o || {}).filter(k => !META.has(k));
const TYPES = { news: 'новость', convocation: 'созыв', other: 'объявление', appoint: 'назначение', recall: 'снятие с должности' };
const ST = { accepted: 'принята', rejected: 'отклонена', member: 'принята (в составе)', expelled: 'исключён из партии', new: 'возвращена в новые' };
// Короткая сводка: что именно изменилось. data — что записали, prev — что было (из кэша страницы), act — create/update/delete.
export function summary(sec, id, act, data, prev) {
  data = data || {}; prev = prev || {};
  const changed = act === 'update' ? plainKeys(data).filter(k => JSON.stringify(data[k]) !== JSON.stringify(prev[k])) : plainKeys(data);
  if (sec === 'members') {
    const name = nt(data.name) || nt(prev.name) || id;
    if (act === 'delete') return 'удалена карточка: ' + name + (prev.role ? ' (' + nt(prev.role) + ')' : '');
    if (act === 'create') return 'новая карточка: ' + name + (data.role ? ' (' + nt(data.role) + ')' : '');
    const out = [];
    if ('awards' in data) {
      const a = Array.isArray(data.awards) ? data.awards : [], b = Array.isArray(prev.awards) ? prev.awards : [];
      if (a.length > b.length) out.push('награда «' + nt((a[a.length - 1] || {}).title).replace(/^«|»$/g, '') + '» выдана: ' + name);
      else if (a.length < b.length) out.push('награда отозвана: ' + name);
    }
    if ('subPositions' in data && JSON.stringify(data.subPositions) !== JSON.stringify(prev.subPositions)) out.push('доп. должности ' + name + ': ' + ((data.subPositions || []).join(', ') || 'нет'));
    const did0 = nt(prev.discordId), did1 = 'discordId' in data ? nt(data.discordId) : did0;
    if (did0 !== did1 || ('name' in data && nt(data.name) !== nt(prev.name) && !String(id).startsWith('p_'))) {
      const role = nt(data.role || prev.role) || id;
      if (/^вакансия$/i.test(nt(data.name))) out.push('снят с места «' + role + '»: ' + (nt(prev.name) || '—'));
      else out.push('назначен на «' + role + '»: ' + nt(data.name || prev.name));
    } else if ('role' in data && nt(data.role) !== nt(prev.role) && String(id).startsWith('p_')) out.push('звание ' + name + ': ' + (nt(prev.role) || '—') + ' → ' + nt(data.role));
    if (!out.length) {
      const f = changed.filter(k => !['awards', 'subPositions'].includes(k));
      out.push('карточка ' + name + (f.length ? ': ' + f.slice(0, 6).join(', ') : ''));
    }
    return out.join('; ');
  }
  if (sec === 'news') {
    const t = '«' + (nt(data.title) || nt(prev.title) || id) + '»';
    if (act === 'delete') return 'удалена новость ' + t;
    if (act === 'create') return 'новость ' + t;
    if ('pinned' in data && !!data.pinned !== !!prev.pinned) return (data.pinned ? 'закреплена ' : 'откреплена ') + t;
    return 'правка новости ' + t;
  }
  if (sec === 'events') {
    const t = '«' + (nt(data.title) || nt(prev.title) || id) + '»';
    if (act === 'delete') return 'удалено мероприятие ' + t;
    if (data.status === 'ended' && prev.status !== 'ended') return 'завершено мероприятие ' + t;
    if ('hidden' in data && changed.length <= 3) return (data.hidden ? 'скрыто ' : 'показано ') + 'мероприятие ' + t;
    return (act === 'create' ? 'мероприятие ' : 'правка мероприятия ') + t;
  }
  if (sec === 'votes') {
    const t = '«' + (nt(data.title) || id) + '»';
    if (act === 'delete') return 'удалено голосование ' + id;
    if (data.closed === true) return 'закрыто голосование ' + t;
    return (act === 'create' ? 'голосование ' : 'правка голосования ') + t;
  }
  if (sec === 'notifications') {
    if (act === 'delete') return 'удалено уведомление ' + id;
    if (data.type === 'appoint' || data.type === 'recall') return TYPES[data.type] + ': ' + nt(data.seat) + (data.title ? ' — ' + nt(data.title) : '');
    if (data.cancelled === true) return 'созыв отменён' + (data.reason ? ': ' + nt(data.reason) : '');
    const t = nt(data.title);
    return (act === 'create' ? (TYPES[data.type] || 'уведомление') : 'правка уведомления') + (t ? ' «' + t + '»' : '') + ('pinned' in data && changed.includes('pinned') ? (data.pinned ? ' (закреплено)' : ' (откреплено)') : '') + ('hidden' in data && changed.includes('hidden') ? (data.hidden ? ' (скрыто)' : ' (показано)') : '');
  }
  if (sec === 'applications') {
    if (act === 'delete') return 'удалена заявка ' + id;
    const out = [];
    if (data.status && ST[data.status]) out.push('заявка ' + ST[data.status] + (data.rejectReason ? ' (' + nt(data.rejectReason) + ')' : ''));
    if (data.partyRole) out.push('звание: ' + nt(data.partyRole));
    return (out.join('; ') || 'правка заявки') + ' — ' + id;
  }
  if (sec === 'users') return act === 'delete' ? 'удалён аккаунт гостя ' + id : 'правка аккаунта ' + id;
  if (sec === 'accessKeys') {
    if (act === 'create') return 'выпущен ключ: ' + nt(data.roleName) + ', ступень ' + (data.tier | 0) + (data.label ? ' (' + nt(data.label) + ')' : '');
    if (act === 'delete') return 'удалён ключ ' + String(id).slice(0, 10) + '…';
    if ('revoked' in data) return (data.revoked ? 'ключ отозван' : 'ключ возвращён') + (data.label ? ' (' + nt(data.label) + ')' : '');
    return 'правка ключа';
  }
  if (sec === 'content') return 'тексты страницы: ' + id;
  if (sec === 'config') return 'настройки: ' + id;
  if (sec === 'discordOut') return 'отправка в Discord: ' + (TYPES[data.kind] || data.kind || '') + ' → ' + nt(data.target);
  if (sec === 'expulsions') return (act === 'delete' ? 'снята отметка об исключении ' : 'исключение из партии ') + id;
  if (sec === 'banners') return act === 'delete' ? 'удалён баннер ' + id : 'баннер ' + id;
  return sec + '/' + id;
}
// Писать ли в журнал: только «значимые» правки (не лайки, не голоса, не автофото, не своя анкета)
export function wanted(sec, id, act, data, me) {
  if (!SECS.includes(sec)) return false;
  const keys = plainKeys(data || {});
  if (sec === 'config' && SKIP_CONFIG.includes(id)) return false;
  if (sec === 'news' && act === 'update' && keys.length && keys.every(k => k === 'likeCount')) return false;
  if (sec === 'votes' && act === 'update' && keys.length && keys.every(k => k === 'counts' || k === 'total')) return false;
  if (sec === 'members' && act === 'update' && keys.length && keys.every(k => k === 'photo')) return false;
  if (sec === 'applications' && act === 'create') return false;
  if (sec === 'users' && (act !== 'delete' || id === me)) return false;
  if (sec === 'banners' && id === me) return false;
  return true;
}
// Обёртка над модулем Firestore: те же функции, плюс запись в журнал после успеха.
export function wrapF(F0, ctx) {
  const F = { ...F0 };
  const who = () => {
    const c = ctx() || {}, u = c.user, p = c.profile || {}, pw = c.power || {};
    const did = nt(p.discordId);
    const ms = (window.VPPKA_DATA && window.VPPKA_DATA.members) || [];
    const seats = did ? ms.filter(m => m && nt(m.discordId) === did && !String(m.id).startsWith('p_')).sort((a, b) => (Number(b.rank) || 0) - (Number(a.rank) || 0)) : [];
    const card = seats[0] || (did ? ms.find(m => m && nt(m.discordId) === did) : null);
    const name = cut((card && card.name) || p.fio || p.displayName || pw.roleName || '', 120);
    return { uid: u && u.uid, did, name, seat: seats.length ? String(seats[0].id).slice(0, 12) : (pw.owner ? 'owner' : ''), db: c.db };
  };
  function note(act, ref, data, prev) {
    try {
      const path = String(ref && ref.path || ''), parts = path.split('/');
      if (parts.length !== 2) return;            // подколлекции (лайки, бюллетени, сообщения) не пишем
      const [sec, id] = parts, w = who();
      if (!w.uid || !w.db || !w.did || sec === 'auditLog') return;
      if (!wanted(sec, id, act, data, w.uid)) return;
      const e = { by: w.uid, did: w.did, name: w.name, seat: w.seat, sec, act, ref: cut(path, 200), sum: cut(summary(sec, id, act, data, prev), 300), at: F0.serverTimestamp() };
      F0.addDoc(F0.collection(w.db, 'auditLog'), e).catch(err => console.warn('журнал', err && (err.code || err)));
    } catch (err) { console.warn('журнал', err); }
  }
  const secOf = ref => String(ref && ref.path || '').split('/')[0];
  const idOf = ref => String(ref && ref.path || '').split('/')[1];
  const setAct = (ref, opt, prev) => prev || (opt && opt.merge) || ['content', 'config'].includes(secOf(ref)) ? 'update' : 'create';
  F.setDoc = async (ref, data, opt) => { const prev = prevOf(secOf(ref), idOf(ref)); const r = opt === undefined ? await F0.setDoc(ref, data) : await F0.setDoc(ref, data, opt); note(setAct(ref, opt, prev), ref, data, prev); return r; };
  F.updateDoc = async (ref, ...a) => { const prev = prevOf(secOf(ref), idOf(ref)); const r = await F0.updateDoc(ref, ...a); note('update', ref, updObj(a), prev); return r; };
  F.addDoc = async (col, data) => { const r = await F0.addDoc(col, data); note('create', r, data, null); return r; };
  F.deleteDoc = async ref => { const prev = prevOf(secOf(ref), idOf(ref)); const r = await F0.deleteDoc(ref); note('delete', ref, null, prev); return r; };
  F.writeBatch = d => {
    const b = F0.writeBatch(d), ops = [];
    const w = {
      set(ref, data, opt) { ops.push(() => { const prev = prevOf(secOf(ref), idOf(ref)); return [setAct(ref, opt, prev), ref, data, prev]; }); opt === undefined ? b.set(ref, data) : b.set(ref, data, opt); return w; },
      update(ref, ...a) { ops.push(() => ['update', ref, updObj(a), prevOf(secOf(ref), idOf(ref))]); b.update(ref, ...a); return w; },
      delete(ref) { ops.push(() => ['delete', ref, null, prevOf(secOf(ref), idOf(ref))]); b.delete(ref); return w; },
      async commit() { const snap = ops.map(f => f()); const r = await b.commit(); snap.forEach(x => note(...x)); return r; },
    };
    return w;
  };
  F.__audit = true;
  return F;
}
