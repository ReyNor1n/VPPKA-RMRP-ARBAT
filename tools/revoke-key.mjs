// node tools/revoke-key.mjs --discord <ссылка|username>   — аннулирует (revoked:true) все ключи этого Discord; права пропадают сразу
import {login,args,did,fs_,fields,listKeys} from './lib.mjs';
const a=args(),id=did(a.discord);if(!id){console.error('Использование: --discord <ссылка|username>');process.exit(1);}
const {token}=await login();const ks=(await listKeys(token)).filter(k=>k.discordId===id);
if(!ks.length){console.error('Ключей для',id,'не найдено.');process.exit(1);}
for(const k of ks){const r=await fs_(token,'PATCH','accessKeys/'+k.hash,fields({revoked:true,revokedAt:new Date()}),'?updateMask.fieldPaths=revoked&updateMask.fieldPaths=revokedAt');
 console.log(r.status===200?'OK':'ОШИБКА '+r.status, k.roleName,'ур.',k.rank,'→ revoked=true');}
