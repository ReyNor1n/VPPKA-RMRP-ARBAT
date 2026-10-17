// node tools/list-keys.mjs — список ключей (без самих ключей: хранятся только хэши)
import {login,listKeys} from './lib.mjs';
const {token}=await login();for(const k of (await listKeys(token)).sort((a,b)=>b.rank-a.rank))console.log(`${k.revoked?'[АННУЛИРОВАН]':'[действует]  '} ${k.discordId}  «${k.roleName}» ур.${k.rank}  ${k.hash.slice(0,12)}…`);
