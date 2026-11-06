// Демонстрационный content.json: те же разделы сайта, без боевого состава, фото и Discord.

const DEMO_NAMES = {
  m1: 'Тестов Иван Петрович',
  m4: 'Демонстрационный Пётр Сергеевич',
  m5: 'Образцов Сидор Ильич',
  m11: 'Технический Демон Александрович',
  m12: 'Серебряный Демон Павлович',
};

const DROP = ['discordId', 'discord', 'photo', 'bio', 'contact', 'birth', 'city', 'achievements', 'forum', 'quote', 'statik', 'passport', 'email', 'phone', 'uid'];

export function prodNames(content) {
  const names = [];
  for (const m of content.leadership?.members || []) {
    const name = String(m.name || '').trim();
    if (name && !/^вакансия$/i.test(name)) names.push(name);
  }
  return names;
}

export function toDemo(content) {
  const names = prodNames(content).sort((a, b) => b.length - a.length);
  const c = structuredClone(content);
  let n = 1;
  for (const m of c.leadership?.members || []) {
    const vac = !m.name || /^вакансия$/i.test(String(m.name).trim());
    if (!vac) m.name = DEMO_NAMES[m.id] || ('Участник Демонстрационный ' + n++);
    if (String(m.id || '').startsWith('p_')) m.id = 'p_demo_' + n++;
    for (const k of DROP) delete m[k];
  }
  if (Array.isArray(c.home?.trio)) {
    for (const t of c.home.trio) {
      const m = (c.leadership?.members || []).find(x => x.id === t.memberId);
      t.name = m ? m.name : 'Вакансия';
      t.photo = '';
      delete t.discordId;
      delete t.discord;
    }
  }
  c.news = [{
    id: 'demo-news',
    date: '2026-11-01',
    title: 'Тестовая новость',
    text: 'Это демонстрационная новость тестовой версии. Она лежит только в этой сборке и никуда не отправляется.',
  }];
  c.contacts = {
    text: 'В тестовой версии Discord выключен. Сообщения, роли и заявки никуда не уходят.',
    items: [{ label: 'Discord', value: 'отключён в тестовой версии', url: '' }],
  };
  delete c.settings;
  delete c.events;
  delete c.applications;
  let raw = JSON.stringify(c);
  for (const name of names) raw = raw.split(name).join('Участник демонстрации');
  raw = raw.replace(/https?:\/\/(?:discord\.gg|discord(?:app)?\.com)\/\S+/gi, '');
  raw = raw.replace(/\b\d{17,21}\b/g, '');
  return JSON.parse(raw);
}
