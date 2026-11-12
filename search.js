// Поиск по уже загруженным публичным данным: content.json, состав, новости, мероприятия, объявления.
// Не читает Discord ID, паспорт, биографию и прочие поля, которых нет в подписи карточки.
(function(){
 const nrm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clean=s=>String(s||'').replace(/\[фото:\d+\]/gi,' ').replace(/[#*_>`]/g,' ').replace(/\s+/g,' ').trim();
 const tokRe=t=>[...t].map(ch=>ch==='е'?'[еёЕЁ]':ch.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('');
 function tokens(q){return nrm(q).split(/[^a-zа-я0-9]+/i).filter(t=>t.length>=1).slice(0,8)}
 function has(hay,ts){const h=nrm(hay);return ts.every(t=>h.includes(t))}
 function hi(text,ts){const src=String(text||'');if(!ts.length)return esc(src);const re=new RegExp('('+ts.map(tokRe).join('|')+')','gi');let out='',i=0;src.replace(re,(m, _g, off)=>{out+=esc(src.slice(i,off))+'<mark class="sr-mk">'+esc(m)+'</mark>';i=off+m.length;return m});return out+esc(src.slice(i))}
 function snip(text,ts){const src=clean(text);if(!src)return '';const re=new RegExp(ts.map(tokRe).join('|'),'i');const m=re.exec(src);const at=m?m.index:0;const a=Math.max(0,at-42);const b=Math.min(src.length,at+90);return (a?'…':'')+hi(src.slice(a,b),ts)+(b<src.length?'…':'')}
 function C(){return (window.VPPKA_C&&window.VPPKA_C())||null}
 function subsOf(m){if(window.VPPKA_SUBPOS_OF)return window.VPPKA_SUBPOS_OF(m);const allow=new Set((window.VPPKA_SUBPOS||[]).map(nrm));const out=[];(Array.isArray(m&&m.subPositions)?m.subPositions:[]).forEach(x=>{const s=String(x||'').replace(/\s+/g,' ').trim();if(!s||(allow.size&&!allow.has(nrm(s)))||out.some(y=>nrm(y)===nrm(s)))return;out.push(s)});return out}
 function people(){let list=[];try{if(window.VPPKA_PARTY)list=window.VPPKA_PARTY()||[]}catch(e){list=[]}if(!list.length){const c=C();list=(c&&c.leadership&&c.leadership.members)||[]}const rows=list.filter(m=>m&&m.name&&m.name!=='Вакансия'&&m.id).map(m=>({id:String(m.id),name:String(m.name),role:String(m.title||m.role||''),group:String(m.group||''),subs:subsOf(m).join(' ')}));
 const best=new Map();rows.forEach(m=>{const k=nrm(m.name),prev=best.get(k),score=m.role&&nrm(m.role)!=='член партии'?2:1,ps=prev&&prev.role&&nrm(prev.role)!=='член партии'?2:1;if(!prev||score>ps){if(prev&&prev.subs)m.subs=[m.subs,prev.subs].filter(Boolean).join(' ');best.set(k,m)}else if(m.subs)prev.subs=[prev.subs,m.subs].filter(Boolean).join(' ')});return [...best.values()]}
 function news(){const live=window.VPPKA_DATA;let src;if(live&&Object.prototype.hasOwnProperty.call(live,'news'))src=live.news||[];else if(window.VPPKA_FRESH==='wait')src=[];else src=(C()&&C().news)||[];return src.filter(n=>n&&(n.title||n.text)).map(n=>({id:String(n.id??''),title:String(n.title||'Новость'),text:clean(n.text||'')}))}
 function events(){let list=[];try{list=window.VPPKA_EV_PUBLIC?window.VPPKA_EV_PUBLIC()||[]:[]}catch(e){list=[]}return list.filter(e=>e&&e.title).map(e=>({id:String(e.id||''),title:String(e.title),text:clean((e.place?e.place+' ':'')+(e.desc||''))}))}
 function anns(){let list=[];try{list=window.VPPKA_HN?window.VPPKA_HN()||[]:[]}catch(e){list=[]}return list.filter(x=>x&&!x.hidden&&x.title).map(x=>({id:String(x.id||''),title:String(x.title),text:clean((x.place?x.place+' ':'')+(x.text||''))}))}
 function docs(){const c=C()||{},out={charter:[],program:[],legal:[]};const ch=(c.charter&&c.charter.chapters)||[];ch.forEach((g,ci)=>{(g.articles||[]).forEach((a,ai)=>{out.charter.push({id:'ca-'+ci+'-'+ai,title:String(a.title||'Статья'),text:clean(a.text||'')})})});((c.program&&c.program.sections)||[]).forEach((s,i)=>{out.program.push({id:'ps-'+i,title:String(s.title||'Раздел'),text:clean((s.items||[]).join(' '))})});((c.legal&&c.legal.docs)||[]).forEach((d,i)=>{out.legal.push({id:'ld-'+i,title:String(d.title||'Документ'),text:clean(d.text||'')})});((c.legal&&c.legal.links)||[]).forEach((d,i)=>{out.legal.push({id:'ll-'+i,title:String(d.title||'Ссылка'),text:'',href:''})});return out}
 function rank(title,text,ts){const blob=title+' '+text;if(!has(blob,ts))return 0;let s=1;if(has(title,ts))s+=6;const ht=nrm(title);if(ts.some(t=>ht.startsWith(t)))s+=2;return s}
 function take(rows,ts,href,limit){return rows.map(r=>{const s=rank(r.title,r.text,ts);return s?{s,title:r.title,snip:snip(r.text||r.title,ts),href:r.href||href(r)}:null}).filter(Boolean).sort((a,b)=>b.s-a.s).slice(0,limit)}
 function query(q,src){const ts=tokens(q);if(!ts.length)return null;src=src||{};const P=src.people||people(),N=src.news||news(),E=src.events||events(),A=src.anns||anns(),D=src.docs||docs();
  const groups=[];
  const g=(name,items)=>{if(items.length)groups.push({name,items})};
  g('Руководители и члены партии',take(P.map(p=>({id:p.id,title:p.name,text:[p.role,p.group,p.subs].filter(Boolean).join(' · ')})),ts,r=>'#member/'+encodeURIComponent(r.id),8));
  g('Новости',take(N.filter(n=>n.id),ts,r=>'#news/'+encodeURIComponent(r.id),6));
  g('Мероприятия',take(E.filter(e=>e.id),ts,r=>'#events/'+encodeURIComponent(r.id),6));
  g('Устав',take(D.charter,ts,r=>'#charter/'+r.id,6));
  g('Программа',take(D.program,ts,r=>'#program/'+r.id,6));
  g('Правовая база',take(D.legal.filter(d=>d.id),ts,r=>'#legal/'+r.id,6));
  g('Объявления',take(A.filter(a=>a.id),ts,r=>'#home/an-'+encodeURIComponent(a.id),6));
  return groups}
 window.VPPKA_FIND=query;
 if(typeof document==='undefined')return;

 const ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.15" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.3 15.3L21 21" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
 function btn(cls,label,withText){const b=document.createElement('button');b.type='button';b.className='srch-go '+cls;b.setAttribute('aria-label',label);b.setAttribute('aria-keyshortcuts','Control+K /');b.innerHTML=ICON+(withText?'<span>Поиск</span>':'');b.addEventListener('click',()=>open());return b}
 const hd=document.querySelector('.hd .w');const burger=document.getElementById('burger');if(hd)hd.insertBefore(btn('srch-hd','Поиск по сайту',false),burger||null);
 const nav=document.querySelector('#menu .w');if(nav)nav.appendChild(btn('srch-nav','Поиск по сайту',true));

 const ov=document.createElement('div');ov.className='srch-ov';ov.hidden=true;ov.id='srch';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','srch-title');
 ov.innerHTML='<div class="srch-box"><div class="srch-top"><h2 id="srch-title">Поиск</h2><input id="srch-q" class="srch-q" type="text" role="searchbox" placeholder="Имя, должность, новость, статья…" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-autocomplete="list" aria-controls="srch-list" aria-activedescendant=""><button type="button" class="srch-x" aria-label="Закрыть">×</button></div><p class="srch-hint" id="srch-hint">Клавиши: / или Ctrl+K, стрелки и Enter</p><div id="srch-list" class="srch-list" role="listbox" aria-label="Результаты поиска"></div></div>';
 document.body.appendChild(ov);
 const q=ov.querySelector('#srch-q'),list=ov.querySelector('#srch-list'),hint=ov.querySelector('#srch-hint');
 let items=[],active=-1,timer=0,last='',openFlag=false;
 function close(){if(!openFlag)return;openFlag=false;ov.hidden=true;document.body.classList.remove('srch-on');q.setAttribute('aria-activedescendant','')}
 function open(){const menu=document.getElementById('menu');if(menu)menu.classList.remove('open');if(burger){burger.textContent='☰';burger.setAttribute('aria-expanded','false')}openFlag=true;ov.hidden=false;document.body.classList.add('srch-on');q.focus();q.select();paint()}
 function setActive(i){if(!items.length){active=-1;return}active=(i+items.length)%items.length;list.querySelectorAll('.srch-it').forEach((el,n)=>{const on=n===active;el.classList.toggle('on',on);el.setAttribute('aria-selected',on?'true':'false')});const el=list.querySelector('.srch-it.on');if(el){el.id='srch-act';q.setAttribute('aria-activedescendant','srch-act');el.scrollIntoView({block:'nearest'})}}
 function go(i){const it=items[i];if(!it)return;close();const same=location.hash===it.href;location.hash=it.href;if(same)focusHash()}
 function paint(){const v=q.value;const ts=tokens(v);const groups=v.trim()?query(v):null;items=[];if(!v.trim()){list.innerHTML='';hint.hidden=false;hint.textContent='Клавиши: / или Ctrl+K, стрелки и Enter';active=-1;q.removeAttribute('aria-activedescendant');return}
  hint.hidden=true;if(!groups||!groups.length){list.innerHTML='<p class="sr-none">Ничего не найдено</p>';active=-1;q.removeAttribute('aria-activedescendant');return}
  let html='',n=0;groups.forEach(g=>{html+='<div class="srch-g">'+esc(g.name)+'</div>';g.items.forEach(it=>{items.push(it);html+='<button type="button" class="srch-it" role="option" data-i="'+n+'" aria-selected="false"><b>'+hi(it.title,ts)+'</b>'+(it.snip?'<small>'+it.snip+'</small>':'')+'</button>';n++})});
  list.innerHTML=html;setActive(items.length?(active<0?0:Math.min(active,items.length-1)): -1)}
 function sched(){clearTimeout(timer);timer=setTimeout(()=>{if(q.value===last)return;last=q.value;active=0;paint()},140)}
 q.addEventListener('input',()=>{last='';sched()});
 ov.querySelector('.srch-x').addEventListener('click',close);
 ov.addEventListener('mousedown',e=>{if(e.target===ov)close()});
 list.addEventListener('click',e=>{const b=e.target.closest('.srch-it');if(!b)return;go(+b.dataset.i)});
 list.addEventListener('mousemove',e=>{const b=e.target.closest('.srch-it');if(b)setActive(+b.dataset.i)});
 addEventListener('keydown',e=>{const t=e.target;const inField=t&&(t.id==='srch-q'||(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)&&t.id!=='srch-q')||t.isContentEditable);if(e.key==='Escape'&&openFlag){e.preventDefault();close();return}if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();openFlag?q.focus():open();return}if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!inField&&!openFlag){e.preventDefault();open();return}if(!openFlag)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setActive(active+(e.key==='ArrowDown'?1:-1))}else if(e.key==='Enter'&&active>=0&&items[active]){e.preventDefault();go(active)}},true);
 function cssEsc(s){return (window.CSS&&CSS.escape)?CSS.escape(s):String(s).replace(/"/g,'')}
 function focusHash(){const parts=(location.hash||'').replace(/^#/,'').split('/');const k=parts[0],id=parts.slice(1).join('/');if(!id)return false;let el=null;
  if(k==='charter'||k==='program'||k==='legal')el=document.getElementById(id);
  else if(k==='events')el=document.querySelector('[data-ev="'+cssEsc(decodeURIComponent(id))+'"]');
  else if(k==='home'&&id.startsWith('an-')){const aid=decodeURIComponent(id.slice(3));el=document.querySelector('#hnote [data-id="'+cssEsc(aid)+'"]')||document.getElementById('hnote')}
  if(!el)return false;const det=el.closest('details');if(det)det.open=true;document.querySelectorAll('.sr-mark').forEach(n=>n.classList.remove('sr-mark'));el.classList.add('sr-mark');const nh=[...document.querySelectorAll('.hd,.nav')].reduce((h,e)=>{const cs=getComputedStyle(e);return (cs.position==='sticky'||cs.position==='fixed')?Math.max(h,e.getBoundingClientRect().height):h},0);const y=el.getBoundingClientRect().top+scrollY-nh-12;scrollTo(0,Math.max(0,y));return true}
 let tries=0;function focusSoon(){tries=0;const step=()=>{if(focusHash()||++tries>10)return;setTimeout(step,200)};setTimeout(step,30)}
 addEventListener('hashchange',focusSoon);
 // пока панель открыта, подхватываем состав и новости, когда они догрузились
 setInterval(()=>{if(!openFlag||!q.value.trim())return;const sig=JSON.stringify(query(q.value));if(sig!==q.dataset.sig){q.dataset.sig=sig;paint()}},900);
})();
