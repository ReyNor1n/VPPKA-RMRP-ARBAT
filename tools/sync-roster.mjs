// Заполняет публичный список «Члены партии» (members/p_<appId>) из принятых заявок. Сайт делает то же сам у ступени 4+.
import {login,fs_,docData,fields} from './lib.mjs';
const PR=['Кандидат','Член партии','Активист','Старший член партии','Ветеран партии','Почётный член партии'];
const {token,uid}=await login();
const r=await fs_(token,'GET','applications',null,'?pageSize=300');
for(const d of r.json.documents||[]){const a=docData(d);if(!['accepted','member'].includes(a.status))continue;const id='p_'+d.name.split('/').pop();
 const ex=await fs_(token,'GET','members/'+id);const o=ex.status===200?docData(ex.json):{};
 const dt=new Date(a.reviewedAt||a.createdAt||Date.now());
 const m={...o,name:String(a.answers?.fio||'Товарищ').slice(0,100),role:a.partyRole||PR[a.partyRank||0]||'Кандидат',group:'Члены партии',rank:0,joined:o.joined||dt.toLocaleDateString('ru-RU',{timeZone:'Europe/Volgograd'}),updatedBy:uid,updatedAt:new Date()};
 if(a.discordId)m.discordId=a.discordId;
 const w=await fs_(token,'PATCH','members/'+id,fields(m));console.log(id,m.name,m.role,m.joined,w.status,w.status!==200?JSON.stringify(w.json).slice(0,200):'');}
