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
  window.__VPPKA_STAGING_PATCH = function () {
    markTitle();
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
