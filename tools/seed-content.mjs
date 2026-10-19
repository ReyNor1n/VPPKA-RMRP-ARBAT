// Запись текстов страниц в content/{site,home,about,program,charter,legal,contacts}.
// Руководство и новости не пишутся: места уже в Firestore members, новости — в news.
// По умолчанию только показывает план. Запись: node tools/seed-content.mjs --apply
// Учётка keymaster — не владелец. Правила пустят запись только владельцу из config/owners.
// Надёжнее кнопка «Записать текущий content.json в базу» в разделе #admin, когда владелец вошёл на сайт.
import fs from 'node:fs';
import {login, fs_, fields, args} from './lib.mjs';
const OWNER='t3t4KPD2bDasFw1gPLWAA0W8jCL2';
const SECTIONS=['site','home','about','program','charter','legal','contacts'];
const c=JSON.parse(fs.readFileSync(new URL('../content.json',import.meta.url),'utf8'));
const a=args();
console.log('Разделы к записи: '+SECTIONS.join(', '));
console.log('Не пишутся: leadership, news.');
for(const id of SECTIONS)console.log('  content/'+id+' — ключей: '+Object.keys(c[id]||{}).length);
console.log('Файл ключа keymaster — это не владелец (uid владельца '+OWNER+').');
console.log('Если --apply войдёт не владельцем, запись не начнётся.');
if(!a.apply){console.log('Пробный просмотр. Запись: node tools/seed-content.mjs --apply');process.exit(0)}
const ses=await login();
if(ses.uid!==OWNER){console.error('Вход не владельца (uid '+ses.uid+'). Запись не выполнена. Либо укажите VPPKA_KEYMASTER на учётку владельца, либо нажмите кнопку в #admin.');process.exit(1)}
for(const id of SECTIONS){if(!c[id])continue;const r=await fs_(ses.token,'PATCH','content/'+id,fields(c[id]));console.log(id,r.status,r.status===200?'ok':JSON.stringify(r.json).slice(0,200));if(r.status!==200)process.exit(1)}
console.log('Готово. Сайт читает эти документы раньше content.json.');
