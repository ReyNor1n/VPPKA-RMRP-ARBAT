// node tools/relay-apps.mjs [--dry] — публикует новые заявки (status=new, без discordPostedAt) в Discord через config/discord.appsWebhook
// и ставит discordPostedAt. Запускать периодически (рутина). Вебхук не выводится.
import {login,fs_,docData,DOCS,args} from './lib.mjs';
const A=args(),{token}=await login();
const cfg=docData(await j(fs_(token,'GET','config/discord')))||{};
async function j(p){const r=await p;return r.json||r.body||r}
if(!cfg.appsWebhook){console.log('appsWebhook не настроен');process.exit(0)}
const roles=Array.isArray(cfg.roleIds)?cfg.roleIds:[];
const HID=['646280678736003073','t3t4KPD2bDasFw1gPLWAA0W8jCL2'];
let docs=[],pt='';do{const x=await j(fs_(token,'GET','applications',null,`?pageSize=300${pt?'&pageToken='+pt:''}`));docs.push(...(x.documents||[]));pt=x.nextPageToken||''}while(pt);
const todo=docs.map(d=>({id:d.name.split('/').pop(),...docData(d)})).filter(a=>a.status==='new'&&!a.discordPostedAt&&!HID.includes(a.discordId||'')&&!HID.includes(a.uid||''));
const v=(s,n=1024)=>String(s||'—').slice(0,n)||'—';
for(const a of todo){const x=a.answers||{};const did=a.discordId||(String(x.discord||'').match(/(\d{15,21})/)||[])[1];
 const body={username:'Заявки в партию',content:roles.length?roles.map(r=>`<@&${r}>`).join(' '):undefined,allowed_mentions:{roles},
  embeds:[{color:0x2ECC71,title:'Новая заявка на вступление',url:'https://vppka-arbat-rmrp.ru/#apps',fields:[
   {name:'Фамилия Имя Отчество:',value:v(x.fio)},{name:'Ваш номер паспорта:',value:v(x.passport)},
   {name:'Ваша @discord почта:',value:did?`https://discord.com/users/${did}`:v(x.discord)},
   {name:'Откуда узнали о нас?',value:v(x.source)},{name:'Почему решили вступить именно в нашу партию?',value:v(x.reason)},
   {name:'Ссылка на Вашу биографию:',value:v(x.bio)},{name:'Заявка на сайте',value:'https://vppka-arbat-rmrp.ru/#apps'}],
   timestamp:a.createdAt||new Date().toISOString()}]};
 if(A.dry){console.log('[dry]',a.id,x.fio);continue}
 const r=await fetch(cfg.appsWebhook+'?wait=true',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 if(!r.ok){console.log('Discord ошибка',r.status,a.id);continue}
 const name=DOCS.replace(/^https?:\/\/[^/]+\/v1\//,'')+'/applications/'+a.id;
 const c=await fetch(DOCS.replace(/\/documents$/,'/documents:commit'),{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify({writes:[{transform:{document:name,fieldTransforms:[{fieldPath:'discordPostedAt',setToServerValue:'REQUEST_TIME'}]}}]})});
 console.log('опубликовано',a.id,x.fio,'отметка:',c.status)}
console.log('новых к отправке:',todo.length);
