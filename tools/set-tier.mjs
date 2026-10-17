// Ступени ключей (tier = первая цифра ключа).
// node tools/set-tier.mjs --key <ключ> [--tier N]       — записать ступень в accessKeys (по умолчанию первая цифра ключа)
// node tools/set-tier.mjs --member <id> --tier N        — ступень записи руководства (members/<id>), напр. m1 → 5
import {login,args,sha256,fs_,fields} from './lib.mjs';
const a=args();const {token}=await login();
let path,tier;
if(a.key&&a.key!==true){const k=String(a.key).trim();tier=a.tier&&a.tier!==true?parseInt(a.tier,10):(/^[0-9]/.test(k)?Number(k[0]):0);path='accessKeys/'+sha256(k);}
else if(a.member&&a.member!==true){tier=parseInt(a.tier,10);path='members/'+a.member;}
else{console.error('Использование: --key <ключ> [--tier N] | --member <id> --tier N');process.exit(1);}
if(!(tier>=0&&tier<=9)){console.error('tier 0..9');process.exit(1);}
const r=await fs_(token,'PATCH',path,fields({tier}),'?updateMask.fieldPaths=tier&currentDocument.exists=true');
if(r.status!==200){console.error('Ошибка',r.status,JSON.stringify(r.json));process.exit(1);}
console.log(`tier=${tier} → ${path.split('/')[0]}/${path.split('/')[1].slice(0,10)}…`);
