// node tools/set-discord.mjs — записывает вебхук Discord из env VPPKA_DISCORD_WEBHOOK в config/discord (значение не выводится)
import {login,fs_,fields} from './lib.mjs';
const w=process.env.VPPKA_DISCORD_WEBHOOK;if(!w)throw new Error('нет VPPKA_DISCORD_WEBHOOK');
const {token}=await login();const r=await fs_(token,'PATCH','config/discord',fields({webhook:w}));console.log('config/discord:',r.status);
