// node tools/add-key.mjs --discord <ссылка|username> --rank 80 --role "Заместитель председателя" [--key <ключ>] [--label текст]
// Если --key не задан, генерируется случайный ключ и печатается ОДИН раз. В базе хранится только sha256.
import crypto from 'node:crypto'; import {login,args,did,sha256,fs_,fields,listKeys} from './lib.mjs';
const a=args(),id=did(a.discord),rank=parseInt(a.rank,10),role=String(a.role||'').trim();
if(!id||!(rank>=1&&rank<1000)||!role){console.error('Использование: --discord <ссылка|username> --rank 1..999 --role "Название" [--key ключ]');process.exit(1);}
const key=a.key&&a.key!==true?String(a.key).trim():crypto.randomBytes(12).toString('base64url');if(key.length<8){console.error('Ключ короче 8 символов');process.exit(1);}
const {token,uid}=await login();const h=sha256(key);
const other=(await listKeys(token)).filter(k=>k.discordId===id&&!k.revoked&&k.hash!==h);
if(other.length&&!a.force){console.error(`У ${id} уже есть действующий ключ (${other.map(k=>k.roleName+' ур.'+k.rank).join(', ')}). Аннулируйте его или добавьте --force.`);process.exit(1);}
const r=await fs_(token,'PATCH','accessKeys/'+h,fields({rank,roleName:role,discordId:id,label:String(a.label||'').slice(0,100),createdBy:uid,createdAt:new Date(),revoked:false}));
if(r.status!==200){console.error('Ошибка',r.status,JSON.stringify(r.json));process.exit(1);}
console.log(`Ключ добавлен: Discord ${id} → «${role}», уровень ${rank}.`);if(!a.key)console.log('КЛЮЧ (передайте лично, больше не показывается):',key);
