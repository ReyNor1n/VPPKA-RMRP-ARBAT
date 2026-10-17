// Однократно: создаёт служебный аккаунт keymaster и сохраняет пароль ТОЛЬКО в /workspace/.vppka-keymaster (chmod 600).
// Затем владелец добавляет напечатанный uid в Firestore: config/owners → uids (array).
import fs from 'node:fs'; import crypto from 'node:crypto'; import {authCall,CRED} from './lib.mjs';
if(fs.existsSync(CRED)){const c=JSON.parse(fs.readFileSync(CRED,'utf8'));console.log('Уже существует. uid keymaster:',c.uid);process.exit(0);}
const email='keymaster.'+crypto.randomBytes(4).toString('hex')+'@vppka.local', password=crypto.randomBytes(24).toString('base64url');
const j=await authCall('signUp',{email,password,returnSecureToken:true});
fs.writeFileSync(CRED,JSON.stringify({email,password,uid:j.localId},null,1),{mode:0o600});
console.log('Создан keymaster. uid:',j.localId,'\nДобавьте этот uid в Firestore: коллекция config → документ owners → поле uids (array).');
