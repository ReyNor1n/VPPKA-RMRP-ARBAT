// node tools/set-discord.mjs — записывает вебхуки Discord в config/discord (значения не выводятся)
//   VPPKA_DISCORD_WEBHOOK → webhook (созывы/объявления), VPPKA_APPS_WEBHOOK → appsWebhook (заявки)
//   --roles id1,id2,id3 → roleIds (роли для упоминания в заявках)
import {login,fs_,enc,args} from './lib.mjs';
const a=args(),f={};
if(process.env.VPPKA_DISCORD_WEBHOOK)f.webhook=enc(process.env.VPPKA_DISCORD_WEBHOOK);
if(process.env.VPPKA_APPS_WEBHOOK)f.appsWebhook=enc(process.env.VPPKA_APPS_WEBHOOK);
if(a.roles)f.roleIds={arrayValue:{values:String(a.roles).split(',').map(s=>s.trim()).filter(s=>/^\d{15,21}$/.test(s)).map(s=>({stringValue:s}))}};
if(!Object.keys(f).length)throw new Error('нечего записывать');
const {token}=await login();const mask=Object.keys(f).map(k=>'updateMask.fieldPaths='+k).join('&');
const r=await fs_(token,'PATCH','config/discord',{fields:f},'?'+mask);console.log('config/discord:',r.status,Object.keys(f).join(','));
