const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fd=d=>String(d||'').split('-').reverse().join('.');
async function load(){const p=localStorage.getItem('vppka_preview');if(p&&location.search.includes('preview'))return JSON.parse(p);return (await fetch('content.json?'+Date.now())).json();}
let C,S;const J=()=>`href="${esc(S.joinUrl)}" target="_blank" rel="noopener"`;
burger.onclick=()=>menu.classList.toggle('open');
load().then(c=>{C=c;S=c.site;document.title=S.short+' — '+S.name;logo.src=S.logo;short.textContent=S.short;
document.querySelectorAll('.join-link').forEach(a=>a.href=S.joinUrl);
foot.innerHTML=`<div class="wrap"><div class="cols"><div><img src="${esc(S.logo)}" alt=""><p><b style="color:var(--tx)">${esc(S.name)}</b><br>${esc(S.motto)}</p></div>
<div><h4>Партия</h4><a href="#about">О партии</a><a href="#program">Программа</a><a href="#charter">Устав</a><a href="#leadership">Состав</a></div>
<div><h4>Инфо</h4><a href="#news">Новости</a><a href="#legal">Правовая база</a><a href="#contacts">Контакты</a></div>
<div><h4>Связь</h4>${c.contacts.items.filter(i=>i.url).map(i=>`<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.label)}</a>`).join('')}</div></div>
<div class="copy">© ${new Date().getFullYear()} ${esc(S.short)} · ${esc(S.footer)}</div></div>`;
addEventListener('hashchange',route);route();});
const news=()=>[...C.news].map((n,i)=>({...n,i})).sort((a,b)=>b.date.localeCompare(a.date));
const sh=(k,t,more)=>`<div class="sh fade"><div><div class="kicker">${k}</div><h2>${esc(t)}</h2></div>${more||''}</div>`;
const newsCards=ns=>`<div class="grid">${ns.map(n=>`<a class="card news fade" href="#news/${n.i}" style="color:inherit">${n.image?`<img src="${esc(n.image)}" alt="">`:''}<div class="date">${fd(n.date)}</div><h3>${esc(n.title)}</h3><p>${esc(n.text.slice(0,140))}…</p></a>`).join('')}</div>`;
const members=ms=>`<div class="grid">${ms.map(m=>`<div class="card member fade">${m.photo?`<img src="${esc(m.photo)}" alt="">`:'<div class="ph">★</div>'}<h3>${esc(m.name)}</h3><div class="role">${esc(m.role)}</div>${m.bio?`<p>${esc(m.bio)}</p>`:''}${m.contact?`<small>${esc(m.contact)}</small>`:''}</div>`).join('')}</div>`;
const goals=()=>`<div class="grid">${C.about.goals.map((g,i)=>`<div class="card fade"><div class="num">0${i+1}</div><h3>${esc(g)}</h3></div>`).join('')}</div>`;
const strip=t=>t.replace(/^[IVX]+\.\s*/,'');
const joinBlock=()=>`<div class="wrap"><div class="join fade"><h2>Вступай в партию</h2><p>${esc(S.slogan)} Заполни короткую анкету — мы свяжемся с тобой.</p><div class="cta" style="justify-content:center"><a class="btn" ${J()}>Подать заявку →</a></div></div></div>`;
const P={
home(){const [w1,...w2]=C.home.heroTitle.split(' ');return `<div class="hero"><div class="wrap"><div class="fade"><span class="tag">★ ${esc(S.server)}</span><h1>${esc(w1)} <span>${esc(w2.join(' '))}</span></h1><p>${esc(C.home.heroText)}</p>
<div class="cta"><a class="btn" ${J()}>Вступить в партию →</a><a class="btn ghost" href="#program">Наша программа</a></div>
<div class="stats">${C.home.stats.map(s=>`<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div></div><img class="emb" src="${esc(S.logo)}" alt="Герб"></div></div>
<section><div class="wrap">${sh('Цели','За что мы боремся','<a class="btn ghost sm" href="#about">О партии</a>')}${goals()}</div></section>
<section><div class="wrap">${sh('Программа','Ключевые направления','<a class="btn ghost sm" href="#program">Вся программа</a>')}<div class="grid">${C.program.sections.map(s=>`<div class="card fade"><h3>${esc(strip(s.title))}</h3><p>${esc(s.items[0]||'')}</p></div>`).join('')}</div></div></section>
<section><div class="wrap">${sh('Новости','Последние события','<a class="btn ghost sm" href="#news">Все новости</a>')}${newsCards(news().slice(0,3))}</div></section>
<section><div class="wrap">${sh('Команда','Руководство','<a class="btn ghost sm" href="#leadership">Весь состав</a>')}${members(C.leadership.members.slice(0,4))}</div></section>${joinBlock()}`},
about(){const a=C.about;return `<div class="wrap page"><div class="kicker">О партии</div><h1>${esc(S.name)}</h1><img class="banner fade" src="${esc(S.banner)}" alt=""><p class="lead">${esc(a.text)}</p><p><b>Идеология:</b> ${esc(S.ideology)}</p>
<section>${sh('Цели','Цели партии')}${goals()}</section><div class="card fade"><h3>Членство</h3><p>${esc(a.membership)}</p><a class="btn" ${J()}>Вступить →</a></div></div>${joinBlock()}`},
program(){const p=C.program;return `<div class="wrap page"><div class="kicker">${esc(p.date)}</div><h1>${esc(p.title)}</h1><div class="grid" style="margin-top:30px">${p.sections.map(s=>`<div class="card fade"><div class="num">${esc(s.title.split('.')[0])}</div><h3>${esc(strip(s.title))}</h3><ul>${s.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div><p class="date" style="margin-top:30px">${esc(S.motto)}</p></div>${joinBlock()}`},
charter(){const c=C.charter;return `<div class="wrap page"><div class="kicker">${esc(c.date)}</div><h1>${esc(c.title)}</h1><p class="date">${esc(c.note)}</p>${c.chapters.map(ch=>`<details class="fade"><summary>${esc(ch.title)}</summary><div class="body">${ch.articles.map(a=>`<div class="art"><b>${esc(a.title)}</b>\n${esc(a.text)}</div>`).join('')}</div></details>`).join('')}</div>`},
leadership(){const g={};C.leadership.members.forEach(m=>(g[m.group||'Состав']??=[]).push(m));return `<div class="wrap page"><div class="kicker">Команда</div><h1>Руководство и состав</h1><p class="lead">${esc(C.leadership.intro)}</p>${Object.entries(g).map(([k,ms])=>`<div class="group">${esc(k)}</div>${members(ms)}`).join('')}</div>${joinBlock()}`},
legal(){const l=C.legal;return `<div class="wrap page"><div class="kicker">RMRP · Арбат</div><h1>Правовая база</h1><p class="lead">${esc(l.intro)}</p>${l.docs.map(d=>`<details class="fade"><summary>${esc(d.title)}</summary><div class="body"><p>Источник: <a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.url)}</a></p><pre>${esc(d.text)}</pre></div></details>`).join('')}
<section>${sh('Ссылки','Полезные ресурсы')}<div class="grid">${l.links.map(x=>`<a class="card fade" href="${esc(x.url)}" target="_blank" rel="noopener"><h3 style="color:var(--tx)">${esc(x.title)} ↗</h3></a>`).join('')}</div></section></div>`},
news(id){if(id!==undefined&&C.news[id]){const n=C.news[id];return `<div class="wrap page" style="max-width:820px"><a href="#news">← Все новости</a><div class="date" style="margin-top:20px">${fd(n.date)}</div><h1>${esc(n.title)}</h1>${n.image?`<img class="banner" src="${esc(n.image)}" alt="">`:''}<p class="lead">${esc(n.text)}</p></div>`}
 return `<div class="wrap page"><div class="kicker">Пресс-центр</div><h1>Новости</h1><div style="margin-top:30px">${newsCards(news())}</div></div>`},
contacts(){const c=C.contacts;return `<div class="wrap page"><div class="kicker">Связь</div><h1>Контакты</h1><p class="lead">${esc(c.text)}</p><div class="grid" style="margin-top:30px">${c.items.map(i=>`<div class="card fade"><h3>${esc(i.label)}</h3>${i.url?`<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.value)} ↗</a>`:`<p>${esc(i.value)}</p>`}</div>`).join('')}</div></div>${joinBlock()}`}};
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08});
function route(){const [k,id]=(location.hash.slice(1)||'home').split('/');const key=P[k]?k:'home';app.innerHTML=P[key](id);menu.classList.remove('open');
document.querySelectorAll('#menu a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+key));scrollTo(0,0);
const f=document.querySelectorAll('.fade');f.forEach(el=>io.observe(el));requestAnimationFrame(()=>f.forEach(el=>{if(el.getBoundingClientRect().top<innerHeight)el.classList.add('in')}));setTimeout(()=>f.forEach(el=>el.classList.add('in')),1200);}
