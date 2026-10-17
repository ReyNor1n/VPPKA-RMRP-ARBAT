// После git push: node tools/publish-version.mjs — ждёт, пока GitHub Pages отдаст новый version.json,
// затем пишет meta/site.version (admin SDK) → открытые вкладки обновляются за секунды.
import fs from 'fs';import {createRequire} from 'module';
const v=JSON.parse(fs.readFileSync(new URL('../version.json',import.meta.url),'utf8')).v;
for(let i=0;;i++){try{const j=await (await fetch('https://vppka-arbat-rmrp.ru/version.json?t='+Date.now(),{cache:'no-store'})).json();if(String(j.v)===String(v))break}catch(e){}if(i>=60){console.error('Pages не отдал version.json',v,'за 10 мин');process.exit(1)}await new Promise(r=>setTimeout(r,10000))}
const admin=createRequire('/workspace/vppka-admin/package.json')('firebase-admin');
admin.initializeApp({credential:admin.credential.cert(JSON.parse(fs.readFileSync('/workspace/.vppka-firebase-sa.json','utf8')))});
await admin.firestore().doc('meta/site').set({version:String(v),at:admin.firestore.FieldValue.serverTimestamp()});console.log('meta/site.version =',v);process.exit(0);
