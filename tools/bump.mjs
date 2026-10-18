// Запускать перед каждым коммитом-деплоем: node tools/bump.mjs
// Унифицирует все ?v=, повышает CACHE в sw.js и пишет version.json (по нему сайт сам обновляется у пользователей).
import fs from 'fs';const R=new URL('..',import.meta.url).pathname;const F=['index.html','admin.html','auth.js','app.js','panel.js','chat.js','notif.js','events.js','votes.js','rh.js','sfx.js'].filter(f=>fs.existsSync(R+f));
let max=0;for(const f of F)for(const m of fs.readFileSync(R+f,'utf8').matchAll(/\?v=(\d+)/g))max=Math.max(max,+m[1]);const v=max+1;
for(const f of F){const s=fs.readFileSync(R+f,'utf8');fs.writeFileSync(R+f,s.replace(/\?v=\d+/g,'?v='+v))}
const sw=fs.readFileSync(R+'sw.js','utf8');const c=+(sw.match(/vppka-v(\d+)/)||[0,0])[1]+1;fs.writeFileSync(R+'sw.js',sw.replace(/vppka-v\d+/,'vppka-v'+c));
// Публичный номер версии: V<major>.<minor>. Каждый bump: +0.1 (V2.0 → V2.1 …). Явно: --label V3.0
let old={};try{old=JSON.parse(fs.readFileSync(R+'version.json','utf8'))}catch{}const ai=process.argv.indexOf('--label');let label;
if(ai>0)label=process.argv[ai+1];else{const m=String(old.label||'').match(/^V(\d+)\.(\d+)$/);label=m?`V${m[1]}.${+m[2]+1}`:'V2.0'}
fs.writeFileSync(R+'version.json',JSON.stringify({v:String(v),label,cache:'vppka-v'+c,at:new Date().toISOString()})+'\n');console.log('v='+v,'label='+label,'cache=vppka-v'+c);
