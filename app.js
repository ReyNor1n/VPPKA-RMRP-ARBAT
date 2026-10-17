const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fd=d=>String(d||'').split('-').reverse().join('.');
async function load(){const p=localStorage.getItem('vppka_preview');if(p&&location.search.includes('preview'))return JSON.parse(p);return (await fetch('content.json?'+Date.now())).json();}
let C,S;const J=()=>`href="${esc(S.joinUrl)}" target="_blank" rel="noopener"`;
burger.onclick=()=>menu.classList.toggle('open');
const strip=t=>t.replace(/^[IVX]+\.\s*/,'');
const NAMES={about:'О партии',program:'Программа',charter:'Устав',leadership:'Руководство',news:'Новости',legal:'Правовая база',contacts:'Контакты'};
load().then(c=>{C=c;S=c.site;C.leadership.members.forEach((m,i)=>{if(!m.id)m.id='m'+(i+1)});document.title=S.short+' — '+S.name;logo.src=S.logo;
pname.innerHTML=`<span>Всероссийская политическая партия</span>«${esc(S.name.split('«')[1]||S.name)}`;srv.textContent=S.name+' · '+S.server;
document.querySelectorAll('.join-link').forEach(a=>a.href=S.joinUrl);
foot.innerHTML=`<div class="w"><div class="cols"><div><h4>${esc(S.short)}</h4><p>${esc(S.name)}<br>Идеология: ${esc(S.ideology)}</p></div>
<div><h4>О партии</h4><a href="#about">Общие сведения</a><a href="#program">Программа</a><a href="#charter">Устав</a><a href="#leadership">Руководство</a></div>
<div><h4>Информация</h4><a href="#news">Новости</a><a href="#legal">Правовая база</a><a href="#contacts">Контакты</a></div>
<div><h4>Связь</h4>${c.contacts.items.filter(i=>i.url).map(i=>`<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.label)}</a>`).join('')}</div></div>
<div class="req">${esc(S.name)} · Местонахождение руководящего органа: г. Москва (в рамках игрового проекта) · Устав от ${esc((C.charter.date||'').replace('г. Москва, ',''))} · Программа от ${esc((C.program.date||'').replace('г. Москва, ',''))}<br>© ${new Date().getFullYear()} ${esc(S.short)}. ${esc(S.footer)}</div></div>`;
addEventListener('hashchange',route);route();});
const news=()=>[...C.news].map((n,i)=>({...n,i})).sort((a,b)=>b.date.localeCompare(a.date));
const nl=ns=>`<div class="nl">${ns.map(n=>`<div class="it"><div class="d">${fd(n.date)}</div><div><h3><a href="#news/${n.i}">${esc(n.title)}</a></h3><p>${esc(n.text.slice(0,200))}…</p></div></div>`).join('')}</div>`;
const card=(m,q)=>`<a class="card mcard" href="#member/${esc(m.id||'')}"><div class="ph" ${m.photo?`style="background-image:url('${esc(m.photo)}')"`:''}>${m.photo?'':'Фото'}</div><h3>${esc(m.name)}</h3><div class="role">${esc(m.role)}</div>${q?`<p class="quote">${esc(q)}</p>`:''}${m.bio?`<p>${esc(m.bio)}</p>`:''}${m.contact?`<small>${esc(m.contact)}</small>`:''}</a>`;
const pg=(k,h)=>`<div class="crumbs"><a href="#home">Главная</a> / ${esc(NAMES[k]||'')}</div><div class="pg">${h}</div>`;
const side=()=>`<div class="side"><div class="blk"><h2>Вступление в партию</h2><p>Членом партии может стать гражданин, достигший 18 лет, признающий Устав и Программу. Заявка подаётся через кнопку «Вступить в партию» в шапке сайта.</p></div>
<div class="blk"><h2>Документы</h2><ul><li><a href="#program">Программа партии</a></li><li><a href="#charter">Устав партии</a></li><li><a href="#legal">Правовая база</a></li></ul></div></div>`;
const MF=[['group','Партийный орган'],['joined','Дата вступления'],['birth','Возраст / дата рождения'],['city','Город / район']];
const P={
member(id){const m=C.leadership.members.find(x=>x.id===id);if(!m)return `<div class="crumbs"><a href="#home">Главная</a> / <a href="#leadership">Руководство</a></div><div class="pg"><h1>Профиль не найден</h1><a class="btn o" href="#leadership">← К составу</a></div>`;
const links=[m.discord&&['Discord',m.discord],m.forum&&['Форум',m.forum],m.contact&&['Контакт',m.contact]].filter(Boolean);
const lk=([l,v])=>/^https?:/.test(v)?`<a href="${esc(v)}" target="_blank" rel="noopener">${esc(v)}</a>`:esc(v);
return `<div class="crumbs"><a href="#home">Главная</a> / <a href="#leadership">Руководство</a> / ${esc(m.name)}</div><div class="pg"><a class="btn o sm" href="#leadership">← Назад к составу</a>
<div class="prof blk" style="margin-top:18px"><div class="prof-ph" ${m.photo?`style="background-image:url('${esc(m.photo)}')"`:''}>${m.photo?'':'ФОТО'}</div><div><span class="role">// ${esc(m.group||'Состав')}</span><h1 class="prof-n">${esc(m.name)}</h1><div class="prof-r">${esc(m.role)}</div>
${m.quote?`<p class="quote">«${esc(m.quote)}»</p>`:''}<table class="tbl" style="margin-top:16px">${MF.filter(([k])=>m[k]).map(([k,l])=>`<tr><td>${l}</td><td>${esc(m[k])}</td></tr>`).join('')}${links.map(x=>`<tr><td>${x[0]}</td><td>${lk(x)}</td></tr>`).join('')}</table></div></div>
${m.bio?`<div class="blk"><h2>Биография</h2><p class="lead">${esc(m.bio)}</p></div>`:''}${m.achievements?`<div class="blk"><h2>Достижения и должности</h2><p class="lead">${esc(m.achievements)}</p></div>`:''}</div>`},
home(){const H=C.home,t=(H.trio||C.leadership.members).slice(0,3).map((x,i)=>{const m=x.memberId?C.leadership.members.find(y=>y.id===x.memberId):C.leadership.members[i];return m?{...m}:x}),qs=[H.trioLeft,'',H.trioRight];return `<div class="pg" style="padding-top:28px">
<div class="blk intro"><img src="${esc(S.logo)}" alt=""><div><h1>${esc(H.trioBottom||S.slogan)}</h1><p>${esc(H.heroText)}</p><a class="btn o" href="#program">Программа партии</a></div></div>
<div class="grid"><div><div class="blk"><h2>Новости</h2>${nl(news().slice(0,5))}<p><a href="#news">Все новости →</a></p></div>
<div class="blk"><h2>Руководство партии</h2><div class="ldr">${t.map((m,i)=>card(m,qs[i])).join('')}</div><p><a href="#leadership">Полный состав →</a></p></div>
<div class="blk"><h2>Основные направления программы</h2><table class="tbl">${C.program.sections.map(s=>`<tr><td>${esc(strip(s.title))}</td><td>${esc(s.items[0]||'')}</td></tr>`).join('')}</table></div></div>${side()}</div></div>`},
about(){const a=C.about;return pg('about',`<h1>О партии</h1><div class="grid"><div><div class="blk"><img class="banner" src="${esc(S.banner)}" alt=""><p class="lead">${esc(a.text)}</p></div>
<div class="blk"><h2>Цели партии</h2><ol>${a.goals.map(g=>`<li>${esc(g)}</li>`).join('')}</ol></div><div class="blk"><h2>Сведения</h2><table class="tbl"><tr><td>Полное наименование</td><td>${esc(S.name)}</td></tr><tr><td>Сокращённое</td><td>${esc(S.short)}</td></tr><tr><td>Идеология</td><td>${esc(S.ideology)}</td></tr><tr><td>Членство</td><td>${esc(a.membership)}</td></tr></table></div></div>${side()}</div>`)},
program(){const p=C.program;return pg('program',`<div class="doc"><div class="hdr"><p>${esc(S.motto)}</p><h1>${esc(p.title)}</h1><p>${esc(S.name)}<br>${esc(p.date)}</p></div>${p.sections.map(s=>`<h2>${esc(s.title)}</h2><ol>${s.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ol>`).join('')}</div>`)},
charter(){const c=C.charter;return pg('charter',`<div class="doc"><div class="hdr"><h1>${esc(c.title)}</h1><p>${esc(S.name)}<br>${esc(c.date)}</p><p style="font-size:14px;margin-top:10px">${esc(c.note)}</p></div>${c.chapters.map(ch=>`<h2>${esc(ch.title)}</h2>${ch.articles.map(a=>`<h3>${esc(a.title)}</h3><div class="t">${esc(a.text)}</div>`).join('')}`).join('')}</div>`)},
leadership(){const g={};C.leadership.members.forEach(m=>(g[m.group||'Состав']??=[]).push(m));return pg('leadership',`<h1>Руководство и состав партии</h1><p>${esc(C.leadership.intro)}</p>${Object.entries(g).map(([k,ms])=>`<div class="blk"><h2>${esc(k)}</h2><div class="ldr">${ms.map(m=>card(m)).join('')}</div></div>`).join('')}`)},
legal(){const l=C.legal;return pg('legal',`<h1>Правовая база</h1><p>${esc(l.intro)}</p><div style="margin-bottom:24px">${l.docs.map(d=>`<details><summary>${esc(d.title)}</summary><div class="body"><p>Источник: <a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.url)}</a></p><pre>${esc(d.text)}</pre></div></details>`).join('')}</div><div class="blk"><h2>Ссылки</h2><ul>${l.links.map(x=>`<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a></li>`).join('')}</ul></div>`)},
news(id){if(id!==undefined&&C.news[id]){const n=C.news[id];return `<div class="crumbs"><a href="#home">Главная</a> / <a href="#news">Новости</a> / ${esc(n.title)}</div><div class="pg"><div class="blk"><div class="d" style="color:var(--mut)">${fd(n.date)}</div><h1 style="font-size:28px">${esc(n.title)}</h1>${n.image?`<img class="banner" src="${esc(n.image)}" alt="">`:''}<p class="lead">${esc(n.text)}</p></div></div>`}
 return pg('news',`<h1>Новости</h1><div class="blk">${nl(news())}</div>`)},
contacts(){const c=C.contacts;return pg('contacts',`<h1>Контакты</h1><div class="grid"><div class="blk"><p>${esc(c.text)}</p><table class="tbl">${c.items.map(i=>`<tr><td>${esc(i.label)}</td><td>${i.url?`<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.value)}</a>`:esc(i.value)}</td></tr>`).join('')}</table></div>${side()}</div>`)}};
function route(){const [k,id]=(location.hash.slice(1)||'home').split('/');const key=P[k]?k:'home';const navKey=key==='member'?'leadership':key;app.innerHTML=P[key](id);menu.classList.remove('open');
document.querySelectorAll('#menu a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+navKey));scrollTo(0,0);}
