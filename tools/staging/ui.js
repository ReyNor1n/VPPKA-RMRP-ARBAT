/* Плашка уже в HTML. Здесь — заглушки разделов, которые на боевом сайте пишут в базу и Discord.
   app.js вызывает window.__VPPKA_STAGING_PATCH в начале route; на боевом сайте этой функции нет. */
(function () {
  var demo = !(window.__VPPKA_STAGING && window.__VPPKA_STAGING.demo === false);
  if (!demo) return;
  function markTitle() { document.title = 'ТЕСТОВАЯ ВЕРСИЯ — ВППКА «Коммунисты Арбата»'; }
  var off = '<div class="blk"><p>В тестовой версии это выключено. Вход, Discord, заявки, роли, пуши и любые записи в боевую базу не отправляются.</p><p><a class="btn o" href="#home">На главную</a></p></div>';
  function page(title) {
    return '<div class="crumbs"><a href="#home">Главная</a> / ' + title + '</div><div class="pg"><h1>' + title + '</h1>' + off + '</div>';
  }
  window.VPPKA_AUTH = { joinState: 'guest' };
  window.VPPKA_EV_SIDE = function () {
    return '<div class="blk ev-side"><h2>Ближайшие мероприятия</h2><p class="ev-empty">В тестовой версии мероприятия не публикуются и в Discord не уходят.</p></div>';
  };
  window.VPPKA_EV_PAGE = function () {
    return page('Мероприятия').replace(off, '<div class="blk"><p>Список пуст: тестовая версия не пишет мероприятия в базу и не отправляет их в Discord.</p></div>');
  };
  window.VPPKA_VT_PAGE = function () { return page('Голосования'); };
  window.VPPKA_VT_SIDE = function () { return ''; };
  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function demoSide() {
    if (location.hash.indexOf('#member/') !== 0) return;
    var side = document.querySelector('.mpg-side');
    if (!side || side.querySelector('.act')) return;
    var nameEl = document.querySelector('.prof-n');
    var name = nameEl ? nameEl.textContent.replace(/\s+/g, ' ').trim() : 'Участник демонстрации';
    side.insertAdjacentHTML('afterbegin', '<div class="blk act"><h2>Активность</h2><div class="act-top"><span>' + esc(name) + '</span><span class="badge">★ Новичок</span></div><div class="at-grid"><div class="at-st"><b>1</b><span>посещено</span></div><div class="at-st"><b>100%</b><span>явка</span></div><div class="at-st"><b>1</b><span>всего</span></div><div class="at-st"><b class="sm">01.11</b><span>последнее</span></div></div><div class="at-bar"><i style="width:100%"></i></div><div class="cm-h">Последние мероприятия</div><ul class="at-rl"><li><span>Демонстрационный созыв · 01.11.2026</span><span class="y">✔ был</span></li></ul></div>');
  }
  window.__VPPKA_STAGING_PATCH = function () {
    markTitle();
    setTimeout(demoSide, 0);
    var P = window.P;
    if (!P || P.__stg) return;
    P.__stg = 1;
    P.login = function () { return page('Вход'); };
    P.register = function () { return page('Регистрация'); };
    P.account = function () { return page('Личный кабинет'); };
    P.admin = function () { return page('Админка'); };
    P.join = function () { return page('Вступление'); };
    P.chat = function () { return page('Чат'); };
    P.apps = function () { return page('Заявки'); };
  };
  addEventListener('load', function () {
    ['apkBtn', 'winBtn', 'installBtn'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.remove();
    });
  });
})();
