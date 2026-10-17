const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fd=d=>String(d||'').split('-').reverse().join('.');
async function load(){const p=localStorage.getItem('vppka_preview');if(p&&location.search.includes('preview'))return JSON.parse(p);return (await fetch('content.json?'+Date.now())).json();}
let C,S;const J=()=>`href="${esc(S.joinUrl)}" target="_blank" rel="noopener"`;
burger.onclick=()=>menu.classList.toggle('open');
const strip=t=>t.replace(/^[IVX]+\.\s*/,'');
load().then(c=>{C=c;S=c.site;document.title=S.short+' — '+S.name;logo.src=S.logo;
document.querySelectorAll('.join-link').forEach(a=>a.href=S.joinUrl);
foot.innerHTML=`<div class="big">${esc(S.slogan.split('!')[0])}<span>!</span></div><div class="cols"><div><h4>ПАРТИЯ</h4><b style="color:var(--p)">${esc(S.name)}</b><p>${esc(S.motto)}</p></div>
<div><h4>РАЗДЕЛЫ</h4><a href="#about">Партия</a><a href="#program">Программа</a><a href="#charter">Устав</a><a href="#leadership">Состав</a></div>
<div><h4>ИНФО</h4><a href="#news">Новости</a><a href="#legal">Правовая база</a><a href="#contacts">Связь</a></div>
<div><h4>СВЯЗЬ</h4>${c.contacts.items.filter(i=>i.url).map(i=>`<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.label)} ↗</a>`).join('')}</div></div>
<div class="copy">© ${new Date().getFullYear()} ${esc(S.short)} · ${esc(S.footer)}</div>`;
addEventListener('hashchange',route);route();});
const news=()=>[...C.news].map((n,i)=>({...n,i})).sort((a,b)=>b.date.localeCompare(a.date));
const sh=(n,k,t,more)=>`<div class="sh fade"><div class="n">${n}</div><div><span class="kick">${k}</span><h2>${esc(t)}</h2></div>${more||''}</div>`;
const marq=()=>{const w=[S.slogan,S.motto,'Вступай в ВППКА','Социальная справедливость','Народовластие','Права трудящихся'];const s=w.map(x=>`<span>${esc(x)}</span><i>★</i>`).join('');return `<div class="marq"><div>${s}${s}</div></div>`};
const newsCards=ns=>`<div class="news">${ns.map(n=>`<a class="ncard fade" href="#news/${n.i}">${n.image?`<img src="${esc(n.image)}" alt="">`:''}<div><span class="date">${fd(n.date)}</span><h3 style="font-size:20px;margin-top:8px">${esc(n.title)}</h3><p>${esc(n.text.slice(0,140))}…</p></div></a>`).join('')}</div>`;
const ppl=ms=>`<div class="ppl">${ms.map(m=>`<div class="per fade">${m.photo?`<img src="${esc(m.photo)}" alt="">`:'<div class="ph">★</div>'}<h3>${esc(m.name)}</h3><div class="role">${esc(m.role)}</div>${m.bio?`<p>${esc(m.bio)}</p>`:''}${m.contact?`<small>${esc(m.contact)}</small>`:''}</div>`).join('')}</div>`;
const rows=()=>`<div class="rows">${C.about.goals.map(g=>`<div class="row fade">${esc(g)}</div>`).join('')}</div>`;
const mos=full=>`<div class="mos">${C.program.sections.map(s=>`<div class="tile fade"><span class="rn">${esc(s.title.split('.')[0])}</span><h3>${esc(strip(s.title))}</h3>${full?`<ul>${s.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`:`<p>${esc(s.items[0]||'')}</p>`}</div>`).join('')}</div>`;
const joinB=()=>`<div class="joinb fade"><div><h2>Вступай<br>в ряды</h2></div><div><p>${esc(S.slogan)} Заполни анкету — и стань частью новой политической силы Арбата.</p><a class="btn" ${J()}>Подать заявку ↗</a></div></div>`;
const head=(n,k,t)=>`<div class="page"><span class="kick">${n} / ${k}</span><h1>${t}</h1>`;
const P={
home(){const w=C.home.heroTitle.split(' ');return `<div class="hero"><div class="wedge"></div><div class="bar"></div><div class="disk"></div><img class="emb" src="${esc(S.logo)}" alt="Герб">
<div class="txt"><span class="no">№ 00 — ${esc(S.server)}</span><h1>${esc(w[0])}<span class="l2">${esc(w.slice(1).join(' '))}</span><span class="l3">${esc(S.short)} · 2026</span></h1><p>${esc(C.home.heroText)}</p>
<div class="cta"><a class="btn red" ${J()}>Вступить в партию ↗</a><a class="btn line" href="#program">Программа →</a></div>
<div class="figs">${C.home.stats.map(s=>`<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div></div></div>${marq()}
<div class="sec">${sh('01','За что мы боремся','Цели партии','<a class="btn line sm" href="#about">О партии →</a>')}${rows()}</div>
<div class="sec">${sh('02','Семь направлений','Программа','<a class="btn line sm" href="#program">Читать всё →</a>')}${mos(false)}</div>
<div class="sec">${sh('06','Пресс-центр','Новости','<a class="btn line sm" href="#news">Все →</a>')}${newsCards(news().slice(0,3))}</div>
<div class="sec">${sh('04','Команда','Руководство','<a class="btn line sm" href="#leadership">Состав →</a>')}${ppl(C.leadership.members.slice(0,4))}</div>${joinB()}`},
about(){const a=C.about;return `${head('01','Партия','О партии')}<img class="banner fade" src="${esc(S.banner)}" alt=""><p class="lead">${esc(a.text)}</p><p><b>Идеология:</b> ${esc(S.ideology)}</p></div>
<div class="sec">${sh('★','Цели','За что мы боремся')}${rows()}<div style="margin-top:50px" class="fade"><span class="kick">Членство</span><p class="lead">${esc(a.membership)}</p><a class="btn red" ${J()}>Вступить ↗</a></div></div>${joinB()}`},
program(){const p=C.program;return `${head('02',esc(p.date),esc(p.title))}${mos(true)}<p class="date" style="margin-top:30px">${esc(S.motto)}</p></div>${joinB()}`},
charter(){const c=C.charter;return `${head('03',esc(c.date),esc(c.title))}<p class="lead">${esc(c.note)}</p>${c.chapters.map(ch=>`<details class="fade"><summary>${esc(ch.title)}</summary><div class="body">${ch.articles.map(a=>`<div class="art"><b>${esc(a.title)}</b>\n${esc(a.text)}</div>`).join('')}</div></details>`).join('')}</div>`},
leadership(){const g={};C.leadership.members.forEach(m=>(g[m.group||'Состав']??=[]).push(m));return `${head('04','Команда','Состав партии')}<p class="lead">${esc(C.leadership.intro)}</p>${Object.entries(g).map(([k,ms])=>`<div class="group">${esc(k)}</div>${ppl(ms)}`).join('')}</div>${joinB()}`},
legal(){const l=C.legal;return `${head('05','RMRP · Арбат','Правовая база')}<p class="lead">${esc(l.intro)}</p>${l.docs.map(d=>`<details class="fade"><summary>${esc(d.title)}</summary><div class="body"><p>Источник: <a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.url)}</a></p><pre>${esc(d.text)}</pre></div></details>`).join('')}
<div style="margin-top:60px"><span class="kick">Ресурсы</span><div class="links">${l.links.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)} ↗</a>`).join('')}</div></div></div>`},
news(id){if(id!==undefined&&C.news[id]){const n=C.news[id];return `<div class="page" style="max-width:1000px"><a href="#news" class="btn line sm">← Все новости</a><p class="date" style="margin-top:40px">${fd(n.date)}</p><h1 style="font-size:clamp(32px,5vw,64px)">${esc(n.title)}</h1>${n.image?`<img class="banner" src="${esc(n.image)}" alt="">`:''}<p class="lead">${esc(n.text)}</p></div>`}
 return `${head('06','Пресс-центр','Новости')}${newsCards(news())}</div>`},
contacts(){const c=C.contacts;return `${head('07','Связь','Контакты')}<p class="lead">${esc(c.text)}</p><div class="links">${c.items.map(i=>i.url?`<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.label)} — ${esc(i.value)} ↗</a>`:`<a>${esc(i.label)} — ${esc(i.value)}</a>`).join('')}</div></div>${joinB()}`}};
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.05});
function route(){const [k,id]=(location.hash.slice(1)||'home').split('/');const key=P[k]?k:'home';app.innerHTML=P[key](id);menu.classList.remove('open');
document.querySelectorAll('#menu a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+key));scrollTo(0,0);
const f=document.querySelectorAll('.fade');f.forEach(el=>io.observe(el));requestAnimationFrame(()=>f.forEach(el=>{if(el.getBoundingClientRect().top<innerHeight)el.classList.add('in')}));setTimeout(()=>f.forEach(el=>el.classList.add('in')),1500);}
