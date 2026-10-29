// Новогоднее оформление: 1 декабря — 14 января (по Москве/Волгограду, UTC+3). Превью: ?ny=1, выключить: ?ny=0
(function(){
 const q=new URLSearchParams(location.search).get('ny');
 const d=new Date(Date.now()+3*3600e3),m=d.getUTCMonth(),day=d.getUTCDate();
 const on=q==='1'||(q!=='0'&&(m===11||(m===0&&day<=14)));if(!on)return;
 const css=`.ny .hd{position:relative}
.ny-gl{position:absolute;left:0;right:0;bottom:-7px;height:16px;pointer-events:none;z-index:5;overflow:hidden}
.ny-gl svg{width:100%;height:16px;display:block}
.ny-gl i{position:absolute;top:5px;width:6px;height:9px;border-radius:50% 50% 45% 45%;background:var(--c);box-shadow:0 0 6px 1px var(--c);animation:nyB 2.4s ease-in-out infinite;animation-delay:var(--dl)}
.ny-gl i:before{content:"";position:absolute;left:1px;top:-2px;width:4px;height:3px;background:#8c939c;border-radius:1px}
@keyframes nyB{50%{opacity:.35;box-shadow:none}}
.ny-hat{position:absolute;width:26px;height:22px;pointer-events:none;z-index:6;transform:rotate(-18deg)}
.ny-tree{display:inline-flex;align-items:center;gap:6px;margin-left:10px;font:600 11px var(--fd);letter-spacing:.12em;text-transform:uppercase;color:#e6c98a;opacity:.9;white-space:nowrap}
.ny-tree svg{width:18px;height:22px;filter:drop-shadow(0 0 4px #d6282888)}
#ny-sn{position:fixed;inset:0;pointer-events:none;z-index:40}
@media(max-width:600px){.ny-tree{display:none}.ny-hat{width:18px;height:15px}.ny-gl i:nth-child(even){display:none}}
@media(prefers-reduced-motion:reduce){.ny-gl i{animation:none}}`;
 const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);document.documentElement.classList.add('ny');
 const tree='<svg viewBox="0 0 18 22"><path d="M9 4l-6 8h3l-4 6h14l-4-6h3z" fill="#1f6b3a" stroke="#6e8f56" stroke-width=".6"/><rect x="8" y="18" width="2" height="3" fill="#7a4a2a"/><path d="M9 .3l.9 2 2.1.2-1.6 1.4.5 2.1L9 4.9 7.1 6l.5-2.1L6 2.5l2.1-.2z" fill="#8e2a2a" stroke="#c4847c" stroke-width=".3"/><circle cx="7" cy="11" r=".9" fill="#e6c98a"/><circle cx="11" cy="14" r=".9" fill="#8e2a2a"/><circle cx="8" cy="16" r=".9" fill="#c6a15a"/></svg>';
 function deco(){const hd=document.querySelector('.hd');if(!hd||hd.querySelector('.ny-gl'))return;
  const g=document.createElement('div');g.className='ny-gl';const n=Math.min(40,Math.round(innerWidth/34)),C=['#8e2a2a','#e6c98a','#6e8f56','#c6a15a','#8e2a2a'];
  let h='<svg preserveAspectRatio="none" viewBox="0 0 100 16"><path d="M0 3'+Array.from({length:n},(_,i)=>` Q${(i+.5)*100/n} 9 ${(i+1)*100/n} 3`).join('')+'" fill="none" stroke="#3a3f47" stroke-width=".5" vector-effect="non-scaling-stroke"/></svg>';
  for(let i=0;i<n;i++)h+=`<i style="left:calc(${(i+.5)*100/n}% - 3px);--c:${C[i%C.length]};--dl:${(i%5)*.45}s"></i>`;g.innerHTML=h;hd.appendChild(g);
  const nm=document.getElementById('pname');if(nm&&!document.querySelector('.ny-tree')){const t=document.createElement('span');t.className='ny-tree';t.innerHTML=tree+'<span>С Новым годом!</span>';nm.parentNode.appendChild(t)}
  const lg=document.getElementById('logo');if(lg){const a=lg.parentNode;a.style.position='relative';a.style.display='inline-block';const hat=document.createElement('div');hat.className='ny-hat';hat.style.cssText='right:-4px;top:-9px';hat.innerHTML='<svg viewBox="0 0 26 22"><path d="M3 17C6 9 12 3 21 4l-3 6 1 7z" fill="#c81e1e"/><rect x="1" y="15.5" width="20" height="5" rx="2.5" fill="#f1f1f1"/><circle cx="21.5" cy="4" r="3" fill="#f1f1f1"/></svg>';a.appendChild(hat)}}
 function snow(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const c=document.createElement('canvas');c.id='ny-sn';document.body.appendChild(c);const x=c.getContext('2d');let W,H,F=[];const dpr=Math.min(devicePixelRatio||1,1.5);
  const rs=()=>{W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);const N=Math.round(Math.min(90,W*H/18000));while(F.length<N)F.push(mk(true));F.length=N};
  const mk=r=>({x:Math.random()*W,y:r?Math.random()*H:-5,r:.6+Math.random()*1.8,v:.25+Math.random()*.6,s:Math.random()*6.28,a:.35+Math.random()*.45});
  addEventListener('resize',rs);rs();let last=0;
  (function f(t){requestAnimationFrame(f);if(document.hidden||t-last<33)return;last=t;x.clearRect(0,0,W,H);
   for(const p of F){p.y+=p.v;p.s+=.02;p.x+=Math.sin(p.s)*.3;if(p.y>H+5)Object.assign(p,mk(false));x.globalAlpha=p.a;x.fillStyle='#fff';x.beginPath();x.arc(p.x,p.y,p.r,0,6.28);x.fill()}})(0)}
 const go=()=>{deco();snow();new MutationObserver(deco).observe(document.body,{childList:true})};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',go):go();
})();
