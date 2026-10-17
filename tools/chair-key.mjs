// node tools/chair-key.mjs --key <ключ> [--off]   — дать/снять право править председателя (canEditChairman)
import {login,args,sha256,fs_,fields} from './lib.mjs';
const a=args();if(!a.key||a.key===true){console.error('Использование: --key <ключ> [--off]');process.exit(1);}
const {token}=await login();const h=sha256(String(a.key).trim());const on=!a.off;
const r=await fs_(token,'PATCH','accessKeys/'+h,fields({canEditChairman:on}),'?updateMask.fieldPaths=canEditChairman&currentDocument.exists=true');
if(r.status!==200){console.error('Ошибка',r.status,JSON.stringify(r.json));process.exit(1);}
console.log(`canEditChairman=${on} для ключа ${h.slice(0,8)}…`);
