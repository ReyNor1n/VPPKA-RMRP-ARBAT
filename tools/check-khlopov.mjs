// Проверка: зарегистрирован ли Хлопов (discordId 1183072840774320220, ключ 5505)
import {login,fs_,docData,sha256} from './lib.mjs';
const DID='1183072840774320220';
const {token}=await login();
const q={structuredQuery:{from:[{collectionId:'users'}],where:{fieldFilter:{field:{fieldPath:'discordId'},op:'EQUAL',value:{stringValue:DID}}}}};
const r=await fetch(`https://firestore.googleapis.com/v1/projects/vppca-rmrp/databases/(default)/documents:runQuery`,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify(q)});
const j=await r.json(); const docs=(Array.isArray(j)?j:[]).filter(x=>x.document);
const k=await fs_(token,'GET','accessKeys/'+sha256('5505'));
console.error('query status',r.status, Array.isArray(j)?'':JSON.stringify(j).slice(0,300));
console.error('key5505:',JSON.stringify(docData(k.json)));
for(const d of docs){const u=docData(d.document);delete u.photo;console.error('user',d.document.name.split('/').pop(),JSON.stringify(u));}
console.log(docs.length?'REGISTERED':'NOT_REGISTERED');
