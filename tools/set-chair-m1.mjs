import {login,fs_,fields} from './lib.mjs';
const {token,uid}=await login();
const d={name:'Хлопов Лев Давыдович',role:'Председатель ЦК',group:'Центральный Комитет',photo:'',bio:'',contact:'',joined:'',birth:'',city:'',achievements:'',discord:'https://discord.com/users/1183072840774320220',forum:'',quote:'',rank:100,order:0,discordId:'1183072840774320220',updatedBy:uid,updatedAt:new Date()};
const g=await fs_(token,'GET','members/m1');if(g.json.fields?.order)d.order=Number(g.json.fields.order.integerValue);else delete d.order;
const r=await fs_(token,'PATCH','members/m1',fields(d));console.log(r.status,JSON.stringify(r.json).slice(0,300));
