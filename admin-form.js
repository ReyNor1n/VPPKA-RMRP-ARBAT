// Схемы визуальных форм раздела #admin. Чистые функции: без DOM и без Firestore.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
export const HIST_N=12;
export const CONTENT=[['site','Сайт и подвал'],['home','Главная'],['about','О партии'],['program','Программа'],['charter','Устав'],['legal','Правовая база'],['contacts','Контакты'],['leadership','Руководство']];
export const COLS=[['news','Новости','news'],['events','Мероприятия','event'],['members','Состав','seat'],['banners','Баннеры','banner'],['votes','Голосования','vote'],['users','Пользователи','user'],['applications','Заявки','application'],['notifications','Уведомления','note'],['chats','Чаты','chat']];
export const kindOf=id=>{const c=COLS.find(x=>x[0]===id);return c?c[2]:id};
export const isContent=id=>CONTENT.some(x=>x[0]===id);
export const PROTECTED=['m1','m4','m5','m11'];
export const isProtected=id=>PROTECTED.includes(id);
const GROUPS=['Центральный Комитет','Контрольно-ревизионная комиссия','Отделения','Технический отдел','Члены партии'];
const TIERS=Array.from({length:10},(_,i)=>({v:String(i),l:i===0?'0 — без ступени':String(i)}));
const HIDDEN={
 news:['author','createdAt','updatedAt','likeCount'],
 event:['createdBy','updatedAt','discordMessageId','att','endedAt','endedBy'],
 seat:['updatedBy','updatedAt'],
 vote:['counts','total','createdBy','createdAt','discordMessageId','discordChannelId'],
 banner:['t'],
 application:['uid','reviewedBy','reviewedAt','reviewerRole','rankedBy','rankedAt','expelledBy','expelledAt','discordPostedAt','discordMessageId','discordDecision','discordSourceId','createdAt'],
 note:['author','createdAt','cancelledAt'],
 user:['createdAt','keyHash','vcode'],
 chat:['participants','createdBy','updatedAt','lastMessage','unread','names']
};
const LABELS={name:'Название',short:'Краткое название',slogan:'Лозунг',motto:'Девиз',ideology:'Идеология',server:'Сервер',logo:'Эмблема',banner:'Баннер',seal:'Печать',footer:'Подвал',dcRegTerms:'Условия регистрации через Discord',dcLoginTerms:'Условия входа через Discord',heroTitle:'Заголовок',heroText:'Текст',stats:'Показатели',value:'Значение',label:'Подпись',trio:'Тройка на главной',trioLeft:'Подпись слева',trioRight:'Подпись справа',trioBottom:'Нижняя цитата',photo:'Фото',memberId:'Идентификатор места',title:'Заголовок',text:'Текст',goals:'Цели',membership:'О членстве',date:'Дата',sections:'Разделы',items:'Пункты',chapters:'Главы',articles:'Статьи',note:'Примечание',outro:'Заключение',intro:'Вступление',docs:'Документы',url:'Ссылка',links:'Ссылки',role:'Должность',group:'Партийный орган',bio:'Биография',quote:'Цитата',joined:'Дата вступления',birth:'Возраст / дата рождения',city:'Город',achievements:'Достижения',discord:'Discord',forum:'Форум',contact:'Контакт',rank:'Уровень',order:'Порядок',discordId:'Discord ID',tier:'Ступень',reportsTo:'Подчиняется',duties:'Обязанности',image:'Изображение',photos:'Фотографии',videos:'Видео',pinned:'Закрепить',align:'Выравнивание',place:'Место',desc:'Описание',at:'Дата и время',status:'Статус',options:'Варианты',deadline:'Окончание',closed:'Закрыто',type:'Тип',when:'Когда',kind:'Вид',mime:'Формат',did:'Discord ID',answers:'Анкета',fio:'ФИО',passport:'Паспорт',source:'Источник',reason:'Почему наша партия',partyRank:'Звание (число)',partyRole:'Звание',rejectReason:'Причина отказа',displayName:'Имя',fio:'ФИО'};
const f=(key,type,label,o={})=>({key,type,label,...o});
const obj=fields=>({type:'object',fields});
const today=()=>new Date().toISOString().slice(0,10);
const evening=()=>{const d=new Date();d.setDate(d.getDate()+1);return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),18,0)-3*3600e3;};
const opt=(arr)=>arr.map(x=>typeof x==='string'?{v:x,l:x}:x);
const BASE={
 site:obj([
  f('name','text','Полное название',{req:1,max:300}),
  f('short','text','Краткое название',{max:80}),
  f('slogan','textarea','Лозунг'),
  f('motto','text','Девиз'),
  f('ideology','text','Идеология'),
  f('server','text','Сервер'),
  f('logo','image','Эмблема',{upload:1}),
  f('banner','image','Баннер',{upload:1}),
  f('seal','image','Печать',{upload:1}),
  f('footer','textarea','Текст подвала'),
  f('dcRegTerms','textarea','Условия регистрации через Discord (по пункту на строку; пусто — текст по умолчанию)'),
  f('dcLoginTerms','textarea','Условия входа через Discord (по пункту на строку; пусто — текст по умолчанию)')
 ]),
 home:obj([
  f('heroTitle','text','Заголовок главной'),
  f('heroText','textarea','Текст на главной',{req:1}),
  f('stats','list','Показатели',{kind:'homeStat',item:obj([f('value','text','Значение',{req:1,max:40}),f('label','text','Подпись',{req:1,max:80})])}),
  f('trio','list','Карточки тройки',{kind:'homeTrio',item:obj([f('name','text','Имя',{req:1}),f('role','text','Должность'),f('photo','image','Фото',{upload:1}),f('memberId','text','Идентификатор места',{hint:'На сайте в блоке руководства показываются места m1, m4 и m5 из состава.'})])}),
  f('trioLeft','text','Подпись слева'),
  f('trioRight','text','Подпись справа'),
  f('trioBottom','textarea','Нижняя цитата')
 ]),
 about:obj([
  f('title','text','Заголовок',{req:1}),
  f('text','textarea','Текст',{req:1}),
  f('goals','strings','Цели',{itemLabel:'Цель'}),
  f('membership','textarea','О членстве')
 ]),
 program:obj([
  f('title','text','Заголовок',{req:1}),
  f('date','text','Дата и место'),
  f('sections','list','Разделы',{kind:'programSection',item:obj([f('title','text','Название раздела',{req:1}),f('items','strings','Пункты',{itemLabel:'Пункт'})])})
 ]),
 charter:obj([
  f('title','text','Заголовок',{req:1}),
  f('date','text','Дата и место'),
  f('note','textarea','Примечание'),
  f('chapters','list','Главы',{kind:'charterChapter',item:obj([
   f('title','text','Название главы',{req:1}),
   f('articles','list','Статьи',{kind:'charterArticle',item:obj([f('title','text','Название статьи',{req:1}),f('text','textarea','Текст статьи',{req:1})])})
  ])}),
  f('outro','textarea','Заключение')
 ]),
 legal:obj([
  f('intro','textarea','Вступление',{req:1}),
  f('docs','list','Документы',{kind:'legalDoc',item:obj([f('title','text','Название',{req:1}),f('url','text','Ссылка на источник'),f('text','textarea','Текст',{req:1})])}),
  f('links','list','Ссылки',{kind:'legalLink',item:obj([f('title','text','Название',{req:1}),f('url','text','Ссылка',{req:1})])})
 ]),
 contacts:obj([
  f('text','textarea','Текст',{req:1}),
  f('items','list','Контакты',{kind:'contact',item:obj([f('label','text','Подпись',{req:1}),f('value','text','Значение',{req:1}),f('url','text','Ссылка')])})
 ]),
 leadership:obj([
  f('intro','textarea','Вступление на странице «Руководство»',{req:1,hint:'Места и люди правятся во вкладке «Состав». Здесь только вступительный абзац.'})
 ]),
 news:obj([
  f('title','text','Заголовок',{req:1,max:200}),
  f('date','date','Дата',{req:1}),
  f('text','textarea','Текст',{req:1,max:20000,hint:'Абзацы — пустой строкой. [фото:1] на отдельной строке вставит первое фото. **жирный**.'}),
  f('image','image','Главное фото',{upload:1,max:900000}),
  f('photos','images','Фотографии',{maxItems:4,upload:1}),
  f('videos','strings','Видео',{itemLabel:'Ссылка',hint:'YouTube, VK, Rutube или прямой https .mp4/.webm'}),
  f('pinned','bool','Закрепить'),
  f('align','select','Выравнивание',{options:[{v:'',l:'Как обычно'},{v:'center',l:'По центру'}]})
 ]),
 event:obj([
  f('title','text','Название',{req:1,max:200}),
  f('at','datetime','Дата и время (UTC+3)',{req:1}),
  f('place','text','Место',{max:200}),
  f('desc','textarea','Описание',{max:4000}),
  f('image','image','Изображение',{max:2000,hint:'Прямая ссылка http(s), до 2000 символов. Файл сюда не вшивается — для мероприятия нужна ссылка.'}),
  f('status','select','Статус',{options:[{v:'',l:'Идёт'},{v:'ended',l:'Завершено'}]})
 ]),
 seat:obj([
  f('name','text','ФИО',{req:1,max:100}),
  f('role','text','Должность',{max:120}),
  f('group','select','Партийный орган',{options:opt(GROUPS)}),
  f('tier','select','Ступень',{num:1,options:TIERS}),
  f('rank','number','Уровень (ранг)',{min:0,step:1}),
  f('order','number','Порядок',{step:'any',hint:'Число, можно дробное (например 4.1). Пусто — без порядка.'}),
  f('photo','image','Фото',{upload:1,max:900000}),
  f('bio','textarea','Биография',{max:5000}),
  f('quote','textarea','Цитата',{max:500}),
  f('joined','text','Дата вступления',{max:60}),
  f('birth','text','Возраст / дата рождения',{max:60}),
  f('city','text','Город / район',{max:100}),
  f('achievements','textarea','Достижения и должности',{max:5000}),
  f('discord','text','Discord (ссылка)',{max:200}),
  f('discordId','text','Discord ID',{max:32,hint:'15–21 цифра, либо пусто для вакансии.'}),
  f('forum','text','Форум',{max:300}),
  f('contact','text','Контакт',{max:200}),
  f('reportsTo','text','Подчиняется',{max:120}),
  f('duties','strings','Обязанности',{itemLabel:'Обязанность',maxItems:12})
 ]),
 banner:obj([
  f('url','text','Ссылка на видео',{max:600,hint:'https на .mp4 или .webm. Файл баннера по частям загружается в кабинете владельца профиля.'}),
  f('kind','select','Вид',{options:[{v:'video',l:'Видео'},{v:'image',l:'Изображение'}]}),
  f('did','text','Discord ID',{max:32}),
  f('mime','text','Формат MIME',{max:80}),
  f('n','number','Число частей файла',{ro:1}),
  f('size','number','Размер, байт',{ro:1}),
  f('ver','text','Версия файла',{ro:1})
 ]),
 vote:obj([
  f('title','text','Вопрос',{req:1,max:200}),
  f('type','select','Тип',{options:[{v:'decision',l:'Решение'},{v:'candidates',l:'Кандидаты'},{v:'amendment',l:'Поправка к уставу'}]}),
  f('desc','textarea','Описание',{max:4000}),
  f('options','strings','Варианты',{itemLabel:'Вариант',req:1,hint:'От 2 до 10. Счётчики голосов не сбрасываются: правятся в экспертном режиме.'}),
  f('deadline','datetime','Окончание (UTC+3)',{req:1}),
  f('closed','bool','Закрыто')
 ]),
 application:obj([
  f('status','select','Статус',{options:opt(['new','accepted','rejected','member','expelled']).map(x=>({v:x.v,l:{new:'Новая',accepted:'Принята',rejected:'Отклонена',member:'В составе',expelled:'Уволен'}[x.v]}))}),
  f('answers','object','Анкета',{fields:[
   f('fio','text','ФИО',{max:2000}),f('passport','text','Паспорт',{max:2000}),f('discord','text','Discord',{max:2000}),
   f('source','textarea','Откуда узнали',{max:2000}),f('reason','textarea','Почему наша партия',{max:2000}),f('bio','textarea','Биография',{max:4000})
  ]}),
  f('discordId','text','Discord ID',{max:64}),
  f('source','text','Откуда подана',{max:40}),
  f('partyRank','number','Звание (0–5)',{min:0,step:1}),
  f('partyRole','text','Название звания',{max:80}),
  f('rejectReason','textarea','Причина отказа',{max:500})
 ]),
 note:obj([
  f('type','select','Тип',{options:[{v:'news',l:'Новость'},{v:'convocation',l:'Созыв'},{v:'other',l:'Объявление'},{v:'appoint',l:'Назначение'},{v:'recall',l:'Снятие'}]}),
  f('title','text','Заголовок',{req:1,max:200}),
  f('text','textarea','Текст',{max:2000}),
  f('when','text','Когда',{max:100}),
  f('to','text','Кому (Discord ID)',{max:32}),
  f('seat','text','Место',{max:40})
 ]),
 user:obj([
  f('displayName','text','Имя на сайте',{max:40}),
  f('fio','text','ФИО',{max:100}),
  f('discordId','text','Discord ID',{max:64}),
  f('discordLink','text','Ссылка Discord',{max:200}),
  f('birth','text','Дата рождения',{hint:'ДД.ММ.ГГГГ'}),
  f('passport','text','Паспорт',{hint:'000-000'}),
  f('photo','image','Фото',{upload:1}),
  f('avatar','image','Аватар',{upload:1}),
  f('rank','number','Ранг ключа',{ro:1}),
  f('roleName','text','Должность ключа',{ro:1})
 ]),
 chat:obj([])
};
const BUILT={
 news:[
  {id:'news-empty',title:'Пустая новость',data:()=>({title:'Новая новость',text:'Текст новости.',date:today(),image:'',pinned:false})},
  {id:'news-ann',title:'Анонс',data:()=>({title:'Анонс',text:'Когда:\nГде:\n\nКратко, о чём встреча.',date:today(),image:'img/banner.jpg'})}
 ],
 event:[
  {id:'ev-meet',title:'Встреча',data:()=>({title:'Встреча с избирателями',at:evening(),place:'Москва',desc:'Описание мероприятия.',image:'',status:''})}
 ],
 seat:[
  {id:'seat-vac',title:'Вакансия руководства',data:()=>({name:'Вакансия',role:'Член ЦК',group:'Центральный Комитет',bio:'Должность вакантна.',photo:'',rank:80,tier:4,order:10,discordId:''})},
  {id:'seat-party',title:'Карточка члена партии',party:1,data:()=>({name:'',role:'Член партии',group:'Члены партии',bio:'',photo:'',rank:10,tier:0,order:50,discordId:''})}
 ],
 charterArticle:[{id:'art',title:'Статья устава',data:()=>({title:'Статья. Название',text:'1.1. Текст пункта.'})}],
 charterChapter:[{id:'ch',title:'Глава',data:()=>({title:'ГЛАВА. НАЗВАНИЕ',articles:[{title:'Статья. Название',text:'1.1. Текст пункта.'}]})}],
 programSection:[{id:'ps',title:'Раздел программы',data:()=>({title:'НОВЫЙ РАЗДЕЛ',items:['Пункт программы.']})}],
 legalDoc:[{id:'ld',title:'Правовой документ',data:()=>({title:'Название документа',url:'https://forum.rmrp.ru/',text:'Текст выдержки.'})}],
 legalLink:[{id:'ll',title:'Ссылка',data:()=>({title:'Источник',url:'https://'})}],
 contact:[{id:'ct',title:'Контакт',data:()=>({label:'Связь',value:'',url:'https://'})}],
 homeStat:[{id:'st',title:'Показатель',data:()=>({value:'0',label:'подпись'})}],
 homeTrio:[{id:'tr',title:'Карточка тройки',data:()=>({name:'Вакансия',role:'Должность',photo:'',memberId:''})}],
 vote:[{id:'vt',title:'Голосование',data:()=>({title:'Вопрос на голосование',type:'decision',desc:'',options:['За','Против','Воздержался'],deadline:Date.now()+7*86400000,closed:false,counts:{0:0,1:0,2:0},total:0})}],
 banner:[{id:'bn',title:'Баннер по ссылке',data:()=>({url:'',kind:'video',did:''})}]
};
export function listTemplates(kind,customs){
 const b=(BUILT[kind]||[]).map(t=>({id:t.id,title:t.title,custom:false,party:!!t.party}));
 const c=Object.entries(customs||{}).filter(([,v])=>v&&v.kind===kind).map(([id,v])=>({id,title:'Мой: '+(v.title||'без названия'),custom:true}));
 return b.concat(c);
}
export function templateData(kind,id,customs){
 const b=(BUILT[kind]||[]).find(t=>t.id===id);
 if(b)return clone(typeof b.data==='function'?b.data():b.data);
 const c=customs&&customs[id];
 return c&&c.data?clone(c.data):null;
}
export function templateMeta(kind,id){return (BUILT[kind]||[]).find(t=>t.id===id)||null}
export function newPartyId(){const a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';let s='p_';for(let i=0;i<20;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
export function nextSeatId(ids){const s=new Set(ids||[]);let n=12;while(s.has('m'+n))n++;return 'm'+n}
function coverFields(fields,data,kind){
 const o=data&&typeof data==='object'&&!Array.isArray(data)?data:{};
 const hidden=new Set((HIDDEN[kind]||[]));
 const known=new Set(fields.map(x=>x.key));
 const out=fields.map(field=>refine(field,o[field.key],kind));
 for(const k of Object.keys(o)){if(known.has(k)||hidden.has(k)||k.startsWith('_'))continue;out.push(inferField(k,o[k],kind))}
 return out;
}
function refine(field,val,kind){
 if(field.type==='object')return {...field,fields:coverFields(field.fields||[],val,kind)};
 if(field.type==='list'&&field.item&&field.item.type==='object'){
  let fields=field.item.fields||[];
  for(const it of (Array.isArray(val)?val:[]))fields=coverFields(fields,it,kind);
  return {...field,item:{...field.item,fields}};
 }
 return field;
}
function inferField(key,val,kind){
 const label=LABELS[key]||key;
 if(val&&typeof val==='object'&&!Array.isArray(val)&&typeof val._time==='string'&&Object.keys(val).length===1)return f(key,'time',label);
 if(typeof val==='boolean'||key==='pinned'||key==='closed'||key==='cancelled')return f(key,'bool',label);
 if(typeof val==='number')return f(key,'number',label,{step:Number.isInteger(val)?1:'any'});
 if(Array.isArray(val)){
  if(!val.length||val.every(x=>typeof x==='string'||x==null)){
   if(/photo|image/i.test(key))return f(key,'images',label,{upload:1});
   return f(key,'strings',label,{itemLabel:label});
  }
  if(val.every(x=>x&&typeof x==='object'&&!Array.isArray(x))){
   let fields=[];for(const it of val)fields=coverFields(fields,it,kind);
   return f(key,'list',label,{kind:'generic',item:{type:'object',fields}});
  }
  return f(key,'json',label,{hint:'Сложная структура — правьте осторожно.'});
 }
 if(val&&typeof val==='object')return f(key,'object',label,{fields:coverFields([],val,kind)});
 const s=String(val??'');
 if(/photo|image|logo|banner|seal|avatar/i.test(key)||/^data:image\//.test(s)||/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(s))return f(key,'image',label,{upload:1});
 if(/^\d{4}-\d{2}-\d{2}$/.test(s)&&(key==='date'||/date/i.test(key)))return f(key,'date',label);
 if(s.length>140||s.includes('\n'))return f(key,'textarea',label);
 return f(key,'text',label);
}
export function schemaFor(kind,data){
 const base=BASE[kind]||obj([]);
 return {type:'object',fields:coverFields(base.fields,data,kind)};
}
export function fieldAt(kind,data,path){
 let node=schemaFor(kind,data);
 for(const k of path){
  if(!node)return null;
  if(node.type==='object')node=(node.fields||[]).find(x=>x.key===k)||null;
  else if(node.type==='list'||node.type==='strings'||node.type==='images')node=typeof k==='number'?(node.item||{type:'text',label:''}):null;
  else return null;
 }
 return node;
}
function emptyObj(schema){
 const o={};
 for(const field of schema.fields||[]){
  if(field.ro)continue;
  if(field.type==='object')o[field.key]=emptyObj(field);
  else if(field.type==='list'||field.type==='strings'||field.type==='images')o[field.key]=[];
  else if(field.type==='bool')o[field.key]=false;
  else if(field.type==='number'||field.type==='select'&&field.num)o[field.key]=field.key==='order'?'':0;
  else o[field.key]='';
 }
 return o;
}
export function newItem(field){
 if(!field)return '';
 if(field.type==='strings'||field.type==='images')return '';
 if(field.type==='list'){
  if(field.kind&&BUILT[field.kind])return templateData(field.kind,BUILT[field.kind][0].id,{});
  if(field.item&&field.item.type==='object')return emptyObj(field.item);
  return '';
 }
 return '';
}
export function blank(kind){
 if(BUILT[kind]&&BUILT[kind][0])return templateData(kind,BUILT[kind][0].id,{});
 return emptyObj(schemaFor(kind,{}));
}
function num(v){if(v===''||v==null)return undefined;const n=typeof v==='number'?v:Number(String(v).trim().replace(',','.'));return n}
export function normalize(kind,data){
 const d=clone(data||{});
 if(kind==='leadership')return {intro:String(d.intro||'')};
 if(kind==='seat'){
  d.name=String(d.name||'').trim().replace(/\s+/g,' ');
  if(d.order===''||d.order==null)delete d.order;else d.order=num(d.order);
  d.tier=d.tier===''||d.tier==null?0:Math.trunc(num(d.tier));
  d.rank=d.rank===''||d.rank==null?0:Math.trunc(num(d.rank));
  if(Array.isArray(d.duties)){const xs=d.duties.map(x=>String(x).trim()).filter(Boolean).slice(0,12);if(xs.length)d.duties=xs;else delete d.duties}
  for(const k of ['role','group','photo','bio','quote','joined','birth','city','achievements','discord','discordId','forum','contact','reportsTo'])if(d[k]!=null)d[k]=String(d[k]);
  if(!d.photo)delete d.photo;
  if(!d.discordId)d.discordId='';
  return d;
 }
 if(kind==='news'){
  d.title=String(d.title||'').trim();d.text=String(d.text||'');d.date=String(d.date||'').trim();
  if(d.image!=null)d.image=String(d.image);if(!d.image)delete d.image;
  if(Array.isArray(d.photos)){d.photos=d.photos.map(x=>String(x||'').trim()).filter(Boolean).slice(0,4);if(!d.photos.length)delete d.photos}
  if(Array.isArray(d.videos)){d.videos=d.videos.map(x=>String(x||'').trim()).filter(Boolean).slice(0,5);if(!d.videos.length)delete d.videos}
  d.pinned=!!d.pinned;if(!d.pinned)delete d.pinned;
  if(d.align==='center')d.align='center';else delete d.align;
  return d;
 }
 if(kind==='event'){
  d.title=String(d.title||'').trim();d.at=num(d.at);
  for(const k of ['place','desc','image']){if(d[k]!=null)d[k]=String(d[k]).trim();if(!d[k])delete d[k]}
  if(d.status==='ended')d.status='ended';
  else {delete d.status;delete d.endedAt;delete d.endedBy}
  return d;
 }
 if(kind==='vote'){
  d.title=String(d.title||'').trim();d.type=d.type||'decision';
  if(d.desc!=null){d.desc=String(d.desc).trim();if(!d.desc)delete d.desc}
  d.options=Array.isArray(d.options)?d.options.map(x=>String(x).trim()).filter(Boolean).slice(0,10):[];
  d.deadline=num(d.deadline);d.closed=!!d.closed;
  const prev=d.counts&&typeof d.counts==='object'?d.counts:{};
  d.counts=Object.fromEntries(d.options.map((_,i)=>[String(i),Number(prev[String(i)]??prev[i]??0)||0]));
  if(typeof d.total!=='number'||!Number.isFinite(d.total))d.total=0;
  return d;
 }
 if(kind==='banner'){
  if(d.url!=null){d.url=String(d.url).trim();if(!d.url)delete d.url}
  if(d.kind!=='image')d.kind='video';
  return d;
 }
 return d;
}
function push(errs,path,msg){errs.push({path,msg})}
function walk(field,val,path,errs){
 if(!field)return;
 if(field.type==='object'){const o=val&&typeof val==='object'&&!Array.isArray(val)?val:{};for(const sub of field.fields||[])walk(sub,o[sub.key],path.concat(sub.key),errs);return}
 if(field.req&&(val==null||val===''||(Array.isArray(val)&&val.filter(x=>x!=null&&String(x).trim()!=='').length===0)))
  push(errs,path,'Заполните поле «'+field.label+'».');
 if((field.type==='text'||field.type==='textarea'||field.type==='image')&&val!=null&&field.max&&String(val).length>field.max)
  push(errs,path,'«'+field.label+'» — не длиннее '+field.max+' символов.');
 if(field.type==='number'&&val!=null&&val!==''&&(typeof val!=='number'||!Number.isFinite(val)))
  push(errs,path,'«'+field.label+'» должно быть числом.');
 if(field.type==='date'&&val&&!/^\d{4}-\d{2}-\d{2}$/.test(String(val)))
  push(errs,path,'Дата в формате ГГГГ-ММ-ДД.');
 if(field.type==='datetime'&&field.req&&(typeof val!=='number'||!Number.isFinite(val)))
  push(errs,path,'Укажите дату и время.');
 if(field.type==='list'&&Array.isArray(val))val.forEach((item,i)=>walk(field.item,item,path.concat(i),errs));
 if((field.type==='strings'||field.type==='images')&&Array.isArray(val)){
  if(field.maxItems&&val.length>field.maxItems)push(errs,path,'Не больше '+field.maxItems+'.');
  val.forEach((item,i)=>{if(field.max&&String(item||'').length>field.max)push(errs,path.concat(i),'Слишком длинное значение.')});
 }
 if(field.type==='select'&&val!=null&&val!==''&&field.options&&!field.options.some(o=>String(o.v)===String(val)))
  push(errs,path,'Неизвестное значение «'+field.label+'».');
}
export function validate(kind,data,ctx={}){
 const d=data||{},errs=[];
 walk(schemaFor(kind,d),d,[],errs);
 if(kind==='seat'){
  if(!String(d.name||'').trim())push(errs,['name'],'Укажите ФИО. Для вакансии — «Вакансия».');
  else if(String(d.name).length>100)push(errs,['name'],'ФИО не длиннее 100 символов.');
  if('order' in d&&(typeof d.order!=='number'||!Number.isFinite(d.order)))push(errs,['order'],'Порядок должен быть числом.');
  if(!Number.isInteger(d.tier)||d.tier<0||d.tier>9)push(errs,['tier'],'Ступень — целое число от 0 до 9.');
  if(!Number.isInteger(d.rank)||d.rank<0)push(errs,['rank'],'Уровень — целое число от 0.');
  if(d.discordId&&!/^\d{15,21}$/.test(String(d.discordId)))push(errs,['discordId'],'Discord ID — от 15 до 21 цифры, либо пусто.');
  const id=String(ctx.id||'');
  const party=d.group==='Члены партии'||id.startsWith('p_');
  if(party){
   if(!/^p_[A-Za-z0-9_-]{8,128}$/.test(id))push(errs,['name'],'Карточка члена партии: идентификатор p_ и ещё от 8 латинских символов.');
   if(d.group!=='Члены партии')push(errs,['group'],'Группа карточки должна быть «Члены партии».');
   if(/[\\/]/.test(d.name||'')||d.name==='.'||d.name==='..')push(errs,['name'],'В ФИО не должно быть «/».');
  }
  if(isProtected(id)&&(d.group==='Члены партии'||id.startsWith('p_')))push(errs,['group'],'Место '+id+' нельзя превратить в карточку члена партии.');
 }
 if(kind==='news'){
  if(d.date&&!/^\d{4}-\d{2}-\d{2}$/.test(d.date))push(errs,['date'],'Дата новости: ГГГГ-ММ-ДД.');
  if(Array.isArray(d.photos)&&d.photos.length>4)push(errs,['photos'],'Не больше 4 фото.');
  if(Array.isArray(d.videos)&&d.videos.length>5)push(errs,['videos'],'Не больше 5 видео.');
 }
 if(kind==='event'){
  if(d.image&&!/^https?:\/\//.test(d.image))push(errs,['image'],'Ссылка на изображение должна начинаться с http.');
  if(d.image&&d.image.length>2000)push(errs,['image'],'Ссылка длиннее 2000 символов.');
 }
 if(kind==='vote'){
  if(!['decision','candidates','amendment'].includes(d.type))push(errs,['type'],'Выберите тип голосования.');
  if(!Array.isArray(d.options)||d.options.length<2||d.options.length>10)push(errs,['options'],'Нужно от 2 до 10 вариантов.');
 }
 if(kind==='banner'&&d.url&&!/^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i.test(d.url))push(errs,['url'],'Нужна прямая ссылка https на .mp4 или .webm.');
 if(kind==='contacts'&&Array.isArray(d.items))d.items.forEach((it,i)=>{if(it&&it.url&&!/^https?:\/\//.test(it.url))push(errs,['items',i,'url'],'Ссылка должна начинаться с http.')});
 return errs;
}
export function needsTechConfirm(data,id){return id==='m11'&&data&&data.role&&data.role!=='Начальник технического отдела'}
export function errMap(errs){const m={};for(const e of errs)m[JSON.stringify(e.path)]=e.msg;return m}
function pad(n){return String(n).padStart(2,'0')}
function toLocal(ms){if(typeof ms!=='number'||!Number.isFinite(ms))return '';const d=new Date(ms+3*3600e3);return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate())+'T'+pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())}
function fmt3(ms){if(typeof ms!=='number'||!Number.isFinite(ms))return '';const d=new Date(ms+3*3600e3);return pad(d.getUTCDate())+'.'+pad(d.getUTCMonth()+1)+'.'+d.getUTCFullYear()+' '+pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())}
export function fromLocal(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);return m?Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5])-3*3600e3:NaN}
function summ(item,i){if(typeof item==='string')return item.trim().slice(0,80)||('Пункт '+(i+1));if(item&&typeof item==='object')return String(item.title||item.name||item.label||item.role||item.value||('Элемент '+(i+1))).slice(0,80);return 'Элемент '+(i+1)}
function acts(path,kind){
 const p=esc(JSON.stringify(path));
 return `<div class="af-acts"><button type="button" class="btn sm o" data-afact="up" data-path="${p}">↑</button><button type="button" class="btn sm o" data-afact="down" data-path="${p}">↓</button><button type="button" class="btn sm o" data-afact="dup" data-path="${p}">Дублировать</button>${kind?`<button type="button" class="btn sm o" data-afact="savetpl" data-path="${p}" data-kind="${esc(kind)}">Сохранить как шаблон</button>`:''}<button type="button" class="btn sm danger" data-afact="del" data-path="${p}">🗑 Удалить</button></div>`;
}
function addBar(path,kind,customs){
 const p=esc(JSON.stringify(path)),tpls=kind?listTemplates(kind,customs):[];
 return `<div class="af-acts"><button type="button" class="btn sm" data-afact="add" data-path="${p}">➕ Добавить</button>${tpls.length?`<select data-tplsel="${p}">${tpls.map(t=>`<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('')}</select><button type="button" class="btn sm o" data-afact="fromtpl" data-path="${p}" data-kind="${esc(kind)}">Создать по шаблону</button>${tpls.some(t=>t.custom)?`<button type="button" class="btn sm o" data-afact="deltpl" data-path="${p}" data-kind="${esc(kind)}">Удалить шаблон</button>`:''}`:''}</div>`;
}
function fieldHTML(field,val,path,opt){
 const id=esc(JSON.stringify(path)),err=opt.errors[JSON.stringify(path)];
 const lab=`<div class="af-l">${esc(field.label)}${field.req?' <span class="af-req">*</span>':''}</div>${field.hint?`<small class="amut">${esc(field.hint)}</small>`:''}`;
 let inner='';
 if(field.ro||field.type==='ro')inner=`<input type="text" readonly class="af-ro" value="${esc(val&&typeof val==='object'?JSON.stringify(val):(val??''))}">`;
 else if(field.type==='textarea')inner=`<textarea data-af="${id}" data-aft="textarea" rows="6"${field.max?` maxlength="${field.max}"`:''}>${esc(val??'')}</textarea><div class="af-lb-h">Переносы строк</div><div class="af-lb">${esc(val??'')}</div>`;
 else if(field.type==='bool')inner=`<label class="af-sw"><input type="checkbox" data-af="${id}" data-aft="bool"${val?' checked':''}><span>${esc(field.label)}</span></label>`;
 else if(field.type==='select'){
  const opts=(field.options||[]).slice();
  if((val==null||val==='')&&!opts.some(o=>String(o.v)===''))opts.unshift({v:'',l:'— не задано —'});
  if(val!=null&&val!==''&&!opts.some(o=>String(o.v)===String(val)))opts.push({v:val,l:String(val)});
  inner=`<select data-af="${id}" data-aft="select"${field.num?' data-num="1"':''}>${opts.map(o=>`<option value="${esc(o.v)}"${String(val??'')===String(o.v)?' selected':''}>${esc(o.l)}</option>`).join('')}</select>`;
 }
 else if(field.type==='number')inner=`<input data-af="${id}" data-aft="number" type="number"${field.step!=null?` step="${esc(field.step)}"`:' step="any"'}${field.min!=null?` min="${field.min}"`:''} value="${esc(val??'')}">`;
 else if(field.type==='date')inner=`<input data-af="${id}" data-aft="date" type="date" value="${esc(val??'')}">`;
 else if(field.type==='datetime')inner=`<input data-af="${id}" data-aft="datetime" type="datetime-local" value="${esc(toLocal(val))}">`;
 else if(field.type==='time'){const iso=val&&val._time||'';inner=`<input data-af="${id}" data-aft="time" type="datetime-local" value="${esc(iso?toLocal(new Date(iso).getTime()):'')}">`}
 else if(field.type==='image'||field.type==='media'){
  const src=String(val||''),show=!src.startsWith('data:')?src:'';
  inner=`<div class="af-img"><input data-af="${id}" data-aft="image" type="text" placeholder="${src.startsWith('data:')?'Файл уже загружен — вставьте ссылку, чтобы заменить': 'https://… или img/…'}" value="${esc(show)}">${field.upload?`<label class="btn sm o af-file">Загрузить<input type="file" accept="image/*" data-affile="${id}" hidden></label>`:''}${src?`<img class="af-prev" src="${esc(src)}" alt="">`:''}</div>`;
 }
 else if(field.type==='strings'||field.type==='images'){
  const arr=Array.isArray(val)?val:[];
  inner=`<div class="af-list">${arr.map((item,i)=>{const ip=path.concat(i);const head=field.type==='images'?(field.itemLabel||'Фото')+' '+(i+1):summ(item,i);return `<div class="af-item"><div class="af-ih"><b>${esc(head)}</b></div>${field.type==='images'?fieldHTML({type:'image',label:field.itemLabel||'Фото',upload:field.upload?1:0,hint:'',max:field.itemMax||900000},item,ip,opt):`<input data-af="${esc(JSON.stringify(ip))}" data-aft="text" type="text" value="${esc(item??'')}">`}${acts(ip,'')}</div>`}).join('')}${addBar(path,'',opt.customs)}</div>`;
 }
 else if(field.type==='list'){
  const arr=Array.isArray(val)?val:[];
  inner=`<div class="af-list">${arr.map((item,i)=>{const ip=path.concat(i);const body=field.item&&field.item.type==='object'?fieldsHTML(field.item.fields,item,ip,opt):fieldHTML({type:'text',label:'Значение'},item,ip,opt);return `<div class="af-item"><div class="af-ih"><b>${esc(summ(item,i))}</b>${acts(ip,field.kind&&field.kind!=='generic'?field.kind:'')}</div>${body}</div>`}).join('')}${addBar(path,field.kind&&field.kind!=='generic'?field.kind:'',opt.customs)}</div>`;
 }
 else if(field.type==='object')inner=`<div class="af-nest">${fieldsHTML(field.fields,val,path,opt)}</div>`;
 else if(field.type==='json')inner=`<textarea data-af="${id}" data-aft="json" rows="6" spellcheck="false">${esc(JSON.stringify(val??null,null,2))}</textarea>`;
 else inner=`<input data-af="${id}" data-aft="text" type="text"${field.max?` maxlength="${field.max}"`:''} value="${esc(val??'')}">`;
 if(field.type==='bool')return `<div class="af-field">${inner}${err?`<p class="af-err">${esc(err)}</p>`:''}</div>`;
 return `<div class="af-field">${lab}${inner}${err?`<p class="af-err">${esc(err)}</p>`:''}</div>`;
}
function fieldsHTML(fields,data,path,opt){
 const o=data&&typeof data==='object'?data:{};
 return (fields||[]).map(field=>fieldHTML(field,o[field.key],path.concat(field.key),opt)).join('');
}
export function renderForm(kind,data,opt={}){
 const schema=schemaFor(kind,data||{});
 return `<div class="af">${fieldsHTML(schema.fields,data||{},[],{errors:opt.errors||{},customs:opt.customs||{}})}</div>`;
}
const br=s=>esc(s).replace(/\n/g,'<br>');
export function preview(kind,data,site){
 const d=data||{},S=site||{};
 if(kind==='site')return `<div class="blk intro"><img src="${esc(d.logo||'img/emblem.png')}" alt=""><div><h1>${esc(d.slogan||d.name||'')}</h1><p>${esc(d.motto||'')}</p><p class="amut">${esc(d.ideology||'')} · ${esc(d.server||'')}</p></div></div><div class="blk"><h2>Подвал</h2><p>${esc(d.footer||'')}</p><p class="amut">${esc(d.short||'')} — ${esc(d.name||'')}</p></div>`;
 if(kind==='home')return `<div class="blk intro"><img src="${esc(S.logo||'img/emblem.png')}" alt=""><div><h1>${esc(d.trioBottom||d.heroTitle||S.slogan||'')}</h1><p>${esc(d.heroText||'')}</p></div></div>${Array.isArray(d.stats)&&d.stats.length?`<div class="blk"><h2>Показатели</h2><p>${d.stats.map(s=>`<b>${esc(s.value)}</b> ${esc(s.label)}`).join(' · ')}</p></div>`:''}${Array.isArray(d.trio)?`<div class="blk"><h2>Тройка</h2><div class="ldr">${d.trio.map(m=>`<a class="card"><div class="ph${m.photo?'':' noph'}">${m.photo?`<img src="${esc(m.photo)}" alt="">`:'<b>★</b>'}</div><h3>${esc(m.name)}</h3><div class="role">${esc(m.role)}</div></a>`).join('')}</div><p class="amut">${esc(d.trioLeft||'')} · ${esc(d.trioRight||'')}</p></div>`:''}`;
 if(kind==='about')return `<div class="pg"><h1>${esc(d.title||'О партии')}</h1><div class="blk"><p class="lead">${esc(d.text||'')}</p></div><div class="blk"><h2>Цели</h2><ol>${(d.goals||[]).map(g=>`<li>${esc(g)}</li>`).join('')}</ol></div><div class="blk"><p class="lead">${esc(d.membership||'')}</p></div></div>`;
 if(kind==='program')return `<div class="doc"><div class="hdr"><h1>${esc(d.title||'')}</h1><p>${esc(d.date||'')}</p></div>${(d.sections||[]).map(s=>`<h2>${esc(s.title||'')}</h2><ol>${(s.items||[]).map(i=>`<li>${esc(i)}</li>`).join('')}</ol>`).join('')}</div>`;
 if(kind==='charter')return `<div class="doc"><div class="hdr"><h1>${esc(d.title||'')}</h1><p>${esc(d.date||'')}</p><p>${esc(d.note||'')}</p></div>${(d.chapters||[]).map(ch=>`<h2>${esc(ch.title||'')}</h2>${(ch.articles||[]).map(a=>`<h3>${esc(a.title||'')}</h3><div class="t">${esc(a.text||'')}</div>`).join('')}`).join('')}${d.outro?`<div class="t">${esc(d.outro)}</div>`:''}</div>`;
 if(kind==='legal')return `<p class="lead">${esc(d.intro||'')}</p>${(d.docs||[]).map(doc=>`<details open><summary>${esc(doc.title||'')}</summary><div class="body"><p>${esc(doc.url||'')}</p><pre>${esc(doc.text||'')}</pre></div></details>`).join('')}<ul>${(d.links||[]).map(x=>`<li><a href="${esc(x.url||'#')}">${esc(x.title||'')}</a></li>`).join('')}</ul>`;
 if(kind==='contacts')return `<div class="blk"><p>${esc(d.text||'')}</p><table class="tbl">${(d.items||[]).map(i=>`<tr><td>${esc(i.label||'')}</td><td>${i.url?`<a href="${esc(i.url)}">${esc(i.value||i.url)}</a>`:esc(i.value||'')}</td></tr>`).join('')}</table></div>`;
 if(kind==='leadership')return `<div class="pg"><h1>Руководство и состав партии</h1><p>${esc(d.intro||'')}</p></div>`;
 if(kind==='news')return `<div class="blk"><div class="d">${esc(String(d.date||'').split('-').reverse().join('.'))}</div><h1>${esc(d.title||'')}</h1><p class="lead">${esc(d.text||'')}</p>${d.image?`<img src="${esc(d.image)}" alt="" style="max-width:100%">`:''}${(d.photos||[]).map(u=>`<img src="${esc(u)}" alt="" style="max-width:120px;margin:4px">`).join('')}</div>`;
 if(kind==='event')return `<div class="blk"><div class="ev-d">${esc(fmt3(d.at))} <small>UTC+3</small></div><h3>${esc(d.title||'')}${d.status==='ended'?' <span class="ev-end">Завершено</span>':''}</h3>${d.place?`<div class="ev-p">📍 ${esc(d.place)}</div>`:''}${d.desc?`<p>${br(d.desc)}</p>`:''}${d.image?`<img src="${esc(d.image)}" alt="" style="max-width:100%">`:''}</div>`;
 if(kind==='seat')return `<a class="card"><div class="ph${d.photo?'':' noph'}">${d.photo?`<img src="${esc(d.photo)}" alt="">`:`<b>${esc(String(d.name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join(''))}</b>`}</div><h3>${esc(d.name||'')}</h3><div class="role">${esc(d.role||'')}</div><p class="amut">${esc(d.group||'')} · ступень ${esc(d.tier??'')} · порядок ${esc(d.order??'—')}</p>${d.quote?`<p class="quote">${esc(d.quote)}</p>`:''}${d.bio?`<p>${esc(d.bio)}</p>`:''}</a>`;
 if(kind==='vote')return `<div class="blk"><h3>${esc(d.title||'')}</h3>${d.desc?`<p>${br(d.desc)}</p>`:''}<ol>${(d.options||[]).map(o=>`<li>${esc(o)}</li>`).join('')}</ol><p class="amut">${d.closed?'закрыто':'идёт до '+esc(fmt3(d.deadline))}</p></div>`;
 if(kind==='banner')return d.url?`<div class="blk">${/\.(png|jpe?g|gif|webp)(\?|$)/i.test(d.url)||d.kind==='image'?`<img src="${esc(d.url)}" alt="" style="max-width:100%">`:`<video src="${esc(d.url)}" controls style="max-width:100%"></video>`}</div>`:'<p class="amut">Ссылка не задана. Если баннер загружен файлом, части лежат в подколлекции и здесь не показываются.</p>';
 return '<p class="amut">Для этого раздела предпросмотр страницы не строится. Проверьте поля и сохраните.</p>';
}
export function rowLabel(x,id){return (x&&(x.title||x.name||x.role||(x.answers&&x.answers.fio)||x.displayName||x.fio||x.type))||id||'документ'}
export function hiddenNote(kind){const h=HIDDEN[kind];const tail=h&&h.length?'Служебные поля ('+h.join(', ')+') сохраняются как есть и видны в экспертном режиме.':'';if(kind==='chat')return 'Чат — вложенная структура. Поля подтянутся из документа; новый документ удобнее собрать в экспертном режиме.'+tail;return tail.trim()}
