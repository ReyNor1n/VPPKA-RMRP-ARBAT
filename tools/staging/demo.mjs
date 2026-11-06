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
    // Синтетический тяжёлый профиль: латунь, крупное фото, паспорт-заглушка. Не боевые ФИО и не 707-932.
    if (m.id === 'm11') {
      m.metal = 'gold';
      m.photo = 'img/demo/heavy-portrait.jpg';
      m.statik = '000-001';
      m.quote = 'Проверка скорости тестовой версии.';
      m.bio = 'Демонстрационная карточка того же типа, что тяжёлый профиль на боевом сайте: крупный портрет, латунная рамка и блик. Людей и документов боевой базы здесь нет.';
      m.achievements = 'Синтетический аналог. Фото нарисовано для теста, это не снимок человека.';
      m.awards = [
        {
          head: 'Юбилейная медаль',
          title: '«109 лет Октябрьской революции»',
          years: '1917 — 2026',
          date: '07.11.2026',
          no: '000',
          basis: 'Основание: образец приказа от 07.11.2026',
          grant: 'награждён юбилейной медалью «109 лет Октябрьской революции» (1917—2026).',
          image: 'img/demo/medal-109.svg',
          plate: 'img/demo/medal-109-large.svg',
          cert: true,
        },
        {
          head: 'Демонстрационный знак',
          title: 'тестовой версии',
          date: '01.05.2026',
          no: '000',
          basis: 'Основание: образец, не документ',
          grant: 'награждён демонстрационным знаком тестовой версии.',
          image: 'img/demo/medal-service.svg',
          cert: true,
        },
        { title: 'Знак без удостоверения', date: '09.05.2026', image: 'img/demo/medal-plain.svg' },
      ];
    }
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
