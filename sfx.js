// Звуки интерфейса (WebAudio, без файлов) в стиле Atomic Heart: робо-щелчок при наведении, механический клац + пневмо-шипение при открытии.
(()=>{const K='vppka_sfx_off';let off=localStorage.getItem(K)==='1',ctx=null,armed=false,lastH=0,lastO=0;const VOL=0.06;
 const touch=matchMedia('(hover:none),(pointer:coarse)').matches;
 const ac=()=>{if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C()}if(ctx.state==='suspended')ctx.resume();return ctx};
 // Atomic Heart-стиль: металлический «робо-щелчок» и тёплый аналоговый перезвон (в духе «Полёт»/«Квази») с лёгким эхом
 let bus=null;function out(c){if(bus)return bus;const m=c.createGain();m.gain.value=1;const d=c.createDelay(0.5),fb=c.createGain(),lp=c.createBiquadFilter(),wet=c.createGain();
  d.delayTime.value=0.11;fb.gain.value=0.32;lp.type='lowpass';lp.frequency.value=2600;wet.gain.value=0.35;m.connect(c.destination);m.connect(d);d.connect(lp);lp.connect(fb);fb.connect(d);lp.connect(wet);wet.connect(c.destination);return bus=m}
 const ok=()=>!off&&armed&&ac();
 function click(){const c=ok();if(!c)return;const t=c.currentTime,o=out(c);
  const n=c.createBufferSource(),b=c.createBuffer(1,Math.floor(c.sampleRate*0.03),c.sampleRate),ch=b.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length,6);
  n.buffer=b;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=3800;bp.Q.value=9;const g=c.createGain();g.gain.value=VOL*0.9;n.connect(bp).connect(g).connect(c.destination);n.start(t);
  const s=c.createOscillator(),sg=c.createGain();s.type='square';s.frequency.setValueAtTime(2300,t);s.frequency.exponentialRampToValueAtTime(1500,t+0.025);
  sg.gain.setValueAtTime(VOL*0.18,t);sg.gain.exponentialRampToValueAtTime(0.0001,t+0.03);const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=3000;s.connect(f).connect(sg).connect(c.destination);s.start(t);s.stop(t+0.04)}
 function note(c,o,f,t,dur,v){const g=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=4;lp.frequency.setValueAtTime(3200,t);lp.frequency.exponentialRampToValueAtTime(700,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);lp.connect(g).connect(o);
  for(const [type,det] of [['sawtooth',-7],['triangle',6],['sine',0]]){const x=c.createOscillator();x.type=type;x.frequency.value=f;x.detune.value=det;
   const vib=c.createOscillator(),vg=c.createGain();vib.frequency.value=5.5;vg.gain.value=4;vib.connect(vg).connect(x.detune);vib.start(t);vib.stop(t+dur+0.05);
   const xg=c.createGain();xg.gain.value=type==='sine'?0.6:0.35;x.connect(xg).connect(lp);x.start(t);x.stop(t+dur+0.05)}}
 // «открытие»: щелчок защёлки/реле + мягкое пневматическое шипение (фильтрованный шум), без нот
 function nbuf(c,sec){const b=c.createBuffer(1,Math.floor(c.sampleRate*sec),c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b}
 function chime(){const c=ok();if(!c)return;const t=c.currentTime+0.005,V=VOL*0.75;
  // клац: низкий глухой удар + металлический призвук
  const th=c.createOscillator(),tg=c.createGain();th.type='sine';th.frequency.setValueAtTime(190,t);th.frequency.exponentialRampToValueAtTime(70,t+0.06);
  tg.gain.setValueAtTime(V*1.1,t);tg.gain.exponentialRampToValueAtTime(0.0001,t+0.07);th.connect(tg).connect(c.destination);th.start(t);th.stop(t+0.08);
  const k=c.createBufferSource();k.buffer=nbuf(c,0.025);const kb=c.createBiquadFilter();kb.type='bandpass';kb.frequency.value=2200;kb.Q.value=6;const kg=c.createGain();
  kg.gain.setValueAtTime(V*0.9,t);kg.gain.exponentialRampToValueAtTime(0.0001,t+0.025);k.connect(kb).connect(kg).connect(c.destination);k.start(t);
  // второй, тише — «дожим» реле
  const k2=c.createBufferSource();k2.buffer=nbuf(c,0.02);const kb2=c.createBiquadFilter();kb2.type='bandpass';kb2.frequency.value=3200;kb2.Q.value=8;const kg2=c.createGain();
  kg2.gain.setValueAtTime(V*0.45,t+0.035);kg2.gain.exponentialRampToValueAtTime(0.0001,t+0.055);k2.connect(kb2).connect(kg2).connect(c.destination);k2.start(t+0.035);
  // шипение пневматики ~0.3 с: шум через полосовой фильтр, полоса уезжает вниз
  const h=c.createBufferSource();h.buffer=nbuf(c,0.36);const hb=c.createBiquadFilter();hb.type='bandpass';hb.Q.value=1.2;hb.frequency.setValueAtTime(5200,t+0.04);hb.frequency.exponentialRampToValueAtTime(1800,t+0.36);
  const hl=c.createBiquadFilter();hl.type='highpass';hl.frequency.value=900;const hg=c.createGain();hg.gain.setValueAtTime(0.0001,t+0.04);hg.gain.exponentialRampToValueAtTime(V*0.55,t+0.07);hg.gain.exponentialRampToValueAtTime(0.0001,t+0.36);
  h.connect(hb).connect(hl).connect(hg).connect(c.destination);h.start(t+0.04);h.stop(t+0.4)}
 const hover=()=>{const n=performance.now();if(n-lastH<90)return;lastH=n;click()};
 const open=()=>{const n=performance.now();if(n-lastO<180)return;lastO=n;chime()};
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
