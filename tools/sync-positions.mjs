// Приводит должности (members) к Уставу. Не трогает занятые записи, кроме названия/группы/ранга/ступени.
import {login,fs_,fields,docData} from './lib.mjs';
const {token,uid}=await login();
const CC='Центральный Комитет',KRK='Контрольно-ревизионная комиссия',OT='Отделения';
const P=[['m1','Председатель ЦК',CC,100,5],['m4','Заместитель Председателя ЦК',CC,90,4],['m5','Заместитель Председателя ЦК',CC,90,4],
['m2','Член ЦК (выборный)',CC,80,4],['m6','Член ЦК (выборный)',CC,80,4],['m7','Руководитель местного отделения (Арбат)',OT,70,3],
['m3','Председатель КРК',KRK,60,3],['m8','Заместитель Председателя КРК',KRK,50,0],['m9','Член КРК',KRK,45,0],['m10','Член КРК',KRK,45,0]];
for(const [id,role,group,rank,tier] of P){const g=await fs_(token,'GET','members/'+id);const o=g.status===200?docData(g.json):{name:'Вакансия',bio:'Должность вакантна.'};
const d={...o,role,group,rank,tier,order:P.findIndex(x=>x[0]===id),updatedBy:uid,updatedAt:new Date()};
const r=await fs_(token,'PATCH','members/'+id,fields(d));console.log(id,r.status,r.status!==200?JSON.stringify(r.json).slice(0,200):'');}
