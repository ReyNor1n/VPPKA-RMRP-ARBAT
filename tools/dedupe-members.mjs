// План слияния дублей рядовых карточек (group «Члены партии», id p_*).
// Руководящие места (m1, m11, m18 и любые не-p_*) не скрываются, не сливаются и не удаляются,
// даже если у них тот же Discord или то же ФИО.
// По умолчанию только печатает план. Запись в базу: node tools/dedupe-members.mjs --apply
// Не запускать, пока владелец не просмотрит план. keymaster — не владелец, --apply с ним остановится.
import {login, fs_, docData, fields, args} from './lib.mjs';
const OWNER='t3t4KPD2bDasFw1gPLWAA0W8jCL2';
const PG='Члены партии';
const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const isParty=m=>String(m.id||'').startsWith('p_')&&m.group===PG;
function timeOf(m){const t=m.createdAt||m.updatedAt||'';const n=Date.parse(t);return Number.isFinite(n)?n:9e15}
function score(m){let s=0;if(/^\d{15,21}$/.test(String(m.discordId||'')))s+=1000;if(/^p_[A-Za-z0-9]{28}$/.test(m.id))s+=100;s+=Object.entries(m).filter(([k,v])=>k!=='id'&&v!=null&&v!=='').length;return s}
async function listMembers(){const out=[];let pt='';do{const r=await fs_(null,'GET','members',null,`?pageSize=300${pt?'&pageToken='+encodeURIComponent(pt):''}`);if(r.status!==200)throw new Error('Чтение members: '+r.status+' '+JSON.stringify(r.json).slice(0,300));for(const d of r.json.documents||[])out.push({id:d.name.split('/').pop(),...docData(d)});pt=r.json.nextPageToken||''}while(pt);return out}
class UF{constructor(){this.p=new Map()}find(x){if(!this.p.has(x))this.p.set(x,x);if(this.p.get(x)!==x)this.p.set(x,this.find(this.p.get(x)));return this.p.get(x)}union(a,b){const pa=this.find(a),pb=this.find(b);if(pa!==pb)this.p.set(pa,pb)}}
const members=await listMembers();
const party=members.filter(isParty);
const uf=new UF(),byN=new Map(),byD=new Map();
for(const m of party){uf.find(m.id);const n=norm(m.name);if(n){if(byN.has(n))uf.union(m.id,byN.get(n));else byN.set(n,m.id)}const d=String(m.discordId||'');if(/^\d{15,21}$/.test(d)){if(byD.has(d))uf.union(m.id,byD.get(d));else byD.set(d,m.id)}}
const groups=new Map();
for(const m of party){const k=uf.find(m.id);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(m)}
const plans=[];
for(const g of groups.values()){if(g.length<2)continue;const keep=g.slice().sort((a,b)=>score(b)-score(a)||timeOf(a)-timeOf(b))[0];const drop=g.filter(m=>m.id!==keep.id);const patch={};for(const dup of drop){for(const [k,v] of Object.entries(dup)){if(k==='id'||k==='updatedBy'||k==='updatedAt')continue;const cur=patch[k]!==undefined?patch[k]:keep[k];if((cur==null||cur==='')&&v!=null&&v!=='')patch[k]=v}}const same=members.filter(m=>!isParty(m)&&((keep.discordId&&m.discordId===keep.discordId)||(norm(m.name)&&norm(m.name)===norm(keep.name))));plans.push({keep,drop,patch,same})}
if(!plans.length)console.log('Дублей рядовых карточек не найдено. Руководящие места не проверялись как дубли.');
for(const p of plans){console.log('Оставить '+p.keep.id+' «'+p.keep.name+'» discord='+(p.keep.discordId||'—')+' роль='+(p.keep.role||''));
 for(const d of p.drop)console.log('  удалить '+d.id+' discord='+(d.discordId||'—')+' роль='+(d.role||'')+' создана '+(d.createdAt||d.updatedAt||'—'));
 if(Object.keys(p.patch).length)console.log('  дописать в оставшуюся пустые поля: '+Object.keys(p.patch).join(', '));
 if(p.same.length)console.log('  не трогаем руководящие места: '+p.same.map(m=>m.id+' '+m.role).join('; '));
 else console.log('  руководящих мест с этим Discord/ФИО нет.');}
const a=args();
if(!a.apply){console.log(plans.length?('План: групп '+plans.length+'. Запись не выполнялась. Для записи: node tools/dedupe-members.mjs --apply'):'Запись не нужна.');process.exit(0)}
if(!plans.length)process.exit(0);
const ses=await login();
if(ses.uid!==OWNER){console.error('Вход не владельца (uid '+ses.uid+'). Ничего не записано.');process.exit(1)}
for(const p of plans){if(Object.keys(p.patch).length){const q='?'+Object.keys(p.patch).map(k=>'updateMask.fieldPaths='+encodeURIComponent(k)).join('&');const r=await fs_(ses.token,'PATCH','members/'+p.keep.id,fields(p.patch),q);if(r.status!==200){console.error('Не обновлено '+p.keep.id,r.status);process.exit(1)}}
 const claim=String(p.keep.name||'').trim().replace(/\s+/g,' ');
 if(claim&&!/[\\/]/.test(claim)&&claim!=='.'&&claim!=='..'){const c=await fs_(ses.token,'PATCH','memClaim/'+encodeURIComponent(claim),fields({name:claim,memberId:p.keep.id,by:ses.uid}));if(c.status!==200)console.log('  memClaim не записан ('+c.status+'), карточку это не блокирует')}
 for(const d of p.drop){if(!isParty(d)){console.error('Отказ: '+d.id+' не рядовая карточка');process.exit(1)}const r=await fs_(ses.token,'DELETE','members/'+d.id);if(r.status!==200){console.error('Не удалено '+d.id,r.status);process.exit(1)}console.log('Удалено '+d.id)}}
console.log('Готово. Руководящие места не изменялись.');
