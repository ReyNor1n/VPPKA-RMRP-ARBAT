// Звуки интерфейса (WebAudio, без файлов): тихий «тик» при наведении и «открытие» для меню/окон/карточек.
(()=>{const K='vppka_sfx_off';let off=localStorage.getItem(K)==='1',ctx=null,armed=false,lastH=0,lastO=0;const VOL=0.06;
 const touch=matchMedia('(hover:none),(pointer:coarse)').matches;
 const ac=()=>{if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C()}if(ctx.state==='suspended')ctx.resume();return ctx};
 function tone(f1,f2,dur,type,vol){if(off||!armed)return;const c=ac();if(!c)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur+0.02)}
 const hover=()=>{const n=performance.now();if(n-lastH<90)return;lastH=n;tone(1800,1400,0.035,'sine',VOL*0.5)};
 const open=()=>{const n=performance.now();if(n-lastO<150)return;lastO=n;tone(420,880,0.12,'triangle',VOL);setTimeout(()=>tone(880,1320,0.08,'sine',VOL*0.6),45)};
 window.VPPKA_SFX={hover,open};
 const arm=()=>{armed=true;ac()};['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,arm,{once:true,capture:true,passive:true}));
 const SEL='a,button,.btn,.card,.mcard,.pm-card,summary,[role=button]';
 if(!touch){let cur=null;document.addEventListener('mouseover',e=>{const t=e.target.closest&&e.target.closest(SEL);if(t&&t!==cur){cur=t;hover()}else if(!t)cur=null},{passive:true})}
 // «открытие»: бургер/модалки/подсказки, переход на карточку или страницу
 document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('#burger,summary,[data-app],.hcard,#set-btn,.gear,[aria-haspopup]');if(t)open()},true);
 let lastHash=location.hash;addEventListener('hashchange',()=>{if(location.hash!==lastHash){lastHash=location.hash;open()}});
 new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1&&n.parentNode===document.body&&/ov|modal|ntoast|lb|pop/i.test(n.className+' '+n.id)){open();return}}).observe(document.body,{childList:true});
 // переключатель в подвале рядом с версией сайта
 function btn(){const v=document.getElementById('sitever');if(!v||document.getElementById('sfx-tg'))return;const b=document.createElement('button');b.id='sfx-tg';b.type='button';
  const paint=()=>{b.textContent=off?'🔇 Звуки выкл.':'🔊 Звуки вкл.';b.title=off?'Включить звуки интерфейса':'Выключить звуки интерфейса';b.setAttribute('aria-pressed',String(!off))};paint();
  b.onclick=()=>{off=!off;localStorage.setItem(K,off?'1':'0');paint();if(!off){armed=true;open()}};v.after(b)}
 new MutationObserver(btn).observe(document.documentElement,{childList:true,subtree:true});btn();
})();
