// Однократный перенос новостей и состава из content.json в Firestore (как keymaster).
// node tools/migrate.mjs [--ranks 100,80,60] [--default 10]  — уровни участников по порядку; существующие документы не перезаписываются.
import fs from 'node:fs'; import {login,args,fs_,fields} from './lib.mjs';
const a=args(),C=JSON.parse(fs.readFileSync(new URL('../content.json',import.meta.url))),R=String(a.ranks||'100,80,60').split(',').map(Number),DEF=parseInt(a.default??10,10);
const {token,uid}=await login();const K=['name','role','group','photo','bio','quote','joined','birth','city','achievements','discord','forum','contact'];
const site=p=>p&&!/^(https?:|data:)/.test(p)?'https://reynor1n.github.io/VPPKA-RMRP-ARBAT/'+p.replace(/^\.?\//,''):p;
for(const [i,m] of C.leadership.members.entries()){const d={rank:R[i]??DEF,order:i,updatedBy:uid};K.forEach(k=>{if(m[k])d[k]=String(k==='photo'?site(m[k]):m[k])});
 const id=m.id||'m'+(i+1);const r=await fs_(token,'PATCH','members/'+id,fields(d),'?currentDocument.exists=false');console.log('member',id,d.name,'ур.',d.rank,r.status===200?'OK':r.status===404||r.status===400||r.status===409?'уже есть':'ОШИБКА '+r.status+' '+JSON.stringify(r.json).slice(0,200));}
for(const [i,n] of C.news.entries()){const d={title:n.title,text:n.text,date:n.date,author:uid};if(n.image)d.image=site(n.image);
 const r=await fs_(token,'PATCH','news/n'+(i+1),fields(d),'?currentDocument.exists=false');console.log('news','n'+(i+1),n.title.slice(0,40),r.status===200?'OK':'уже есть/ошибка '+r.status);}
