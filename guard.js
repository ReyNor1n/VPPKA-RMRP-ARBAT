// защита от встраивания сайта в чужие страницы (clickjacking) и обработчики событий без inline-JS (для CSP).
// Подключается первым, синхронно в <head>. Страница скрыта стилем #afb, пока проверка не пройдёт:
// в чужом iframe (или в iframe-песочнице без скриптов) сайт остаётся пустым.
(function(){
 var ok=false;
 try{ok=window.top===window.self||window.top.location.origin===location.origin}catch(e){ok=false}
 if(!ok){try{window.top.location.replace(location.href)}catch(e){}return}
 var s=document.getElementById('afb');if(s&&s.parentNode)s.parentNode.removeChild(s);
 var W=window,D=document,G=function(n){return W[n]};
 // data-on-click="имя" [data-oa, data-ob] [data-stop="1" — как preventDefault+stopPropagation в прежнем onclick]
 var CLICK={
  ovclose:function(el,e){if(e.target===el)el.hidden=true},
  hide:function(el){var x=D.getElementById(el.dataset.oa);if(x)x.hidden=true},
  setopen:function(){G('VPPKA_SETOPEN')()},
  chat:function(el){var c=G('VPPKA_CHAT');if(c)c.open(el.dataset.oa)},
  ml:function(el){G('VPPKA_ML')(el.dataset.oa,el.dataset.ob)},
  gmenu:function(el,e){G('VPPKA_GMENU')(e,el)},
  gdel:function(el){G('VPPKA_GDEL')(el.dataset.oa)},
  promo:function(el){G('VPPKA_PROMO')(el.dataset.oa,Number(el.dataset.ob))},
  expel:function(el){G('VPPKA_EXPEL')(el.dataset.oa)}
 };
 var INPUT={
  pq:function(el){G('VPPKA_PQ')(el.value)},
  ppfmt:function(el){G('VPPKA_PPFMT')(el)},
  mlq:function(el){G('VPPKA_ML')('q',el.value)}
 };
 var CHANGE={fname:function(el){var x=D.getElementById(el.dataset.oa);if(x)x.textContent=el.files&&el.files[0]?el.files[0].name:''}};
 var ERR={rmparent:function(el){if(el.parentNode)el.parentNode.remove()}};
 // клики — в фазе перехвата на window: обработчик выполняется раньше остальных, data-stop останавливает событие целиком
 W.addEventListener('click',function(e){var el=e.target&&e.target.nodeType===1?e.target:e.target&&e.target.parentElement;
  for(;el&&el!==D;el=el.parentElement){var n=el.getAttribute('data-on-click');if(!n||!CLICK[n])continue;
   if(el.getAttribute('data-stop')==='1'){e.preventDefault();e.stopPropagation()}
   try{CLICK[n](el,e)}catch(x){console.error('on-click '+n,x)}
   if(e.cancelBubble)break}},true);
 D.addEventListener('input',function(e){var el=e.target;if(!el||el.nodeType!==1)return;
  var c=el.getAttribute('data-cnt');if(c){var x=D.getElementById(c);if(x)x.textContent=el.value.length+' / '+el.maxLength}
  var n=el.getAttribute('data-on-input');if(n&&INPUT[n])try{INPUT[n](el,e)}catch(x){console.error('on-input '+n,x)}},true);
 D.addEventListener('change',function(e){var el=e.target,n=el&&el.getAttribute&&el.getAttribute('data-on-change');if(n&&CHANGE[n])CHANGE[n](el,e)},true);
 D.addEventListener('error',function(e){var el=e.target,n=el&&el.getAttribute&&el.getAttribute('data-on-error');if(n&&ERR[n])ERR[n](el,e)},true);
})();
