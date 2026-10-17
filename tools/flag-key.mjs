// node tools/flag-key.mjs --key <ключ> --flag <canViewMembers|canEditChairman> [--off]  — включить/выключить доп. право ключа
import {login,args,sha256,fs_,fields} from './lib.mjs';
const OK=['canViewMembers','canEditChairman'];const a=args();
if(!a.key||a.key===true||!OK.includes(a.flag)){console.error('Использование: --key <ключ> --flag <'+OK.join('|')+'> [--off]');process.exit(1);}
const {token}=await login();const h=sha256(String(a.key).trim());const on=!a.off;
const r=await fs_(token,'PATCH','accessKeys/'+h,fields({[a.flag]:on}),`?updateMask.fieldPaths=${a.flag}&currentDocument.exists=true`);
if(r.status!==200){console.error('Ошибка',r.status,JSON.stringify(r.json));process.exit(1);}
console.log(`${a.flag}=${on} для ключа ${h.slice(0,8)}…`);
